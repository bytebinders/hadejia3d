import * as THREE from 'three';

/**
 * LightingManager — Dynamic 24-Hour Day/Night Atmospheric Cycle
 * Controls Sun/Moon trajectory, shadows, hemisphere sky bounce, fog, and light interpolation.
 */

export class LightingManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.currentTime = 12.0; // 0.0 to 24.0 (12:00 PM)
    this.autoCycle = false;
    this.cycleSpeed = 0.5; // Virtual hours per second

    this.subscribers = [];

    this._initLights();
    this.setTime(12.0);
  }

  _initLights() {
    // 1. Hemisphere Light (ambient sky & ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // 2. Primary Directional Light (Sun / Moon)
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 400;

    const d = 130;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;

    this.scene.add(this.dirLight);

    // 3. Subtle Ambient Light fill
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(this.ambientLight);

    // 4. Fog
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.0035);
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  /**
   * Set time of day in virtual hours (0.0 to 24.0)
   */
  setTime(hours) {
    this.currentTime = hours % 24;
    if (this.currentTime < 0) this.currentTime += 24;

    const time = this.currentTime;

    // Calculate Sun position (orbital angle based on time)
    // 6.0 = Dawn (angle 0), 12.0 = Noon (angle PI/2), 18.0 = Dusk (angle PI), 24.0 = Midnight (angle 3PI/2)
    const sunAngle = ((time - 6) / 24) * Math.PI * 2;
    const sunDist = 160;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunZ = Math.sin(sunAngle * 0.5) * 50;

    this.dirLight.position.set(sunX, Math.max(sunY, -sunY * 0.4), sunZ);

    // Determine atmospheric phase:
    // Day: 8:00 - 17:00
    // Sunset / Golden hour: 17:00 - 20:00
    // Night: 20:00 - 5:00
    // Dawn: 5:00 - 8:00
    let skyColor, groundColor, sunColor, sunIntensity, hemiIntensity, fogColor, nightFactor;

    if (time >= 8 && time < 17) {
      // Crisp Bright Day
      skyColor = new THREE.Color(0xdbeafe);
      groundColor = new THREE.Color(0x86efac);
      sunColor = new THREE.Color(0xfffbeb);
      sunIntensity = 1.35;
      hemiIntensity = 0.65;
      fogColor = new THREE.Color(0xdbeafe);
      nightFactor = 0.0;
    } else if (time >= 17 && time < 20) {
      // Golden Hour to Sunset
      const t = (time - 17) / 3.0;
      skyColor = new THREE.Color().lerpColors(new THREE.Color(0xdbeafe), new THREE.Color(0xf43f5e), t);
      groundColor = new THREE.Color().lerpColors(new THREE.Color(0x86efac), new THREE.Color(0x78350f), t);
      sunColor = new THREE.Color().lerpColors(new THREE.Color(0xffedd5), new THREE.Color(0xf97316), t);
      sunIntensity = 1.35 * (1 - t * 0.6);
      hemiIntensity = 0.65 - t * 0.35;
      fogColor = new THREE.Color().lerpColors(new THREE.Color(0xdbeafe), new THREE.Color(0xfb923c), t);
      nightFactor = t * 0.8;
    } else if (time >= 20 || time < 5) {
      // Cyberpunk Midnight
      skyColor = new THREE.Color(0x0a0f1d);
      groundColor = new THREE.Color(0x030712);
      sunColor = new THREE.Color(0x93c5fd); // Pale moonlight
      sunIntensity = 0.25;
      hemiIntensity = 0.25;
      fogColor = new THREE.Color(0x0a0f1d);
      nightFactor = 1.0;
    } else {
      // 5:00 to 8:00 Dawn
      const t = (time - 5) / 3.0;
      skyColor = new THREE.Color().lerpColors(new THREE.Color(0x0a0f1d), new THREE.Color(0xdbeafe), t);
      groundColor = new THREE.Color().lerpColors(new THREE.Color(0x030712), new THREE.Color(0x86efac), t);
      sunColor = new THREE.Color().lerpColors(new THREE.Color(0xfbcfe8), new THREE.Color(0xfffbeb), t);
      sunIntensity = 0.3 + t * 1.05;
      hemiIntensity = 0.25 + t * 0.4;
      fogColor = new THREE.Color().lerpColors(new THREE.Color(0x0a0f1d), new THREE.Color(0xdbeafe), t);
      nightFactor = 1.0 - t;
    }

    // Apply colors & intensities
    this.hemiLight.color.copy(skyColor);
    this.hemiLight.groundColor.copy(groundColor);
    this.hemiLight.intensity = hemiIntensity;

    this.dirLight.color.copy(sunColor);
    this.dirLight.intensity = sunIntensity;

    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(fogColor);
    }

    // Notify subscribers of night factor
    this.subscribers.forEach(cb => cb(nightFactor, time));
  }

  setWeather(weather) {
    if (weather === 'fog') {
      this.scene.fog.density = 0.009;
    } else if (weather === 'rain') {
      this.scene.fog.density = 0.006;
    } else {
      this.scene.fog.density = 0.0035;
    }
  }

  update(delta) {
    if (this.autoCycle) {
      this.setTime(this.currentTime + delta * this.cycleSpeed);
    }
  }
}
