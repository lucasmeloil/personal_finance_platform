import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function AccountsReceivable() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "received" | "overdue">("all");

  const accounts = useQuery(
    api.accountsReceivable.list,
    statusFilter === "all" ? {} : { status: statusFilter }
  ) || [];
  const people = useQuery(api.people.list) || [];
  const createAccount = useMutation(api.accountsReceivable.create);
  const updateAccount = useMutation(api.accountsReceivable.update);
  const markAsReceived = useMutation(api.accountsReceivable.markAsReceived);
  const removeAccount = useMutation(api.accountsReceivable.remove);

  const handleSubmit = async (formData: any) => {
    try {
      const accountData = {
        ...formData,
        amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
        personId: formData.personId || undefined,
      };

      if (editingAccount) {
        await updateAccount({ id: editingAccount._id, ...accountData });
        toast.success("Conta atualizada com sucesso!");
      } else {
        await createAccount(accountData);
        toast.success("Conta criada com sucesso!");
      }
      setShowForm(false);
      setEditingAccount(null);
    } catch (error) {
      toast.error("Erro ao salvar conta");
    }
  };

  const handleMarkAsReceived = async (id: Id<"accountsReceivable">) => {
    try {
      await markAsReceived({ id });
      toast.success("Conta marcada como recebida!");
    } catch (error) {
      toast.error("Erro ao marcar conta como recebida");
    }
  };

  const handleDelete = async (id: Id<"accountsReceivable">) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      try {
        await removeAccount({ id });
        toast.success("Conta excluída com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir conta");
      }
    }
  };

  const totalPending = accounts
    .filter(acc => acc.status === "pending")
    .reduce((sum, acc) => sum + acc.amount, 0);

  const totalOverdue = accounts
    .filter(acc => acc.status === "overdue")
    .reduce((sum, acc) => sum + acc.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contas a Receber</h2>
          <p className="text-gray-600">Gerencie seus direitos financeiros</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Nova Conta
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-sm font-medium text-gray-600">Total Pendente</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-sm font-medium text-gray-600">Em Atraso</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOverdue)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-sm font-medium text-gray-600">Total de Contas</h3>
            <p className="text-2xl font-bold text-gray-900">
              {accounts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Todas", count: accounts.length },
          { key: "pending", label: "Pendentes", count: accounts.filter(a => a.status === "pending").length },
          { key: "overdue", label: "Atrasadas", count: accounts.filter(a => a.status === "overdue").length },
          { key: "received", label: "Recebidas", count: accounts.filter(a => a.status === "received").length },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === filter.key
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account._id}
            account={account}
            onEdit={() => {
              setEditingAccount(account);
              setShowForm(true);
            }}
            onMarkAsReceived={() => handleMarkAsReceived(account._id)}
            onDelete={() => handleDelete(account._id)}
          />
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma conta encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Comece adicionando suas contas a receber
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            + Adicionar Primeira Conta
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <AccountForm
          account={editingAccount}
          people={people}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAccount(null);
          }}
        />
      )}
    </div>
  );
}

function AccountCard({ account, onEdit, onMarkAsReceived, onDelete }: any) {
  const isOverdue = account.status === "overdue";
  const isReceived = account.status === "received";

  return (
    <div className={`card ${isOverdue ? "border-red-200 bg-red-50" : ""}`}>
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{account.description}</h3>
              <StatusBadge status={account.status} />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Valor:</span>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(account.amount)}
                </p>
              </div>
              <div>
                <span className="font-medium">Vencimento:</span>
                <p className={isOverdue ? "text-red-600 font-medium" : ""}>
                  {formatDate(account.dueDate)}
                </p>
              </div>
              <div>
                <span className="font-medium">Categoria:</span>
                <p>{account.category}</p>
              </div>
              <div>
                <span className="font-medium">Pessoa:</span>
                <p>{account.person?.name || "Não informado"}</p>
              </div>
            </div>

            {account.notes && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Observações:</span> {account.notes}
              </div>
            )}

            {account.receivedDate && (
              <div className="mt-2 text-sm text-green-600">
                <span className="font-medium">Recebido em:</span> {formatDate(account.receivedDate)}
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            {!isReceived && (
              <button
                onClick={onMarkAsReceived}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
              >
                Marcar como Recebido
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountForm({ account, people, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    description: account?.description || "",
    amount: account ? (account.amount / 100).toString() : "",
    dueDate: account?.dueDate || "",
    category: account?.category || "",
    personId: account?.personId || "",
    notes: account?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount || !formData.dueDate || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="card-header">
          <h3 className="text-lg font-semibold">
            {account ? "Editar Conta" : "Nova Conta a Receber"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="card-body space-y-4">
          <div className="form-group">
            <label className="form-label">Descrição *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="Ex: Serviço prestado"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field"
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Vencimento *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="select-field"
                required
              >
                <option value="">Selecione uma categoria</option>
                <option value="Serviços">Serviços</option>
                <option value="Vendas">Vendas</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Freelance">Freelance</option>
                <option value="Aluguel">Aluguel</option>
                <option value="Empréstimo">Empréstimo</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Pessoa</label>
              <select
                value={formData.personId}
                onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                className="select-field"
              >
                <option value="">Selecione uma pessoa</option>
                {people.map((person: any) => (
                  <option key={person._id} value={person._id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {account ? "Atualizar" : "Criar"}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: "Pendente", class: "badge-warning" },
    received: { label: "Recebido", class: "badge-success" },
    overdue: { label: "Atrasado", class: "badge-danger" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || 
                 { label: status, class: "badge-info" };

  return (
    <span className={`badge ${config.class}`}>
      {config.label}
    </span>
  );
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
