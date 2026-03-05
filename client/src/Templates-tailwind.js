import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ── tiny helpers ──────────────────────────────────────────────────────────────

const STATUS_MAP = {
  approved: { label: 'Aprovado',  bg: '#e8f5e9', color: '#2e7d32', dot: '#43a047' },
  rejected: { label: 'Rejeitado', bg: '#fce4ec', color: '#b71c1c', dot: '#e53935' },
  pending:  { label: 'Pendente',  bg: '#fff8e1', color: '#f57f17', dot: '#ffb300' },
  deleted:  { label: 'Deletado',  bg: '#8b0000', color: '#fff', dot: '#b22222' },
};

const CATEGORY_ICONS = {
  UTILITY:        { icon: '⚙️', bg: '#e3f2fd', color: '#1565c0' },
  MARKETING:      { icon: '📣', bg: '#fce4ec', color: '#880e4f' },
  AUTHENTICATION: { icon: '🔐', bg: '#ede7f6', color: '#4527a0' },
};

function TemplateAvatar({ name, category }) {
  const cat = (category || '').toUpperCase();
  const meta = CATEGORY_ICONS[cat] || { icon: '📄', bg: '#f5f5f5', color: '#616161' };
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: meta.bg, color: meta.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, flexShrink: 0, userSelect: 'none',
    }}>
      {meta.icon}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

function IconBtn({ title, color, hoverColor, icon, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8,
        color: hov ? (hoverColor || '#333') : (color || '#aaa'),
        transition: 'color .15s, background .15s',
        display: 'flex', alignItems: 'center',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
    </button>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [selectedAll, setSelectedAll] = useState(false);
  const [selected, setSelected] = useState({});
  const [formData, setFormData] = useState({ id: null, name: '', category: '', header: '', body: '', footer: '', buttons: [], variableSamples: [], language: '' });
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sendForm, setSendForm] = useState({ phoneNumber: '', parameters: [] });
  const [popup, setPopup] = useState({ show: false, message: '', type: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null, requestPreview: '' });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/templates');
      const normalized = res.data.map(t => ({
        ...t,
        variableSamples: t.variable_samples || t.variableSamples || [],
        language: t.language || 'Não definido',
        status: t.status ? t.status.toLowerCase() : 'pending',
      }));
      setTemplates(normalized);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = () => {
    if (selectedAll) { setSelected({}); setSelectedAll(false); }
    else { const s = {}; templates.forEach(t => { s[t.id] = true; }); setSelected(s); setSelectedAll(true); }
  };
  const toggleRow = (id) => setSelected(prev => { const n = { ...prev }; n[id] ? delete n[id] : (n[id] = true); return n; });

  const handleOpenDialog = (template = null) => {
    if (template && template.status === 'approved') {
      setPopup({ show: true, message: 'Apenas templates rejeitados podem ser editados. Você está editando um template aprovado.', type: 'info' });
      setIsApproved(true);
    } else {
      setIsApproved(false);
    }
    if (template) {
      setFormData({ ...template, variableSamples: template.variableSamples || [] });
    } else {
      setFormData({ id: null, name: '', category: '', header: '', body: '', footer: '', buttons: [], variableSamples: [], language: '' });
      setIsApproved(false);
    }
    setView('form');
  };

  const handleSaveTemplate = async () => {
    try {
      if (formData.id) await axios.put(`/api/templates/${formData.id}`, formData);
      else await axios.post('/api/templates', formData);
      fetchTemplates();
      setView('list');
      setPopup({ show: true, message: 'Template salvo com sucesso!', type: 'success' });
    } catch (err) {
      setPopup({ show: true, message: err.response?.data?.error || 'Erro ao salvar template', type: 'error' });
    }
  };

  const handleDeleteTemplate = (id) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    setConfirmDialog({
      show: true,
      message: 'Tem certeza que deseja excluir este template?',
      requestPreview: JSON.stringify({
        method: 'DELETE',
        url: `https://graph.facebook.com/v25.0/[META_PHONE_NUMBER_ID_TEMPLATES]/message_templates?name=${template.name}`,
        headers: {
          Authorization: "Bearer [TOKEN]"
        },
        body: null
      }, null, 2),
      onConfirm: async () => {
        try {
          await axios.delete(`/api/templates/${id}`);
          fetchTemplates();
          setPopup({ show: true, message: 'Template excluído com sucesso!', type: 'success' });
        } catch {
          setPopup({ show: true, message: 'Erro ao excluir template.', type: 'error' });
        }
      },
    });
  };

  const handleRefreshStatus = async (id) => {
    try {
      await axios.put(`/api/templates/${id}/status`);
      fetchTemplates();
      setPopup({ show: true, message: 'Status atualizado!', type: 'success' });
    } catch {
      setPopup({ show: true, message: 'Erro ao atualizar status.', type: 'error' });
    }
  };

  const handleSyncTemplates = async () => {
    try {
      const res = await axios.post('/api/sync-templates');
      fetchTemplates();
      setPopup({ show: true, message: `${res.data.synced} template(s) sincronizado(s) com sucesso!`, type: 'success' });
    } catch {
      setPopup({ show: true, message: 'Erro ao sincronizar templates.', type: 'error' });
    }
  };

  const handleOpenSendDialog = (template) => {
    setSelectedTemplate({ ...template, variableSamples: template.variableSamples || [] });
    setSendForm({ phoneNumber: '', parameters: (template.variableSamples || []).map(v => v.value || '') });
    setSendDialogOpen(true);
  };

  const handleSendTemplate = async () => {
    try {
      await axios.post('/api/send-template', {
        to: sendForm.phoneNumber.replace(/\D/g, ''),
        templateName: selectedTemplate.name,
        parameters: sendForm.parameters.filter(p => p.trim()),
      });
      setSendDialogOpen(false);
      setSelectedTemplate(null);
      setPopup({ show: true, message: 'Template enviado com sucesso!', type: 'success' });
    } catch {
      setPopup({ show: true, message: 'Erro ao enviar template.', type: 'error' });
    }
  };

  const extractVariables = (body) => {
    const regex = /\{\{(\d+)\}\}/g;
    const vars = [];
    let m;
    while ((m = regex.exec(body)) !== null) vars.push(m[1]);
    return [...new Set(vars)];
  };

  const handleBodyChange = (e) => {
    let newBody = e.target.value;
    if (newBody.endsWith('{{')) {
      const existing = extractVariables(newBody.slice(0, -2));
      const nums = existing.map(v => parseInt(v)).filter(n => !isNaN(n));
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      newBody = newBody.slice(0, -2) + '{{' + next + '}}';
    }
    const vars = extractVariables(newBody);
    const cur = formData.variableSamples;
    const samples = vars.map(v => cur.find(s => s.name === v) || { name: v, value: '', type: 'number' });
    setFormData({ ...formData, body: newBody, variableSamples: samples });
  };

  const previewTemplate = (template, variableSamples = []) => {
    let preview = template.body || '';
    (variableSamples || []).forEach((s) => {
      if (s.name && s.value) preview = preview.replace(new RegExp(`{{${s.name}}}`, 'g'), s.value);
    });
    return preview;
  };

  const buildMetaPayload = (fd) => {
    const components = [];
    if (fd.header) components.push({ type: 'HEADER', format: 'TEXT', text: fd.header });
    const bodyComp = { type: 'BODY', text: fd.body };
    if (fd.variableSamples && fd.variableSamples.length > 0) {
      bodyComp.example = { body_text: [previewTemplate(fd, fd.variableSamples)] };
    }
    components.push(bodyComp);
    if (fd.footer) components.push({ type: 'FOOTER', text: fd.footer });
    return { name: fd.name, category: (fd.category || '').toUpperCase(), language: fd.language, components };
  };

  // ── STYLES ──────────────────────────────────────────────────────────────────

  const S = {
    page: { fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#f7f8fa', padding: '24px 32px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    titleBlock: {},
    title: { fontSize: 22, fontWeight: 700, color: '#111', margin: 0 },
    subtitle: { fontSize: 13, color: '#888', marginTop: 3 },
    btnPrimary: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#7c3aed', color: '#fff', border: 'none',
      padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
      cursor: 'pointer', transition: 'background .15s',
    },
    card: { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: '#fafafa', borderBottom: '1px solid #f0f0f0' },
    th: { padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#999', textAlign: 'left', letterSpacing: '.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' },
    td: { padding: '14px 16px', fontSize: 14, color: '#222', verticalAlign: 'middle' },
    nameCell: { display: 'flex', alignItems: 'center', gap: 12 },
    nameText: { fontWeight: 600, color: '#111', fontSize: 14 },
    subText: { fontSize: 12, color: '#aaa', marginTop: 1 },
    divider: { borderTop: '1px solid #f4f4f4', margin: 0 },
    cbx: { width: 16, height: 16, cursor: 'pointer', accentColor: '#7c3aed' },
    emptyState: { padding: '60px 0', textAlign: 'center', color: '#bbb', fontSize: 14 },
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#888', fontSize: 15 }}>Carregando templates…</div>
    </div>
  );

  return (
    <>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={S.page}>

        {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
        {view === 'list' && (
          <>
            <div style={S.header}>
              <div style={S.titleBlock}>
                <h1 style={S.title}>Templates</h1>
                <p style={S.subtitle}>{templates.length} template{templates.length !== 1 ? 's' : ''} encontrado{templates.length !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  style={{ ...S.btnPrimary, background: '#388e3c', border: 'none' }} 
                  onClick={handleSyncTemplates}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sync</span> Sincronizar
                </button>
                <button style={S.btnPrimary} onClick={() => handleOpenDialog()}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Novo Template
                </button>
              </div>
            </div>

            <div style={S.card}>
              <table style={S.table}>
                <thead style={S.thead}>
                  <tr>
                    <th style={{ ...S.th, width: 40 }}>
                      <input type="checkbox" style={S.cbx} checked={selectedAll} onChange={toggleAll} />
                    </th>
                    <th style={S.th}>Nome</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Categoria</th>
                    <th style={S.th}>Idioma</th>
                    <th style={S.th}>Última atualização</th>
                    <th style={{ ...S.th, width: 60 }} />
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan={7} style={S.emptyState}>
                        Nenhum template encontrado.<br />
                        <span style={{ fontSize: 12, color: '#ccc' }}>Crie um novo para começar.</span>
                      </td>
                    </tr>
                  )}
                  {templates.map((t, idx) => (
                    <tr
                      key={t.id}
                      onMouseEnter={() => setHoveredRow(t.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background: hoveredRow === t.id ? '#faf9ff' : (idx % 2 === 0 ? '#fff' : '#fdfdfd'),
                        transition: 'background .1s',
                        borderTop: idx > 0 ? '1px solid #f4f4f4' : 'none',
                      }}
                    >
                      {/* checkbox */}
                      <td style={{ ...S.td, width: 40 }}>
                        <input type="checkbox" style={S.cbx} checked={!!selected[t.id]} onChange={() => toggleRow(t.id)} />
                      </td>

                      {/* name + avatar */}
                      <td style={S.td}>
                        <div style={S.nameCell}>
                          <TemplateAvatar name={t.name} category={t.category} />
                          <div>
                            <div style={S.nameText}>{t.name}</div>
                            {t.body && (
                              <div style={S.subText}>
                                {t.body.length > 48 ? t.body.slice(0, 48) + '…' : t.body}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* status */}
                      <td style={S.td}><StatusBadge status={t.status} /></td>

                      {/* category */}
                      <td style={{ ...S.td, color: '#555' }}>
                        <span style={{ fontSize: 13 }}>{t.category || '—'}</span>
                      </td>

                      {/* language */}
                      <td style={{ ...S.td, color: '#555', fontSize: 13 }}>{t.language}</td>

                      {/* date */}
                      <td style={{ ...S.td, color: '#999', fontSize: 13 }}>
                        {new Date(t.updated_at || t.created_at).toLocaleString('pt-BR')}
                      </td>

                      {/* actions */}
                      <td style={{ ...S.td, padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, opacity: hoveredRow === t.id ? 1 : 0, transition: 'opacity .15s' }}>
                          <IconBtn title="Editar" icon="edit" color="#aaa" hoverColor="#7c3aed" onClick={() => handleOpenDialog(t)} />
                          <IconBtn title="Enviar" icon="send" color="#aaa" hoverColor="#0288d1" onClick={() => handleOpenSendDialog(t)} />
                          <IconBtn title="Atualizar status" icon="refresh" color="#aaa" hoverColor="#388e3c" onClick={() => handleRefreshStatus(t.id)} />
                          <IconBtn title="Excluir" icon="delete" color="#aaa" hoverColor="#d32f2f" onClick={() => handleDeleteTemplate(t.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── FORM VIEW ─────────────────────────────────────────────────── */}
        {view === 'form' && (
          <>
            <div style={S.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setView('list')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, padding: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                  Voltar
                </button>
                <h1 style={{ ...S.title, fontSize: 18 }}>{formData.id ? 'Editar Template' : 'Novo Template'}</h1>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
              {/* left */}
              <div style={{ ...S.card, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { label: 'Nome do Template *', key: 'name', placeholder: 'ex: follow_up', type: 'input' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>{label}</label>
                    <input type="text" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} placeholder={placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                ))}

                {/* language */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Idioma *</label>
                  <select value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
                    <option value="" disabled>Selecione o idioma</option>
                    <option value="pt_BR">Português (Brasil)</option>
                    <option value="en_US">English (US)</option>
                    <option value="es_ES">Español</option>
                  </select>
                </div>

                {/* category */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Categoria *</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
                    <option value="" disabled>Selecione a categoria</option>
                    <option value="UTILITY">Utility</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>

                {/* header */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Cabeçalho (opcional)</label>
                  <input type="text" value={formData.header} onChange={e => setFormData({ ...formData, header: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>

                {/* body */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Corpo da Mensagem *</label>
                  <textarea value={formData.body} onChange={handleBodyChange} rows={4} placeholder="Digite {{ para inserir variáveis automaticamente."
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{'As variáveis são inseridas como {{1}}, {{2}}, etc.'}</p>
                </div>

                {/* footer */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Rodapé (opcional)</label>
                  <input type="text" value={formData.footer} onChange={e => setFormData({ ...formData, footer: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>

                {/* variable samples */}
                {formData.variableSamples.length > 0 && (
                  <div style={{ background: '#f9f9ff', borderRadius: 10, padding: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Amostras de Variáveis</h3>
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Forneça exemplos para a Meta analisar seu template.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {formData.variableSamples.map((v, i) => (
                        <div key={i}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>{`{{${v.name}}}`}</label>
                          <input type="text" value={v.value}
                            onChange={e => {
                              const s = [...formData.variableSamples]; s[i].value = e.target.value;
                              setFormData({ ...formData, variableSamples: s });
                            }}
                            placeholder="Valor de exemplo"
                            style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e8e8e8', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* payload preview */}
                <div style={{ background: '#f7f7f7', borderRadius: 10, padding: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#666' }}>Preview do Payload para Meta</h3>
                  <pre style={{ fontSize: 11, background: '#fff', border: '1px solid #eee', borderRadius: 7, padding: 10, overflowX: 'auto', margin: 0, color: '#444' }}>
                    {JSON.stringify(buildMetaPayload(formData), null, 2)}
                  </pre>
                </div>

                {/* actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setView('list')}
                    style={{ padding: '10px 20px', border: '1.5px solid #e0e0e0', borderRadius: 9, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                    Cancelar
                  </button>
                  <button onClick={handleSaveTemplate}
                    disabled={isApproved || (!formData.name || !formData.body || !formData.language || !formData.category)}
                    style={{ ...S.btnPrimary, opacity: (isApproved || (!formData.name || !formData.body || !formData.language || !formData.category)) ? .45 : 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                    {isApproved ? 'Aprovado - Não Editável' : (formData.id ? 'Atualizar' : 'Salvar Template')}
                  </button>
                </div>
              </div>

              {/* right: preview */}
              <div>
                <div style={{ ...S.card, padding: 20, position: 'sticky', top: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#555' }}>Pré-visualização</h3>
                  <div style={{ background: '#e5ddd5', borderRadius: 12, padding: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,.1)', maxWidth: 260 }}>
                      {formData.header && <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 6 }}>{formData.header}</div>}
                      <div style={{ fontSize: 13, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                        {previewTemplate(formData, formData.variableSamples) || <span style={{ color: '#bbb' }}>Corpo da mensagem…</span>}
                      </div>
                      {formData.footer && <div style={{ fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 6 }}>{formData.footer}</div>}
                      <div style={{ fontSize: 10, color: '#aaa', textAlign: 'right', marginTop: 6 }}>
                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>As variáveis são substituídas pelos valores de exemplo em tempo real.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SEND DIALOG ──────────────────────────────────────────────── */}
        {sendDialogOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Enviar: <span style={{ color: '#7c3aed' }}>{selectedTemplate?.name}</span></h2>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Número de Telefone</label>
              <input type="text" value={sendForm.phoneNumber} onChange={e => setSendForm({ ...sendForm, phoneNumber: e.target.value })} placeholder="55XXYYYYYYYY"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 14 }} />
              {selectedTemplate && (
                <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, fontSize: 13, color: '#555', marginBottom: 16 }}>
                  {previewTemplate(selectedTemplate, selectedTemplate.variableSamples)}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => { setSendDialogOpen(false); setSelectedTemplate(null); }}
                  style={{ padding: '9px 18px', border: '1.5px solid #e0e0e0', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={handleSendTemplate} style={S.btnPrimary}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span> Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── POPUP ─────────────────────────────────────────────────────── */}
        {popup.show && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>
                {popup.type === 'success' ? '✅' : popup.type === 'error' ? '❌' : 'ℹ️'}
              </div>
              <p style={{ fontSize: 15, color: '#333', marginBottom: 20 }}>{popup.message}</p>
              <button onClick={() => setPopup(p => ({ ...p, show: false }))} style={S.btnPrimary}>OK</button>
            </div>
          </div>
        )}

        {/* ── CONFIRM DIALOG ───────────────────────────────────────────── */}
        {confirmDialog.show && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}>
              <p style={{ fontSize: 15, color: '#333', marginBottom: 20 }}>{confirmDialog.message}</p>
              <div style={{ background: '#f7f7f7', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#666' }}>Preview da Requisição</h3>
                <pre style={{ fontSize: 11, background: '#fff', border: '1px solid #eee', borderRadius: 7, padding: 10, overflowX: 'auto', margin: 0, color: '#444' }}>
                  {confirmDialog.requestPreview}
                </pre>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setConfirmDialog(p => ({ ...p, show: false }))}
                  style={{ padding: '9px 18px', border: '1.5px solid #e0e0e0', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={() => { confirmDialog.onConfirm?.(); setConfirmDialog(p => ({ ...p, show: false })); }}
                  style={{ padding: '9px 18px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Confirmar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}