import fs from "node:fs/promises";
import path from "node:path";
import type { CartItem, Order, UserProfile } from "@/domain/types";

interface DatabaseSchema {
  carts: Record<string, CartItem[]>;
  orders: Order[];
  users: Record<string, UserProfile>;
}

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

const DEFAULT_DB: DatabaseSchema = {
  carts: {},
  orders: [],
  users: {
    [INITIAL_DEMO_USER.id]: INITIAL_DEMO_USER,
  },
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

/**
 * In-memory fallback used automatically on read-only serverless filesystems (e.g. Vercel),
 * while persisting to `data/store.json` seamlessly during local development and Docker runs.
 */
let memoryStore: DatabaseSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function cloneDefault(): DatabaseSchema {
  return structuredClone(DEFAULT_DB);
}

async function readStore(): Promise<DatabaseSchema> {
  if (memoryStore) {
    return memoryStore;
  }

  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    memoryStore = {
      carts: parsed.carts ?? {},
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      users: {
        ...cloneDefault().users,
        ...(parsed.users ?? {}),
      },
    };
    return memoryStore;
  } catch {
    memoryStore = cloneDefault();
    return memoryStore;
  }
}

async function persistStore(next: DatabaseSchema): Promise<void> {
  memoryStore = next;
  writeQueue = writeQueue
    .then(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(DB_FILE, JSON.stringify(next, null, 2), "utf8");
      } catch {
        // Gracefully stay in-memory on read-only serverless runtimes
      }
    })
    .catch(() => {
      // Keep queue alive even if a write fails
    });
  await writeQueue;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  const db = await readStore();
  return db.users[userId] ?? null;
}

export async function authenticateDemoUser(
  email: string,
  password: string
): Promise<UserProfile | null> {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
    const db = await readStore();
    return db.users[INITIAL_DEMO_USER.id] ?? INITIAL_DEMO_USER;
  }
  return null;
}

export async function updateUserProfile(
  userId: string,
  patch: Pick<UserProfile, "name" | "phone" | "address">
): Promise<UserProfile | null> {
  const db = await readStore();
  const existing = db.users[userId];
  if (!existing) return null;

  const updated: UserProfile = {
    ...existing,
    name: patch.name,
    phone: patch.phone,
    address: patch.address,
  };
  db.users[userId] = updated;
  await persistStore(db);
  return updated;
}

export async function getCart(cartKey: string): Promise<CartItem[]> {
  const db = await readStore();
  return db.carts[cartKey] ?? [];
}

export async function saveCart(cartKey: string, items: CartItem[]): Promise<CartItem[]> {
  const db = await readStore();
  db.carts[cartKey] = items;
  await persistStore(db);
  return items;
}

export async function listOrdersByUser(userId: string): Promise<Order[]> {
  const db = await readStore();
  return db.orders
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveOrder(order: Order): Promise<Order> {
  const db = await readStore();
  db.orders.unshift(order);
  await persistStore(db);
  return order;
}

export async function resetDemoData(cartKey: string): Promise<void> {
  const db = await readStore();
  db.carts[cartKey] = [];
  db.orders = db.orders.filter((order) => order.userId !== INITIAL_DEMO_USER.id);
  db.users[INITIAL_DEMO_USER.id] = structuredClone(INITIAL_DEMO_USER);
  await persistStore(db);
}
