import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';

import { slientConsole } from '../test/slient-console';
import { celebrateError } from '../utils/celebrate-error';
import { createUserModel } from '../auth/user.model';
import { settings } from '../test/settings';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { setupFindMany } from './findMany';
import { initSetupModel } from '../utils/setup-model';
import { Model } from 'types';
import { createToken } from '../utils/user';

describe('public findMany()', () => {
  slientConsole();

  const app = express().use(express.json());

  let connection: mongoose.Connection | undefined = undefined;
  let user = undefined;
  let user2 = undefined;
  let token = undefined;
  let setupModel = undefined;

  beforeAll(async () => {
    connection = await dbConnect();
    const options = {
      logger: { info: console.log, error: console.error },
      connection,
      settings,
    };
    setupModel = initSetupModel(options);
    // setup todo model
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
    await connection.model('todo').create({
      name: 'test',
      points: 123,
      deadline: new Date('2021-06-23T08:07:11.265Z'),
      user: user.id,
      completed: true,
    });
    await connection.model('todo').create({
      name: 'new test',
      points: 123,
      deadline: new Date(),
      user: user.id,
      completed: false,
    });
    await connection.model('todo').create({
      name: 'test',
      points: 10,
      deadline: new Date(),
      user: user.id,
      completed: true,
    });
    await connection.model('todo').create({
      name: 'test',
      points: 123,
      deadline: new Date(),
      user: user2.id,
      completed: true,
    });
    setupFindMany(app, options, model);
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
      .get(`/todo`)
      .expect(401)
      .end((err, { statusCode }) => {
        if (err) console.error(err);
        expect(statusCode).toBe(401);
        done();
      });
  });

  it('should return 404 for non-models routes', (done) => {
    request(app)
      .get(`/non-model`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .end((err, { statusCode }) => {
        if (err) console.error(err);
        expect(statusCode).toBe(404);
        done();
      });
  });

  it('should set defaults when not set', (done) => {
    request(app)
      .get('/todo')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end((err, { body }) => {
        if (err) console.error(err);
        expect(body.page).toBe(1);
        expect(body.pageSize).toBe(10);
        expect(body.orderBy).toBe('lastUpdated');
        done();
      });
  });

  it('should return users data when model has USER access', async () => {
    const { body } = await request(app)
      .get('/todo')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body.results.length).toBe(3);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
    expect(body.orderBy).toBe('lastUpdated');
  });

  it('should remove mongodb fields from response', (done) => {
    request(app)
      .get('/todo')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end((err, { body }) => {
        if (err) console.error(err);
        console.log(body);
        expect(body.results[0]._id).toBe(undefined);
        expect(body.results[0].__v).toBe(undefined);
        done();
      });
  });

  it('should deal with a string query', (done) => {
    request(app)
      .get('/todo')
      .set('Authorization', `Bearer ${token}`)
      .query({ where: { name: 'new test' } })
      .expect(200)
      .end(async (err, { body }) => {
        if (err) console.error(err);
        expect(body.results.length).toBe(1);
        expect(body.results[0].name).toBe('new test');
        done();
      });
  });

  it('should deal with a number query', (done) => {
    request(app)
      .get('/todo')
      .set('Authorization', `Bearer ${token}`)
      .query({ where: { points: 10 } })
      .expect(200)
      .end(async (err, { body }) => {
        if (err) console.error(err);
        expect(body.results.length).toBe(1);
        expect(body.results[0].points).toBe(10);
        done();
      });
  });

  it('should deal with a boolean query', (done) => {
    request(app)
      .get('/todo')
      .set('Authorization', `Bearer ${token}`)
      .query({ where: { completed: false } })
      .expect(200)
      .end(async (err, { body }) => {
        if (err) console.error(err);
        expect(body.results.length).toBe(1);
        expect(body.results[0].completed).toBe(false);
        done();
      });
  });

  it('should deal with a data query', (done) => {
    request(app)
      .get('/todo')
      .set('Authorization', `Bearer ${token}`)
      .query({ where: { deadline: '2021-06-23T08:07:11.265Z' } })
      .expect(200)
      .end(async (err, { body }) => {
        if (err) console.error(err);
        expect(body.results.length).toBe(1);
        expect(body.results[0].deadline).toBe('2021-06-23T08:07:11.265Z');
        done();
      });
  });

  // it('should return data when model has PUBLIC access', async () => {
  // // change todo model to PUBLIC access
  // await connection.model('Schema').updateOne(
  // { _id: model.id },
  // {
  // access: 'PUBLIC',
  // },
  // );

  // const { body } = await request(app)
  // .get('/todo')
  // .set('Authorization', `Bearer ${token}`)
  // .expect(200);

  // expect(body.results.length).toBe(4);
  // expect(body.page).toBe(1);
  // expect(body.pageSize).toBe(10);
  // expect(body.orderBy).toBe('lastUpdated');
  // });

  it.skip('should handle page, pageSize, orderBy, select', () => undefined);
  it.skip('should handle pagination', () => undefined);
  it.skip('should handle populate', () => undefined);
});
