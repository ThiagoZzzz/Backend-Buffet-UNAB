// controllers/admin_controller.js 
import { order, user, product, category, orderitem } from '../models/index.js';
import { Op } from 'sequelize';

export const get_dashboard_stats = async (req, res) => {
  try {
    console.log('📊 === INICIO DASHBOARD DEBUG ===');
    console.log('👤 Usuario:', req.user?.id, req.user?.nombre, req.user?.role);

    // Verificar que el usuario es admin
    if (!req.user || req.user.role !== 'admin') {
      console.log('❌ Usuario no es admin:', req.user?.role);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder al dashboard'
      });
    }

    console.log('🔍 Ejecutando consultas paralelas...');

    // Obtener estadísticas en paralelo con manejo de errores individual
    let total_users, total_products, total_orders, revenue, pending_orders, delivered_orders;

    try {
      [
        total_users,
        total_products,
        total_orders,
        revenue,
        pending_orders,
        delivered_orders
      ] = await Promise.all([
        user.count().catch(err => { console.error('❌ Error contando usuarios:', err.message); return 0; }),
        product.count().catch(err => { console.error('❌ Error contando productos:', err.message); return 0; }),
        order.count().catch(err => { console.error('❌ Error contando pedidos:', err.message); return 0; }),
        order.sum('total', { 
          where: { 
            estado: { 
              [Op.in]: ['entregado', 'completado', 'completed', 'delivered'] 
            } 
          } 
        }).catch(err => { console.error('❌ Error sumando revenue:', err.message); return 0; }),
        order.count({ 
          where: { 
            estado: { 
              [Op.in]: ['pendiente', 'pending', 'procesando', 'processing'] 
            } 
          } 
        }).catch(err => { console.error('❌ Error contando pendientes:', err.message); return 0; }),
        order.count({ 
          where: { 
            estado: { 
              [Op.in]: ['entregado', 'completado', 'completed', 'delivered'] 
            } 
          } 
        }).catch(err => { console.error('❌ Error contando entregados:', err.message); return 0; })
      ]);
    } catch (error) {
      console.error('❌ Error en consultas paralelas:', error);
      // Continuar con valores por defecto
      total_users = total_products = total_orders = revenue = pending_orders = delivered_orders = 0;
    }

    console.log('📊 Resultados consultas:', {
      total_users, total_products, total_orders, revenue, pending_orders, delivered_orders
    });

    // Pedidos recientes con manejo de error
    let recent_orders = [];
    try {
      console.log('🔍 Buscando pedidos recientes...');
      recent_orders = await order.findAll({
        include: [{
          model: user,
          as: 'user',
          attributes: ['id', 'nombre', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      console.log(`✅ Encontrados ${recent_orders.length} pedidos recientes`);
    } catch (error) {
      console.error('❌ Error obteniendo pedidos recientes:', error.message);
      recent_orders = [];
    }

    // Productos más vendidos con manejo de error
    let top_products = [];
    try {
      console.log('🔍 Buscando productos populares...');
      top_products = await product.findAll({
        order: [['vendidos', 'DESC']],
        limit: 5,
        attributes: ['id', 'nombre', 'precio', 'vendidos', 'imagen', 'categoria']
      });
      console.log(`✅ Encontrados ${top_products.length} productos populares`);
    } catch (error) {
      console.error('❌ Error obteniendo productos populares:', error.message);
      top_products = [];
    }

    // Ingresos del mes actual con manejo de error
    let monthly_revenue = 0;
    try {
      console.log('🔍 Calculando ingresos del mes...');
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      monthly_revenue = await order.sum('total', {
        where: {
          createdAt: { [Op.gte]: startOfMonth },
          estado: { [Op.in]: ['entregado', 'completado', 'completed', 'delivered'] }
        }
      }) || 0;
      console.log(`✅ Ingresos del mes: ${monthly_revenue}`);
    } catch (error) {
      console.error('❌ Error calculando ingresos del mes:', error.message);
      monthly_revenue = 0;
    }

    
    const response = {
      success: true,
      message: 'Dashboard cargado exitosamente',
      data: {
        estadisticas: {
          total_usuarios: total_users || 0,
          total_productos: total_products || 0,
          total_pedidos: total_orders || 0,
          pedidos_pendientes: pending_orders || 0,
          pedidos_entregados: delivered_orders || 0,
          ingresos_totales: revenue || 0,
          ingresos_mes: monthly_revenue || 0,
          valor_promedio_pedido: delivered_orders > 0 ? (revenue || 0) / delivered_orders : 0
        },
        pedidos_recientes: recent_orders.map(order => ({
          id: order.id,
          total: order.total,
          estado: order.estado,
          fecha: order.createdAt,
          usuario: order.user ? {
            id: order.user.id,
            nombre: order.user.nombre,
            email: order.user.email
          } : { nombre: 'Cliente', email: 'N/A' }
        })),
        productos_populares: top_products.map(prod => ({
          id: prod.id,
          nombre: prod.nombre,
          precio: prod.precio,
          vendidos: prod.vendidos || 0,
          imagen: prod.imagen,
          categoria: prod.categoria
        }))
      },
      timestamp: new Date().toISOString(),
      debug: {
        user_authenticated: !!req.user,
        user_role: req.user?.role,
        queries_executed: true
      }
    };

    console.log('✅ Dashboard generado exitosamente');
    res.json(response);

  } catch (error) {
    console.error('❌ ERROR CRÍTICO en dashboard admin:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error interno al cargar el dashboard',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined,
      debug: {
        user_authenticated: !!req.user,
        user_role: req.user?.role,
        timestamp: new Date().toISOString()
      }
    });
  }
};


export const get_recent_orders = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsed_limit = parseInt(limit);

    const { count, rows: orders } = await order.findAndCountAll({
      include: [{
        model: user,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono']
      }],
      order: [['createdAt', 'DESC']],
      limit: parsed_limit,
      offset: offset
    });

    res.json({
      success: true,
      cantidad: orders.length,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / parsed_limit),
      orders
    });
  } catch (error) {
    console.error('Error al cargar pedidos recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar pedidos recientes'
    });
  }
};

export const get_all_users = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsed_limit = parseInt(limit);

    // Construir where clause
    const where_clause = {};
    
    if (search) {
      where_clause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role && role !== 'all') {
      where_clause.role = role;
    }

    const { count, rows: users } = await user.findAndCountAll({
      where: where_clause,
      attributes: { exclude: ['password'] },
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parsed_limit,
      offset: offset
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          total_pages: Math.ceil(count / parsed_limit),
          has_next: parseInt(page) < Math.ceil(count / parsed_limit),
          has_prev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar usuarios'
    });
  }
};

export const get_all_products = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoria,
      disponible,
      search 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsed_limit = parseInt(limit);

    // Construir where clause
    const where_clause = {};
    
    if (categoria && categoria !== 'all') {
      where_clause.categoria = categoria;
    }

    if (disponible !== undefined) {
      where_clause.disponible = disponible === 'true';
    }

    if (search) {
      where_clause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: products } = await product.findAndCountAll({
      where: where_clause,
      order: [['createdAt', 'DESC']],
      limit: parsed_limit,
      offset: offset
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: count,
          page: parseInt(page),
          total_pages: Math.ceil(count / parsed_limit),
          has_next: parseInt(page) < Math.ceil(count / parsed_limit),
          has_prev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar productos'
    });
  }
};

export const get_advanced_stats = async (req, res) => {
  try {
    console.log('📈 Solicitando estadísticas avanzadas...');

    // Estadísticas de órdenes por mes (últimos 6 meses)
    const six_months_ago = new Date();
    six_months_ago.setMonth(six_months_ago.getMonth() - 6);

    const monthly_orders = await order.findAll({
      where: {
        createdAt: {
          [Op.gte]: six_months_ago
        }
      },
      attributes: [
        [order.sequelize.fn('YEAR', order.sequelize.col('createdAt')), 'year'],
        [order.sequelize.fn('MONTH', order.sequelize.col('createdAt')), 'month'],
        [order.sequelize.fn('COUNT', order.sequelize.col('id')), 'order_count'],
        [order.sequelize.fn('SUM', order.sequelize.col('total')), 'revenue']
      ],
      group: ['year', 'month'],
      order: [['year', 'ASC'], ['month', 'ASC']],
      raw: true
    });

    // Productos más vendidos
    const top_products_data = await orderitem.findAll({
      attributes: [
        'product_id',
        [orderitem.sequelize.fn('SUM', orderitem.sequelize.col('cantidad')), 'total_sold']
      ],
      include: [{
        model: product,
        as: 'product',
        attributes: ['id', 'nombre', 'categoria']
      }],
      group: ['product_id'],
      order: [[orderitem.sequelize.fn('SUM', orderitem.sequelize.col('cantidad')), 'DESC']],
      limit: 10,
      raw: false
    });

    // Usuarios más activos
    const top_users_data = await order.findAll({
      attributes: [
        'user_id',
        [order.sequelize.fn('COUNT', order.sequelize.col('id')), 'order_count'],
        [order.sequelize.fn('SUM', order.sequelize.col('total')), 'total_spent']
      ],
      include: [{
        model: user,
        as: 'user',
        attributes: ['id', 'nombre', 'email']
      }],
      group: ['user_id'],
      order: [[order.sequelize.fn('COUNT', order.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: false
    });

    res.json({
      success: true,
      message: 'Estadísticas avanzadas cargadas exitosamente',
      stats: {
        monthly_orders: monthly_orders.map(item => ({
          period: `${item.year}-${String(item.month).padStart(2, '0')}`,
          order_count: parseInt(item.order_count) || 0,
          revenue: parseFloat(item.revenue) || 0
        })),
        top_products: top_products_data.map(item => ({
          id: item.product?.id,
          nombre: item.product?.nombre,
          categoria: item.product?.categoria,
          total_sold: parseInt(item.get('total_sold')) || 0
        })),
        top_users: top_users_data.map(item => ({
          id: item.user?.id,
          nombre: item.user?.nombre,
          email: item.user?.email,
          order_count: parseInt(item.get('order_count')) || 0,
          total_spent: parseFloat(item.get('total_spent')) || 0
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error al cargar estadísticas avanzadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas avanzadas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};