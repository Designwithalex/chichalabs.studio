-- ============================================================
-- Moneda secundaria en propuestas
-- Permite cotizar en una moneda (ej. USD) y mostrar en paralelo
-- el equivalente en otra (ej. ARS) usando un tipo de cambio fijo
-- guardado en la propuesta.
-- Correr una sola vez.
-- ============================================================

ALTER TABLE proposals
  ADD COLUMN secondary_currency VARCHAR(10) NULL AFTER currency,
  ADD COLUMN fx_rate DECIMAL(14,4) NULL AFTER secondary_currency;
