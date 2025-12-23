// controllers/indexController.js

const { body, validationResult, matchedData } = require("express-validator");
const { prisma } = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const CustomNotFoundError = require("../errors/CustomNotFoundError");

const getIndex = async (req, res) => {
  if (!req.user){
    res.render("index", {folders: [], error: null});
  } else {
    const folders = await prisma.folder.findMany({ where: { userId: req.user.id }, include: {files:true} });
    res.render("index", {folders: folders, error: null});
  }
};

const getLogin = async (req, res) => {
  res.render("login", {error: ""});
};

const getSignup = async (req, res) => {
  res.render("signup", {errors: [] ,values: {}});
};

const validateUser = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .custom(async (username) => {
      const user = await prisma.user.findUnique({ where: { username } });
      if (user) throw new Error("Username already exists");
      return true;
    }),

  body("email")
    .trim()
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .custom(async (email) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) throw new Error("Email already exists");
      return true;
    }),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("confirm_password")
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error("Password confirmation doesn't match");
      }
      return true;
    }),
];


const postSignup = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render("signup", {
      errors: errors.array(),
      values: req.body,
    });
  }

  // Only use matchedData when validation PASSES
  const { username, email, password } = matchedData(req);
  const passwordHashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      username: username,
      email: email,
      passwordHashed: passwordHashed
    }
  })
  res.redirect("/login");
};

const postLogin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render("login", {
        error: info?.message
      });
    }

    req.logIn(user, err => {
      if (err) return next(err);
      return res.redirect("/");
    });
  })(req, res, next);
};

const getLogout = (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect("/");
  });
};

module.exports = {  getIndex,
                    getLogin,
                    getSignup,
                    postLogin,
                    postSignup,
                    validateUser,
                    getLogout
 };
