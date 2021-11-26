import { Joi } from 'celebrate';

import { Value, Fields } from 'types';
import { formatJoiErrors } from '../utils/format-joi-errors';

interface Requirements {
  [key: string]: Value;
}

function createRequirements(
  schemaFields: Fields,
  isEditing: boolean,
): Requirements {
  const r = {};

  Object.keys(schemaFields).forEach((f) => {
    const { type, listType } = schemaFields[f];
    const required = isEditing
      ? false
      : schemaFields[f]?.opts?.required || false;

    switch (type) {
      case 'string':
        if (required) {
          r[f] = Joi.string()
            .required()
            .messages({
              // 'string.base': `"a" should be a type of 'text'`,
              'string.empty': `${f} is required`,
              // 'string.min': `"a" should have a minimum length of {#limit}`,
              'any.required': `${f} is required`,
            });
        } else {
          r[f] = Joi.string().allow(null);
        }
        break;
      case 'number':
        if (required) {
          r[f] = Joi.number()
            .required()
            .messages({
              'any.required': `${f} is required`,
            });
        } else {
          r[f] = Joi.number().allow(null);
        }
        break;
      case 'boolean':
        if (required) {
          r[f] = Joi.boolean()
            .required()
            .messages({
              'any.required': `${f} is required`,
            });
        } else {
          r[f] = Joi.boolean().allow(null);
        }
        break;
      case 'date':
        if (required) {
          r[f] = Joi.date()
            .iso()
            .required()
            .messages({
              'any.required': `${f} is required`,
            });
        } else {
          r[f] = Joi.date().iso().allow(null);
        }
        break;
      case 'reference':
        // TODO can we check it's a valid reference type
        if (required) {
          r[f] = Joi.string().required();
        } else {
          r[f] = Joi.string().allow(null);
        }
        break;
      case 'array':
        switch (listType) {
          case 'string':
            if (required) {
              r[f] = Joi.array().items(Joi.string()).required();
            } else {
              r[f] = Joi.array().items(Joi.string()).allow(null);
            }
            break;
          case 'number':
            if (required) {
              r[f] = Joi.array().items(Joi.number()).required();
            } else {
              r[f] = Joi.array().items(Joi.number()).allow(null);
            }
            break;
          case 'boolean':
            if (required) {
              r[f] = Joi.array().items(Joi.boolean()).required();
            } else {
              r[f] = Joi.array().items(Joi.boolean()).allow(null);
            }
            break;
          case 'date':
            if (required) {
              r[f] = Joi.array().items(Joi.date().iso()).required();
            } else {
              r[f] = Joi.array().items(Joi.date().iso()).allow(null);
            }
            break;
          case 'reference':
            if (required) {
              r[f] = Joi.array().items(Joi.string()).required();
            } else {
              r[f] = Joi.array().items(Joi.string());
            }
            break;
        }
        break;
    }
  });

  return r;
}

interface ValidationPayback {
  value: Value;
  errors: { [key: string]: string };
}

export function validateData(
  schemaFields: Fields,
  data: unknown,
  isEditing: boolean,
): ValidationPayback {
  // value
  const { value, error } = Joi.object(
    createRequirements(schemaFields, isEditing),
  ).validate(data, {
    abortEarly: false,
  });

  if (error) {
    return {
      value: null,
      errors: formatJoiErrors(error),
    };
  }

  return { value, errors: null };
}
