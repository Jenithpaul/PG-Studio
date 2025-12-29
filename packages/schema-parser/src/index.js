"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSql = parseSql;
exports.prettyPrintSchema = prettyPrintSchema;
const pgsql_parser_1 = require("pgsql-parser");
async function parseSql(sql) {
    try {
        const ast = await (0, pgsql_parser_1.parse)(sql);
        const tables = [];
        const relations = [];
        const foreignKeyConstraints = new Map();
        // Handle the stmts array from pgsql-parser
        const statements = ast.stmts || [];
        for (const stmtWrapper of statements) {
            const statement = stmtWrapper.stmt;
            if ('CreateStmt' in statement) {
                const createStmt = statement.CreateStmt;
                const tableName = createStmt.relation.relname;
                const columns = [];
                let primaryKeys = [];
                const tableForeignKeys = [];
                for (const elt of createStmt.tableElts) {
                    if (elt.ColumnDef) {
                        const colDef = elt.ColumnDef;
                        const colName = colDef.colname;
                        const typeName = colDef.typeName.names.slice(-1)[0].String.str;
                        let isPrimaryKey = false;
                        let isForeignKey = false;
                        if (colDef.constraints) {
                            for (const constraint of colDef.constraints) {
                                if (constraint.Constraint.contype === 'CONSTR_PRIMARY') {
                                    isPrimaryKey = true;
                                    primaryKeys.push(colName);
                                }
                                else if (constraint.Constraint.contype === 'CONSTR_FOREIGN') {
                                    isForeignKey = true;
                                    // Handle inline REFERENCES clause
                                    const fkConstraint = extractForeignKeyFromConstraint(constraint.Constraint, [colName]);
                                    if (fkConstraint) {
                                        tableForeignKeys.push(fkConstraint);
                                    }
                                }
                            }
                        }
                        columns.push({
                            id: `${tableName}-${colName}`,
                            name: colName,
                            type: typeName,
                            isPrimaryKey: isPrimaryKey,
                            isForeignKey: isForeignKey,
                            isNullable: true, // Default, can be refined
                        });
                    }
                    else if (elt.Constraint) {
                        const constraint = elt.Constraint;
                        if (constraint.contype === 'CONSTR_PRIMARY') {
                            // Primary key defined at the table level
                            primaryKeys.push(...constraint.keys.map((k) => k.String.str));
                        }
                        else if (constraint.contype === 'CONSTR_FOREIGN') {
                            // Foreign key defined at the table level
                            const sourceColumns = constraint.keys.map((k) => k.String.str);
                            const fkConstraint = extractForeignKeyFromConstraint(constraint, sourceColumns);
                            if (fkConstraint) {
                                tableForeignKeys.push(fkConstraint);
                                // Mark columns as foreign keys
                                for (const colName of sourceColumns) {
                                    const column = columns.find(c => c.name === colName);
                                    if (column) {
                                        column.isForeignKey = true;
                                    }
                                }
                            }
                        }
                    }
                }
                // Update isPrimaryKey for columns defined in a table-level constraint
                if (primaryKeys.length > 0) {
                    for (const col of columns) {
                        if (primaryKeys.includes(col.name)) {
                            col.isPrimaryKey = true;
                        }
                    }
                }
                tables.push({
                    id: tableName,
                    name: tableName,
                    columns: columns,
                });
                if (tableForeignKeys.length > 0) {
                    foreignKeyConstraints.set(tableName, tableForeignKeys);
                }
            }
            else if ('AlterTableStmt' in statement) {
                // Handle ALTER TABLE statements
                const alterTableStmt = statement.AlterTableStmt;
                const tableName = alterTableStmt.relation.relname;
                for (const cmd of alterTableStmt.cmds) {
                    if (cmd.AlterTableCmd && cmd.AlterTableCmd.subtype === 'AT_AddConstraint') {
                        const constraint = cmd.AlterTableCmd.def.Constraint;
                        if (constraint && constraint.contype === 'CONSTR_FOREIGN') {
                            // For ALTER TABLE, use fk_attrs instead of keys
                            const sourceColumns = constraint.fk_attrs ? constraint.fk_attrs.map((k) => k.String.str) : [];
                            const fkConstraint = extractForeignKeyFromConstraint(constraint, sourceColumns);
                            if (fkConstraint) {
                                const existingConstraints = foreignKeyConstraints.get(tableName) || [];
                                existingConstraints.push(fkConstraint);
                                foreignKeyConstraints.set(tableName, existingConstraints);
                            }
                        }
                    }
                }
            }
        }
        // Convert foreign key constraints to relations
        for (const [sourceTable, constraints] of foreignKeyConstraints) {
            for (const constraint of constraints) {
                for (let i = 0; i < constraint.sourceColumns.length; i++) {
                    const sourceColumn = constraint.sourceColumns[i];
                    const targetColumn = constraint.targetColumns[i] || constraint.targetColumns[0]; // Handle single target column case
                    relations.push({
                        id: `${sourceTable}-${sourceColumn}-${constraint.targetTable}-${targetColumn}`,
                        sourceTable,
                        targetTable: constraint.targetTable,
                        sourceColumn,
                        targetColumn,
                        constraintName: constraint.constraintName,
                        onDelete: constraint.onDelete,
                        onUpdate: constraint.onUpdate,
                    });
                }
            }
        }
        return { tables, relations };
    }
    catch (e) {
        console.error('Failed to parse SQL:', e);
        return { tables: [], relations: [] };
    }
}
function prettyPrintSchema(schema) {
    const sqlStatements = [];
    // Generate CREATE TABLE statements
    for (const table of schema.tables) {
        const columnDefinitions = [];
        const constraints = [];
        // Add column definitions
        for (const column of table.columns) {
            let columnDef = `  ${column.name} ${column.type.toUpperCase()}`;
            if (!column.isNullable) {
                columnDef += ' NOT NULL';
            }
            columnDefinitions.push(columnDef);
        }
        // Add primary key constraint
        const primaryKeyColumns = table.columns
            .filter(col => col.isPrimaryKey)
            .map(col => col.name);
        if (primaryKeyColumns.length > 0) {
            if (primaryKeyColumns.length === 1) {
                // Single column primary key - can be inline or separate constraint
                const pkIndex = columnDefinitions.findIndex(def => def.includes(primaryKeyColumns[0]));
                if (pkIndex !== -1) {
                    columnDefinitions[pkIndex] += ' PRIMARY KEY';
                }
            }
            else {
                // Multi-column primary key - must be separate constraint
                constraints.push(`  PRIMARY KEY (${primaryKeyColumns.join(', ')})`);
            }
        }
        // Add foreign key constraints
        const tableForeignKeys = schema.relations.filter(rel => rel.sourceTable === table.name);
        const groupedForeignKeys = new Map();
        // Group foreign keys by constraint name or create unique groups
        for (const relation of tableForeignKeys) {
            const key = relation.constraintName || `${relation.sourceColumn}_${relation.targetTable}_${relation.targetColumn}`;
            if (!groupedForeignKeys.has(key)) {
                groupedForeignKeys.set(key, []);
            }
            groupedForeignKeys.get(key).push(relation);
        }
        for (const [constraintKey, relations] of groupedForeignKeys) {
            const sourceColumns = relations.map(rel => rel.sourceColumn);
            const targetColumns = relations.map(rel => rel.targetColumn);
            const targetTable = relations[0].targetTable;
            const constraintName = relations[0].constraintName;
            const onDelete = relations[0].onDelete;
            const onUpdate = relations[0].onUpdate;
            let constraintDef = '  ';
            if (constraintName) {
                constraintDef += `CONSTRAINT ${constraintName} `;
            }
            constraintDef += `FOREIGN KEY (${sourceColumns.join(', ')}) REFERENCES ${targetTable} (${targetColumns.join(', ')})`;
            if (onDelete) {
                constraintDef += ` ON DELETE ${onDelete.replace('_', ' ')}`;
            }
            if (onUpdate) {
                constraintDef += ` ON UPDATE ${onUpdate.replace('_', ' ')}`;
            }
            constraints.push(constraintDef);
        }
        // Combine all parts
        const allDefinitions = [...columnDefinitions, ...constraints];
        const createTableSql = `CREATE TABLE ${table.name} (\n${allDefinitions.join(',\n')}\n);`;
        sqlStatements.push(createTableSql);
    }
    return sqlStatements.join('\n\n');
}
function extractForeignKeyFromConstraint(constraint, sourceColumns) {
    if (!constraint.pktable) {
        return null;
    }
    const targetTable = constraint.pktable.relname;
    // Handle both pk_attrs (ALTER TABLE) and direct column references
    const targetColumns = constraint.pk_attrs
        ? constraint.pk_attrs.map((attr) => attr.String.str)
        : [constraint.pktable.relname]; // fallback
    let onDelete;
    let onUpdate;
    // Extract referential actions
    if (constraint.fk_del_action) {
        switch (constraint.fk_del_action) {
            case 'a':
                onDelete = 'NO_ACTION';
                break;
            case 'r':
                onDelete = 'RESTRICT';
                break;
            case 'c':
                onDelete = 'CASCADE';
                break;
            case 'n':
                onDelete = 'SET_NULL';
                break;
        }
    }
    if (constraint.fk_upd_action) {
        switch (constraint.fk_upd_action) {
            case 'a':
                onUpdate = 'NO_ACTION';
                break;
            case 'r':
                onUpdate = 'RESTRICT';
                break;
            case 'c':
                onUpdate = 'CASCADE';
                break;
            case 'n':
                onUpdate = 'SET_NULL';
                break;
        }
    }
    return {
        constraintName: constraint.conname || undefined,
        sourceColumns,
        targetTable,
        targetColumns,
        onDelete,
        onUpdate,
    };
}
//# sourceMappingURL=index.js.map