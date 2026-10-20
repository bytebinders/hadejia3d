import * as THREE from 'three';
import { BuildingGenerator } from './buildingGenerator.js';
import { NatureGenerator } from './natureGenerator.js';
import { PropsGenerator } from './propsGenerator.js';

/**
 * CityBuilder — Constructs the entire 3D metropolis layout:
 * Terrain, Roads, Sidewalks, Canal Waterfront, Downtown, Park, and Props.
 */

export class CityBuilder {
  constructor(scene, collisionSys = null) {
    this.scene = scene;
    this.collisionSys = collisionSys;
    this.buildingGen = new BuildingGenerator();
    this.natureGen = new NatureGenerator();
    this.propsGen = new PropsGenerator();

    this.interactiveBuildings = []; // Meshes for raycasting
    this.boats = [];                // Boats for bobbing animation
    this.fountains = [];            // Fountains for water spray animation
    this.roadSplines = [];          // Driving paths for cars

    this.materials = {
      groundGrass: new THREE.MeshStandardMaterial({ color: 0x8da35c, roughness: 0.95, flatShading: true }), // Sahel savanna grass
      groundLaterite: new THREE.MeshStandardMaterial({ color: 0xb45a28, roughness: 0.95, flatShading: true }), // Northern Nigerian laterite soil
      groundSand: new THREE.MeshStandardMaterial({ color: 0xd9b375, roughness: 0.95, flatShading: true }), // River sand & earth
      sidewalk: new THREE.MeshStandardMaterial({ color: 0xd4c4aa, roughness: 0.9, flatShading: true }), // Sandstone paved walkways
      roadAsphalt: new THREE.MeshStandardMaterial({ color: 0x272c33, roughness: 0.75, flatShading: true }),
      roadMarkingWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, flatShading: true }),
      roadMarkingYellow: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, flatShading: true }),
      waterCanal: new THREE.MeshStandardMaterial({
        color: 0x1d7ea8, // Kogin Hadejia freshwater
        roughness: 0.15,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88,
        flatShading: true
      }),
      waterBed: new THREE.MeshStandardMaterial({ color: 0x8a6237, roughness: 0.95, flatShading: true }),
      dockWood: new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85, flatShading: true }),
      bridgePier: new THREE.MeshStandardMaterial({ color: 0x8d5b38, roughness: 0.8, flatShading: true })
    };
  }

  /**
   * Main build function
   */
  buildCity(seed = 1) {
    // Clear previous elements if regenerating
    this.interactiveBuildings = [];
    this.boats = [];
    this.fountains = [];
    this.roadSplines = [];
    if (this.collisionSys) this.collisionSys.clear();

    const cityGroup = new THREE.Group();
    cityGroup.name = 'CityRoot';

    // 1. Terrain & Kogin Hadejia River
    this._buildTerrain(cityGroup);

    // 2. Road Network & Bridges
    this._buildRoads(cityGroup);

    // 3. Districts & Hadejia Landmarks (Emir's Palace, Grand Mosque, Kasuwa, Gates, Compounds)
    this._buildDistricts(cityGroup, seed);

    // 4. Fadamar Hadejia Oasis & Date Palm Groves
    this._buildCentralPark(cityGroup);

    // 5. Kogin Hadejia Fishing Wharf & Traditional Canoes (Kwalekwale)
    this._buildMarina(cityGroup);

    // 6. Streetlights & Props
    this._buildProps(cityGroup);

    this.scene.add(cityGroup);
    this.cityGroup = cityGroup;

    return cityGroup;
  }

  /**
   * Base Terrain & Kogin Hadejia River
   */
  _buildTerrain(parent) {
    // Large ground bed with warm laterite & riverbed tones
    const baseGeo = new THREE.BoxGeometry(260, 2, 260);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.waterBed);
    baseMesh.position.y = -1;
    baseMesh.receiveShadow = true;
    parent.add(baseMesh);

    // Kogin Hadejia (Hadejia River) waterway running along X = 35 to 65 (width 32, length 240)
    const waterGeo = new THREE.PlaneGeometry(32, 240, 16, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMesh = new THREE.Mesh(waterGeo, this.materials.waterCanal);
    waterMesh.position.set(50, 0.2, 0);
    waterMesh.receiveShadow = true;
    parent.add(waterMesh);
    this.waterMesh = waterMesh;

    // West Island (Main Historic Hadejia: Palace, Friday Mosque, Kasuwa, Residential: X from -110 to 34)
    const westGroundGeo = new THREE.BoxGeometry(144, 1.4, 220);
    const westGround = new THREE.Mesh(westGroundGeo, this.materials.sidewalk);
    westGround.position.set(-38, 0.7, 0);
    westGround.receiveShadow = true;
    parent.add(westGround);

    // East Island (Hadejia-Nguru Wetlands & Riverine Farmlands: X from 66 to 110)
    const eastGroundGeo = new THREE.BoxGeometry(44, 1.4, 220);
    const eastGround = new THREE.Mesh(eastGroundGeo, this.materials.groundGrass);
    eastGround.position.set(88, 0.7, 0);
    eastGround.receiveShadow = true;
    parent.add(eastGround);

    // Register river water obstacles (leaving bridge crossings open at Z = -50 and Z = 50)
    if (this.collisionSys) {
      this.collisionSys.addBoxCollider(34, 66, -110, -55, 'Kogin Hadejia River North');
      this.collisionSys.addBoxCollider(34, 66, -45, 45, 'Kogin Hadejia River Mid');
      this.collisionSys.addBoxCollider(34, 66, 55, 110, 'Kogin Hadejia River South');
    }
  }

  /**
   * Road network with markings and bridges
   */
  _buildRoads(parent) {
    const roadY = 1.42;

    // Main Avenues on West Island
    // Avenue 1: Z = -50
    // Avenue 2: Z = 0
    // Avenue 3: Z = 50
    // Street A: X = -85
    // Street B: X = -35
    // Street C: X = 15
    const roads = [
      // Horizontal Avenues (X: -110 to 34)
      { x: -38, z: -50, w: 144, d: 8, rot: 0 },
      { x: -38, z: 0,   w: 144, d: 8, rot: 0 },
      { x: -38, z: 50,  w: 144, d: 8, rot: 0 },

      // Vertical Streets (Z: -110 to 110)
      { x: -85, z: 0,   w: 8,   d: 220, rot: 0 },
      { x: -35, z: 0,   w: 8,   d: 220, rot: 0 },
      { x: 15,  z: 0,   w: 8,   d: 220, rot: 0 },

      // East Island Boulevard
      { x: 88,  z: 0,   w: 8,   d: 220, rot: 0 },
      { x: 88,  z: -50, w: 44,  d: 8,   rot: 0 },
      { x: 88,  z: 50,  w: 44,  d: 8,   rot: 0 }
    ];

    roads.forEach(r => {
      const roadGeo = new THREE.BoxGeometry(r.w, 0.1, r.d);
      const road = new THREE.Mesh(roadGeo, this.materials.roadAsphalt);
      road.position.set(r.x, roadY, r.z);
      road.receiveShadow = true;
      parent.add(road);

      // Dash markings
      if (r.w > r.d) {
        // Horizontal road centerline
        for (let x = r.x - r.w / 2 + 3; x < r.x + r.w / 2 - 3; x += 6) {
          const dashGeo = new THREE.BoxGeometry(3, 0.12, 0.3);
          const dash = new THREE.Mesh(dashGeo, this.materials.roadMarkingYellow);
          dash.position.set(x, roadY + 0.02, r.z);
          parent.add(dash);
        }
      } else {
        // Vertical road centerline
        for (let z = r.z - r.d / 2 + 3; z < r.z + r.d / 2 - 3; z += 6) {
          const dashGeo = new THREE.BoxGeometry(0.3, 0.12, 3);
          const dash = new THREE.Mesh(dashGeo, this.materials.roadMarkingYellow);
          dash.position.set(r.x, roadY + 0.02, z);
          parent.add(dash);
        }
      }
    });

    // Two Bridges crossing the canal at Z = -50 and Z = 50
    [-50, 50].forEach(bz => {
      const bridgeW = 34;
      const bridgeD = 8;
      const bridgeGeo = new THREE.BoxGeometry(bridgeW, 0.6, bridgeD);
      const bridge = new THREE.Mesh(bridgeGeo, this.materials.roadAsphalt);
      bridge.position.set(50, roadY + 0.25, bz);
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      parent.add(bridge);

      // Guardrails
      const railGeo = new THREE.BoxGeometry(bridgeW, 0.8, 0.3);
      [-bridgeD / 2, bridgeD / 2].forEach(rz => {
        const rail = new THREE.Mesh(railGeo, this.materials.bridgePier);
        rail.position.set(50, roadY + 0.65, bz + rz);
        rail.castShadow = true;
        parent.add(rail);
      });

      // Bridge Pylons in water
      const pylonGeo = new THREE.CylinderGeometry(0.9, 1.1, 2.5, 6);
      [-8, 8].forEach(px => {
        const pylon = new THREE.Mesh(pylonGeo, this.materials.bridgePier);
        pylon.position.set(50 + px, 0.6, bz);
        pylon.castShadow = true;
        parent.add(pylon);
      });

      // Register bridge deck elevation zone
      if (this.collisionSys) {
        this.collisionSys.addElevationZone(33, 67, bz - bridgeD / 2, bz + bridgeD / 2, roadY + 0.55, 'Canal Bridge');
      }
    });

    // Define closed loop road paths for autonomous vehicles
    this.roadSplines = [
      // Outer West Loop
      [
        new THREE.Vector3(-85, roadY, -50),
        new THREE.Vector3(-35, roadY, -50),
        new THREE.Vector3(15,  roadY, -50),
        new THREE.Vector3(15,  roadY, 0),
        new THREE.Vector3(15,  roadY, 50),
        new THREE.Vector3(-35, roadY, 50),
        new THREE.Vector3(-85, roadY, 50),
        new THREE.Vector3(-85, roadY, 0)
      ],
      // Bridge & East Loop
      [
        new THREE.Vector3(15,  roadY, -50),
        new THREE.Vector3(50,  roadY, -50),
        new THREE.Vector3(88,  roadY, -50),
        new THREE.Vector3(88,  roadY, 0),
        new THREE.Vector3(88,  roadY, 50),
        new THREE.Vector3(50,  roadY, 50),
        new THREE.Vector3(15,  roadY, 50),
        new THREE.Vector3(15,  roadY, 0)
      ],
      // Inner Downtown Loop
      [
        new THREE.Vector3(-85, roadY, -50),
        new THREE.Vector3(-35, roadY, -50),
        new THREE.Vector3(-35, roadY, 0),
        new THREE.Vector3(-85, roadY, 0)
      ]
    ];
  }

  /**
   * Building Placement across Historic Hadejia Districts
   */
  _buildDistricts(parent, seed = 1) {
    const baseY = 1.4;

    // === DISTRICT 1: FADAR SARKIN HADEJIA (Royal Emirate Center & Palace Square) ===
    // (X: -80 to -40, Z: -45 to -5)
    // The Royal Palace of the Emir of Hadejia
    this._placeBuilding(this.buildingGen.createEmirPalace(28, 22, 16), -60, baseY, -25, parent);
    // Royal stables and bodyguard quarters (Gidan Sarkin Dawaki)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(12, 11, 'Gidan Sarkin Dawaki (Royal Stables & Courtyard)'), -74, baseY, -12, parent);
    // Emirate Council Chambers (Majalisar Masarautar Hadejia)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(13, 11, 'Majalisar Masarautar Hadejia (Emirate Council)'), -46, baseY, -12, parent);
    // Traditional Administrative Arcade & Scribe Registry
    this._placeBuilding(this.buildingGen.createCommercialArcade(11, 8, 14), -74, baseY, -38, parent);
    // Royal Guest Residence (Gidan Baki na Masarauta)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(11, 10, 'Gidan Baki na Masarauta (Royal Guest Lodge)'), -46, baseY, -38, parent);

    // Palace Square Resting Benches (Fadar Sarki)
    [-66, -54].forEach(bx => {
      const bench = this.natureGen.createBench();
      bench.position.set(bx, baseY + 0.35, -13);
      bench.rotation.y = 0;
      parent.add(bench);
    });

    // === DISTRICT 2: MASALLACIN JUMA'A & ISLAMIC HERITAGE CORE ===
    // (X: -30 to 10, Z: -45 to -5)
    // Central Friday Mosque of Hadejia with twin minarets and emerald dome
    this._placeBuilding(this.buildingGen.createCentralMosque(24, 20, 36), -10, baseY, -25, parent);
    // Islamic Library & School of Higher Learning (Madrasatul Hadejia)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(13, 11, 'Madrasatul Hadejia (Islamic Academy & Library)'), 4, baseY, -14, parent);
    // Traditional Scholars' Residence (Gidan Malamai)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(11, 10, 'Gidan Malamai (Scholars Compound)'), -24, baseY, -14, parent);
    // Religious Endowment Arcade (Kasuwar Littattafai & Books)
    this._placeBuilding(this.buildingGen.createCommercialArcade(12, 8, 14), -10, baseY, -38, parent);

    // === HISTORIC CITY WALL GATES (KOFAR GARI) ===
    // Kofar Yamma: Historic Western City Gate
    this._placeBuilding(this.buildingGen.createHistoricCityGate('Kofar Yamma (Historic Western Gate)'), -85, baseY, 0, parent);
    // Kofar Kware: Northern Fortified City Wall Gate
    this._placeBuilding(this.buildingGen.createHistoricCityGate('Kofar Kware (Northern City Wall Gate)'), -35, baseY, -80, parent);

    // === DISTRICT 3: BABBAN KASUWAR HADEJIA & KASUWAR KIFI (Main Market Quarter) ===
    // (X: -80 to -40, Z: 5 to 45)
    // Famous Hadejia Grand Market & Fish Market
    this._placeBuilding(this.buildingGen.createKasuwaMarket(24, 20), -60, baseY, 25, parent);
    // Traditional Weavers & Textile Dyers Compound (Masakar Hadejia)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(12, 10, 'Gidan Masaka (Traditional Weavers Compound)'), -68, baseY, 12, parent);
    // Traditional Blacksmiths & Potters Guild (Gidan Makeran Hadejia)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(11, 10, 'Gidan Makeri (Blacksmiths & Metal Guild)'), -52, baseY, 12, parent);
    // Wholesale Grain & Spice Stores (Rumbunan Hatsi & Kasuwa)
    this._placeBuilding(this.buildingGen.createCommercialArcade(12, 8, 15), -68, baseY, 38, parent);
    // Livestock & Produce Exchange
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(11, 10, 'Dillalan Kasuwa (Produce & Spice Merchants)'), -52, baseY, 38, parent);

    // === DISTRICT 4 & 5: HADEJIA-NGURU WETLANDS & RIVERINE COMMUNITIES (East Island) ===
    // (X: 72 to 105, Z: -45 to 45)
    // River Fishermen's Settlement & Smoked Fish Guild (Gidan Masunta)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(13, 11, 'Gidan Masunta (Fishermens Guild & Smoked Fish Station)'), 88, baseY, -25, parent);
    // Date Palm & Rice Farming Agricultural Cooperative (Noman Shinkafa da Dabino)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(12, 10, 'Cibiyar Noman Dabino da Shinkafa (Date & Rice Depot)'), 88, baseY, -38, parent);
    // Hadejia-Nguru Wetlands Conservation & Bird Sanctuary Station (Ramsar Site)
    this._placeBuilding(this.buildingGen.createCommercialArcade(11, 9, 16), 88, baseY, -12, parent);
    // Fulani Pastoralist Settlement & Dairy Center (Rugar Fulani & Nonon Shanu)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(13, 11, 'Rugar Fulani (Pastoralist Dairy & Cultural Compound)'), 88, baseY, 25, parent);
    // Traditional Leathercrafts & Tannery Compound (Gidan Dukawa)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(12, 10, 'Gidan Dukawa (Leather Craftsmen Guild)'), 88, baseY, 38, parent);
    // River Basin Eco-Lodge & Visitor Center
    this._placeBuilding(this.buildingGen.createCantileveredComplex(10, 10, 18), 88, baseY, 12, parent);

    // === OUTER RESIDENTIAL QUARTERS (North & South Borders) ===
    // Gidan Hakimi (District Head Residence)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(13, 11, 'Gidan Hakimi (District Head Residence)'), -60, baseY, -75, parent);
    // Traditional Residential Compound (Unguwar Gabas)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(12, 10, 'Unguwar Gabas (Traditional Family Compound)'), -10, baseY, -75, parent);
    // Gidan Magatakarda (Emirate Scribe Estate)
    this._placeBuilding(this.buildingGen.createTraditionalHausaCompound(13, 11, 'Gidan Magatakarda (Emirate Scribe Estate)'), -60, baseY, 75, parent);
    // Community Health & Education Center (Cibiyar Kiwon Lafiya)
    this._placeBuilding(this.buildingGen.createCommercialArcade(12, 9, 15), -10, baseY, 75, parent);
  }

  /**
   * Fadamar Hadejia & Date Palm Oasis (Kwanan Dabino & Neem Trees)
   * (West Island: X: -30 to 10, Z: 5 to 45)
   */
  _buildCentralPark(parent) {
    const parkY = 1.45;
    const parkW = 38;
    const parkD = 38;
    const parkX = -10;
    const parkZ = 25;

    // Fertile floodplain soil (Fadama)
    const lawnGeo = new THREE.BoxGeometry(parkW, 0.4, parkD);
    const lawn = new THREE.Mesh(lawnGeo, this.materials.groundGrass);
    lawn.position.set(parkX, parkY + 0.2, parkZ);
    lawn.receiveShadow = true;
    parent.add(lawn);

    // Laterite / Sandstone pathway cross
    const pathMat = this.materials.sidewalk;
    const pathXGeo = new THREE.BoxGeometry(parkW, 0.42, 3);
    const pathX = new THREE.Mesh(pathXGeo, pathMat);
    pathX.position.set(parkX, parkY + 0.21, parkZ);
    parent.add(pathX);

    const pathZGeo = new THREE.BoxGeometry(3, 0.42, parkD);
    const pathZ = new THREE.Mesh(pathZGeo, pathMat);
    pathZ.position.set(parkX, parkY + 0.21, parkZ);
    parent.add(pathZ);

    // Centerpiece Oasis Fountain / Rijiyar Fadama
    const fountain = this.natureGen.createParkFountain(4.0);
    fountain.position.set(parkX, parkY + 0.4, parkZ);
    parent.add(fountain);
    this.fountains.push(fountain);

    // Register elevated Fadama lawn and pathways
    if (this.collisionSys) {
      this.collisionSys.addElevationZone(
        parkX - parkW / 2,
        parkX + parkW / 2,
        parkZ - parkD / 2,
        parkZ + parkD / 2,
        1.85,
        'Fadamar Hadejia Lawn'
      );
      this.collisionSys.addElevationZone(
        parkX - parkW / 2,
        parkX + parkW / 2,
        parkZ - 1.5,
        parkZ + 1.5,
        1.87,
        'Fadama Pathway X'
      );
      this.collisionSys.addElevationZone(
        parkX - 1.5,
        parkX + 1.5,
        parkZ - parkD / 2,
        parkZ + parkD / 2,
        1.87,
        'Fadama Pathway Z'
      );
    }

    // Authentic Hadejia Trees: Date Palms (Dabino), Neem Trees (Dogon Yaro), Baobabs (Kuka), & Acacias
    const treeConfigs = [
      // Quadrant 1 (North-West): Date Palm Grove & Neem Shade
      { type: 'palm', x: parkX - 10, z: parkZ - 10, scale: 1.15 },
      { type: 'neem', x: parkX - 14, z: parkZ - 6, scale: 1.0 },
      { type: 'palm', x: parkX - 6, z: parkZ - 14, scale: 1.0 },

      // Quadrant 2 (North-East): Majestic Baobab & Date Palms
      { type: 'baobab', x: parkX + 11, z: parkZ - 11, scale: 1.05 },
      { type: 'palm', x: parkX + 14, z: parkZ - 5, scale: 0.95 },
      { type: 'acacia', x: parkX + 6, z: parkZ - 14, scale: 1.1 },

      // Quadrant 3 (South-West): Shady Neem trees & Acacias
      { type: 'neem', x: parkX - 11, z: parkZ + 11, scale: 1.1 },
      { type: 'palm', x: parkX - 14, z: parkZ + 6, scale: 1.05 },
      { type: 'acacia', x: parkX - 6, z: parkZ + 14, scale: 0.95 },

      // Quadrant 4 (South-East): Date Palms & Shady Neem
      { type: 'palm', x: parkX + 11, z: parkZ + 11, scale: 1.2 },
      { type: 'neem', x: parkX + 14, z: parkZ + 6, scale: 1.0 },
      { type: 'palm', x: parkX + 6, z: parkZ + 14, scale: 0.9 }
    ];

    treeConfigs.forEach(t => {
      let treeMesh;
      if (t.type === 'palm') treeMesh = this.natureGen.createDatePalmTree(7.5, t.scale);
      else if (t.type === 'neem') treeMesh = this.natureGen.createNeemTree(7.0, t.scale);
      else if (t.type === 'baobab') treeMesh = this.natureGen.createBaobabTree(8.0, t.scale);
      else if (t.type === 'acacia') treeMesh = this.natureGen.createAcaciaTree(6.5, t.scale);
      else treeMesh = this.natureGen.createDatePalmTree(7.5, t.scale);

      treeMesh.position.set(t.x, parkY + 0.4, t.z);
      parent.add(treeMesh);
    });

    // Traditional Wood Resting Benches
    const benchAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    benchAngles.forEach(ang => {
      const bench = this.natureGen.createBench();
      const dist = 6.8;
      bench.position.set(parkX + Math.cos(ang) * dist, parkY + 0.4, parkZ + Math.sin(ang) * dist);
      bench.rotation.y = -ang - Math.PI / 2;
      parent.add(bench);
    });

    // Weathered Red Savanna Boulders
    const rockPositions = [
      { x: parkX - 12, z: parkZ - 12, s: 0.8 },
      { x: parkX + 13, z: parkZ + 12, s: 1.0 },
      { x: parkX - 13, z: parkZ + 13, s: 0.9 }
    ];
    rockPositions.forEach(rp => {
      const rock = this.natureGen.createRock(rp.s);
      rock.position.set(rp.x, parkY + 0.4, rp.z);
      parent.add(rock);
    });

    // Register colliders
    if (this.collisionSys) {
      this.collisionSys.addCircleCollider(parkX, parkZ, 4.3, 'Fadama Oasis Center');
      treeConfigs.forEach(t => {
        this.collisionSys.addCircleCollider(t.x, t.z, 0.5 * t.scale, 'Tree Trunk');
      });
      rockPositions.forEach(rp => {
        this.collisionSys.addCircleCollider(rp.x, rp.z, 0.9 * rp.s, 'Rock');
      });
    }
  }

  /**
   * Kogin Hadejia Fishing Wharf & Traditional River Canoes (Tashar Kwalekwale)
   */
  _buildMarina(parent) {
    const canalX = 50;

    // Wooden Boardwalk Pier along west riverbank (X = 33)
    const pierGeo = new THREE.BoxGeometry(4.0, 0.4, 160);
    const pier = new THREE.Mesh(pierGeo, this.materials.dockWood);
    pier.position.set(33, 1.2, 0);
    pier.receiveShadow = true;
    parent.add(pier);

    // Boardwalk Resting Benches overlooking Kogin Hadejia
    [-10, 10].forEach(bz => {
      const bench = this.natureGen.createBench();
      bench.position.set(32.2, 1.4, bz);
      bench.rotation.y = Math.PI / 2;
      parent.add(bench);
    });

    // Finger Docks extending into Kogin Hadejia
    const fingerZ = [-80, -20, 20, 80];
    fingerZ.forEach((fz, idx) => {
      const dockGeo = new THREE.BoxGeometry(10, 0.35, 2.4);
      const dock = new THREE.Mesh(dockGeo, this.materials.dockWood);
      dock.position.set(39, 1.0, fz);
      dock.receiveShadow = true;
      parent.add(dock);

      // Traditional Hadejia Fishing Canoe (Kwalekwale) bobbing in the river
      const canoe = this.natureGen.createTraditionalCanoe(5.8);
      canoe.position.set(45, 0.4, fz);
      canoe.rotation.y = Math.PI / 2 + (idx % 2 === 0 ? 0.1 : -0.1);
      canoe.userData.bobPhase = idx * 1.5;
      parent.add(canoe);
      this.boats.push(canoe);

      // Second canoe along the bank
      const canoe2 = this.natureGen.createTraditionalCanoe(5.2);
      canoe2.position.set(48, 0.4, fz + 3.2);
      canoe2.rotation.y = Math.PI / 2 + 0.2;
      canoe2.userData.bobPhase = idx * 1.5 + 2.0;
      parent.add(canoe2);
      this.boats.push(canoe2);
    });

    // Register marina boardwalk and finger docks elevation zones
    if (this.collisionSys) {
      this.collisionSys.addElevationZone(31, 35, -80, 80, 1.40, 'Wharf Boardwalk Pier');
      fingerZ.forEach(fz => {
        this.collisionSys.addElevationZone(34, 44, fz - 1.2, fz + 1.2, 1.18, 'Fishing Wharf Finger Dock');
      });
    }
  }

  /**
   * Streetlights & Props
   */
  _buildProps(parent) {
    const baseY = 1.4;

    // Streetlights along avenues
    const lightCoords = [
      // Downtown Avenue
      { x: -75, z: -46, rot: 0 },
      { x: -45, z: -46, rot: 0 },
      { x: -15, z: -46, rot: 0 },
      { x: -75, z: -54, rot: Math.PI },
      { x: -45, z: -54, rot: Math.PI },
      { x: -15, z: -54, rot: Math.PI },

      // Center Avenue
      { x: -75, z: -4, rot: 0 },
      { x: -45, z: -4, rot: 0 },
      { x: -75, z: 4, rot: Math.PI },
      { x: -45, z: 4, rot: Math.PI },

      // Marina Boulevard
      { x: 80, z: -46, rot: 0 },
      { x: 80, z: 46, rot: 0 },
      { x: 96, z: -46, rot: Math.PI },
      { x: 96, z: 46, rot: Math.PI }
    ];

    lightCoords.forEach(c => {
      const lamp = this.propsGen.createStreetLight(4.8);
      lamp.position.set(c.x, baseY, c.z);
      lamp.rotation.y = c.rot;
      parent.add(lamp);
    });

    // Traffic Lights at main intersection
    const trafficIntersections = [
      { x: -35, z: -50 },
      { x: -35, z: 0 },
      { x: -35, z: 50 },
      { x: 15,  z: -50 },
      { x: 15,  z: 50 }
    ];

    trafficIntersections.forEach(ti => {
      const tl = this.propsGen.createTrafficLight(4.2);
      tl.position.set(ti.x - 4.2, baseY, ti.z - 4.2);
      parent.add(tl);
    });

    // Fire hydrants
    [-55, -20, 20, 75].forEach(x => {
      const fh = this.propsGen.createFireHydrant();
      fh.position.set(x, baseY, -46);
      parent.add(fh);
    });
  }

  /**
   * Place building, set position & register for inspection raycaster
   */
  _placeBuilding(buildingGroup, x, y, z, parent) {
    buildingGroup.position.set(x, y, z);
    parent.add(buildingGroup);

    // Register all child meshes with pointer to root userData
    buildingGroup.traverse(child => {
      if (child.isMesh) {
        child.userData.parentBuilding = buildingGroup;
        this.interactiveBuildings.push(child);
      }
    });

    if (this.collisionSys) {
      this.collisionSys.addBuildingCollider(buildingGroup);
    }

    return buildingGroup;
  }

  /**
   * Animate water, fountains, and boats
   */
  update(time, delta) {
    // Water wave oscillation
    if (this.waterMesh && this.waterMesh.geometry) {
      const pos = this.waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const z = Math.sin(u * 0.2 + time * 1.5) * 0.15 + Math.cos(v * 0.15 + time * 1.2) * 0.1;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }

    // Bobbing boats
    this.boats.forEach(boat => {
      const phase = (boat.userData.bobPhase || 0) + time * 2.0;
      boat.position.y = 0.4 + Math.sin(phase) * 0.1;
      boat.rotation.z = Math.sin(phase * 0.7) * 0.04;
      boat.rotation.x = Math.cos(phase * 0.5) * 0.03;
    });

    // Fountain spray
    this.fountains.forEach(fountain => {
      const sprayGroup = fountain.userData.sprayGroup;
      if (sprayGroup) {
        sprayGroup.children.forEach(drop => {
          const ud = drop.userData;
          const dropTime = time * ud.speed + ud.phase;
          drop.position.y = ud.baseY + Math.abs(Math.sin(dropTime)) * 0.6;
        });
      }
    });
  }

  /**
   * Day/Night cycle updates
   */
  updateDayNight(nightFactor) {
    this.buildingGen.updateDayNight(nightFactor);
    this.propsGen.updateDayNight(nightFactor);
  }
}
