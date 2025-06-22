# 🏛️ Sistema de Gestão - Associação Amigo do Povo

Sistema completo de gestão para a Associação Amigo do Povo, desenvolvido com Node.js/Express (backend) e React (frontend).

## 🚀 Funcionalidades

- **Gestão de Alunos**: Cadastro, edição e consulta de alunos
- **Atividades**: Controle de atividades oferecidas pela associação
- **Horários**: Gerenciamento de horários das atividades
- **Matrículas**: Controle de matrículas dos alunos nas atividades
- **Frequências**: Registro e controle de presença dos alunos
- **Mensalidades**: Gestão financeira e controle de pagamentos
- **Relatórios**: Geração de relatórios e dashboards
- **Importação/Exportação**: Funcionalidades de planilhas Excel/CSV

## 🛠️ Tecnologias

### Backend
- **Node.js** com Express
- **PostgreSQL** (Supabase)
- **JWT** para autenticação
- **Multer** para upload de arquivos
- **XLSX** para manipulação de planilhas

### Frontend
- **React** 18
- **React Router** para navegação
- **Axios** para requisições HTTP
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **React Hook Form** para formulários

## 📋 Pré-requisitos

- Node.js 18+ 
- npm 8+
- Conta no Supabase (banco de dados)
- Conta no Render (deploy)

## 🚀 Deploy no Render

### 1. Preparação do Repositório

Certifique-se de que seu código está no GitHub:

```bash
git add .
git commit -m "Deploy: Sistema pronto para produção"
git push origin main
```

### 2. Configuração no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New Web Service"**
3. Conecte seu repositório GitHub
4. Configure o serviço:

**Configurações Básicas:**
- **Name**: `amigo-do-povo`
- **Environment**: `Node`
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
DB_HOST=db.sfmupywgitezmkdsmvxt.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=DHWo17JPNKmYcv9p
JWT_SECRET=amigo_do_povo_jwt_secret_2024_super_secure_key_12345
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://amigo-do-povo.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
UPLOAD_MAX_SIZE=5242880
```

### 3. Deploy Automático

O Render fará o deploy automaticamente quando você fizer push para o branch `main`.

## 🏃‍♂️ Desenvolvimento Local

### 1. Clone o repositório

```bash
git clone https://github.com/arabeuna/amigo-do-povo.git
cd amigo-do-povo
```

### 2. Instale as dependências

```bash
npm run install:all
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e configure:

```bash
cp apps/backend/config.env.example apps/backend/config.env
```

Edite o `config.env` com suas configurações:

```env
NODE_ENV=development
PORT=5000
DB_HOST=db.sfmupywgitezmkdsmvxt.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=DHWo17JPNKmYcv9p
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
```

### 4. Execute o setup do banco

```bash
cd apps/backend
node setup-database.js
```

### 5. Inicie o desenvolvimento

```bash
# Terminal 1 - Backend
cd apps/backend
npm start

# Terminal 2 - Frontend
cd apps/frontend
npm start
```

## 📊 Estrutura do Projeto

```
amigo-do-povo/
├── apps/
│   ├── backend/
│   │   ├── controllers/     # Controladores da API
│   │   ├── middleware/      # Middlewares (auth, etc.)
│   │   ├── validations/     # Validações de dados
│   │   ├── config/          # Configurações do banco
│   │   ├── uploads/         # Arquivos enviados
│   │   └── server.js        # Servidor principal
│   └── frontend/
│       ├── src/
│       │   ├── components/  # Componentes React
│       │   ├── services/    # Serviços de API
│       │   └── contexts/    # Contextos React
│       └── public/          # Arquivos públicos
├── database/
│   └── schema.sql          # Schema do banco
├── render.yaml             # Configuração do Render
└── package.json            # Scripts principais
```

## 🔐 Acesso ao Sistema

### Credenciais Padrão
- **Email**: `admin@amigodopovo.com`
- **Senha**: `101520_Amigo`

## 📱 Funcionalidades Principais

### Dashboard
- Visão geral do sistema
- Estatísticas de alunos, atividades e mensalidades
- Gráficos e relatórios

### Gestão de Alunos
- Cadastro completo com dados pessoais
- Importação/exportação via planilhas
- Histórico de matrículas

### Atividades
- Cadastro de atividades oferecidas
- Controle de vagas e instrutores
- Múltiplos horários por atividade

### Horários
- Gerenciamento de horários das atividades
- Controle de disponibilidade
- Importação/exportação de horários

### Frequências
- Registro de presença dos alunos
- Controle por atividade e data
- Relatórios de frequência

### Mensalidades
- Controle financeiro completo
- Geração automática de mensalidades
- Registro de pagamentos
- Relatórios financeiros

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                    # Inicia backend e frontend
npm run dev:backend           # Apenas backend
npm run dev:frontend          # Apenas frontend

# Produção
npm run build                 # Build completo
npm start                     # Inicia em produção

# Manutenção
npm run install:all          # Instala todas as dependências
npm run clean                # Limpa builds
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verifique as credenciais no `config.env`
   - Confirme se o Supabase está ativo

2. **Erro de CORS**
   - Verifique se `CORS_ORIGIN` está configurado corretamente
   - Em desenvolvimento: `http://localhost:3000`

3. **Erro de build no Render**
   - Verifique se todas as dependências estão no `package.json`
   - Confirme se os scripts de build estão corretos

4. **Erro de autenticação**
   - Verifique se `JWT_SECRET` está configurado
   - Confirme se o token não expirou

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Este projeto é desenvolvido para a Associação Amigo do Povo. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para a Associação Amigo do Povo** 