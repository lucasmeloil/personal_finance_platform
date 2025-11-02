import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Dashboard() {
  const dashboardData = useQuery(api.dashboard.getDashboardData);

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const {
    totalPayable,
    totalReceivable,
    overduePayable,
    overdueReceivable,
    activeLoansBorrowed,
    activeLoansLent,
    upcomingPayments,
    upcomingReceipts
  } = dashboardData;

  // Mock data for overdue accounts and recent transactions since they're not in the query
  const overdueAccounts = [
    { description: "Conta de luz", dueDate: "2024-01-15", amount: 15000 },
    { description: "Internet", dueDate: "2024-01-10", amount: 8000 },
  ];

  const recentTransactions = [
    { description: "Pagamento recebido", type: "Conta a Receber", amount: 50000, date: "2024-01-20" },
    { description: "Compra no cartão", type: "Cartão de Crédito", amount: 12000, date: "2024-01-19" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">N</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">NEXUS FINANCE</h1>
            <p className="text-blue-100">Dashboard Financeiro</p>
          </div>
        </div>
        <p className="text-blue-100">
          Bem-vindo ao seu centro de controle financeiro. Gerencie todas as suas finanças em um só lugar.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Contas a Pagar"
          amount={totalPayable}
          icon="💸"
          color="red"
          description="Total pendente"
        />
        <SummaryCard
          title="Contas a Receber"
          amount={totalReceivable}
          icon="💰"
          color="green"
          description="Total a receber"
        />
        <SummaryCard
          title="Empréstimos Tomados"
          amount={activeLoansBorrowed}
          icon="🏦"
          color="blue"
          description="Saldo devedor"
        />
        <SummaryCard
          title="Empréstimos Concedidos"
          amount={activeLoansLent}
          icon="💼"
          color="purple"
          description="Saldo credor"
        />
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Payments */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              🔔 Próximos Vencimentos
            </h3>
          </div>
          <div className="card-body">
            {upcomingPayments.length > 0 ? (
              <div className="space-y-3">
                {upcomingPayments.slice(0, 5).map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-gray-900">{payment.description}</p>
                      <p className="text-sm text-gray-600">{formatDate(payment.dueDate)}</p>
                    </div>
                    <span className="font-semibold text-yellow-700">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
                {upcomingPayments.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{upcomingPayments.length - 5} mais vencimentos...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p>Nenhum vencimento próximo</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue Accounts */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              ⚠️ Contas em Atraso
            </h3>
          </div>
          <div className="card-body">
            {(overduePayable > 0 || overdueReceivable > 0) ? (
              <div className="space-y-3">
                {overdueAccounts.slice(0, 5).map((account, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-gray-900">{account.description}</p>
                      <p className="text-sm text-red-600">Venceu em {formatDate(account.dueDate)}</p>
                    </div>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(account.amount)}
                    </span>
                  </div>
                ))}
                {overdueAccounts.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{overdueAccounts.length - 5} mais contas em atraso...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎉</div>
                <p>Nenhuma conta em atraso</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            📈 Atividade Recente
          </h3>
        </div>
        <div className="card-body">
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm">{getTransactionIcon(transaction.type)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{transaction.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </span>
                    <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, amount, icon, color, description }: any) {
  const colorClasses = {
    red: "from-red-500 to-red-600 text-red-600",
    green: "from-green-500 to-green-600 text-green-600",
    blue: "from-blue-500 to-blue-600 text-blue-600",
    purple: "from-purple-500 to-purple-600 text-purple-600",
  };

  return (
    <div className="card hover:shadow-lg transition-all duration-300 transform hover:scale-105">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')} rounded-lg flex items-center justify-center shadow-lg`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{description}</p>
            <p className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses].split(' ')[2]}`}>
              {formatCurrency(amount)}
            </p>
          </div>
        </div>
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
    </div>
  );
}

function getTransactionIcon(type: string): string {
  const icons: Record<string, string> = {
    "Conta a Pagar": "💸",
    "Conta a Receber": "💰",
    "Empréstimo": "🏦",
    "Cartão de Crédito": "💳",
  };
  return icons[type] || "📊";
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}
