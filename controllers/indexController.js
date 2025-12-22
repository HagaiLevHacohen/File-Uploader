// controllers/indexController.js

const db = require("../db/queries");
const { body, validationResult, matchedData } = require("express-validator");
const CustomNotFoundError = require("../errors/CustomNotFoundError");

const getIndex = async (req, res) => {
  // const messages = await db.getAllMessages();
  // console.log(messages)
  res.render("index", { title: "Mini Messageboard"});
};


module.exports = { getIndex };
