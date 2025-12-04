// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

//  RUTAS
import sequelize from './config/database.js';
import { error_handler, not_found } from './middleware/error_handler.js';

// Importar rutas
import auth_routes from './routes/auth.js';
import user_routes from './routes/users.js';
import product_routes from './routes/products.js';
import order_routes from './routes/orders.js';
import cart_routes from './routes/cart.js';
import admin_routes from './routes/admin.js';
import categories_routes from './routes/categories.js';
import search_routes from './routes/search.js';
import upload_routes from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==================== CONFIGURACIÓN ====================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/auth/register') {
    console.log('🔍 DEBUG - Body recibido:', req.body);
    console.log('🔍 DEBUG - Content-Type:', req.headers['content-type']);
  }
  next();
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ==================== ENDPOINTS DEBUG ====================
// Debug: Verificar estado del servidor y rutas
app.get('/api/debug/routes', (req, res) => {
  const routes = [];

  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Rutas directas
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Rutas de router
      const routerPath = middleware.regexp.toString().replace(/^\/\^\\\//, '').replace(/\\\/\?\(\?=\\\/\|\$\)\/\w*$/, '');
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const route = handler.route;
          routes.push({
            path: routerPath + route.path,
            methods: Object.keys(route.methods)
          });
        }
      });
    }
  });

  res.json({
    success: true,
    total_routes: routes.length,
    routes: routes.filter(route => route.path.includes('/api/'))
  });
});

// Debug: Endpoint temporal de admin sin auth
app.get('/api/admin/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Endpoint de admin funciona!',
    timestamp: new Date().toISOString(),
    user: req.user || 'No autenticado'
  });
});

// Debug: Verificar autenticación
app.get('/api/debug/auth-check', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.json({
        authenticated: false,
        message: 'No token provided'
      });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    const { user } = await import('./models/index.js');
    const userData = await user.findByPk(decoded.id);

    res.json({
      authenticated: true,
      user: {
        id: userData.id,
        nombre: userData.nombre,
        email: userData.email,
        role: userData.role,
        is_admin: userData.role === 'admin'
      }
    });
  } catch (error) {
    res.json({
      authenticated: false,
      error: error.message
    });
  }
});

// ==================== RUTAS BÁSICAS ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '¡Bienvenido al API de Buffet UNaB! 🚀',
    version: '2.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    database: 'MySQL + Sequelize',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      cart: '/api/cart',
      admin: '/api/admin',
      categories: '/api/categories',
      search: '/api/search',
      upload: '/api/upload',
      debug: {
        'GET /api/debug/routes': 'Ver todas las rutas registradas',
        'GET /api/admin/test': 'Test endpoint de admin',
        'GET /api/debug/auth-check': 'Verificar autenticación'
      }
    },
    documentation: 'Consulta /api/health para más información'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();

    // Obtener estadísticas básicas
    const { user, product, order } = await import('./models/index.js');
    const [user_count, product_count, order_count] = await Promise.all([
      user.count(),
      product.count(),
      order.count()
    ]);

    res.json({
      success: true,
      message: '✅ API funcionando correctamente',
      status: {
        server: '🟢 Online',
        database: '🟢 MySQL Conectado',
        environment: NODE_ENV
      },
      statistics: {
        usuarios: user_count,
        productos: product_count,
        pedidos: order_count
      },
      system: {
        node_version: process.version,
        platform: process.platform,
        uptime: `${Math.floor(process.uptime())} segundos`,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: '❌ Error de base de datos',
      status: {
        server: '🟢 Online',
        database: '🔴 MySQL Desconectado',
        environment: NODE_ENV
      },
      error: NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== REGISTRO DE RUTAS ====================
app.use('/api/auth', auth_routes);
app.use('/api/users', user_routes);
app.use('/api/products', product_routes);
app.use('/api/orders', order_routes);
app.use('/api/cart', cart_routes);
app.use('/api/admin', admin_routes);
app.use('/api/categories', categories_routes);
app.use('/api/search', search_routes);
app.use('/api/upload', upload_routes);

// ==================== DOCUMENTACIÓN DE ENDPOINTS ====================
app.get('/api/endpoints', (req, res) => {
  res.json({
    success: true,
    endpoints: {
      // AUTENTICACIÓN
      auth: {
        'POST /api/auth/register': 'Registro de usuario',
        'POST /api/auth/login': 'Login de usuario',
        'GET  /api/auth/profile': 'Obtener perfil (requiere auth)',
        'PUT  /api/auth/profile': 'Actualizar perfil (requiere auth)',
        'GET  /api/auth/verify': 'Verificar token (requiere auth)'
      },

      // USUARIOS
      users: {
        'GET  /api/users/profile': 'Perfil del usuario (requiere auth)',
        'PUT  /api/users/profile': 'Actualizar perfil (requiere auth)',
        'GET  /api/users': 'Listar usuarios (solo admin)',
        'GET  /api/users/:id': 'Obtener usuario por ID (solo admin)',
        'PUT  /api/users/:id/role': 'Actualizar rol (solo admin)',
        'DELETE /api/users/:id': 'Eliminar usuario (solo admin)'
      },

      // PRODUCTOS
      products: {
        'GET  /api/products': 'Listar productos (público)',
        'GET  /api/products/categories': 'Obtener categorías (público)',
        'GET  /api/products/:id': 'Obtener producto por ID (público)',
        'POST /api/products': 'Crear producto (solo admin)',
        'PUT  /api/products/:id': 'Actualizar producto (solo admin)',
        'DELETE /api/products/:id': 'Eliminar producto (solo admin)'
      },

      // PEDIDOS
      orders: {
        'POST /api/orders': 'Crear pedido (requiere auth)',
        'GET  /api/orders/my-orders': 'Mis pedidos (requiere auth)',
        'GET  /api/orders/my-stats': 'Mis estadísticas (requiere auth)',
        'GET  /api/orders/:id': 'Obtener pedido por ID (requiere auth)',
        'PUT  /api/orders/:id/cancel': 'Cancelar pedido (requiere auth)',
        'GET  /api/orders': 'Listar todos los pedidos (solo admin)',
        'PUT  /api/orders/:id/status': 'Actualizar estado (solo admin)'
      },

      // CARRITO
      cart: {
        'POST /api/cart/validate': 'Validar carrito (requiere auth)',
        'POST /api/cart/add': 'Agregar producto (requiere auth)',
        'POST /api/cart/remove': 'Remover producto (requiere auth)',
        'PUT  /api/cart/update': 'Actualizar cantidad (requiere auth)',
        'DELETE /api/cart/clear': 'Vaciar carrito (requiere auth)',
        'POST /api/cart/summary': 'Resumen del carrito (requiere auth)'
      },

      // ADMIN
      admin: {
        'GET  /api/admin/dashboard': 'Estadísticas del dashboard (solo admin)',
        'GET  /api/admin/stats/advanced': 'Estadísticas avanzadas (solo admin)',
        'GET  /api/admin/recent-orders': 'Pedidos recientes (solo admin)',
        'GET  /api/admin/users': 'Listar usuarios (solo admin)',
        'PUT  /api/admin/users/:id/role': 'Actualizar rol (solo admin)',
        'GET  /api/admin/products': 'Listar productos (solo admin)'
      },

      // CATEGORÍAS
      categories: {
        'GET  /api/categories': 'Listar categorías (público)',
        'GET  /api/categories/:id': 'Obtener categoría por ID (público)',
        'GET  /api/categories/:slug/products': 'Productos por categoría (público)',
        'POST /api/categories': 'Crear categoría (solo admin)',
        'PUT  /api/categories/:id': 'Actualizar categoría (solo admin)',
        'DELETE /api/categories/:id': 'Eliminar categoría (solo admin)',
        'PUT  /api/categories/:id/deactivate': 'Desactivar categoría (solo admin)'
      },

      // BÚSQUEDA
      search: {
        'GET  /api/search/products': 'Búsqueda avanzada de productos (público)',
        'GET  /api/search/quick': 'Búsqueda rápida (público)',
        'GET  /api/search/suggestions': 'Sugerencias de búsqueda (público)',
        'GET  /api/search/filters': 'Filtros disponibles (público)'
      },

      // UPLOAD
      upload: {
        'POST /api/upload/products': 'Subir imagen de producto (solo admin)',
        'POST /api/upload/users/avatar': 'Subir avatar de usuario (requiere auth)',
        'DELETE /api/upload/:type/:filename': 'Eliminar archivo (requiere auth/admin)',
        'GET  /api/upload/:type/:filename': 'Obtener información de archivo (público)'
      },

      // DEBUG (TEMPORAL)
      debug: {
        'GET  /api/debug/routes': 'Ver todas las rutas registradas',
        'GET  /api/admin/test': 'Test endpoint de admin',
        'GET  /api/debug/auth-check': 'Verificar autenticación'
      }
    }
  });
});

// ==================== MANEJO DE ERRORES ====================
// 404 - Rutas no encontradas
app.use(not_found);

// Manejo general de errores
app.use(error_handler);

// ==================== INICIAR SERVIDOR ====================
const start_server = async () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT} (esperando DB...)`);
    console.log('🎯 ================================================\n');
  });

  // Inicializar Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    credentials: true
  }
});

// Guardar io en app para usarlo en controladores
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado:', socket.id);
});


  try {
    console.log('🔄 Intentando conectar y sincronizar base de datos...');

    // Autenticar primero para probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a BD establecida.');

    // Luego sincronizar modelos
    await sequelize.sync({ alter: false, force: false });
    console.log('✅ Modelos sincronizados correctamente.');

          console.log('\n🎯 ================================================');
      console.log('🚀 Servidor Buffet UNaB Backend');
      console.log('💾 Base de datos: MySQL + Sequelize');
      console.log('🌍 Ambiente:', NODE_ENV);
      console.log(`📍 http://localhost:${PORT}`);
      console.log('✅ Base de datos sincronizada');
      console.log('🎯 ================================================\n');

      console.log('📋 Endpoints principales:');
      console.log('   🌐 GET  /api                    - Información del API');
      console.log('   ❤️  GET  /api/health          - Estado del servidor');
      console.log('   📖 GET  /api/endpoints        - Documentación completa');
      console.log('   👤 POST /api/auth/register    - Registro de usuario');
      console.log('   🔐 POST /api/auth/login       - Login de usuario');
      console.log('   🔐 GET  /api/auth/verify      - Verificar token (auth)');
      console.log('   👤 GET  /api/users/profile    - Obtener perfil (auth)');
      console.log('   👤 PUT  /api/users/profile    - Actualizar perfil (auth)');
      console.log('   🛍️  GET  /api/products        - Lista de productos (público)');
      console.log('   🛍️  POST /api/products        - Crear producto (admin)');
      console.log('   🛍️  PUT  /api/products/:id    - Actualizar producto (admin)');
      console.log('   🛍️  DELETE /api/products/:id  - Eliminar producto (admin)');
      console.log('   📁 GET  /api/categories       - Categorías (público)');
      console.log('   🔍 GET  /api/search/products  - Buscar productos (público)');
      console.log('   🛒 POST /api/cart/validate    - Validar carrito (auth)');
      console.log('   🛒 POST /api/cart/add         - Agregar al carrito (auth)');
      console.log('   🛒 POST /api/cart/remove      - Remover del carrito (auth)');
      console.log('   🛒 PUT  /api/cart/update      - Actualizar carrito (auth)');
      console.log('   🛒 DELETE /api/cart/clear     - Vaciar carrito (auth)');
      console.log('   📦 POST /api/orders           - Crear pedido (auth)');
      console.log('   📦 GET  /api/orders/my-orders - Mis pedidos (auth)');
      console.log('   📦 PUT  /api/orders/:id/cancel- Cancelar pedido (auth)');
      console.log('   📊 GET  /api/admin/dashboard  - Dashboard admin');
      console.log('   📤 POST /api/upload/products  - Subir imagen producto (admin)');
      console.log('   📤 POST /api/upload/users/avatar - Subir avatar (auth)');
      console.log('\n🔧 Endpoints Debug:');
      console.log('   🛠️  GET  /api/debug/routes    - Ver rutas registradas');
      console.log('   🧪 GET  /api/admin/test      - Test admin');
      console.log('   🔐 GET  /api/debug/auth-check - Verificar token\n');

      console.log('⚡ Servidor listo para recibir peticiones...\n');
    } catch (error) {
    console.error('❌ ERROR CRÍTICO DE BASE DE DATOS:', error);
  }

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🔻 Recibida señal de cierre. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔻 Recibida señal de terminación. Cerrando servidor...');
  process.exit(0);
});
}

// Iniciar la aplicación
start_server();