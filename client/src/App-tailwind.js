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
    socket.on('connect', () => { setConnected(true); });
    socket.on('disconnect', () => { setConnected(false); });
    socket.on('initial_messages', (initialMessages) => { setMessages(initialMessages); });
    socket.on('new_message', (message) => { setMessages(prev => [...prev, message]); });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initial_messages');
      socket.off('new_message');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !phoneNumber.trim()) {
      alert('Por favor, preencha o número de telefone e a mensagem');
      return;
    }
    try {
      await axios.post('/api/send-message', {
        to: phoneNumber.replace(/\D/g, ''),
        message: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Verifique o console.');
    }
  };

  const formatTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13)
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    return phone;
  };

  const S = {
    page: {
      fontFamily: "'DM Sans', sans-serif",
      background: '#f7f8fa',
      minHeight: '100vh',
      padding: '28px 32px',
      boxSizing: 'border-box',
    },
    inner: {
      maxWidth: 860,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    },
    // ── header row ──────────────────────────────────────────
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    titleBlock: {},
    title: { fontSize: 22, fontWeight: 700, color: '#111', margin: 0 },
    subtitle: { fontSize: 13, color: '#888', marginTop: 3 },
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
    },
    // ── chat area ───────────────────────────────────────────
    chatBody: {
      height: 420,
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
      width: '100%', padding: '10px 14px',
      border: '1.5px solid #e8e8e8', borderRadius: 9,
      fontSize: 14, outline: 'none', boxSizing: 'border-box',
      fontFamily: 'inherit', background: '#fafafa',
    },
    row: { display: 'flex', gap: 10 },
    textarea: {
      flex: 1, padding: '10px 14px',
      border: '1.5px solid #e8e8e8', borderRadius: 9,
      fontSize: 14, outline: 'none', resize: 'none',
      fontFamily: 'inherit', background: '#fafafa',
    },
    sendBtn: (disabled) => ({
      background: disabled ? '#c4b5fd' : '#7c3aed',
      color: '#fff', border: 'none',
      padding: '0 18px', borderRadius: 9,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background .15s', flexShrink: 0,
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

  const isDisabled = !newMessage.trim() || !phoneNumber.trim();

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={S.page}>
        <div style={S.inner}>

          {/* ── Header ──────────────────────────────────── */}
          <div style={S.header}>
            <div style={S.titleBlock}>
              <h1 style={S.title}>Chat WhatsApp</h1>
              <p style={S.subtitle}>Envie e receba mensagens em tempo real</p>
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
                  Nenhuma mensagem ainda
                </div>
              ) : (
                messages.map((message, index) => {
                  const out = message.direction === 'outgoing';
                  return (
                    <div key={`${message.id}-${index}`} style={{ display: 'flex', justifyContent: out ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                      <div style={out ? S.bubbleOut : S.bubbleIn}>
                        <p style={S.bubbleText}>{message.text}</p>
                        <p style={S.bubbleMeta}>
                          {out
                            ? `Para: ${formatPhoneNumber(message.to)}`
                            : `De: ${formatPhoneNumber(message.from)}`
                          }
                          {' · '}
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
              <input
                type="text"
                style={S.input}
                placeholder="Número de telefone — ex: +55 11 99999-9999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <div style={S.row}>
                <textarea
                  style={S.textarea}
                  placeholder="Digite sua mensagem…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  rows={3}
                />
                <button style={S.sendBtn(isDisabled)} onClick={sendMessage} disabled={isDisabled}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>send</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Info row ────────────────────────────────── */}
          <div style={S.infoCard}>
            <div style={S.infoItem}>
              <span style={S.infoLabel}>Status</span><br />
              {connected
                ? <span style={{ color: '#2e7d32' }}>✓ Conectado ao servidor</span>
                : <span style={{ color: '#b71c1c' }}>✗ Desconectado</span>
              }
            </div>
            <div style={S.infoItem}>
              <span style={S.infoLabel}>Webhook URL</span><br />
              /webhook/whatsapp
            </div>
            <div style={S.infoItem}>
              <span style={S.infoLabel}>Instruções</span><br />
              Configure seu webhook no Meta for Developers apontando para esta URL.
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default App;