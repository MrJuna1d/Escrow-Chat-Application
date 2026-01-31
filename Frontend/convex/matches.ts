import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";


export const getMatches = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;

    const matches = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(q.eq(q.field("userA"), userId), q.eq(q.field("userB"), userId))
      )
      .collect();

    return matches;
  },
});


export const getMyMatches = query({
  args: {},
  handler: async (ctx) => {
    // 1. Get the authenticated user's Privy ID
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated call to query");
    }

    const privyId = identity.id;

    // 2. Find matches where this user is either userA or userB
    const matches = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.eq(q.field("userA"), privyId),
          q.eq(q.field("userB"), privyId),
        ),
      )
      .collect();

    // 3. Get the other user's ID in each match
    const otherUserIds = matches.map((match) =>
      match.userA === privyId ? match.userB : match.userA
    );
    console.log("$$$$$$ \nOther user IDs from matches:", otherUserIds);

    return otherUserIds;
  },
});

// convex/matches.ts
export const getMatchesWithPartners = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.eq(q.field("userA"), args.userId),
          q.eq(q.field("userB"), args.userId),
        ),
      )
      .collect();

    const partnerIds = matches.map((m) =>
      m.userA === args.userId ? m.userB : m.userA
    );

    const partners = await Promise.all(
      partnerIds.map((id) => ctx.db.get(id)),
    );

    return matches.map((m, i) => ({
      match: m,
      partner: partners[i], // null if deleted
    }));
  },
});


export const getPartnersForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.eq(q.field("userA"), args.userId),
          q.eq(q.field("userB"), args.userId),
        ),
      )
      .collect();

    const partnerIds = matches.map((m) =>
      m.userA === args.userId ? m.userB : m.userA,
    );

    const partners = await Promise.all(
      partnerIds.map((id) => ctx.db.get(id)),
    );

    // remove nulls in case some user was deleted
    return partners.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});


// Create a direct match between two users (for search functionality)
export const createDirectMatch = mutation({
  args: { 
    userAId: v.id("users"),
    userBId: v.id("users")
  },
  handler: async (ctx, args) => {
    const { userAId, userBId } = args;

    // Check if match already exists
    const existingMatch = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("userA"), userAId),
            q.eq(q.field("userB"), userBId),
          ),
          q.and(
            q.eq(q.field("userA"), userBId),
            q.eq(q.field("userB"), userAId),
          ),
        ),
      )
      .first();

    if (existingMatch) {
      return { matchId: existingMatch._id, existed: true };
    }

    // Create the match
    const matchId = await ctx.db.insert("matches", {
      userA: userAId,
      userB: userBId,
      createdAt: Date.now(),
    });

    return { matchId, existed: false };
  },
});

// Get or create a match between two users
export const getOrCreateMatch = mutation({
  args: { 
    userAId: v.id("users"),
    userBId: v.id("users")
  },
  handler: async (ctx, args) => {
    const { userAId, userBId } = args;

    // Check if match already exists
    const existingMatch = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("userA"), userAId),
            q.eq(q.field("userB"), userBId),
          ),
          q.and(
            q.eq(q.field("userA"), userBId),
            q.eq(q.field("userB"), userAId),
          ),
        ),
      )
      .first();

    if (existingMatch) {
      return existingMatch._id;
    }

    // Create the match
    const matchId = await ctx.db.insert("matches", {
      userA: userAId,
      userB: userBId,
      createdAt: Date.now(),
    });

    return matchId;
  },
});