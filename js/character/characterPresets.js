/**
 * Hadejia 3D — Character Cast Presets & Design Sheets
 * 
 * Defines distinct character identities by role, personality, proportions,
 * palette, silhouette, outfit module, and biomechanical gait traits.
 */

export const CHARACTER_CAST = {
  // HERO 1: Harpy — The Urban Explorer / Modern Northern Youth
  harpy: {
    id: 'harpy',
    name: 'Harpy',
    role: 'Urban Explorer',
    bio: 'Energetic, tech-forward youth navigating the smart city avenues and central parkways.',
    gender: 'men',
    proportions: {
      scale: 0.65,
      shoulderWidth: 0.46,
      chestRadius: 0.22,
      waistRadius: 0.17,
      hipRadius: 0.18,
      torsoHeight: 0.84,
      armLength: 0.46,
      legLength: 0.65,
      headRadius: 0.24,
      neckLength: 0.18
    },
    palette: {
      skin: 0x9e683f, // Rich warm caramel
      lips: 0x7b3e34,
      eyes: 0x382212,
      hair: 0x151515,
      primary: 0x0284c7, // Royal azure blue bomber jacket
      secondary: 0xf59e0b, // Golden silk zipper & pocket trims
      pants: 0x0369a1, // Indigo denim tapered jeans
      shoes: 0x1e293b, // Midnight navy cushioned sneakers
      sole: 0xf1f5f9,
      metal: 0x94a3b8 // Brushed steel smartwatch
    },
    outfit: 'urban_bomber',
    headwear: 'hula_zanna',
    accessories: ['smartwatch', 'leather_belt'],
    gait: {
      stride: 1.05,
      armSwing: 1.0,
      posture: 0.04,
      bounce: 0.9,
      hipSway: 0.03
    }
  },

  // HERO 2: Xixi — The Cultural Ambassador / Creative Professional
  xixi: {
    id: 'xixi',
    name: 'Xixi',
    role: 'Cultural Ambassador',
    bio: 'Poised, creative leader blending Hausa textile traditions with modern architectural aesthetics.',
    gender: 'women',
    proportions: {
      scale: 0.65,
      shoulderWidth: 0.38,
      chestRadius: 0.18,
      waistRadius: 0.14,
      hipRadius: 0.22,
      torsoHeight: 0.78,
      armLength: 0.42,
      legLength: 0.62,
      headRadius: 0.21,
      neckLength: 0.18
    },
    palette: {
      skin: 0xbe8b62, // Warm amber caramel
      lips: 0xc2415d, // Rose berry lip tone
      eyes: 0x382212,
      hair: 0x151515,
      primary: 0x0d9488, // Emerald teal Atampa peplum blouse
      secondary: 0xf43f5e, // Coral rose floral sash & border
      pants: 0x0f766e, // Deep teal Zani wrapper skirt with border trim
      shoes: 0xf8fafc, // Crisp white chic sneakers
      sole: 0xe2e8f0,
      metal: 0xf59e0b // 18K polished gold jewelry
    },
    outfit: 'hausa_atampa',
    headwear: 'mayafi_veil',
    accessories: ['gold_choker', 'gold_earrings', 'gold_bangles'],
    gait: {
      stride: 0.96,
      armSwing: 0.8,
      posture: -0.02,
      bounce: 0.75,
      hipSway: 0.065
    }
  },

  // HERO 3: Malam Bello — The Heritage Scholar & Emirate Elder
  malam_bello: {
    id: 'malam_bello',
    name: 'Malam Bello',
    role: 'Heritage Scholar',
    bio: 'Respected elder and keeper of Hadejia city gates, treaties, and wetland histories.',
    gender: 'men',
    proportions: {
      scale: 0.65,
      shoulderWidth: 0.50,
      chestRadius: 0.24,
      waistRadius: 0.21,
      hipRadius: 0.21,
      torsoHeight: 0.86,
      armLength: 0.46,
      legLength: 0.65,
      headRadius: 0.24,
      neckLength: 0.16
    },
    palette: {
      skin: 0x734324, // Deep mahogany
      lips: 0x542921,
      eyes: 0x2c180e,
      hair: 0x94a3b8, // Distinguished silver-grey
      primary: 0xf8fafc, // Pristine white damask Babban Riga
      secondary: 0xd9a521, // Royal gold Aska Biyu needlework embroidery
      pants: 0xe2e8f0, // Tailored Wando trousers
      shoes: 0x78350f, // Handcrafted leather slippers
      sole: 0x451a03,
      metal: 0xd9a521
    },
    outfit: 'royal_babban_riga',
    headwear: 'zanna_bukar_royal',
    accessories: ['pocket_watch', 'leather_sandals'],
    gait: {
      stride: 0.86,
      armSwing: 0.65,
      posture: -0.01,
      bounce: 0.65,
      hipSway: 0.025
    }
  },

  // CAST 4: Dogari Danladi — Royal Palace Guard
  dogari_danladi: {
    id: 'dogari_danladi',
    name: 'Dogari Danladi',
    role: 'Royal Palace Guard',
    bio: 'Vigilant guard stationed outside Kofar Fada preserving the traditions of the Emirate.',
    gender: 'men',
    proportions: {
      scale: 0.65,
      shoulderWidth: 0.52,
      chestRadius: 0.25,
      waistRadius: 0.19,
      hipRadius: 0.20,
      torsoHeight: 0.88,
      armLength: 0.47,
      legLength: 0.66,
      headRadius: 0.25,
      neckLength: 0.17
    },
    palette: {
      skin: 0x58341a,
      lips: 0x401f18,
      eyes: 0x2c180e,
      hair: 0x151515,
      primary: 0xdc2626, // Ceremonial crimson red
      secondary: 0x16a34a, // Vibrant emerald green half-tunic
      pants: 0x1c1917, // Sturdy dark patrol trousers
      shoes: 0x451a03, // Traditional leather boots
      sole: 0x1c1917,
      metal: 0xf59e0b // Golden palace medallion
    },
    outfit: 'palace_dogari',
    headwear: 'rawani_turban',
    accessories: ['palace_crest'],
    gait: {
      stride: 1.1,
      armSwing: 0.9,
      posture: 0.06,
      bounce: 0.8,
      hipSway: 0.02
    }
  },

  // CAST 5: Amina Mai-Kifi — Wetlands Trade Host
  amina_merchant: {
    id: 'amina_merchant',
    name: 'Amina Mai-Kifi',
    role: 'Wetlands Trade Host',
    bio: 'Energetic fish and spices merchant along the Kogin Hadejia Marina boardwalk.',
    gender: 'women',
    proportions: {
      scale: 0.65,
      shoulderWidth: 0.40,
      chestRadius: 0.19,
      waistRadius: 0.15,
      hipRadius: 0.23,
      torsoHeight: 0.78,
      armLength: 0.42,
      legLength: 0.62,
      headRadius: 0.21,
      neckLength: 0.17
    },
    palette: {
      skin: 0xa26a42,
      lips: 0x934f46,
      eyes: 0x382212,
      hair: 0x151515,
      primary: 0x8b5cf6, // Vibrant indigo/violet print
      secondary: 0xf59e0b, // Saffron yellow border and headwrap
      pants: 0x7c3aed, // Rich purple Zani wrapper
      shoes: 0x78350f, // Leather slip-on sandals
      sole: 0x451a03,
      metal: 0xf59e0b
    },
    outfit: 'hausa_atampa',
    headwear: 'mayafi_veil',
    accessories: ['gold_earrings', 'gold_bangles'],
    gait: {
      stride: 0.98,
      armSwing: 0.85,
      posture: 0.01,
      bounce: 0.85,
      hipSway: 0.06
    }
  },

  // CAST 6: Ibrahim Sambo — Keke Tricycle Captain
  ibrahim_keke: {
    id: 'ibrahim_keke',
    name: 'Ibrahim Sambo',
    role: 'City Navigator',
    bio: 'Friendly tricycle captain cruising the city loop from Central Park to Kofar Kware.',
    gender: 'men',
    proportions: {
      scale: 0.65,
      shoulderWidth: 0.46,
      chestRadius: 0.21,
      waistRadius: 0.17,
      hipRadius: 0.18,
      torsoHeight: 0.82,
      armLength: 0.45,
      legLength: 0.64,
      headRadius: 0.23,
      neckLength: 0.16
    },
    palette: {
      skin: 0x8a5530,
      lips: 0x66332a,
      eyes: 0x382212,
      hair: 0x151515,
      primary: 0xf59e0b, // Warm ochre Kaftan shirt
      secondary: 0x0284c7, // Azure embroidery accents
      pants: 0x334155, // Slate grey utility trousers
      shoes: 0x1e293b, // Flexible driving sneakers
      sole: 0xf1f5f9,
      metal: 0x94a3b8
    },
    outfit: 'kaftan_classic',
    headwear: 'urban_fade',
    accessories: ['smartwatch', 'leather_belt'],
    gait: {
      stride: 1.0,
      armSwing: 0.95,
      posture: 0.02,
      bounce: 0.85,
      hipSway: 0.035
    }
  }
};

/**
 * Get cast preset by ID (with fallback to Harpy for men, Xixi for women)
 */
export function getCharacterPreset(idOrGender = 'harpy') {
  if (CHARACTER_CAST[idOrGender]) {
    return CHARACTER_CAST[idOrGender];
  }
  const clean = (idOrGender || '').toLowerCase();
  if (clean === 'women' || clean === 'female' || clean === 'xixi') {
    return CHARACTER_CAST.xixi;
  }
  if (clean === 'bello' || clean === 'malam' || clean === 'scholar') {
    return CHARACTER_CAST.malam_bello;
  }
  if (clean === 'guard' || clean === 'dogari') {
    return CHARACTER_CAST.dogari_danladi;
  }
  if (clean === 'merchant' || clean === 'trader' || clean === 'amina') {
    return CHARACTER_CAST.amina_merchant;
  }
  if (clean === 'keke' || clean === 'driver' || clean === 'ibrahim') {
    return CHARACTER_CAST.ibrahim_keke;
  }
  return CHARACTER_CAST.harpy;
}
