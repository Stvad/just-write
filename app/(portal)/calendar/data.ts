import { fetchQuery } from "convex/nextjs";
import { cacheLife } from "next/cache";
import { api } from "@/convex/_generated/api";

// Fetched signed out, so it never includes addresses; members get them once the live query loads.
export async function getEvents() {
  "use cache";
  cacheLife("minutes");
  try {
    return await fetchQuery(api.events.list, {});
  } catch (err) {
    console.error("calendar list failed", err);
    return [];
  }
}
