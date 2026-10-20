import * as THREE from 'three';

/**
 * SkySystem — Drifting Low-Poly Clouds, Circling Zeppelin & Weather Particles
 */

export class SkySystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'SkySystem';
    this.scene.add(this.group);

    this.clouds = [];
    this.isRaining = false;

    this.materials = {
      cloudWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9, flatShading: true }),
      cloudDark: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true }),
      blimpHull: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, flatShading: true }),
      blimpTrim: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, flatShading: true }),
      blimpCabin: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, flatShading: true }),
      blimpProp: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, flatShading: true }),
      rainDrop: new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
    };

    this._buildClouds(12);
    this._buildZeppelin();
    this._buildRainSystem();
  }

  _buildClouds(count = 12) {
    for (let i = 0; i < count; i++) {
      const cloud = this._createSingleCloud();
      cloud.position.set(
        (Math.random() - 0.5) * 220,
        45 + Math.random() * 25,
        (Math.random() - 0.5) * 220
      );
      cloud.userData = {
        speed: 1.5 + Math.random() * 2.5
      };
      this.group.add(cloud);
      this.clouds.push(cloud);
    }
  }

  _createSingleCloud() {
    const group = new THREE.Group();
    const puffCount = 5 + Math.floor(Math.random() * 4);

    for (let p = 0; p < puffCount; p++) {
      const radius = 3.5 + Math.random() * 3.5;
      const puffGeo = new THREE.IcosahedronGeometry(radius, 1);
      const puff = new THREE.Mesh(puffGeo, this.materials.cloudWhite);

      puff.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 6
      );
      puff.castShadow = true;
      group.add(puff);
    }

    const scale = 0.8 + Math.random() * 0.7;
    group.scale.set(scale, scale * 0.6, scale);
    return group;
  }

  _buildZeppelin() {
    const group = new THREE.Group();

    // Main elongated hull
    const hullGeo = new THREE.CylinderGeometry(4.5, 4.5, 26, 8);
    hullGeo.rotateX(Math.PI / 2);
    // Taper ends
    const pos = hullGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const factor = 1.0 - Math.pow(z / 14, 2) * 0.6;
      pos.setX(i, pos.getX(i) * factor);
      pos.setY(i, pos.getY(i) * factor);
    }
    hullGeo.computeVertexNormals();

    const hull = new THREE.Mesh(hullGeo, this.materials.blimpHull);
    hull.castShadow = true;
    group.add(hull);

    // Decorative blue belly stripe
    const stripeGeo = new THREE.BoxGeometry(9.2, 0.4, 20);
    const stripe = new THREE.Mesh(stripeGeo, this.materials.blimpTrim);
    stripe.position.y = -1.2;
    group.add(stripe);

    // Gondola Passenger Cabin
    const cabinGeo = new THREE.BoxGeometry(2.4, 1.8, 8);
    const cabin = new THREE.Mesh(cabinGeo, this.materials.blimpCabin);
    cabin.position.set(0, -4.8, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // Tail Fins (Vertical and Horizontal)
    const finVGeo = new THREE.BoxGeometry(0.3, 7.5, 4.5);
    const finV = new THREE.Mesh(finVGeo, this.materials.blimpTrim);
    finV.position.set(0, 0, -11.5);
    group.add(finV);

    const finHGeo = new THREE.BoxGeometry(7.5, 0.3, 4.5);
    const finH = new THREE.Mesh(finHGeo, this.materials.blimpTrim);
    finH.position.set(0, 0, -11.5);
    group.add(finH);

    // Propellers on engine pods
    this.props = [];
    [-2.2, 2.2].forEach(x => {
      const podGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 6);
      podGeo.rotateX(Math.PI / 2);
      const pod = new THREE.Mesh(podGeo, this.materials.blimpCabin);
      pod.position.set(x, -4.5, -2);
      group.add(pod);

      const propGeo = new THREE.BoxGeometry(2.2, 0.2, 0.08);
      const prop = new THREE.Mesh(propGeo, this.materials.blimpProp);
      prop.position.set(x, -4.5, -3.0);
      group.add(prop);
      this.props.push(prop);
    });

    group.position.set(0, 75, 0);
    this.zeppelin = group;
    this.group.add(group);
  }

  _buildRainSystem() {
    const rainCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 6); // 2 vertices per line streak

    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() - 0.5) * 240;
      const y = Math.random() * 80;
      const z = (Math.random() - 0.5) * 240;

      const idx = i * 6;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      positions[idx + 3] = x - 0.2;
      positions[idx + 4] = y - 2.5; // Streak length
      positions[idx + 5] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainLines = new THREE.LineSegments(geometry, this.materials.rainDrop);
    this.rainLines.visible = false;
    this.group.add(this.rainLines);
  }

  setWeather(weather) {
    if (weather === 'rain') {
      this.isRaining = true;
      this.rainLines.visible = true;
      this.clouds.forEach(c => c.children.forEach(p => p.material = this.materials.cloudDark));
    } else {
      this.isRaining = false;
      this.rainLines.visible = false;
      this.clouds.forEach(c => c.children.forEach(p => p.material = this.materials.cloudWhite));
    }
  }

  /**
   * Update clouds, zeppelin orbit, and rain
   */
  update(time, delta) {
    // Drifting clouds
    this.clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * delta;
      if (cloud.position.x > 130) {
        cloud.position.x = -130;
        cloud.position.z = (Math.random() - 0.5) * 220;
      }
    });

    // Circling Zeppelin
    if (this.zeppelin) {
      const zRadius = 85;
      const zSpeed = 0.12;
      const zAngle = time * zSpeed;
      this.zeppelin.position.x = Math.sin(zAngle) * zRadius;
      this.zeppelin.position.z = Math.cos(zAngle) * zRadius;
      this.zeppelin.rotation.y = zAngle + Math.PI / 2;

      // Spin props
      this.props.forEach(p => p.rotation.z += delta * 25);
    }

    // Falling rain streaks
    if (this.isRaining && this.rainLines) {
      const pos = this.rainLines.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 2) {
        let y = pos.getY(i) - 90 * delta;
        if (y < 0) y = 80;
        pos.setY(i, y);
        pos.setY(i + 1, y - 2.5);
      }
      pos.needsUpdate = true;
    }
  }
}
