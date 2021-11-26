import mongoose from 'mongoose';

import { ExtendedDocument, Model, Options } from '../types';
import { checkUnique } from '../utils/unique';

function schemaValidation({ unique, name, connection, modelName }) {
  return async function (value: any) {
    // UNIQUE
    if (unique) {
      const Model = connection.model(modelName);
      if (!(await checkUnique(Model, this._id, name, value))) {
        throw new Error(`${name} must be unique`);
      }
    }

    // TODO add other validation types
  };
}

interface MongooseSchemaField {
  required?: boolean;
  default: any;
  type: any;
  // type:
  // | mongoose.Schema.Types.String
  // | mongoose.Schema.Types.Number
  // | mongoose.Schema.Types.Boolean
  // | mongoose.Schema.Types.ObjectId;
  ref?: string;
  validate?(vals: {
    modelName: string;
    name: string;
    unique: boolean;
    connection: mongoose.Connection;
  }): Promise<void>;
}

export function initSetupModel(options: Options) {
  return function setupModel({ name, fields }: Model) {
    const modelName = name;

    // check for existing model
    const modelExists = !!options.connection.models[name];
    if (modelExists) {
      // remove existing model
      delete options.connection.models[name];
    }

    // Create mongoose schema from fields
    const schemaFromFields = Object.keys(fields).reduce((acc, name) => {
      if (!name) return acc;

      const field = fields[name];
      const fieldSchema: Partial<MongooseSchemaField> = {
        required: field.opts.required ? field.opts.required : false,
        validate: schemaValidation({
          modelName,
          name,
          // reference: reference,
          unique: field.opts.unique ? field.opts.unique : false,
          connection: options.connection,
        }),
      };

      switch (field.type) {
        case 'reference':
          fieldSchema.type = mongoose.Schema.Types.ObjectId;
          fieldSchema.ref = field.referenceType;
          break;
        case 'string':
          fieldSchema.type = String;
          break;
        case 'number':
          fieldSchema.type = Number;
          break;
        case 'boolean':
          fieldSchema.type = Boolean;
          break;
        case 'date':
          fieldSchema.type = Date;
          break;
        case 'array':
          fieldSchema.type = [field.listType];
          break;
      }

      return {
        ...acc,
        [name]: fieldSchema,
      };
    }, {});

    const newSchema = new mongoose.Schema({
      ...schemaFromFields,

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `users`,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    });

    newSchema.virtual('id').get(function () {
      return this._id.toHexString();
    });

    newSchema.set('toJSON', {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    });

    newSchema.set('toObject', {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    });

    // Update the last updated field to now
    newSchema.pre('save', function preSave(this: ExtendedDocument, callback) {
      this.lastUpdated = new Date();
      callback();
    });

    options.connection.model(name, newSchema);

    options.logger.info(name + ' model setup');
  };
}
