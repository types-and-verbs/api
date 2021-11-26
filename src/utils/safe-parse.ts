// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeParse(input: string): { [key: string]: any } {
  // if it's already an object then don't parse
  if (typeof input === 'object') return input;
  try {
    return JSON.parse(input);
  } catch (ex) {
    // console.error(ex);
    return null;
  }
}
