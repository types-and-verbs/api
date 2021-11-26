import express from 'express';
import request from 'supertest';
import { add } from 'date-fns';

import { setupReset } from './reset';
import { celebrateError } from '../utils/celebrate-error';
import { slientConsole } from '../test/slient-console';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { settings } from '../test/settings';
import { createUserModel } from './user.model';

jest.mock('../utils/send-email', () => ({
  sendEmail: jest.fn(async () => {
    undefined;
  }),
}));
import { sendEmail } from '../utils/send-email';

describe('reset()', () => {
  const URL = '/reset';

  slientConsole();

  const app = express().use(express.json());

  let connection = undefined;

  beforeAll(async () => {
    connection = await dbConnect();
    const options = {
      logger: { info: console.log, error: console.error },
      connection,
      settings,
    };
    // setup user model
    createUserModel(options, 'users');
    // create user to test
    connection.model('users').create({
      name: 'maxim',
      email: 'maxim@typesandverbs.com',
      password: 'password',
      resetPasswordToken: 'abcd',
      resetPasswordExpires: add(new Date(), { days: 10 }),
    });
    setupReset(app, options);
    app.use(celebrateError);
  });

  afterEach(async () => {
    await dbClear();
  });

  afterAll(async () => {
    await dbClose();
  });

  it('should fail if not supplied correct data', (done) => {
    request(app)
      .post(URL)
      .send({})
      .expect(400)
      .then(({ body }) => {
        expect(body.validation).toEqual({
          token: 'token is required',
          password: 'password is required',
        });
        done();
      });
  });

  it('should successfully reset password', (done) => {
    request(app)
      .post(URL)
      .send({
        token: 'abcd',
        password: 'new password',
      })
      .expect(200)
      .then(async ({ body }) => {
        // check response
        expect(typeof body.token).toBe('string');
        expect(body.user.name).toBe('maxim');
        expect(body.user.email).toBe('maxim@typesandverbs.com');
        // sendEmail should be called
        expect((sendEmail as jest.Mock).mock.calls.length).toBe(1);
        // find user and check token/expiry was removed
        const user = await connection.model('users').findOne({
          email: 'maxim@typesandverbs.com',
        });
        expect(user.resetPasswordToken).toEqual(null);
        expect(user.resetPasswordExpires).toEqual(null);

        done();
      });
  });
});
