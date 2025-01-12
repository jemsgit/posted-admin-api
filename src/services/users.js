const Users = require("../db/models/users");
const { comparePasswords } = require("./password");

async function findUserWithPassword(username, password) {
  const user = await Users.findOne({
    where: {
      username,
    },
  });
  if (!user) {
    return undefined;
  }
  const passIsCorrect = await comparePasswords(user.password, password);
  return passIsCorrect ? user : undefined;
}

async function addUser(username, password) {
  const user = await Users.create({
    username,
    password,
  });
  return user;
}

module.exports = {
  findUserWithPassword,
  addUser,
};
