interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "people", label: "Pessoas", icon: "👥" },
    { id: "payable", label: "A Pagar", icon: "💸" },
    { id: "receivable", label: "A Receber", icon: "💰" },
    { id: "credit-card", label: "Cartão", icon: "💳" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center py-2 px-1 text-xs transition-colors ${
              activeTab === item.id
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600"
            }`}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
