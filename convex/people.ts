import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    return await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    document: v.optional(v.string()),
    address: v.optional(v.string()),
    type: v.union(v.literal("person"), v.literal("company")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if document already exists for this user
    if (args.document) {
      const cleanDocument = args.document.replace(/\D/g, '');
      const existingPerson = await ctx.db
        .query("people")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("document"), cleanDocument))
        .first();

      if (existingPerson) {
        throw new Error("Já existe uma pessoa cadastrada com este documento");
      }
    }

    return await ctx.db.insert("people", {
      ...args,
      document: args.document ? args.document.replace(/\D/g, '') : undefined,
      totalBalance: 0,
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("people"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    document: v.optional(v.string()),
    address: v.optional(v.string()),
    type: v.union(v.literal("person"), v.literal("company")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { id, ...updates } = args;
    
    const person = await ctx.db.get(id);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found or unauthorized");
    }

    // Check if document already exists for another person
    if (updates.document) {
      const cleanDocument = updates.document.replace(/\D/g, '');
      const existingPerson = await ctx.db
        .query("people")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("document"), cleanDocument))
        .first();

      if (existingPerson && existingPerson._id !== id) {
        throw new Error("Já existe uma pessoa cadastrada com este documento");
      }
    }

    return await ctx.db.patch(id, {
      ...updates,
      document: updates.document ? updates.document.replace(/\D/g, '') : undefined,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("people"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const person = await ctx.db.get(args.id);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found or unauthorized");
    }

    // Check if person has any related records
    const payables = await ctx.db
      .query("accountsPayable")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("personId"), args.id))
      .collect();

    const receivables = await ctx.db
      .query("accountsReceivable")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("personId"), args.id))
      .collect();

    const loans = await ctx.db
      .query("loans")
      .withIndex("by_person", (q) => q.eq("personId", args.id))
      .collect();

    const purchases = await ctx.db
      .query("creditCardPurchases")
      .withIndex("by_person", (q) => q.eq("personId", args.id))
      .collect();

    if (payables.length > 0 || receivables.length > 0 || loans.length > 0 || purchases.length > 0) {
      throw new Error("Cannot delete person with existing financial records");
    }

    return await ctx.db.delete(args.id);
  },
});

export const getPersonHistory = query({
  args: {
    personId: v.id("people"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const person = await ctx.db.get(args.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found or unauthorized");
    }

    const [payables, receivables, loans, purchases] = await Promise.all([
      ctx.db
        .query("accountsPayable")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("personId"), args.personId))
        .collect(),
      ctx.db
        .query("accountsReceivable")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("personId"), args.personId))
        .collect(),
      ctx.db
        .query("loans")
        .withIndex("by_person", (q) => q.eq("personId", args.personId))
        .collect(),
      ctx.db
        .query("creditCardPurchases")
        .withIndex("by_person", (q) => q.eq("personId", args.personId))
        .collect(),
    ]);

    return {
      payables,
      receivables,
      loans,
      purchases,
    };
  },
});

export const updateBalance = mutation({
  args: {
    personId: v.id("people"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const person = await ctx.db.get(args.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found or unauthorized");
    }

    // Calculate total balance from all sources
    const [payables, receivables, loans, purchases] = await Promise.all([
      ctx.db
        .query("accountsPayable")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("personId"), args.personId))
        .collect(),
      ctx.db
        .query("accountsReceivable")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("personId"), args.personId))
        .collect(),
      ctx.db
        .query("loans")
        .withIndex("by_person", (q) => q.eq("personId", args.personId))
        .collect(),
      ctx.db
        .query("creditCardPurchases")
        .withIndex("by_person", (q) => q.eq("personId", args.personId))
        .collect(),
    ]);

    let totalBalance = 0;

    // Add pending payables (we owe them)
    totalBalance -= payables
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    // Add pending receivables (they owe us)
    totalBalance += receivables
      .filter(r => r.status === "pending")
      .reduce((sum, r) => sum + r.amount, 0);

    // Add loan balances
    loans.forEach(loan => {
      if (loan.status === "active") {
        if (loan.type === "lent") {
          totalBalance += loan.remainingAmount; // They owe us
        } else {
          totalBalance -= loan.remainingAmount; // We owe them
        }
      }
    });

    // Add credit card balances
    const installments = await Promise.all(
      purchases.map(purchase =>
        ctx.db
          .query("creditCardInstallments")
          .withIndex("by_purchase", (q) => q.eq("purchaseId", purchase._id))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect()
      )
    );

    const pendingInstallments = installments.flat();
    totalBalance += pendingInstallments.reduce((sum, inst) => sum + inst.amount, 0);

    await ctx.db.patch(args.personId, { totalBalance });
    return totalBalance;
  },
});
