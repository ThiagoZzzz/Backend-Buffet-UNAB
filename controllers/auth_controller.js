// controllers/auth_controller.js
import jwt from 'jsonwebtoken';
import { user } from '../models/index.js';
import bcrypt from 'bcryptjs';

const sign_token = (user_data) => {
  return jwt.sign(
    {
      id: user_data.id,
      email: user_data.email,
      role: user_data.role
    },
    process.env.JWT_SECRET || 'buffet-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

export const register = async (req, res) => {
  try {
    const { nombre, email, password, role } = req.body; 

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

    // PERMITIR ROL ADMIN 
    const new_user = await user.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashed_password,
      role: role || 'user'  
    });

    // Generar token
    const token = sign_token(new_user);


    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: new_user.id,
        nombre: new_user.nombre,
        email: new_user.email,
        role: new_user.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const user_data = await user.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });
    
    if (!user_data) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const is_password_valid = await bcrypt.compare(password, user_data.password);
    
    if (!is_password_valid) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token
    const token = sign_token(user_data);


    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user_data.id,
        nombre: user_data.nombre,
        email: user_data.email,
        role: user_data.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};


export const verify_token = async (req, res) => {
  try {
    const user_data = await user.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
      user: user_data
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar token'
    });
  }
};

// controllers/auth_controller.js 
export const change_password = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual y nueva son requeridas'
      });
    }

    const user_data = await user.findByPk(req.user.id);
    
    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
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

    // Actualizar contraseña
    const hashed_password = await bcrypt.hash(new_password, 12);
    await user_data.update({ password: hashed_password });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
};