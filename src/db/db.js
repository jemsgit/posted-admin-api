const Sequelize = require('sequelize');

const login = process.env.DB_LOGIN;
const pass = process.env.DB_PASS;

const sequelize = new Sequelize('admin_db', login, pass, {
  dialect: 'sqlite',

  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },

  storage: './admin-db.sqlite',
});

module.exports = sequelize;
