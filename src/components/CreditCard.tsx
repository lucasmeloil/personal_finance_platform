import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function CreditCard() {
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const purchases = useQuery(
    api.creditCard.listPurchases,
    statusFilter === "all" ? {} : { status: statusFilter }
  ) || [];
  const people = useQuery(api.people.list) || [];
  const upcomingInstallments = useQuery(api.creditCard.listUpcomingInstallments, { days: 7 }) || [];
  
  const createPurchase = useMutation(api.creditCard.createPurchase);
  const removePurchase = useMutation(api.creditCard.removePurchase);

  const handleSubmit = async (formData: any) => {
    try {
      const purchaseData = {
        ...formData,
        totalAmount: Math.round(parseFloat(formData.totalAmount) * 100), // Convert to cents
        installments: parseInt(formData.installments),
      };

      await createPurchase(purchaseData);
      toast.success("Compra registrada com sucesso!");
      setShowForm(false);
      setEditingPurchase(null);
    } catch (error) {
      toast.error("Erro ao registrar compra");
    }
  };

  const handleDelete = async (id: Id<"creditCardPurchases">) => {
    if (confirm("Tem certeza que deseja excluir esta compra?")) {
      try {
        await removePurchase({ id });
        toast.success("Compra excluída com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir compra");
      }
    }
  };

  const totalActive = purchases
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const totalCompleted = purchases
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cartão de Crédito</h2>
          <p className="text-gray-600">Gerencie compras de terceiros no seu cartão</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Nova Compra
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-sm font-medium text-gray-600">Total Ativo</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalActive)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-sm font-medium text-gray-600">Total Quitado</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCompleted)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-sm font-medium text-gray-600">Próximas Parcelas</h3>
            <p className="text-2xl font-bold text-orange-600">
              {upcomingInstallments.length}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Installments Alert */}
      {upcomingInstallments.length > 0 && (
        <div className="card border-orange-200 bg-orange-50">
          <div className="card-body">
            <h3 className="font-medium text-orange-800 mb-3">
              🔔 Parcelas Vencendo nos Próximos 7 Dias
            </h3>
            <div className="space-y-2">
              {upcomingInstallments.slice(0, 3).map((installment) => (
                <div key={installment._id} className="flex justify-between items-center text-sm">
                  <span>
                    {installment.purchase?.description} - {installment.person?.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(installment.amount)}</span>
                    <span className="text-orange-600">{formatDate(installment.dueDate)}</span>
                  </div>
                </div>
              ))}
              {upcomingInstallments.length > 3 && (
                <p className="text-sm text-orange-600">
                  +{upcomingInstallments.length - 3} mais parcelas...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Todas", count: purchases.length },
          { key: "active", label: "Ativas", count: purchases.filter(p => p.status === "active").length },
          { key: "completed", label: "Quitadas", count: purchases.filter(p => p.status === "completed").length },
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

      {/* Purchases List */}
      <div className="space-y-3">
        {purchases.map((purchase) => (
          <PurchaseCard
            key={purchase._id}
            purchase={purchase}
            onEdit={() => {
              setEditingPurchase(purchase);
              setShowForm(true);
            }}
            onDelete={() => handleDelete(purchase._id)}
            onViewDetails={() => setSelectedPurchase(purchase)}
          />
        ))}
      </div>

      {purchases.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma compra encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Comece registrando compras feitas por terceiros no seu cartão
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            + Registrar Primeira Compra
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PurchaseForm
          purchase={editingPurchase}
          people={people}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPurchase(null);
          }}
        />
      )}

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <PurchaseDetails
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </div>
  );
}

function PurchaseCard({ purchase, onEdit, onDelete, onViewDetails }: any) {
  const isCompleted = purchase.status === "completed";
  const progressPercentage = (purchase.paidInstallments / purchase.installments) * 100;

  return (
    <div className={`card ${isCompleted ? "border-green-200 bg-green-50" : ""}`}>
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{purchase.description}</h3>
              <StatusBadge status={purchase.status} />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Valor Total:</span>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(purchase.totalAmount)}
                </p>
              </div>
              <div>
                <span className="font-medium">Parcelas:</span>
                <p className="font-medium">
                  {purchase.paidInstallments}/{purchase.installments}
                </p>
              </div>
              <div>
                <span className="font-medium">Valor da Parcela:</span>
                <p className="font-medium">
                  {formatCurrency(purchase.installmentAmount)}
                </p>
              </div>
              <div>
                <span className="font-medium">Pessoa:</span>
                <p>{purchase.person?.name || "Não informado"}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progresso</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {purchase.notes && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Observações:</span> {purchase.notes}
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            <button
              onClick={onViewDetails}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              Ver Parcelas
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Editar"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Excluir"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseForm({ purchase, people, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    description: purchase?.description || "",
    totalAmount: purchase ? (purchase.totalAmount / 100).toString() : "",
    installments: purchase?.installments?.toString() || "1",
    personId: purchase?.personId || "",
    purchaseDate: purchase?.purchaseDate || new Date().toISOString().split('T')[0],
    firstDueDate: purchase?.firstDueDate || "",
    notes: purchase?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.totalAmount || !formData.personId || !formData.firstDueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const installments = parseInt(formData.installments);
    if (installments < 1 || installments > 60) {
      toast.error("Número de parcelas deve ser entre 1 e 60");
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="card-header">
          <h3 className="text-lg font-semibold">
            {purchase ? "Editar Compra" : "Nova Compra no Cartão"}
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
              placeholder="Ex: Compra no supermercado"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Valor Total (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className="input-field"
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Número de Parcelas *</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pessoa *</label>
            <select
              value={formData.personId}
              onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
              className="select-field"
              required
            >
              <option value="">Selecione uma pessoa</option>
              {people.map((person: any) => (
                <option key={person._id} value={person._id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Data da Compra *</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vencimento da 1ª Parcela *</label>
              <input
                type="date"
                value={formData.firstDueDate}
                onChange={(e) => setFormData({ ...formData, firstDueDate: e.target.value })}
                className="input-field"
                required
              />
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

          {formData.totalAmount && formData.installments && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Valor por parcela:</strong> {formatCurrency(Math.round((parseFloat(formData.totalAmount) * 100) / parseInt(formData.installments || "1")))}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {purchase ? "Atualizar" : "Registrar"}
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

function PurchaseDetails({ purchase, onClose }: any) {
  const installments = useQuery(api.creditCard.getInstallments, { purchaseId: purchase._id }) || [];
  const payInstallment = useMutation(api.creditCard.payInstallment);

  const handlePayInstallment = async (installmentId: Id<"creditCardInstallments">) => {
    try {
      await payInstallment({ installmentId });
      toast.success("Parcela marcada como paga!");
    } catch (error) {
      toast.error("Erro ao marcar parcela como paga");
    }
  };

  const sendWhatsAppMessage = (installment: any, type: "reminder" | "overdue" | "charge") => {
    const person = purchase.person;
    if (!person?.phone) {
      toast.error("Pessoa não possui telefone cadastrado");
      return;
    }

    const messages = {
      reminder: `Olá ${person.name}! Lembrete: sua parcela de ${formatCurrency(installment.amount)} referente à "${purchase.description}" vence em ${formatDate(installment.dueDate)}. 💳`,
      overdue: `Olá ${person.name}! Sua parcela de ${formatCurrency(installment.amount)} referente à "${purchase.description}" está em atraso desde ${formatDate(installment.dueDate)}. Por favor, regularize o pagamento. 💳⚠️`,
      charge: `Olá ${person.name}! Cobrança: parcela de ${formatCurrency(installment.amount)} referente à "${purchase.description}" com vencimento em ${formatDate(installment.dueDate)}. Aguardo o pagamento. 💳💰`
    };

    const phone = person.phone.replace(/\D/g, '');
    const message = encodeURIComponent(messages[type]);
    const whatsappUrl = `https://wa.me/55${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        <div className="card-header flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{purchase.description}</h3>
            <p className="text-sm text-gray-600">{purchase.person?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="card-body">
          {/* Purchase Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-lg font-bold">{formatCurrency(purchase.totalAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Parcelas</p>
              <p className="text-lg font-bold">{purchase.paidInstallments}/{purchase.installments}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Valor da Parcela</p>
              <p className="text-lg font-bold">{formatCurrency(purchase.installmentAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Status</p>
              <StatusBadge status={purchase.status} />
            </div>
          </div>

          {/* Installments List */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Parcelas</h4>
            {installments.map((installment) => (
              <InstallmentCard
                key={installment._id}
                installment={installment}
                purchase={purchase}
                onPay={() => handlePayInstallment(installment._id)}
                onSendWhatsApp={sendWhatsAppMessage}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallmentCard({ installment, purchase, onPay, onSendWhatsApp }: any) {
  const isPaid = installment.status === "paid";
  const isOverdue = !isPaid && new Date(installment.dueDate) < new Date();
  const isDueSoon = !isPaid && !isOverdue && 
    new Date(installment.dueDate).getTime() - new Date().getTime() <= 3 * 24 * 60 * 60 * 1000; // 3 days

  return (
    <div className={`card ${isOverdue ? "border-red-200 bg-red-50" : isDueSoon ? "border-yellow-200 bg-yellow-50" : ""}`}>
      <div className="card-body">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-medium">
                Parcela {installment.installmentNumber}/{purchase.installments}
              </span>
              <StatusBadge status={installment.status} />
              {isOverdue && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Em Atraso</span>}
              {isDueSoon && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Vence em Breve</span>}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Valor:</span>
                <p className="font-semibold">{formatCurrency(installment.amount)}</p>
              </div>
              <div>
                <span className="text-gray-600">Vencimento:</span>
                <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                  {formatDate(installment.dueDate)}
                </p>
              </div>
              {installment.paidDate && (
                <div>
                  <span className="text-gray-600">Pago em:</span>
                  <p className="font-medium text-green-600">{formatDate(installment.paidDate)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            {!isPaid && (
              <>
                <button
                  onClick={onPay}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  Dar Baixa
                </button>
                
                {/* WhatsApp Actions */}
                <div className="relative group">
                  <button className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                    📱 WhatsApp
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div className="p-2 space-y-1 min-w-[150px]">
                      <button
                        onClick={() => onSendWhatsApp(installment, "reminder")}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        🔔 Lembrete
                      </button>
                      {isOverdue && (
                        <button
                          onClick={() => onSendWhatsApp(installment, "overdue")}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-red-600"
                        >
                          ⚠️ Atraso
                        </button>
                      )}
                      <button
                        onClick={() => onSendWhatsApp(installment, "charge")}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-orange-600"
                      >
                        💰 Cobrança
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: "Ativo", class: "badge-info" },
    completed: { label: "Quitado", class: "badge-success" },
    pending: { label: "Pendente", class: "badge-warning" },
    paid: { label: "Pago", class: "badge-success" },
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
