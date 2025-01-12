const mongoose = require("mongoose");
const sequelize = require("../db");

const Users = mongoose.model("users", {
  username: {
    type: String,
    primaryKey: true,
    uniq: true,
  },
  password: {
    type: Sequelize.STRING,
  },
});

module.exports = Users;
