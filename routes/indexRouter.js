// routes/indexRouter.js
const { Router } = require("express");
const { getIndex, getLogin, getSignup, postLogin, postSignup, validateUser, getLogout } = require('../controllers/indexController');

const indexRouter = Router();

// Main Route
indexRouter.get("/", getIndex);

// Authentication Routes
indexRouter.get("/signup", getSignup);
indexRouter.post("/signup", [validateUser, postSignup]);
indexRouter.get("/login", getLogin);
indexRouter.post("/login", postLogin);
indexRouter.get("/logout", getLogout);



module.exports = indexRouter;