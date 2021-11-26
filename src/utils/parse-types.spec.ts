import { parseTypes } from './parse-types';

const OUTPUT = [
  {
    name: 'Task',
    access: 'USER',
    fields: {
      name: {
        type: 'string',
        listType: null,
        referenceType: null,
        opts: {
          required: false,
        },
      },
      notes: {
        type: 'string',
        listType: null,
        referenceType: null,
        opts: {
          required: false,
        },
      },
      list: {
        type: 'reference',
        listType: null,
        referenceType: 'list',
        opts: {
          required: false,
        },
      },
      color: {
        type: 'string',
        listType: null,
        referenceType: null,
        opts: {
          required: false,
        },
      },
      completed: {
        type: 'boolean',
        listType: null,
        referenceType: null,
        opts: {
          required: true,
        },
      },
      schedule: {
        type: 'date',
        listType: null,
        referenceType: null,
        opts: {
          required: false,
        },
      },
    },
  },
  {
    name: 'List',
    access: 'USER',
    fields: {
      name: {
        type: 'string',
        listType: null,
        referenceType: null,
        opts: {
          required: false,
        },
      },
      color: {
        type: 'string',
        listType: null,
        referenceType: null,
        opts: {
          required: false,
        },
      },
    },
  },
];

describe('parseTypes()', () => {
  it('should parse', () => {
    expect(
      parseTypes(`
import { Model, Ref } from './src/index';

export interface Task extends Model {
  name?: string;
  notes?: string;
  list?: Ref<List>;
  color?: string;
  completed: boolean;
  schedule?: Date;
}

export interface List extends Model {
  name?: string;
  color?: string;
}`),
    ).toEqual(OUTPUT);
  });
});
