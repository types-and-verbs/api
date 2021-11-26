import { Model } from 'types';

interface PopulateQuery {
  path: string;
  model: string;
  select?: string;
}

export function createPopulates(
  populate: string[],
  schema: Model,
): PopulateQuery[] {
  return populate.map((key: string) => {
    if (key === 'user') {
      return {
        path: key,
        model: `users`,
        select: 'name email _id lastUpdated createdAt',
      };
    }

    // TODO guard this?
    const model = schema.fields[key].referenceType;

    return {
      path: key,
      model: `${model}`,
      // select: '',
    };
  });
}
