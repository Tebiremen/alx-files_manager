const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const {
      name,
      type,
      parentId = '0',
      isPublic = false,
      data,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }

    if (type !== 'folder' && !data) {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    const userId = req.user.id;
    const files = dbClient.db.collection('files');

    if (parentId !== '0') {
      const parentFile = await files.findOne({ _id: parentId });
      if (!parentFile) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (parentFile.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };

    if (type === 'folder') {
      const result = await files.insertOne(newFile);
      res.status(201).json(result.ops[0]);
      return;
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filePath = path.join(folderPath, uuidv4());
    const fileData = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, fileData);

    newFile.localPath = filePath;

    const result = await files.insertOne(newFile);
    res.status(201).json(result.ops[0]);
  }
}

module.exports = FilesController;
