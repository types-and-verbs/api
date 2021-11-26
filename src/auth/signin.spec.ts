import express from 'express';
import request from 'supertest';
import { setupSignin } from './signin';

import { slientConsole } from '../test/slient-console';
import { celebrateError } from '../utils/celebrate-error';
import { settings } from '../test/settings';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { createUserModel } from './user.model';

describe('signIn()', () => {
  const URL = '/signin';

  slientConsole();

  const app = express().use(express.json());

  beforeAll(async () => {
    const connection = await dbConnect();
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
    });
    setupSignin(app, options);
    app.use(celebrateError);
  });

  afterEach(async () => {
    await dbClear();
  });

  afterAll(async () => {
    await dbClose();
  });

  it('should successfully signIn', (done) => {
    request(app)
      .post(URL)
      .send({
        email: 'maxim@typesandverbs.com',
        password: 'password',
      })
      .expect(200)
      .then(({ body }) => {
        // TODO test token by mocking createToken?
        expect(body.user.email).toEqual('maxim@typesandverbs.com');
        expect(body.user.name).toEqual('maxim');
        // expect(login.mock.calls[0][0].password).toEqual(data.password);
        done();
      });
  });

  it('should fail signIn', (done) => {
    request(app)
      .post(URL)
      .send({
        email: 'maxim@typesandverbs.com',
        password: 'wrong',
      })
      .expect(400)
      .then(({ text }) => {
        expect(text).toBe('Invalid email/password');
        done();
      });
  });
});
