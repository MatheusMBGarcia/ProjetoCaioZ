-- Módulo de Produção / Fichas Técnicas
-- O server.js também cria estas tabelas automaticamente em ensureSchema().
CREATE TABLE IF NOT EXISTS fichas_producao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ficha_producao_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ficha_id INT NOT NULL,
  material_id INT NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL,
  unidade_consumo VARCHAR(20) NULL,
  UNIQUE KEY uq_ficha_material (ficha_id, material_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS producoes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  usuario_id INT NULL,
  quantidade DECIMAL(12,3) NOT NULL,
  data_producao DATE NOT NULL,
  observacao TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
