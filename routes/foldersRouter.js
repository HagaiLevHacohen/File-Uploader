// routes/foldersRouter.js
const { Router } = require("express");
const { isAuth, postFolders, validateFolder, getFolder, isFileOwner, isFolderOwner, deleteFolder, renameFolder, uploadFile, getFile,
        deleteFile
} = require('../controllers/foldersController');

const foldersRouter = Router();

// Folders main route
foldersRouter.post("/", [isAuth, validateFolder, postFolders]); // /folders
foldersRouter.get("/:folderId", [isAuth, isFolderOwner, getFolder]);
foldersRouter.post("/:folderId/delete", [isAuth, isFolderOwner, deleteFolder]);
foldersRouter.post("/:folderId/rename", [isAuth, isFolderOwner, validateFolder, renameFolder]);
foldersRouter.post("/:folderId/upload", uploadFile);


// Files
foldersRouter.get("/:folderId/files/:fileId", [isAuth, isFolderOwner, isFileOwner, getFile]);
foldersRouter.post("/:folderId/files/:fileId/delete", [isAuth, isFolderOwner, isFileOwner, deleteFile]);



module.exports = foldersRouter;