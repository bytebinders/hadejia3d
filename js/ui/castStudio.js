import * as THREE from 'three';
import { CHARACTER_CAST, getCharacterPreset } from '../character/characterPresets.js';
import { LowPolyHuman } from '../character/lowPolyHuman.js';

/**
 * CastStudio — 3D Character Cast Studio & Design Sheet Inspector
 * 
 * Provides:
 * - Real-time 3D interactive turntable preview
 * - Animation previewer: Neutral Pose, Walk Gait, Sprint, Seated Posture, Celebration Dance
 * - Full visual design sheet inspection (Role brief, silhouette & proportions, color swatches, accessories)
 * - One-click active player character selection
 */
export class CastStudio {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.selectedId = 'harpy';
    this.animMode = 'NEUTRAL'; // 'NEUTRAL', 'WALK', 'RUN', 'SIT', 'DANCE'
    this.autoRotate = true;
    this.turntableYaw = 0;
    this.animTime = 0;
    this.lastTime = performance.now();

    // DOM Elements
    this.modal = document.getElementById('cast-studio-modal');
    this.canvas = document.getElementById('cast-studio-canvas');
    this.cardsContainer = document.getElementById('cast-cards-list');
    this.btnClose = document.getElementById('btn-close-cast-studio');
    this.btnPlay = document.getElementById('btn-cast-play-active');
    this.btnAutoRotate = document.getElementById('btn-cast-autorotate');

    // Design Sheet View Elements
    this.sheetName = document.getElementById('cast-sheet-name');
    this.sheetRole = document.getElementById('cast-sheet-role');
    this.sheetBio = document.getElementById('cast-sheet-bio');
    this.sheetPalette = document.getElementById('cast-sheet-palette');
    this.sheetProportions = document.getElementById('cast-sheet-proportions');
    this.sheetOutfit = document.getElementById('cast-sheet-outfit');
    this.sheetHeadwear = document.getElementById('cast-sheet-headwear');
    this.sheetAccessories = document.getElementById('cast-sheet-accessories');
    this.sheetGait = document.getElementById('cast-sheet-gait');

    // Mini Three.js Preview Studio
    this._initThreeStudio();
    this._bindEvents();
    this._renderCards();
  }

  _initThreeStudio() {
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    const width = this.canvas.clientWidth || 400;
    const height = this.canvas.clientHeight || 500;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.camera.position.set(0, 1.15, 3.2);
    this.camera.lookAt(0, 0.95, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    keyLight.position.set(2.5, 4.0, 3.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    fillLight.position.set(-2.5, 2.5, 2.0);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.4);
    rimLight.position.set(0, 3.0, -3.0);
    this.scene.add(rimLight);

    // Elegant Turntable Pedestal
    const pedestalGroup = new THREE.Group();
    const diskGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.08, 32);
    const diskMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.25,
      flatShading: true
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.position.y = -0.04;
    disk.receiveShadow = true;
    pedestalGroup.add(disk);

    // Glowing Neon Ring
    const ringGeo = new THREE.TorusGeometry(0.88, 0.02, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    pedestalGroup.add(ring);

    this.scene.add(pedestalGroup);

    // Character Rig Holder
    this.modelPivot = new THREE.Group();
    this.scene.add(this.modelPivot);
  }

  _bindEvents() {
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.close());
    }

    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => this.selectAsPlayer());
    }

    if (this.btnAutoRotate) {
      this.btnAutoRotate.addEventListener('click', () => {
        this.autoRotate = !this.autoRotate;
        this.btnAutoRotate.classList.toggle('active', this.autoRotate);
      });
    }

    // Animation Mode Switchers
    const animPills = document.querySelectorAll('.cast-anim-pill');
    animPills.forEach(pill => {
      pill.addEventListener('click', () => {
        animPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.setAnimMode(pill.dataset.anim);
      });
    });

    // Turntable Drag Interaction
    let isDragging = false;
    let prevX = 0;

    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        prevX = e.clientX;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        prevX = e.clientX;
        this.turntableYaw += dx * 0.012;
        if (this.modelPivot) this.modelPivot.rotation.y = this.turntableYaw;
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      // Touch drag
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          prevX = e.touches[0].clientX;
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - prevX;
        prevX = e.touches[0].clientX;
        this.turntableYaw += dx * 0.012;
        if (this.modelPivot) this.modelPivot.rotation.y = this.turntableYaw;
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDragging = false;
      });
    }

    // Keyboard Shortcut (Press 'P' to toggle)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        // Ignore if user is currently typing in an input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    window.addEventListener('resize', () => {
      if (this.isOpen) this._handleResize();
    });
  }

  _renderCards() {
    if (!this.cardsContainer) return;
    this.cardsContainer.innerHTML = '';

    const castList = Object.values(CHARACTER_CAST);
    const icons = {
      harpy: '🧢',
      xixi: '🌺',
      malam_bello: '📜',
      dogari_danladi: '🛡️',
      amina_merchant: '🐟',
      ibrahim_keke: '🛺'
    };

    castList.forEach(c => {
      const card = document.createElement('div');
      card.className = `cast-select-card ${c.id === this.selectedId ? 'active' : ''}`;
      card.dataset.id = c.id;

      card.innerHTML = `
        <div class="cast-card-avatar">${icons[c.id] || '👤'}</div>
        <div class="cast-card-meta">
          <div class="cast-card-name-row">
            <strong class="cast-card-name">${c.name}</strong>
            <span class="cast-card-gender-tag">${c.gender === 'women' ? 'Women' : 'Men'}</span>
          </div>
          <span class="cast-card-role">${c.role}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectCharacter(c.id);
      });

      this.cardsContainer.appendChild(card);
    });
  }

  selectCharacter(id) {
    this.selectedId = id;
    const cards = document.querySelectorAll('.cast-select-card');
    cards.forEach(card => card.classList.toggle('active', card.dataset.id === id));

    const preset = getCharacterPreset(id);
    this._loadPreviewModel(preset);
    this._updateDesignSheet(preset);
  }

  _loadPreviewModel(preset) {
    if (!this.modelPivot) return;

    // Remove previous model
    while (this.modelPivot.children.length > 0) {
      this.modelPivot.remove(this.modelPivot.children[0]);
    }

    // Build character rig
    const rig = LowPolyHuman.create({
      id: preset.id,
      scale: preset.proportions?.scale || 0.65
    });

    this.previewRig = rig;
    this.modelPivot.add(rig.root);
    this.modelPivot.position.set(0, 0, 0);
  }

  _updateDesignSheet(preset) {
    if (this.sheetName) this.sheetName.textContent = preset.name;
    if (this.sheetRole) this.sheetRole.textContent = `${preset.role} • ${preset.gender === 'women' ? 'Women' : 'Men'}`;
    if (this.sheetBio) this.sheetBio.textContent = preset.bio;

    // Palette Swatches
    if (this.sheetPalette && preset.palette) {
      const p = preset.palette;
      const swatches = [
        { label: 'Skin', hex: p.skin },
        { label: 'Primary', hex: p.primary },
        { label: 'Secondary', hex: p.secondary },
        { label: 'Pants', hex: p.pants },
        { label: 'Shoes', hex: p.shoes },
        { label: 'Metal', hex: p.metal || 0xf59e0b }
      ];

      this.sheetPalette.innerHTML = swatches.map(s => `
        <div class="palette-chip" title="${s.label}: #${new THREE.Color(s.hex).getHexString()}">
          <span class="color-dot" style="background-color: #${new THREE.Color(s.hex).getHexString()}"></span>
          <span class="color-name">${s.label}</span>
        </div>
      `).join('');
    }

    // Proportions
    if (this.sheetProportions && preset.proportions) {
      const pr = preset.proportions;
      this.sheetProportions.innerHTML = `
        <div class="prop-stat"><span>Scale</span><strong>${pr.scale}x</strong></div>
        <div class="prop-stat"><span>Shoulder</span><strong>${pr.shoulderWidth}m</strong></div>
        <div class="prop-stat"><span>Chest</span><strong>${pr.chestRadius}m</strong></div>
        <div class="prop-stat"><span>Waist</span><strong>${pr.waistRadius}m</strong></div>
        <div class="prop-stat"><span>Hips</span><strong>${pr.hipRadius}m</strong></div>
        <div class="prop-stat"><span>Torso</span><strong>${pr.torsoHeight}m</strong></div>
      `;
    }

    // Modules
    if (this.sheetOutfit) this.sheetOutfit.textContent = (preset.outfit || 'Standard').replace(/_/g, ' ').toUpperCase();
    if (this.sheetHeadwear) this.sheetHeadwear.textContent = (preset.headwear || 'None').replace(/_/g, ' ').toUpperCase();
    if (this.sheetAccessories) {
      this.sheetAccessories.textContent = (preset.accessories && preset.accessories.length)
        ? preset.accessories.map(a => a.replace(/_/g, ' ').toUpperCase()).join(', ')
        : 'NONE';
    }

    // Gait Traits
    if (this.sheetGait && preset.gait) {
      const g = preset.gait;
      this.sheetGait.innerHTML = `
        <div class="gait-stat"><span>Stride</span><strong>${Math.round(g.stride * 100)}%</strong></div>
        <div class="gait-stat"><span>Arm Swing</span><strong>${Math.round(g.armSwing * 100)}%</strong></div>
        <div class="gait-stat"><span>Bounce</span><strong>${Math.round(g.bounce * 100)}%</strong></div>
        <div class="gait-stat"><span>Hip Sway</span><strong>${Math.round(g.hipSway * 100)}%</strong></div>
      `;
    }
  }

  setAnimMode(mode) {
    this.animMode = mode;
  }

  selectAsPlayer() {
    if (!this.app.playerCtrl) return;
    this.app.playerCtrl.setAvatar(this.selectedId);
    if (this.app.hudCtrl) {
      this.app.hudCtrl.showToast(`🎮 Selected ${CHARACTER_CAST[this.selectedId]?.name} as active character!`);
    }
    this.close();
  }

  open(characterId = null) {
    this.isOpen = true;
    if (this.modal) this.modal.classList.remove('hidden');

    const activeId = characterId || this.app.playerCtrl?.activeAvatar || this.selectedId;
    this.selectCharacter(activeId);
    this._handleResize();

    this.lastTime = performance.now();
    this._startLoop();
  }

  close() {
    this.isOpen = false;
    if (this.modal) this.modal.classList.add('hidden');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  _handleResize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _startLoop() {
    const loop = (now) => {
      if (!this.isOpen) return;
      const delta = Math.min((now - this.lastTime) * 0.001, 0.1);
      this.lastTime = now;
      this.animTime += delta;

      // Auto-turntable rotation
      if (this.autoRotate) {
        this.turntableYaw += delta * 0.65;
        if (this.modelPivot) this.modelPivot.rotation.y = this.turntableYaw;
      }

      // Animate Rig
      this._updatePreviewAnimation(delta);

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  _updatePreviewAnimation(delta) {
    const r = this.previewRig;
    if (!r) return;

    const t = this.animTime;
    const gait = r.preset?.gait || { stride: 1.0, armSwing: 1.0, posture: 0.04, bounce: 1.0, hipSway: 0.04 };

    switch (this.animMode) {
      case 'NEUTRAL': {
        // Natural subtle breathing and stance
        const breath = Math.sin(t * 2.2);
        r.hips.position.set(0, 1.35 + breath * 0.008, 0);
        r.hips.rotation.set(0, 0, 0);
        r.torso.rotation.set(0.02 + breath * 0.015, 0, 0);

        r.leftArmUpper.rotation.set(0, 0, 0.12);
        r.leftArmLower.rotation.set(-0.15 + breath * 0.02, 0, 0);

        r.rightArmUpper.rotation.set(0, 0, -0.12);
        r.rightArmLower.rotation.set(-0.15 + breath * 0.02, 0, 0);

        r.leftLegUpper.rotation.set(0, 0, 0.04);
        r.leftLegLower.rotation.set(0, 0, 0);

        r.rightLegUpper.rotation.set(0, 0, -0.04);
        r.rightLegLower.rotation.set(0, 0, 0);

        r.headPivot.rotation.set(0.01 + Math.sin(t * 1.4) * 0.03, Math.sin(t * 0.8) * 0.05, 0);
        break;
      }

      case 'WALK': {
        const freq = 7.5;
        const phase = t * freq;
        const stride = 0.65 * (gait.stride || 1.0);
        const armSwing = 0.52 * (gait.armSwing || 1.0);
        const bounce = 0.06 * (gait.bounce || 1.0);
        const hipSway = (gait.hipSway || 0.04);
        const posture = (gait.posture || 0.04);

        r.leftLegUpper.rotation.x = Math.sin(phase) * stride;
        r.leftLegLower.rotation.x = Math.max(0, -Math.sin(phase) * stride * 0.9);

        r.rightLegUpper.rotation.x = -Math.sin(phase) * stride;
        r.rightLegLower.rotation.x = Math.max(0, Math.sin(phase) * stride * 0.9);

        r.leftArmUpper.rotation.set(-Math.sin(phase) * armSwing, 0, 0.06);
        r.leftArmLower.rotation.set(-(0.18 + Math.max(0, -Math.sin(phase) * 0.38)), 0, 0);

        r.rightArmUpper.rotation.set(Math.sin(phase) * armSwing, 0, -0.06);
        r.rightArmLower.rotation.set(-(0.18 + Math.max(0, Math.sin(phase) * 0.38)), 0, 0);

        r.hips.position.y = 1.35 + Math.abs(Math.sin(phase * 2)) * bounce;
        r.hips.rotation.y = Math.sin(phase) * hipSway;
        r.torso.rotation.set(posture, -Math.sin(phase) * 0.08, 0);
        r.headPivot.rotation.set(0.02, -r.torso.rotation.y * 0.85, 0);
        break;
      }

      case 'RUN': {
        const freq = 13.0;
        const phase = t * freq;
        const stride = 0.98;
        const armSwing = 0.95;

        r.leftLegUpper.rotation.x = Math.sin(phase) * stride;
        r.leftLegLower.rotation.x = Math.max(0, -Math.sin(phase) * stride * 1.15);

        r.rightLegUpper.rotation.x = -Math.sin(phase) * stride;
        r.rightLegLower.rotation.x = Math.max(0, Math.sin(phase) * stride * 1.15);

        r.leftArmUpper.rotation.set(-Math.sin(phase) * armSwing, 0, 0.12);
        r.leftArmLower.rotation.set(-0.85, 0, 0);

        r.rightArmUpper.rotation.set(Math.sin(phase) * armSwing, 0, -0.12);
        r.rightArmLower.rotation.set(-0.85, 0, 0);

        r.hips.position.y = 1.35 + Math.abs(Math.sin(phase * 2)) * 0.11;
        r.hips.rotation.y = Math.sin(phase) * 0.08;
        r.torso.rotation.set(0.18, -Math.sin(phase) * 0.14, 0);
        r.headPivot.rotation.set(0.04, -r.torso.rotation.y * 0.85, 0);
        break;
      }

      case 'SIT': {
        // Chair sitting posture
        const breath = Math.sin(t * 1.8);
        r.hips.position.set(0, 1.05 + breath * 0.005, -0.15);
        r.hips.rotation.set(0, 0, 0);

        r.torso.rotation.set(-0.06 + breath * 0.012, 0, 0);

        r.leftLegUpper.rotation.set(-1.54, 0, 0.06);
        r.leftLegLower.rotation.set(1.54, 0, 0);

        r.rightLegUpper.rotation.set(-1.54, 0, -0.06);
        r.rightLegLower.rotation.set(1.54, 0, 0);

        r.leftArmUpper.rotation.set(-0.42, 0, 0.12);
        r.leftArmLower.rotation.set(-1.15, 0, 0);

        r.rightArmUpper.rotation.set(-0.42, 0, -0.12);
        r.rightArmLower.rotation.set(-1.15, 0, 0);

        r.headPivot.rotation.set(0.04, Math.sin(t * 0.7) * 0.04, 0);
        break;
      }

      case 'DANCE': {
        const beat = t * 6.5;
        const s = Math.sin(beat);
        const c = Math.cos(beat);

        r.hips.position.set(s * 0.08, 1.35 + Math.abs(c) * 0.08, 0);
        r.hips.rotation.y = s * 0.28;

        r.torso.rotation.set(0.08 + Math.abs(s) * 0.06, -s * 0.22, c * 0.08);

        r.leftArmUpper.rotation.set(-1.25 + s * 0.45, 0, 0.45);
        r.leftArmLower.rotation.set(-1.35 - c * 0.4, 0, 0);

        r.rightArmUpper.rotation.set(-1.25 - s * 0.45, 0, -0.45);
        r.rightArmLower.rotation.set(-1.35 + c * 0.4, 0, 0);

        r.leftLegUpper.rotation.x = -s * 0.4;
        r.leftLegLower.rotation.x = Math.max(0, s * 0.5);

        r.rightLegUpper.rotation.x = s * 0.4;
        r.rightLegLower.rotation.x = Math.max(0, -s * 0.5);

        r.headPivot.rotation.set(0.05, -s * 0.15, 0);
        break;
      }
    }
  }
}
