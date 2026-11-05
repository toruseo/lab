/**
 * Cyber–Physical Agents — animated illustration for research-group pages.
 *
 * EMBED (minimal):
 *   <canvas class="cpa-scene" width="400" height="400"></canvas>
 *   <script src="cpa-scene.js" defer></script>
 *
 * The script auto-mounts to every <canvas class="cpa-scene"> on the page,
 * each with its own motion state. Drawing happens in a fixed 400x400
 * logical coordinate space; display size is set by CSS (width/height) and
 * the backing-store resolution is auto-synced to (CSS size x devicePixelRatio)
 * so the scene stays crisp on Retina / HiDPI / mobile displays.
 *
 * Tweak colors / palettes in the CONFIG block at the top.
 */
(function () {
  'use strict';

  // ==================================================================
  // USER CONFIG
  //   • CONFIG.road        : road surface color (dark gray by default)
  //   • CONFIG.ground      : non-road ground color (green / grass)
  //   • CONFIG.roadLine    : dashed center line
  //   • CONFIG.buildings[] : palette per building — each entry is
  //       { t: <top face>, r: <east face>, l: <south face> }.
  //       Add entries to introduce more variations.
  //   • CONFIG.cyber*      : cyber-network colors
  //   • CONFIG.link*       : cyber↔car communication colors
  // ==================================================================
  const CONFIG = {
    // --- City surfaces ---
    ground:       '#9fb094',
    road:         '#7b838a',
    roadLine:     '#efe6c8',
    buildingEdge: 'rgba(14, 26, 43, 0.22)',

    // --- Building palettes (top / east face / south face, light → dark) ---
    buildings: [
      { t: '#e8d9b4', r: '#bfb089', l: '#968867' }, // 0 cream ivory
      { t: '#d4a888', r: '#ab8466', l: '#806045' }, // 1 warm terracotta
      { t: '#adb8bd', r: '#8b969b', l: '#697479' }, // 2 cool slate
      { t: '#bcc8b0', r: '#95a08a', l: '#6f7866' }, // 3 sage green
      { t: '#c3b3c6', r: '#9c8e9f', l: '#756879' }, // 4 dusty lavender
      { t: '#a8c0c2', r: '#83999b', l: '#617275' }  // 5 pale teal
    ],

    // --- Cyber network (theme accent: deep navy #1C3177) ---
    wireRgb:      '28, 49, 119',
    cyberAgent:   '#1C3177',
    cyberGlow:    'rgba(28, 49, 119, 0.24)',

    // --- Communication link ---
    link:         'rgba(28, 49, 119, 0.75)',
    linkSoft:     'rgba(28, 49, 119, 0.18)'
  };

  // ==================================================================
  // Shared layout (static across instances)
  // ==================================================================
  const CITY_SCALE = 1.3;
  const ISO = { ox: 200, oy: 235, tw: 22 * CITY_SCALE, th: 11 * CITY_SCALE };
  function iso(gx, gy) {
    return {
      x: ISO.ox + (gx - gy) * ISO.tw * 0.5,
      y: ISO.oy + (gx + gy) * ISO.th * 0.5
    };
  }
  const N = 10;
  const ROAD_BANDS = [
    { a: 2, b: 4 },
    { a: 6, b: 8 }
  ];
  const BUILDING_ROWS = [0, 1, 4, 5, 8, 9];

  // Randomized layout — fresh per page load / per canvas mount.
  function buildCity() {
    const out = [];
    for (const gy of BUILDING_ROWS) {
      for (let gx = 0; gx < N; gx++) {
        if (Math.random() < 0.55) continue;
        const baseH = Math.random() < 0.12
          ? 12 + Math.floor(Math.random() * 10)
          : 3  + Math.floor(Math.random() * 6);
        const h = baseH * CITY_SCALE;
        const p = Math.floor(Math.random() * CONFIG.buildings.length);
        out.push({ gx, gy, h, p });
      }
    }
    return out;
  }

  function shade(hex, k) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const cl = v => Math.max(0, Math.min(255, (v * k) | 0));
    return `rgb(${cl(r)},${cl(g)},${cl(b)})`;
  }

  // ==================================================================
  // Per-canvas mount — each canvas gets its own motion state.
  // ==================================================================
  function mount(canvas) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    // Logical drawing space — fixed at 400x400 so all hardcoded layout
    // constants (ISO origin, agent positions, etc.) stay valid regardless
    // of the actual backing-store resolution.
    const W = canvas.width || 400, H = canvas.height || 400;

    // Sync the canvas backing store to (CSS size * devicePixelRatio) and
    // map the 400x400 logical space onto it via setTransform. Re-runs on
    // resize because the canvas can shrink under `max-width: 100%` on
    // narrow viewports. setTransform replaces the matrix (rather than
    // multiplying), so it's safe to call between frames.
    function syncResolution() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width  || W;
      const cssH = rect.height || H;
      canvas.width  = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    }
    syncResolution();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncResolution).observe(canvas);
    } else {
      window.addEventListener('resize', syncResolution);
    }

    // Populate each lane with 1–4 cars, evenly spaced with small jitter.
    const LANE_CFG = [
      { gy: 2.5, dir: +1 },
      { gy: 3.5, dir: -1 },
      { gy: 6.5, dir: +1 },
      { gy: 7.5, dir: -1 }
    ];
    const CAR_COLORS = ['#c55b4d', '#4d7ba6', '#d3a84e', '#6c8a5a',
                        '#b06a52', '#8a6d9a', '#5577a0', '#c6883f'];
    const cars = [];
    for (const lane of LANE_CFG) {
      const count = 1 + ((Math.random() * 4) | 0);   // 1–4
      const span = (N + 1) / count;
      for (let i = 0; i < count; i++) {
        const baseSp = 0.003 + Math.random() * 0.025;
        cars.push({
          gx: -0.5 + i * span + Math.random() * span * 0.6,
          gy: lane.gy, dir: lane.dir,
          c: CAR_COLORS[(Math.random() * CAR_COLORS.length) | 0],
          baseSp, sp: baseSp,
          nextAt: 120 + Math.random() * 300
        });
      }
    }
    const buildings = buildCity();
    const cyberAgents = [
      { x: 40,  baseY: 40,  amp: 9,  phase: 0.3, speed: 0.012, y: 40  },
      { x: 115, baseY: 90,  amp: 7,  phase: 1.1, speed: 0.015, y: 90  },
      { x: 190, baseY: 30,  amp: 10, phase: 2.0, speed: 0.010, y: 30  },
      { x: 200, baseY: 150, amp: 8,  phase: 2.6, speed: 0.013, y: 150 },
      { x: 275, baseY: 95,  amp: 9,  phase: 0.9, speed: 0.014, y: 95  },
      { x: 355, baseY: 45,  amp: 7,  phase: 1.7, speed: 0.011, y: 45  },
      { x: 360, baseY: 160, amp: 8,  phase: 0.4, speed: 0.012, y: 160 }
    ];
    const pulses = [];

    function nodePos(wp) {
      if (wp.type === 'car') {
        const p = iso(wp.ref.gx, wp.ref.gy);
        return { x: p.x, y: p.y - 2 };
      }
      return { x: wp.ref.x, y: wp.ref.y };
    }

    function spawnPulse() {
      const car = cars[(Math.random() * cars.length) | 0];
      const upward = Math.random() < 0.5;
      const hopCount = Math.random() < 0.45 ? 3 : 2;
      const pool = cyberAgents.slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const hops = pool.slice(0, hopCount).map(c => ({ type: 'cyber', ref: c }));
      const carWp = { type: 'car', ref: car };
      const waypoints = upward ? [carWp, ...hops] : [...hops, carWp];
      pulses.push({ waypoints, t: 0, segDur: 60 + Math.random() * 30 });
    }

    // ---------------- drawing ----------------
    function drawCyberAgents(t) {
      ctx.save();
      for (const a of cyberAgents) {
        a.y = a.baseY + Math.sin(t * a.speed + a.phase) * a.amp;
        a.x += Math.sin(t * a.speed * 0.5 + a.phase) * 0.08 * dtFrames;
      }
      ctx.lineWidth = 0.6;
      for (let i = 0; i < cyberAgents.length; i++) {
        for (let j = i + 1; j < cyberAgents.length; j++) {
          const a = cyberAgents[i], b = cyberAgents[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const alpha = Math.max(0, 0.55 - d / 520);
          if (alpha <= 0.03) continue;
          ctx.strokeStyle = `rgba(${CONFIG.wireRgb}, ${alpha.toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const a of cyberAgents) {
        const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 12);
        g.addColorStop(0, CONFIG.cyberGlow);
        g.addColorStop(1, 'rgba(58, 91, 184, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(a.x, a.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = CONFIG.cyberAgent;
        ctx.beginPath(); ctx.arc(a.x, a.y, 2.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function drawGround() {
      const g1 = iso(0, 0), g2 = iso(N, 0), g3 = iso(N, N), g4 = iso(0, N);
      ctx.fillStyle = CONFIG.ground;
      ctx.beginPath();
      ctx.moveTo(g1.x, g1.y);
      ctx.lineTo(g2.x, g2.y);
      ctx.lineTo(g3.x, g3.y);
      ctx.lineTo(g4.x, g4.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      for (const band of ROAD_BANDS) {
        const r1 = iso(0, band.a), r2 = iso(N, band.a),
              r3 = iso(N, band.b), r4 = iso(0, band.b);
        ctx.fillStyle = CONFIG.road;
        ctx.beginPath();
        ctx.moveTo(r1.x, r1.y);
        ctx.lineTo(r2.x, r2.y);
        ctx.lineTo(r3.x, r3.y);
        ctx.lineTo(r4.x, r4.y);
        ctx.closePath(); ctx.fill();

        ctx.strokeStyle = CONFIG.roadLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const mid = (band.a + band.b) / 2;
        const c1 = iso(0, mid), c2 = iso(N, mid);
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // cutW / cutE: the box was sliced at gx=0 / gx=N — the edges of that
    // cut face (bottom, top, both verticals) are not part of the object's
    // real outline, so they are skipped.
    function drawIsoBox(gx, gy, gw, gh, height, colT, colR, colL, edge, cutW, cutE) {
      const nw = iso(gx, gy);
      const ne = iso(gx + gw, gy);
      const se = iso(gx + gw, gy + gh);
      const sw = iso(gx, gy + gh);
      const nwT = { x: nw.x, y: nw.y - height };
      const neT = { x: ne.x, y: ne.y - height };
      const seT = { x: se.x, y: se.y - height };
      const swT = { x: sw.x, y: sw.y - height };

      ctx.fillStyle = colL;
      ctx.beginPath();
      ctx.moveTo(sw.x, sw.y);  ctx.lineTo(se.x, se.y);
      ctx.lineTo(seT.x, seT.y); ctx.lineTo(swT.x, swT.y);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = colR;
      ctx.beginPath();
      ctx.moveTo(ne.x, ne.y);  ctx.lineTo(se.x, se.y);
      ctx.lineTo(seT.x, seT.y); ctx.lineTo(neT.x, neT.y);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = colT;
      ctx.beginPath();
      ctx.moveTo(nwT.x, nwT.y); ctx.lineTo(neT.x, neT.y);
      ctx.lineTo(seT.x, seT.y); ctx.lineTo(swT.x, swT.y);
      ctx.closePath(); ctx.fill();

      if (edge) {
        ctx.strokeStyle = edge;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        // Visible bottom edges (east edge skipped when cut).
        ctx.moveTo(sw.x, sw.y);  ctx.lineTo(se.x, se.y);
        if (!cutE) { ctx.moveTo(se.x, se.y); ctx.lineTo(ne.x, ne.y); }
        // Visible vertical edges (nw is fully hidden; cut-face corners skipped).
        if (!cutW) { ctx.moveTo(sw.x, sw.y); ctx.lineTo(swT.x, swT.y); }
        if (!cutE) {
          ctx.moveTo(se.x, se.y); ctx.lineTo(seT.x, seT.y);
          ctx.moveTo(ne.x, ne.y); ctx.lineTo(neT.x, neT.y);
        }
        // Top edges — all four, minus the cut-face side.
        ctx.moveTo(swT.x, swT.y); ctx.lineTo(seT.x, seT.y);
        ctx.moveTo(neT.x, neT.y); ctx.lineTo(nwT.x, nwT.y);
        if (!cutE) { ctx.moveTo(seT.x, seT.y); ctx.lineTo(neT.x, neT.y); }
        if (!cutW) { ctx.moveTo(nwT.x, nwT.y); ctx.lineTo(swT.x, swT.y); }
        ctx.stroke();
      }
    }

    function drawBuilding(b) {
      const pal = CONFIG.buildings[b.p];
      drawIsoBox(b.gx, b.gy, 1, 1, b.h, pal.t, pal.r, pal.l, CONFIG.buildingEdge);
    }

    const CAR_L = 0.85, CAR_W = 0.55, CAR_H = 4 * CITY_SCALE;
    // Render the portion of the car whose gx lies in [0, N]. Treats the
    // car as a rigid box and the road end as a cutting plane in 3D, so the
    // box is sliced exactly at gx=0 / gx=N rather than clipped in screen
    // space. A ghost copy shifted by ±N takes care of the other half when
    // the car straddles the wrap.
    function drawCar(car) {
      const l = Math.max(car.gx - CAR_L / 2, 0);
      const r = Math.min(car.gx + CAR_L / 2, N);
      if (r <= l) return;
      drawIsoBox(
        l, car.gy - CAR_W / 2, r - l, CAR_W, CAR_H,
        shade(car.c, 1.25), car.c, shade(car.c, 0.70), 'rgba(0,0,0,0.25)',
        car.gx - CAR_L / 2 < 0, car.gx + CAR_L / 2 > N
      );
    }

    function drawCityContent() {
      // Car-following: slow down toward leader's speed when the gap shrinks.
      const LANE_LEN = N;           // torus period: lane wraps seamlessly at gx=0 ≡ gx=N
      const GAP_SAFE = 2.0;         // start easing off the throttle
      const GAP_HARD = 1.2;         // fully match leader (or crawl behind)
      // Exponential smoothing rate is per-60fps-frame: rescale by dtFrames so the
      // approach speed stays the same regardless of refresh rate.
      const smooth = 1 - Math.pow(1 - 0.1, dtFrames);
      // Occasional desired-speed refresh per car (random interval, max ~15s @ 60fps).
      for (const c of cars) {
        if (t >= c.nextAt) {
          c.baseSp = 0.003 + Math.random() * 0.025;
          c.nextAt = t + 120 + Math.random() * 300;
        }
      }
      for (const c of cars) {
        let minGap = Infinity, leaderSp = c.baseSp;
        for (const o of cars) {
          if (o === c || o.gy !== c.gy || o.dir !== c.dir) continue;
          let d = c.dir > 0 ? o.gx - c.gx : c.gx - o.gx;
          if (d <= 0) d += LANE_LEN;
          if (d < minGap) { minGap = d; leaderSp = o.sp; }
        }
        let target = c.baseSp;
        if (minGap < GAP_SAFE) {
          const k = Math.max(0, (minGap - GAP_HARD) / (GAP_SAFE - GAP_HARD));
          target = leaderSp + (c.baseSp - leaderSp) * k;
          if (minGap < GAP_HARD) target = Math.min(target, leaderSp * 0.9);
        }
        c.sp += (target - c.sp) * smooth;
      }
      for (const c of cars) {
        c.gx += c.sp * c.dir * dtFrames;
        while (c.gx < 0)  c.gx += N;
        while (c.gx >= N) c.gx -= N;
      }
      // Painter's algorithm by (gy, gx). Near either edge of the lane we
      // queue a ghost copy shifted by ±N so the car body splits cleanly
      // across the wrap instead of snapping from one side to the other.
      const GHOST = CAR_L / 2 + 0.05;
      const objs = [];
      for (const b of buildings) objs.push({ type: 'b', obj: b, ky: b.gy, kx: b.gx });
      for (const c of cars) {
        objs.push({ type: 'c', obj: c, ky: c.gy, kx: c.gx });
        if (c.gx > N - GHOST) {
          const g = { ...c, gx: c.gx - N };
          objs.push({ type: 'c', obj: g, ky: g.gy, kx: g.gx });
        }
        if (c.gx < GHOST) {
          const g = { ...c, gx: c.gx + N };
          objs.push({ type: 'c', obj: g, ky: g.gy, kx: g.gx });
        }
      }
      objs.sort((a, b) => (a.ky - b.ky) || (a.kx - b.kx));
      for (const o of objs) {
        if (o.type === 'b') drawBuilding(o.obj);
        else drawCar(o.obj);
      }
    }

    function drawPulses() {
      ctx.save();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += dtFrames;
        const segs = p.waypoints.length - 1;
        const total = p.segDur * segs;
        if (p.t >= total) { pulses.splice(i, 1); continue; }

        const segIdx = Math.min(segs - 1, (p.t / p.segDur) | 0);
        const u = (p.t - segIdx * p.segDur) / p.segDur;

        const from = nodePos(p.waypoints[segIdx]);
        const to   = nodePos(p.waypoints[segIdx + 1]);

        const dx = to.x - from.x, dy = to.y - from.y;
        const d  = Math.hypot(dx, dy) || 1;
        const arc = Math.min(14, d * 0.18);
        const mx = (from.x + to.x) / 2 + (-dy / d) * arc;
        const my = (from.y + to.y) / 2 + ( dx / d) * arc;

        const iu = 1 - u;
        const x = iu * iu * from.x + 2 * iu * u * mx + u * u * to.x;
        const y = iu * iu * from.y + 2 * iu * u * my + u * u * to.y;

        ctx.strokeStyle = CONFIG.linkSoft;
        ctx.lineWidth = 0.6;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx, my, to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = CONFIG.link;
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // ---------------- loop ----------------
    // `t` is a virtual frame counter expressed in 60fps-equivalent units, so
    // every duration / interval / spawn threshold tuned for 60fps keeps its
    // meaning regardless of the actual display refresh rate. `dtFrames`
    // (= seconds since last frame * 60) is exposed to the draw functions and
    // multiplied into per-frame deltas (positions, smoothing, pulse progress).
    let t = 0, lastSpawn = 0;
    let lastTs = 0;
    let dtFrames = 1;
    function frame(ts) {
      // requestAnimationFrame passes a DOMHighResTimeStamp in ms.
      const dtSec = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 1 / 60;
      lastTs = ts;
      dtFrames = dtSec * 60;
      t += dtFrames;
      ctx.clearRect(0, 0, W, H);
      drawCyberAgents(t);
      drawGround();
      drawCityContent();
      if (t - lastSpawn > 60 && pulses.length < 4 && Math.random() < 0.55) {
        spawnPulse(); lastSpawn = t;
      }
      drawPulses();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ==================================================================
  // Auto-mount to every <canvas class="cpa-scene"> on the page.
  // ==================================================================
  function init() {
    document.querySelectorAll('canvas.cpa-scene').forEach(mount);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
