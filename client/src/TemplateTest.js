import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
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
      
      // Debug detalhado
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
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          🧪 Teste de Templates Meta
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Alert severity="info">
            <strong>hello_world</strong> é um template padrão que já existe na Meta
          </Alert>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nome do Template"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            helperText="Tente 'hello_world' para teste"
          />
          
          <TextField
            label="Número de Telefone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            helperText="Formato: 55XXYYYYYYYY"
          />
          
          <Button
            variant="contained"
            onClick={sendTestTemplate}
            disabled={loading}
            sx={{ alignSelf: 'flex-start' }}
          >
            {loading ? 'Enviando...' : '📤 Enviar Template'}
          </Button>
          
          {result && (
            <Alert severity={result.includes('✅') ? 'success' : 'error'}>
              {result}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default TemplateTest;
