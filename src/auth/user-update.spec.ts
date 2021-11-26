import express from 'express';
import request from 'supertest';
import { setupUserUpdate } from './user-update';
import { celebrateError } from '../utils/celebrate-error';
import { slientConsole } from '../test/slient-console';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { settings } from '../test/settings';
import { createUserModel } from './user.model';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(async () => 'userId'),
}));
const jwt = require('jsonwebtoken');

describe('userUpdate()', () => {
  const URL = '/user';

  slientConsole();

  const app = express().use(express.json());

  let user = undefined;
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
    user = await connection.model('users').create({
      name: 'maxim',
      email: 'maxim@typesandverbs.com',
      password: 'password',
    });
    jwt.verify.mockImplementation(() => ({
      id: user.id,
    }));

    setupUserUpdate(app, options);
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
      .send({
        name: 123,
        password: 123,
      })
      .set('Authorization', 'Token fake')
      .expect(400)
      .then(({ body }) => {
        expect(body.validation).toEqual({
          name: 'name must be a string',
          password: 'password must be a string',
        });
        done();
      });
  });

  it('should update name and password', (done) => {
    request(app)
      .post(URL)
      .set('Authorization', 'Token fake')
      .send({
        name: 'updatedName',
        password: 'updatedPassword',
      })
      .expect(200)
      .then(async ({ body }) => {
        // check user has been updated
        const updatedUser = await connection.model('users').findById(user.id);
        expect(updatedUser.name).toEqual('updatedName');
        // check returned values are correct
        expect(body.id).toEqual(user.id);
        expect(body.email).toEqual(user.email);
        expect(body.name).toEqual('updatedName');
        // check user has been striped
        expect(body.password).toBeUndefined();
        expect(body.salt).toBeUndefined();
        expect(body.hashedPassword).toBeUndefined();
        done();
      });
  });

  it('should error if jwt.verify fails', (done) => {
    jwt.verify.mockImplementation(() => {
      throw Error('');
    });
    request(app)
      .post(URL)
      .set('Authorization', 'Token fake')
      .send({
        name: 'maxim',
        password: 'password',
      })
      .expect(400)
      .then(({ text }) => {
        expect(text).toBe('Bad Request');
        done();
      });
  });
});
