// models/category.js
import { DataTypes } from "sequelize";

const init_category = (sequelize) => {
  const Category = sequelize.define(
    "category",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          name: "categories_nombre_unique",
          msg: "Ya existe una categoría con este nombre",
        },
        validate: {
          notEmpty: { msg: "El nombre es obligatorio" },
          len: {
            args: [2, 50],
            msg: "El nombre debe tener entre 2 y 50 caracteres",
          },
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          name: "categories_slug_unique",
          msg: "Ya existe una categoría con este slug",
        },
        validate: {
          notEmpty: { msg: "El slug no puede estar vacío" },
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "El slug solo puede contener minúsculas, números y guiones",
          },
        },
      },
      imagen: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "categories",
      timestamps: false,
    }
  );

  
  Category.associate = (models) => {
    Category.hasMany(models.product, {
      foreignKey: "category_id",
      as: "products",
    });
  };

  return Category;
};

export default init_category;
