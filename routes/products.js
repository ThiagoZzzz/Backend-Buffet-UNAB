// routes/products.js
import express from "express";
import { 
  get_products,
  get_product_by_id,
  get_product_categories,
  create_product,
  update_product,
  delete_product
} from "../controllers/product_controller.js";

import { protect, restrict_to } from "../middleware/auth.js";
import { upload_product_image, handle_upload_error } from "../middleware/upload.js";
import { validate_product } from "../middleware/validation.js";

const router = express.Router();

// -----------------------------------------------------------
// RUTAS PÚBLICAS
// -----------------------------------------------------------
router.get("/", get_products);
router.get("/categories", get_product_categories);
router.get("/:id", get_product_by_id);

// -----------------------------------------------------------
// RUTAS PROTEGIDAS SOLO PARA ADMIN
// -----------------------------------------------------------

// Aplica protect + restrict_to("admin") 
router.use(protect);
router.use(restrict_to("admin"));

// Crear producto
router.post(
  "/",
  upload_product_image.single("imagen"),
  handle_upload_error,
  validate_product,
  create_product
);

// Actualizar producto
router.put(
  "/:id",
  upload_product_image.single("imagen"),
  handle_upload_error,
  validate_product,
  update_product
);

// Eliminar producto
router.delete("/:id", delete_product);

export default router;
