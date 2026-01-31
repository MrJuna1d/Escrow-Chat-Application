import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    privyId: v.string(),         // Privy user ID
    name: v.optional(v.string()),
    profilePic: v.optional(v.string()),
    description: v.optional(v.string()),
    walletAddress: v.optional(v.string()), // Ethereum wallet address
    createdAt: v.number(),
  }).index("by_privyId", ["privyId"]),
  
  // New table for swipes
  
  swipes: defineTable({
    swiperId: v.string(),  // user who swiped
    targetId: v.string(),  // user being swiped
    direction: v.string(), // "right" or "left"
    createdAt: v.number()
  }).index("by_swiper_target", ["swiperId", "targetId"]),
  
  // New table for matches
  
  matches: defineTable({
    userA: v.id("users"),
    userB: v.id("users"),
    createdAt: v.number()
  }),

  // New table for messages
  
  messages: defineTable({
    matchId: v.string(),
    senderId: v.string(),
    content: v.string(),
    createdAt: v.number(),
    read: v.boolean(),
  })
});
