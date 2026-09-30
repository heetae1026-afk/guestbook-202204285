"use client";

import { useActionState, useState } from "react";
import { deleteEntry, updateEntry, type ActionState } from "@/app/actions";

export type EntryView = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  createdAtFull: string;
  updatedAtFull: string | null;
};

type Mode = "view" | "edit" | "delete";

const initialState: ActionState = { status: "idle" };

const inputClass =
  "rounded border border-zinc-300 px-2 py-1.5 text-base dark:border-zinc-700 dark:bg-zinc-900";
const buttonClass = "rounded px-3 py-1 text-sm disabled:opacity-50";

export function EntryItem({ entry }: { entry: EntryView }) {
  const [mode, setMode] = useState<Mode>("view");

  return (
    <li className="flex flex-col gap-2 border-b border-zinc-200 py-4 dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{entry.name}</span>
        <span className="text-xs text-zinc-500">
          <time dateTime={entry.createdAtFull} title={`${entry.createdAtFull} KST`}>
            {entry.createdAt}
          </time>
          {entry.updatedAtFull && (
            <span title={`수정: ${entry.updatedAtFull} KST`}> (수정됨)</span>
          )}
        </span>
      </div>

      {mode === "edit" ? (
        <EditForm entry={entry} onClose={() => setMode("view")} />
      ) : (
        <p className="whitespace-pre-wrap break-words">{entry.message}</p>
      )}

      {mode === "delete" && <DeleteForm id={entry.id} onClose={() => setMode("view")} />}

      {mode === "view" && (
        <div className="flex gap-1 self-end">
          <button type="button" onClick={() => setMode("edit")} className={`${buttonClass} text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800`}>
            수정
          </button>
          <button type="button" onClick={() => setMode("delete")} className={`${buttonClass} text-red-600 hover:bg-red-50 dark:hover:bg-red-950`}>
            삭제
          </button>
        </div>
      )}
    </li>
  );
}

// Each panel mounts fresh when opened, so a previous error never lingers.
function EditForm({ entry, onClose }: { entry: EntryView; onClose: () => void }) {
  // Close the panel from inside the action (not an effect) once the server accepts it.
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await updateEntry(prev, formData);
    if (result.status === "success") onClose();
    return result;
  }, initialState);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={entry.id} />
      <textarea
        name="message"
        required
        maxLength={500}
        rows={3}
        defaultValue={state.fields?.message ?? entry.message}
        aria-label="메시지"
        className={inputClass}
      />
      <PasswordRow
        error={state.status === "error" ? state.error : undefined}
        pending={pending}
        submitLabel="수정 저장"
        onCancel={onClose}
      />
    </form>
  );
}

function DeleteForm({ id, onClose }: { id: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(deleteEntry, initialState);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <PasswordRow
        error={state.status === "error" ? state.error : undefined}
        pending={pending}
        submitLabel="삭제 확인"
        danger
        onCancel={onClose}
      />
    </form>
  );
}

function PasswordRow({
  error,
  pending,
  submitLabel,
  danger = false,
  onCancel,
}: {
  error?: string;
  pending: boolean;
  submitLabel: string;
  danger?: boolean;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="password"
          type="password"
          required
          placeholder="글 비밀번호"
          aria-label="글 비밀번호"
          autoComplete="off"
          autoFocus
          className={`${inputClass} flex-1`}
        />
        <button
          disabled={pending}
          className={`${buttonClass} text-white ${danger ? "bg-red-600" : "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"}`}
        >
          {pending ? "확인 중…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={`${buttonClass} text-zinc-600 dark:text-zinc-400`}>
          취소
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
