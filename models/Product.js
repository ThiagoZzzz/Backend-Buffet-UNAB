// models/product.js
import { DataTypes } from 'sequelize';

const product = (sequelize) => {
  const product_model = sequelize.define('product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre del producto no puede estar vacío'
        }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'El precio no puede ser negativo'
        }
      }
    },
    categoria: {
      type: DataTypes.ENUM('bebidas', 'golosinas', 'sandwiches', 'snacks', 'postres'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['bebidas', 'golosinas', 'sandwiches', 'snacks', 'postres']],
          msg: 'Categoría no válida'
        }
      }
    },
    imagen: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    destacado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    promocion: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    precio_promocion: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'El precio de promoción no puede ser negativo'
        }
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    tableName: 'products',
    timestamps: false,
    underscored: true
  });

  product_model.associate = (models) => {
    product_model.belongsTo(models.category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    product_model.hasMany(models.orderitem, {
      foreignKey: 'product_id',
      as: 'order_items'
    });
  };

  return product_model;
};

export default product;
