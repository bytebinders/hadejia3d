import * as THREE from 'three';

/**
 * HUDController — Connects Glassmorphism HUD, Controls Drawer,
 * Raycasting Inspector, Camera Views, and Metric Telemetry.
 */

export class HUDController {
  constructor(app) {
    this.app = app;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.selectedBuilding = null;
    this.highlightBox = null;

    this._cacheDOMElements();
    this._bindEvents();
    this._initHighlightBox();
  }

  _cacheDOMElements() {
    // Header Metrics
    this.metricTime = document.getElementById('metric-time');
    this.metricTimeIcon = document.getElementById('metric-time-icon');
    this.metricFps = document.getElementById('metric-fps');
    this.metricCitizens = document.getElementById('metric-citizens');
    this.metricTraffic = document.getElementById('metric-traffic');
    this.metricPlayers = document.getElementById('metric-players');

    // Controls
    this.btnAudio = document.getElementById('btn-audio-toggle');
    this.audioIcon = document.getElementById('audio-icon');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.btnCollapseDrawer = document.getElementById('btn-collapse-drawer');
    this.controlsPanel = document.getElementById('controls-panel');

    // Time
    this.timeSlider = document.getElementById('time-slider');
    this.timeDisplay = document.getElementById('time-display');
    this.toggleDayCycle = document.getElementById('toggle-day-cycle');
    this.timePills = document.querySelectorAll('.pill-btn');

    // Weather
    this.weatherBtns = document.querySelectorAll('.weather-btn');

    // Simulation Toggles
    this.toggleTraffic = document.getElementById('toggle-traffic');
    this.toggleMonorail = document.getElementById('toggle-monorail');
    this.toggleClouds = document.getElementById('toggle-clouds');
    this.toggleAutorotate = document.getElementById('toggle-autorotate');

    // Action buttons
    this.btnRegenerate = document.getElementById('btn-regenerate');
    this.btnResetCam = document.getElementById('btn-reset-cam');

    // Camera preset buttons
    this.camBtns = document.querySelectorAll('.cam-btn');

    // Building Inspector Card
    this.inspectorCard = document.getElementById('inspector-card');
    this.btnCloseInspector = document.getElementById('btn-close-inspector');
    this.cardDistrict = document.getElementById('card-district');
    this.cardTitle = document.getElementById('card-title');
    this.cardDesc = document.getElementById('card-desc');
    this.cardHeight = document.getElementById('card-height');
    this.cardFloors = document.getElementById('card-floors');
    this.cardRating = document.getElementById('card-rating');
    this.cardOccupancy = document.getElementById('card-occupancy');
    this.cardTenants = document.getElementById('card-tenants');
    this.btnFocusBuilding = document.getElementById('btn-focus-building');

    // Player Control HUD
    this.playerHud = document.getElementById('player-hud');
    this.playerStateBadge = document.getElementById('player-state-badge');
    this.btnPlayerRun = document.getElementById('btn-player-run');
    this.btnPlayerJump = document.getElementById('btn-player-jump');
    this.btnPlayerSit = document.getElementById('btn-player-sit');
    this.btnPlayerLay = document.getElementById('btn-player-lay');
    this.btnPlayerWave = document.getElementById('btn-player-wave');
    this.btnPlayerDance = document.getElementById('btn-player-dance');
    this.btnPlayerCar = document.getElementById('btn-player-car');
    this.btnCarText = document.getElementById('btn-car-text');
    this.vehiclePrompt = document.getElementById('vehicle-prompt');
    this.vehiclePromptText = document.getElementById('vehicle-prompt-text');

    // Citizen Dialogue & Talk HUD
    this.btnPlayerTalk = document.getElementById('btn-player-talk');
    this.citizenPrompt = document.getElementById('citizen-prompt');
    this.citizenPromptText = document.getElementById('citizen-prompt-text');
    this.citizenDialogueModal = document.getElementById('citizen-dialogue-modal');
    this.dialogueAvatar = document.getElementById('dialogue-avatar');
    this.dialogueName = document.getElementById('dialogue-name');
    this.dialogueTitle = document.getElementById('dialogue-title');
    this.dialogueText = document.getElementById('dialogue-text');
    this.btnCloseDialogue = document.getElementById('btn-close-dialogue');
    this.btnDialogueNext = document.getElementById('btn-dialogue-next');
    this.btnDialogueWave = document.getElementById('btn-dialogue-wave');
    this.btnDialogueBye = document.getElementById('btn-dialogue-bye');

    // Toast
    this.toastNotification = document.getElementById('toast-notification');
    this.toastText = document.getElementById('toast-text');
    this.toastIcon = document.getElementById('toast-icon');

    // Multiplayer Wi-Fi Controls
    this.wifiUrlInput = document.getElementById('wifi-url-input');
    this.btnCopyWifi = document.getElementById('btn-copy-wifi-url');
    this.mpChatInput = document.getElementById('mp-chat-input');
    this.btnSendChat = document.getElementById('btn-send-chat');

    // Voice Chat Controls & Telemetry
    this.btnVoiceToggle = document.getElementById('btn-voice-toggle');
    this.voiceIcon = document.getElementById('voice-icon');
    this.voiceBtnLabel = document.getElementById('voice-btn-label');
    this.btnPlayerVoice = document.getElementById('btn-player-voice');
    this.playerVoiceIcon = document.getElementById('player-voice-icon');
    this.btnPlayerVoiceText = document.getElementById('btn-player-voice-text');
    this.btnMobileVoice = document.getElementById('btn-m-voice');

    // Voice Proximity Status Bar
    this.voiceProximityBar = document.getElementById('voice-proximity-bar');
    this.voiceProximityIcon = document.getElementById('voice-proximity-icon');
    this.voiceProximitySpeaker = document.getElementById('voice-proximity-speaker');
    this.voiceProximityDist = document.getElementById('voice-proximity-dist');
    this.voiceProximityDesc = document.getElementById('voice-proximity-desc');
    this.voiceProximityLevel = document.getElementById('voice-proximity-level');
    this.voiceHideTimer = null;

    // Mic Security Context Modal
    this.micSecurityModal = document.getElementById('mic-security-modal');
    this.btnCloseMicModal = document.getElementById('btn-close-mic-modal');
    this.btnDismissMicModal = document.getElementById('btn-dismiss-mic-modal');
    this.linkMicLocalhost = document.getElementById('link-mic-localhost');
    this.linkMicHttps = document.getElementById('link-mic-https');
  }

  _initHighlightBox() {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    this.highlightBox = new THREE.LineSegments(edges, lineMat);
    this.highlightBox.visible = false;
    this.app.scene.add(this.highlightBox);
  }

  _bindEvents() {
    // 1. Time Slider
    this.timeSlider.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      this.app.lightingMgr.setTime(val);
      this._updateTimeDisplay(val);
      this._setActiveTimePill(val);
    });

    // Time Quick Pills
    this.timePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const t = parseFloat(pill.dataset.time);
        this.timeSlider.value = t;
        this.app.lightingMgr.setTime(t);
        this._updateTimeDisplay(t);
        this._setActiveTimePill(t);
        this.app.soundSys.playClick();
      });
    });

    // Auto Sun Cycle Checkbox
    this.toggleDayCycle.addEventListener('change', e => {
      this.app.lightingMgr.autoCycle = e.target.checked;
      this.app.soundSys.playClick();
    });

    // 2. Weather Buttons
    this.weatherBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.weatherBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const weather = btn.dataset.weather;
        this.app.setWeather(weather);
        this.app.soundSys.playClick();
        this.showToast(weather === 'rain' ? '🌧️ Rain storm active' : (weather === 'fog' ? '🌫️ Neon mist rolling in' : '☀️ Clear skies'));
      });
    });

    // 3. Simulation Toggles
    this.toggleTraffic.addEventListener('change', e => {
      this.app.trafficSys.trafficGroup.visible = e.target.checked;
      this.app.soundSys.playClick();
    });

    this.toggleMonorail.addEventListener('change', e => {
      this.app.monorailSys.group.visible = e.target.checked;
      this.app.soundSys.playClick();
    });

    this.toggleClouds.addEventListener('change', e => {
      this.app.skySys.group.visible = e.target.checked;
      this.app.soundSys.playClick();
    });

    this.toggleAutorotate.addEventListener('change', e => {
      this.app.controls.autoRotate = e.target.checked;
      this.app.soundSys.playClick();
    });

    // 4. Action Buttons
    this.btnRegenerate.addEventListener('click', () => {
      this.app.regenerateCity();
      this.app.soundSys.playChime(true);
      this.showToast('🎲 New City Seed Generated!');
    });

    this.btnResetCam.addEventListener('click', () => {
      this.app.setCameraPreset('player');
      this.app.soundSys.playClick();
      this.showToast('Camera reset to Player view', '🏃‍♂️');
    });

    // 5. Camera Presets
    this.camBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this._setActiveCamBtn(preset);
        this.app.setCameraPreset(preset);
        this.app.soundSys.playClick();

        if (preset === 'player') {
          this.showToast('🏃‍♂️ Player Mode: WASD to Move, Shift to Run, Space to Jump, C to Sit, X to Lay!');
        } else if (preset === 'monorail') {
          this.showToast('🚆 Locked to Elevated Monorail');
        } else if (preset === 'followCar') {
          this.showToast('🏎️ Chasing Traffic Vehicle');
        }
      });
    });

    // 5b. Player Action Buttons
    if (this.btnPlayerRun) {
      this.btnPlayerRun.addEventListener('click', () => {
        const isRunning = !this.app.playerCtrl.keys.shift;
        this.app.playerCtrl.setRun(isRunning);
        this.btnPlayerRun.classList.toggle('active', isRunning);
        this.app.soundSys.playClick();
      });

      this.btnPlayerJump.addEventListener('click', () => {
        this.app.playerCtrl.jump();
        this.app.soundSys.playClick();
      });

      this.btnPlayerSit.addEventListener('click', () => {
        this.app.playerCtrl.toggleSit();
        this.app.soundSys.playClick();
      });

      this.btnPlayerLay.addEventListener('click', () => {
        this.app.playerCtrl.toggleLay();
        this.app.soundSys.playClick();
      });

      this.btnPlayerWave.addEventListener('click', () => {
        this.app.playerCtrl.wave();
        this.app.soundSys.playClick();
      });

      this.btnPlayerDance.addEventListener('click', () => {
        this.app.playerCtrl.dance();
        this.app.soundSys.playClick();
      });

      if (this.btnPlayerCar) {
        this.btnPlayerCar.addEventListener('click', () => {
          this.app.playerCtrl.toggleVehicle();
          this.app.soundSys.playChime(true);
        });
      }

      if (this.btnPlayerTalk) {
        this.btnPlayerTalk.addEventListener('click', () => {
          this._handleTalkTrigger();
        });
      }

      if (this.citizenPrompt) {
        this.citizenPrompt.addEventListener('click', () => {
          this._handleTalkTrigger();
        });
      }

      if (this.btnCloseDialogue) {
        this.btnCloseDialogue.addEventListener('click', () => {
          this._closeDialogue();
        });
      }

      if (this.btnDialogueBye) {
        this.btnDialogueBye.addEventListener('click', () => {
          this._closeDialogue();
        });
      }

      if (this.btnDialogueNext) {
        this.btnDialogueNext.addEventListener('click', () => {
          const next = this.app.playerCtrl.nextTalk();
          if (next && this.dialogueText) {
            this.dialogueText.textContent = `"${next.text}"`;
          }
        });
      }

      if (this.btnDialogueWave) {
        this.btnDialogueWave.addEventListener('click', () => {
          this.app.playerCtrl.waveToCitizen();
        });
      }
    }

    // 6. Header Audio & Voice Chat
    const handleVoiceToggle = async () => {
      if (this.app.networkMgr && this.app.networkMgr.voiceChat) {
        await this.app.networkMgr.voiceChat.toggleMic();
      }
    };

    if (this.btnVoiceToggle) {
      this.btnVoiceToggle.addEventListener('click', handleVoiceToggle);
    }

    if (this.btnPlayerVoice) {
      this.btnPlayerVoice.addEventListener('click', handleVoiceToggle);
    }

    if (this.btnCloseMicModal) {
      this.btnCloseMicModal.addEventListener('click', () => {
        if (this.micSecurityModal) this.micSecurityModal.classList.add('hidden');
      });
    }

    if (this.btnDismissMicModal) {
      this.btnDismissMicModal.addEventListener('click', () => {
        if (this.micSecurityModal) this.micSecurityModal.classList.add('hidden');
      });
    }

    this.btnAudio.addEventListener('click', () => {
      const isEnabled = this.app.soundSys.toggle();
      this.audioIcon.textContent = isEnabled ? '🔊' : '🔇';
      this.showToast(isEnabled ? '🔊 Procedural City Audio Enabled' : '🔇 Audio Muted');
    });

    this.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    this.btnCollapseDrawer.addEventListener('click', () => {
      const isCollapsed = this.controlsPanel.classList.toggle('collapsed');
      this.btnCollapseDrawer.textContent = isCollapsed ? '+' : '−';
    });

    // 7. Raycasting Building Click (with Drag Filter so camera rotation doesn't falsely click)
    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownTime = 0;

    window.addEventListener('pointerdown', e => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      pointerDownTime = performance.now();
    });

    window.addEventListener('pointerup', e => {
      // Ignore if user was dragging the camera or joystick (moved > 8px or held > 600ms)
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      const elapsed = performance.now() - pointerDownTime;
      if (dist > 8 || elapsed > 600) return;

      // Ignore clicks on any UI or control elements
      if (e.target.closest('.hud-header') ||
          e.target.closest('.minimap-widget') ||
          e.target.closest('.city-map-modal') ||
          e.target.closest('.controls-drawer') ||
          e.target.closest('.inspector-card') ||
          e.target.closest('.mobile-controls-layer') ||
          e.target.closest('.citizen-dialogue-modal') ||
          e.target.closest('.player-hud') ||
          e.target.closest('.vehicle-prompt') ||
          e.target.closest('.citizen-prompt') ||
          e.target.closest('.toast-pill')) {
        return;
      }
      this._onPointerClick(e);
    });

    // Close Inspector
    this.btnCloseInspector.addEventListener('click', () => {
      this.inspectorCard.classList.add('hidden');
      this.highlightBox.visible = false;
      this.selectedBuilding = null;
    });

    // Focus Camera on Building
    this.btnFocusBuilding.addEventListener('click', () => {
      if (this.selectedBuilding) {
        this.app.focusOnObject(this.selectedBuilding);
        this.app.soundSys.playChime(true);
      }
    });

    // 8. Multiplayer Wi-Fi Networking & Chat
    this._bindMultiplayerEvents();
  }

  _bindMultiplayerEvents() {
    // Dynamically adjust Wi-Fi Join URL if accessed from another device
    if (this.wifiUrlInput) {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        this.wifiUrlInput.value = `${window.location.origin}`;
      }
    }

    if (this.btnCopyWifi && this.wifiUrlInput) {
      this.btnCopyWifi.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(this.wifiUrlInput.value);
          this.btnCopyWifi.textContent = '✅ Copied!';
          this.showToast('Copied Wi-Fi join link! Open on any device on same Wi-Fi.', '🌐');
          setTimeout(() => {
            this.btnCopyWifi.textContent = '📋 Copy';
          }, 2500);
        } catch (e) {
          this.wifiUrlInput.select();
          document.execCommand('copy');
          this.showToast('Wi-Fi link selected. Press Ctrl+C to copy.', '📋');
        }
      });
    }

    // 3D Chat speech bubble sending
    const handleSendChat = () => {
      if (!this.mpChatInput) return;
      const text = this.mpChatInput.value.trim();
      if (!text) return;
      if (this.app.networkMgr) {
        this.app.networkMgr.sendChat(text);
      }
      this.mpChatInput.value = '';
    };

    if (this.btnSendChat) {
      this.btnSendChat.addEventListener('click', handleSendChat);
    }
    if (this.mpChatInput) {
      this.mpChatInput.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Avoid triggering movement/game keys while typing
        if (e.key === 'Enter') {
          handleSendChat();
        }
      });
      this.mpChatInput.addEventListener('keyup', (e) => {
        e.stopPropagation();
      });
    }

    // Network manager telemetry callbacks
    if (this.app.networkMgr) {
      this.app.networkMgr.onPlayerCountChange = (count) => {
        if (this.metricPlayers) {
          this.metricPlayers.textContent = `${count} ${count === 1 ? 'Player' : 'Players'}`;
        }
      };

      this.app.networkMgr.onPlayerJoined = (player) => {
        this.showToast(`${player.name || 'New Player'} connected over Wi-Fi!`, '🌐');
      };

      this.app.networkMgr.onPlayerLeft = (id) => {
        this.showToast('A player disconnected from Wi-Fi grid', '👋');
      };

      // Real-time Spatial Proximity Voice Chat callbacks
      if (this.app.networkMgr.voiceChat) {
        const vc = this.app.networkMgr.voiceChat;

        vc.onMicStateChange = (isActive, errorMsg, securityInfo = null) => {
          if (errorMsg) {
            if (securityInfo && securityInfo.isHttpIp && this.micSecurityModal) {
              if (this.linkMicHttps) this.linkMicHttps.href = securityInfo.httpsUrl;
              this.micSecurityModal.classList.remove('hidden');
            } else {
              this.showToast(`Microphone: ${errorMsg}`, '⚠️');
            }
            return;
          }

          const labelText = isActive ? 'Mic On' : 'Mic Off';
          if (this.voiceBtnLabel) this.voiceBtnLabel.textContent = labelText;
          if (this.btnPlayerVoiceText) this.btnPlayerVoiceText.textContent = labelText;

          if (this.btnVoiceToggle) this.btnVoiceToggle.classList.toggle('active', isActive);
          if (this.btnPlayerVoice) this.btnPlayerVoice.classList.toggle('active', isActive);
          if (this.btnMobileVoice) this.btnMobileVoice.classList.toggle('active', isActive);

          if (isActive) {
            this.showToast('🎙️ Voice Chat Active — Speak to nearby players!', '🎙️');
          } else {
            this.showToast('Microphone muted', '🔇');
          }
        };

        vc.onLocalSpeaking = (speaking) => {
          if (this.btnVoiceToggle) this.btnVoiceToggle.classList.toggle('speaking', speaking);
          if (this.btnPlayerVoice) this.btnPlayerVoice.classList.toggle('speaking', speaking);
          if (this.btnMobileVoice) this.btnMobileVoice.classList.toggle('speaking', speaking);
        };

        vc.onRemoteSpeaking = (id, name, distance, volume, canHear) => {
          if (!this.voiceProximityBar) return;

          this.voiceProximityBar.classList.remove('hidden');

          if (this.voiceProximitySpeaker) this.voiceProximitySpeaker.textContent = name;
          if (this.voiceProximityDist) this.voiceProximityDist.textContent = `${Math.round(distance)}m away`;

          if (canHear) {
            this.voiceProximityBar.classList.remove('out-of-range');
            const volPercent = Math.max(5, Math.round(volume * 100));
            if (this.voiceProximityDesc) {
              this.voiceProximityDesc.textContent = `Audible • ${volPercent}% volume`;
            }
            if (this.voiceProximityLevel) {
              this.voiceProximityLevel.style.width = `${volPercent}%`;
            }
          } else {
            this.voiceProximityBar.classList.add('out-of-range');
            if (this.voiceProximityDesc) {
              this.voiceProximityDesc.textContent = 'Too far to hear (>50m away)';
            }
            if (this.voiceProximityLevel) {
              this.voiceProximityLevel.style.width = '0%';
            }
          }

          // Auto-hide bar after 450ms of silence from remote speaker
          if (this.voiceHideTimer) clearTimeout(this.voiceHideTimer);
          this.voiceHideTimer = setTimeout(() => {
            if (this.voiceProximityBar) {
              this.voiceProximityBar.classList.add('hidden');
            }
          }, 450);
        };
      }
    }
  }

  _setActiveTimePill(timeVal) {
    this.timePills.forEach(pill => {
      const pt = parseFloat(pill.dataset.time);
      if (Math.abs(pt - timeVal) < 2.0) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  _setActiveCamBtn(preset) {
    this.camBtns.forEach(b => {
      if (b.dataset.preset === preset) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  _updateTimeDisplay(hours) {
    const hh = Math.floor(hours);
    const mm = Math.floor((hours - hh) * 60);
    const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    this.timeDisplay.textContent = timeStr;
    this.metricTime.textContent = timeStr;

    // Icon
    if (hours >= 6 && hours < 18) {
      this.metricTimeIcon.textContent = '☀️';
    } else if (hours >= 18 && hours < 20) {
      this.metricTimeIcon.textContent = '🌇';
    } else {
      this.metricTimeIcon.textContent = '🌙';
    }
  }

  _onPointerClick(e) {
    if (!this.app.cityBuilder || !this.app.cityBuilder.cityGroup) return;

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.app.camera);

    // Raycast against the full city hierarchy (ground, roads, water, buildings, props)
    // so the ray accurately hits the ground first instead of passing through to background buildings
    const intersects = this.raycaster.intersectObjects(this.app.cityBuilder.cityGroup.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const buildingGroup = hit.userData ? hit.userData.parentBuilding : null;

      // Only inspect if the user directly clicked on an actual building
      if (buildingGroup && buildingGroup.userData && buildingGroup.userData.name) {
        this._showBuildingInspector(buildingGroup);
        this.app.soundSys.playChime(true);
        return;
      }
    }

    // If clicked on ground, roads, canal, trees, or empty sky: cleanly deselect and hide inspector
    if (this.selectedBuilding) {
      this.inspectorCard.classList.add('hidden');
      this.highlightBox.visible = false;
      this.selectedBuilding = null;
    }
  }

  _showBuildingInspector(buildingGroup) {
    this.selectedBuilding = buildingGroup;
    const data = buildingGroup.userData;

    this.cardTitle.textContent = data.name || 'Metropolis Tower';
    this.cardDistrict.textContent = data.district || 'DOWNTOWN';
    this.cardHeight.textContent = data.height || '120 m';
    this.cardFloors.textContent = data.floors || '30 LVL';
    this.cardRating.textContent = data.energyRating || 'A+ Eco';
    this.cardOccupancy.textContent = data.occupancy || '95%';

    // Tenants
    this.cardTenants.innerHTML = '';
    const tenants = data.tenants || ['Polis Ventures', 'Apex Media'];
    tenants.forEach(t => {
      const tag = document.createElement('span');
      tag.className = 'tenant-tag';
      tag.textContent = t;
      this.cardTenants.appendChild(tag);
    });

    this.inspectorCard.classList.remove('hidden');

    // Position highlight bounding box around building
    const bbox = new THREE.Box3().setFromObject(buildingGroup);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    this.highlightBox.scale.copy(size.addScalar(0.8));
    this.highlightBox.position.copy(center);
    this.highlightBox.visible = true;
  }

  showToast(message, icon = '✨') {
    this.toastText.textContent = message;
    this.toastIcon.textContent = icon;
    this.toastNotification.classList.remove('hidden');

    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.toastNotification.classList.add('hidden');
    }, 2800);
  }

  updateMetrics(fps, timeHours) {
    this.metricFps.textContent = Math.round(fps);
    this._updateTimeDisplay(timeHours);

    if (this.playerStateBadge && this.app.playerCtrl) {
      const pc = this.app.playerCtrl;
      this.playerStateBadge.textContent = pc.state;

      if (this.btnPlayerRun) {
        this.btnPlayerRun.classList.toggle('active', pc.keys.shift);
      }
      if (this.btnPlayerSit) {
        this.btnPlayerSit.classList.toggle('active', pc.state === 'SIT');
      }
      if (this.btnPlayerLay) {
        this.btnPlayerLay.classList.toggle('active', pc.state === 'LAY');
      }
      if (this.btnPlayerDance) {
        this.btnPlayerDance.classList.toggle('active', pc.state === 'DANCE');
      }
      if (this.btnPlayerWave) {
        this.btnPlayerWave.classList.toggle('active', pc.state === 'WAVE');
      }

      // Vehicle Drive button & Proximity Prompt
      if (pc.isDriving) {
        if (this.btnCarText) this.btnCarText.textContent = 'Exit Car';
        if (this.btnPlayerCar) this.btnPlayerCar.classList.add('active');
        if (this.vehiclePrompt) this.vehiclePrompt.classList.add('hidden');
      } else {
        if (this.btnCarText) this.btnCarText.textContent = 'Drive Car';
        if (this.btnPlayerCar) this.btnPlayerCar.classList.remove('active');

        if (this.vehiclePrompt) {
          if (pc.nearbyVehicle) {
            if (this.vehiclePromptText) {
              this.vehiclePromptText.innerHTML = `Nearby ${pc.nearbyVehicle.name} — Press <kbd>E</kbd> to Drive`;
            }
            this.vehiclePrompt.classList.remove('hidden');
          } else {
            this.vehiclePrompt.classList.add('hidden');
          }
        }

        // Citizen Interaction Proximity Prompt & Talk state
        if (this.btnPlayerTalk) {
          this.btnPlayerTalk.classList.toggle('active', pc.isTalking);
        }

        if (this.citizenPrompt) {
          if (!pc.isDriving && pc.nearbyCitizen && !pc.isTalking && !pc.nearbyVehicle) {
            const c = pc.nearbyCitizen.citizen;
            if (this.citizenPromptText) {
              this.citizenPromptText.innerHTML = `Nearby ${c.name} (${c.title}) — Press <kbd>T</kbd> to Talk`;
            }
            this.citizenPrompt.classList.remove('hidden');
          } else {
            this.citizenPrompt.classList.add('hidden');
          }
        }

        // If player opened conversation via keypress 'T' or 'E'
        if (pc.isTalking && this.citizenDialogueModal && this.citizenDialogueModal.classList.contains('hidden') && pc.currentTalkCitizen) {
          const c = pc.currentTalkCitizen;
          const line = c.dialogueLines ? c.dialogueLines[c.dialogueIndex % c.dialogueLines.length] : 'Hello!';
          this._showDialogue({
            avatar: c.avatar,
            name: c.name,
            title: c.title,
            text: line
          });
        }
      }
    }
  }

  _handleTalkTrigger() {
    const pc = this.app.playerCtrl;
    if (pc.isTalking) {
      this._closeDialogue();
    } else if (pc.nearbyCitizen) {
      const data = pc.startTalk(pc.nearbyCitizen.citizen);
      if (data) {
        this._showDialogue(data);
      }
    }
  }

  _showDialogue(data) {
    if (!this.citizenDialogueModal) return;
    if (this.dialogueAvatar) this.dialogueAvatar.textContent = data.avatar || '🧑‍💼';
    if (this.dialogueName) this.dialogueName.textContent = data.name || 'Citizen';
    if (this.dialogueTitle) this.dialogueTitle.textContent = data.title || 'Metropolis Local';
    if (this.dialogueText) this.dialogueText.textContent = `"${data.text}"`;
    this.citizenDialogueModal.classList.remove('hidden');
  }

  _closeDialogue() {
    this.app.playerCtrl.endTalk();
    if (this.citizenDialogueModal) {
      this.citizenDialogueModal.classList.add('hidden');
    }
  }
}
