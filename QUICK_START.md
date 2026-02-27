# 🚀 Início Rápido - Meta Chat Template

## 1. Instalação (5 minutos)

```bash
# 1. Instalar dependências do backend
npm install

# 2. Instalar dependências do frontend  
cd client
npm install
cd ..
```

## 2. Configurar Meta (10 minutos)

### Acessar Meta for Developers
1. Vá para https://developers.facebook.com/
2. Crie um novo aplicativo
3. Adicione o produto "WhatsApp"

### Obter Credenciais
No painel do WhatsApp, você precisará de:
- **Access Token** (gerar token permanente)
- **Phone Number ID** 
- **Webhook Verify Token** (escolha um, ex: "meu_token_secreto_123")

### Configurar .env
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
META_ACCESS_TOKEN=seu_access_token_aqui
META_PHONE_NUMBER_ID=seu_phone_id_aqui  
META_WEBHOOK_VERIFY_TOKEN=meu_token_secreto_123
```

## 3. Testar Localmente (2 minutos)

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
```

Acesse: http://localhost:3001

## 4. Configurar Webhook (5 minutos)

### Usar ngrok para testes
```bash
# Em outro terminal
ngrok http 3000
```

Copie a URL HTTPS (ex: https://abc123.ngrok.io)

### Configurar na Meta
1. Vá para WhatsApp > Configuration
2. Webhook URL: `https://abc123.ngrok.io/webhook/whatsapp`
3. Verify Token: `meu_token_secreto_123`
4. Clique em "Verify and Save"
5. Inscreva-se para o campo `messages`

## 5. Enviar Primeira Mensagem

1. Na interface web, digite um número de telefone (com +55)
2. Escreva uma mensagem
3. Clique em enviar

Pronto! 🎉 Seu chat WhatsApp está funcionando!

## 🆘 Problemas Comuns

**"Webhook verification failed"**
- Verifique se o ngrok está rodando
- Confirme o Verify Token é idêntico

**"Access token invalid"**  
- Gere um novo token na Meta Console
- Verifique se não expirou

**"Message not sent"**
- Confirme se o número está verificado na Meta
- Verifique se o destinatário respondeu primeiro (regra do WhatsApp)

## 📱 Para Produção

Substitua ngrok por um domínio real:
- Render.com (gratuito para backend)
- Vercel.com (gratuito para frontend)
- Seu próprio domínio

---

**Template completo e funcional sem custos do Bubble!** 💪
