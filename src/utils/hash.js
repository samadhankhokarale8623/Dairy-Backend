import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const comparePasswords = (password, hashed) => bcrypt.compare(password, hashed);
export const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });