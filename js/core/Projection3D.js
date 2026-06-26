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

/**
 * Projeta um vértice 3D para coordenadas 2D usando projeção em perspectiva.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {{ originX, originY, scale, fov }} opts
 * @returns {{ x: number, y: number }}
 */
export function projectPerspective(x, y, z, { originX = 0, originY = 0, scale = 1, fov = 500 } = {}) {
  const depth = fov / (fov + z * scale);
  return {
    x: originX + x * scale * depth,
    y: originY - y * scale * depth,
  };
}

/**
 * Calcula a normal de uma face a partir de 3 vértices projetados (2D).
 * Retorna o componente Z do produto vetorial — se negativo, a face está voltada para a câmera.
 * @param {{ x, y }} p0
 * @param {{ x, y }} p1
 * @param {{ x, y }} p2
 * @returns {number}
 */
export function computeFaceNormalZ(p0, p1, p2) {
  const ax = p1.x - p0.x, ay = p1.y - p0.y;
  const bx = p2.x - p0.x, by = p2.y - p0.y;
  return ax * by - ay * bx; // Z do produto vetorial
}