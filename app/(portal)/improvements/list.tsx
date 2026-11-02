"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { Avatar } from "@/components/portal/avatar";
import { ImprovementCard } from "@/components/portal/improvement";
import { timeAgo, useNow } from "@/components/portal/util";
import { api } from "@/convex/_generated/api";

type Row = (typeof api.improvements.list._returnType)[number];

const STATUS: Record<Row["status"], string> = {
  queued: "Starting",
  running: "Working",
  answered: "Answered",
  pr: "Waiting for review",
  merged: "Merged",
  closed: "Closed",
  failed: "Failed",
  superseded: "Updated later",
};

// Server-rendered first, then live.
export function ImprovementList({ initial }: { initial: Row[] }) {
  const rows = useQuery(api.improvements.list) ?? initial;
  const viewer = useQuery(api.members.viewer);
  const now = useNow();
  const signedInMember = !!viewer?.canEnter;
  const merged = rows.filter((r) => r.status === "merged").length;

  return (
    <main className="mx-auto flex max-w-[52rem] flex-col gap-[clamp(24px,4vh,40px)] px-[clamp(20px,4vw,56px)] py-[clamp(24px,5vh,56px)]">
      <header className="flex flex-col gap-2">
        <p className="text-[13px] tracking-[0.14em] text-brass-text uppercase">
          {rows.length} requests · {merged} merged
        </p>
        <p className="max-w-[36rem] text-[17px] text-pretty text-ink-muted">
          Members can mention @Claude in chat to ask for a change to this site.
          Claude writes the code, and small changes go live after review.
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="text-[17px] text-ink-muted">Nothing yet.</p>
      ) : (
        <ol className="flex flex-col">
          {rows.map((r) => (
            <li
              key={r._id}
              className="flex flex-col gap-3 border-t border-ink/12 py-5"
            >
              <div className="flex items-center gap-3">
                <Avatar member={r.requester} size={32} />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[15px]">
                    <span className="font-[700]">
                      {r.requester?.name ?? "Someone"}
                    </span>{" "}
                    <span className="text-ink-muted">
                      asked{now ? ` ${timeAgo(r.createdAt, now)}` : ""} ·
                      #{r.number} · {STATUS[r.status]}
                    </span>
                  </span>
                </div>
                {signedInMember && (
                  <Link
                    href={r.threadHref}
                    className="ml-auto shrink-0 text-[14px]"
                  >
                    Thread
                  </Link>
                )}
              </div>
              <blockquote className="border-l-3 border-wash pl-3 text-[16px] text-ink-muted">
                {r.request.length > 400
                  ? `${r.request.slice(0, 400)}…`
                  : r.request}
              </blockquote>
              <ImprovementCard card={r} isAdmin={!!viewer?.isAdmin} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
