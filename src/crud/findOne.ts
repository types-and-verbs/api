import { Express, Response, Request } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { GenericObject, Options, BaseItem, Model } from 'types';
import { createPopulates } from '../utils/create-populates';
import { checkAuth } from '../utils/check-auth';

export const setupFindOne = (
  app: Express,
  options: Options,
  model: Model,
): void => {
  app.get(
    `/${model.name}/:itemId`,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        itemId: Joi.string()
          .required()
          .error(new Error('Item id must be a string')),
      }),
    }),
    findOne(options, model),
  );
};

const findOne =
  (options: Options, model: Model) => async (req: Request, res: Response) => {
    const { logger } = options;

    const { itemId } = req.params;

    try {
      let userId = undefined;
      if (model.access !== 'PUBLIC') {
        const auth = await checkAuth(req, options);
        userId = auth.userId;
      }

      const query: GenericObject = { _id: itemId };

      const populate = query.populate
        ? createPopulates(query.populate, model)
        : [];

      const item = await options.connection
        .model<BaseItem>(`${model.name}`)
        .findOne(query)
        .populate(populate);

      if (model.access === 'USER' && item.user.toString() !== userId) {
        return res.sendStatus(401);
      }

      if (!item) return res.sendStatus(404);

      return res.json(item.toJSON());
    } catch (err) {
      if (err.statusCode) {
        return res.sendStatus(err.statusCode);
      } else {
        logger.error(
          'FIND',
          {
            originalUrl: req.originalUrl,
            headers: req.headers,
            params: req.params,
          },
          err,
        );
        return res.sendStatus(404);
      }
    }
  };
