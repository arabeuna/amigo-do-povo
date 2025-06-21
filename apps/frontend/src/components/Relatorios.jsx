import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  Download, 
  Filter,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Relatorios = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalAlunos: 0,
    totalAtividades: 0,
    mensalidadesPagas: 0,
    mensalidadesPendentes: 0,
    mensalidadesAtrasadas: 0,
    frequenciaMedia: 0,
    arrecadacaoMensal: 0,
    alunosPorAtividade: [],
    frequenciaPorAtividade: [],
    arrecadacaoPorMes: []
  });
  
  const [filtros, setFiltros] = useState({
    periodo: 'mes_atual',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    atividade_id: '',
    aluno_id: '',
    status: '',
    tipo_relatorio: 'dashboard'
  });
  
  const [atividades, setAtividades] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [relatorioDetalhado, setRelatorioDetalhado] = useState([]);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    if (filtros.tipo_relatorio === 'dashboard') {
      carregarDashboard();
    } else {
      carregarRelatorioDetalhado();
    }
  }, [filtros]);

  const carregarDadosIniciais = async () => {
    try {
      const [atividadesRes, alunosRes] = await Promise.all([
        api.get('/atividades'),
        api.get('/alunos')
      ]);
      
      setAtividades(atividadesRes.data.data.atividades || []);
      setAlunos(alunosRes.data.data.alunos || []);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/relatorios/dashboard', { params: filtros });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const carregarRelatorioDetalhado = async () => {
    try {
      setLoading(true);
      const response = await api.get('/relatorios/detalhado', { params: filtros });
      setRelatorioDetalhado(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar relatório detalhado:', error);
      toast.error('Erro ao carregar relatório detalhado');
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = async (formato) => {
    try {
      setExportando(true);
      const response = await api.get('/relatorios/exportar', { 
        params: { ...filtros, formato },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${filtros.tipo_relatorio}_${new Date().toISOString().split('T')[0]}.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Relatório exportado com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExportando(false);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor) => {
    return `${valor.toFixed(1)}%`;
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

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
          Relatórios e Analytics
        </h1>
        <p className="text-gray-600">
          Visualize dados e gere relatórios detalhados do sistema
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => exportarRelatorio('pdf')}
              disabled={exportando}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportando ? 'Exportando...' : 'PDF'}
            </button>
            <button
              onClick={() => exportarRelatorio('excel')}
              disabled={exportando}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportando ? 'Exportando...' : 'Excel'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={filtros.tipo_relatorio}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo_relatorio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dashboard">Dashboard</option>
              <option value="alunos">Relatório de Alunos</option>
              <option value="frequencias">Relatório de Frequências</option>
              <option value="mensalidades">Relatório de Mensalidades</option>
              <option value="atividades">Relatório de Atividades</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={filtros.periodo}
              onChange={(e) => setFiltros(prev => ({ ...prev, periodo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mes_atual">Mês Atual</option>
              <option value="mes_anterior">Mês Anterior</option>
              <option value="trimestre">Último Trimestre</option>
              <option value="semestre">Último Semestre</option>
              <option value="ano">Último Ano</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {filtros.periodo === 'personalizado' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês
                </label>
                <select
                  value={filtros.mes}
                  onChange={(e) => setFiltros(prev => ({ ...prev, mes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {meses.map((mes, index) => (
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
            </>
          )}

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
              Status
            </label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      {filtros.tipo_relatorio === 'dashboard' && (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.totalAlunos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Atividades Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.totalAtividades}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Arrecadação Mensal</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatarValor(dashboardData.arrecadacaoMensal)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Frequência Média</p>
                  <p className="text-2xl font-bold text-purple-600">{formatarPercentual(dashboardData.frequenciaMedia)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status das Mensalidades */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                Mensalidades Pagas
              </h3>
              <p className="text-3xl font-bold text-green-600">{dashboardData.mensalidadesPagas}</p>
              <p className="text-sm text-gray-600 mt-2">Total de pagamentos realizados</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-yellow-600" />
                Mensalidades Pendentes
              </h3>
              <p className="text-3xl font-bold text-yellow-600">{dashboardData.mensalidadesPendentes}</p>
              <p className="text-sm text-gray-600 mt-2">Aguardando pagamento</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                Mensalidades Atrasadas
              </h3>
              <p className="text-3xl font-bold text-red-600">{dashboardData.mensalidadesAtrasadas}</p>
              <p className="text-sm text-gray-600 mt-2">Vencidas sem pagamento</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                Alunos por Atividade
              </h3>
              <div className="space-y-3">
                {Array.isArray(dashboardData.alunosPorAtividade) && dashboardData.alunosPorAtividade.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.atividade}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(item.alunos / Math.max(...dashboardData.alunosPorAtividade.map(a => a.alunos))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.alunos}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="mr-2 h-5 w-5 text-green-600" />
                Frequência por Atividade
              </h3>
              <div className="space-y-3">
                {Array.isArray(dashboardData.frequenciaPorAtividade) && dashboardData.frequenciaPorAtividade.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.atividade}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${item.frequencia}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{formatarPercentual(item.frequencia)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relatório Detalhado */}
      {filtros.tipo_relatorio !== 'dashboard' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {filtros.tipo_relatorio === 'alunos' && 'Relatório de Alunos'}
              {filtros.tipo_relatorio === 'frequencias' && 'Relatório de Frequências'}
              {filtros.tipo_relatorio === 'mensalidades' && 'Relatório de Mensalidades'}
              {filtros.tipo_relatorio === 'atividades' && 'Relatório de Atividades'}
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="spinner h-8 w-8 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando relatório...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {filtros.tipo_relatorio === 'alunos' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aluno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Atividades
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </>
                    )}
                    {filtros.tipo_relatorio === 'frequencias' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aluno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Atividade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Período
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Frequência
                        </th>
                      </>
                    )}
                    {filtros.tipo_relatorio === 'mensalidades' && (
                      <>
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
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </>
                    )}
                    {filtros.tipo_relatorio === 'atividades' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Atividade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Alunos Matriculados
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vagas Disponíveis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Mensalidade
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(relatorioDetalhado) && relatorioDetalhado.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {filtros.tipo_relatorio === 'alunos' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.nome}</div>
                            <div className="text-sm text-gray-500">{item.cpf}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.telefone}</div>
                            <div className="text-sm text-gray-500">{item.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.atividades}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {item.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </>
                      )}
                      {filtros.tipo_relatorio === 'frequencias' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.aluno_nome}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.atividade_nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.periodo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-gray-900">{formatarPercentual(item.frequencia)}</span>
                          </td>
                        </>
                      )}
                      {filtros.tipo_relatorio === 'mensalidades' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.aluno_nome}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.atividade_nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.periodo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatarValor(item.valor)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1">
                                {item.status === 'pago' ? 'Pago' : 
                                 item.status === 'pendente' ? 'Pendente' : 
                                 item.status === 'atrasado' ? 'Atrasado' : item.status}
                              </span>
                            </span>
                          </td>
                        </>
                      )}
                      {filtros.tipo_relatorio === 'atividades' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.nome}</div>
                            <div className="text-sm text-gray-500">{item.descricao}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.alunos_matriculados}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.vagas_disponiveis}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatarValor(item.valor_mensalidade)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {item.ativo ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Relatorios; 