-- =====================================================
-- SISTEMA AMIGO DO POVO - ESQUEMA DO BANCO DE DADOS
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA DE USUÁRIOS DO SISTEMA
-- =====================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('admin', 'instrutor', 'financeiro', 'aluno')),
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE RESPONSÁVEIS
-- =====================================================
CREATE TABLE responsaveis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20),
    data_nascimento DATE,
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE ALUNOS
-- =====================================================
CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    data_nascimento DATE,
    sexo VARCHAR(1) CHECK (sexo IN ('M', 'F')),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    responsavel_id UUID REFERENCES responsaveis(id),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE ATIVIDADES
-- =====================================================
CREATE TABLE atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) NOT NULL, -- dança, natação, informática, etc.
    dias_semana VARCHAR(50), -- "segunda,terça,quarta"
    horario_inicio TIME,
    horario_fim TIME,
    instrutor_id UUID REFERENCES usuarios(id),
    vagas_maximas INTEGER DEFAULT 30,
    vagas_disponiveis INTEGER DEFAULT 30,
    valor_mensalidade DECIMAL(10,2),
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE MATRÍCULAS
-- =====================================================
CREATE TABLE matriculas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    atividade_id UUID REFERENCES atividades(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'cancelada', 'concluida')),
    data_matricula DATE DEFAULT CURRENT_DATE,
    data_inicio DATE,
    data_fim DATE,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aluno_id, atividade_id)
);

-- =====================================================
-- TABELA DE FREQUÊNCIAS
-- =====================================================
CREATE TABLE frequencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    atividade_id UUID REFERENCES atividades(id) ON DELETE CASCADE,
    data_aula DATE NOT NULL,
    presente BOOLEAN DEFAULT false,
    justificativa TEXT,
    registrado_por UUID REFERENCES usuarios(id),
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aluno_id, atividade_id, data_aula)
);

-- =====================================================
-- TABELA DE MENSALIDADES
-- =====================================================
CREATE TABLE mensalidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    atividade_id UUID REFERENCES atividades(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ano INTEGER NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    data_vencimento DATE,
    data_pagamento DATE,
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aluno_id, atividade_id, mes, ano)
);

-- =====================================================
-- TABELA DE RELATÓRIOS EXPORTADOS
-- =====================================================
CREATE TABLE relatorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- frequencia, mensalidade, alunos, etc.
    filtros JSONB,
    arquivo_path VARCHAR(255),
    exportado_por UUID REFERENCES usuarios(id),
    data_exportacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_alunos_nome ON alunos(nome);
CREATE INDEX idx_alunos_cpf ON alunos(cpf);
CREATE INDEX idx_alunos_responsavel ON alunos(responsavel_id);
CREATE INDEX idx_matriculas_aluno ON matriculas(aluno_id);
CREATE INDEX idx_matriculas_atividade ON matriculas(atividade_id);
CREATE INDEX idx_frequencias_aluno_data ON frequencias(aluno_id, data_aula);
CREATE INDEX idx_frequencias_atividade_data ON frequencias(atividade_id, data_aula);
CREATE INDEX idx_mensalidades_aluno ON mensalidades(aluno_id);
CREATE INDEX idx_mensalidades_status ON mensalidades(status);
CREATE INDEX idx_mensalidades_vencimento ON mensalidades(data_vencimento);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Usuário administrador padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha, perfil) VALUES 
('Administrador', 'admin@amigodopovo.com', crypt('admin123', gen_salt('bf')), 'admin');

-- Tipos de atividades padrão
INSERT INTO atividades (nome, descricao, tipo, valor_mensalidade) VALUES 
('Dança', 'Aulas de dança para todas as idades', 'dança', 50.00),
('Natação', 'Aulas de natação para iniciantes e avançados', 'natação', 80.00),
('Bombeiro Mirim', 'Curso de formação de bombeiro mirim', 'bombeiro_mirim', 60.00),
('Informática', 'Curso básico de informática', 'informática', 40.00),
('Hidroginástica', 'Aulas de hidroginástica', 'hidroginástica', 70.00),
('Funcional', 'Treinamento funcional', 'funcional', 60.00),
('Fisioterapia', 'Atendimento fisioterapêutico', 'fisioterapia', 100.00),
('Karatê', 'Aulas de karatê', 'karatê', 55.00);

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar data_atualizacao
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responsaveis_updated_at BEFORE UPDATE ON responsaveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atividades_updated_at BEFORE UPDATE ON atividades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matriculas_updated_at BEFORE UPDATE ON matriculas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mensalidades_updated_at BEFORE UPDATE ON mensalidades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar mensalidades automaticamente
CREATE OR REPLACE FUNCTION gerar_mensalidades_mes()
RETURNS void AS $$
DECLARE
    matricula_record RECORD;
    mes_atual INTEGER;
    ano_atual INTEGER;
BEGIN
    mes_atual := EXTRACT(MONTH FROM CURRENT_DATE);
    ano_atual := EXTRACT(YEAR FROM CURRENT_DATE);
    
    FOR matricula_record IN 
        SELECT m.aluno_id, m.atividade_id, a.valor_mensalidade
        FROM matriculas m
        JOIN atividades a ON m.atividade_id = a.id
        WHERE m.status = 'ativa' 
        AND m.ativo = true
        AND a.ativo = true
    LOOP
        INSERT INTO mensalidades (aluno_id, atividade_id, mes, ano, valor, data_vencimento)
        VALUES (
            matricula_record.aluno_id,
            matricula_record.atividade_id,
            mes_atual,
            ano_atual,
            matricula_record.valor_mensalidade,
            (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
        )
        ON CONFLICT (aluno_id, atividade_id, mes, ano) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 