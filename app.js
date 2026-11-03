// Complete Application Controller with Individual Gear Configuration, Position (X, Y), Colors, and Perpendicular Setscrew

let viewer = null;
let currentTheme = 'dark';
let activeGearId = 'gear_1';
let isGearTrainEnabled = false;

// Default Gears with complete individual parameters
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
    hasHub: true,
    hubDiameter: 26,
    hubLength: 12,
    hasSetscrew: true,
    setscrewSize: 4, // M4
    setscrewDistance: 6, // Distance from hub base along shaft
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
    name: 'چرخ‌دنده ۲',
    type: 'spur',
    module: 2.5,
    numTeeth: 36,
    pressureAngle: 20,
    faceWidth: 15,
    boreDiameter: 14,
    hasHub: true,
    hubDiameter: 28,
    hubLength: 12,
    hasSetscrew: false,
    setscrewSize: 4,
    setscrewDistance: 6,
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
  I18N.setLang('fa');

  const canvas = document.getElementById('canvas3d');
  viewer = new Gear3DViewer(canvas);

  setupMobileEvents();
  setupNavigationEvents();
  setupTabEvents();
  setupGearSelectorDropdown();
  setupGearParameterEvents();
  setupKinematicsEvents();
  setupViewportHudEvents();
  setupExportModalEvents();

  refreshGearAssembly();
});

function getActiveGearList() {
  return isGearTrainEnabled ? gears : [gears[0]];
}

function getActiveGear() {
  const list = getActiveGearList();
  return list.find(g => g.id === activeGearId) || list[0];
}

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

  selector.onchange = (e) => {
    activeGearId = e.target.value;
    syncInputsWithActiveGear();
    updateGearSpecsDisplay();
  };
}

function syncInputsWithActiveGear() {
  const g = getActiveGear();
  if (!g) return;

  document.getElementById('gearNameInput').value = g.name || '';
  document.getElementById('gearTypeSelect').value = g.type || 'spur';
  document.getElementById('paramModule').value = g.module;
  document.getElementById('paramTeeth').value = g.numTeeth;
  document.getElementById('paramTeethSlider').value = g.numTeeth;
  document.getElementById('teethValDisplay').textContent = g.numTeeth;
  document.getElementById('paramPressureAngle').value = g.pressureAngle;
  document.getElementById('paramFaceWidth').value = g.faceWidth;
  document.getElementById('paramBoreDiameter').value = g.boreDiameter;
  document.getElementById('paramColor').value = g.color || '#3b82f6';

  // Position inputs
  document.getElementById('paramPosX').value = g.posX || 0;
  document.getElementById('paramPosY').value = g.posY || 0;

  // Hub & Setscrew inputs
  document.getElementById('enableHubCheck').checked = !!g.hasHub;
  document.getElementById('hubControls').style.display = g.hasHub ? 'block' : 'none';
  document.getElementById('paramHubDiameter').value = g.hubDiameter || 26;
  document.getElementById('paramHubLength').value = g.hubLength || 12;

  document.getElementById('enableSetscrewCheck').checked = !!g.hasSetscrew;
  document.getElementById('paramSetscrewSize').value = g.setscrewSize || 4;
  document.getElementById('paramSetscrewDist').value = g.setscrewDistance || 6;

  // Helical / Bevel groups
  document.getElementById('helixAngleGroup').style.display = (g.type === 'helical') ? 'block' : 'none';
  document.getElementById('paramHelixAngle').value = g.helixAngle || 15;

  document.getElementById('bevelAngleGroup').style.display = (g.type === 'bevel') ? 'block' : 'none';
  document.getElementById('paramBevelAngle').value = g.bevelAngle || 25;
}

function refreshGearAssembly() {
  const currentList = getActiveGearList();
  const kinematics = GearMath.calculateKinematics(currentList);

  setupGearSelectorDropdown();
  syncInputsWithActiveGear();

  viewer.updateGearTrain(currentList, kinematics);
  renderKinematicsGearList(kinematics);
  renderKinematicsBottomBar(kinematics);
  updateGearSpecsDisplay();
}

function updateGearSpecsDisplay() {
  const gear = getActiveGear();
  if (!gear) return;

  const d = gear.module * gear.numTeeth;
  const da = d + 2 * gear.module;
  const df = d - 2.5 * gear.module;
  const p = Math.PI * gear.module;

  document.getElementById('specPitchDia').textContent = `${d.toFixed(2)} mm`;
  document.getElementById('specTipDia').textContent = `${da.toFixed(2)} mm`;
  document.getElementById('specRootDia').textContent = `${df.toFixed(2)} mm`;
  document.getElementById('specCircularPitch').textContent = `${p.toFixed(2)} mm`;

  const list = getActiveGearList();
  if (list.length > 1) {
    const centerDist = Math.hypot(list[1].posX - list[0].posX, list[1].posY - list[0].posY);
    document.getElementById('specCenterDist').textContent = `${centerDist.toFixed(2)} mm`;
  } else {
    document.getElementById('specCenterDist').textContent = 'تک چرخ‌دنده (Single)';
  }
}

function renderKinematicsBottomBar(kinematics) {
  const container = document.getElementById('kinematicsBadges');
  if (!container) return;

  container.innerHTML = '';
  kinematics.forEach((k) => {
    const badge = document.createElement('div');
    badge.className = `kin-badge ${k.isDriver ? 'driver' : ''}`;
    const dirText = k.direction > 0 ? '↻ CW' : '↺ CCW';
    badge.innerHTML = `
      <span>${k.name} (Z=${k.numTeeth}):</span>
      <span class="kin-badge-val">${k.rpm} RPM (${dirText})</span>
      ${k.isDriver ? '<span style="color:#10b981;font-size:10px;">(محرک)</span>' : ''}
    `;
    container.appendChild(badge);
  });
}

function renderKinematicsGearList(kinematics) {
  const container = document.getElementById('gearTrainContainer');
  if (!container) return;

  container.innerHTML = '';
  const currentList = getActiveGearList();

  currentList.forEach((g, idx) => {
    const kin = kinematics[idx] || {};
    const card = document.createElement('div');
    card.style.cssText = "background:var(--current-bg);border:1px solid var(--current-border);border-radius:8px;padding:10px;margin-bottom:8px;";

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:700;font-size:12px;color:${g.color || 'var(--primary)'};">#${idx + 1} - ${g.name}</span>
        <span style="background:${g.isDriver ? 'var(--secondary)' : 'var(--primary)'};color:white;font-size:10px;padding:2px 6px;border-radius:4px;">
          ${g.isDriver ? 'محرک (Driver)' : 'متحرک (Driven)'}
        </span>
      </div>
      <div style="font-size:11px;display:grid;grid-template-columns:1fr 1fr;gap:4px;">
        <div>دندانه (Z): <b>${g.numTeeth}</b></div>
        <div>مدول (m): <b>${g.module}</b></div>
        <div>موقعیت: <b>X=${g.posX}, Y=${g.posY}</b></div>
        <div style="color:var(--primary);font-weight:700;">سرعت: <b>${kin.rpm || 0} RPM</b></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button class="btn btn-sm" onclick="selectAndEditGear('${g.id}')" style="font-size:10px;padding:3px 6px;">
          ویرایش پارامترها
        </button>
        <button class="btn btn-sm" onclick="setDriverGear('${g.id}')" style="font-size:10px;padding:3px 6px;">
          تنظیم به محرک
        </button>
        ${isGearTrainEnabled && currentList.length > 1 ? `
          <button class="btn btn-sm" onclick="removeGear('${g.id}')" style="color:var(--danger);font-size:10px;padding:3px 6px;">
            حذف
          </button>
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

window.selectAndEditGear = function(gearId) {
  activeGearId = gearId;
  syncInputsWithActiveGear();
  updateGearSpecsDisplay();
  // Switch to design tab
  document.querySelector('[data-tab="tabDesign"]').click();
};

window.setDriverGear = function(gearId) {
  gears.forEach(g => {
    g.isDriver = (g.id === gearId);
  });
  refreshGearAssembly();
};

window.removeGear = function(gearId) {
  if (gears.length <= 1) return;
  gears = gears.filter(g => g.id !== gearId);
  if (!gears.some(g => g.isDriver)) {
    gears[0].isDriver = true;
  }
  activeGearId = gears[0].id;
  refreshGearAssembly();
};

function setupMobileEvents() {
  const drawerBtn = document.getElementById('mobileDrawerBtn');
  const sidebar = document.querySelector('.sidebar');
  if (drawerBtn && sidebar) {
    drawerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
}

function setupNavigationEvents() {
  document.getElementById('langToggleBtn').addEventListener('click', () => {
    const nextLang = I18N.currentLang === 'fa' ? 'en' : 'fa';
    I18N.setLang(nextLang);
    refreshGearAssembly();
  });

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    viewer.setTheme(currentTheme);
  });
}

function setupTabEvents() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

function setupGearParameterEvents() {
  const nameInput = document.getElementById('gearNameInput');
  const typeSelect = document.getElementById('gearTypeSelect');
  const moduleInput = document.getElementById('paramModule');
  const teethInput = document.getElementById('paramTeeth');
  const teethSlider = document.getElementById('paramTeethSlider');
  const pressureAngleSelect = document.getElementById('paramPressureAngle');
  const faceWidthInput = document.getElementById('paramFaceWidth');
  const boreDiameterInput = document.getElementById('paramBoreDiameter');
  const colorInput = document.getElementById('paramColor');

  // Position inputs
  const posXInput = document.getElementById('paramPosX');
  const posYInput = document.getElementById('paramPosY');

  // Hub & Setscrew inputs
  const enableHubCheck = document.getElementById('enableHubCheck');
  const hubControls = document.getElementById('hubControls');
  const hubDiameterInput = document.getElementById('paramHubDiameter');
  const hubLengthInput = document.getElementById('paramHubLength');
  const enableSetscrewCheck = document.getElementById('enableSetscrewCheck');
  const setscrewSizeSelect = document.getElementById('paramSetscrewSize');
  const setscrewDistInput = document.getElementById('paramSetscrewDist');

  const helixAngleGroup = document.getElementById('helixAngleGroup');
  const helixAngleInput = document.getElementById('paramHelixAngle');
  const bevelAngleGroup = document.getElementById('bevelAngleGroup');
  const bevelAngleInput = document.getElementById('paramBevelAngle');

  nameInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.name = e.target.value;
    setupGearSelectorDropdown();
  });

  typeSelect.addEventListener('change', (e) => {
    const g = getActiveGear();
    g.type = e.target.value;
    helixAngleGroup.style.display = (g.type === 'helical') ? 'block' : 'none';
    bevelAngleGroup.style.display = (g.type === 'bevel') ? 'block' : 'none';
    refreshGearAssembly();
  });

  teethSlider.addEventListener('input', (e) => {
    teethInput.value = e.target.value;
    const g = getActiveGear();
    g.numTeeth = parseInt(e.target.value);
    document.getElementById('teethValDisplay').textContent = e.target.value;
    refreshGearAssembly();
  });

  teethInput.addEventListener('input', (e) => {
    teethSlider.value = e.target.value;
    const g = getActiveGear();
    g.numTeeth = parseInt(e.target.value) || 12;
    document.getElementById('teethValDisplay').textContent = g.numTeeth;
    refreshGearAssembly();
  });

  moduleInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) || 2.5;
    const g = getActiveGear();
    g.module = val;
    refreshGearAssembly();
  });

  pressureAngleSelect.addEventListener('change', (e) => {
    const g = getActiveGear();
    g.pressureAngle = parseFloat(e.target.value);
    refreshGearAssembly();
  });

  faceWidthInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.faceWidth = parseFloat(e.target.value) || 15;
    refreshGearAssembly();
  });

  boreDiameterInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.boreDiameter = parseFloat(e.target.value) || 10;
    refreshGearAssembly();
  });

  colorInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.color = e.target.value;
    refreshGearAssembly();
  });

  // Position listeners
  posXInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.posX = parseFloat(e.target.value) || 0;
    refreshGearAssembly();
  });

  posYInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.posY = parseFloat(e.target.value) || 0;
    refreshGearAssembly();
  });

  // Hub & Setscrew
  enableHubCheck.addEventListener('change', (e) => {
    const g = getActiveGear();
    g.hasHub = e.target.checked;
    hubControls.style.display = g.hasHub ? 'block' : 'none';
    refreshGearAssembly();
  });

  hubDiameterInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.hubDiameter = parseFloat(e.target.value) || 26;
    refreshGearAssembly();
  });

  hubLengthInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.hubLength = parseFloat(e.target.value) || 12;
    refreshGearAssembly();
  });

  enableSetscrewCheck.addEventListener('change', (e) => {
    const g = getActiveGear();
    g.hasSetscrew = e.target.checked;
    refreshGearAssembly();
  });

  setscrewSizeSelect.addEventListener('change', (e) => {
    const g = getActiveGear();
    g.setscrewSize = parseFloat(e.target.value);
    refreshGearAssembly();
  });

  setscrewDistInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.setscrewDistance = parseFloat(e.target.value) || 6;
    refreshGearAssembly();
  });

  helixAngleInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.helixAngle = parseFloat(e.target.value) || 15;
    refreshGearAssembly();
  });

  bevelAngleInput.addEventListener('input', (e) => {
    const g = getActiveGear();
    g.bevelAngle = parseFloat(e.target.value) || 25;
    refreshGearAssembly();
  });
}

function setupKinematicsEvents() {
  const toggleGearTrainCheck = document.getElementById('toggleGearTrainCheck');
  const driverRpmInput = document.getElementById('driverRPM');
  const simToggleBtn = document.getElementById('simToggleBtn');
  const simSpeedSlider = document.getElementById('simSpeedSlider');
  const addGearBtn = document.getElementById('addGearBtn');
  const trainActionBox = document.getElementById('trainActionBox');

  toggleGearTrainCheck.addEventListener('change', (e) => {
    isGearTrainEnabled = e.target.checked;
    trainActionBox.style.display = isGearTrainEnabled ? 'block' : 'none';
    refreshGearAssembly();
  });

  driverRpmInput.addEventListener('input', (e) => {
    const rpm = parseFloat(e.target.value) || 1000;
    const list = getActiveGearList();
    const driver = list.find(g => g.isDriver) || list[0];
    driver.rpm = rpm;
    refreshGearAssembly();
  });

  simToggleBtn.addEventListener('click', () => {
    viewer.isRunning = !viewer.isRunning;
    if (viewer.isRunning) {
      simToggleBtn.innerHTML = `<span>توقف چرخش</span>`;
      simToggleBtn.className = 'btn btn-success';
    } else {
      simToggleBtn.innerHTML = `<span>شروع چرخش</span>`;
      simToggleBtn.className = 'btn btn-primary';
    }
  });

  simSpeedSlider.addEventListener('input', (e) => {
    viewer.simSpeed = parseFloat(e.target.value) || 1.0;
  });

  addGearBtn.addEventListener('click', () => {
    const nextIdx = gears.length + 1;
    const teethOptions = [18, 24, 30, 40, 50];
    const chosenTeeth = teethOptions[nextIdx % teethOptions.length];
    const colors = ['#ec4899', '#8b5cf6', '#f59e0b', '#06b6d4', '#10b981'];

    // Automatically place next to previous gear
    const lastGear = gears[gears.length - 1];
    const prevRadius = (lastGear.module * lastGear.numTeeth) / 2.0;
    const thisRadius = (lastGear.module * chosenTeeth) / 2.0;
    const nextX = lastGear.posX + prevRadius + thisRadius;

    const newId = `gear_${Date.now()}`;
    gears.push({
      id: newId,
      name: `چرخ‌دنده ${nextIdx}`,
      type: 'spur',
      module: lastGear.module,
      numTeeth: chosenTeeth,
      pressureAngle: 20,
      faceWidth: lastGear.faceWidth,
      boreDiameter: 12,
      hasHub: true,
      hubDiameter: 26,
      hubLength: 12,
      hasSetscrew: false,
      setscrewSize: 4,
      setscrewDistance: 6,
      color: colors[nextIdx % colors.length],
      isDriver: false,
      rpm: 0,
      posX: Math.round(nextX),
      posY: 0
    });

    activeGearId = newId;
    refreshGearAssembly();
  });
}

function setupViewportHudEvents() {
  document.getElementById('viewIsoBtn').addEventListener('click', () => viewer.setPresetView('iso'));
  document.getElementById('viewTopBtn').addEventListener('click', () => viewer.setPresetView('top'));
  document.getElementById('viewFrontBtn').addEventListener('click', () => viewer.setPresetView('front'));
  document.getElementById('viewSideBtn').addEventListener('click', () => viewer.setPresetView('side'));
  document.getElementById('resetViewBtn').addEventListener('click', () => viewer.setPresetView('iso'));

  document.getElementById('materialSelect').addEventListener('change', (e) => {
    viewer.setMaterialType(e.target.value);
  });

  document.getElementById('toggleGridCheck').addEventListener('change', (e) => {
    viewer.toggleGrid(e.target.checked);
  });
  document.getElementById('toggleAxesCheck').addEventListener('change', (e) => {
    viewer.toggleAxes(e.target.checked);
  });
}

function setupExportModalEvents() {
  const modal = document.getElementById('exportModal');
  const openExportBtn = document.getElementById('openExportBtn');
  const openSendBtn = document.getElementById('openSendBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  openExportBtn.addEventListener('click', () => modal.classList.add('show'));
  openSendBtn.addEventListener('click', () => modal.classList.add('show'));
  closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });

  // Export 2D DXF
  document.getElementById('exportDXFBtn').addEventListener('click', () => {
    const gear = getActiveGear();
    const profile = (gear.type === 'rack') ? GearMath.generateRackProfile(gear) : GearMath.generateSpurGearProfile(gear);
    const dxfContent = GearExporters.exportToDXF(profile, gear);
    const filename = `${gear.name || 'gear'}_m${gear.module}_z${gear.numTeeth}.dxf`;
    GearExporters.downloadFile(dxfContent, filename, 'application/dxf');
  });

  // Export 3D Solid STEP (AP214)
  document.getElementById('exportSTEPBtn').addEventListener('click', () => {
    const gearMeshItem = viewer.gearMeshes.find(m => m.id === activeGearId) || viewer.gearMeshes[0];
    if (!gearMeshItem) return;
    const stepContent = GearExporters.exportToSTEP(gearMeshItem.group, gearMeshItem.gear);
    const filename = `${gearMeshItem.gear.name || 'gear'}_m${gearMeshItem.gear.module}_z${gearMeshItem.gear.numTeeth}.stp`;
    GearExporters.downloadFile(stepContent, filename, 'application/step');
  });

  // Export Binary STL
  document.getElementById('exportSTLBtn').addEventListener('click', () => {
    const gearMeshItem = viewer.gearMeshes.find(m => m.id === activeGearId) || viewer.gearMeshes[0];
    if (!gearMeshItem) return;
    const stlBlob = GearExporters.exportToSTL(gearMeshItem.group);
    if (stlBlob) {
      const filename = `${gearMeshItem.gear.name || 'gear'}_m${gearMeshItem.gear.module}_z${gearMeshItem.gear.numTeeth}.stl`;
      GearExporters.downloadFile(stlBlob, filename, 'application/octet-stream');
    }
  });

  // Direct Send / Native Share
  document.getElementById('sendDirectBtn').addEventListener('click', async () => {
    const gearMeshItem = viewer.gearMeshes.find(m => m.id === activeGearId) || viewer.gearMeshes[0];
    if (!gearMeshItem) return;
    const stlBlob = GearExporters.exportToSTL(gearMeshItem.group);
    const filename = `${gearMeshItem.gear.name || 'gear'}.stl`;
    const title = `مدل چرخ‌دنده مهندسی - ${gearMeshItem.gear.name}`;
    const text = `فایل چرخ‌دنده سالید استاندارد مدول ${gearMeshItem.gear.module} و ${gearMeshItem.gear.numTeeth} دندانه`;
    await GearExporters.shareFile(stlBlob, filename, title, text);
    modal.classList.remove('show');
  });
}
