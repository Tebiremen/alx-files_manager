import RedisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    const redisStatus = await RedisClient.isAlive();
    const dbStatus = await dbClient.isAlive();

    return res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  static async getStats(req, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();

    return res.status(200).json({ users: usersCount, files: filesCount });
  }
}

module.exports = AppController;
