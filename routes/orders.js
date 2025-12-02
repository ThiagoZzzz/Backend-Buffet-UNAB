// routes/orders.js
import express from 'express';
import {
  create_order,
  get_user_orders,
  get_order_by_id,
  update_order_status,
  get_all_orders,
  delete_order,
  cancel_order,
  get_user_order_stats
} from '../controllers/order_controller.js';
import { protect, restrict_to } from '../middleware/auth.js';
import { validate_order } from '../middleware/validation.js';

const router = express.Router();

// Rutas protegidas para usuarios
router.use(protect);

// INTEGRAR validación en crear orden
router.post('/', validate_order, create_order);

// Obtener órdenes del usuario autenticado
router.get('/my-orders', get_user_orders);
router.get('/my-stats', get_user_order_stats);
router.get('/:id', get_order_by_id);
router.put('/:id/cancel', cancel_order);

// Rutas solo para admin
router.use(restrict_to('admin'));
router.get('/', get_all_orders);
router.put('/:id/status', update_order_status);
router.delete('/:id', delete_order);

export default router;