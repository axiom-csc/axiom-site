/* Manam scroll scene — a quiet spatial augment of the Lemma/Noema/Spine panels.
 * Three "panels" float at different depths in a dark field. As the user scrolls
 * through #manam, the camera dollies forward and DoF focal distance tracks
 * which panel is centered. A soft bloom glows panel edges. No data, no metrics
 * — purely a spatial reading of the real panel content above it.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('manam-scene');
const host = document.getElementById('manam');
if (canvas && host && !matchMedia('(prefers-reduced-motion:reduce)').matches && !matchMedia('(max-width:900px)').matches) {

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c0d18, 7, 28);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  // Three "panels", each a plane with a wire outline, placed along -Z.
  // Z positions roughly map to Lemma → Noema → Spine reading order.
  const PANELS = [
    { z:  0, x: -2.2, tint: 0x8297ff, name: 'lemma' },
    { z: -5, x:  0.2, tint: 0xb9b4e6, name: 'noema' },
    { z: -10, x:  2.4, tint: 0xf0d98a, name: 'spine' },
  ];
  const panelGroup = new THREE.Group();
  scene.add(panelGroup);

  PANELS.forEach(p => {
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);

    // Face: a subtle translucent plane
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 3.4, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x0c0d18, transparent: true, opacity: 0.35, side: THREE.DoubleSide
      })
    );
    g.add(face);

    // Edge outline (the "panel" itself as a line drawing)
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.6, 3.4)),
      new THREE.LineBasicMaterial({ color: p.tint, transparent: true, opacity: 0.75 })
    );
    g.add(edges);

    // A single horizontal rule inside, echoing the panel's top border
    const rule = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.1, 0.7, 0.01),
        new THREE.Vector3( 1.1, 0.7, 0.01),
      ]),
      new THREE.LineBasicMaterial({ color: p.tint, transparent: true, opacity: 0.4 })
    );
    g.add(rule);

    // Gentle random yaw so panels aren't flat-on
    g.rotation.y = (Math.random() - 0.5) * 0.18;

    panelGroup.add(g);
  });

  // Faint star-like field so the empty space has structure without "data"
  const starGeom = new THREE.BufferGeometry();
  const N = 240;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3+0] = (Math.random() - 0.5) * 22;
    pos[i*3+1] = (Math.random() - 0.5) * 12;
    pos[i*3+2] = -Math.random() * 20;
  }
  starGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(
    starGeom,
    new THREE.PointsMaterial({ color: 0xe8e3f0, size: 0.018, transparent: true, opacity: 0.55, sizeAttenuation: true })
  );
  scene.add(stars);

  // Post: bloom (soft) + bokeh DoF + output
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.9, 0.2);
  composer.addPass(bloom);

  const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.0022, maxblur: 0.012 });
  composer.addPass(bokeh);

  composer.addPass(new OutputPass());

  // Sizing
  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // UnrealBloomPass has a .setSize of its own
    bloom.setSize(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  // Scroll-driven camera + focus
  let scrollT = 0;      // 0 at top of section, 1 at bottom
  let scrollTarget = 0;
  function onScroll() {
    const r = host.getBoundingClientRect();
    const vh = window.innerHeight;
    // Progress: 0 when the section's top hits the viewport bottom,
    // 1 when its bottom hits the viewport top.
    const span = r.height + vh;
    const t = 1 - (r.bottom) / span;
    scrollTarget = Math.max(0, Math.min(1, t));
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Reveal once the first frame is rendered
  let revealed = false;
  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden) return;

    // Ease toward target (slow, consistent with astral restraint)
    scrollT += (scrollTarget - scrollT) * 0.06;

    // Camera dollies from z=10 down to z=-11 across the section
    camera.position.z = 10 - scrollT * 21;
    // Subtle lateral drift
    camera.position.x = Math.sin(scrollT * Math.PI) * 0.6;
    camera.lookAt(0, 0, camera.position.z - 6);

    // Focus distance: find the panel nearest the camera's forward target,
    // set bokeh focus to that distance. Causes Lemma→Noema→Spine to crisp-up
    // in turn as they come into the camera's plane.
    const targetZ = camera.position.z - 6;
    let bestDist = Infinity;
    for (const p of PANELS) {
      const d = Math.abs(p.z - targetZ);
      if (d < bestDist) bestDist = d;
    }
    // Panel distance from camera (positive)
    const focal = Math.max(2, Math.min(18, camera.position.z - (targetZ - (6 - bestDist)) ));
    // Smoother approach: distance from camera to the nearest panel z
    let nearestFromCam = Infinity;
    for (const p of PANELS) {
      const d = Math.abs(camera.position.z - p.z);
      if (d < nearestFromCam) nearestFromCam = d;
    }
    bokeh.uniforms.focus.value += (Math.max(2, nearestFromCam) - bokeh.uniforms.focus.value) * 0.08;

    composer.render();

    if (!revealed) { revealed = true; canvas.classList.add('ready'); }
  }
  requestAnimationFrame(tick);
}
