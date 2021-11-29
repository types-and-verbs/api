import { Connection, Document } from 'mongoose';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

export interface Request extends ExpressRequest {
  user: {
    id: string;
    email: string;
    time: string;
    iat: number;
    exp: number;
  };
}

// eslint-disable-next-line
export interface Response extends ExpressResponse {}

export type GenericObject = { [key: string]: any };

export interface Settings {
  types: string;
  projectName: string;
  projectUrl: string;
  projectSecret: string;
  port?: number;
  mongodbUri: string;
  sendgridApiKey: string;
  sendgridFromEmail: string;
  cors?: string;
}

export interface Options {
  logger: any;
  connection: Connection;
  settings: Settings;
}

export interface StrippedUser {
  email: string;
  _id: ID;
  id: ID;
}

type ID = string;

export interface ExtendedDocument extends Document {
  _id: ID;
  id: ID;
  lastUpdated: Date;
  createdAt: Date;
}

export interface BaseItem extends ExtendedDocument {
  user: string;
}

export interface User extends ExtendedDocument {
  name: string;
  email: string;
  hashedPassword: string | null;
  password: string | null;
  salt: string | null;
  resetPasswordToken: string;
  resetPasswordExpires: Date;
  magicLinkToken: string;
  magicLinkExpires: Date;
  authenticate(plainText: string): boolean;
  makeSalt(): string;
  encryptPassword(password: string): string;
  generateRandomToken(): string;
  toObject(): any;
  stripeCustomerId: string;
}

export interface APIUser {
  id: string;
  name: string;
  email: string;
}

export interface Usage extends ExtendedDocument {
  type: string;
  project: string;
}

export interface Fields {
  [key: string]: Field;
}

export interface Field {
  type: FieldType;
  listType?: ListType;
  referenceType?: ID;
  opts?: {
    required?: boolean;
    unique?: boolean;
  };
}

export type FieldType =
  | 'string'
  | 'boolean'
  | 'number'
  // | 'email'
  // | 'url'
  | 'date'
  | 'array'
  | 'reference';

export type ListType = Exclude<FieldType, 'list' | 'array'>;
export type ListFieldType = ListType;

export type Value =
  | string
  | Date
  | number
  | boolean
  | string[]
  | Date[]
  | number[]
  | boolean[];

interface ModelInput {
  name: string;
  access: 'USER' | 'PUBLIC' | 'TEAM';
  fields: Fields;
}

export type AccessType = 'USER' | 'PUBLIC' | 'TEAM';

export interface Model {
  name: string;
  access: AccessType;
  fields: Fields;
}
