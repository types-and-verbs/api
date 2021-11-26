import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';

import { Model } from 'types';
import { slientConsole } from '../test/slient-console';
import { celebrateError } from '../utils/celebrate-error';
import { createUserModel } from '../auth/user.model';
import { settings } from '../test/settings';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { setupFindOne } from './findOne';
import { initSetupModel } from '../utils/setup-model';
import { createToken } from '../utils/user';

describe('CRUD findOne()', () => {
  slientConsole();

  const app = express().use(express.json());

  let connection: mongoose.Connection | undefined = undefined;
  let user = undefined;
  let user2 = undefined;
  let token = undefined;
  let setupModel = undefined;
  let item1 = undefined;
  let item2 = undefined;

  beforeAll(async () => {
    connection = await dbConnect();
    const options = {
      logger: { info: console.log, error: console.error },
      connection,
      settings,
    };
    setupModel = initSetupModel(options);

    const model: Model = {
      name: 'todo',
      access: 'USER',
      fields: {
        name: {
          type: 'string',
          opts: { required: false },
        },
        points: {
          type: 'number',
          opts: { required: false },
        },
        deadline: {
          type: 'date',
          opts: { required: false },
        },
        completed: {
          type: 'boolean',
          opts: { required: false },
        },
      },
    };
    setupModel(model);
    // setup user model
    createUserModel(options, 'users');
    // create user to test
    user = await connection.model('users').create({
      name: 'maxim',
      email: 'maxim@typesandverbs.com',
      password: 'password',
    });
    token = createToken(user, settings.projectSecret);
    user2 = await connection.model('users').create({
      name: 'mary',
      email: 'mary@typesandverbs.com',
      password: 'password',
    });
    // create data to test
    item1 = await connection.model('todo').create({
      name: 'test',
      points: 123,
      deadline: new Date('2021-06-23T08:07:11.265Z'),
      user: user.id,
      completed: true,
    });
    item2 = await connection.model('todo').create({
      name: 'test',
      points: 123,
      deadline: new Date(),
      user: user2.id,
      completed: true,
    });
    setupFindOne(app, options, model);
    app.use(celebrateError);
  });

  afterEach(async () => {
    await dbClear();
  });

  afterAll(async () => {
    await dbClose();
  });

  it('should return 401 without authorization header', (done) => {
    request(app)
      .get(`/todo/${item1.id}`)
      .expect(401)
      .end((err, { statusCode }) => {
        if (err) console.error(err);
        expect(statusCode).toBe(401);
        done();
      });
  });

  it('should return 404 for non-models routes', (done) => {
    request(app)
      .get(`/non-model/${item1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .end((err, { statusCode }) => {
        if (err) console.error(err);
        expect(statusCode).toBe(404);
        done();
      });
  });

  it('should find correct item', (done) => {
    request(app)
      .get(`/todo/${item1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end((err, { body, statusCode }) => {
        if (err) console.error(err);
        expect(statusCode).toBe(200);
        expect(body.id).toBe(item1.id);
        expect(body.user).toBe(user.id);
        done();
      });
  });

  it('should remove mongodb fields from response', (done) => {
    request(app)
      .get(`/todo/${item1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end((err, { statusCode, body }) => {
        if (err) console.error(err);
        expect(statusCode).toBe(200);
        expect(body._id).toBe(undefined);
        expect(body.__v).toBe(undefined);
        done();
      });
  });

  it('should return 401 when trying to access someone elses data', async () => {
    const { statusCode } = await request(app)
      .get(`/todo/${item2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(statusCode).toBe(401);
  });

  // it('should return other users data when model has PUBLIC access and user is authed', async () => {
  // // change todo model to PUBLIC access
  // await connection.model('Schema').updateOne(
  // { _id: model.id },
  // {
  // access: 'PUBLIC',
  // },
  // );

  // // authed as user1 accessing user2's data
  // const { statusCode, body } = await request(app)
  // .get(`/todo/${item2.id}`)
  // .set('Authorization', `Bearer ${token}`)
  // .expect(200);

  // expect(statusCode).toBe(200);
  // expect(body.id).toBe(item2.id);
  // });

  // it('should return other users data when model has PUBLIC access and not authed', async () => {
  // // change todo model to PUBLIC access
  // await connection.model('Schema').updateOne(
  // { _id: model.id },
  // {
  // access: 'PUBLIC',
  // },
  // );

  // // non-authed user accessing user2's data
  // const { statusCode, body } = await request(app)
  // .get(`/todo/${item2.id}`)
  // .expect(200);

  // expect(statusCode).toBe(200);
  // expect(body.id).toBe(item2.id);
  // });

  // it.skip('should handle populate', () => undefined);
});
