// controllers/upload_controller.js
import path from "path";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary.js";

export const upload_product_image_controller = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se ha subido ningún archivo",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "buffet-unab/products",
    });

    res.json({
      success: true,
      message: "Imagen de producto subida correctamente",
      data: {
        url: result.secure_url, // URL pública de Cloudinary
        uploaded_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error en upload_product_image_controller:", error);
    res.status(500).json({
      success: false,
      message: "Error al subir la imagen del producto",
    });
  }
};

export const upload_user_avatar_controller = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se ha subido ningún archivo",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "buffet-unab/users",
    });

    res.json({
      success: true,
      message: "Avatar subido correctamente",
      data: {
        url: result.secure_url, // URL pública de Cloudinary
        uploaded_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error en upload_user_avatar_controller:", error);
    res.status(500).json({
      success: false,
      message: "Error al subir el avatar",
    });
  }
};

export const delete_file_controller = async (req, res) => {
  try {
    const { type, filename } = req.params;

    console.log(`🗑️ Solicitando eliminar: ${type}/${filename}`);

    const valid_types = ["products", "users", "categories"];
    if (!valid_types.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de archivo no válido",
      });
    }

    const { delete_file } = await import("../middleware/upload.js");
    const deleted = await delete_file(`${type}/${filename}`);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado o error al eliminar",
      });
    }

    res.json({
      success: true,
      message: "Archivo eliminado correctamente",
      deleted_file: {
        type: type,
        filename: filename,
      },
    });
  } catch (error) {
    console.error("❌ Error en delete_file_controller:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el archivo",
    });
  }
};

export const get_file_info_controller = async (req, res) => {
  try {
    const { type, filename } = req.params;

    console.log(`🔍 Solicitando info de: ${type}/${filename}`);

    const valid_types = ["products", "users", "categories"];
    if (!valid_types.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de archivo no válido",
      });
    }

    const file_path = path.join(process.cwd(), "uploads", type, filename);

    try {
      await fs.access(file_path);
    } catch {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado",
      });
    }

    const stats = await fs.stat(file_path);
    const fileUrl = `/uploads/${type}/${filename}`;
    const fullUrl = `${req.protocol}://${req.get("host")}${fileUrl}`;

    res.json({
      success: true,
      data: {
        file: {
          filename: filename,
          type: type,
          size: stats.size,
          created_at: stats.birthtime,
          modified_at: stats.mtime,
          path: fileUrl,
          url: fullUrl,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en get_file_info_controller:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener información del archivo",
    });
  }
};
