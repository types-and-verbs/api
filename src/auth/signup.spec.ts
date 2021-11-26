import express from 'express';
import request from 'supertest';
import { setupSignup } from './signup';
import { celebrateError } from '../utils/celebrate-error';
import { slientConsole } from '../test/slient-console';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { settings } from '../test/settings';
import { createUserModel } from './user.model';

describe('signup()', () => {
  const URL = '/signup';

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
    setupSignup(app, options);
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
          email: 'email is required',
          name: 'name is required',
          password: 'password is required',
        });
        done();
      });
  });

  it('should err for "email already in use"', (done) => {
    request(app)
      .post(URL)
      .send({
        name: 'maxim',
        email: 'maxim@typesandverbs.com',
        password: 'password',
      })
      .expect(400)
      .then(({ text }) => {
        expect(text).toBe('Email is already in use');
        done();
      });
  });

  it('should successfully signup', (done) => {
    request(app)
      .post(URL)
      .send({
        name: 'maxim',
        email: 'maxim-2@typesandverbs.com',
        password: 'password',
      })
      .expect(200)
      .then(({ body }) => {
        // TODO test token by mocking createToken?
        expect(body.user.email).toEqual('maxim-2@typesandverbs.com');
        expect(body.user.email).toEqual('maxim-2@typesandverbs.com');
        done();
      });
  });
});
