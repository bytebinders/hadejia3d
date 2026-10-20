import * as THREE from 'three';

/**
 * TrafficSystem — Autonomous & Driveable Vehicle Fleet with Realistic Scaling
 * Features realistically proportioned Sedans, Taxis, Buses, Trucks, and Coupes
 * with turning front wheels, spinning tires, driver cabins, and manual player drive mode.
 */

export class TrafficSystem {
  constructor(scene, roadSplines) {
    this.scene = scene;
    this.roadSplines = roadSplines || [];
    this.vehicles = [];
    this.trafficGroup = new THREE.Group();
    this.trafficGroup.name = 'TrafficGroup';
    this.scene.add(this.trafficGroup);

    this.materials = {
      bodyYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.2, flatShading: true }),
      bodyRed: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.2, flatShading: true }),
      bodyBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.2, flatShading: true }),
      bodyWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2, flatShading: true }),
      bodyCyanSports: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.25, metalness: 0.4, flatShading: true }),
      bodyOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.2, flatShading: true }),
      bodyGreenBus: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4, metalness: 0.1, flatShading: true }),
      bodyDarkSlate: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.5, flatShading: true }),
      windowDark: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.6, flatShading: true }),
      wheelRubber: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, flatShading: true }),
      wheelRim: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.7, flatShading: true }),
      headlight: new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.2 }),
      taillight: new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xef4444, emissiveIntensity: 0.2 }),
      taxiSign: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.4 }),
      bumperBlack: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, flatShading: true })
    };

    this.headlightsList = [];
    this.taillightsList = [];
  }

  /**
   * Spawn vehicles with realistic proportions relative to humans
   */
  spawnVehicles(count = 24) {
    this.clear();

    // 1. Spawn a dedicated, parked Player Sports Roadster right at the Central Park entrance curb
    this.playerCar = this._createCoupe(this.materials.bodyCyanSports);
    this.playerCar.position.set(-31.5, 1.47, 25);
    this.playerCar.rotation.y = 0;
    this.trafficGroup.add(this.playerCar);

    const playerVehicleObj = {
      mesh: this.playerCar,
      path: null,
      progress: 0,
      speed: 0,
      type: 'coupe',
      name: 'Player Cyan Roadster',
      isDrivenByPlayer: false,
      isParked: true
    };
    this.vehicles.push(playerVehicleObj);

    // 2. Spawn Autonomous Traffic Fleet (featuring ubiquitous Northern Nigerian Keke Napep tricycles)
    const carTypes = ['keke', 'keke', 'sedan', 'bus', 'truck'];

    for (let i = 0; i < count; i++) {
      const type = carTypes[i % carTypes.length];
      const splineIndex = i % this.roadSplines.length;
      const pathPoints = this.roadSplines[splineIndex];

      if (!pathPoints || pathPoints.length < 2) continue;

      let vehicleGroup;
      if (type === 'keke') vehicleGroup = this._createKekeNapep();
      else if (type === 'bus') vehicleGroup = this._createBus();
      else if (type === 'truck') vehicleGroup = this._createTruck();
      else if (type === 'coupe') vehicleGroup = this._createCoupe();
      else vehicleGroup = this._createSedan();

      const speed = type === 'keke' ? (0.08 + Math.random() * 0.04) : (0.07 + Math.random() * 0.05);
      const startT = (i / count);

      const vehicle = {
        mesh: vehicleGroup,
        path: pathPoints,
        progress: startT,
        speed: speed,
        type: type,
        name: type === 'keke' ? `KEKE NAPEP #${i + 1}` : `${type.toUpperCase()} #${i + 1}`,
        isDrivenByPlayer: false,
        isParked: false
      };

      this.trafficGroup.add(vehicleGroup);
      this.vehicles.push(vehicle);
    }
  }

  /**
   * Authentic Nigerian Keke Napep Tricycle Taxi
   * (~3.2m L x 1.8m W x 2.1m H) with vibrant yellow chassis, green canopy roof,
   * open passenger sides, windshield, and headlights.
   */
  _createKekeNapep() {
    const group = new THREE.Group();
    const w = 1.8;
    const l = 3.2;
    const wheelR = 0.38;

    // Main Cabin Body (Vibrant Yellow)
    const kekeMat = this.materials.bodyYellow;
    const chassisGeo = new THREE.BoxGeometry(w, 0.55, l);
    const chassis = new THREE.Mesh(chassisGeo, kekeMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    group.add(chassis);

    // Front Nose & Handlebar Dashboard
    const noseGeo = new THREE.BoxGeometry(w * 0.85, 0.6, 1.0);
    const nose = new THREE.Mesh(noseGeo, kekeMat);
    nose.position.set(0, 0.85, 1.1);
    group.add(nose);

    // Windshield Frame & Glass
    const windFrameGeo = new THREE.BoxGeometry(w * 0.82, 0.65, 0.08);
    const wind = new THREE.Mesh(windFrameGeo, this.materials.windowDark);
    wind.position.set(0, 1.45, 0.8);
    group.add(wind);

    // Curved Canopy Roof (Iconic Northern Nigerian Green Tarp)
    const roofGeo = new THREE.BoxGeometry(w * 0.95, 0.12, l * 0.85);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85, flatShading: true });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 1.95, -0.1);
    roof.castShadow = true;
    group.add(roof);

    // Tubular Canopy Pillars
    [-w * 0.42, w * 0.42].forEach(x => {
      [0.8, -l * 0.42].forEach(z => {
        const pillarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.bumperBlack);
        pillar.position.set(x, 1.35, z);
        group.add(pillar);
      });
    });

    // Passenger Bench Seat (Black Vinyl)
    const benchGeo = new THREE.BoxGeometry(w * 0.85, 0.35, 0.7);
    const bench = new THREE.Mesh(benchGeo, this.materials.bumperBlack);
    bench.position.set(0, 0.88, -0.6);
    group.add(bench);

    // Front Center Headlight
    const hlGeo = new THREE.BoxGeometry(0.32, 0.22, 0.1);
    const hl = new THREE.Mesh(hlGeo, this.materials.headlight);
    hl.position.set(0, 0.9, l / 2 + 0.05);
    group.add(hl);
    this.headlightsList.push(hl);

    // Rear Dual Taillights
    [-w * 0.35, w * 0.35].forEach(x => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.1), this.materials.taillight);
      tl.position.set(x, 0.7, -l / 2 - 0.05);
      group.add(tl);
      this.taillightsList.push(tl);
    });

    // Articulated Wheels
    this._addArticulatedWheels(group, w, l, wheelR, [-l * 0.32, l * 0.35]);

    group.userData.driverSeatOffset = new THREE.Vector3(0, 0.42, 0.3);
    group.userData.exitOffset = new THREE.Vector3(-1.6, 0, 0.3);
    group.userData.wheelRadius = wheelR;

    return group;
  }

  /**
   * Realistically Scaled Sedan (~5.4m L x 2.6m W x 1.85m H)
   */
  _createSedan(customMat = null) {
    const group = new THREE.Group();
    const colors = [this.materials.bodyRed, this.materials.bodyBlue, this.materials.bodyWhite, this.materials.bodyDarkSlate];
    const bodyMat = customMat || colors[Math.floor(Math.random() * colors.length)];

    const w = 2.6;
    const l = 5.4;
    const wheelR = 0.44;

    // Chassis Lower Body
    const chassisGeo = new THREE.BoxGeometry(w, 0.7, l);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Aerodynamic Hood (Front)
    const hoodGeo = new THREE.BoxGeometry(w * 0.94, 0.45, 1.8);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.9, 1.6);
    hood.castShadow = true;
    group.add(hood);

    // Cabin with Tinted Glass
    const cabinGeo = new THREE.BoxGeometry(w * 0.88, 0.85, 2.6);
    const cabin = new THREE.Mesh(cabinGeo, this.materials.windowDark);
    cabin.position.set(0, 1.35, -0.3);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof Panel
    const roofGeo = new THREE.BoxGeometry(w * 0.82, 0.1, 2.3);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 1.8, -0.3);
    roof.castShadow = true;
    group.add(roof);

    // Front & Rear Bumpers
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.35, 0.3), this.materials.bumperBlack);
    frontBumper.position.set(0, 0.45, l / 2 + 0.1);
    group.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.35, 0.3), this.materials.bumperBlack);
    rearBumper.position.set(0, 0.45, -l / 2 - 0.1);
    group.add(rearBumper);

    // Side Mirrors
    [-w / 2 - 0.12, w / 2 + 0.12].forEach(x => {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.25), bodyMat);
      mirror.position.set(x, 1.15, 0.8);
      group.add(mirror);
    });

    this._addLights(group, w, l, 0.72);
    this._addArticulatedWheels(group, w, l, wheelR);

    // Driver seat & exit offsets
    group.userData.driverSeatOffset = new THREE.Vector3(-0.55, 0.45, 0.1);
    group.userData.exitOffset = new THREE.Vector3(-2.2, 0, 0.1);
    group.userData.wheelRadius = wheelR;

    return group;
  }

  /**
   * Realistically Scaled Metropolis Taxi Cab
   */
  _createTaxi() {
    const group = this._createSedan(this.materials.bodyYellow);

    // Glowing Rooftop Taxi Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.45), this.materials.taxiSign);
    sign.position.set(0, 1.98, -0.3);
    sign.castShadow = true;
    group.add(sign);

    return group;
  }

  /**
   * Realistically Scaled Sports Coupe (~5.2m L x 2.6m W x 1.6m H)
   */
  _createCoupe(customMat = null) {
    const group = new THREE.Group();
    const colors = [this.materials.bodyRed, this.materials.bodyOrange, this.materials.bodyCyanSports, this.materials.bodyDarkSlate];
    const bodyMat = customMat || colors[Math.floor(Math.random() * colors.length)];

    const w = 2.6;
    const l = 5.2;
    const wheelR = 0.44;

    // Sleek Lower Body
    const bodyGeo = new THREE.BoxGeometry(w, 0.6, l);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.58;
    body.castShadow = true;
    group.add(body);

    // Slanted aerodynamic cockpit
    const roofGeo = new THREE.BoxGeometry(w * 0.85, 0.65, 2.4);
    const roof = new THREE.Mesh(roofGeo, this.materials.windowDark);
    roof.position.set(0, 1.15, -0.3);
    roof.castShadow = true;
    group.add(roof);

    // Rear Spoiler
    const spoilerBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.08, 0.35), bodyMat);
    spoilerBar.position.set(0, 1.05, -l / 2 + 0.3);
    group.add(spoilerBar);

    [-w * 0.35, w * 0.35].forEach(x => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.1), bodyMat);
      stand.position.set(x, 0.95, -l / 2 + 0.3);
      group.add(stand);
    });

    this._addLights(group, w, l, 0.62);
    this._addArticulatedWheels(group, w, l, wheelR);

    group.userData.driverSeatOffset = new THREE.Vector3(-0.5, 0.38, 0.05);
    group.userData.exitOffset = new THREE.Vector3(-2.2, 0, 0.05);
    group.userData.wheelRadius = wheelR;

    return group;
  }

  /**
   * Realistically Scaled City Transit Bus (~12.0m L x 3.2m W x 3.5m H)
   */
  _createBus() {
    const group = new THREE.Group();
    const w = 3.2;
    const l = 12.0;
    const h = 2.8;
    const wheelR = 0.62;

    // Bus Body
    const busGeo = new THREE.BoxGeometry(w, h, l);
    const bus = new THREE.Mesh(busGeo, this.materials.bodyGreenBus);
    bus.position.y = 1.9;
    bus.castShadow = true;
    group.add(bus);

    // Panoramic Window Strip
    const winGeo = new THREE.BoxGeometry(w * 1.02, 1.0, l * 0.92);
    const win = new THREE.Mesh(winGeo, this.materials.windowDark);
    win.position.set(0, 2.3, 0);
    group.add(win);

    // Front Windshield
    const shieldGeo = new THREE.BoxGeometry(w * 0.95, 1.2, 0.3);
    const shield = new THREE.Mesh(shieldGeo, this.materials.windowDark);
    shield.position.set(0, 2.2, l / 2 + 0.02);
    group.add(shield);

    this._addLights(group, w, l, 1.0);
    this._addArticulatedWheels(group, w, l, wheelR, [-l * 0.35, l * 0.32]);

    group.userData.driverSeatOffset = new THREE.Vector3(-0.8, 1.2, l / 2 - 1.6);
    group.userData.exitOffset = new THREE.Vector3(-2.5, 0, l / 2 - 1.6);
    group.userData.wheelRadius = wheelR;

    return group;
  }

  /**
   * Realistically Scaled Delivery Box Truck (~8.4m L x 3.0m W x 3.5m H)
   */
  _createTruck() {
    const group = new THREE.Group();
    const w = 3.0;
    const l = 8.4;
    const wheelR = 0.58;

    // Driver Cab
    const cabGeo = new THREE.BoxGeometry(w, 2.1, 2.6);
    const cab = new THREE.Mesh(cabGeo, this.materials.bodyOrange);
    cab.position.set(0, 1.6, l / 2 - 1.3);
    cab.castShadow = true;
    group.add(cab);

    // Cab windshield
    const winGeo = new THREE.BoxGeometry(w * 1.02, 0.8, 1.6);
    const win = new THREE.Mesh(winGeo, this.materials.windowDark);
    win.position.set(0, 1.9, l / 2 - 1.1);
    group.add(win);

    // Large Cargo Box
    const cargoGeo = new THREE.BoxGeometry(w * 1.04, 2.7, 5.6);
    const cargo = new THREE.Mesh(cargoGeo, this.materials.bodyWhite);
    cargo.position.set(0, 2.0, -1.2);
    cargo.castShadow = true;
    group.add(cargo);

    this._addLights(group, w, l, 0.85);
    this._addArticulatedWheels(group, w, l, wheelR, [-l * 0.32, l * 0.28]);

    group.userData.driverSeatOffset = new THREE.Vector3(-0.7, 1.0, l / 2 - 1.2);
    group.userData.exitOffset = new THREE.Vector3(-2.4, 0, l / 2 - 1.2);
    group.userData.wheelRadius = wheelR;

    return group;
  }

  _addLights(parent, width, length, height) {
    const halfW = width * 0.36;
    const halfL = length * 0.5;

    // Headlights
    [-halfW, halfW].forEach(x => {
      const hlGeo = new THREE.BoxGeometry(0.38, 0.22, 0.12);
      const hl = new THREE.Mesh(hlGeo, this.materials.headlight);
      hl.position.set(x, height, halfL + 0.05);
      parent.add(hl);
      this.headlightsList.push(hl);
    });

    // Taillights
    [-halfW, halfW].forEach(x => {
      const tlGeo = new THREE.BoxGeometry(0.42, 0.18, 0.12);
      const tl = new THREE.Mesh(tlGeo, this.materials.taillight);
      tl.position.set(x, height, -halfL - 0.05);
      parent.add(tl);
      this.taillightsList.push(tl);
    });
  }

  /**
   * Add articulated wheels that can steer and spin
   */
  _addArticulatedWheels(parent, width, length, radius, zOffsets = null) {
    const halfW = width * 0.5 + 0.06;
    const zPos = zOffsets || [-length * 0.3, length * 0.3];
    const wheelThickness = 0.42;

    const frontWheels = [];
    const allWheels = [];

    zPos.forEach((z, zIdx) => {
      const isFront = (zIdx === 1); // Front wheels have steering pivot

      [-halfW, halfW].forEach(x => {
        const steerPivot = new THREE.Group();
        steerPivot.position.set(x, radius, z);
        parent.add(steerPivot);

        const wheelMeshGroup = new THREE.Group();
        steerPivot.add(wheelMeshGroup);

        // Rubber Tire
        const tireGeo = new THREE.CylinderGeometry(radius, radius, wheelThickness, 12);
        tireGeo.rotateZ(Math.PI / 2);
        const tire = new THREE.Mesh(tireGeo, this.materials.wheelRubber);
        tire.castShadow = true;
        wheelMeshGroup.add(tire);

        // Rim
        const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, wheelThickness + 0.02, 8);
        rimGeo.rotateZ(Math.PI / 2);
        const rim = new THREE.Mesh(rimGeo, this.materials.wheelRim);
        wheelMeshGroup.add(rim);

        allWheels.push(wheelMeshGroup);
        if (isFront) frontWheels.push(steerPivot);
      });
    });

    parent.userData.frontWheels = frontWheels;
    parent.userData.allWheels = allWheels;
  }

  /**
   * Update autonomous vehicles along closed road splines
   */
  update(delta) {
    if (!this.vehicles.length) return;

    this.vehicles.forEach(v => {
      // If player is currently driving this vehicle or it's parked, skip automated spline logic
      if (v.isDrivenByPlayer || v.isParked || !v.path) return;

      const pts = v.path;
      const numPts = pts.length;

      v.progress += (v.speed * delta * 0.2);
      if (v.progress >= 1.0) v.progress -= 1.0;

      const floatIdx = v.progress * numPts;
      const currIdx = Math.floor(floatIdx);
      const nextIdx = (currIdx + 1) % numPts;
      const t = floatIdx - currIdx;

      const p1 = pts[currIdx];
      const p2 = pts[nextIdx];

      v.mesh.position.lerpVectors(p1, p2, t);

      // Facing orientation
      const dirX = p2.x - p1.x;
      const dirZ = p2.z - p1.z;
      if (Math.abs(dirX) > 0.001 || Math.abs(dirZ) > 0.001) {
        v.mesh.rotation.y = Math.atan2(dirX, dirZ);
      }

      // Spin wheels
      if (v.mesh.userData && v.mesh.userData.allWheels) {
        const rotSpeed = delta * 12;
        v.mesh.userData.allWheels.forEach(w => w.rotation.x += rotSpeed);
      }
    });
  }

  /**
   * Find nearest vehicle to a given position
   */
  getNearestVehicle(pos, maxDist = 5.0) {
    let nearest = null;
    let minDist = maxDist;

    for (const v of this.vehicles) {
      if (v.isDrivenByPlayer) continue;
      const dist = pos.distanceTo(v.mesh.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = v;
      }
    }

    return nearest;
  }

  updateDayNight(nightFactor) {
    const hlGlow = 0.1 + nightFactor * 1.5;
    const tlGlow = 0.1 + nightFactor * 1.4;

    this.materials.headlight.emissiveIntensity = hlGlow;
    this.materials.taillight.emissiveIntensity = tlGlow;
  }

  clear() {
    while (this.trafficGroup.children.length > 0) {
      this.trafficGroup.remove(this.trafficGroup.children[0]);
    }
    this.vehicles = [];
    this.headlightsList = [];
    this.taillightsList = [];
  }
}
