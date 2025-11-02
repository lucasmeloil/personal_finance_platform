import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("paid"), v.literal("overdue"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    let query = ctx.db
      .query("accountsPayable")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const accounts = await query.collect();
    
    // Get person details for each account
    const accountsWithPeople = await Promise.all(
      accounts.map(async (account) => {
        const person = account.personId ? await ctx.db.get(account.personId) : null;
        return { ...account, person };
      })
    );

    return accountsWithPeople;
  },
});

export const create = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    category: v.string(),
    personId: v.optional(v.id("people")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Validate person belongs to user
    if (args.personId) {
      const person = await ctx.db.get(args.personId);
      if (!person || person.userId !== userId) {
        throw new Error("Person not found or unauthorized");
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const status = args.dueDate < today ? "overdue" : "pending";

    const accountId = await ctx.db.insert("accountsPayable", {
      ...args,
      status,
      userId,
    });

    // Update person balance if applicable
    if (args.personId) {
      await ctx.runMutation(api.people.updateBalance, { personId: args.personId });
    }

    return accountId;
  },
});

export const update = mutation({
  args: {
    id: v.id("accountsPayable"),
    description: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    category: v.string(),
    personId: v.optional(v.id("people")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { id, ...updates } = args;
    
    const account = await ctx.db.get(id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found or unauthorized");
    }

    // Validate person belongs to user
    if (updates.personId) {
      const person = await ctx.db.get(updates.personId);
      if (!person || person.userId !== userId) {
        throw new Error("Person not found or unauthorized");
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const status = account.status === "paid" ? "paid" : 
                  (updates.dueDate < today ? "overdue" : "pending");

    await ctx.db.patch(id, { ...updates, status });

    // Update balances for both old and new person
    if (account.personId) {
      await ctx.runMutation(api.people.updateBalance, { personId: account.personId });
    }
    if (updates.personId && updates.personId !== account.personId) {
      await ctx.runMutation(api.people.updateBalance, { personId: updates.personId });
    }

    return id;
  },
});

export const markAsPaid = mutation({
  args: {
    id: v.id("accountsPayable"),
    paidDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found or unauthorized");
    }

    const paidDate = args.paidDate || new Date().toISOString().split('T')[0];

    await ctx.db.patch(args.id, {
      status: "paid",
      paidDate,
    });

    // Update person balance if applicable
    if (account.personId) {
      await ctx.runMutation(api.people.updateBalance, { personId: account.personId });
    }

    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("accountsPayable"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found or unauthorized");
    }

    await ctx.db.delete(args.id);

    // Update person balance if applicable
    if (account.personId) {
      await ctx.runMutation(api.people.updateBalance, { personId: account.personId });
    }

    return args.id;
  },
});
