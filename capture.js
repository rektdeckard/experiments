import * as FFmpeg from "./vendor/@ffmpeg/ffmpeg/dist/esm/index.js";
import * as FFmpegutil from "./vendor/@ffmpeg/util/dist/esm/index.js";

export class Capture {
  static saveAs(data, filename) {
    const url = typeof data === "string" ? data : URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  }

  static saveFrame(canvas, filename, options) {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error("Unable to create Blob from canvas");
        }
        Capture.saveAs(blob, filename);
      },
      options?.type,
      options?.quality,
    );
  }

  static saveFrames(canvas, tick, filename, options) {
    const { count = 100, blocking = false, ...frameOptions } = options;

    let t = performance.now();
    let f = 1;
    const fileType = frameOptions?.type?.split("/")[1] ?? "png";
    const currentFilename = filename ?? (() => `${f}.${fileType}`);

    if (blocking) {
      for (; f <= count; f++) {
        const dt = performance.now() - t;
        t += dt;

        tick(canvas, f, dt);
        Capture.saveFrame(canvas, currentFilename(f, dt), frameOptions);
      }
    } else {
      (function loop() {
        const dt = performance.now() - t;
        t += dt;

        tick(canvas, f, dt);
        Capture.saveFrame(canvas, currentFilename(f, dt), frameOptions);

        if (f >= count) return;
        f++;

        requestAnimationFrame(loop);
      })();
    }
  }

  static async saveVideo(canvas, tick, filename, options = {}) {
    const {
      count = 100,
      fps = 30,
      blocking = false,
      type = "mp4",
      ...frameOptions
    } = options;

    let t = performance.now();
    let f = 1;
    const fileType = type ?? "mp4";
    const fileName = filename ?? `output.${fileType}`;

    const ffmpeg = await (async () => {
      const BASE_URL =
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
      const ffmpeg = new FFmpeg.FFmpeg();
      await ffmpeg.load({
        coreURL: await FFmpegutil.toBlobURL(
          `${BASE_URL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await FFmpegutil.toBlobURL(
          `${BASE_URL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });
      return ffmpeg;
    })();

    async function writeFrame() {
      return new Promise((resolve, reject) => {
        canvas instanceof HTMLCanvasElement
          ? canvas.toBlob(
              async (blob) => {
                if (!blob) {
                  reject(new Error("Unable to create Blob from canvas"));
                }
                const data = await FFmpegutil.fetchFile(blob);
                await ffmpeg.writeFile(`${f}.png`, data);
                resolve();
              },
              "png",
              frameOptions.quality,
            )
          : (async () => {
              const blob = await canvas.convertToBlob(frameOptions);
              const data = await FFmpegutil.fetchFile(blob);
              await ffmpeg.writeFile(`${f}.png`, data);
              resolve();
            })();
      });
    }

    async function transcodeAndSave() {
      // ffmpeg -framerate 30 -start_number 1 -i %1d.png -c:v libx264 -pix_fmt yuv420p out.mp4
      await ffmpeg.exec([
        "-framerate",
        `${fps}`,
        "-start_number",
        "1",
        "-i",
        "%d.png",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        fileName,
      ]);
      const data = await ffmpeg.readFile(fileName);
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: `video/${fileType}` }),
      );
      Capture.saveAs(url, fileName);
    }

    if (blocking) {
      for (; f <= count; f++) {
        const dt = performance.now() - t;
        t += dt;

        tick(canvas, f, dt);
        await writeFrame();
      }
      await transcodeAndSave();
    } else {
      (async function loop() {
        const dt = performance.now() - t;
        t += dt;

        tick(canvas, f, dt);
        await writeFrame();

        if (f >= count) {
          await transcodeAndSave();
          return;
        }
        f++;

        requestAnimationFrame(loop);
      })();
    }
  }
}

window.Capture = Capture;
