import fs from "node:fs/promises";
import path from "node:path";
import type { CartItem, Order, UserProfile } from "@/domain/types";

export const DEMO_USER_EMAIL = "demo@veloce.store";
export const DEMO_USER_PASSWORD = "veloce123";

const INITIAL_DEMO_USER: UserProfile = {
  id: "usr_demo_01",
  name: "Alex Morgan",
  email: DEMO_USER_EMAIL,
  phone: "+1 (415) 890-4421",
  address: {
    street: "742 Evergreen Terrace, Suite 4B",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    country: "United States",
  },
};

interface LocalDatabaseSchema {
  carts: Record<string, CartItem[]>;
  orders: Order[];
  users: Record<string, UserProfile>;
}

interface StoreDriver {
  getUser(userId: string): Promise<UserProfile | null>;
  saveUser(user: UserProfile): Promise<void>;
  getCart(cartKey: string): Promise<CartItem[]>;
  saveCart(cartKey: string, items: CartItem[]): Promise<void>;
  listOrders(userId: string): Promise<Order[]>;
  appendOrder(order: Order): Promise<void>;
  resetUserData(userId: string, cartKey: string): Promise<void>;
}

/**
 * Upstash Redis / Vercel KV REST driver.
 * Stores each entity under its own key so concurrent requests on serverless instances
 * do not overwrite each other's state.
 */
class UpstashRestDriver implements StoreDriver {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  private async command<T>(args: Array<string | number>): Promise<T | null> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Redis REST request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { result?: T | null; error?: string };
    if (payload.error) {
      throw new Error(`Redis REST error: ${payload.error}`);
    }

    return payload.result ?? null;
  }

  private async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.command<string>(["GET", key]);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async setJson(key: string, value: unknown): Promise<void> {
    await this.command(["SET", key, JSON.stringify(value)]);
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    const stored = await this.getJson<UserProfile>(`veloce:user:${userId}`);
    if (stored) return stored;
    if (userId === INITIAL_DEMO_USER.id) {
      return structuredClone(INITIAL_DEMO_USER);
    }
    return null;
  }

  async saveUser(user: UserProfile): Promise<void> {
    await this.setJson(`veloce:user:${user.id}`, user);
  }

  async getCart(cartKey: string): Promise<CartItem[]> {
    const items = await this.getJson<CartItem[]>(`veloce:cart:${cartKey}`);
    return Array.isArray(items) ? items : [];
  }

  async saveCart(cartKey: string, items: CartItem[]): Promise<void> {
    await this.setJson(`veloce:cart:${cartKey}`, items);
  }

  async listOrders(userId: string): Promise<Order[]> {
    // Orders are pushed to the head of a Redis list (LPUSH) so LRANGE returns newest-first
    const rawList = await this.command<string[]>(["LRANGE", `veloce:orders:${userId}`, 0, 99]);
    if (!Array.isArray(rawList)) return [];

    const orders: Order[] = [];
    for (const entry of rawList) {
      try {
        orders.push(JSON.parse(entry) as Order);
      } catch {
        // Skip malformed entries
      }
    }
    return orders;
  }

  async appendOrder(order: Order): Promise<void> {
    // Atomic list prepend avoids read-modify-write races between concurrent orders
    await this.command(["LPUSH", `veloce:orders:${order.userId}`, JSON.stringify(order)]);
  }

  async resetUserData(userId: string, cartKey: string): Promise<void> {
    await Promise.all([
      this.command(["DEL", `veloce:cart:${cartKey}`]),
      this.command(["DEL", `veloce:orders:${userId}`]),
      userId === INITIAL_DEMO_USER.id
        ? this.setJson(`veloce:user:${userId}`, INITIAL_DEMO_USER)
        : Promise.resolve(),
    ]);
  }
}

/**
 * Local JSON file driver for development and tests.
 * Uses an async mutex around read-modify-write transactions to prevent concurrent
 * in-process requests from clobbering each other.
 */
class LocalFileDriver implements StoreDriver {
  private readonly dataDir = path.join(process.cwd(), "data");
  private readonly dbFile = path.join(this.dataDir, "store.json");
  private memoryCache: LocalDatabaseSchema | null = null;
  private lock: Promise<void> = Promise.resolve();

  private createDefaultDb(): LocalDatabaseSchema {
    return {
      carts: {},
      orders: [],
      users: {
        [INITIAL_DEMO_USER.id]: structuredClone(INITIAL_DEMO_USER),
      },
    };
  }

  private async loadDb(): Promise<LocalDatabaseSchema> {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    try {
      const raw = await fs.readFile(this.dbFile, "utf8");
      const parsed = JSON.parse(raw) as Partial<LocalDatabaseSchema>;
      this.memoryCache = {
        carts: parsed.carts ?? {},
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        users: {
          ...this.createDefaultDb().users,
          ...(parsed.users ?? {}),
        },
      };
      return this.memoryCache;
    } catch {
      this.memoryCache = this.createDefaultDb();
      return this.memoryCache;
    }
  }

  private async withTransaction<T>(fn: (db: LocalDatabaseSchema) => T): Promise<T> {
    let release!: () => void;
    const prev = this.lock;
    this.lock = new Promise<void>((resolve) => {
      release = resolve;
    });

    await prev;
    try {
      const db = await this.loadDb();
      const result = fn(db);
      this.memoryCache = db;
      try {
        await fs.mkdir(this.dataDir, { recursive: true });
        await fs.writeFile(this.dbFile, JSON.stringify(db, null, 2), "utf8");
      } catch {
        // Read-only filesystem fallback when Upstash env vars are not configured
      }
      return result;
    } finally {
      release();
    }
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    const db = await this.loadDb();
    return db.users[userId] ? structuredClone(db.users[userId]) : null;
  }

  async saveUser(user: UserProfile): Promise<void> {
    await this.withTransaction((db) => {
      db.users[user.id] = structuredClone(user);
    });
  }

  async getCart(cartKey: string): Promise<CartItem[]> {
    const db = await this.loadDb();
    return structuredClone(db.carts[cartKey] ?? []);
  }

  async saveCart(cartKey: string, items: CartItem[]): Promise<void> {
    await this.withTransaction((db) => {
      db.carts[cartKey] = structuredClone(items);
    });
  }

  async listOrders(userId: string): Promise<Order[]> {
    const db = await this.loadDb();
    return db.orders
      .filter((order) => order.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async appendOrder(order: Order): Promise<void> {
    await this.withTransaction((db) => {
      db.orders.unshift(structuredClone(order));
    });
  }

  async resetUserData(userId: string, cartKey: string): Promise<void> {
    await this.withTransaction((db) => {
      db.carts[cartKey] = [];
      db.orders = db.orders.filter((order) => order.userId !== userId);
      if (userId === INITIAL_DEMO_USER.id) {
        db.users[userId] = structuredClone(INITIAL_DEMO_USER);
      }
    });
  }
}

let cachedDriver: StoreDriver | null = null;

function getDriver(): StoreDriver {
  if (cachedDriver) return cachedDriver;

  const restUrl =
    process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
  const restToken =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();

  if (restUrl && restToken) {
    cachedDriver = new UpstashRestDriver(restUrl, restToken);
    return cachedDriver;
  }

  cachedDriver = new LocalFileDriver();
  return cachedDriver;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  return getDriver().getUser(userId);
}

export async function authenticateDemoUser(
  email: string,
  password: string
): Promise<UserProfile | null> {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
    return (await getDriver().getUser(INITIAL_DEMO_USER.id)) ?? structuredClone(INITIAL_DEMO_USER);
  }
  return null;
}

export async function updateUserProfile(
  userId: string,
  patch: Pick<UserProfile, "name" | "phone" | "address">
): Promise<UserProfile | null> {
  const existing = await getDriver().getUser(userId);
  if (!existing) return null;

  const updated: UserProfile = {
    ...existing,
    name: patch.name,
    phone: patch.phone,
    address: patch.address,
  };
  await getDriver().saveUser(updated);
  return updated;
}

export async function getCart(cartKey: string): Promise<CartItem[]> {
  return getDriver().getCart(cartKey);
}

export async function saveCart(cartKey: string, items: CartItem[]): Promise<CartItem[]> {
  await getDriver().saveCart(cartKey, items);
  return items;
}

export async function listOrdersByUser(userId: string): Promise<Order[]> {
  return getDriver().listOrders(userId);
}

export async function saveOrder(order: Order): Promise<Order> {
  await getDriver().appendOrder(order);
  return order;
}

export async function resetUserDemoData(userId: string, cartKey: string): Promise<void> {
  await getDriver().resetUserData(userId, cartKey);
}
