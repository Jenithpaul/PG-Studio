export * from './types';
export * from './schema-builder';

import { SchemaBuilderImpl } from './schema-builder';

export function createSchemaBuilder() {
  return new SchemaBuilderImpl();
}