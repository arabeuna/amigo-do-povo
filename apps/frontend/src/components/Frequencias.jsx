import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Download, 
  Upload, 
  FileSpreadsheet,
  Clock,
  FileText
} from 'lucide-react';
import { atividadesAPI, frequenciasAPI } from '../services/api';

const Frequencias = () => {
  const [atividades, setAtividades] = useState([]);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [frequencias, setFrequencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [substituir, setSubstituir] = useState(false);

  const carregarAtividades = async () => {
    try {
      setLoading(true);
      const response = await atividadesAPI.listar();
      setAtividades(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  const carregarAlunosMatriculados = useCallback(async () => {
    try {
      setLoading(true);
      const response = await frequenciasAPI.listarAlunosMatriculados(atividadeSelecionada);
      setAlunos(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos matriculados');
    } finally {
      setLoading(false);
    }
  }, [atividadeSelecionada]);

  const carregarFrequencias = useCallback(async () => {
    try {
      setLoading(true);
      const response = await frequenciasAPI.listar({
        atividade_id: atividadeSelecionada,
        data_inicio: dataSelecionada,
        data_fim: dataSelecionada
      });
      setFrequencias(response.data.data.frequencias);
    } catch (error) {
      console.error('Erro ao carregar frequências:', error);
      // Não mostrar erro se não houver frequências registradas ainda
    } finally {
      setLoading(false);
    }
  }, [atividadeSelecionada, dataSelecionada]);

  // Carregar atividades ao montar o componente
  useEffect(() => {
    carregarAtividades();
  }, []);

  // Carregar alunos quando atividade for selecionada
  useEffect(() => {
    if (atividadeSelecionada) {
      carregarAlunosMatriculados();
    }
  }, [atividadeSelecionada, carregarAlunosMatriculados]);

  // Carregar frequências quando atividade e data forem selecionadas
  useEffect(() => {
    if (atividadeSelecionada && dataSelecionada) {
      carregarFrequencias();
    }
  }, [atividadeSelecionada, dataSelecionada, carregarFrequencias]);

  const handleFrequenciaChange = (alunoId, presente) => {
    setFrequencias(prev => {
      const existing = prev.find(f => f.aluno_id === alunoId);
      if (existing) {
        return prev.map(f => 
          f.aluno_id === alunoId ? { ...f, presente } : f
        );
      } else {
        return [...prev, {
          aluno_id: alunoId,
          atividade_id: parseInt(atividadeSelecionada),
          data_aula: dataSelecionada,
          presente,
          justificativa: ''
        }];
      }
    });
  };

  const handleJustificativaChange = (alunoId, justificativa) => {
    setFrequencias(prev => {
      const existing = prev.find(f => f.aluno_id === alunoId);
      if (existing) {
        return prev.map(f => 
          f.aluno_id === alunoId ? { ...f, justificativa } : f
        );
      } else {
        return [...prev, {
          aluno_id: alunoId,
          atividade_id: parseInt(atividadeSelecionada),
          data_aula: dataSelecionada,
          presente: false,
          justificativa
        }];
      }
    });
  };

  const salvarFrequencias = async () => {
    if (!atividadeSelecionada || !dataSelecionada) {
      toast.error('Selecione uma atividade e uma data');
      return;
    }

    if (alunos.length === 0) {
      toast.error('Nenhum aluno matriculado nesta atividade');
      return;
    }

    try {
      setSalvando(true);
      
      // Preparar dados para envio
      const frequenciasParaSalvar = Array.isArray(alunos) ? alunos.map(aluno => {
        const frequencia = Array.isArray(frequencias) ? frequencias.find(f => f.aluno_id === aluno.id) : null;
        return {
          aluno_id: aluno.id,
          presente: frequencia ? frequencia.presente : false,
          justificativa: frequencia ? frequencia.justificativa : ''
        };
      }) : [];

      await frequenciasAPI.registrarEmLote({
        atividade_id: parseInt(atividadeSelecionada),
        data_frequencia: dataSelecionada,
        frequencias: frequenciasParaSalvar
      });

      toast.success('Frequências salvas com sucesso!');
      carregarFrequencias(); // Recarregar para confirmar
    } catch (error) {
      console.error('Erro ao salvar frequências:', error);
      toast.error('Erro ao salvar frequências');
    } finally {
      setSalvando(false);
    }
  };

  const getStatusFrequencia = (alunoId) => {
    const frequencia = Array.isArray(frequencias) ? frequencias.find(f => f.aluno_id === alunoId) : null;
    if (!frequencia) return 'pendente';
    return frequencia.presente ? 'presente' : 'ausente';
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const hoje = new Date().toISOString().split('T')[0];

  // Fallback defensivo para evitar erro de map
  const atividadesArray = Array.isArray(atividades) ? atividades : [];

  const handleExportar = async (formato = 'excel') => {
    try {
      const params = { 
        formato,
        atividade_id: atividadeSelecionada || undefined,
        data_inicio: dataSelecionada || undefined,
        data_fim: dataSelecionada || undefined
      };
      
      const response = await frequenciasAPI.exportar(params);
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `frequencias_${new Date().toISOString().split('T')[0]}.${formato === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Lista de frequências exportada com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar frequências:', error);
      toast.error('Erro ao exportar frequências');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await frequenciasAPI.downloadTemplate();
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_importacao_frequencias.xlsx');
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

      const response = await frequenciasAPI.importar(formData);
      
      const { criadas, atualizadas, erros } = response.data.data;
      
      toast.success(`Importação concluída! ${criadas} criadas, ${atualizadas} atualizadas, ${erros} erros`);
      
      if (erros > 0) {
        console.log('Detalhes dos erros:', response.data.data.detalhes.erros);
      }
      
      setShowImportModal(false);
      setImportFile(null);
      setSubstituir(false);
      
      // Recarregar frequências se houver atividade e data selecionadas
      if (atividadeSelecionada && dataSelecionada) {
        carregarFrequencias();
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error(error.response?.data?.message || 'Erro na importação');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['csv', 'xlsx', 'xls'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        setImportFile(file);
      } else {
        toast.error('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)');
        e.target.value = '';
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Calendar className="mr-3 h-8 w-8 text-blue-600" />
              Controle de Frequência
            </h1>
            <p className="text-gray-600">
              Registre a presença dos alunos nas atividades
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="btn-secondary flex items-center space-x-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Template</span>
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Importar</span>
            </button>
            
            <button
              onClick={() => handleExportar('excel')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Atividade
            </label>
            <select
              value={atividadeSelecionada}
              onChange={(e) => setAtividadeSelecionada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma atividade</option>
              {atividadesArray.map(atividade => (
                <option key={atividade.id} value={atividade.id}>
                  {atividade.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              max={hoje}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={salvarFrequencias}
              disabled={salvando || !atividadeSelecionada || !dataSelecionada}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {salvando ? (
                <>
                  <div className="spinner h-4 w-4 mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Frequências
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Alunos */}
      {atividadeSelecionada && dataSelecionada && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Alunos Matriculados - {formatarData(dataSelecionada)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {Array.isArray(alunos) ? alunos.length : 0} aluno(s) matriculado(s)
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="spinner h-8 w-8 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando...</p>
            </div>
          ) : (Array.isArray(alunos) ? alunos.length : 0) === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum aluno matriculado nesta atividade</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aluno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPF
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Presença
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justificativa
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(alunos) && alunos.map((aluno) => {
                    const status = getStatusFrequencia(aluno.id);
                    const frequencia = Array.isArray(frequencias) ? frequencias.find(f => f.aluno_id === aluno.id) : null;
                    
                    return (
                      <tr key={aluno.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {aluno.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {aluno.cpf || 'Não informado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleFrequenciaChange(aluno.id, true)}
                              className={`p-2 rounded-full ${
                                frequencia?.presente 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-green-50'
                              }`}
                              title="Presente"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleFrequenciaChange(aluno.id, false)}
                              className={`p-2 rounded-full ${
                                frequencia && !frequencia.presente 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-red-50'
                              }`}
                              title="Ausente"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Justificativa (opcional)"
                            value={frequencia?.justificativa || ''}
                            onChange={(e) => handleJustificativaChange(aluno.id, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'presente' 
                              ? 'bg-green-100 text-green-800'
                              : status === 'ausente'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {status === 'presente' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status === 'ausente' && <XCircle className="h-3 w-3 mr-1" />}
                            {status === 'pendente' && <Clock className="h-3 w-3 mr-1" />}
                            {status === 'presente' ? 'Presente' : status === 'ausente' ? 'Ausente' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Estatísticas */}
      {Array.isArray(frequencias) && frequencias.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Presentes</p>
                <p className="text-2xl font-bold text-green-600">
                  {Array.isArray(frequencias) ? frequencias.filter(f => f.presente).length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Ausentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {Array.isArray(frequencias) ? frequencias.filter(f => !f.presente).length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Array.isArray(frequencias) ? frequencias.length : 0}
                </p>
              </div>
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
                  Importar Frequências
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
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
                      Substituir frequências existentes
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Se marcado, atualiza frequências já registradas
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

export default Frequencias; 