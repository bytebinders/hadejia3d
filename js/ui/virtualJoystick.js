/**
 * VirtualJoystick — Mobile Touch Controls & Dual-Stick Camera Engine
 * 
 * Features:
 * - Dynamic / Fixed Glassmorphism thumbstick on bottom-left
 * - Right-screen touch camera orbit (free look)
 * - Ergonomic touch action buttons: Jump, Sprint, Drive, Talk, and More
 * - Multi-touch simultaneous movement, steering, and camera rotation
 * - Auto-detects mobile touch devices or can be toggled
 */

export class VirtualJoystick {
  constructor(app) {
    this.app = app;

    // Joystick state
    this.touchId = null;
    this.basePos = { x: 0, y: 0 };
    this.currentPos = { x: 0, y: 0 };
    this.maxRadius = 48; // Max thumbstick deflection in pixels
    this.isDragging = false;

    // Camera touch look state
    this.lookTouchId = null;
    this.lastLookPos = { x: 0, y: 0 };

    this._cacheDOMElements();
    this._bindEvents();
    this._detectMobile();
  }

  _cacheDOMElements() {
    this.container = document.getElementById('mobile-controls-container');
    this.joystickZone = document.getElementById('virtual-joystick-zone');
    this.base = document.getElementById('joystick-base');
    this.knob = document.getElementById('joystick-knob');
    this.touchLookZone = document.getElementById('mobile-touch-look-zone');

    // Mobile Action buttons
    this.btnJump = document.getElementById('btn-m-jump');
    this.btnRun = document.getElementById('btn-m-run');
    this.btnCar = document.getElementById('btn-m-car');
    this.btnTalk = document.getElementById('btn-m-talk');
    this.btnVoice = document.getElementById('btn-m-voice');
    this.btnMore = document.getElementById('btn-m-more');
    this.moreTray = document.getElementById('mobile-more-tray');
    this.btnSit = document.getElementById('btn-m-sit');
    this.btnLay = document.getElementById('btn-m-lay');
    this.btnWave = document.getElementById('btn-m-wave');
    this.btnDance = document.getElementById('btn-m-dance');
    this.toggleJoystick = document.getElementById('toggle-joystick');
  }

  _detectMobile() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    if (this.toggleJoystick && !this.userExplicitlyToggled) {
      this.toggleJoystick.checked = isTouch;
    }
    const forceShow = this.toggleJoystick ? this.toggleJoystick.checked : false;

    if (this.container) {
      if (isTouch || forceShow) {
        this.container.classList.remove('desktop-hidden');
      } else {
        this.container.classList.add('desktop-hidden');
      }
    }
  }

  _bindEvents() {
    if (!this.joystickZone || !this.knob || !this.base) return;

    // --- 1. Virtual Joystick Touch / Pointer Handling ---
    const handleJoystickStart = (e) => {
      e.preventDefault();
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      this.touchId = e.changedTouches ? touch.identifier : (e.pointerId || 'mouse');

      const rect = this.base.getBoundingClientRect();
      this.basePos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      this.isDragging = true;
      this.base.classList.add('active');
      this._updateJoystick(touch.clientX, touch.clientY);
    };

    const handleJoystickMove = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();

      let touch = null;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchId) {
            touch = e.changedTouches[i];
            break;
          }
        }
      } else if (e.pointerId === this.touchId || this.touchId === 'mouse') {
        touch = e;
      }

      if (touch) {
        this._updateJoystick(touch.clientX, touch.clientY);
      }
    };

    const handleJoystickEnd = (e) => {
      if (!this.isDragging) return;

      let match = false;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchId) {
            match = true;
            break;
          }
        }
      } else {
        match = true;
      }

      if (match) {
        this.isDragging = false;
        this.touchId = null;
        this.base.classList.remove('active');
        this.knob.style.transform = `translate(0px, 0px)`;
        if (this.app.playerCtrl) {
          this.app.playerCtrl.setJoystick(0, 0);
        }
      }
    };

    // Bind touch events on joystick zone
    this.joystickZone.addEventListener('touchstart', handleJoystickStart, { passive: false });
    window.addEventListener('touchmove', handleJoystickMove, { passive: false });
    window.addEventListener('touchend', handleJoystickEnd, { passive: false });
    window.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

    // Also support mouse testing in browser emulator
    this.joystickZone.addEventListener('mousedown', handleJoystickStart);
    window.addEventListener('mousemove', handleJoystickMove);
    window.addEventListener('mouseup', handleJoystickEnd);

    // --- 2. Right-Side Touch Camera Look Zone ---
    if (this.touchLookZone) {
      this.touchLookZone.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        this.lookTouchId = touch.identifier;
        this.lastLookPos = { x: touch.clientX, y: touch.clientY };
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (this.lookTouchId === null) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.lookTouchId) {
            const deltaX = t.clientX - this.lastLookPos.x;
            const deltaY = t.clientY - this.lastLookPos.y;
            this.lastLookPos = { x: t.clientX, y: t.clientY };

            if (this.app.playerCtrl && this.app.playerCtrl.isActive) {
              this.app.playerCtrl.rotateCamera(deltaX * 0.007, deltaY * 0.006);
            }
            break;
          }
        }
      }, { passive: true });

      const endLook = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.lookTouchId) {
            this.lookTouchId = null;
            break;
          }
        }
      };

      window.addEventListener('touchend', endLook);
      window.addEventListener('touchcancel', endLook);
    }

    // --- 3. Mobile Action Buttons ---
    if (this.btnJump) {
      this.btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.app.playerCtrl) this.app.playerCtrl.jump();
        if (this.app.soundSys) this.app.soundSys.playClick();
      });
      this.btnJump.addEventListener('click', () => {
        if (this.app.playerCtrl) this.app.playerCtrl.jump();
      });
    }

    if (this.btnRun) {
      this.btnRun.addEventListener('click', () => {
        if (!this.app.playerCtrl) return;
        const isRunning = !this.app.playerCtrl.keys.shift;
        this.app.playerCtrl.setRun(isRunning);
        this.btnRun.classList.toggle('active', isRunning);
        if (this.app.soundSys) this.app.soundSys.playClick();
      });
    }

    if (this.btnCar) {
      this.btnCar.addEventListener('click', () => {
        if (this.app.playerCtrl) {
          this.app.playerCtrl.toggleVehicle();
          if (this.app.soundSys) this.app.soundSys.playChime(true);
        }
      });
    }

    if (this.btnTalk) {
      this.btnTalk.addEventListener('click', () => {
        if (this.app.hudCtrl) {
          this.app.hudCtrl._handleTalkTrigger();
        }
      });
    }

    if (this.btnVoice) {
      this.btnVoice.addEventListener('click', async () => {
        if (this.app.networkMgr && this.app.networkMgr.voiceChat) {
          await this.app.networkMgr.voiceChat.toggleMic();
        }
      });
    }

    if (this.btnMore && this.moreTray) {
      this.btnMore.addEventListener('click', () => {
        this.moreTray.classList.toggle('hidden');
        this.btnMore.classList.toggle('active');
      });
    }

    if (this.btnSit) {
      this.btnSit.addEventListener('click', () => {
        if (this.app.playerCtrl) this.app.playerCtrl.toggleSit();
        if (this.moreTray) this.moreTray.classList.add('hidden');
      });
    }

    if (this.btnLay) {
      this.btnLay.addEventListener('click', () => {
        if (this.app.playerCtrl) this.app.playerCtrl.toggleLay();
        if (this.moreTray) this.moreTray.classList.add('hidden');
      });
    }

    if (this.btnWave) {
      this.btnWave.addEventListener('click', () => {
        if (this.app.playerCtrl) this.app.playerCtrl.wave();
        if (this.moreTray) this.moreTray.classList.add('hidden');
      });
    }

    if (this.btnDance) {
      this.btnDance.addEventListener('click', () => {
        if (this.app.playerCtrl) this.app.playerCtrl.dance();
        if (this.moreTray) this.moreTray.classList.add('hidden');
      });
    }

    if (this.toggleJoystick) {
      this.toggleJoystick.addEventListener('change', (e) => {
        this.userExplicitlyToggled = true;
        if (e.target.checked) {
          this.container.classList.remove('desktop-hidden');
        } else {
          this.container.classList.add('desktop-hidden');
        }
      });
    }

    // Auto-update on resize / orientation change
    window.addEventListener('resize', () => this._detectMobile());
    window.addEventListener('orientationchange', () => setTimeout(() => this._detectMobile(), 200));
  }

  _updateJoystick(clientX, clientY) {
    const dx = clientX - this.basePos.x;
    const dy = clientY - this.basePos.y;
    const dist = Math.hypot(dx, dy);

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, this.maxRadius);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    this.knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    // Normalized input vector: -1 to 1
    // X > 0 is Right, Y > 0 is Forward (which is -knobY)
    const normX = knobX / this.maxRadius;
    const normY = -knobY / this.maxRadius;

    if (this.app.playerCtrl) {
      this.app.playerCtrl.setJoystick(normX, normY);
    }
  }

  /**
   * Called every frame from main loop to update button contextual glows
   */
  update() {
    const pc = this.app.playerCtrl;
    if (!pc) return;

    // 1. Vehicle Button Glow
    if (this.btnCar) {
      if (pc.isDriving) {
        this.btnCar.classList.add('active');
        this.btnCar.innerHTML = '<span>🚪</span> Exit';
      } else if (pc.nearbyVehicle) {
        this.btnCar.classList.add('glow-pulse');
        this.btnCar.classList.remove('active');
        this.btnCar.innerHTML = '<span>🚗</span> Drive';
      } else {
        this.btnCar.classList.remove('glow-pulse');
        this.btnCar.classList.remove('active');
        this.btnCar.innerHTML = '<span>🚗</span> Drive';
      }
    }

    // 2. Citizen Talk Button Glow
    if (this.btnTalk) {
      if (pc.isTalking) {
        this.btnTalk.classList.add('active');
      } else if (pc.nearbyCitizen && !pc.isDriving) {
        this.btnTalk.classList.add('glow-pulse');
        this.btnTalk.classList.remove('active');
      } else {
        this.btnTalk.classList.remove('glow-pulse');
        this.btnTalk.classList.remove('active');
      }
    }
  }
}
