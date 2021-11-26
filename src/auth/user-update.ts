import { Express, Response, Request } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
const jwt = require('jsonwebtoken');

import { Options, User } from 'types';
import stripUser from '../utils/strip-user';

export const setupUserUpdate = (app: Express, options: Options): void => {
  app.post(
    '/user',
    celebrate(
      {
        [Segments.BODY]: Joi.object().keys({
          name: Joi.string(),
          password: Joi.string(),
        }),
      },
      { abortEarly: false },
    ),
    userUpdate(options),
  );
};

const userUpdate =
  (options: Options) => async (req: Request, res: Response) => {
    const { logger, settings } = options;

    logger.info('USER UPDATE');

    if (!req.body) return res.sendStatus(400);

    try {
      const token = req?.headers?.authorization?.replace('Bearer ', '');
      const { id: tokenUserId } = jwt.verify(token, settings.projectSecret);

      const UserModel = options.connection.model<User>(`users`);
      const user = await UserModel.findById(tokenUserId);
      if (!user) return res.status(400).send('No user found');

      // update user for allowed fields
      user.name = req.body.name;
      user.markModified('name');
      user.password = req.body.password;
      user.markModified('password');

      const updatedUser = await user.save();

      return res.json(stripUser(updatedUser));
    } catch (err) {
      logger.error(
        'USER UPDATE',
        {
          originalUrl: req.originalUrl,
          headers: req.headers,
          params: req.params,
          body: req.body,
        },
        err,
      );
      return res.sendStatus(400);
    }
  };
