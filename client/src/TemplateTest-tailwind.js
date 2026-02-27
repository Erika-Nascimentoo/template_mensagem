import React, { useState } from 'react';
import axios from 'axios';

function TemplateTest() {
  const [phoneNumber, setPhoneNumber] = useState('556740425756');
  const [templateName, setTemplateName] = useState('hello_world');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const sendTestTemplate = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await axios.post('/api/send-template', {
        to: phoneNumber.replace(/\D/g, ''),
        templateName: templateName,
        parameters: []
      });
      
      setResult('✅ Template enviado com sucesso!');
      console.log('Response:', response.data);
    } catch (error) {
      setResult('❌ Erro ao enviar template: ' + error.message);
      console.error('Error:', error.response?.data || error);
      
      if (error.response?.data) {
        console.log('=== DEBUG DETALHADO ===');
        console.log('Status:', error.response.status);
        console.log('Error Data:', error.response.data);
        console.log('Headers:', error.response.headers);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-2">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center">
          <span className="material-symbols-outlined mr-2 text-xl">science</span>
          Teste de Templates Meta
        </h1>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>hello_world</strong> é um template padrão que já existe na Meta
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Template
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Tente 'hello_world' para teste"
            />
            <p className="text-xs text-gray-500 mt-1">Tente 'hello_world' para teste</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Telefone
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Formato: 55XXYYYYYYYY"
            />
            <p className="text-xs text-gray-500 mt-1">Formato: 55XXYYYYYYYY</p>
          </div>
          
          <div className="flex justify-start">
            <button
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={sendTestTemplate}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Template'}
            </button>
          </div>
          
          {result && (
            <div className={`p-4 rounded-lg ${
              result.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateTest;
