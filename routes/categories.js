// routes/categories.js 
import express from 'express';
import { 
  get_categories,
  get_products_by_category,
  create_category,
  update_category,
  delete_category
} from '../controllers/categories_controller.js';
import { protect, restrict_to } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', get_categories);
router.get('/:slug/products', get_products_by_category);

// Rutas protegidas (solo admin)
router.post('/', protect, restrict_to('admin'), create_category);
router.put('/:id', protect, restrict_to('admin'), update_category);
router.delete('/:id', protect, restrict_to('admin'), delete_category);

export default router;