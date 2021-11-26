import { Value } from 'types';

export async function checkUnique(
  model: any, // Not sure how to type a generic mongoose Model
  itemId: number,
  field: string,
  value: Value,
): Promise<boolean> {
  const query = {};
  query[field] = value;

  const doc = await model.findOne(query);

  if (doc && String(doc._id) === String(itemId)) return true;
  if (doc) return false;
  return true;
}
