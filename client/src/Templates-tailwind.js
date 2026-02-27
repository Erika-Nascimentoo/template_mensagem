import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY',
    header: '',
    body: '',
    footer: '',
    buttons: [],
    variableSamples: [],
    language: ''
  });
  const [sendForm, setSendForm] = useState({
    phoneNumber: '',
    parameters: []
  });
  const [popup, setPopup] = useState({ show: false, message: '', type: 'info' });
  const [dismissedNotifications, setDismissedNotifications] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates');
      // Normalize snake_case to camelCase for consistency
      const normalizedTemplates = response.data.map(template => ({
        ...template,
        variableSamples: template.variable_samples || template.variableSamples || [],
        language: template.language || 'Não definido',
        status: template.status ? template.status.toLowerCase() : 'pending'
      }));
      setTemplates(normalizedTemplates);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
  };

  const buildMetaPayload = (formData) => {
    const components = [];

    if (formData.header) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: getFilledText(formData.header, formData.variableSamples)
      });
    }

    components.push({
      type: "BODY",
      text: getFilledText(formData.body, formData.variableSamples)
    });

    if (formData.footer) {
      components.push({
        type: "FOOTER",
        text: getFilledText(formData.footer, formData.variableSamples)
      });
    }

    const payload = {
      name: formData.name,
      category: formData.category.toUpperCase(),
      language: formData.language,
      components: components
    };

    return payload;
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setFormData({
        ...template,
        variableSamples: template.variableSamples || []
      });
      setTabValue(1);
    } else {
      setFormData({
        id: null,
        name: '',
        category: '',
        header: '',
        body: '',
        footer: '',
        buttons: [],
        variableSamples: [],
        language: ''
      });
      setTabValue(1);
    }
  };

  const handleOpenSendDialog = (template) => {
    setSelectedTemplate({
      ...template,
      variableSamples: template.variableSamples || []
    });
    setSendForm({
      phoneNumber: '',
      parameters: (template.variableSamples || []).map(v => v.value || '')
    });
    setSendDialogOpen(true);
  };

  const handleCloseSendDialog = () => {
    setSendDialogOpen(false);
    setSelectedTemplate(null);
  };

  const extractVariables = (body) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(body)) !== null) {
      variables.push(match[1]);
    }
    return variables;
  };

  const updateVariableSamples = (body) => {
    const variables = extractVariables(body);
    const currentSamples = formData.variableSamples;
    const newSamples = variables.map(variable => {
      const existing = currentSamples.find(sample => sample.name === variable);
      return existing || { name: variable, value: '', type: 'name' };
    });
    return newSamples;
  };

  const handleBodyChange = (e) => {
    const newBody = e.target.value;
    const newSamples = updateVariableSamples(newBody);
    setFormData({ ...formData, body: newBody, variableSamples: newSamples });
  };

  const handleVariableTypeChange = (index, type) => {
    const newSamples = [...formData.variableSamples];
    newSamples[index].type = type;
    setFormData({ ...formData, variableSamples: newSamples });
  };

  const handleVariableSampleChange = (index, value) => {
    const newSamples = [...formData.variableSamples];
    newSamples[index].value = value;
    setFormData({ ...formData, variableSamples: newSamples });
  };

  const handleSaveTemplate = async () => {
    try {
      if (formData.id) {
        await axios.put(`/api/templates/${formData.id}`, formData);
      } else {
        await axios.post('/api/templates', formData);
      }

      fetchTemplates();
      setTabValue(0);
      setPopup({ show: true, message: 'Template salvo com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      setPopup({ show: true, message: 'Erro ao salvar template. Verifique o console.', type: 'error' });
    }
  };

  const handleConfirmDelete = async (id) => {
    try {
      await axios.delete(`/api/templates/${id}`);
      fetchTemplates();
      setPopup({ show: true, message: 'Template excluído com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      setPopup({ show: true, message: 'Erro ao excluir template. Verifique o console.', type: 'error' });
    }
  };

  const handleDeleteTemplate = async (id) => {
    setConfirmDialog({
      show: true,
      message: 'Tem certeza que deseja excluir este template?',
      onConfirm: () => handleConfirmDelete(id)
    });
  };

  const handleRefreshStatus = async (id) => {
    try {
      await axios.put(`/api/templates/${id}/status`);
      fetchTemplates();
      setPopup({ show: true, message: 'Status atualizado com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setPopup({ show: true, message: 'Erro ao atualizar status.', type: 'error' });
    }
  };

  const handleSendTemplate = async () => {
    try {
      await axios.post('/api/send-template', {
        to: sendForm.phoneNumber.replace(/\D/g, ''),
        templateName: selectedTemplate.name,
        parameters: sendForm.parameters.filter(p => p.trim())
      });

      handleCloseSendDialog();
      setPopup({ show: true, message: 'Template enviado com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao enviar template:', error);
      setPopup({ show: true, message: 'Erro ao enviar template. Verifique o console.', type: 'error' });
    }
  };

  const previewTemplate = (template, variableSamples = []) => {
    let preview = template.body || '';

    if (!variableSamples) variableSamples = [];

    variableSamples.forEach((sample) => {
      if (sample.name && sample.value) {
        const regex = new RegExp(`{{${sample.name}}}`, 'g');
        preview = preview.replace(regex, sample.value);
      }
    });

    variableSamples.forEach((sample, index) => {
      if (sample.value) {
        preview = preview.replace(`{{${index + 1}}}`, sample.value);
      }
    });

    return preview;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-primary text-white';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Pendente';
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <nav className="bg-primary text-white py-2 mb-2 rounded-lg shadow-md">
          <div className="px-4 py-3 flex items-center">
            <span className="material-symbols-outlined text-2xl mr-3">content_copy</span>
            <h1 className="text-lg font-semibold">Gerenciador de Templates WhatsApp</h1>
          </div>
        </nav>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => handleTabChange(0)}
              className={`px-4 py-2 text-sm font-medium ${
                tabValue === 0
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Meus Templates
            </button>
            <button
              onClick={() => handleTabChange(2)}
              className={`px-4 py-2 text-sm font-medium ${
                tabValue === 2
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Status dos Templates
            </button>
          </div>

          {tabValue === 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Templates Criados</h2>
                <button
                  onClick={() => handleOpenDialog()}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff">
                    <path d="M6 12H18M12 6V18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Novo Template
                </button>
              </div>

              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-base font-semibold">{template.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                            {getStatusText(template.status)}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium border border-gray-300">
                            {template.category}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{previewTemplate(template)}</p>
                          {template.footer && (
                            <p className="text-xs text-gray-500 italic mt-1">{template.footer}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleOpenSendDialog(template)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Enviar Template"
                        >
                          <span className="material-symbols-outlined text-sm">send</span>
                        </button>
                        <button
                          onClick={() => handleOpenDialog(template)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Editar Template"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir Template"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabValue === 1 && (
            <div className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Template *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="ex: follow_up"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Idioma *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      >
                        <option value="" disabled>Selecione o idioma</option>
                        <option value="pt_BR">Português (Brasil)</option>
                        <option value="en_US">English (US)</option>
                        <option value="es_ES">Español</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="" disabled>Selecione a categoria</option>
                        <option value="utility">Utility</option>
                        <option value="marketing">Marketing</option>
                        <option value="authentication">Authentication</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cabeçalho (opcional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.header}
                        onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Corpo da Mensagem *
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        value={formData.body}
                        onChange={handleBodyChange}
                        rows={4}
                        placeholder="Digite o corpo da mensagem com variáveis como {{nome}}, {{area_caso}}"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use nome, area_caso para variáveis dinâmicas
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rodapé (opcional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.footer}
                        onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                      />
                    </div>

                    {formData.variableSamples.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-base font-semibold mb-2">Amostras de Variáveis</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Forneça exemplos para ajudar a Meta a analisar seu modelo.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {formData.variableSamples.map((variable, index) => (
                            <div key={index}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {`{{${variable.name}}}`}
                              </label>
                              <div className="flex space-x-2">
                                <select
                                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
                                  value={variable.type}
                                  onChange={(e) => handleVariableTypeChange(index, e.target.value)}
                                >
                                  <option value="name">Nome</option>
                                  <option value="number">Número</option>
                                </select>
                                <input
                                  type="text"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                  value={variable.value}
                                  onChange={(e) => handleVariableSampleChange(index, e.target.value)}
                                  placeholder="Valor de exemplo"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-base font-semibold mb-2">Preview do Payload para Meta</h3>
                      <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">{JSON.stringify(buildMetaPayload(formData), null, 2)}</pre>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setTabValue(0)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={!formData.name || !formData.body || !formData.language || !formData.category}
                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <span className="material-symbols-outlined mr-2 text-sm">save</span>
                        {formData.id ? 'Atualizar Template' : 'Salvar Template'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-base font-semibold mb-3">Preview</h3>

                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        {formData.header && (
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            {formData.header}
                          </div>
                        )}

                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {previewTemplate(formData, formData.variableSamples)}
                        </div>

                        {formData.footer && (
                          <div className="text-xs text-gray-500 italic mt-2">
                            {formData.footer}
                          </div>
                        )}

                        <div className="text-xs text-gray-400 mt-3">
                          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        Preview em tempo real - As variáveis serão substituídas pelos valores de exemplo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tabValue === 2 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-4">Status dos Templates</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idioma</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {templates.map((template) => (
                      <tr key={template.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                            {getStatusText(template.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{template.category}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{template.language}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleRefreshStatus(template.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Atualizar Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-2">
                {templates.filter(template => template.status === 'pending' && !dismissedNotifications[template.id]).map((template) => (
                  <div key={template.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Template "{template.name}": Você será notificado assim que seu template for aprovado.
                    </p>
                    <button
                      onClick={() => setDismissedNotifications(prev => ({ ...prev, [template.id]: true }))}
                      className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
                    >
                      Entendi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {sendDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">
              Enviar Template: {selectedTemplate?.name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Telefone
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={sendForm.phoneNumber}
                  onChange={(e) => setSendForm({ ...sendForm, phoneNumber: e.target.value })}
                  placeholder="55XXYYYYYYYY"
                />
              </div>

              <p className="text-sm text-gray-600">
                Preview: {selectedTemplate && previewTemplate(selectedTemplate, selectedTemplate.variableSamples.map((v, i) => ({ name: v.name, value: sendForm.parameters[i] || v.value })))}
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseSendDialog}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendTemplate}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors flex items-center"
              >
                <span className="material-symbols-outlined mr-2 text-sm">send</span>
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {popup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <p className="text-lg mb-4">{popup.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setPopup(prev => ({ ...prev, show: false }))}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <p className="text-lg mb-4">{confirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, show: false }));
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Templates;
