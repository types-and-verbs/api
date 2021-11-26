import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';

import { slientConsole } from '../test/slient-console';
import { celebrateError } from '../utils/celebrate-error';
import { createUserModel } from '../auth/user.model';
import { settings } from '../test/settings';
import { dbConnect, dbClear, dbClose } from '../test/db';
import { setupCreate } from './create';
import { initSetupModel } from '../utils/setup-model';
import { Model, BaseItem } from 'types';
import { createToken } from '../utils/user';

interface Todo extends BaseItem {
  name: string;
  points: number;
  completed: boolean;
}

describe('CRUD create()', () => {
  slientConsole();

  const app = express().use(express.json());

  let connection: mongoose.Connection | undefined = undefined;
  let user = undefined;
  let token = undefined;

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
    setupCreate(app, options, model);
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
      .post(`/todo`)
      .expect(401)
      .end((_, { statusCode }) => {
        expect(statusCode).toBe(401);
        done();
      });
  });

  it('should return 404 for non-models routes', (done) => {
    request(app)
      .post(`/non-model`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .end((err, { statusCode }) => {
        console.log(err);
        if (err) console.error(err);
        expect(statusCode).toBe(404);
        done();
      });
  });

  it('should return validation errors', (done) => {
    request(app)
      .post(`/todo`)
      .send({ name: 123, points: '123', completed: 12 })
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .end((_, { statusCode, body }) => {
        expect(body.name).toBe('name must be a string');
        // TODO
        // expect(body.points).toBe('points must be a number');
        expect(body.completed).toBe('completed must be a boolean');
        expect(statusCode).toBe(400);
        done();
      });
  });

  it('save data with correct userId', (done) => {
    request(app)
      .post(`/todo`)
      .send({ name: 'name', points: 344, completed: true })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end(async (_, { body }) => {
        // should return correct data
        expect(body.name).toBe('name');
        expect(body.points).toBe(344);
        expect(body.completed).toBe(true);
        expect(body.user).toBe(user.id);
        // should be saved in db
        const todo = await connection.model<Todo>('todo').findOne();
        expect(todo?.name).toBe('name');
        expect(todo?.points).toBe(344);
        expect(todo?.completed).toBe(true);
        expect(todo?.user.toString()).toBe(user.id);
        done();
      });
  });
});
