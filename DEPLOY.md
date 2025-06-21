# 🚀 Deploy para o Render

## Configuração do Deploy

### 1. Pré-requisitos
- Conta no Render.com
- Repositório Git configurado
- Banco de dados PostgreSQL (Supabase já configurado)

### 2. Configuração no Render

#### A. Criar novo Web Service
1. Acesse [render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório Git
4. Configure o serviço:

**Configurações Básicas:**
- **Name**: `amigo-do-povo`
- **Environment**: `Node`
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Root Directory**: `/` (deixe vazio)

**Build & Deploy:**
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

#### B. Variáveis de Ambiente
Configure as seguintes variáveis de ambiente:

```env
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
```

### 3. Deploy Automático

O Render irá:
1. Fazer build do frontend React
2. Copiar os arquivos para o backend
3. Instalar dependências
4. Iniciar o servidor

### 4. URLs de Acesso

- **Frontend**: `https://amigo-do-povo.onrender.com`
- **API**: `https://amigo-do-povo.onrender.com/api`
- **Health Check**: `https://amigo-do-povo.onrender.com/api/health`

### 5. Credenciais de Acesso

**Usuário Admin:**
- **Email**: `admin@amigodopovo.com`
- **Senha**: `101520_Amigo`

### 6. Monitoramento

- **Logs**: Acesse a aba "Logs" no dashboard do Render
- **Métricas**: Monitore CPU, memória e requisições
- **Deploy**: Histórico de deploys na aba "Deploys"

### 7. Troubleshooting

#### Problemas Comuns:

1. **Build falha**
   - Verifique se todas as dependências estão no package.json
   - Confirme se o Node.js versão está correta

2. **Erro de conexão com banco**
   - Verifique as variáveis de ambiente do banco
   - Confirme se o Supabase está acessível

3. **Frontend não carrega**
   - Verifique se o build do React foi gerado
   - Confirme se os arquivos estáticos estão sendo servidos

### 8. Atualizações

Para atualizar o sistema:
1. Faça push para o repositório Git
2. O Render fará deploy automático
3. Monitore os logs para confirmar sucesso

### 9. Backup

- **Banco de dados**: Configurado no Supabase
- **Código**: Versionado no Git
- **Arquivos**: Backup automático no Render

### 10. Segurança

- JWT_SECRET configurado
- CORS configurado para produção
- Rate limiting ativo
- Helmet.js para headers de segurança 