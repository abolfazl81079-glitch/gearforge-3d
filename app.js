// Application Controller: CAD Interaction, Split Viewport, Native Mobile Share & GitHub In-App Updater

let viewer = null;
let currentTheme = 'dark';
let activeGearId = 'gear_1';
let isGearTrainEnabled = false;

// Default Gears Definition
let gears = [
  {
    id: 'gear_1',
    name: 'چرخ‌دنده ۱ (اصلی)',
    type: 'spur',
    module: 2.5,
    numTeeth: 24,
    pressureAngle: 20,
    faceWidth: 15,
    boreDiameter: 12,
    hasKeyway: true,
    keywayWidth: 4,
    keywayDepth: 2.5,
    hasHub: true,
    hubDiameter: 26,
    hubLength: 12,
    helixAngle: 15,
    bevelAngle: 25,
    color: '#3b82f6',
    isDriver: true,
    rpm: 3000,
    initialDirection: 1,
    posX: 0,
    posY: 0
  },
  {
    id: 'gear_2',
    name: 'چرخ‌دنده ۲ (پینیون)',
    type: 'spur',
    module: 2.5,
    numTeeth: 36,
    pressureAngle: 20,
    faceWidth: 15,
    boreDiameter: 14,
    hasKeyway: true,
    keywayWidth: 5,
    keywayDepth: 2.8,
    hasHub: true,
    hubDiameter: 28,
    hubLength: 12,
    helixAngle: 15,
    bevelAngle: 25,
    color: '#10b981',
    isDriver: false,
    rpm: 0,
    initialDirection: -1,
    posX: 75,
    posY: 0
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas3d');
  viewer = new Gear3DViewer(canvas);

  setupCadViewToolbar();
  setupTabs();
  setupGearSelectorDropdown();
  setupParameterSync();
  setupKinematics();
  setupMaterialPicker();
  setupExportersAndSharing();
  setupInAppUpdateChecker();
  setupThemeToggle();

  refreshGearAssembly();
});

function getActiveGearList() {
  return isGearTrainEnabled ? gears : [gears[0]];
}

function getActiveGear() {
  const list = getActiveGearList();
  return list.find(g => g.id === activeGearId) || list[0];
}

// 1. Evolvent Design CAD View Toolbar Buttons
function setupCadViewToolbar() {
  const viewIsoBtn = document.getElementById('viewIsoBtn');
  const viewTopBtn = document.getElementById('viewTopBtn');
  const viewFrontBtn = document.getElementById('viewFrontBtn');
  const viewSideBtn = document.getElementById('viewSideBtn');
  const resetCamBtn = document.getElementById('resetCamBtn');
  const toggleEdgesBtn = document.getElementById('toggleEdgesBtn');
  const toggleDimsBtn = document.getElementById('toggleDimsBtn');
  const simPlayBtn = document.getElementById('simPlayBtn');

  const viewBtns = [viewIsoBtn, viewTopBtn, viewFrontBtn, viewSideBtn];
  function setActiveViewBtn(btn) {
    viewBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  viewIsoBtn.addEventListener('click', () => {
    setActiveViewBtn(viewIsoBtn);
    viewer.setView('iso');
  });

  viewTopBtn.addEventListener('click', () => {
    setActiveViewBtn(viewTopBtn);
    viewer.setView('top');
  });

  viewFrontBtn.addEventListener('click', () => {
    setActiveViewBtn(viewFrontBtn);
    viewer.setView('front');
  });

  viewSideBtn.addEventListener('click', () => {
    setActiveViewBtn(viewSideBtn);
    viewer.setView('side');
  });

  resetCamBtn.addEventListener('click', () => {
    setActiveViewBtn(viewIsoBtn);
    viewer.resetView();
  });

  toggleEdgesBtn.addEventListener('click', () => {
    toggleEdgesBtn.classList.toggle('active');
    viewer.toggleEdges(toggleEdgesBtn.classList.contains('active'));
  });

  toggleDimsBtn.addEventListener('click', () => {
    toggleDimsBtn.classList.toggle('active');
    viewer.toggleDimensions(toggleDimsBtn.classList.contains('active'));
  });

  simPlayBtn.addEventListener('click', () => {
    viewer.isRunning = !viewer.isRunning;
    simPlayBtn.classList.toggle('active', viewer.isRunning);
    const icon = document.getElementById('simPlayIcon');
    if (viewer.isRunning) {
      icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    } else {
      icon.innerHTML = '<polygon points="8,5 19,12 8,19"/>';
    }
  });
}

// 2. Tab Navigation
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

// 3. Gear Dropdown Selector
function setupGearSelectorDropdown() {
  const selector = document.getElementById('activeGearSelector');
  if (!selector) return;

  selector.innerHTML = '';
  const list = getActiveGearList();
  list.forEach((g, idx) => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = `${idx + 1}. ${g.name} (Z=${g.numTeeth}, m=${g.module})`;
    if (g.id === activeGearId) opt.selected = true;
    selector.appendChild(opt);
  });

  selector.addEventListener('change', (e) => {
    activeGearId = e.target.value;
    syncControlsFromGear(getActiveGear());
  });
}

// 4. Parameter Synchronization
function setupParameterSync() {
  const currentGear = getActiveGear();

  // Module
  bindRangeAndNumber('moduleRange', 'moduleInput', 'moduleVal', ' mm', (val) => {
    getActiveGear().module = parseFloat(val);
    refreshGearAssembly();
  });

  // Teeth
  bindRangeAndNumber('numTeethRange', 'numTeethInput', 'numTeethVal', '', (val) => {
    getActiveGear().numTeeth = parseInt(val);
    refreshGearAssembly();
  });

  // Face Width
  bindRangeAndNumber('faceWidthRange', 'faceWidthInput', 'faceWidthVal', ' mm', (val) => {
    getActiveGear().faceWidth = parseFloat(val);
    refreshGearAssembly();
  });

  // Pressure Angle
  document.querySelectorAll('input[name="pressureAngle"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.radio-label').forEach(lbl => lbl.classList.remove('active'));
      e.target.closest('.radio-label').classList.add('active');
      getActiveGear().pressureAngle = parseFloat(e.target.value);
      refreshGearAssembly();
    });
  });

  // Gear Type
  document.querySelectorAll('input[name="gearType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.pill-option').forEach(p => p.classList.remove('active'));
      e.target.closest('.pill-option').classList.add('active');
      const type = e.target.value;
      getActiveGear().type = type;

      document.getElementById('helicalAngleGroup').style.display = (type === 'helical') ? 'block' : 'none';
      document.getElementById('bevelAngleGroup').style.display = (type === 'bevel') ? 'block' : 'none';

      refreshGearAssembly();
    });
  });

  // Helical Angle
  const helixRange = document.getElementById('helixAngleRange');
  const helixVal = document.getElementById('helixAngleVal');
  helixRange.addEventListener('input', (e) => {
    helixVal.textContent = e.target.value + '°';
    getActiveGear().helixAngle = parseFloat(e.target.value);
    refreshGearAssembly();
  });

  // Bevel Angle
  const bevelRange = document.getElementById('bevelAngleRange');
  const bevelVal = document.getElementById('bevelAngleVal');
  bevelRange.addEventListener('input', (e) => {
    bevelVal.textContent = e.target.value + '°';
    getActiveGear().bevelAngle = parseFloat(e.target.value);
    refreshGearAssembly();
  });

  // Bore Diameter
  bindRangeAndNumber('boreDiaRange', 'boreDiaInput', 'boreDiaVal', ' mm', (val) => {
    getActiveGear().boreDiameter = parseFloat(val);
    refreshGearAssembly();
  });

  // Keyway
  const hasKeywayCheck = document.getElementById('hasKeywayCheck');
  const keywaySettings = document.getElementById('keywaySettings');
  const keywayWidthInput = document.getElementById('keywayWidthInput');
  const keywayDepthInput = document.getElementById('keywayDepthInput');

  hasKeywayCheck.addEventListener('change', (e) => {
    getActiveGear().hasKeyway = e.target.checked;
    keywaySettings.style.display = e.target.checked ? 'block' : 'none';
    refreshGearAssembly();
  });

  keywayWidthInput.addEventListener('input', (e) => {
    getActiveGear().keywayWidth = parseFloat(e.target.value) || 0;
    refreshGearAssembly();
  });

  keywayDepthInput.addEventListener('input', (e) => {
    getActiveGear().keywayDepth = parseFloat(e.target.value) || 0;
    refreshGearAssembly();
  });

  // Hub
  const hasHubCheck = document.getElementById('hasHubCheck');
  const hubSettings = document.getElementById('hubSettings');
  const hubDiaInput = document.getElementById('hubDiaInput');
  const hubLengthInput = document.getElementById('hubLengthInput');

  hasHubCheck.addEventListener('change', (e) => {
    getActiveGear().hasHub = e.target.checked;
    hubSettings.style.display = e.target.checked ? 'block' : 'none';
    refreshGearAssembly();
  });

  hubDiaInput.addEventListener('input', (e) => {
    getActiveGear().hubDiameter = parseFloat(e.target.value) || 0;
    refreshGearAssembly();
  });

  hubLengthInput.addEventListener('input', (e) => {
    getActiveGear().hubLength = parseFloat(e.target.value) || 0;
    refreshGearAssembly();
  });
}

function bindRangeAndNumber(rangeId, numId, labelId, suffix, callback) {
  const range = document.getElementById(rangeId);
  const num = document.getElementById(numId);
  const label = document.getElementById(labelId);

  range.addEventListener('input', (e) => {
    num.value = e.target.value;
    if (label) label.textContent = e.target.value + suffix;
    callback(e.target.value);
  });

  num.addEventListener('input', (e) => {
    range.value = e.target.value;
    if (label) label.textContent = e.target.value + suffix;
    callback(e.target.value);
  });
}

// 5. Kinematics & Gear Assembly
function setupKinematics() {
  const enableTrainCheck = document.getElementById('enableGearTrainCheck');
  const trainControls = document.getElementById('gearTrainControls');
  const driverRpmRange = document.getElementById('driverRpmRange');
  const driverRpmInput = document.getElementById('driverRpmInput');
  const driverRpmVal = document.getElementById('driverRpmVal');
  const posXInput = document.getElementById('gearPosXInput');
  const posYInput = document.getElementById('gearPosYInput');

  enableTrainCheck.addEventListener('change', (e) => {
    isGearTrainEnabled = e.target.checked;
    trainControls.style.display = isGearTrainEnabled ? 'block' : 'none';
    document.getElementById('gearSelectorGroup').style.display = isGearTrainEnabled ? 'block' : 'none';

    if (!isGearTrainEnabled) {
      viewer.removeGear('gear_2');
      activeGearId = 'gear_1';
    }
    setupGearSelectorDropdown();
    refreshGearAssembly();
  });

  driverRpmRange.addEventListener('input', (e) => {
    driverRpmInput.value = e.target.value;
    driverRpmVal.textContent = e.target.value + ' RPM';
    gears[0].rpm = parseFloat(e.target.value);
    calculateKinematics();
  });

  driverRpmInput.addEventListener('input', (e) => {
    driverRpmRange.value = e.target.value;
    driverRpmVal.textContent = e.target.value + ' RPM';
    gears[0].rpm = parseFloat(e.target.value);
    calculateKinematics();
  });

  posXInput.addEventListener('input', (e) => {
    getActiveGear().posX = parseFloat(e.target.value) || 0;
    refreshGearAssembly();
  });

  posYInput.addEventListener('input', (e) => {
    getActiveGear().posY = parseFloat(e.target.value) || 0;
    refreshGearAssembly();
  });
}

function calculateKinematics() {
  if (!isGearTrainEnabled) return;

  const g1 = gears[0];
  const g2 = gears[1];

  // Auto calculate center distance
  const centerDist = ((g1.numTeeth + g2.numTeeth) * g1.module) / 2.0;
  g2.posX = centerDist;
  g2.posY = 0;

  // Gear Ratio i = Z2 / Z1
  const ratio = g2.numTeeth / g1.numTeeth;
  g2.rpm = g1.rpm / ratio;
  g2.initialDirection = -g1.initialDirection;

  // Update speeds in viewer
  const grp1 = viewer.getGearMeshGroup('gear_1');
  const grp2 = viewer.getGearMeshGroup('gear_2');
  if (grp1) grp1.userData.speed = g1.rpm * g1.initialDirection;
  if (grp2) grp2.userData.speed = g2.rpm * g2.initialDirection;

  // Render Table
  const tbody = document.getElementById('kinematicsTableBody');
  tbody.innerHTML = `
    <tr>
      <td>${g1.name} (محرک)</td>
      <td>${g1.numTeeth}</td>
      <td><strong style="color:#3b82f6;">${Math.round(g1.rpm)} RPM</strong></td>
      <td>1.0</td>
      <td>${g1.initialDirection > 0 ? 'پادساعتگرد' : 'ساعتگرد'}</td>
    </tr>
    <tr>
      <td>${g2.name} (متحرک)</td>
      <td>${g2.numTeeth}</td>
      <td><strong style="color:#10b981;">${Math.round(g2.rpm)} RPM</strong></td>
      <td>${ratio.toFixed(2)}</td>
      <td>${g2.initialDirection > 0 ? 'پادساعتگرد' : 'ساعتگرد'}</td>
    </tr>
  `;
}

// 6. Materials
function setupMaterialPicker() {
  const matCards = document.querySelectorAll('.mat-card');
  matCards.forEach(card => {
    card.addEventListener('click', () => {
      matCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const matType = card.getAttribute('data-material');
      viewer.setMaterialType(matType);
    });
  });

  const colorPicker = document.getElementById('gearColorPicker');
  const colorHex = document.getElementById('gearColorHex');
  colorPicker.addEventListener('input', (e) => {
    colorHex.textContent = e.target.value;
    getActiveGear().color = e.target.value;
    refreshGearAssembly();
  });
}

// 7. Exporters and Native File Sharing Sheet
function setupExportersAndSharing() {
  const bigShareBtn = document.getElementById('bigShareBtn');
  const openShareModalBtn = document.getElementById('openShareModalBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModalBtn = document.getElementById('closeShareModalBtn');
  const confirmShareBtn = document.getElementById('confirmShareBtn');
  const modalGearSelect = document.getElementById('modalShareGearSelect');

  function openShareDialog() {
    modalGearSelect.innerHTML = '';
    const list = getActiveGearList();
    list.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `${g.name} (مدول ${g.module}، ${g.numTeeth} دندانه)`;
      if (g.id === activeGearId) opt.selected = true;
      modalGearSelect.appendChild(opt);
    });

    shareModal.classList.add('active');
  }

  bigShareBtn.addEventListener('click', openShareDialog);
  openShareModalBtn.addEventListener('click', openShareDialog);

  closeShareModalBtn.addEventListener('click', () => {
    shareModal.classList.remove('active');
  });

  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) shareModal.classList.remove('active');
  });

  // Format Radio styling inside modal
  document.querySelectorAll('input[name="modalShareFormat"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.format-radio').forEach(r => r.classList.remove('active'));
      radio.closest('.format-radio').classList.add('active');
    });
  });

  // Execute Native Share
  confirmShareBtn.addEventListener('click', async () => {
    const selectedGearId = modalGearSelect.value;
    const format = document.querySelector('input[name="modalShareFormat"]:checked').value;
    const gear = gears.find(g => g.id === selectedGearId) || gears[0];
    const group = viewer.getGearMeshGroup(gear.id);

    let blob = null;
    let filename = `GearForge_${gear.name.replace(/[\s\(\)]+/g, '_')}_Z${gear.numTeeth}_m${gear.module}`;
    let mimeType = 'application/octet-stream';

    if (format === 'stl') {
      filename += '.stl';
      mimeType = 'model/stl';
      blob = GearExporters.exportToSTL(group);
    } else if (format === 'step') {
      filename += '.stp';
      mimeType = 'application/step';
      const stepText = GearExporters.exportToSTEP(group, gear);
      blob = new Blob([stepText], { type: mimeType });
    } else if (format === 'dxf') {
      filename += '.dxf';
      mimeType = 'application/dxf';
      const gearData = GearMath.generateSpurGearProfile(gear);
      const dxfText = GearExporters.exportToDXF(gearData, gear);
      blob = new Blob([dxfText], { type: mimeType });
    }

    shareModal.classList.remove('active');

    await GearExporters.shareFileNative(
      blob,
      filename,
      mimeType,
      filename,
      `خروجی مهندسی چرخ‌دنده ${gear.name} (Z=${gear.numTeeth}, m=${gear.module}) جهت ساخت، پرینت و CNC`
    );
  });

  // Direct Download STL
  document.getElementById('downloadStlBtn').addEventListener('click', () => {
    const gear = getActiveGear();
    const group = viewer.getGearMeshGroup(gear.id);
    const blob = GearExporters.exportToSTL(group);
    const filename = `Gear_${gear.numTeeth}T_m${gear.module}.stl`;
    GearExporters.downloadFile(blob, filename, 'model/stl');
  });

  // Direct Download STEP
  document.getElementById('downloadStepBtn').addEventListener('click', () => {
    const gear = getActiveGear();
    const group = viewer.getGearMeshGroup(gear.id);
    const text = GearExporters.exportToSTEP(group, gear);
    const blob = new Blob([text], { type: 'application/step' });
    const filename = `Gear_${gear.numTeeth}T_m${gear.module}.stp`;
    GearExporters.downloadFile(blob, filename, 'application/step');
  });

  // Direct Download DXF
  document.getElementById('downloadDxfBtn').addEventListener('click', () => {
    const gear = getActiveGear();
    const gearData = GearMath.generateSpurGearProfile(gear);
    const text = GearExporters.exportToDXF(gearData, gear);
    const blob = new Blob([text], { type: 'application/dxf' });
    const filename = `Gear_${gear.numTeeth}T_m${gear.module}.dxf`;
    GearExporters.downloadFile(blob, filename, 'application/dxf');
  });
}

// 8. In-App Update Checker (GitHub Actions CI/CD)
function setupInAppUpdateChecker() {
  const checkNavBtn = document.getElementById('checkUpdateNavBtn');
  const checkActionBtn = document.getElementById('checkUpdateActionBtn');
  const statusCard = document.getElementById('updateStatusCard');
  const statusMsg = document.getElementById('updateStatusMsg');
  const actionArea = document.getElementById('updateActionArea');

  async function performUpdateCheck() {
    statusCard.style.display = 'block';
    statusMsg.innerHTML = '<span style="color:#3b82f6;">🔍 در حال بررسی آخرین نسخه APK روی سرورهای گیت‌هاب...</span>';
    actionArea.innerHTML = '';

    const repoOwner = 'abolfazl81079-glitch';
    const repoName = 'gearforge-3d';

    try {
      const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?status=success&per_page=1`);
      if (!res.ok) throw new Error('عدم دریافت پاسخ از سرور گیت‌هاب');

      const data = await res.json();
      if (data.workflow_runs && data.workflow_runs.length > 0) {
        const latestRun = data.workflow_runs[0];
        const date = new Date(latestRun.created_at).toLocaleDateString('fa-IR');
        const commitMsg = latestRun.head_commit ? latestRun.head_commit.message : 'به‌روزرسانی عمومی';

        statusMsg.innerHTML = `
          <div style="font-weight:700; color:#10b981; margin-bottom:6px;">✅ آخرین بیلد آماده در گیت‌هاب یافت شد!</div>
          <div style="font-size:11.5px; color:var(--current-text-muted); line-height:1.5;">
            <strong>تاریخ انتشار:</strong> ${date}<br>
            <strong>پیام تغییرات:</strong> ${commitMsg}
          </div>
        `;

        actionArea.innerHTML = `
          <a href="${latestRun.html_url}" target="_blank" class="btn btn-primary btn-large btn-full" style="margin-top:10px; text-decoration:none;">
            <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            <span>دانلود و نصب فایل جدید APK از صفحه گیت‌هاب</span>
          </a>
        `;
      } else {
        statusMsg.innerHTML = '<span style="color:#10b981;">شما در حال استفاده از آخرین نسخه هستید.</span>';
      }
    } catch (err) {
      statusMsg.innerHTML = `
        <span style="color:#ef4444;">خطا در بررسی اینترنتی آپدیت. برای دانلود نسخه جدید می‌توانید مستقیماً به صفحه مخزن مراجعه کنید:</span>
      `;
      actionArea.innerHTML = `
        <a href="https://github.com/${repoOwner}/${repoName}/actions" target="_blank" class="btn btn-primary btn-full" style="margin-top:8px; text-decoration:none;">
          مشاهده بیلدها در گیت‌هاب
        </a>
      `;
    }
  }

  checkActionBtn.addEventListener('click', performUpdateCheck);
  checkNavBtn.addEventListener('click', () => {
    // Switch to update tab
    document.querySelector('.tab-btn[data-tab="tab-update"]').click();
    performUpdateCheck();
  });
}

// 9. Theme Toggle
function setupThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  btn.addEventListener('click', () => {
    currentTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
  });
}

// 10. Refresh Gear Assembly & Viewport Floating Badge
function refreshGearAssembly() {
  const list = getActiveGearList();
  let primaryGearData = null;

  list.forEach(g => {
    const gd = viewer.updateGearMesh(g);
    if (g.id === 'gear_1') primaryGearData = gd;
  });

  if (isGearTrainEnabled) calculateKinematics();

  // Update Floating CAD Specs Badge
  if (primaryGearData) {
    const g = gears[0];
    document.getElementById('badgeModule').textContent = g.module;
    document.getElementById('badgeTeeth').textContent = g.numTeeth;
    document.getElementById('badgePitch').textContent = primaryGearData.pitchDiameter.toFixed(1) + ' mm';
    document.getElementById('badgeOuter').textContent = primaryGearData.tipDiameter.toFixed(1) + ' mm';
    document.getElementById('badgeWidth').textContent = g.faceWidth + ' mm';
  }

  viewer.resize();
}

function syncControlsFromGear(g) {
  document.getElementById('moduleRange').value = g.module;
  document.getElementById('moduleInput').value = g.module;
  document.getElementById('moduleVal').textContent = g.module + ' mm';

  document.getElementById('numTeethRange').value = g.numTeeth;
  document.getElementById('numTeethInput').value = g.numTeeth;
  document.getElementById('numTeethVal').textContent = g.numTeeth;

  document.getElementById('faceWidthRange').value = g.faceWidth;
  document.getElementById('faceWidthInput').value = g.faceWidth;
  document.getElementById('faceWidthVal').textContent = g.faceWidth + ' mm';

  document.getElementById('boreDiaRange').value = g.boreDiameter;
  document.getElementById('boreDiaInput').value = g.boreDiameter;
  document.getElementById('boreDiaVal').textContent = g.boreDiameter + ' mm';

  document.getElementById('hasKeywayCheck').checked = !!g.hasKeyway;
  document.getElementById('keywaySettings').style.display = g.hasKeyway ? 'block' : 'none';
  document.getElementById('keywayWidthInput').value = g.keywayWidth || 4;
  document.getElementById('keywayDepthInput').value = g.keywayDepth || 2.5;

  document.getElementById('hasHubCheck').checked = !!g.hasHub;
  document.getElementById('hubSettings').style.display = g.hasHub ? 'block' : 'none';
  document.getElementById('hubDiaInput').value = g.hubDiameter || 26;
  document.getElementById('hubLengthInput').value = g.hubLength || 12;

  document.getElementById('gearPosXInput').value = g.posX || 0;
  document.getElementById('gearPosYInput').value = g.posY || 0;

  document.getElementById('gearColorPicker').value = g.color || '#3b82f6';
  document.getElementById('gearColorHex').textContent = g.color || '#3b82f6';

  // Update radio buttons
  document.querySelectorAll('input[name="pressureAngle"]').forEach(radio => {
    radio.checked = (parseFloat(radio.value) === g.pressureAngle);
    radio.closest('.radio-label').classList.toggle('active', radio.checked);
  });

  document.querySelectorAll('input[name="gearType"]').forEach(radio => {
    radio.checked = (radio.value === g.type);
    radio.closest('.pill-option').classList.toggle('active', radio.checked);
  });
}
