// routes/upload.js 
import express from 'express';

import { 
  upload_product_image, 
  upload_user_avatar,
  handle_upload_error 
} from '../middleware/upload.js';
import {
  upload_product_image_controller,
  upload_user_avatar_controller,
  delete_file_controller,
  get_file_info_controller
} from '../controllers/upload_controller.js';
import { protect, restrict_to } from '../middleware/auth.js';

const router = express.Router();

// Upload de imagen de producto (solo admin)
router.post(
  '/products',
  protect,
  restrict_to('admin'),
  upload_product_image.single('image'), 
  handle_upload_error,
  upload_product_image_controller
);

// Upload de avatar de usuario (usuario autenticado)
router.post(
  '/users/avatar',
  protect,
  upload_user_avatar.single('avatar'), 
  handle_upload_error,
  upload_user_avatar_controller
);

// Eliminar archivo (requiere auth)
router.delete(
  '/:type/:filename',
  protect,
  delete_file_controller
);

// Obtener información de archivo (público)
router.get(
  '/:type/:filename',
  get_file_info_controller
);

export default router;