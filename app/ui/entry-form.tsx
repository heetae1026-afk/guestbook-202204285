"use client";

import { useActionState } from "react";
import { createEntry, type ActionState } from "@/app/actions";

const initialState: ActionState = { status: "idle" };

export function EntryForm() {
  const [state, formAction, pending] = useActionState(createEntry, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          이름
          <input
            name="name"
            required
            maxLength={20}
            defaultValue={state.fields?.name}
            className="rounded border border-zinc-300 px-2 py-1.5 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          글 비밀번호
          <input
            name="password"
            type="password"
            required
            minLength={4}
            maxLength={64}
            autoComplete="new-password"
            className="rounded border border-zinc-300 px-2 py-1.5 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        메시지
        <textarea
          name="message"
          required
          maxLength={500}
          rows={3}
          defaultValue={state.fields?.message}
          className="rounded border border-zinc-300 px-2 py-1.5 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <p className="text-xs text-zinc-500">
        비밀번호를 잊으면 수정·삭제할 수 없습니다. 쉬운 비밀번호는 피하세요.
      </p>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="self-end rounded bg-zinc-900 px-4 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "남기는 중…" : "남기기"}
      </button>
    </form>
  );
}
