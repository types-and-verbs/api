import { Express, Response, Request } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { Options, User, StrippedUser } from 'types';
import { createToken } from '../utils/user';
import { sendEmail } from '../utils/send-email';
import stripUser from '../utils/strip-user';

export const setupReset = (app: Express, options: Options): void => {
  app.post(
    '/reset',
    celebrate(
      {
        [Segments.BODY]: Joi.object().keys({
          token: Joi.string().required(),
          password: Joi.string().required(),
        }),
      },
      { abortEarly: false },
    ),
    reset(options),
  );
};

const reset = (options: Options) => async (req: Request, res: Response) => {
  const { logger, settings } = options;
  try {
    if (!req.body.password) {
      return res.status(400).send({ password: 'Password is required' });
    }
    if (!req.body.token) return res.status(400).send('Token is required');

    const UserModel = options.connection.model<User>(`users`);

    const user = await UserModel.findOne({
      resetPasswordToken: req.body.token,
    })
      .where('resetPasswordExpires')
      .gt(Date.now());

    if (!user) {
      return res
        .status(400)
        .send('Password reset token is invalid or has expired.');
    }

    // Save password to user's model
    user.password = req.body.password;
    // Remove token from user's model
    user.resetPasswordToken = null;
    // Remove tokenExpire from user's model
    user.resetPasswordExpires = null;

    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Confirmation',
        message: `This is a confirmation that the password for your account ${user.email} has just been changed. If this was not you please contact us as soon as possible.`,
      });
    } catch (err) {
      logger.error(
        'RESET email send',
        {
          email: user.email,
          originalUrl: req.originalUrl,
          headers: req.headers,
          params: req.params,
          body: req.body,
        },
        err,
      );
    }

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
      'RESET',
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
