import * as THREE from 'three';
import { LowPolyHuman } from '../character/lowPolyHuman.js';
import { VoiceChatManager } from '../audio/voiceChatManager.js';

/**
 * NetworkManager — Real-Time Wi-Fi / LAN Multiplayer Synchronization Engine
 * 
 * Features:
 * - Automatic WebSocket connection to host server on same Wi-Fi
 * - Rate-limited local player state broadcasting (20 Hz)
 * - Remote player 3D mesh instancing with customized low-poly outfits
 * - Floating 3D Player Name Tags & Speech Bubbles
 * - Real-Time Proximity Voice Chat with 3D Spatial Audio & Distance Attenuation
 * - Butter-smooth position and rotation interpolation (lerping)
 * - Complete skeletal animation synchronization for remote players (walk, run, jump, sit, lay, wave, dance)
 * - Event callbacks for HUD telemetry (player count, join/leave toasts, chat)
 */

export class NetworkManager {
  constructor(scene, playerCtrl, soundSys = null) {
    this.scene = scene;
    this.playerCtrl = playerCtrl;
    this.soundSys = soundSys;

    this.ws = null;
    this.isConnected = false;
    this.localPlayerId = null;
    this.localPlayerName = 'Citizen 1';
    this.remotePlayers = new Map(); // id -> remote player object

    this.group = new THREE.Group();
    this.group.name = 'RemotePlayersGroup';
    this.scene.add(this.group);

    // Spatial Proximity Voice Chat Engine
    this.voiceChat = new VoiceChatManager(this, this.playerCtrl, this.soundSys);
    if (this.playerCtrl) {
      this.playerCtrl.voiceChat = this.voiceChat;
    }

    // Rate-limiting update broadcasts (20 updates/second)
    this.lastSendTime = 0;
    this.sendInterval = 0.048; // ~20 Hz

    // Last known local state to avoid sending identical packets
    this.lastSentPos = new THREE.Vector3();
    this.lastSentRot = 0;
    this.lastSentState = '';

    // Telemetry callbacks
    this.onPlayerCountChange = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onChatMessage = null;
    this.onStatusChange = null;
    this.status = 'INITIALIZING';
    this.reconnectAttempts = 0;

    this.connect();
  }

  /**
   * Establish WebSocket connection to local Wi-Fi server or custom relay
   */
  connect(customUrl = null) {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }

    const isVercel = window.location.hostname.endsWith('vercel.app');
    const savedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('hadejia3d_ws_url') : null;

    let wsUrl = customUrl || savedUrl;

    if (!wsUrl) {
      if (isVercel) {
        console.log('[Multiplayer] Running on Vercel static hosting. Standalone Explorer mode active.');
        this._notifyStatus('SOLO');
        return;
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log(`[Multiplayer] Connected to server at ${wsUrl}`);
        this._notifyStatus('ONLINE');
      };

      this.ws.onmessage = (event) => {
        this._handleServerMessage(event.data);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this._notifyStatus('DISCONNECTED');
        if (!this.reconnectAttempts) this.reconnectAttempts = 0;
        if (this.reconnectAttempts < 3 && !isVercel) {
          this.reconnectAttempts++;
          const delay = this.reconnectAttempts * 2500;
          setTimeout(() => this.connect(wsUrl), delay);
        }
      };

      this.ws.onerror = () => {
        // Suppress noisy console errors if server is unreachable
      };
    } catch (e) {
      console.warn('[Multiplayer] WebSocket setup error:', e);
      this._notifyStatus('DISCONNECTED');
    }
  }

  _notifyStatus(status) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  /**
   * Handle incoming packets from the server
   */
  _handleServerMessage(rawData) {
    try {
      const packet = JSON.parse(rawData);

      switch (packet.type) {
        case 'welcome':
          this.localPlayerId = packet.id;
          this.localPlayerName = packet.name;

          // Spawn any players who were already in the city
          if (packet.players && Array.isArray(packet.players)) {
            packet.players.forEach(pData => this._spawnRemotePlayer(pData));
          }
          this._notifyPlayerCount();
          break;

        case 'player_joined':
          this._spawnRemotePlayer(packet.player);
          this._notifyPlayerCount();
          if (this.onPlayerJoined) this.onPlayerJoined(packet.player);
          if (this.soundSys) this.soundSys.playTalkChirp();
          break;

        case 'player_update': {
          const rp = this.remotePlayers.get(packet.id);
          if (rp) {
            rp.targetPos.set(packet.position.x, packet.position.y, packet.position.z);
            rp.targetRot = packet.rotation;
            rp.state = packet.state;
            rp.isDriving = packet.isDriving;
            rp.animPhase = packet.animPhase;
          }
          break;
        }

        case 'player_chat': {
          const rp = this.remotePlayers.get(packet.id);
          if (rp) {
            this._showRemoteSpeechBubble(rp, packet.text);
          } else if (packet.id === this.localPlayerId) {
            // Local speech bubble
            this._showLocalSpeechBubble(packet.text);
          }
          if (this.onChatMessage) this.onChatMessage(packet.id, packet.text);
          break;
        }

        case 'player_voice': {
          // Real-Time Spatial Proximity Voice Stream from a remote peer
          if (this.voiceChat && packet.id !== this.localPlayerId) {
            this.voiceChat.playRemoteVoice(
              packet.id,
              packet.data,
              packet.sampleRate || 16000,
              packet.position,
              packet.name || 'Player'
            );
          }
          break;
        }

        case 'player_name_change': {
          const rp = this.remotePlayers.get(packet.id);
          if (rp) {
            rp.name = packet.name;
            this._updateNameTag(rp);
          }
          break;
        }

        case 'player_left':
          this._removeRemotePlayer(packet.id);
          this._notifyPlayerCount();
          if (this.onPlayerLeft) this.onPlayerLeft(packet.id);
          break;
      }
    } catch (e) {
      console.error('[Multiplayer] Error processing server packet:', e);
    }
  }

  /**
   * Helper to send JSON packet over WebSocket
   */
  sendPacket(packet) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
    }
  }

  /**
   * Spawn another connected Wi-Fi player in the 3D city
   */
  _spawnRemotePlayer(playerData) {
    if (playerData.id === this.localPlayerId) return;
    if (this.remotePlayers.has(playerData.id)) return;

    // Create articulated human model matching remote player's palette
    const palette = playerData.palette || {
      shirtColor: 0x10b981,
      jacketColor: 0x064e3b,
      pantsColor: 0x1e293b,
      shoesColor: 0xfacc15
    };

    const rig = LowPolyHuman.create({
      palette,
      scale: 0.65,
      style: 'player'
    });
    const mesh = rig.root;
    mesh.name = `RemotePlayer_${playerData.id}`;

    const initialPos = playerData.position || { x: -15, y: 1.87, z: 25 };
    mesh.position.set(initialPos.x, initialPos.y, initialPos.z);
    mesh.rotation.y = playerData.rotation || 0;

    // 1. Floating 3D Name Tag Billboard
    const nameTag = this._createNameTagSprite(playerData.name || 'Citizen');
    nameTag.position.set(0, 2.15, 0);
    mesh.add(nameTag);

    // 2. Floating 3D Speech Bubble Billboard
    const speechBubble = this._createSpeechBubbleSprite('💬');
    speechBubble.position.set(0, 2.55, 0);
    speechBubble.visible = false;
    mesh.add(speechBubble);

    this.group.add(mesh);

    const remotePlayerObj = {
      id: playerData.id,
      name: playerData.name || 'Citizen',
      rig,
      mesh,
      nameTag,
      speechBubble,
      bubbleSprite: speechBubble,
      bubbleTimer: 0,

      // Interpolation targets
      targetPos: new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z),
      targetRot: playerData.rotation || 0,
      state: playerData.state || 'IDLE',
      isDriving: playerData.isDriving || false,
      animPhase: 0,
      animTime: 0
    };

    this.remotePlayers.set(playerData.id, remotePlayerObj);
    console.log(`[Multiplayer] Rendered remote player: ${remotePlayerObj.name} (${playerData.id})`);
  }

  /**
   * Cleanly remove remote player from the 3D scene on disconnect
   */
  _removeRemotePlayer(playerId) {
    const rp = this.remotePlayers.get(playerId);
    if (!rp) return;

    if (this.voiceChat) {
      this.voiceChat.removePlayer(playerId);
    }

    this.group.remove(rp.mesh);
    this.remotePlayers.delete(playerId);
  }

  /**
   * Create high-resolution 3D name tag billboard using 2D canvas texture
   */
  _createNameTagSprite(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    this._drawNameTagCanvas(ctx, canvas.width, canvas.height, name);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.4, 0.35, 1);
    sprite.userData = { canvas, ctx, texture, name };
    return sprite;
  }

  _drawNameTagCanvas(ctx, w, h, name) {
    ctx.clearRect(0, 0, w, h);

    // Pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 24);
    ctx.fill();
    ctx.stroke();

    // Player name text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, w / 2, h / 2);
  }

  _updateNameTag(rp) {
    if (!rp.nameTag || !rp.nameTag.userData) return;
    const { ctx, canvas, texture } = rp.nameTag.userData;
    this._drawNameTagCanvas(ctx, canvas.width, canvas.height, rp.name);
    texture.needsUpdate = true;
  }

  /**
   * Create 3D speech bubble billboard
   */
  _createSpeechBubbleSprite(initialText = '💬') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    this._drawBubbleCanvas(ctx, canvas.width, canvas.height, initialText);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 0.6, 1);
    sprite.userData = { canvas, ctx, texture };
    return sprite;
  }

  _drawBubbleCanvas(ctx, w, h, text) {
    ctx.clearRect(0, 0, w, h);

    // Bubble body
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(10, 10, w - 20, h - 36, 18);
    ctx.fill();
    ctx.stroke();

    // Tail
    ctx.beginPath();
    ctx.moveTo(w / 2 - 12, h - 26);
    ctx.lineTo(w / 2, h - 8);
    ctx.lineTo(w / 2 + 12, h - 26);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.stroke();

    // Text (truncated if too long for bubble)
    const displayText = text.length > 22 ? text.substring(0, 20) + '...' : text;
    ctx.fillStyle = '#ecfdf5';
    ctx.font = 'bold 20px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, w / 2, (h - 36) / 2 + 10);
  }

  _showRemoteSpeechBubble(rp, text) {
    if (!rp.speechBubble || !rp.speechBubble.userData) return;
    const { ctx, canvas, texture } = rp.speechBubble.userData;
    this._drawBubbleCanvas(ctx, canvas.width, canvas.height, text);
    texture.needsUpdate = true;

    rp.speechBubble.visible = true;
    rp.bubbleTimer = 5.0; // Show for 5 seconds
  }

  _showLocalSpeechBubble(text) {
    if (!this.playerCtrl || !this.playerCtrl.mesh) return;

    if (!this.localBubble) {
      this.localBubble = this._createSpeechBubbleSprite(text);
      this.localBubble.position.set(0, 2.55, 0);
      this.playerCtrl.mesh.add(this.localBubble);
    } else {
      const { ctx, canvas, texture } = this.localBubble.userData;
      this._drawBubbleCanvas(ctx, canvas.width, canvas.height, text);
      texture.needsUpdate = true;
    }

    this.localBubble.visible = true;
    this.localBubbleTimer = 5.0;
  }

  /**
   * Broadcast in-game chat message to all players on the Wi-Fi
   */
  sendChat(text) {
    if (!this.isConnected || !this.ws || !text) return;
    this.ws.send(JSON.stringify({
      type: 'chat',
      text: text.trim()
    }));
  }

  /**
   * Update and smooth-interpolate remote players every frame
   */
  update(delta) {
    // 1. Send Local Player Updates at ~20 Hz
    this.lastSendTime += delta;
    if (this.lastSendTime >= this.sendInterval) {
      this.lastSendTime = 0;
      this._broadcastLocalPlayerUpdate();
    }

    // 2. Local speech bubble timer
    if (this.localBubbleTimer > 0) {
      this.localBubbleTimer -= delta;
      if (this.localBubbleTimer <= 0 && this.localBubble) {
        this.localBubble.visible = false;
      }
    }

    // 3. Update & Interpolate All Remote Players
    for (const [id, rp] of this.remotePlayers.entries()) {
      rp.animTime += delta;

      // Smooth position lerping
      rp.mesh.position.lerp(rp.targetPos, Math.min(1.0, 15.0 * delta));

      // Smooth rotation angle interpolation
      let diff = rp.targetRot - rp.mesh.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      rp.mesh.rotation.y += diff * Math.min(1.0, 15.0 * delta);

      // Speech bubble timer
      if (rp.bubbleTimer > 0) {
        rp.bubbleTimer -= delta;
        if (rp.bubbleTimer <= 0) {
          rp.speechBubble.visible = false;
        }
      }

      // Synchronize Remote Skeletal Animations
      this._animateRemotePlayerPose(rp, delta);
    }
  }

  _broadcastLocalPlayerUpdate() {
    if (!this.isConnected || !this.ws || !this.playerCtrl || !this.playerCtrl.mesh) return;

    const pPos = this.playerCtrl.mesh.position;
    const pRot = this.playerCtrl.mesh.rotation.y;
    const pState = this.playerCtrl.state;
    const isDriving = this.playerCtrl.isDriving;

    // Only send if moved or state changed
    const moved = pPos.distanceToSquared(this.lastSentPos) > 0.0004 ||
                  Math.abs(pRot - this.lastSentRot) > 0.01 ||
                  pState !== this.lastSentState;

    if (moved) {
      this.lastSentPos.copy(pPos);
      this.lastSentRot = pRot;
      this.lastSentState = pState;

      this.ws.send(JSON.stringify({
        type: 'update',
        position: { x: pPos.x, y: pPos.y, z: pPos.z },
        rotation: pRot,
        state: pState,
        isDriving,
        animPhase: this.playerCtrl.animTime
      }));
    }
  }

  /**
   * Articulate remote player bones to match their current state in real-time
   */
  _animateRemotePlayerPose(rp, delta) {
    const r = rp.rig;
    const t = rp.animTime;

    switch (rp.state) {
      case 'WALK': {
        const freq = 7.5;
        const phase = t * freq;
        const stride = 0.65;
        const armSwing = 0.52;

        r.leftLegUpper.rotation.x = Math.sin(phase) * stride;
        r.leftLegLower.rotation.x = Math.max(0, -Math.sin(phase) * stride * 0.9);
        r.rightLegUpper.rotation.x = -Math.sin(phase) * stride;
        r.rightLegLower.rotation.x = Math.max(0, Math.sin(phase) * stride * 0.9);

        r.leftArmUpper.rotation.x = -Math.sin(phase) * armSwing;
        r.leftArmLower.rotation.x = 0.18 + Math.max(0, -Math.sin(phase) * 0.38);
        r.rightArmUpper.rotation.x = Math.sin(phase) * armSwing;
        r.rightArmLower.rotation.x = 0.18 + Math.max(0, Math.sin(phase) * 0.38);

        r.hips.position.y = 1.35 + Math.abs(Math.sin(phase * 2)) * 0.06;
        r.torso.rotation.y = -Math.sin(phase) * 0.08;
        r.torso.rotation.x = 0.06;
        r.headPivot.rotation.y = -r.torso.rotation.y * 0.85;
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

        r.leftArmUpper.rotation.x = -Math.sin(phase) * armSwing;
        r.leftArmLower.rotation.x = 0.85;
        r.rightArmUpper.rotation.x = Math.sin(phase) * armSwing;
        r.rightArmLower.rotation.x = 0.85;

        r.torso.rotation.x = 0.24;
        r.torso.rotation.y = -Math.sin(phase) * 0.14;
        r.hips.position.y = 1.35 + Math.abs(Math.sin(phase * 2)) * 0.12;
        r.headPivot.rotation.y = -r.torso.rotation.y * 0.85;
        break;
      }

      case 'JUMP': {
        r.leftLegUpper.rotation.x = -0.7;
        r.leftLegLower.rotation.x = 1.0;
        r.rightLegUpper.rotation.x = -0.5;
        r.rightLegLower.rotation.x = 0.8;
        r.leftArmUpper.rotation.x = -1.2;
        r.rightArmUpper.rotation.x = -1.2;
        break;
      }

      case 'SIT':
      case 'DRIVING': {
        r.hips.position.y = 0.72;
        r.hips.position.z = -0.2;
        r.leftLegUpper.rotation.x = -Math.PI / 2 + 0.1;
        r.leftLegLower.rotation.x = Math.PI / 2 - 0.1;
        r.rightLegUpper.rotation.x = -Math.PI / 2 + 0.1;
        r.rightLegLower.rotation.x = Math.PI / 2 - 0.1;
        r.leftArmUpper.rotation.x = -0.4;
        r.leftArmLower.rotation.x = 0.6;
        r.rightArmUpper.rotation.x = -0.4;
        r.rightArmLower.rotation.x = 0.6;
        break;
      }

      case 'LAY': {
        rp.mesh.rotation.x = -Math.PI / 2;
        r.hips.position.y = 0.28;
        break;
      }

      case 'WAVE': {
        r.rightArmUpper.rotation.z = -2.4;
        r.rightArmUpper.rotation.x = 0.2;
        r.rightArmLower.rotation.y = Math.sin(t * 9) * 0.6;
        r.headPivot.rotation.y = 0.2;
        break;
      }

      case 'DANCE': {
        const danceSpeed = 7.0;
        r.hips.position.x = Math.sin(t * danceSpeed) * 0.15;
        r.hips.rotation.y = Math.sin(t * danceSpeed) * 0.35;
        r.leftArmUpper.rotation.z = 1.2 + Math.sin(t * danceSpeed) * 0.5;
        r.rightArmUpper.rotation.z = -1.2 - Math.sin(t * danceSpeed) * 0.5;
        break;
      }

      case 'IDLE':
      default: {
        rp.mesh.rotation.x = 0;
        const breath = Math.sin(t * 2.4);
        r.torso.rotation.x = breath * 0.022;
        r.hips.position.y = 1.35;
        r.leftArmUpper.rotation.x = 0.06 + breath * 0.03;
        r.rightArmUpper.rotation.x = 0.06 + breath * 0.03;
        r.leftArmLower.rotation.x = 0.22;
        r.rightArmLower.rotation.x = 0.22;
        break;
      }
    }
  }

  _notifyPlayerCount() {
    const totalCount = this.remotePlayers.size + 1;
    if (this.onPlayerCountChange) {
      this.onPlayerCountChange(totalCount);
    }
  }

  getPlayerCount() {
    return this.remotePlayers.size + 1;
  }
}
