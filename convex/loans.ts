import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("lent"), v.literal("borrowed"))),
    status: v.optional(v.union(v.literal("active"), v.literal("paid"), v.literal("overdue"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    let query = ctx.db
      .query("loans")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const loans = await query.collect();
    
    // Filter by type and status if provided
    let filteredLoans = loans;
    if (args.type) {
      filteredLoans = filteredLoans.filter(loan => loan.type === args.type);
    }
    if (args.status) {
      filteredLoans = filteredLoans.filter(loan => loan.status === args.status);
    }

    // Get person details for each loan
    const loansWithPeople = await Promise.all(
      filteredLoans.map(async (loan) => {
        const person = await ctx.db.get(loan.personId);
        return { ...loan, person };
      })
    );

    return loansWithPeople;
  },
});

export const create = mutation({
  args: {
    description: v.string(),
    totalAmount: v.number(),
    type: v.union(v.literal("lent"), v.literal("borrowed")),
    personId: v.id("people"),
    startDate: v.string(),
    dueDate: v.optional(v.string()),
    interestRate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Validate person belongs to user
    const person = await ctx.db.get(args.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found or unauthorized");
    }

    const today = new Date().toISOString().split('T')[0];
    const status = args.dueDate && args.dueDate < today ? "overdue" : "active";

    const loanId = await ctx.db.insert("loans", {
      ...args,
      remainingAmount: args.totalAmount,
      status,
      userId,
    });

    // Update person balance
    await ctx.runMutation(api.people.updateBalance, { personId: args.personId });

    return loanId;
  },
});

export const update = mutation({
  args: {
    id: v.id("loans"),
    description: v.string(),
    totalAmount: v.number(),
    type: v.union(v.literal("lent"), v.literal("borrowed")),
    personId: v.id("people"),
    startDate: v.string(),
    dueDate: v.optional(v.string()),
    interestRate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { id, ...updates } = args;
    
    const loan = await ctx.db.get(id);
    if (!loan || loan.userId !== userId) {
      throw new Error("Loan not found or unauthorized");
    }

    // Validate person belongs to user
    const person = await ctx.db.get(updates.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found or unauthorized");
    }

    const today = new Date().toISOString().split('T')[0];
    const status = loan.status === "paid" ? "paid" : 
                  (updates.dueDate && updates.dueDate < today ? "overdue" : "active");

    await ctx.db.patch(id, { ...updates, status });

    // Update balances for both old and new person
    if (loan.personId !== updates.personId) {
      await ctx.runMutation(api.people.updateBalance, { personId: loan.personId });
    }
    await ctx.runMutation(api.people.updateBalance, { personId: updates.personId });

    return id;
  },
});

export const addPayment = mutation({
  args: {
    loanId: v.id("loans"),
    amount: v.number(),
    paymentDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const loan = await ctx.db.get(args.loanId);
    if (!loan || loan.userId !== userId) {
      throw new Error("Loan not found or unauthorized");
    }

    if (args.amount > loan.remainingAmount) {
      throw new Error("Payment amount cannot exceed remaining amount");
    }

    // Create payment record
    const paymentId = await ctx.db.insert("loanPayments", {
      ...args,
      userId,
    });

    // Update loan remaining amount
    const newRemainingAmount = loan.remainingAmount - args.amount;
    const newStatus = newRemainingAmount === 0 ? "paid" : loan.status;

    await ctx.db.patch(args.loanId, {
      remainingAmount: newRemainingAmount,
      status: newStatus,
    });

    // Update person balance
    await ctx.runMutation(api.people.updateBalance, { personId: loan.personId });

    return paymentId;
  },
});

export const getPayments = query({
  args: {
    loanId: v.id("loans"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const loan = await ctx.db.get(args.loanId);
    if (!loan || loan.userId !== userId) {
      throw new Error("Loan not found or unauthorized");
    }

    return await ctx.db
      .query("loanPayments")
      .withIndex("by_loan", (q) => q.eq("loanId", args.loanId))
      .order("desc")
      .collect();
  },
});

export const remove = mutation({
  args: {
    id: v.id("loans"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const loan = await ctx.db.get(args.id);
    if (!loan || loan.userId !== userId) {
      throw new Error("Loan not found or unauthorized");
    }

    // Delete all related payments
    const payments = await ctx.db
      .query("loanPayments")
      .withIndex("by_loan", (q) => q.eq("loanId", args.id))
      .collect();

    for (const payment of payments) {
      await ctx.db.delete(payment._id);
    }

    await ctx.db.delete(args.id);

    // Update person balance
    await ctx.runMutation(api.people.updateBalance, { personId: loan.personId });

    return args.id;
  },
});
