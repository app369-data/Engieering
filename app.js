// ============ NAVIGATION ============
function switchPage(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  btn.classList.add('active');
  setTimeout(() => {
    if (page === 'beam') drawBeam();
    else if (page === 'truss') drawTruss();
    else if (page === 'friction') drawFriction();
    else if (page === 'centroid') drawCentroid();
    else if (page === 'cable') drawCable();
    else if (page === 'distributed') drawDistributed();
  }, 50);
}

// ============ BEAM SOLVER ============
let beamData = { supports: [], pointLoads: [], distLoads: [], solved: null };

function addSupport() {
  beamData.supports.push({
    type: document.getElementById('supportType').value,
    pos: parseFloat(document.getElementById('supportPos').value)
  });
  updateSupportList(); drawBeam();
}
function updateSupportList() {
  document.getElementById('supportList').innerHTML = beamData.supports.map((s, i) =>
    `<div class="item-row"><span>${s.type} @ ${s.pos}m</span><button class="btn-danger" onclick="removeSupport(${i})">×</button></div>`).join('');
}
function removeSupport(i) { beamData.supports.splice(i,1); updateSupportList(); drawBeam(); }

function addPointLoad() {
  beamData.pointLoads.push({
    mag: parseFloat(document.getElementById('ptLoadMag').value),
    pos: parseFloat(document.getElementById('ptLoadPos').value)
  });
  updatePointLoadList(); drawBeam();
}
function updatePointLoadList() {
  document.getElementById('pointLoadList').innerHTML = beamData.pointLoads.map((l, i) =>
    `<div class="item-row"><span>${l.mag}N @ ${l.pos}m</span><button class="btn-danger" onclick="removePointLoad(${i})">×</button></div>`).join('');
}
function removePointLoad(i) { beamData.pointLoads.splice(i,1); updatePointLoadList(); drawBeam(); }

function addDistributedLoad() {
  beamData.distLoads.push({
    w: parseFloat(document.getElementById('distLoadW').value),
    start: parseFloat(document.getElementById('distLoadStart').value),
    end: parseFloat(document.getElementById('distLoadEnd').value)
  });
  updateDistLoadList(); drawBeam();
}
function updateDistLoadList() {
  document.getElementById('distLoadList').innerHTML = beamData.distLoads.map((l, i) =>
    `<div class="item-row"><span>${l.w}N/m [${l.start}-${l.end}m]</span><button class="btn-danger" onclick="removeDistLoad(${i})">×</button></div>`).join('');
}
function removeDistLoad(i) { beamData.distLoads.splice(i,1); updateDistLoadList(); drawBeam(); }

function drawArrow(ctx, x1, y1, x2, y2, color, width=2, label='') {
  const headLen = 10;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(ang - Math.PI/6), y2 - headLen * Math.sin(ang - Math.PI/6));
  ctx.lineTo(x2 - headLen * Math.cos(ang + Math.PI/6), y2 - headLen * Math.sin(ang + Math.PI/6));
  ctx.closePath(); ctx.fill();
  if (label) {
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(label, x1 - 15, y1 - 5);
  }
}

function drawBeam() {
  const canvas = document.getElementById('beamCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 560;
  ctx.clearRect(0, 0, W, H);

  const L = parseFloat(document.getElementById('beamLength').value) || 6;
  const margin = 40;
  const beamY = 100;
  const scale = (W - 2*margin) / L;

  function toX(x) { return margin + x * scale; }

  // Grid
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

  // Beam
  ctx.fillStyle = '#64748b';
  ctx.fillRect(toX(0), beamY - 8, L * scale, 16);
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
  ctx.strokeRect(toX(0), beamY - 8, L * scale, 16);

  // Draw supports
  beamData.supports.forEach(s => {
    const sx = toX(s.pos);
    ctx.fillStyle = '#1e40af'; ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 2;
    if (s.type === 'pin') {
      ctx.beginPath();
      ctx.moveTo(sx, beamY + 8);
      ctx.lineTo(sx - 15, beamY + 30);
      ctx.lineTo(sx + 15, beamY + 30);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx - 20, beamY + 30); ctx.lineTo(sx + 20, beamY + 30); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(sx - 18 + i*9, beamY + 30);
        ctx.lineTo(sx - 25 + i*9, beamY + 38);
        ctx.stroke();
      }
    } else if (s.type === 'roller') {
      ctx.beginPath();
      ctx.moveTo(sx, beamY + 8);
      ctx.lineTo(sx - 15, beamY + 28);
      ctx.lineTo(sx + 15, beamY + 28);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx - 8, beamY + 35, 5, 0, Math.PI*2);
      ctx.arc(sx + 8, beamY + 35, 5, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx - 20, beamY + 40); ctx.lineTo(sx + 20, beamY + 40); ctx.stroke();
    } else if (s.type === 'fixed') {
      ctx.fillRect(sx - 15, beamY - 40, 15, 80);
      ctx.strokeRect(sx - 15, beamY - 40, 15, 80);
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(sx - 15, beamY - 35 + i*10);
        ctx.lineTo(sx - 30, beamY - 25 + i*10);
        ctx.stroke();
      }
    }
  });

  // Point loads
  beamData.pointLoads.forEach(l => {
    const x = toX(l.pos);
    const arrowLen = Math.min(50, Math.abs(l.mag) / 30);
    drawArrow(ctx, x, beamY - 8 - arrowLen, x, beamY - 8, '#dc2626', 3, `${l.mag}N`);
  });

  // Distributed loads
  beamData.distLoads.forEach(l => {
    const x1 = toX(l.start), x2 = toX(l.end);
    const arrowH = Math.min(35, Math.abs(l.w) / 20);
    ctx.strokeStyle = '#dc2626'; ctx.fillStyle = '#dc2626'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, beamY - 8 - arrowH); ctx.lineTo(x2, beamY - 8 - arrowH); ctx.stroke();
    const nArrows = Math.max(4, Math.floor((x2 - x1) / 25));
    for (let i = 0; i <= nArrows; i++) {
      const ax = x1 + (x2 - x1) * i / nArrows;
      drawArrow(ctx, ax, beamY - 8 - arrowH, ax, beamY - 8, '#dc2626', 1.5);
    }
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${l.w} N/m`, (x1+x2)/2 - 20, beamY - 15 - arrowH);
  });

  // Draw solved reactions and diagrams
  if (beamData.solved) {
    const { reactions, x, V, M } = beamData.solved;
    
    // Reactions
    reactions.forEach(r => {
      const x_pos = toX(r.pos);
      if (r.Ry !== 0) {
        const dir = r.Ry > 0 ? 1 : -1;
        drawArrow(ctx, x_pos, beamY + 50 + dir*40, x_pos, beamY + 8, '#16a34a', 3, `R=${r.Ry.toFixed(0)}N`);
      }
      if (r.M !== 0) {
        ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 3;
        ctx.beginPath();
        const dir = r.M >= 0 ? 1 : -1;
        ctx.arc(x_pos, beamY + 60, 20, 0, Math.PI * 1.5 * dir, dir < 0);
        ctx.stroke();
        ctx.fillStyle = '#16a34a'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`M=${r.M.toFixed(0)}`, x_pos + 25, beamY + 65);
      }
    });

    // SFD
    const sfdY = 220, sfdH = 80;
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Shear Force Diagram (SFD)', margin, sfdY - 10);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(margin, sfdY + sfdH/2); ctx.lineTo(W - margin, sfdY + sfdH/2); ctx.stroke();
    
    const Vmax = Math.max(...V.map(Math.abs), 0.001);
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < V.length; i++) {
      const px = toX(x[i]);
      const py = sfdY + sfdH/2 - (V[i] / Vmax) * (sfdH/2 - 5);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // BMD
    const bmdY = 380, bmdH = 100;
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Bending Moment Diagram (BMD)', margin, bmdY - 10);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(margin, bmdY + bmdH/2); ctx.lineTo(W - margin, bmdY + bmdH/2); ctx.stroke();
    
    const Mmax = Math.max(...M.map(Math.abs), 0.001);
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < M.length; i++) {
      const px = toX(x[i]);
      const py = bmdY + bmdH/2 - (M[i] / Mmax) * (bmdH/2 - 5);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Beam length dimension
  ctx.strokeStyle = '#475569'; ctx.fillStyle = '#475569'; ctx.lineWidth = 1.5;
  const dimY = beamY + 58;
  ctx.beginPath(); ctx.moveTo(toX(0), dimY); ctx.lineTo(toX(L), dimY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toX(0), dimY-5); ctx.lineTo(toX(0), dimY+5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toX(L), dimY-5); ctx.lineTo(toX(L), dimY+5); ctx.stroke();
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`L = ${L.toFixed(2)} m`, (toX(0)+toX(L))/2 - 28, dimY - 7);
  ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
  ctx.fillText(`1m = ${scale.toFixed(0)}px`, margin, H - 10);
}

function solveBeam() {
  const L = parseFloat(document.getElementById('beamLength').value) || 6;

  // Count unknowns
  let unknowns = 0;
  beamData.supports.forEach(s => {
    if (s.type === 'pin') unknowns += 2;
    else if (s.type === 'roller') unknowns += 1;
    else if (s.type === 'fixed') unknowns += 3;
  });

  if (unknowns === 0) {
    document.getElementById('beamResults').innerHTML = '<span style="color:#f87171">️ No supports!</span>';
    return;
  }
  if (unknowns > 3) {
    document.getElementById('beamResults').innerHTML = '<span style="color:#fbbf24">⚠️ Statically indeterminate (more than 3 unknowns).</span>';
    return;
  }

  const reactions = [];
  let sumFy = 0, sumM = 0;

  beamData.pointLoads.forEach(l => { sumFy += l.mag; sumM += l.mag * l.pos; });
  beamData.distLoads.forEach(l => {
    const total = l.w * (l.end - l.start);
    const centroid = (l.start + l.end) / 2;
    sumFy += total; sumM += total * centroid;
  });

  // Simple solver for common cases
  if (beamData.supports.length === 2) {
    const s1 = beamData.supports[0], s2 = beamData.supports[1];
    if (s1.type === 'pin' && s2.type === 'roller') {
      const R2 = sumM / (s2.pos - s1.pos);
      const R1 = sumFy - R2;
      reactions.push({ pos: s1.pos, Ry: R1 });
      reactions.push({ pos: s2.pos, Ry: R2 });
    } else if (s1.type === 'roller' && s2.type === 'pin') {
      const R1 = sumM / (s1.pos - s2.pos);
      const R2 = sumFy - R1;
      reactions.push({ pos: s1.pos, Ry: R1 });
      reactions.push({ pos: s2.pos, Ry: R2 });
    }
  } else if (beamData.supports.length === 1 && beamData.supports[0].type === 'fixed') {
    const s = beamData.supports[0];
    reactions.push({ pos: s.pos, Ry: sumFy, M: sumM });
  }

  const n = 200;
  const x = [], V = [], M = [];
  for (let i = 0; i <= n; i++) {
    const xi = (L * i) / n;
    x.push(xi);
    let vi = 0;
    reactions.forEach(r => { if (r.pos <= xi) vi += r.Ry; });
    beamData.pointLoads.forEach(l => { if (l.pos <= xi) vi -= l.mag; });
    beamData.distLoads.forEach(l => {
      if (xi > l.start) vi -= l.w * (Math.min(xi, l.end) - l.start);
    });
    V.push(vi);
    let mi = 0;
    reactions.forEach(r => {
      if (r.pos <= xi) { mi += r.Ry * (xi - r.pos); if (r.M) mi -= r.M; }
    });
    beamData.pointLoads.forEach(l => { if (l.pos <= xi) mi -= l.mag * (xi - l.pos); });
    beamData.distLoads.forEach(l => {
      if (xi > l.start) {
        const end = Math.min(xi, l.end);
        const load = l.w * (end - l.start);
        mi -= load * (xi - (l.start + end) / 2);
      }
    });
    M.push(mi);
  }

  beamData.solved = { reactions, x, V, M };
  
  const Vmax = Math.max(...V.map(Math.abs));
  const Mmax = Math.max(...M.map(Math.abs));
  const VmaxIdx = V.findIndex(v => Math.abs(v) === Vmax);
  const MmaxIdx = M.findIndex(m => Math.abs(m) === Mmax);

  let html = '<h3 style="color:#87ceeb;margin-bottom:8px;">Support Reactions</h3>';
  reactions.forEach(r => {
    html += `<div class="result-item"><span class="result-label">x=${r.pos}m</span><span class="result-value">Ry=${r.Ry.toFixed(1)}N${r.M ? `, M=${r.M.toFixed(1)}N·m` : ''}</span></div>`;
  });
  html += '<h3 style="color:#87ceeb;margin:10px 0 8px 0;">Maximum Values</h3>';
  html += `<div class="result-item"><span class="result-label">Max Shear</span><span class="result-value">${Vmax.toFixed(1)}N @ x=${x[VmaxIdx].toFixed(2)}m</span></div>`;
  html += `<div class="result-item"><span class="result-label">Max Moment</span><span class="result-value">${Mmax.toFixed(1)}N·m @ x=${x[MmaxIdx].toFixed(2)}m</span></div>`;

  document.getElementById('beamResults').innerHTML = html;
  drawBeam();
}

// ============ TRUSS SOLVER ============
let trussData = { joints: [], members: [], loads: [] };
let trussSolved = null;

function addJoint() {
  const x = parseFloat(document.getElementById('jointX').value);
  const y = parseFloat(document.getElementById('jointY').value);
  const support = document.getElementById('jointSupport').value;
  const id = trussData.joints.length;
  trussData.joints.push({ id, x, y, support });
  updateJointList(); drawTruss();
}
function updateJointList() {
  document.getElementById('jointList').innerHTML = trussData.joints.map((j, i) =>
    `<div class="item-row"><span>J${i}: (${j.x},${j.y}) ${j.support!=='none'?'['+j.support+']':''}</span><button class="btn-danger" onclick="removeJoint(${i})">×</button></div>`).join('');
}
function removeJoint(i) { trussData.joints.splice(i,1); updateJointList(); drawTruss(); }

function addMember() {
  const j1 = parseInt(document.getElementById('memJ1').value);
  const j2 = parseInt(document.getElementById('memJ2').value);
  if (j1 === j2) { alert('Joints must be different'); return; }
  trussData.members.push({ j1, j2 });
  updateMemberList(); drawTruss();
}
function updateMemberList() {
  document.getElementById('memberList').innerHTML = trussData.members.map((m, i) =>
    `<div class="item-row"><span>M${i}: J${m.j1}↔J${m.j2}</span><button class="btn-danger" onclick="removeMember(${i})">×</button></div>`).join('');
}
function removeMember(i) { trussData.members.splice(i,1); updateMemberList(); drawTruss(); }

function addLoad() {
  trussData.loads.push({
    joint: parseInt(document.getElementById('loadJoint').value),
    mag: parseFloat(document.getElementById('loadMag').value),
    ang: parseFloat(document.getElementById('loadAng').value)
  });
  updateLoadList(); drawTruss();
}
function updateLoadList() {
  document.getElementById('loadList').innerHTML = trussData.loads.map((l, i) =>
    `<div class="item-row"><span>J${l.joint}: ${l.mag}N @ ${l.ang}°</span><button class="btn-danger" onclick="removeLoad(${i})">×</button></div>`).join('');
}
function removeLoad(i) { trussData.loads.splice(i,1); updateLoadList(); drawTruss(); }

function loadTrussExample() {
  trussData.joints = [
    { id:0, x:0, y:0, support:'pin' },
    { id:1, x:2, y:0, support:'none' },
    { id:2, x:4, y:0, support:'roller' },
    { id:3, x:1, y:1.5, support:'none' },
    { id:4, x:3, y:1.5, support:'none' }
  ];
  trussData.members = [
    {j1:0,j2:1}, {j1:1,j2:2}, {j1:0,j2:3}, {j1:2,j2:4}, {j1:3,j2:4}, {j1:1,j2:3}, {j1:1,j2:4}
  ];
  trussData.loads = [{ joint:1, mag:1000, ang:-90 }, { joint:3, mag:500, ang:-90 }];
  updateJointList(); updateMemberList(); updateLoadList(); drawTruss();
}

function drawTruss() {
  const canvas = document.getElementById('trussCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 560;
  ctx.clearRect(0, 0, W, H);

  if (trussData.joints.length === 0) {
    ctx.fillStyle = '#64748b'; ctx.font = '14px sans-serif';
    ctx.fillText('Add joints to visualize truss', W/2 - 120, H/2);
    return;
  }

  // Compute bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  trussData.joints.forEach(j => {
    minX = Math.min(minX, j.x); maxX = Math.max(maxX, j.x);
    minY = Math.min(minY, j.y); maxY = Math.max(maxY, j.y);
  });
  const dx = maxX - minX || 1, dy = maxY - minY || 1;
  const margin = 60;
  const scale = Math.min((W - 2*margin) / dx, (H - 2*margin) / dy);
  const offsetX = (W - dx * scale) / 2 - minX * scale;
  const offsetY = (H + dy * scale) / 2 + minY * scale;

  function toScreen(x, y) { return [offsetX + x * scale, offsetY - y * scale]; }

  // Grid
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

  // Draw members
  trussData.members.forEach((m, i) => {
    const j1 = trussData.joints[m.j1], j2 = trussData.joints[m.j2];
    if (!j1 || !j2) return;
    const [x1, y1] = toScreen(j1.x, j1.y), [x2, y2] = toScreen(j2.x, j2.y);
    let color = '#475569', width = 4;
    if (trussSolved) {
      const f = trussSolved.memberForces[i];
      if (Math.abs(f) < 0.01) color = '#94a3b8';
      else if (f > 0) color = '#4ade80';
      else color = '#f87171';
    }
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    if (trussSolved) {
      const mx = (x1+x2)/2, my = (y1+y2)/2;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 11px sans-serif';
      ctx.fillText(trussSolved.memberForces[i].toFixed(0) + 'N', mx + 5, my - 5);
    }
  });

  // Draw joints
  trussData.joints.forEach(j => {
    const [x, y] = toScreen(j.x, j.y);
    ctx.fillStyle = '#1e40af'; ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`J${j.id}`, x + 12, y - 12);

    if (j.support === 'pin') {
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x - 12, y + 25);
      ctx.lineTo(x + 12, y + 25);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 15, y + 25); ctx.lineTo(x + 15, y + 25); ctx.stroke();
    } else if (j.support === 'roller') {
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x - 12, y + 22);
      ctx.lineTo(x + 12, y + 22);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - 6, y + 27, 4, 0, Math.PI*2);
      ctx.arc(x + 6, y + 27, 4, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
    }
  });

  // Draw loads
  trussData.loads.forEach(l => {
    const j = trussData.joints[l.joint];
    if (!j) return;
    const [x, y] = toScreen(j.x, j.y);
    const rad = l.ang * Math.PI / 180;
    const arrowLen = Math.min(60, Math.abs(l.mag) / 20);
    const dx = Math.cos(rad) * arrowLen, dy = -Math.sin(rad) * arrowLen;
    drawArrow(ctx, x - dx, y + dy, x, y, '#dc2626', 3, `${l.mag}N`);
  });

  // Draw reactions
  if (trussSolved && trussSolved.reactions) {
    trussSolved.reactions.forEach(r => {
      const [x, y] = toScreen(r.x, r.y);
      if (r.Rx !== 0) {
        const dir = r.Rx > 0 ? 1 : -1;
        drawArrow(ctx, x - dir*50, y, x, y, '#16a34a', 3, `Rx=${r.Rx.toFixed(0)}N`);
      }
      if (r.Ry !== 0) {
        const dir = r.Ry > 0 ? 1 : -1;
        drawArrow(ctx, x, y - dir*50, x, y, '#16a34a', 3, `Ry=${r.Ry.toFixed(0)}N`);
      }
    });
  }
}

function solveTruss() {
  const J = trussData.joints.length, M = trussData.members.length;
  if (J === 0 || M === 0) { document.getElementById('trussResults').innerHTML = '<span style="color:#f87171">️ Add joints and members!</span>'; return; }
  
  let nReactions = 0;
  trussData.joints.forEach(j => {
    if (j.support === 'pin') nReactions += 2;
    else if (j.support === 'roller') nReactions += 1;
  });
  const nUnknowns = M + nReactions, nEquations = 2 * J;
  if (nUnknowns !== nEquations) {
    document.getElementById('trussResults').innerHTML = `<span style="color:#fbbf24">️ ${nUnknowns > nEquations ? 'indeterminate' : 'unstable'}: ${nUnknowns} unknowns, ${nEquations} equations.</span>`;
    return;
  }

  const A = Array.from({length: nEquations}, () => new Array(nUnknowns).fill(0));
  const b = new Array(nEquations).fill(0);
  const jointLoads = Array.from({length: J}, () => ({Fx: 0, Fy: 0}));
  trussData.loads.forEach(l => {
    if (l.joint < J) {
      const rad = l.ang * Math.PI / 180;
      jointLoads[l.joint].Fx += l.mag * Math.cos(rad);
      jointLoads[l.joint].Fy += l.mag * Math.sin(rad);
    }
  });

  trussData.members.forEach((m, mi) => {
    const j1 = trussData.joints[m.j1], j2 = trussData.joints[m.j2];
    const dx = j2.x - j1.x, dy = j2.y - j1.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    const cx = dx / len, cy = dy / len;
    A[2*m.j1][mi] = cx; A[2*m.j1+1][mi] = cy;
    A[2*m.j2][mi] = -cx; A[2*m.j2+1][mi] = -cy;
  });

  let rIdx = M;
  const reactionMeta = [];
  trussData.joints.forEach((j, ji) => {
    if (j.support === 'pin') {
      A[2*ji][rIdx] = 1; reactionMeta.push({ joint: ji, type: 'Rx', idx: rIdx }); rIdx++;
      A[2*ji+1][rIdx] = 1; reactionMeta.push({ joint: ji, type: 'Ry', idx: rIdx }); rIdx++;
    } else if (j.support === 'roller') {
      A[2*ji+1][rIdx] = 1; reactionMeta.push({ joint: ji, type: 'Ry', idx: rIdx }); rIdx++;
    }
  });

  for (let j = 0; j < J; j++) { b[2*j] = -jointLoads[j].Fx; b[2*j+1] = -jointLoads[j].Fy; }
  const x = gaussianSolve(A, b);
  if (!x) { document.getElementById('trussResults').innerHTML = '<span style="color:#f87171">⚠️ Singular matrix.</span>'; return; }

  const memberForces = x.slice(0, M), reactionVals = x.slice(M);
  let html = '<h3 style="color:#87ceeb;margin-bottom:8px;">🔗 Member Forces</h3>';
  trussData.members.forEach((m, i) => {
    const f = memberForces[i];
    let cls = 'zero', label = 'Zero';
    if (f > 0.01) { cls = 'tension'; label = 'Tension'; }
    else if (f < -0.01) { cls = 'compression'; label = 'Compression'; }
    html += `<div class="result-item"><span class="result-label">M${i}: J${m.j1}↔J${m.j2}</span><span class="result-value ${cls}">${f.toFixed(1)}N (${label})</span></div>`;
  });
  html += '<h3 style="color:#87ceeb;margin:10px 0 8px 0;">🔩 Support Reactions</h3>';
  reactionMeta.forEach((r, i) => {
    html += `<div class="result-item"><span class="result-label">J${r.joint} ${r.type}</span><span class="result-value">${reactionVals[i].toFixed(1)}N</span></div>`;
  });

  document.getElementById('trussResults').innerHTML = html;
  const reactions = [];
  reactionMeta.forEach((r, i) => {
    const j = trussData.joints[r.joint];
    let existing = reactions.find(x => x.x === j.x && x.y === j.y);
    if (!existing) { existing = { x: j.x, y: j.y, Rx: 0, Ry: 0 }; reactions.push(existing); }
    if (r.type === 'Rx') existing.Rx = reactionVals[i]; else existing.Ry = reactionVals[i];
  });
  trussSolved = { memberForces, reactions };
  drawTruss();
}

function gaussianSolve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i+1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    if (Math.abs(M[i][i]) < 1e-10) return null;
    for (let k = i+1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n-1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i+1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return x;
}

// ============ FRICTION SOLVER ============
let frictionSolved = null;

function updateFrictionUI() {
  const type = document.getElementById('frictionType').value;
  document.getElementById('frictionIncline').classList.toggle('hidden', type !== 'incline' && type !== 'horizontal');
  document.getElementById('frictionBelt').classList.toggle('hidden', type !== 'belt');
  if (type === 'horizontal') document.getElementById('fricAngle').value = 0;
  drawFriction();
}

function drawFriction() {
  const canvas = document.getElementById('frictionCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 560;
  ctx.clearRect(0, 0, W, H);

  const type = document.getElementById('frictionType').value;
  
  if (type === 'incline' || type === 'horizontal') {
    const angle = parseFloat(document.getElementById('fricAngle').value) * Math.PI / 180;
    const W_val = parseFloat(document.getElementById('fricWeight').value);
    const muS = parseFloat(document.getElementById('fricMuS').value);
    const muK = parseFloat(document.getElementById('fricMuK').value);
    const P = parseFloat(document.getElementById('fricApplied').value);
    const Pangle = parseFloat(document.getElementById('fricForceAngle').value) * Math.PI / 180;

    const groundY = 420;
    const groundLeft = 60;
    const groundRight = W - 60;
    const groundLen = groundRight - groundLeft;
    
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(groundLeft, groundY);
    ctx.lineTo(groundLeft + groundLen * Math.cos(angle), groundY - groundLen * Math.sin(angle));
    ctx.stroke();
    
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
    const inclineEndX = groundLeft + groundLen * Math.cos(angle);
    const inclineEndY = groundY - groundLen * Math.sin(angle);
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const px = groundLeft + (inclineEndX - groundLeft) * t;
      const py = groundY + (inclineEndY - groundY) * t;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 10, py + 15);
      ctx.stroke();
    }

    const blockT = 0.5;
    const blockX = groundLeft + (inclineEndX - groundLeft) * blockT;
    const blockY = groundY + (inclineEndY - groundY) * blockT;
    const blockSize = 70;
    
    ctx.save();
    ctx.translate(blockX, blockY);
    ctx.rotate(-angle);
    ctx.fillStyle = '#1e40af';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.fillRect(-blockSize/2, -blockSize, blockSize, blockSize);
    ctx.strokeRect(-blockSize/2, -blockSize, blockSize, blockSize);
    ctx.restore();

    const N = W_val * Math.cos(angle) - P * Math.sin(Pangle);
    const fs_max = muS * N;
    const fk = muK * N;
    const F_parallel = W_val * Math.sin(angle) + P * Math.cos(Pangle);
    const isMoving = F_parallel > fs_max;
    const f_actual = isMoving ? fk : Math.min(F_parallel, fs_max);

    const cx = blockX, cy = blockY - blockSize/2;
    const forceScale = 0.8;

    drawArrow(ctx, cx, cy, cx, cy + W_val * forceScale * 0.3, '#dc2626', 3, `W=${W_val}N`);
    
    const nLen = N * forceScale * 0.3;
    drawArrow(ctx, cx, cy, cx + nLen * Math.sin(angle), cy - nLen * Math.cos(angle), '#2563eb', 3, `N=${N.toFixed(0)}N`);
    
    const fLen = f_actual * forceScale * 0.3;
    drawArrow(ctx, cx, cy, cx - fLen * Math.cos(angle), cy + fLen * Math.sin(angle), '#f59e0b', 3, `f=${f_actual.toFixed(0)}N`);
    
    if (P > 0) {
      const pAngleGlobal = -angle + Pangle;
      const pLen = P * forceScale * 0.3;
      drawArrow(ctx, cx, cy, cx + pLen * Math.cos(pAngleGlobal), cy - pLen * Math.sin(pAngleGlobal), '#16a34a', 3, `P=${P}N`);
    }

    const wParLen = W_val * Math.sin(angle) * forceScale * 0.3;
    const wPerpLen = W_val * Math.cos(angle) * forceScale * 0.3;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + wParLen * Math.cos(angle), cy - wParLen * Math.sin(angle));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - wPerpLen * Math.sin(angle), cy + wPerpLen * Math.cos(angle));
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`W∥=${(W_val*Math.sin(angle)).toFixed(0)}N`, cx + 10, cy + 30);
    ctx.fillText(`W⊥=${(W_val*Math.cos(angle)).toFixed(0)}N`, cx - 60, cy + 20);

    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(groundLeft + 80, groundY, 40, -angle, 0);
    ctx.stroke();
    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`θ=${(angle*180/Math.PI).toFixed(0)}°`, groundLeft + 100, groundY - 10);

    ctx.fillStyle = isMoving ? '#dc2626' : '#16a34a';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(isMoving ? '⚠️ MOVING' : '✓ STATIONARY', 40, 40);
    
    const phi = Math.atan(muS);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const coneLen = 60;
    ctx.lineTo(cx + coneLen * Math.sin(angle + phi), cy - coneLen * Math.cos(angle + phi));
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + coneLen * Math.sin(angle - phi), cy - coneLen * Math.cos(angle - phi));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`φ=${(phi*180/Math.PI).toFixed(1)}°`, cx + 50, cy - 40);

  } else if (type === 'belt') {
    const T1 = parseFloat(document.getElementById('beltT1').value);
    const mu = parseFloat(document.getElementById('beltMu').value);
    const beta = parseFloat(document.getElementById('beltAngle').value) * Math.PI / 180;
    const T2 = T1 * Math.exp(mu * beta);

    const cx = W / 2, cy = 250;
    const r = 100;
    
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, Math.PI/2, Math.PI/2 + beta, false);
    ctx.stroke();
    
    const startAngle = Math.PI/2;
    const endAngle = Math.PI/2 + beta;
    const x1 = cx + (r+4) * Math.cos(startAngle);
    const y1 = cy + (r+4) * Math.sin(startAngle);
    const x2 = cx + (r+4) * Math.cos(endAngle);
    const y2 = cy + (r+4) * Math.sin(endAngle);
    
    drawArrow(ctx, x1, y1, x1, y1 + 80, '#dc2626', 3, `T₁=${T1}N`);
    drawArrow(ctx, x2, y2, x2, y2 + 80, '#16a34a', 3, `T₂=${T2.toFixed(0)}N`);
    
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 30, startAngle, endAngle);
    ctx.stroke();
    const midAngle = (startAngle + endAngle) / 2;
    const labelX = cx + (r + 50) * Math.cos(midAngle);
    const labelY = cy + (r + 50) * Math.sin(midAngle);
    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`β=${(beta*180/Math.PI).toFixed(0)}°`, labelX - 20, labelY);
    
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`T₂ = T₁·e^(μβ)`, 40, 40);
    ctx.fillText(`T₂ = ${T1}·e^(${mu}×${(beta*180/Math.PI).toFixed(0)}°×π/180)`, 40, 65);
    ctx.fillText(`T₂ = ${T2.toFixed(1)} N`, 40, 90);
  }
}

function solveFriction() {
  const type = document.getElementById('frictionType').value;
  let html = '';

  if (type === 'incline' || type === 'horizontal') {
    const W = parseFloat(document.getElementById('fricWeight').value);
    const angle = parseFloat(document.getElementById('fricAngle').value) * Math.PI / 180;
    const muS = parseFloat(document.getElementById('fricMuS').value);
    const muK = parseFloat(document.getElementById('fricMuK').value);
    const P = parseFloat(document.getElementById('fricApplied').value);
    const Pangle = parseFloat(document.getElementById('fricForceAngle').value) * Math.PI / 180;

    const N = W * Math.cos(angle) - P * Math.sin(Pangle);
    const fs_max = muS * N;
    const fk = muK * N;
    const F_parallel = W * Math.sin(angle) + P * Math.cos(Pangle);
    const phi_s = Math.atan(muS) * 180 / Math.PI;

    let status = '';
    if (F_parallel < fs_max) {
      status = '✓ Block is STATIONARY';
      html += `<div class="result-item"><span class="result-label">Friction Force (f)</span><span class="result-value">${F_parallel.toFixed(1)}N</span></div>`;
    } else {
      status = '⚠️ Block is MOVING';
      html += `<div class="result-item"><span class="result-label">Friction Force (f_k)</span><span class="result-value">${fk.toFixed(1)}N</span></div>`;
    }

    html += `<div class="result-item"><span class="result-label">Normal Force (N)</span><span class="result-value">${N.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Max Static Friction</span><span class="result-value">${fs_max.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Kinetic Friction</span><span class="result-value">${fk.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Friction Angle φs</span><span class="result-value">${phi_s.toFixed(1)}°</span></div>`;
    html += `<div class="result-item"><span class="result-label">Status</span><span class="result-value">${status}</span></div>`;

  } else if (type === 'belt') {
    const T1 = parseFloat(document.getElementById('beltT1').value);
    const mu = parseFloat(document.getElementById('beltMu').value);
    const beta = parseFloat(document.getElementById('beltAngle').value) * Math.PI / 180;
    const T2 = T1 * Math.exp(mu * beta);
    html += `<div class="result-item"><span class="result-label">Tension T1</span><span class="result-value">${T1.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Tension T2</span><span class="result-value">${T2.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Ratio T2/T1</span><span class="result-value">${(T2/T1).toFixed(3)}</span></div>`;
    html += `<div class="result-item"><span class="result-label">Formula</span><span class="result-value">T2=T1·e^(μβ)</span></div>`;
  }

  document.getElementById('frictionResults').innerHTML = html;
  drawFriction();
}

// ============ CENTROID ============
let components = [];

function updateCentroidUI() {
  const shape = document.getElementById('centroidShape').value;
  document.getElementById('rectInputs').classList.toggle('hidden', shape !== 'rectangle');
  document.getElementById('triInputs').classList.toggle('hidden', shape !== 'triangle');
  document.getElementById('circleInputs').classList.toggle('hidden', shape !== 'circle');
  document.getElementById('semiInputs').classList.toggle('hidden', shape !== 'semicircle');
  document.getElementById('compositeSection').classList.toggle('hidden', shape !== 'composite');
  drawCentroid();
}

function addComponent() {
  components.push({
    A: parseFloat(document.getElementById('compArea').value),
    x: parseFloat(document.getElementById('compX').value),
    y: parseFloat(document.getElementById('compY').value)
  });
  document.getElementById('componentList').innerHTML = components.map((c, i) =>
    `<div class="item-row"><span>A=${c.A}, x=${c.x}, y=${c.y}</span><button class="btn-danger" onclick="removeComponent(${i})">×</button></div>`).join('');
  drawCentroid();
}
function removeComponent(i) { components.splice(i,1); addComponent(); }

function drawCentroid() {
  const canvas = document.getElementById('centroidCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 560;
  ctx.clearRect(0, 0, W, H);

  const shape = document.getElementById('centroidShape').value;
  const cx = W / 2, cy = H / 2;
  
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(W - 40, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 40); ctx.lineTo(cx, H - 40); ctx.stroke();
  ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
  ctx.fillText('x', W - 30, cy + 15);
  ctx.fillText('y', cx + 10, 30);

  if (shape === 'rectangle') {
    const w = parseFloat(document.getElementById('rectW').value) * 40;
    const h = parseFloat(document.getElementById('rectH').value) * 40;
    const x0 = cx - w/2, y0 = cy - h/2;
    ctx.fillStyle = 'rgba(30, 64, 175, 0.3)';
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 3;
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15); ctx.stroke();
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`x̄=${(w/80).toFixed(1)}m`, cx + 15, cy - 15);
    ctx.fillText(`ȳ=${(h/80).toFixed(1)}m`, cx + 15, cy + 5);
    ctx.fillStyle = '#475569'; ctx.font = '11px sans-serif';
    ctx.fillText(`b=${(w/40).toFixed(1)}m`, cx - 20, y0 - 10);
    ctx.fillText(`h=${(h/40).toFixed(1)}m`, x0 - 30, cy);
  } else if (shape === 'triangle') {
    const b = parseFloat(document.getElementById('triB').value) * 40;
    const h = parseFloat(document.getElementById('triH').value) * 40;
    ctx.fillStyle = 'rgba(30, 64, 175, 0.3)';
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - b/2, cy + h/3);
    ctx.lineTo(cx + b/2, cy + h/3);
    ctx.lineTo(cx, cy - 2*h/3);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    const centY = cy + h/3 - h/3;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(cx, centY, 8, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 15, centY); ctx.lineTo(cx + 15, centY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, centY - 15); ctx.lineTo(cx, centY + 15); ctx.stroke();
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`x̄=0`, cx + 15, centY - 10);
    ctx.fillText(`ȳ=h/3=${(h/120).toFixed(2)}m`, cx + 15, centY + 5);
  } else if (shape === 'circle') {
    const r = parseFloat(document.getElementById('circR').value) * 40;
    ctx.fillStyle = 'rgba(30, 64, 175, 0.3)';
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15); ctx.stroke();
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#7c3aed';
    ctx.fillText(`r=${(r/40).toFixed(1)}m`, cx + r/2 - 10, cy - 10);
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`x̄=0, ȳ=0`, cx + 15, cy - 15);
  } else if (shape === 'semicircle') {
    const r = parseFloat(document.getElementById('semiR').value) * 40;
    ctx.fillStyle = 'rgba(30, 64, 175, 0.3)';
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2*Math.PI);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    const centY = cy - 4*r/(3*Math.PI);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(cx, centY, 8, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 15, centY); ctx.lineTo(cx + 15, centY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, centY - 15); ctx.lineTo(cx, centY + 15); ctx.stroke();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`ȳ=4r/3π=${(4*r/(3*Math.PI*40)).toFixed(2)}m`, cx + 15, centY);
  } else if (shape === 'composite') {
    if (components.length === 0) {
      ctx.fillStyle = '#64748b'; ctx.font = '14px sans-serif';
      ctx.fillText('Add components to visualize', cx - 100, cy);
      return;
    }
    const colors = ['#1e40af', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed', '#ec4899'];
    let sumA = 0, sumAx = 0, sumAy = 0;
    components.forEach((c, i) => {
      sumA += c.A; sumAx += c.A * c.x; sumAy += c.A * c.y;
      const px = cx + c.x * 40;
      const py = cy - c.y * 40;
      const size = Math.sqrt(c.A) * 40;
      ctx.fillStyle = colors[i % colors.length] + '60';
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 2;
      ctx.fillRect(px - size/2, py - size/2, size, size);
      ctx.strokeRect(px - size/2, py - size/2, size, size);
      ctx.fillStyle = colors[i % colors.length];
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`#${i+1}`, px - 8, py + 4);
    });
    const x_bar = sumAx / sumA;
    const y_bar = sumAy / sumA;
    const centX = cx + x_bar * 40;
    const centY = cy - y_bar * 40;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(centX, centY, 10, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(centX - 18, centY); ctx.lineTo(centX + 18, centY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centX, centY - 18); ctx.lineTo(centX, centY + 18); ctx.stroke();
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`x̄=${x_bar.toFixed(2)}m`, centX + 20, centY - 10);
    ctx.fillText(`ȳ=${y_bar.toFixed(2)}m`, centX + 20, centY + 5);
  }
}

function solveCentroid() {
  const shape = document.getElementById('centroidShape').value;
  let x_bar = 0, y_bar = 0, html = '';

  if (shape === 'rectangle') {
    const w = parseFloat(document.getElementById('rectW').value);
    const h = parseFloat(document.getElementById('rectH').value);
    x_bar = w / 2; y_bar = h / 2;
    html += `<div class="result-item"><span class="result-label">Area</span><span class="result-value">${(w*h).toFixed(2)} m²</span></div>`;
  } else if (shape === 'triangle') {
    const b = parseFloat(document.getElementById('triB').value);
    const h = parseFloat(document.getElementById('triH').value);
    x_bar = b / 2; y_bar = h / 3;
    html += `<div class="result-item"><span class="result-label">Area</span><span class="result-value">${(b*h/2).toFixed(2)} m²</span></div>`;
  } else if (shape === 'circle') {
    const r = parseFloat(document.getElementById('circR').value);
    html += `<div class="result-item"><span class="result-label">Area</span><span class="result-value">${(Math.PI*r*r).toFixed(2)} m²</span></div>`;
  } else if (shape === 'semicircle') {
    const r = parseFloat(document.getElementById('semiR').value);
    y_bar = 4*r / (3*Math.PI);
    html += `<div class="result-item"><span class="result-label">Area</span><span class="result-value">${(Math.PI*r*r/2).toFixed(2)} m²</span></div>`;
  } else if (shape === 'composite') {
    let sumA = 0, sumAx = 0, sumAy = 0;
    components.forEach(c => { sumA += c.A; sumAx += c.A * c.x; sumAy += c.A * c.y; });
    x_bar = sumAx / sumA; y_bar = sumAy / sumA;
    html += `<div class="result-item"><span class="result-label">Total Area</span><span class="result-value">${sumA.toFixed(2)} m²</span></div>`;
  }

  html += `<div class="result-item"><span class="result-label">x̄ (centroid x)</span><span class="result-value">${x_bar.toFixed(3)} m</span></div>`;
  html += `<div class="result-item"><span class="result-label"> (centroid y)</span><span class="result-value">${y_bar.toFixed(3)} m</span></div>`;

  document.getElementById('centroidResults').innerHTML = html;
  drawCentroid();
}

// ============ CABLE & PULLEY ============
function updateCableUI() {
  const type = document.getElementById('cableType').value;
  document.getElementById('cableSingle').classList.toggle('hidden', type !== 'single');
  document.getElementById('cableMovable').classList.toggle('hidden', type !== 'movable');
  document.getElementById('cableCompound').classList.toggle('hidden', type !== 'compound');
  document.getElementById('cableCatenary').classList.toggle('hidden', type !== 'catenary');
  drawCable();
}

function drawCable() {
  const canvas = document.getElementById('cableCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 560;
  ctx.clearRect(0, 0, W, H);

  const type = document.getElementById('cableType').value;
  
  if (type === 'single') {
    const W_load = parseFloat(document.getElementById('cableLoad').value);
    const angle = parseFloat(document.getElementById('cableAngle').value) * Math.PI / 180;
    
    const pulleyX = W / 2, pulleyY = 150;
    const pulleyR = 60;
    
    ctx.fillStyle = '#475569';
    ctx.fillRect(pulleyX - 100, 80, 200, 20);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.strokeRect(pulleyX - 100, 80, 200, 20);
    
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, pulleyR, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 12, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pulleyX - pulleyR, pulleyY);
    ctx.lineTo(pulleyX - pulleyR, pulleyY + 200);
    ctx.stroke();
    
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(pulleyX - pulleyR - 30, pulleyY + 200, 60, 50);
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2;
    ctx.strokeRect(pulleyX - pulleyR - 30, pulleyY + 200, 60, 50);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`W=${W_load}N`, pulleyX - pulleyR - 25, pulleyY + 230);
    
    const pullEndX = pulleyX + pulleyR + 100 * Math.cos(angle - Math.PI/2);
    const pullEndY = pulleyY + 100 * Math.sin(angle - Math.PI/2);
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pulleyX + pulleyR, pulleyY);
    ctx.lineTo(pullEndX, pullEndY);
    ctx.stroke();
    
    const arrowLen = 50;
    const arrowX = pullEndX + arrowLen * Math.cos(angle - Math.PI/2);
    const arrowY = pullEndY + arrowLen * Math.sin(angle - Math.PI/2);
    drawArrow(ctx, pullEndX, pullEndY, arrowX, arrowY, '#16a34a', 3, `T=${W_load}N`);
    
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`T=W=${W_load}N`, pulleyX - pulleyR - 80, pulleyY + 100);
    
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('MA = 1', 40, 40);
    ctx.fillText('T = W (direction change only)', 40, 65);
    
  } else if (type === 'movable') {
    const W_load = parseFloat(document.getElementById('movableLoad').value);
    
    const fixedY = 100;
    const movableY = 280;
    const pulleyR = 50;
    
    ctx.fillStyle = '#475569';
    ctx.fillRect(W/2 - 150, 60, 300, 20);
    
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(W/2, fixedY, pulleyR, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(W/2, fixedY, 10, 0, Math.PI*2); ctx.fill();
    
    ctx.beginPath(); ctx.arc(W/2, movableY, pulleyR, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2, movableY, 10, 0, Math.PI*2); ctx.fill();
    
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W/2 - pulleyR - 30, 80);
    ctx.lineTo(W/2 - pulleyR - 30, movableY - pulleyR);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W/2, movableY, pulleyR + 2, Math.PI, 2*Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W/2 + pulleyR, movableY);
    ctx.lineTo(W/2 + pulleyR, fixedY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W/2, fixedY, pulleyR + 2, Math.PI/2, 3*Math.PI/2, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W/2 - pulleyR, fixedY);
    ctx.lineTo(W/2 - pulleyR, fixedY + 150);
    ctx.stroke();
    
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(W/2 - 35, movableY + pulleyR, 70, 50);
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2;
    ctx.strokeRect(W/2 - 35, movableY + pulleyR, 70, 50);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`W=${W_load}N`, W/2 - 30, movableY + pulleyR + 30);
    
    drawArrow(ctx, W/2 - pulleyR, fixedY + 150, W/2 - pulleyR, fixedY + 200, '#16a34a', 3, `T=W/2=${(W_load/2).toFixed(0)}N`);
    
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('MA = 2', 40, 40);
    ctx.fillText(`T = W/2 = ${(W_load/2).toFixed(0)}N`, 40, 65);
    
  } else if (type === 'compound') {
    const W_load = parseFloat(document.getElementById('compoundLoad').value);
    const n = parseInt(document.getElementById('compoundPulleys').value);
    const T = W_load / Math.pow(2, n);
    const MA = Math.pow(2, n);
    
    const startY = 80;
    const spacing = 80;
    const pulleyR = 35;
    
    ctx.fillStyle = '#475569';
    ctx.fillRect(50, 50, W - 100, 20);
    
    for (let i = 0; i < n; i++) {
      const py = startY + i * spacing;
      const px = W/2 + (i % 2 === 0 ? -60 : 60);
      ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, pulleyR, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
    ctx.beginPath();
    let rx = W/2 - 60, ry = startY;
    ctx.moveTo(rx, ry);
    for (let i = 0; i < n; i++) {
      const py = startY + i * spacing;
      const px = W/2 + (i % 2 === 0 ? -60 : 60);
      ctx.lineTo(px + (i % 2 === 0 ? pulleyR : -pulleyR), py);
      ctx.lineTo(px + (i % 2 === 0 ? -pulleyR : pulleyR), py);
    }
    ctx.stroke();
    
    const loadY = startY + n * spacing;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(W/2 - 40, loadY, 80, 60);
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2;
    ctx.strokeRect(W/2 - 40, loadY, 80, 60);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`W=${W_load}N`, W/2 - 35, loadY + 35);
    
    const lastPx = W/2 + ((n-1) % 2 === 0 ? -60 : 60);
    drawArrow(ctx, lastPx - pulleyR, startY + (n-1)*spacing, lastPx - pulleyR, startY + (n-1)*spacing + 80, '#16a34a', 3, `T=${T.toFixed(0)}N`);
    
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`MA = 2^n = ${MA}`, 40, 40);
    ctx.fillText(`T = W/${MA} = ${T.toFixed(1)}N`, 40, 65);
    
  } else if (type === 'catenary') {
    const w = parseFloat(document.getElementById('catenaryW').value);
    const L = parseFloat(document.getElementById('catenaryL').value);
    const sag = parseFloat(document.getElementById('catenarySag').value);
    
    const T0 = w * L * L / (8 * sag);
    const Tmax = T0 * Math.sqrt(1 + Math.pow(4*sag/L, 2));
    
    const margin = 60;
    const groundY = 400;
    const spanPx = W - 2*margin;
    const scale = spanPx / L;
    const sagPx = sag * scale * 3;
    
    ctx.fillStyle = '#475569';
    ctx.fillRect(margin - 20, groundY - sagPx - 20, 20, sagPx + 40);
    ctx.fillRect(W - margin, groundY - sagPx - 20, 20, sagPx + 40);
    
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 5;
    ctx.beginPath();
    const nPoints = 100;
    for (let i = 0; i <= nPoints; i++) {
      const t = i / nPoints;
      const x = margin + t * spanPx;
      const y = groundY - sagPx + 4 * sagPx * t * (1 - t);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    const angle = Math.atan(4*sag/L);
    drawArrow(ctx, margin, groundY - sagPx, margin - 40*Math.cos(angle), groundY - sagPx - 40*Math.sin(angle), '#dc2626', 3, `Tmax=${Tmax.toFixed(0)}N`);
    drawArrow(ctx, W - margin, groundY - sagPx, W - margin + 40*Math.cos(angle), groundY - sagPx - 40*Math.sin(angle), '#dc2626', 3, `Tmax`);
    
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(margin, groundY - sagPx);
    ctx.lineTo(W - margin, groundY - sagPx);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#16a34a'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`T₀=${T0.toFixed(0)}N`, W/2 - 60, groundY - sagPx - 10);
    
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(W/2, groundY - sagPx);
    ctx.lineTo(W/2, groundY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#7c3aed';
    ctx.fillText(`sag=${sag}m`, W/2 + 10, groundY - sagPx/2);
    
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`T₀ = wL²/(8d) = ${T0.toFixed(1)}N`, 40, 40);
    ctx.fillText(`Tmax = ${Tmax.toFixed(1)}N`, 40, 65);
  }
}

function solveCable() {
  const type = document.getElementById('cableType').value;
  let html = '';

  if (type === 'single') {
    const W = parseFloat(document.getElementById('cableLoad').value);
    html += `<div class="result-item"><span class="result-label">Load Weight</span><span class="result-value">${W}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Tension in Rope</span><span class="result-value">${W}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Mechanical Advantage</span><span class="result-value">1</span></div>`;
  } else if (type === 'movable') {
    const W = parseFloat(document.getElementById('movableLoad').value);
    html += `<div class="result-item"><span class="result-label">Load Weight</span><span class="result-value">${W}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Tension in Rope</span><span class="result-value">${(W/2).toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Mechanical Advantage</span><span class="result-value">2</span></div>`;
  } else if (type === 'compound') {
    const W = parseFloat(document.getElementById('compoundLoad').value);
    const n = parseInt(document.getElementById('compoundPulleys').value);
    const T = W / Math.pow(2, n);
    html += `<div class="result-item"><span class="result-label">Load Weight</span><span class="result-value">${W}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Number of Pulleys</span><span class="result-value">${n}</span></div>`;
    html += `<div class="result-item"><span class="result-label">Required Force</span><span class="result-value">${T.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Mechanical Advantage</span><span class="result-value">${Math.pow(2, n)}</span></div>`;
  } else if (type === 'catenary') {
    const w = parseFloat(document.getElementById('catenaryW').value);
    const L = parseFloat(document.getElementById('catenaryL').value);
    const sag = parseFloat(document.getElementById('catenarySag').value);
    const T0 = w * L * L / (8 * sag);
    const Tmax = T0 * Math.sqrt(1 + Math.pow(4*sag/L, 2));
    const cableLen = L + 8*sag*sag/(3*L);
    html += `<div class="result-item"><span class="result-label">Horizontal Tension T₀</span><span class="result-value">${T0.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Max Tension</span><span class="result-value">${Tmax.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Cable Length</span><span class="result-value">${cableLen.toFixed(2)}m</span></div>`;
  }

  document.getElementById('cableResults').innerHTML = html;
  drawCable();
}

// ============ DISTRIBUTED LOAD ============
function updateDistUI() {
  const type = document.getElementById('distType').value;
  document.getElementById('distUniform').classList.toggle('hidden', type !== 'uniform');
  document.getElementById('distTriangular').classList.toggle('hidden', type !== 'triangular');
  document.getElementById('distTrapezoidal').classList.toggle('hidden', type !== 'trapezoidal');
  drawDistributed();
}

function drawDistributed() {
  const canvas = document.getElementById('distributedCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 560;
  ctx.clearRect(0, 0, W, H);

  const type = document.getElementById('distType').value;
  const margin = 60;
  const baseY = 400;
  const maxH = 200;

  ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(margin, baseY); ctx.lineTo(W - margin, baseY); ctx.stroke();

  if (type === 'uniform') {
    const w = parseFloat(document.getElementById('udlW').value);
    const L = parseFloat(document.getElementById('udlL').value);
    const Lpx = (W - 2*margin) * (L / 10);
    const h = Math.min(maxH, w / 5);
    const startX = (W - Lpx) / 2;
    
    ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
    ctx.fillRect(startX, baseY - h, Lpx, h);
    ctx.strokeRect(startX, baseY - h, Lpx, h);
    
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    const nArrows = Math.max(5, Math.floor(Lpx / 30));
    for (let i = 0; i <= nArrows; i++) {
      const ax = startX + Lpx * i / nArrows;
      drawArrow(ctx, ax, baseY - h - 5, ax, baseY - 5, '#dc2626', 2);
    }
    
    const F = w * L;
    const centX = startX + Lpx / 2;
    drawArrow(ctx, centX, baseY - h - 30, centX, baseY + 50, '#16a34a', 4, `F=${F.toFixed(0)}N`);
    
    ctx.fillStyle = '#16a34a';
    ctx.beginPath(); ctx.arc(centX, baseY - h/2, 6, 0, Math.PI*2); ctx.fill();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(centX, baseY - h); ctx.lineTo(centX, baseY); ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`F = w·L = ${w}×${L} = ${F.toFixed(0)}N`, 40, 40);
    ctx.fillText(`Location: L/2 = ${(L/2).toFixed(2)}m`, 40, 65);
    
  } else if (type === 'triangular') {
    const w = parseFloat(document.getElementById('triW').value);
    const L = parseFloat(document.getElementById('triL').value);
    const Lpx = (W - 2*margin) * (L / 10);
    const h = Math.min(maxH, w / 5);
    const startX = (W - Lpx) / 2;
    
    ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, baseY);
    ctx.lineTo(startX + Lpx, baseY);
    ctx.lineTo(startX + Lpx, baseY - h);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    const nArrows = Math.max(5, Math.floor(Lpx / 30));
    for (let i = 0; i <= nArrows; i++) {
      const t = i / nArrows;
      const ax = startX + Lpx * t;
      const ah = h * t;
      drawArrow(ctx, ax, baseY - ah - 5, ax, baseY - 5, '#dc2626', 2);
    }
    
    const F = w * L / 2;
    const centX = startX + 2 * Lpx / 3;
    drawArrow(ctx, centX, baseY - h - 30, centX, baseY + 50, '#16a34a', 4, `F=${F.toFixed(0)}N`);
    
    ctx.fillStyle = '#16a34a';
    ctx.beginPath(); ctx.arc(centX, baseY - h/3, 6, 0, Math.PI*2); ctx.fill();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(centX, baseY - h); ctx.lineTo(centX, baseY); ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`F = w·L/2 = ${F.toFixed(0)}N`, 40, 40);
    ctx.fillText(`Location: 2L/3 = ${(2*L/3).toFixed(2)}m`, 40, 65);
    
  } else if (type === 'trapezoidal') {
    const w1 = parseFloat(document.getElementById('trapW1').value);
    const w2 = parseFloat(document.getElementById('trapW2').value);
    const L = parseFloat(document.getElementById('trapL').value);
    const Lpx = (W - 2*margin) * (L / 10);
    const maxW = Math.max(w1, w2);
    const h1 = (w1 / maxW) * maxH;
    const h2 = (w2 / maxW) * maxH;
    const startX = (W - Lpx) / 2;
    
    ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, baseY);
    ctx.lineTo(startX + Lpx, baseY);
    ctx.lineTo(startX + Lpx, baseY - h2);
    ctx.lineTo(startX, baseY - h1);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, baseY - h1);
    ctx.lineTo(startX + Lpx, baseY - h1);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    const nArrows = Math.max(5, Math.floor(Lpx / 30));
    for (let i = 0; i <= nArrows; i++) {
      const t = i / nArrows;
      const ax = startX + Lpx * t;
      const ah = h1 + (h2 - h1) * t;
      drawArrow(ctx, ax, baseY - ah - 5, ax, baseY - 5, '#dc2626', 2);
    }
    
    const F = (w1 + w2) * L / 2;
    const x_bar = L * (2*w2 + w1) / (3 * (w1 + w2));
    const centX = startX + x_bar * Lpx / L;
    drawArrow(ctx, centX, baseY - Math.max(h1, h2) - 30, centX, baseY + 50, '#16a34a', 4, `F=${F.toFixed(0)}N`);
    
    ctx.fillStyle = '#16a34a';
    ctx.beginPath(); ctx.arc(centX, baseY - (h1+h2)/4, 6, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`F = (w₁+w₂)·L/2 = ${F.toFixed(0)}N`, 40, 40);
    ctx.fillText(`Location from w₁: ${x_bar.toFixed(2)}m`, 40, 65);
  }
}

function solveDistributed() {
  const type = document.getElementById('distType').value;
  let html = '';

  if (type === 'uniform') {
    const w = parseFloat(document.getElementById('udlW').value);
    const L = parseFloat(document.getElementById('udlL').value);
    const F = w * L;
    html += `<div class="result-item"><span class="result-label">Equivalent Force</span><span class="result-value">${F.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Location from Start</span><span class="result-value">${(L/2).toFixed(2)}m</span></div>`;
  } else if (type === 'triangular') {
    const w = parseFloat(document.getElementById('triW').value);
    const L = parseFloat(document.getElementById('triL').value);
    const F = w * L / 2;
    html += `<div class="result-item"><span class="result-label">Equivalent Force</span><span class="result-value">${F.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Location from Start</span><span class="result-value">${(2*L/3).toFixed(2)}m</span></div>`;
  } else if (type === 'trapezoidal') {
    const w1 = parseFloat(document.getElementById('trapW1').value);
    const w2 = parseFloat(document.getElementById('trapW2').value);
    const L = parseFloat(document.getElementById('trapL').value);
    const F = (w1 + w2) * L / 2;
    const x_bar = L * (2*w2 + w1) / (3 * (w1 + w2));
    html += `<div class="result-item"><span class="result-label">Equivalent Force</span><span class="result-value">${F.toFixed(1)}N</span></div>`;
    html += `<div class="result-item"><span class="result-label">Location from w₁</span><span class="result-value">${x_bar.toFixed(2)}m</span></div>`;
  }

  document.getElementById('distributedResults').innerHTML = html;
  drawDistributed();
}

// Initialize
window.onload = function() {
  setTimeout(() => {
    drawBeam();
    drawFriction();
    drawCentroid();
    drawCable();
    drawDistributed();
  }, 100);
};
