// routes/admin.js 
import express from 'express';
import { protect, restrict_to } from '../middleware/auth.js';
import { 
  get_dashboard_stats, 
  get_recent_orders,
  get_all_users,
  get_all_products,
  get_advanced_stats
} from '../controllers/admin_controller.js';

// IMPORTAR funciones desde sus controladores correctos
import { get_user_by_id, delete_user, update_user_role } from '../controllers/user_controller.js';
import { get_order_stats } from '../controllers/order_controller.js';

const router = express.Router();

// Todas las rutas requieren ser admin
router.use(protect, restrict_to('admin'));

// ==================== DASHBOARD Y ESTADÍSTICAS ====================
router.get('/dashboard', get_dashboard_stats);
router.get('/stats/advanced', get_advanced_stats);

// ==================== GESTIÓN DE PEDIDOS ====================
router.get('/recent-orders', get_recent_orders);
router.get('/stats/orders', get_order_stats);    

// ==================== GESTIÓN DE USUARIOS ====================
router.get('/users', get_all_users);
router.get('/users/:id', get_user_by_id);        
router.put('/users/:id/role', update_user_role);
router.delete('/users/:id', delete_user);        

// ==================== GESTIÓN DE PRODUCTOS ====================
router.get('/products', get_all_products);

export default router;