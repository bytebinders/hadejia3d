import * as THREE from 'three';
import { LowPolyHuman } from './lowPolyHuman.js';

/**
 * PedestrianSystem — Fully Autonomous Metropolis Citizens with Free Will
 * 
 * Zero static roles. Every citizen has complete autonomy and freedom to:
 * - Wander anywhere across the city graph (Park, Downtown, Marina, Bridges, East Island)
 * - Switch paths at intersections and decide their own travel destinations
 * - Walk at a relaxed stroll or sprint/jog for fitness
 * - Choose to walk over to open park benches, sit down to rest, and stand back up whenever they feel ready
 * - Choose to lie down on the green grass in Central Park to sunbathe or cloud-watch, then get up
 * - Stop to chat with any other citizen they meet, gesturing and sharing 3D speech bubbles
 * - Burst into spontaneous joyful dances on the sidewalks
 * - Pause to check smartphones, sip takeaway coffee, or gaze at the skyline
 * - Interact, greet, and converse with the player whenever approached!
 */

const CITIZEN_NAMES = [
  'Ibrahim Sambo', 'Amina Hadejia', 'Usman Danladi', 'Fatima Zahra', 'Bello Kofar-Fada',
  'Hadiza Sambo', 'Aminu Garba', 'Zainab Kabir', 'Haruna Babba', 'Maryam Dutse',
  'Kabir Aliyu', 'Halima Binta', 'Mustapha Sanusi', 'Rahma Sadau', 'Idrisu Mai-Kifi',
  'Hauwa\'u Kabir', 'Sanusi Abdullahi', 'Bilkisu Garba', 'Farouk Lawan', 'Jamila Abdullahi',
  'Yakubu Shehu', 'Nafisa Umar', 'Nasiru Garki', 'Safiya Usman', 'Dahiru Auyo',
  'Asiya Danbatta', 'Salisu Kafin-Hausa', 'Rukayya Bello', 'Umar Faruq', 'Zubaida Aliyu',
  'Abubakar Saddiq', 'Khadija Haruna', 'Bashir Suleiman', 'Sa\'adatu Idris', 'Murtala Muhammad'
];

const CITIZEN_TITLES = [
  'Hakimin Masarauta (District Head)',
  'Babban Masunta (Master Fisherman of Kogin Hadejia)',
  'Dillalin Kasuwar Kifi (Fish Market Merchant)',
  'Mai Unguwa (Ward Elder)',
  'Dogarin Sarki (Royal Emirate Guard)',
  'Manomin Dabino da Shinkafa (Date & Rice Farmer)',
  'Malamin Madrasah (Islamic Heritage Scholar)',
  'Masakin Gargajiya (Traditional Babban Riga Weaver)',
  'Direban Keke Napep (City Tricycle Driver)',
  'Mai Shayin Kasuwa (Kasuwa Tea & Bread Host)',
  'Jami\'in Fadamar Hadejia (Wetlands Wildlife Ranger)',
  'Dukawa Master Craftsman (Traditional Leather Guild)',
  'Mai Fura da Nono (Pastoralist Dairy Merchant)',
  'Magatakardar Masarauta (Emirate Scribe)'
];

const CITIZEN_AVATARS = ['👑', '🕌', '🐟', '🌴', '🛺', '🌾', '🧕', '👳', '🍵', '🪡', '📜', '🦅'];

const RIG_JOINTS = [
  'hips', 'torso', 'headPivot',
  'leftArmUpper', 'leftArmLower', 'rightArmUpper', 'rightArmLower',
  'leftLegUpper', 'leftLegLower', 'rightLegUpper', 'rightLegLower'
];

export class PedestrianSystem {
  constructor(scene, collisionSys = null, charLoader = null) {
    this.scene = scene;
    this.collisionSys = collisionSys;
    this.charLoader = charLoader;
    this.group = new THREE.Group();
    this.group.name = 'PedestrianSystem';
    this.scene.add(this.group);

    this.allCitizens = [];
    this.activePlayerCitizen = null;

    // Pre-create shared canvas textures for 3D speech bubbles
    this.bubbleTextures = {
      chat: this._createBubbleTexture('💬'),
      phone: this._createBubbleTexture('📱'),
      coffee: this._createBubbleTexture('☕'),
      city: this._createBubbleTexture('🏙️'),
      wave: this._createBubbleTexture('👋'),
      sparkle: this._createBubbleTexture('✨'),
      bench: this._createBubbleTexture('🪑'),
      lay: this._createBubbleTexture('🛌'),
      dance: this._createBubbleTexture('🕺'),
      jog: this._createBubbleTexture('🏃')
    };

    // Metropolis Bench network in Central Park
    this.benches = [
      { id: 'bench_1', x: -16.8, z: 25, rot: Math.PI / 2, occupant: null },
      { id: 'bench_2', x: -3.2,  z: 25, rot: -Math.PI / 2, occupant: null },
      { id: 'bench_3', x: -10,   z: 18.2, rot: Math.PI, occupant: null },
      { id: 'bench_4', x: -10,   z: 31.8, rot: 0, occupant: null }
    ];

    // Interconnected City-Wide Waypoint Graph
    this._initCityWaypointGraph();

    // Spawn 35 fully autonomous citizens
    this.spawnPedestrians(35);
  }

  /**
   * Helper to draw clean 3D speech bubble canvas textures
   */
  _createBubbleTexture(emojiText) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Soft bubble shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Rounded bubble body
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(14, 14, 100, 72, 18);
    ctx.fill();
    ctx.stroke();

    // Pointer tail
    ctx.beginPath();
    ctx.moveTo(54, 86);
    ctx.lineTo(64, 104);
    ctx.lineTo(74, 86);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.stroke();

    // Emoji icon
    ctx.shadowColor = 'transparent';
    ctx.font = '36px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojiText, 64, 50);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  _attachSpeechBubble(mesh) {
    const spriteMat = new THREE.SpriteMaterial({
      map: this.bubbleTextures.chat,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.65, 0.65, 1);
    sprite.position.set(0, 2.05, 0);
    sprite.visible = false;
    mesh.add(sprite);
    return sprite;
  }

  /**
   * Constructs an interconnected multi-district waypoint graph.
   * Citizens navigate from node to node, choosing any adjacent direction at will!
   */
  _initCityWaypointGraph() {
    this.nodes = {
      // 1. Central Park Core (elevated grass 1.85, pathways 1.87)
      'park_west':       { pos: new THREE.Vector3(-25, 1.87, 25), neighbors: ['park_fountain', 'park_nw', 'park_sw', 'street_b_park'], district: 'park' },
      'park_fountain':   { pos: new THREE.Vector3(-10, 1.87, 25), neighbors: ['park_west', 'park_east', 'park_north', 'park_south'], district: 'park' },
      'park_east':       { pos: new THREE.Vector3(8,   1.87, 25), neighbors: ['park_fountain', 'park_ne', 'park_se', 'marina_mid'], district: 'park' },
      'park_north':      { pos: new THREE.Vector3(-10, 1.85, 40), neighbors: ['park_fountain', 'park_nw', 'park_ne'], district: 'park' },
      'park_south':      { pos: new THREE.Vector3(-10, 1.85, 10), neighbors: ['park_fountain', 'park_sw', 'park_se'], district: 'park' },
      'park_nw':         { pos: new THREE.Vector3(-25, 1.85, 40), neighbors: ['park_west', 'park_north', 'street_b_south'], district: 'park' },
      'park_ne':         { pos: new THREE.Vector3(5,   1.85, 40), neighbors: ['park_east', 'park_north'], district: 'park' },
      'park_sw':         { pos: new THREE.Vector3(-25, 1.85, 10), neighbors: ['park_west', 'park_south', 'street_b_north'], district: 'park' },
      'park_se':         { pos: new THREE.Vector3(5,   1.85, 10), neighbors: ['park_east', 'park_south'], district: 'park' },

      // 2. Street B & Park Transition (sidewalk 1.40)
      'street_b_park':   { pos: new THREE.Vector3(-32, 1.40, 25), neighbors: ['park_west', 'street_b_north', 'street_b_south'], district: 'downtown' },
      'street_b_north':  { pos: new THREE.Vector3(-32, 1.40, -42), neighbors: ['street_b_park', 'downtown_mid_n', 'bridge_n_west'], district: 'downtown' },
      'street_b_south':  { pos: new THREE.Vector3(-32, 1.40, 42),  neighbors: ['street_b_park', 'arts_mid_s', 'bridge_s_west'], district: 'downtown' },

      // 3. Downtown Financial Core
      'downtown_nw':     { pos: new THREE.Vector3(-80, 1.40, -42), neighbors: ['downtown_mid_n', 'downtown_sw'], district: 'downtown' },
      'downtown_mid_n':  { pos: new THREE.Vector3(-55, 1.40, -42), neighbors: ['downtown_nw', 'street_b_north', 'downtown_mid_s'], district: 'downtown' },
      'downtown_mid_s':  { pos: new THREE.Vector3(-55, 1.40, -8),  neighbors: ['downtown_mid_n', 'downtown_sw', 'street_b_park'], district: 'downtown' },
      'downtown_sw':     { pos: new THREE.Vector3(-80, 1.40, -8),  neighbors: ['downtown_nw', 'downtown_mid_s'], district: 'downtown' },

      // 4. Arts Quarter Promenade
      'arts_nw':         { pos: new THREE.Vector3(-76, 1.40, 12), neighbors: ['arts_mid_n', 'arts_sw'], district: 'downtown' },
      'arts_mid_n':      { pos: new THREE.Vector3(-44, 1.40, 12), neighbors: ['arts_nw', 'street_b_park', 'arts_mid_s'], district: 'downtown' },
      'arts_mid_s':      { pos: new THREE.Vector3(-44, 1.40, 38), neighbors: ['arts_mid_n', 'arts_sw', 'street_b_south'], district: 'downtown' },
      'arts_sw':         { pos: new THREE.Vector3(-76, 1.40, 38), neighbors: ['arts_nw', 'arts_mid_s'], district: 'downtown' },

      // 5. Marina Waterfront Boardwalk (wooden pier 1.40)
      'marina_north':    { pos: new THREE.Vector3(33, 1.40, -45), neighbors: ['marina_mid', 'bridge_n_west'], district: 'marina' },
      'marina_mid':      { pos: new THREE.Vector3(33, 1.40, 0),   neighbors: ['marina_north', 'marina_south', 'park_east'], district: 'marina' },
      'marina_south':    { pos: new THREE.Vector3(33, 1.40, 45),  neighbors: ['marina_mid', 'bridge_s_west'], district: 'marina' },

      // 6. North Canal Bridge (elevation rises to 1.97 over canal)
      'bridge_n_west':   { pos: new THREE.Vector3(20, 1.47, -50), neighbors: ['marina_north', 'bridge_n_mid', 'street_b_north'], district: 'marina' },
      'bridge_n_mid':    { pos: new THREE.Vector3(50, 1.97, -50), neighbors: ['bridge_n_west', 'bridge_n_east'], district: 'marina' },
      'bridge_n_east':   { pos: new THREE.Vector3(80, 1.47, -50), neighbors: ['bridge_n_mid', 'east_boulevard_n'], district: 'marina' },

      // 7. South Canal Bridge
      'bridge_s_west':   { pos: new THREE.Vector3(20, 1.47, 50), neighbors: ['marina_south', 'bridge_s_mid', 'street_b_south'], district: 'marina' },
      'bridge_s_mid':    { pos: new THREE.Vector3(50, 1.97, 50), neighbors: ['bridge_s_west', 'bridge_s_east'], district: 'marina' },
      'bridge_s_east':   { pos: new THREE.Vector3(80, 1.47, 50), neighbors: ['bridge_s_mid', 'east_boulevard_s'], district: 'marina' },

      // 8. East Island Boulevard & Tech Campus
      'east_boulevard_n': { pos: new THREE.Vector3(88, 1.40, -42), neighbors: ['bridge_n_east', 'east_boulevard_mid'], district: 'marina' },
      'east_boulevard_mid': { pos: new THREE.Vector3(88, 1.40, 0), neighbors: ['east_boulevard_n', 'east_boulevard_s'], district: 'marina' },
      'east_boulevard_s': { pos: new THREE.Vector3(88, 1.40, 42),  neighbors: ['east_boulevard_mid', 'bridge_s_east'], district: 'marina' }
    };

    this.nodeKeys = Object.keys(this.nodes);
  }

  _generateDialogue(district = 'general') {
    const fadamaLines = [
      "Sannu da zuwa Fadamar Hadejia! The date palms (Kwanan Dabino) produce the sweetest dates in Jigawa.",
      "Resting under the shady neem trees (Dogon Yaro) is our favorite afternoon tradition.",
      "The fresh breeze from the Hadejia floodplain keeps the entire oasis cool even in the dry season.",
      "Have you seen the traditional well (Rijiyar Fadama)? It has provided water for generations of travelers."
    ];

    const palaceLines = [
      "Ranki ya dade / Ranka ya dade! Welcome to Fadar Sarkin Hadejia, seat of the historic Emirate founded in 1808.",
      "Look at the royal Dogarai guards at Kofar Fada in their scarlet red and emerald green regalia!",
      "The Central Friday Mosque (Masallacin Juma'a) stands tall with its majestic twin minarets and green dome.",
      "Babban Kasuwar Hadejia has the finest textiles, hand-embroidered Babban Riga, and local pottery."
    ];

    const riverLines = [
      "Ina kwana! Kogin Hadejia (Hadejia River) is teeming with fresh fish. Our fishermen use traditional Kwalekwale canoes.",
      "Barka dai! The famous Kasuwar Kifi (Fish Market) ships smoked fish across Northern and Southern Nigeria.",
      "Across the bridge lies the Hadejia-Nguru Wetlands, a world-famous Ramsar sanctuary for migratory birds from Europe and Asia!",
      "You can see our traditional wooden dugouts anchored along the riverbank."
    ];

    const generalLines = [
      "Sannu! Barka da zuwa Hadejia, Jigawa State! Enjoy exploring our historic city.",
      "Lafiya lau! If you want to greet someone in Hausa, wave with [G] or celebrate with [V]!",
      "Watch out for the yellow Keke Napep tricycles cruising along the avenues.",
      "From Kofar Yamma to Kofar Kware, our ancient city gates have guarded Hadejia for centuries."
    ];

    if (district === 'park') return [...fadamaLines, ...generalLines];
    if (district === 'downtown') return [...palaceLines, ...generalLines];
    if (district === 'marina') return [...riverLines, ...generalLines];
    return generalLines;
  }

  spawnPedestrians(count = 35) {
    this.clear();

    for (let i = 0; i < count; i++) {
      const isMen = (i % 2 === 0);
      const genderId = isMen ? 'harpy' : 'xixi';
      const gender = isMen ? 'men' : 'women';

      const palette = LowPolyHuman.getRandomPalette(gender);
      const rig = LowPolyHuman.create({
        gender,
        avatarId: genderId,
        palette,
        scale: 0.65,
        style: isMen ? LowPolyHuman.getRandomMenStyle() : LowPolyHuman.getRandomWomenStyle(),
        hairstyle: isMen ? LowPolyHuman.getRandomMenHairstyle() : LowPolyHuman.getRandomWomenHairstyle()
      });
      const mesh = rig.root;

      // Pick random initial node on the city graph
      const startNodeKey = this.nodeKeys[i % this.nodeKeys.length];
      const startNode = this.nodes[startNodeKey];
      const targetNodeKey = startNode.neighbors[Math.floor(Math.random() * startNode.neighbors.length)];

      const groundY = this.collisionSys
        ? this.collisionSys.getGroundHeight(startNode.pos.x, startNode.pos.z)
        : startNode.pos.y;
      mesh.position.set(startNode.pos.x, groundY, startNode.pos.z);

      const name = CITIZEN_NAMES[i % CITIZEN_NAMES.length];
      const title = CITIZEN_TITLES[i % CITIZEN_TITLES.length];
      const avatar = isMen ? '👨' : '👩';
      const dialogueLines = this._generateDialogue(startNode.district);

      const bubbleSprite = this._attachSpeechBubble(mesh);

      const citizen = {
        id: `citizen_${i}`,
        gender: isMen ? 'men' : 'women',
        avatarId: genderId,
        fbxInstance: null,
        rig,
        mesh,
        name,
        title,
        avatar,
        dialogueLines,
        dialogueIndex: 0,
        bubbleSprite,

        // Graph Navigation
        currentNodeKey: startNodeKey,
        targetNodeKey: targetNodeKey,
        progress: Math.random() * 0.8, // Stagger them along path
        walkSpeed: 2.3 + Math.random() * 1.2,
        jogSpeed: 5.4 + Math.random() * 1.4,
        speed: 2.5,
        curSpeed: 0,
        avoid: new THREE.Vector2(),

        // Individual body language so no two people move identically
        gait: {
          stride: 0.85 + Math.random() * 0.3,
          armSwing: 0.75 + Math.random() * 0.5,
          posture: -0.03 + Math.random() * 0.09,
          bounce: 0.8 + Math.random() * 0.4,
          hipSway: isMen ? 0.03 : 0.06
        },
        breathPhase: Math.random() * Math.PI * 2,
        lookYaw: 0,
        waveTimer: 0,
        waveDuration: 1.4,

        // Autonomous State: 'WALKING', 'JOGGING', 'SITTING', 'LAYING', 'TALKING', 'DANCING',
        // 'CHECKING_PHONE', 'DRINKING_COFFEE', 'LOOKING_AROUND', 'PLAYER_TALKING'
        state: 'WALKING',
        stateTimer: 0,
        decisionCooldown: 4.0 + Math.random() * 8.0,
        talkCooldown: 5.0 + Math.random() * 8.0,

        // Social partner if conversing with another citizen
        partner: null,
        isSpeaker: false,
        benchRef: null,

        animPhase: Math.random() * Math.PI * 2
      };

      // Initially assign 3 random citizens to sit on benches if available
      if (i < 3 && this.benches[i]) {
        const b = this.benches[i];
        b.occupant = citizen;
        citizen.benchRef = b;
        citizen.state = 'SITTING';
        citizen.stateTimer = 12.0 + Math.random() * 15.0;
        mesh.position.set(b.x, groundY, b.z);
        mesh.rotation.y = b.rot;
        this._applySittingPose(citizen.rig);
      }

      this.group.add(mesh);
      this.allCitizens.push(citizen);
    }
  }

  _applySittingPose(rig) {
    if (!rig) return;
    rig.hips.position.y = 0.72;
    rig.hips.position.z = -0.2;
    rig.leftLegUpper.rotation.x = -Math.PI / 2 + 0.1;
    rig.leftLegLower.rotation.x = Math.PI / 2 - 0.1;
    rig.rightLegUpper.rotation.x = -Math.PI / 2 + 0.1;
    rig.rightLegLower.rotation.x = Math.PI / 2 - 0.1;
    // Hands resting on the lap (negative elbow = natural forward flexion)
    rig.leftArmUpper.rotation.x = -0.35;
    rig.leftArmLower.rotation.x = -0.6;
    rig.rightArmUpper.rotation.x = -0.35;
    rig.rightArmLower.rotation.x = -0.6;
  }

  _resetToStandingPose(rig) {
    if (!rig) return;
    rig.hips.position.set(0, 1.35, 0);
    rig.hips.rotation.set(0, 0, 0);
    rig.torso.rotation.set(0, 0, 0);
    rig.torso.scale.set(1, 1, 1);
    rig.headPivot.rotation.set(0, 0, 0);
    rig.leftArmUpper.rotation.set(0, 0, 0);
    rig.leftArmLower.rotation.set(0, 0, 0);
    rig.rightArmUpper.rotation.set(0, 0, 0);
    rig.rightArmLower.rotation.set(0, 0, 0);
    rig.leftLegUpper.rotation.set(0, 0, 0);
    rig.leftLegLower.rotation.set(0, 0, 0);
    rig.rightLegUpper.rotation.set(0, 0, 0);
    rig.rightLegLower.rotation.set(0, 0, 0);
  }

  /**
   * Rotate a mesh toward a yaw along the shortest arc instead of snapping
   */
  _turnTowards(mesh, targetYaw, rate, delta) {
    let diff = targetYaw - mesh.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    mesh.rotation.y += diff * Math.min(1, rate * delta);
  }

  /**
   * Head tracks the player when they come close (within ~6m and in front)
   */
  _updateGaze(c, playerPos, delta) {
    let target = 0;
    if (playerPos && c.state !== 'LAYING' && c.state !== 'DANCING') {
      const dx = playerPos.x - c.mesh.position.x;
      const dz = playerPos.z - c.mesh.position.z;
      if (dx * dx + dz * dz < 36) {
        let rel = Math.atan2(dx, dz) - c.mesh.rotation.y;
        rel = Math.atan2(Math.sin(rel), Math.cos(rel));
        if (Math.abs(rel) < 1.9) target = THREE.MathUtils.clamp(rel, -1.0, 1.0);
      }
    }
    c.lookYaw += (target - c.lookYaw) * Math.min(1, delta * 3);
  }

  /**
   * Subtle chest rise and fall
   */
  _breathe(c, nowTime) {
    const b = Math.sin((nowTime + c.breathPhase) * 1.7);
    c.rig.torso.scale.set(1 + b * 0.01, 1, 1 + b * 0.02);
  }

  /**
   * Relaxed standing: breathing, slow weight shift between feet, soft knee on the unloaded leg
   */
  _applyIdleStance(c, nowTime) {
    const r = c.rig;
    this._breathe(c, nowTime);
    const t = nowTime + c.breathPhase * 3;
    const shift = Math.sin(t * 0.35) * 0.8 + Math.sin(t * 0.13) * 0.2;
    const relaxL = Math.max(0, -shift);
    const relaxR = Math.max(0, shift);

    r.hips.position.set(shift * 0.035, 1.35 - Math.abs(shift) * 0.01, 0);
    r.hips.rotation.set(0, 0, -shift * 0.03);
    r.torso.rotation.set(c.gait.posture + Math.sin(t * 1.7) * 0.01, 0, shift * 0.035);

    r.leftLegUpper.rotation.set(-relaxL * 0.08, 0, shift * 0.03);
    r.leftLegLower.rotation.set(relaxL * 0.16, 0, 0);
    r.rightLegUpper.rotation.set(-relaxR * 0.08, 0, shift * 0.03);
    r.rightLegLower.rotation.set(relaxR * 0.16, 0, 0);

    r.leftArmUpper.rotation.set(0.03, 0, 0.08);
    r.leftArmLower.rotation.set(-0.15, 0, 0);
    r.rightArmUpper.rotation.set(0.03, 0, -0.08);
    r.rightArmLower.rotation.set(-0.15, 0, 0);

    r.headPivot.rotation.set(-r.torso.rotation.x * 0.5, c.lookYaw, -shift * 0.02);
  }

  /**
   * Animated hand wave (raise, wave, lower). Returns true while waving.
   */
  _applyWave(c, delta) {
    if (!c.rig || !(c.waveTimer > 0)) return false;
    c.waveTimer -= delta;
    const k = THREE.MathUtils.clamp(c.waveTimer / (c.waveDuration || 1.4), 0, 1);
    const lift = Math.sin(k * Math.PI);
    c.rig.rightArmUpper.rotation.set(-0.2 * lift, 0, -0.06 - 2.25 * lift);
    c.rig.rightArmLower.rotation.set(0, 0, (-0.3 + Math.sin(performance.now() * 0.012) * 0.45) * lift);
    return true;
  }

  /**
   * Personal space: steer sideways around nearby people (and the player) and slow down
   * when someone is directly ahead. Returns a speed factor.
   */
  _computeAvoidance(c, index, delta, playerPos) {
    const fx = Math.sin(c.mesh.rotation.y);
    const fz = Math.cos(c.mesh.rotation.y);
    const px = c.mesh.position.x;
    const pz = c.mesh.position.z;
    let sx = 0, sz = 0, slow = 1;

    const consider = (ox, oz) => {
      const dx = ox - px, dz = oz - pz;
      const d2 = dx * dx + dz * dz;
      if (d2 > 4 || d2 < 1e-6) return;
      const d = Math.sqrt(d2);
      const push = (2 - d) / 2;
      sx -= (dx / d) * push;
      sz -= (dz / d) * push;
      const ahead = (dx * fx + dz * fz) / d;
      if (ahead > 0.7 && d < 1.6) slow = Math.min(slow, 0.35 + (d / 1.6) * 0.65);
    };

    for (let j = 0; j < this.allCitizens.length; j++) {
      if (j === index) continue;
      const o = this.allCitizens[j].mesh.position;
      consider(o.x, o.z);
    }
    if (playerPos) consider(playerPos.x, playerPos.z);

    const k = Math.min(1, delta * 2);
    c.avoid.x += (sx * 0.6 - c.avoid.x) * k;
    c.avoid.y += (sz * 0.6 - c.avoid.y) * k;
    const len = c.avoid.length();
    if (len > 0.8) c.avoid.multiplyScalar(0.8 / len);
    return slow;
  }

  /**
   * Biomechanical walk / run cycle. Cadence is derived from speed and stride length
   * so feet don't slide; knees fold in swing, pelvis shifts over the stance leg and
   * rotates with the stride, shoulders counter-rotate, head stays stabilised.
   */
  _animateGait(c, isJogging, delta) {
    const r = c.rig;
    if (!r) return;
    const g = c.gait;
    const pace = THREE.MathUtils.clamp(c.curSpeed / (isJogging ? c.jogSpeed : c.walkSpeed), 0, 1.2);
    const p1 = Math.min(1, pace);
    const stride = (isJogging ? 0.8 : 0.48) * g.stride * Math.max(0.15, pace);
    const legLen = 1.3 * c.mesh.scale.y;
    const stepLen = Math.max(0.15, 2 * legLen * Math.sin(stride));
    c.animPhase += delta * Math.PI * c.curSpeed / stepLen;

    const ph = c.animPhase;
    const s = Math.sin(ph);
    const co = Math.cos(ph);

    // Legs
    const kneeSwing = (isJogging ? 1.5 : 0.75) * p1;
    r.leftLegUpper.rotation.set(-s * stride, 0, 0);
    r.rightLegUpper.rotation.set(s * stride, 0, 0);
    r.leftLegLower.rotation.set(Math.max(0, co) * kneeSwing + 0.05, 0, 0);
    r.rightLegLower.rotation.set(Math.max(0, -co) * kneeSwing + 0.05, 0, 0);

    // Pelvis: vertical bob (highest at mid-stance when walking, in flight when running),
    // lateral shift over the stance leg, yaw with the stride, drop on the swing side
    const bobAmp = (isJogging ? 0.1 : 0.045) * g.bounce * p1;
    const bob = isJogging ? (1 - Math.cos(2 * ph)) * 0.5 : (1 + Math.cos(2 * ph)) * 0.5;
    const pelvisYaw = -s * 0.07 * p1;
    const pelvisDrop = -co * g.hipSway * 0.8 * p1;
    r.hips.position.set(-co * g.hipSway * p1, 1.35 - bobAmp * 0.5 + bob * bobAmp, 0);
    r.hips.rotation.set(0, pelvisYaw, pelvisDrop);

    // Spine: forward lean with speed, shoulders counter-rotate against the pelvis
    r.torso.rotation.set(
      g.posture + (isJogging ? 0.18 : 0.04) * p1,
      -pelvisYaw * 1.8,
      -pelvisDrop * 1.2
    );
    r.torso.scale.set(1, 1, 1);

    // Arms swing opposite the legs with a slight lag; forward-swinging elbow flexes more
    const a = Math.sin(ph - 0.25);
    const swing = (isJogging ? 0.85 : 0.42) * g.armSwing * Math.max(0.1, p1);
    const baseElbow = isJogging ? 1.35 : 0.12;
    const elbowGain = isJogging ? 0.25 : 0.4;
    const spread = isJogging ? 0.1 : 0.07;
    r.leftArmUpper.rotation.set(a * swing, 0, spread);
    r.leftArmLower.rotation.set(-(baseElbow + Math.max(0, -a) * elbowGain), 0, 0);
    r.rightArmUpper.rotation.set(-a * swing, 0, -spread);
    r.rightArmLower.rotation.set(-(baseElbow + Math.max(0, a) * elbowGain), 0, 0);

    // Head stays level and facing forward (plus gaze toward the player)
    r.headPivot.rotation.set(
      -r.torso.rotation.x * 0.6 + 0.02,
      -(pelvisYaw + r.torso.rotation.y) + c.lookYaw,
      -(pelvisDrop + r.torso.rotation.z)
    );
  }

  /**
   * Blend joints over ~0.4s whenever a citizen changes state, so poses
   * transition (sit -> stand, walk -> phone, etc.) instead of snapping.
   */
  _smoothPose(c, delta) {
    const r = c.rig;
    if (!r) return;
    if (!c.poseCache) {
      c.poseCache = RIG_JOINTS.map(key => r[key].rotation.clone());
      c.hipsCache = r.hips.position.clone();
      c.lastState = c.state;
      return;
    }
    if (c.lastState !== c.state) {
      c.blend = 1;
      c.lastState = c.state;
    }
    if (c.blend > 0) {
      c.blend = Math.max(0, c.blend - delta / 0.4);
      const k = 1 - Math.exp(-delta * 10);
      RIG_JOINTS.forEach((key, idx) => {
        const cur = r[key].rotation;
        const prev = c.poseCache[idx];
        cur.set(
          prev.x + (cur.x - prev.x) * k,
          prev.y + (cur.y - prev.y) * k,
          prev.z + (cur.z - prev.z) * k
        );
      });
      if (c.state !== 'LAYING' && c.state !== 'SITTING') {
        r.hips.position.lerpVectors(c.hipsCache, r.hips.position, k);
      }
    }
    RIG_JOINTS.forEach((key, idx) => c.poseCache[idx].copy(r[key].rotation));
    c.hipsCache.copy(r.hips.position);
  }

  update(delta, playerPos = null) {
    if (!this.allCitizens.length) return;
    const nowTime = performance.now() * 0.001;

    for (let i = 0; i < this.allCitizens.length; i++) {
      const c = this.allCitizens[i];
      this._updateCitizen(c, i, delta, nowTime, playerPos);
      this._smoothPose(c, delta);
    }
  }

  _updateCitizen(c, i, delta, nowTime, playerPos) {
    // Decrement timers
    if (c.talkCooldown > 0) c.talkCooldown -= delta;
    if (c.decisionCooldown > 0) c.decisionCooldown -= delta;
    if (c.stateTimer > 0) c.stateTimer -= delta;

    // Anyone not on the move is standing still and will accelerate from rest when they set off
    if (c.state !== 'WALKING' && c.state !== 'JOGGING') c.curSpeed = 0;

    this._updateGaze(c, playerPos, delta);

    // ==========================================
    // STATE 1: PLAYER_TALKING (Interacting with Player)
    // ==========================================
    if (c.state === 'PLAYER_TALKING') {
      const seated = c.prevState === 'SITTING';
      if (!seated && c.faceYaw !== undefined) this._turnTowards(c.mesh, c.faceYaw, 5, delta);
      const t = nowTime * 4.0;
      if (c.rig) {
        if (seated) this._breathe(c, nowTime);
        else this._applyIdleStance(c, nowTime);
        c.rig.rightArmUpper.rotation.set(-0.3 + Math.sin(t) * 0.15, 0, -0.08);
        c.rig.rightArmLower.rotation.set(-0.8, 0, 0);
        c.rig.headPivot.rotation.x = 0.06 + Math.sin(t * 0.5) * 0.03;
        this._applyWave(c, delta);
      }
      c.bubbleSprite.visible = true;
      if (!(c.waveTimer > 0)) c.bubbleSprite.material.map = this.bubbleTextures.chat;
      return;
    }

    // ==========================================
    // STATE 2: SITTING (On Central Park Bench)
    // ==========================================
    if (c.state === 'SITTING') {
      // Breathe and glance around while seated
      const t = nowTime * 1.5;
      if (c.rig) {
        this._breathe(c, nowTime);
        c.rig.headPivot.rotation.y = Math.sin(t + c.breathPhase) * 0.2 + c.lookYaw;
      }

      // When well rested, stand up and choose where to explore next!
      if (c.stateTimer <= 0) {
        if (c.benchRef) {
          c.benchRef.occupant = null;
          c.benchRef = null;
        }
        this._resetToStandingPose(c.rig);
        c.bubbleSprite.visible = false;
        c.state = 'WALKING';
        c.speed = c.walkSpeed;
        c.decisionCooldown = 15.0 + Math.random() * 15.0;

        // Pick destination from park fountain
        c.currentNodeKey = 'park_fountain';
        const node = this.nodes['park_fountain'];
        c.targetNodeKey = node.neighbors[Math.floor(Math.random() * node.neighbors.length)];
        c.progress = 0;
      }
      return;
    }

    // ==========================================
    // STATE 3: LAYING (Sunbathing on Park Grass)
    // ==========================================
    if (c.state === 'LAYING') {
      if (c.rig) this._breathe(c, nowTime);
      if (c.stateTimer <= 0) {
        // Stand up and resume walking
        c.mesh.rotation.x = 0;
        this._resetToStandingPose(c.rig);
        c.bubbleSprite.visible = false;
        c.state = 'WALKING';
        c.speed = c.walkSpeed;
        c.decisionCooldown = 18.0 + Math.random() * 15.0;
      }
      return;
    }

    // ==========================================
    // STATE 4: DANCING (Spontaneous street dance)
    // ==========================================
    if (c.state === 'DANCING') {
      if (c.stateTimer <= 0) {
        this._resetToStandingPose(c.rig);
        c.bubbleSprite.visible = false;
        c.state = 'WALKING';
        c.speed = c.walkSpeed;
        c.decisionCooldown = 20.0 + Math.random() * 15.0;
      } else if (c.rig) {
        // Play energetic dance animation
        const t = nowTime * 6.5;
        c.rig.hips.position.x = Math.sin(t) * 0.14;
        c.rig.hips.rotation.y = Math.sin(t) * 0.32;
        c.rig.leftArmUpper.rotation.z = 1.1 + Math.sin(t) * 0.45;
        c.rig.leftArmUpper.rotation.x = Math.cos(t) * 0.55;
        c.rig.rightArmUpper.rotation.z = -1.1 - Math.sin(t) * 0.45;
        c.rig.rightArmUpper.rotation.x = -Math.cos(t) * 0.55;
        c.rig.headPivot.rotation.z = -Math.sin(t) * 0.22;
      }
      return;
    }

    // ==========================================
    // STATE 5: TALKING (NPC-to-NPC Social Chat)
    // ==========================================
    if (c.state === 'TALKING') {
      if (c.stateTimer <= 0) {
        // Wave goodbye and resume wandering
        c.bubbleSprite.visible = false;
        this._resetToStandingPose(c.rig);
        c.state = 'WALKING';
        c.speed = c.walkSpeed;
        c.talkCooldown = 18.0 + Math.random() * 12.0;
        c.decisionCooldown = 10.0 + Math.random() * 10.0;
        c.partner = null;
        c.waveTimer = c.waveDuration = 1.2;
      } else {
        if (c.faceYaw !== undefined) this._turnTowards(c.mesh, c.faceYaw, 4, delta);
        const t = nowTime * 4.0 + c.breathPhase;
        if (c.rig) {
          this._applyIdleStance(c, nowTime);
          if (c.isSpeaker) {
            c.rig.rightArmUpper.rotation.set(-0.25 + Math.sin(t) * 0.15, 0, -0.1);
            c.rig.rightArmLower.rotation.set(-(0.9 + Math.cos(t) * 0.25), 0, 0);
            c.rig.headPivot.rotation.x = 0.04 + Math.sin(t * 0.7) * 0.06;
          } else {
            // Listener nods now and then
            c.rig.headPivot.rotation.x = Math.max(0, Math.sin(t * 0.8)) * 0.1;
          }
          c.rig.headPivot.rotation.y = c.lookYaw * 0.5;
        }
        c.bubbleSprite.position.y = 2.05 + Math.sin(nowTime * 3) * 0.03;
      }
      return;
    }

    // ==========================================
    // STATE 6: INDIVIDUAL ACTIONS (Phone, Coffee, Skyline)
    // ==========================================
    if (c.state === 'CHECKING_PHONE') {
      if (c.stateTimer <= 0) {
        this._resetToStandingPose(c.rig);
        c.bubbleSprite.visible = false;
        c.state = 'WALKING';
        c.speed = c.walkSpeed;
      } else if (c.rig) {
        this._applyIdleStance(c, nowTime);
        c.rig.rightArmUpper.rotation.set(0.1, 0, -0.12);
        c.rig.rightArmLower.rotation.set(-1.45, 0, 0);
        c.rig.leftArmUpper.rotation.set(0.1, 0, 0.12);
        c.rig.leftArmLower.rotation.set(-1.35, 0, 0);
        c.rig.headPivot.rotation.x = 0.38;
        c.rig.headPivot.rotation.y = c.lookYaw * 0.3;
      }
      return;
    }

    if (c.state === 'DRINKING_COFFEE') {
      if (c.stateTimer <= 0) {
        this._resetToStandingPose(c.rig);
        c.bubbleSprite.visible = false;
        c.state = 'WALKING';
        c.speed = c.walkSpeed;
      } else if (c.rig) {
        this._applyIdleStance(c, nowTime);
        // Lift cup to the lips, sip, lower
        const sip = Math.max(0, Math.sin((nowTime + c.breathPhase) * 1.2));
        c.rig.rightArmUpper.rotation.set(-0.15 - sip * 0.2, 0, -0.1);
        c.rig.rightArmLower.rotation.set(-1.4 - sip * 0.7, 0, 0);
        c.rig.headPivot.rotation.x = -0.12 * sip;
      }
      return;
    }

    if (c.state === 'LOOKING_AROUND') {
      if (c.stateTimer <= 0) {
        this._resetToStandingPose(c.rig);
        c.bubbleSprite.visible = false;
        c.state = 'WALKING';
        c.speed = c.walkSpeed;
      } else if (c.rig) {
        this._applyIdleStance(c, nowTime);
        c.rig.headPivot.rotation.x = -0.1;
        c.rig.headPivot.rotation.y = Math.sin(nowTime * 1.5) * 0.45 + c.lookYaw;
      }
      return;
    }

    // ==========================================
    // STATE 7: WALKING OR JOGGING (Dynamic Graph Navigation)
    // ==========================================
    const isJogging = (c.state === 'JOGGING');
    if (isJogging && c.stateTimer <= 0) {
      c.state = 'WALKING';
      c.speed = c.walkSpeed;
      c.bubbleSprite.visible = false;
      c.decisionCooldown = 15.0 + Math.random() * 10.0;
    }

    const fromNode = this.nodes[c.currentNodeKey];
    const toNode = this.nodes[c.targetNodeKey];
    if (!fromNode || !toNode) return;

    const p1 = fromNode.pos;
    const p2 = toNode.pos;
    const segmentDist = p1.distanceTo(p2) || 10;

    // Ease toward target speed; slow down when someone is in the way
    const crowdFactor = this._computeAvoidance(c, i, delta, playerPos);
    c.curSpeed += (c.speed * crowdFactor - c.curSpeed) * Math.min(1, delta * 2.5);
    c.progress += (c.curSpeed * delta) / segmentDist;

    if (c.progress >= 1.0) {
      // Arrived at target node! Pick next destination autonomously
      c.currentNodeKey = c.targetNodeKey;
      c.progress = 0;

      const currentNode = this.nodes[c.currentNodeKey];
      const options = currentNode.neighbors;
      c.targetNodeKey = options[Math.floor(Math.random() * options.length)];

      // ----------------------------------------------------
      // Autonomous Decision Engine ("Do what they like!")
      // ----------------------------------------------------
      if (c.decisionCooldown <= 0) {
        c.decisionCooldown = 12.0 + Math.random() * 16.0;

        // Decision Option A: Sit on a bench in Central Park
        if (currentNode.district === 'park') {
          const freeBench = this.benches.find(b => b.occupant === null);
          if (freeBench && Math.random() < 0.35) {
            freeBench.occupant = c;
            c.benchRef = freeBench;
            c.state = 'SITTING';
            c.stateTimer = 12.0 + Math.random() * 18.0;
            const groundY = this.collisionSys
              ? this.collisionSys.getGroundHeight(freeBench.x, freeBench.z)
              : 1.85;
            c.mesh.position.set(freeBench.x, groundY, freeBench.z);
            c.mesh.rotation.y = freeBench.rot;
            this._applySittingPose(c.rig);
            c.bubbleSprite.visible = true;
            c.bubbleSprite.material.map = this.bubbleTextures.bench;
            return;
          }

          // Decision Option B: Lie down on soft green grass to sunbathe
          if (Math.random() < 0.22) {
            c.state = 'LAYING';
            c.stateTimer = 10.0 + Math.random() * 12.0;
            c.mesh.rotation.x = -Math.PI / 2;
            if (c.rig) c.rig.hips.position.y = 0.28;
            c.bubbleSprite.visible = true;
            c.bubbleSprite.material.map = this.bubbleTextures.lay;
            return;
          }
        }

        // Decision Option C: Spontaneous Joyful Dance!
        if (Math.random() < 0.12) {
          c.state = 'DANCING';
          c.stateTimer = 4.5 + Math.random() * 3.5;
          c.bubbleSprite.visible = true;
          c.bubbleSprite.material.map = this.bubbleTextures.dance;
          return;
        }

        // Decision Option D: Athletic Jogging sprint
        if (Math.random() < 0.2) {
          c.state = 'JOGGING';
          c.speed = c.jogSpeed;
          c.stateTimer = 8.0 + Math.random() * 12.0;
          c.bubbleSprite.visible = true;
          c.bubbleSprite.material.map = this.bubbleTextures.jog;
        }

        // Decision Option E: Check phone
        if (Math.random() < 0.15) {
          c.state = 'CHECKING_PHONE';
          c.stateTimer = 3.5;
          c.bubbleSprite.visible = true;
          c.bubbleSprite.material.map = this.bubbleTextures.phone;
          return;
        }

        // Decision Option F: Drink coffee
        if (Math.random() < 0.15) {
          c.state = 'DRINKING_COFFEE';
          c.stateTimer = 3.2;
          c.bubbleSprite.visible = true;
          c.bubbleSprite.material.map = this.bubbleTextures.coffee;
          return;
        }

        // Decision Option G: Admire scenic skyline
        if (Math.random() < 0.15) {
          c.state = 'LOOKING_AROUND';
          c.stateTimer = 3.5;
          c.bubbleSprite.visible = true;
          c.bubbleSprite.material.map = this.bubbleTextures.city;
          return;
        }
      }
    }

    // Interpolate position along segment, offset sideways by personal-space steering
    const targetPos = new THREE.Vector3().lerpVectors(p1, p2, c.progress);
    targetPos.x += c.avoid.x;
    targetPos.z += c.avoid.y;

    if (this.collisionSys) {
      const resolved = this.collisionSys.resolveMovement(
        c.mesh.position.x,
        c.mesh.position.z,
        targetPos.x,
        targetPos.z,
        0.28
      );
      c.mesh.position.x = resolved.x;
      c.mesh.position.z = resolved.z;
    } else {
      c.mesh.position.x = targetPos.x;
      c.mesh.position.z = targetPos.z;
    }

    // Dynamic surface elevation following
    const groundY = this.collisionSys
      ? this.collisionSys.getGroundHeight(c.mesh.position.x, c.mesh.position.z)
      : targetPos.y;
    c.mesh.position.y = groundY;

    // Turn smoothly toward travel direction
    const dirX = p2.x - p1.x;
    const dirZ = p2.z - p1.z;
    if (Math.abs(dirX) > 0.001 || Math.abs(dirZ) > 0.001) {
      this._turnTowards(c.mesh, Math.atan2(dirX, dirZ), c.state === 'JOGGING' ? 8 : 5, delta);
    }

    this._animateGait(c, c.state === 'JOGGING', delta);
    this._applyWave(c, delta);

    // Check for spontaneous social chat with nearby walking citizens
    if (c.talkCooldown <= 0 && c.state === 'WALKING') {
      for (let j = i + 1; j < this.allCitizens.length; j++) {
        const other = this.allCitizens[j];
        if (other.state !== 'WALKING' || other.talkCooldown > 0) continue;

        const dx = other.mesh.position.x - c.mesh.position.x;
        const dz = other.mesh.position.z - c.mesh.position.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < 4.0) { // ~2 meters
          if (Math.random() < 0.35) {
            c.state = 'TALKING';
            other.state = 'TALKING';
            c.stateTimer = 5.0 + Math.random() * 2.5;
            other.stateTimer = c.stateTimer;

            c.partner = other;
            other.partner = c;

            c.isSpeaker = true;
            other.isSpeaker = false;

            // Turn to face each other
            c.faceYaw = Math.atan2(dx, dz);
            other.faceYaw = Math.atan2(-dx, -dz);

            c.bubbleSprite.visible = true;
            c.bubbleSprite.material.map = this.bubbleTextures.chat;

            other.bubbleSprite.visible = true;
            other.bubbleSprite.material.map = this.bubbleTextures.sparkle;
            break;
          } else {
            // Friendly wave in passing
            c.waveTimer = c.waveDuration = 1.4;
            c.talkCooldown = 6.0;
          }
        }
      }
    }
  }

  /**
   * Find nearest citizen within maxDist of player
   */
  getNearestCitizen(playerPos, maxDist = 3.5) {
    let nearest = null;
    let minDistSq = maxDist * maxDist;

    for (let i = 0; i < this.allCitizens.length; i++) {
      const c = this.allCitizens[i];
      if (!c.mesh) continue;

      const dx = c.mesh.position.x - playerPos.x;
      const dz = c.mesh.position.z - playerPos.z;
      const dSq = dx * dx + dz * dz;

      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = c;
      }
    }

    return nearest ? { citizen: nearest, distance: Math.sqrt(minDistSq) } : null;
  }

  /**
   * Start conversation with citizen
   */
  startPlayerConversation(citizen, playerPos) {
    if (!citizen) return null;

    this.activePlayerCitizen = citizen;
    citizen.prevState = citizen.state;
    citizen.state = 'PLAYER_TALKING';

    // Someone lying on the grass gets up to talk
    if (citizen.prevState === 'LAYING') {
      citizen.mesh.rotation.x = 0;
      citizen.prevState = 'WALKING';
    }

    // Turn toward the player (applied smoothly in update)
    if (playerPos && citizen.prevState !== 'SITTING') {
      const dx = playerPos.x - citizen.mesh.position.x;
      const dz = playerPos.z - citizen.mesh.position.z;
      citizen.faceYaw = Math.atan2(dx, dz);
    }

    // Friendly greeting wave
    citizen.waveTimer = citizen.waveDuration = 1.6;
    citizen.bubbleSprite.visible = true;
    citizen.bubbleSprite.material.map = this.bubbleTextures.wave;

    const line = citizen.dialogueLines[citizen.dialogueIndex % citizen.dialogueLines.length];

    return {
      name: citizen.name,
      title: citizen.title,
      avatar: citizen.avatar,
      text: line
    };
  }

  /**
   * Advance dialogue line
   */
  nextDialogue(citizen) {
    if (!citizen) citizen = this.activePlayerCitizen;
    if (!citizen) return null;

    citizen.dialogueIndex = (citizen.dialogueIndex + 1) % citizen.dialogueLines.length;
    const line = citizen.dialogueLines[citizen.dialogueIndex];

    citizen.bubbleSprite.visible = true;
    citizen.bubbleSprite.material.map = this.bubbleTextures.chat;

    return {
      name: citizen.name,
      title: citizen.title,
      avatar: citizen.avatar,
      text: line
    };
  }

  /**
   * Citizen waves back at player
   */
  citizenWave(citizen) {
    if (!citizen) citizen = this.activePlayerCitizen;
    if (!citizen) return;

    citizen.waveTimer = citizen.waveDuration = 1.6;
    citizen.bubbleSprite.visible = true;
    citizen.bubbleSprite.material.map = this.bubbleTextures.wave;
  }

  /**
   * End player conversation and return citizen to autonomous freedom
   */
  endPlayerConversation(citizen) {
    if (!citizen) citizen = this.activePlayerCitizen;
    if (!citizen) return;

    citizen.bubbleSprite.visible = false;
    citizen.state = citizen.prevState || 'WALKING';
    citizen.talkCooldown = 10.0;
    citizen.decisionCooldown = 8.0;

    if (this.activePlayerCitizen === citizen) {
      this.activePlayerCitizen = null;
    }
  }

  clear() {
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.allCitizens = [];
    this.activePlayerCitizen = null;
    this.benches.forEach(b => b.occupant = null);
  }
}
