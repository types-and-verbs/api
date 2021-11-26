import { Request, Response } from 'express';
import { isCelebrateError } from 'celebrate';
const HTTP = require('http');

export function celebrateError(
  err: any,
  req: Request,
  res: Response,
  next: any,
): Response {
  if (!isCelebrateError(err)) {
    return next(err);
  }

  const validation = {};

  err.details.forEach((err) => {
    err.details.forEach((e) => {
      const path = e.path[0];
      validation[path] = e.message.replace('"', '').replace('"', '');
    });
  });

  const result = {
    statusCode: 400,
    error: HTTP.STATUS_CODES['400'],
    message: 'Validation failed',
    validation,
  };

  return res.status(400).send(result);
}
