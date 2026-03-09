import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3000');

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // New states for conversations
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get('/api/conversations');
      return res.data;
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    socket.on('connect', () => { setConnected(true); });
    socket.on('disconnect', () => { setConnected(false); });
    socket.on('new_message', (message) => {
      console.log('Received new message:', message);
      console.log('Selected conversation:', selectedConversation);
      if (selectedConversation && message.conversation_id === selectedConversation.id) {
        console.log('Adding message to chat');
        setMessages(prev => [...prev, message]);
      } else {
        console.log('Message not for selected conversation');
      }
      fetchConversations().then(convs => setConversations(convs));
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_message');
    };
  }, [selectedConversation, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchConversations().then(convs => {
      setConversations(convs);
      if (convs.length > 0 && !selectedConversation) {
        setSelectedConversation(convs[0]);
      }
    });
  }, [fetchConversations]);

  const sendMessage = async () => {
    if (!newMessage.trim() || (!selectedConversation && !phoneNumber.trim())) {
      alert('Por favor, selecione uma conversa ou preencha o número de telefone e digite uma mensagem');
      return;
    }
    try {
      await axios.post('/api/send-message', {
        to: selectedConversation ? selectedConversation.phone_number : phoneNumber.replace(/\D/g, ''),
        message: newMessage.trim()
      });
      setNewMessage('');
      if (!selectedConversation) {
        fetchConversations().then(convs => {
          setConversations(convs);
          const newConv = convs.find(c => c.phone_number === phoneNumber.replace(/\D/g, ''));
          if (newConv) setSelectedConversation(newConv);
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Verifique o console.');
    }
  };

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const res = await axios.get(`/api/messages?conversation_id=${conversationId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const handleNewConversation = () => {
    const phone = prompt('Digite o número de telefone:');
    if (phone && phone.trim()) {
      let cleanedPhone = phone.replace(/\D/g, '');
      if (cleanedPhone.startsWith('55') && cleanedPhone.length === 12) {
        const fifthDigit = cleanedPhone[4];
        if (fifthDigit >= '6' && fifthDigit <= '9') {
          cleanedPhone = cleanedPhone.slice(0, 4) + '9' + cleanedPhone.slice(4);
        }
        // Para fixos, não adicionar 9
      }
      axios.post('/api/conversations', { phone_number: cleanedPhone })
        .then(() => {
          fetchConversations().then(convs => {
            setConversations(convs);
            const newConv = convs.find(c => c.phone_number === cleanedPhone);
            if (newConv) setSelectedConversation(newConv);
          });
        })
        .catch(err => {
          console.error('Erro ao criar conversa:', err);
          alert('Erro ao criar conversa');
        });
    }
  };

  const formatTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const S = {
    page: {
      fontFamily: "'Inter','DM Sans', sans-serif",
      background: '#f7f8fa',
      height: '100vh',
      overflow: 'hidden',
      boxSizing: 'border-box',
    },
    sidebar: {
      width: 300,
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,.07)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    },
    sidebarHeader: {
      padding: '20px',
      borderBottom: '1px solid #f0f0f0',
      fontSize: 18,
      fontWeight: 700,
      color: '#111',
    },
    conversationItem: {
      padding: '16px 20px',
      borderBottom: '1px solid #f0f0f0',
      cursor: 'pointer',
      transition: 'background .15s',
    },
    conversationActive: {
      background: '#f3eeff',
    },
    newConversationBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: '#7c3aed',
      color: '#fff',
      border: 'none',
      padding: '10px 18px',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 400,
      cursor: 'pointer',
      transition: 'background .15s',
      width: '100%',
      boxSizing: 'border-box',
      justifyContent: 'center',
    },
    chatArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    inner: {
      maxWidth: 860,
      margin: '0 auto',
      display: 'flex',
      gap: 20,
      height: '100%',
      padding: '28px 32px',
      boxSizing: 'border-box',
    },
    // ── header row ──────────────────────────────────────────
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    titleBlock: {},
    title: { fontSize: 22, fontWeight: 700, color: '#252A34', margin: 0 },
    subtitle: { fontSize: 13, color: '#808C97', marginTop: 3 },
    badge: (ok) => ({
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: ok ? '#e8f5e9' : '#fce4ec',
      color: ok ? '#2e7d32' : '#b71c1c',
    }),
    dot: (ok) => ({
      width: 7, height: 7, borderRadius: '50%',
      background: ok ? '#43a047' : '#e53935',
      display: 'inline-block',
    }),
    // ── card ────────────────────────────────────────────────
    card: {
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,.07)',
      overflow: 'hidden',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 1000,
    },
    // ── chat area ───────────────────────────────────────────
    chatBody: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      background: '#ffffff',
    },
    emptyChat: {
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#bbb', fontSize: 14, gap: 8,
    },
    bubbleOut: {
      alignSelf: 'flex-end',
      background: '#343E4F',
      color: '#ffffff',
      borderRadius: '14px 14px 4px 14px',
      padding: '10px 14px',
      maxWidth: '68%',
      boxShadow: '0 1px 2px rgba(0,0,0,.08)',
    },
    bubbleIn: {
      alignSelf: 'flex-start',
      background: '#EFEFF0',
      color: '#4D5665',
      borderRadius: '14px 14px 14px 4px',
      padding: '10px 14px',
      maxWidth: '68%',
      boxShadow: '0 1px 2px rgba(0,0,0,.08)',
    },
    bubbleText: { fontSize: 14, lineHeight: 1.5, margin: 0 },
    bubbleMeta: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' },
    // ── input area ──────────────────────────────────────────
    inputArea: {
      padding: '16px 20px',
      borderTop: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    },
    input: {
      width: '100%', padding: '10px 12px',
      border: '1.5px solid #e8e8e8', borderRadius: 8,
      fontSize: 14, outline: 'none', boxSizing: 'border-box',
      fontFamily: 'inherit', background: '#fafafa',
    },
    row: { display: 'flex', gap: 10 },
    textarea: {
      flex: 1, padding: '10px 12px',
      border: '1.5px solid #e8e8e8', borderRadius: 8,
      fontSize: 14, outline: 'none', resize: 'vertical',
      fontFamily: 'inherit', background: '#fafafa',
    },
    sendBtn: (disabled) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: disabled ? '#c4b5fd' : '#7c3aed',
      color: '#fff',
      border: 'none',
      padding: '10px 18px',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 400,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background .15s',
      flexShrink: 0,
    }),
    // ── info card ───────────────────────────────────────────
    infoCard: {
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,.07)',
      padding: '18px 24px',
      display: 'flex', gap: 32, flexWrap: 'wrap',
    },
    infoItem: { fontSize: 13, color: '#666', lineHeight: 1.7 },
    infoLabel: { fontWeight: 700, color: '#444' },
  };

  return (
    <div>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={S.page}>
        <div style={S.inner}>
          {/* Sidebar */}
          <div style={S.sidebar}>
            <div style={S.sidebarHeader}>Conversas</div>
            <button onClick={handleNewConversation} style={S.newConversationBtn}>Nova Conversa</button>
            {conversations.map(conv => (
              <div
                key={conv.id}
                style={{
                  ...S.conversationItem,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  ...(selectedConversation?.id === conv.id ? S.conversationActive : {})
                }}
                onClick={() => setSelectedConversation(conv)}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(conv.contact_name || conv.phone_number)}&background=random&color=fff&rounded=true&size=40&bold=true`}
                  style={{ borderRadius: '50%', width: 40, height: 40 }}
                  alt="avatar"
                />
                <div>
                  <strong>{conv.contact_name || conv.phone_number}</strong>
                  {conv.contact_name && <div style={{ fontSize: 12, color: 'gray' }}>{conv.phone_number}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div style={S.chatArea}>

            {/* ── Header ──────────────────────────────────── */}
            <div style={S.header}>
              <div style={S.titleBlock}>
                <h1 style={S.title}>{selectedConversation ? `Chat com ${selectedConversation.phone_number}` : 'Chat Template'}</h1>
                <p style={S.subtitle}>{selectedConversation ? `${messages.length} mensagem${messages.length !== 1 ? 's' : ''}` : ''}</p>
              </div>
              <span style={S.badge(connected)}>
                <span style={S.dot(connected)} />
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            {/* ── Chat card ───────────────────────────────── */}
            <div style={S.card}>

              {/* messages */}
              <div style={S.chatBody}>
                {messages.length === 0 ? (
                  <div style={S.emptyChat}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#ddd' }}>chat_bubble_outline</span>
                    {selectedConversation ? 'Nenhuma mensagem ainda' : 'Bem-vindo! Crie uma nova conversa para começar.'}
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const out = message.direction === 'outgoing';
                    return (
                      <div key={`${message.id}-${index}`} style={{ display: 'flex', justifyContent: out ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                        <div style={out ? S.bubbleOut : S.bubbleIn}>
                          <p style={S.bubbleText}>{message.text}</p>
                          <p style={S.bubbleMeta}>
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* inputs */}
              <div style={S.inputArea}>
                {!selectedConversation && (
                  <input
                    type="text"
                    style={S.input}
                    placeholder="Numero de telefone - ex: +55 11 99999-9999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                )}
                <div style={S.row}>
                  <textarea
                    style={S.textarea}
                    placeholder="Digite sua mensagem"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    rows={3}
                  />
                  <button style={S.sendBtn(!newMessage.trim() || (!selectedConversation && !phoneNumber.trim()))} onClick={sendMessage} disabled={!newMessage.trim() || (!selectedConversation && !phoneNumber.trim())}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;