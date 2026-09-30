import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | undefined;

// Created on first use rather than at import, so `next build` works without DATABASE_URL.
export function db(): NeonQueryFunction<false, false> {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

export type Entry = {
  id: string;
  name: string;
  message: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export async function listEntries(): Promise<Entry[]> {
  const rows = await db()`
    SELECT id::text, name, message, created_at, updated_at
    FROM entries
    ORDER BY created_at DESC, id DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    message: r.message,
    createdAt: new Date(r.created_at),
    updatedAt: r.updated_at ? new Date(r.updated_at) : null,
  }));
}
