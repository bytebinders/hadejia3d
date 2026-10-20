import * as THREE from 'three';

/**
 * MonorailSystem — Elevated High-Speed Metropolis Monorail
 * Elevated tracks on pylons with a 3-car streamlined train traversing the skyline.
 */

export class MonorailSystem {
  constructor(scene, collisionSys = null) {
    this.scene = scene;
    this.collisionSys = collisionSys;
    this.group = new THREE.Group();
    this.group.name = 'MonorailSystem';
    this.scene.add(this.group);

    this.trackHeight = 9.5;
    this.trainCars = [];
    this.progress = 0;
    this.speed = 0.055;

    this.materials = {
      beamConcrete: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, flatShading: true }),
      pylonSteel: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.4, flatShading: true }),
      trainBody: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2, flatShading: true }),
      trainStripeCyan: new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.6, flatShading: true }),
      trainGlass: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.6, flatShading: true }),
      headlightBeam: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9 })
    };

    this._buildTrackLoop();
    this._buildTrain();
  }

  _buildTrackLoop() {
    // Monorail track loop waypoints
    const y = this.trackHeight;
    this.trackPoints = [
      new THREE.Vector3(-95, y, -65),
      new THREE.Vector3(-25, y, -65),
      new THREE.Vector3(25,  y, -65),
      new THREE.Vector3(75,  y, -65),
      new THREE.Vector3(100, y, -40),
      new THREE.Vector3(100, y, 40),
      new THREE.Vector3(75,  y, 65),
      new THREE.Vector3(25,  y, 65),
      new THREE.Vector3(-45, y, 65),
      new THREE.Vector3(-95, y, 35)
    ];

    // Create continuous smooth closed curve
    this.curve = new THREE.CatmullRomCurve3(this.trackPoints, true, 'catmullrom', 0.25);

    // Build elevated rail track geometry
    const trackGeo = new THREE.TubeGeometry(this.curve, 180, 0.45, 6, true);
    const trackMesh = new THREE.Mesh(trackGeo, this.materials.beamConcrete);
    trackMesh.castShadow = true;
    trackMesh.receiveShadow = true;
    this.group.add(trackMesh);

    // Build support pylons every 15-20 units along the curve
    const pylonSamples = 20;
    for (let i = 0; i < pylonSamples; i++) {
      const u = i / pylonSamples;
      const pt = this.curve.getPointAt(u);

      // Vertical column
      const colGeo = new THREE.CylinderGeometry(0.55, 0.75, y, 6);
      const col = new THREE.Mesh(colGeo, this.materials.pylonSteel);
      col.position.set(pt.x, y / 2, pt.z);
      col.castShadow = true;
      col.receiveShadow = true;
      this.group.add(col);

      // T-Beam Head
      const tGeo = new THREE.BoxGeometry(2.4, 0.5, 0.8);
      const tHead = new THREE.Mesh(tGeo, this.materials.pylonSteel);
      tHead.position.set(pt.x, y - 0.25, pt.z);
      tHead.castShadow = true;
      this.group.add(tHead);

      if (this.collisionSys) {
        this.collisionSys.addCircleCollider(pt.x, pt.z, 0.75, 'Monorail Pylon');
      }
    }
  }

  _buildTrain() {
    this.trainRoot = new THREE.Group();

    // 3 Cars: Lead Car, Middle Car, Rear Car
    const carOffsets = [0, -3.8, -7.6];
    const carNames = ['Lead', 'Mid', 'Rear'];

    carOffsets.forEach((offset, idx) => {
      const carGroup = new THREE.Group();

      // Main aerodynamic body
      const bodyGeo = new THREE.BoxGeometry(1.6, 1.4, 3.4);
      const body = new THREE.Mesh(bodyGeo, this.materials.trainBody);
      body.position.y = 0.8;
      body.castShadow = true;
      carGroup.add(body);

      // Sleek Neon Accent Stripe along lower body
      const stripeGeo = new THREE.BoxGeometry(1.65, 0.15, 3.4);
      const stripe = new THREE.Mesh(stripeGeo, this.materials.trainStripeCyan);
      stripe.position.y = 0.35;
      carGroup.add(stripe);

      // Glass Windows
      const winGeo = new THREE.BoxGeometry(1.65, 0.5, 2.6);
      const win = new THREE.Mesh(winGeo, this.materials.trainGlass);
      win.position.set(0, 0.9, 0);
      carGroup.add(win);

      // If Lead Car, add angled nose & headlight
      if (idx === 0) {
        const noseGeo = new THREE.ConeGeometry(0.9, 1.2, 4);
        noseGeo.rotateX(-Math.PI / 2);
        noseGeo.rotateY(Math.PI / 4);
        const nose = new THREE.Mesh(noseGeo, this.materials.trainBody);
        nose.position.set(0, 0.8, 2.2);
        carGroup.add(nose);

        // Front Headlight Beam
        const lightGeo = new THREE.SphereGeometry(0.25, 6, 6);
        const light = new THREE.Mesh(lightGeo, this.materials.headlightBeam);
        light.position.set(0, 0.7, 2.7);
        carGroup.add(light);
      }

      carGroup.userData = { offsetU: offset * 0.003 };
      this.trainRoot.add(carGroup);
      this.trainCars.push(carGroup);
    });

    this.group.add(this.trainRoot);
  }

  /**
   * Update train position and orientation along curve
   */
  update(delta) {
    this.progress += (this.speed * delta * 0.15);
    if (this.progress >= 1.0) this.progress -= 1.0;

    this.trainCars.forEach(car => {
      let u = this.progress + car.userData.offsetU;
      if (u < 0) u += 1.0;
      if (u >= 1.0) u -= 1.0;

      const pos = this.curve.getPointAt(u);
      car.position.copy(pos);

      // Tangent for forward direction
      const tangent = this.curve.getTangentAt(u);
      const lookTarget = pos.clone().add(tangent);
      car.lookAt(lookTarget);
    });
  }

  /**
   * Get Lead car position and forward direction for Train Cam
   */
  getLeadCarCameraTarget() {
    if (!this.trainCars.length) return null;
    const leadCar = this.trainCars[0];
    const pos = leadCar.position.clone();
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(leadCar.quaternion);

    return {
      camPos: pos.clone().sub(forward.clone().multiplyScalar(7)).add(new THREE.Vector3(0, 4, 0)),
      lookTarget: pos.clone().add(forward.clone().multiplyScalar(10))
    };
  }

  /**
   * Day/Night lighting updates
   */
  updateDayNight(nightFactor) {
    this.materials.trainStripeCyan.emissiveIntensity = 0.5 + nightFactor * 1.2;
    this.materials.headlightBeam.emissiveIntensity = 0.8 + nightFactor * 1.5;
  }
}
