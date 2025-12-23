// controllers/foldersController.js

const { body, validationResult, matchedData } = require("express-validator");
const { prisma } = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const CustomNotFoundError = require("../errors/CustomNotFoundError");

const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).send("you are not authorized to view this resource");
  }
};

const isFolderOwner = async (req, res, next) => {
  const folder = await prisma.folder.findUnique({ where: { id: Number(req.params.folderId) }});
  if (!folder) {
    return res.status(404).send("Folder not found");
  } else if (req.isAuthenticated() && folder.userId == req.user.id) {
    next();
  } else {
    res.status(401).send("you are not authorized to view this resource");
  }
};

const isFileOwner = async (req, res, next) => {
  const file = await prisma.file.findUnique({ where: { id: Number(req.params.fileId) }, include: {parent: true}});
  if (!file) {
    return res.status(404).send("File not found");
  } else if (req.isAuthenticated() && file.parent.userId == req.user.id) {
    next();
  } else {
    res.status(401).send("you are not authorized to view this resource");
  }
};

const validateFolder = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
];


const postFolders = async (req, res) => {
  const errors = validationResult(req);
  const folders = await prisma.folder.findMany({ where: { userId: req.user.id }, include: {files:true} });
  if (!errors.isEmpty()) {
    return res.render("/", {
      folders: folders,
      error: errors.array()[0]
    });
  }

  // Only use matchedData when validation PASSES
  const { name } = matchedData(req);
  await prisma.folder.create({
    data: {
      name: name,
      userId: req.user.id
    }
  })
  res.redirect("/");
};


const getFolder = async (req, res) => {
    const folder = await prisma.folder.findUnique({ where: { id: Number(req.params.folderId) }, include: {files:true}});
    res.render("folder", {folder: folder, files:folder.files, error: null});
};


const deleteFolder = async (req, res) => {
    const folder = await prisma.folder.delete({ where: { id: Number(req.params.folderId) }});
    res.redirect("/");
};




module.exports = {  isAuth,
                    postFolders,
                    validateFolder,
                    getFolder,
                    isFolderOwner,
                    isFileOwner,
                    deleteFolder,
                     };
