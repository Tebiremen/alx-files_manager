const { MongoClient } = require('mongodb');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });
    this.db = null; // Reference to the MongoDB database

    this.connect(); // Connect to the MongoDB server
  }

  async connect() {
    try {
      await this.client.connect(); // Connect to the MongoDB server
      this.db = this.client.db(DB_DATABASE); // Assign the database reference
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
    }
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    try {
      const users = this.db.collection('users');
      const usersCount = await users.countDocuments();
      return usersCount;
    } catch (err) {
      console.error(err);
      throw err;
      // handle error as necessary
    }
  }

  async nbFiles() {
    try {
      const files = this.db.collection('files');
      const filesCount = await files.countDocuments();
      return filesCount;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

const dbClient = new DBClient();

export default dbClient;
