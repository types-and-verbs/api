import { Express, Response, Request } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { Options, BaseItem, Model } from 'types';
import { checkAuth } from '../utils/check-auth';

export const setupRemove = (
  app: Express,
  options: Options,
  model: Model,
): void => {
  app.delete(
    `/${model.name}/:itemId`,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        itemId: Joi.string()
          .required()
          .error(new Error('Item id must be a string')),
      }),
    }),
    remove(options, model),
  );
};

export const remove =
  (options: Options, model: Model) =>
  async (req: Request, res: Response): Promise<Response> => {
    const { logger } = options;

    const { itemId } = req.params;

    try {
      const { userId } = await checkAuth(req, options);

      const item = await options.connection
        .model<BaseItem>(model.name)
        .findById(itemId);

      if (!item) return res.sendStatus(404);

      if (item.user != userId) {
        return res.sendStatus(401);
      }

      await options.connection
        .model(`${model.name}`)
        .deleteOne({ _id: itemId });

      res.send(item);
    } catch (err) {
      if (err.statusCode) {
        return res.sendStatus(err.statusCode);
      } else {
        logger.error(
          'DELETE',
          {
            originalUrl: req.originalUrl,
            headers: req.headers,
            params: req.params,
            body: req.body,
          },
          err,
        );
        return res.sendStatus(404);
      }
    }
  };
