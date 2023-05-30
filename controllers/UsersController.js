import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const users = dbClient.db.collection('users');
    users.findOne({ email }, (err, user) => {
      if (user) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      const hashedPassword = sha1(password);
      users.insertOne({ email, password: hashedPassword })
        .then((result) => {
          const { insertedId } = result;
          res.status(201).json({ id: insertedId, email });
        })
        .catch((error) => console.log(error));
    });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const users = dbClient.db.collection('users');
    const idObject = new ObjectID(userId);
    const user = await users.findOne({ _id: idObject });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { email } = user;
    res.status(200).json({ id: userId, email });
  }
}

module.exports = UsersController;
