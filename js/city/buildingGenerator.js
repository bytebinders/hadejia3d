import * as THREE from 'three';

/**
 * BuildingGenerator — Procedural Low-Poly Architectural Archetypes
 * Generates faceted skyscrapers, lofts, complexes, and towers with glowing windows.
 */

export class BuildingGenerator {
  constructor() {
    this.materials = this._initMaterials();
    this.nightWindows = []; // Array of window materials to toggle emissive glow
  }

  _initMaterials() {
    return {
      // Concrete & Stone
      concreteLight: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8, flatShading: true }),
      concreteWarm: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8, flatShading: true }),
      slateDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, flatShading: true }),
      midnightObsidian: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, flatShading: true }),
      
      // Glass & High-tech
      glassCyan: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.2, flatShading: true }),
      glassNavy: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.1, flatShading: true }),
      glassTeal: new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.3, metalness: 0.2, flatShading: true }),

      // Warm Brick & Terracotta
      terracotta: new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.9, flatShading: true }),
      brickWarm: new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.9, flatShading: true }),
      sandstone: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.8, flatShading: true }),
      creamStucco: new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8, flatShading: true }),

      // Accents & Metals
      metalSteel: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.6, flatShading: true }),
      metalDark: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.5, flatShading: true }),
      woodWaterTank: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9, flatShading: true }),
      accentNeonCyan: new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.6, flatShading: true }),
      accentNeonMagenta: new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.6, flatShading: true }),
      helipadGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true }),
      hazardRed: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 }),

      // Authentic Hadejia & Hausa-Fulani Materials
      adobeEarthy: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.95, flatShading: true }),
      adobeWarmClay: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.92, flatShading: true }),
      tubaliRed: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9, flatShading: true }),
      sandstoneOchre: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.85, flatShading: true }),
      mosqueWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45, flatShading: true }),
      domeEmerald: new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.25, metalness: 0.15, flatShading: true }),
      domeGold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.7, flatShading: true }),
      marketStripe1: new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7, flatShading: true }),
      marketStripe2: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7, flatShading: true }),
      marketStripe3: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7, flatShading: true }),
      marketStripe4: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7, flatShading: true }),
      gateWood: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85, flatShading: true }),

      // Windows (emissive toggled by lighting manager)
      windowLitWarm: new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfde047,
        emissiveIntensity: 0.15,
        roughness: 0.3,
        flatShading: true
      }),
      windowLitCyan: new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.2,
        roughness: 0.3,
        flatShading: true
      }),
      windowUnlit: new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.5,
        flatShading: true
      })
    };
  }

  /**
   * Archetype 1: Corporate Stepped Skyscraper
   */
  createSteppedSkyscraper(width = 10, depth = 10, height = 40) {
    const group = new THREE.Group();
    const tier1H = height * 0.45;
    const tier2H = height * 0.35;
    const tier3H = height * 0.20;

    // Base podium
    const b1Geo = new THREE.BoxGeometry(width, tier1H, depth);
    const b1Mat = this.materials.slateDark;
    const b1 = new THREE.Mesh(b1Geo, b1Mat);
    b1.position.y = tier1H / 2;
    b1.castShadow = true;
    b1.receiveShadow = true;
    group.add(b1);

    // Windows on base tier
    this._addWindowColumns(group, width * 0.9, tier1H * 0.85, depth * 0.9, tier1H / 2, 4, 6);

    // Tier 2 (stepped in)
    const t2W = width * 0.78;
    const t2D = depth * 0.78;
    const b2Geo = new THREE.BoxGeometry(t2W, tier2H, t2D);
    const b2 = new THREE.Mesh(b2Geo, this.materials.glassNavy);
    b2.position.y = tier1H + tier2H / 2;
    b2.castShadow = true;
    b2.receiveShadow = true;
    group.add(b2);

    this._addWindowColumns(group, t2W * 0.9, tier2H * 0.85, t2D * 0.9, tier1H + tier2H / 2, 3, 5);

    // Tier 3 (top tower)
    const t3W = width * 0.55;
    const t3D = depth * 0.55;
    const b3Geo = new THREE.BoxGeometry(t3W, tier3H, t3D);
    const b3 = new THREE.Mesh(b3Geo, this.materials.slateDark);
    b3.position.y = tier1H + tier2H + tier3H / 2;
    b3.castShadow = true;
    b3.receiveShadow = true;
    group.add(b3);

    // Rooftop Helipad
    const padR = t3W * 0.38;
    const padGeo = new THREE.CylinderGeometry(padR, padR, 0.4, 16);
    const pad = new THREE.Mesh(padGeo, this.materials.helipadGreen);
    pad.position.y = height + 0.2;
    group.add(pad);

    // Rooftop Antenna Spire with blinking beacon
    const antGeo = new THREE.CylinderGeometry(0.1, 0.35, 8, 6);
    const antenna = new THREE.Mesh(antGeo, this.materials.metalSteel);
    antenna.position.set(0, height + 4, 0);
    antenna.castShadow = true;
    group.add(antenna);

    const beaconGeo = new THREE.SphereGeometry(0.3, 6, 6);
    const beacon = new THREE.Mesh(beaconGeo, this.materials.hazardRed);
    beacon.position.set(0, height + 8.1, 0);
    group.add(beacon);

    group.userData = {
      name: 'Apex Zenith Tower',
      district: 'Financial Core',
      height: `${Math.round(height * 3.5)} m`,
      floors: `${Math.round(height * 0.9)} LVL`,
      energyRating: 'A+ Eco',
      occupancy: '96%',
      tenants: ['Apex Global Holdings', 'Chronos FinTech', 'Vertex Capital', 'Aether Cloud']
    };

    return group;
  }

  /**
   * Archetype 2: Angular CyberTech Monolith
   */
  createAngularMonolith(width = 8, depth = 8, height = 36) {
    const group = new THREE.Group();

    // Tapered sheared prism
    const geo = new THREE.CylinderGeometry(width * 0.35, width * 0.52, height, 4);
    geo.rotateY(Math.PI / 4);
    const mat = this.materials.midnightObsidian;
    const tower = new THREE.Mesh(geo, mat);
    tower.position.y = height / 2;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Glowing Neon Vertical Accent Strips
    const neonGeo = new THREE.BoxGeometry(0.35, height * 0.85, 0.35);
    const neonMat = this.materials.accentNeonCyan;
    
    const offsets = [
      [width * 0.44, 0],
      [-width * 0.44, 0],
      [0, depth * 0.44],
      [0, -depth * 0.44]
    ];
    offsets.forEach(([ox, oz]) => {
      const neonStrip = new THREE.Mesh(neonGeo, neonMat);
      neonStrip.position.set(ox, height * 0.5, oz);
      group.add(neonStrip);
    });

    // Angular roof crown with AC units
    const crownGeo = new THREE.CylinderGeometry(width * 0.38, width * 0.35, 2, 4);
    crownGeo.rotateY(Math.PI / 4);
    const crown = new THREE.Mesh(crownGeo, this.materials.metalSteel);
    crown.position.y = height + 1;
    group.add(crown);

    // Rooftop AC chiller units
    for (let i = 0; i < 2; i++) {
      const acGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
      const ac = new THREE.Mesh(acGeo, this.materials.metalDark);
      ac.position.set((i === 0 ? -1 : 1) * 1.2, height + 1.2, 0);
      ac.castShadow = true;
      group.add(ac);
    }

    // Windows
    this._addWindowColumns(group, width * 0.75, height * 0.7, depth * 0.75, height * 0.45, 3, 7);

    group.userData = {
      name: 'CyberTech Monolith',
      district: 'Tech Innovation Quarter',
      height: `${Math.round(height * 3.4)} m`,
      floors: `${Math.round(height * 0.85)} LVL`,
      energyRating: 'Platinum Net-Zero',
      occupancy: '99%',
      tenants: ['Synapse AI Research', 'Quantum Gateways', 'NeuralNet Robotics']
    };

    return group;
  }

  /**
   * Archetype 3: Terracotta / Brick Multi-Tier Residential Lofts
   */
  createResidentialLofts(width = 9, depth = 9, height = 24) {
    const group = new THREE.Group();

    // Main brick body
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeo, this.materials.terracotta);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Concrete base trim
    const baseTrimGeo = new THREE.BoxGeometry(width * 1.04, 2, depth * 1.04);
    const baseTrim = new THREE.Mesh(baseTrimGeo, this.materials.concreteLight);
    baseTrim.position.y = 1;
    group.add(baseTrim);

    // Balconies
    const balcGeo = new THREE.BoxGeometry(2.4, 0.4, 1.2);
    const balcRailGeo = new THREE.BoxGeometry(2.4, 0.6, 0.15);

    for (let h = 4; h < height - 2; h += 4) {
      // Front and back balconies
      [-depth / 2 - 0.5, depth / 2 + 0.5].forEach((zPos, idx) => {
        const balc = new THREE.Mesh(balcGeo, this.materials.metalSteel);
        balc.position.set(0, h, zPos);
        balc.castShadow = true;
        group.add(balc);

        const rail = new THREE.Mesh(balcRailGeo, this.materials.metalDark);
        rail.position.set(0, h + 0.4, zPos + (idx === 0 ? -0.5 : 0.5));
        group.add(rail);
      });
    }

    // Rooftop Wooden Water Tank on steel stilts
    const tankH = 3;
    const tankR = 1.4;
    const tankGeo = new THREE.CylinderGeometry(tankR, tankR, tankH, 10);
    const tank = new THREE.Mesh(tankGeo, this.materials.woodWaterTank);
    tank.position.set(width * 0.25, height + tankH / 2 + 1.2, depth * 0.25);
    tank.castShadow = true;
    group.add(tank);

    // Stilts
    const stiltGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 4);
    for (let dx = -0.8; dx <= 0.8; dx += 1.6) {
      for (let dz = -0.8; dz <= 0.8; dz += 1.6) {
        const stilt = new THREE.Mesh(stiltGeo, this.materials.metalDark);
        stilt.position.set(width * 0.25 + dx, height + 0.7, depth * 0.25 + dz);
        group.add(stilt);
      }
    }

    // Windows
    this._addWindowColumns(group, width * 0.95, height * 0.75, depth * 0.95, height * 0.48, 3, 5, this.materials.windowLitWarm);

    group.userData = {
      name: 'Brickstone Grand Residences',
      district: 'Old Town Arts Quarter',
      height: `${Math.round(height * 3.2)} m`,
      floors: `${Math.round(height * 0.75)} LVL`,
      energyRating: 'A Heritage Eco',
      occupancy: '92%',
      tenants: ['Canal Lofts', 'Urban Artisan Studios', 'Terrace Cafe & Bakery']
    };

    return group;
  }

  /**
   * Archetype 4: Modern Cantilevered Minimalist Complex
   */
  createCantileveredComplex(width = 11, depth = 11, height = 28) {
    const group = new THREE.Group();

    // Box 1 (Ground & 1st floor)
    const b1W = width * 0.8;
    const b1H = height * 0.35;
    const b1D = depth * 0.85;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(b1W, b1H, b1D), this.materials.concreteWarm);
    b1.position.set(-width * 0.08, b1H / 2, 0);
    b1.castShadow = true;
    b1.receiveShadow = true;
    group.add(b1);

    // Box 2 (Cantilevered Middle Layer rotated/shifted)
    const b2W = width * 0.9;
    const b2H = height * 0.35;
    const b2D = depth * 0.75;
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(b2W, b2H, b2D), this.materials.slateDark);
    b2.position.set(width * 0.08, b1H + b2H / 2, depth * 0.05);
    b2.castShadow = true;
    b2.receiveShadow = true;
    group.add(b2);

    // Box 3 (Top penthouse terrace)
    const b3W = width * 0.65;
    const b3H = height * 0.3;
    const b3D = depth * 0.65;
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(b3W, b3H, b3D), this.materials.glassCyan);
    b3.position.set(-width * 0.05, b1H + b2H + b3H / 2, -depth * 0.05);
    b3.castShadow = true;
    b3.receiveShadow = true;
    group.add(b3);

    // Rooftop Solar Panel array
    for (let sx = -1.8; sx <= 1.8; sx += 1.8) {
      const panelGeo = new THREE.BoxGeometry(1.4, 0.15, 2.2);
      const panel = new THREE.Mesh(panelGeo, this.materials.midnightObsidian);
      panel.rotation.x = 0.25;
      panel.position.set(sx + 1.2, height + 0.3, 1.2);
      group.add(panel);
    }

    // Windows
    this._addWindowColumns(group, b1W * 0.9, b1H * 0.7, b1D * 0.9, b1H / 2, 3, 2);
    this._addWindowColumns(group, b2W * 0.9, b2H * 0.7, b2D * 0.9, b1H + b2H / 2, 4, 3, this.materials.windowLitCyan);

    group.userData = {
      name: 'Prism Cantilever Plaza',
      district: 'Waterfront Promenade',
      height: `${Math.round(height * 3.3)} m`,
      floors: `${Math.round(height * 0.8)} LVL`,
      energyRating: 'Solar Carbon-Negative',
      occupancy: '98%',
      tenants: ['Vanguard Design Guild', 'Skyline Media Lab', 'Oasis Venture Capital']
    };

    return group;
  }

  /**
   * Archetype 5: Mid-Rise Commercial & Retail Arcade
   */
  createCommercialArcade(width = 10, depth = 8, height = 18) {
    const group = new THREE.Group();

    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.materials.concreteLight);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Ground Floor Retail Glass Curtain
    const glassW = width * 0.92;
    const glassH = 3.5;
    const glassGeo = new THREE.BoxGeometry(glassW, glassH, depth + 0.15);
    const glass = new THREE.Mesh(glassGeo, this.materials.glassTeal);
    glass.position.set(0, glassH / 2 + 0.2, 0);
    group.add(glass);

    // Striped Cafe / Retail Awning
    const awningGeo = new THREE.BoxGeometry(width * 0.88, 0.25, 1.8);
    awningGeo.rotateX(0.2);
    const awning = new THREE.Mesh(awningGeo, this.materials.sandstone);
    awning.position.set(0, 4.0, depth / 2 + 0.8);
    awning.castShadow = true;
    group.add(awning);

    // Low-poly Neon Billboard on roof
    const boardW = width * 0.7;
    const boardH = 3.2;
    const boardGeo = new THREE.BoxGeometry(boardW, boardH, 0.4);
    const board = new THREE.Mesh(boardGeo, this.materials.accentNeonMagenta);
    board.position.set(0, height + boardH / 2, 0);
    board.castShadow = true;
    group.add(board);

    // Billboard support frame
    const frameGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 4);
    [-boardW * 0.4, boardW * 0.4].forEach(x => {
      const leg = new THREE.Mesh(frameGeo, this.materials.metalSteel);
      leg.position.set(x, height + 0.75, 0);
      group.add(leg);
    });

    // Upper floor windows
    this._addWindowColumns(group, width * 0.9, height * 0.55, depth * 0.9, height * 0.65, 4, 3, this.materials.windowLitWarm);

    group.userData = {
      name: 'Cyber Arcade & Galleria',
      district: 'Commercial District',
      height: `${Math.round(height * 3.1)} m`,
      floors: `${Math.round(height * 0.7)} LVL`,
      energyRating: 'B+ Standard',
      occupancy: '95%',
      tenants: ['Neon Coffee Roasters', 'Polis Cyber Lounge', 'Kinetic Apparel Store']
    };

    return group;
  }

  /**
   * Helper: Add glowing low-poly window columns to facades
   */
  _addWindowColumns(parent, spanW, spanH, spanD, centerY, cols, rows, preferredLitMat = null) {
    const winW = (spanW / cols) * 0.45;
    const winH = (spanH / rows) * 0.55;
    const winDepth = 0.12;

    const litMat = preferredLitMat || this.materials.windowLitWarm;
    const unlitMat = this.materials.windowUnlit;

    const winGeo = new THREE.BoxGeometry(winW, winH, winDepth);

    for (let r = 0; r < rows; r++) {
      const y = centerY - spanH / 2 + (r + 0.5) * (spanH / rows);
      for (let c = 0; c < cols; c++) {
        const x = -spanW / 2 + (c + 0.5) * (spanW / cols);

        // Deterministic lit/unlit pattern (approx 70% lit)
        const isLit = (c + r * 3) % 4 !== 0;
        const mat = isLit ? litMat : unlitMat;

        // Front facade window
        const winFront = new THREE.Mesh(winGeo, mat);
        winFront.position.set(x, y, spanD / 2 + 0.06);
        parent.add(winFront);

        // Back facade window
        const winBack = new THREE.Mesh(winGeo, mat);
        winBack.position.set(x, y, -spanD / 2 - 0.06);
        parent.add(winBack);
      }
    }
  }

  /**
   * Update window emissive intensity based on day/night cycle
   * @param {number} nightFactor 0.0 (day) to 1.0 (deep night)
   */
  updateDayNight(nightFactor) {
    // When nightFactor > 0.3, illuminate windows with warm glow
    const warmIntensity = 0.08 + nightFactor * 0.95;
    const cyanIntensity = 0.1 + nightFactor * 1.1;

    this.materials.windowLitWarm.emissiveIntensity = warmIntensity;
    this.materials.windowLitCyan.emissiveIntensity = cyanIntensity;
  }

  /**
   * =========================================================================
   * Hadejia Emirate Landmark 1: Fadar Sarkin Hadejia (Emir of Hadejia's Palace)
   * =========================================================================
   */
  createEmirPalace(width = 22, depth = 18, height = 15) {
    const group = new THREE.Group();

    // 1. Main Royal Clay Palace Pavilion (Tubali Mud Brick)
    const palaceGeo = new THREE.BoxGeometry(width, height * 0.7, depth);
    const palace = new THREE.Mesh(palaceGeo, this.materials.adobeEarthy);
    palace.position.y = (height * 0.7) / 2;
    palace.castShadow = true;
    palace.receiveShadow = true;
    group.add(palace);

    // 2. Grand Ceremonial Portal (Kofar Fada) - Protruding Archway
    const gateW = width * 0.45;
    const gateH = height * 0.85;
    const gateD = depth * 0.35;
    const gateGeo = new THREE.BoxGeometry(gateW, gateH, gateD);
    const gate = new THREE.Mesh(gateGeo, this.materials.adobeWarmClay);
    gate.position.set(0, gateH / 2, depth / 2 + gateD / 4);
    gate.castShadow = true;
    group.add(gate);

    // Archway entrance
    const archHoleGeo = new THREE.BoxGeometry(gateW * 0.5, gateH * 0.65, gateD * 1.2);
    const archHole = new THREE.Mesh(archHoleGeo, this.materials.midnightObsidian);
    archHole.position.set(0, (gateH * 0.65) / 2, depth / 2 + gateD / 4);
    group.add(archHole);

    // Traditional Hausa Geometric Relief Moldings (Jar Kasa Medallions)
    for (let r = 0; r < 3; r++) {
      const reliefGeo = new THREE.BoxGeometry(1.6, 1.6, 0.25);
      const relief = new THREE.Mesh(reliefGeo, this.materials.tubaliRed);
      relief.position.set((r - 1) * 2.8, gateH * 0.75, depth / 2 + gateD / 2 + 0.1);
      group.add(relief);
    }

    // 3. Traditional Hausa Pinnacles (Zankwaye) along Roof Parapets
    const pinnacleGeo = new THREE.ConeGeometry(0.35, 1.6, 5);
    const zankwayePositions = [];
    const stepX = width / 6;
    for (let x = -width / 2 + 1; x <= width / 2 - 1; x += stepX) {
      zankwayePositions.push({ x, z: depth / 2 });
      zankwayePositions.push({ x, z: -depth / 2 });
    }
    const stepZ = depth / 4;
    for (let z = -depth / 2 + 1; z <= depth / 2 - 1; z += stepZ) {
      zankwayePositions.push({ x: -width / 2, z });
      zankwayePositions.push({ x: width / 2, z });
    }
    zankwayePositions.forEach(p => {
      const zankwaye = new THREE.Mesh(pinnacleGeo, this.materials.adobeWarmClay);
      zankwaye.position.set(p.x, height * 0.7 + 0.8, p.z);
      zankwaye.castShadow = true;
      group.add(zankwaye);
    });

    // 4. Central Royal Turret with Emirate Crest
    const turretGeo = new THREE.CylinderGeometry(2.4, 2.8, 3.5, 8);
    const turret = new THREE.Mesh(turretGeo, this.materials.sandstoneOchre);
    turret.position.set(0, height * 0.7 + 1.75, 0);
    turret.castShadow = true;
    group.add(turret);

    // Golden Finial atop Central Turret
    const finialGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const finial = new THREE.Mesh(finialGeo, this.materials.domeGold);
    finial.position.set(0, height * 0.7 + 3.8, 0);
    group.add(finial);

    // 5. Ceremonial Flags of Hadejia Emirate (Green & Red Banners)
    [-gateW * 0.45, gateW * 0.45].forEach(fx => {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 5, 5);
      const pole = new THREE.Mesh(poleGeo, this.materials.metalSteel);
      pole.position.set(fx, gateH + 2.5, depth / 2 + gateD / 2);
      group.add(pole);

      const bannerGeo = new THREE.BoxGeometry(1.6, 0.9, 0.05);
      const banner = new THREE.Mesh(bannerGeo, this.materials.domeEmerald);
      banner.position.set(fx + 0.8, gateH + 4, depth / 2 + gateD / 2);
      group.add(banner);
    });

    group.userData = {
      name: 'Fadar Sarkin Hadejia (Emir of Hadejia Palace)',
      district: 'Palace District & Durbar Square',
      height: `${Math.round(height * 1.5)} m`,
      floors: 'Royal Courtyard & Council Hall',
      energyRating: 'Traditional Sahelian Adobe',
      occupancy: 'Royal Seat of Hadejia Emirate',
      tenants: ['Emir of Hadejia Council', 'Royal Durbar Guards', 'Emirate Traditional Archives']
    };

    return group;
  }

  /**
   * =========================================================================
   * Hadejia Emirate Landmark 2: Masallacin Juma'a (Hadejia Central Mosque)
   * =========================================================================
   */
  createCentralMosque(width = 18, depth = 18, height = 18) {
    const group = new THREE.Group();

    // 1. Grand White Sandstone Prayer Hall
    const hallH = height * 0.65;
    const hallGeo = new THREE.BoxGeometry(width, hallH, depth);
    const hall = new THREE.Mesh(hallGeo, this.materials.mosqueWhite);
    hall.position.y = hallH / 2;
    hall.castShadow = true;
    hall.receiveShadow = true;
    group.add(hall);

    // Arched Cloister Windows
    for (let i = -width / 2 + 2.5; i <= width / 2 - 2.5; i += 3.5) {
      const winGeo = new THREE.BoxGeometry(1.4, 2.8, depth + 0.2);
      const win = new THREE.Mesh(winGeo, this.materials.midnightObsidian);
      win.position.set(i, hallH * 0.5, 0);
      group.add(win);
    }

    // 2. Central Emerald Green Dome (Kubba)
    const domeR = width * 0.32;
    const domeGeo = new THREE.SphereGeometry(domeR, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, this.materials.domeEmerald);
    dome.position.set(0, hallH, 0);
    dome.castShadow = true;
    group.add(dome);

    // Gold Crescent Finial on Dome
    const cresGeo = new THREE.TorusGeometry(0.65, 0.14, 6, 12, Math.PI * 1.4);
    const crescent = new THREE.Mesh(cresGeo, this.materials.domeGold);
    crescent.position.set(0, hallH + domeR + 0.8, 0);
    group.add(crescent);

    // 3. Four Soaring Corner Minarets (Hasumiya)
    const minaretH = height * 1.45;
    const minaretR = 1.1;
    const minOffsets = [
      [-width / 2 + 0.8, -depth / 2 + 0.8],
      [width / 2 - 0.8, -depth / 2 + 0.8],
      [-width / 2 + 0.8, depth / 2 - 0.8],
      [width / 2 - 0.8, depth / 2 - 0.8]
    ];

    minOffsets.forEach(([mx, mz]) => {
      // Octagonal minaret tower
      const minGeo = new THREE.CylinderGeometry(minaretR * 0.75, minaretR, minaretH, 8);
      const minaret = new THREE.Mesh(minGeo, this.materials.mosqueWhite);
      minaret.position.set(mx, minaretH / 2, mz);
      minaret.castShadow = true;
      group.add(minaret);

      // Balcony gallery
      const balcGeo = new THREE.CylinderGeometry(minaretR * 1.3, minaretR * 1.3, 0.6, 8);
      const balc = new THREE.Mesh(balcGeo, this.materials.sandstoneOchre);
      balc.position.set(mx, minaretH * 0.82, mz);
      group.add(balc);

      // Emerald spire cupola
      const spireGeo = new THREE.ConeGeometry(minaretR * 0.8, 3.2, 8);
      const spire = new THREE.Mesh(spireGeo, this.materials.domeEmerald);
      spire.position.set(mx, minaretH + 1.6, mz);
      spire.castShadow = true;
      group.add(spire);

      // Gold spire tip
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), this.materials.domeGold);
      tip.position.set(mx, minaretH + 3.3, mz);
      group.add(tip);
    });

    group.userData = {
      name: 'Masallacin Juma\'a na Hadejia (Central Friday Mosque)',
      district: 'Religious & Islamic Cultural Quarter',
      height: `${Math.round(minaretH * 1.6)} m`,
      floors: 'Grand Prayer Hall & Minarets',
      energyRating: 'Natural Cooling Dome Architecture',
      occupancy: 'Chief Imam & Metropolis Worshippers',
      tenants: ['Hadejia Islamic Council', 'Koranic Education Center', 'Welfare Charity']
    };

    return group;
  }

  /**
   * =========================================================================
   * Hadejia Emirate Landmark 3: Historic City Gates (Kofar Yamma / Kofar Kware)
   * =========================================================================
   */
  createHistoricCityGate(width = 16, depth = 8, height = 12, name = 'Kofar Yamma') {
    const group = new THREE.Group();

    // Twin defensive towers
    const towerW = width * 0.32;
    const towerH = height;
    [-width / 2 + towerW / 2, width / 2 - towerW / 2].forEach(tx => {
      const towGeo = new THREE.BoxGeometry(towerW, towerH, depth);
      const tower = new THREE.Mesh(towGeo, this.materials.adobeWarmClay);
      tower.position.set(tx, towerH / 2, 0);
      tower.castShadow = true;
      group.add(tower);

      // Parapet crenellations
      for (let bx = -towerW / 2 + 0.6; bx <= towerW / 2 - 0.6; bx += 1.2) {
        const crenGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
        const cren = new THREE.Mesh(crenGeo, this.materials.tubaliRed);
        cren.position.set(tx + bx, towerH + 0.4, depth / 2 - 0.4);
        group.add(cren);
      }
    });

    // Central Arch Spanning over Road
    const archH = height * 0.82;
    const archBeamGeo = new THREE.BoxGeometry(width, height * 0.28, depth * 0.85);
    const archBeam = new THREE.Mesh(archBeamGeo, this.materials.adobeEarthy);
    archBeam.position.set(0, archH, 0);
    archBeam.castShadow = true;
    group.add(archBeam);

    // Heavy traditional wooden double gates (open to allow cars & pedestrians)
    const gateDoorGeo = new THREE.BoxGeometry(0.4, height * 0.6, depth * 0.4);
    [-width * 0.2, width * 0.2].forEach(gx => {
      const door = new THREE.Mesh(gateDoorGeo, this.materials.gateWood);
      door.position.set(gx, height * 0.32, 0);
      door.rotation.y = (gx > 0 ? 0.7 : -0.7);
      group.add(door);
    });

    // Arabic & Hausa Calligraphic Signboard atop Gate
    const signGeo = new THREE.BoxGeometry(width * 0.55, 1.4, 0.3);
    const sign = new THREE.Mesh(signGeo, this.materials.mosqueWhite);
    sign.position.set(0, archH + 1.2, depth / 2 + 0.1);
    group.add(sign);

    group.userData = {
      name: `${name} (Ancient Hadejia City Wall Gate)`,
      district: 'Historic City Boundary',
      height: `${Math.round(height * 1.4)} m`,
      floors: 'Defensive Bastions & Gateway',
      energyRating: '19th Century Historical Monument',
      occupancy: 'Open Public Thoroughfare',
      tenants: ['Historic Hadejia Monuments Board', 'Traditional City Gate Keepers']
    };

    return group;
  }

  /**
   * =========================================================================
   * Hadejia Emirate Landmark 4: Babban Kasuwar Hadejia & Kasuwar Kifi
   * =========================================================================
   */
  createKasuwaMarket(width = 16, depth = 14, height = 8) {
    const group = new THREE.Group();

    // Central clay storehouse
    const storeW = width * 0.55;
    const storeD = depth * 0.55;
    const storeH = height * 0.75;
    const store = new THREE.Mesh(
      new THREE.BoxGeometry(storeW, storeH, storeD),
      this.materials.adobeEarthy
    );
    store.position.set(0, storeH / 2, 0);
    store.castShadow = true;
    group.add(store);

    // Open-Air Market Stalls with Striped Colorful Canopies
    const canopyMats = [
      this.materials.marketStripe1,
      this.materials.marketStripe2,
      this.materials.marketStripe3,
      this.materials.marketStripe4
    ];

    const stallOffsets = [
      { x: -width * 0.35, z: depth * 0.35 },
      { x: width * 0.35,  z: depth * 0.35 },
      { x: -width * 0.35, z: -depth * 0.35 },
      { x: width * 0.35,  z: -depth * 0.35 },
      { x: 0,             z: depth * 0.42 }
    ];

    stallOffsets.forEach((s, idx) => {
      // 4 Wooden corner poles
      for (let px = -1.2; px <= 1.2; px += 2.4) {
        for (let pz = -1.2; pz <= 1.2; pz += 2.4) {
          const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5),
            this.materials.gateWood
          );
          pole.position.set(s.x + px, 1.3, s.z + pz);
          group.add(pole);
        }
      }

      // Sloped fabric canopy
      const cGeo = new THREE.BoxGeometry(3.0, 0.12, 3.0);
      const canopy = new THREE.Mesh(cGeo, canopyMats[idx % canopyMats.length]);
      canopy.position.set(s.x, 2.65, s.z);
      canopy.rotation.x = (idx % 2 === 0 ? 0.08 : -0.08);
      canopy.castShadow = true;
      group.add(canopy);

      // Market Table Counter
      const tableGeo = new THREE.BoxGeometry(2.4, 0.8, 1.4);
      const table = new THREE.Mesh(tableGeo, this.materials.sandstoneOchre);
      table.position.set(s.x, 0.4, s.z);
      group.add(table);

      // Produce: Baskets of Hadejia Smoked Fish & Sacks of Grain
      const prodGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.4, 6);
      const prod = new THREE.Mesh(prodGeo, this.materials.tubaliRed);
      prod.position.set(s.x + 0.5, 0.95, s.z);
      group.add(prod);

      const riceBagGeo = new THREE.BoxGeometry(0.6, 0.5, 0.4);
      const riceBag = new THREE.Mesh(riceBagGeo, this.materials.mosqueWhite);
      riceBag.position.set(s.x - 0.4, 0.95, s.z);
      group.add(riceBag);
    });

    group.userData = {
      name: 'Babban Kasuwar Hadejia da Kasuwar Kifi',
      district: 'Commercial & Traditional Trade Center',
      height: `${Math.round(height * 1.8)} m`,
      floors: 'Open-Air Market & Fish Wharf Stores',
      energyRating: 'Natural Shade & Sustainable Craft',
      occupancy: 'Active Trade Hub of Eastern Jigawa',
      tenants: ['Hadejia Fish Traders Union', 'Jigawa Rice Producers', 'Hausa Cap Craftsmen']
    };

    return group;
  }

  /**
   * =========================================================================
   * Hadejia Emirate Landmark 5: Traditional Hausa Residential Compound
   * =========================================================================
   */
  createTraditionalHausaCompound(width = 12, depth = 12, height = 8) {
    const group = new THREE.Group();

    // High perimeter mud wall
    const wallH = height * 0.6;
    const wallThick = 0.6;
    const wallMat = this.materials.adobeEarthy;

    // Outer perimeter walls
    [-depth / 2, depth / 2].forEach(wz => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, wallH, wallThick), wallMat);
      wall.position.set(0, wallH / 2, wz);
      wall.castShadow = true;
      group.add(wall);
    });
    [-width / 2, width / 2].forEach(wx => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, depth), wallMat);
      wall.position.set(wx, wallH / 2, 0);
      wall.castShadow = true;
      group.add(wall);
    });

    // Domed Entrance Chamber (Zaure)
    const zaureW = 3.6;
    const zaureH = height * 0.8;
    const zaure = new THREE.Mesh(
      new THREE.CylinderGeometry(zaureW * 0.45, zaureW * 0.52, zaureH, 8),
      this.materials.adobeWarmClay
    );
    zaure.position.set(0, zaureH / 2, depth / 2);
    zaure.castShadow = true;
    group.add(zaure);

    // Domed thatched / clay roof over Zaure
    const zaureRoof = new THREE.Mesh(
      new THREE.ConeGeometry(zaureW * 0.6, 1.8, 8),
      this.materials.tubaliRed
    );
    zaureRoof.position.set(0, zaureH + 0.9, depth / 2);
    group.add(zaureRoof);

    // Inner Living Quarters
    const houseW = width * 0.6;
    const houseD = depth * 0.45;
    const houseH = height * 0.75;
    const innerHouse = new THREE.Mesh(
      new THREE.BoxGeometry(houseW, houseH, houseD),
      this.materials.sandstoneOchre
    );
    innerHouse.position.set(0, houseH / 2, -depth * 0.15);
    innerHouse.castShadow = true;
    group.add(innerHouse);

    // Rooftop Zankwaye Pinnacles
    for (let px = -houseW / 2 + 0.8; px <= houseW / 2 - 0.8; px += 2.0) {
      const pin = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 1.1, 4),
        this.materials.adobeWarmClay
      );
      pin.position.set(px, houseH + 0.55, -depth * 0.15 + houseD / 2);
      group.add(pin);
    }

    group.userData = {
      name: 'Gidan Gargajiya (Traditional Hausa Compound)',
      district: 'Old Residential Quarters',
      height: `${Math.round(height * 2.1)} m`,
      floors: 'Zaure Entrance & Courtyard Chambers',
      energyRating: 'Sahelian Passive Thermal Comfort',
      occupancy: '98%',
      tenants: ['Traditional Craftsmen', 'Family Residence', 'Herb & Date Store']
    };

    return group;
  }
}
