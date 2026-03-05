const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? 'Definido' : 'Não definido');
console.log('META_PHONE_NUMBER_ID:', process.env.META_PHONE_NUMBER_ID ? 'Definido' : 'Não definido');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001"
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  // Testa conexão com Supabase
  const { data, error } = await supabase.from('messages').select('count', { count: 'exact' });
  
  if (error) {
    return res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Webhook verification - Meta exige isso para confirmar seu endpoint
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Webhook receiver - recebe mensagens do WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const data = req.body;
    
    // Verifica se é uma mensagem
    if (data.object === 'whatsapp_business_account') {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            
            // Verifica se messages existe e é um array
            if (messages && Array.isArray(messages)) {
              for (const message of messages) {
                if (message.type === 'text') {
                  const messageData = {
                    id: message.id,
                    from: message.from,
                    to: message.to,
                    text: message.text.body,
                    timestamp: new Date(message.timestamp * 1000).toISOString(),
                    direction: 'incoming'
                  };
                  
                  // Salva mensagem no Supabase
                  const { error: insertError } = await supabase
                    .from('messages')
                    .insert(messageData);
                  
                  if (insertError) {
                    console.error('Erro ao salvar mensagem no Supabase:', insertError);
                  } else {
                    console.log('Mensagem salva no Supabase:', messageData);
                  }
                  
                  // Envia para frontend via WebSocket
                  io.emit('new_message', messageData);
                  
                  console.log('Nova mensagem recebida:', messageData);
                  
                  // Resposta automática desativada
                  // await sendAutoReply(message.from, message.text.body);
                }
              }
            }
          }
        }
      }
    }
    
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('ERROR');
  }
});

// Função para enviar mensagens via Meta API
async function sendMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v25.0/${process.env.META_PHONE_NUMBER_ID_MESSAGES}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      text: {
        body: message
      }
    };
    
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.post(url, payload, config);
    
    const messageData = {
      id: response.data.messages[0].id,
      from: process.env.META_PHONE_NUMBER_ID,
      to: to,
      text: message,
      timestamp: new Date().toISOString(),
      direction: 'outgoing'
    };
    
    // Salva mensagem no Supabase
    const { error: insertError } = await supabase
      .from('messages')
      .insert(messageData);
    
    if (insertError) {
      console.error('Erro ao salvar mensagem enviada no Supabase:', insertError);
    }
    
    io.emit('new_message', messageData);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

// Resposta automática simples
async function sendAutoReply(from, messageText) {
  const responses = [
    'Olá! Recebi sua mensagem e já estou respondendo.',
    'Obrigado pelo contato! Em breve te respondo.',
    'Mensagem recebida! Estou processando sua solicitação.'
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  setTimeout(async () => {
    try {
      await sendMessage(from, randomResponse);
    } catch (error) {
      console.error('Erro na resposta automática:', error);
    }
  }, 2000);
}

// API para enviar mensagens do frontend
app.post('/api/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Destinatário e mensagem são obrigatórios' });
    }
    
    const result = await sendMessage(to, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// API para buscar histórico de mensagens
app.get('/api/messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro no endpoint /api/messages:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// WebSocket connection
io.on('connection', async (socket) => {
  console.log('Novo cliente conectado:', socket.id);
  
  // Envia mensagens existentes do Supabase para o novo cliente
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar mensagens para WebSocket:', error);
      socket.emit('initial_messages', []);
    } else {
      socket.emit('initial_messages', data || []);
    }
  } catch (error) {
    console.error('Erro no WebSocket ao buscar mensagens:', error);
    socket.emit('initial_messages', []);
  }
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Função para substituir variáveis nomeadas por posicionais
const replaceVariablesWithPositional = (body, variableSamples) => {
  let replacedBody = body;
  variableSamples.forEach((variable, index) => {
    const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
    const replacement = `{{${index + 1}}}`;
    replacedBody = replacedBody.replace(regex, replacement);
  });
  return replacedBody;
};

const getFilledText = (text, variableSamples) => {
  let filled = text;
  variableSamples.forEach((sample) => {
    if (sample.name && sample.value) {
      const regex = new RegExp(`\\{\\{${sample.name}\\}\\}`, 'g');
      filled = filled.replace(regex, sample.value);
    }
  });
  return filled;
};

// Função para criar template no Meta
async function createMetaTemplate(templateData) {
  try {
    const components = [];

    if (templateData.header) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: replaceVariablesWithPositional(templateData.header, templateData.variable_samples)
      });
    }

    components.push({
      type: "BODY",
      text: replaceVariablesWithPositional(templateData.body, templateData.variable_samples),
      ...(templateData.variable_samples && templateData.variable_samples.length > 0 ? {
        example: {
          body_text: [
            getFilledText(templateData.body, templateData.variable_samples)
          ]
        }
      } : {})
    });

    if (templateData.footer) {
      components.push({
        type: "FOOTER",
        text: replaceVariablesWithPositional(templateData.footer, templateData.variable_samples)
      });
    }

    const payload = {
      name: templateData.name,
      category: templateData.category.toUpperCase(),
      language: templateData.language,
      components: components
    };

    console.log('Payload to Meta:', JSON.stringify(payload, null, 2));

    const url = `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID_TEMPLATES}/message_templates`;
    
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(url, payload, config);

    return {
      meta_id: response.data.id,
      status: response.data.status.toLowerCase()
    };
  } catch (error) {
    console.error('Erro ao criar template no Meta:', error.response?.data || error.message);
    throw error;
  }
}

// Função para editar template no Meta
async function editMetaTemplate(metaId, templateData) {
  try {
    const components = [];

    if (templateData.header) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: replaceVariablesWithPositional(templateData.header, templateData.variable_samples)
      });
    }

    components.push({
      type: "BODY",
      text: replaceVariablesWithPositional(templateData.body, templateData.variable_samples),
      ...(templateData.variable_samples && templateData.variable_samples.length > 0 ? {
        example: {
          body_text: [
            getFilledText(templateData.body, templateData.variable_samples)
          ]
        }
      } : {})
    });

    if (templateData.footer) {
      components.push({
        type: "FOOTER",
        text: replaceVariablesWithPositional(templateData.footer, templateData.variable_samples)
      });
    }

    const payload = {
      name: templateData.name,
      category: templateData.category.toUpperCase(),
      language: templateData.language,
      components: components
    };

    console.log('Payload to Meta:', JSON.stringify(payload, null, 2));

    const url = `https://graph.facebook.com/v25.0/${metaId}`;
    
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(url, payload, config);

    return {
      meta_id: response.data.id,
      status: response.data.status ? response.data.status.toLowerCase() : 'pending'
    };
  } catch (error) {
    console.error('Erro ao editar template no Meta:', error.response?.data || error.message);
    throw error;
  }
}

// Função para obter todos os templates no Meta
async function getAllMetaTemplates() {
  try {
    const url = `https://graph.facebook.com/v25.0/${process.env.META_PHONE_NUMBER_ID_TEMPLATES}/message_templates`;
    
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.get(url, config);

    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao obter templates do Meta:', error.response?.data || error.message);
    throw error;
  }
}

// Função para deletar template no Meta
async function deleteMetaTemplate(name) {
  try {
    const url = `https://graph.facebook.com/v25.0/${process.env.META_PHONE_NUMBER_ID_TEMPLATES}/message_templates?name=${name}`;
    
    const config = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('Enviando request DELETE para Meta:', JSON.stringify({
      method: 'DELETE',
      url: url,
      headers: config.headers,
      body: null
    }, null, 2));

    await axios(url, config);
    console.log('Template deletado no Meta com sucesso:', name);
  } catch (error) {
    console.error('Erro ao deletar template no Meta:', error.response?.data || error.message);
    throw error;
  }
}

// API endpoints para templates

app.post('/api/send-template', async (req, res) => {
  try {
    const { to, templateName, parameters } = req.body;
    
    // Buscar template no banco
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('name', templateName)
      .single();
    
    if (error || !template) {
      console.error('Template não encontrado:', error);
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    // Verificar se template está aprovado ou pendente (para testes)
    const status = template.status.toLowerCase();
    if (status !== 'approved' && status !== 'pending') {
      console.error('Template não pode ser enviado. Status:', template.status);
      return res.status(403).json({ error: 'Template não pode ser enviado. Status atual: ' + template.status });
    }
    
    // Preencher corpo do template com parâmetros
    let messageBody = template.body;
    template.variable_samples.forEach((sample, index) => {
      const param = parameters[index];
      if (param) {
        const regex = new RegExp(`\\{\\{${sample.name}\\}\\}`, 'g');
        messageBody = messageBody.replace(regex, param);
      }
    });
    
    // Enviar mensagem via Meta API
    const result = await sendMessage(to, messageBody);
    
    res.json({ success: true, messageId: result.messages[0].id });
  } catch (error) {
    console.error('Erro ao enviar template:', error);
    res.status(500).json({ error: 'Erro interno ao enviar template' });
  }
});

app.get('/api/templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar templates:', error);
      return res.status(500).json({ error: 'Erro ao buscar templates' });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro no endpoint GET /api/templates:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const { name, category, header, body, footer, buttons, variable_samples, variableSamples, language } = req.body;
    
    // Aceita tanto variable_samples (snake_case) quanto variableSamples (camelCase)
    const finalVariableSamples = variable_samples || variableSamples || [];
    
    console.log('finalVariableSamples:', finalVariableSamples);
    
    const newTemplate = {
      name,
      category: category || 'utility',
      header: header || '',
      body,
      footer: footer || '',
      buttons: buttons || [],
      variable_samples: finalVariableSamples,
      variable_types: finalVariableSamples.map(v => v.type || 'name'),
      language: language
    };
    
    console.log('Tentando criar template no Meta para:', newTemplate.name);
    try {
      const metaResult = await createMetaTemplate(newTemplate);
      console.log('Template criado no Meta com sucesso:', metaResult);
      
      // Agora salva no banco com meta_id e status
      newTemplate.meta_id = metaResult.meta_id;
      newTemplate.status = metaResult.status;
      
      const { data: savedTemplate, error } = await supabase
        .from('templates')
        .insert(newTemplate)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar template:', error);
        return res.status(500).json({ error: 'Erro ao criar template' });
      }

      console.log('Template salvo no banco com sucesso');
      res.json(savedTemplate);
    } catch (metaError) {
      console.error('Falha ao criar template no Meta:', metaError.response?.data || metaError.message);
      // Não salva no banco se falhar na Meta
      return res.status(400).json({ error: metaError.response?.data?.error?.error_user_title || 'Erro ao criar template na Meta' });
    }
  } catch (error) {
    console.error('Erro no endpoint POST /api/templates:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.put('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, header, body, footer, buttons, variable_samples, variableSamples, language } = req.body;
    
    // Aceita tanto variable_samples (snake_case) quanto variableSamples (camelCase)
    const finalVariableSamples = variable_samples || variableSamples || [];
    
    console.log('finalVariableSamples:', finalVariableSamples);
    
    const updateData = {
      name,
      category,
      header: header || '',
      body,
      footer: footer || '',
      buttons: buttons || [],
      variable_samples: finalVariableSamples,
      language: language
    };
    
    // Primeiro, buscar o template atual para obter o meta_id
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentTemplate) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    // Se tem meta_id, tentar editar no Meta
    if (currentTemplate.meta_id) {
      console.log('Tentando editar template no Meta para:', currentTemplate.name);
      try {
        const metaResult = await editMetaTemplate(currentTemplate.meta_id, updateData);
        console.log('Template editado no Meta com sucesso:', metaResult);
        
        // Atualizar status se mudou
        updateData.status = metaResult.status;
      } catch (metaError) {
        console.error('Falha ao editar template no Meta:', metaError.response?.data || metaError.message);
        // Mesmo se falhar no Meta, continua com a atualização local
        // Talvez definir status como erro ou manter o atual
      }
    }
    
    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar template:', error);
      return res.status(500).json({ error: 'Erro ao atualizar template' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erro no endpoint PUT /api/templates:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar template
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    // Deletar no Meta se meta_id existir
    if (template.meta_id) {
      await deleteMetaTemplate(template.name);
    }
    
    // Deletar do banco
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir template:', error);
      return res.status(500).json({ error: 'Erro ao excluir template' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro no endpoint DELETE /api/templates:', error);
    res.status(500).json({ error: 'Erro ao excluir template no Meta' });
  }
});

app.put('/api/templates/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar template no banco
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    if (!template.meta_id) {
      return res.status(400).json({ error: 'Template não tem ID do Meta' });
    }
    
    // Obter status do Meta
    const metaResult = await getMetaTemplateStatus(template.meta_id);
    
    // Atualizar status no banco
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('templates')
      .update({ status: metaResult.status })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erro ao atualizar status do template:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar status' });
    }
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Erro no endpoint PUT /api/templates/:id/status:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/sync-templates', async (req, res) => {
  try {
    const metaTemplates = await getAllMetaTemplates();
    
    let syncedCount = 0;
    
    for (const metaTemplate of metaTemplates) {
      const { id, name, status, language, components, category, created_time, modified_time } = metaTemplate;
      
      // Verificar se já existe no banco
      const { data: existing, error: checkError } = await supabase
        .from('templates')
        .select('id')
        .eq('name', name)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is not found
        console.error('Erro ao verificar template existente:', checkError);
        continue;
      }
      
      if (existing) {
        console.log(`Template ${name} já existe no banco`);
        continue;
      }
      
      // Extrair componentes
      const header = components.find(c => c.type === 'HEADER')?.text || '';
      const bodyComp = components.find(c => c.type === 'BODY');
      const body = bodyComp?.text || '';
      const footer = components.find(c => c.type === 'FOOTER')?.text || '';
      const buttons = components.find(c => c.type === 'BUTTONS')?.buttons || [];
      
      // Inserir no banco
      const newTemplate = {
        name,
        category: category || 'UTILITY',
        header,
        body,
        footer,
        buttons,
        variable_samples: [],
        variable_types: [],
        language,
        meta_id: id,
        status: status.toLowerCase(),
        created_at: created_time,
        updated_at: modified_time
      };
      
      const { error: insertError } = await supabase
        .from('templates')
        .insert(newTemplate);
      
      if (insertError) {
        console.error('Erro ao inserir template:', insertError);
      } else {
        syncedCount++;
        console.log(`Template ${name} sincronizado`);
      }
    }
    
    res.json({ success: true, synced: syncedCount });
  } catch (error) {
    console.error('Erro no endpoint POST /api/sync-templates:', error);
    res.status(500).json({ error: 'Erro ao sincronizar templates' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Webhook URL: https://ciliolate-sherell-ungerminated.ngrok-free.dev/webhook/whatsapp`);
});
