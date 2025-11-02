import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  people: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    document: v.optional(v.string()), // CPF or CNPJ (numbers only)
    address: v.optional(v.string()),
    type: v.union(v.literal("person"), v.literal("company")),
    notes: v.optional(v.string()),
    totalBalance: v.number(), // in cents
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_document", ["document"]),

  accountsPayable: defineTable({
    description: v.string(),
    amount: v.number(), // in cents
    dueDate: v.string(),
    category: v.string(),
    personId: v.optional(v.id("people")),
    notes: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("overdue")),
    paidDate: v.optional(v.string()),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_person", ["personId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  accountsReceivable: defineTable({
    description: v.string(),
    amount: v.number(), // in cents
    dueDate: v.string(),
    category: v.string(),
    personId: v.optional(v.id("people")),
    notes: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("received"), v.literal("overdue")),
    receivedDate: v.optional(v.string()),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_person", ["personId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  loans: defineTable({
    description: v.string(),
    totalAmount: v.number(), // in cents
    remainingAmount: v.number(), // in cents
    type: v.union(v.literal("lent"), v.literal("borrowed")),
    personId: v.id("people"),
    startDate: v.string(),
    dueDate: v.optional(v.string()),
    interestRate: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("paid"), v.literal("overdue")),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_person", ["personId"])
    .index("by_status", ["status"]),

  loanPayments: defineTable({
    loanId: v.id("loans"),
    amount: v.number(), // in cents
    paymentDate: v.string(),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  })
    .index("by_loan", ["loanId"])
    .index("by_user", ["userId"]),

  creditCardPurchases: defineTable({
    description: v.string(),
    totalAmount: v.number(), // in cents
    installmentAmount: v.number(), // in cents
    installments: v.number(),
    paidInstallments: v.number(),
    personId: v.id("people"),
    purchaseDate: v.string(),
    firstDueDate: v.string(),
    notes: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("completed")),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_person", ["personId"])
    .index("by_status", ["status"]),

  creditCardInstallments: defineTable({
    purchaseId: v.id("creditCardPurchases"),
    installmentNumber: v.number(),
    amount: v.number(), // in cents
    dueDate: v.string(),
    status: v.union(v.literal("pending"), v.literal("paid")),
    paidDate: v.optional(v.string()),
    userId: v.id("users"),
  })
    .index("by_purchase", ["purchaseId"])
    .index("by_user", ["userId"])
    .index("by_due_date", ["dueDate"])
    .index("by_status", ["status"]),

  financialGoals: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    targetAmount: v.number(), // in cents
    currentAmount: v.number(), // in cents
    targetDate: v.string(),
    category: v.string(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("paused")),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("due_date"), v.literal("overdue"), v.literal("goal"), v.literal("payment")),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    isRead: v.boolean(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_read_status", ["isRead"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
