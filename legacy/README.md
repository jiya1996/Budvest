# Legacy Code

This directory contains deprecated code that has been replaced by Supabase cloud-native architecture.

## Contents

### `data-service/` - Python SQLite Data Collector

**Status**: Deprecated (replaced by Supabase + External APIs)

**Original Purpose**:
- Collect A-share market data using AkShare library
- Store data in local SQLite database
- Provide real-time data for the application

**Why Deprecated**:
- SQLite doesn't work well in Vercel serverless environment
- Requires manual data collection process
- Not scalable for cloud deployment
- Replaced by:
  - Eastmoney API for announcements
  - Sina Finance API for real-time quotes
  - Supabase for data storage and caching

**If You Need to Use It**:
```bash
cd data-service
python database.py  # Initialize database
python run.py       # Start data collector
```

### `lib/legacy/db.ts` - SQLite Database Operations

**Status**: Deprecated (replaced by Supabase)

**Original Purpose**:
- Interface with SQLite database
- Provide functions for querying stock data
- Support legacy MCP tools

**Why Deprecated**:
- All data operations moved to Supabase
- MCP tools now use external APIs directly
- No longer needed for cloud deployment

## Migration Path

If you need to migrate from legacy SQLite to Supabase:

1. **Export SQLite Data**:
   ```bash
   sqlite3 data/market.db .dump > backup.sql
   ```

2. **Transform to Supabase Schema**:
   - Convert SQLite schema to PostgreSQL
   - Import data using Supabase SQL editor

3. **Update Code**:
   - Replace `lib/legacy/db.ts` imports with `lib/supabase.ts`
   - Use Supabase client for all database operations

## Notes

- These files are kept for reference only
- Do not use in production
- May be removed in future versions
