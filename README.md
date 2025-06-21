# 🏠 Sistema de Gestão - Associação Amigo do Povo

Sistema completo de gestão para a Associação Amigo do Povo, incluindo controle de alunos, atividades, frequências e mensalidades.

## 🚀 Deploy Rápido

### Deploy no Render (Recomendado)

1. **Fork ou clone este repositório**
2. **Acesse [render.com](https://render.com)**
3. **Crie um novo Web Service**
4. **Configure as variáveis de ambiente** (veja `DEPLOY.md`)
5. **Deploy automático!**

**URL do sistema**: `https://amigo-do-povo.onrender.com`

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL ou Supabase
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/arabeuna/amigo-do-povo.git
cd amigo-do-povo

# Instale as dependências
npm run install:all

# Configure o banco de dados
cp apps/backend/config.env.example apps/backend/config.env
# Edite o arquivo config.env com suas credenciais

# Execute o setup do banco
cd apps/backend && node setup-database.js

# Inicie os servidores
npm run dev
```

### URLs de Desenvolvimento
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API**: http://localhost:5000/api

## 📋 Funcionalidades

### 👥 Gestão de Alunos
- Cadastro completo de alunos
- Busca e filtros avançados
- Importação/exportação em Excel/CSV
- Histórico de matrículas

### 🎯 Gestão de Atividades
- Criação e edição de atividades
- Controle de vagas
- Tipos de atividades
- Importação/exportação

### 📊 Controle de Frequência
- Registro de presença
- Relatórios de frequência
- Registro em lote
- Exportação de dados

### 💰 Gestão de Mensalidades
- Geração automática de mensalidades
- Controle de pagamentos
- Relatórios financeiros
- Importação/exportação

### 📈 Relatórios
- Dashboard com métricas
- Relatórios detalhados
- Exportação de dados
- Gráficos e estatísticas

## 🔧 Tecnologias

### Backend
- **Node.js** + **Express**
- **PostgreSQL** (Supabase)
- **JWT** para autenticação
- **Multer** para uploads
- **ExcelJS** para planilhas

### Frontend
- **React** 18
- **React Router** para navegação
- **Tailwind CSS** para estilização
- **Axios** para requisições
- **Recharts** para gráficos

## 🔐 Segurança

- Autenticação JWT
- Rate limiting
- Validação de dados
- Headers de segurança (Helmet)
- CORS configurado

## 📱 Responsivo

Interface totalmente responsiva, funcionando em:
- Desktop
- Tablet
- Mobile

## 🚀 Deploy

Veja o arquivo `DEPLOY.md` para instruções detalhadas de deploy.

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes. 