//utilities/cart_utils.js
import { Product } from '../models/index.js'; 
export const calculate_cart_total = (items) => {
  return items.reduce((total, item) => {
    const price = item.promocion && item.precio_promocion 
      ? item.precio_promocion 
      : item.precio;
    return total + (price * item.cantidad);
  }, 0);
};

export const validate_cart_items = async (items) => {
  const validated_items = [];
  let total = 0;

  for (const item of items) {
    const product = await Product.findById(item.producto);
    
    if (!product) {
      throw new Error(`Producto no encontrado: ${item.producto}`);
    }
    
    if (!product.disponible) {
      throw new Error(`Producto no disponible: ${product.nombre}`);
    }

    const item_price = product.promocion && product.precio_promocion 
      ? product.precio_promocion 
      : product.precio;

    validated_items.push({
      producto: product._id,
      nombre: product.nombre,
      precio: item_price,
      cantidad: item.cantidad
    });

    total += item_price * item.cantidad;
  }

  return { validated_items, total };
};