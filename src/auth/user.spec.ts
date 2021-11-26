import express from 'express';
import request from 'supertest';
import { setupUser } from './user';
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
  process.env.TOKEN_EXPIRY = '400 days';

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

    setupUser(app, options);
    app.use(celebrateError);
  });

  afterEach(async () => {
    await dbClear();
  });

  afterAll(async () => {
    await dbClose();
  });

  it('should fail if not supplied with token header', (done) => {
    request(app)
      .get(URL)
      .send()
      .expect(400)
      .then(({ text }) => {
        expect(text).toEqual('Not authorized');
        done();
      });
  });

  it('should return striped user', (done) => {
    request(app)
      .get(URL)
      .set('Authorization', 'Token fake')
      .send()
      .expect(200)
      .then(async ({ body }) => {
        // check returned values are correct
        expect(body.id).toEqual(user.id);
        expect(body.email).toEqual(user.email);
        expect(body.name).toEqual(user.name);
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
      .get(URL)
      .set('Authorization', 'Token fake')
      .send()
      .expect(400)
      .then(({ text }) => {
        expect(text).toBe('Bad Request');
        done();
      });
  });
});
