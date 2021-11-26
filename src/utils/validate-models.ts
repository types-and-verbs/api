import { ModelInput } from 'types';
import { checkForDuplicates } from '../utils/check-for-duplicates';

export function validateModels(schemas: ModelInput[]): string[] {
  const names: string[] = schemas
    .map((s: { name: string }) => s?.name?.toLowerCase())
    .filter((x) => !!x);

  if (checkForDuplicates(names)) {
    return ['Two or more models have the same name'];
  }

  return schemas.reduce((errs, schema) => {
    if (!schema.name) return [...errs, 'Model must include a name'];

    if (!schema.access || !['USER', 'PUBLIC', 'TEAM'].includes(schema.access)) {
      return [...errs, 'Model must include an valid access type'];
    }

    const fields = Object.keys(schema.fields);

    if (fields.length === 0) {
      return [...errs, `${schema.name} must include fields`];
    }

    const fieldErrs = fields.reduce((errs, fieldName) => {
      const f = schema.fields[fieldName];

      // check type is defined
      if (!f.type) {
        return [...errs, `${schema.name}.${fieldName}: must have a type`];
      }

      // check type
      if (!validTypes.includes(f.type)) {
        return [
          ...errs,
          `${schema.name}.${fieldName}: type of ${f.type} is invalid`,
        ];
      }

      // check list type
      if (f.type === 'array' && !f.listType) {
        return [
          ...errs,
          `${schema.name}.${fieldName}: listType must be defined for arrays`,
        ];
      }

      if (f.listType && !validListTypes.includes(f.listType)) {
        return [
          ...errs,
          `${schema.name}.${fieldName}: listType of ${f.listType} is invalid`,
        ];
      }

      // check ref type
      if (f.type === 'reference' && !f.referenceType) {
        return [
          ...errs,
          `${schema.name}.${fieldName}: referenceType must be defined for references`,
        ];
      }

      if (f.referenceType && !names.includes(f.referenceType)) {
        return [
          ...errs,
          `${schema.name}.${fieldName}: referenceType of ${f.referenceType} is not a model in this project`,
        ];
      }

      return errs;
    }, []);

    if (fieldErrs.length) return [...errs, ...fieldErrs];

    return errs;
  }, []);
}

const validTypes = [
  'string',
  'boolean',
  'number',
  'email',
  'url',
  'date',
  'array',
  'reference',
];

const validListTypes = [
  'string',
  'boolean',
  'number',
  'email',
  'url',
  'date',
  'reference',
];
