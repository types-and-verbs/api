import { validateData } from './validate-data';

describe('validateData()', () => {
  describe('string', () => {
    test('should check string', () => {
      expect(
        validateData(
          {
            desc: {
              type: 'string',
            },
          },
          {
            desc: 'string',
          },
          false,
        ).errors,
      ).toEqual(null);

      expect(
        validateData(
          {
            desc: {
              type: 'string',
            },
          },
          {
            desc: 2134,
          },
          false,
        ).errors,
      ).toEqual({ desc: 'desc must be a string' });

      expect(
        validateData(
          {
            desc: {
              type: 'string',
            },
          },
          {
            desc: true,
          },
          false,
        ).errors,
      ).toEqual({ desc: 'desc must be a string' });
    });
  });

  describe('number', () => {
    test('should check number', () => {
      expect(
        validateData(
          {
            desc: {
              type: 'number',
            },
          },
          {
            desc: 1234,
          },
          false,
        ).errors,
      ).toEqual(null);

      expect(
        validateData(
          {
            desc: {
              type: 'number',
            },
          },
          {
            desc: 'string',
          },
          false,
        ).errors,
      ).toEqual({ desc: 'desc must be a number' });

      expect(
        validateData(
          {
            desc: {
              type: 'number',
            },
          },
          {
            desc: true,
          },
          false,
        ).errors,
      ).toEqual({ desc: 'desc must be a number' });
    });
  });

  describe('boolean', () => {
    test('should check boolean', () => {
      expect(
        validateData(
          {
            desc: {
              type: 'boolean',
            },
          },
          {
            desc: true,
          },
          false,
        ).errors,
      ).toEqual(null);

      expect(
        validateData(
          {
            desc: {
              type: 'boolean',
            },
          },
          {
            desc: 'string',
          },
          false,
        ).errors,
      ).toEqual({ desc: 'desc must be a boolean' });

      expect(
        validateData(
          {
            desc: {
              type: 'boolean',
            },
          },
          {
            desc: 12345,
          },
          false,
        ).errors,
      ).toEqual({ desc: 'desc must be a boolean' });
    });
  });

  describe('date', () => {
    test('should check date', () => {
      expect(
        validateData(
          {
            desc: {
              type: 'date',
            },
          },
          {
            desc: '2020-12-16T08:54:48.717Z',
          },
          false,
        ).errors,
      ).toEqual(null);
    });

    test('should check for valid iso date', () => {
      expect(
        validateData(
          {
            desc: {
              type: 'date',
            },
          },
          {
            desc: 'a random string',
          },
          false,
        ).errors,
      ).toEqual({ desc: 'desc must be in ISO 8601 date format' });
    });
  });

  test('should check required', () => {
    expect(
      validateData(
        {
          desc: {
            type: 'string',
            opts: {
              required: true,
            },
          },
          amount: {
            type: 'number',
            opts: {
              required: true,
            },
          },
          completed: {
            type: 'boolean',
            opts: {
              required: true,
            },
          },
          date: {
            type: 'date',
            opts: {
              required: true,
            },
          },
          arr: {
            type: 'array',
            listType: 'string',
            opts: {
              required: true,
            },
          },
        },
        {},
        false,
      ).errors,
    ).toEqual({
      desc: 'desc is required',
      amount: 'amount is required',
      completed: 'completed is required',
      date: 'date is required',
      arr: 'arr is required',
    });
  });

  it.skip('should test arrays', () => undefined);
});
