// const { ObjectId } = require('mongodb');
const sha1 = require('sha1');
const DBClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const db = DBClient.db('files_manager');
    const users = db.collection('users');

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = sha1(password);

    const newUser = {
      email,
      password: hashedPassword,
    };

    const result = await users.insertOne(newUser);

    const insertedUser = {
      id: result.insertedId,
      email: newUser.email,
    };

    return res.status(201).json(insertedUser);
  }
}

module.exports = UsersController;
