import * as THREE from 'three';

/**
 * CollisionSystem — High-Performance 2D Grid / AABB Collision Engine
 * Prevents players, pedestrians, and vehicles from moving through solid objects:
 * Buildings, Fountains, Trees, Canal Water, Streetlights, and Vehicles.
 */

export class CollisionSystem {
  constructor() {
    this.boxColliders = [];
    this.circleColliders = [];
    this.elevationZones = [];
    this.trafficSys = null;
    this.baseGroundY = 1.4;
  }

  setTrafficSystem(trafficSys) {
    this.trafficSys = trafficSys;
  }

  /**
   * Add a rectangular elevation zone (e.g. grass lawns, stone pathways, bridge decks, docks)
   */
  addElevationZone(minX, maxX, minZ, maxZ, height, name = '') {
    this.elevationZones.push({
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
      height,
      name
    });
    // Sort descending by height so topmost platform wins on overlaps
    this.elevationZones.sort((a, b) => b.height - a.height);
  }

  /**
   * Get the exact ground elevation at (x, z)
   */
  getGroundHeight(x, z) {
    for (let i = 0; i < this.elevationZones.length; i++) {
      const zone = this.elevationZones[i];
      if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
        return zone.height;
      }
    }
    return this.baseGroundY;
  }

  /**
   * Add a box / rectangular obstacle
   */
  addBoxCollider(minX, maxX, minZ, maxZ, name = '') {
    this.boxColliders.push({
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
      name
    });
  }

  /**
   * Add a circular / radial obstacle (e.g. fountain, tree trunk, pillar)
   */
  addCircleCollider(x, z, radius, name = '') {
    this.circleColliders.push({
      x,
      z,
      radius,
      radiusSq: radius * radius,
      name
    });
  }

  /**
   * Automatically calculate and register a building's ground footprint
   */
  addBuildingCollider(buildingGroup, padding = 0.2) {
    const box = new THREE.Box3().setFromObject(buildingGroup);
    // Ignore small rooftop antennas in XZ span by taking ground-level bounds
    this.addBoxCollider(
      box.min.x - padding,
      box.max.x + padding,
      box.min.z - padding,
      box.max.z + padding,
      buildingGroup.userData.name || 'Building'
    );
  }

  /**
   * Test if a point with given radius intersects any solid obstacle
   */
  isBlocked(x, z, radius = 0.35, excludeMesh = null) {
    // 1. City outer bounds
    const bound = 104;
    if (x - radius < -bound || x + radius > bound || z - radius < -bound || z + radius > bound) {
      return true;
    }

    // 2. Box Colliders (Buildings, walls, canal boundaries)
    for (let i = 0; i < this.boxColliders.length; i++) {
      const b = this.boxColliders[i];
      // AABB vs Circle test
      const closestX = Math.max(b.minX, Math.min(x, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(z, b.maxZ));
      const distX = x - closestX;
      const distZ = z - closestZ;
      if (distX * distX + distZ * distZ < radius * radius) {
        return true;
      }
    }

    // 3. Circle Colliders (Fountains, tree trunks, light poles)
    for (let i = 0; i < this.circleColliders.length; i++) {
      const c = this.circleColliders[i];
      const dx = x - c.x;
      const dz = z - c.z;
      const minD = radius + c.radius;
      if (dx * dx + dz * dz < minD * minD) {
        return true;
      }
    }

    // 4. Vehicles in Traffic (except excluded vehicle if player is driving)
    if (this.trafficSys && this.trafficSys.vehicles) {
      for (let i = 0; i < this.trafficSys.vehicles.length; i++) {
        const v = this.trafficSys.vehicles[i];
        if (!v.mesh || v.mesh === excludeMesh) continue;

        // Vehicle footprint box
        const vPos = v.mesh.position;
        const vW = 1.35; // Half width
        const vL = 2.7;  // Half length

        const dx = Math.abs(x - vPos.x);
        const dz = Math.abs(z - vPos.z);

        if (dx < vW + radius && dz < vL + radius) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Buttery-Smooth Sliding Collision Resolver:
   * Tests combined movement, then individual X and Z axes to allow natural wall-sliding!
   */
  resolveMovement(currX, currZ, targetX, targetZ, radius = 0.35, isCar = false, excludeMesh = null) {
    // If target position is completely clear, accept full step
    if (!this.isBlocked(targetX, targetZ, radius, excludeMesh)) {
      return { x: targetX, z: targetZ, collided: false };
    }

    // Slide along X axis only
    const canMoveX = !this.isBlocked(targetX, currZ, radius, excludeMesh);
    // Slide along Z axis only
    const canMoveZ = !this.isBlocked(currX, targetZ, radius, excludeMesh);

    if (canMoveX && !canMoveZ) {
      return { x: targetX, z: currZ, collided: true };
    }

    if (!canMoveX && canMoveZ) {
      return { x: currX, z: targetZ, collided: true };
    }

    // If both individual axes are blocked or corner pinch, stop at current position
    return { x: currX, z: currZ, collided: true };
  }

  clear() {
    this.boxColliders = [];
    this.circleColliders = [];
    this.elevationZones = [];
  }
}
