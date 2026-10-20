import * as THREE from 'three';
import { LowPolyHuman } from './lowPolyHuman.js';

/**
 * PlayerController — Full Character Controller & Vehicle Driving System
 * Handles On-Foot movement (walk, run, jump, sit, lay, wave, dance)
 * and In-Car manual driving (acceleration, steering, handbrake, reverse, chase cam).
 */

export class PlayerController {
  constructor(scene, camera, domElement, trafficSys = null, collisionSys = null, pedestrianSys = null, soundSys = null, charLoader = null) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.trafficSys = trafficSys;
    this.collisionSys = collisionSys;
    this.pedestrianSys = pedestrianSys;
    this.soundSys = soundSys;
    this.charLoader = charLoader;

    // Character avatar selection: 'harpy' (Men) or 'xixi' (Women)
    this.activeAvatar = 'harpy';
    this.onAvatarChange = null;

    const savedAvatar = typeof localStorage !== 'undefined' ? localStorage.getItem('hadejia3d_avatar') : null;
    if (savedAvatar) {
      this.activeAvatar = (savedAvatar === 'women' || savedAvatar === 'female' || savedAvatar === 'xixi') ? 'xixi' : 'harpy';
    }

    // Build base player stickman model with realistic 3D clothes
    const isInitWomen = (this.activeAvatar === 'xixi');
    this.rig = LowPolyHuman.create({
      isPlayer: true,
      scale: 0.65,
      gender: isInitWomen ? 'women' : 'men',
      avatarId: this.activeAvatar,
      style: isInitWomen ? 'xixi_urban' : 'harpy_urban'
    });
    this.mesh = this.rig.root;
    this.groundY = this.collisionSys ? this.collisionSys.getGroundHeight(-15, 25) : 1.87;
    this.mesh.position.set(-15, this.groundY, 25); // Start on top of Central Park pathway
    this.scene.add(this.mesh);

    // Citizen interaction tracking
    this.nearbyCitizen = null;
    this.isTalking = false;
    this.currentTalkCitizen = null;

    // States: 'IDLE', 'WALK', 'RUN', 'JUMP', 'SIT', 'LAY', 'DANCE', 'WAVE', 'DRIVING'
    this.state = 'IDLE';

    // On-Foot Movement Parameters
    this.walkSpeed = 4.8;
    this.runSpeed = 10.5;
    this.turnSpeed = 4.5;
    this.jumpForce = 8.5;
    this.gravity = 20.0;

    this.velocity = new THREE.Vector3();
    this.verticalVelocity = 0;
    this.isGrounded = true;

    // Vehicle Driving Parameters
    this.isDriving = false;
    this.currentVehicle = null;
    this.nearbyVehicle = null;
    this.carSpeed = 0;
    this.steerAngle = 0;
    this.maxForwardSpeed = 26.0;
    this.maxReverseSpeed = -9.0;
    this.carAccel = 18.0;
    this.brakeForce = 32.0;
    this.carDrag = 8.0;
    this.steerSpeed = 3.2;
    this.maxSteerAngle = 0.62;

    // Input flags
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shift: false,
      jump: false,
      handbrake: false
    };

    // Camera follow parameters (Proportionate to scaled character)
    this.cameraYaw = 0;
    this.cameraPitch = 0.22;
    this.isRightMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Animation timer
    this.animTime = 0;

    // Mobile Virtual Joystick input Vector (-1 to 1)
    this.joystick = { x: 0, y: 0 };

    this._bindInputs();
  }

  setJoystick(x, y) {
    this.joystick.x = x;
    this.joystick.y = y;
    if (Math.hypot(x, y) > 0.15) {
      this._interruptIdlePoses();
    }
  }

  rotateCamera(deltaYaw, deltaPitch) {
    this.cameraYaw -= deltaYaw;
    this.cameraPitch = Math.max(-0.2, Math.min(1.1, this.cameraPitch + deltaPitch));
  }

  setTrafficSystem(trafficSys) {
    this.trafficSys = trafficSys;
  }

  setCollisionSystem(collisionSys) {
    this.collisionSys = collisionSys;
  }

  setNetworkManager(networkMgr) {
    this.networkMgr = networkMgr;
  }

  _bindInputs() {
    window.addEventListener('keydown', e => this._onKeyDown(e));
    window.addEventListener('keyup', e => this._onKeyUp(e));

    // Mouse drag for camera orbit around player
    this.domElement.addEventListener('pointerdown', e => {
      if (e.button === 0 || e.button === 2) {
        this.isRightMouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isRightMouseDown = false;
    });

    window.addEventListener('pointermove', e => {
      if (this.isRightMouseDown && this.isActive && !this.isDriving) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.cameraYaw -= deltaX * 0.006;
        this.cameraPitch = Math.max(-0.2, Math.min(1.1, this.cameraPitch + deltaY * 0.005));
      }
    });
  }

  _onKeyDown(e) {
    if (!this.isActive) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        this._interruptIdlePoses();
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        this._interruptIdlePoses();
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        this._interruptIdlePoses();
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        this._interruptIdlePoses();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = true;
        break;
      case 'Space':
        e.preventDefault();
        if (this.isDriving) {
          this.keys.handbrake = true;
        } else {
          this.jump();
        }
        break;
      case 'KeyE': // Enter / Exit Car, or Talk if near citizen and not near car
        if (this.isDriving || this.nearbyVehicle) {
          this.toggleVehicle();
        } else if (this.nearbyCitizen) {
          this.toggleTalk();
        }
        break;
      case 'KeyT': // Dedicated Talk with citizen
        if (!this.isDriving) this.toggleTalk();
        break;
      case 'KeyC': // Sit toggle
        if (!this.isDriving) this.toggleSit();
        break;
      case 'KeyX': // Lay down toggle
        if (!this.isDriving) this.toggleLay();
        break;
      case 'KeyG': // Wave
        if (!this.isDriving) this.wave();
        break;
      case 'KeyV': // Toggle Proximity Voice Chat Microphone
        if (this.voiceChat) {
          this.voiceChat.toggleMic();
        }
        break;
      case 'KeyB': // Dance
        if (!this.isDriving) this.dance();
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = false;
        break;
      case 'Space':
        this.keys.handbrake = false;
        break;
    }
  }

  _interruptIdlePoses() {
    if (this.state === 'SIT' || this.state === 'LAY' || this.state === 'DANCE' || this.state === 'WAVE') {
      this.state = 'IDLE';
      this._resetBoneTransforms();
    }
  }

  /**
   * Enter or Exit Vehicle toggle
   */
  toggleVehicle() {
    if (this.isDriving) {
      this.exitVehicle();
    } else {
      if (this.nearbyVehicle) {
        this.enterVehicle(this.nearbyVehicle);
      }
    }
  }

  /**
   * Enter selected vehicle
   */
  enterVehicle(vehicleObj) {
    if (!vehicleObj || !vehicleObj.mesh) return;

    this.isDriving = true;
    this.currentVehicle = vehicleObj;
    vehicleObj.isDrivenByPlayer = true;
    this.carSpeed = 0;
    this.steerAngle = 0;
    this.state = 'DRIVING';

    // Apply sitting pose inside car
    const r = this.rig;
    r.hips.position.y = 0.72;
    r.hips.position.z = -0.2;
    r.leftLegUpper.rotation.x = -Math.PI / 2 + 0.1;
    r.leftLegLower.rotation.x = Math.PI / 2 - 0.1;
    r.rightLegUpper.rotation.x = -Math.PI / 2 + 0.1;
    r.rightLegLower.rotation.x = Math.PI / 2 - 0.1;
    r.leftArmUpper.rotation.x = -0.6;
    r.leftArmLower.rotation.x = -0.5;
    r.rightArmUpper.rotation.x = -0.6;
    r.rightArmLower.rotation.x = -0.5;
  }

  /**
   * Exit vehicle safely onto sidewalk
   */
  exitVehicle() {
    if (!this.isDriving || !this.currentVehicle) return;

    const car = this.currentVehicle.mesh;
    const exitOffset = car.userData.exitOffset || new THREE.Vector3(-2.2, 0, 0.1);
    const exitWorldPos = car.position.clone().add(exitOffset.clone().applyQuaternion(car.quaternion));
    exitWorldPos.y = this.collisionSys
      ? this.collisionSys.getGroundHeight(exitWorldPos.x, exitWorldPos.z)
      : this.groundY;

    this.mesh.position.copy(exitWorldPos);
    this.mesh.rotation.set(0, car.rotation.y + Math.PI / 2, 0);

    this.currentVehicle.isDrivenByPlayer = false;
    this.currentVehicle = null;
    this.isDriving = false;
    this.carSpeed = 0;
    this.state = 'IDLE';

    this._resetBoneTransforms();
    this.cameraYaw = this.mesh.rotation.y;
    this.cameraPitch = 0.22;
  }

  /**
   * Action methods (callable via UI buttons or keys)
   */
  jump() {
    if (this.isGrounded && this.state !== 'LAY' && !this.isDriving) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
      this.state = 'JUMP';
    }
  }

  toggleSit() {
    if (this.isDriving) return;
    if (this.state === 'SIT') {
      this.state = 'IDLE';
      this._resetBoneTransforms();
    } else {
      this.state = 'SIT';
      this.velocity.set(0, 0, 0);
    }
  }

  toggleLay() {
    if (this.isDriving) return;
    if (this.state === 'LAY') {
      this.state = 'IDLE';
      this._resetBoneTransforms();
    } else {
      this.state = 'LAY';
      this.velocity.set(0, 0, 0);
    }
  }

  wave() {
    if (this.isDriving) return;
    if (this.state === 'WAVE') {
      this.state = 'IDLE';
      this._resetBoneTransforms();
    } else {
      this.state = 'WAVE';
      this.animTime = 0;
      if (this.nearbyCitizen && this.pedestrianSys) {
        this.pedestrianSys.citizenWave(this.nearbyCitizen.citizen);
      }
    }
  }

  setPedestrianSystem(pedestrianSys) {
    this.pedestrianSys = pedestrianSys;
  }

  setSoundSystem(soundSys) {
    this.soundSys = soundSys;
  }

  toggleTalk() {
    if (this.isDriving) return;
    if (this.isTalking) {
      this.endTalk();
    } else if (this.nearbyCitizen) {
      return this.startTalk(this.nearbyCitizen.citizen);
    }
    return null;
  }

  startTalk(citizen) {
    if (!this.pedestrianSys || !citizen) return null;
    this.isTalking = true;
    this.currentTalkCitizen = citizen;
    if (this.soundSys) this.soundSys.playTalkChirp();
    return this.pedestrianSys.startPlayerConversation(citizen, this.mesh.position);
  }

  nextTalk() {
    if (!this.pedestrianSys || !this.currentTalkCitizen) return null;
    if (this.soundSys) this.soundSys.playClick();
    return this.pedestrianSys.nextDialogue(this.currentTalkCitizen);
  }

  waveToCitizen() {
    if (!this.pedestrianSys || !this.currentTalkCitizen) return;
    this.wave();
    this.pedestrianSys.citizenWave(this.currentTalkCitizen);
  }

  endTalk() {
    if (!this.isTalking) return;
    this.isTalking = false;
    if (this.pedestrianSys && this.currentTalkCitizen) {
      this.pedestrianSys.endPlayerConversation(this.currentTalkCitizen);
    }
    this.currentTalkCitizen = null;
  }

  dance() {
    if (this.isDriving) return;
    if (this.state === 'DANCE') {
      this.state = 'IDLE';
      this._resetBoneTransforms();
    } else {
      this.state = 'DANCE';
      this.animTime = 0;
    }
  }

  setRun(isRunning) {
    this.keys.shift = isRunning;
  }

  /**
   * Reset rig bones to standard resting pose
   */
  _resetBoneTransforms() {
    const r = this.rig;
    r.mesh = this.mesh;
    r.hips.position.set(0, 1.35, 0);
    r.hips.rotation.set(0, 0, 0);
    r.torso.rotation.set(0, 0, 0);
    r.headPivot.rotation.set(0, 0, 0);
    r.leftArmUpper.rotation.set(0, 0, 0);
    r.leftArmLower.rotation.set(0, 0, 0);
    r.rightArmUpper.rotation.set(0, 0, 0);
    r.rightArmLower.rotation.set(0, 0, 0);
    r.leftLegUpper.rotation.set(0, 0, 0);
    r.leftLegLower.rotation.set(0, 0, 0);
    r.rightLegUpper.rotation.set(0, 0, 0);
    r.rightLegLower.rotation.set(0, 0, 0);
    this.mesh.rotation.x = 0;
    this.mesh.rotation.z = 0;
  }

  /**
   * Main update loop
   */
  update(delta) {
    this.animTime += delta;

    if (this.isDriving) {
      this._updateDriving(delta);
    } else {
      this._updateOnFoot(delta);
      this._checkNearbyVehicles();
      this._checkNearbyCitizens();
    }
  }

  _checkNearbyCitizens() {
    if (!this.pedestrianSys || this.isDriving) {
      this.nearbyCitizen = null;
      return;
    }
    this.nearbyCitizen = this.pedestrianSys.getNearestCitizen(this.mesh.position, 3.4);
  }

  /**
   * Driving Physics Simulation
   */
  _updateDriving(delta) {
    const carObj = this.currentVehicle;
    if (!carObj || !carObj.mesh) return;

    const car = carObj.mesh;
    const joyY = this.joystick.y;
    const joyX = this.joystick.x;

    // Throttle & Braking (Keyboard + Mobile Joystick)
    if (this.keys.forward || joyY > 0.18) {
      const mult = joyY > 0.18 ? joyY : 1.0;
      this.carSpeed = Math.min(this.maxForwardSpeed, this.carSpeed + this.carAccel * mult * delta);
    } else if (this.keys.backward || joyY < -0.18) {
      if (this.carSpeed > 0.5) {
        this.carSpeed = Math.max(0, this.carSpeed - this.brakeForce * delta);
      } else {
        const mult = joyY < -0.18 ? Math.abs(joyY) : 1.0;
        this.carSpeed = Math.max(this.maxReverseSpeed, this.carSpeed - this.carAccel * 0.7 * mult * delta);
      }
    } else {
      // Natural Drag towards zero
      if (this.carSpeed > 0) {
        this.carSpeed = Math.max(0, this.carSpeed - this.carDrag * delta);
      } else if (this.carSpeed < 0) {
        this.carSpeed = Math.min(0, this.carSpeed + this.carDrag * delta);
      }
    }

    // Handbrake
    if (this.keys.handbrake) {
      this.carSpeed *= 0.92;
    }

    // Steering (Keyboard + Mobile Joystick)
    if (Math.abs(joyX) > 0.12) {
      const targetSteer = -joyX * this.maxSteerAngle;
      this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1.0, this.steerSpeed * 2.5 * delta);
    } else if (this.keys.left) {
      this.steerAngle = Math.min(this.maxSteerAngle, this.steerAngle + this.steerSpeed * delta);
    } else if (this.keys.right) {
      this.steerAngle = Math.max(-this.maxSteerAngle, this.steerAngle - this.steerSpeed * delta);
    } else {
      this.steerAngle += (0 - this.steerAngle) * Math.min(1.0, 7.0 * delta);
    }

    // Car Turning
    if (Math.abs(this.carSpeed) > 0.05) {
      const turnFactor = (this.carSpeed / this.maxForwardSpeed);
      car.rotation.y += this.steerAngle * turnFactor * delta * 2.5;
    }

    // Move Car Forward with Solid Obstacle Collision
    const forward = new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
    const targetX = car.position.x + forward.x * this.carSpeed * delta;
    const targetZ = car.position.z + forward.z * this.carSpeed * delta;

    if (this.collisionSys) {
      const resolved = this.collisionSys.resolveMovement(
        car.position.x,
        car.position.z,
        targetX,
        targetZ,
        1.35,
        true,
        car
      );
      if (resolved.collided) {
        this.carSpeed *= -0.25; // Elastic bounce against solid obstacles
      }
      car.position.x = resolved.x;
      car.position.z = resolved.z;
    } else {
      car.position.x = targetX;
      car.position.z = targetZ;
    }

    // Boundary constraints
    car.position.x = Math.max(-105, Math.min(105, car.position.x));
    car.position.z = Math.max(-105, Math.min(105, car.position.z));

    // Vehicle ground elevation following (climbs bridges and tracks road surfaces)
    const targetSurfaceY = this.collisionSys
      ? this.collisionSys.getGroundHeight(car.position.x, car.position.z)
      : 1.42;
    car.position.y += (targetSurfaceY - car.position.y) * Math.min(1.0, 10.0 * delta);

    // Wheels Animation
    if (car.userData) {
      const wheelR = car.userData.wheelRadius || 0.44;
      const rotDelta = (this.carSpeed * delta) / wheelR;

      if (car.userData.allWheels) {
        car.userData.allWheels.forEach(w => w.rotation.x += rotDelta);
      }
      if (car.userData.frontWheels) {
        car.userData.frontWheels.forEach(w => w.rotation.y = this.steerAngle);
      }
    }

    // Position Player in Driver Seat
    const seatOffset = car.userData.driverSeatOffset || new THREE.Vector3(-0.55, 0.45, 0.1);
    const seatWorldPos = car.position.clone().add(seatOffset.clone().applyQuaternion(car.quaternion));
    this.mesh.position.copy(seatWorldPos);
    this.mesh.rotation.y = car.rotation.y;

    // Dynamic 3rd-Person Chase Camera
    if (this.isActive) {
      const speedRatio = Math.abs(this.carSpeed) / this.maxForwardSpeed;
      const camDist = 9.5 + speedRatio * 3.5;
      const camHeight = 3.8 + speedRatio * 0.5;

      const camTargetPos = car.position.clone()
        .sub(forward.clone().multiplyScalar(camDist))
        .add(new THREE.Vector3(0, camHeight, 0));

      this.camera.position.lerp(camTargetPos, 0.14);
      this.camera.lookAt(car.position.clone().add(new THREE.Vector3(0, 1.3, 0)));
    }
  }

  /**
   * On-Foot Movement & Animation Update
   */
  _updateOnFoot(delta) {
    const joyMagnitude = Math.hypot(this.joystick.x, this.joystick.y);
    const isJoyMoving = joyMagnitude > 0.15;
    const isKeyMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
    const isMoving = isJoyMoving || isKeyMoving;

    if (isMoving && (this.state === 'SIT' || this.state === 'LAY')) {
      this._interruptIdlePoses();
    }

    if (this.isGrounded && this.state !== 'SIT' && this.state !== 'LAY' && this.state !== 'DANCE' && this.state !== 'WAVE') {
      if (isMoving) {
        this.state = (this.keys.shift || joyMagnitude > 0.78) ? 'RUN' : 'WALK';
      } else {
        this.state = 'IDLE';
      }
    }

    // Direction calculation relative to camera yaw
    if (isMoving && this.state !== 'SIT' && this.state !== 'LAY') {
      let moveZ = 0;
      let moveX = 0;

      if (isJoyMoving) {
        moveX = -this.joystick.x;
        moveZ = this.joystick.y;
      } else {
        if (this.keys.forward) moveZ += 1;
        if (this.keys.backward) moveZ -= 1;
        if (this.keys.left) moveX += 1;
        if (this.keys.right) moveX -= 1;
      }

      const inputAngle = Math.atan2(moveX, moveZ);
      const targetAngle = this.cameraYaw + inputAngle;

      // Smooth rotate player mesh to facing direction
      const curAngle = this.mesh.rotation.y;
      let diff = targetAngle - curAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.mesh.rotation.y += diff * Math.min(1.0, this.turnSpeed * delta * 3.5);

      const isRunning = this.keys.shift || joyMagnitude > 0.78;
      const speed = isRunning ? this.runSpeed : this.walkSpeed;
      const forwardDir = new THREE.Vector3(Math.sin(targetAngle), 0, Math.cos(targetAngle));

      const targetX = this.mesh.position.x + forwardDir.x * speed * delta;
      const targetZ = this.mesh.position.z + forwardDir.z * speed * delta;

      if (this.collisionSys) {
        const resolved = this.collisionSys.resolveMovement(
          this.mesh.position.x,
          this.mesh.position.z,
          targetX,
          targetZ,
          0.32
        );
        this.mesh.position.x = resolved.x;
        this.mesh.position.z = resolved.z;
      } else {
        this.mesh.position.x = targetX;
        this.mesh.position.z = targetZ;
      }
    }

    // Determine current surface layer beneath player
    const surfaceY = this.collisionSys
      ? this.collisionSys.getGroundHeight(this.mesh.position.x, this.mesh.position.z)
      : 1.4;
    this.groundY = surfaceY;

    // Grounded stepping and edge-drop physics
    if (this.isGrounded) {
      const heightDiff = surfaceY - this.mesh.position.y;
      if (heightDiff > 0.001) {
        // Stepping up onto curb, grass lawn, or stone pathway
        if (heightDiff <= 0.52) {
          this.mesh.position.y = Math.min(surfaceY, this.mesh.position.y + 12.0 * delta);
          if (Math.abs(this.mesh.position.y - surfaceY) < 0.02) {
            this.mesh.position.y = surfaceY;
          }
        }
      } else if (heightDiff < -0.12) {
        // Ground dropped beneath player (stepped off curb, grass lawn, or dock ledge)
        this.isGrounded = false;
        this.verticalVelocity = 0;
      } else {
        // Firmly grounded on top of current surface layer
        this.mesh.position.y = surfaceY;
      }
    }

    // Vertical Jump & Gravity Physics (Lands on top of surface layer)
    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * delta;
      this.mesh.position.y += this.verticalVelocity * delta;

      if (this.mesh.position.y <= surfaceY) {
        this.mesh.position.y = surfaceY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.state = isMoving ? (this.keys.shift ? 'RUN' : 'WALK') : 'IDLE';
      }
    }

    // Constrain within city boundaries
    this.mesh.position.x = Math.max(-105, Math.min(105, this.mesh.position.x));
    this.mesh.position.z = Math.max(-105, Math.min(105, this.mesh.position.z));

    // Update Skeletal Animations
    this._animatePose(delta);

    // Update 3rd-Person Follow Camera
    if (this.isActive) {
      this._updateCamera();
    }
  }

  /**
   * Check for nearby vehicles to display interaction prompt
   */
  _checkNearbyVehicles() {
    if (!this.trafficSys) return;
    this.nearbyVehicle = this.trafficSys.getNearestVehicle(this.mesh.position, 4.5);
  }

  /**
   * Switch between Harpy (Men) and Xixi (Women) stickman rigs with modular 3D clothes
   */
  setAvatar(avatarId) {
    if (!avatarId) return;
    const cleanId = (avatarId === 'women' || avatarId === 'female' || avatarId === 'xixi') ? 'xixi' : 'harpy';
    this.activeAvatar = cleanId;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hadejia3d_avatar', cleanId);
    }

    const isWomen = (cleanId === 'xixi');
    const newRig = LowPolyHuman.create({
      isPlayer: true,
      scale: 0.65,
      gender: isWomen ? 'women' : 'men',
      avatarId: cleanId,
      style: isWomen ? 'xixi_urban' : 'harpy_urban',
      hairstyle: isWomen ? 'hijab_mayafi' : 'hula_zanna'
    });

    if (newRig && newRig.hips) {
      // Clear previous body components from mesh
      while (this.mesh.children.length > 0) {
        this.mesh.remove(this.mesh.children[0]);
      }
      this.mesh.add(newRig.hips);
      this.rig = newRig;
    }

    if (this.networkMgr) {
      this.networkMgr.setLocalPlayerAvatar(this.activeAvatar);
    }

    if (this.onAvatarChange) {
      this.onAvatarChange(this.activeAvatar);
    }
  }

  /**
   * Procedural Skeletal Animation Engine (Drives Universal Stickman Rig)
   */
  _animatePose(delta) {

    const r = this.rig;
    const t = this.animTime;

    switch (this.state) {
      case 'WALK': {
        const freq = 7.5;
        const phase = t * freq;
        const stride = 0.65;
        const armSwing = 0.52;

        r.leftLegUpper.rotation.x = Math.sin(phase) * stride;
        r.leftLegLower.rotation.x = Math.max(0, -Math.sin(phase) * stride * 0.9);

        r.rightLegUpper.rotation.x = -Math.sin(phase) * stride;
        r.rightLegLower.rotation.x = Math.max(0, Math.sin(phase) * stride * 0.9);

        // Natural arm swing with organic elbow flexion on forward swing
        r.leftArmUpper.rotation.x = -Math.sin(phase) * armSwing;
        r.leftArmUpper.rotation.z = 0.06;
        r.leftArmLower.rotation.x = -(0.18 + Math.max(0, -Math.sin(phase) * 0.38));

        r.rightArmUpper.rotation.x = Math.sin(phase) * armSwing;
        r.rightArmUpper.rotation.z = -0.06;
        r.rightArmLower.rotation.x = -(0.18 + Math.max(0, Math.sin(phase) * 0.38));

        // Natural pelvic list, subtle hip twist and spinal counter-rotation
        r.hips.position.y = 1.35 + Math.abs(Math.sin(phase * 2)) * 0.06;
        r.hips.rotation.y = Math.sin(phase) * 0.04;
        r.torso.rotation.y = -Math.sin(phase) * 0.08;
        r.torso.rotation.x = 0.06;

        // Head gaze stabilization forward
        r.headPivot.rotation.y = -r.torso.rotation.y * 0.85;
        r.headPivot.rotation.x = 0.02;
        break;
      }

      case 'RUN': {
        const freq = 13.0;
        const phase = t * freq;
        const stride = 0.98;
        const armSwing = 0.95;

        r.leftLegUpper.rotation.x = Math.sin(phase) * stride;
        r.leftLegLower.rotation.x = Math.max(0, -Math.sin(phase) * stride * 1.15);

        r.rightLegUpper.rotation.x = -Math.sin(phase) * stride;
        r.rightLegLower.rotation.x = Math.max(0, Math.sin(phase) * stride * 1.15);

        // Athletic bent runner arms pumping
        r.leftArmUpper.rotation.x = -Math.sin(phase) * armSwing;
        r.leftArmUpper.rotation.z = 0.12;
        r.leftArmLower.rotation.x = -0.85;

        r.rightArmUpper.rotation.x = Math.sin(phase) * armSwing;
        r.rightArmUpper.rotation.z = -0.12;
        r.rightArmLower.rotation.x = -0.85;

        // Forward athletic torso tilt & dynamic bounce
        r.torso.rotation.x = 0.24;
        r.torso.rotation.y = -Math.sin(phase) * 0.14;
        r.hips.position.y = 1.35 + Math.abs(Math.sin(phase * 2)) * 0.12;
        r.headPivot.rotation.y = -r.torso.rotation.y * 0.85;
        r.headPivot.rotation.x = -0.14;
        break;
      }

      case 'JUMP': {
        r.leftLegUpper.rotation.x = -0.7;
        r.leftLegLower.rotation.x = 1.0;
        r.rightLegUpper.rotation.x = -0.5;
        r.rightLegLower.rotation.x = 0.8;

        r.leftArmUpper.rotation.x = -1.2;
        r.leftArmUpper.rotation.z = 0.4;
        r.rightArmUpper.rotation.x = -1.2;
        r.rightArmUpper.rotation.z = -0.4;

        r.torso.rotation.x = -0.1;
        break;
      }

      case 'SIT': {
        r.hips.position.y = 0.72;
        r.hips.position.z = -0.2;

        r.leftLegUpper.rotation.x = -Math.PI / 2 + 0.1;
        r.leftLegLower.rotation.x = Math.PI / 2 - 0.1;
        r.rightLegUpper.rotation.x = -Math.PI / 2 + 0.1;
        r.rightLegLower.rotation.x = Math.PI / 2 - 0.1;

        r.leftArmUpper.rotation.x = -0.4;
        r.leftArmLower.rotation.x = -0.6;
        r.rightArmUpper.rotation.x = -0.4;
        r.rightArmLower.rotation.x = -0.6;

        r.torso.rotation.x = -0.05;
        break;
      }

      case 'LAY': {
        this.mesh.rotation.x = -Math.PI / 2;
        r.hips.position.y = 0.28;
        r.hips.position.z = 0;

        r.leftLegUpper.rotation.set(0, 0, 0.1);
        r.leftLegLower.rotation.set(0, 0, 0);
        r.rightLegUpper.rotation.set(0, 0, -0.1);
        r.rightLegLower.rotation.set(0, 0, 0);

        r.leftArmUpper.rotation.set(0, 0, 0.2);
        r.rightArmUpper.rotation.set(0, 0, -0.2);
        r.headPivot.rotation.x = 0.15;
        break;
      }

      case 'WAVE': {
        r.rightArmUpper.rotation.z = -2.4;
        r.rightArmUpper.rotation.x = 0.2;
        r.rightArmLower.rotation.y = Math.sin(t * 9) * 0.6;

        r.headPivot.rotation.y = 0.2;
        r.leftArmUpper.rotation.x = Math.sin(t * 2) * 0.1;
        break;
      }

      case 'DANCE': {
        const danceSpeed = 7.0;
        r.hips.position.x = Math.sin(t * danceSpeed) * 0.15;
        r.hips.rotation.y = Math.sin(t * danceSpeed) * 0.35;
        r.hips.rotation.z = Math.cos(t * danceSpeed) * 0.12;

        r.leftArmUpper.rotation.z = 1.2 + Math.sin(t * danceSpeed) * 0.5;
        r.leftArmUpper.rotation.x = Math.cos(t * danceSpeed) * 0.6;
        r.rightArmUpper.rotation.z = -1.2 - Math.sin(t * danceSpeed) * 0.5;
        r.rightArmUpper.rotation.x = -Math.cos(t * danceSpeed) * 0.6;

        r.headPivot.rotation.z = -Math.sin(t * danceSpeed) * 0.25;
        break;
      }

      case 'IDLE':
      default: {
        const breath = Math.sin(t * 2.4);
        const microGlance = Math.sin(t * 0.7);
        const weightShift = Math.sin(t * 0.35);

        // Subtle breathing & natural standing weight shift
        r.torso.rotation.x = breath * 0.022;
        r.torso.rotation.z = weightShift * 0.015;
        r.hips.rotation.z = -weightShift * 0.018;
        r.hips.position.y = 1.35;

        // Relaxed natural arm hang with subtle elbow flexion
        r.leftArmUpper.rotation.x = 0.06 + breath * 0.03;
        r.leftArmUpper.rotation.z = 0.07;
        r.leftArmLower.rotation.x = -0.22;

        r.rightArmUpper.rotation.x = 0.06 + breath * 0.03;
        r.rightArmUpper.rotation.z = -0.07;
        r.rightArmLower.rotation.x = -0.22;

        // Subtle lifelike gaze micro-movement
        r.headPivot.rotation.y = microGlance * 0.08;
        r.headPivot.rotation.x = 0.03 + Math.cos(t * 0.8) * 0.02;
        break;
      }
    }
  }

  /**
   * 3rd-Person Follow Camera on Foot (Scaled for 1.7m Human)
   */
  _updateCamera() {
    const playerPos = this.mesh.position.clone();

    const dist = 5.6;
    const height = 2.4;

    const camX = playerPos.x - Math.sin(this.cameraYaw) * dist * Math.cos(this.cameraPitch);
    const camZ = playerPos.z - Math.cos(this.cameraYaw) * dist * Math.cos(this.cameraPitch);
    const camY = playerPos.y + height + Math.sin(this.cameraPitch) * dist * 0.5;

    const targetCamPos = new THREE.Vector3(camX, Math.max(1.6, camY), camZ);
    this.camera.position.lerp(targetCamPos, 0.14);

    const lookAtTarget = playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));
    this.camera.lookAt(lookAtTarget);
  }

  setActive(active) {
    this.isActive = active;
    if (active) {
      this.cameraYaw = this.mesh.rotation.y;
      this.cameraPitch = 0.22;
    }
  }
}
