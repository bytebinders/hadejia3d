import * as THREE from 'three';

/**
 * LowPolyHuman — Universal Stickman Skeletal Rig with Modular 3D Realistic Clothes & Hairstyles
 * 
 * Provides:
 * - Universal articulated skeletal stickman rig with 12 movable bone joints:
 *   (hips, torso, headPivot, leftArmUpper, leftArmLower, rightArmUpper, rightArmLower,
 *    leftLegUpper, leftLegLower, rightLegUpper, rightLegLower)
 * - Anatomical gender archetypes:
 *   - Men (Harpy archetype): Broad chest, athletic posture, defined throat / Adam's apple, masculine proportions
 *   - Women (Xixi archetype): Slender waist, graceful bust contours, feminine hip curve, delicate jewelry
 * - Super Realistic Modular 3D Clothes:
 *   - Men: Urban bomber jacket, Kaftan, Royal Babban Riga, Palace Guard, denim jeans, sneakers, leather sandals
 *   - Women: Urban chic jacket & blouse, traditional Hausa Atampa dress with peplum ruffle & sash, modest Abaya, skirts
 * - Modular 3D Hairstyles & Headwear:
 *   - Men: Urban fade, Zanna Bukar embroidered Hula cap, Rawani turban, textured afro, snapback cap
 *   - Women: Graceful Mayafi / Hijab veil, high anime ponytail, twin braids, chic bob, flowing hair
 * - Jewelry & Accessories:
 *   - Men: Smartwatch, leather belt & gold buckle
 *   - Women: Gold hoop earrings, gold necklace/choker, gold wrist bangles
 */
export class LowPolyHuman {
  /**
   * Create an articulated human stickman rig dressed in realistic 3D clothes
   * @param {Object} options Configuration options
   */
  static create(options = {}) {
    const isPlayer = options.isPlayer || false;
    const rawGender = options.gender || (options.avatarId === 'xixi' || options.avatarId === 'women' || options.avatarId === 'female' ? 'women' : 'men');
    const gender = (rawGender === 'women' || rawGender === 'female' || rawGender === 'xixi') ? 'women' : 'men';
    const isWomen = (gender === 'women');

    // Style / Outfit selection
    const style = options.style || options.outfit || (
      isPlayer
        ? (isWomen ? 'xixi_urban' : 'harpy_urban')
        : (isWomen ? this.getRandomWomenStyle() : this.getRandomMenStyle())
    );

    // Hairstyle selection
    const hairstyle = options.hairstyle || (
      isPlayer
        ? (isWomen ? 'hijab_mayafi' : 'hula_zanna')
        : (isWomen ? this.getRandomWomenHairstyle() : this.getRandomMenHairstyle())
    );

    // Palettes
    const palette = options.palette || (isPlayer ? this.getPlayerPalette(gender) : this.getRandomPalette(gender));
    const skinColor = options.skinColor || palette.skinColor;
    const lipColor = options.lipColor || palette.lipColor;
    const eyeColor = options.eyeColor || palette.eyeColor;
    const hairColor = options.hairColor || palette.hairColor;
    const primaryColor = options.shirtColor || palette.shirtColor;
    const secondaryColor = options.jacketColor || palette.jacketColor;
    const pantsColor = options.pantsColor || palette.pantsColor;
    const shoeColor = options.shoesColor || palette.shoesColor;

    // Materials
    const materials = {
      skin: new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.72, metalness: 0.05, flatShading: true }),
      lips: new THREE.MeshStandardMaterial({ color: lipColor, roughness: 0.6, flatShading: true }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, flatShading: true }),
      eyeIris: new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.3, flatShading: true }),
      eyePupil: new THREE.MeshBasicMaterial({ color: 0x050505 }),
      eyebrow: new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9, flatShading: true }),
      hair: new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85, flatShading: true }),
      primary: new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.65, flatShading: true }),
      secondary: new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.68, flatShading: true }),
      shirtCollar: new THREE.MeshStandardMaterial({ color: isPlayer ? 0xffffff : 0xe2e8f0, roughness: 0.7, flatShading: true }),
      pants: new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.75, flatShading: true }),
      beltLeather: new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.6, flatShading: true }),
      buckleGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.8, flatShading: true }),
      watchCase: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.85, flatShading: true }),
      watchStrap: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, flatShading: true }),
      soleWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45, flatShading: true }),
      soleDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, flatShading: true }),
      shoeUpper: new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.6, flatShading: true }),
      shoeLaces: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, flatShading: true }),
      coffeeCup: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, flatShading: true }),
      coffeeLid: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, flatShading: true }),
      phoneCase: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.4, flatShading: true }),
      backpack: new THREE.MeshStandardMaterial({ color: isPlayer ? 0x0284c7 : 0xd97706, roughness: 0.7, flatShading: true })
    };

    const root = new THREE.Group();
    root.name = isPlayer ? `Player_${gender}` : `Citizen_${gender}_${style}`;

    // Standardized uniform scale (0.65)
    const baseScale = options.scale !== undefined ? options.scale : 0.65;
    root.scale.set(baseScale, baseScale, baseScale);

    // ==========================================
    // 1. PELVIS / HIPS GROUP (Root pivot at Y = 1.35)
    // ==========================================
    const hips = new THREE.Group();
    hips.position.y = 1.35;
    root.add(hips);

    // Proportions: Men have athletic narrower hips, Women have wider feminine hip curve
    const pelvisTop = isWomen ? 0.30 : 0.35;
    const pelvisBottom = isWomen ? 0.38 : 0.32;
    const pelvisH = isWomen ? 0.34 : 0.36;

    const pelvisGeo = new THREE.CylinderGeometry(pelvisTop, pelvisBottom, pelvisH, 8);
    pelvisGeo.rotateY(Math.PI / 8);
    const pelvis = new THREE.Mesh(pelvisGeo, materials.pants);
    pelvis.castShadow = true;
    hips.add(pelvis);

    // Belt or Waistband
    const beltTop = isWomen ? 0.31 : 0.37;
    const beltGeo = new THREE.CylinderGeometry(beltTop, beltTop, 0.08, 8);
    beltGeo.rotateY(Math.PI / 8);
    const belt = new THREE.Mesh(beltGeo, isWomen ? materials.secondary : materials.beltLeather);
    belt.position.y = 0.13;
    hips.add(belt);

    // Belt Buckle
    const buckleGeo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
    const buckle = new THREE.Mesh(buckleGeo, materials.buckleGold);
    buckle.position.set(0, 0.13, isWomen ? 0.32 : 0.38);
    hips.add(buckle);

    // Traditional Atampa Wrapper (Zani) / Long Skirt Over-layer for Women
    if (isWomen && (style === 'hausa_atampa' || style === 'modest_abaya')) {
      const zaniGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.72, 8);
      zaniGeo.rotateY(Math.PI / 8);
      const zani = new THREE.Mesh(zaniGeo, materials.pants);
      zani.position.y = -0.32;
      zani.castShadow = true;
      hips.add(zani);

      // Wrapper border trim
      const zaniBorderGeo = new THREE.CylinderGeometry(0.442, 0.442, 0.08, 8);
      zaniBorderGeo.rotateY(Math.PI / 8);
      const zaniBorder = new THREE.Mesh(zaniBorderGeo, materials.secondary);
      zaniBorder.position.y = -0.66;
      hips.add(zaniBorder);
    }

    // ==========================================
    // 2. TORSO & CHEST
    // ==========================================
    const torso = new THREE.Group();
    torso.position.y = 0.2;
    hips.add(torso);

    // Torso Dimensions:
    // Men: broad chest (0.44), tapered waist (0.34)
    // Women: slender waist (0.28), graceful hourglass silhouette (0.36)
    const torsoTop = isWomen ? 0.36 : 0.44;
    const torsoBottom = isWomen ? 0.28 : 0.34;
    const torsoH = isWomen ? 0.78 : 0.85;

    const torsoGeo = new THREE.CylinderGeometry(torsoTop, torsoBottom, torsoH, 8);
    torsoGeo.rotateY(Math.PI / 8);
    const torsoMesh = new THREE.Mesh(torsoGeo, materials.primary);
    torsoMesh.position.y = torsoH / 2;
    torsoMesh.castShadow = true;
    torso.add(torsoMesh);

    // Anatomical Chest Definition:
    if (isWomen) {
      // Sculpted Feminine Bust Contours
      const bustGeo = new THREE.SphereGeometry(0.12, 8, 8);
      bustGeo.scale(1, 0.9, 1.2);

      const leftBust = new THREE.Mesh(bustGeo, materials.primary);
      leftBust.position.set(0.11, 0.50, 0.22);
      torso.add(leftBust);

      const rightBust = new THREE.Mesh(bustGeo, materials.primary);
      rightBust.position.set(-0.11, 0.50, 0.22);
      torso.add(rightBust);

      // Chic Blouse Neckline
      const vNeckGeo = new THREE.BoxGeometry(0.16, 0.16, 0.05);
      const vNeck = new THREE.Mesh(vNeckGeo, materials.skin);
      vNeck.position.set(0, 0.70, 0.20);
      torso.add(vNeck);

    } else {
      // Sculpted Masculine Pectoral Plates
      const pecGeo = new THREE.BoxGeometry(0.24, 0.26, 0.1);

      const leftPec = new THREE.Mesh(pecGeo, materials.primary);
      leftPec.position.set(0.13, 0.58, 0.24);
      leftPec.rotation.y = 0.12;
      torso.add(leftPec);

      const rightPec = new THREE.Mesh(pecGeo, materials.primary);
      rightPec.position.set(-0.13, 0.58, 0.24);
      rightPec.rotation.y = -0.12;
      torso.add(rightPec);

      // Shirt Collar
      const collarGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.08, 8);
      collarGeo.rotateY(Math.PI / 8);
      const collar = new THREE.Mesh(collarGeo, materials.shirtCollar);
      collar.position.y = 0.88;
      torso.add(collar);
    }

    // Outfit-Specific 3D Clothes Details:
    if (isWomen) {
      if (style === 'hausa_atampa') {
        // Traditional Peplum Ruffle at waist
        const peplumGeo = new THREE.CylinderGeometry(0.30, 0.44, 0.18, 8);
        peplumGeo.rotateY(Math.PI / 8);
        const peplum = new THREE.Mesh(peplumGeo, materials.primary);
        peplum.position.y = 0.08;
        torso.add(peplum);

        // Elegant Cross-Body Sash
        const sashGeo = new THREE.BoxGeometry(0.14, 0.82, 0.06);
        const sash = new THREE.Mesh(sashGeo, materials.secondary);
        sash.position.set(0.04, 0.44, 0.26);
        sash.rotation.z = -0.18;
        torso.add(sash);

      } else if (style === 'xixi_urban') {
        // Modern Cropped Jacket with Lapels
        const jacketLeft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.08), materials.secondary);
        jacketLeft.position.set(0.16, 0.48, 0.22);
        torso.add(jacketLeft);

        const jacketRight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.08), materials.secondary);
        jacketRight.position.set(-0.16, 0.48, 0.22);
        torso.add(jacketRight);

        // Gold zipper / clasp
        const zipperGeo = new THREE.BoxGeometry(0.03, 0.40, 0.02);
        const zipper = new THREE.Mesh(zipperGeo, materials.buckleGold);
        zipper.position.set(0, 0.48, 0.25);
        torso.add(zipper);

      } else if (style === 'modest_abaya') {
        // Flowing Golden Neckline Embroidery
        const embroGeo = new THREE.BoxGeometry(0.18, 0.46, 0.04);
        const embro = new THREE.Mesh(embroGeo, materials.buckleGold);
        embro.position.set(0, 0.50, 0.22);
        torso.add(embro);
      }

    } else {
      // Men's Outfits
      if (style === 'harpy_urban') {
        // Urban Bomber / Denim Jacket
        const jacketLapelL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.58, 0.08), materials.secondary);
        jacketLapelL.position.set(0.20, 0.50, 0.24);
        torso.add(jacketLapelL);

        const jacketLapelR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.58, 0.08), materials.secondary);
        jacketLapelR.position.set(-0.20, 0.50, 0.24);
        torso.add(jacketLapelR);

        // Metallic Center Zipper
        const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.60, 0.03), materials.watchCase);
        zipper.position.set(0, 0.48, 0.26);
        torso.add(zipper);

      } else if (style === 'emir_guard') {
        // Palace Dogari Guard Robe
        const guardStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.08), new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.7, flatShading: true }));
        guardStripeL.position.set(-0.11, 0.45, 0.28);
        torso.add(guardStripeL);

        const guardStripeR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.08), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true }));
        guardStripeR.position.set(0.11, 0.45, 0.28);
        torso.add(guardStripeR);

        // Golden Royal Palace Crest Medallion
        const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8), materials.buckleGold);
        crest.rotateX(Math.PI / 2);
        crest.position.set(0, 0.62, 0.32);
        torso.add(crest);

      } else {
        // Traditional Embroidered Kaftan / Babban Riga
        const embroPlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.48, 0.05), materials.secondary);
        embroPlate.position.set(0, 0.52, 0.28);
        torso.add(embroPlate);

        // Golden needlework center motif
        const centerNeedle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.07), materials.buckleGold);
        centerNeedle.position.set(0, 0.52, 0.29);
        torso.add(centerNeedle);

        // Flowing Babban Riga shoulder drapes
        if (style === 'hausa_babban_riga' || isPlayer) {
          [-0.38, 0.38].forEach((x, idx) => {
            const drape = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.22), materials.primary);
            drape.position.set(x, 0.44, 0);
            drape.rotation.z = idx === 0 ? 0.1 : -0.1;
            torso.add(drape);
          });
        }
      }
    }

    // ==========================================
    // 3. NECK, HEAD & FACIAL FEATURES
    // ==========================================
    const headPivot = new THREE.Group();
    headPivot.position.y = isWomen ? 0.88 : 0.94;
    torso.add(headPivot);

    // Sculpted Neck
    const neckTop = isWomen ? 0.095 : 0.12;
    const neckBottom = isWomen ? 0.12 : 0.15;
    const neckH = isWomen ? 0.20 : 0.22;

    const neckGeo = new THREE.CylinderGeometry(neckTop, neckBottom, neckH, 8);
    const neck = new THREE.Mesh(neckGeo, materials.skin);
    neck.position.y = 0.1;
    headPivot.add(neck);

    if (isWomen) {
      // Elegant Gold Choker / Necklace
      const necklaceGeo = new THREE.TorusGeometry(0.11, 0.012, 6, 12);
      necklaceGeo.rotateX(Math.PI / 2);
      const necklace = new THREE.Mesh(necklaceGeo, materials.buckleGold);
      necklace.position.y = 0.08;
      headPivot.add(necklace);
    } else {
      // Adam's apple bump for men
      const throat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.03), materials.skin);
      throat.position.set(0, 0.1, 0.14);
      headPivot.add(throat);
    }

    // Anatomical Head (Cranium + Cheekbones)
    const headRadius = isWomen ? 0.23 : 0.26;
    const headGeo = new THREE.CylinderGeometry(headRadius, headRadius * 0.85, 0.48, 8);
    headGeo.rotateY(Math.PI / 8);
    const head = new THREE.Mesh(headGeo, materials.skin);
    head.position.y = 0.40;
    head.castShadow = true;
    headPivot.add(head);

    // Chin & Jawline
    const chinWidth = isWomen ? 0.14 : 0.18;
    const chin = new THREE.Mesh(new THREE.BoxGeometry(chinWidth, 0.13, 0.15), materials.skin);
    chin.position.set(0, 0.21, 0.17);
    chin.rotation.x = -0.2;
    headPivot.add(chin);

    // Cheekbones (left & right)
    [-0.16, 0.16].forEach(x => {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.09), materials.skin);
      cheek.position.set(x, 0.36, 0.18);
      headPivot.add(cheek);
    });

    // Anatomical Ears with Gold Earrings for Women
    [-0.25, 0.25].forEach((x, idx) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(x, 0.40, 0.02);
      earGroup.rotation.y = idx === 0 ? -0.2 : 0.2;

      const outerEar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.07), materials.skin);
      outerEar.castShadow = true;
      earGroup.add(outerEar);

      if (isWomen) {
        // Gold Hoop Earrings
        const earringGeo = new THREE.TorusGeometry(0.038, 0.007, 6, 12);
        const earring = new THREE.Mesh(earringGeo, materials.buckleGold);
        earring.position.set(0, -0.06, 0.02);
        earGroup.add(earring);
      }

      headPivot.add(earGroup);
    });

    // 3D Human Nose
    const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.07), materials.skin);
    noseBridge.position.set(0, 0.36, 0.25);
    noseBridge.rotation.x = 0.22;
    headPivot.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.06), materials.skin);
    noseTip.position.set(0, 0.31, 0.27);
    headPivot.add(noseTip);

    // Expressive Eyes
    const eyeSpacing = isWomen ? 0.09 : 0.10;
    [-eyeSpacing, eyeSpacing].forEach((x, idx) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, 0.42, 0.23);

      // Sclera (white)
      const sclera = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.042, 0.02), materials.eyeWhite);
      eyeGroup.add(sclera);

      // Colored Iris
      const iris = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.025), materials.eyeIris);
      iris.position.z = 0.005;
      eyeGroup.add(iris);

      // Pupil
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.03), materials.eyePupil);
      pupil.position.z = 0.008;
      eyeGroup.add(pupil);

      // Eyelash Line / Eye Wing (slight feminine lift for women)
      const lash = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.014, 0.026), materials.eyebrow);
      lash.position.set(0, 0.022, 0.006);
      if (isWomen) lash.rotation.z = idx === 0 ? 0.08 : -0.08;
      eyeGroup.add(lash);

      // Eyebrow
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.03), materials.eyebrow);
      brow.position.set(0, 0.058, 0.01);
      brow.rotation.z = idx === 0 ? 0.06 : -0.06;
      eyeGroup.add(brow);

      headPivot.add(eyeGroup);
    });

    // Lips & Mouth
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.04), materials.lips);
    upperLip.position.set(0, 0.25, 0.24);
    headPivot.add(upperLip);

    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.03, 0.04), materials.lips);
    lowerLip.position.set(0, 0.225, 0.235);
    headPivot.add(lowerLip);

    // Modular Hairstyle & Headwear
    this._addHairstyle(headPivot, materials, isPlayer, style, gender, hairstyle);

    // ==========================================
    // 4. ARMS & DETAILED 5-FINGER HANDS
    // ==========================================
    const armUpperL = isWomen ? 0.42 : 0.46;
    const armLowerL = isWomen ? 0.42 : 0.46;
    const shoulderOffset = isWomen ? 0.40 : 0.50;
    const armThickness = isWomen ? 0.085 : 0.11;

    // LEFT ARM
    const leftArmUpper = new THREE.Group();
    leftArmUpper.position.set(shoulderOffset, isWomen ? 0.74 : 0.80, 0);
    torso.add(leftArmUpper);

    // Shoulder cap
    const lDeltoid = new THREE.Mesh(new THREE.DodecahedronGeometry(armThickness * 1.3, 0), materials.secondary);
    leftArmUpper.add(lDeltoid);

    // Bicep / Upper Arm
    const lUpperMesh = new THREE.Mesh(new THREE.CylinderGeometry(armThickness, armThickness * 0.85, armUpperL, 6), materials.secondary);
    lUpperMesh.position.y = -armUpperL / 2;
    lUpperMesh.castShadow = true;
    leftArmUpper.add(lUpperMesh);

    // Forearm Pivot (Elbow joint)
    const leftArmLower = new THREE.Group();
    leftArmLower.position.y = -armUpperL;
    leftArmUpper.add(leftArmLower);

    // Elbow cap
    const lElbow = new THREE.Mesh(new THREE.DodecahedronGeometry(armThickness * 0.9, 0), materials.secondary);
    lElbow.position.set(0, 0, -0.03);
    leftArmLower.add(lElbow);

    // Forearm
    const lLowerMesh = new THREE.Mesh(new THREE.CylinderGeometry(armThickness * 0.85, armThickness * 0.7, armLowerL, 6), materials.skin);
    lLowerMesh.position.y = -armLowerL / 2;
    lLowerMesh.castShadow = true;
    leftArmLower.add(lLowerMesh);

    // Wrist Accessory: Smartwatch for Men, Gold Bangles for Women
    if (isWomen) {
      const bangleGeo = new THREE.TorusGeometry(0.075, 0.012, 6, 12);
      bangleGeo.rotateX(Math.PI / 2);
      const bangle = new THREE.Mesh(bangleGeo, materials.buckleGold);
      bangle.position.y = -armLowerL + 0.06;
      leftArmLower.add(bangle);
    } else {
      const watchGroup = new THREE.Group();
      watchGroup.position.y = -armLowerL + 0.06;
      const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.04, 8), materials.watchStrap);
      watchGroup.add(strap);
      const watchFace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), materials.watchCase);
      watchFace.position.set(0, 0, 0.08);
      watchGroup.add(watchFace);
      leftArmLower.add(watchGroup);
    }

    // Detailed Left Hand
    const lHand = this._createDetailedHand(materials.skin, true, isWomen);
    lHand.position.y = -armLowerL;
    leftArmLower.add(lHand);

    // RIGHT ARM
    const rightArmUpper = new THREE.Group();
    rightArmUpper.position.set(-shoulderOffset, isWomen ? 0.74 : 0.80, 0);
    torso.add(rightArmUpper);

    // Right Shoulder cap
    const rDeltoid = new THREE.Mesh(new THREE.DodecahedronGeometry(armThickness * 1.3, 0), materials.secondary);
    rightArmUpper.add(rDeltoid);

    // Right Bicep
    const rUpperMesh = new THREE.Mesh(new THREE.CylinderGeometry(armThickness, armThickness * 0.85, armUpperL, 6), materials.secondary);
    rUpperMesh.position.y = -armUpperL / 2;
    rUpperMesh.castShadow = true;
    rightArmUpper.add(rUpperMesh);

    // Right Forearm Pivot (Elbow joint)
    const rightArmLower = new THREE.Group();
    rightArmLower.position.y = -armUpperL;
    rightArmUpper.add(rightArmLower);

    // Right Elbow cap
    const rElbow = new THREE.Mesh(new THREE.DodecahedronGeometry(armThickness * 0.9, 0), materials.secondary);
    rElbow.position.set(0, 0, -0.03);
    rightArmLower.add(rElbow);

    // Right Forearm
    const rLowerMesh = new THREE.Mesh(new THREE.CylinderGeometry(armThickness * 0.85, armThickness * 0.7, armLowerL, 6), materials.skin);
    rLowerMesh.position.y = -armLowerL / 2;
    rLowerMesh.castShadow = true;
    rightArmLower.add(rLowerMesh);

    // Detailed Right Hand
    const rHand = this._createDetailedHand(materials.skin, false, isWomen);
    rHand.position.y = -armLowerL;
    rightArmLower.add(rHand);

    // Handheld item for random pedestrians
    if (!isPlayer && Math.random() > 0.65) {
      if (Math.random() > 0.5) {
        const cup = this._createCoffeeCup(materials);
        cup.position.set(0, -0.15, 0.08);
        cup.rotation.x = 0.2;
        rightArmLower.add(cup);
      } else {
        const phone = this._createPhone(materials);
        phone.position.set(0, -0.12, 0.08);
        phone.rotation.x = 0.35;
        rightArmLower.add(phone);
      }
    }

    // ==========================================
    // 5. LEGS, KNEES & REALISTIC SNEAKERS
    // ==========================================
    const legUpperL = isWomen ? 0.62 : 0.65;
    const legLowerL = isWomen ? 0.62 : 0.65;
    const legSpacing = isWomen ? 0.16 : 0.19;
    const legThickness = isWomen ? 0.12 : 0.15;

    // LEFT LEG
    const leftLegUpper = new THREE.Group();
    leftLegUpper.position.set(legSpacing, -0.14, 0);
    hips.add(leftLegUpper);

    // Thigh with Quadricep contour
    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(legThickness, legThickness * 0.8, legUpperL, 6), materials.pants);
    lThigh.position.y = -legUpperL / 2;
    lThigh.castShadow = true;
    leftLegUpper.add(lThigh);

    // Left Shin Pivot (Knee joint)
    const leftLegLower = new THREE.Group();
    leftLegLower.position.y = -legUpperL;
    leftLegUpper.add(leftLegLower);

    // Patella Kneecap
    const lKnee = new THREE.Mesh(new THREE.BoxGeometry(legThickness * 0.9, 0.10, 0.06), materials.pants);
    lKnee.position.set(0, 0, legThickness * 0.7);
    leftLegLower.add(lKnee);

    // Shin & Calf
    const lShin = new THREE.Mesh(new THREE.CylinderGeometry(legThickness * 0.8, legThickness * 0.65, legLowerL, 6), materials.pants);
    lShin.position.y = -legLowerL / 2;
    lShin.castShadow = true;
    leftLegLower.add(lShin);

    // Pants cuff
    const lCuff = new THREE.Mesh(new THREE.CylinderGeometry(legThickness * 0.72, legThickness * 0.72, 0.06, 6), materials.pants);
    lCuff.position.y = -legLowerL + 0.03;
    leftLegLower.add(lCuff);

    // Left Footwear
    const lFootwear = this._createRealisticSneaker(materials, isWomen);
    lFootwear.position.set(0, -legLowerL, 0.08);
    leftLegLower.add(lFootwear);

    // RIGHT LEG
    const rightLegUpper = new THREE.Group();
    rightLegUpper.position.set(-legSpacing, -0.14, 0);
    hips.add(rightLegUpper);

    // Right Thigh
    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(legThickness, legThickness * 0.8, legUpperL, 6), materials.pants);
    rThigh.position.y = -legUpperL / 2;
    rThigh.castShadow = true;
    rightLegUpper.add(rThigh);

    // Right Shin Pivot (Knee joint)
    const rightLegLower = new THREE.Group();
    rightLegLower.position.y = -legUpperL;
    rightLegUpper.add(rightLegLower);

    // Patella Kneecap
    const rKnee = new THREE.Mesh(new THREE.BoxGeometry(legThickness * 0.9, 0.10, 0.06), materials.pants);
    rKnee.position.set(0, 0, legThickness * 0.7);
    rightLegLower.add(rKnee);

    // Shin & Calf
    const rShin = new THREE.Mesh(new THREE.CylinderGeometry(legThickness * 0.8, legThickness * 0.65, legLowerL, 6), materials.pants);
    rShin.position.y = -legLowerL / 2;
    rShin.castShadow = true;
    rightLegLower.add(rShin);

    // Pants cuff
    const rCuff = new THREE.Mesh(new THREE.CylinderGeometry(legThickness * 0.72, legThickness * 0.72, 0.06, 6), materials.pants);
    rCuff.position.y = -legLowerL + 0.03;
    rightLegLower.add(rCuff);

    // Right Footwear
    const rFootwear = this._createRealisticSneaker(materials, isWomen);
    rFootwear.position.set(0, -legLowerL, 0.08);
    rightLegLower.add(rFootwear);

    // ==========================================
    // 6. SKELETAL RIG INTERFACE
    // ==========================================
    const rig = {
      root,
      hips,
      torso,
      headPivot,
      leftArmUpper,
      leftArmLower,
      rightArmUpper,
      rightArmLower,
      leftLegUpper,
      leftLegLower,
      rightLegUpper,
      rightLegLower,
      gender,
      isWomen,
      style,
      hairstyle,
      materials
    };

    root.userData.rig = rig;
    return rig;
  }

  /**
   * Anatomical Hand with Palm, Opposable Thumb, and 4 Curled Fingers
   */
  static _createDetailedHand(skinMat, isLeft, isWomen = false) {
    const hand = new THREE.Group();
    const handScale = isWomen ? 0.85 : 1.0;

    // Sculpted Palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12 * handScale, 0.11 * handScale, 0.05 * handScale), skinMat);
    palm.position.y = -0.05 * handScale;
    palm.castShadow = true;
    hand.add(palm);

    // Opposable Thumb
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set((isLeft ? -0.06 : 0.06) * handScale, -0.04 * handScale, 0.02 * handScale);
    thumbGroup.rotation.z = (isLeft ? 0.35 : -0.35);
    thumbGroup.rotation.x = 0.25;

    const thumbProx = new THREE.Mesh(new THREE.BoxGeometry(0.04 * handScale, 0.05 * handScale, 0.04 * handScale), skinMat);
    thumbProx.position.y = -0.02 * handScale;
    thumbGroup.add(thumbProx);

    const thumbDist = new THREE.Mesh(new THREE.BoxGeometry(0.035 * handScale, 0.04 * handScale, 0.035 * handScale), skinMat);
    thumbDist.position.set(0, -0.05 * handScale, 0.01 * handScale);
    thumbDist.rotation.x = 0.2;
    thumbGroup.add(thumbDist);

    hand.add(thumbGroup);

    // 4 Articulated Fingers
    const fingerConfigs = [
      { x: (isLeft ? -0.038 : 0.038) * handScale, length: 0.075 * handScale, width: 0.026 * handScale },
      { x: (isLeft ? -0.012 : 0.012) * handScale, length: 0.085 * handScale, width: 0.027 * handScale },
      { x: (isLeft ? 0.012 : -0.012) * handScale, length: 0.078 * handScale, width: 0.025 * handScale },
      { x: (isLeft ? 0.038 : -0.038) * handScale, length: 0.060 * handScale, width: 0.023 * handScale }
    ];

    fingerConfigs.forEach(cfg => {
      const finger = new THREE.Group();
      finger.position.set(cfg.x, -0.10 * handScale, 0);

      const prox = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, cfg.length * 0.55, 0.03 * handScale), skinMat);
      prox.position.y = -(cfg.length * 0.55) / 2;
      prox.rotation.x = 0.15;
      finger.add(prox);

      const dist = new THREE.Mesh(new THREE.BoxGeometry(cfg.width * 0.9, cfg.length * 0.45, 0.025 * handScale), skinMat);
      dist.position.set(0, -(cfg.length * 0.55) - (cfg.length * 0.45) / 2, 0.01 * handScale);
      dist.rotation.x = 0.35;
      finger.add(dist);

      hand.add(finger);
    });

    return hand;
  }

  /**
   * Realistic Modern Sneaker / Footwear with Cushioned Midsole, Sole & Laces
   */
  static _createRealisticSneaker(mats, isWomen = false) {
    const sneaker = new THREE.Group();
    const w = isWomen ? 0.20 : 0.24;
    const l = isWomen ? 0.42 : 0.48;

    // Outsole (Tread base)
    const outsole = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, l), mats.soleDark);
    outsole.position.y = -0.075;
    outsole.castShadow = true;
    sneaker.add(outsole);

    // Thick Cushioned Midsole
    const midsole = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, 0.07, l * 0.98), mats.soleWhite);
    midsole.position.set(0, -0.03, 0.01);
    midsole.rotation.x = 0.04;
    midsole.castShadow = true;
    sneaker.add(midsole);

    // Shoe Upper
    const upper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.13, l * 0.92), mats.shoeUpper);
    upper.position.set(0, 0.05, 0.02);
    upper.castShadow = true;
    sneaker.add(upper);

    // Toe Cap
    const toeCap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.08, 0.14), mats.soleWhite);
    toeCap.position.set(0, 0.035, l * 0.33);
    sneaker.add(toeCap);

    // Shoe Tongue
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(w * 0.58, 0.11, 0.12), mats.primary);
    tongue.position.set(0, 0.11, 0.05);
    tongue.rotation.x = 0.28;
    sneaker.add(tongue);

    // Laces
    [-0.04, 0.02, 0.08].forEach(z => {
      const laceBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.02, 0.03), mats.shoeLaces);
      laceBar.position.set(0, 0.115, z);
      sneaker.add(laceBar);
    });

    return sneaker;
  }

  /**
   * Modular 3D Hairstyles & Headwear for Men and Women
   */
  static _addHairstyle(headPivot, mats, isPlayer, style, gender, hairstyle) {
    const isWomen = (gender === 'women');

    // ----------------------------------------------------
    // WOMEN'S MODULAR HAIRSTYLES
    // ----------------------------------------------------
    if (isWomen) {
      if (hairstyle === 'hijab_mayafi' || style === 'hausa_atampa') {
        // Elegant Hausa/Fulani Mayafi Veil (Flowing head scarf)
        const veilCrown = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.30, 0.26, 10),
          new THREE.MeshStandardMaterial({ color: mats.primary.color, roughness: 0.75, flatShading: true })
        );
        veilCrown.position.y = 0.58;
        headPivot.add(veilCrown);

        // Graceful flowing side drapes over shoulders
        [-0.26, 0.26].forEach((x, idx) => {
          const drape = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.50, 0.22),
            new THREE.MeshStandardMaterial({ color: mats.primary.color, roughness: 0.75, flatShading: true })
          );
          drape.position.set(x, 0.34, 0.02);
          drape.rotation.z = idx === 0 ? 0.12 : -0.12;
          headPivot.add(drape);
        });

        // Back drape
        const backDrape = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.46, 0.08),
          new THREE.MeshStandardMaterial({ color: mats.primary.color, roughness: 0.75, flatShading: true })
        );
        backDrape.position.set(0, 0.36, -0.23);
        headPivot.add(backDrape);
        return;
      }

      if (hairstyle === 'ponytail') {
        // High Anime Ponytail with Scrunchie
        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), mats.hair);
        crown.position.set(0, 0.56, 0);
        headPivot.add(crown);

        // Front side bangs
        [-0.18, 0.18].forEach(x => {
          const bang = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.08), mats.hair);
          bang.position.set(x, 0.44, 0.16);
          headPivot.add(bang);
        });

        // Hair scrunchie band
        const scrunchie = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.022, 6, 12), mats.secondary);
        scrunchie.position.set(0, 0.64, -0.22);
        scrunchie.rotation.x = 0.5;
        headPivot.add(scrunchie);

        // Ponytail tail cascading back
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.03, 0.42, 8), mats.hair);
        tail.position.set(0, 0.52, -0.32);
        tail.rotation.x = 0.55;
        headPivot.add(tail);
        return;
      }

      if (hairstyle === 'twin_braids') {
        // Twin Braids
        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), mats.hair);
        crown.position.set(0, 0.56, 0);
        headPivot.add(crown);

        [-0.20, 0.20].forEach(x => {
          const braid = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.025, 0.46, 6), mats.hair);
          braid.position.set(x, 0.32, 0.10);
          headPivot.add(braid);
        });
        return;
      }

      if (hairstyle === 'chic_bob') {
        // Chic Modern Bob Cut
        const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.31, 0.32, 8), mats.hair);
        bob.position.y = 0.54;
        headPivot.add(bob);

        const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.10, 0.10), mats.hair);
        fringe.position.set(0, 0.52, 0.20);
        headPivot.add(fringe);
        return;
      }

      // Default Women: Long Flowing Hair
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), mats.hair);
      crown.position.set(0, 0.56, 0);
      headPivot.add(crown);

      const flowingBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.54, 0.10), mats.hair);
      flowingBack.position.set(0, 0.32, -0.20);
      headPivot.add(flowingBack);
      return;
    }

    // ----------------------------------------------------
    // MEN'S MODULAR HAIRSTYLES
    // ----------------------------------------------------
    if (hairstyle === 'hula_zanna' || isPlayer) {
      // Dashing Embroidered Hausa Cap (Hula Zanna Bukar) with hair fade
      const napeHair = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.15, 0.25), mats.hair);
      napeHair.position.set(0, 0.42, -0.17);
      headPivot.add(napeHair);

      const sideHair = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.13, 0.28), mats.hair);
      sideHair.position.set(0, 0.45, 0.02);
      headPivot.add(sideHair);

      // Cylindrical Hula Cap
      const hula = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6, flatShading: true }));
      hula.rotateY(Math.PI / 10);
      hula.position.y = 0.62;
      hula.castShadow = true;
      headPivot.add(hula);

      // Gold embroidery band
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.295, 0.06, 10), mats.buckleGold);
      band.rotateY(Math.PI / 10);
      band.position.y = 0.56;
      headPivot.add(band);

      // Crown crease
      const crease = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.14), mats.secondary);
      crease.position.y = 0.72;
      headPivot.add(crease);
      return;
    }

    if (hairstyle === 'rawani_turban' || style === 'emir_guard') {
      // Royal Dogari Palace Guard / Scholar Turban
      const turban = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.24, 10), new THREE.MeshStandardMaterial({ color: style === 'emir_guard' ? 0xdc2626 : 0xf8fafc, roughness: 0.8, flatShading: true }));
      turban.rotateY(Math.PI / 10);
      turban.position.y = 0.62;
      headPivot.add(turban);

      if (style === 'emir_guard') {
        const cockade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7, flatShading: true }));
        cockade.position.set(0, 0.78, 0.22);
        headPivot.add(cockade);
      }
      return;
    }

    if (hairstyle === 'afro') {
      // Textured Curly Afro
      const curly = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 1), mats.hair);
      curly.position.set(0, 0.61, 0);
      headPivot.add(curly);
      return;
    }

    // Default Men: Clean Fade / Buzz cut
    const fadeTop = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), mats.hair);
    fadeTop.position.set(0, 0.58, 0);
    headPivot.add(fadeTop);

    [-0.24, 0.24].forEach(x => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.1), mats.hair);
      side.position.set(x, 0.44, 0.06);
      headPivot.add(side);
    });
  }

  static _createCoffeeCup(mats) {
    const cupGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.22, 6), mats.coffeeCup);
    cupGroup.add(body);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.09, 6), mats.backpack);
    sleeve.position.y = 0.01;
    cupGroup.add(sleeve);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 6), mats.coffeeLid);
    lid.position.y = 0.12;
    cupGroup.add(lid);
    return cupGroup;
  }

  static _createPhone(mats) {
    const phone = new THREE.Group();
    const phoneCase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.02), mats.phoneCase);
    phone.add(phoneCase);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.19, 0.005), mats.watchStrap);
    screen.position.z = 0.011;
    phone.add(screen);
    return phone;
  }

  static getRandomMenStyle() {
    const styles = ['harpy_urban', 'hausa_kaftan', 'hausa_babban_riga', 'emir_guard'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  static getRandomWomenStyle() {
    const styles = ['xixi_urban', 'hausa_atampa', 'modest_abaya'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  static getRandomMenHairstyle() {
    const list = ['hula_zanna', 'fade', 'rawani_turban', 'afro'];
    return list[Math.floor(Math.random() * list.length)];
  }

  static getRandomWomenHairstyle() {
    const list = ['hijab_mayafi', 'ponytail', 'twin_braids', 'chic_bob'];
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Signature Player Palette (Men / Women)
   */
  static getPlayerPalette(gender = 'men') {
    if (gender === 'women') {
      return {
        skinColor: 0xbe8b62, // Warm amber caramel skin tone
        lipColor: 0xc2415d,  // Rose berry lip tone
        eyeColor: 0x382212,  // Rich dark brown
        hairColor: 0x151515, // Jet black
        shirtColor: 0x0d9488,// Teal Atampa / chic blouse
        jacketColor: 0xf43f5e,// Coral rose embroidery / sash
        pantsColor: 0x0f766e, // Teal trousers / wrapper
        shoesColor: 0xf1f5f9  // White chic sneakers
      };
    }

    return {
      skinColor: 0x9e683f, // Rich warm caramel skin tone
      lipColor: 0x7b3e34,  // Deep natural rose
      eyeColor: 0x382212,  // Rich dark brown
      hairColor: 0x151515, // Jet black
      shirtColor: 0x0284c7,// Royal azure blue Kaftan / bomber jacket
      jacketColor: 0xf59e0b,// Golden silk embroidery
      pantsColor: 0x0369a1, // Azure blue denim trousers
      shoesColor: 0x78350f  // Handcrafted leather shoes
    };
  }

  /**
   * Diverse authentic palettes for Hadejia citizens
   */
  static getRandomPalette(gender = 'men') {
    const skinProfiles = [
      { skin: 0xbe8b62, lips: 0x934f46 },
      { skin: 0xa26a42, lips: 0x7e3f36 },
      { skin: 0x8a5530, lips: 0x66332a },
      { skin: 0x734324, lips: 0x542921 },
      { skin: 0x58341a, lips: 0x401f18 },
      { skin: 0x3e2313, lips: 0x2e1610 },
      { skin: 0xcc976c, lips: 0x9e5c54 }
    ];

    const eyeColors = [0x2c180e, 0x382212, 0x4a2e19, 0x593a1d];
    const hairColors = [0x151515, 0x241711, 0x2f1e16];

    const menShirtColors = [0xf8fafc, 0x1e3a8a, 0x0284c7, 0x047857, 0xd97706, 0xb45309, 0xbe123c, 0x0f172a];
    const womenShirtColors = [0xec4899, 0x0d9488, 0x8b5cf6, 0xf59e0b, 0x06b6d4, 0xbe123c, 0x10b981, 0xf43f5e];

    const embroideryColors = [0xf59e0b, 0xf8fafc, 0x0284c7, 0x10b981, 0xec4899, 0x7c3aed];
    const pantsColors = [0xf8fafc, 0x1e3a8a, 0x0284c7, 0x047857, 0xd97706, 0x1e293b, 0x334155, 0x78350f, 0x0f766e];
    const shoeColors = [0x78350f, 0x451a03, 0x1c1917, 0xd97706, 0xf8fafc];

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const skinProf = pick(skinProfiles);

    return {
      skinColor: skinProf.skin,
      lipColor: gender === 'women' ? 0xc2415d : skinProf.lips,
      eyeColor: pick(eyeColors),
      hairColor: pick(hairColors),
      shirtColor: pick(gender === 'women' ? womenShirtColors : menShirtColors),
      jacketColor: pick(embroideryColors),
      pantsColor: pick(pantsColors),
      shoesColor: pick(shoeColors)
    };
  }
}

/**
 * HausaBabbanRiga: detailed low-poly Babban Riga outfit for the LowPolyHuman male rig.
 *
 * Adds (all parented to rig joints so everything animates with the skeleton):
 * - Robe body, sloped shoulder yoke, gold neck piping and white inner collar
 * - Wide flared sleeves on the upper and lower arm joints, with gold cuffs
 * - Floor-length robe split in two halves, one on each leg joint, so it swings when walking
 * - Fold ribs, gold hem bands, embroidered chest panel (canvas texture), left chest pocket
 * - Wando (trousers) visible below the hem, matching fabric
 * - Zanna Bukar embroidered cap or wrapped Rawani turban
 */

const _cache = {};

function makeTexture(key, w, h, draw, repeat) {
  if (typeof document === 'undefined') return null;
  if (_cache[key]) return _cache[key];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  _cache[key] = t;
  return t;
}

const css = hex => '#' + new THREE.Color(hex).getHexString();

function fabricTexture(hex) {
  return makeTexture('fab' + hex, 128, 128, (g, w, h) => {
    g.fillStyle = css(hex);
    g.fillRect(0, 0, w, h);
    // Subtle tonal damask diamonds
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.lineWidth = 2;
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 32) {
        g.beginPath();
        g.moveTo(x + 16, y + 4);
        g.lineTo(x + 28, y + 16);
        g.lineTo(x + 16, y + 28);
        g.lineTo(x + 4, y + 16);
        g.closePath();
        g.stroke();
      }
    }
    // Cotton grain
    for (let i = 0; i < 1200; i++) {
      const v = Math.random() > 0.5 ? 255 : 0;
      g.fillStyle = `rgba(${v},${v},${v},0.035)`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 1);
    }
  }, [6, 3]);
}

function weaveBump() {
  return makeTexture('weave', 16, 16, (g, w, h) => {
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        g.fillStyle = ((x + y) / 2) % 2 ? '#bbbbbb' : '#555555';
        g.fillRect(x, y, 2, 2);
      }
    }
  }, [28, 14]);
}

function frontEmbroideryTexture(thread) {
  return makeTexture('front' + thread, 256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = g.fillStyle = css(thread);
    g.lineCap = g.lineJoin = 'round';
    g.lineWidth = 8;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.lineWidth = 3;
    g.strokeRect(24, 24, w - 48, h - 48);

    // Hausa knot / eight-point star
    const cx = w / 2, cy = 120;
    g.lineWidth = 5;
    for (let k = 0; k < 2; k++) {
      g.save();
      g.translate(cx, cy);
      g.rotate(k * Math.PI / 4);
      g.strokeRect(-52, -52, 104, 104);
      g.restore();
    }
    g.beginPath(); g.arc(cx, cy, 34, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(cx, cy, 12, 0, Math.PI * 2); g.fill();

    // Diamond chain down the front
    for (let i = 0; i < 5; i++) {
      const y = 250 + i * 52;
      g.beginPath();
      g.moveTo(cx, y - 24); g.lineTo(cx + 24, y); g.lineTo(cx, y + 24); g.lineTo(cx - 24, y);
      g.closePath(); g.stroke();
      g.beginPath(); g.arc(cx, y, 5, 0, Math.PI * 2); g.fill();
    }

    // Zig-zag side stitching
    g.lineWidth = 4;
    [48, w - 48].forEach(x => {
      g.beginPath();
      let n = 0;
      for (let y = 190; y < h - 40; y += 26, n++) g.lineTo(x + (n % 2 ? 9 : -9), y);
      g.stroke();
    });
  });
}

function capTexture(capHex, thread) {
  return makeTexture('cap' + capHex + thread, 256, 64, (g, w, h) => {
    g.fillStyle = css(capHex);
    g.fillRect(0, 0, w, h);
    g.strokeStyle = g.fillStyle = css(thread);
    g.lineWidth = 3;
    g.fillRect(0, 0, w, 7);
    g.fillRect(0, h - 7, w, 7);
    for (let x = 0; x < w; x += 32) {
      g.beginPath();
      let n = 0;
      for (let y = 12; y < h - 10; y += 8, n++) g.lineTo(x + 16 + (n % 2 ? 5 : -5), y);
      g.stroke();
      g.beginPath();
      g.moveTo(x, 32); g.lineTo(x + 6, 26); g.lineTo(x + 12, 32); g.lineTo(x + 6, 38);
      g.closePath(); g.fill();
    }
  });
}

export class HausaBabbanRiga {
  /**
   * @param {Object} rig  Rig returned by LowPolyHuman.create() (male)
   * @param {Object} opts robeColor, threadColor, capColor, trouserColor, turban (bool)
   */
  static dress(rig, opts = {}) {
    const { torso, leftArmUpper, leftArmLower, rightArmUpper, rightArmLower,
      leftLegUpper, rightLegUpper, headPivot } = rig;

    const robeHex = opts.robeColor ?? rig.materials.primary.color.getHex();
    const threadHex = opts.threadColor ?? 0xd9a521;
    const capHex = opts.capColor ?? 0xf8fafc;
    const trouserHex = opts.trouserColor ?? new THREE.Color(robeHex).multiplyScalar(0.85).getHex();

    // ---------- Materials ----------
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: fabricTexture(robeHex), bumpMap: weaveBump(), bumpScale: 0.4,
      roughness: 0.85, flatShading: true, side: THREE.DoubleSide
    });
    if (!robeMat.map) robeMat.color.set(robeHex);

    const foldMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(robeHex).multiplyScalar(0.8), roughness: 0.9, flatShading: true
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: threadHex, metalness: 0.75, roughness: 0.3, flatShading: true, side: THREE.DoubleSide
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, roughness: 0.7, flatShading: true, side: THREE.DoubleSide
    });
    const panelTex = frontEmbroideryTexture(threadHex);
    const panelMat = new THREE.MeshStandardMaterial({
      map: panelTex, transparent: true, alphaTest: 0.35, metalness: 0.5, roughness: 0.35,
      color: panelTex ? 0xffffff : threadHex
    });

    rig.materials.pants.color.set(trouserHex);

    const mk = (geo, mat, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      return m;
    };
    const oct = geo => { geo.rotateY(Math.PI / 8); return geo; };

    // ---------- Upper body ----------
    // Robe body (open-ended, flat face toward the front)
    torso.add(mk(oct(new THREE.CylinderGeometry(0.47, 0.41, 1.05, 8, 1, true)), robeMat, 0, 0.375, 0));

    // Sloped shoulder yoke
    torso.add(mk(oct(new THREE.CylinderGeometry(0.20, 0.47, 0.12, 8, 1, true)), robeMat, 0, 0.86, 0));

    // Gold shoulder seam and neck piping
    torso.add(mk(oct(new THREE.CylinderGeometry(0.476, 0.476, 0.025, 8, 1, true)), goldMat, 0, 0.80, 0));
    const piping = mk(new THREE.TorusGeometry(0.205, 0.015, 5, 8), goldMat, 0, 0.92, 0);
    piping.rotation.x = Math.PI / 2;
    torso.add(piping);

    // White inner collar
    torso.add(mk(new THREE.CylinderGeometry(0.20, 0.22, 0.08, 8, 1, true), collarMat, 0, 0.95, 0));

    // Embroidered chest panel
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.62), panelMat);
    panel.position.set(0, 0.44, 0.425);
    panel.rotation.x = 0.057;
    torso.add(panel);

    // Left chest pocket (wearer's left = +x), on the angled face
    const pocket = mk(new THREE.BoxGeometry(0.15, 0.17, 0.025), foldMat, 0.22, 0.42, 0.398);
    pocket.rotation.y = Math.PI / 4;
    torso.add(pocket);
    const pocketStitch = mk(new THREE.BoxGeometry(0.155, 0.015, 0.03), goldMat, 0.22, 0.51, 0.404);
    pocketStitch.rotation.y = Math.PI / 4;
    torso.add(pocketStitch);

    // ---------- Wide flared sleeves ----------
    [[leftArmUpper, leftArmLower], [rightArmUpper, rightArmLower]].forEach(([up, low]) => {
      up.add(mk(new THREE.CylinderGeometry(0.17, 0.21, 0.46, 8, 1, true), robeMat, 0, -0.23, 0));
      low.add(mk(new THREE.CylinderGeometry(0.21, 0.30, 0.40, 8, 1, true), robeMat, 0, -0.20, 0));
      low.add(mk(new THREE.CylinderGeometry(0.296, 0.303, 0.05, 8, 1, true), goldMat, 0, -0.375, 0));
    });

    // ---------- Floor-length robe: one half per leg ----------
    [leftLegUpper, rightLegUpper].forEach(leg => {
      const isLeft = leg === leftLegUpper;
      const ts = isLeft ? 0 : Math.PI;          // left half covers x > 0
      const off = -leg.position.x;              // center the half-cylinder on the body axis

      leg.add(mk(new THREE.CylinderGeometry(0.40, 0.50, 1.45, 8, 1, true, ts, Math.PI), robeMat, off, -0.425, 0));
      leg.add(mk(new THREE.CylinderGeometry(0.50, 0.505, 0.07, 8, 1, true, ts, Math.PI), goldMat, off, -1.115, 0));
      leg.add(mk(new THREE.CylinderGeometry(0.492, 0.494, 0.03, 8, 1, true, ts, Math.PI), goldMat, off, -1.0, 0));

      // Fold ribs along the vertices
      for (let k = 1; k <= 3; k++) {
        const th = ts + k * Math.PI / 4;
        const rib = mk(new THREE.BoxGeometry(0.025, 1.4, 0.02), foldMat,
          off + 0.455 * Math.sin(th), -0.425, 0.455 * Math.cos(th));
        rib.rotation.order = 'YXZ';
        rib.rotation.y = th;
        rib.rotation.x = -0.069;
        leg.add(rib);
      }
    });

    // ---------- Headwear ----------
    if (opts.turban) this.addRawani(headPivot, opts.turbanColor ?? 0xf8fafc);
    else this.addZannaCap(headPivot, capHex, threadHex);

    return rig;
  }

  /** Embroidered Zanna Bukar cap */
  static addZannaCap(headPivot, capHex = 0xf8fafc, threadHex = 0xd9a521) {
    const tex = capTexture(capHex, threadHex);
    const side = new THREE.MeshStandardMaterial({
      color: tex ? 0xffffff : capHex, map: tex, roughness: 0.7, flatShading: true, side: THREE.DoubleSide
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.27, 0.30, 12, 1, true), side);
    body.position.y = 0.65;
    body.castShadow = true;
    headPivot.add(body);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: capHex, roughness: 0.7, flatShading: true })
    );
    top.position.y = 0.80;
    headPivot.add(top);

    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.012, 5, 12),
      new THREE.MeshStandardMaterial({ color: threadHex, metalness: 0.7, roughness: 0.3, flatShading: true })
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0.80;
    headPivot.add(trim);
  }

  /** Wrapped Rawani turban with a trailing tail */
  static addRawani(headPivot, hex = 0xf8fafc) {
    const mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.85, flatShading: true });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.29, 0.20, 10), mat);
    base.position.y = 0.60;
    headPivot.add(base);

    [0.54, 0.62, 0.70].forEach((y, i) => {
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.31 - i * 0.012, 0.055, 6, 12), mat);
      wrap.rotation.x = Math.PI / 2;
      wrap.rotation.z = i * 0.4;
      wrap.position.y = y;
      wrap.scale.set(1, 1, 1.05);
      headPivot.add(wrap);
    });

    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.29, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    crown.position.y = 0.70;
    headPivot.add(crown);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.04), mat);
    tail.position.set(0.22, 0.42, -0.14);
    tail.rotation.set(0.1, 0.4, -0.12);
    headPivot.add(tail);
  }
}
