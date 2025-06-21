import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  User,
  Lock,
  Database,
  Shield,
  Save,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';

const Configuracoes = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados do perfil
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });

  // Estados das configurações do sistema
  const [configSistema, setConfigSistema] = useState({
    nome_instituicao: 'Associação Amigo do Povo',
    endereco: '',
    telefone: '',
    email: '',
    cnpj: '',
    logo_url: '',
    tema: 'light',
    idioma: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  });

  // Estados de segurança
  const [seguranca, setSeguranca] = useState({
    sessao_timeout: 30,
    max_tentativas_login: 5,
    bloqueio_temporario: 15,
    requisitos_senha: {
      minimo_caracteres: 8,
      maiusculas: true,
      minusculas: true,
      numeros: true,
      caracteres_especiais: true
    }
  });

  // Estados de backup
  const [backup, setBackup] = useState({
    backup_automatico: true,
    frequencia_backup: 'diario',
    retencao_backups: 30,
    backup_banco: true,
    backup_arquivos: true
  });

  // Estados de visibilidade de senhas
  const [showPasswords, setShowPasswords] = useState({
    atual: false,
    nova: false,
    confirmar: false
  });

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      setPerfil(prev => ({
        ...prev,
        nome: user.nome || '',
        email: user.email || ''
      }));
    }
    loadConfiguracoes();
  }, [user]);

  const loadConfiguracoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/configuracoes');
      if (response.data.success) {
        setConfigSistema(response.data.configuracoes || configSistema);
        setSeguranca(response.data.seguranca || seguranca);
        setBackup(response.data.backup || backup);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handlePerfilSubmit = async (e) => {
    e.preventDefault();
    
    if (perfil.nova_senha && perfil.nova_senha !== perfil.confirmar_senha) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/usuarios/perfil', {
        nome: perfil.nome,
        email: perfil.email,
        senha_atual: perfil.senha_atual,
        nova_senha: perfil.nova_senha
      });

      if (response.data.success) {
        toast.success('Perfil atualizado com sucesso');
        updateUser(response.data.usuario);
        
        // Limpar campos de senha
        setPerfil(prev => ({
          ...prev,
          senha_atual: '',
          nova_senha: '',
          confirmar_senha: ''
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSistemaSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await api.put('/configuracoes/sistema', configSistema);
      
      if (response.data.success) {
        toast.success('Configurações do sistema salvas');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleSegurancaSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await api.put('/configuracoes/seguranca', seguranca);
      
      if (response.data.success) {
        toast.success('Configurações de segurança salvas');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error);
      toast.error('Erro ao salvar configurações de segurança');
    } finally {
      setSaving(false);
    }
  };

  const handleBackupSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await api.put('/configuracoes/backup', backup);
      
      if (response.data.success) {
        toast.success('Configurações de backup salvas');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de backup:', error);
      toast.error('Erro ao salvar configurações de backup');
    } finally {
      setSaving(false);
    }
  };

  const handleBackupManual = async () => {
    try {
      setLoading(true);
      const response = await api.post('/configuracoes/backup/manual');
      
      if (response.data.success) {
        toast.success('Backup iniciado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao iniciar backup:', error);
      toast.error('Erro ao iniciar backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('backup', file);
      
      const response = await api.post('/configuracoes/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        toast.success('Backup restaurado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'perfil', name: 'Perfil', icon: User },
    { id: 'sistema', name: 'Sistema', icon: Settings },
    { id: 'seguranca', name: 'Segurança', icon: Shield },
    { id: 'backup', name: 'Backup', icon: Database }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie as configurações do sistema e seu perfil de usuário
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      <div className="mt-6">
        {/* Tab Perfil */}
        {activeTab === 'perfil' && (
          <div className="max-w-2xl">
            <form onSubmit={handlePerfilSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informações do Perfil
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={perfil.nome}
                      onChange={(e) => setPerfil(prev => ({ ...prev, nome: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={perfil.email}
                      onChange={(e) => setPerfil(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Alterar Senha
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Senha Atual
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.atual ? 'text' : 'password'}
                        value={perfil.senha_atual}
                        onChange={(e) => setPerfil(prev => ({ ...prev, senha_atual: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('atual')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.atual ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nova Senha
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.nova ? 'text' : 'password'}
                        value={perfil.nova_senha}
                        onChange={(e) => setPerfil(prev => ({ ...prev, nova_senha: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('nova')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.nova ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirmar Nova Senha
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.confirmar ? 'text' : 'password'}
                        value={perfil.confirmar_senha}
                        onChange={(e) => setPerfil(prev => ({ ...prev, confirmar_senha: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmar')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirmar ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Sistema */}
        {activeTab === 'sistema' && (
          <div className="max-w-2xl">
            <form onSubmit={handleSistemaSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configurações da Instituição
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nome da Instituição
                    </label>
                    <input
                      type="text"
                      value={configSistema.nome_instituicao}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, nome_instituicao: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Endereço
                    </label>
                    <textarea
                      value={configSistema.endereco}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, endereco: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={configSistema.telefone}
                        onChange={(e) => setConfigSistema(prev => ({ ...prev, telefone: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        value={configSistema.cnpj}
                        onChange={(e) => setConfigSistema(prev => ({ ...prev, cnpj: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email de Contato
                    </label>
                    <input
                      type="email"
                      value={configSistema.email}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configurações da Interface
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tema
                    </label>
                    <select
                      value={configSistema.tema}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, tema: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Idioma
                    </label>
                    <select
                      value={configSistema.idioma}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, idioma: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fuso Horário
                    </label>
                    <select
                      value={configSistema.timezone}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, timezone: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/Belem">Belém (GMT-3)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Segurança */}
        {activeTab === 'seguranca' && (
          <div className="max-w-2xl">
            <form onSubmit={handleSegurancaSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configurações de Sessão
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Timeout da Sessão (minutos)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={seguranca.sessao_timeout}
                      onChange={(e) => setSeguranca(prev => ({ ...prev, sessao_timeout: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Máximo de Tentativas de Login
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={seguranca.max_tentativas_login}
                      onChange={(e) => setSeguranca(prev => ({ ...prev, max_tentativas_login: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tempo de Bloqueio (minutos)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={seguranca.bloqueio_temporario}
                      onChange={(e) => setSeguranca(prev => ({ ...prev, bloqueio_temporario: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Requisitos de Senha
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mínimo de Caracteres
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      value={seguranca.requisitos_senha.minimo_caracteres}
                      onChange={(e) => setSeguranca(prev => ({
                        ...prev,
                        requisitos_senha: {
                          ...prev.requisitos_senha,
                          minimo_caracteres: parseInt(e.target.value)
                        }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={seguranca.requisitos_senha.maiusculas}
                        onChange={(e) => setSeguranca(prev => ({
                          ...prev,
                          requisitos_senha: {
                            ...prev.requisitos_senha,
                            maiusculas: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Exigir letras maiúsculas
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={seguranca.requisitos_senha.minusculas}
                        onChange={(e) => setSeguranca(prev => ({
                          ...prev,
                          requisitos_senha: {
                            ...prev.requisitos_senha,
                            minusculas: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Exigir letras minúsculas
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={seguranca.requisitos_senha.numeros}
                        onChange={(e) => setSeguranca(prev => ({
                          ...prev,
                          requisitos_senha: {
                            ...prev.requisitos_senha,
                            numeros: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Exigir números
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={seguranca.requisitos_senha.caracteres_especiais}
                        onChange={(e) => setSeguranca(prev => ({
                          ...prev,
                          requisitos_senha: {
                            ...prev.requisitos_senha,
                            caracteres_especiais: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Exigir caracteres especiais
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Backup */}
        {activeTab === 'backup' && (
          <div className="max-w-2xl">
            <form onSubmit={handleBackupSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configurações de Backup Automático
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={backup.backup_automatico}
                      onChange={(e) => setBackup(prev => ({ ...prev, backup_automatico: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Ativar backup automático
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Frequência do Backup
                    </label>
                    <select
                      value={backup.frequencia_backup}
                      onChange={(e) => setBackup(prev => ({ ...prev, frequencia_backup: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="diario">Diário</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Retenção de Backups (dias)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={backup.retencao_backups}
                      onChange={(e) => setBackup(prev => ({ ...prev, retencao_backups: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={backup.backup_banco}
                        onChange={(e) => setBackup(prev => ({ ...prev, backup_banco: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Incluir banco de dados
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={backup.backup_arquivos}
                        onChange={(e) => setBackup(prev => ({ ...prev, backup_arquivos: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Incluir arquivos do sistema
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                </button>
              </div>
            </form>

            {/* Ações de Backup */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ações de Backup
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Backup Manual</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Iniciar um backup manual do sistema
                  </p>
                  <button
                    onClick={handleBackupManual}
                    disabled={loading}
                    className="btn-secondary flex items-center space-x-2 w-full justify-center"
                  >
                    <Download className="h-4 w-4" />
                    <span>{loading ? 'Iniciando...' : 'Iniciar Backup'}</span>
                  </button>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Restaurar Backup</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Restaurar sistema a partir de um backup
                  </p>
                  <input
                    type="file"
                    accept=".sql,.zip,.backup"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleRestoreBackup(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="restore-file"
                  />
                  <label
                    htmlFor="restore-file"
                    className="btn-secondary flex items-center space-x-2 w-full justify-center cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Selecionar Arquivo</span>
                  </label>
                </div>
              </div>

              {/* Status do Backup */}
              <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Status do Último Backup</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Último backup:</span>
                    <span className="ml-2 text-gray-900">Não disponível</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      Não realizado
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tamanho:</span>
                    <span className="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Próximo backup:</span>
                    <span className="ml-2 text-gray-900">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Configuracoes; 