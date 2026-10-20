import * as THREE from 'three';
import { LowPolyHuman } from './lowPolyHuman.js';

/**
 * CharacterLoader — Universal Stickman Rig & 3D Realistic Wardrobe Engine
 * 
 * Manages modular 3D character avatars with full skeletal articulation:
 * - Harpy (Men): Masculine stickman skeleton, realistic urban bomber jackets, Kaftans, Babban Rigas, fade & Hula caps
 * - Xixi (Women): Feminine stickman skeleton, stylish urban chic blouses, Atampa dresses, Abayas, Mayafi & ponytails
 * 
 * Guarantees smooth, living body movement for all characters, and allows
 * dynamically adding or changing clothes and hairstyles anytime!
 */
export class CharacterLoader {
  constructor() {
    this.isPreloaded = true;
    this.characters = {
      'harpy': {
        id: 'harpy',
        gender: 'men',
        name: 'Harpy (Men)',
        subtitle: 'Athletic Male Stickman with Realistic Clothes',
        defaultOutfit: 'harpy_urban',
        defaultHairstyle: 'hula_zanna'
      },
      'xixi': {
        id: 'xixi',
        gender: 'women',
        name: 'Xixi (Women)',
        subtitle: 'Graceful Female Stickman with Realistic Clothes',
        defaultOutfit: 'xixi_urban',
        defaultHairstyle: 'hijab_mayafi'
      }
    };
  }

  /**
   * Preload character assets and materials
   */
  async preloadAll() {
    this.isPreloaded = true;
    console.log('[CharacterLoader] Universal Stickman & 3D Realistic Wardrobe engine ready.');
    return Promise.resolve(true);
  }

  /**
   * Resolve canonical character ID ('men' -> 'harpy', 'women' -> 'xixi')
   */
  resolveId(id = 'harpy') {
    const clean = (id || '').toLowerCase();
    if (clean === 'women' || clean === 'female' || clean === 'xixi') return 'xixi';
    return 'harpy';
  }

  resolveGender(id = 'harpy') {
    return this.resolveId(id) === 'xixi' ? 'women' : 'men';
  }

  /**
   * Create an articulated stickman character with realistic 3D clothes
   */
  createCharacter(options = {}) {
    const rawId = options.id || options.avatarId || 'harpy';
    const cleanId = this.resolveId(rawId);
    const gender = this.resolveGender(cleanId);
    const config = this.characters[cleanId];

    const rig = LowPolyHuman.create({
      gender,
      avatarId: cleanId,
      style: options.style || options.outfit || config.defaultOutfit,
      hairstyle: options.hairstyle || config.defaultHairstyle,
      palette: options.palette,
      scale: options.scale || 0.65,
      isPlayer: options.isPlayer || false
    });

    return {
      id: cleanId,
      gender,
      name: config.name,
      rig,
      root: rig.root,
      model: rig.root,
      mesh: rig.root
    };
  }

  /**
   * Synchronously get character instance
   */
  getCharacterSync(id = 'harpy', options = {}) {
    return this.createCharacter({ ...options, id });
  }

  /**
   * Asynchronously get character instance
   */
  async loadCharacter(id = 'harpy', options = {}) {
    return Promise.resolve(this.createCharacter({ ...options, id }));
  }

  /**
   * Catalogue of available 3D clothes and hairstyles
   */
  getWardrobeCatalog(gender = 'men') {
    if (gender === 'women') {
      return {
        outfits: [
          { id: 'xixi_urban', name: 'Urban Chic Jacket & Blouse' },
          { id: 'hausa_atampa', name: 'Traditional Wax-Print Atampa Dress' },
          { id: 'modest_abaya', name: 'Royal Modest Abaya Gown' }
        ],
        hairstyles: [
          { id: 'hijab_mayafi', name: 'Flowing Mayafi / Hijab Veil' },
          { id: 'ponytail', name: 'High Anime Ponytail' },
          { id: 'twin_braids', name: 'Twin Braids' },
          { id: 'chic_bob', name: 'Chic Bob Cut' },
          { id: 'flowing_hair', name: 'Long Flowing Hair' }
        ]
      };
    }

    return {
      outfits: [
        { id: 'harpy_urban', name: 'Urban Casual Bomber Jacket & Jeans' },
        { id: 'hausa_kaftan', name: 'Embroidered Hausa Kaftan' },
        { id: 'hausa_babban_riga', name: 'Royal Babban Riga Robes' },
        { id: 'emir_guard', name: 'Palace Dogari Guard Uniform' }
      ],
      hairstyles: [
        { id: 'hula_zanna', name: 'Embroidered Hula Cap (Zanna Bukar)' },
        { id: 'fade', name: 'Urban Fade / Short Crop' },
        { id: 'rawani_turban', name: 'Scholarly Rawani Turban' },
        { id: 'afro', name: 'Textured Curly Afro' }
      ]
    };
  }

  /**
   * Procedural animation helper (if calling through loader)
   */
  animateInstance(instance, state, animTime, delta) {
    if (!instance) return;
    const rig = instance.rig || (instance.userData && instance.userData.rig);
    if (!rig) return;
    // Systems drive rig joints directly for 60fps responsiveness
  }
}
