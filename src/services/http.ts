export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | ({ error?: string } & Record<string, unknown>)
    | null;

  if (!response.ok) {
    throw new ApiError(
      data?.error ?? `Request failed with status ${response.status}`,
      response.status
    );
  }

  return data as T;
}
