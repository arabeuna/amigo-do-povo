import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { alunosAPI, relatoriosAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalAtividades: 8,
    mensalidadesVencidas: 0,
    presencasHoje: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas básicas
      const alunosResponse = await alunosAPI.listar({ limite: 1 });
      const totalAlunos = alunosResponse.data.data.paginacao.total;
      
      // Aqui você pode adicionar mais chamadas para buscar outras estatísticas
      // Por enquanto, vamos usar dados mockados
      setStats({
        totalAlunos,
        totalAtividades: 8,
        mensalidadesVencidas: Math.floor(Math.random() * 20),
        presencasHoje: Math.floor(Math.random() * 50)
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? (
                <div className="spinner h-8 w-8"></div>
              ) : (
                value.toLocaleString('pt-BR')
              )}
            </p>
            {change && (
              <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}% em relação ao mês anterior
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, action, color }) => (
    <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={action}>
      <div className="card-body">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-2 rounded-md ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const AlertCard = ({ title, message, icon: Icon, type }) => {
    const colors = {
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return (
      <div className={`border rounded-md p-4 ${colors[type]}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-sm mt-1">{message}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bem-vindo de volta, {user?.nome}! Aqui está um resumo das atividades.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary">
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver Relatórios
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Alunos"
          value={stats.totalAlunos}
          icon={Users}
          color="bg-blue-500"
          change={5}
        />
        <StatCard
          title="Atividades Ativas"
          value={stats.totalAtividades}
          icon={Calendar}
          color="bg-green-500"
        />
        <StatCard
          title="Mensalidades Vencidas"
          value={stats.mensalidadesVencidas}
          icon={DollarSign}
          color="bg-yellow-500"
        />
        <StatCard
          title="Presenças Hoje"
          value={stats.presencasHoje}
          icon={CheckCircle}
          color="bg-purple-500"
        />
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Alertas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stats.mensalidadesVencidas > 0 && (
            <AlertCard
              title="Mensalidades Vencidas"
              message={`${stats.mensalidadesVencidas} mensalidades estão vencidas e precisam de atenção.`}
              icon={AlertTriangle}
              type="warning"
            />
          )}
          <AlertCard
            title="Sistema Funcionando"
            message="Todos os sistemas estão operacionais e funcionando normalmente."
            icon={CheckCircle}
            type="info"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Cadastrar Aluno"
            description="Adicionar novo aluno ao sistema"
            icon={Users}
            color="bg-blue-500"
            action={() => window.location.href = '/alunos/novo'}
          />
          <QuickActionCard
            title="Registrar Frequência"
            description="Marcar presença dos alunos"
            icon={CheckCircle}
            color="bg-green-500"
            action={() => window.location.href = '/frequencia'}
          />
          <QuickActionCard
            title="Lançar Mensalidades"
            description="Gerar mensalidades do mês"
            icon={DollarSign}
            color="bg-yellow-500"
            action={() => window.location.href = '/mensalidades'}
          />
          <QuickActionCard
            title="Exportar Relatórios"
            description="Baixar relatórios em Excel"
            icon={TrendingUp}
            color="bg-purple-500"
            action={() => window.location.href = '/relatorios'}
          />
          <QuickActionCard
            title="Ver Atividades"
            description="Gerenciar atividades e turmas"
            icon={Calendar}
            color="bg-indigo-500"
            action={() => window.location.href = '/atividades'}
          />
          <QuickActionCard
            title="Configurações"
            description="Configurar sistema"
            icon={Clock}
            color="bg-gray-500"
            action={() => window.location.href = '/configuracoes'}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Atividade Recente
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Novo aluno cadastrado
                </p>
                <p className="text-sm text-gray-500">
                  João Silva foi cadastrado na atividade de Dança
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                2 min atrás
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Frequência registrada
                </p>
                <p className="text-sm text-gray-500">
                  15 presenças registradas na aula de Natação
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                1 hora atrás
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Pagamento registrado
                </p>
                <p className="text-sm text-gray-500">
                  Mensalidade de Maria Santos foi paga
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                3 horas atrás
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 