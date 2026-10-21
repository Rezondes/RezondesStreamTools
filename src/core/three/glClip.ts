// 3D clips (plans/PLAN-GRAFIK.md, package 4): turns a Vanilla-Three.js scene into the draw function of RenderClip
// (src/core/renderClip.ts). The scene is built once, update(time) sets it fully from the time (rule 21), the frame is
// rendered on an own WebGL canvas and copied into the 2D context. After the last frame of the render everything is freed;
// a later draw (preview) builds it again.
import { type Camera, type Scene, WebGLRenderer } from "three";

export type GlSetup = { scene: Scene; camera: Camera; update: (time: number) => void; dispose?: () => void };
export type GlRenderer = { canvas: CanvasImageSource; render: (scene: Scene, camera: Camera) => void; dispose: () => void };
export type ClipFrame = { width: number; height: number; duration: number; fps: number };

function webgl(width: number, height: number): GlRenderer {
  const canvas = document.createElement("canvas");
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  return {
    canvas,
    render: (scene, camera) => renderer.render(scene, camera),
    dispose: () => { renderer.dispose(); renderer.forceContextLoss(); },
  };
}

// Small tolerance so the time of the last frame (index / fps) counts as last despite rounding
const EPSILON = 1e-6;

export function glClip(frame: ClipFrame, setup: () => GlSetup, makeRenderer: (width: number, height: number) => GlRenderer = webgl) {
  const last = (Math.round(frame.duration * frame.fps) - 1) / frame.fps;
  let current: { renderer: GlRenderer; built: GlSetup } | null = null;
  return (context: CanvasRenderingContext2D, time: number) => {
    current ??= { renderer: makeRenderer(frame.width, frame.height), built: setup() };
    current.built.update(time);
    current.renderer.render(current.built.scene, current.built.camera);
    context.drawImage(current.renderer.canvas, 0, 0, frame.width, frame.height);
    if (time >= last - EPSILON) {
      current.built.dispose?.();
      current.renderer.dispose();
      current = null;
    }
  };
}
