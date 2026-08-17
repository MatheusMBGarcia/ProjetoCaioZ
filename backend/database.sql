-- ToolStock - estrutura mínima do banco
-- O server.js também cria as tabelas de apoio automaticamente.

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL UNIQUE,
  descricao TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  cnpj VARCHAR(30) NULL,
  email VARCHAR(180) NULL,
  telefone VARCHAR(40) NULL,
  contato VARCHAR(120) NULL,
  endereco VARCHAR(255) NULL,
  cidade VARCHAR(120) NULL,
  estado VARCHAR(2) NULL,
  observacao TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'FUNCIONARIO',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(80) NULL UNIQUE,
  nome VARCHAR(180) NOT NULL,
  tipo VARCHAR(80) NOT NULL DEFAULT 'Material',
  unidade VARCHAR(20) NOT NULL DEFAULT 'un',
  marca VARCHAR(120) NULL,
  modelo VARCHAR(120) NULL,
  estoque DECIMAL(12,3) NOT NULL DEFAULT 0,
  estoque_minimo DECIMAL(12,3) NOT NULL DEFAULT 0,
  preco_custo DECIMAL(12,2) NOT NULL DEFAULT 0,
  preco_venda DECIMAL(12,2) NOT NULL DEFAULT 0,
  localizacao VARCHAR(120) NULL,
  categoria_id INT NULL,
  fornecedor_id INT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  usuario_id INT NULL,
  tipo VARCHAR(20) NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL,
  estoque_anterior DECIMAL(12,3) NOT NULL DEFAULT 0,
  estoque_posterior DECIMAL(12,3) NOT NULL DEFAULT 0,
  fornecedor_id INT NULL,
  documento VARCHAR(120) NULL,
  motivo VARCHAR(120) NULL,
  destino VARCHAR(180) NULL,
  observacao TEXT NULL,
  data_movimentacao DATE NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (nome, email, senha, role, ativo)
SELECT 'Administrador', 'admin@estoque.local', '1234', 'ADMIN', 1
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE LOWER(email) = 'admin@estoque.local'
);

CREATE TABLE IF NOT EXISTS estoque_vendas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
  estoque_minimo DECIMAL(12,3) NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_estoque_vendas_produto (produto_id),

  CONSTRAINT fk_estoque_vendas_produto
    FOREIGN KEY (produto_id)
    REFERENCES produtos(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);