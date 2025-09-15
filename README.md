# Maramores Automation Photos

Interface moderna para upload de imagens com integração n8n, construída com **React + Vite + Tailwind CSS** para melhor experiência de desenvolvimento e UI/UX.

## 🚀 Tecnologias

- **React 18**: Interface de usuário moderna e reativa
- **Vite**: Build tool ultra-rápido com hot reload
- **Tailwind CSS 3.4.17**: Estilização utilitária e responsiva
- **Paleta de cores moderna**: Design elegante e profissional

## ✨ Vantagens da nova arquitetura

- **🔥 Hot Reload**: Mudanças refletem instantaneamente no navegador
- **⚡ Build otimizado**: Código minificado e otimizado para produção
- **🎨 UI/UX melhorado**: Design moderno com animações suaves
- **📱 Totalmente responsivo**: Funciona perfeitamente em todos os dispositivos
- **🎯 Componentes reutilizáveis**: Código organizado e modular
- **🌙 Paleta de cores elegante**: Azul, roxo e laranja harmoniosos
- **✨ Animações fluidas**: Transições e efeitos visuais modernos

## 📁 Estrutura do Projeto

```
src/
├── components/
│   └── ImageUploader.jsx     # Componente principal do uploader
├── styles/
│   └── main.css              # Estilos Tailwind CSS
├── App.jsx                   # Componente principal da aplicação
└── main.jsx                  # Ponto de entrada React
```

## 🛠️ Desenvolvimento

### Instalação

```bash
# Instalar dependências
npm install

# Ou usar o package-vite.json
npm install --package-lock-only
```

### Executar em desenvolvimento

```bash
npm run dev
```

- Abre automaticamente em `http://localhost:3000`
- Hot reload ativo
- Console logs detalhados

### Build para produção

```bash
npm run build
```

### Preview da build

```bash
npm run preview
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` baseado no `.env.example`:

```bash
# .env.local
VITE_WEBHOOK_URL=https://seu-webhook-n8n.com/form/123
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_TYPES=image/jpeg,image/jpg,image/png
```

### Deploy na Vercel

1. **Configure as variáveis de ambiente na Vercel:**

   - `VITE_WEBHOOK_URL`: Sua URL do webhook n8n
   - `VITE_MAX_FILE_SIZE`: Tamanho máximo em bytes
   - `VITE_ALLOWED_TYPES`: Tipos permitidos separados por vírgula

2. **Deploy:**
   ```bash
   npm run deploy
   ```

## 🎨 Melhorias de UI/UX

### Recursos implementados:

- ✅ **Design responsivo** com breakpoints otimizados
- ✅ **Animações suaves** e transições elegantes
- ✅ **Feedback visual** para drag & drop
- ✅ **Validação em tempo real** dos arquivos
- ✅ **Mensagens de erro dinâmicas** baseadas nas configurações
- ✅ **Atalhos de teclado** (Ctrl+Enter, Escape)
- ✅ **Suporte a colar imagens** (Ctrl+V)
- ✅ **Preview de imagens** com opção de remover
- ✅ **Barra de progresso** animada
- ✅ **Estados de loading** e feedback visual

### Próximas melhorias sugeridas:

- 🔄 **Upload progressivo** com retry automático
- 🔄 **Compressão de imagens** antes do upload
- 🔄 **Drag & drop melhorado** com zonas específicas
- 🔄 **Notificações toast** para feedback
- 🔄 **Tema escuro/claro** toggle
- 🔄 **Histórico de uploads** local
- 🔄 **Validação de imagem** com preview de metadados

## 🔄 Migração da versão HTML puro

Para migrar da versão HTML puro:

1. **Backup** da versão atual
2. **Substitua** os arquivos pelos da versão Vite
3. **Configure** as variáveis de ambiente
4. **Teste** localmente com `npm run dev`
5. **Deploy** na Vercel

## 📝 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview da build
- `npm run deploy` - Build + deploy na Vercel

## 🐛 Troubleshooting

### Problemas comuns:

1. **Variáveis de ambiente não funcionam:**

   - Certifique-se de usar prefixo `VITE_`
   - Reinicie o servidor de desenvolvimento

2. **Hot reload não funciona:**

   - Verifique se está usando `npm run dev`
   - Limpe o cache do navegador

3. **Build falha:**
   - Verifique se todas as dependências estão instaladas
   - Verifique se não há erros de sintaxe

## 🚀 Próximos Passos

1. **Teste a versão Vite** localmente
2. **Configure as variáveis** de ambiente
3. **Faça o deploy** na Vercel
4. **Compare** com a versão anterior
5. **Implemente melhorias** adicionais conforme necessário
