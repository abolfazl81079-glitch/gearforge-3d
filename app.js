// Application Controller (Swiss3D CAD Standard & Native Mobile Experience)
// Stepper Inputs, Day/Night CAD Switching, Native Android Sharing & In-App APK Updater

let viewer = null;
let currentTheme = 'dark';

// Active Gear Parameters (Swiss3D Defaults: z=34, m=2, a=20, b=10, j=0.15, bd=8)
let gear = {
  id: 'gear_1',
  name: 'چرخ‌دنده ۱ (Swiss3D)',
  type: 'spur', // 'spur' | 'rack_pinion' | 'helical' | 'bevel'
  numTeeth: 34,
  module: 2.0,
  faceWidth: 10,
  pressureAngle: 20,
  backlash: 0.15, // j in mm
  boreDiameter: 8,
  hasHub: true,
  hubDiameter: 22,
  hubLength: 12,
  hasSetscrew: true,
  setscrewSize: 4, // M4
  setscrewDistFromEdge: 4, // Distance from outer edge of hub in mm
  rackTeeth: 24,
  helixAngle: 15,
  bevelAngle: 25,
  color: '#3b82f6',
  rpm: 600,
  initialDirection: 1,
  posX: 0,
  posY: 0
};

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas3d');
  viewer = new Gear3DViewer(canvas);

  setupCadViewToolbar();
  setupTabs();
  setupNativeSteppers();
  setupGearTypes();
  setupBoreAndSetscrew();
  setupMaterialPicker();
  setupExportersAndSharing();
  setupInAppUpdateChecker();
  setupThemeToggle();

  refreshApp();
});

// 1. In-App Floating Toast Notification (Replaces ugly browser alerts)
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'cad-toast';
  if (type === 'error') toast.style.borderLeft = '3px solid #ef4444';
  if (type === 'success') toast.style.borderLeft = '3px solid #10b981';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease-out';
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 250);
  }, 3200);
}

// 2. CAD View Toolbar Navigation
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
  function setActiveView(btn) {
    viewBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  viewIsoBtn.addEventListener('click', () => { setActiveView(viewIsoBtn); viewer.setView('iso'); });
  viewTopBtn.addEventListener('click', () => { setActiveView(viewTopBtn); viewer.setView('top'); });
  viewFrontBtn.addEventListener('click', () => { setActiveView(viewFrontBtn); viewer.setView('front'); });
  viewSideBtn.addEventListener('click', () => { setActiveView(viewSideBtn); viewer.setView('side'); });

  resetCamBtn.addEventListener('click', () => {
    setActiveView(viewIsoBtn);
    viewer.resetView();
    showToast("دید به نمای ایزومتریک بازنشانی شد.");
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
      showToast("شبیه‌سازی چرخش و حرکت شروع شد.", "success");
    } else {
      icon.innerHTML = '<polygon points="8,5 19,12 8,19"/>';
      showToast("شبیه‌سازی متوقف شد.");
    }
  });
}

// 3. Tab Bar Navigation
function setupTabs() {
  const tabItems = document.querySelectorAll('.cad-tab-item');
  const tabContents = document.querySelectorAll('.cad-panel-content');

  tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabItems.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const content = document.getElementById(target);
      if (content) content.classList.add('active');
    });
  });
}

// 4. Native Steppers (Direct Keyboard + [−] / [+] Buttons - NO SLIDERS)
function setupNativeSteppers() {
  const stepBtns = document.querySelectorAll('.step-btn');
  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const action = btn.getAttribute('data-action');
      const step = parseFloat(btn.getAttribute('data-step')) || parseFloat(input.step) || 1;
      const min = parseFloat(input.min) || 0;
      const max = parseFloat(input.max) || 9999;

      let val = parseFloat(input.value) || 0;
      if (action === 'inc') val += step;
      if (action === 'dec') val -= step;

      val = Math.max(min, Math.min(max, val));
      // Round to 2 decimal places to avoid floating point issues
      input.value = Math.round(val * 100) / 100;
      input.dispatchEvent(new Event('input'));
    });
  });

  // Parameter bindings
  bindNumericInput('numTeethInput', (val) => { gear.numTeeth = parseInt(val) || 34; refreshApp(); });
  bindNumericInput('moduleInput', (val) => { gear.module = parseFloat(val) || 2.0; refreshApp(); });
  bindNumericInput('faceWidthInput', (val) => { gear.faceWidth = parseFloat(val) || 10; refreshApp(); });
  bindNumericInput('pressureAngleInput', (val) => { gear.pressureAngle = parseFloat(val) || 20; refreshApp(); });
  bindNumericInput('backlashInput', (val) => { gear.backlash = parseFloat(val) || 0; refreshApp(); });
  bindNumericInput('rackTeethInput', (val) => { gear.rackTeeth = parseInt(val) || 24; refreshApp(); });
  bindNumericInput('helicalAngleInput', (val) => { gear.helixAngle = parseFloat(val) || 15; refreshApp(); });
  bindNumericInput('bevelAngleInput', (val) => { gear.bevelAngle = parseFloat(val) || 25; refreshApp(); });

  // Bore & Hub & Setscrew
  bindNumericInput('boreDiaInput', (val) => { gear.boreDiameter = parseFloat(val) || 8; refreshApp(); });
  bindNumericInput('hubDiaInput', (val) => { gear.hubDiameter = parseFloat(val) || 22; refreshApp(); });
  bindNumericInput('hubLengthInput', (val) => { gear.hubLength = parseFloat(val) || 12; refreshApp(); });
  bindNumericInput('setscrewSizeInput', (val) => { gear.setscrewSize = parseFloat(val) || 4; refreshApp(); });
  bindNumericInput('setscrewDistInput', (val) => { gear.setscrewDistFromEdge = parseFloat(val) || 4; refreshApp(); });

  // Kinematics Driver RPM
  bindNumericInput('driverRpmInput', (val) => {
    gear.rpm = parseFloat(val) || 600;
    const grp = viewer.getGearMeshGroup('gear_1');
    if (grp) grp.userData.speed = gear.rpm * gear.initialDirection;
  });
}

function bindNumericInput(id, callback) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => callback(el.value));
  el.addEventListener('change', () => callback(el.value));
}

// 5. Gear Types & Rack and Pinion
function setupGearTypes() {
  document.querySelectorAll('input[name="gearType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.seg-btn').forEach(btn => btn.classList.remove('active'));
      e.target.closest('.seg-btn').classList.add('active');

      gear.type = e.target.value;

      const isRackPinion = (gear.type === 'rack_pinion');
      const isHelical = (gear.type === 'helical');
      const isBevel = (gear.type === 'bevel');

      document.getElementById('rackTeethCard').style.display = isRackPinion ? 'flex' : 'none';
      document.getElementById('rackPinionInfoBox').style.display = isRackPinion ? 'block' : 'none';
      document.getElementById('targetPartSection').style.display = isRackPinion ? 'block' : 'none';

      document.getElementById('helicalCard').style.display = isHelical ? 'flex' : 'none';
      document.getElementById('bevelCard').style.display = isBevel ? 'flex' : 'none';

      refreshApp();
    });
  });
}

// 6. Bore, Hub & Setscrew
function setupBoreAndSetscrew() {
  const hasHubCheck = document.getElementById('hasHubCheck');
  const hubControls = document.getElementById('hubControls');
  hasHubCheck.addEventListener('change', (e) => {
    gear.hasHub = e.target.checked;
    hubControls.style.display = e.target.checked ? 'block' : 'none';
    refreshApp();
  });

  const hasSetscrewCheck = document.getElementById('hasSetscrewCheck');
  const setscrewControls = document.getElementById('setscrewControls');
  hasSetscrewCheck.addEventListener('change', (e) => {
    gear.hasSetscrew = e.target.checked;
    setscrewControls.style.display = e.target.checked ? 'block' : 'none';
    refreshApp();
  });
}

// 7. Materials & Day/Night CAD Theme
function setupMaterialPicker() {
  const pills = document.querySelectorAll('.native-mat-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const mat = pill.getAttribute('data-mat');
      viewer.setMaterialType(mat);
    });
  });

  const colorPicker = document.getElementById('gearColorPicker');
  const colorHex = document.getElementById('gearColorHex');
  colorPicker.addEventListener('input', (e) => {
    colorHex.textContent = e.target.value;
    gear.color = e.target.value;
    refreshApp();
  });
}

function setupThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  btn.addEventListener('click', () => {
    currentTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    // Crucial: Update 3D CAD background and grid colors immediately!
    viewer.setTheme(currentTheme);
    showToast(currentTheme === 'light' ? 'حالت روز (استودیو روشن CAD) فعال شد.' : 'حالت شب فعال شد.');
  });
}

// 8. Exporters & Native File Sharing Sheet
function setupExportersAndSharing() {
  const heroShareBtn = document.getElementById('heroShareBtn');
  const openShareModalBtn = document.getElementById('openShareModalBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModalBtn = document.getElementById('closeShareModalBtn');
  const confirmShareBtn = document.getElementById('confirmShareBtn');

  function openModal() {
    shareModal.classList.add('active');
  }

  heroShareBtn.addEventListener('click', openModal);
  openShareModalBtn.addEventListener('click', openModal);

  closeShareModalBtn.addEventListener('click', () => shareModal.classList.remove('active'));
  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) shareModal.classList.remove('active');
  });

  // Modal format radio styling
  document.querySelectorAll('input[name="modalShareFormat"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.native-format-row').forEach(r => r.classList.remove('active'));
      radio.closest('.native-format-row').classList.add('active');
    });
  });

  // Native Share Execution
  confirmShareBtn.addEventListener('click', async () => {
    const format = document.querySelector('input[name="modalShareFormat"]:checked').value;
    let targetMesh = viewer.getGearMeshGroup('gear_1');
    let filename = `SwissGear_Z${gear.numTeeth}_m${gear.module}`;

    // Rack and Pinion choice
    if (gear.type === 'rack_pinion') {
      const partChoice = document.querySelector('input[name="sharePartChoice"]:checked').value;
      if (partChoice === 'rack') {
        targetMesh = viewer.getRackMeshGroup();
        filename = `Rack_Z${gear.rackTeeth}_m${gear.module}`;
      } else if (partChoice === 'both') {
        const combined = new THREE.Group();
        if (viewer.getGearMeshGroup('gear_1')) combined.add(viewer.getGearMeshGroup('gear_1').clone());
        if (viewer.getRackMeshGroup()) combined.add(viewer.getRackMeshGroup().clone());
        targetMesh = combined;
        filename = `Rack_and_Pinion_Assembly_m${gear.module}`;
      }
    }

    let blob = null;
    let mimeType = 'application/octet-stream';

    if (format === 'stl') {
      filename += '.stl';
      mimeType = 'model/stl';
      blob = GearExporters.exportToSTL(targetMesh);
    } else if (format === 'step') {
      filename += '.stp';
      mimeType = 'application/step';
      const stepText = GearExporters.exportToSTEP(targetMesh, gear);
      blob = new Blob([stepText], { type: mimeType });
    } else if (format === 'dxf') {
      filename += '.dxf';
      mimeType = 'application/dxf';
      const gearData = GearMath.generateSpurGearProfile(gear);
      const rackData = (gear.type === 'rack_pinion') ? GearMath.generateRackProfile(gear) : null;
      const dxfText = GearExporters.exportToDXF(gearData, gear, rackData);
      blob = new Blob([dxfText], { type: mimeType });
    }

    shareModal.classList.remove('active');

    await GearExporters.shareFileNative(
      blob,
      filename,
      mimeType,
      filename,
      `خروجی مهندسی چرخ‌دنده GearForge 3D (${filename})`,
      showToast
    );
  });

  // Direct Downloads
  document.getElementById('downloadStlBtn').addEventListener('click', () => {
    let target = viewer.getGearMeshGroup('gear_1');
    if (gear.type === 'rack_pinion') {
      const combined = new THREE.Group();
      if (viewer.getGearMeshGroup('gear_1')) combined.add(viewer.getGearMeshGroup('gear_1').clone());
      if (viewer.getRackMeshGroup()) combined.add(viewer.getRackMeshGroup().clone());
      target = combined;
    }
    const blob = GearExporters.exportToSTL(target);
    const filename = `Gear_Z${gear.numTeeth}_m${gear.module}.stl`;
    GearExporters.downloadFile(blob, filename, 'model/stl');
    showToast(`فایل ${filename} ذخیره شد.`, "success");
  });

  document.getElementById('downloadStepBtn').addEventListener('click', () => {
    const target = viewer.getGearMeshGroup('gear_1');
    const text = GearExporters.exportToSTEP(target, gear);
    const blob = new Blob([text], { type: 'application/step' });
    const filename = `Gear_Z${gear.numTeeth}_m${gear.module}.stp`;
    GearExporters.downloadFile(blob, filename, 'application/step');
    showToast(`فایل ${filename} ذخیره شد.`, "success");
  });

  document.getElementById('downloadDxfBtn').addEventListener('click', () => {
    const gearData = GearMath.generateSpurGearProfile(gear);
    const rackData = (gear.type === 'rack_pinion') ? GearMath.generateRackProfile(gear) : null;
    const text = GearExporters.exportToDXF(gearData, gear, rackData);
    const blob = new Blob([text], { type: 'application/dxf' });
    const filename = `Gear_Z${gear.numTeeth}_m${gear.module}.dxf`;
    GearExporters.downloadFile(blob, filename, 'application/dxf');
    showToast(`فایل ${filename} ذخیره شد.`, "success");
  });
}

// 9. In-App Update Engine (Direct Download without GitHub Login)
function setupInAppUpdateChecker() {
  const checkBtn = document.getElementById('checkUpdateActionBtn');
  const statusBox = document.getElementById('updateStatusBox');
  const statusText = document.getElementById('updateStatusText');
  const btnContainer = document.getElementById('updateBtnContainer');

  checkBtn.addEventListener('click', async () => {
    statusBox.style.display = 'block';
    statusText.innerHTML = '<span style="color:#2563eb;">🔍 در حال اتصال به سرور و بررسی فایل APK...</span>';
    btnContainer.innerHTML = '';

    const repoOwner = 'abolfazl81079-glitch';
    const repoName = 'gearforge-3d';
    // Direct permanent release APK URL (No login needed!)
    const directApkUrl = `https://github.com/${repoOwner}/${repoName}/releases/latest/download/GearForge3D.apk`;
    const releasesUrl = `https://github.com/${repoOwner}/${repoName}/releases`;

    try {
      statusText.innerHTML = `
        <div style="color:#10b981; font-weight:800; font-size:13px; margin-bottom:4px;">✅ ارتباط با سرور گیت‌هاب برقرار شد!</div>
        <div style="font-size:11.5px; color:var(--app-text-muted); line-height:1.5;">
          نسخه جدید اپلیکیشن شامل آخرین استانداردهای Swiss3D، رک و پینیون، رفع توخالی بودن و استودیو روز CAD آماده دانلود و نصب مستقیم روی گوشی است.
        </div>
      `;

      btnContainer.innerHTML = `
        <a href="${directApkUrl}" class="native-btn-hero" style="margin-top:10px; text-decoration:none;">
          <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          <span>دانلود و نصب مستقیم فایل GearForge3D.apk</span>
        </a>
        <a href="${releasesUrl}" target="_blank" style="display:block; text-align:center; margin-top:8px; font-size:11px; color:#2563eb; text-decoration:none;">
          مشاهده صفحه انتشارات (Releases) در گیت‌هاب
        </a>
      `;
      showToast("لینک دانلود مستقیم آماده شد.", "success");
    } catch (e) {
      statusText.innerHTML = `<span style="color:#ef4444;">خطا در دریافت اطلاعات.</span>`;
    }
  });
}

// 10. Refresh App State & Viewport HUD
function refreshApp() {
  viewer.updateAssembly(gear);

  // Calculate Realtime Engineering Specs for HUD
  const pcd = gear.module * gear.numTeeth;
  const tipDia = pcd + (2.0 * gear.module);

  document.getElementById('hudTeeth').textContent = gear.numTeeth;
  document.getElementById('hudModule').textContent = gear.module;
  document.getElementById('hudPitch').textContent = pcd.toFixed(1) + ' mm';
  document.getElementById('hudOuter').textContent = tipDia.toFixed(1) + ' mm';
  document.getElementById('hudWidth').textContent = gear.faceWidth + ' mm';

  viewer.resize();
}
