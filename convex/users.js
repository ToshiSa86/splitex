import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const store = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const nextName = args.name ?? identity.name ?? "Anonymous";
    const nextEmail = args.email ?? identity.emailAddress ?? undefined;
    const nextImageUrl = args.imageUrl ?? identity.pictureUrl ?? undefined;


    // Require email (since you don't want accounts without email)
    if (!nextEmail) {
      throw new Error(
        "Email is required. Please sign up/sign in with an email account."
      );
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

 if (existing) {
  const updates = {};
  if (existing.name !== nextName) updates.name = nextName;

  if (nextEmail !== undefined && existing.email !== nextEmail) {
    updates.email = nextEmail;
  }

  if (nextImageUrl !== undefined && existing.imageUrl !== nextImageUrl) {
    updates.imageUrl = nextImageUrl;
  }

  if (Object.keys(updates).length) {
    await ctx.db.patch(existing._id, updates);
  }
  return existing._id;
}


    return await ctx.db.insert("users", {
      name: nextName,
      email: nextEmail,
      imageUrl: nextImageUrl,
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});

// Get current user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) return null;

    return user;
  },
});


// Search users by name or email (for adding participants)
export const searchUsers = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // Use centralized getCurrentUser function
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    // Don't search if query is too short
    if (args.query.length < 2) {
      return [];
    }

    // Search by name using search index
    const nameResults = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .collect();

    // Search by email using search index
    const emailResults = await ctx.db
      .query("users")
      .withSearchIndex("search_email", (q) => q.search("email", args.query))
      .collect();

    // Combine results (removing duplicates)
    const users = [
      ...nameResults,
      ...emailResults.filter(
        (email) => !nameResults.some((name) => name._id === email._id)
      ),
    ];

    // Exclude current user and format results
    return users
      .filter((user) => user._id !== currentUser._id)
      .map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
      }));
  },
});
