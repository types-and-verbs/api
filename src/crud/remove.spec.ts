import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';

import { slientConsole } from '../test/slient-console';
import { celebrateError } from '../utils/celebrate-error';
import { createUserModel } from '../auth/user.model';
import { settings } from '../test/settings';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { setupRemove } from './remove';
import { initSetupModel } from '../utils/setup-model';
import { Model, BaseItem } from 'types';
import { createToken } from '../utils/user';

interface Todo extends BaseItem {
  name: string;
  points: number;
  completed: boolean;
}

describe('CRUD remove()', () => {
  slientConsole();

  const app = express().use(express.json());

  let connection: mongoose.Connection | undefined = undefined;
  let user = undefined;
  let token = undefined;
  let item1 = undefined;

  beforeAll(async () => {
    connection = await dbConnect();
    const options = {
      logger: { info: console.log, error: console.error },
      connection,
      settings,
    };
    const setupModel = initSetupModel(options);
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
    // create data to test
    item1 = await connection.model('todo').create({
      name: 'test',
      points: 123,
      deadline: new Date('2021-06-23T08:07:11.265Z'),
      user: user.id,
      completed: true,
    });
    setupRemove(app, options, model);
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
      .delete(`/todo/${item1.id}`)
      .expect(401)
      .end((_, { statusCode }) => {
        expect(statusCode).toBe(401);
        done();
      });
  });

  it('should return 404 for non-models routes', (done) => {
    request(app)
      .delete(`/non-model/${item1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .end((err, { statusCode }) => {
        if (err) console.error(err);
        expect(statusCode).toBe(404);
        done();
      });
  });

  it('should delete correct item', (done) => {
    request(app)
      .delete(`/todo/${item1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end(async (_, { body }) => {
        expect(body.id).toBe(item1.id);
        // should be saved in db
        const todo = await connection.model<Todo>('todo').findById(item1.id);
        expect(todo).toBeNull();
        done();
      });
  });
});
