import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  AppBar,
  Toolbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Send,
  Message,
  Preview,
  Save
} from '@mui/icons-material';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Templates() {
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'marketing',
    header: '',
    body: '',
    footer: '',
    buttons: [],
    variableSamples: [] // Array de {name: 'nome', value: 'Maria'}
  });
  
  // Send form state
  const [sendForm, setSendForm] = useState({
    to: '',
    parameters: []
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get('/api/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        header: template.header,
        body: template.body,
        footer: template.footer,
        buttons: template.buttons,
        variableSamples: template.variableSamples || []
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        category: 'marketing',
        header: '',
        body: '',
        footer: '',
        buttons: [],
        variableSamples: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await axios.put(`/api/templates/${editingTemplate.id}`, formData);
        alert('Template atualizado com sucesso!');
      } else {
        await axios.post('/api/templates', formData);
        alert('Template criado com sucesso!');
      }
      loadTemplates();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template. Tente novamente.');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      try {
        await axios.delete(`/api/templates/${id}`);
        loadTemplates();
      } catch (error) {
        console.error('Erro ao excluir template:', error);
      }
    }
  };

  const handleOpenSendDialog = (template) => {
    setSelectedTemplate(template);
    setSendForm({
      to: '',
      parameters: extractParameters(template.body)
    });
    setSendDialogOpen(true);
  };

  const handleCloseSendDialog = () => {
    setSendDialogOpen(false);
    setSelectedTemplate(null);
  };

  const extractParameters = (body) => {
    const matches = body.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    return matches.map(() => '');
  };

  const handleSendTemplate = async () => {
    try {
      await axios.post('/api/send-template', {
        to: sendForm.to.replace(/\D/g, ''),
        templateName: selectedTemplate.name,
        parameters: sendForm.parameters.filter(p => p.trim() !== '')
      });
      handleCloseSendDialog();
      alert('Template enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar template:', error);
      alert('Erro ao enviar template. Verifique o console.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Pendente';
    }
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

  const updateVariableSamples = (body, currentFormData) => {
    const variables = extractVariables(body);
    const currentSamples = currentFormData.variableSamples;
    
    const newSamples = variables.map(variable => {
      const existing = currentSamples.find(sample => sample.name === variable);
      return existing || { name: variable, value: '' };
    });
    
    return newSamples;
  };

  const handleBodyChange = (e) => {
    const newBody = e.target.value;
    console.log('=== BODY CHANGE DEBUG ===');
    console.log('e.target.value:', newBody);
    
    setFormData(prev => {
      console.log('Prev state:', prev);
      const newVariableSamples = updateVariableSamples(newBody, prev);
      const newState = { 
        ...prev, 
        body: newBody,
        variableSamples: newVariableSamples 
      };
      console.log('New state:', newState);
      return newState;
    });
  };

  const handleVariableSampleChange = (index, value) => {
    const newSamples = [...formData.variableSamples];
    newSamples[index].value = value;
    setFormData({ ...formData, variableSamples: newSamples });
  };

  const previewTemplate = (template, variableSamples = []) => {
    let preview = template.body || '';
    
    // Substitui variáveis nomeadas {{nome}} pelos valores dos samples
    variableSamples.forEach((sample) => {
      if (sample.name && sample.value) {
        const regex = new RegExp(`{{${sample.name}}}`, 'g');
        preview = preview.replace(regex, sample.value);
      }
    });
    
    // Também substitui variáveis numéricas {{1}}, {{2}} etc. se houver parâmetros
    variableSamples.forEach((sample, index) => {
      if (sample.value) {
        preview = preview.replace(`{{${index + 1}}}`, sample.value);
      }
    });
    
    return preview;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <AppBar position="static" sx={{ py: 2, bgcolor: '#ffffff', color: '#111111', border: '1px solid #e5e7eb' }}>
        <Toolbar>
          <Message sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gerenciador de Templates WhatsApp
          </Typography>
        </Toolbar>
      </AppBar>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Meus Templates" />
          <Tab label="Criar Template" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Templates Criados</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#7C3AED', color: '#ffffff', '&:hover': { bgcolor: '#6D28D9' } }}
            >
              Novo Template
            </Button>
          </Box>

          <List>
            {templates.map((template) => (
              <ListItem key={template.id} sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, mb: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{template.name}</Typography>
                      <Chip 
                        label={getStatusText(template.status)} 
                        color={getStatusColor(template.status)}
                        size="small"
                      />
                      <Chip label={template.category} size="small" variant="outlined" />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {previewTemplate(template)}
                      </Typography>
                      {template.footer && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {template.footer}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleOpenSendDialog(template)}
                    sx={{ mr: 1 }}
                    title="Enviar Template"
                  >
                    <Send />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleOpenDialog(template)}
                    sx={{ mr: 1 }}
                    title="Editar Template"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleDeleteTemplate(template.id)}
                    color="error"
                    title="Excluir Template"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Criar Novo Template
          </Typography>
          
          <Grid container spacing={3}>
            {/* Coluna Esquerda - Formulário */}
            <Grid item xs={12} md={7}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome do Template"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <MenuItem value="marketing">Marketing</MenuItem>
                      <MenuItem value="utility">Utilidade</MenuItem>
                      <MenuItem value="authentication">Autenticação</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cabeçalho (opcional)"
                    value={formData.header}
                    onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                    helperText="Título que aparece no topo da mensagem"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Corpo da Mensagem"
                    value={formData.body}
                    onChange={handleBodyChange}
                    multiline
                    rows={4}
                    required
                    placeholder="Digite sua mensagem aqui..."
                    helperText='Use {{nome}}, {{area_caso}} para variáveis. Ex: "Olá {{nome}}, seu caso de {{area_caso}} foi recebido."'
                  />
                </Grid>

                {/* Seção de Amostras de Variáveis */}
                {formData.variableSamples.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        Amostras de Variáveis
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Forneça exemplos para ajudar a Meta a analisar seu modelo. Não inclua informações de clientes reais.
                      </Typography>
                      <Grid container spacing={2}>
                        {formData.variableSamples.map((variable, index) => (
                          <Grid item xs={12} md={6} key={index}>
                            <TextField
                              fullWidth
                              label={`{{${variable.name}}}`}
                              placeholder={`Exemplo para ${variable.name}`}
                              value={variable.value}
                              onChange={(e) => handleVariableSampleChange(index, e.target.value)}
                              helperText={`Valor de exemplo para ${variable.name}`}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Rodapé (opcional)"
                    value={formData.footer}
                    onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                    helperText="Texto que aparece no final da mensagem"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveTemplate}
                      disabled={!formData.name || !formData.body}
                      sx={{ bgcolor: '#7622e1', '&:hover': { bgcolor: '#5a1ab0' } }}
                    >
                      Salvar Template
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Coluna Direita - Preview */}
            <Grid item xs={12} md={5}>
              <Box sx={{ position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Preview />
                  Preview
                </Typography>
                
                {/* Preview Container */}
                <Paper 
                  sx={{ 
                    bgcolor: '#e5ddd5', 
                    p: 2, 
                    minHeight: 400,
                    backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gcDBA0vKzq3qQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAJElEQVQ4y2NgYGD4z0ABYBw1bNQwjAxY1DAcDRw1cNTAaDlg1EAABgY2F5mQXzQAAAAASUVORK5CYII=")',
                    backgroundRepeat: 'repeat'
                  }}
                >
                  {/* Mensagem Preview */}
                  <Box
                    sx={{
                      bgcolor: 'white',
                      borderRadius: 2,
                      p: 1.5,
                      maxWidth: '90%',
                      
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: -6,
                        top: 8,
                        width: 0,
                        height: 0,
                        borderTop: '6px solid transparent',
                        borderRight: '6px solid white',
                        borderBottom: '6px solid transparent',
                      }
                    }}
                  >
                    {/* Header */}
                    {formData.header && (
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold', 
                          mb: 0.5,
                          color: '#1f2937'
                        }}
                      >
                        {formData.header}
                      </Typography>
                    )}
                    
                    {/* Body com variáveis substituídas */}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: '#1f2937',
                        lineHeight: 1.4
                      }}
                    >
                      {previewTemplate(formData, formData.variableSamples)}
                    </Typography>
                    
                    {/* Footer */}
                    {formData.footer && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 1,
                          color: '#6b7280',
                          fontStyle: 'italic'
                        }}
                      >
                        {formData.footer}
                      </Typography>
                    )}
                    
                    {/* Timestamp */}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        textAlign: 'right',
                        mt: 0.5,
                        color: '#6b7280',
                        fontSize: '0.7rem'
                      }}
                    >
                      {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Paper>

                {/* Info do Preview */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Preview em tempo real</strong><br/>
                    As variáveis {'{{nome}}'} serão substituídas pelos valores de exemplo fornecidos acima.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialog para Editar Template */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Template"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="utility">Utilidade</MenuItem>
                  <MenuItem value="authentication">Autenticação</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cabeçalho (opcional)"
                value={formData.header}
                onChange={(e) => setFormData({ ...formData, header: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Corpo da Mensagem"
                value={formData.body}
                onChange={handleBodyChange}
                multiline
                rows={4}
                required
                helperText='Use {{nome}}, {{area_caso}} para variáveis. Ex: "Olá {{nome}}, seu caso de {{area_caso}} foi recebido."'
              />
            </Grid>

            {/* Seção de Amostras de Variáveis no Dialog */}
            {formData.variableSamples.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Amostras de Variáveis
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Forneça exemplos para ajudar a Meta a analisar seu modelo. Não inclua informações de clientes reais.
                  </Typography>
                  <Grid container spacing={2}>
                    {formData.variableSamples.map((variable, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <TextField
                          fullWidth
                          label={`{{${variable.name}}}`}
                          placeholder={`Exemplo para ${variable.name}`}
                          value={variable.value}
                          onChange={(e) => handleVariableSampleChange(index, e.target.value)}
                          helperText={`Valor de exemplo para ${variable.name}`}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rodapé (opcional)"
                value={formData.footer}
                onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveTemplate} variant="contained" sx={{ bgcolor: '#7622e1', '&:hover': { bgcolor: '#5a1ab0' } }}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Enviar Template */}
      <Dialog open={sendDialogOpen} onClose={handleCloseSendDialog}>
        <DialogTitle>Enviar Template: {selectedTemplate?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Número de Telefone"
              placeholder="+55 11 99999-9999"
              value={sendForm.to}
              onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            {sendForm.parameters.map((param, index) => (
              <TextField
                key={index}
                fullWidth
                label={`Parâmetro {{${index + 1}}}`}
                value={param}
                onChange={(e) => {
                  const newParams = [...sendForm.parameters];
                  newParams[index] = e.target.value;
                  setSendForm({ ...sendForm, parameters: newParams });
                }}
                sx={{ mb: 1 }}
              />
            ))}
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Preview: {selectedTemplate && previewTemplate(selectedTemplate, sendForm.parameters)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSendDialog}>Cancelar</Button>
          <Button onClick={handleSendTemplate} variant="contained" startIcon={<Send />} sx={{ bgcolor: '#7622e1', '&:hover': { bgcolor: '#5a1ab0' } }}>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Templates;
