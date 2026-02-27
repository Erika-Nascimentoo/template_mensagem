import React, { useState, useEffect, useRef } from 'react';
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
    socket.on('connect', () => {
      setConnected(true);
      console.log('Conectado ao servidor');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Desconectado do servidor');
    });

    socket.on('initial_messages', (initialMessages) => {
      setMessages(initialMessages);
    });

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
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  return (
    <div className="h-screen flex flex-col p-2 max-w-4xl mx-auto">
      <nav className="bg-primary text-white mb-2 rounded-lg shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            
            <h1 className="text-lg font-semibold">Meta Chat Template</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-sm">chat</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              connected 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </nav>

      <div className="flex-1 bg-white rounded-lg shadow-md p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Chat WhatsApp</h2>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 custom-scrollbar">
          {messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              className={`flex ${
                message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
              } py-2`}
            >
              <div
                className={`whatsapp-bubble ${
                  message.direction === 'outgoing' 
                    ? 'whatsapp-bubble-outgoing' 
                    : 'whatsapp-bubble-incoming'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.direction === 'incoming' 
                    ? `De: ${formatPhoneNumber(message.from)}`
                    : `Para: ${formatPhoneNumber(message.to)}`
                  }
                  {' • '}
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+55 11 99999-9999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <textarea
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            rows={3}
          />
          <button
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
            onClick={sendMessage}
            disabled={!newMessage.trim() || !phoneNumber.trim()}
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </div>
      </div>

      <div className="mt-2 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Configuração</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <strong>Status:</strong> {connected ? <span className="text-primary"><span className="material-symbols-outlined text-sm mr-1">check_circle</span>Conectado ao servidor</span> : <span className="text-red-600"><span className="material-symbols-outlined text-sm mr-1">error</span>Desconectado</span>}
          </p>
          <p><strong>Webhook URL:</strong> /webhook/whatsapp</p>
          <p><strong>Instruções:</strong> Configure seu webhook no Meta for Developers apontando para esta URL.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
