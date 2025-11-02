# NEXUS FINANCE 💰

**Plataforma Completa de Gestão Financeira**

NEXUS FINANCE é uma aplicação web moderna e intuitiva para gerenciamento financeiro pessoal, desenvolvida com React, TypeScript e Convex. Gerencie suas finanças de forma inteligente e eficiente.

## ✨ Funcionalidades

### 📊 Dashboard Inteligente
- Visão geral completa das suas finanças
- Resumo de contas a pagar e receber
- Alertas de vencimentos próximos
- Indicadores de contas em atraso
- Atividade financeira recente

### 👥 Gestão de Pessoas
- Cadastro completo de contatos
- Controle de saldos individuais
- Histórico de transações por pessoa
- Integração com WhatsApp para cobranças

### 💸 Contas a Pagar
- Registro de todas as suas obrigações
- Categorização inteligente
- Controle de status (pendente, pago, atrasado)
- Lembretes automáticos de vencimento

### 💰 Contas a Receber
- Gestão de direitos financeiros
- Acompanhamento de recebimentos
- Controle de inadimplência
- Relatórios detalhados

### 💳 Cartão de Crédito
- Controle de compras parceladas
- Gestão de compras de terceiros
- Acompanhamento de parcelas
- Notificações de vencimento
- Integração WhatsApp para cobrança

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + CSS personalizado
- **Backend**: Convex (Database + Real-time + Auth)
- **Autenticação**: Convex Auth
- **Notificações**: Sonner
- **Deploy**: Netlify Ready

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Convex

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/nexus-finance.git
cd nexus-finance
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Convex
```bash
# Instale o Convex CLI globalmente
npm install -g convex

# Faça login no Convex
npx convex login

# Configure o projeto
npx convex dev
```

### 4. Execute o projeto
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 📦 Deploy

### Netlify
1. Conecte seu repositório GitHub ao Netlify
2. Configure as variáveis de ambiente:
   - `VITE_CONVEX_URL`: URL do seu deployment Convex
3. Build command: `npm run build`
4. Publish directory: `dist`

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_CONVEX_URL=https://seu-deployment.convex.cloud
CONVEX_DEPLOYMENT=seu-deployment-name
```

## 🎨 Características do Design

- **Interface Moderna**: Design clean e profissional
- **Responsivo**: Funciona perfeitamente em desktop e mobile
- **Tema Personalizado**: Gradientes azul/roxo com efeitos visuais
- **Animações Suaves**: Transições e efeitos que melhoram a UX
- **Glassmorphism**: Efeitos de vidro modernos
- **Dark Mode Ready**: Preparado para modo escuro

## 📱 Funcionalidades Mobile

- Menu lateral responsivo
- Navegação inferior no mobile
- Touch gestures otimizados
- Interface adaptada para telas pequenas

## 🔐 Segurança

- Autenticação segura via Convex Auth
- Dados isolados por usuário
- Validação de dados no frontend e backend
- Proteção contra acesso não autorizado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**NEXUS FINANCE Team**

- Website: [nexusfinance.app](https://nexusfinance.app)
- Email: contato@nexusfinance.app

## 🙏 Agradecimentos

- [Convex](https://convex.dev) - Backend as a Service
- [TailwindCSS](https://tailwindcss.com) - Framework CSS
- [React](https://reactjs.org) - Biblioteca JavaScript
- [Vite](https://vitejs.dev) - Build tool

---

⭐ **Se este projeto te ajudou, deixe uma estrela no GitHub!**

**NEXUS FINANCE - Gestão Financeira Inteligente** 🚀
