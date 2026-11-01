// Read-only preview links. The Preview button on Claude's card goes to
// app/improvements/[id]/preview, which calls `create` as the signed-in member and redirects
// to the preview deployment's /api/auth/preview-access (a Better Auth endpoint in
// convex/auth.ts). That endpoint calls `consume` and signs the visitor in as themselves,
// read-only: they see what they'd see on the live site, but can't change anything.
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { requireMember } from "./lib/viewer";

const TOKEN_TTL_MS = 10 * 60 * 1000;

export const create = mutation({
  // The token comes from the Next.js route (node crypto); mutations have no secure randomness.
  args: { id: v.id("improvements"), token: v.string() },
  handler: async (ctx, { id, token }) => {
    const { user } = await requireMember(ctx);
    const run = await ctx.db.get(id);
    if (!run?.previewUrl) throw new ConvexError("This change has no preview.");
    if (token.length < 32) throw new ConvexError("Bad token.");

    const now = Date.now();
    for (const old of await ctx.db
      .query("previewTokens")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .take(20))
      await ctx.db.delete(old._id);

    await ctx.db.insert("previewTokens", {
      token,
      userId: user._id,
      expiresAt: now + TOKEN_TTL_MS,
    });
    return `${run.previewUrl}/api/auth/preview-access?token=${encodeURIComponent(token)}`;
  },
});

// Single use: returns the Better Auth user id the link was made for, or null.
export const consume = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("previewTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!row) return null;
    await ctx.db.delete(row._id);
    return row.expiresAt > Date.now() ? row.userId : null;
  },
});
