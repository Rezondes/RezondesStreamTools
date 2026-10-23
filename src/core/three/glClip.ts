// 3D clips (plans/PLAN-GRAFIK.md, package 4): turns a Vanilla-Three.js scene into the draw function of RenderClip
// (src/core/renderClip.ts). The scene is built once, update(time) sets it fully from the time (rule 21), the frame is
// rendered on an own WebGL canvas and copied into the 2D context. After the last frame of the render everything is freed;
// a later draw (preview) builds it again. The setup gets the renderer, so it can light its scene with an environment
// made from a scene (a physical sky) like the scenes do.
import { ACESFilmicToneMapping, type Camera, PMREMGenerator, type Scene, type Texture, WebGLRenderer } from "three";

export type GlSetup = { scene: Scene; camera: Camera; update: (time: number) => void; dispose?: () => void };
// environment: a prefiltered environment map of the scene (PMREM), for reflections and light; the caller disposes it
export type GlRenderer = { canvas: CanvasImageSource; render: (scene: Scene, camera: Camera) => void; dispose: () => void; environment?: (scene: Scene) => Texture };
// exposure: filmic tone mapping like the scenes (Stage3D) with this exposure, for physical skies; none = flat colors
type ClipFrame = { width: number; height: number; duration: number; fps: number; exposure?: number };

function webgl(width: number, height: number, exposure?: number): GlRenderer {
  const canvas = document.createElement("canvas");
  // alpha: a scene without background stays transparent (stinger as WebM with alpha); clipping planes of materials apply
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
  renderer.localClippingEnabled = true;
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  if (exposure !== undefined) {
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;
  }
  return {
    canvas,
    render: (scene, camera) => renderer.render(scene, camera),
    dispose: () => { renderer.dispose(); renderer.forceContextLoss(); },
    environment: scene => {
      const pmrem = new PMREMGenerator(renderer);
      const texture = pmrem.fromScene(scene).texture;
      pmrem.dispose();
      return texture;
    },
  };
}

// Small tolerance so the time of the last frame (index / fps) counts as last despite rounding
const EPSILON = 1e-6;

export function glClip(frame: ClipFrame, setup: (renderer: GlRenderer) => GlSetup, makeRenderer: (width: number, height: number, exposure?: number) => GlRenderer = webgl) {
  const last = (Math.round(frame.duration * frame.fps) - 1) / frame.fps;
  let current: { renderer: GlRenderer; built: GlSetup } | null = null;
  return (context: CanvasRenderingContext2D, time: number) => {
    if (!current) {
      const renderer = makeRenderer(frame.width, frame.height, frame.exposure);
      current = { renderer, built: setup(renderer) };
    }
    current.built.update(time);
    current.renderer.render(current.built.scene, current.built.camera);
    // Clear first: transparent parts of the frame must not keep the frame before
    context.clearRect(0, 0, frame.width, frame.height);
    context.drawImage(current.renderer.canvas, 0, 0, frame.width, frame.height);
    if (time >= last - EPSILON) {
      current.built.dispose?.();
      current.renderer.dispose();
      current = null;
    }
  };
}
