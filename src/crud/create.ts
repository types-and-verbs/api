import { Express, Response, Request } from 'express';

import { Options, BaseItem, Model } from 'types';
import { validateData } from './validate-data';
import { checkAuth } from '../utils/check-auth';

export const setupCreate = (
  app: Express,
  options: Options,
  model: Model,
): void => {
  app.post(`/${model.name}`, create(options, model));
};

export const create =
  (options: Options, model: Model) =>
  async (req: Request, res: Response): Promise<Response> => {
    const { logger } = options;

    try {
      const { userId } = await checkAuth(req, options);

      const { value, errors } = validateData(model.fields, req.body, false);

      if (errors) {
        return res.status(400).send(errors);
      }

      const collection = options.connection.model<BaseItem>(model.name);
      const doc = new collection(value);
      doc.user = userId;

      const newDoc = await doc.save();

      res.json(newDoc);
    } catch (err) {
      if (err.statusCode) {
        return res.sendStatus(err.statusCode);
      } else {
        logger.error(
          'POST',
          {
            originalUrl: req.originalUrl,
            headers: req.headers,
            params: req.params,
            body: req.body,
          },
          err,
        );
        return res.status(400);
      }
    }
  };
