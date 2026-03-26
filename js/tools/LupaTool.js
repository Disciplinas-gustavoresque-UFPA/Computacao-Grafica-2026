import { ToolBase } from './ToolBase.js';

export class LupaTool extends ToolBase {
  constructor(svg) {
    super();
    this.svg = svg;
    this.viewBox = {
      x: 0,
      y: 0,
      width: svg.clientWidth,
      height: svg.clientHeight
    }; // <-- criar viewBox
  } // <-- construtor
  
  applyViewBox() {
    const {
      x,
      y,
      width,
      height
    } = this.viewBox;
    this.svg.setAttribute('viewBox','${x} ${y} ${width} ${height}');
  } // <-- aplicar viewBox
} // <-- classe LupaTool


