import * as THREE from 'three';

/**
 * VoiceChatManager — Real-Time Spatial Proximity Voice Chat Engine
 * 
 * Features:
 * - Live microphone capture via Web Audio API (16,000 Hz Int16 PCM)
 * - Voice Activity Detection (VAD) to transmit only when speech is detected
 * - 3D Spatial Audio: Distance attenuation (crystal clear up close, fades with distance, silent past 50m)
 * - 3D Stereo Panning: Directional left/right audio according to remote player's relative orientation
 * - 3D Visual Speaking Indicator: Animated soundwave bubbles over speaking characters
 * - On-screen proximity voice telemetry & hearing distance indicators
 * - Seamless integration with WebSocket multiplayer
 */

// Helper: Float32Array to 16-bit Int16 PCM encoded base64
function float32ToBase64(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const uint8 = new Uint8Array(int16Array.buffer);
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

// Helper: Base64 back to Float32Array
function base64ToFloat32(base64Str) {
  const binary = atob(base64Str);
  const len = binary.length;
  const uint8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    uint8[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(uint8.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
  }
  return float32;
}

export class VoiceChatManager {
  constructor(networkMgr, playerCtrl, soundSys = null) {
    this.networkMgr = networkMgr;
    this.playerCtrl = playerCtrl;
    this.soundSys = soundSys;

    this.isMicActive = false;
    this.isMuted = true;
    this.isSpeaking = false;
    this.silenceTimer = null;

    // Audio Contexts
    this.captureCtx = null;
    this.playbackCtx = null;
    this.mediaStream = null;
    this.scriptProcessor = null;

    // Remote audio channels: playerId -> { gainNode, pannerNode, nextPlayTime, distance, currentVolume }
    this.remoteChannels = new Map();

    // Visual speech bubble texture for 3D soundwaves
    this.voiceBubbleTexture = this._createVoiceBubbleTexture();

    // Callbacks for UI updates
    this.onMicStateChange = null;
    this.onLocalSpeaking = null;
    this.onRemoteSpeaking = null;
  }

  /**
   * Initialize or resume the audio playback context
   */
  _initPlaybackContext() {
    if (!this.playbackCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.playbackCtx = new AudioCtx({ sampleRate: 16000 });
    }
    if (this.playbackCtx.state === 'suspended') {
      this.playbackCtx.resume();
    }
  }

  /**
   * Toggle microphone capture on / off
   */
  async toggleMic() {
    if (this.isMicActive && !this.isMuted) {
      this.muteMic();
      return false;
    } else {
      const ok = await this.startMic();
      return ok;
    }
  }

  /**
   * Request microphone permission and initialize audio capture pipeline
   */
  async startMic() {
    this._initPlaybackContext();

    const hasModern = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const legacyFn = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (!hasModern && !legacyFn) {
      const isHttpIp = window.location.protocol === 'http:' &&
                       window.location.hostname !== 'localhost' &&
                       window.location.hostname !== '127.0.0.1';
      
      const securityInfo = {
        isHttpIp,
        hostname: window.location.hostname,
        port: window.location.port || '3000',
        localhostUrl: `http://localhost:${window.location.port || '3000'}/`,
        httpsUrl: `https://${window.location.hostname}:3443/`
      };

      const errMsg = isHttpIp
        ? 'Microphone blocked: Browsers require HTTPS or http://localhost for microphone capture.'
        : 'Microphone (getUserMedia) is not supported in this browser.';

      console.warn('[VoiceChat]', errMsg, securityInfo);
      this.isMicActive = false;
      this.isMuted = true;
      if (this.onMicStateChange) {
        this.onMicStateChange(false, errMsg, securityInfo);
      }
      return false;
    }

    try {
      if (hasModern) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          }
        });
      } else {
        this.mediaStream = await new Promise((resolve, reject) => {
          legacyFn.call(navigator, { audio: true }, resolve, reject);
        });
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.captureCtx = new AudioCtx({ sampleRate: 16000 });
      if (this.captureCtx.state === 'suspended') {
        await this.captureCtx.resume();
      }

      const source = this.captureCtx.createMediaStreamSource(this.mediaStream);
      // 2048 samples at 16kHz gives ~128ms slices (crisp human speech with zero perceptible lag)
      this.scriptProcessor = this.captureCtx.createScriptProcessor(2048, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // 1. Calculate RMS volume for Voice Activity Detection (VAD)
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        // 2. VAD Threshold: Only transmit when genuinely speaking
        if (rms > 0.014) {
          this._handleLocalSpeakingState(true);

          // Encode to 16-bit PCM and transmit via WebSocket
          const base64Audio = float32ToBase64(inputData);
          if (this.networkMgr && this.networkMgr.isConnected) {
            const pMesh = this.playerCtrl && this.playerCtrl.mesh ? this.playerCtrl.mesh : null;
            const pos = pMesh ? {
              x: Math.round(pMesh.position.x * 100) / 100,
              y: Math.round(pMesh.position.y * 100) / 100,
              z: Math.round(pMesh.position.z * 100) / 100
            } : null;

            this.networkMgr.sendPacket({
              type: 'voice_audio',
              data: base64Audio,
              sampleRate: 16000,
              position: pos
            });
          }
        } else {
          // Decay speaking state after 350ms of silence
          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              this._handleLocalSpeakingState(false);
              this.silenceTimer = null;
            }, 350);
          }
        }
      };

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.captureCtx.destination);

      this.isMicActive = true;
      this.isMuted = false;

      if (this.onMicStateChange) this.onMicStateChange(true);
      return true;

    } catch (err) {
      console.warn('[VoiceChat] Failed to access microphone:', err);
      this.isMicActive = false;
      this.isMuted = true;
      if (this.onMicStateChange) this.onMicStateChange(false, err.message);
      return false;
    }
  }

  /**
   * Mute microphone without destroying stream
   */
  muteMic() {
    this.isMuted = true;
    this._handleLocalSpeakingState(false);
    if (this.onMicStateChange) this.onMicStateChange(false);
  }

  _handleLocalSpeakingState(speaking) {
    if (this.isSpeaking !== speaking) {
      this.isSpeaking = speaking;
      if (this.onLocalSpeaking) this.onLocalSpeaking(speaking);

      // Trigger local 3D speech bubble above player's head
      if (this.playerCtrl && this.playerCtrl.mesh) {
        if (!this.localVoiceBubble) {
          const spriteMat = new THREE.SpriteMaterial({
            map: this.voiceBubbleTexture,
            transparent: true,
            depthTest: false
          });
          this.localVoiceBubble = new THREE.Sprite(spriteMat);
          this.localVoiceBubble.scale.set(1.2, 0.6, 1);
          this.localVoiceBubble.position.set(0, 2.55, 0);
          this.playerCtrl.mesh.add(this.localVoiceBubble);
        }
        this.localVoiceBubble.visible = speaking;
      }
    }
  }

  /**
   * Play incoming voice audio from a remote player with 3D Spatial Audio & Distance Attenuation
   * @param {string} playerId ID of remote speaker
   * @param {string} base64Audio PCM Audio data
   * @param {number} sampleRate Audio sample rate (16000 Hz)
   * @param {Object} speakerPos Optional 3D position vector
   * @param {string} speakerName Name of the speaker
   */
  playRemoteVoice(playerId, base64Audio, sampleRate = 16000, speakerPos = null, speakerName = 'Player') {
    this._initPlaybackContext();

    const floatSamples = base64ToFloat32(base64Audio);
    if (!floatSamples || floatSamples.length === 0) return;

    // Get or create dedicated audio channel for this remote player
    let channel = this.remoteChannels.get(playerId);
    if (!channel) {
      channel = this._createRemoteChannel(playerId);
    }

    // 1. Calculate 3D Spatial Audio & Distance Attenuation
    this._updateChannelSpatialAudio(channel, speakerPos);

    // 2. Beyond hearing distance (50 meters)? Drop packet to save resources
    if (channel.currentVolume <= 0.001) {
      if (this.onRemoteSpeaking) {
        this.onRemoteSpeaking(playerId, speakerName, channel.distance, 0, false);
      }
      return;
    }

    // 3. Create AudioBuffer and schedule seamless playback
    const audioBuffer = this.playbackCtx.createBuffer(1, floatSamples.length, sampleRate);
    audioBuffer.getChannelData(0).set(floatSamples);

    const source = this.playbackCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(channel.gainNode);

    const now = this.playbackCtx.currentTime;
    // Queue chunks seamlessly without clicks or stutter
    const playTime = Math.max(now, channel.nextPlayTime || 0);
    source.start(playTime);
    channel.nextPlayTime = playTime + audioBuffer.duration;

    // 4. Update visual indicators
    this._triggerRemoteSpeakingVisual(playerId, channel.distance);

    if (this.onRemoteSpeaking) {
      this.onRemoteSpeaking(playerId, speakerName, channel.distance, channel.currentVolume, true);
    }
  }

  /**
   * Set up dedicated Web Audio Gain and Panner node for a remote peer
   */
  _createRemoteChannel(playerId) {
    const gainNode = this.playbackCtx.createGain();
    gainNode.gain.setValueAtTime(1.0, this.playbackCtx.currentTime);

    let pannerNode = null;
    if (this.playbackCtx.createStereoPanner) {
      pannerNode = this.playbackCtx.createStereoPanner();
      pannerNode.pan.setValueAtTime(0, this.playbackCtx.currentTime);
      gainNode.connect(pannerNode);
      pannerNode.connect(this.playbackCtx.destination);
    } else {
      gainNode.connect(this.playbackCtx.destination);
    }

    const channel = {
      id: playerId,
      gainNode,
      pannerNode,
      nextPlayTime: 0,
      distance: 0,
      currentVolume: 1.0,
      visualTimer: null
    };

    this.remoteChannels.set(playerId, channel);
    return channel;
  }

  /**
   * Calculate exact distance and apply realistic acoustic falloff & stereo pan
   */
  _updateChannelSpatialAudio(channel, remotePos) {
    const localPos = this.playerCtrl && this.playerCtrl.mesh
      ? this.playerCtrl.mesh.position
      : new THREE.Vector3();

    // Retrieve remote player's current position in the world
    let targetPos = remotePos;
    if (!targetPos && this.networkMgr) {
      const rp = this.networkMgr.remotePlayers.get(channel.id);
      if (rp && rp.mesh) {
        targetPos = rp.mesh.position;
      }
    }
    if (!targetPos) targetPos = localPos;

    // 3D Distance in meters
    const dx = targetPos.x - localPos.x;
    const dy = (targetPos.y || 1.4) - localPos.y;
    const dz = targetPos.z - localPos.z;
    const distance = Math.hypot(dx, dy, dz);
    channel.distance = distance;

    // Spatial Distance Parameters:
    // - 0m to 4m: 100% volume (Full intimate clarity)
    // - 4m to 50m: Natural acoustic falloff (loud nearby, soft across street, faint whisper at 45m)
    // - > 50m: 0% volume (Cannot be heard out of range)
    const minHearingDist = 4.0;
    const maxHearingDist = 50.0;

    let volume = 0;
    if (distance <= minHearingDist) {
      volume = 1.0;
    } else if (distance >= maxHearingDist) {
      volume = 0;
    } else {
      // Smooth natural acoustic power curve (quadratic)
      const t = 1.0 - (distance - minHearingDist) / (maxHearingDist - minHearingDist);
      volume = Math.pow(t, 1.5);
    }

    channel.currentVolume = volume;
    channel.gainNode.gain.setTargetAtTime(volume, this.playbackCtx.currentTime, 0.04);

    // Directional Stereo Panning (Ear orientation)
    if (channel.pannerNode) {
      const localYaw = this.playerCtrl && this.playerCtrl.mesh ? this.playerCtrl.mesh.rotation.y : 0;
      const cosY = Math.cos(-localYaw);
      const sinY = Math.sin(-localYaw);
      const relX = dx * cosY - dz * sinY;
      const pan = Math.max(-1.0, Math.min(1.0, relX / Math.max(5.0, distance)));
      channel.pannerNode.pan.setTargetAtTime(pan, this.playbackCtx.currentTime, 0.04);
    }
  }

  /**
   * Display 3D animated soundwave speech bubble above speaking remote player
   */
  _triggerRemoteSpeakingVisual(playerId, distance) {
    if (!this.networkMgr) return;
    const rp = this.networkMgr.remotePlayers.get(playerId);
    if (!rp) return;

    const bubble = rp.speechBubble || rp.bubbleSprite;
    if (!bubble) return;

    bubble.visible = true;
    bubble.material.map = this.voiceBubbleTexture;

    // Dim speech bubble if faraway
    const opacity = Math.max(0.25, Math.min(1.0, 1.0 - distance / 50.0));
    bubble.material.opacity = opacity;

    // Reset visual decay timer
    const channel = this.remoteChannels.get(playerId);
    if (channel) {
      if (channel.visualTimer) clearTimeout(channel.visualTimer);
      channel.visualTimer = setTimeout(() => {
        if (bubble) {
          bubble.visible = false;
          bubble.material.opacity = 1.0;
        }
      }, 350);
    }
  }

  /**
   * Generate glowing 3D voice soundwave canvas texture
   */
  _createVoiceBubbleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Rounded glowing bubble
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#22c55e'; // Vibrant voice green
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(14, 14, 100, 72, 18);
    ctx.fill();
    ctx.stroke();

    // Pointer tail
    ctx.beginPath();
    ctx.moveTo(54, 86);
    ctx.lineTo(64, 104);
    ctx.lineTo(74, 86);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.stroke();

    // Audio Voice Wave icon
    ctx.font = '36px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎙️', 64, 50);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Remove audio channel when a player disconnects
   */
  removePlayer(playerId) {
    const channel = this.remoteChannels.get(playerId);
    if (channel) {
      if (channel.visualTimer) clearTimeout(channel.visualTimer);
      try {
        channel.gainNode.disconnect();
        if (channel.pannerNode) channel.pannerNode.disconnect();
      } catch (e) {}
      this.remoteChannels.delete(playerId);
    }
  }
}
