// models/index.js
import sequelize from '../config/database.js';

// Importar modelos
import init_user from './user.js';
import init_category from './category.js';
import init_product from './product.js';
import init_order from './order.js';
import init_orderitem from './order-item.js';

// Inicializar modelos
const user = init_user(sequelize);
const category = init_category(sequelize);
const product = init_product(sequelize);
const order = init_order(sequelize);
const orderitem = init_orderitem(sequelize);

// Configurar asociaciones - usar nombres exactos en minúsculas
const models = {
  user,
  category,
  product,
  order,
  orderitem
};

// Configurar asociaciones después de que todos los modelos estén inicializados
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

const db = {
  ...models,
  sequelize
};

export {
  user,
  category,
  product,
  order,
  orderitem,
  sequelize
};

export default db;