// models/orderitem.js
import { DataTypes } from 'sequelize';

const orderitem = (sequelize) => {
  const orderitem_model = sequelize.define('orderitem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'La cantidad debe ser al menos 1'
        }
      }
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
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'El subtotal no puede ser negativo'
        }
      }
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',    // ✅ Explícito
    updatedAt: 'updated_at'     // ✅ Explícito
  });

  orderitem_model.associate = (models) => {
    orderitem_model.belongsTo(models.order, {
      foreignKey: 'order_id',
      as: 'order'
    });
    orderitem_model.belongsTo(models.product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return orderitem_model;
};

export default orderitem;