-- =============================================================================
-- Migración: valor hora por propuesta + horas por módulo
-- Fecha: 2026-07-17
-- =============================================================================
-- El editor de propuestas (admin/propuesta-editor.php) calcula el precio de cada
-- módulo como  proposals.hourly_rate × proposal_modules.hours. Estas dos columnas
-- faltaban en la base de datos, por lo que guardar una propuesta o un módulo
-- lanzaba un error "Unknown column".
--
-- Cómo aplicar en Hostinger:
--   hPanel → Bases de datos → phpMyAdmin → elegí la base u967859704_chicha_studio
--   → pestaña "SQL" → pegá este archivo → Continuar.
--
-- Es seguro correrlo una sola vez. Si una columna YA existe, MySQL devolverá
-- "Duplicate column name" — en ese caso esa columna ya estaba y podés ignorarlo.
-- =============================================================================

-- Nota: en la base de producción estas columnas YA existen (decimal(10,2)).
-- Esta migración queda documentada para reconstruir la base desde cero.
ALTER TABLE proposals
  ADD COLUMN hourly_rate DECIMAL(10,2) NULL AFTER currency;

ALTER TABLE proposal_modules
  ADD COLUMN hours DECIMAL(10,2) NULL AFTER description;

-- Verificación (opcional): deberían aparecer las columnas nuevas.
-- SHOW COLUMNS FROM proposals LIKE 'hourly_rate';
-- SHOW COLUMNS FROM proposal_modules LIKE 'hours';
