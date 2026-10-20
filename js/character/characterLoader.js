import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

/**
 * CharacterLoader — Loads and manages custom 3D FBX characters (Harpy, Xixi)
 * and bridges them with PlayerController and Multiplayer animations.
 */
export class CharacterLoader {
  constructor() {
    this.fbxLoader = new FBXLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.cache = new Map();

    // Registry of available character avatars
    this.characters = {
      'procedural': {
        id: 'procedural',
        name: 'Hadejia Explorer',
        subtitle: 'Authentic Nigerian Low-Poly Citizen',
        type: 'procedural'
      },
      'harpy': {
        id: 'harpy',
        name: 'Harpy',
        subtitle: 'PBR Stylized Urban Hero',
        type: 'fbx',
        fbxPath: './chracter/Harpy/Harpy.fbx',
        textureDir: './chracter/Harpy/',
        targetHeight: 1.85
      },
      'xixi': {
        id: 'xixi',
        name: 'Xixi',
        subtitle: 'Anime Stylized Explorer',
        type: 'fbx',
        fbxPath: './chracter/xixi/Anime_character.fbx',
        texturePath: './chracter/xixi/textures.png.png',
        targetHeight: 1.85
      }
    };
  }

  /**
   * Get list of all available character avatars
   */
  getAvailableCharacters() {
    return Object.values(this.characters);
  }

  /**
   * Load character by ID
   */
  async loadCharacter(id = 'harpy') {
    const config = this.characters[id];
    if (!config || config.type === 'procedural') {
      return null;
    }

    if (this.cache.has(id)) {
      return this._cloneCharacter(this.cache.get(id), id);
    }

    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        config.fbxPath,
        (fbx) => {
          this._setupCharacterMaterials(id, fbx, config);
          this._normalizeCharacterDimensions(fbx, config.targetHeight || 1.85);

          // Cache raw template
          this.cache.set(id, fbx);

          // Return an active clone
          const instance = this._cloneCharacter(fbx, id);
          resolve(instance);
        },
        undefined,
        (err) => {
          console.error(`[CharacterLoader] Failed to load character ${id}:`, err);
          reject(err);
        }
      );
    });
  }

  /**
   * Configure materials and textures for the loaded FBX model
   */
  _setupCharacterMaterials(id, fbx, config) {
    if (id === 'harpy') {
      // Map PBR textures for Harpy
      const texDir = config.textureDir;
      const loadTex = (file) => {
        const tex = this.textureLoader.load(`${texDir}${file}`);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };

      const textures = {
        skin: loadTex('Skin.png'),
        hair: loadTex('Hair.png'),
        face: loadTex('Face.png'),
        tshirt: loadTex('T-Shirt.png'),
        jeans: loadTex('Jeans.png'),
        shoes: loadTex('Shoes.png'),
        belt: loadTex('Belt.png'),
        gloves: loadTex('Gloves.png'),
        inner: loadTex('Inner.png'),
        eye: loadTex('Eye.png')
      };

      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          const mName = (child.name || '').toLowerCase();
          let targetTex = null;

          if (mName.includes('skin') || mName.includes('body')) targetTex = textures.skin;
          else if (mName.includes('hair')) targetTex = textures.hair;
          else if (mName.includes('face') || mName.includes('head')) targetTex = textures.face;
          else if (mName.includes('shirt') || mName.includes('top')) targetTex = textures.tshirt;
          else if (mName.includes('jean') || mName.includes('pant')) targetTex = textures.jeans;
          else if (mName.includes('shoe')) targetTex = textures.shoes;
          else if (mName.includes('belt')) targetTex = textures.belt;
          else if (mName.includes('glove')) targetTex = textures.gloves;
          else if (mName.includes('eye')) targetTex = textures.eye;

          if (targetTex) {
            child.material = new THREE.MeshStandardMaterial({
              map: targetTex,
              roughness: 0.7,
              metalness: 0.1
            });
          }
        }
      });
    } else if (id === 'xixi') {
      // Single texture atlas for Anime character
      const mainTex = this.textureLoader.load(config.texturePath);
      mainTex.colorSpace = THREE.SRGBColorSpace;

      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshStandardMaterial({
            map: mainTex,
            roughness: 0.65,
            metalness: 0.1
          });
        }
      });
    }
  }

  /**
   * Rescale and ground the character so it fits standard human height (1.85m)
   */
  _normalizeCharacterDimensions(fbx, targetHeight = 1.85) {
    const box = new THREE.Box3().setFromObject(fbx);
    const size = new THREE.Vector3();
    box.getSize(size);

    const currentHeight = size.y;
    if (currentHeight > 0.001) {
      const scaleFactor = targetHeight / currentHeight;
      fbx.scale.multiplyScalar(scaleFactor);

      // Re-evaluate bounding box after scaling to offset root to ground (y = 0)
      const scaledBox = new THREE.Box3().setFromObject(fbx);
      fbx.position.y = -scaledBox.min.y;
    }
  }

  /**
   * Clone character with separate animation mixer and bones
   */
  _cloneCharacter(template, id) {
    const clone = template.clone(true);
    let mixer = null;

    if (template.animations && template.animations.length > 0) {
      mixer = new THREE.AnimationMixer(clone);
    }

    return {
      id,
      root: clone,
      mesh: clone,
      mixer,
      animations: template.animations || []
    };
  }
}
