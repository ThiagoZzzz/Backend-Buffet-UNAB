// models/user.js 
import { DataTypes } from 'sequelize';

const user = (sequelize) => {
  const user_model = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    }
  }, {
    tableName: 'users',
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    underscored: true
  });

  user_model.associate = (models) => {
    user_model.hasMany(models.order, {
      foreignKey: 'user_id',
      as: 'orders'
    });
  };

  return user_model;
};

export default user;