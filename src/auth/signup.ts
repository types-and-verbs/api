import { Express, Response, Request } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { createToken } from '../utils/user';
import stripUser from '../utils/strip-user';
import { Options, StrippedUser, User } from 'types';

export const setupSignup = (app: Express, options: Options): void => {
  app.post(
    '/signup',
    celebrate(
      {
        [Segments.BODY]: Joi.object().keys({
          email: Joi.string().required(),
          name: Joi.string().required(),
          password: Joi.string().required(),
        }),
      },
      { abortEarly: false },
    ),
    signup(options),
  );
};

const signup = (options: Options) => async (req: Request, res: Response) => {
  const { logger } = options;
  try {
    const { email, name, password } = req.body;

    if (!email) {
      return res.status(400).json({ email: 'Email is required' });
    }
    if (!password) {
      return res.status(400).send({ password: 'Password is required' });
    }

    const UserModel = options.connection.model<User>(`users`);

    // check user doesn't already exist
    const currentUser = await UserModel.findOne({
      email,
    });

    if (currentUser) return res.status(400).send('Email is already in use');

    const user = await UserModel.create({
      email,
      password,
      name,
    });

    const strippedUser: StrippedUser = {
      email: user.toObject().email,
      _id: user.toObject()._id,
      id: user.toObject()._id,
    };

    // We are sending the profile inside the token
    const token = createToken(strippedUser, options.settings.projectSecret);

    return res.json({ token, user: stripUser(user) });
  } catch (err) {
    console.error(err);
    logger.error(
      'SIGNUP',
      {
        originalUrl: req.originalUrl,
        headers: req.headers,
        params: req.params,
        body: req.body,
      },
      err,
    );
    return res.status(400).send('Failed to signup');
  }
};
