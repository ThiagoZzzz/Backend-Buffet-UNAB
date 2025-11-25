// controllers/user_controller.js
import { user, order, orderitem } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

// Obtener perfil del usuario autenticado
export const get_profile = async (req, res) => {
  try {
    const user_data = await user.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: order,
        as: 'orders',
        attributes: ['id', 'total', 'estado', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 5 
      }]
    });

    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: user_data
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};

// Actualizar perfil de usuario
export const update_profile = async (req, res) => {
  try {
    const { nombre, telefono, direccion, current_password, new_password } = req.body;
    
    const user_data = await user.findByPk(req.user.id);
    
    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const update_data = {};
    
    // Campos básicos
    if (nombre) update_data.nombre = nombre.trim();
    if (telefono !== undefined) update_data.telefono = telefono;
    if (direccion !== undefined) update_data.direccion = direccion;

    // Cambio de contraseña 
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es requerida para cambiar la contraseña'
        });
      }

      // Verificar contraseña actual
      const is_password_valid = await bcrypt.compare(current_password, user_data.password);
      if (!is_password_valid) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Validar nueva contraseña
      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      update_data.password = await bcrypt.hash(new_password, 12);
    }

    await user_data.update(update_data);

    // Obtener usuario actualizado sin password
    const updated_user = await user.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: new_password ? 'Perfil y contraseña actualizados exitosamente' : 'Perfil actualizado exitosamente',
      user: updated_user
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
};

// Obtener todos los usuarios (admin) con filtros y paginación
export const get_users = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role,
      sort_by = 'created_at',
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

    // Validar sort_by
    const allowed_sort_fields = ['id', 'nombre', 'email', 'role', 'created_at', 'updated_at'];
    const valid_sort_by = allowed_sort_fields.includes(sort_by) ? sort_by : 'created_at';
    const valid_sort_order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: users } = await user.findAndCountAll({
      where: where_clause,
      attributes: { exclude: ['password'] },
      order: [[valid_sort_by, valid_sort_order]],
      limit: parsed_limit,
      offset: offset
    });

    const total_pages = Math.ceil(count / parsed_limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          total_pages,
          has_next: parseInt(page) < total_pages,
          has_prev: parseInt(page) > 1
        },
        filters: {
          search: search || '',
          role: role || 'all',
          sort_by: valid_sort_by,
          sort_order: valid_sort_order
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar usuarios'
    });
  }
};
// Actualizar usuario por ID (admin)
export const update_user = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;

    const user_data = await user.findByPk(id);

    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir actualizarse a sí mismo desde esta ruta admin
    if (parseInt(id) === parseInt(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes actualizar tus propios datos desde esta ruta'
      });
    }

    // Preparar datos a actualizar
    const update_fields = {};

    if (nombre) update_fields.nombre = nombre.trim();
    if (email) update_fields.email = email.toLowerCase().trim();
    if (telefono !== undefined) update_fields.telefono = telefono;
    if (direccion !== undefined) update_fields.direccion = direccion;

    await user_data.update(update_fields);

    const updated_user = await user.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: updated_user
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario'
    });
  }
};

// Obtener usuario por ID (admin)
export const get_user_by_id = async (req, res) => {
  try {
    const user_data = await user.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: order,
        as: 'orders',
        attributes: ['id', 'total', 'estado', 'created_at', 'numero_pedido'],
        include: [{
          model: orderitem,
          as: 'items',
          attributes: ['id', 'cantidad', 'precio', 'subtotal']
        }],
        order: [['created_at', 'DESC']],
        limit: 10
      }]
    });

    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener estadísticas del usuario
    const user_stats = await order.findOne({
      where: { user_id: req.params.id },
      attributes: [
        [order.sequelize.fn('COUNT', order.sequelize.col('id')), 'total_orders'],
        [order.sequelize.fn('SUM', order.sequelize.col('total')), 'total_gastado'],
        [order.sequelize.fn('AVG', order.sequelize.col('total')), 'promedio_orden']
      ],
      raw: true
    });

    res.json({
      success: true,
      user: {
        ...user_data.toJSON(),
        stats: {
          total_orders: parseInt(user_stats.total_orders) || 0,
          total_gastado: parseFloat(user_stats.total_gastado) || 0,
          promedio_orden: parseFloat(user_stats.promedio_orden) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar usuario'
    });
  }
};

// Actualizar rol de usuario (admin)
export const update_user_role = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido. Usar: user o admin'
      });
    }

    const user_data = await user.findByPk(id);
    
    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir cambiar el rol del propio usuario
    if (parseInt(id) === parseInt(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol'
      });
    }

    await user_data.update({ role });

    // Obtener usuario actualizado sin password
    const updated_user = await user.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: `Rol de usuario actualizado a: ${role}`,
      user: updated_user
    });
  } catch (error) {
    console.error('Error al actualizar rol de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol'
    });
  }
};

// Eliminar usuario (admin)
export const delete_user = async (req, res) => {
  try {
    const { id } = req.params;

    const user_data = await user.findByPk(id);
    
    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminarse a sí mismo
    if (parseInt(id) === parseInt(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Verificar si el usuario tiene órdenes
    const order_count = await order.count({
      where: { user_id: id }
    });

    if (order_count > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el usuario porque tiene ${order_count} órdenes asociadas.`
      });
    }

    await user_data.destroy();

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
};

// Crear usuario (admin)
export const create_user = async (req, res) => {
  try {
    const { nombre, email, password, telefono, direccion, role = 'user' } = req.body;

    // Validaciones
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido. Usar: user o admin'
      });
    }

    // Verificar si el usuario ya existe
    const existing_user = await user.findOne({ where: { email } });
    if (existing_user) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hash password
    const hashed_password = await bcrypt.hash(password, 12);

    const new_user = await user.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashed_password,
      telefono: telefono || null,
      direccion: direccion || null,
      role: role
    });

    // Obtener usuario sin password para respuesta
    const user_response = await user.findByPk(new_user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: user_response
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    });
  }
};

// Obtener estadísticas de usuarios (admin)
export const get_users_stats = async (req, res) => {
  try {
    const total_users = await user.count();
    const total_admins = await user.count({ where: { role: 'admin' } });
    const total_regular_users = await user.count({ where: { role: 'user' } });

    // Usuarios registrados por mes (últimos 6 meses)
    const six_months_ago = new Date();
    six_months_ago.setMonth(six_months_ago.getMonth() - 6);

    const users_by_month = await user.findAll({
      where: {
        created_at: {
          [Op.gte]: six_months_ago
        }
      },
      attributes: [
        [user.sequelize.fn('DATE_FORMAT', user.sequelize.col('created_at'), '%Y-%m'), 'month'],
        [user.sequelize.fn('COUNT', user.sequelize.col('id')), 'count']
      ],
      group: ['month'],
      order: [['month', 'ASC']],
      raw: true
    });

    // Usuarios más activos 
    const top_users = await user.findAll({
      attributes: [
        'id',
        'nombre',
        'email',
        [user.sequelize.fn('COUNT', user.sequelize.col('orders.id')), 'order_count'],
        [user.sequelize.fn('SUM', user.sequelize.col('orders.total')), 'total_spent']
      ],
      include: [{
        model: order,
        as: 'orders',
        attributes: [],
        required: false
      }],
      group: ['user.id'],
      order: [[user.sequelize.literal('order_count'), 'DESC']],
      limit: 5,
      raw: true,
      nest: true
    });

    res.json({
      success: true,
      stats: {
        total_users,
        total_admins,
        total_regular_users,
        users_by_month,
        top_users: top_users.map(u => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          order_count: parseInt(u.order_count) || 0,
          total_spent: parseFloat(u.total_spent) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas de usuarios'
    });
  }
};



export const promote_to_admin = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user_data = await user.findOne({ where: { email } });
    
    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Promover a admin
    await user_data.update({ role: 'admin' });

    res.json({
      success: true,
      message: `Usuario ${email} promovido a administrador`,
      user: {
        id: user_data.id,
        nombre: user_data.nombre,
        email: user_data.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error al promover usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al promover usuario'
    });
  }
};