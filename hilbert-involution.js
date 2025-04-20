import KUTE from "https://cdn.jsdelivr.net/npm/kute.js@2.2.4/+esm";

const FULL_INVOLUTION = false;
const INVOLUTION_OPTS = {
  duration: 1000,
  easing: KUTE.Easing.easingCircularInOut,
};

(function main() {
  const path = "#morph-t";
  const x = document.getElementById("x");
  const iters = FULL_INVOLUTION ? 7 : 6;
  let playing = false;
  let tween;
  let strokeStyle = "#000000";
  let fillStyle = "#FFFFFF";

  for (let i = 0; i <= iters; i++) {
    if (i === 0) {
      tween = KUTE.to(
        path,
        { path: `#morph-${i}` },
        {
          ...INVOLUTION_OPTS,
          onComplete: () => {
            playing = false;
          },
        }
      );
    } else {
      tween = KUTE.to(path, { path: `#morph-${i}` }, INVOLUTION_OPTS).chain(
        tween
      );
    }
  }
  for (let i = iters - 1; i >= 0; i--) {
    tween = KUTE.to(path, { path: `#morph-${i}` }, INVOLUTION_OPTS).chain(
      tween
    );
  }

  function stopAll(parent) {
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

  x.addEventListener("click", involute);
  window.addEventListener("keypress", (e) => {
    if (e.key === "q") {
      involute();
    }
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
})();
