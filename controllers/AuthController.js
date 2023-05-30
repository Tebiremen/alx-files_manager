import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');

class AuthController {
  static async getConnect(req, res) {
    const authData = req.header('Authorization');
    const userEmail = Buffer.from(authData.split(' ')[1], 'base64').toString('ascii');
    const [email, password] = userEmail.split(':');

    if (!email || !password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hashedPassword = sha1(password);
    const users = dbClient.db.collection('users');
    users.findOne({ email, password: hashedPassword }, async (err, user) => {
      if (user) {
        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString(), 60 * 60 * 24);
        res.status(200).json({ token });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    });
  }

  static async getDisconnect(req, res) {
    const authToken = req.header('X-Token');
    const authKey = `auth_${authToken}`;
    const userId = await redisClient.get(authKey);

    if (userId) {
      await redisClient.del(authKey);
      res.status(204).json({});
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = AuthController;
