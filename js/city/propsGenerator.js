import * as THREE from 'three';

/**
 * PropsGenerator — Street Furniture, Traffic Lights, Lampposts, Boats & Bridges
 */

export class PropsGenerator {
  constructor() {
    this.materials = {
      metalPole: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, flatShading: true }),
      lampHead: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, flatShading: true }),
      lampBulb: new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfde047,
        emissiveIntensity: 0.2,
        roughness: 0.2
      }),
      trafficBox: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, flatShading: true }),
      lightRed: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.9 }),
      lightAmber: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.2 }),
      lightGreen: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.9 }),
      hydrantRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7, flatShading: true }),
      boatHullWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, flatShading: true }),
      boatDeckTeak: new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8, flatShading: true }),
      boatSail: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide }),
      bridgeConcrete: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8, flatShading: true })
    };

    this.streetLights = [];
  }

  /**
   * Modern Low-Poly Streetlight
   */
  createStreetLight(height = 5) {
    const group = new THREE.Group();

    // Base flange
    const baseGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 6);
    const base = new THREE.Mesh(baseGeo, this.materials.metalPole);
    base.position.y = 0.15;
    group.add(base);

    // Vertical pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, height, 6);
    const pole = new THREE.Mesh(poleGeo, this.materials.metalPole);
    pole.position.y = height / 2;
    pole.castShadow = true;
    group.add(pole);

    // Horizontal arm
    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 1.4);
    const arm = new THREE.Mesh(armGeo, this.materials.metalPole);
    arm.position.set(0, height, 0.7);
    group.add(arm);

    // Lamp fixture head
    const headGeo = new THREE.BoxGeometry(0.4, 0.15, 0.6);
    const head = new THREE.Mesh(headGeo, this.materials.lampHead);
    head.position.set(0, height - 0.08, 1.2);
    group.add(head);

    // Glowing bulb surface
    const bulbGeo = new THREE.PlaneGeometry(0.32, 0.5);
    bulbGeo.rotateX(Math.PI / 2);
    const bulb = new THREE.Mesh(bulbGeo, this.materials.lampBulb);
    bulb.position.set(0, height - 0.16, 1.2);
    group.add(bulb);

    this.streetLights.push(bulb);
    return group;
  }

  /**
   * Low-Poly Traffic Light
   */
  createTrafficLight(height = 4.2) {
    const group = new THREE.Group();

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, height, 6);
    const pole = new THREE.Mesh(poleGeo, this.materials.metalPole);
    pole.position.y = height / 2;
    pole.castShadow = true;
    group.add(pole);

    // Traffic light housing box
    const boxGeo = new THREE.BoxGeometry(0.5, 1.5, 0.4);
    const box = new THREE.Mesh(boxGeo, this.materials.trafficBox);
    box.position.set(0, height - 0.6, 0.2);
    box.castShadow = true;
    group.add(box);

    // Red, Amber, Green light lenses
    const lensGeo = new THREE.SphereGeometry(0.14, 6, 6);
    const red = new THREE.Mesh(lensGeo, this.materials.lightRed);
    red.position.set(0, height - 0.2, 0.4);
    group.add(red);

    const amber = new THREE.Mesh(lensGeo, this.materials.lightAmber);
    amber.position.set(0, height - 0.6, 0.4);
    group.add(amber);

    const green = new THREE.Mesh(lensGeo, this.materials.lightGreen);
    green.position.set(0, height - 1.0, 0.4);
    group.add(green);

    return group;
  }

  /**
   * Low-Poly Fire Hydrant
   */
  createFireHydrant() {
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.8, 6);
    const body = new THREE.Mesh(bodyGeo, this.materials.hydrantRed);
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);

    const capGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const cap = new THREE.Mesh(capGeo, this.materials.hydrantRed);
    cap.position.y = 0.82;
    group.add(cap);

    const valveGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
    valveGeo.rotateZ(Math.PI / 2);
    const valve = new THREE.Mesh(valveGeo, this.materials.hydrantRed);
    valve.position.y = 0.5;
    group.add(valve);

    return group;
  }

  /**
   * Low-Poly Yacht / Sailboat for Marina
   */
  createSailboat() {
    const group = new THREE.Group();

    // Geometric boat hull
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-1.2, -3.0);
    hullShape.lineTo(1.2, -3.0);
    hullShape.lineTo(1.4, 1.0);
    hullShape.lineTo(0, 3.8); // pointed bow
    hullShape.lineTo(-1.4, 1.0);
    hullShape.closePath();

    const extrudeSettings = { depth: 1.2, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.2, bevelThickness: 0.2 };
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    hullGeo.rotateX(Math.PI / 2);
    const hull = new THREE.Mesh(hullGeo, this.materials.boatHullWhite);
    hull.position.y = 0.3;
    hull.castShadow = true;
    group.add(hull);

    // Wooden deck
    const deckGeo = new THREE.BoxGeometry(2.0, 0.2, 4.5);
    const deck = new THREE.Mesh(deckGeo, this.materials.boatDeckTeak);
    deck.position.set(0, 0.8, -0.2);
    group.add(deck);

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.12, 6.5, 6);
    const mast = new THREE.Mesh(mastGeo, this.materials.metalPole);
    mast.position.set(0, 4.0, 0);
    mast.castShadow = true;
    group.add(mast);

    // Geometric Triangular Sail
    const sailGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 1.5, 0,
      0, 6.5, 0,
      0, 1.8, -2.8
    ]);
    sailGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, this.materials.boatSail);
    sail.castShadow = true;
    group.add(sail);

    group.userData = {
      baseY: 0,
      bobPhase: Math.random() * Math.PI * 2
    };

    return group;
  }

  /**
   * Update Streetlight emissive brightness for Day/Night cycle
   */
  updateDayNight(nightFactor) {
    const bulbGlow = 0.1 + nightFactor * 1.4;
    this.materials.lampBulb.emissiveIntensity = bulbGlow;
  }
}
