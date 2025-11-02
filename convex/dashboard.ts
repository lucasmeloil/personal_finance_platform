import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get accounts payable data
    const accountsPayable = await ctx.db
      .query("accountsPayable")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalPayable = accountsPayable
      .filter(account => account.status === "pending")
      .reduce((sum, account) => sum + account.amount, 0);

    const overduePayable = accountsPayable
      .filter(account => account.status === "pending" && account.dueDate < today)
      .reduce((sum, account) => sum + account.amount, 0);

    // Get accounts receivable data
    const accountsReceivable = await ctx.db
      .query("accountsReceivable")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalReceivable = accountsReceivable
      .filter(account => account.status === "pending")
      .reduce((sum, account) => sum + account.amount, 0);

    const overdueReceivable = accountsReceivable
      .filter(account => account.status === "pending" && account.dueDate < today)
      .reduce((sum, account) => sum + account.amount, 0);

    // Get loans data
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const activeLoansBorrowed = loans
      .filter(loan => loan.type === "borrowed" && loan.status === "active")
      .reduce((sum, loan) => sum + loan.remainingAmount, 0);

    const activeLoansLent = loans
      .filter(loan => loan.type === "lent" && loan.status === "active")
      .reduce((sum, loan) => sum + loan.remainingAmount, 0);

    // Get upcoming payments (next 7 days)
    const upcomingPayments = accountsPayable
      .filter(account => 
        account.status === "pending" && 
        account.dueDate >= today && 
        account.dueDate <= nextWeek
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    // Get upcoming receipts (next 7 days)
    const upcomingReceipts = accountsReceivable
      .filter(account => 
        account.status === "pending" && 
        account.dueDate >= today && 
        account.dueDate <= nextWeek
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    return {
      totalPayable,
      totalReceivable,
      overduePayable,
      overdueReceivable,
      activeLoansBorrowed,
      activeLoansLent,
      upcomingPayments,
      upcomingReceipts,
    };
  },
});
