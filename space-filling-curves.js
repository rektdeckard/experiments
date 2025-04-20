import Two from "https://cdn.jsdelivr.net/npm/two.js@0.8.17/+esm";

const ITER_MAX = 6;
const START_RULESET = "Hilbert";

const TWO_PARAMS = {
  type: Two.Types.svg,
  domElement: document.getElementById("twosvg"),
  width: 600,
  height: 600,
  autostart: false,
};

/**
 * @typedef {Object} RuleSet
 * @property {string} axiom - The starting string axiom
 * @property {Object.<string, string>} rules - The L-System rules
 * @property {{ draw?: string[], move?: string[] }} [defs] - The optional command definitions
 * @property {number} angle - The turning angle in degrees
 * @property {boolean} [closed] - Whether the curve is closed or not
 * @property {number} [heading] - The initial heading in degrees
 * @property {number} iterMax - The maximum number of iterations
 * @property {{ x?: number, y?: number }} [pos] - The starting position
 * @property {(i: number) => number} [scaleFactor] - The scaling factor for each iteration
 */

/**
 * @type {Object.<string, RuleSet>}
 */
const RULESETS = {
  Dragon: {
    axiom: "FX",
    rules: {
      F: "F+G",
      G: "F-G",
    },
    defs: { draw: ["F", "G"] },
    angle: 90,
    iterMax: 13,
    pos: {
      x: 1 / 2,
      y: 1 / 3,
    },
    scaleFactor: () => 60,
  },
  Gosper: {
    axiom: "A",
    rules: {
      A: "A-B--B+A++AA+B-",
      B: "+A-BB--B-A++A+B",
    },
    defs: { draw: ["A", "B"] },
    angle: 60,
    iterMax: 6,
    pos: {
      x: 1 / 2,
      y: 2 / 3,
    },
    scaleFactor: (i) => 2 * 3 ** i,
  },
  Hilbert: {
    axiom: "X",
    rules: {
      X: "+YF-XFX-FY+",
      Y: "-XF+YFY+FX-",
    },
    angle: 90,
    iterMax: 8,
    scaleFactor: (i) => 2 ** i - 1,
  },
  "Kit Wallace": {
    // https://x.com/kitwallace/status/1190917301010391045
    axiom: "F--XF--F--XF",
    rules: { X: "XF+F+XF--F--XF+F+X" },
    angle: 45,
    closed: true,
    iterMax: 8,
    pos: {
      x: 0.49,
      y: 0.99,
    },
    scaleFactor: (i) => 4 * 2 ** i - 1,
  },
  "Koch Snowflake": {
    axiom: "F",
    rules: { F: "F-F++F-F" },
    angle: 60,
    iterMax: 8,
    scaleFactor: (i) => 3 * 3 ** (i - 1),
    pos: { y: 2 / 3 },
  },
  "Koch Island": {
    axiom: "F-F-F-F",
    rules: { F: "F+F-F-FF+F+F-F" },
    angle: 90,
    closed: true,
    iterMax: 6,
    pos: { y: 1 / 2 },
    scaleFactor: (i) => 3 ** i,
  },
  "Koch Quadratic": {
    axiom: "F",
    rules: { F: "F-F+F+F-F" },
    angle: 90,
    iterMax: 8,
    pos: { y: 2 / 3 },
    scaleFactor: (i) => 3 * 3 ** (i - 1),
  },
  Levy: {
    axiom: "F",
    rules: { F: "+F--F+" },
    angle: 45,
    iterMax: 10,
    // scaleFactor: (i) => (Math.pow(2, Math.floor((i + 1) / 2) + 1) - 2) * Math.pow(Math.SQRT2, i % 2),
    pos: {
      x: 1 / 3,
      y: 1 / 2,
    },
    scaleFactor: (i) => i ** 2,
  },
  "Peano Basic": {
    axiom: "F",
    rules: { F: "F+F-F-F-F+F+F+F-F" },
    angle: 90,
    iterMax: 5,
    pos: { y: 1 / 2 },
    scaleFactor: (i) => 3 ** i,
  },
  Peano: {
    axiom: "X",
    rules: {
      X: "XFYFX+F+YFXFY-F-XFYFX",
      Y: "YFXFY-F-XFYFX+F+YFXFY",
    },
    angle: 90,
    heading: 0,
    iterMax: 5,
    scaleFactor: (i) => 3 ** i - 1,
  },
  "Sierpinski Triangle": {
    axiom: "F-G-G",
    rules: {
      F: "F-G+F+G-F",
      G: "GG",
    },
    defs: { draw: ["F", "G"] },
    angle: 120,
    closed: true,
    heading: 0,
    iterMax: 8,
    pos: { y: 0.9 },
    scaleFactor: (i) => 2 ** i,
  },
  "Sierpinski Arrowhead": {
    axiom: "A",
    rules: {
      A: "B-A-B",
      B: "A+B+A",
    },
    defs: { draw: ["A", "B"] },
    angle: 60,
    heading: 0,
    iterMax: 10,
    pos: {
      x: 1 / 4,
      y: 1 / 2,
    },
    scaleFactor: (i) => 2 * 2 ** i,
  },
};

class LSystem {
  constructor({
    two,
    ruleset = RULESETS[START_RULESET],
    lineWidth = 1,
    strokeStyle = "white",
  } = {}) {
    this.two = two;
    this.ruleset = ruleset;
    this.angle = (this.ruleset.heading || 0) * (Math.PI / 180);
    this.lineWidth = lineWidth;
    this.strokeStyle = strokeStyle;
    this.curved = false;
    this.x = (this.ruleset.pos?.x || 0) * this.two.width + lineWidth / 2;
    this.y = (this.ruleset.pos?.y || 0) * this.two.height + lineWidth / 2;
  }

  setRuleset(ruleset) {
    this.ruleset = ruleset;
    this.angle = (this.ruleset.heading || 0) * (Math.PI / 180);
    this.x = (this.ruleset.pos?.x || 0) * this.two.width + this.lineWidth / 2;
    this.y = (this.ruleset.pos?.y || 0) * this.two.height + this.lineWidth / 2;
  }

  setLineWidth(lineWidth) {
    this.lineWidth = lineWidth;
  }

  setCurved(curved) {
    this.curved = curved;
  }

  reset() {
    this.x = (this.ruleset.pos?.x || 0) * this.two.width + this.lineWidth / 2;
    this.y = (this.ruleset.pos?.y || 0) * this.two.height + this.lineWidth / 2;
    this.angle = (this.ruleset.heading || 0) * (Math.PI / 180);
  }

  rewrite(iter) {
    let str = this.ruleset.axiom;
    for (let i = 0; i < Math.min(this.ruleset.iterMax || ITER_MAX, iter); i++) {
      let tmp = "";
      for (const ch of [...str]) {
        const rule = this.ruleset.rules[ch];
        if (rule) {
          tmp += rule;
        } else {
          tmp += ch;
        }
      }
      str = tmp;
    }
    return str;
  }

  execute(iterations) {
    this.two.clear();

    const points = [];

    for (const c of this.rewrite(iterations)) {
      const draw = this.ruleset.defs?.draw || ["F"];
      const move = this.ruleset.defs?.move || ["M"];

      if (draw.includes(c)) {
        if (points.length === 0) {
          points.push(this.firstPoint());
        }
        points.push(this.nextPoint(iterations));
      } else if (move.includes(c)) {
        this.move(iterations);
        this.renderPath(points);
        points = [];
      } else if (c === "+") {
        this.turn(this.ruleset.angle * (Math.PI / 180));
      } else if (c === "-") {
        this.turn(-this.ruleset.angle * (Math.PI / 180));
      }
    }

    if (points.length > 1) {
      this.renderPath(points);
    }
    this.two.update();
  }

  renderPath(points) {
    const path = new Two.Path(points, false);
    path.stroke = "var(--stroke)";
    path.fill = "transparent";
    path.linewidth = this.lineWidth;
    path.cap = "round";
    path.join = "round";
    path.curved = this.curved;
    path.closed = !!this.ruleset.closed;
    this.two.add(path);
  }

  firstPoint() {
    return new Two.Anchor(this.x, this.y);
  }

  nextPoint(iterations) {
    const factor = this.ruleset.scaleFactor?.(iterations) || iterations;
    const domain =
      Math.min(this.two.width, this.two.height) - this.lineWidth - 2;
    const x = this.x + (Math.cos(this.angle) * domain) / factor;
    const y = this.y + (Math.sin(this.angle) * domain) / factor;
    const a = new Two.Anchor(x, y);
    this.x = x;
    this.y = y;
    return a;
  }

  move(iterations) {
    const factor = this.ruleset.scaleFactor?.(iterations) || iterations;
    const domain =
      Math.min(this.two.width, this.two.height) - this.lineWidth - 2;
    const x = this.x + (Math.cos(this.angle) * domain) / factor;
    const y = this.y + (Math.sin(this.angle) * domain) / factor;
    this.x = x;
    this.y = y;
  }

  turn(angle) {
    this.angle = this.angle + (angle % (2 * Math.PI));
  }
}

(function main() {
  let iterations = 3;
  let lineWidth = 4;
  let strokeStyle = "#000000";
  let fillStyle = "#FFFFFF";
  let smoothing = false;
  let curve = RULESETS[START_RULESET];

  let speed = 10;
  let easing = "ease-in-out";

  const lsystem = new LSystem({
    two: new Two(TWO_PARAMS),
    rules: curve,
    strokeStyle,
    lineWidth,
  });

  let rulesetSelect = document.getElementById("ruleset");
  for (const name of Object.keys(RULESETS)) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    rulesetSelect.appendChild(option);
  }
  rulesetSelect.value = START_RULESET;
  rulesetSelect.addEventListener("input", () => {
    curve = RULESETS[rulesetSelect.value];
    iterationsInput.max = curve.iterMax || ITER_MAX;

    if (curve.iterMax && curve.iterMax !== iterationsInput.max) {
      iterationsInput.max = curve.iterMax;
      iterationsInput.value = Math.min(iterations, curve.iterMax);
      iterations = parseInt(iterationsInput.value);
    }

    lsystem.setRuleset(curve);
    lsystem.execute(iterations);
  });

  let iterationsInput = document.getElementById("iterations");
  iterationsInput.value = iterations;
  iterationsInput.max = curve.iterMax || ITER_MAX;
  iterationsInput.addEventListener("input", () => {
    iterations = parseInt(iterationsInput.value);
    lsystem.reset();
    lsystem.execute(iterations);
  });

  let lineWidthInput = document.getElementById("linewidth");
  lineWidthInput.value = lineWidth;
  lineWidthInput.addEventListener("input", () => {
    lineWidth = parseInt(lineWidthInput.value);
    document.documentElement.style.setProperty("--stroke-width", lineWidth);
    lsystem.setLineWidth(lineWidth);
    lsystem.reset();
    lsystem.execute(iterations);
  });

  let strokeStyleInput = document.getElementById("strokestyle");
  strokeStyleInput.value = strokeStyle;
  document.documentElement.style.setProperty("--stroke", strokeStyle);
  strokeStyleInput.addEventListener("input", () => {
    strokeStyle = strokeStyleInput.value;
    document.documentElement.style.setProperty("--stroke", strokeStyle);
  });

  let fillStyleInput = document.getElementById("fillstyle");
  document.documentElement.style.setProperty("--fill", fillStyle);
  fillStyleInput.value = fillStyle;
  fillStyleInput.addEventListener("input", () => {
    fillStyle = fillStyleInput.value;
    document.documentElement.style.setProperty("--fill", fillStyle);
  });

  function randomizecolor() {
    function byteStr() {
      return Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
    }
    const fill = `#${byteStr()}${byteStr()}${byteStr()}`;
    fillStyleInput.value = fill;
    fillStyle = fill;
    const stroke = `#${byteStr()}${byteStr()}${byteStr()}`;
    strokeStyleInput.value = stroke;
    strokeStyle = stroke;

    document.documentElement.style.setProperty("--stroke", strokeStyle);
    document.documentElement.style.setProperty("--fill", fillStyle);
  }
  const randomButton = document.getElementById("randomizebtn");
  randomButton.addEventListener("click", randomizecolor);
  window.addEventListener("keypress", (e) => {
    if (e.key === "c") {
      randomizecolor();
    }
  });

  const smoothingCheckbox = document.getElementById("smoothing");
  smoothingCheckbox.checked = smoothing;
  smoothingCheckbox.addEventListener("input", () => {
    smoothing = smoothingCheckbox.checked;
    lsystem.setCurved(smoothing);
    lsystem.reset();
    lsystem.execute(iterations);
  });

  const copyButton = document.getElementById("copybtn");
  copyButton.addEventListener("click", () => {
    const svg = document.getElementById("twosvg");
    navigator.clipboard.writeText(svg.outerHTML).then(() => {
      console.log("Copied to clipboard:", svg.outerHTML);
    });
  });

  const saveButton = document.getElementById("savebtn");
  saveButton.addEventListener("click", () => {
    const svg = document.getElementById("twosvg");
    const filename = rulesetSelect.value + "-" + iterations + ".svg";
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  });

  function walkSVGPaths(svg) {
    svg.querySelectorAll("path").forEach((path) => {
      const length = path.getTotalLength();
      path.style.transition = `stroke-dashoffset ${Math.floor(length) / speed}ms ${easing}`;

      if (path.dataset.walked !== "true") {
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        path.dataset.walked = "true";
      } else {
        path.style.strokeDashoffset = 0;
        path.dataset.walked = "false";
      }
    });
  }

  const svg = document.getElementById("twosvg");
  svg.addEventListener("click", () => walkSVGPaths(svg));

  window.addEventListener("keypress", (e) => {
    if (e.key === "w") {
      walkSVGPaths(svg);
    }
  });

  const easingSelect = document.getElementById("easing");
  easingSelect.value = easing;
  easingSelect.addEventListener("input", () => {
    easing = easingSelect.value;
  });

  const speedInput = document.getElementById("speed");
  speedInput.value = speed;
  speedInput.addEventListener("input", () => {
    speed = parseInt(speedInput.value);
  });

  lsystem.execute(iterations);
})();
