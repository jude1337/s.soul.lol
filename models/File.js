module.exports = (sequelize, DataTypes) => sequelize.define('File', {
  filename: { type: DataTypes.STRING, allowNull: false },
  original: { type: DataTypes.STRING, allowNull: false },
  ip: { type: DataTypes.STRING }, mime: { type: DataTypes.STRING }, size: { type: DataTypes.INTEGER }
}, { timestamps: true });
