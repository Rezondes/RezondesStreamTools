// Time based particles (plans/PLAN-GRAFIK.md, package 5), independent of PixiJS so they can be checked: motion and aging
// follow dt (1 = one frame at 60 fps), not the frame rate. Without drag the motion is exact, so two steps of 1 equal one
// step of 2; drag works as a factor per frame.
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 at birth, the particle dies at 0
  decay: number; // life lost per frame
  gravity: number; // added to vy per frame
  drag: number; // velocity factor per frame, 1 = none
};

export function stepParticles(list: readonly Particle[], dt: number): Particle[] {
  return list
    .map(particle => {
      const drag = particle.drag ** dt;
      return {
        ...particle,
        x: particle.x + particle.vx * dt,
        y: particle.y + particle.vy * dt + particle.gravity * dt * dt / 2,
        vx: particle.vx * drag,
        vy: (particle.vy + particle.gravity * dt) * drag,
        life: particle.life - particle.decay * dt,
      };
    })
    .filter(particle => particle.life > 0);
}
