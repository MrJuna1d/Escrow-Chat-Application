// convex/match.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const swipe = mutation({
  args: {
    swiperId: v.string(),
    targetId: v.string(),
    direction: v.string(),
  },
  handler: async (ctx, args) => {
    const { swiperId, targetId, direction } = args;

    // 1 — store this swipe
    await ctx.db.insert("swipes", {
      swiperId,
      targetId,
      direction,
      createdAt: Date.now(),
    });

    // Only right swipes matter for matching
    if (direction !== "right") return { matched: false };

    // 2 — check if the target also swiped right on this user
    const reverseSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_target", (q) =>
        q.eq("swiperId", targetId).eq("targetId", swiperId)
      )
      .first();

    if (!reverseSwipe || reverseSwipe.direction !== "right") {
      return { matched: false };
    }

    // 3 — Check if match already exists
    const existingMatch = await ctx.db
        .query("matches")
        .filter((q) =>
          q.or(
            q.and(
              q.eq(q.field("userA"), swiperId),
              q.eq(q.field("userB"), targetId),
            ),
            q.and(
              q.eq(q.field("userA"), targetId),
              q.eq(q.field("userB"), swiperId),
            ),
          ),
        )
        .first();

    if (existingMatch) return { matched: true };

    // 4 — create the match
    await ctx.db.insert("matches", {
      userA: swiperId,
      userB: targetId,
      createdAt: Date.now(),
    });

    return { matched: true };
  },
});


