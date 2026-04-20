/**
 * Servicio para gestión de archivos en Supabase Storage
 */
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

export const storageService = {
  /**
   * Sube un archivo a un bucket específico
   */
  async uploadFile(bucket, path, file) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error(`Error uploading to ${bucket}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene la URL pública de un archivo
   */
  getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  /**
   * Elimina un archivo
   */
  async deleteFile(bucket, path) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error(`Error deleting from ${bucket}:`, error);
      return { success: false, error: error.message };
    }
  }
};
