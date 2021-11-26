import { Express, Response, Request } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { createToken } from '../utils/user';
import { Options, User, StrippedUser } from 'types';
import stripUser from '../utils/strip-user';

export const setupSignin = (app: Express, options: Options): void => {
  app.post(
    '/signin',
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().required().error(new Error('Email is required')),
        password: Joi.string()
          .required()
          .error(new Error('Password is required')),
      }),
    }),
    signin(options),
  );
};

const signin = (options: Options) => async (req: Request, res: Response) => {
  const { logger } = options;
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ email: 'Email is required' });
    }
    if (!password) {
      return res.status(400).send({ password: 'Password is required' });
    }

    const UserModel = options.connection.model<User>(`users`);

    const user = await UserModel.findOne({
      email,
    });

    if (!user || !user.authenticate(password)) {
      console.error('LOGIN Invalid credentials');
      return res.status(400).send('Invalid email/password');
    }

    const strippedUser: StrippedUser = {
      email: user.toObject().email,
      _id: user.toObject()._id,
      id: user.toObject()._id,
    };

    // We are sending the profile inside the token
    const token = createToken(strippedUser, options.settings.projectSecret);

    return res.json({ token, user: stripUser(user) });
  } catch (err) {
    logger.error(
      'SIGNIN',
      {
        originalUrl: req.originalUrl,
        headers: req.headers,
        params: req.params,
        body: req.body,
      },
      err,
    );
    return res.status(400).send('Failed to signin');
  }
};
