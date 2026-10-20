import * as THREE from 'three';

/**
 * NatureGenerator — Procedural Low-Poly Trees, Fountain, Rocks & Park Props
 */

export class NatureGenerator {
  constructor() {
    this.materials = {
      trunkWood: new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9, flatShading: true }),
      darkWood: new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9, flatShading: true }),
      pineGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true }),
      pineDeep: new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8, flatShading: true }),
      oakGreen: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8, flatShading: true }),
      limeGreen: new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.8, flatShading: true }),
      cherryPink: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7, flatShading: true }),
      cherryBlush: new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.7, flatShading: true }),
      stoneGrey: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true }),
      fountainWater: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.3, flatShading: true }),
      benchWood: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8, flatShading: true }),
      metalBlack: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, flatShading: true }),

      // Sahelian & Hadejia Wetland Flora & Crafts
      palmTrunk: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9, flatShading: true }),
      palmFrond: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true }),
      palmDates: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, flatShading: true }),
      neemGreen: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85, flatShading: true }),
      baobabTrunk: new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.95, flatShading: true }),
      acaciaGreen: new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8, flatShading: true }),
      canoeWood: new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85, flatShading: true }),
      canoeInterior: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9, flatShading: true })
    };
  }

  /**
   * Low-Poly Pine / Conifer Tree
   */
  createPineTree(height = 6, scale = 1.0) {
    const group = new THREE.Group();
    const trunkH = height * 0.35;
    const trunkR = 0.35 * scale;

    // Faceted trunk
    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 5);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.trunkWood);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // 3 stacked tiered cones
    const tiers = 3;
    const coneH = (height * 0.75) / tiers;
    for (let i = 0; i < tiers; i++) {
      const radius = (2.2 - i * 0.5) * scale;
      const coneGeo = new THREE.ConeGeometry(radius, coneH * 1.3, 6);
      const cone = new THREE.Mesh(coneGeo, i % 2 === 0 ? this.materials.pineGreen : this.materials.pineDeep);
      cone.position.y = trunkH + i * coneH * 0.85 + coneH * 0.5;
      cone.rotation.y = (i * Math.PI) / 3;
      cone.castShadow = true;
      group.add(cone);
    }

    group.scale.set(scale, scale, scale);
    return group;
  }

  /**
   * Low-Poly Broadleaf / Oak Tree
   */
  createOakTree(height = 7, scale = 1.0) {
    const group = new THREE.Group();
    const trunkH = height * 0.45;
    const trunkR = 0.45 * scale;

    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.75, trunkR, trunkH, 6);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.trunkWood);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Clustered faceted icosahedrons for foliage canopy
    const foliageGroup = new THREE.Group();
    const foliageOffsets = [
      { x: 0, y: trunkH + 1.6, z: 0, r: 2.2, mat: this.materials.oakGreen },
      { x: 0.9, y: trunkH + 1.2, z: 0.6, r: 1.5, mat: this.materials.limeGreen },
      { x: -0.8, y: trunkH + 1.4, z: -0.7, r: 1.6, mat: this.materials.oakGreen },
      { x: 0.5, y: trunkH + 2.5, z: -0.4, r: 1.4, mat: this.materials.limeGreen }
    ];

    foliageOffsets.forEach(cfg => {
      const geo = new THREE.IcosahedronGeometry(cfg.r * scale, 1);
      const mesh = new THREE.Mesh(geo, cfg.mat);
      mesh.position.set(cfg.x * scale, cfg.y, cfg.z * scale);
      mesh.castShadow = true;
      foliageGroup.add(mesh);
    });

    group.add(foliageGroup);
    group.scale.set(scale, scale, scale);
    return group;
  }

  /**
   * Low-Poly Cherry Blossom Tree
   */
  createCherryTree(height = 6.5, scale = 1.0) {
    const group = new THREE.Group();
    const trunkH = height * 0.4;
    const trunkR = 0.4 * scale;

    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.6, trunkR, trunkH, 5);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.darkWood);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageOffsets = [
      { x: 0, y: trunkH + 1.5, z: 0, r: 2.1, mat: this.materials.cherryPink },
      { x: 0.8, y: trunkH + 1.1, z: 0.7, r: 1.4, mat: this.materials.cherryBlush },
      { x: -0.7, y: trunkH + 1.3, z: -0.6, r: 1.5, mat: this.materials.cherryPink }
    ];

    foliageOffsets.forEach(cfg => {
      const geo = new THREE.IcosahedronGeometry(cfg.r * scale, 1);
      const mesh = new THREE.Mesh(geo, cfg.mat);
      mesh.position.set(cfg.x * scale, cfg.y, cfg.z * scale);
      mesh.castShadow = true;
      group.add(mesh);
    });

    group.scale.set(scale, scale, scale);
    return group;
  }

  /**
   * Low-Poly Central Park Fountain with animated water jets
   */
  createParkFountain(radius = 4.5) {
    const group = new THREE.Group();

    // Outer octagonal stone basin
    const basinGeo = new THREE.CylinderGeometry(radius, radius * 1.05, 0.9, 8);
    const basin = new THREE.Mesh(basinGeo, this.materials.stoneGrey);
    basin.position.y = 0.45;
    basin.castShadow = true;
    basin.receiveShadow = true;
    group.add(basin);

    // Water surface inside basin
    const waterGeo = new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, 0.7, 8);
    const water = new THREE.Mesh(waterGeo, this.materials.fountainWater);
    water.position.y = 0.55;
    group.add(water);

    // Center Pedestal
    const pedGeo = new THREE.CylinderGeometry(1.0, 1.2, 1.8, 8);
    const ped = new THREE.Mesh(pedGeo, this.materials.stoneGrey);
    ped.position.y = 1.3;
    ped.castShadow = true;
    group.add(ped);

    // Center Tier Bowl
    const bowlGeo = new THREE.CylinderGeometry(1.8, 1.2, 0.6, 8);
    const bowl = new THREE.Mesh(bowlGeo, this.materials.stoneGrey);
    bowl.position.y = 2.4;
    bowl.castShadow = true;
    group.add(bowl);

    // Center Spout Water column
    const spoutGeo = new THREE.ConeGeometry(0.35, 1.5, 6);
    spoutGeo.rotateX(Math.PI);
    const spout = new THREE.Mesh(spoutGeo, this.materials.fountainWater);
    spout.position.y = 3.3;
    group.add(spout);

    // Spray particles (oscillated in animation loop)
    const sprayCount = 16;
    const sprayGeos = new THREE.DodecahedronGeometry(0.12, 0);
    const sprayGroup = new THREE.Group();

    for (let i = 0; i < sprayCount; i++) {
      const angle = (i / sprayCount) * Math.PI * 2;
      const dist = 0.8 + Math.random() * 0.7;
      const droplet = new THREE.Mesh(sprayGeos, this.materials.fountainWater);
      droplet.position.set(Math.cos(angle) * dist, 2.7 + Math.random() * 0.8, Math.sin(angle) * dist);
      droplet.userData = {
        baseY: droplet.position.y,
        speed: 2 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2
      };
      sprayGroup.add(droplet);
    }
    group.add(sprayGroup);
    group.userData.sprayGroup = sprayGroup;

    return group;
  }

  /**
   * Low-Poly Park Bench
   */
  createBench() {
    const group = new THREE.Group();

    // Wooden slats
    const slatGeo = new THREE.BoxGeometry(2.0, 0.12, 0.6);
    const seat = new THREE.Mesh(slatGeo, this.materials.benchWood);
    seat.position.y = 0.6;
    seat.castShadow = true;
    group.add(seat);

    const backGeo = new THREE.BoxGeometry(2.0, 0.5, 0.12);
    const back = new THREE.Mesh(backGeo, this.materials.benchWood);
    back.position.set(0, 0.95, -0.25);
    back.castShadow = true;
    group.add(back);

    // Metal legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.6, 0.6);
    [-0.85, 0.85].forEach(x => {
      const leg = new THREE.Mesh(legGeo, this.materials.metalBlack);
      leg.position.set(x, 0.3, 0);
      leg.castShadow = true;
      group.add(leg);
    });

    return group;
  }

  /**
   * Low-Poly Rock Boulder
   */
  createRock(scale = 1.0) {
    const geo = new THREE.DodecahedronGeometry(1.2 * scale, 0);
    const rock = new THREE.Mesh(geo, this.materials.stoneGrey);
    rock.position.y = 0.6 * scale;
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
  }

  /**
   * Traditional Hadejia Date Palm (Kwanan Dabino)
   */
  createDatePalmTree(height = 9, scale = 1.0) {
    const group = new THREE.Group();
    const trunkH = height * 0.85;

    // Segmented ringed palm trunk (slightly curved for realism)
    const segments = 8;
    const segH = trunkH / segments;
    let curY = 0;
    let curX = 0;
    const curveAmount = (Math.random() - 0.5) * 0.25;

    for (let i = 0; i < segments; i++) {
      const r = (0.35 - i * 0.015) * scale;
      const segGeo = new THREE.CylinderGeometry(r * 0.92, r, segH, 7);
      const seg = new THREE.Mesh(segGeo, this.materials.palmTrunk);
      seg.position.set(curX, curY + segH / 2, 0);
      seg.rotation.z = curveAmount * (i / segments);
      seg.castShadow = true;
      group.add(seg);

      curY += segH;
      curX += curveAmount * 0.2;
    }

    // Top Frond Crown
    const crownY = curY;
    const frondCount = 10;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.55 * scale, 3.8 * scale, 4);
      frondGeo.rotateX(Math.PI / 2.6);
      const frond = new THREE.Mesh(frondGeo, this.materials.palmFrond);
      frond.position.set(curX, crownY, 0);
      frond.rotation.y = angle;
      frond.castShadow = true;
      group.add(frond);
    }

    // Clusters of Orange Hadejia Dates (Dabino)
    for (let i = 0; i < 3; i++) {
      const dAngle = (i / 3) * Math.PI * 2 + 0.3;
      const dateGeo = new THREE.DodecahedronGeometry(0.35 * scale, 0);
      const dateCluster = new THREE.Mesh(dateGeo, this.materials.palmDates);
      dateCluster.position.set(
        curX + Math.cos(dAngle) * 0.45 * scale,
        crownY - 0.35 * scale,
        Math.sin(dAngle) * 0.45 * scale
      );
      group.add(dateCluster);
    }

    group.scale.set(scale, scale, scale);
    return group;
  }

  /**
   * Shady Hadejia Neem Tree (Dogon Yaro)
   */
  createNeemTree(height = 7.5, scale = 1.0) {
    const group = new THREE.Group();
    const trunkH = height * 0.4;
    const trunkR = 0.4 * scale;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(trunkR * 0.8, trunkR, trunkH, 6),
      this.materials.trunkWood
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Large, sprawling rounded canopy clusters
    const canopyY = trunkH;
    const sphereClusters = [
      { x: 0, y: 1.8, z: 0, r: 2.4 },
      { x: -1.2, y: 1.2, z: 0.8, r: 1.8 },
      { x: 1.2, y: 1.3, z: -0.6, r: 1.9 },
      { x: 0.6, y: 1.1, z: 1.3, r: 1.7 },
      { x: -0.8, y: 1.0, z: -1.1, r: 1.7 }
    ];

    sphereClusters.forEach(c => {
      const sphereGeo = new THREE.DodecahedronGeometry(c.r * scale, 1);
      const canopy = new THREE.Mesh(sphereGeo, this.materials.neemGreen);
      canopy.position.set(c.x * scale, canopyY + c.y * scale, c.z * scale);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      group.add(canopy);
    });

    group.scale.set(scale, scale, scale);
    return group;
  }

  /**
   * Ancient Sahelian Baobab Tree (Kuka)
   */
  createBaobabTree(height = 8, scale = 1.0) {
    const group = new THREE.Group();
    const trunkH = height * 0.55;
    const trunkR = 1.4 * scale;

    // Massive flared trunk
    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.75, trunkR * 1.15, trunkH, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.baobabTrunk);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Gnarled thick branches
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const branchGeo = new THREE.CylinderGeometry(0.25 * scale, 0.5 * scale, 3.2 * scale, 5);
      branchGeo.rotateZ(Math.PI / 3.2);
      const branch = new THREE.Mesh(branchGeo, this.materials.baobabTrunk);
      branch.position.set(
        Math.cos(angle) * trunkR * 0.5,
        trunkH * 0.9,
        Math.sin(angle) * trunkR * 0.5
      );
      branch.rotation.y = angle;
      branch.castShadow = true;
      group.add(branch);

      // Light sparse canopy tuff
      const tuffGeo = new THREE.DodecahedronGeometry(1.2 * scale, 0);
      const tuff = new THREE.Mesh(tuffGeo, this.materials.pineGreen);
      tuff.position.set(
        Math.cos(angle) * 2.8 * scale,
        trunkH + 2.0 * scale,
        Math.sin(angle) * 2.8 * scale
      );
      tuff.castShadow = true;
      group.add(tuff);
    }

    group.scale.set(scale, scale, scale);
    return group;
  }

  /**
   * Umbrella Thorn Acacia (Gabasawa)
   */
  createAcaciaTree(height = 6.5, scale = 1.0) {
    const group = new THREE.Group();
    const trunkH = height * 0.6;
    const trunkR = 0.28 * scale;

    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.8, trunkR, trunkH, 5);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.trunkWood);
    trunk.position.set(0.3 * scale, trunkH / 2, 0);
    trunk.rotation.z = -0.15;
    trunk.castShadow = true;
    group.add(trunk);

    // Flat umbrella canopy
    const canopyY = trunkH;
    const canopyGeo = new THREE.CylinderGeometry(2.8 * scale, 1.4 * scale, 0.7 * scale, 7);
    const canopy = new THREE.Mesh(canopyGeo, this.materials.acaciaGreen);
    canopy.position.set(0.6 * scale, canopyY, 0);
    canopy.castShadow = true;
    group.add(canopy);

    group.scale.set(scale, scale, scale);
    return group;
  }

  /**
   * Traditional Hadejia River Dugout Canoe (Kwalekwale)
   */
  createTraditionalCanoe() {
    const group = new THREE.Group();

    // Elongated curved wooden hull
    const hullGeo = new THREE.BoxGeometry(1.0, 0.5, 4.2);
    const hull = new THREE.Mesh(hullGeo, this.materials.canoeWood);
    hull.position.y = 0.25;
    hull.castShadow = true;
    group.add(hull);

    // Hollow interior
    const interiorGeo = new THREE.BoxGeometry(0.75, 0.4, 3.6);
    const interior = new THREE.Mesh(interiorGeo, this.materials.canoeInterior);
    interior.position.y = 0.35;
    group.add(interior);

    // Pointed bow and stern
    const bowGeo = new THREE.ConeGeometry(0.5, 0.9, 4);
    bowGeo.rotateX(-Math.PI / 2);
    const bow = new THREE.Mesh(bowGeo, this.materials.canoeWood);
    bow.position.set(0, 0.25, 2.5);
    group.add(bow);

    const sternGeo = new THREE.ConeGeometry(0.5, 0.7, 4);
    sternGeo.rotateX(Math.PI / 2);
    const stern = new THREE.Mesh(sternGeo, this.materials.canoeWood);
    stern.position.set(0, 0.25, -2.4);
    group.add(stern);

    // Wooden paddle
    const oarGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 5);
    const oar = new THREE.Mesh(oarGeo, this.materials.benchWood);
    oar.rotation.set(0.3, 0.2, 0.4);
    oar.position.set(0.2, 0.4, 0.5);
    group.add(oar);

    // Fishing basket / catch of fresh Hadejia fish
    const basketGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.3, 6);
    const basket = new THREE.Mesh(basketGeo, this.materials.palmDates);
    basket.position.set(0, 0.4, -0.6);
    group.add(basket);

    return group;
  }
}
