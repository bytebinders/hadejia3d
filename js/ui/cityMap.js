/**
 * CityMap — Real-Time Interactive District Map & GPS Radar
 * 
 * Features:
 * - Dynamic 2D vector render of Metropolis layout (Canal, West Island, East Island, Central Park, Districts)
 * - Live real-time telemetry: Local Player, Remote Wi-Fi Players, Autonomous Citizens, and Traffic
 * - Corner GPS Minimap with open/remove controls
 * - Full Tactical Map overlay toggled via 'M' key or HUD button
 * - Fast-Travel / District Navigation by clicking on the map or district jump buttons
 */

export class CityMap {
  constructor(app) {
    this.app = app;

    // World coordinate boundaries
    this.worldBounds = {
      minX: -125,
      maxX: 125,
      minZ: -125,
      maxZ: 125
    };
    this.spanX = this.worldBounds.maxX - this.worldBounds.minX;
    this.spanZ = this.worldBounds.maxZ - this.worldBounds.minZ;

    this.isOpen = false;
    this.isMinimapVisible = true;
    this.trackPlayer = true;

    // Cache DOM Elements
    this.modal = document.getElementById('city-map-modal');
    this.fullCanvas = document.getElementById('city-map-canvas');
    this.fullCtx = this.fullCanvas ? this.fullCanvas.getContext('2d') : null;

    this.minimapWidget = document.getElementById('minimap-widget');
    this.miniCanvas = document.getElementById('minimap-canvas');
    this.miniCtx = this.miniCanvas ? this.miniCanvas.getContext('2d') : null;

    this.btnToggleMap = document.getElementById('btn-toggle-map');
    this.btnCloseMap = document.getElementById('btn-close-map');
    this.btnExpandMap = document.getElementById('btn-expand-map');
    this.btnToggleMinimap = document.getElementById('btn-toggle-minimap');
    this.btnTrackPlayer = document.getElementById('btn-map-track-player');
    this.districtJumpBtns = document.querySelectorAll('.district-jump-btn');

    this._bindEvents();
  }

  _bindEvents() {
    // 1. Toggle Full Map via Header or Minimap button
    if (this.btnToggleMap) {
      this.btnToggleMap.addEventListener('click', () => this.toggleMap());
    }
    if (this.btnExpandMap) {
      this.btnExpandMap.addEventListener('click', () => this.openMap());
    }

    // 2. Close Full Map
    if (this.btnCloseMap) {
      this.btnCloseMap.addEventListener('click', () => this.closeMap());
    }

    // 3. Toggle Minimap visibility
    if (this.btnToggleMinimap) {
      this.btnToggleMinimap.addEventListener('click', () => this.toggleMinimap());
    }

    // 4. Center on Player button
    if (this.btnTrackPlayer) {
      this.btnTrackPlayer.addEventListener('click', () => {
        this.trackPlayer = !this.trackPlayer;
        this.btnTrackPlayer.classList.toggle('active', this.trackPlayer);
      });
    }

    // 5. Global Keyboard shortcut 'M' and 'Escape'
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in a text field (e.g. 3D chat)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'm' || e.key === 'M') {
        this.toggleMap();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.closeMap();
      }
    });

    // 6. Fast-Travel District Jump Buttons
    this.districtJumpBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const x = parseFloat(btn.dataset.x);
        const z = parseFloat(btn.dataset.z);
        this._fastTravelTo(x, z);
      });
    });

    // 7. Interactive Click on Full Map Canvas to Fast-Travel
    if (this.fullCanvas) {
      this.fullCanvas.addEventListener('click', (e) => {
        const rect = this.fullCanvas.getBoundingClientRect();
        const scaleX = this.fullCanvas.width / rect.width;
        const scaleY = this.fullCanvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const worldPos = this._canvasToWorld(clickX, clickY, this.fullCanvas.width, this.fullCanvas.height);
        this._fastTravelTo(worldPos.x, worldPos.z);
      });
    }
  }

  toggleMap() {
    if (this.isOpen) {
      this.closeMap();
    } else {
      this.openMap();
    }
  }

  openMap() {
    this.isOpen = true;
    if (this.modal) this.modal.classList.remove('hidden');
    if (this.app.soundSys) this.app.soundSys.playClick();
  }

  closeMap() {
    this.isOpen = false;
    if (this.modal) this.modal.classList.add('hidden');
    if (this.app.soundSys) this.app.soundSys.playClick();
  }

  toggleMinimap() {
    this.isMinimapVisible = !this.isMinimapVisible;
    if (this.minimapWidget) {
      this.minimapWidget.classList.toggle('hidden', !this.isMinimapVisible);
    }
    if (this.app.hudCtrl) {
      this.app.hudCtrl.showToast(
        this.isMinimapVisible ? 'Minimap restored. Press M for full map.' : 'Minimap removed. Press M anytime to open map.',
        '🗺️'
      );
    }
  }

  _fastTravelTo(worldX, worldZ) {
    const pc = this.app.playerCtrl;
    if (pc && pc.mesh) {
      const targetY = this.app.collisionSys ? this.app.collisionSys.getGroundHeight(worldX, worldZ) : 1.8;
      pc.mesh.position.set(worldX, targetY, worldZ);
      pc.verticalVelocity = 0;
      pc.isGrounded = true;
      if (pc.isDriving && pc.currentVehicle) {
        pc.currentVehicle.mesh.position.set(worldX, targetY, worldZ);
      }
    }

    if (this.app.controls) {
      this.app.controls.target.set(worldX, 2, worldZ);
    }

    if (this.app.hudCtrl) {
      this.app.hudCtrl.showToast(`Navigated to Metropolis coordinates (${Math.round(worldX)}, ${Math.round(worldZ)})`, '📍');
    }

    this.closeMap();
  }

  _worldToCanvas(wx, wz, w, h) {
    const cx = ((wx - this.worldBounds.minX) / this.spanX) * w;
    const cy = ((wz - this.worldBounds.minZ) / this.spanZ) * h;
    return { x: cx, y: cy };
  }

  _canvasToWorld(cx, cy, w, h) {
    const wx = this.worldBounds.minX + (cx / w) * this.spanX;
    const wz = this.worldBounds.minZ + (cy / h) * this.spanZ;
    return { x: wx, y: wz };
  }

  /**
   * Main render loop called every frame
   */
  update() {
    // 1. Render Minimap
    if (this.isMinimapVisible && this.miniCtx) {
      this._renderMinimap();
    }

    // 2. Render Full Tactical Map if open
    if (this.isOpen && this.fullCtx) {
      this._renderFullMap();
    }
  }

  /**
   * Render Full Map
   */
  _renderFullMap() {
    const ctx = this.fullCtx;
    const w = this.fullCanvas.width;
    const h = this.fullCanvas.height;

    // Background Water / Void
    ctx.fillStyle = '#060b14';
    ctx.fillRect(0, 0, w, h);

    // 1. Static City Geography
    this._drawCityGeography(ctx, w, h);

    // 2. Dynamic City Traffic
    this._drawVehicles(ctx, w, h, 2.8);

    // 3. Autonomous Citizens
    this._drawCitizens(ctx, w, h, 2.2);

    // 4. Remote Wi-Fi Players
    this._drawRemotePlayers(ctx, w, h, true);

    // 5. Local Player marker with directional heading
    this._drawLocalPlayer(ctx, w, h, true);
  }

  /**
   * Render Corner Minimap (Player Centered or Full Overview)
   */
  _renderMinimap() {
    const ctx = this.miniCtx;
    const w = this.miniCanvas.width;
    const h = this.miniCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark radar background
    ctx.fillStyle = 'rgba(6, 11, 20, 0.88)';
    ctx.fillRect(0, 0, w, h);

    // City Geography
    this._drawCityGeography(ctx, w, h);

    // Traffic & Citizens
    this._drawVehicles(ctx, w, h, 2.0);
    this._drawCitizens(ctx, w, h, 1.6);
    this._drawRemotePlayers(ctx, w, h, false);
    this._drawLocalPlayer(ctx, w, h, false);

    // Radar scan sweep ring effect
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.44, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawCityGeography(ctx, w, h) {
    // West Island (Main Historic Hadejia City: X -110 to 34, Z -110 to 110)
    const p1 = this._worldToCanvas(-110, -110, w, h);
    const p2 = this._worldToCanvas(34, 110, w, h);
    ctx.fillStyle = '#292524'; // Warm earthen / sandstone bedrock
    ctx.strokeStyle = '#b45309'; // Red-laterite wall border
    ctx.lineWidth = 2;
    ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

    // East Island (Hadejia-Nguru Wetlands & Farmlands: X 66 to 110, Z -110 to 110)
    const ep1 = this._worldToCanvas(66, -110, w, h);
    const ep2 = this._worldToCanvas(110, 110, w, h);
    ctx.fillStyle = '#1c3d1c'; // Wetlands fertile floodplain
    ctx.strokeStyle = '#15803d';
    ctx.fillRect(ep1.x, ep1.y, ep2.x - ep1.x, ep2.y - ep1.y);
    ctx.strokeRect(ep1.x, ep1.y, ep2.x - ep1.x, ep2.y - ep1.y);

    // Kogin Hadejia (Hadejia River Waterway: X 34 to 66)
    const wp1 = this._worldToCanvas(34, -115, w, h);
    const wp2 = this._worldToCanvas(66, 115, w, h);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(wp1.x, wp1.y, wp2.x - wp1.x, wp2.y - wp1.y);

    // River Bridges at Z = -50 and Z = +50
    ctx.fillStyle = '#78350f';
    const br1 = this._worldToCanvas(32, -55, w, h);
    const br1End = this._worldToCanvas(68, -45, w, h);
    ctx.fillRect(br1.x, br1.y, br1End.x - br1.x, br1End.y - br1.y);

    const br2 = this._worldToCanvas(32, 45, w, h);
    const br2End = this._worldToCanvas(68, 55, w, h);
    ctx.fillRect(br2.x, br2.y, br2End.x - br2.x, br2End.y - br2.y);

    // Fadamar Hadejia & Date Palm Oasis (X -30 to 10, Z 5 to 45)
    const parkP1 = this._worldToCanvas(-30, 5, w, h);
    const parkP2 = this._worldToCanvas(10, 45, w, h);
    ctx.fillStyle = '#166534';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.fillRect(parkP1.x, parkP1.y, parkP2.x - parkP1.x, parkP2.y - parkP1.y);
    ctx.strokeRect(parkP1.x, parkP1.y, parkP2.x - parkP1.x, parkP2.y - parkP1.y);

    // Oasis Well / Fountain
    const pondCenter = this._worldToCanvas(-10, 25, w, h);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pondCenter.x, pondCenter.y, (w / 240) * 8, 0, Math.PI * 2);
    ctx.fill();

    // Road Grid Lines
    ctx.strokeStyle = 'rgba(23, 23, 23, 0.85)';
    ctx.lineWidth = Math.max(1.5, w * 0.015);

    // Horizontal Avenues (Z = -50, 0, 50)
    [-50, 0, 50].forEach((zVal) => {
      const start = this._worldToCanvas(-110, zVal, w, h);
      const end = this._worldToCanvas(34, zVal, w, h);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

    // Vertical Streets (X = -85, -35, 15, 88)
    [-85, -35, 15, 88].forEach((xVal) => {
      const start = this._worldToCanvas(xVal, -110, w, h);
      const end = this._worldToCanvas(xVal, 110, w, h);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

    // Monorail Loop Track
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(p1.x + 15, p1.y + 15, (p2.x - p1.x) - 30, (p2.y - p1.y) - 30);
    ctx.setLineDash([]);

    // Authentic Hadejia Landmark Labels (Rendered on Full Map)
    if (w > 300) {
      ctx.font = 'bold 11px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';

      // Emir's Palace (Fadar Sarki)
      const palacePos = this._worldToCanvas(-60, -25, w, h);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('👑 FADAR SARKIN HADEJIA', palacePos.x, palacePos.y - 12);

      // Central Friday Mosque
      const mosquePos = this._worldToCanvas(-10, -25, w, h);
      ctx.fillStyle = '#34d399';
      ctx.fillText('🕌 MASALLACIN JUMA\'A', mosquePos.x, mosquePos.y - 12);

      // Babban Kasuwa & Kasuwar Kifi
      const kasuwaPos = this._worldToCanvas(-60, 25, w, h);
      ctx.fillStyle = '#f97316';
      ctx.fillText('🧺 BABBAN KASUWA & KIFI', kasuwaPos.x, kasuwaPos.y);

      // Kofar Yamma Gate
      const gatePos = this._worldToCanvas(-85, 0, w, h);
      ctx.fillStyle = '#fde047';
      ctx.fillText('🚪 KOFAR YAMMA', gatePos.x, gatePos.y - 10);

      // Fadamar Hadejia
      const parkLabel = this._worldToCanvas(-10, 36, w, h);
      ctx.fillStyle = '#bbf7d0';
      ctx.fillText('🌴 FADAMA (DATE PALMS)', parkLabel.x, parkLabel.y);

      // Hadejia-Nguru Wetlands
      const wetlandsLabel = this._worldToCanvas(88, -25, w, h);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('🦅 HADEJIA-NGURU WETLANDS', wetlandsLabel.x, wetlandsLabel.y);

      // Kogin Hadejia
      const canalLabel = this._worldToCanvas(50, 0, w, h);
      ctx.save();
      ctx.translate(canalLabel.x, canalLabel.y);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText('KOGIN HADEJIA (RIVER)', 0, 0);
      ctx.restore();
    }
  }

  _drawVehicles(ctx, w, h, radius) {
    if (!this.app.trafficSys || !this.app.trafficSys.vehicles) return;

    ctx.fillStyle = '#fbbf24';
    this.app.trafficSys.vehicles.forEach((v) => {
      if (v.mesh) {
        const pt = this._worldToCanvas(v.mesh.position.x, v.mesh.position.z, w, h);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  _drawCitizens(ctx, w, h, radius) {
    const citizens = this.app.pedestrianSys ? (this.app.pedestrianSys.allCitizens || this.app.pedestrianSys.citizens) : null;
    if (!citizens) return;

    ctx.fillStyle = '#38bdf8';
    citizens.forEach((c) => {
      if (c.mesh) {
        const pt = this._worldToCanvas(c.mesh.position.x, c.mesh.position.z, w, h);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  _drawRemotePlayers(ctx, w, h, withNames) {
    if (!this.app.networkMgr || !this.app.networkMgr.remotePlayers) return;

    for (const [id, rp] of this.app.networkMgr.remotePlayers.entries()) {
      if (rp.mesh) {
        const pt = this._worldToCanvas(rp.mesh.position.x, rp.mesh.position.z, w, h);

        // Glowing outer halo
        ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, withNames ? 7 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Inner marker
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, withNames ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Player Name Tag
        if (withNames) {
          ctx.fillStyle = '#f3e8ff';
          ctx.font = 'bold 9px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(rp.name || 'Remote', pt.x, pt.y - 8);
        }
      }
    }
  }

  _drawLocalPlayer(ctx, w, h, withHalo) {
    const pc = this.app.playerCtrl;
    if (!pc || !pc.mesh) return;

    const pt = this._worldToCanvas(pc.mesh.position.x, pc.mesh.position.z, w, h);
    const heading = pc.mesh.rotation.y;

    // Glowing halo pulse
    if (withHalo) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Directional pointer cone
    const arrowLen = withHalo ? 11 : 7;
    const arrowAngle = heading + Math.PI; // Three.js Y rotation to 2D canvas

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(arrowAngle);

    ctx.beginPath();
    ctx.moveTo(0, arrowLen);
    ctx.lineTo(-arrowLen * 0.6, -arrowLen * 0.5);
    ctx.lineTo(0, -arrowLen * 0.2);
    ctx.lineTo(arrowLen * 0.6, -arrowLen * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // "YOU" Label on Full Map
    if (withHalo) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', pt.x, pt.y - 12);
    }
  }
}
