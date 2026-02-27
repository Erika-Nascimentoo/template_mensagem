import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  List, 
  ListItem, 
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Chip
} from '@mui/material';
import { Send, WhatsApp, Message } from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3000');

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Conexão com o servidor
    socket.on('connect', () => {
      setConnected(true);
      console.log('Conectado ao servidor');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Desconectado do servidor');
    });

    // Receber mensagens iniciais
    socket.on('initial_messages', (initialMessages) => {
      setMessages(initialMessages);
    });

    // Receber novas mensagens
    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initial_messages');
      socket.off('new_message');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !phoneNumber.trim()) {
      alert('Por favor, preencha o número de telefone e a mensagem');
      return;
    }

    try {
      // Formatar número (remover caracteres não numéricos)
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      await axios.post('/api/send-message', {
        to: formattedPhone,
        message: newMessage.trim()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Verifique o console.');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhoneNumber = (phone) => {
    // Formatar para exibição: +55 (XX) XXXXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  return (
    <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
      <AppBar position="static" sx={{ mb: 2, bgcolor: '#7622e1', color: 'white' }}>
        <Toolbar>
          <WhatsApp sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meta Chat Template
          </Typography>
          <Chip 
            icon={<Message />}
            label={connected ? "Conectado" : "Desconectado"}
            color={connected ? "success" : "error"}
            variant="outlined"
          />
        </Toolbar>
      </AppBar>

      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Chat WhatsApp
        </Typography>
        
        <List sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          {messages.map((message, index) => (
            <ListItem 
              key={`${message.id}-${index}`}
              sx={{
                flexDirection: 'column',
                alignItems: message.direction === 'outgoing' ? 'flex-end' : 'flex-start',
                py: 1
              }}
            >
              <Paper
                sx={{
                  px: 2,
                  py: 1,
                  maxWidth: '70%',
                  bgcolor: message.direction === 'outgoing' ? 'primary.main' : 'grey.200',
                  color: message.direction === 'outgoing' ? 'white' : 'text.primary'
                }}
              >
                <Typography variant="body1">
                  {message.text}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {message.direction === 'incoming' 
                    ? `De: ${formatPhoneNumber(message.from)}`
                    : `Para: ${formatPhoneNumber(message.to)}`
                  }
                  {' • '}
                  {formatTimestamp(message.timestamp)}
                </Typography>
              </Paper>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Número de telefone (com código do país)"
            placeholder="+55 11 99999-9999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            label="Mensagem"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            variant="outlined"
            multiline
            maxRows={3}
          />
          <IconButton 
            color="primary" 
            onClick={sendMessage}
            disabled={!newMessage.trim() || !phoneNumber.trim()}
            sx={{ alignSelf: 'flex-end' }}
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>

      <Paper sx={{ mt: 2, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configuração
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Status:</strong> {connected ? '🟢 Conectado ao servidor' : '🔴 Desconectado'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Webhook URL:</strong> /webhook/whatsapp
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Instruções:</strong> Configure seu webhook no Meta for Developers apontando para esta URL.
        </Typography>
      </Paper>
    </Container>
  );
}

export default App;
