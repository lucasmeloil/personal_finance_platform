import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function PeopleManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "person" | "company">("all");

  const people = useQuery(api.people.list) || [];
  const createPerson = useMutation(api.people.create);
  const updatePerson = useMutation(api.people.update);
  const removePerson = useMutation(api.people.remove);
  const getPersonHistory = useQuery(
    api.people.getPersonHistory,
    selectedPerson ? { personId: selectedPerson._id } : "skip"
  );

  const filteredPeople = people.filter(person => 
    filter === "all" || person.type === filter
  );

  const handleSubmit = async (formData: any) => {
    try {
      if (editingPerson) {
        await updatePerson({ id: editingPerson._id, ...formData });
        toast.success("Pessoa atualizada com sucesso!");
      } else {
        await createPerson(formData);
        toast.success("Pessoa criada com sucesso!");
      }
      setShowForm(false);
      setEditingPerson(null);
    } catch (error) {
      toast.error("Erro ao salvar pessoa");
    }
  };

  const handleDelete = async (id: Id<"people">) => {
    if (confirm("Tem certeza que deseja excluir esta pessoa?")) {
      try {
        await removePerson({ id });
        toast.success("Pessoa excluída com sucesso!");
        if (selectedPerson?._id === id) {
          setSelectedPerson(null);
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir pessoa");
      }
    }
  };

  if (selectedPerson) {
    return (
      <PersonDetails
        person={selectedPerson}
        history={getPersonHistory}
        onBack={() => setSelectedPerson(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pessoas</h2>
          <p className="text-gray-600">Gerencie seus contatos e relacionamentos financeiros</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Nova Pessoa
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Todos ({people.length})
        </button>
        <button
          onClick={() => setFilter("person")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "person"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pessoas ({people.filter(p => p.type === "person").length})
        </button>
        <button
          onClick={() => setFilter("company")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "company"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Empresas ({people.filter(p => p.type === "company").length})
        </button>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPeople.map((person) => (
          <PersonCard
            key={person._id}
            person={person}
            onEdit={() => {
              setEditingPerson(person);
              setShowForm(true);
            }}
            onDelete={() => handleDelete(person._id)}
            onView={() => setSelectedPerson(person)}
          />
        ))}
      </div>

      {filteredPeople.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === "all" ? "Nenhuma pessoa cadastrada" : `Nenhuma ${filter === "person" ? "pessoa" : "empresa"} encontrada`}
          </h3>
          <p className="text-gray-600 mb-4">
            Comece adicionando pessoas para gerenciar suas finanças compartilhadas
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            + Adicionar Primeira Pessoa
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PersonForm
          person={editingPerson}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPerson(null);
          }}
        />
      )}
    </div>
  );
}

function PersonCard({ person, onEdit, onDelete, onView }: any) {
  const balanceColor = person.totalBalance > 0 ? "text-green-600" : 
                      person.totalBalance < 0 ? "text-red-600" : "text-gray-600";

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg">
                {person.type === "person" ? "👤" : "🏢"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{person.name}</h3>
              <span className="text-xs text-gray-500 capitalize">{person.type}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Editar"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Excluir"
            >
              🗑️
            </button>
          </div>
        </div>

        {person.document && (
          <p className="text-sm text-gray-600 mb-1">
            📄 {person.type === "company" ? "CNPJ" : "CPF"}: {formatDocument(person.document)}
          </p>
        )}
        {person.email && (
          <p className="text-sm text-gray-600 mb-1">📧 {person.email}</p>
        )}
        {person.phone && (
          <p className="text-sm text-gray-600 mb-3">📱 {person.phone}</p>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Saldo Total:</span>
            <span className={`font-semibold ${balanceColor}`}>
              {formatCurrency(person.totalBalance)}
            </span>
          </div>
          <button
            onClick={onView}
            className="w-full btn-secondary text-sm"
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonForm({ person, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: person?.name || "",
    email: person?.email || "",
    phone: person?.phone || "",
    document: person?.document || "",
    type: person?.type || "person",
    notes: person?.notes || "",
    address: person?.address || "",
  });
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);

  const fetchCNPJData = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }

    setIsLoadingCNPJ(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      
      if (!response.ok) {
        throw new Error("CNPJ não encontrado");
      }

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        name: data.razao_social || data.nome_fantasia || prev.name,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone_1}` : prev.phone,
        address: data.logradouro ? 
          `${data.logradouro}, ${data.numero || "S/N"} - ${data.bairro}, ${data.municipio}/${data.uf} - ${data.cep}` : 
          prev.address,
      }));

      toast.success("Dados da empresa carregados com sucesso!");
    } catch (error) {
      toast.error("Erro ao buscar dados do CNPJ. Verifique o número informado.");
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  const handleDocumentChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    let formattedValue = cleanValue;

    if (formData.type === "company") {
      // Format CNPJ: XX.XXX.XXX/XXXX-XX
      formattedValue = cleanValue
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18);
    } else {
      // Format CPF: XXX.XXX.XXX-XX
      formattedValue = cleanValue
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2')
        .substring(0, 14);
    }

    setFormData({ ...formData, document: formattedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    // Validate document if provided
    if (formData.document) {
      const cleanDoc = formData.document.replace(/\D/g, '');
      if (formData.type === "company" && cleanDoc.length !== 14) {
        toast.error("CNPJ deve ter 14 dígitos");
        return;
      }
      if (formData.type === "person" && cleanDoc.length !== 11) {
        toast.error("CPF deve ter 11 dígitos");
        return;
      }
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="card-header">
          <h3 className="text-lg font-semibold">
            {person ? "Editar Pessoa" : "Nova Pessoa"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="card-body space-y-4">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any, document: "" })}
              className="select-field"
            >
              <option value="person">Pessoa Física</option>
              <option value="company">Pessoa Jurídica</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder={formData.type === "company" ? "Razão social da empresa" : "Nome completo"}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">
                {formData.type === "company" ? "CNPJ" : "CPF"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  className="input-field flex-1"
                  placeholder={formData.type === "company" ? "00.000.000/0000-00" : "000.000.000-00"}
                />
                {formData.type === "company" && formData.document.replace(/\D/g, '').length === 14 && (
                  <button
                    type="button"
                    onClick={() => fetchCNPJData(formData.document)}
                    disabled={isLoadingCNPJ}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {isLoadingCNPJ ? "..." : "Buscar"}
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              placeholder="Rua, número - bairro, cidade/UF - CEP"
            />
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
            <button type="submit" className="btn-primary flex-1" disabled={isLoadingCNPJ}>
              {person ? "Atualizar" : "Criar"}
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

function PersonDetails({ person, history, onBack }: any) {
  const [activeTab, setActiveTab] = useState("payable");

  if (!history) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "payable", label: "A Pagar", count: history.payables?.length || 0 },
    { id: "receivable", label: "A Receber", count: history.receivables?.length || 0 },
    { id: "loans", label: "Empréstimos", count: history.loans?.length || 0 },
    { id: "purchases", label: "Cartão", count: history.purchases?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Voltar
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl">
              {person.type === "person" ? "👤" : "🏢"}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{person.name}</h2>
            <p className="text-gray-600 capitalize">{person.type === "person" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
            {person.document && (
              <p className="text-sm text-gray-500">
                {person.type === "company" ? "CNPJ" : "CPF"}: {formatDocument(person.document)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      {(person.email || person.phone || person.address) && (
        <div className="card">
          <div className="card-body">
            <h3 className="font-medium text-gray-900 mb-3">Informações de Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {person.email && (
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p>{person.email}</p>
                </div>
              )}
              {person.phone && (
                <div>
                  <span className="font-medium text-gray-600">Telefone:</span>
                  <p>{person.phone}</p>
                </div>
              )}
              {person.address && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Endereço:</span>
                  <p>{person.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div className="card">
        <div className="card-body">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Saldo Total</h3>
            <div className={`text-3xl font-bold ${
              person.totalBalance > 0 ? "text-green-600" : 
              person.totalBalance < 0 ? "text-red-600" : "text-gray-600"
            }`}>
              {formatCurrency(person.totalBalance)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {person.totalBalance > 0 ? "Devem para você" : 
               person.totalBalance < 0 ? "Você deve" : "Sem pendências"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "payable" && (
          <HistoryList
            items={history.payables || []}
            type="payable"
            emptyMessage="Nenhuma conta a pagar encontrada"
          />
        )}
        {activeTab === "receivable" && (
          <HistoryList
            items={history.receivables || []}
            type="receivable"
            emptyMessage="Nenhuma conta a receber encontrada"
          />
        )}
        {activeTab === "loans" && (
          <HistoryList
            items={history.loans || []}
            type="loan"
            emptyMessage="Nenhum empréstimo encontrado"
          />
        )}
        {activeTab === "purchases" && (
          <HistoryList
            items={history.purchases || []}
            type="purchase"
            emptyMessage="Nenhuma compra no cartão encontrada"
          />
        )}
      </div>
    </div>
  );
}

function HistoryList({ items, type, emptyMessage }: any) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <div key={item._id} className="card">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.description}</h4>
                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                  {type === "loan" && (
                    <>
                      <span>Tipo: {item.type === "lent" ? "Emprestado" : "Tomado"}</span>
                      <span>Restante: {formatCurrency(item.remainingAmount)}</span>
                    </>
                  )}
                  {(type === "payable" || type === "receivable") && (
                    <>
                      <span>Vencimento: {formatDate(item.dueDate)}</span>
                      <span>Categoria: {item.category}</span>
                    </>
                  )}
                  {type === "purchase" && (
                    <>
                      <span>Parcelas: {item.paidInstallments}/{item.installments}</span>
                      <span>Data: {formatDate(item.purchaseDate)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {type === "loan" ? formatCurrency(item.totalAmount) : formatCurrency(item.amount || item.totalAmount)}
                </div>
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: "Pendente", class: "badge-warning" },
    paid: { label: "Pago", class: "badge-success" },
    received: { label: "Recebido", class: "badge-success" },
    overdue: { label: "Atrasado", class: "badge-danger" },
    active: { label: "Ativo", class: "badge-info" },
    completed: { label: "Concluído", class: "badge-success" },
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

function formatDocument(document: string): string {
  const cleanDoc = document.replace(/\D/g, '');
  
  if (cleanDoc.length === 14) {
    // Format CNPJ: XX.XXX.XXX/XXXX-XX
    return cleanDoc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  } else if (cleanDoc.length === 11) {
    // Format CPF: XXX.XXX.XXX-XX
    return cleanDoc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  return document;
}
