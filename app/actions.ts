"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export type ActionState = {
  status: "idle" | "success" | "error";
  error?: string;
  // Echoed back on error so the form keeps what the user typed.
  fields?: { name?: string; message?: string };
};

const LIMITS = {
  name: { min: 1, max: 20, object: "이름을", topic: "이름은" },
  message: { min: 1, max: 500, object: "메시지를", topic: "메시지는" },
  password: { min: 4, max: 64 },
};

// Count characters (code points), not UTF-16 units, to match Postgres varchar length.
const length = (s: string) => [...s].length;

function field(formData: FormData, key: string, trim = true): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return trim ? value.trim() : value;
}

function checkLength(value: string, limit: (typeof LIMITS)["name" | "message"]) {
  const n = length(value);
  if (n < limit.min) return `${limit.object} 입력해 주세요.`;
  if (n > limit.max) return `${limit.topic} ${limit.max}자 이하로 입력해 주세요.`;
  return null;
}

function checkPassword(password: string) {
  const n = length(password);
  if (n < LIMITS.password.min || n > LIMITS.password.max) {
    return `글 비밀번호는 ${LIMITS.password.min}–${LIMITS.password.max}자로 입력해 주세요.`;
  }
  return null;
}

const NOT_FOUND = "이미 삭제되었거나 없는 글입니다.";

// Up to 18 digits always fits in bigint, so a forged id can never make Postgres throw.
const isEntryId = (id: string) => /^\d{1,18}$/.test(id);

async function findPasswordHash(id: string): Promise<string | null> {
  if (!isEntryId(id)) return null;
  const rows = await db()`SELECT password_hash FROM entries WHERE id = ${id}`;
  return rows[0]?.password_hash ?? null;
}

export async function createEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = field(formData, "name");
  const message = field(formData, "message");
  const password = field(formData, "password", false);
  const fields = { name, message };

  const error =
    checkLength(name, LIMITS.name) ??
    checkLength(message, LIMITS.message) ??
    checkPassword(password);
  if (error) return { status: "error", error, fields };

  const passwordHash = await hashPassword(password);
  await db()`
    INSERT INTO entries (name, message, password_hash)
    VALUES (${name}, ${message}, ${passwordHash})
  `;

  revalidatePath("/");
  return { status: "success" };
}

export async function updateEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const message = field(formData, "message");
  const password = field(formData, "password", false);
  const fields = { message };

  const error = checkLength(message, LIMITS.message);
  if (error) return { status: "error", error, fields };

  const stored = await findPasswordHash(id);
  if (!stored) return { status: "error", error: NOT_FOUND, fields };
  if (!(await verifyPassword(password, stored))) {
    return { status: "error", error: "글 비밀번호가 일치하지 않습니다. 수정되지 않았습니다.", fields };
  }

  // The entry may have been deleted since the password check; report that instead of a false success.
  const updated = await db()`
    UPDATE entries SET message = ${message}, updated_at = now() WHERE id = ${id} RETURNING id
  `;
  if (updated.length === 0) return { status: "error", error: NOT_FOUND, fields };

  revalidatePath("/");
  return { status: "success" };
}

export async function deleteEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const password = field(formData, "password", false);

  const stored = await findPasswordHash(id);
  if (!stored) return { status: "error", error: NOT_FOUND };
  if (!(await verifyPassword(password, stored))) {
    return { status: "error", error: "글 비밀번호가 일치하지 않습니다. 삭제되지 않았습니다." };
  }

  const deleted = await db()`DELETE FROM entries WHERE id = ${id} RETURNING id`;
  if (deleted.length === 0) return { status: "error", error: NOT_FOUND };

  revalidatePath("/");
  return { status: "success" };
}
