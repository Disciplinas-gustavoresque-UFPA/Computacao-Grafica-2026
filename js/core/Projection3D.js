/**
 * Projeta um vértice 3D para coordenadas 2D usando projeção isométrica.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {{ originX: number, originY: number, scale: number }} opts
 * @returns {{ x: number, y: number }}
 */
export function projectIsometric(x, y, z, { originX = 0, originY = 0, scale = 1 } = {}) {
  const angle = Math.PI / 6; // 30°
  const screenX = originX + (x - z) * Math.cos(angle) * scale;
  const screenY = originY + (x + z) * Math.sin(angle) * scale - y * scale;
  return { x: screenX, y: screenY };
}