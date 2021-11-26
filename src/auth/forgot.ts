import { Express, Response, Request } from 'express';
// import { celebrate, Joi, Segments } from 'celebrate';

import { Options, User } from 'types';
import { generateTokenExpiry, generateRandomString } from '../utils/user';
import { sendEmail } from '../utils/send-email';

export const setupForgot = (app: Express, options: Options): void => {
  app.post(
    '/forgot',
    // celebrate({
    // [Segments.BODY]: Joi.object().keys({
    // email: Joi.string().required().error(new Error('Email is required')),
    // }),
    // }),
    forgot(options),
  );
};

const forgot = (options: Options) => async (req: Request, res: Response) => {
  const { logger, settings } = options;
  try {
    if (!req.body.email) {
      return res.status(400).send('Email is required');
    }

    const UserModel = options.connection.model<User>(`users`);

    // check user doesn't already exist
    const user = await UserModel.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.status(400).send('Failed to reset password');
    }

    const resetPasswordToken = generateRandomString(50);

    if (!resetPasswordToken) {
      return res.status(400).send('Failed to reset password');
    }

    // add token to user
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = generateTokenExpiry();
    await user.save();

    await sendEmail({
      to: req.body.email,
      subject: 'Password reset instructions',
      message: `You've requested a password reset. If this wasn't you ignore this email. <a href="${settings.projectSecret}?token=${resetPasswordToken}">Reset your password</a>`,
    });

    return res.send('Check your email for password reset instructions');
  } catch (err) {
    logger.error(
      'FORGOT',
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
