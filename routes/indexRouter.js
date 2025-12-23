// routes/indexRouter.js
const { Router } = require("express");
const { getIndex, getLogin, getSignup } = require('../controllers/indexController');

const indexRouter = Router();

// Routes
indexRouter.get("/", getIndex);
indexRouter.get("/signup", getSignup);
indexRouter.get("/login", getLogin);



module.exports = indexRouter;