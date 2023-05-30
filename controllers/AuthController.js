import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { v4: uuidv4 } = require('uuid');
/* eslint-disable  no-unused-vars */
const { ObjectId } = require('mongodb');
const sha1 = require('sha1');

class AuthController {
  static async getConnect(req, res) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = auth.slice('Basic '.length);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const users = dbClient.db.collection('users');
    const hashedPassword = sha1(password);

    const user = await users.findOne({ email, password: hashedPassword });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;

    redisClient.set(key, user._id.toString(), 'EX', 86400);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;

    redisClient.del(key);

    return res.status(204).end();
  }
}

module.exports = AuthController;
