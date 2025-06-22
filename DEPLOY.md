# 🚀 Guia de Deploy - Sistema Amigo do Povo

Este guia detalha o processo de deploy do sistema no Render.

## 📋 Pré-requisitos

1. **Conta no GitHub** com o código do projeto
2. **Conta no Render** ([render.com](https://render.com))
3. **Banco PostgreSQL** (recomendamos Supabase)

## 🔧 Configuração do Banco de Dados

### Opção 1: Supabase (Recomendado)

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings > Database**
4. Copie as credenciais de conexão

### Opção 2: Render PostgreSQL

1. No Render, crie um **PostgreSQL Database**
2. Use as credenciais fornecidas

## 🚀 Deploy no Render

### Passo 1: Preparar o Repositório

```bash
# Certifique-se de que o código está no GitHub
git add .
git commit -m "Deploy: Sistema pronto para produção"
git push origin main
```

### Passo 2: Criar o Serviço no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New Web Service"**
3. Conecte seu repositório GitHub
4. Selecione o repositório `amigo-do-povo`

### Passo 3: Configurar o Serviço

**Configurações Básicas:**
- **Name**: `amigo-do-povo`
- **Environment**: `Node`
- **Region**: `Oregon (US West)` (ou mais próxima)
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### Passo 4: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Ambiente de produção |
| `PORT` | `10000` | Porta do servidor |
| `DB_HOST` | `db.sfmupywgitezmkdsmvxt.supabase.co` | Host do banco |
| `DB_PORT` | `5432` | Porta do banco |
| `DB_NAME` | `postgres` | Nome do banco |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `DHWo17JPNKmYcv9p` | Senha do banco |
| `JWT_SECRET` | `amigo_do_povo_jwt_secret_2024_super_secure_key_12345` | Chave JWT |
| `JWT_EXPIRES_IN` | `24h` | Expiração do token |
| `CORS_ORIGIN` | `https://amigo-do-povo.onrender.com` | Origem permitida |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Janela de rate limit |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Máximo de requisições |
| `LOG_LEVEL` | `info` | Nível de log |
| `UPLOAD_MAX_SIZE` | `5242880` | Tamanho máximo de upload |

### Passo 5: Configurar Health Check

- **Health Check Path**: `/api/health`
- **Auto Deploy**: ✅ Habilitado

### Passo 6: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build e deploy (5-10 minutos)
3. O sistema estará disponível em: `https://amigo-do-povo.onrender.com`

## 🔍 Verificação do Deploy

### 1. Testar Health Check

```bash
curl https://amigo-do-povo.onrender.com/api/health
```

Resposta esperada:
```json
{
  "success": true,
  "message": "Sistema funcionando",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Testar Acesso ao Sistema

1. Acesse: `https://amigo-do-povo.onrender.com`
2. Faça login com as credenciais padrão:
   - **Email**: `admin@amigodopovo.com`
   - **Senha**: `101520_Amigo`

### 3. Verificar Funcionalidades

- ✅ Dashboard carrega
- ✅ Lista de alunos funciona
- ✅ Atividades são exibidas
- ✅ Frequências podem ser registradas
- ✅ Mensalidades são listadas

## 🛠️ Troubleshooting

### Problema: Build Falha

**Sintomas:**
- Build falha no Render
- Erro de dependências

**Solução:**
1. Verifique se todas as dependências estão no `package.json`
2. Confirme se os scripts de build estão corretos
3. Verifique se o Node.js 18+ está sendo usado

### Problema: Erro de Conexão com Banco

**Sintomas:**
- Sistema não carrega
- Erro 500 no health check

**Solução:**
1. Verifique as credenciais do banco
2. Confirme se o banco está ativo
3. Teste a conexão localmente

### Problema: CORS Error

**Sintomas:**
- Erro de CORS no frontend
- API não responde

**Solução:**
1. Verifique se `CORS_ORIGIN` está correto
2. Confirme se a URL do Render está na lista de origens permitidas

### Problema: Erro de Autenticação

**Sintomas:**
- Login não funciona
- Token inválido

**Solução:**
1. Verifique se `JWT_SECRET` está configurado
2. Confirme se o token não expirou
3. Teste com as credenciais padrão

## 📊 Monitoramento

### Logs do Render

1. Acesse o dashboard do Render
2. Vá em **Logs** no seu serviço
3. Monitore os logs em tempo real

### Métricas Importantes

- **Uptime**: Deve estar próximo de 100%
- **Response Time**: Deve ser < 2s
- **Error Rate**: Deve ser < 1%

## 🔄 Atualizações

### Deploy Automático

O Render fará deploy automático quando você fizer push para o branch `main`.

### Deploy Manual

1. Vá no dashboard do Render
2. Clique em **"Manual Deploy"**
3. Selecione o branch desejado

## 🔒 Segurança

### Variáveis Sensíveis

- Nunca commite senhas no código
- Use variáveis de ambiente do Render
- Rotacione as chaves JWT periodicamente

### Rate Limiting

O sistema tem rate limiting configurado:
- 100 requisições por 15 minutos por IP
- Proteção contra ataques de força bruta

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** no dashboard do Render
2. **Teste localmente** para isolar o problema
3. **Consulte a documentação** do Render
4. **Entre em contato** com a equipe de desenvolvimento

---

**Última atualização**: Janeiro 2024 