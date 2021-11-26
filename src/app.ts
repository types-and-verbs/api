import express, { Express } from 'express';
import { Settings } from 'types';
import cors from 'cors';

export function setupApp(app: Express, settings: Settings): void {
  app
    .use(
      cors({
        origin: settings.cors || '*',
        optionsSuccessStatus: 200,
      }),
    )
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use((err, req, res, next) => {
      if (err.constructor.name === 'UnauthorizedError') {
        res.status(401).send('Unauthorized');
      }
    });
}
