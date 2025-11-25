// controllers/categories_controller.js
import { category, product } from '../models/index.js';
import { Op } from 'sequelize';

// Obtener todas las categorías
export const get_categories = async (req, res) => {
  try {
    const categories = await category.findAll({
      where: { activa: true },
      order: [['nombre', 'ASC']]
    });
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
};

// Obtener categoría por ID
export const get_category_by_id = async (req, res) => {
  try {
    const category_data = await category.findByPk(req.params.id, {
      include: [{
        model: product,
        as: 'products',
        where: { disponible: true },
        required: false
      }]
    });

    if (!category_data) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      category: category_data
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría'
    });
  }
};

// Obtener productos por categoría
export const get_products_by_category = async (req, res) => {
  try {
    const category_data = await category.findOne({
      where: { 
        [Op.or]: [
          { slug: req.params.slug },
          { id: req.params.slug }
        ],
        activa: true 
      }
    });

    if (!category_data) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const products = await product.findAll({
      where: {
        category_id: category_data.id,
        disponible: true
      },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      category: {
        id: category_data.id,
        nombre: category_data.nombre,
        slug: category_data.slug,
        imagen: category_data.imagen
      },
      products
    });
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
};

// Crear categoría (admin)
export const create_category = async (req, res) => {
  try {
    const { nombre, slug, imagen } = req.body;

    // Validaciones
    if (!nombre || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y slug son requeridos'
      });
    }

    // Verificar si ya existe
    const existing_category = await category.findOne({
      where: {
        [Op.or]: [
          { nombre },
          { slug }
        ]
      }
    });

    if (existing_category) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con este nombre o slug'
      });
    }

    const new_category = await category.create({
      nombre: nombre.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      imagen: imagen || '',
      activa: true
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      category: new_category
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    });
  }
};

// Actualizar categoría (admin)
export const update_category = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, slug, imagen, activa } = req.body;

    const category_data = await category.findByPk(id);
    
    if (!category_data) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar duplicados si se cambia nombre o slug
    if (nombre || slug) {
      const existing_category = await category.findOne({
        where: {
          [Op.or]: [
            { nombre: nombre || category_data.nombre },
            { slug: slug || category_data.slug }
          ],
          id: { [Op.ne]: id }
        }
      });

      if (existing_category) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra categoría con este nombre o slug'
        });
      }
    }

    const update_data = {};
    if (nombre) update_data.nombre = nombre.trim();
    if (slug) update_data.slug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    if (imagen !== undefined) update_data.imagen = imagen;
    if (activa !== undefined) update_data.activa = Boolean(activa);

    await category_data.update(update_data);

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      category: category_data
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    });
  }
};

// Eliminar categoría (admin)
export const delete_category = async (req, res) => {
  try {
    const { id } = req.params;

    const category_data = await category.findByPk(id);
    
    if (!category_data) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si hay productos asociados
    const product_count = await product.count({
      where: { category_id: id }
    });

    if (product_count > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${product_count} productos asociados. Desasocia los productos primero.`
      });
    }

    await category_data.destroy();

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    });
  }
};

// Desactivar categoría (admin) 
export const deactivate_category = async (req, res) => {
  try {
    const { id } = req.params;

    const category_data = await category.findByPk(id);
    
    if (!category_data) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    await category_data.update({ activa: false });

    res.json({
      success: true,
      message: 'Categoría desactivada exitosamente',
      category: category_data
    });
  } catch (error) {
    console.error('Error al desactivar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar categoría'
    });
  }
};