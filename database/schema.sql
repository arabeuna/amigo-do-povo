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
    vagas_maximas INTEGER DEFAULT 30,
    vagas_totais INTEGER DEFAULT 30,
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
    horario_id INTEGER REFERENCES horarios_atividades(id) ON DELETE CASCADE,
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
    horario_id INTEGER REFERENCES horarios_atividades(id) ON DELETE CASCADE,
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
-- TABELA DE HORÁRIOS DE ATIVIDADES
-- =====================================================

CREATE TABLE IF NOT EXISTS horarios_atividades (
  id SERIAL PRIMARY KEY,
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 1 AND dia_semana <= 7), -- 1=Segunda, 7=Domingo
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  vagas_disponiveis INTEGER DEFAULT 30,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(atividade_id, dia_semana, horario_inicio)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_horarios_atividade_id ON horarios_atividades(atividade_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia_semana ON horarios_atividades(dia_semana);
CREATE INDEX IF NOT EXISTS idx_horarios_ativo ON horarios_atividades(ativo);

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

-- Usuário administrador padrão (senha: 101520_Amigo)
INSERT INTO usuarios (nome, email, senha, perfil) VALUES 
('Administrador', 'admin@amigodopovo.com', crypt('101520_Amigo', gen_salt('bf')), 'admin');

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

-- =====================================================
-- ATUALIZAÇÃO DA TABELA ATIVIDADES
-- =====================================================

-- Remover colunas de horário da tabela atividades (serão movidas para horarios_atividades)
ALTER TABLE atividades DROP COLUMN IF EXISTS dias_semana;
ALTER TABLE atividades DROP COLUMN IF EXISTS horario_inicio;
ALTER TABLE atividades DROP COLUMN IF EXISTS horario_fim;
ALTER TABLE atividades DROP COLUMN IF EXISTS vagas_disponiveis;

-- Adicionar coluna para vagas totais da atividade
ALTER TABLE atividades ADD COLUMN IF NOT EXISTS vagas_totais INTEGER DEFAULT 30;

-- =====================================================
-- ATUALIZAÇÃO DA TABELA MATRÍCULAS
-- =====================================================

-- Adicionar referência ao horário específico
ALTER TABLE matriculas ADD COLUMN IF NOT EXISTS horario_id INTEGER REFERENCES horarios_atividades(id) ON DELETE CASCADE;

-- =====================================================
-- ATUALIZAÇÃO DA TABELA FREQUÊNCIAS
-- =====================================================

-- Adicionar referência ao horário específico
ALTER TABLE frequencias ADD COLUMN IF NOT EXISTS horario_id INTEGER REFERENCES horarios_atividades(id) ON DELETE CASCADE;

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR VAGAS DISPONÍVEIS
-- =====================================================

CREATE OR REPLACE FUNCTION atualizar_vagas_disponiveis()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar vagas disponíveis no horário
  UPDATE horarios_atividades 
  SET vagas_disponiveis = vagas_disponiveis - 1
  WHERE id = NEW.horario_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para matrículas
DROP TRIGGER IF EXISTS trigger_atualizar_vagas_matricula ON matriculas;
CREATE TRIGGER trigger_atualizar_vagas_matricula
  AFTER INSERT ON matriculas
  FOR EACH ROW
  WHEN (NEW.horario_id IS NOT NULL)
  EXECUTE FUNCTION atualizar_vagas_disponiveis();

-- =====================================================
-- FUNÇÃO PARA RESTAURAR VAGAS DISPONÍVEIS
-- =====================================================

CREATE OR REPLACE FUNCTION restaurar_vagas_disponiveis()
RETURNS TRIGGER AS $$
BEGIN
  -- Restaurar vagas disponíveis no horário
  UPDATE horarios_atividades 
  SET vagas_disponiveis = vagas_disponiveis + 1
  WHERE id = OLD.horario_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para cancelamento de matrículas
DROP TRIGGER IF EXISTS trigger_restaurar_vagas_matricula ON matriculas;
CREATE TRIGGER trigger_restaurar_vagas_matricula
  AFTER DELETE ON matriculas
  FOR EACH ROW
  WHEN (OLD.horario_id IS NOT NULL)
  EXECUTE FUNCTION restaurar_vagas_disponiveis();

-- =====================================================
-- DADOS DE EXEMPLO
-- =====================================================

-- Inserir horários para atividades existentes
INSERT INTO horarios_atividades (atividade_id, dia_semana, horario_inicio, horario_fim, vagas_disponiveis) VALUES
-- Informática: Segunda 8h, Terça 9h, Quarta 14h
(4, 1, '08:00:00', '09:00:00', 15),
(4, 2, '09:00:00', '10:00:00', 15),
(4, 3, '14:00:00', '15:00:00', 15),

-- Dança: Segunda 14h, Quarta 16h, Sexta 18h
(1, 1, '14:00:00', '15:00:00', 20),
(1, 3, '16:00:00', '17:00:00', 20),
(1, 5, '18:00:00', '19:00:00', 20),

-- Natação: Terça 7h, Quinta 8h, Sábado 9h
(2, 2, '07:00:00', '08:00:00', 10),
(2, 4, '08:00:00', '09:00:00', 10),
(2, 6, '09:00:00', '10:00:00', 10),

-- Bombeiro Mirim: Sábado 14h, Domingo 9h
(3, 6, '14:00:00', '16:00:00', 25),
(3, 7, '09:00:00', '11:00:00', 25),

-- Hidroginástica: Segunda 7h, Quarta 7h, Sexta 7h
(5, 1, '07:00:00', '08:00:00', 12),
(5, 3, '07:00:00', '08:00:00', 12),
(5, 5, '07:00:00', '08:00:00', 12),

-- Funcional: Terça 18h, Quinta 18h
(6, 2, '18:00:00', '19:00:00', 15),
(6, 4, '18:00:00', '19:00:00', 15),

-- Fisioterapia: Segunda a Sexta 8h-17h (horários flexíveis)
(7, 1, '08:00:00', '17:00:00', 5),
(7, 2, '08:00:00', '17:00:00', 5),
(7, 3, '08:00:00', '17:00:00', 5),
(7, 4, '08:00:00', '17:00:00', 5),
(7, 5, '08:00:00', '17:00:00', 5),

-- Karatê: Terça 19h, Quinta 19h, Sábado 10h
(8, 2, '19:00:00', '20:00:00', 20),
(8, 4, '19:00:00', '20:00:00', 20),
(8, 6, '10:00:00', '11:00:00', 20)
ON CONFLICT (atividade_id, dia_semana, horario_inicio) DO NOTHING; 