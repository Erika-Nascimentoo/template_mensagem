import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';

function TestTextarea() {
  const [text, setText] = useState('');
  
  console.log('Text state:', text);
  
  return (
    <Box sx={{ p: 3 }}>
      <TextField
        fullWidth
        label="Teste Simples"
        value={text}
        onChange={(e) => setText(e.target.value)}
        multiline
        rows={4}
        placeholder="Digite algo aqui..."
      />
      <Box sx={{ mt: 2 }}>
        <Typography>Valor atual: {text}</Typography>
        <Button 
          variant="contained" 
          onClick={() => alert('Valor: ' + text)}
          sx={{ mt: 1 }}
        >
          Mostrar Valor
        </Button>
      </Box>
    </Box>
  );
}

export default TestTextarea;
