// middleware/validation.js
import { body, validationResult } from 'express-validator';

export const validate_register = [
  body('nombre')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede tener más de 50 caracteres')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede tener más de 100 caracteres'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .isLength({ max: 100 })
    .withMessage('La contraseña no puede tener más de 100 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    console.log('🔍 ERRORES ENCONTRADOS:', errors.array());
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => {
        console.log('💥 ERROR OBJECT:', err); 
        return {
          field: err.path || err.param || 'unknown',
          message: err.msg
        };
      });
      
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: formattedErrors
      });
    }
    next();
  }
];

export const validate_login = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

export const validate_profile_update = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede tener más de 50 caracteres')
    .escape(),
  body('telefono')
    .optional()
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede tener más de 20 caracteres')
    .escape(),
  body('direccion')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La dirección no puede tener más de 200 caracteres')
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

export const validate_category = [
  body('nombre')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede tener más de 50 caracteres')
    .escape(),
  body('slug')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El slug debe tener al menos 2 caracteres')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('El slug solo puede contener letras minúsculas, números y guiones')
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

export const validate_product = [
  body('nombre')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre del producto debe tener al menos 2 caracteres')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede tener más de 100 caracteres')
    .escape(),
  body('precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número mayor o igual a 0'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Debe enviar un ID de categoría válido'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede tener más de 500 caracteres')
    .escape(),
  body('disponible')
    .optional()
    .isBoolean()
    .withMessage('Disponible debe ser true o false'),
  body('destacado')
    .optional()
    .isBoolean()
    .withMessage('Destacado debe ser true o false'),
  body('promocion')
    .optional()
    .isBoolean()
    .withMessage('Promoción debe ser true o false'),
  body('precio_promocion')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio de promoción debe ser un número mayor o igual a 0'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

export const validate_order = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('El pedido debe contener al menos un producto'),
  body('items.*.producto')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('items.*.cantidad')
    .isInt({ min: 1, max: 50 })
    .withMessage('La cantidad debe ser entre 1 y 50'),
  body('metodo_pago')
    .optional()
    .isIn(['efectivo', 'tarjeta', 'qr'])
    .withMessage('Método de pago no válido. Usar: efectivo, tarjeta, qr'),
  body('notas')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden tener más de 500 caracteres')
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

export const validate_cart_item = [
  body('producto_id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('cantidad')
    .isInt({ min: 1, max: 50 })
    .withMessage('La cantidad debe ser entre 1 y 50'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

export const validate_user_role = [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Rol no válido. Usar: user o admin'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];