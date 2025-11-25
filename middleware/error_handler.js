// middleware/error_handler.js
export const error_handler = (err, req, res, next) => {
  // Inicializar objeto de error
  let error = {
    message: err.message || 'Error interno del servidor',
    status_code: err.status_code || 500
  };

  // Log completo para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 [ERROR HANDLER] ==========');
    console.error('Tipo:', err.name);
    console.error('Mensaje:', err.message);
    console.error('Stack:', err.stack);
    console.error('URL:', req.originalUrl);
    console.error('Método:', req.method);
    console.error('Body:', req.body);
    console.error('🔴 =========================');
  } else {
    // Log simplificado para producción
    console.error('❌ Error:', {
      name: err.name,
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      status_code: error.status_code
    });
  }

  // ==================== SEQUELIZE ERRORS ====================
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    error = {
      message: `Errores de validación: ${messages.join(', ')}`,
      status_code: 400,
      details: process.env.NODE_ENV === 'development' ? err.errors : undefined
    };
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    error = {
      message: `Ya existe un registro con este ${field}`,
      status_code: 409, 
      field: process.env.NODE_ENV === 'development' ? field : undefined
    };
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = {
      message: 'No se puede completar la operación debido a restricciones de referencia',
      status_code: 400
    };
  }

  if (err.name === 'SequelizeDatabaseError') {
    error = {
      message: 'Error en la base de datos',
      status_code: 500
    };
  }

  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    error = {
      message: 'Error de conexión con la base de datos. Intente nuevamente.',
      status_code: 503 
    };
  }

  if (err.name === 'SequelizeTimeoutError') {
    error = {
      message: 'Timeout en la operación de base de datos',
      status_code: 408 
    };
  }

  // ==================== JWT ERRORS ====================
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Token de autenticación inválido',
      status_code: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token de autenticación expirado',
      status_code: 401
    };
  }

  // ==================== MULTER ERRORS (FILE UPLOAD) ====================
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'El archivo es demasiado grande',
      status_code: 413 
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Tipo de archivo no permitido o campo incorrecto',
      status_code: 400
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      message: 'Demasiados archivos',
      status_code: 400
    };
  }

  if (err.code === 'LIMIT_PART_COUNT') {
    error = {
      message: 'Demasiadas partes en el formulario',
      status_code: 400
    };
  }

  // ==================== COMMON ERRORS ====================
  if (err.name === 'CastError' || err.name === 'SequelizeCastError') {
    error = {
      message: 'Formato de ID inválido',
      status_code: 400
    };
  }

  if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    error = {
      message: 'JSON con formato inválido en el cuerpo de la solicitud',
      status_code: 400
    };
  }

  // ==================== CUSTOM ERRORS ====================
  if (err.status_code && err.message) {
    
    error = {
      message: err.message,
      status_code: err.status_code
    };
  }

  // ==================== RESPONSE ====================
  const response = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error_type: err.name,
      details: error.details
    })
  };

  // Headers 
  if (res.headersSent) {
    return next(err);
  }

  res.status(error.status_code).json(response);
};

// Middleware para rutas no encontradas (404)
export const not_found = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.status_code = 404;
  next(error);
};

// Middleware para métodos no permitidos (405)
export const method_not_allowed = (req, res, next) => {
  const error = new Error(`Método ${req.method} no permitido para ${req.originalUrl}`);
  error.status_code = 405;
  next(error);
};