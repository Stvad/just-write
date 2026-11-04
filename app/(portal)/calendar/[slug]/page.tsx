import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { fmtWhen } from "@/convex/lib/time";
import { getEvents } from "../data";

export async function generateMetadata({
  params,
}: PageProps<"/calendar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = (await getEvents()).find((x) => x.slug === slug || x._id === slug);
  if (!e) return { title: "Calendar · Just Write" };
  return {
    title: `${e.title} · Just Write`,
    description: fmtWhen(e.start, e.end),
    alternates: { canonical: `/calendar/${e.slug}` },
  };
}

// The calendar (in layout.tsx) opens the session from the URL; this route only sets metadata.
// The marker tells Next the metadata depends on the URL, so it's rendered per request.
export default function EventPage() {
  return (
    <Suspense fallback={null}>
      <Dynamic />
    </Suspense>
  );
}

async function Dynamic() {
  await connection();
  return null;
}
