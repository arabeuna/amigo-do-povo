import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Eye,
  MoreHorizontal,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { atividadesAPI } from '../services/api';
import toast from 'react-hot-toast';

const Atividades = () => {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [substituir, setSubstituir] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    dias_semana: '',
    horario_inicio: '',
    horario_fim: '',
    vagas_maximas: 30,
    valor_mensalidade: ''
  });

  const tiposAtividade = [
    'dança',
    'natação',
    'bombeiro_mirim',
    'informática',
    'hidroginástica',
    'funcional',
    'fisioterapia',
    'karatê'
  ];

  const diasSemana = [
    'segunda',
    'terça',
    'quarta',
    'quinta',
    'sexta',
    'sábado',
    'domingo'
  ];

  useEffect(() => {
    loadAtividades();
  }, []);

  const loadAtividades = async () => {
    try {
      console.log('🔄 Carregando atividades...');
      setLoading(true);
      const response = await atividadesAPI.listar();
      console.log('✅ Atividades carregadas:', response.data);
      
      // Garantir que atividades seja sempre um array
      // A API retorna: { success: true, data: { atividades: [...], paginacao: {...} } }
      let atividadesData = response.data.data?.atividades || response.data.data || response.data || [];
      if (!Array.isArray(atividadesData)) {
        console.warn('⚠️ Dados de atividades não são um array:', atividadesData);
        atividadesData = [];
      }
      
      console.log('📋 Atividades processadas:', atividadesData);
      setAtividades(atividadesData);
    } catch (error) {
      console.error('💥 Erro ao carregar atividades:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      toast.error('Erro ao carregar atividades');
      setAtividades([]); // Garantir que seja um array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('🔄 Salvando atividade...', formData);
      
      if (editingAtividade) {
        await atividadesAPI.atualizar(editingAtividade.id, formData);
        toast.success('Atividade atualizada com sucesso!');
      } else {
        await atividadesAPI.criar(formData);
        toast.success('Atividade criada com sucesso!');
      }
      
      setShowModal(false);
      setEditingAtividade(null);
      resetForm();
      loadAtividades();
    } catch (error) {
      console.error('💥 Erro ao salvar atividade:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      toast.error('Erro ao salvar atividade');
    }
  };

  const handleEdit = (atividade) => {
    setEditingAtividade(atividade);
    setFormData({
      nome: atividade.nome,
      descricao: atividade.descricao || '',
      tipo: atividade.tipo,
      dias_semana: atividade.dias_semana || '',
      horario_inicio: atividade.horario_inicio || '',
      horario_fim: atividade.horario_fim || '',
      vagas_maximas: atividade.vagas_maximas || 30,
      valor_mensalidade: atividade.valor_mensalidade || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta atividade?')) {
      try {
        await atividadesAPI.deletar(id);
        toast.success('Atividade excluída com sucesso!');
        loadAtividades();
      } catch (error) {
        console.error('💥 Erro ao excluir atividade:', error);
        console.error('📋 Detalhes do erro:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        toast.error('Erro ao excluir atividade');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo: '',
      dias_semana: '',
      horario_inicio: '',
      horario_fim: '',
      vagas_maximas: 30,
      valor_mensalidade: ''
    });
  };

  const openModal = () => {
    setEditingAtividade(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAtividade(null);
    resetForm();
  };

  const handleExportar = async (formato = 'excel') => {
    try {
      const params = { 
        formato,
        busca: searchTerm,
        tipo: filterTipo
      };
      
      const response = await atividadesAPI.exportar(params);
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `atividades_${new Date().toISOString().split('T')[0]}.${formato === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Lista de atividades exportada com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar atividades:', error);
      toast.error('Erro ao exportar atividades');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await atividadesAPI.downloadTemplate();
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_atividades.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      toast.error('Erro ao baixar template');
    }
  };

  const handleImportar = async (e) => {
    e.preventDefault();
    
    if (!importFile) {
      toast.error('Selecione um arquivo para importar');
      return;
    }

    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('arquivo', importFile);
      formData.append('substituir', substituir);
      
      const response = await atividadesAPI.importar(formData);
      
      toast.success(response.data.message);
      setShowImportModal(false);
      setImportFile(null);
      setSubstituir(false);
      
      // Recarregar dados
      loadAtividades();
      
    } catch (error) {
      console.error('Erro ao importar atividades:', error);
      toast.error(error.response?.data?.message || 'Erro ao importar atividades');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['csv', 'xlsx', 'xls'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Arquivo muito grande. Tamanho máximo: 5MB');
        return;
      }
      
      setImportFile(file);
    }
  };

  const filteredAtividades = Array.isArray(atividades) ? atividades.filter(atividade => {
    const matchesSearch = atividade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atividade.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterTipo || atividade.tipo === filterTipo;
    return matchesSearch && matchesFilter;
  }) : [];

  const formatDiasSemana = (dias) => {
    if (!dias) return 'Não definido';
    return dias.split(',').map(dia => dia.trim()).join(', ');
  };

  const formatHorario = (horario) => {
    if (!horario) return 'Não definido';
    return horario.substring(0, 5);
  };

  const formatValor = (valor) => {
    if (!valor || isNaN(valor)) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestão de Atividades
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as atividades oferecidas pela associação.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex gap-2">
            <button
              onClick={openModal}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </button>
            
            <button
              onClick={() => handleExportar('excel')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </button>
            
            <button
              onClick={() => handleExportar('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
            
            <button
              onClick={handleDownloadTemplate}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="input"
              >
                <option value="">Todos os tipos</option>
                {tiposAtividade.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterTipo('');
                }}
                className="btn-secondary w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Atividades */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Atividades ({filteredAtividades.length})
          </h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner h-8 w-8"></div>
            </div>
          ) : filteredAtividades.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhuma atividade encontrada
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterTipo ? 'Tente ajustar os filtros.' : 'Comece criando uma nova atividade.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atividade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horários
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vagas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAtividades.map((atividade) => (
                    <tr key={atividade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {atividade.nome}
                          </div>
                          {atividade.descricao && (
                            <div className="text-sm text-gray-500">
                              {atividade.descricao}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {atividade.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDiasSemana(atividade.dias_semana)}
                          </div>
                          {(atividade.horario_inicio || atividade.horario_fim) && (
                            <div className="flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-1 text-gray-400" />
                              {formatHorario(atividade.horario_inicio)} - {formatHorario(atividade.horario_fim)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {atividade.vagas_disponiveis || 0} / {atividade.vagas_maximas || 30}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                          {formatValor(atividade.valor_mensalidade)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          atividade.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {atividade.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(atividade)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(atividade.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAtividade ? 'Editar Atividade' : 'Nova Atividade'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="input"
                    placeholder="Nome da atividade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    className="input"
                    rows="3"
                    placeholder="Descrição da atividade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="input"
                  >
                    <option value="">Selecione o tipo</option>
                    {tiposAtividade.map(tipo => (
                      <option key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário Início
                    </label>
                    <input
                      type="time"
                      value={formData.horario_inicio}
                      onChange={(e) => setFormData({...formData, horario_inicio: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário Fim
                    </label>
                    <input
                      type="time"
                      value={formData.horario_fim}
                      onChange={(e) => setFormData({...formData, horario_fim: e.target.value})}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dias da Semana
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {diasSemana.map(dia => (
                      <label key={dia} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.dias_semana.includes(dia)}
                          onChange={(e) => {
                            const dias = formData.dias_semana.split(',').filter(d => d.trim());
                            if (e.target.checked) {
                              dias.push(dia);
                            } else {
                              const index = dias.indexOf(dia);
                              if (index > -1) dias.splice(index, 1);
                            }
                            setFormData({...formData, dias_semana: dias.join(',')});
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{dia.charAt(0).toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vagas Máximas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.vagas_maximas}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({...formData, vagas_maximas: value ? parseInt(value) : 30});
                      }}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Mensalidade
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_mensalidade}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({...formData, valor_mensalidade: value ? parseFloat(value) : ''});
                      }}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingAtividade ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Importar Atividades
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertTriangle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleImportar}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo (CSV ou Excel)
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={substituir}
                      onChange={(e) => setSubstituir(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Substituir atividades existentes
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Se marcado, atualiza atividades já registradas
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={importing || !importFile}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {importing ? (
                      <>
                        <div className="spinner h-4 w-4 mr-2"></div>
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Atividades; 