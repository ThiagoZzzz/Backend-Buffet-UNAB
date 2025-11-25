// routes/search.js 
import { Router } from "express";
import {
  search_products,
  quick_search,
  get_search_suggestions,
  get_search_filters
} from "../controllers/search_controller.js";

const router = Router();

// Rutas principales de búsqueda
router.get('/products', search_products);
router.get('/quick', quick_search);
router.get('/suggestions', get_search_suggestions);
router.get('/filters', get_search_filters);

export default router;
