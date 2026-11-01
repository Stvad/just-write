// Push notifications for chat. Browsers subscribe from /settings (lib/push.ts); each new
// message schedules pushAction.notify, which asks `recipients` who should hear about it.
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { unreadCount } from "./chat";
import { notificationTag } from "./lib/channels";
import { isPushEndpoint } from "./lib/pushEndpoint";
import { mentionIds, type RichNode } from "./lib/richtext";
import { canEnter, isAdminEmail, requireMember } from "./lib/viewer";
import { presence } from "./presence";

// The key browsers subscribe with, or null if push isn't set up on this deployment.
export const publicKey = query({
  args: {},
  handler: async () => process.env.VAPID_PUBLIC_KEY ?? null,
});

// Saves this browser's subscription for the viewer. /settings calls it again on every
// visit, so a browser that someone else signs in on moves to their account.
export const subscribe = mutation({
  args: { endpoint: v.string(), p256dh: v.string(), auth: v.string() },
  handler: async (ctx, args) => {
    const { member } = await requireMember(ctx);
    if (!isPushEndpoint(args.endpoint))
      throw new ConvexError("This browser’s push service isn’t supported.");
    const existing = await bySubscription(ctx, args.endpoint);
    if (existing)
      await ctx.db.patch(existing._id, { ...args, memberId: member._id });
    else
      await ctx.db.insert("pushSubscriptions", {
        ...args,
        memberId: member._id,
      });
    // Keep the newest few, so stale devices don't pile up (oldest first by index order).
    const mine = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .collect();
    for (const old of mine.slice(0, -MAX_DEVICES)) await ctx.db.delete(old._id);
  },
});

const MAX_DEVICES = 10;

export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const { member } = await requireMember(ctx);
    const existing = await bySubscription(ctx, endpoint);
    if (existing?.memberId === member._id) await ctx.db.delete(existing._id);
  },
});

export const setLevel = mutation({
  args: { notify: v.union(v.literal("mentions"), v.literal("all")) },
  handler: async (ctx, { notify }) => {
    const { member } = await requireMember(ctx);
    await ctx.db.patch(member._id, { notify });
  },
});

async function bySubscription(ctx: MutationCtx, endpoint: string) {
  return await ctx.db
    .query("pushSubscriptions")
    .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
    .unique();
}

// Who should be notified about a new message, and what the notification says.
// Mentioned members and everyone in the thread are; members who chose "all" also hear
// about every new top-level post. Nobody hears about their own messages, or about a
// channel they have open right now.
export const recipients = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const m = await ctx.db.get(messageId);
    const channel = m && (await ctx.db.get(m.channelId));
    const author = m && (await ctx.db.get(m.authorId));
    if (!m || !channel || !author) return null;

    const direct = new Set<string>(mentionIds(JSON.parse(m.body) as RichNode));
    if (m.parentId) {
      const parent = await ctx.db.get(m.parentId);
      if (parent) direct.add(parent.authorId);
      const replies = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", m.parentId))
        .collect();
      for (const r of replies) direct.add(r.authorId);
    }
    const watching = new Set(
      (await presence.listRoom(ctx, `channel:${channel.slug}`, true)).map(
        (p) => p.userId,
      ),
    );

    const byMember = new Map<Id<"members">, Doc<"pushSubscriptions">[]>();
    for (const s of await ctx.db.query("pushSubscriptions").collect())
      byMember.set(s.memberId, [...(byMember.get(s.memberId) ?? []), s]);

    const recipients = [];
    for (const [memberId, subs] of byMember) {
      if (memberId === m.authorId || watching.has(memberId)) continue;
      const member = await ctx.db.get(memberId);
      if (!member || !canEnter(member, isAdminEmail(member.email))) continue;
      const wants =
        direct.has(memberId) || (member.notify === "all" && !m.parentId);
      if (!wants) continue;
      recipients.push({
        subscriptions: subs.map(({ _id, endpoint, p256dh, auth }) => ({
          _id,
          endpoint,
          p256dh,
          auth,
        })),
        badge: await unreadCount(ctx, memberId),
      });
    }

    // Essay and "joined" posts read as a sentence after the author's name.
    const body = m.essayId || m.kind ? `${author.name} ${m.text}` : m.text;
    return {
      notification: {
        title: `${author.name} ${m.parentId ? "replied in" : "in"} #${channel.name}`,
        body: body.length > 300 ? `${body.slice(0, 299)}…` : body,
        url: `/chat/${channel.slug}${m.parentId ? `?thread=${m.parentId}` : ""}`,
        tag: notificationTag(channel.slug),
      },
      recipients,
    };
  },
});

// Drops subscriptions the push service says are gone.
export const forget = internalMutation({
  args: { ids: v.array(v.id("pushSubscriptions")) },
  handler: async (ctx, { ids }) => {
    for (const id of ids) if (await ctx.db.get(id)) await ctx.db.delete(id);
  },
});
