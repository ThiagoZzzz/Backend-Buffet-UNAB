// middleware/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorios si no existen 
const create_upload_dirs = async () => {
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/products'),
    path.join(__dirname, '../uploads/users'),
    path.join(__dirname, '../uploads/categories')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Directorio listo: ${dir}`);
    } catch (error) {
      
      if (error.code !== 'EEXIST') {
        console.error(`❌ Error creando directorio ${dir}:`, error.message);
      }
    }
  }
};

// Ejecutar al cargar el módulo
create_upload_dirs();

// Configuración de almacenamiento para productos
const product_storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, '../uploads/products');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const unique_suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safe_name = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
    const filename = 'product-' + unique_suffix + path.extname(safe_name);
    console.log(`📁 Guardando producto como: ${filename}`);
    cb(null, filename);
  }
});

// Configuración de almacenamiento para usuarios 
const user_storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, '../uploads/users');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const unique_suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'avatar-' + unique_suffix + path.extname(file.originalname);
    console.log(`📁 Guardando avatar como: ${filename}`);
    cb(null, filename);
  }
});

// Filtro de archivos 
const image_filter = (req, file, cb) => {
  const allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  console.log(`🔍 Verificando archivo: ${file.originalname}, tipo: ${file.mimetype}`);
  
  if (allowed_types.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten: JPEG, JPG, PNG, WebP, GIF`);
    console.error('❌ Error de tipo de archivo:', error.message);
    cb(error, false);
  }
};

// Instancias de upload para diferentes usos 
export const upload_product_image = multer({
  storage: product_storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter: image_filter 
});

export const upload_user_avatar = multer({
  storage: user_storage,
  limits: {
    fileSize: 2 * 1024 * 1024 
  },
  fileFilter: image_filter 
});

// Middleware para manejar errores de Multer 
export const handle_upload_error = (err, req, res, next) => {
  console.error('❌ Error en handle_upload_error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Límite: 5MB para productos, 2MB para avatares'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo incorrecto. Use "image" para productos o "avatar" para usuarios'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos subidos'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Función para eliminar archivos 
export const delete_file = async (file_path) => {
  try {
    const full_path = path.join(__dirname, '../uploads', file_path);
    
    // Verificar si el archivo existe
    try {
      await fs.access(full_path);
    } catch {
      console.log(`⚠️ Archivo no encontrado: ${file_path}`);
      return false;
    }
    
    // Eliminar archivo
    await fs.unlink(full_path);
    console.log(`🗑️ Archivo eliminado: ${file_path}`);
    return true;
  } catch (error) {
    console.error(`❌ Error eliminando archivo ${file_path}:`, error.message);
    return false;
  }
};