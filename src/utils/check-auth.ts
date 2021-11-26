import { Request } from 'express';
import { Options } from 'types';
const jwt = require('jsonwebtoken');

import { apiError } from './api-error';

interface CheckAuthPayload {
  userId: string;
}

export async function checkAuth(
  req: Request,
  options: Options,
): Promise<CheckAuthPayload> {
  if (!req?.headers?.authorization) {
    apiError('Unauthorized', 401);
  }

  const token = req.headers.authorization.replace('Bearer ', '');
  if (!token) {
    apiError('Unauthorized', 401);
  }

  let userId: string;
  try {
    const { id } = jwt.verify(token, options.settings.projectSecret);
    userId = id;
  } catch (err) {
    apiError('Unauthorized', 401);
  }

  // TODO do we need to check if it has expired??
  if (!userId) {
    apiError('Unauthorized', 401);
  }

  return {
    userId,
  };
}
