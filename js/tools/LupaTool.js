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
    };
  }

}


