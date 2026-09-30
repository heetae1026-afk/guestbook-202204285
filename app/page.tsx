import { Suspense } from "react";
import { connection } from "next/server";
import { listEntries } from "@/lib/db";
import { EntryForm } from "@/app/ui/entry-form";
import { EntryItem, type EntryView } from "@/app/ui/entry-item";

// "sv-SE" formats as "YYYY-MM-DD HH:mm"; the time zone is pinned so server and viewer agree.
const short = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  dateStyle: "short",
  timeStyle: "short",
});
const full = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  dateStyle: "short",
  timeStyle: "medium",
});

async function EntryList() {
  await connection();
  const entries = await listEntries();

  if (entries.length === 0) {
    return <p className="py-8 text-center text-zinc-500">아직 방명록 글이 없습니다. 첫 글을 남겨 주세요.</p>;
  }

  const views: EntryView[] = entries.map((e) => ({
    id: e.id,
    name: e.name,
    message: e.message,
    createdAt: short.format(e.createdAt),
    createdAtFull: full.format(e.createdAt),
    updatedAtFull: e.updatedAt ? full.format(e.updatedAt) : null,
  }));

  return (
    <ul>
      {views.map((entry) => (
        <EntryItem key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">방명록</h1>
      <EntryForm />
      <Suspense fallback={<p className="py-8 text-center text-zinc-500">불러오는 중…</p>}>
        <EntryList />
      </Suspense>
    </main>
  );
}
