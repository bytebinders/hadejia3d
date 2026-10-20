import * as THREE from 'three';

/**
 * LowPolyHuman — Highly Articulated, Anatomically Detailed Low-Poly Human Generator
 * 
 * Creates truly human characters featuring:
 * - Authentic human skin tones, lip tones, and natural hair palettes
 * - Sculpted anatomical head: cranium, defined jawline, chin, cheekbones, and ears
 * - Expressive facial features: white sclera, colored iris, pupil, eyelids, eyebrows, 3D nose, and lips
 * - Anatomical torso: neck with collarbone/throat, pectoral chest plates, tapered waist, and belt loops
 * - Deltoid shoulder caps, biceps, elbow joints, forearms, and wrist accessories (smart watch)
 * - Articulated hands with palm, opposable thumb, and 4 distinct curled fingers (index, middle, ring, pinky)
 * - Anatomical legs: quadriceps, patella kneecaps, calf muscles, ankle bones, and cuffed pants
 * - Realistic sneakers: curved ergonomic sole, white midsole, toe cap, laces, and heel tab
 * - Rich variety of modern hairstyles, urban caps, and beanies
 */

export class LowPolyHuman {
  /**
   * Create an articulated, richly detailed human mesh group
   * @param {Object} options Configuration options
   */
  static create(options = {}) {
    const isPlayer = options.isPlayer || false;
    const style = options.style || (isPlayer ? 'player' : this._pickRandomStyle());

    // 1. Authentic Human Palettes
    const palette = options.palette || (isPlayer ? this.getPlayerPalette() : this.getRandomPalette());
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
    root.name = isPlayer ? 'Player' : `Human_${style}`;

    // Standardized uniform scale (0.65)
    const baseScale = options.scale !== undefined ? options.scale : 0.65;
    root.scale.set(baseScale, baseScale, baseScale);

    // ==========================================
    // 1. PELVIS / HIPS GROUP (Root pivot at Y = 1.35)
    // ==========================================
    const hips = new THREE.Group();
    hips.position.y = 1.35;
    root.add(hips);

    // Sculpted pelvis with anatomically tapered sacrum and waistline
    const pelvisGeo = new THREE.CylinderGeometry(0.35, 0.32, 0.36, 8);
    pelvisGeo.rotateY(Math.PI / 8);
    const pelvis = new THREE.Mesh(pelvisGeo, materials.pants);
    pelvis.castShadow = true;
    hips.add(pelvis);

    // Leather Belt
    const beltGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.08, 8);
    beltGeo.rotateY(Math.PI / 8);
    const belt = new THREE.Mesh(beltGeo, materials.beltLeather);
    belt.position.y = 0.14;
    hips.add(belt);

    // Belt loops
    const loopGeo = new THREE.BoxGeometry(0.03, 0.1, 0.03);
    [-0.22, -0.08, 0.08, 0.22].forEach(x => {
      const loop = new THREE.Mesh(loopGeo, materials.pants);
      loop.position.set(x, 0.14, 0.37);
      hips.add(loop);
    });

    // Metallic Belt Buckle
    const buckleGeo = new THREE.BoxGeometry(0.12, 0.09, 0.04);
    const buckle = new THREE.Mesh(buckleGeo, materials.buckleGold);
    buckle.position.set(0, 0.14, 0.38);
    hips.add(buckle);

    // ==========================================
    // 2. TORSO & CHEST
    // ==========================================
    const torso = new THREE.Group();
    torso.position.y = 0.2;
    hips.add(torso);

    // Main Torso (broad at chest and shoulders, tapered at waist)
    const torsoGeo = new THREE.CylinderGeometry(0.44, 0.34, 0.85, 8);
    torsoGeo.rotateY(Math.PI / 8);
    const torsoMesh = new THREE.Mesh(torsoGeo, materials.primary);
    torsoMesh.position.y = 0.45;
    torsoMesh.castShadow = true;
    torso.add(torsoMesh);

    // Sculpted Pectoral Chest definition (left & right pecs)
    const pecGeo = new THREE.BoxGeometry(0.24, 0.26, 0.1);
    const leftPec = new THREE.Mesh(pecGeo, materials.primary);
    leftPec.position.set(0.13, 0.58, 0.24);
    leftPec.rotation.y = 0.12;
    torso.add(leftPec);

    const rightPec = new THREE.Mesh(pecGeo, materials.primary);
    rightPec.position.set(-0.13, 0.58, 0.24);
    rightPec.rotation.y = -0.12;
    torso.add(rightPec);

    // Shirt Collar at neck base
    const collarGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.08, 8);
    collarGeo.rotateY(Math.PI / 8);
    const collar = new THREE.Mesh(collarGeo, materials.shirtCollar);
    collar.position.y = 0.88;
    torso.add(collar);

    // Traditional Hausa / Fulani Chest Detailing & Embroidery
    if (style === 'emir_guard') {
      // Royal Dogari of the Emir of Hadejia (Iconic Scarlet Red & Forest Green Royal Robe)
      const guardStripeGeo = new THREE.BoxGeometry(0.22, 0.82, 0.08);
      const guardStripe = new THREE.Mesh(guardStripeGeo, new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.7, flatShading: true }));
      guardStripe.position.set(-0.11, 0.45, 0.28);
      torso.add(guardStripe);

      const guardStripeRight = new THREE.Mesh(guardStripeGeo, new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true }));
      guardStripeRight.position.set(0.11, 0.45, 0.28);
      torso.add(guardStripeRight);

      // Golden Royal Crest / Medallion
      const crestGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8);
      crestGeo.rotateX(Math.PI / 2);
      const crest = new THREE.Mesh(crestGeo, materials.buckleGold);
      crest.position.set(0, 0.62, 0.32);
      torso.add(crest);

    } else if (style === 'hausa_atampa') {
      // Traditional Wax-Print Atampa & Graceful Sash
      const sashGeo = new THREE.BoxGeometry(0.16, 0.88, 0.06);
      const sash = new THREE.Mesh(sashGeo, materials.secondary);
      sash.position.set(0.05, 0.45, 0.28);
      sash.rotation.z = -0.15;
      torso.add(sash);

      // Peplum waist ruffle
      const peplumGeo = new THREE.CylinderGeometry(0.38, 0.48, 0.2, 8);
      peplumGeo.rotateY(Math.PI / 8);
      const peplum = new THREE.Mesh(peplumGeo, materials.primary);
      peplum.position.set(0, 0.08, 0);
      torso.add(peplum);

    } else {
      // Traditional Embroidered Hausa Kaftan / Babban Riga Chest Piece (Aska Biyu)
      const embroPlateGeo = new THREE.BoxGeometry(0.26, 0.48, 0.05);
      const embroPlate = new THREE.Mesh(embroPlateGeo, materials.secondary);
      embroPlate.position.set(0, 0.52, 0.28);
      torso.add(embroPlate);

      // Intricate golden needlework center motif
      const centerNeedleGeo = new THREE.BoxGeometry(0.08, 0.36, 0.07);
      const centerNeedle = new THREE.Mesh(centerNeedleGeo, materials.buckleGold);
      centerNeedle.position.set(0, 0.52, 0.29);
      torso.add(centerNeedle);

      // Twin embroidered knives motif (Aska Biyu)
      [-0.08, 0.08].forEach(x => {
        const askaGeo = new THREE.BoxGeometry(0.025, 0.28, 0.065);
        const aska = new THREE.Mesh(askaGeo, materials.shirtCollar);
        aska.position.set(x, 0.50, 0.29);
        torso.add(aska);
      });

      // Flowing Babban Riga shoulder drapes for nobles and elders
      if (style === 'hausa_babban_riga' || style === 'traditional_scholar' || isPlayer) {
        [-0.38, 0.38].forEach((x, idx) => {
          const drapeGeo = new THREE.BoxGeometry(0.18, 0.72, 0.22);
          const drape = new THREE.Mesh(drapeGeo, materials.primary);
          drape.position.set(x, 0.44, 0);
          drape.rotation.z = idx === 0 ? 0.1 : -0.1;
          torso.add(drape);
        });
      }
    }

    // Optional traveler shoulder pouch or student bag
    if (style === 'traditional_scholar' || style === 'wetland_fisherman') {
      const bagGeo = new THREE.BoxGeometry(0.32, 0.38, 0.12);
      const bag = new THREE.Mesh(bagGeo, materials.backpack);
      bag.position.set(0.28, 0.32, 0.15);
      bag.castShadow = true;
      torso.add(bag);

      const strapGeo = new THREE.BoxGeometry(0.05, 0.85, 0.03);
      const strap = new THREE.Mesh(strapGeo, materials.beltLeather);
      strap.position.set(0.08, 0.52, 0.22);
      strap.rotation.z = 0.45;
      torso.add(strap);
    }

    // ==========================================
    // 3. NECK, HEAD & FACIAL FEATURES
    // ==========================================
    const headPivot = new THREE.Group();
    headPivot.position.y = 0.94;
    torso.add(headPivot);

    // Sculpted Neck with throat & Adam's apple
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.22, 8);
    const neck = new THREE.Mesh(neckGeo, materials.skin);
    neck.position.y = 0.1;
    headPivot.add(neck);

    // Laryngeal bump (Adam's apple / throat definition)
    const throatGeo = new THREE.BoxGeometry(0.04, 0.05, 0.03);
    const throat = new THREE.Mesh(throatGeo, materials.skin);
    throat.position.set(0, 0.1, 0.14);
    headPivot.add(throat);

    // Anatomical Head (Cranium + Cheekbones + Temples)
    const headGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.5, 8);
    headGeo.rotateY(Math.PI / 8);
    const head = new THREE.Mesh(headGeo, materials.skin);
    head.position.y = 0.42;
    head.castShadow = true;
    headPivot.add(head);

    // Sculpted Chin & Jawline
    const chinGeo = new THREE.BoxGeometry(0.18, 0.14, 0.16);
    const chin = new THREE.Mesh(chinGeo, materials.skin);
    chin.position.set(0, 0.22, 0.18);
    chin.rotation.x = -0.2;
    headPivot.add(chin);

    // Cheekbones (left & right)
    [-0.17, 0.17].forEach(x => {
      const cheekGeo = new THREE.BoxGeometry(0.09, 0.12, 0.1);
      const cheek = new THREE.Mesh(cheekGeo, materials.skin);
      cheek.position.set(x, 0.38, 0.19);
      headPivot.add(cheek);
    });

    // Anatomical Ears (Left & Right with inner ear shadow)
    [-0.26, 0.26].forEach((x, idx) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(x, 0.42, 0.02);
      earGroup.rotation.y = idx === 0 ? -0.2 : 0.2;

      const outerEarGeo = new THREE.BoxGeometry(0.04, 0.13, 0.08);
      const outerEar = new THREE.Mesh(outerEarGeo, materials.skin);
      outerEar.castShadow = true;
      earGroup.add(outerEar);

      const innerEarGeo = new THREE.BoxGeometry(0.02, 0.08, 0.04);
      const innerEar = new THREE.Mesh(innerEarGeo, materials.lips);
      innerEar.position.set(idx === 0 ? 0.015 : -0.015, 0, 0.01);
      earGroup.add(innerEar);

      headPivot.add(earGroup);
    });

    // Sculpted 3D Human Nose
    const noseBridgeGeo = new THREE.BoxGeometry(0.05, 0.14, 0.08);
    const noseBridge = new THREE.Mesh(noseBridgeGeo, materials.skin);
    noseBridge.position.set(0, 0.38, 0.27);
    noseBridge.rotation.x = 0.22; // Natural slope
    headPivot.add(noseBridge);

    // Nose tip and nostrils
    const noseTipGeo = new THREE.BoxGeometry(0.07, 0.05, 0.07);
    const noseTip = new THREE.Mesh(noseTipGeo, materials.skin);
    noseTip.position.set(0, 0.33, 0.29);
    headPivot.add(noseTip);

    // Expressive Human Eyes (Left & Right)
    const eyeSpacing = 0.1;
    [-eyeSpacing, eyeSpacing].forEach((x, idx) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, 0.44, 0.25);

      // Sclera (White of eye)
      const scleraGeo = new THREE.BoxGeometry(0.07, 0.045, 0.02);
      const sclera = new THREE.Mesh(scleraGeo, materials.eyeWhite);
      eyeGroup.add(sclera);

      // Colored Iris
      const irisGeo = new THREE.BoxGeometry(0.038, 0.038, 0.025);
      const iris = new THREE.Mesh(irisGeo, materials.eyeIris);
      iris.position.z = 0.005;
      eyeGroup.add(iris);

      // Pupil
      const pupilGeo = new THREE.BoxGeometry(0.02, 0.02, 0.03);
      const pupil = new THREE.Mesh(pupilGeo, materials.eyePupil);
      pupil.position.z = 0.008;
      eyeGroup.add(pupil);

      // Upper Eyelid / Lash Line (Adds depth & life to gaze)
      const lashGeo = new THREE.BoxGeometry(0.078, 0.015, 0.028);
      const lash = new THREE.Mesh(lashGeo, materials.eyebrow);
      lash.position.set(0, 0.024, 0.006);
      eyeGroup.add(lash);

      // Eyebrows (Arched naturally above eye)
      const browGeo = new THREE.BoxGeometry(0.085, 0.022, 0.03);
      const brow = new THREE.Mesh(browGeo, materials.eyebrow);
      brow.position.set(0, 0.062, 0.01);
      brow.rotation.z = idx === 0 ? 0.06 : -0.06; // Subtle natural arch
      eyeGroup.add(brow);

      headPivot.add(eyeGroup);
    });

    // Human Lips & Mouth (Natural resting expression)
    const upperLipGeo = new THREE.BoxGeometry(0.12, 0.025, 0.04);
    const upperLip = new THREE.Mesh(upperLipGeo, materials.lips);
    upperLip.position.set(0, 0.27, 0.26);
    headPivot.add(upperLip);

    const lowerLipGeo = new THREE.BoxGeometry(0.1, 0.03, 0.04);
    const lowerLip = new THREE.Mesh(lowerLipGeo, materials.lips);
    lowerLip.position.set(0, 0.245, 0.255);
    headPivot.add(lowerLip);

    // Hairstyle / Headwear
    this._addHairstyle(headPivot, materials, isPlayer, style);

    // ==========================================
    // 4. ARMS & DETAILED 5-FINGER HANDS
    // ==========================================
    const armUpperL = 0.46;
    const armLowerL = 0.46;

    // LEFT ARM
    const leftArmUpper = new THREE.Group();
    leftArmUpper.position.set(0.5, 0.8, 0);
    torso.add(leftArmUpper);

    // Deltoid Shoulder Cap (blends arm into torso)
    const lDeltoidGeo = new THREE.DodecahedronGeometry(0.14, 0);
    const lDeltoid = new THREE.Mesh(lDeltoidGeo, materials.secondary);
    lDeltoid.position.y = 0;
    leftArmUpper.add(lDeltoid);

    // Upper Arm / Bicep
    const lUpperGeo = new THREE.CylinderGeometry(0.11, 0.09, armUpperL, 6);
    const lUpperMesh = new THREE.Mesh(lUpperGeo, materials.secondary);
    lUpperMesh.position.y = -armUpperL / 2;
    lUpperMesh.castShadow = true;
    leftArmUpper.add(lUpperMesh);

    // Left Forearm Pivot (Elbow joint)
    const leftArmLower = new THREE.Group();
    leftArmLower.position.y = -armUpperL;
    leftArmUpper.add(leftArmLower);

    // Elbow joint cap
    const lElbowGeo = new THREE.DodecahedronGeometry(0.09, 0);
    const lElbow = new THREE.Mesh(lElbowGeo, materials.secondary);
    lElbow.position.set(0, 0, -0.04);
    leftArmLower.add(lElbow);

    // Forearm
    const lLowerGeo = new THREE.CylinderGeometry(0.095, 0.075, armLowerL, 6);
    const lLowerMesh = new THREE.Mesh(lLowerGeo, materials.skin);
    lLowerMesh.position.y = -armLowerL / 2;
    lLowerMesh.castShadow = true;
    leftArmLower.add(lLowerMesh);

    // Modern Smartwatch on Left Wrist
    const watchGroup = new THREE.Group();
    watchGroup.position.y = -armLowerL + 0.06;

    const strapGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.04, 8);
    const strap = new THREE.Mesh(strapGeo, materials.watchStrap);
    watchGroup.add(strap);

    const watchFaceGeo = new THREE.BoxGeometry(0.06, 0.05, 0.02);
    const watchFace = new THREE.Mesh(watchFaceGeo, materials.watchCase);
    watchFace.position.set(0, 0, 0.08);
    watchGroup.add(watchFace);
    leftArmLower.add(watchGroup);

    // Detailed Left Hand (Palm + Opposable Thumb + 4 Curled Fingers)
    const lHand = this._createDetailedHand(materials.skin, true);
    lHand.position.y = -armLowerL;
    leftArmLower.add(lHand);

    // RIGHT ARM
    const rightArmUpper = new THREE.Group();
    rightArmUpper.position.set(-0.5, 0.8, 0);
    torso.add(rightArmUpper);

    // Right Deltoid Shoulder Cap
    const rDeltoidGeo = new THREE.DodecahedronGeometry(0.14, 0);
    const rDeltoid = new THREE.Mesh(rDeltoidGeo, materials.secondary);
    rDeltoid.position.y = 0;
    rightArmUpper.add(rDeltoid);

    // Upper Arm / Bicep
    const rUpperGeo = new THREE.CylinderGeometry(0.11, 0.09, armUpperL, 6);
    const rUpperMesh = new THREE.Mesh(rUpperGeo, materials.secondary);
    rUpperMesh.position.y = -armUpperL / 2;
    rUpperMesh.castShadow = true;
    rightArmUpper.add(rUpperMesh);

    // Right Forearm Pivot (Elbow joint)
    const rightArmLower = new THREE.Group();
    rightArmLower.position.y = -armUpperL;
    rightArmUpper.add(rightArmLower);

    // Elbow joint cap
    const rElbowGeo = new THREE.DodecahedronGeometry(0.09, 0);
    const rElbow = new THREE.Mesh(rElbowGeo, materials.secondary);
    rElbow.position.set(0, 0, -0.04);
    rightArmLower.add(rElbow);

    // Forearm
    const rLowerGeo = new THREE.CylinderGeometry(0.095, 0.075, armLowerL, 6);
    const rLowerMesh = new THREE.Mesh(rLowerGeo, materials.skin);
    rLowerMesh.position.y = -armLowerL / 2;
    rLowerMesh.castShadow = true;
    rightArmLower.add(rLowerMesh);

    // Detailed Right Hand
    const rHand = this._createDetailedHand(materials.skin, false);
    rHand.position.y = -armLowerL;
    rightArmLower.add(rHand);

    // Optional Handheld Accessories (Coffee cup or Smartphone)
    if (!isPlayer && Math.random() > 0.6) {
      if (Math.random() > 0.5) {
        const cup = this._createCoffeeCup(materials);
        cup.position.set(0, -0.16, 0.1);
        cup.rotation.x = 0.2;
        rightArmLower.add(cup);
      } else {
        const phone = this._createPhone(materials);
        phone.position.set(0, -0.13, 0.1);
        phone.rotation.x = 0.35;
        rightArmLower.add(phone);
      }
    }

    // ==========================================
    // 5. LEGS, KNEES & REALISTIC SNEAKERS
    // ==========================================
    const legUpperL = 0.65;
    const legLowerL = 0.65;

    // LEFT LEG
    const leftLegUpper = new THREE.Group();
    leftLegUpper.position.set(0.19, -0.14, 0);
    hips.add(leftLegUpper);

    // Thigh with Quadricep contour
    const lThighGeo = new THREE.CylinderGeometry(0.15, 0.12, legUpperL, 6);
    const lThigh = new THREE.Mesh(lThighGeo, materials.pants);
    lThigh.position.y = -legUpperL / 2;
    lThigh.castShadow = true;
    leftLegUpper.add(lThigh);

    // Left Shin & Knee
    const leftLegLower = new THREE.Group();
    leftLegLower.position.y = -legUpperL;
    leftLegUpper.add(leftLegLower);

    // Patella Kneecap (adds authentic articulation)
    const lKneeGeo = new THREE.BoxGeometry(0.13, 0.11, 0.06);
    const lKnee = new THREE.Mesh(lKneeGeo, materials.pants);
    lKnee.position.set(0, 0, 0.11);
    leftLegLower.add(lKnee);

    // Calf muscle & Shin
    const lShinGeo = new THREE.CylinderGeometry(0.12, 0.09, legLowerL, 6);
    const lShin = new THREE.Mesh(lShinGeo, materials.pants);
    lShin.position.y = -legLowerL / 2;
    lShin.castShadow = true;
    leftLegLower.add(lShin);

    // Cuffed pants hemline
    const lCuffGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 6);
    const lCuff = new THREE.Mesh(lCuffGeo, materials.pants);
    lCuff.position.y = -legLowerL + 0.03;
    leftLegLower.add(lCuff);

    // Left Realistic Sneaker
    const lSneaker = this._createRealisticSneaker(materials);
    lSneaker.position.set(0, -legLowerL, 0.08);
    leftLegLower.add(lSneaker);

    // RIGHT LEG
    const rightLegUpper = new THREE.Group();
    rightLegUpper.position.set(-0.19, -0.14, 0);
    hips.add(rightLegUpper);

    // Thigh with Quadricep contour
    const rThighGeo = new THREE.CylinderGeometry(0.15, 0.12, legUpperL, 6);
    const rThigh = new THREE.Mesh(rThighGeo, materials.pants);
    rThigh.position.y = -legUpperL / 2;
    rThigh.castShadow = true;
    rightLegUpper.add(rThigh);

    // Right Shin & Knee
    const rightLegLower = new THREE.Group();
    rightLegLower.position.y = -legUpperL;
    rightLegUpper.add(rightLegLower);

    // Patella Kneecap
    const rKneeGeo = new THREE.BoxGeometry(0.13, 0.11, 0.06);
    const rKnee = new THREE.Mesh(rKneeGeo, materials.pants);
    rKnee.position.set(0, 0, 0.11);
    rightLegLower.add(rKnee);

    // Calf muscle & Shin
    const rShinGeo = new THREE.CylinderGeometry(0.12, 0.09, legLowerL, 6);
    const rShin = new THREE.Mesh(rShinGeo, materials.pants);
    rShin.position.y = -legLowerL / 2;
    rShin.castShadow = true;
    rightLegLower.add(rShin);

    // Cuffed pants hemline
    const rCuffGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 6);
    const rCuff = new THREE.Mesh(rCuffGeo, materials.pants);
    rCuff.position.y = -legLowerL + 0.03;
    rightLegLower.add(rCuff);

    // Right Realistic Sneaker
    const rSneaker = this._createRealisticSneaker(materials);
    rSneaker.position.set(0, -legLowerL, 0.08);
    rightLegLower.add(rSneaker);

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
      rightLegLower
    };

    root.userData.rig = rig;
    return rig;
  }

  /**
   * Anatomical Hand with Palm, Opposable Thumb, and 4 Curled Fingers
   */
  static _createDetailedHand(skinMat, isLeft) {
    const hand = new THREE.Group();

    // Sculpted Palm
    const palmGeo = new THREE.BoxGeometry(0.13, 0.12, 0.06);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.y = -0.06;
    palm.castShadow = true;
    hand.add(palm);

    // Thenar Eminence (fleshy muscle at thumb base)
    const thenarGeo = new THREE.BoxGeometry(0.06, 0.07, 0.05);
    const thenar = new THREE.Mesh(thenarGeo, skinMat);
    thenar.position.set(isLeft ? -0.05 : 0.05, -0.05, 0.02);
    hand.add(thenar);

    // Opposable Thumb (2 phalanges)
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(isLeft ? -0.07 : 0.07, -0.05, 0.02);
    thumbGroup.rotation.z = isLeft ? 0.35 : -0.35;
    thumbGroup.rotation.x = 0.25;

    const thumbProxGeo = new THREE.BoxGeometry(0.045, 0.055, 0.045);
    const thumbProx = new THREE.Mesh(thumbProxGeo, skinMat);
    thumbProx.position.y = -0.025;
    thumbGroup.add(thumbProx);

    const thumbDistGeo = new THREE.BoxGeometry(0.04, 0.045, 0.04);
    const thumbDist = new THREE.Mesh(thumbDistGeo, skinMat);
    thumbDist.position.set(0, -0.06, 0.01);
    thumbDist.rotation.x = 0.2;
    thumbGroup.add(thumbDist);

    hand.add(thumbGroup);

    // 4 Articulated Fingers (Index, Middle, Ring, Pinky) with natural relaxed curl
    const fingerConfigs = [
      { name: 'index',  x: isLeft ? -0.042 : 0.042, length: 0.08, width: 0.028 },
      { name: 'middle', x: isLeft ? -0.014 : 0.014, length: 0.09, width: 0.029 },
      { name: 'ring',   x: isLeft ? 0.014 : -0.014, length: 0.082, width: 0.027 },
      { name: 'pinky',  x: isLeft ? 0.042 : -0.042, length: 0.065, width: 0.025 }
    ];

    fingerConfigs.forEach(cfg => {
      const finger = new THREE.Group();
      finger.position.set(cfg.x, -0.12, 0);

      // Proximal phalanx (knuckle to mid-finger)
      const proxGeo = new THREE.BoxGeometry(cfg.width, cfg.length * 0.55, 0.035);
      const prox = new THREE.Mesh(proxGeo, skinMat);
      prox.position.y = -(cfg.length * 0.55) / 2;
      prox.rotation.x = 0.15; // Natural relaxed bend
      finger.add(prox);

      // Distal phalanx (fingertip)
      const distGeo = new THREE.BoxGeometry(cfg.width * 0.9, cfg.length * 0.45, 0.03);
      const dist = new THREE.Mesh(distGeo, skinMat);
      dist.position.set(0, -(cfg.length * 0.55) - (cfg.length * 0.45) / 2, 0.01);
      dist.rotation.x = 0.35; // Curled fingertip
      finger.add(dist);

      hand.add(finger);
    });

    return hand;
  }

  /**
   * Realistic Modern Sneaker with Curved Ergonomic Sole, Laces, and Tongue
   */
  static _createRealisticSneaker(mats) {
    const sneaker = new THREE.Group();

    // Outsole (Tread base)
    const outsoleGeo = new THREE.BoxGeometry(0.24, 0.03, 0.48);
    const outsole = new THREE.Mesh(outsoleGeo, mats.soleDark);
    outsole.position.y = -0.075;
    outsole.castShadow = true;
    sneaker.add(outsole);

    // Thick Cushioned Midsole (White rubber wedge, slightly higher at heel)
    const midsoleGeo = new THREE.BoxGeometry(0.25, 0.07, 0.47);
    const midsole = new THREE.Mesh(midsoleGeo, mats.soleWhite);
    midsole.position.set(0, -0.03, 0.01);
    midsole.rotation.x = 0.04; // Gentle ergonomic slope
    midsole.castShadow = true;
    sneaker.add(midsole);

    // Shoe Upper (Leather / Canvas body)
    const upperGeo = new THREE.BoxGeometry(0.23, 0.14, 0.44);
    const upper = new THREE.Mesh(upperGeo, mats.shoeUpper);
    upper.position.set(0, 0.06, 0.02);
    upper.castShadow = true;
    sneaker.add(upper);

    // Protective Front Toe Cap
    const toeCapGeo = new THREE.BoxGeometry(0.23, 0.09, 0.16);
    const toeCap = new THREE.Mesh(toeCapGeo, mats.soleWhite);
    toeCap.position.set(0, 0.04, 0.16);
    sneaker.add(toeCap);

    // Cushioned Shoe Tongue
    const tongueGeo = new THREE.BoxGeometry(0.14, 0.12, 0.14);
    const tongue = new THREE.Mesh(tongueGeo, mats.primary);
    tongue.position.set(0, 0.12, 0.06);
    tongue.rotation.x = 0.28;
    sneaker.add(tongue);

    // Criss-Cross Sneaker Laces
    [-0.04, 0.02, 0.08].forEach(z => {
      const laceBarGeo = new THREE.BoxGeometry(0.12, 0.02, 0.03);
      const laceBar = new THREE.Mesh(laceBarGeo, mats.shoeLaces);
      laceBar.position.set(0, 0.125, z);
      sneaker.add(laceBar);
    });

    // Heel Collar & Pull Tab
    const tabGeo = new THREE.BoxGeometry(0.04, 0.06, 0.02);
    const tab = new THREE.Mesh(tabGeo, mats.soleWhite);
    tab.position.set(0, 0.13, -0.19);
    sneaker.add(tab);

    return sneaker;
  }

  /**
   * Traditional Hadejia Headwear, Embroidered Hula Caps & Turbans
   */
  static _addHairstyle(headPivot, mats, isPlayer, style) {
    if (isPlayer) {
      // Dashing Embroidered Hausa Cap (Hula Zanna Bukar) with crisp hair fade
      const napeHairGeo = new THREE.BoxGeometry(0.48, 0.16, 0.26);
      const napeHair = new THREE.Mesh(napeHairGeo, mats.hair);
      napeHair.position.set(0, 0.44, -0.18);
      headPivot.add(napeHair);

      const sideHairGeo = new THREE.BoxGeometry(0.52, 0.14, 0.3);
      const sideHair = new THREE.Mesh(sideHairGeo, mats.hair);
      sideHair.position.set(0, 0.47, 0.02);
      headPivot.add(sideHair);

      // Embroidered Cylindrical Hula Cap
      const hulaGeo = new THREE.CylinderGeometry(0.27, 0.29, 0.22, 10);
      hulaGeo.rotateY(Math.PI / 10);
      const hulaMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6, flatShading: true });
      const hula = new THREE.Mesh(hulaGeo, hulaMat);
      hula.position.y = 0.64;
      hula.castShadow = true;
      headPivot.add(hula);

      // Gold embroidery band
      const bandGeo = new THREE.CylinderGeometry(0.28, 0.295, 0.06, 10);
      bandGeo.rotateY(Math.PI / 10);
      const band = new THREE.Mesh(bandGeo, mats.buckleGold);
      band.position.y = 0.58;
      headPivot.add(band);

      // Traditional top crown indentation
      const creaseGeo = new THREE.BoxGeometry(0.22, 0.04, 0.14);
      const crease = new THREE.Mesh(creaseGeo, mats.secondary);
      crease.position.y = 0.74;
      headPivot.add(crease);
      return;
    }

    if (style === 'emir_guard') {
      // Royal Dogari Palace Guard Turban (Rawani) with tall cockade
      const turbanBaseGeo = new THREE.CylinderGeometry(0.32, 0.3, 0.24, 10);
      turbanBaseGeo.rotateY(Math.PI / 10);
      const turbanMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8, flatShading: true });
      const turban = new THREE.Mesh(turbanBaseGeo, turbanMat);
      turban.position.y = 0.64;
      headPivot.add(turban);

      // Royal green cockade / crest
      const cockadeGeo = new THREE.BoxGeometry(0.1, 0.22, 0.08);
      const cockadeMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7, flatShading: true });
      const cockade = new THREE.Mesh(cockadeGeo, cockadeMat);
      cockade.position.set(0, 0.8, 0.22);
      headPivot.add(cockade);

      // Ear flaps
      [-0.26, 0.26].forEach(x => {
        const flapGeo = new THREE.BoxGeometry(0.08, 0.24, 0.12);
        const flap = new THREE.Mesh(flapGeo, turbanMat);
        flap.position.set(x, 0.46, 0);
        headPivot.add(flap);
      });
      return;
    }

    if (style === 'hausa_atampa') {
      // Elegant Hausa/Fulani Mayafi Veil (Flowing head scarf)
      const veilCrownGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.28, 10);
      const veilMat = new THREE.MeshStandardMaterial({ color: mats.primary.color, roughness: 0.75, flatShading: true });
      const veilCrown = new THREE.Mesh(veilCrownGeo, veilMat);
      veilCrown.position.y = 0.62;
      headPivot.add(veilCrown);

      // Graceful flowing side drapes over shoulders
      [-0.28, 0.28].forEach((x, idx) => {
        const drapeGeo = new THREE.BoxGeometry(0.08, 0.52, 0.24);
        const drape = new THREE.Mesh(drapeGeo, veilMat);
        drape.position.set(x, 0.36, 0.02);
        drape.rotation.z = idx === 0 ? 0.12 : -0.12;
        headPivot.add(drape);
      });

      // Back drape
      const backDrapeGeo = new THREE.BoxGeometry(0.5, 0.48, 0.08);
      const backDrape = new THREE.Mesh(backDrapeGeo, veilMat);
      backDrape.position.set(0, 0.38, -0.25);
      headPivot.add(backDrape);
      return;
    }

    if (style === 'wetland_fisherman') {
      // Traditional Conical Fulani / Fisherman Straw Hat (Malfa)
      const brimGeo = new THREE.ConeGeometry(0.52, 0.18, 12);
      const strawMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9, flatShading: true });
      const malfa = new THREE.Mesh(brimGeo, strawMat);
      malfa.position.y = 0.68;
      headPivot.add(malfa);

      // Leather peak cap
      const peakGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.08, 8);
      const peakMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6, flatShading: true });
      const peak = new THREE.Mesh(peakGeo, peakMat);
      peak.position.y = 0.8;
      headPivot.add(peak);

      // Under-hair peek
      const hairPeekGeo = new THREE.BoxGeometry(0.5, 0.12, 0.48);
      const hairPeek = new THREE.Mesh(hairPeekGeo, mats.hair);
      hairPeek.position.set(0, 0.52, 0);
      headPivot.add(hairPeek);
      return;
    }

    // Varied Headwear for other citizens:
    const type = Math.floor(Math.random() * 4);

    if (type === 0) {
      // Iconic Embroidered Hula Cap (Zanna Bukar)
      const hulaGeo = new THREE.CylinderGeometry(0.27, 0.29, 0.24, 10);
      hulaGeo.rotateY(Math.PI / 10);
      const hula = new THREE.Mesh(hulaGeo, mats.secondary);
      hula.position.y = 0.65;
      hula.castShadow = true;
      headPivot.add(hula);

      // Needlework embroidery stripe
      const bandGeo = new THREE.CylinderGeometry(0.28, 0.295, 0.07, 10);
      bandGeo.rotateY(Math.PI / 10);
      const band = new THREE.Mesh(bandGeo, mats.buckleGold);
      band.position.y = 0.58;
      headPivot.add(band);

      // Soft sideburns
      [-0.26, 0.26].forEach(x => {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.1), mats.hair);
        side.position.set(x, 0.46, 0.06);
        headPivot.add(side);
      });

    } else if (type === 1) {
      // Royal Rawani Turban (Worn by elders & scholars)
      const turbanBaseGeo = new THREE.CylinderGeometry(0.32, 0.3, 0.24, 10);
      const turbanMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85, flatShading: true });
      const turban = new THREE.Mesh(turbanBaseGeo, turbanMat);
      turban.position.y = 0.64;
      headPivot.add(turban);

      // Draped end over shoulder
      const drapeGeo = new THREE.BoxGeometry(0.12, 0.44, 0.08);
      const drape = new THREE.Mesh(drapeGeo, turbanMat);
      drape.position.set(-0.25, 0.38, -0.15);
      headPivot.add(drape);

    } else if (type === 2) {
      // Embroidered Velvet Hula (Tangaran)
      const hulaGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.2, 10);
      const hulaMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6, flatShading: true });
      const hula = new THREE.Mesh(hulaGeo, hulaMat);
      hula.position.y = 0.63;
      headPivot.add(hula);

      const trimGeo = new THREE.CylinderGeometry(0.27, 0.285, 0.04, 10);
      const trim = new THREE.Mesh(trimGeo, mats.shirtCollar);
      trim.position.y = 0.56;
      headPivot.add(trim);

    } else {
      // Textured Curly Afro / Clean Fade
      const curlyGeo = new THREE.DodecahedronGeometry(0.32, 1);
      const curly = new THREE.Mesh(curlyGeo, mats.hair);
      curly.position.set(0, 0.63, 0);
      headPivot.add(curly);

      [-0.25, 0.25].forEach(x => {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.1), mats.hair);
        side.position.set(x, 0.46, 0.08);
        headPivot.add(side);
      });
    }
  }

  static _createCoffeeCup(mats) {
    const cupGroup = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.22, 6);
    const body = new THREE.Mesh(bodyGeo, mats.coffeeCup);
    cupGroup.add(body);

    const sleeveGeo = new THREE.CylinderGeometry(0.082, 0.072, 0.09, 6);
    const sleeve = new THREE.Mesh(sleeveGeo, mats.backpack);
    sleeve.position.y = 0.01;
    cupGroup.add(sleeve);

    const lidGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.04, 6);
    const lid = new THREE.Mesh(lidGeo, mats.coffeeLid);
    lid.position.y = 0.12;
    cupGroup.add(lid);

    return cupGroup;
  }

  static _createPhone(mats) {
    const phone = new THREE.Group();
    const caseGeo = new THREE.BoxGeometry(0.12, 0.22, 0.02);
    const phoneCase = new THREE.Mesh(caseGeo, mats.phoneCase);
    phone.add(phoneCase);

    const screenGeo = new THREE.BoxGeometry(0.1, 0.19, 0.005);
    const screen = new THREE.Mesh(screenGeo, mats.watchStrap);
    screen.position.z = 0.011;
    phone.add(screen);

    return phone;
  }

  static _pickRandomStyle() {
    const styles = [
      'hausa_babban_riga',
      'hausa_kaftan',
      'hausa_atampa',
      'emir_guard',
      'wetland_fisherman',
      'traditional_scholar'
    ];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  /**
   * Signature Player Palette (Regal Northern Nigerian Attire)
   */
  static getPlayerPalette() {
    return {
      skinColor: 0x9e683f, // Rich warm caramel Northern Nigerian skin tone
      lipColor: 0x7b3e34,  // Deep natural rose
      eyeColor: 0x382212,  // Rich dark brown
      hairColor: 0x151515, // Jet black
      shirtColor: 0x0284c7,// Royal azure blue Kaftan / Babban Riga
      jacketColor: 0xf59e0b,// Golden needlework embroidery
      pantsColor: 0x0369a1, // Matching azure blue trousers
      shoesColor: 0x78350f  // Handcrafted Northern Nigerian leather sandals
    };
  }

  /**
   * Diverse, authentic Northern Nigerian palettes for Hadejia citizens
   */
  static getRandomPalette() {
    // Rich Hausa, Fulani & Kanuri skin tones
    const skinProfiles = [
      { skin: 0xbe8b62, lips: 0x934f46 }, // Golden warm amber
      { skin: 0xa26a42, lips: 0x7e3f36 }, // Rich caramel
      { skin: 0x8a5530, lips: 0x66332a }, // Warm bronze
      { skin: 0x734324, lips: 0x542921 }, // Deep bronze
      { skin: 0x58341a, lips: 0x401f18 }, // Rich dark cocoa / espresso
      { skin: 0x3e2313, lips: 0x2e1610 }, // Deep mahogany
      { skin: 0xcc976c, lips: 0x9e5c54 }  // Sun-warmed golden tan
    ];

    // Dark brown eyes typical of West Africa
    const eyeColors = [
      0x2c180e, // Rich dark brown
      0x382212, // Deep espresso
      0x4a2e19, // Warm chocolate
      0x593a1d  // Amber brown
    ];

    // Hair colors
    const hairColors = [
      0x151515, // Jet black
      0x241711, // Dark espresso
      0x2f1e16  // Dark charcoal
    ];

    // Authentic Northern Nigerian attire colors
    const shirtColors = [
      0xf8fafc, // Royal crisp white (farar riga)
      0x1e3a8a, // Deep Kano/Hadejia indigo blue (shuni)
      0x0284c7, // Sky azure blue
      0x047857, // Royal emerald green
      0xd97706, // Saffron golden ochre
      0xb45309, // Earthy terracotta
      0xbe123c, // Royal crimson
      0x4338ca, // Regal royal purple
      0x0f172a, // Midnight charcoal
      0x059669  // Mint green
    ];

    const embroideryColors = [
      0xf59e0b, // Golden silk thread
      0xf8fafc, // Crisp white thread
      0x0284c7, // Turquoise accent
      0x10b981, // Emerald silk thread
      0xec4899, // Vibrant rose thread
      0x7c3aed  // Royal violet thread
    ];

    const pantsColors = [
      0xf8fafc, 0x1e3a8a, 0x0284c7, 0x047857,
      0xd97706, 0x1e293b, 0x334155, 0x78350f
    ];

    const shoeColors = [
      0x78350f, // Handcrafted brown leather
      0x451a03, // Dark mahogany leather
      0x1c1917, // Black leather
      0xd97706, // Tan leather sandals
      0xf8fafc  // White ceremonial slippers
    ];

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const skinProf = pick(skinProfiles);

    return {
      skinColor: skinProf.skin,
      lipColor: skinProf.lips,
      eyeColor: pick(eyeColors),
      hairColor: pick(hairColors),
      shirtColor: pick(shirtColors),
      jacketColor: pick(embroideryColors),
      pantsColor: pick(pantsColors),
      shoesColor: pick(shoeColors)
    };
  }
}
