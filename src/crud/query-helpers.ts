import { GenericObject, Field, Fields } from 'types';

const helpers = [
  '_contains',
  '_starts_with',
  '_ends_with',
  '_includes',
  '_excludes',
  '_before',
  '_after',
  '_between',
  '_lt',
  '_lte',
  '_gt',
  '_gte',
];

function removeHelper(key: string): string {
  return helpers.reduce((acc, val) => {
    return acc.replace(val, '');
  }, key);
}

export function parseQuery(
  query: GenericObject,
  fields: Fields = {},
): GenericObject {
  if (!query) return {};

  return Object.keys(query).reduce((acc, key) => {
    const value = query[key];

    // remove all helpers
    const keyWithoutHelper = removeHelper(key);

    // find fieldType
    const res = findHelper(
      fields[keyWithoutHelper],
      key,
      keyWithoutHelper,
      value,
    );

    // If field doesn't exist, ignore it
    if (!res) return acc;

    // update key
    acc[res.key] = res.value;

    return acc;
  }, {});
}

function findHelper(
  field: Field,
  key: string,
  keyWithoutHelper: string,
  value: any,
) {
  if (!field || !field.type) {
    return {
      key: keyWithoutHelper,
      value,
    };
  }

  switch (field.type) {
    case 'string':
      return stringHelper(key, keyWithoutHelper, value);
    case 'array':
      return arrayHelper(key, keyWithoutHelper, value);
    case 'date':
      return dateHelper(key, keyWithoutHelper, value);
    case 'number':
      return numberHelper(key, keyWithoutHelper, value);
    default:
      return {
        key: keyWithoutHelper,
        value,
      };
  }
}

function arrayHelper(key: string, keyWithoutHelper: string, value: any) {
  if (key.endsWith('_includes')) {
    return {
      key: keyWithoutHelper,
      value: { $all: value },
    };
  }
  if (key.endsWith('_excludes')) {
    return {
      key: keyWithoutHelper,
      value: { $nin: value },
    };
  }
  return {
    key,
    value,
  };
}

function stringHelper(key: string, keyWithoutHelper: string, value: any) {
  if (key.endsWith('_contains')) {
    return {
      key: keyWithoutHelper,
      value: value && value.length ? new RegExp(value, 'i') : '',
    };
  }
  if (key.endsWith('_starts_with')) {
    return {
      key: keyWithoutHelper,
      value: value && value.length ? new RegExp(`^${value}`, 'i') : '',
    };
  }
  if (key.endsWith('_ends_with')) {
    return {
      key: keyWithoutHelper,
      value: value && value.length ? new RegExp(`${value}$`, 'i') : '',
    };
  }
  return {
    key,
    value,
  };
}

function numberHelper(key: string, keyWithoutHelper: string, value: any) {
  if (key.endsWith('_lt')) {
    return {
      key: keyWithoutHelper,
      value: { $lt: value },
    };
  }
  if (key.endsWith('_lte')) {
    return {
      key: keyWithoutHelper,
      value: { $lte: value },
    };
  }
  if (key.endsWith('_gt')) {
    return {
      key: keyWithoutHelper,
      value: { $gt: value },
    };
  }
  if (key.endsWith('_gte')) {
    return {
      key: keyWithoutHelper,
      value: { $gte: value },
    };
  }
  if (key.endsWith('_between')) {
    return {
      key: keyWithoutHelper,
      value: { $gte: value[0], $lte: value[1] },
    };
  }
  return {
    key,
    value: Number(value),
  };
}

function dateHelper(key: string, keyWithoutHelper: string, value: any) {
  if (key.endsWith('_before')) {
    return {
      key: keyWithoutHelper,
      value: { $lt: value },
    };
  }
  if (key.endsWith('_after')) {
    return {
      key: keyWithoutHelper,
      value: { $gt: value },
    };
  }
  if (key.endsWith('_between')) {
    return {
      key: keyWithoutHelper,
      value: { $gte: value[0], $lte: value[1] },
    };
  }
  return {
    key,
    value,
  };
}
