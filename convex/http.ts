import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { buildIcs } from "./lib/ics";

const http = httpRouter();
authComponent.registerRoutes(http, createAuth);

// A member's personal iCal feed: /calendar.ics?token=… (see events.makeFeed).
http.route({
  path: "/calendar.ics",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const token = new URL(req.url).searchParams.get("token") ?? "";
    const events = await ctx.runQuery(internal.events.feed, { token });
    if (!events) return new Response("Not found", { status: 404 });
    return new Response(buildIcs(events), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }),
});

export default http;
