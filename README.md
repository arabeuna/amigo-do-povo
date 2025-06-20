# 🏛️ Sistema Amigo do Povo

Sistema completo de gestão para a Associação Amigo do Povo, desenvolvido com React, Node.js e PostgreSQL.

## 📋 Funcionalidades

### 🔐 Autenticação e Usuários
- Login seguro com JWT
- Controle de permissões por perfil (Admin, Instrutor, Financeiro, Aluno)
- Alteração de senha
- Logout automático

### 👥 Gestão de Alunos
- Cadastro completo de alunos
- Dados pessoais, endereço e contatos
- Vinculação com responsáveis
- Busca e filtros avançados
- Paginação

### 🎯 Atividades e Matrículas
- Cadastro de atividades (Dança, Natação, Informática, etc.)
- Controle de vagas e horários
- Matrícula de alunos em múltiplas atividades
- Status de matrícula (ativa, inativa, cancelada)

### ✅ Controle de Frequência
- Registro de presença por data e atividade
- Visualização em grade horária
- Justificativas de ausência
- Relatórios de frequência

### 💰 Gestão Financeira
- Lançamento automático de mensalidades
- Controle de pagamentos
- Status de mensalidades (pendente, pago, atrasado)
- Relatórios financeiros

### 📊 Relatórios e Exportação
- Dashboard com estatísticas
- Exportação para Excel/CSV
- Relatórios personalizados
- Gráficos e métricas

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento da aplicação
- **Axios** - Cliente HTTP
- **React Hook Form** - Gerenciamento de formulários
- **React Hot Toast** - Notificações
- **Lucide React** - Ícones
- **Recharts** - Gráficos
- **XLSX** - Exportação para Excel

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação
- **Bcrypt** - Criptografia de senhas
- **Express Validator** - Validação de dados
- **Helmet** - Segurança
- **CORS** - Cross-origin resource sharing

### Banco de Dados
- **PostgreSQL** - Banco de dados principal
- **UUID** - Identificadores únicos
- **Triggers** - Atualizações automáticas
- **Índices** - Performance otimizada

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 16+ 
- PostgreSQL 12+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd amigo-do-povo
```

### 2. Instale as dependências
```bash
# Instalar dependências do projeto principal
npm install

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3. Configure o banco de dados

#### 3.1 Crie o banco PostgreSQL
```sql
CREATE DATABASE amigo_do_povo;
CREATE USER amigo_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE amigo_do_povo TO amigo_user;
```

#### 3.2 Execute o schema
```bash
# Conecte ao banco e execute o arquivo schema.sql
psql -U amigo_user -d amigo_do_povo -f database/schema.sql
```

### 4. Configure as variáveis de ambiente

#### 4.1 Backend (.env)
```bash
cd backend
cp config.env.example .env
```

Edite o arquivo `.env`:
```env
# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amigo_do_povo
DB_USER=amigo_user
DB_PASSWORD=sua_senha_aqui

# Configurações do JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_EXPIRES_IN=24h

# Configurações do Servidor
PORT=5000
NODE_ENV=development

# Configurações de CORS
CORS_ORIGIN=http://localhost:3000
```

#### 4.2 Frontend (.env)
```bash
cd frontend
```

Crie o arquivo `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Execute o sistema

#### 5.1 Desenvolvimento (ambos simultaneamente)
```bash
# Na raiz do projeto
npm run dev
```

#### 5.2 Ou execute separadamente

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

### 6. Acesse a aplicação
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## 👤 Credenciais Padrão

Após a instalação, você pode fazer login com:

- **Email:** admin@amigodopovo.com
- **Senha:** 101520_Amigo

## 📁 Estrutura do Projeto

```
amigo-do-povo/
├── backend/                 # API Node.js/Express
│   ├── config/             # Configurações
│   ├── controllers/        # Controladores da API
│   ├── middleware/         # Middlewares
│   ├── server.js           # Servidor principal
│   └── package.json
├── frontend/               # Aplicação React
│   ├── public/            # Arquivos públicos
│   ├── src/               # Código fonte
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Contextos (Auth, etc.)
│   │   ├── services/      # Serviços de API
│   │   └── App.jsx        # Componente principal
│   └── package.json
├── database/              # Scripts do banco
│   └── schema.sql         # Schema completo
├── package.json           # Scripts do projeto
└── README.md
```

## 🔧 Scripts Disponíveis

### Projeto Principal
```bash
npm run dev          # Executa backend e frontend simultaneamente
npm run server       # Executa apenas o backend
npm run client       # Executa apenas o frontend
npm run install-all  # Instala todas as dependências
npm run build        # Build do frontend para produção
```

### Backend
```bash
cd backend
npm run dev          # Desenvolvimento com nodemon
npm start            # Produção
npm test             # Executar testes
```

### Frontend
```bash
cd frontend
npm start            # Desenvolvimento
npm run build        # Build para produção
npm test             # Executar testes
```

## 🗄️ Banco de Dados

### Tabelas Principais
- **usuarios** - Usuários do sistema
- **alunos** - Cadastro de alunos
- **responsaveis** - Responsáveis pelos alunos
- **atividades** - Atividades oferecidas
- **matriculas** - Matrículas dos alunos
- **frequencias** - Controle de presença
- **mensalidades** - Controle financeiro
- **relatorios** - Histórico de relatórios

### Funcionalidades do Banco
- Triggers automáticos para `data_atualizacao`
- Função para gerar mensalidades automaticamente
- Índices otimizados para performance
- Constraints de integridade

## 🔒 Segurança

- Autenticação JWT
- Senhas criptografadas com bcrypt
- Rate limiting
- Headers de segurança (Helmet)
- Validação de dados
- CORS configurado

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop
- Tablet
- Mobile

## 🚀 Deploy

### Backend (Produção)
```bash
cd backend
npm run build
npm start
```

### Frontend (Produção)
```bash
cd frontend
npm run build
# Servir a pasta build com nginx ou similar
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato:
- Email: suporte@amigodopovo.com
- Telefone: (XX) XXXX-XXXX

---

**Desenvolvido com ❤️ para a Associação Amigo do Povo** 