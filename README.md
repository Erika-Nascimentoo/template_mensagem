# Meta Chat Template

Template completo de chat para Meta (WhatsApp) sem dependência de planos pagos do Bubble.

## 🚀 Funcionalidades

- ✅ Receber mensagens do WhatsApp via webhook
- ✅ Enviar mensagens via Meta Graph API
- ✅ Interface de chat em tempo real com React
- ✅ WebSocket para atualizações instantâneas
- ✅ Respostas automáticas configuráveis
- ✅ Histórico de mensagens
- ✅ Deploy gratuito (opcional)

## 📋 Pré-requisitos

- Node.js 16+
- Conta de Desenvolvedor Meta
- Número de WhatsApp Business

## 🛠️ Setup

### 1. Clonar e instalar dependências

```bash
# Backend
cd meta-chat-template
npm install

# Frontend
cd client
npm install
cd ..
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais da Meta
```

### 3. Obter credenciais da Meta

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie um novo aplicativo
3. Adicione o produto "WhatsApp"
4. Configure seu número de telefone
5. Obtenha:
   - **Access Token** (token de acesso permanente)
   - **Phone Number ID** 
   - **Webhook Verify Token** (defina você mesmo)

### 4. Configurar Webhook

No painel da Meta:
1. Vá para WhatsApp > Configuration
2. Adicione webhook URL: `https://seu-dominio.com/webhook/whatsapp`
3. Use o mesmo **Verify Token** do seu .env
4. Inscreva-se para o campo `messages`

## 🚀 Executar Localmente

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend  
npm run client
```

Acesse: http://localhost:3001

## 📱 Como Usar

1. **Receber mensagens**: Configure o webhook na Meta
2. **Enviar mensagens**: Use a interface web ou API
3. **Respostas automáticas**: Edite o array `responses` em `server.js`

## 🌐 Deploy Gratuito

### Opção 1: Render (Recomendado)

```bash
# Backend
git init
git add .
git commit -m "Initial commit"
git push https://github.com/seu-usuario/meta-chat-template.git

# Configure no Render:
# - Build Command: npm install
# - Start Command: npm start
# - Port: 3000
```

### Opção 2: Vercel (Frontend)

```bash
cd client
vercel --prod
```

## 📡 API Endpoints

### Webhook
- `GET /webhook/whatsapp` - Verificação do Meta
- `POST /webhook/whatsapp` - Receber mensagens

### API Interna
- `POST /api/send-message` - Enviar mensagem
- `GET /api/messages` - Histórico de mensagens
- `GET /health` - Health check

## 🔧 Configuração Avançada

### Respostas Automáticas

Edite o array `responses` em `server.js`:

```javascript
const responses = [
  'Olá! Recebi sua mensagem.',
  'Obrigado pelo contato!',
  'Em breve te respondo.'
];
```

### Banco de Dados

Para produção, substitua o array `messages` por um banco de dados:

```javascript
// Exemplo com MongoDB
const mongoose = require('mongoose');
const Message = require('./models/Message');

// Salvar mensagem
await Message.create(messageData);

// Buscar mensagens
const messages = await Message.find().sort({ timestamp: -1 });
```

## 🐛 Troubleshooting

### Webhook não funciona
- Verifique se o URL está acessível publicamente
- Confirme o Verify Token é idêntico
- Use ngrok para testes locais: `ngrok http 3000`

### Erro 403
- Verifique se o Access Token é válido
- Confirme se o Phone Number ID está correto

### Mensagens não chegam
- Verifique se o webhook está inscrito no campo `messages`
- Confirme se o número está verificado na Meta

## 📄 Licença

MIT License - use como quiser!

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique os logs do servidor
2. Teste o webhook com ferramentas online
3. Revise a configuração na Meta Console

---

**Pronto!** Você agora tem um template completo de chat para Meta WhatsApp sem depender do Bubble! 🎉
