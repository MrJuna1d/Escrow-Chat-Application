// convex/messages.ts
import { mutation, query} from "./_generated/server";
import { v } from "convex/values";

// Send a message in a match
export const sendMessage = mutation({
  args: {
    matchId: v.string(),
    senderId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { matchId, senderId, content }) => {
    return await ctx.db.insert("messages", {
      matchId,
      senderId,
      content,
      createdAt: Date.now(),
      read: false,
    });
  },
});

// Fetch messages for a match
export const getMessages = query({
  args: { matchId: v.string() },
  handler: async (ctx, { matchId }) => {
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("matchId"), matchId))
      .collect();
  },
});
