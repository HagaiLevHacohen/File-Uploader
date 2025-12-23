// routes/foldersRouter.js
const { Router } = require("express");
const { isAuth, postFolders, validateFolder, getFolder, isFileOwner, isFolderOwner, deleteFolder} = require('../controllers/foldersController');

const foldersRouter = Router();

// Folders main route
foldersRouter.post("/", [isAuth, validateFolder, postFolders]); // /folders
foldersRouter.get("/:folderId", [isAuth, isFolderOwner, getFolder]);
foldersRouter.post("/:folderId/delete", [isAuth, isFolderOwner, deleteFolder]);


module.exports = foldersRouter;