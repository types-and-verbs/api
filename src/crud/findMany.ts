import { Express, Response, Request } from 'express';
import { Joi } from 'celebrate';

import { GenericObject, Options, Model } from 'types';
import { parseQuery } from './query-helpers';
import { safeParse } from '../utils/safe-parse';
import { createPopulates } from '../utils/create-populates';
import { formatJoiErrors } from '../utils/format-joi-errors';
import { checkAuth } from '../utils/check-auth';

export const setupFindMany = (
  app: Express,
  options: Options,
  model: Model,
): void => {
  app.get(`/${model.name}`, findMany(options, model));
};

const findMany =
  (options: Options, model: Model) => async (req: Request, res: Response) => {
    const { value: query, error } = Joi.object({
      page: Joi.number().default(1).min(1),
      pageSize: Joi.number().default(10).min(1).max(50),
      orderBy: Joi.string().default('lastUpdated'),
      select: Joi.string().default(''),
      populate: Joi.string().default([]),
      where: Joi.object().default({}),
    }).validate(
      {
        orderBy: req.query.orderBy,
        select: req.query.select,
        page: parseInt(String(req.query.page), 10) || 1,
        pageSize: parseInt(String(req.query.pageSize), 10) || 10,
        populate: req.query.populate,
        where: req.query.where,
      },
      { abortEarly: false },
    );

    if (error) {
      return res.status(400).send(formatJoiErrors(error));
    }

    const { logger } = options;

    try {
      const { userId } = await checkAuth(req, options);

      // Construct query
      const queryWithHelpers: GenericObject = parseQuery(
        safeParse(query.where),
        model.fields,
      );

      if (model.access !== 'PUBLIC') {
        queryWithHelpers.user = userId;
      }

      const populate = query.populate
        ? createPopulates(query.populate, model)
        : [];

      const items = await options.connection
        .model(`${model.name}`)
        .find(queryWithHelpers)
        .sort(query.orderBy)
        .select(query.select)
        .skip((query.page - 1) * query.pageSize)
        .populate(populate)
        .limit(query.pageSize);

      const count = await options.connection
        .model(`${model.name}`)
        .countDocuments(queryWithHelpers);

      res.json({
        results: items,
        page: query.page,
        pageSize: query.pageSize,
        orderBy: query.orderBy,
        total: count,
      });
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
            body: req.body,
          },
          err,
        );
        return res.sendStatus(404);
      }
    }
  };
