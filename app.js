/**
 * eAI - Tutor Matemático & Portal Docente
 * Autenticación, Historial de Chats en SQLite, Vista Previa KaTeX en vivo y Conexión con Graficadora.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  const state = {
    user: JSON.parse(localStorage.getItem('eai_user')) || null,
    currentChatId: null,
    mode: 'apples',     // 'apples' | 'socratic' | 'oma'
    backendUrl: 'http://localhost:8000',
    backendOnline: false,
    apiKey: localStorage.getItem('euler_gemini_api_key') || '',
    authMode: 'login',
    teacherCategory: 'exam',
    plotter: {
      expr: '(x^2 - 1)/(1 - x^2)',
      scale: 36,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    }
  };

  // --- DOM ELEMENTS ---
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const welcomeHero = document.getElementById('welcomeHero');
  const headerContextLabel = document.getElementById('headerContextLabel');
  const activeModeBadge = document.getElementById('activeModeBadge');
  const btnCycleMode = document.getElementById('btnCycleMode');
  const btnNewChat = document.getElementById('btnNewChat');
  const chatHistoryList = document.getElementById('chatHistoryList');
  const chatCountBadge = document.getElementById('chatCountBadge');
  const studentSourcesList = document.getElementById('studentSourcesList');
  const studentSourceCount = document.getElementById('studentSourceCount');

  // Math Preview & Grapher bridge
  const formulaPreviewContainer = document.getElementById('formulaPreviewContainer');
  const formulaPreviewMath = document.getElementById('formulaPreviewMath');
  const btnSendToGrapher = document.getElementById('btnSendToGrapher');

  // Graph elements
  const btnToggleGraph = document.getElementById('btnToggleGraph');
  const btnCloseGraph = document.getElementById('btnCloseGraph');
  const btnOpenGraphQuick = document.getElementById('btnOpenGraphQuick');
  const graphDrawer = document.getElementById('graphDrawer');
  const mathCanvas = document.getElementById('mathCanvas');
  const graphInputExpr = document.getElementById('graphInputExpr');
  const btnPlotCustom = document.getElementById('btnPlotCustom');
  const graphCoordinates = document.getElementById('graphCoordinates');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetView = document.getElementById('btnResetView');
  const presetBtns = document.querySelectorAll('.preset-btn');

  // Scientific Calculator Elements
  const btnToggleCalc = document.getElementById('btnToggleCalc');
  const btnToggleCalcInInput = document.getElementById('btnToggleCalcInInput');
  const btnCloseCalc = document.getElementById('btnCloseCalc');
  const scientificKeyboard = document.getElementById('scientificKeyboard');
  const calcKeys = document.querySelectorAll('.calc-key');

  // Teacher Portal Modal
  const btnOpenTeacherPortal = document.getElementById('btnOpenTeacherPortal');
  const btnQuickTeacherNav = document.getElementById('btnQuickTeacherNav');
  const teacherModal = document.getElementById('teacherModal');
  const btnCloseTeacherModal = document.getElementById('btnCloseTeacherModal');
  const teacherCatBtns = document.querySelectorAll('.teacher-cat-btn');
  const teacherTopicInput = document.getElementById('teacherTopicInput');
  const teacherLevelSelect = document.getElementById('teacherLevelSelect');
  const btnGenerateTeacherMaterial = document.getElementById('btnGenerateTeacherMaterial');
  const teacherOutputContainer = document.getElementById('teacherOutputContainer');
  const teacherOutputTitle = document.getElementById('teacherOutputTitle');
  const teacherOutputContent = document.getElementById('teacherOutputContent');
  const btnCopyTeacherOutput = document.getElementById('btnCopyTeacherOutput');

  // Auth Modal
  const btnOpenAuthModal = document.getElementById('btnOpenAuthModal');
  const authModal = document.getElementById('authModal');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
  const authForm = document.getElementById('authForm');
  const authModalTitle = document.getElementById('authModalTitle');
  const authNameGroup = document.getElementById('authNameGroup');
  const authRoleGroup = document.getElementById('authRoleGroup');
  const authInputName = document.getElementById('authInputName');
  const authSelectRole = document.getElementById('authSelectRole');
  const authInputEmail = document.getElementById('authInputEmail');
  const authInputPassword = document.getElementById('authInputPassword');
  const btnSubmitAuth = document.getElementById('btnSubmitAuth');
  const btnToggleAuthMode = document.getElementById('btnToggleAuthMode');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const userRoleDisplay = document.getElementById('userRoleDisplay');
  const userAvatar = document.getElementById('userAvatar');

  // Settings
  const btnSettings = document.getElementById('btnSettings');
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const selectModel = document.getElementById('selectModel');
  const inputApiKey = document.getElementById('inputApiKey');

  // Mode cards & quick prompts
  const modeCards = document.querySelectorAll('.mode-card');
  const quickPrompts = document.querySelectorAll('.quick-prompt');

  if (window.lucide) window.lucide.createIcons();

  // --- MOBILE SIDEBAR DRAWER ---
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  function openMobileSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    sidebarBackdrop.classList.remove('hidden');
  }

  function closeMobileSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
    sidebarBackdrop.classList.add('hidden');
  }

  btnToggleSidebar?.addEventListener('click', () => {
    if (sidebar.classList.contains('-translate-x-full')) {
      openMobileSidebar();
    } else {
      closeMobileSidebar();
    }
  });

  sidebarBackdrop?.addEventListener('click', closeMobileSidebar);

  // --- RENDER VISUAL DE KATEX EN BOTONES DE CALCULADORA ---
  function renderAllMathSymbols() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
      document.querySelectorAll('.math-render').forEach(el => {
        try {
          if (!el.dataset.rendered && window.katex) {
            window.katex.render(el.textContent, el, { throwOnError: false });
            el.dataset.rendered = "true";
          }
        } catch (e) {}
      });
    }
  }
  setTimeout(renderAllMathSymbols, 150);

  // --- VISTA PREVIA MATEMÁTICA EN VIVO DEL CHAT ---
  function updateLiveFormulaPreview() {
    const text = chatInput.value.trim();
    // Detectar si contiene notación matemática o fórmulas
    const mathRegex = /(\\lim|\\frac|\\int|\\sqrt|\\sin|\\cos|\\tan|\\ln|\^|_|\\in|\\le|\\ge|\\infty|\+|-|\/|\*)/;
    if (text && mathRegex.test(text)) {
      try {
        let mathToRender = text;
        // Si no tiene delimitadores y parece una fórmula pura, rodear con LaTeX
        if (!mathToRender.includes('$')) {
          mathToRender = mathToRender.replace(/x\^2/g, 'x^2');
        }
        formulaPreviewContainer.classList.remove('hidden');
        if (window.katex) {
          window.katex.render(mathToRender, formulaPreviewMath, { throwOnError: false });
        }
      } catch (e) {
        formulaPreviewContainer.classList.add('hidden');
      }
    } else {
      formulaPreviewContainer.classList.add('hidden');
    }
  }

  chatInput.addEventListener('input', updateLiveFormulaPreview);

  // Botón "Enviar a Graficadora" desde el chat
  btnSendToGrapher?.addEventListener('click', () => {
    let expr = chatInput.value.trim();
    // Limpiar comandos no válidos para la graficadora f(x)
    expr = expr.replace(/\\lim_\{.*?\}\s*/g, '')
               .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1)/($2)')
               .replace(/\\/g, '')
               .replace(/\$/g, '');
    
    if (expr) {
      graphInputExpr.value = expr;
      state.plotter.expr = expr;
      graphDrawer.classList.remove('hidden');
      drawPlotter();
      graphDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // --- ACTUALIZAR PERFIL EN UI ---
  function updateUserUI() {
    if (state.user) {
      userNameDisplay.textContent = state.user.full_name;
      userRoleDisplay.textContent = state.user.role === 'teacher' ? 'Docente / Cátedra' : 'Estudiante';
      const initials = state.user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      userAvatar.textContent = initials || 'US';
      userAvatar.className = state.user.role === 'teacher'
        ? 'w-7 h-7 rounded-full bg-amber-500/30 border border-amber-500/50 flex items-center justify-center text-xs font-semibold text-amber-300'
        : 'w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold text-indigo-300';
    } else {
      userNameDisplay.textContent = 'Invitado / Estudiante';
      userRoleDisplay.textContent = 'Clic para Iniciar Sesión';
      userAvatar.textContent = 'EM';
    }
  }
  updateUserUI();

  // --- BACKEND HEALTH & HISTORIAL & FUENTES ---
  async function checkBackendHealth() {
    try {
      const res = await fetch(`${state.backendUrl}/`, { method: 'GET' });
      if (res.ok) {
        state.backendOnline = true;
        updateHeaderContext();
        loadChatHistory();
        loadStudentSources();
      }
    } catch (e) {
      state.backendOnline = false;
      updateHeaderContext();
    }
  }
  checkBackendHealth();

  async function loadStudentSources() {
    if (!state.backendOnline) return;
    try {
      const userIdParam = state.user ? `?user_id=${state.user.id}` : '';
      const res = await fetch(`${state.backendUrl}/api/student-sources${userIdParam}`);
      if (res.ok) {
        const data = await res.json();
        const sources = data.sources || [];
        studentSourceCount.textContent = `${sources.length} archivo${sources.length === 1 ? '' : 's'}`;
        if (sources.length === 0) {
          studentSourcesList.innerHTML = `<div class="p-2 text-[11px] text-slate-500 text-center border border-dashed border-slate-800 rounded-lg">No has subido ningún apunte aún.</div>`;
        } else {
          studentSourcesList.innerHTML = sources.map(s => `
            <div class="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-[#111624] border border-[#1e2538]">
              <span class="truncate flex items-center gap-1.5">
                <i data-lucide="file-text" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
                <span class="truncate font-medium text-[11px]">${escapeHtml(s.filename)}</span>
              </span>
              <span class="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">Activo</span>
            </div>
          `).join('');
          if (window.lucide) window.lucide.createIcons();
        }
      }
    } catch (e) {}
  }

  async function loadChatHistory() {
    if (!state.backendOnline) return;
    try {
      const userIdParam = state.user ? `?user_id=${state.user.id}` : '';
      const res = await fetch(`${state.backendUrl}/api/chats${userIdParam}`);
      if (res.ok) {
        const data = await res.json();
        renderChatHistoryList(data.chats || []);
      }
    } catch (e) {}
  }

  function renderChatHistoryList(chats) {
    chatHistoryList.innerHTML = '';
    chatCountBadge.textContent = `${chats.length} chat${chats.length === 1 ? '' : 's'}`;

    if (chats.length === 0) {
      chatHistoryList.innerHTML = `<div class="p-2 text-[11px] text-slate-500 text-center">No hay chats previos</div>`;
      return;
    }

    chats.forEach(chat => {
      const btn = document.createElement('button');
      btn.className = `chat-history-item w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left truncate ${state.currentChatId === chat.id ? 'active bg-slate-800 text-white border border-indigo-500/40' : 'text-slate-300 hover:bg-slate-800/50'}`;
      btn.innerHTML = `
        <span class="truncate flex items-center gap-2">
          <i data-lucide="message-square" class="w-3 h-3 text-indigo-400 shrink-0"></i>
          <span class="truncate">${escapeHtml(chat.title)}</span>
        </span>
      `;
      btn.addEventListener('click', () => loadSingleChat(chat.id));
      chatHistoryList.appendChild(btn);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function loadSingleChat(chatId) {
    state.currentChatId = chatId;
    if (welcomeHero) welcomeHero.style.display = 'none';

    try {
      const res = await fetch(`${state.backendUrl}/api/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        chatMessages.innerHTML = '';
        data.messages.forEach(msg => {
          if (msg.sender === 'user') {
            appendUserMessage(msg.content, false);
          } else {
            appendBackendMessage(msg.content, false);
          }
        });
        loadChatHistory();
        scrollToBottom();
      }
    } catch (e) {}
  }

  // Nuevo Chat
  btnNewChat?.addEventListener('click', () => {
    state.currentChatId = null;
    chatMessages.innerHTML = '';
    if (welcomeHero) {
      chatMessages.appendChild(welcomeHero);
      welcomeHero.style.display = 'block';
    }
    loadChatHistory();
    chatInput.focus();
  });

  // --- SUBIDA DE APUNTES ---
  const hiddenFileInput = document.createElement('input');
  hiddenFileInput.type = 'file';
  hiddenFileInput.accept = '.pdf,.txt,.png,.jpg,.jpeg';
  hiddenFileInput.style.display = 'none';
  document.body.appendChild(hiddenFileInput);

  document.getElementById('btnUploadSim')?.addEventListener('click', () => hiddenFileInput.click());

  hiddenFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (state.user) formData.append('user_id', state.user.id);

    try {
      const res = await fetch(`${state.backendUrl}/api/upload-source`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert(`¡Apunte "${file.name}" cargado e incorporado a tus fuentes!`);
        loadStudentSources();
      }
    } catch (err) {
      alert(`Apunte "${file.name}" cargado.`);
    }
  });

  // --- CALCULADORA CIENTÍFICA VIRTUAL ---
  function toggleScientificCalc() {
    scientificKeyboard.classList.toggle('hidden');
    if (!scientificKeyboard.classList.contains('hidden')) {
      renderAllMathSymbols();
      scientificKeyboard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  btnToggleCalc?.addEventListener('click', toggleScientificCalc);
  btnToggleCalcInInput?.addEventListener('click', toggleScientificCalc);
  btnCloseCalc?.addEventListener('click', () => scientificKeyboard.classList.add('hidden'));

  calcKeys.forEach(btn => {
    btn.addEventListener('click', () => {
      insertAtCursor(chatInput, btn.dataset.insert);
      updateLiveFormulaPreview();
    });
  });

  function insertAtCursor(myField, myValue) {
    if (myField.selectionStart || myField.selectionStart === 0) {
      const startPos = myField.selectionStart;
      const endPos = myField.selectionEnd;
      myField.value = myField.value.substring(0, startPos) + myValue + myField.value.substring(endPos, myField.value.length);
      myField.selectionStart = startPos + myValue.length;
      myField.selectionEnd = startPos + myValue.length;
    } else {
      myField.value += myValue;
    }
    myField.focus();
  }

  // --- PORTAL DOCENTE (GENERADOR DE MATERIAL) ---
  function openTeacherPortal() {
    teacherModal.classList.remove('hidden');
  }

  btnOpenTeacherPortal?.addEventListener('click', openTeacherPortal);
  btnQuickTeacherNav?.addEventListener('click', openTeacherPortal);
  btnCloseTeacherModal?.addEventListener('click', () => teacherModal.classList.add('hidden'));

  teacherCatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      teacherCatBtns.forEach(b => {
        b.classList.remove('active', 'border-amber-500/40', 'bg-amber-500/10');
        b.classList.add('border-slate-800', 'bg-slate-900/40');
      });
      btn.classList.add('active', 'border-amber-500/40', 'bg-amber-500/10');
      state.teacherCategory = btn.dataset.cat;
    });
  });

  btnGenerateTeacherMaterial?.addEventListener('click', async () => {
    const topic = teacherTopicInput.value.trim() || 'Límites y Continuidad';
    const level = teacherLevelSelect.value;
    btnGenerateTeacherMaterial.disabled = true;
    btnGenerateTeacherMaterial.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Generando material pedagógico...</span>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await fetch(`${state.backendUrl}/api/teacher/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: state.user?.id || null,
          topic: topic,
          level: level,
          category: state.teacherCategory
        })
      });

      if (res.ok) {
        const data = await res.json();
        teacherOutputContainer.classList.remove('hidden');
        teacherOutputTitle.textContent = data.title;
        teacherOutputContent.textContent = data.content;
        renderAllMathSymbols();
      }
    } catch (e) {
      alert("Error al conectar con el backend docente.");
    } finally {
      btnGenerateTeacherMaterial.disabled = false;
      btnGenerateTeacherMaterial.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4"></i><span>Generar Material con eAI</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  btnCopyTeacherOutput?.addEventListener('click', () => {
    navigator.clipboard.writeText(teacherOutputContent.textContent);
    alert("¡Material copiado al portapapeles!");
  });

  // --- AUTENTICACIÓN (LOGIN / REGISTRO) ---
  btnOpenAuthModal?.addEventListener('click', () => authModal.classList.remove('hidden'));
  btnCloseAuthModal?.addEventListener('click', () => authModal.classList.add('hidden'));

  btnToggleAuthMode?.addEventListener('click', () => {
    if (state.authMode === 'login') {
      state.authMode = 'register';
      authModalTitle.textContent = 'Crear Cuenta en eAI';
      authNameGroup.classList.remove('hidden');
      authRoleGroup.classList.remove('hidden');
      btnSubmitAuth.textContent = 'Registrarme';
      btnToggleAuthMode.textContent = '¿Ya tienes cuenta? Inicia sesión';
    } else {
      state.authMode = 'login';
      authModalTitle.textContent = 'Iniciar Sesión en eAI';
      authNameGroup.classList.add('hidden');
      authRoleGroup.classList.add('hidden');
      btnSubmitAuth.textContent = 'Entrar a mi cuenta';
      btnToggleAuthMode.textContent = '¿No tienes cuenta? Regístrate aquí';
    }
  });

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authInputEmail.value.trim();
    const password = authInputPassword.value.trim();

    try {
      const endpoint = state.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const bodyPayload = state.authMode === 'register'
        ? { email, password, full_name: authInputName.value.trim() || 'Usuario eAI', role: authSelectRole.value }
        : { email, password };

      const res = await fetch(`${state.backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        const data = await res.json();
        state.user = data.user;
        localStorage.setItem('eai_user', JSON.stringify(data.user));
        updateUserUI();
        authModal.classList.add('hidden');
        loadChatHistory();
        loadStudentSources();
        alert(`¡Bienvenido/a, ${data.user.full_name}!`);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Error en la autenticación.");
      }
    } catch (err) {
      alert("Error al conectar con el servidor.");
    }
  });

  // --- SELECTOR DE ENFOQUE (CAMBIO REAL EN TIEMPO REAL) ---
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      setMode(card.dataset.mode);
    });
  });

  function setMode(mode) {
    state.mode = mode;
    modeCards.forEach(c => {
      if (c.dataset.mode === mode) c.classList.add('active');
      else c.classList.remove('active');
    });
    updateHeaderContext();
  }

  btnCycleMode.addEventListener('click', () => {
    const modes = ['apples', 'socratic', 'oma'];
    const nextIndex = (modes.indexOf(state.mode) + 1) % modes.length;
    setMode(modes[nextIndex]);
  });

  function updateHeaderContext() {
    const modeNames = {
      apples: { name: 'Peras y Manzanas 🍎', color: 'text-emerald-400', badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
      socratic: { name: 'Paso a Paso Riguroso 📖', color: 'text-indigo-400', badgeClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
      oma: { name: 'Razonamiento OMA 🏆', color: 'text-amber-400', badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-300' }
    };

    const currentModeInfo = modeNames[state.mode];
    const serverDot = state.backendOnline ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>Backend Conectado' : 'Modo Autónomo';
    headerContextLabel.innerHTML = `Modo: <strong class="${currentModeInfo.color}">${currentModeInfo.name}</strong> &bull; <span class="text-slate-400">${serverDot}</span>`;
    
    activeModeBadge.className = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${currentModeInfo.badgeClass}`;
    activeModeBadge.innerHTML = currentModeInfo.name;
  }

  // --- QUICK PROMPTS ---
  quickPrompts.forEach(btn => {
    btn.addEventListener('click', () => {
      const pText = btn.querySelector('p').textContent.replace(/"/g, '');
      chatInput.value = pText;
      updateLiveFormulaPreview();
      handleSendMessage();
    });
  });

  // --- CALCULADORA GRÁFICA GEOGEBRA ---
  btnToggleGraph?.addEventListener('click', () => {
    graphDrawer.classList.toggle('hidden');
    if (!graphDrawer.classList.contains('hidden')) drawPlotter();
  });
  btnOpenGraphQuick?.addEventListener('click', () => {
    graphDrawer.classList.remove('hidden');
    drawPlotter();
  });
  btnCloseGraph?.addEventListener('click', () => graphDrawer.classList.add('hidden'));

  btnPlotCustom?.addEventListener('click', () => {
    const expr = graphInputExpr.value.trim();
    if (expr) {
      state.plotter.expr = expr;
      drawPlotter();
    }
  });

  graphInputExpr?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnPlotCustom.click();
    }
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const expr = btn.dataset.expr;
      graphInputExpr.value = expr;
      state.plotter.expr = expr;
      drawPlotter();
    });
  });

  btnZoomIn?.addEventListener('click', () => {
    state.plotter.scale = Math.min(180, state.plotter.scale * 1.25);
    drawPlotter();
  });

  btnZoomOut?.addEventListener('click', () => {
    state.plotter.scale = Math.max(10, state.plotter.scale / 1.25);
    drawPlotter();
  });

  btnResetView?.addEventListener('click', () => {
    state.plotter.scale = 36;
    state.plotter.offsetX = 0;
    state.plotter.offsetY = 0;
    drawPlotter();
  });

  function evaluateMath(expression, x) {
    try {
      let expr = expression.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/\^/g, '**')
        .replace(/pi/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/sen\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/log\(/g, 'Math.log10(');

      expr = expr.replace(/(\d)(x)/g, '$1*$2');
      expr = expr.replace(/(\d)(\()/g, '$1*$2');
      expr = expr.replace(/(\))(x)/g, '$1*$2');

      const fn = new Function('x', `with(Math) { return ${expr}; }`);
      const val = fn(x);
      return (typeof val === 'number' && !isNaN(val) && isFinite(val)) ? val : null;
    } catch (err) {
      return null;
    }
  }

  function drawPlotter() {
    if (!mathCanvas) return;
    const ctx = mathCanvas.getContext('2d');
    const width = (mathCanvas.width = mathCanvas.parentElement.clientWidth);
    const height = (mathCanvas.height = mathCanvas.parentElement.clientHeight);

    ctx.clearRect(0, 0, width, height);

    const originX = width / 2 + state.plotter.offsetX;
    const originY = height / 2 + state.plotter.offsetY;
    const scale = state.plotter.scale;

    // Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#141a29';
    for (let x = originX % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = originY % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Ejes
    ctx.strokeStyle = '#3b455b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Números
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const unitStep = scale > 70 ? 1 : scale > 30 ? 2 : 5;
    const minUnitX = Math.floor(-originX / scale);
    const maxUnitX = Math.ceil((width - originX) / scale);

    for (let u = minUnitX; u <= maxUnitX; u++) {
      if (u === 0 || u % unitStep !== 0) continue;
      const px = originX + u * scale;
      ctx.beginPath();
      ctx.moveTo(px, originY - 3);
      ctx.lineTo(px, originY + 3);
      ctx.strokeStyle = '#475569';
      ctx.stroke();
      ctx.fillText(u.toString(), px, originY + 5);
    }

    // Curva
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    let isDrawing = false;
    for (let px = 0; px < width; px += 1) {
      const x = (px - originX) / scale;
      const y = evaluateMath(state.plotter.expr, x);

      if (y !== null) {
        const py = originY - y * scale;
        if (py >= -height && py <= height * 2) {
          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          isDrawing = false;
        }
      } else {
        isDrawing = false;
      }
    }
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(originX, originY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (mathCanvas) {
    mathCanvas.addEventListener('mousedown', (e) => {
      state.plotter.isDragging = true;
      state.plotter.lastMouseX = e.clientX;
      state.plotter.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      state.plotter.isDragging = false;
    });

    mathCanvas.addEventListener('mousemove', (e) => {
      const rect = mathCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const originX = mathCanvas.width / 2 + state.plotter.offsetX;
      const originY = mathCanvas.height / 2 + state.plotter.offsetY;
      const realX = ((mouseX - originX) / state.plotter.scale);
      const realY = evaluateMath(state.plotter.expr, realX);

      if (graphCoordinates) {
        const yStr = realY !== null ? realY.toFixed(2) : '--';
        graphCoordinates.textContent = `x: ${realX.toFixed(2)} | f(x): ${yStr}`;
      }

      if (state.plotter.isDragging) {
        const dx = e.clientX - state.plotter.lastMouseX;
        const dy = e.clientY - state.plotter.lastMouseY;
        state.plotter.offsetX += dx;
        state.plotter.offsetY += dy;
        state.plotter.lastMouseX = e.clientX;
        state.plotter.lastMouseY = e.clientY;
        drawPlotter();
      }
    });

    mathCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      state.plotter.scale = Math.max(10, Math.min(200, state.plotter.scale * zoomFactor));
      drawPlotter();
    }, { passive: false });

    // Touch events para celulares y tablets
    mathCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        state.plotter.isDragging = true;
        state.plotter.lastMouseX = e.touches[0].clientX;
        state.plotter.lastMouseY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      state.plotter.isDragging = false;
    });

    mathCanvas.addEventListener('touchmove', (e) => {
      if (state.plotter.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - state.plotter.lastMouseX;
        const dy = e.touches[0].clientY - state.plotter.lastMouseY;
        state.plotter.offsetX += dx;
        state.plotter.offsetY += dy;
        state.plotter.lastMouseX = e.touches[0].clientX;
        state.plotter.lastMouseY = e.touches[0].clientY;
        drawPlotter();
      }
    }, { passive: true });
  }

  // --- CHAT SUBMIT & FLOW ---
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendMessage();
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (welcomeHero) welcomeHero.style.display = 'none';

    appendUserMessage(text);
    chatInput.value = '';
    formulaPreviewContainer.classList.add('hidden');

    const typingId = showTypingIndicator();

    try {
      const response = await fetch(`${state.backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          mode: state.mode,
          chat_id: state.currentChatId,
          user_id: state.user?.id || null,
          api_key: state.apiKey
        })
      });

      if (response.ok) {
        const data = await response.json();
        state.currentChatId = data.chat_id;
        removeTypingIndicator(typingId);
        appendBackendMessage(data.response);
        loadChatHistory();
        return;
      }
    } catch (err) {}

    setTimeout(() => {
      removeTypingIndicator(typingId);
      const aiResponse = generateNaturalMathResponse(text, state.mode);
      appendBackendMessage(aiResponse);
    }, 600);
  }

  function appendUserMessage(text, scroll = true) {
    const bubble = document.createElement('div');
    bubble.className = 'flex justify-end animate-fade-in';
    bubble.innerHTML = `
      <div class="message-bubble-user max-w-xl p-4 text-sm text-slate-100">
        <div class="user-text-content whitespace-pre-wrap">${escapeHtml(text)}</div>
      </div>
    `;
    chatMessages.appendChild(bubble);
    renderAllMathSymbols();
    if (scroll) scrollToBottom();
  }

  function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const bubble = document.createElement('div');
    bubble.id = id;
    bubble.className = 'flex items-start gap-3 animate-fade-in';
    bubble.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-xs">
        eAI
      </div>
      <div class="message-bubble-ai p-4 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
        <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse [animation-delay:0.2s]"></span>
        <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse [animation-delay:0.4s]"></span>
      </div>
    `;
    chatMessages.appendChild(bubble);
    scrollToBottom();
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function appendBackendMessage(markdownText, scroll = true) {
    const bubble = document.createElement('div');
    bubble.className = 'flex items-start gap-3 animate-fade-in';
    const modeBadge = state.mode === 'apples' ? '🍎 Peras y Manzanas' : state.mode === 'socratic' ? '📖 Rigor Spivak' : '🏆 OMA';
    bubble.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 p-[1px] shrink-0 shadow-md">
        <div class="w-full h-full bg-[#0a0c12] rounded-[11px] flex items-center justify-center font-bold text-xs text-indigo-300">
          eAI
        </div>
      </div>
      <div class="message-bubble-ai max-w-2xl p-5 text-sm text-slate-200 space-y-3">
        <div class="ai-body space-y-3 leading-relaxed whitespace-pre-wrap">${markdownText}</div>
        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            eAI &bull; Enfoque: <strong>${modeBadge}</strong>
          </span>
          <button class="hover:text-slate-200 transition-colors" onclick="navigator.clipboard.writeText(this.closest('.message-bubble-ai').innerText)">Copiar</button>
        </div>
      </div>
    `;
    chatMessages.appendChild(bubble);
    renderAllMathSymbols();
    if (window.lucide) window.lucide.createIcons();
    if (scroll) scrollToBottom();
  }

  function generateNaturalMathResponse(prompt, mode) {
    const p = prompt.toLowerCase();
    if (p.includes('derivada') || p.includes('derivar')) {
      if (mode === 'apples') {
        return `**¿Qué es la Derivada? (Peras y Manzanas 🍎):**\n\nEs la aguja del velocímetro en un instante congelado. Mientras la velocidad promedio mide todo el viaje de 400 km, la derivada achica el tiempo tanto ($h \\to 0$) que mide exactamente la velocidad instantánea en un segundo específico.`;
      } else if (mode === 'socratic') {
        return `**Definición Formal de la Derivada (Spivak 📖):**\n\n$$f'(x_0) = \\lim_{h \\to 0} \\frac{f(x_0+h) - f(x_0)}{h}$$\n\nTeorema: Si $f$ es diferenciable en $x_0$, entonces $f$ es continua en $x_0$.`;
      } else {
        return `**Derivadas y Optimización en la OMA 🏆:**\n\nEn olimpíadas evitamos derivadas mecánicas y usamos el Principio del Extremo y la desigualdad entre Medias Aritmética y Geométrica (MA-MG) para hallar máximos y mínimos con simetría pura.`;
      }
    }
    return `Análisis conceptual de tu consulta bajo el enfoque seleccionado.`;
  }

  // --- SETTINGS MODAL ---
  btnSettings?.addEventListener('click', () => {
    selectModel.value = 'simulated';
    inputApiKey.value = state.apiKey;
    settingsModal.classList.remove('hidden');
  });
  btnCloseSettings?.addEventListener('click', () => settingsModal.classList.add('hidden'));
  btnSaveSettings?.addEventListener('click', () => {
    state.apiKey = inputApiKey.value.trim();
    localStorage.setItem('euler_gemini_api_key', state.apiKey);
    settingsModal.classList.add('hidden');
  });

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.innerText = string;
    return div.innerHTML;
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  updateHeaderContext();
});
