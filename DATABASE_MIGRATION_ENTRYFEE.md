# Database Migration: Remove entryFee Column

## IMPORTANT: Database Schema Change Required

The `entryFee` column has been removed from the codebase for legal compliance. 
**You must run a database migration to remove this column from your production database.**

## 📖 Quick Start Guide

**See [HOW_TO_RUN_MIGRATION.md](./HOW_TO_RUN_MIGRATION.md) for detailed step-by-step instructions.**

**TL;DR - Run this SQL command:**
```sql
ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;
```

**Where to run it:**
- **Neon users**: Neon Console → SQL Editor → Paste → Run
- **Supabase users**: Supabase Dashboard → SQL Editor → Run
- **Command line**: `psql "$DATABASE_URL" -c "ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;"`
- **Database GUI**: Any PostgreSQL client (pgAdmin, DBeaver, TablePlus, etc.)

## Migration Script

### Option 1: Using SQL directly (Recommended)

```sql
-- Remove the entryFee column from contests table
ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;
```

### Option 2: Using Command Line (psql)

```bash
psql "$DATABASE_URL" -c "ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;"
```

### Option 3: Manual Migration Script

Create a file `migrations/remove_entry_fee.sql`:

```sql
-- Migration: Remove entry_fee column from contests table
-- Date: [Current Date]
-- Reason: Legal compliance - educational platform, contests must be free

BEGIN;

-- Drop the column
ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;

COMMIT;
```

Then run:
```bash
psql $DATABASE_URL -f migrations/remove_entry_fee.sql
```

## Verification

After running the migration, verify the column is removed:

```sql
-- Check table structure
\d contests

-- Or using SQL
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contests';
```

The `entry_fee` column should not appear in the results.

## Rollback (if needed)

If you need to rollback for any reason:

```sql
ALTER TABLE contests ADD COLUMN entry_fee REAL NOT NULL DEFAULT 0;
```

**Note:** This rollback is NOT recommended for production as it reintroduces legal compliance issues.

## Testing

After migration:
1. Restart the application
2. Verify contests can be created without entryFee
3. Verify users can join contests without balance checks
4. Verify no errors in application logs

## Production Deployment

1. **Backup your database first!**
2. Run the migration during a maintenance window
3. Deploy the code changes
4. Verify functionality
5. Monitor logs for any errors

