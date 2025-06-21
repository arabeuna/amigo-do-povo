import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Users, CheckCircle, Clock, AlertTriangle, Download, Plus, Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { mensalidadesAPI, atividadesAPI, alunosAPI } from '../services/api';

const Mensalidades = () => {
  const [mensalidades, setMensalidades] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    status: '',
    atividade_id: '',
    aluno_id: ''
  });
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0
  });
  const [modalPagamento, setModalPagamento] = useState({
    aberto: false,
    mensalidade: null
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [substituir, setSubstituir] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarAtividades();
    carregarAlunos();
    carregarMensalidades();
  }, [filtros, paginacao.pagina]);

  const carregarAtividades = async () => {
    try {
      const response = await atividadesAPI.listar();
      setAtividades(response.data.data.atividades || []);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    }
  };

  const carregarAlunos = async () => {
    try {
      const response = await alunosAPI.listar();
      setAlunos(response.data.data.alunos || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setAlunos([]);
    }
  };

  const carregarMensalidades = async () => {
    try {
      setLoading(true);
      const params = {
        ...filtros,
        pagina: paginacao.pagina,
        limite: paginacao.limite
      };

      const response = await mensalidadesAPI.listar(params);
      setMensalidades(response.data.data.mensalidades);
      setPaginacao(response.data.data.paginacao);
    } catch (error) {
      console.error('Erro ao carregar mensalidades:', error);
      toast.error('Erro ao carregar mensalidades');
    } finally {
      setLoading(false);
    }
  };

  const gerarMensalidades = async () => {
    try {
      setSalvando(true);
      await mensalidadesAPI.gerarMensalidades({
        mes: filtros.mes,
        ano: filtros.ano
      });
      
      toast.success('Mensalidades geradas com sucesso!');
      carregarMensalidades();
    } catch (error) {
      console.error('Erro ao gerar mensalidades:', error);
      toast.error('Erro ao gerar mensalidades');
    } finally {
      setSalvando(false);
    }
  };

  const registrarPagamento = async (dataPagamento, formaPagamento, observacoes) => {
    try {
      setSalvando(true);
      await mensalidadesAPI.registrarPagamento(modalPagamento.mensalidade.id, {
        data_pagamento: dataPagamento,
        forma_pagamento: formaPagamento,
        observacoes: observacoes
      });
      
      toast.success('Pagamento registrado com sucesso!');
      setModalPagamento({ aberto: false, mensalidade: null });
      carregarMensalidades();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    } finally {
      setSalvando(false);
    }
  };

  const atualizarStatusVencidas = async () => {
    try {
      setSalvando(true);
      await mensalidadesAPI.atualizar({}, { atualizar_vencidas: true });
      toast.success('Status das mensalidades atualizado!');
      carregarMensalidades();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setSalvando(false);
    }
  };

  const handleExportar = async (formato = 'excel') => {
    try {
      const params = { 
        formato,
        ...filtros
      };
      
      const response = await mensalidadesAPI.exportar(params);
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mensalidades_${new Date().toISOString().split('T')[0]}.${formato === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Lista de mensalidades exportada com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar mensalidades:', error);
      toast.error('Erro ao exportar mensalidades');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await mensalidadesAPI.downloadTemplate();
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_mensalidades.xlsx');
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
      
      const response = await mensalidadesAPI.importar(formData);
      
      toast.success(response.data.message);
      setShowImportModal(false);
      setImportFile(null);
      setSubstituir(false);
      
      // Recarregar dados
      carregarMensalidades();
      
    } catch (error) {
      console.error('Erro ao importar mensalidades:', error);
      toast.error(error.response?.data?.message || 'Erro ao importar mensalidades');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'atrasado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-4 w-4" />;
      case 'pendente':
        return <Clock className="h-4 w-4" />;
      case 'atrasado':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <DollarSign className="mr-3 h-8 w-8 text-green-600" />
          Gestão de Mensalidades
        </h1>
        <p className="text-gray-600">
          Controle de pagamentos e mensalidades dos alunos
        </p>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={gerarMensalidades}
              disabled={salvando}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Gerar Mensalidades
            </button>
            
            <button
              onClick={atualizarStatusVencidas}
              disabled={salvando}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Atualizar Vencidas
            </button>
          </div>

          <div className="flex gap-2">
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
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mês
            </label>
            <select
              value={filtros.mes}
              onChange={(e) => setFiltros(prev => ({ ...prev, mes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.isArray(meses) && meses.map((mes, index) => (
                <option key={index + 1} value={index + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano
            </label>
            <select
              value={filtros.ano}
              onChange={(e) => setFiltros(prev => ({ ...prev, ano: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Atividade
            </label>
            <select
              value={filtros.atividade_id}
              onChange={(e) => setFiltros(prev => ({ ...prev, atividade_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {Array.isArray(atividades) && atividades.map(atividade => (
                <option key={atividade.id} value={atividade.id}>
                  {atividade.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aluno
            </label>
            <select
              value={filtros.aluno_id}
              onChange={(e) => setFiltros(prev => ({ ...prev, aluno_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Array.isArray(alunos) && alunos.map(aluno => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Mensalidades */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Mensalidades
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {paginacao.total} mensalidade(s) encontrada(s)
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner h-8 w-8 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando...</p>
          </div>
        ) : (Array.isArray(mensalidades) ? mensalidades.length : 0) === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma mensalidade encontrada</p>
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
                    Atividade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(mensalidades) && mensalidades.map((mensalidade) => (
                  <tr key={mensalidade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mensalidade.aluno_nome}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mensalidade.aluno_cpf}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {mensalidade.atividade_nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meses[mensalidade.mes - 1]}/{mensalidade.ano}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatarValor(mensalidade.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatarData(mensalidade.data_vencimento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mensalidade.status)}`}>
                        {getStatusIcon(mensalidade.status)}
                        <span className="ml-1">
                          {mensalidade.status === 'pago' ? 'Pago' : 
                           mensalidade.status === 'pendente' ? 'Pendente' : 
                           mensalidade.status === 'atrasado' ? 'Atrasado' : mensalidade.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {mensalidade.status !== 'pago' && (
                        <button
                          onClick={() => setModalPagamento({ aberto: true, mensalidade })}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md"
                        >
                          Registrar Pagamento
                        </button>
                      )}
                      {mensalidade.status === 'pago' && (
                        <span className="text-green-600">
                          Pago em {formatarData(mensalidade.data_pagamento)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {paginacao.totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((paginacao.pagina - 1) * paginacao.limite) + 1} a {Math.min(paginacao.pagina * paginacao.limite, paginacao.total)} de {paginacao.total} resultados
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
              disabled={paginacao.pagina === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
              disabled={paginacao.pagina === paginacao.totalPaginas}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal de Pagamento */}
      {modalPagamento.aberto && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Registrar Pagamento
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Aluno:</strong> {modalPagamento.mensalidade.aluno_nome}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Atividade:</strong> {modalPagamento.mensalidade.atividade_nome}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Valor:</strong> {formatarValor(modalPagamento.mensalidade.valor)}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    id="dataPagamento"
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    id="formaPagamento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="transferencia">Transferência</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    id="observacoes"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações sobre o pagamento..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setModalPagamento({ aberto: false, mensalidade: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const dataPagamento = document.getElementById('dataPagamento').value;
                    const formaPagamento = document.getElementById('formaPagamento').value;
                    const observacoes = document.getElementById('observacoes').value;
                    
                    if (!dataPagamento || !formaPagamento) {
                      toast.error('Preencha todos os campos obrigatórios');
                      return;
                    }
                    
                    registrarPagamento(dataPagamento, formaPagamento, observacoes);
                  }}
                  disabled={salvando}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md"
                >
                  {salvando ? 'Salvando...' : 'Confirmar Pagamento'}
                </button>
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
                  Importar Mensalidades
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
                      Substituir mensalidades existentes
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Se marcado, atualiza mensalidades já registradas
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

export default Mensalidades; 