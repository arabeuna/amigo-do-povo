import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar,
  Users,
  Search,
  Filter,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { horariosAPI, atividadesAPI } from '../services/api';
import toast from 'react-hot-toast';

const Horarios = () => {
  const [horarios, setHorarios] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [diasSemana, setDiasSemana] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  const [filtros, setFiltros] = useState({
    atividade_id: '',
    dia_semana: ''
  });

  // Estados para importação/exportação
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [substituir, setSubstituir] = useState(false);
  const [exportFormato, setExportFormato] = useState('excel');

  const [formData, setFormData] = useState({
    atividade_id: '',
    dia_semana: '',
    horario_inicio: '',
    horario_fim: '',
    vagas_disponiveis: 30
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [horariosRes, atividadesRes, diasRes] = await Promise.all([
        horariosAPI.listar(),
        atividadesAPI.listar(),
        horariosAPI.getDiasSemana()
      ]);

      console.log('Horarios response:', horariosRes);
      console.log('Atividades response:', atividadesRes);
      console.log('Dias response:', diasRes);

      setHorarios(horariosRes.data.data?.horarios || horariosRes.data.horarios || []);
      setAtividades(atividadesRes.data.data?.atividades || atividadesRes.data.atividades || []);
      setDiasSemana(diasRes.data.data?.dias || diasRes.data.dias || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarHorarios = async () => {
    try {
      setLoading(true);
      const params = { ...filtros };
      const response = await horariosAPI.listar(params);
      console.log('Horarios response in carregarHorarios:', response);
      setHorarios(response.data.data?.horarios || response.data.horarios || []);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarHorarios();
  }, [filtros]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingHorario) {
        await horariosAPI.atualizar(editingHorario.id, formData);
        toast.success('Horário atualizado com sucesso!');
      } else {
        await horariosAPI.criar(formData);
        toast.success('Horário criado com sucesso!');
      }
      
      setShowModal(false);
      setEditingHorario(null);
      resetForm();
      carregarHorarios();
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar horário');
    }
  };

  const handleEdit = (horario) => {
    setEditingHorario(horario);
    setFormData({
      atividade_id: horario.atividade_id,
      dia_semana: horario.dia_semana,
      horario_inicio: horario.horario_inicio,
      horario_fim: horario.horario_fim,
      vagas_disponiveis: horario.vagas_disponiveis
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este horário?')) {
      return;
    }

    try {
      await horariosAPI.deletar(id);
      toast.success('Horário deletado com sucesso!');
      carregarHorarios();
    } catch (error) {
      console.error('Erro ao deletar horário:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar horário');
    }
  };

  const resetForm = () => {
    setFormData({
      atividade_id: '',
      dia_semana: '',
      horario_inicio: '',
      horario_fim: '',
      vagas_disponiveis: 30
    });
  };

  const openModal = () => {
    setEditingHorario(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHorario(null);
    resetForm();
  };

  const getDiaNome = (diaId) => {
    const dia = diasSemana.find(d => d.id === diaId);
    return dia ? dia.nome : 'N/A';
  };

  const getAtividadeNome = (atividadeId) => {
    const atividade = atividades.find(a => a.id === atividadeId);
    return atividade ? atividade.nome : 'N/A';
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time.substring(0, 5); // Remove segundos
  };

  // Funções de importação/exportação
  const handleExportar = async () => {
    try {
      setLoading(true);
      const response = await horariosAPI.exportar({ formato: exportFormato });
      
      const blob = new Blob([response.data], {
        type: exportFormato === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `horarios.${exportFormato === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Exportação concluída com sucesso!');
      setShowExportModal(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar horários');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await horariosAPI.downloadTemplate();
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template_horarios.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      toast.error('Erro ao baixar template');
    } finally {
      setLoading(false);
    }
  };

  const handleImportar = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('arquivo', selectedFile);

      const response = await horariosAPI.importar(formData);
      
      toast.success(`Importação concluída! ${response.data.data.inseridos} inseridos, ${response.data.data.atualizados} atualizados`);
      setShowImportModal(false);
      setSelectedFile(null);
      carregarHorarios();
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error(error.response?.data?.message || 'Erro ao importar horários');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (allowedTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast.error('Formato de arquivo não suportado. Use Excel (.xlsx, .xls) ou CSV');
        e.target.value = '';
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Horários</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={20} />
            Exportar
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FileSpreadsheet size={20} />
            Template
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Upload size={20} />
            Importar
          </button>
          <button
            onClick={openModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Horário
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atividade
            </label>
            <select
              value={filtros.atividade_id}
              onChange={(e) => setFiltros({ ...filtros, atividade_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Todas as atividades</option>
              {atividades.map(atividade => (
                <option key={atividade.id} value={atividade.id}>
                  {atividade.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dia da Semana
            </label>
            <select
              value={filtros.dia_semana}
              onChange={(e) => setFiltros({ ...filtros, dia_semana: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos os dias</option>
              {diasSemana.map(dia => (
                <option key={dia.id} value={dia.id}>
                  {dia.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Horários */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando horários...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atividade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vagas
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
                {horarios.map((horario) => (
                  <tr key={horario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getAtividadeNome(horario.atividade_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {getDiaNome(horario.dia_semana)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatTime(horario.horario_inicio)} - {formatTime(horario.horario_fim)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users size={16} className="text-gray-400 mr-2" />
                        <span className={`text-sm font-medium ${
                          horario.vagas_disponiveis > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {horario.vagas_disponiveis} vagas
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        horario.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {horario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(horario)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(horario.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {horarios.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum horário encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingHorario ? 'Editar Horário' : 'Novo Horário'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atividade *
                  </label>
                  <select
                    required
                    value={formData.atividade_id}
                    onChange={(e) => setFormData({ ...formData, atividade_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione uma atividade</option>
                    {atividades.map(atividade => (
                      <option key={atividade.id} value={atividade.id}>
                        {atividade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia da Semana *
                  </label>
                  <select
                    required
                    value={formData.dia_semana}
                    onChange={(e) => setFormData({ ...formData, dia_semana: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione um dia</option>
                    {diasSemana.map(dia => (
                      <option key={dia.id} value={dia.id}>
                        {dia.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário Início *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.horario_inicio}
                      onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário Fim *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.horario_fim}
                      onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vagas Disponíveis
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.vagas_disponiveis}
                    onChange={(e) => setFormData({ ...formData, vagas_disponiveis: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingHorario ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Exportar Horários</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato
              </label>
              <select
                value={exportFormato}
                onChange={(e) => setExportFormato(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportar}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Exportando...' : 'Exportar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Importar Horários</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceitos: Excel (.xlsx, .xls) ou CSV
              </p>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={substituir}
                  onChange={(e) => setSubstituir(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Substituir horários existentes
                </span>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportar}
                disabled={importing || !selectedFile}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {importing ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Horarios; 