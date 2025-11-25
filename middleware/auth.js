// middleware/auth.js
import jwt from 'jsonwebtoken';
import { user } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Obtener token del header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Verificar si existe token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token de autenticación requerido.'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Usar nombre diferente para evitar conflicto
    const user_data = await user.findByPk(decoded.id, {
      attributes: { exclude: ['password'] } 
    });
    
    if (!user_data) {
      return res.status(401).json({
        success: false,
        message: 'Token válido pero el usuario ya no existe'
      });
    }
    
    
    
    req.user = user_data;
    next();
    
  } catch (error) {
    // Manejo específico de errores de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación expirado'
      });
    }
    
    // Error general
    console.error('Error en middleware de autenticación:', error);
    return res.status(401).json({
      success: false,
      message: 'Error de autenticación'
    });
  }
};

export const restrict_to = (...roles) => {
  return (req, res, next) => {
    // Verificar que el usuario está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }
    
    // Verificar roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requieren los roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

// Middleware opcional: para rutas que pueden ser públicas o privadas
export const optional_auth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user_data = await user.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });
        
        if (user_data) {
          req.user = user_data;
        }
      }
    }
    
    next();
  } catch (error) {
    
    next();
  }
};