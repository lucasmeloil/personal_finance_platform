# Contribuindo para o NEXUS FINANCE

Obrigado por considerar contribuir para o NEXUS FINANCE! 🎉

## Como Contribuir

### 1. Reportar Bugs
- Use o sistema de Issues do GitHub
- Descreva o problema detalhadamente
- Inclua passos para reproduzir o bug
- Adicione screenshots se necessário

### 2. Sugerir Funcionalidades
- Abra uma Issue com a tag "enhancement"
- Descreva a funcionalidade desejada
- Explique por que seria útil
- Considere a implementação

### 3. Contribuir com Código

#### Setup do Ambiente
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/nexus-finance.git
cd nexus-finance

# Instale dependências
npm install

# Configure o Convex
npx convex dev

# Execute o projeto
npm run dev
```

#### Processo de Desenvolvimento
1. Fork o projeto
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
3. Faça suas alterações
4. Teste suas mudanças
5. Commit com mensagens claras:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade X"
   ```
6. Push para sua branch:
   ```bash
   git push origin feature/nova-funcionalidade
   ```
7. Abra um Pull Request

### 4. Padrões de Código

#### TypeScript
- Use TypeScript para todos os arquivos
- Defina tipos explícitos quando necessário
- Evite `any` sempre que possível

#### React
- Use componentes funcionais com hooks
- Mantenha componentes pequenos e focados
- Use nomes descritivos para componentes

#### Styling
- Use TailwindCSS para estilização
- Mantenha classes organizadas
- Use as classes customizadas definidas no projeto

#### Convex
- Valide todos os argumentos das funções
- Use tipos apropriados do Convex
- Mantenha funções focadas e pequenas

### 5. Testes
- Teste suas funcionalidades manualmente
- Verifique responsividade
- Teste em diferentes navegadores

### 6. Documentação
- Atualize o README se necessário
- Documente novas funcionalidades
- Use comentários quando apropriado

## Estrutura do Projeto

```
nexus-finance/
├── src/
│   ├── components/          # Componentes React
│   ├── lib/                # Utilitários
│   └── ...
├── convex/                 # Backend Convex
│   ├── schema.ts          # Schema do banco
│   ├── auth.ts            # Configuração de auth
│   └── ...
├── public/                # Arquivos estáticos
└── ...
```

## Diretrizes de Commit

Use o padrão Conventional Commits:

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação, sem mudança de código
- `refactor:` refatoração de código
- `test:` adição de testes
- `chore:` tarefas de manutenção

## Código de Conduta

- Seja respeitoso e inclusivo
- Aceite feedback construtivo
- Foque no que é melhor para a comunidade
- Mantenha discussões profissionais

## Dúvidas?

- Abra uma Issue para discussão
- Entre em contato: contato@nexusfinance.app

Obrigado por contribuir! 🚀
