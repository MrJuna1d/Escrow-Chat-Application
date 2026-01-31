import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsertUser = mutation({
  args: {
    privyId: v.string(),
    name: v.optional(v.string()),
    profilePic: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privyId", (q) => q.eq("privyId", args.privyId))
      .first();

    const now = Date.now();

    if (user) {
      // update
      await ctx.db.patch(user._id, { ...args });
      return user._id;
    }

    // create
    return await ctx.db.insert("users", {
      ...args,
      createdAt: now,
    });
  },
});


export const listUsers = query({
  args: { excludePrivyId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("users").collect();
    return all.filter((u) => u.privyId !== args.excludePrivyId);
  },
});


export const getUserData = query({
  args: { privyId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privyId", (q) => q.eq("privyId", args.privyId))
      .first();
    return user;
  }
})

export const getUserById = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});