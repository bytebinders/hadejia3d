import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { CityBuilder } from './city/cityBuilder.js';
import { TrafficSystem } from './traffic/trafficSystem.js';
import { MonorailSystem } from './traffic/monorailSystem.js';
import { SkySystem } from './environment/skySystem.js';
import { LightingManager } from './environment/lightingManager.js';
import { SoundSystem } from './audio/soundSystem.js';
import { HUDController } from './ui/hudController.js';
import { PlayerController } from './character/playerController.js';
import { PedestrianSystem } from './character/pedestrianSystem.js';
import { CollisionSystem } from './city/collisionSystem.js';
import { NetworkManager } from './network/networkManager.js';
import { CityMap } from './ui/cityMap.js';
import { VirtualJoystick } from './ui/virtualJoystick.js';
import { AuthManager } from './auth/authManager.js';

/**
 * Polis3D — Interactive Low-Poly 3D Metropolis Simulation
 */

class MetropolisApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.loader = document.getElementById('loader');
    this.progressBar = document.getElementById('loader-progress');
    this.statusText = document.getElementById('loader-status');

    this.clock = new THREE.Clock();
    this.fpsFrames = 0;
    this.fpsLastTime = performance.now();
    this.currentFps = 60;

    // Camera animation state — Default to Player Mode always
    this.activePreset = 'player';
    this.camTransition = null;
    this.followedCar = null;

    this.init();
  }

  async init() {
    this._updateLoader(25, 'Initializing WebGL Renderer...');

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene Setup
    this.scene = new THREE.Scene();

    // 3. Camera Setup
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.5,
      800
    );
    this.camera.position.set(-110, 95, 120);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent dipping beneath ground
    this.controls.minDistance = 15;
    this.controls.maxDistance = 350;
    this.controls.target.set(-15, 5, 0);

    this._updateLoader(45, 'Crafting City Architecture & Colliders...');

    // 5. Sound System
    this.soundSys = new SoundSystem();

    // 6. Lighting Manager
    this.lightingMgr = new LightingManager(this.scene, this.renderer);

    // 7. Collision Engine
    this.collisionSys = new CollisionSystem();

    // 8. City Builder
    this.cityBuilder = new CityBuilder(this.scene, this.collisionSys);
    this.cityBuilder.buildCity(1);

    this._updateLoader(70, 'Deploying Traffic & Elevated Monorail...');

    // 9. Traffic System
    this.trafficSys = new TrafficSystem(this.scene, this.cityBuilder.roadSplines);
    this.trafficSys.spawnVehicles(28);
    this.collisionSys.setTrafficSystem(this.trafficSys);

    // 10. Monorail System
    this.monorailSys = new MonorailSystem(this.scene, this.collisionSys);

    this._updateLoader(85, 'Forming Clouds, Atmosphere & Zeppelin...');

    // 11. Sky System
    this.skySys = new SkySystem(this.scene);

    // Wire Day/Night callbacks
    this.lightingMgr.subscribe((nightFactor, timeHours) => {
      this.cityBuilder.updateDayNight(nightFactor);
      this.trafficSys.updateDayNight(nightFactor);
      this.monorailSys.updateDayNight(nightFactor);
    });

    this._updateLoader(90, 'Spawning Citizens & Player Character...');

    // 12. Pedestrian Crowds & Living Citizens
    this.pedestrianSys = new PedestrianSystem(this.scene, this.collisionSys);

    // 13. Player Controller with Collision Resolution & Citizen Interaction
    this.playerCtrl = new PlayerController(
      this.scene,
      this.camera,
      this.renderer.domElement,
      this.trafficSys,
      this.collisionSys,
      this.pedestrianSys,
      this.soundSys
    );

    // 13.5 Real-Time Wi-Fi / LAN Multiplayer Engine
    this._updateLoader(92, 'Connecting to Multiplayer Grid...');
    this.networkMgr = new NetworkManager(this.scene, this.playerCtrl, this.soundSys);

    // 13.8 Supabase Authentication System
    this.authMgr = new AuthManager(this);

    this._updateLoader(95, 'Finalizing HUD Controls...');

    // 14. HUD Controller
    this.hudCtrl = new HUDController(this);

    // 15. Interactive City Map & GPS Radar
    this.cityMap = new CityMap(this);

    // 16. Mobile Touch Virtual Joystick & Dual-Stick Camera
    this.virtualJoystick = new VirtualJoystick(this);

    // Default camera view to Player Mode always
    this.setCameraPreset('player');

    // Window Resize listener
    window.addEventListener('resize', () => this._onWindowResize());

    this._updateLoader(100, 'Barka da zuwa Hadejia 3D!');

    // Dismiss Loader after brief smooth transition
    setTimeout(() => {
      this.loader.classList.add('fade-out');
    }, 400);

    // Start Animation Loop
    this.animate();
  }

  _updateLoader(percent, text) {
    if (this.progressBar) this.progressBar.style.width = `${percent}%`;
    if (this.statusText) this.statusText.textContent = text;
  }

  _onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Set predefined camera views
   */
  setCameraPreset(preset) {
    this.activePreset = preset;
    this.followedCar = null;

    if (preset === 'player') {
      this.controls.enabled = false;
      this.playerCtrl.setActive(true);
      return;
    }

    this.playerCtrl.setActive(false);

    if (preset === 'monorail') {
      // Locked to monorail in update loop
      this.controls.enabled = false;
      return;
    }

    if (preset === 'followCar') {
      // Pick random car from traffic
      if (this.trafficSys.vehicles.length > 0) {
        const randIdx = Math.floor(Math.random() * this.trafficSys.vehicles.length);
        this.followedCar = this.trafficSys.vehicles[randIdx];
        this.controls.enabled = false;
      }
      return;
    }

    // Standard static target presets
    this.controls.enabled = true;
    let targetPos, lookAt;

    switch (preset) {
      case 'skyline':
        targetPos = new THREE.Vector3(-95, 38, -85);
        lookAt = new THREE.Vector3(-45, 18, -15);
        break;
      case 'park':
        targetPos = new THREE.Vector3(-10, 26, 68);
        lookAt = new THREE.Vector3(-10, 4, 25);
        break;
      case 'waterfront':
        targetPos = new THREE.Vector3(88, 30, -75);
        lookAt = new THREE.Vector3(45, 8, 0);
        break;
      case 'street':
        targetPos = new THREE.Vector3(-35, 4.2, -42);
        lookAt = new THREE.Vector3(0, 4.2, 0);
        break;
      case 'iso':
      default:
        targetPos = new THREE.Vector3(-110, 95, 120);
        lookAt = new THREE.Vector3(-15, 5, 0);
        break;
    }

    this._startCameraTransition(targetPos, lookAt);
  }

  _startCameraTransition(targetPos, lookAt, duration = 1.2) {
    this.camTransition = {
      startPos: this.camera.position.clone(),
      endPos: targetPos,
      startTarget: this.controls.target.clone(),
      endTarget: lookAt,
      startTime: performance.now(),
      duration: duration * 1000
    };
  }

  focusOnObject(objectGroup) {
    const bbox = new THREE.Box3().setFromObject(objectGroup);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    bbox.getCenter(center);
    bbox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const offset = new THREE.Vector3(maxDim * 1.5, maxDim * 1.2, maxDim * 1.5);
    const targetCamPos = center.clone().add(offset);

    this.activePreset = 'custom';
    this.followedCar = null;
    this.controls.enabled = true;
    this._startCameraTransition(targetCamPos, center, 1.4);
  }

  setWeather(weather) {
    this.lightingMgr.setWeather(weather);
    this.skySys.setWeather(weather);
    this.soundSys.setRain(weather === 'rain');
  }

  regenerateCity() {
    const seed = Math.random();
    this.cityBuilder.buildCity(seed);
    this.trafficSys.roadSplines = this.cityBuilder.roadSplines;
    this.trafficSys.spawnVehicles(28);
    this.pedestrianSys.spawnPedestrians(32);
    this.setCameraPreset('player');
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // 1. Calculate FPS
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLastTime >= 500) {
      this.currentFps = (this.fpsFrames * 1000) / (now - this.fpsLastTime);
      this.fpsFrames = 0;
      this.fpsLastTime = now;
      this.hudCtrl.updateMetrics(this.currentFps, this.lightingMgr.currentTime);
    }

    // 2. Subsystems Update
    this.lightingMgr.update(delta);
    this.cityBuilder.update(time, delta);
    this.trafficSys.update(delta);
    this.monorailSys.update(delta);
    this.skySys.update(time, delta);
    if (this.playerCtrl) this.playerCtrl.update(delta);
    if (this.pedestrianSys) this.pedestrianSys.update(delta);
    if (this.networkMgr) this.networkMgr.update(delta);
    if (this.cityMap) this.cityMap.update();
    if (this.virtualJoystick) this.virtualJoystick.update();

    // 3. Camera Modes Update
    if (this.activePreset === 'player') {
      // 3rd-person follow camera is updated within playerCtrl.update()
    } else if (this.activePreset === 'monorail') {
      const trainTarget = this.monorailSys.getLeadCarCameraTarget();
      if (trainTarget) {
        this.camera.position.lerp(trainTarget.camPos, 0.1);
        this.camera.lookAt(trainTarget.lookTarget);
      }
    } else if (this.activePreset === 'followCar' && this.followedCar) {
      const carPos = this.followedCar.mesh.position.clone();
      const carQuat = this.followedCar.mesh.quaternion;
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuat);
      const camPos = carPos.clone().sub(forward.clone().multiplyScalar(12)).add(new THREE.Vector3(0, 5, 0));
      const lookAt = carPos.clone().add(new THREE.Vector3(0, 1.5, 0));

      this.camera.position.lerp(camPos, 0.15);
      this.camera.lookAt(lookAt);
    } else if (this.camTransition) {
      const elapsed = performance.now() - this.camTransition.startTime;
      const t = Math.min(elapsed / this.camTransition.duration, 1.0);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(this.camTransition.startPos, this.camTransition.endPos, ease);
      this.controls.target.lerpVectors(this.camTransition.startTarget, this.camTransition.endTarget, ease);

      if (t >= 1.0) {
        this.camTransition = null;
      }
    } else {
      this.controls.update();
    }

    // 4. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  new MetropolisApp();
});
