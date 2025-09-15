# Maramores - Upload de Imagens

Uma interface moderna e elegante para upload sequencial de imagens com integração ao n8n webhook.

## 🎨 Características

- **Design Moderno**: Interface com paleta de cores escura e gradientes neon púrpura-rosa
- **Upload Sequencial**: Envio de imagens uma por vez com barra de progresso
- **Drag & Drop**: Arraste e solte imagens diretamente na área de upload
- **Preview de Imagens**: Visualização das imagens selecionadas antes do envio
- **Validação**: Verificação de tipo e tamanho de arquivo
- **Responsivo**: Funciona perfeitamente em desktop e mobile

## 🚀 Como Usar

### **Deploy na Vercel (Recomendado)**

1. **Instale a Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Faça login na Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy do projeto**:
   ```bash
   vercel --prod
   ```

4. **Configure o webhook** (se necessário):
   - O webhook já está configurado como `https://n8n.remotedok.fun/form/REPLACE_WITH_YOUR_WEBHOOK_ID`
   - Substitua `REPLACE_WITH_YOUR_WEBHOOK_ID` pelo seu ID real se necessário

### **Uso Local**

1. **Abra o arquivo**:
   - Abra o arquivo `index.html` em qualquer navegador moderno

2. **Upload de Imagens**:
   - Digite o nome da propriedade
   - Clique na área de upload ou arraste imagens
   - Visualize as imagens selecionadas
   - Clique em "ENVIAR IMAGENS"

## 📋 Funcionalidades

### Campos de Entrada
- **Nome da Propriedade**: Campo obrigatório para identificar a propriedade
- **Seleção de Imagens**: Múltiplas imagens com preview

### Validações
- Tipos permitidos: PNG, JPG, JPEG
- Tamanho máximo: 10MB por imagem
- Nome da propriedade obrigatório

### Envio de Dados
Cada imagem é enviada individualmente com os seguintes dados:
- `image`: Arquivo da imagem
- `propertyName`: Nome da propriedade
- `sequenceNumber`: Número sequencial da imagem
- `fileName`: Nome do arquivo
- `fileSize`: Tamanho do arquivo
- `fileType`: Tipo MIME do arquivo

## 🎯 Atalhos de Teclado

- **Ctrl/Cmd + Enter**: Enviar formulário
- **Escape**: Limpar seleção de arquivos
- **Ctrl/Cmd + V**: Colar imagens da área de transferência

## 🛠️ Tecnologias Utilizadas

- HTML5
- CSS3 (com gradientes e animações)
- JavaScript ES6+
- Font Awesome (ícones)
- Fetch API para requisições HTTP

## 📱 Responsividade

A interface se adapta automaticamente a diferentes tamanhos de tela:
- Desktop: Layout completo com grid de imagens
- Mobile: Layout otimizado para telas pequenas

## 🎨 Paleta de Cores

- **Fundo**: Gradiente escuro (azul-púrpura)
- **Container**: Púrpura-cinza escuro com transparência
- **Acentos**: Gradiente púrpura-rosa neon
- **Texto**: Cinza claro para legibilidade
- **Bordas**: Púrpura translúcido

## 🔧 Personalização

Para personalizar a interface, edite os seguintes arquivos:
- `styles.css`: Cores, layout e animações
- `script.js`: Lógica de upload e validações
- `index.html`: Estrutura e elementos da interface

## 📝 Notas Importantes

- Certifique-se de que o webhook do n8n está configurado corretamente
- O upload é sequencial para melhor controle de progresso
- As imagens são validadas antes do envio
- A interface mostra feedback visual durante todo o processo

## 🔐 Configuração de Variáveis de Ambiente

### **Proteção do Webhook URL**

Para manter seu webhook URL seguro e não expor no GitHub:

1. **Copie o arquivo de exemplo**:
   ```bash
   cp env.example .env
   ```

2. **Edite o arquivo `.env`** com seu webhook real:
   ```env
   WEBHOOK_URL=https://n8n.remotedok.fun/form/SEU_WEBHOOK_ID_REAL
   ```

3. **O arquivo `.env` está no `.gitignore`** - não será commitado no GitHub

## 🚀 Deploy na Vercel

### **Opção 1 - Deploy Local com Build**

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env
# Edite o .env com seu webhook real

# Build com variáveis de ambiente
npm run build

# Deploy
vercel --prod
```

### **Opção 2 - Deploy via GitHub + Vercel**

1. **Configure as variáveis de ambiente na Vercel**:
   - Acesse seu projeto na Vercel
   - Vá em Settings → Environment Variables
   - Adicione: `WEBHOOK_URL` = `https://n8n.remotedok.fun/form/SEU_WEBHOOK_ID_REAL`

2. **Faça push para GitHub**:
   ```bash
   git add .
   git commit -m "Add environment variables support"
   git push origin main
   ```

3. **Deploy automático** - A Vercel vai usar as variáveis de ambiente configuradas

### **Opção 3 - Deploy Direto**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login na Vercel
vercel login

# Deploy (vai usar as variáveis do .env local)
vercel --prod
```
