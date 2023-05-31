const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const user = await FilesController.getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name,
      type,
      parentId,
      data,
    } = req.body;
    const isPublic = req.body.isPublic || false;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const files = dbClient.db.collection('files');

    if (parentId) {
      const idObject = new ObjectID(parentId);
      const file = await files.findOne({ _id: idObject, userId: user._id });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    try {
      if (type === 'folder') {
        const result = await files.insertOne({
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic,
        });
        res.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
      } else {
        const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileName = `${filePath}/${uuidv4()}`;
        const buff = Buffer.from(data, 'base64');

        try {
          await fs.promises.mkdir(filePath, { recursive: true });
          await fs.promises.writeFile(fileName, buff, 'utf-8');
        } catch (error) {
          console.log(error);
        }

        const result = await files.insertOne({
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath: fileName,
        });

        res.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });

        // if (type === 'image') {
        //   fileQueue.add({
        //     userId: user._id,
        //     fileId: result.insertedId,
        //   });
        // }
      }
    } catch (error) {
      console.log(error);
    }

    return null;
  }
}

module.exports = FilesController;
