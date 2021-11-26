const jwt = require('jsonwebtoken');
import { Express, Response, Request } from 'express';

import { Options, User } from 'types';
import stripUser from '../utils/strip-user';

export const setupUser = (app: Express, options: Options): void => {
  app.get('/user', user(options));
};

export const user =
  (options: Options) =>
  async (req: Request, res: Response): Promise<Response> => {
    const { logger } = options;

    logger.info('GET USER');

    try {
      const token = req?.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(400).send('Not authorized');
      }
      const { id: tokenUserId } = jwt.verify(token, options.settings.projectSecret);

      const UserModel = options.connection.model<User>(`users`);

      const user = await UserModel.findById(tokenUserId);

      return res.json(stripUser(user));
    } catch (err) {
      logger.error(err);
      return res.sendStatus(400);
    }
  };
