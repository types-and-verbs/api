const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

import { User, StrippedUser } from 'types';

const charset =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateRandomString(length: number): string {
  return Array.from({ length }, (_, i) => i).reduce((acc) => {
    return acc + charset.charAt(Math.floor(Math.random() * charset.length));
  }, '');
}

export function generateTokenExpiry(): Date {
  return new Date(Date.now() + 3600000); // 1 hour
}

export function makeSalt(): string {
  return generateRandomString(30);
}

export function createToken(user: StrippedUser, secret: string): string {
  return jwt.sign(
    { email: user.email, id: user._id, time: new Date() },
    secret,
    {
      expiresIn: process.env.TOKEN_EXPIRY || '400 days',
    },
  );
}

export function encryptPassword(password: string, salt: string): string {
  if (!password) return '';
  const hash = CryptoJS.HmacSHA512(password, salt);
  return hash.toString(CryptoJS.enc.Base64);
}

export function validPassword(user: User, password: string): boolean {
  if (!user.hashedPassword) {
    console.error('Hashed password is not available in object');
    return false;
  }
  return encryptPassword(password, user.salt) === user.hashedPassword;
}
