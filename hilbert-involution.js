import KUTE from "https://cdn.jsdelivr.net/npm/kute.js@2.2.4/+esm";

window.KUTE = KUTE;

const FULL_INVOLUTION = false;

const INITIAL_STROKE_WIDTH = 3;
const INITIAL_STROKE_STYLE = "#000000";
const INITIAL_FILL_STYLE = "#FFFFFF";
const INITIAL_DURATION = 1000;
const INITIAL_DELAY = 0;
const INITIAL_EASING_METHOD = "easingCircularInOut";
const INVOLUTION_OPTS = {
  morphPrecision: 10,
  duration: INITIAL_DURATION,
  delay: INITIAL_DELAY,
  easing: KUTE.Easing[INITIAL_EASING_METHOD],
};

(function main() {
  const path = "#morph-t";
  const pathEl = document.querySelector(path);
  const svgEl = document.getElementById("x");
  const iters = FULL_INVOLUTION ? 7 : 6;
  let playing = false;
  let tween;
  let easing = KUTE.Easing[INITIAL_EASING_METHOD];
  let duration = INITIAL_DURATION;
  let delay = INITIAL_DELAY;
  let strokeStyle = "#000000";
  let fillStyle = "#FFFFFF";

  function init() {
    stopAll(tween);

    const opts = {
      ...INVOLUTION_OPTS,
      duration,
      delay,
      easing,
    };

    for (let i = 0; i <= iters; i++) {
      if (i === 0) {
        tween = KUTE.to(
          path,
          { path: `#morph-${i}` },
          {
            ...opts,
            onComplete: () => {
              playing = false;
            },
          }
        );
      } else {
        tween = KUTE.to(path, { path: `#morph-${i}` }, opts).chain(tween);
      }
    }
    for (let i = iters - 1; i >= 0; i--) {
      tween = KUTE.to(path, { path: `#morph-${i}` }, opts).chain(tween);
    }
  }

  function stopAll(parent) {
    if (!parent) return;
    if (parent._chain && parent._chain.length > 0) {
      for (const child of parent._chain) {
        stopAll(child);
      }
    }
    parent.stop();
  }

  function involute() {
    if (playing) {
      stopAll(tween);
      playing = false;
      return;
    }
    playing = true;
    tween.start();
  }

  svgEl.addEventListener("click", involute);
  window.addEventListener("keypress", (e) => {
    if (e.key === "q") {
      involute();
    }
  });

  const durationInput = document.getElementById("duration");
  durationInput.value = duration;
  durationInput.addEventListener("input", () => {
    duration = durationInput.valueAsNumber;
    init();
  });

  const delayInput = document.getElementById("delay");
  delayInput.value = delay;
  delayInput.addEventListener("input", () => {
    delay = delayInput.valueAsNumber;
    init();
  });

  const easingSelect = document.getElementById("easing");
  for (const method of Object.keys(KUTE.Easing)) {
    const opt = document.createElement("option");
    opt.value = method;
    opt.textContent = method;
    easingSelect.appendChild(opt);
  }
  easingSelect.value = INITIAL_EASING_METHOD;
  easingSelect.addEventListener("input", () => {
    easing = KUTE.Easing[easingSelect.value];
    init();
  });

  let lineWidthInput = document.getElementById("linewidth");
  lineWidthInput.value = INITIAL_STROKE_WIDTH;
  document.documentElement.style.setProperty(
    "--stroke-width",
    INITIAL_STROKE_WIDTH
  );
  lineWidthInput.addEventListener("input", () => {
    document.documentElement.style.setProperty(
      "--stroke-width",
      lineWidthInput.valueAsNumber
    );
  });

  const strokeStyleInput = document.getElementById("strokestyle");
  strokeStyleInput.value = INITIAL_STROKE_STYLE;
  document.documentElement.style.setProperty("--stroke", INITIAL_STROKE_STYLE);
  strokeStyleInput.addEventListener("input", () => {
    document.documentElement.style.setProperty(
      "--stroke",
      strokeStyleInput.value
    );
  });

  const fillStyleInput = document.getElementById("fillstyle");
  document.documentElement.style.setProperty("--fill", INITIAL_FILL_STYLE);
  fillStyleInput.value = fillStyle;
  fillStyleInput.addEventListener("input", () => {
    document.documentElement.style.setProperty("--fill", fillStyleInput.value);
  });

  const cropCheckbox = document.getElementById("crop");
  cropCheckbox.addEventListener("input", () => {
    pathEl.setAttribute(
      "transform",
      cropCheckbox.checked ? "scale(2), translate(-149, -299)" : ""
    );
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

  init();
})();
