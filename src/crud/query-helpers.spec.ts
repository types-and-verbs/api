import { parseQuery } from './query-helpers';
import { Fields } from 'types';

const fields: Fields = {
  name: {
    type: 'string',
    opts: {
      required: false,
      unique: false,
    },
  },
  tags: {
    type: 'array',
    listType: 'string',
    opts: {
      required: false,
      unique: false,
    },
  },
  deadline: {
    type: 'date',
    opts: {
      required: false,
      unique: false,
    },
  },
};

describe('parseQuery()', () => {
  describe('array helpers', () => {
    it('_includes', () => {
      const query = { tags_includes: ['Pear', 'Apricot'] };
      expect(parseQuery(query, fields)).toEqual({
        tags: { $all: ['Pear', 'Apricot'] },
      });
    });
    it('_excludes', () => {
      const query = { tags_excludes: ['Pear', 'Apricot'] };
      expect(parseQuery(query, fields)).toEqual({
        tags: { $nin: ['Pear', 'Apricot'] },
      });
    });
  });

  describe('string helpers', () => {
    it('_contains', () => {
      const query = { name_contains: 'apple' };
      expect(parseQuery(query, fields)).toEqual({
        name: /apple/i,
      });
    });
  });

  describe('date helpers', () => {
    it('_before', () => {
      const query = { deadline_before: '2020-05-02T09:48:06.421Z' };
      expect(parseQuery(query, fields)).toEqual({
        deadline: { $lt: '2020-05-02T09:48:06.421Z' },
      });
    });
    it('_after', () => {
      const query = { deadline_after: '2020-05-02T09:48:06.421Z' };
      expect(parseQuery(query, fields)).toEqual({
        deadline: { $gt: '2020-05-02T09:48:06.421Z' },
      });
    });
    it('_between', () => {
      const query = {
        deadline_between: [
          '2020-05-02T09:48:06.421Z',
          '2020-05-03T09:48:06.421Z',
        ],
      };
      expect(parseQuery(query, fields)).toEqual({
        deadline: {
          $gte: '2020-05-02T09:48:06.421Z',
          $lte: '2020-05-03T09:48:06.421Z',
        },
      });
    });
  });
});
