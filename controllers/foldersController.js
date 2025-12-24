// controllers/foldersController.js

const { body, validationResult, matchedData } = require("express-validator");
const { prisma } = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const CustomNotFoundError = require("../errors/CustomNotFoundError");
const multer  = require('multer')
const { createClient } = require("@supabase/supabase-js");

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
    await prisma.folder.delete({ where: { id: Number(req.params.folderId) }});
    res.redirect("/");
};

const renameFolder = async (req, res) => {
    const errors = validationResult(req);
    const folder = await prisma.folder.findUnique({ where: { id: Number(req.params.folderId) }, include: {files:true}});
    if (!errors.isEmpty()) {
        return res.render(`/folders/${req.params.folderId}`, {
        folder: folder,
        files: folder.files,
        error: errors.array()[0]
        });
    }
  // Only use matchedData when validation PASSES
    const { name } = matchedData(req);
    console.log(name);
    await prisma.folder.update({
        where: { id: Number(req.params.folderId) },
        data: { name }
    });

    res.redirect(`/folders/${req.params.folderId}`);
};


// UPLOADING FILE TO THE CLOUD

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const allowedMimeTypes = new Set([
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
  "application/vnd.ms-excel", // XLS
  "text/plain", // TXT
  "text/csv", // CSV

  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",

  // Archives
  "application/zip",
  "application/x-zip-compressed"
]);


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file type. Allowed: PDF, DOCX, XLS/XLSX, images, TXT, CSV, ZIP"
        )
      );
    }
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);



const uploadFile = [isAuth, isFolderOwner, upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error("No file uploaded");
      }

      const userId = req.user.id;
      const folderId = Number(req.params.folderId);

      // Create a unique file path
      const filePath = `user-${userId}/folder-${folderId}/${Date.now()}-${req.file.originalname}`;

      // Upload to Supabase
      const { error } = await supabase.storage
        .from("fileUploader")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      // Get public URL (if bucket is public)
      const { data: publicUrlData } = supabase.storage
        .from("fileUploader")
        .getPublicUrl(filePath);

      // Save file metadata in DB
      await prisma.file.create({
        data: {
          name: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          path: filePath,
          url: publicUrlData.publicUrl,
          parentId: folderId,
        }
      });

      res.redirect(`/folders/${folderId}`);
    } catch (err) {
      next(err);
    }
  }
];


// FILES ROUTES
const getFile = async (req, res) => {
    const file = await prisma.file.findUnique({ where: { id: Number(req.params.fileId) }, include: {parent: true}});
    res.render("file", {file: file, error: null});
};


const deleteFile = async (req, res, next) => {
  try {
    const fileId = Number(req.params.fileId);
    const folderId = Number(req.params.folderId);

    // Find the file first
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    // Delete file from Supabase bucket
    const { error } = await supabase.storage
      .from("fileUploader")
      .remove([file.path]); // remove expects an array of paths

    if (error) {
      console.error("Supabase deletion error:", error);
    }

    // Delete file record from database
    await prisma.file.delete({ where: { id: fileId } });

    res.redirect(`/folders/${folderId}`);
  } catch (err) {
    next(err);
  }
};


module.exports = {  isAuth,
                    postFolders,
                    validateFolder,
                    getFolder,
                    isFolderOwner,
                    isFileOwner,
                    deleteFolder,
                    renameFolder,
                    uploadFile,
                    getFile, 
                    deleteFile
                     };
