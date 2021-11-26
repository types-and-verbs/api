import mongoose from 'mongoose';
import express from 'express';
import helmet from 'helmet';

import { setupApp } from './app';
import { Options, Settings } from 'types';
import logger from './utils/logger';
import { parseTypes } from './utils/parse-types';
import { initSetupModel } from './utils/setup-model';
import { setupEmail } from './utils/send-email';

import { createUserModel } from './auth/user.model';
import { setupSignup } from './auth/signup';
import { setupSignin } from './auth/signin';
import { setupForgot } from './auth/forgot';
import { setupReset } from './auth/reset';
import { setupUser } from './auth/user';
import { setupUserUpdate } from './auth/user-update';

import { setupFindMany } from './crud/findMany';
import { setupFindOne } from './crud/findOne';
import { setupCreate } from './crud/create';
import { setupUpdate } from './crud/update';
import { setupRemove } from './crud/remove';

import { celebrateError } from './utils/celebrate-error';

export function typesandverbs(userSettings: Settings): void {
  const settings = {
    port: 6000,
    projectName: 'types and verbs',
    projectUrl: `http://localhost:${userSettings.port || 6000}`,
    ...userSettings,
  };

  mongoose.Promise = global.Promise;
  const connection = mongoose.createConnection(settings.mongodbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  connection.once('open', () => {
    logger.info('MongoDB Connection Open.');

    setupEmail(settings);

    const options: Options = {
      logger,
      connection,
      settings,
    };

    const app = express();

    // Express settings
    setupApp(app, settings);

    // Setup auth routes
    createUserModel(options, 'users');
    setupSignup(app, options);
    setupSignin(app, options);
    setupForgot(app, options);
    setupReset(app, options);
    setupUser(app, options);
    setupUserUpdate(app, options);

    // Loop through each model in type file and setup CRUD
    const models = parseTypes(settings.types);
    const setupModel = initSetupModel(options);
    models.forEach((model) => {
      logger.info(`Setting up ${model.name}`);

      // setup mongoose model
      setupModel(model);

      // Setup CRUD routes
      setupFindMany(app, options, model);
      setupFindOne(app, options, model);
      setupCreate(app, options, model);
      setupUpdate(app, options, model);
      setupRemove(app, options, model);
    });

    app.get('/*', (req, res) => res.send(settings.projectName));

    app.use(celebrateError);
    app.use(helmet());

    app.listen(settings.port, () => {
      logger.info(`Server running on http://localhost:${settings.port}`);
    });
  });

  connection.on('error', () => {
    logger.error(
      'MongoDB Connection Error. Please make sure that MongoDB is running.',
    );
  });

  process.on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  });
}

export default typesandverbs;
