import type { Schema } from '@pg-studio/shared';

export const mockSchema: Schema = {
    tables: [
        {
            id: "users",
            name: "users",
            columns: [
                { id: "c1", name: "id", type: "uuid", isPrimaryKey: true, isNullable: false, isForeignKey: false },
                { id: "c2", name: "username", type: "varchar(255)", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c3", name: "email", type: "varchar(255)", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c4", name: "created_at", type: "timestamp", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c5", name: "role", type: "varchar(50)", isPrimaryKey: false, isNullable: true, isForeignKey: false },
            ]
        },
        {
            id: "posts",
            name: "posts",
            columns: [
                { id: "c6", name: "id", type: "uuid", isPrimaryKey: true, isNullable: false, isForeignKey: false },
                { id: "c7", name: "user_id", type: "uuid", isPrimaryKey: false, isNullable: false, isForeignKey: true },
                { id: "c8", name: "title", type: "varchar(255)", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c9", name: "content", type: "text", isPrimaryKey: false, isNullable: true, isForeignKey: false },
                { id: "c10", name: "published", type: "boolean", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c11", name: "created_at", type: "timestamp", isPrimaryKey: false, isNullable: false, isForeignKey: false },
            ]
        },
        {
            id: "comments",
            name: "comments",
            columns: [
                { id: "c12", name: "id", type: "uuid", isPrimaryKey: true, isNullable: false, isForeignKey: false },
                { id: "c13", name: "post_id", type: "uuid", isPrimaryKey: false, isNullable: false, isForeignKey: true },
                { id: "c14", name: "user_id", type: "uuid", isPrimaryKey: false, isNullable: false, isForeignKey: true },
                { id: "c15", name: "body", type: "text", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c16", name: "created_at", type: "timestamp", isPrimaryKey: false, isNullable: false, isForeignKey: false },
            ]
        },
        {
            id: "categories",
            name: "categories",
            columns: [
                { id: "c17", name: "id", type: "integer", isPrimaryKey: true, isNullable: false, isForeignKey: false },
                { id: "c18", name: "name", type: "varchar(100)", isPrimaryKey: false, isNullable: false, isForeignKey: false },
            ]
        },
        {
            id: "post_categories",
            name: "post_categories",
            columns: [
                { id: "c19", name: "post_id", type: "uuid", isPrimaryKey: true, isNullable: false, isForeignKey: true },
                { id: "c20", name: "category_id", type: "integer", isPrimaryKey: true, isNullable: false, isForeignKey: true },
            ]
        },
        {
            id: "orders",
            name: "orders",
            columns: [
                { id: "c21", name: "id", type: "uuid", isPrimaryKey: true, isNullable: false, isForeignKey: false },
                { id: "c22", name: "user_id", type: "uuid", isPrimaryKey: false, isNullable: false, isForeignKey: true },
                { id: "c23", name: "total_amount", type: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c24", name: "status", type: "varchar(50)", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c25", name: "created_at", type: "timestamp", isPrimaryKey: false, isNullable: false, isForeignKey: false }
            ]
        },
        {
            id: "order_items",
            name: "order_items",
            columns: [
                { id: "c26", name: "id", type: "uuid", isPrimaryKey: true, isNullable: false, isForeignKey: false },
                { id: "c27", name: "order_id", type: "uuid", isPrimaryKey: false, isNullable: false, isForeignKey: true },
                { id: "c28", name: "product_name", type: "varchar(255)", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c29", name: "quantity", type: "integer", isPrimaryKey: false, isNullable: false, isForeignKey: false },
                { id: "c30", name: "price", type: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false }
            ]
        }
    ],
    relations: [
        {
            id: "rel1",
            sourceTable: "posts",
            targetTable: "users",
            sourceColumn: "user_id",
            targetColumn: "id"
        },
        {
            id: "rel2",
            sourceTable: "comments",
            targetTable: "posts",
            sourceColumn: "post_id",
            targetColumn: "id"
        },
        {
            id: "rel3",
            sourceTable: "comments",
            targetTable: "users",
            sourceColumn: "user_id",
            targetColumn: "id"
        },
        {
            id: "rel4",
            sourceTable: "post_categories",
            targetTable: "posts",
            sourceColumn: "post_id",
            targetColumn: "id"
        },
        {
            id: "rel5",
            sourceTable: "post_categories",
            targetTable: "categories",
            sourceColumn: "category_id",
            targetColumn: "id"
        },
        {
            id: "rel6",
            sourceTable: "orders",
            targetTable: "users",
            sourceColumn: "user_id",
            targetColumn: "id"
        },
        {
            id: "rel7",
            sourceTable: "order_items",
            targetTable: "orders",
            sourceColumn: "order_id",
            targetColumn: "id"
        }
    ],
};

