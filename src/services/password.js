const bcrypt = require('bcrypt');

const saltRounds = 10;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(saltRounds);
  const result = await bcrypt.hash(password, salt);
  return result;
}

async function comparePasswords(hashed, original) {
  const result = await bcrypt.compare(original, hashed);
  return result;
}

module.exports = {
  hashPassword,
  comparePasswords,
};
