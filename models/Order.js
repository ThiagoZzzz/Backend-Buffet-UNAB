// models/order.js
import { DataTypes } from 'sequelize';

const order = (sequelize) => {
  const order_model = sequelize.define('order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {  
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'El user_id es requerido'
        }
      }
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        notNull: {
          msg: 'El total es requerido'
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'),
      defaultValue: 'pendiente',
      validate: {
        isIn: {
          args: [['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado']],
          msg: 'Estado no válido'
        }
      }
    },
    metodo_pago: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'qr'),
      defaultValue: 'efectivo',
      validate: {
        isIn: {
          args: [['efectivo', 'tarjeta', 'qr']],
          msg: 'Método de pago no válido'
        }
      }
    },
    numero_pedido: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,  
    indexes: [
      {
        fields: ['user_id']  
      },
      {
        fields: ['estado']   
      }
    ]
  });

  order_model.associate = (models) => {
    order_model.belongsTo(models.user, {  
      foreignKey: 'user_id',
      as: 'user'
    });
    order_model.hasMany(models.orderitem, { 
      foreignKey: 'order_id',
      as: 'items',
      onDelete: 'CASCADE' 
    });
  };

  // Hook para generar número de pedido
  order_model.beforeCreate(async (order) => {
    if (!order.numero_pedido) {
      try {
        const count = await order_model.count();
        order.numero_pedido = `PED${String(count + 1).padStart(4, '0')}`;
      } catch (error) {
        // Fallback en caso de error
        const timestamp = Date.now().toString().slice(-6);
        order.numero_pedido = `PED${timestamp}`;
      }
    }
  });

  return order_model;
};

export default order;