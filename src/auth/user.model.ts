import mongoose from 'mongoose';
const CryptoJS = require('crypto-js');

import { User, Options } from 'types';

export function createUserModel(
  { connection, logger }: Options,
  name: string,
): void {
  const UserSchema = new mongoose.Schema<User>({
    name: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    hashedPassword: {
      type: String,
      default: null,
    },
    salt: {
      type: String,
      default: null,
    },
    stripeCustomerId: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  UserSchema.virtual('id').get(function () {
    return this._id.toHexString();
  });

  UserSchema.set('toJSON', {
    virtuals: true,
  });

  UserSchema.set('toObject', {
    virtuals: true,
  });

  UserSchema.methods = {
    authenticate: function (plainText: string): boolean {
      if (!this.hashedPassword) {
        logger.error('Hashed password is not available in object', this);
        return false;
      }
      return this.encryptPassword(plainText) === this.hashedPassword;
    },
    makeSalt: function (): string {
      return Math.round(new Date().valueOf() * Math.random()) + '';
    },
    encryptPassword: function (password: string): string {
      if (!password) return '';
      const hash = CryptoJS.HmacSHA512(password, this.salt);
      return hash.toString(CryptoJS.enc.Base64);
    },
    generateRandomToken: function (): string {
      const chars =
        '_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
      let token = new Date().getTime() + '_';
      for (let x = 0; x < 16; x += 1) {
        const i = Math.floor(Math.random() * 62);
        token += chars.charAt(i);
      }
      return token;
    },
  };

  UserSchema.virtual('password')
    .set(function (password: string) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashedPassword = this.encryptPassword(password);
    })
    .get(function () {
      return this._password;
    });

  UserSchema.virtual('confirmPassword')
    .set(function (password: string) {
      this._confirmPassword = password;
    })
    .get(function () {
      return this._confirmPassword;
    });

  connection.model<User>(name, UserSchema);
}

export function setupUserModel(options: Options): void {
  options.logger.info('Setting up User model');
  createUserModel(options, 'User');
}
