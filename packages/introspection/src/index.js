"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseSchema = getDatabaseSchema;
const pg_1 = require("pg");
async function getDatabaseSchema(connectionString) {
    const pool = new pg_1.Pool({ connectionString });
    const client = await pool.connect();
    try {
        const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
        const tables = [];
        const tableNames = tablesRes.rows.map(row => row.table_name);
        for (const tableName of tableNames) {
            const columnsRes = await client.query(`
        SELECT
          c.column_name,
          c.data_type,
          c.is_nullable,
          (
            SELECT COUNT(*)
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND kcu.table_name = c.table_name
            AND kcu.column_name = c.column_name
          ) > 0 as is_primary_key
        FROM information_schema.columns c
        WHERE c.table_name = $1 AND c.table_schema = 'public'
        ORDER BY c.ordinal_position;
      `, [tableName]);
            const columns = columnsRes.rows.map(col => ({
                id: `${tableName}-${col.column_name}`,
                name: col.column_name,
                type: col.data_type,
                isPrimaryKey: col.is_primary_key,
                isForeignKey: false, // This will be updated below
                isNullable: col.is_nullable === 'YES',
            }));
            tables.push({
                id: tableName,
                name: tableName,
                columns: columns,
            });
        }
        const relationsRes = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM
        information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `);
        const relations = relationsRes.rows.map(row => {
            // Mark the column as a foreign key
            const sourceTable = tables.find(t => t.name === row.source_table);
            if (sourceTable) {
                const sourceColumn = sourceTable.columns.find(c => c.name === row.source_column);
                if (sourceColumn) {
                    sourceColumn.isForeignKey = true;
                }
            }
            return {
                id: `fk-${row.source_table}-${row.source_column}`,
                sourceTable: row.source_table,
                sourceColumn: row.source_column,
                targetTable: row.target_table,
                targetColumn: row.target_column,
            };
        });
        return { tables, relations };
    }
    finally {
        client.release();
        await pool.end();
    }
}
//# sourceMappingURL=index.js.map