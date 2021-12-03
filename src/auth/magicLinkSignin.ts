import { Express, Response, Request } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { Options, User, StrippedUser } from 'types';
import { createToken } from '../utils/user';
import stripUser from '../utils/strip-user';

export const setupMagicLinkSignin = (app: Express, options: Options): void => {
  app.post(
    '/magiclink_signin',
    celebrate(
      {
        [Segments.BODY]: Joi.object().keys({
          token: Joi.string().required(),
        }),
      },
      { abortEarly: false },
    ),
    magicLinkSignin(options),
  );
};

const magicLinkSignin =
  (options: Options) => async (req: Request, res: Response) => {
    const { logger, settings } = options;
    try {
      if (!req.body.token) return res.status(400).send('Token is required');

      const UserModel = options.connection.model<User>(`users`);

      const user = await UserModel.findOne({
        magicLinkToken: req.body.token,
      })
        .where('magicLinkExpires')
        .gt(Date.now());

      if (!user) {
        return res.status(400).send('Magic link is invalid or has expired.');
      }

      // Save password to user's model
      user.password = req.body.password;
      // Remove token from user's model
      user.magicLinkToken = null;
      // Remove magicLinkExpires from user's model
      user.magicLinkExpires = null;

      await user.save();

      const strippedUser: StrippedUser = {
        email: user.toObject().email,
        _id: user.toObject()._id,
        id: user.toObject()._id,
      };

      // We are sending the profile inside the token
      const token = createToken(strippedUser, settings.projectSecret);

      return res.json({ token, user: stripUser(user) });
    } catch (err) {
      logger.error(
        'MAGICLINK_SIGNIN',
        {
          originalUrl: req.originalUrl,
          headers: req.headers,
          params: req.params,
          body: req.body,
        },
        err,
      );
      return res.status(400).send('Failed to reset');
    }
  };
