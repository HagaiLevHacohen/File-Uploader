// controllers/indexController.js

const { body, validationResult, matchedData } = require("express-validator");
const CustomNotFoundError = require("../errors/CustomNotFoundError");

const getIndex = async (req, res) => {
  // const messages = await db.getAllMessages();
  // console.log(messages)
  res.render("index");
};

const getLogin = async (req, res) => {
  // const messages = await db.getAllMessages();
  // console.log(messages)
  res.render("login");
};

const getSignup = async (req, res) => {
  // const messages = await db.getAllMessages();
  // console.log(messages)
  res.render("signup");
};

module.exports = {  getIndex,
                    getLogin,
                    getSignup
 };
