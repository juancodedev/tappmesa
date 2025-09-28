/**
 * Convierte un color hex a RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calcula la luminancia relativa de un color RGB
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula la relación de contraste entre dos colores
 */
function getContrastRatio(rgb1, rgb2) {
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Determina si el texto debe ser blanco o negro basado en el color de fondo
 * Retorna 'white' o 'black'
 */
export function getOptimalTextColor(backgroundColor) {
  if (!backgroundColor) return 'white';

  // Remover # si existe
  const hex = backgroundColor.replace('#', '');

  // Convertir a RGB
  const rgb = hexToRgb(`#${hex}`);
  if (!rgb) return 'white'; // Fallback si no se puede parsear

  // Colores de referencia
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  // Calcular contraste con blanco y negro
  const contrastWithWhite = getContrastRatio(rgb, white);
  const contrastWithBlack = getContrastRatio(rgb, black);

  // Retornar el color que proporcione mayor contraste
  return contrastWithWhite > contrastWithBlack ? 'white' : 'black';
}

/**
 * Obtiene las clases de Tailwind para el color de texto óptimo
 */
export function getOptimalTextClass(backgroundColor) {
  const optimalColor = getOptimalTextColor(backgroundColor);
  return optimalColor === 'white' ? 'text-white' : 'text-black';
}