import express from 'express';
import request from 'supertest';
import { setupForgot } from './forgot';

import { slientConsole } from '../test/slient-console';
import { celebrateError } from '../utils/celebrate-error';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { settings } from '../test/settings';
import { createUserModel } from './user.model';

jest.mock('../utils/send-email', () => ({
  sendEmail: jest.fn(async () => {
    undefined;
  }),
}));
import { sendEmail } from '../utils/send-email';

const expiry = new Date();
jest.mock('../utils/user', () => ({
  generateTokenExpiry: jest.fn(() => expiry),
  generateRandomString: jest.fn(() => 'ran-string'),
}));

describe('public forgot()', () => {
  const URL = '/forgot';

  slientConsole(true);

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
    await connection.model('users').create({
      name: 'maxim',
      email: 'maxim@typesandverbs.com',
      password: 'password',
    });
    setupForgot(app, options);
    app.use(celebrateError);
  });

  afterEach(async () => {
    await dbClear();
  });

  afterAll(async () => {
    await dbClose();
  });

  it('should fail without email', (done) => {
    request(app)
      .post(URL)
      .send()
      .expect(400)
      .then(({ text }) => {
        expect(text).toBe('Email is required');
        done();
      });
  });

  it('should fail if user isnt found', (done) => {
    request(app)
      .post(URL)
      .send({ email: 'unknown@email.com' })
      .expect(400)
      .then(({ text }) => {
        expect(text).toBe('Failed to reset password');
        done();
      });
  });

  it('should successfully send email', (done) => {
    request(app)
      .post(URL)
      .send({
        email: 'maxim@typesandverbs.com',
      })
      .expect(200)
      .then(async ({ text }) => {
        expect(text).toEqual(
          'Check your email for password reset instructions',
        );
        expect((sendEmail as jest.Mock).mock.calls.length).toBe(1);

        // find user and check token/expiry was added
        const user = await connection.model('users').findOne({
          email: 'maxim@typesandverbs.com',
        });
        expect(user.resetPasswordToken).toEqual('ran-string');
        expect(user.resetPasswordExpires).toEqual(expiry);

        done();
      });
  });
});
