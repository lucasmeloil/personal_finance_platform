import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    let query = ctx.db
      .query("financialGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    targetAmount: v.number(),
    targetDate: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    return await ctx.db.insert("financialGoals", {
      ...args,
      currentAmount: 0,
      status: "active",
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("financialGoals"),
    title: v.string(),
    description: v.optional(v.string()),
    targetAmount: v.number(),
    targetDate: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { id, ...updates } = args;
    
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    return await ctx.db.patch(id, updates);
  },
});

export const updateProgress = mutation({
  args: {
    id: v.id("financialGoals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    const newCurrentAmount = Math.max(0, Math.min(args.amount, goal.targetAmount));
    const newStatus = newCurrentAmount >= goal.targetAmount ? "completed" : goal.status;

    await ctx.db.patch(args.id, {
      currentAmount: newCurrentAmount,
      status: newStatus,
    });

    // Create notification if goal is completed
    if (newStatus === "completed" && goal.status !== "completed") {
      await ctx.runMutation(internal.notifications.createNotification, {
        title: "Meta Alcançada! 🎯",
        message: `Parabéns! Você alcançou sua meta "${goal.title}"`,
        type: "goal",
        relatedId: args.id,
        relatedType: "goal",
        userId,
      });
    }

    return args.id;
  },
});

export const changeStatus = mutation({
  args: {
    id: v.id("financialGoals"),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("paused")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    return await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: {
    id: v.id("financialGoals"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    return await ctx.db.delete(args.id);
  },
});

export const getProgress = query({
  args: {
    id: v.id("financialGoals"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    const progressPercentage = goal.targetAmount > 0 
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0;

    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const remainingDays = Math.ceil(
      (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...goal,
      progressPercentage,
      remainingAmount,
      remainingDays,
    };
  },
});
