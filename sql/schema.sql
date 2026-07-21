-- ============================================================
-- ChichaLabs Studio — Portal de clientes + Presupuestador + Admin
-- Schema MySQL — correr una sola vez desde phpMyAdmin (pestaña SQL)
-- sobre la base creada en hPanel → Bases de datos → MySQL.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  whatsapp VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'diagnostico',
  -- diagnostico | propuesta_enviada | propuesta_aceptada
  -- en_diseno | en_desarrollo | implementacion | finalizado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_projects_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'borrador',
  -- borrador | enviada | aceptada | vencida
  currency VARCHAR(10) DEFAULT 'ARS',
  secondary_currency VARCHAR(10) NULL,        -- moneda de referencia opcional (ej. ARS si se cotiza en USD)
  fx_rate DECIMAL(14,4) NULL,                 -- tipo de cambio fijo: monto_secundario = precio × fx_rate
  hourly_rate DECIMAL(10,2) NULL,             -- valor hora global; precio de cada módulo = hourly_rate × módulo.hours
  payment_terms TEXT,
  validity_days INT DEFAULT 15,
  general_notes TEXT,
  sent_at DATETIME NULL,
  accepted_at DATETIME NULL,
  accepted_total_once DECIMAL(12,2) NULL,
  accepted_total_monthly DECIMAL(12,2) NULL,
  accepted_selection JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  INDEX idx_proposals_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE proposal_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  module_number INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,                          -- bullets, un ítem por línea con "- " adelante
  hours DECIMAL(10,2) NULL,                  -- horas estimadas del módulo; precio = proposals.hourly_rate × hours
  price_min DECIMAL(12,2) NOT NULL,
  price_max DECIMAL(12,2) NOT NULL,           -- si el precio ya está cerrado, price_min = price_max
  billing_type VARCHAR(20) NOT NULL DEFAULT 'once',  -- 'once' | 'monthly'
  delivery_estimate VARCHAR(100),
  notes TEXT,
  external_cost_note TEXT,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  default_checked TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id),
  INDEX idx_modules_proposal (proposal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- preguntas pendientes / notas internas — SOLO admin, jamás en una query de /portal
CREATE TABLE proposal_internal_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  question TEXT NOT NULL,
  resolved TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id),
  INDEX idx_notes_proposal (proposal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- tokens de magic link del portal
CREATE TABLE magic_link_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,               -- sha256 del token — nunca se guarda el token crudo
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  INDEX idx_tokens_hash (token_hash),
  INDEX idx_tokens_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- usuario(s) admin
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- rate limiting simple para el pedido de magic link (1 por email cada 60s)
CREATE TABLE magic_link_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_requests_email_time (email, requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
