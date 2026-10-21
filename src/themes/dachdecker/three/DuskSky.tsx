// Evening sky of the Dachdecker Ending (DESIGN-DACHDECKER.md "Abend"): a large sphere around the scene, dark blueprint at
// the top fading to the warm after-work glow at the horizon, without fog.
import { useEffect, useMemo } from "react";
import { BackSide, Color, ShaderMaterial, SphereGeometry } from "three";

const RADIUS = 90;
const SEGMENTS = [32, 16] as const;
// The glow fills the lower part of the sky, then gives way to the top color
const VERTEX = "varying vec3 point; void main() { point = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const FRAGMENT = "uniform vec3 top; uniform vec3 glow; varying vec3 point; void main() { float height = clamp(point.y * 2.2 + 0.12, 0.0, 1.0); gl_FragColor = vec4(mix(glow, top, pow(height, 0.6)), 1.0); }";

export default function DuskSky({ top, glow }: { top: string; glow: string }) {
  const geometry = useMemo(() => new SphereGeometry(RADIUS, ...SEGMENTS), []);
  const material = useMemo(() => new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    uniforms: { top: { value: new Color(top) }, glow: { value: new Color(glow) } },
  }), [top, glow]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  return <mesh geometry={geometry} material={material} />;
}
