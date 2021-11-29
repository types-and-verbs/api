import { Express, Response, Request } from 'express';
// import { celebrate, Joi, Segments } from 'celebrate';

import { Options, User } from 'types';
import { generateTokenExpiry, generateRandomString } from '../utils/user';
import { sendEmail } from '../utils/send-email';

export const setupMagicLinkRequest = (app: Express, options: Options): void => {
  app.post(
    '/magiclink_request',
    // celebrate({
    // [Segments.BODY]: Joi.object().keys({
    // email: Joi.string().required().error(new Error('Email is required')),
    // }),
    // }),
    magicLinkRequest(options),
  );
};

const magicLinkRequest =
  (options: Options) => async (req: Request, res: Response) => {
    const { logger, settings } = options;
    try {
      if (!req.body.email) {
        return res.status(400).send('Email is required');
      }

      const UserModel = options.connection.model<User>(`users`);

      // check if user exists
      let user = await UserModel.findOne({
        email: req.body.email,
      });

      if (!user) {
        // create user
        user = await UserModel.create({
          email: req.body.email,
        });

        if (!user) {
          return res.status(400).send('Failed to create account');
        }
      }

      const magiclinkToken = generateRandomString(50);

      if (!magiclinkToken) {
        return res.status(400).send('Failed to create magic link');
      }

      // add token to user
      user.magicLinkToken = magiclinkToken;
      user.magicLinkExpires = generateTokenExpiry(); // 1 hour default
      await user.save();

      await sendEmail({
        to: req.body.email,
        subject: 'Magic Link',
        message: `Follow this link to <a href="${settings.projectUrl}?magiclink=${magiclinkToken}">login</a>`,
      });

      return res.send('Check your email for magic link');
    } catch (err) {
      logger.error(
        'MAGICLINK-REQUEST',
        {
          originalUrl: req.originalUrl,
          headers: req.headers,
          params: req.params,
          body: req.body,
        },
        err,
      );
      return res.status(400);
    }
  };
