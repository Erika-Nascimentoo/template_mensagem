import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid
} from '@mui/material';

function SimpleTemplate() {
  const [message, setMessage] = useState('');
  const [showVars, setShowVars] = useState(false);
  
  const handleChange = (e) => {
    const value = e.target.value;
    console.log('SimpleTemplate - value:', value);
    setMessage(value);
    
    // Detecta variáveis
    const hasVars = value.includes('{{') && value.includes('}}');
    setShowVars(hasVars);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Template Simples (Debug)
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mensagem"
              value={message}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Digite {{nome}} e {{area_caso}} para testar..."
            />
          </Grid>
          
          {showVars && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'lightblue' }}>
                <Typography variant="h6">
                  🎉 Variáveis Detectadas!
                </Typography>
                <Typography>
                  Mensagem atual: {message}
                </Typography>
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Valor do estado: "{message}"
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default SimpleTemplate;
