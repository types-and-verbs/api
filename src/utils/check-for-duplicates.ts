export function checkForDuplicates(array: string[]): boolean {
  return new Set(array).size !== array.length;
}
