import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { PeopleManager } from "./components/PeopleManager";
import { AccountsPayable } from "./components/AccountsPayable";
import { AccountsReceivable } from "./components/AccountsReceivable";
import { CreditCard } from "./components/CreditCard";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { Toaster } from "sonner";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">
      <AuthLoading>
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg animate-pulse">
              <span className="text-2xl font-bold text-white">N</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">NEXUS FINANCE</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-blue-200 mt-2">Carregando...</p>
          </div>
        </div>
      </AuthLoading>
      
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      
      <Authenticated>
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden bg-gradient-to-r from-blue-600 to-purple-600 border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-white hover:bg-white/20 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">N</span>
                  </div>
                  <h1 className="text-lg font-semibold text-white">NEXUS FINANCE</h1>
                </div>
                <SignOutButton />
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 lg:p-8">
                {activeTab === "dashboard" && <Dashboard />}
                {activeTab === "people" && <PeopleManager />}
                {activeTab === "payable" && <AccountsPayable />}
                {activeTab === "receivable" && <AccountsReceivable />}
                {activeTab === "credit-card" && <CreditCard />}
              </div>
            </div>

            {/* Footer */}
            <div className="hidden lg:block bg-white border-t border-gray-200 px-8 py-4">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <p>© 2024 NEXUS FINANCE. Todos os direitos reservados.</p>
                <p>Versão 1.0.0 - Gestão Financeira Inteligente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </Authenticated>
      
      <Toaster position="top-right" />
    </main>
  );
}
