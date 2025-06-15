const { Sequelize, DataTypes } = require('sequelize');
const { db } = require('../config');
const sequelize = new Sequelize(db.database, db.username, db.password, {
  host: db.host, dialect: db.dialect, logging: false
});
const User = require('./User')(sequelize, DataTypes);
const File = require('./File')(sequelize, DataTypes);
User.hasMany(File, { foreignKey: 'uploaderId' });
File.belongsTo(User, { as: 'uploader', foreignKey: 'uploaderId' });
module.exports = { sequelize, User, File };
