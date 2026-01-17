-- Market Data Tables for Hybrid Data Strategy
-- Created: 2026-01-17
-- Purpose: Store historical and snapshot market data to reduce API calls

-- 1. Historical K-line Data (Daily)
CREATE TABLE IF NOT EXISTS stock_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  trade_date DATE NOT NULL,
  open DECIMAL(10, 2),
  high DECIMAL(10, 2),
  low DECIMAL(10, 2),
  close DECIMAL(10, 2),
  volume BIGINT,
  change_pct DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_stock_daily UNIQUE(symbol, trade_date)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_stock_daily_symbol_date 
  ON stock_daily(symbol, trade_date DESC);

-- 2. Fund Flow Data (Daily)
CREATE TABLE IF NOT EXISTS fund_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  trade_date DATE NOT NULL,
  main_net_inflow DECIMAL(20, 2),
  small_net_inflow DECIMAL(20, 2),
  medium_net_inflow DECIMAL(20, 2),
  large_net_inflow DECIMAL(20, 2),
  super_large_net_inflow DECIMAL(20, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_fund_flow UNIQUE(symbol, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_fund_flow_symbol_date 
  ON fund_flow(symbol, trade_date DESC);

-- 3. After-hours Stock Snapshot (Daily closing data)
-- Used for fast after-hours queries
CREATE TABLE IF NOT EXISTS stock_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  trade_date DATE NOT NULL,
  close_price DECIMAL(10, 2),
  change_pct DECIMAL(10, 4),
  volume BIGINT,
  amount DECIMAL(20, 2),
  turnover_rate DECIMAL(10, 4),
  pe_ratio DECIMAL(10, 2),
  pb_ratio DECIMAL(10, 2),
  market_cap DECIMAL(20, 2),
  high DECIMAL(10, 2),
  low DECIMAL(10, 2),
  open DECIMAL(10, 2),
  prev_close DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_stock_snapshot UNIQUE(symbol, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_snapshot_symbol_date 
  ON stock_snapshot(symbol, trade_date DESC);

-- 4. Index Snapshot (Daily)
CREATE TABLE IF NOT EXISTS index_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  trade_date DATE NOT NULL,
  close_price DECIMAL(10, 2),
  change_pct DECIMAL(10, 4),
  volume BIGINT,
  amount DECIMAL(20, 2),
  high DECIMAL(10, 2),
  low DECIMAL(10, 2),
  open DECIMAL(10, 2),
  prev_close DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_index_snapshot UNIQUE(symbol, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_index_snapshot_symbol_date 
  ON index_snapshot(symbol, trade_date DESC);

-- Comments
COMMENT ON TABLE stock_daily IS 'Historical daily K-line data for stocks';
COMMENT ON TABLE fund_flow IS 'Daily fund flow data showing institutional vs retail money movement';
COMMENT ON TABLE stock_snapshot IS 'Daily closing snapshot for fast after-hours queries';
COMMENT ON TABLE index_snapshot IS 'Daily market index snapshots';
