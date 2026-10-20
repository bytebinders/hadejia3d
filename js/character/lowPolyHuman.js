import * as THREE from 'three';
import { CHARACTER_CAST, getCharacterPreset } from './characterPresets.js';

export { CHARACTER_CAST, getCharacterPreset };

// Procedural texture caching for realistic damask, cotton grain, weave, and embroidery
const _texCache = {};

function makeTexture(key, w, h, draw, repeat) {
  if (typeof document === 'undefined') return null;
  if (_texCache[key]) return _texCache[key];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  _texCache[key] = t;
  return t;
}

const css = hex => '#' + new THREE.Color(hex).getHexString();

function fabricTexture(hex) {
  return makeTexture('fab_' + hex, 128, 128, (g, w, h) => {
    g.fillStyle = css(hex);
    g.fillRect(0, 0, w, h);
    // Subtle tonal damask diamond pattern
    g.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    g.lineWidth = 2;
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 32) {
        g.beginPath();
        g.moveTo(x + 16, y + 4);
        g.lineTo(x + 28, y + 16);
        g.lineTo(x + 16, y + 28);
        g.lineTo(x + 4, y + 16);
        g.closePath();
        g.stroke();
      }
    }
    // Organic cotton grain
    for (let i = 0; i < 1000; i++) {
      const v = Math.random() > 0.5 ? 255 : 0;
      g.fillStyle = `rgba(${v}, ${v}, ${v}, 0.03)`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 1);
    }
  }, [6, 3]);
}

function denimTexture(hex) {
  return makeTexture('denim_' + hex, 64, 64, (g, w, h) => {
    g.fillStyle = css(hex);
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        if ((x + y) % 8 === 0) g.fillRect(x, y, 2, 2);
      }
    }
  }, [8, 8]);
}

function weaveBump() {
  return makeTexture('weave_bump', 16, 16, (g, w, h) => {
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        g.fillStyle = ((x + y) / 2) % 2 ? '#aaaaaa' : '#555555';
        g.fillRect(x, y, 2, 2);
      }
    }
  }, [28, 14]);
}

function frontEmbroideryTexture(thread) {
  return makeTexture('front_emb_' + thread, 256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = g.fillStyle = css(thread);
    g.lineCap = g.lineJoin = 'round';
    g.lineWidth = 8;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.lineWidth = 3;
    g.strokeRect(24, 24, w - 48, h - 48);

    // Traditional Hausa knot (Northern star) motif
    const cx = w / 2, cy = 120;
    g.lineWidth = 5;
    for (let k = 0; k < 2; k++) {
      g.save();
      g.translate(cx, cy);
      g.rotate((k * Math.PI) / 4);
      g.strokeRect(-50, -50, 100, 100);
      g.restore();
    }
    g.beginPath(); g.arc(cx, cy, 32, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(cx, cy, 12, 0, Math.PI * 2); g.fill();

    // Vertical Aska Biyu diamond chain
    for (let i = 0; i < 5; i++) {
      const y = 250 + i * 50;
      g.beginPath();
      g.moveTo(cx, y - 22); g.lineTo(cx + 22, y); g.lineTo(cx, y + 22); g.lineTo(cx - 22, y);
      g.closePath(); g.stroke();
      g.beginPath(); g.arc(cx, y, 5, 0, Math.PI * 2); g.fill();
    }

    // Side border stitching
    g.lineWidth = 4;
    [48, w - 48].forEach(x => {
      g.beginPath();
      let n = 0;
      for (let y = 190; y < h - 40; y += 26, n++) g.lineTo(x + (n % 2 ? 8 : -8), y);
      g.stroke();
    });
  });
}

function capTexture(capHex, thread) {
  return makeTexture('cap_' + capHex + '_' + thread, 256, 64, (g, w, h) => {
    g.fillStyle = css(capHex);
    g.fillRect(0, 0, w, h);
    g.strokeStyle = g.fillStyle = css(thread);
    g.lineWidth = 3;
    g.fillRect(0, 0, w, 7);
    g.fillRect(0, h - 7, w, 7);
    for (let x = 0; x < w; x += 32) {
      g.beginPath();
      let n = 0;
      for (let y = 12; y < h - 10; y += 8, n++) g.lineTo(x + 16 + (n % 2 ? 5 : -5), y);
      g.stroke();
      g.beginPath();
      g.moveTo(x, 32); g.lineTo(x + 6, 26); g.lineTo(x + 12, 32); g.lineTo(x + 6, 38);
      g.closePath(); g.fill();
    }
  });
}

/**
 * HausaBabbanRiga: Detailed Babban Riga outfit module parented to rig skeleton.
 */
export class HausaBabbanRiga {
  static dress(rig, opts = {}) {
    const { torso, leftArmUpper, leftArmLower, rightArmUpper, rightArmLower,
      leftLegUpper, rightLegUpper, headPivot } = rig;

    const robeHex = opts.robeColor ?? rig.materials.primary.color.getHex();
    const threadHex = opts.threadColor ?? 0xd9a521;
    const capHex = opts.capColor ?? 0xf8fafc;
    const trouserHex = opts.trouserColor ?? new THREE.Color(robeHex).multiplyScalar(0.85).getHex();

    const robeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: fabricTexture(robeHex),
      bumpMap: weaveBump(),
      bumpScale: 0.35,
      roughness: 0.85,
      flatShading: true,
      side: THREE.DoubleSide
    });
    if (!robeMat.map) robeMat.color.set(robeHex);

    const foldMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(robeHex).multiplyScalar(0.8),
      roughness: 0.9,
      flatShading: true
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: threadHex,
      metalness: 0.75,
      roughness: 0.3,
      flatShading: true,
      side: THREE.DoubleSide
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.7,
      flatShading: true,
      side: THREE.DoubleSide
    });
    const panelTex = frontEmbroideryTexture(threadHex);
    const panelMat = new THREE.MeshStandardMaterial({
      map: panelTex,
      transparent: true,
      alphaTest: 0.35,
      metalness: 0.5,
      roughness: 0.35,
      color: panelTex ? 0xffffff : threadHex
    });

    if (rig.materials.pants) rig.materials.pants.color.set(trouserHex);

    const mk = (geo, mat, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      return m;
    };
    const oct = geo => { geo.rotateY(Math.PI / 8); return geo; };

    // Upper Body Robe
    torso.add(mk(oct(new THREE.CylinderGeometry(0.47, 0.41, 1.05, 8, 1, true)), robeMat, 0, 0.375, 0));
    torso.add(mk(oct(new THREE.CylinderGeometry(0.20, 0.47, 0.12, 8, 1, true)), robeMat, 0, 0.86, 0));
    torso.add(mk(oct(new THREE.CylinderGeometry(0.476, 0.476, 0.025, 8, 1, true)), goldMat, 0, 0.80, 0));

    const piping = mk(new THREE.TorusGeometry(0.205, 0.015, 5, 8), goldMat, 0, 0.92, 0);
    piping.rotation.x = Math.PI / 2;
    torso.add(piping);

    torso.add(mk(new THREE.CylinderGeometry(0.20, 0.22, 0.08, 8, 1, true), collarMat, 0, 0.95, 0));

    // Embroidered Chest Panel (Aska Biyu)
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.62), panelMat);
    panel.position.set(0, 0.44, 0.425);
    panel.rotation.x = 0.057;
    torso.add(panel);

    // Left chest pocket
    const pocket = mk(new THREE.BoxGeometry(0.15, 0.17, 0.025), foldMat, 0.22, 0.42, 0.398);
    pocket.rotation.y = Math.PI / 4;
    torso.add(pocket);
    const pocketStitch = mk(new THREE.BoxGeometry(0.155, 0.015, 0.03), goldMat, 0.22, 0.51, 0.404);
    pocketStitch.rotation.y = Math.PI / 4;
    torso.add(pocketStitch);

    // Flared Wide Sleeves
    [[leftArmUpper, leftArmLower], [rightArmUpper, rightArmLower]].forEach(([up, low]) => {
      up.add(mk(new THREE.CylinderGeometry(0.17, 0.21, 0.46, 8, 1, true), robeMat, 0, -0.23, 0));
      low.add(mk(new THREE.CylinderGeometry(0.21, 0.30, 0.40, 8, 1, true), robeMat, 0, -0.20, 0));
      low.add(mk(new THREE.CylinderGeometry(0.296, 0.303, 0.05, 8, 1, true), goldMat, 0, -0.375, 0));
    });

    // Floor-Length Split Robe (swinging naturally with leg articulation)
    [leftLegUpper, rightLegUpper].forEach(leg => {
      const isLeft = leg === leftLegUpper;
      const ts = isLeft ? 0 : Math.PI;
      const off = -leg.position.x;

      leg.add(mk(new THREE.CylinderGeometry(0.40, 0.50, 1.45, 8, 1, true, ts, Math.PI), robeMat, off, -0.425, 0));
      leg.add(mk(new THREE.CylinderGeometry(0.50, 0.505, 0.07, 8, 1, true, ts, Math.PI), goldMat, off, -1.115, 0));
      leg.add(mk(new THREE.CylinderGeometry(0.492, 0.494, 0.03, 8, 1, true, ts, Math.PI), goldMat, off, -1.0, 0));

      // Vertical fold ribs
      for (let k = 1; k <= 3; k++) {
        const th = ts + (k * Math.PI) / 4;
        const rib = mk(new THREE.BoxGeometry(0.025, 1.4, 0.02), foldMat,
          off + 0.455 * Math.sin(th), -0.425, 0.455 * Math.cos(th));
        rib.rotation.order = 'YXZ';
        rib.rotation.y = th;
        rib.rotation.x = -0.069;
        leg.add(rib);
      }
    });

    // Headwear
    if (opts.turban) this.addRawani(headPivot, opts.turbanColor ?? 0xf8fafc);
    else this.addZannaCap(headPivot, capHex, threadHex);

    return rig;
  }

  static addZannaCap(headPivot, capHex = 0xf8fafc, threadHex = 0xd9a521) {
    const tex = capTexture(capHex, threadHex);
    const side = new THREE.MeshStandardMaterial({
      color: tex ? 0xffffff : capHex, map: tex, roughness: 0.7, flatShading: true, side: THREE.DoubleSide
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.27, 0.30, 12, 1, true), side);
    body.position.y = 0.65;
    body.castShadow = true;
    headPivot.add(body);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: capHex, roughness: 0.7, flatShading: true })
    );
    top.position.y = 0.80;
    headPivot.add(top);

    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.012, 5, 12),
      new THREE.MeshStandardMaterial({ color: threadHex, metalness: 0.7, roughness: 0.3, flatShading: true })
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0.80;
    headPivot.add(trim);
  }

  static addRawani(headPivot, hex = 0xf8fafc) {
    const mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.85, flatShading: true });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.29, 0.20, 10), mat);
    base.position.y = 0.60;
    headPivot.add(base);

    [0.54, 0.62, 0.70].forEach((y, i) => {
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.31 - i * 0.012, 0.055, 6, 12), mat);
      wrap.rotation.x = Math.PI / 2;
      wrap.rotation.z = i * 0.4;
      wrap.position.y = y;
      wrap.scale.set(1, 1, 1.05);
      headPivot.add(wrap);
    });

    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.29, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    crown.position.y = 0.70;
    headPivot.add(crown);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.04), mat);
    tail.position.set(0.22, 0.42, -0.14);
    tail.rotation.set(0.1, 0.4, -0.12);
    headPivot.add(tail);
  }
}

/**
 * LowPolyHuman — Modular Cast & Skeletal Rig System
 * 
 * Implements the Cast-First architecture:
 * - Character Presets (Harpy, Xixi, Malam Bello, Dogari, Amina, Ibrahim)
 * - Proportions & Palettes explicit per character identity
 * - Clean, recognizable silhouettes (expressive stylized face, zero chunky box hacks)
 * - Modular outfits, headwear, and accessories parented cleanly to joints
 */
export class LowPolyHuman {
  /**
   * Create an articulated character rig configured by cast preset
   */
  static create(options = {}) {
    const rawId = options.id || options.avatarId || options.preset || (options.isPlayer ? 'harpy' : 'harpy');
    const basePreset = getCharacterPreset(rawId);

    // Normalize incoming palette overrides (supporting both new keys and legacy skinColor/shirtColor keys)
    const rawPal = options.palette || {};
    const pal = {
      skin: options.skinColor ?? rawPal.skin ?? rawPal.skinColor ?? basePreset.palette.skin,
      lips: options.lipColor ?? rawPal.lips ?? rawPal.lipColor ?? basePreset.palette.lips,
      eyes: options.eyeColor ?? rawPal.eyes ?? rawPal.eyeColor ?? basePreset.palette.eyes,
      hair: options.hairColor ?? rawPal.hair ?? rawPal.hairColor ?? basePreset.palette.hair,
      primary: options.shirtColor ?? rawPal.primary ?? rawPal.shirtColor ?? basePreset.palette.primary,
      secondary: options.jacketColor ?? rawPal.secondary ?? rawPal.jacketColor ?? basePreset.palette.secondary,
      pants: options.pantsColor ?? rawPal.pants ?? rawPal.pantsColor ?? basePreset.palette.pants,
      shoes: options.shoesColor ?? rawPal.shoes ?? rawPal.shoesColor ?? basePreset.palette.shoes,
      sole: rawPal.sole ?? basePreset.palette.sole ?? 0xf1f5f9,
      metal: rawPal.metal ?? basePreset.palette.metal ?? 0xf59e0b
    };

    // Merge options over preset
    const preset = {
      ...basePreset,
      ...options,
      proportions: { ...basePreset.proportions, ...(options.proportions || {}) },
      palette: pal
    };

    // If explicit gender was passed (e.g. from older system), respect it if not default
    if (options.gender && !options.id && !options.avatarId) {
      if (options.gender === 'women' && preset.gender !== 'women') {
        const womenPreset = getCharacterPreset('xixi');
        preset.proportions = { ...womenPreset.proportions, ...(options.proportions || {}) };
        preset.gender = 'women';
      }
    }

    const p = preset.proportions;
    const isWomen = (preset.gender === 'women');

    // Materials
    const materials = {
      skin: new THREE.MeshStandardMaterial({ color: pal.skin, roughness: 0.72, metalness: 0.05, flatShading: true }),
      lips: new THREE.MeshStandardMaterial({ color: pal.lips, roughness: 0.55, flatShading: true }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, flatShading: true }),
      eyeIris: new THREE.MeshStandardMaterial({ color: pal.eyes, roughness: 0.3, flatShading: true }),
      eyePupil: new THREE.MeshBasicMaterial({ color: 0x050505 }),
      eyebrow: new THREE.MeshStandardMaterial({ color: pal.hair, roughness: 0.9, flatShading: true }),
      hair: new THREE.MeshStandardMaterial({ color: pal.hair, roughness: 0.85, flatShading: true }),
      primary: new THREE.MeshStandardMaterial({
        color: pal.primary,
        map: fabricTexture(pal.primary),
        roughness: 0.68,
        flatShading: true
      }),
      secondary: new THREE.MeshStandardMaterial({
        color: pal.secondary,
        roughness: 0.65,
        flatShading: true
      }),
      pants: new THREE.MeshStandardMaterial({
        color: pal.pants,
        map: denimTexture(pal.pants),
        roughness: 0.75,
        flatShading: true
      }),
      shoes: new THREE.MeshStandardMaterial({ color: pal.shoes, roughness: 0.6, flatShading: true }),
      sole: new THREE.MeshStandardMaterial({ color: pal.sole, roughness: 0.5, flatShading: true }),
      gold: new THREE.MeshStandardMaterial({ color: pal.metal, roughness: 0.25, metalness: 0.85, flatShading: true }),
      steel: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.85, flatShading: true }),
      strap: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, flatShading: true }),
      phoneCase: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, flatShading: true }),
      watchStrap: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, flatShading: true }),
      coffeeCup: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9, flatShading: true }),
      coffeeSleeve: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, flatShading: true }),
      coffeeLid: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, flatShading: true })
    };

    const root = new THREE.Group();
    root.name = `Character_${preset.id}`;
    const baseScale = options.scale || p.scale || 0.65;
    root.scale.set(baseScale, baseScale, baseScale);

    // ==========================================
    // 1. SKELETON: HIPS / PELVIS ROOT (Y = 1.35)
    // ==========================================
    const hips = new THREE.Group();
    hips.position.y = 1.35;
    root.add(hips);

    const pelvisTop = p.waistRadius * 1.8;
    const pelvisBottom = p.hipRadius * 1.8;
    const pelvisGeo = new THREE.CylinderGeometry(pelvisTop, pelvisBottom, 0.34, 8);
    pelvisGeo.rotateY(Math.PI / 8);
    const pelvis = new THREE.Mesh(pelvisGeo, materials.pants);
    pelvis.castShadow = true;
    hips.add(pelvis);

    // ==========================================
    // 2. SKELETON: TORSO & CHEST
    // ==========================================
    const torso = new THREE.Group();
    torso.position.y = 0.2;
    hips.add(torso);

    const torsoTop = p.shoulderWidth * 0.95;
    const torsoBottom = p.waistRadius * 1.85;
    const torsoH = p.torsoHeight;

    // Sculpted natural torso (clean form, no ugly rectangular pectoral plates)
    const torsoGeo = new THREE.CylinderGeometry(torsoTop, torsoBottom, torsoH, 8);
    torsoGeo.rotateY(Math.PI / 8);
    const torsoMesh = new THREE.Mesh(torsoGeo, materials.primary);
    torsoMesh.position.y = torsoH / 2;
    torsoMesh.castShadow = true;
    torso.add(torsoMesh);

    // Subtle feminine bust contour when applicable
    if (isWomen) {
      const bustGeo = new THREE.SphereGeometry(0.11, 8, 8);
      bustGeo.scale(1, 0.9, 1.15);
      [-0.10, 0.10].forEach(bx => {
        const b = new THREE.Mesh(bustGeo, materials.primary);
        b.position.set(bx, 0.48, 0.20);
        torso.add(b);
      });
    }

    // ==========================================
    // 3. SKELETON: HEAD & FACIAL FEATURES
    // ==========================================
    const headPivot = new THREE.Group();
    headPivot.position.y = torsoH + 0.08;
    torso.add(headPivot);

    // Clean neck
    const neckGeo = new THREE.CylinderGeometry(0.11, 0.13, p.neckLength, 8);
    const neck = new THREE.Mesh(neckGeo, materials.skin);
    neck.position.y = p.neckLength / 2;
    headPivot.add(neck);

    // Sculpted Head Cranium
    const headR = p.headRadius;
    const headGeo = new THREE.CylinderGeometry(headR, headR * 0.86, 0.46, 8);
    headGeo.rotateY(Math.PI / 8);
    const head = new THREE.Mesh(headGeo, materials.skin);
    head.position.y = p.neckLength + 0.18;
    head.castShadow = true;
    headPivot.add(head);

    // Clean tapered chin / jaw
    const chin = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.75, 0.12, 0.14), materials.skin);
    chin.position.set(0, p.neckLength + 0.02, 0.14);
    chin.rotation.x = -0.18;
    headPivot.add(chin);

    // Clean stylized ears
    [-headR - 0.02, headR + 0.02].forEach((ex, idx) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.06), materials.skin);
      ear.position.set(ex, p.neckLength + 0.18, 0.02);
      ear.rotation.y = idx === 0 ? -0.15 : 0.15;
      headPivot.add(ear);
    });

    // Clean stylized nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.06), materials.skin);
    nose.position.set(0, p.neckLength + 0.14, 0.24);
    nose.rotation.x = 0.22;
    headPivot.add(nose);

    // Expressive stylized eyes (clean sclera, iris, pupil, brow)
    const eyeSpacing = isWomen ? 0.085 : 0.095;
    [-eyeSpacing, eyeSpacing].forEach((x, idx) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, p.neckLength + 0.20, 0.21);

      // Sclera
      const sclera = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.038, 0.015), materials.eyeWhite);
      eyeGroup.add(sclera);

      // Iris
      const iris = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.034, 0.02), materials.eyeIris);
      iris.position.z = 0.005;
      eyeGroup.add(iris);

      // Pupil
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.025), materials.eyePupil);
      pupil.position.z = 0.008;
      eyeGroup.add(pupil);

      // Eyelash Wing
      const lash = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.022), materials.eyebrow);
      lash.position.set(0, 0.02, 0.006);
      if (isWomen) lash.rotation.z = idx === 0 ? 0.08 : -0.08;
      eyeGroup.add(lash);

      // Distinct Eyebrow
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.025), materials.eyebrow);
      brow.position.set(0, 0.052, 0.01);
      brow.rotation.z = idx === 0 ? 0.05 : -0.05;
      eyeGroup.add(brow);

      headPivot.add(eyeGroup);
    });

    // Mouth / Lips
    const lipUpper = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.022, 0.03), materials.lips);
    lipUpper.position.set(0, p.neckLength + 0.06, 0.22);
    headPivot.add(lipUpper);

    const lipLower = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.026, 0.03), materials.lips);
    lipLower.position.set(0, p.neckLength + 0.035, 0.215);
    headPivot.add(lipLower);

    // ==========================================
    // 4. SKELETON: ARMS & 5-FINGER HANDS
    // ==========================================
    const shoulderOffset = p.shoulderWidth;
    const armUpperL = p.armLength;
    const armLowerL = p.armLength;
    const armThick = isWomen ? 0.085 : 0.105;

    // LEFT ARM
    const leftArmUpper = new THREE.Group();
    leftArmUpper.position.set(shoulderOffset, torsoH - 0.06, 0);
    torso.add(leftArmUpper);

    const lDeltoid = new THREE.Mesh(new THREE.DodecahedronGeometry(armThick * 1.25, 0), materials.secondary);
    leftArmUpper.add(lDeltoid);

    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(armThick, armThick * 0.85, armUpperL, 6), materials.secondary);
    lUpper.position.y = -armUpperL / 2;
    lUpper.castShadow = true;
    leftArmUpper.add(lUpper);

    const leftArmLower = new THREE.Group();
    leftArmLower.position.y = -armUpperL;
    leftArmUpper.add(leftArmLower);

    const lLower = new THREE.Mesh(new THREE.CylinderGeometry(armThick * 0.85, armThick * 0.7, armLowerL, 6), materials.skin);
    lLower.position.y = -armLowerL / 2;
    lLower.castShadow = true;
    leftArmLower.add(lLower);

    const lHand = this._createStylizedHand(materials.skin, true, isWomen);
    lHand.position.y = -armLowerL;
    leftArmLower.add(lHand);

    // RIGHT ARM
    const rightArmUpper = new THREE.Group();
    rightArmUpper.position.set(-shoulderOffset, torsoH - 0.06, 0);
    torso.add(rightArmUpper);

    const rDeltoid = new THREE.Mesh(new THREE.DodecahedronGeometry(armThick * 1.25, 0), materials.secondary);
    rightArmUpper.add(rDeltoid);

    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(armThick, armThick * 0.85, armUpperL, 6), materials.secondary);
    rUpper.position.y = -armUpperL / 2;
    rUpper.castShadow = true;
    rightArmUpper.add(rUpper);

    const rightArmLower = new THREE.Group();
    rightArmLower.position.y = -armUpperL;
    rightArmUpper.add(rightArmLower);

    const rLower = new THREE.Mesh(new THREE.CylinderGeometry(armThick * 0.85, armThick * 0.7, armLowerL, 6), materials.skin);
    rLower.position.y = -armLowerL / 2;
    rLower.castShadow = true;
    rightArmLower.add(rLower);

    const rHand = this._createStylizedHand(materials.skin, false, isWomen);
    rHand.position.y = -armLowerL;
    rightArmLower.add(rHand);

    // ==========================================
    // 5. SKELETON: LEGS, KNEES & FOOTWEAR
    // ==========================================
    const legUpperL = p.legLength;
    const legLowerL = p.legLength;
    const legSpacing = p.hipRadius * 0.85;
    const legThick = isWomen ? 0.11 : 0.14;

    // LEFT LEG
    const leftLegUpper = new THREE.Group();
    leftLegUpper.position.set(legSpacing, -0.14, 0);
    hips.add(leftLegUpper);

    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(legThick, legThick * 0.82, legUpperL, 6), materials.pants);
    lThigh.position.y = -legUpperL / 2;
    lThigh.castShadow = true;
    leftLegUpper.add(lThigh);

    const leftLegLower = new THREE.Group();
    leftLegLower.position.y = -legUpperL;
    leftLegUpper.add(leftLegLower);

    const lShin = new THREE.Mesh(new THREE.CylinderGeometry(legThick * 0.82, legThick * 0.68, legLowerL, 6), materials.pants);
    lShin.position.y = -legLowerL / 2;
    lShin.castShadow = true;
    leftLegLower.add(lShin);

    const lFootwear = this._createFootwear(materials, preset.outfit, isWomen);
    lFootwear.position.set(0, -legLowerL, 0.08);
    leftLegLower.add(lFootwear);

    // RIGHT LEG
    const rightLegUpper = new THREE.Group();
    rightLegUpper.position.set(-legSpacing, -0.14, 0);
    hips.add(rightLegUpper);

    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(legThick, legThick * 0.82, legUpperL, 6), materials.pants);
    rThigh.position.y = -legUpperL / 2;
    rThigh.castShadow = true;
    rightLegUpper.add(rThigh);

    const rightLegLower = new THREE.Group();
    rightLegLower.position.y = -legUpperL;
    rightLegUpper.add(rightLegLower);

    const rShin = new THREE.Mesh(new THREE.CylinderGeometry(legThick * 0.82, legThick * 0.68, legLowerL, 6), materials.pants);
    rShin.position.y = -legLowerL / 2;
    rShin.castShadow = true;
    rightLegLower.add(rShin);

    const rFootwear = this._createFootwear(materials, preset.outfit, isWomen);
    rFootwear.position.set(0, -legLowerL, 0.08);
    rightLegLower.add(rFootwear);

    // Rig assembly object
    const rig = {
      root,
      hips,
      torso,
      headPivot,
      neck,
      leftArmUpper,
      leftArmLower,
      rightArmUpper,
      rightArmLower,
      leftLegUpper,
      leftLegLower,
      rightLegUpper,
      rightLegLower,
      gender: preset.gender,
      isWomen,
      preset,
      materials
    };

    // ==========================================
    // 6. MODULAR OUTFIT MODULES
    // ==========================================
    const outfit = options.outfit || options.style || preset.outfit;
    this._attachOutfit(rig, outfit, materials, isWomen);

    // ==========================================
    // 7. MODULAR HEADWEAR MODULES
    // ==========================================
    const headwear = options.hairstyle || preset.headwear;
    this._attachHeadwear(headPivot, headwear, materials, isWomen, outfit);

    // ==========================================
    // 8. MODULAR ACCESSORIES
    // ==========================================
    const accessories = options.accessories || preset.accessories || [];
    this._attachAccessories(rig, accessories, materials, isWomen);

    root.userData.rig = rig;
    root.userData.preset = preset;
    return rig;
  }

  /**
   * Modular Outfit Attachments
   */
  static _attachOutfit(rig, outfit, mats, isWomen) {
    const { torso, hips } = rig;

    if (outfit === 'royal_babban_riga' || outfit === 'hausa_babban_riga') {
      HausaBabbanRiga.dress(rig, {
        robeColor: mats.primary.color.getHex(),
        threadColor: mats.secondary.color.getHex(),
        trouserColor: mats.pants.color.getHex(),
        turban: false
      });
      return;
    }

    if (outfit === 'hausa_atampa' || outfit === 'xixi_urban') {
      // Peplum ruffle at waist
      const peplumGeo = new THREE.CylinderGeometry(0.28, 0.42, 0.16, 8);
      peplumGeo.rotateY(Math.PI / 8);
      const peplum = new THREE.Mesh(peplumGeo, mats.primary);
      peplum.position.y = 0.08;
      torso.add(peplum);

      // Elegant cross-body sash with coral floral accent
      const sash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.78, 0.06), mats.secondary);
      sash.position.set(0.04, 0.42, 0.22);
      sash.rotation.z = -0.18;
      torso.add(sash);

      // Traditional Zani floor wrapper skirt
      const zaniGeo = new THREE.CylinderGeometry(0.36, 0.44, 0.74, 8);
      zaniGeo.rotateY(Math.PI / 8);
      const zani = new THREE.Mesh(zaniGeo, mats.pants);
      zani.position.y = -0.32;
      zani.castShadow = true;
      hips.add(zani);

      // Wrapper hem border trim
      const zaniTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.442, 0.442, 0.08, 8), mats.secondary);
      zaniTrim.position.y = -0.67;
      hips.add(zaniTrim);
      return;
    }

    if (outfit === 'urban_bomber' || outfit === 'harpy_urban') {
      // Modern tailored jacket front lapels
      [-0.18, 0.18].forEach(x => {
        const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.56, 0.07), mats.secondary);
        lapel.position.set(x, 0.48, 0.22);
        torso.add(lapel);
      });

      // Metallic center zipper
      const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.58, 0.03), mats.steel);
      zipper.position.set(0, 0.48, 0.24);
      torso.add(zipper);

      // Ribbed collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.06, 8), mats.secondary);
      collar.position.y = 0.84;
      torso.add(collar);
      return;
    }

    if (outfit === 'palace_dogari' || outfit === 'emir_guard') {
      // Bi-color crimson red and emerald green guard tunic
      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.07), mats.primary);
      stripeL.position.set(-0.11, 0.42, 0.24);
      torso.add(stripeL);

      const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.07), mats.secondary);
      stripeR.position.set(0.11, 0.42, 0.24);
      torso.add(stripeR);

      // Golden Royal Palace crest medallion
      const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 8), mats.gold);
      crest.rotateX(Math.PI / 2);
      crest.position.set(0, 0.60, 0.28);
      torso.add(crest);
      return;
    }

    if (outfit === 'modest_abaya') {
      const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 1.25, 8), mats.primary);
      coat.position.y = -0.15;
      hips.add(coat);
      const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.25, 0.03), mats.gold);
      goldTrim.position.set(0, -0.15, 0.47);
      hips.add(goldTrim);
      return;
    }

    // Default Kaftan
    const embroPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.46, 0.04), mats.secondary);
    embroPlate.position.set(0, 0.50, 0.24);
    torso.add(embroPlate);

    const goldPlacket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.06), mats.gold);
    goldPlacket.position.set(0, 0.50, 0.25);
    torso.add(goldPlacket);
  }

  /**
   * Modular Headwear Attachments
   */
  static _attachHeadwear(headPivot, headwear, mats, isWomen, outfit) {
    if (headwear === 'zanna_bukar_royal') {
      HausaBabbanRiga.addZannaCap(headPivot, mats.secondary.color.getHex(), mats.gold.color.getHex());
      return;
    }

    if (headwear === 'rawani_turban') {
      HausaBabbanRiga.addRawani(headPivot, outfit === 'palace_dogari' ? 0xdc2626 : 0xf8fafc);
      return;
    }

    if (headwear === 'mayafi_veil' || headwear === 'hijab_mayafi') {
      // Elegant Mayafi Veil Crown & Drapes
      const veilMat = new THREE.MeshStandardMaterial({
        color: mats.primary.color,
        roughness: 0.75,
        flatShading: true,
        side: THREE.DoubleSide
      });

      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.24, 10), veilMat);
      crown.position.y = 0.56;
      headPivot.add(crown);

      // Flowing shoulder drapes
      [-0.24, 0.24].forEach((x, idx) => {
        const drape = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.48, 0.20), veilMat);
        drape.position.set(x, 0.32, 0.02);
        drape.rotation.z = idx === 0 ? 0.12 : -0.12;
        headPivot.add(drape);
      });

      // Back drape
      const backDrape = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.07), veilMat);
      backDrape.position.set(0, 0.34, -0.21);
      headPivot.add(backDrape);
      return;
    }

    if (headwear === 'hula_zanna') {
      // Clean Fade Base Hair
      const sideHair = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.26), mats.hair);
      sideHair.position.set(0, 0.42, 0.02);
      headPivot.add(sideHair);

      // Cylindrical Embroidered Hula Cap
      const hula = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.20, 10), mats.primary);
      hula.rotateY(Math.PI / 10);
      hula.position.y = 0.58;
      hula.castShadow = true;
      headPivot.add(hula);

      // Gold embroidery band
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.275, 0.05, 10), mats.gold);
      band.rotateY(Math.PI / 10);
      band.position.y = 0.52;
      headPivot.add(band);

      // Crown crease
      const crease = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.035, 0.12), mats.secondary);
      crease.position.y = 0.67;
      headPivot.add(crease);
      return;
    }

    if (headwear === 'ponytail' || headwear === 'twin_braids') {
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 1), mats.hair);
      crown.position.set(0, 0.52, 0);
      headPivot.add(crown);

      const scrunchie = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12), mats.secondary);
      scrunchie.position.set(0, 0.60, -0.20);
      scrunchie.rotation.x = 0.5;
      headPivot.add(scrunchie);

      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.025, 0.40, 8), mats.hair);
      tail.position.set(0, 0.48, -0.30);
      tail.rotation.x = 0.55;
      headPivot.add(tail);
      return;
    }

    // Default clean crop/fade
    const fadeTop = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), mats.hair);
    fadeTop.position.set(0, 0.54, 0);
    headPivot.add(fadeTop);
  }

  /**
   * Modular Accessory Attachments
   */
  static _attachAccessories(rig, accessories, mats, isWomen) {
    const { headPivot, leftArmLower, hips } = rig;

    accessories.forEach(acc => {
      if (acc === 'smartwatch') {
        const watchGroup = new THREE.Group();
        watchGroup.position.y = -0.38;
        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.076, 0.04, 8), mats.strap);
        watchGroup.add(strap);
        const watchFace = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 0.02), mats.steel);
        watchFace.position.set(0, 0, 0.075);
        watchGroup.add(watchFace);
        leftArmLower.add(watchGroup);
      }

      if (acc === 'gold_choker') {
        const choker = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 12), mats.gold);
        choker.rotateX(Math.PI / 2);
        choker.position.y = 0.08;
        headPivot.add(choker);
      }

      if (acc === 'gold_earrings') {
        [-0.24, 0.24].forEach(x => {
          const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 12), mats.gold);
          hoop.position.set(x, 0.32, 0.04);
          headPivot.add(hoop);
        });
      }

      if (acc === 'gold_bangles') {
        const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 12), mats.gold);
        bangle.rotateX(Math.PI / 2);
        bangle.position.y = -0.38;
        leftArmLower.add(bangle);
      }

      if (acc === 'leather_belt') {
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.07, 8), mats.strap);
        belt.position.y = 0.12;
        hips.add(belt);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.03), mats.gold);
        buckle.position.set(0, 0.12, 0.36);
        hips.add(buckle);
      }
    });
  }

  /**
   * Stylized 5-Finger Hand
   */
  static _createStylizedHand(skinMat, isLeft, isWomen = false) {
    const hand = new THREE.Group();
    const scale = isWomen ? 0.85 : 1.0;

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.11 * scale, 0.10 * scale, 0.045 * scale), skinMat);
    palm.position.y = -0.05 * scale;
    palm.castShadow = true;
    hand.add(palm);

    // Thumb
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.035 * scale, 0.07 * scale, 0.03 * scale), skinMat);
    thumb.position.set((isLeft ? -0.06 : 0.06) * scale, -0.04 * scale, 0.02 * scale);
    thumb.rotation.z = isLeft ? 0.35 : -0.35;
    hand.add(thumb);

    // 4 Fingers
    [-0.035, -0.012, 0.012, 0.035].forEach((fx, idx) => {
      const fl = (idx === 1 || idx === 2 ? 0.08 : 0.065) * scale;
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.022 * scale, fl, 0.025 * scale), skinMat);
      finger.position.set(fx * scale, -0.05 * scale - fl / 2, 0.005 * scale);
      finger.rotation.x = 0.15;
      hand.add(finger);
    });

    return hand;
  }

  /**
   * Footwear Generator (Sneakers or Handcrafted Leather Sandals)
   */
  static _createFootwear(mats, outfit, isWomen = false) {
    const foot = new THREE.Group();
    const w = isWomen ? 0.19 : 0.23;
    const l = isWomen ? 0.39 : 0.45;

    if (outfit === 'royal_babban_riga' || outfit === 'palace_dogari' || outfit === 'hausa_babban_riga') {
      // Traditional handcrafted leather slide sandals
      const sole = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, l), mats.shoes);
      sole.position.y = -0.06;
      foot.add(sole);

      const strap = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.05, l * 0.45), mats.shoes);
      strap.position.set(0, -0.02, 0.02);
      foot.add(strap);
      return foot;
    }

    // Modern Cushioned Urban Sneakers
    const outsole = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, l), mats.shoes);
    outsole.position.y = -0.07;
    foot.add(outsole);

    const midsole = new THREE.Mesh(new THREE.BoxGeometry(w * 1.03, 0.065, l * 0.98), mats.sole);
    midsole.position.set(0, -0.025, 0.01);
    foot.add(midsole);

    const upper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.12, l * 0.92), mats.shoes);
    upper.position.set(0, 0.05, 0.02);
    foot.add(upper);

    const toeCap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.07, 0.13), mats.sole);
    toeCap.position.set(0, 0.035, l * 0.32);
    foot.add(toeCap);

    return foot;
  }

  static _createCoffeeCup(mats) {
    const cupGroup = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.22, 6), mats.coffeeCup);
    cupGroup.add(cup);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.068, 0.1, 6), mats.coffeeSleeve);
    cupGroup.add(sleeve);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 6), mats.coffeeLid);
    lid.position.y = 0.12;
    cupGroup.add(lid);
    return cupGroup;
  }

  static _createPhone(mats) {
    const phone = new THREE.Group();
    const phoneCase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.02), mats.phoneCase);
    phone.add(phoneCase);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.19, 0.005), mats.watchStrap);
    screen.position.z = 0.011;
    phone.add(screen);
    return phone;
  }

  // Backward-compatible helpers
  static getRandomMenStyle() {
    const styles = ['urban_bomber', 'royal_babban_riga', 'palace_dogari', 'kaftan_classic'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  static getRandomWomenStyle() {
    const styles = ['hausa_atampa', 'modest_abaya'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  static getRandomMenHairstyle() {
    const list = ['hula_zanna', 'urban_fade', 'rawani_turban', 'zanna_bukar_royal'];
    return list[Math.floor(Math.random() * list.length)];
  }

  static getRandomWomenHairstyle() {
    const list = ['mayafi_veil', 'ponytail'];
    return list[Math.floor(Math.random() * list.length)];
  }

  static getPlayerPalette(gender = 'men') {
    const p = (gender === 'women' ? CHARACTER_CAST.xixi : CHARACTER_CAST.harpy).palette;
    return {
      ...p,
      skinColor: p.skin,
      shirtColor: p.primary,
      jacketColor: p.secondary,
      pantsColor: p.pants,
      shoesColor: p.shoes,
      lipColor: p.lips,
      eyeColor: p.eyes,
      hairColor: p.hair
    };
  }

  static getRandomPalette(gender = 'men') {
    return this.getPlayerPalette(gender);
  }
}
