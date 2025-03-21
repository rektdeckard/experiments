export class SVGRenderer {
  constructor(container) {
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", container.clientWidth);
    this.svg.setAttribute("height", container.clientHeight);
    container.appendChild(this.svg);
    this.instructions = [];
    this.strokeStyle = "black";
    this.fillStyle = "none";
    this.lineWidth = 1;
  }

  setStrokeStyle(color) {
    this.strokeStyle = color;
  }

  setFillStyle(color) {
    this.fillStyle = color;
  }

  setLineWidth(width) {
    this.lineWidth = width;
  }

  moveTo(x, y) {
    this.instructions.push({ type: "move", x, y });
  }

  lineTo(x, y) {
    this.instructions.push({ type: "line", x, y });
  }

  arc(cx, cy, r, startAngle, endAngle) {
    this.instructions.push({ type: "arc", cx, cy, r, startAngle, endAngle });
  }

  render() {
    this.clear();
    let pathData = "";
    this.instructions.forEach((inst) => {
      if (inst.type === "move") {
        pathData += `M ${inst.x} ${inst.y} `;
      } else if (inst.type === "line") {
        pathData += `L ${inst.x} ${inst.y} `;
      } else if (inst.type === "arc") {
        const startX = inst.cx + inst.r * Math.cos(inst.startAngle);
        const startY = inst.cy + inst.r * Math.sin(inst.startAngle);
        const endX = inst.cx + inst.r * Math.cos(inst.endAngle);
        const endY = inst.cy + inst.r * Math.sin(inst.endAngle);
        const largeArcFlag = inst.endAngle - inst.startAngle > Math.PI ? 1 : 0;
        pathData += `M ${startX} ${startY} A ${inst.r} ${inst.r} 0 ${largeArcFlag} 1 ${endX} ${endY} `;
      }
    });

    console.log(pathData);
    if (pathData) {
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute("d", pathData.trim());
      path.setAttribute("stroke", this.strokeStyle);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", this.lineWidth);
      this.svg.appendChild(path);
    }
  }

  clear() {
    this.svg.innerHTML = "";
    this.instructions = [];
  }
}

export class CanvasRenderer {
  constructor(container) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.instructions = [];
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "none";
    this.ctx.lineWidth = 1;
  }

  setStrokeStyle(color) {
    this.ctx.strokeStyle = color;
  }

  setFillStyle(color) {
    this.ctx.fillStyle = color;
  }

  setLineWidth(width) {
    this.ctx.lineWidth = width;
  }

  moveTo(x, y) {
    this.instructions.push({ type: "move", x, y });
  }

  lineTo(x, y) {
    this.instructions.push({ type: "line", x, y });
  }

  arc(cx, cy, r, startAngle, endAngle) {
    this.instructions.push({ type: "arc", cx, cy, r, startAngle, endAngle });
  }

  render() {
    this.clear();
    this.ctx.beginPath();
    this.instructions.forEach((inst) => {
      if (inst.type === "move") {
        this.ctx.moveTo(inst.x, inst.y);
      } else if (inst.type === "line") {
        this.ctx.lineTo(inst.x, inst.y);
      } else if (inst.type === "arc") {
        this.ctx.arc(inst.cx, inst.cy, inst.r, inst.startAngle, inst.endAngle);
      }
    });
    this.ctx.stroke();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.instructions = [];
  }
}
