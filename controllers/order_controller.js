// controllers/order_controller.js
import { order, orderitem, product, user } from '../models/index.js';
import { Op } from 'sequelize';
import QRcode from 'qrcode';

export const create_order = async (req, res) => {
  try {
    const { items, metodo_pago, notas } = req.body;
    const user_id = req.user.id;

    // Validaciones mejoradas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    // Validar método de pago
    const metodos_pago_validos = ['efectivo', 'tarjeta', 'qr'];
    if (metodo_pago && !metodos_pago_validos.includes(metodo_pago)) {
      return res.status(400).json({
        success: false,
        message: `Método de pago no válido. Usar: ${metodos_pago_validos.join(', ')}`
      });
    }

    // Calcular total y verificar productos
    let total = 0;
    const order_items = [];
    const errors = [];

    // Usar Promise.all para consultas paralelas
    const product_validation_promises = items.map(async (item) => {
      // Validar cantidad
      if (!item.cantidad || item.cantidad < 1) {
        errors.push(`Cantidad inválida para producto ${item.producto}`);
        return null;
      }

      const product_data = await product.findByPk(item.producto);

      if (!product_data) {
        errors.push(`Producto no encontrado: ${item.producto}`);
        return null;
      }

      if (!product_data.disponible) {
        errors.push(`Producto no disponible: ${product_data.nombre}`);
        return null;
      }

      const price = product_data.promocion && product_data.precio_promocion
        ? product_data.precio_promocion
        : product_data.precio;

      const subtotal = price * item.cantidad;

      return {
        product_data,
        validation_data: {
          product_id: product_data.id,
          cantidad: item.cantidad,
          precio: price,
          subtotal: subtotal,
          nombre: product_data.nombre
        }
      };
    });

    const validation_results = await Promise.all(product_validation_promises);

    // Procesar resultados de validación
    validation_results.forEach(result => {
      if (result) {
        order_items.push(result.validation_data);
        total += result.validation_data.subtotal;
      }
    });

    // Si hay errores, retornarlos
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Errores en la validación del carrito',
        errors: errors
      });
    }

    // Crear orden con transacción para atomicidad
    const transaction = await order.sequelize.transaction();

    try {
      const new_order = await order.create({
        user_id,
        total,
        metodo_pago: metodo_pago || 'efectivo',
        notas: notas || '',
        estado: 'pendiente'
      }, { transaction });

      // Crear items de la orden
      const order_items_promises = order_items.map(item =>
        orderitem.create({
          product_id: item.product_id,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.subtotal,
          order_id: new_order.id
        }, { transaction })
      );

      await Promise.all(order_items_promises);

      // Commit de la transacción (debe ser lo último en el try)
      await transaction.commit();

      // Generar el QR
      const qr_data_url = await QRcode.toDataURL(new_order.id.toString());

      // Cargar orden completa con relaciones
      const complete_order = await order.findByPk(new_order.id, {
        include: [
          {
            model: user,
            as: 'user',
            attributes: ['id', 'nombre', 'email', 'telefono']
          },
          {
            model: orderitem,
            as: 'items',
            include: [{
              model: product,
              as: 'product',
              attributes: ['id', 'nombre', 'imagen', 'category_id']
            }]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        qr_code: qr_data_url,
        order: complete_order
      });

    } catch (error) {
      // Rollback solo si la transacción aún está activa
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }

  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al crear el pedido'
    });
  }
};

export const get_user_orders = async (req, res) => {
  try {
    const user_orders = await order.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: orderitem,
          as: 'items',
          include: [{
            model: product,
            as: 'product',
            attributes: ['id', 'nombre', 'imagen', 'category_id']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      cantidad: user_orders.length,
      orders: user_orders
    });
  } catch (error) {
    console.error('Error al obtener pedidos del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar tus pedidos'
    });
  }
};

export const get_order_by_id = async (req, res) => {
  try {
    const order_data = await order.findByPk(req.params.id, {
      include: [
        {
          model: user,
          as: 'user',
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        {
          model: orderitem,
          as: 'items',
          include: [{
            model: product,
            as: 'product',
            attributes: ['id', 'nombre', 'imagen', 'category_id', 'precio', 'precio_promocion', 'promocion']
          }]
        }
      ]
    });

    if (!order_data) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido pertenece al usuario o es admin
    if (order_data.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver este pedido'
      });
    }

    const qr_data_url = await QRcode.toDataURL(order_data.id.toString());

    res.json({
      success: true,
      order: order_data,
      qr_code: qr_data_url
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar el pedido'
    });
  }
};

export const get_order_stats = async (req, res) => {
  try {
    const total_orders = await order.count();
    const total_revenue = await order.sum('total', {
      where: { estado: 'entregado' }
    });
    const avg_order_value = total_orders > 0 ? (total_revenue || 0) / total_orders : 0;

    const orders_by_status = await order.findAll({
      attributes: [
        'estado',
        [order.sequelize.fn('COUNT', order.sequelize.col('id')), 'count']
      ],
      group: ['estado'],
      raw: true
    });

    res.json({
      success: true,
      stats: {
        total_orders,
        total_revenue: parseFloat(total_revenue) || 0,
        avg_order_value: parseFloat(avg_order_value) || 0,
        orders_by_status: orders_by_status.reduce((acc, item) => {
          acc[item.estado] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas'
    });
  }
};

export const cancel_order = async (req, res) => {
  try {
    const order_data = await order.findByPk(req.params.id);

    if (!order_data) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido pertenece al usuario o es admin
    if (order_data.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para cancelar este pedido'
      });
    }

    // Validar que el pedido se puede cancelar
    const estados_no_cancelables = ['entregado', 'cancelado', 'preparando', 'listo'];
    if (estados_no_cancelables.includes(order_data.estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un pedido con estado: ${order_data.estado}`
      });
    }

    // Límite de tiempo para cancelar (30 minutos)
    const tiempo_creacion = new Date(order_data.created_at);
    const tiempo_actual = new Date();
    const diferencia_minutos = (tiempo_actual - tiempo_creacion) / (1000 * 60);

    if (diferencia_minutos > 30 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'El tiempo para cancelar el pedido ha expirado (30 minutos)'
      });
    }

    // Cancelar el pedido
    await order_data.update({ estado: 'cancelado' });

    const updated_order = await order.findByPk(order_data.id, {
      include: [
        {
          model: user,
          as: 'user',
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        {
          model: orderitem,
          as: 'items',
          include: [{
            model: product,
            as: 'product',
            attributes: ['id', 'nombre', 'imagen', 'category_id']
          }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      order: updated_order
    });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar el pedido'
    });
  }
};

export const update_order_status = async (req, res) => {
  try {
    const { estado } = req.body;

    // Validar estado
    const estados_validos = ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!estado || !estados_validos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Usar: ${estados_validos.join(', ')}`
      });
    }

    const order_data = await order.findByPk(req.params.id);

    if (!order_data) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Validar transición de estado
    if (order_data.estado === 'entregado' && estado !== 'entregado') {
      return res.status(400).json({
        success: false,
        message: 'No se puede modificar el estado de un pedido ya entregado'
      });
    }

    if (order_data.estado === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'No se puede modificar un pedido cancelado'
      });
    }

    await order_data.update({ estado });

    const updated_order = await order.findByPk(order_data.id, {
      include: [{
        model: user,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono']
      }]
    });

    res.json({
      success: true,
      message: `Estado del pedido actualizado a: ${estado}`,
      order: updated_order,
      estado_anterior: order_data.estado,
      estado_nuevo: estado
    });
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del pedido'
    });
  }
};

export const get_all_orders = async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;

    const where_clause = {};
    if (estado && estado !== 'todos') {
      where_clause.estado = estado;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsed_limit = parseInt(limit);

    const { count, rows: orders } = await order.findAndCountAll({
      where: where_clause,
      include: [
        {
          model: user,
          as: 'user',
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        {
          model: orderitem,
          as: 'items',
          include: [{
            model: product,
            as: 'product',
            attributes: ['id', 'nombre', 'category_id']
          }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parsed_limit,
      offset: offset
    });

    const total_pages = Math.ceil(count / parsed_limit);

    res.json({
      success: true,
      cantidad: orders.length,
      total: count,
      pagination: {
        page: parseInt(page),
        total_pages,
        has_next: parseInt(page) < total_pages,
        has_prev: parseInt(page) > 1
      },
      orders
    });
  } catch (error) {
    console.error('Error al obtener todos los pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar los pedidos'
    });
  }
};

export const get_user_order_stats = async (req, res) => {
  try {
    const user_id = req.user.id;

    const stats = await order.findOne({
      where: { user_id },
      attributes: [
        [order.sequelize.fn('COUNT', order.sequelize.col('id')), 'total_orders'],
        [order.sequelize.fn('SUM', order.sequelize.col('total')), 'total_gastado'],
        [order.sequelize.fn('AVG', order.sequelize.col('total')), 'promedio_orden']
      ],
      raw: true
    });

    const orders_by_status = await order.findAll({
      where: { user_id },
      attributes: [
        'estado',
        [order.sequelize.fn('COUNT', order.sequelize.col('id')), 'count']
      ],
      group: ['estado'],
      raw: true
    });

    res.json({
      success: true,
      stats: {
        total_orders: parseInt(stats.total_orders) || 0,
        total_gastado: parseFloat(stats.total_gastado) || 0,
        promedio_orden: parseFloat(stats.promedio_orden) || 0,
        orders_by_status: orders_by_status.reduce((acc, item) => {
          acc[item.estado] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas'
    });
  }
};
export const delete_order = async (req, res) => {
  try {
    const order_data = await order.findByPk(req.params.id);

    if (!order_data) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Solo permitir eliminar pedidos cancelados
    if (order_data.estado !== 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar pedidos cancelados'
      });
    }

    await order_data.destroy();

    res.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el pedido'
    });
  }
};
