// routes/cart.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  validate_cart,
  add_to_cart,
  remove_from_cart,
  update_cart_item,
  clear_cart,
  get_cart_summary
} from '../controllers/cart_controller.js';

const router = express.Router();

// Todas las rutas protegidas
router.use(protect);

// Definición de rutas 
router.post('/validate', validate_cart);
router.post('/add', add_to_cart);
router.post('/remove', remove_from_cart);
router.put('/update', update_cart_item);
router.delete('/clear', clear_cart);
router.post('/summary', get_cart_summary);

export default router;