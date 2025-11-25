// routes/auth.js 
import express from 'express';
import { 
  register, 
  login,
  verify_token,
  change_password
} from '../controllers/auth_controller.js';

import { protect } from '../middleware/auth.js';
import { validate_register, validate_login } from '../middleware/validation.js';

const router = express.Router();

// Rutas públicas
router.post('/register', validate_register, register);
router.post('/login', validate_login, login);

// Rutas protegidas
router.use(protect);
router.put('/change-password', change_password);
router.get('/verify', verify_token);


export default router;