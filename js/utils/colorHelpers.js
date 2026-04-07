const COLOR_COMPONENTS_REGEX = /\d+/g;

/**
 * Coverte uma string de cor RGB dos formatos
 * - rgb(0, 0, 0)
 * - (0, 0, 0)
 *
 * Para o formato hexadecimal #000000
 *
 * @param {string} rgb
 */
export function rgbToHex(rgb) {
  const colorComponents = Array.from(
    rgb.matchAll(COLOR_COMPONENTS_REGEX),
  ).flatMap((match) => parseInt(match[0]));
  const colorComponentsHex = colorComponents.map((color) =>
    color.toString(16).padStart(2, "0"),
  );
  const hexString = `#${colorComponentsHex.join("")}`;
  return hexString;
}
