import { Express, Response, Request } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { Options, BaseItem, Model } from 'types';
import { validateData } from './validate-data';
import { checkAuth } from '../utils/check-auth';

export const setupUpdate = (
  app: Express,
  options: Options,
  model: Model,
): void => {
  app.patch(
    `/${model.name}/:itemId`,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        itemId: Joi.string()
          .required()
          .error(new Error('Item id must be a string')),
      }),
    }),
    update(options, model),
  );
};

export const update =
  (options: Options, model: Model) =>
  async (req: Request, res: Response): Promise<Response> => {
    const { logger } = options;

    logger.info('UPDATE');
    logger.info(req.body);
    logger.info('**');

    const { itemId } = req.params;

    try {
      const { userId } = await checkAuth(req, options);

      const { value, errors } = validateData(model.fields, req.body, true);

      if (errors) {
        return res.status(400).send(errors);
      }

      const item = await options.connection
        .model<BaseItem>(model.name)
        .findById(itemId);

      if (!item) return res.sendStatus(404);

      if (item.user != userId) {
        return res.sendStatus(401);
      }

      Object.keys(value).forEach((key) => {
        // eslint-disable-next-line
        item[key] = value[key];
        item.markModified(key);
      });

      item.save(function (err: Error, updatedDocument: any) {
        if (err) {
          logger.error(
            'UPDATE DOC SAVE',
            {
              originalUrl: req.originalUrl,
              headers: req.headers,
              params: req.params,
              body: req.body,
              item,
              updatedDocument,
            },
            err,
          );
          res.status(400);
        } else {
          res.json(updatedDocument);
        }
      });
    } catch (err) {
      if (err.statusCode) {
        return res.sendStatus(err.statusCode);
      } else {
        logger.error(
          'UPDATE',
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
