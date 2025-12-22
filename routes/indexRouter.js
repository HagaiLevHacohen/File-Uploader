// routes/indexRouter.js
const { Router } = require("express");
const { getIndex } = require('../controllers/indexController');

const indexRouter = Router();

// Routes
indexRouter.get("/", getIndex);



module.exports = indexRouter;