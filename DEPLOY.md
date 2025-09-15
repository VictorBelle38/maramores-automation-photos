# 🚀 Guia de Deploy - Maramores Upload

## 🔐 Configuração Segura do Webhook

### **Problema Resolvido:**
- ✅ Webhook URL não fica mais visível no GitHub
- ✅ Variáveis de ambiente configuradas
- ✅ Build automático com substituição de variáveis

## 📋 Passos para Deploy

### **1. Configuração Local**

```bash
# 1. Clone o repositório
git clone SEU_REPOSITORIO
cd maramores-automation-photos

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp env.example .env

# 4. Edite o arquivo .env com seu webhook real
# WEBHOOK_URL=https://n8n.remotedok.fun/form/SEU_WEBHOOK_ID_REAL
```

### **2. Deploy na Vercel (Recomendado)**

#### **Opção A: Deploy via GitHub + Vercel**

1. **Configure as variáveis na Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Vá em seu projeto → Settings → Environment Variables
   - Adicione: `WEBHOOK_URL` = `https://n8n.remotedok.fun/form/SEU_WEBHOOK_ID_REAL`

2. **Push para GitHub:**
   ```bash
   git add .
   git commit -m "Add environment variables support"
   git push origin main
   ```

3. **Deploy automático** - A Vercel detecta as mudanças e faz deploy

#### **Opção B: Deploy Local**

```bash
# Build com variáveis de ambiente
npm run build

# Deploy
vercel --prod
```

### **3. Deploy Manual (Alternativo)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 🔒 Segurança

### **O que está protegido:**
- ✅ Arquivo `.env` não é commitado (está no `.gitignore`)
- ✅ Webhook URL não aparece no código público
- ✅ Variáveis são injetadas apenas durante o build/deploy

### **Arquivos importantes:**
- `env.example` - Template público (sem dados reais)
- `.env` - Suas configurações reais (não commitado)
- `build.js` - Script que substitui as variáveis
- `.gitignore` - Protege arquivos sensíveis

## 🛠️ Estrutura do Projeto

```
maramores-automation-photos/
├── index.html          # Interface principal
├── build.js           # Script de build
├── package.json       # Dependências e scripts
├── vercel.json        # Configuração Vercel
├── env.example        # Template de variáveis
├── .env              # Suas variáveis (não commitado)
├── .gitignore        # Arquivos ignorados
└── README.md         # Documentação
```

## 🎯 Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Deploy completo
npm run deploy

# Verificar variáveis
echo $WEBHOOK_URL
```

## ⚠️ Importante

1. **Nunca commite o arquivo `.env`**
2. **Sempre use o `env.example` como template**
3. **Configure as variáveis na Vercel para deploy automático**
4. **Teste localmente antes do deploy**

## 🆘 Troubleshooting

### **Problema: Webhook não funciona**
- Verifique se a variável `WEBHOOK_URL` está configurada
- Confirme se o webhook ID está correto
- Teste o webhook diretamente no n8n

### **Problema: Deploy falha**
- Verifique se todas as dependências estão instaladas
- Confirme se as variáveis de ambiente estão configuradas
- Veja os logs da Vercel para mais detalhes

### **Problema: Variáveis não carregam**
- Verifique se o arquivo `.env` existe
- Confirme se o `build.js` está sendo executado
- Teste localmente com `npm run build`
