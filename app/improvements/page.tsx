import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { api } from "@/convex/_generated/api";
import { ImprovementList } from "./list";

export const metadata: Metadata = {
  title: "Improvements · Just Write",
  description: "Changes to this site that members asked @Claude for in chat.",
};

async function getList() {
  "use cache";
  cacheLife("minutes");
  try {
    return await fetchQuery(api.improvements.list, {});
  } catch (err) {
    console.error("improvements list failed", err);
    return [];
  }
}

export default async function ImprovementsPage() {
  return <ImprovementList initial={await getList()} />;
}
