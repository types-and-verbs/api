export function formatJoiErrors(error: any): { [key: string]: string } {
  return error?.details.reduce((acc: { [key: string]: string }, e: any) => {
    if (!e.path) return acc;

    const field = String(e.path[0]);
    const err: string = e.message.replace('"', '').replace('"', '');
    // eslint-disable-next-line
    acc[field] = err;
    return acc;
  }, {});
}
