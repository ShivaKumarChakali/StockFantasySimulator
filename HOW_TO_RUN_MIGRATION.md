# How to Run the Database Migration

This guide shows you how to run the SQL command to remove the `entry_fee` column from your database.

## Step 1: Find Your DATABASE_URL

Your database connection string is stored in your `.env` file (or environment variables). It looks like:
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

## Option 1: Using Neon Console (Easiest - Recommended for Neon users)

If you're using **Neon** (neon.tech):

1. **Go to Neon Console**: https://console.neon.tech
2. **Select your project**
3. **Click on "SQL Editor"** in the left sidebar
4. **Paste this command**:
   ```sql
   ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;
   ```
5. **Click "Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
6. **Verify** it worked - you should see "Success" or "ALTER TABLE" message

## Option 2: Using psql Command Line

If you have `psql` installed (PostgreSQL client):

1. **Copy your DATABASE_URL** from your `.env` file
2. **Run this command** in your terminal:
   ```bash
   psql "YOUR_DATABASE_URL_HERE" -c "ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;"
   ```
   
   For example:
   ```bash
   psql "postgresql://user:pass@host/dbname?sslmode=require" -c "ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;"
   ```

3. **Verify** - you should see "ALTER TABLE" confirmation

## Option 3: Using Supabase Dashboard (If using Supabase)

If you're using **Supabase**:

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Click on "SQL Editor"** in the left sidebar
4. **Click "New query"**
5. **Paste this command**:
   ```sql
   ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;
   ```
6. **Click "Run"** (or press `Ctrl+Enter`)
7. **Verify** success

## Option 4: Using a Database GUI Tool

If you use a database management tool (pgAdmin, DBeaver, TablePlus, etc.):

1. **Connect to your database** using your DATABASE_URL
2. **Open SQL Query window**
3. **Paste the command**:
   ```sql
   ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;
   ```
4. **Execute** the query
5. **Verify** the column is removed

## Option 5: Using Node.js Script (Quick Test)

Create a temporary script to run the migration:

1. **Create file**: `run-migration.js`
   ```javascript
   import { Pool } from '@neondatabase/serverless';
   import 'dotenv/config';

   const pool = new Pool({ connectionString: process.env.DATABASE_URL });

   async function runMigration() {
     try {
       await pool.query('ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;');
       console.log('✅ Migration successful! Column removed.');
       process.exit(0);
     } catch (error) {
       console.error('❌ Migration failed:', error);
       process.exit(1);
     } finally {
       await pool.end();
     }
   }

   runMigration();
   ```

2. **Run it**:
   ```bash
   node run-migration.js
   ```

3. **Delete the file** after running (it's temporary)

## Verification

After running the migration, verify it worked:

### Using SQL:
```sql
-- Check if column exists (should return 0 rows)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'contests' 
AND column_name = 'entry_fee';
```

If the query returns 0 rows, the column has been successfully removed!

### Using psql:
```bash
psql "YOUR_DATABASE_URL" -c "\d contests"
```

Look for `entry_fee` in the output - it should NOT be there.

## Troubleshooting

### Error: "column does not exist"
- **Good!** This means the column was already removed (or never existed)
- The `IF EXISTS` clause prevents errors, so this is safe

### Error: "permission denied"
- Make sure you're using a database user with ALTER TABLE permissions
- Check your DATABASE_URL credentials

### Error: "relation does not exist"
- The `contests` table doesn't exist yet
- Run `npm run db:push` first to create tables, then run migration

### Can't connect to database
- Verify your DATABASE_URL is correct
- Check if your database is running/accessible
- Verify network/firewall settings

## Next Steps

After running the migration:

1. ✅ **Verify** the column is removed (use verification SQL above)
2. ✅ **Deploy your code changes** (the code already expects no entry_fee)
3. ✅ **Test the application** - create a contest, join a contest
4. ✅ **Monitor logs** for any errors

## Safety Notes

- ⚠️ **Backup your database first** if this is production
- ✅ The `IF EXISTS` clause is safe - it won't error if column doesn't exist
- ✅ This migration is **irreversible** (you can't easily restore the column)
- ✅ Make sure your code changes are deployed BEFORE or WITH the migration

## Quick Reference

**The command to run:**
```sql
ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;
```

**Most common method (Neon users):**
1. Neon Console → SQL Editor → Paste command → Run

**Command line (if you have psql):**
```bash
psql "$DATABASE_URL" -c "ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;"
```


