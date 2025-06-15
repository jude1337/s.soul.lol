module.exports = (sequelize, DataTypes) => sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });
