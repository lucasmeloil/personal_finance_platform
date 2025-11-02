import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const listPurchases = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    let query = ctx.db
      .query("creditCardPurchases")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const purchases = await query.collect();
    
    // Get person details for each purchase
    const purchasesWithPeople = await Promise.all(
      purchases.map(async (purchase) => {
        const person = await ctx.db.get(purchase.personId);
        return { ...purchase, person };
      })
    );

    return purchasesWithPeople;
  },
});

export const createPurchase = mutation({
  args: {
    description: v.string(),
    totalAmount: v.number(),
    installments: v.number(),
    personId: v.id("people"),
    purchaseDate: v.string(),
    firstDueDate: v.string(),
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

    const installmentAmount = Math.round(args.totalAmount / args.installments);

    // Create purchase record
    const purchaseId = await ctx.db.insert("creditCardPurchases", {
      ...args,
      installmentAmount,
      paidInstallments: 0,
      status: "active",
      userId,
    });

    // Create installment records
    const firstDueDate = new Date(args.firstDueDate);
    for (let i = 1; i <= args.installments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      
      await ctx.db.insert("creditCardInstallments", {
        purchaseId,
        installmentNumber: i,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: "pending",
        userId,
      });
    }

    // Update person balance
    await ctx.runMutation(api.people.updateBalance, { personId: args.personId });

    return purchaseId;
  },
});

export const getInstallments = query({
  args: {
    purchaseId: v.id("creditCardPurchases"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase || purchase.userId !== userId) {
      throw new Error("Purchase not found or unauthorized");
    }

    return await ctx.db
      .query("creditCardInstallments")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", args.purchaseId))
      .order("asc")
      .collect();
  },
});

export const payInstallment = mutation({
  args: {
    installmentId: v.id("creditCardInstallments"),
    paidDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const installment = await ctx.db.get(args.installmentId);
    if (!installment || installment.userId !== userId) {
      throw new Error("Installment not found or unauthorized");
    }

    const purchase = await ctx.db.get(installment.purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }

    const paidDate = args.paidDate || new Date().toISOString().split('T')[0];

    // Mark installment as paid
    await ctx.db.patch(args.installmentId, {
      status: "paid",
      paidDate,
    });

    // Update purchase paid installments count
    const newPaidInstallments = purchase.paidInstallments + 1;
    const newStatus = newPaidInstallments === purchase.installments ? "completed" : "active";

    await ctx.db.patch(installment.purchaseId, {
      paidInstallments: newPaidInstallments,
      status: newStatus,
    });

    // Update person balance
    await ctx.runMutation(api.people.updateBalance, { personId: purchase.personId });

    return args.installmentId;
  },
});

export const listUpcomingInstallments = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const days = args.days || 30;
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    const installments = await ctx.db
      .query("creditCardInstallments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const upcomingInstallments = installments.filter(inst => {
      const dueDate = new Date(inst.dueDate);
      return dueDate >= today && dueDate <= futureDate;
    });

    // Get purchase and person details
    const installmentsWithDetails = await Promise.all(
      upcomingInstallments.map(async (installment) => {
        const purchase = await ctx.db.get(installment.purchaseId);
        const person = purchase ? await ctx.db.get(purchase.personId) : null;
        return { ...installment, purchase, person };
      })
    );

    return installmentsWithDetails.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },
});

export const generateReceipt = query({
  args: {
    purchaseId: v.id("creditCardPurchases"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase || purchase.userId !== userId) {
      throw new Error("Purchase not found or unauthorized");
    }

    const person = await ctx.db.get(purchase.personId);
    const installments = await ctx.db
      .query("creditCardInstallments")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", args.purchaseId))
      .collect();

    return {
      purchase,
      person,
      installments,
    };
  },
});

export const removePurchase = mutation({
  args: {
    id: v.id("creditCardPurchases"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const purchase = await ctx.db.get(args.id);
    if (!purchase || purchase.userId !== userId) {
      throw new Error("Purchase not found or unauthorized");
    }

    // Delete all related installments
    const installments = await ctx.db
      .query("creditCardInstallments")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", args.id))
      .collect();

    for (const installment of installments) {
      await ctx.db.delete(installment._id);
    }

    await ctx.db.delete(args.id);

    // Update person balance
    await ctx.runMutation(api.people.updateBalance, { personId: purchase.personId });

    return args.id;
  },
});
