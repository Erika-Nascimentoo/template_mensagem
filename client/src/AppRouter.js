import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link
} from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container
} from '@mui/material';
import { WhatsApp, Message, Science } from '@mui/icons-material';
import App from './App';
import Templates from './Templates';
import TemplateTest from './TemplateTest';

function AppRouter() {
  return (
    <Router>
      <AppBar position="static" sx={{ bgcolor: '#7622e1', color: 'white' }}>
        <Toolbar>
          <WhatsApp sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meta Chat Template
          </Typography>
          <Button 
            color="inherit" 
            component={Link} 
            to="/"
            startIcon={<WhatsApp />}
          >
            Chat
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/templates"
            startIcon={<Message />}
          >
            Templates
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/test-template"
            startIcon={<Science />}
          >
            Teste
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/test-template" element={<TemplateTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default AppRouter;
