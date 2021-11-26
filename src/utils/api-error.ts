export function apiError(message: string, statusCode: number){
  const error = new Error(message);
  // eslint-disable-next-line
  // @ts-ignore
  error.statusCode = statusCode;
  throw error;
}
