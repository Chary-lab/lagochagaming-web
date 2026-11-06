(function () {
  if (window.__lgAppReady) return;
  window.__lgAppReady = true;

  var path = location.pathname.replace(/\/+$/, '');
  var page = 'home';
  if (/comunidad(\.html)?$/i.test(path)) page = 'comunidad';
  else if (/galeria(\.html)?$/i.test(path)) page = 'galeria';
  else if (/cine(\.html)?$/i.test(path)) page = 'cine';
  else if (/sorteo(\.html)?$/i.test(path)) page = 'sorteo';

  var html = document.documentElement;
  var body = document.body;
  html.classList.add('lg-app');
  body.classList.add('lg-page-' + page);

  var vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
  else {
    vp = document.createElement('meta');
    vp.name = 'viewport';
    vp.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(vp);
  }

  var originalTitle = document.title;
  var DEFAULTS = { theme: 'auto', text: 'normal', motion: false, haptics: true, keepAwake: true, dataSaver: false };
  var settings = {};
  try {
    var saved = JSON.parse(localStorage.getItem('lg_mobile_settings') || '{}');
    for (var k in DEFAULTS) settings[k] = typeof saved[k] === typeof DEFAULTS[k] ? saved[k] : DEFAULTS[k];
  } catch (e) {
    for (var d in DEFAULTS) settings[d] = DEFAULTS[d];
  }

  // Tamaño de texto, animaciones y ahorro de datos viven en `gochi_ajustes`,
  // los mismos que usa la web: una sola preferencia por cosa. El resto (tema,
  // vibración, pantalla encendida) es propio del APK.
  function leerAjustesWeb() {
    try {
      var crudo = JSON.parse(localStorage.getItem('gochi_ajustes') || '{}');
      return crudo && typeof crudo === 'object' ? crudo : {};
    } catch (e) { return {}; }
  }

  function guardarAjustesWeb(cambios) {
    var datos = leerAjustesWeb();
    for (var c in cambios) datos[c] = cambios[c];
    try { localStorage.setItem('gochi_ajustes', JSON.stringify(datos)); } catch (e) {}
    var store = window.Alpine && window.Alpine.store ? window.Alpine.store('ajustes') : null;
    if (store) {
      for (var s in cambios) store.datos[s] = cambios[s];
      try { store.aplicar(); } catch (e2) {}
    }
    try { window.dispatchEvent(new CustomEvent('gochi:ajustes', { detail: datos })); } catch (e3) {}
  }

  function sincronizarAjustesWeb(clave) {
    if (clave === 'text') {
      guardarAjustesWeb({ texto: settings.text === 'xl' ? 125 : settings.text === 'large' ? 110 : 100 });
    } else if (clave === 'motion') {
      guardarAjustesWeb({ animaciones: !settings.motion });
    } else if (clave === 'dataSaver') {
      guardarAjustesWeb({ ahorro: !!settings.dataSaver });
    }
  }

  (function heredarAjustesWeb() {
    var compartidos = leerAjustesWeb();
    if (compartidos.texto === 90 || compartidos.texto === 100) settings.text = 'normal';
    else if (compartidos.texto === 110) settings.text = 'large';
    else if (compartidos.texto === 125) settings.text = 'xl';
    if (typeof compartidos.animaciones === 'boolean') settings.motion = !compartidos.animaciones;
    if (typeof compartidos.ahorro === 'boolean') settings.dataSaver = compartidos.ahorro;
  })();

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.7 12 3l9 7.7"/><path d="M5.4 9.4V21h13.2V9.4"/><path d="M9.5 21v-6.2h5V21"/></svg>',
    wall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 14.5a4 4 0 0 1-4 4H8l-5 2.5V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 12.5h5"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="3.2"/><path d="M17 11a3.2 3.2 0 1 0 0-6.4"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.87"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="m21 15-4.6-4.6L6 21"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2.5"/><path d="M12 8v13M3 12h18"/><path d="M12 8H7.5A2.5 2.5 0 1 1 10 5.5L12 8Zm0 0h4.5A2.5 2.5 0 1 0 14 5.5L12 8Z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.54 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.09A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.86-2.86.06.06A1.7 1.7 0 0 0 9 4.54a1.7 1.7 0 0 0 1.03-1.56V3h4v.09A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2 19.86 7l-.06.06A1.7 1.7 0 0 0 19.46 9c.2.63.77 1.03 1.56 1.03H21v4h-.09a1.7 1.7 0 0 0-1.51 1.03Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-4 2v-6.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8.5A7.5 7.5 0 0 1 19.4 12M4.6 12a7.5 7.5 0 0 0 13.3 3.5"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.9 1 .9 1.6v.5h5v-.5c0-.6.4-1.2.9-1.6A6 6 0 0 0 12 3Z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 15v2"/></svg>'
  };

  function icon(name) {
    return ICONS[name] || '';
  }

  function native(name) {
    var api = window.LaGochaNative;
    if (!api || typeof api[name] !== 'function') return undefined;
    try {
      return api[name].apply(api, Array.prototype.slice.call(arguments, 1));
    } catch (e) {
      return undefined;
    }
  }

  function haptic() {
    if (settings.haptics) native('vibrate', 8);
  }

  /* ---------- Acceso de administración: oculto salvo sesión admin ---------- */
  var adminToques = 0;
  var adminToquesTimer = 0;

  function esAdminSesion() {
    if (typeof window.esAdminActual !== 'function') return Promise.resolve(false);
    try {
      return Promise.resolve(window.esAdminActual()).then(function (ok) { return !!ok; }, function () { return false; });
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function actualizarFilaAdmin() {
    var fila = document.getElementById('lg-admin-row');
    if (!fila || !fila.hidden) return;
    esAdminSesion().then(function (ok) { if (ok) fila.hidden = false; });
  }

  function revelarFilaAdmin() {
    var fila = document.getElementById('lg-admin-row');
    if (!fila || !fila.hidden) return;
    fila.hidden = false;
    haptic();
    toast('Acceso de administración disponible');
  }

  function tocarFirmaCreador() {
    adminToques++;
    window.clearTimeout(adminToquesTimer);
    adminToquesTimer = window.setTimeout(function () { adminToques = 0; }, 2500);
    if (adminToques >= 5) {
      adminToques = 0;
      revelarFilaAdmin();
    }
  }

  function toast(message) {
    var el = document.getElementById('lg-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('lg-show');
    clearTimeout(el.__timer);
    el.__timer = setTimeout(function () { el.classList.remove('lg-show'); }, 2300);
  }

  body.insertAdjacentHTML('afterbegin',
    '<header id="lg-topbar">' +
      '<a class="lg-brand" href="./" aria-label="LaGochaGaming, inicio">' +
        '<img src="img/android-chrome-192x192.png" alt="">' +
        '<span class="lg-brand-text"><b>LAGOCHA</b><small>GAMING</small></span>' +
      '</a>' +
      '<div class="lg-top-actions">' +
        '<button class="lg-points" id="lg-points" type="button" hidden aria-label="Puntos de hoy">' +
          '<span class="lg-points-ring" aria-hidden="true"></span>' +
          '<span class="lg-points-texto"><b id="lg-points-hoy">0</b><span class="lg-points-sep">/</span><span id="lg-points-tope">60</span></span>' +
        '</button>' +
        '<a class="lg-kick-chip" id="lg-kick-chip" href="https://kick.com/lagochagaming" target="_blank" rel="noopener noreferrer"><i></i>KICK</a>' +
        '<button class="lg-top-btn" id="lg-open-settings" type="button" aria-label="Abrir ajustes">' + icon('settings') + '</button>' +
        '<button class="lg-top-btn" id="lg-open-profile" type="button" aria-label="Abrir mi cuenta">' + icon('user') + '</button>' +
      '</div>' +
      '<div id="lg-scroll-progress"></div>' +
    '</header>'
  );

  var NAV = [
    { id: 'inicio', label: 'Inicio', icon: 'home', href: './' },
    { id: 'muro', label: 'Muro', icon: 'wall', href: './#muro' },
    { id: 'comunidad', label: 'Comunidad', icon: 'users', href: 'comunidad.html' },
    { id: 'galeria', label: 'Galería', icon: 'image', href: 'galeria.html' },
    { id: 'cine', label: 'Cine', icon: 'film', href: 'cine.html' },
    { id: 'sorteo', label: 'Sorteo', icon: 'gift', href: 'sorteo.html' }
  ];

  var navHtml = '<nav id="lg-bottomnav" aria-label="Navegación principal">';
  for (var n = 0; n < NAV.length; n++) {
    navHtml += '<button type="button" class="lg-nav-item" data-lg-nav="' + NAV[n].id + '" aria-label="' + NAV[n].label + '">' + icon(NAV[n].icon) + '<span>' + NAV[n].label + '</span></button>';
  }
  navHtml += '</nav>';
  body.insertAdjacentHTML('beforeend', navHtml);
  var bottomNav = document.getElementById('lg-bottomnav');

  body.insertAdjacentHTML('beforeend',
    '<div id="lg-settings" class="lg-overlay" aria-hidden="true">' +
      '<div class="lg-scrim" data-close-settings></div>' +
      '<section class="lg-sheet" role="dialog" aria-modal="true" aria-label="Ajustes de la aplicación">' +
        '<div class="lg-sheet-handle"></div>' +
        '<div class="lg-sheet-head">' +
          '<div><small>PERSONALIZA</small><h2>Ajustes</h2></div>' +
          '<button type="button" class="lg-sheet-close" data-close-settings aria-label="Cerrar ajustes">' + icon('close') + '</button>' +
        '</div>' +
        '<div class="lg-sheet-scroll">' +
          '<div class="lg-settings-group"><h3>Apariencia</h3><div class="lg-card">' +
            '<div class="lg-row"><div class="lg-row-main"><div class="lg-row-title">Tema</div><div class="lg-row-sub">Auto, oscuro, claro u OLED</div></div><div class="lg-segment" data-segment="theme">' +
              '<button type="button" data-value="auto">Auto</button><button type="button" data-value="dark">Oscuro</button><button type="button" data-value="light">Claro</button><button type="button" data-value="oled">OLED</button>' +
            '</div></div>' +
            '<div class="lg-row"><div class="lg-row-main"><div class="lg-row-title">Tamaño de texto</div><div class="lg-row-sub">Lectura más cómoda</div></div><div class="lg-segment" data-segment="text">' +
              '<button type="button" data-value="normal">Normal</button><button type="button" data-value="large">Grande</button><button type="button" data-value="xl">XL</button>' +
            '</div></div>' +
          '</div></div>' +
          '<div class="lg-settings-group"><h3>Experiencia</h3><div class="lg-card">' +
            '<div class="lg-row"><div class="lg-row-main"><div class="lg-row-title">Vibración táctil</div><div class="lg-row-sub">Respuesta al tocar la navegación</div></div><button type="button" class="lg-switch" data-toggle="haptics" aria-label="Activar vibración"></button></div>' +
            '<div class="lg-row"><div class="lg-row-main"><div class="lg-row-title">Mantener pantalla encendida</div><div class="lg-row-sub">Evita que se apague en stream y cine</div></div><button type="button" class="lg-switch" data-toggle="keepAwake" aria-label="Mantener pantalla encendida"></button></div>' +
            '<div class="lg-row"><div class="lg-row-main"><div class="lg-row-title">Reducir animaciones</div><div class="lg-row-sub">Interfaz más rápida y sobria</div></div><button type="button" class="lg-switch" data-toggle="motion" aria-label="Reducir animaciones"></button></div>' +
            '<div class="lg-row"><div class="lg-row-main"><div class="lg-row-title">Ahorro de datos</div><div class="lg-row-sub">Oculta feeds sociales y chat incrustado</div></div><button type="button" class="lg-switch" data-toggle="dataSaver" aria-label="Ahorro de datos"></button></div>' +
          '</div></div>' +
          '<div class="lg-settings-group"><h3>Aplicación</h3><div class="lg-card">' +
            '<button type="button" class="lg-action-btn" data-action="share">' + icon('share') + 'Compartir LaGochaGaming</button>' +
            '<button type="button" class="lg-action-btn" data-action="account">' + icon('user') + 'Mi cuenta<small>Abrir perfil</small></button>' +
            '<button type="button" class="lg-action-btn" data-action="update">' + icon('refresh') + 'Buscar actualizaciones<small>Comprobar versión nueva</small></button>' +
            '<button type="button" class="lg-action-btn" data-action="reload">' + icon('refresh') + 'Recargar aplicación</button>' +
            '<a class="lg-action-btn" href="https://lagochagaming.com" target="_blank" rel="noopener noreferrer">' + icon('external') + 'Abrir versión web<small>Navegador</small></a>' +
          '</div></div>' +
          '<div class="lg-settings-group"><h3>Creador</h3><div class="lg-card">' +
            '<div class="lg-creator">' +
              '<img src="img/mcchary/creator.webp" alt="McChary, creador del sitio" width="46" height="42" loading="lazy" decoding="async">' +
              '<div class="lg-creator-info"><strong>Creado por <b>McChary</b></strong><span>Creator Engineer</span></div>' +
            '</div>' +
            '<button type="button" class="lg-action-btn" data-action="sugerencias">' + icon('bulb') + 'Sugerencias<small>Enviar una idea</small></button>' +
            '<button type="button" class="lg-action-btn" id="lg-admin-row" data-action="admin" hidden>' + icon('lock') + 'Acceso de administración<small>Solo creadores</small></button>' +
          '</div></div>' +
          '<div class="lg-about"><img src="img/android-chrome-192x192.png" alt=""><strong>LaGochaGaming</strong><span>App móvil · v1.13 · Hecha para la comunidad</span></div>' +
        '</div>' +
      '</section>' +
    '</div>' +
    '<div id="lg-account" class="lg-overlay" aria-hidden="true">' +
      '<div class="lg-scrim" data-close-account></div>' +
      '<section class="lg-sheet" role="dialog" aria-modal="true" aria-label="Mi cuenta">' +
        '<div class="lg-sheet-handle"></div>' +
        '<div class="lg-sheet-head"><div><small>COMUNIDAD</small><h2>Mi cuenta</h2></div><button type="button" class="lg-sheet-close" data-close-account aria-label="Cerrar mi cuenta">' + icon('close') + '</button></div>' +
        '<div class="lg-sheet-scroll" id="lg-account-body"></div>' +
      '</section>' +
    '</div>' +
    '<div id="lg-nav-loading" aria-hidden="true"><div class="lg-nav-spinner"></div><span>CARGANDO</span></div>' +
    '<div id="lg-toast" role="status" aria-live="polite"></div>' +
    '<div id="lg-offline"><i></i>Sin conexión. Revisa tu red e intenta de nuevo.</div>'
  );

  var settingsOverlay = document.getElementById('lg-settings');
  var offlineBar = document.getElementById('lg-offline');
  var topbar = document.getElementById('lg-topbar');
  var progress = document.getElementById('lg-scroll-progress');
  var accountOverlay = document.getElementById('lg-account');
  var accountBody = document.getElementById('lg-account-body');
  var navLoading = document.getElementById('lg-nav-loading');
  var accountMode = 'login';
  var accountBusy = false;
  var accountPoll = null;
  var accountDraft = { apodo: '', pin: '', genero: '' };

  var chatSource = null;
  var chatOverlay = null;
  var chatFab = null;

  if (page === 'home' || page === 'cine') {
    chatSource = document.querySelector('#stream .chat-sidebar') || document.querySelector('.chat-box-cine');
    if (chatSource) {
      body.insertAdjacentHTML('beforeend',
        '<div id="lg-chat-sheet" class="lg-overlay" aria-hidden="true">' +
          '<div class="lg-scrim" data-close-chat></div>' +
          '<section class="lg-sheet" role="dialog" aria-modal="true" aria-label="Chat en vivo">' +
            '<div class="lg-sheet-handle"></div>' +
            '<div class="lg-sheet-head"><div><small>EN VIVO</small><h2>Chat</h2></div><button type="button" class="lg-sheet-close" data-close-chat aria-label="Cerrar chat">' + icon('close') + '</button></div>' +
            '<div class="lg-sheet-scroll"><div id="lg-chat-body"></div></div>' +
          '</section>' +
        '</div>'
      );
      chatOverlay = document.getElementById('lg-chat-sheet');
      document.getElementById('lg-chat-body').appendChild(chatSource);
      var fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'lg-chat-fab';
      fab.id = 'lg-chat-fab';
      fab.setAttribute('aria-expanded', 'false');
      fab.setAttribute('aria-controls', 'lg-chat-sheet');
      fab.innerHTML = icon('chat') + '<i></i><span>' + (page === 'cine' ? 'Chat de la sala' : 'Chat en vivo') + '</span>';
      body.appendChild(fab);
      chatFab = fab;
    }
  }

  function closeAllOverlays() {
    if (settingsOverlay) {
      settingsOverlay.classList.remove('lg-open');
      settingsOverlay.setAttribute('aria-hidden', 'true');
    }
    if (chatOverlay) {
      chatOverlay.classList.remove('lg-open');
      chatOverlay.setAttribute('aria-hidden', 'true');
    }
    if (accountOverlay) {
      accountOverlay.classList.remove('lg-open');
      accountOverlay.setAttribute('aria-hidden', 'true');
    }
    clearInterval(accountPoll);
    body.classList.remove('lg-sheet-open');
    body.classList.remove('lg-chat-open');
    if (chatFab) {
      chatFab.setAttribute('aria-expanded', 'false');
      chatFab.innerHTML = icon('chat') + '<i></i><span>' + (page === 'cine' ? 'Chat de la sala' : 'Chat en vivo') + '</span>';
    }
    native('setPullRefresh', true);
  }

  function openOverlay(el) {
    if (!el) return;
    closeAllOverlays();
    el.classList.add('lg-open');
    el.setAttribute('aria-hidden', 'false');
    body.classList.add('lg-sheet-open');
    native('setPullRefresh', false);
    haptic();
  }

  function openSettings() {
    openOverlay(settingsOverlay);
    syncSettingsUI();
    actualizarFilaAdmin();
  }

  function closeSettings() {
    closeAllOverlays();
  }

  function loadChatIframe() {
    if (!chatSource) return;
    var facade = chatSource.querySelector('.chat-facade');
    if (facade) facade.remove();
    var iframe = chatSource.querySelector('iframe');
    if (iframe) {
      var src = iframe.getAttribute('data-src');
      if (src && !iframe.getAttribute('src')) iframe.setAttribute('src', src);
      if (src && iframe.getAttribute('src') === 'about:blank') iframe.setAttribute('src', src);
    }
    if (typeof window.prepararFachadaChat === 'function') {
      try { window.prepararFachadaChat(); } catch (e) {}
    }
    if (iframe && src && !iframe.getAttribute('src')) iframe.setAttribute('src', src);
  }

  function openChat() {
    if (!chatOverlay) return;
    if (settings.dataSaver) {
      toast('Desactiva el ahorro de datos para usar el chat');
      return;
    }
    loadChatIframe();
    openOverlay(chatOverlay);
    body.classList.add('lg-chat-open');
    if (chatFab) {
      chatFab.classList.add('lg-show');
      chatFab.setAttribute('aria-expanded', 'true');
      chatFab.innerHTML = icon('close') + '<span>Ocultar chat</span>';
    }
    var directo = document.getElementById('stream') || document.querySelector('.video-container');
    if (directo) {
      // Deja el directo entero por encima de la hoja: la hoja mide 56vh.
      window.setTimeout(function () {
        var hoja = chatOverlay.querySelector('.lg-sheet');
        var altoHoja = hoja ? hoja.getBoundingClientRect().height : 0;
        if (!altoHoja) return;
        var limite = window.innerHeight - altoHoja - 10;
        var caja = directo.getBoundingClientRect();
        if (caja.bottom > limite) {
          window.scrollTo({
            top: Math.max(0, window.pageYOffset + (caja.bottom - limite) + 12),
            behavior: scrollSuave()
          });
        } else if (caja.top < 56) {
          window.scrollTo({ top: Math.max(0, window.pageYOffset + caja.top - 62), behavior: scrollSuave() });
        }
      }, 340);
    }
  }

  function chatAbierto() {
    return !!(chatOverlay && chatOverlay.classList.contains('lg-open'));
  }

  function scrollSuave() {
    var reducir = !!settings.motion ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return reducir ? 'auto' : 'smooth';
  }

  function cerrarChat() {
    if (!chatAbierto()) return;
    closeAllOverlays();
    haptic();
  }

  function alternarChat() {
    if (chatAbierto()) cerrarChat();
    else openChat();
  }

  /* ---------- Cuenta de comunidad ---------- */
  var SESSION = {
    nick: 'comunidad_nickname',
    token: 'comunidad_session_token',
    uid: 'comunidad_user_id',
    user: 'comunidad_session_usuario'
  };

  function readStoredUser() {
    var user = {};
    try {
      var raw = localStorage.getItem(SESSION.user);
      if (raw) user = JSON.parse(raw) || {};
    } catch (e) {}
    if (!user || typeof user !== 'object') user = {};
    if (!user.apodo) user.apodo = localStorage.getItem(SESSION.nick) || '';
    return user;
  }

  function isLoggedIn() {
    return !!localStorage.getItem(SESSION.token) && !!localStorage.getItem(SESSION.nick);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function rankData(user) {
    try {
      if (typeof window.datosRangoComunidad === 'function') {
        return window.datosRangoComunidad(user.rango, user.puntos);
      }
    } catch (e) {}
    return null;
  }

  function avatarMarkup(user) {
    var src = '';
    try {
      if (typeof window.avatarUsuarioComunidad === 'function') src = window.avatarUsuarioComunidad(user) || '';
    } catch (e) {}
    if (!src) src = user.avatar_url || user.avatar || user.icono || '';
    if (src) return '<img src="' + esc(src) + '" alt="" loading="lazy">';
    var initial = String(user.apodo || '?').trim().charAt(0).toUpperCase();
    return esc(initial || '?');
  }

  function syncTopbarAccount() {
    var button = document.getElementById('lg-open-profile');
    if (button) button.classList.toggle('lg-logged', isLoggedIn());
  }

  function syncTopbarMeta() {
    var pill = document.getElementById('lg-points');
    var value = document.getElementById('nav-puntos-hoy');
    var navPuntos = document.getElementById('nav-puntos-dia');
    if (pill && value && isLoggedIn() && navPuntos && !navPuntos.hidden) {
      var points = (value.textContent || '').trim();
      var max = document.getElementById('nav-puntos-tope');
      var topTexto = max ? (max.textContent || '').trim() : '60';
      var tope = Number(topTexto) || 60;
      if (points) {
        var hoy = Number(points) || 0;
        var previo = Number(pill.dataset.hoy);
        var antes = isNaN(previo) ? -1 : previo;
        pill.hidden = false;
        var label = document.getElementById('lg-points-hoy');
        if (label) label.textContent = points;
        var maxLabel = document.getElementById('lg-points-tope');
        if (maxLabel) maxLabel.textContent = String(tope);
        pill.style.setProperty('--p', Math.min(100, Math.round((hoy / tope) * 100)) + '%');
        pill.classList.toggle('lg-points--completo', hoy >= tope);
        pill.dataset.hoy = String(hoy);
        if (antes >= 0 && hoy > antes) {
          pill.classList.remove('lg-points--suma');
          void pill.offsetWidth;
          pill.classList.add('lg-points--suma');
          setTimeout(function () { pill.classList.remove('lg-points--suma'); }, 700);
        }
        if (antes >= 0 && hoy >= tope && antes < tope) {
          pill.classList.remove('lg-points--remate');
          void pill.offsetWidth;
          pill.classList.add('lg-points--remate');
          setTimeout(function () { pill.classList.remove('lg-points--remate'); }, 1000);
        }
        pill.setAttribute('aria-label', 'Puntos de hoy: ' + hoy + ' de ' + tope);
      } else {
        pill.hidden = true;
      }
    }
    var chip = document.getElementById('lg-kick-chip');
    var live = document.getElementById('nav-live-tag');
    if (chip && live) chip.classList.toggle('lg-live', !live.hidden);
  }

  function authFormMarkup() {
    var login = accountMode !== 'registro';
    return '' +
      '<div class="lg-account-hero">' +
        '<div class="lg-account-avatar" aria-hidden="true">' + (login ? '👋' : '✨') + '</div>' +
        '<div><h3>' + (login ? 'Bienvenido de vuelta' : 'Únete a la comunidad') + '</h3>' +
        '<p>' + (login ? 'Entra con tu apodo y PIN para chatear, saludar y participar.' : 'Crea tu cuenta en segundos. Solo necesitas un apodo y un PIN.') + '</p></div>' +
      '</div>' +
      '<div class="lg-auth-tabs" role="tablist">' +
        '<button type="button" role="tab" data-auth-mode="login" class="' + (login ? 'lg-on' : '') + '" aria-selected="' + login + '">Iniciar sesión</button>' +
        '<button type="button" role="tab" data-auth-mode="registro" class="' + (!login ? 'lg-on' : '') + '" aria-selected="' + (!login) + '">Registrarme</button>' +
      '</div>' +
      '<form id="lg-auth-form" novalidate>' +
        '<label class="lg-field"><span>Apodo</span>' +
          '<input type="text" name="apodo" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Tu apodo" value="' + esc(accountDraft.apodo) + '">' +
        '</label>' +
        '<label class="lg-field"><span>PIN de 4 dígitos</span>' +
          '<input type="password" name="pin" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="' + (login ? 'current-password' : 'new-password') + '" placeholder="••••" value="' + esc(accountDraft.pin) + '">' +
        '</label>' +
        '<div class="lg-gender" role="radiogroup" aria-label="Género para tu avatar"' + (login ? ' hidden' : '') + '>' +
          '<label data-gender="femenino"' + (accountDraft.genero === 'femenino' ? ' class="lg-on"' : '') + '><input type="radio" name="genero" value="femenino"' + (accountDraft.genero === 'femenino' ? ' checked' : '') + '> Femenino</label>' +
          '<label data-gender="masculino"' + (accountDraft.genero === 'masculino' ? ' class="lg-on"' : '') + '><input type="radio" name="genero" value="masculino"' + (accountDraft.genero === 'masculino' ? ' checked' : '') + '> Masculino</label>' +
        '</div>' +
        '<div class="lg-auth-error" id="lg-auth-error" role="alert"></div>' +
        '<button class="lg-auth-submit" type="submit">' + (login ? 'Entrar' : 'Crear mi cuenta') + '</button>' +
      '</form>' +
      '<div class="lg-auth-sep"><span>o</span></div>' +
      '<button type="button" class="lg-auth-kick" data-account-action="kick"><b>K</b> Conectar con Kick<small>Entra o vincula tu cuenta en un clic</small></button>' +
      '<p class="lg-auth-note">' + (login
        ? '¿Aún no tienes cuenta? Toca <strong>Registrarme</strong> arriba.'
        : 'Tu apodo y PIN te identifican en el chat, el muro y la galería.') + '</p>';
  }

  function profileMarkup() {
    var user = readStoredUser();
    var rank = rankData(user);
    var rankName = rank && rank.nombre ? String(rank.nombre) : '';
    var rankEmoji = rank && rank.emoji ? String(rank.emoji) : '';
    var points = Number(user.puntos || 0);
    return '' +
      '<div class="lg-account-hero">' +
        '<div class="lg-account-avatar">' + avatarMarkup(user) + '</div>' +
        '<div><h3>' + esc(user.apodo || 'Miembro') + '</h3>' +
          (rankName
            ? '<span class="lg-profile-rank">' + esc(rankEmoji + ' ' + rankName) + '</span>'
            : '<p>Miembro de la comunidad</p>') +
        '</div>' +
      '</div>' +
      '<div class="lg-profile-stats">' +
        '<div class="lg-stat"><b>' + esc(points) + '</b><span>Puntos</span></div>' +
        '<div class="lg-stat"><b>' + esc(rankName || 'Miembro') + '</b><span>Rango</span></div>' +
      '</div>' +
      '<button type="button" class="lg-auth-submit" data-account-action="open-profile">Ver mi perfil completo</button>' +
      '<button type="button" class="lg-logout" data-account-action="logout">Cerrar sesión</button>' +
      '<p class="lg-auth-note">Tu sesión se guarda en este dispositivo.</p>';
  }

  function renderAccount() {
    if (!accountBody) return;
    accountBody.innerHTML = isLoggedIn() ? profileMarkup() : authFormMarkup();
    syncTopbarAccount();
  }

  function authError(message) {
    var box = document.getElementById('lg-auth-error');
    if (!box) {
      toast(message);
      return;
    }
    box.textContent = message;
    box.classList.add('lg-show');
  }

  function clearAuthError() {
    var box = document.getElementById('lg-auth-error');
    if (box) {
      box.textContent = '';
      box.classList.remove('lg-show');
    }
  }

  function authBusy(busy) {
    accountBusy = busy;
    var button = accountBody ? accountBody.querySelector('.lg-auth-submit') : null;
    if (!button) return;
    button.disabled = busy;
    if (busy) button.textContent = 'Conectando…';
    else button.textContent = accountMode === 'registro' ? 'Crear mi cuenta' : 'Entrar';
  }

  function storeSession(token, user, apodo) {
    try {
      localStorage.setItem(SESSION.nick, apodo);
      localStorage.setItem(SESSION.token, token || '');
      if (user && user.id != null) localStorage.setItem(SESSION.uid, String(user.id));
      localStorage.setItem(SESSION.user, JSON.stringify(user || { apodo: apodo }));
      localStorage.removeItem('comunidad_logout_explicito');
    } catch (e) {}
    try {
      if (typeof window.actualizarSesionUsuarioComunidad === 'function') window.actualizarSesionUsuarioComunidad(user || { apodo: apodo });
    } catch (e) {}
    try {
      if (typeof window.actualizarUsuarioNavComunidad === 'function') window.actualizarUsuarioNavComunidad();
    } catch (e) {}
    try {
      if (typeof window.latidoComunidad === 'function') window.latidoComunidad();
    } catch (e) {}
  }

  function waitForSupabase() {
    return new Promise(function (resolve, reject) {
      var tries = 0;
      (function check() {
        if (window.supabase && typeof window.supabase.rpc === 'function') {
          resolve(window.supabase);
          return;
        }
        if (tries++ >= 40) {
          reject(new Error('No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.'));
          return;
        }
        setTimeout(check, 150);
      })();
    });
  }

  function rpcLogin(apodo, pin, genero) {
    return waitForSupabase().then(function () {
      var call = accountMode === 'registro'
        ? window.rpcRaw('registrar_comunidad', { p_apodo: apodo, p_pin: pin, p_genero: genero })
        : window.rpcRaw('login_comunidad', { p_apodo: apodo, p_pin: pin });
      return call.then(function (result) {
        if (result && result.error) throw new Error(result.error.message || 'No se pudo completar la operación.');
        var data = result && result.data;
        if (Array.isArray(data)) data = data[0];
        if (!data) throw new Error('Respuesta inválida del servidor.');
        if (data.ok === false || data.error) {
          var messages = {
            credenciales: 'Apodo o PIN incorrectos. Revísalos e inténtalo otra vez.',
            apodo_duplicado: 'Ese apodo ya existe. Prueba con otro o inicia sesión.',
            apodo_invalido: 'Apodo inválido: usa entre 1 y 20 letras, números, espacios, guion o guion bajo.',
            pin_invalido: 'El PIN debe tener exactamente 4 dígitos.',
            rate_limited: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
            baneado: 'Tu cuenta está suspendida temporalmente.'
          };
          throw new Error(messages[data.error] || 'No se pudo completar la operación.');
        }
        if (!data.token) throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo.');
        var user = data.usuario || { apodo: apodo };
        if (!user.apodo) user.apodo = apodo;
        storeSession(data.token, user, user.apodo);
      });
    });
  }

  function loginThroughSite(apodo, pin, genero) {
    return new Promise(function (resolve, reject) {
      var open = window.abrirModalComunidad;
      if (typeof open !== 'function') {
        reject(new Error('La comunidad todavía está cargando. Espera un momento e inténtalo de nuevo.'));
        return;
      }
      try { open(accountMode === 'registro' ? 'registro' : 'login'); } catch (e) {}

      var form = document.getElementById('form-nickname');
      var nickInput = document.getElementById('nickname-modal-input');
      var pinInput = document.getElementById('nickname-modal-pin');
      if (!form || !nickInput || !pinInput) {
        reject(new Error('La comunidad todavía está cargando. Espera un momento e inténtalo de nuevo.'));
        return;
      }

      nickInput.value = apodo;
      pinInput.value = pin;
      nickInput.dispatchEvent(new Event('input', { bubbles: true }));
      pinInput.dispatchEvent(new Event('input', { bubbles: true }));

      if (accountMode === 'registro' && genero) {
        var radio = document.querySelector('#nickname-modal-genero input[value="' + genero + '"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      var errorBox = document.getElementById('nickname-modal-error');
      if (errorBox) {
        errorBox.textContent = '';
        errorBox.style.display = 'none';
      }

      if (typeof window.desactivarTrampaFoco === 'function') {
        try { window.desactivarTrampaFoco(true); } catch (e) {}
      }

      var before = localStorage.getItem(SESSION.token) || '';
      var started = Date.now();
      var settled = false;
      clearInterval(accountPoll);
      accountPoll = setInterval(function () {
        if (settled) return;
        var token = localStorage.getItem(SESSION.token) || '';
        if (token && token !== before) {
          settled = true;
          clearInterval(accountPoll);
          resolve();
          return;
        }
        if (errorBox && errorBox.style.display === 'block' && (errorBox.textContent || '').trim()) {
          settled = true;
          clearInterval(accountPoll);
          reject(new Error((errorBox.textContent || '').trim()));
          return;
        }
        if (Date.now() - started > 25000) {
          settled = true;
          clearInterval(accountPoll);
          reject(new Error('La operación tardó demasiado. Revisa tu conexión e inténtalo de nuevo.'));
        }
      }, 140);

      try {
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } catch (e) {
        settled = true;
        clearInterval(accountPoll);
        reject(new Error('No se pudo enviar el formulario. Inténtalo de nuevo.'));
      }
    });
  }

  function submitAccount() {
    if (accountBusy || !accountBody) return;
    var nickInput = accountBody.querySelector('input[name="apodo"]');
    var pinInput = accountBody.querySelector('input[name="pin"]');
    var genderInput = accountBody.querySelector('input[name="genero"]:checked');
    var apodo = nickInput ? nickInput.value.trim() : '';
    var pin = pinInput ? pinInput.value.trim() : '';
    var genero = genderInput ? genderInput.value : '';

    accountDraft.apodo = apodo;
    accountDraft.pin = pin;
    accountDraft.genero = genero;

    clearAuthError();
    if (!apodo) {
      authError('Escribe tu apodo.');
      if (nickInput) nickInput.focus();
      return;
    }
    if (apodo.length > 20) {
      authError('El apodo no puede tener más de 20 caracteres.');
      if (nickInput) nickInput.focus();
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      authError('El PIN debe tener exactamente 4 dígitos.');
      if (pinInput) pinInput.focus();
      return;
    }
    if (accountMode === 'registro' && !genero) {
      authError('Elige un género para crear tu avatar.');
      return;
    }

    authBusy(true);
    var task;
    if (page === 'comunidad' && typeof window.abrirModalComunidad === 'function') {
      task = loginThroughSite(apodo, pin, genero).then(function () {
        if (!isLoggedIn()) throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo.');
      });
    } else {
      task = rpcLogin(apodo, pin, genero);
    }

    task.then(function () {
      authBusy(false);
      accountDraft = { apodo: '', pin: '', genero: '' };
      accountMode = 'login';
      renderAccount();
      haptic();
      var user = readStoredUser();
      toast('¡Listo, ' + (user.apodo || apodo) + '!');
    }).catch(function (error) {
      authBusy(false);
      authError((error && error.message) || 'No se pudo completar la operación. Inténtalo de nuevo.');
    });
  }

  function loginWithKick() {
    var kick = window.KICK_COMUNIDAD;
    if (kick && typeof kick.abrirOAuth === 'function') {
      closeAllOverlays();
      toast('Continúa en Kick para entrar');
      try {
        kick.abrirOAuth('entrar');
      } catch (e) {
        toast('No se pudo abrir el login de Kick.');
      }
      return;
    }
    if (typeof window.abrirLoginMenu === 'function') {
      closeAllOverlays();
      window.abrirLoginMenu('kick');
      return;
    }
    toast('El acceso con Kick no está disponible ahora.');
  }

  function logoutAccount() {
    if (page === 'comunidad' && typeof window.cerrarSesion === 'function') {
      closeAllOverlays();
      try { window.cerrarSesion(); } catch (e) {}
      return;
    }
    var token = localStorage.getItem(SESSION.token) || '';
    var conservarKick = typeof window.kickRecordarSesion === 'function'
      && window.kickRecordarSesion()
      && !!localStorage.getItem('gocha_kick_token');
    try {
      if (typeof window.cerrarSesionKick === 'function') window.cerrarSesionKick({ conservarToken: conservarKick });
    } catch (e) {}
    if (conservarKick) {
      try { localStorage.setItem('gocha_kick_recordar_hasta', String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch (e) {}
    } else {
      try { localStorage.removeItem('gocha_kick_token'); } catch (e) {}
      try { localStorage.removeItem('gocha_kick_recordar_hasta'); } catch (e) {}
    }
    if (token && typeof window.rpcRaw === 'function') {
      try { window.rpcRaw('cerrar_sesion_comunidad', { p_token: token }); } catch (e) {}
    }
    try {
      localStorage.removeItem(SESSION.nick);
      localStorage.removeItem(SESSION.token);
      localStorage.removeItem(SESSION.uid);
      localStorage.removeItem(SESSION.user);
      localStorage.setItem('comunidad_logout_explicito', '1');
    } catch (e) {}
    try {
      if (typeof window.limpiarCachesSesionComunidad === 'function') window.limpiarCachesSesionComunidad();
    } catch (e) {}
    try {
      if (typeof window.actualizarUsuarioNavComunidad === 'function') window.actualizarUsuarioNavComunidad();
    } catch (e) {}
    accountDraft = { apodo: '', pin: '', genero: '' };
    accountMode = 'login';
    renderAccount();
    toast('Sesión cerrada');
    haptic();
  }

  function openAccount(mode) {
    if (mode === 'registro') accountMode = 'registro';
    else if (!isLoggedIn()) accountMode = 'login';
    accountDraft = { apodo: '', pin: '', genero: '' };
    renderAccount();
    openOverlay(accountOverlay);
    syncTopbarAccount();
    if (!isLoggedIn()) {
      setTimeout(function () {
        var input = accountBody ? accountBody.querySelector('input[name="apodo"]') : null;
        if (input && accountOverlay.classList.contains('lg-open')) input.focus();
      }, 280);
    }
  }

  function openProfile() {
    openAccount(isLoggedIn() ? 'profile' : 'login');
  }

  window.lgOpenAccount = function (mode) {
    openAccount(mode || (isLoggedIn() ? 'profile' : 'login'));
  };

  function openFullProfile() {
    closeAllOverlays();
    if (page === 'comunidad') {
      var button = document.querySelector('#nav-user-info .nav-user-btn') || document.querySelector('#nav-user-info button');
      if (button) {
        setTimeout(function () { button.click(); }, 220);
        return;
      }
    }
    location.href = './comunidad.html';
  }

  if (accountBody) {
    accountBody.addEventListener('click', function (event) {
      var tab = event.target.closest('[data-auth-mode]');
      if (tab) {
        accountMode = tab.getAttribute('data-auth-mode') === 'registro' ? 'registro' : 'login';
        clearInterval(accountPoll);
        accountDraft = { apodo: '', pin: '', genero: '' };
        renderAccount();
        haptic();
        return;
      }
      var gender = event.target.closest('[data-gender]');
      if (gender) {
        accountDraft.genero = gender.getAttribute('data-gender');
        var labels = accountBody.querySelectorAll('[data-gender]');
        for (var i = 0; i < labels.length; i++) {
          labels[i].classList.toggle('lg-on', labels[i] === gender);
        }
        haptic();
        return;
      }
      var action = event.target.closest('[data-account-action]');
      if (action) {
        var name = action.getAttribute('data-account-action');
        if (name === 'logout') logoutAccount();
        else if (name === 'open-profile') openFullProfile();
        else if (name === 'kick') loginWithKick();
      }
    });

    accountBody.addEventListener('submit', function (event) {
      if (event.target && event.target.id === 'lg-auth-form') {
        event.preventDefault();
        submitAccount();
      }
    });
  }

  if (accountOverlay) {
    accountOverlay.addEventListener('click', function (event) {
      if (event.target.closest('[data-close-account]')) closeAllOverlays();
    });
  }

  function saveSettings() {
    try { localStorage.setItem('lg_mobile_settings', JSON.stringify(settings)); } catch (e) {}
  }

  function resolvedTheme() {
    if (settings.theme === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme;
  }

  function applyTheme() {
    var theme = resolvedTheme();
    html.classList.toggle('lg-theme-light', theme === 'light');
    html.classList.toggle('lg-theme-oled', theme === 'oled');
    body.classList.remove('light-mode', 'oled-mode');
    if (theme === 'light') body.classList.add('light-mode');
    else if (theme === 'oled') body.classList.add('oled-mode');
    try { localStorage.setItem('gochi_tema', theme); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#eef1f7' : '#05070a');
    native('setTheme', theme);
  }

  function applyText() {
    var valor = settings.text === 'xl' ? 125 : settings.text === 'large' ? 110 : 100;
    html.classList.remove('texto-90', 'texto-110', 'texto-125', 'lg-text-lg', 'lg-text-xl');
    if (valor !== 100) html.classList.add('texto-' + valor);
  }

  function applyMotion() {
    html.classList.toggle('lg-reduce-motion', !!settings.motion);
    html.classList.toggle('sin-animaciones', !!settings.motion);
  }

  function applyDataSaver() {
    html.classList.toggle('lg-data-saver', !!settings.dataSaver);
    html.classList.toggle('ahorro-datos', !!settings.dataSaver);
    if (settings.dataSaver && chatOverlay && chatOverlay.classList.contains('lg-open')) closeAllOverlays();
  }

  function applyKeepAwake() {
    var active = !!settings.keepAwake && (page === 'home' || page === 'cine');
    native('keepAwake', active);
    if (chatFab) chatFab.classList.toggle('lg-show', !settings.dataSaver);
  }

  function applyAll() {
    applyTheme();
    applyText();
    applyMotion();
    applyDataSaver();
    applyKeepAwake();
  }

  function syncSettingsUI() {
    var segments = settingsOverlay.querySelectorAll('[data-segment]');
    for (var i = 0; i < segments.length; i++) {
      var name = segments[i].getAttribute('data-segment');
      var buttons = segments[i].querySelectorAll('button');
      for (var b = 0; b < buttons.length; b++) {
        buttons[b].classList.toggle('lg-on', settings[name] === buttons[b].getAttribute('data-value'));
      }
    }
    var toggles = settingsOverlay.querySelectorAll('[data-toggle]');
    for (var t = 0; t < toggles.length; t++) {
      toggles[t].classList.toggle('lg-on', !!settings[toggles[t].getAttribute('data-toggle')]);
    }
  }

  function updateNav() {
    var active = page === 'home' ? (body.classList.contains('lg-tab-muro') ? 'muro' : 'inicio') : page;
    var items = bottomNav.querySelectorAll('[data-lg-nav]');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('lg-active', items[i].getAttribute('data-lg-nav') === active);
    }
  }

  function setHomeTab(tab, push) {
    if (page !== 'home') return;
    var isMuro = tab === 'muro';
    body.classList.toggle('lg-tab-muro', isMuro);
    body.classList.toggle('lg-tab-home', !isMuro);
    document.title = isMuro ? 'Muro | LaGochaGaming' : originalTitle;
    updateNav();
    window.scrollTo(0, 0);
    if (push !== false) {
      try {
        var url = location.pathname + location.search + (isMuro ? '#muro' : '');
        history.replaceState(null, '', url);
      } catch (e) {}
    }
    haptic();
  }

  function activeNavId() {
    if (page === 'home') return body.classList.contains('lg-tab-muro') ? 'muro' : 'inicio';
    return page;
  }

  function navIndex(id) {
    for (var i = 0; i < NAV.length; i++) if (NAV[i].id === id) return i;
    return -1;
  }

  function navDirection(id) {
    var from = navIndex(activeNavId());
    var to = navIndex(id);
    if (from < 0 || to < 0 || to === from) return '';
    return to > from ? 'next' : 'prev';
  }

  function showNavLoading(direction) {
    if (!navLoading) return;
    navLoading.classList.remove('lg-dir-next', 'lg-dir-prev');
    if (direction === 'next' || direction === 'prev') navLoading.classList.add('lg-dir-' + direction);
    navLoading.classList.add('lg-show');
    navLoading.setAttribute('aria-hidden', 'false');
  }

  function goNav(id, direction) {
    var item = null;
    for (var i = 0; i < NAV.length; i++) if (NAV[i].id === id) item = NAV[i];
    if (!item) return;
    haptic();
    if (id === 'inicio' && page === 'home') { setHomeTab('home'); return; }
    if (id === 'muro' && page === 'home') { setHomeTab('muro'); return; }
    if (page === id) {
      window.scrollTo({ top: 0, behavior: settings.motion ? 'auto' : 'smooth' });
      return;
    }
    showNavLoading(direction || navDirection(id));
    location.href = id === 'inicio' ? './' : id === 'muro' ? './#muro' : item.href;
  }

  function shareApp() {
    var title = 'LaGochaGaming';
    var text = 'Mira LaGochaGaming: stream, comunidad, galería, cine y sorteos.';
    var url = 'https://lagochagaming.com';
    haptic();
    if (window.LaGochaNative && typeof window.LaGochaNative.share === 'function') {
      native('share', title, text, url);
      return;
    }
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast('Enlace copiado'); }).catch(function () {});
    }
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return false;
    if (!lb.classList.contains('abierta')) return false;
    if (typeof window.cerrarLightbox === 'function') window.cerrarLightbox();
    else {
      var close = lb.querySelector('.lightbox-close-fixed');
      if (close) close.click();
    }
    return true;
  }

  function closeMediaModal() {
    var modal = document.getElementById('media-modal');
    if (!modal || modal.hidden) return false;
    var close = modal.querySelector('.media-modal-cerrar');
    if (close) close.click();
    else modal.hidden = true;
    return true;
  }

  window.__lagochaBack = function () {
    if (accountOverlay && accountOverlay.classList.contains('lg-open')) {
      closeAllOverlays();
      return true;
    }
    if (settingsOverlay && settingsOverlay.classList.contains('lg-open')) {
      closeSettings();
      return true;
    }
    if (chatOverlay && chatOverlay.classList.contains('lg-open')) {
      closeAllOverlays();
      return true;
    }
    if (closeLightbox()) return true;
    if (closeMediaModal()) return true;
    if (page === 'home' && body.classList.contains('lg-tab-muro')) {
      setHomeTab('home');
      return true;
    }
    return false;
  };

  topbar.addEventListener('click', function (event) {
    if (event.target.closest('#lg-open-settings')) {
      openSettings();
      return;
    }
    if (event.target.closest('#lg-points')) {
      openProfile();
      return;
    }
    if (event.target.closest('#lg-open-profile')) {
      openProfile();
    }
  });

  bottomNav.addEventListener('click', function (event) {
    var button = event.target.closest('[data-lg-nav]');
    if (button) goNav(button.getAttribute('data-lg-nav'));
  });

  var swipeState = null;
  var swallowClickUntil = 0;

  function isHorizontalScroller(node) {
    for (var depth = 0; depth < 6 && node && node !== body; depth++, node = node.parentElement) {
      var style = window.getComputedStyle(node);
      if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && node.scrollWidth > node.clientWidth + 8) {
        return true;
      }
    }
    return false;
  }

  function swipeBlocked(target) {
    if (!target || !target.closest) return true;
    if (body.classList.contains('lg-sheet-open')) return true;
    if (target.closest('input, textarea, select, [contenteditable="true"], iframe, video, audio, .lg-sheet, #lightbox, #media-modal, .chat-sidebar, [data-no-swipe]')) return true;
    return isHorizontalScroller(target);
  }

  document.addEventListener('touchstart', function (event) {
    swipeState = null;
    if (event.touches.length !== 1 || swipeBlocked(event.target)) return;
    swipeState = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      time: Date.now()
    };
  }, { passive: true });

  document.addEventListener('touchend', function (event) {
    var start = swipeState;
    swipeState = null;
    if (!start || !event.changedTouches.length) return;
    var touch = event.changedTouches[0];
    var dx = touch.clientX - start.x;
    var dy = touch.clientY - start.y;
    if (Date.now() - start.time > 800) return;
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    var index = navIndex(activeNavId());
    if (index < 0) return;
    var next = dx < 0 ? index + 1 : index - 1;
    if (next < 0 || next >= NAV.length) return;
    swallowClickUntil = Date.now() + 450;
    haptic();
    goNav(NAV[next].id, dx < 0 ? 'next' : 'prev');
  }, { passive: true });

  document.addEventListener('click', function (event) {
    if (Date.now() >= swallowClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener('click', function (event) {
    if (isLoggedIn()) return;
    var trigger = event.target.closest('#btn-login-chat, #btn-registro-chat');
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    openAccount(trigger.id === 'btn-registro-chat' ? 'registro' : 'login');
  }, true);

  window.addEventListener('pageshow', function () {
    if (navLoading) {
      navLoading.classList.remove('lg-show');
      navLoading.setAttribute('aria-hidden', 'true');
    }
  });

  if (chatFab) chatFab.addEventListener('click', alternarChat);

  settingsOverlay.addEventListener('click', function (event) {
    if (event.target.closest('[data-close-settings]')) {
      closeSettings();
      return;
    }
    if (event.target.closest('.lg-creator')) {
      tocarFirmaCreador();
      return;
    }
    var segmentButton = event.target.closest('.lg-segment button');
    if (segmentButton) {
      var segment = segmentButton.parentElement.getAttribute('data-segment');
      settings[segment] = segmentButton.getAttribute('data-value');
      saveSettings();
      sincronizarAjustesWeb(segment);
      applyAll();
      syncSettingsUI();
      haptic();
      return;
    }
    var toggle = event.target.closest('[data-toggle]');
    if (toggle) {
      var key = toggle.getAttribute('data-toggle');
      settings[key] = !settings[key];
      saveSettings();
      sincronizarAjustesWeb(key);
      applyAll();
      syncSettingsUI();
      haptic();
      return;
    }
    var action = event.target.closest('[data-action]');
    if (action) {
      var name = action.getAttribute('data-action');
      if (name === 'share') shareApp();
      else if (name === 'account') openProfile();
      else if (name === 'update') {
        if (window.LaGochaNative) native('checkUpdates');
        else toast('Abre la app para buscar actualizaciones');
      }
      else if (name === 'sugerencias') {
        haptic();
        closeAllOverlays();
        window.setTimeout(function () {
          if (typeof window.abrirSugerencias === 'function') window.abrirSugerencias();
          else toast('Sugerencias solo en la versión web');
        }, 180);
      }
      else if (name === 'admin') {
        haptic();
        closeAllOverlays();
        window.setTimeout(function () {
          if (typeof window.abrirAdminPanel === 'function') window.abrirAdminPanel('login');
          else toast('Acceso de administración solo en la versión web');
        }, 180);
      }
      else if (name === 'reload') location.reload();
    }
  });

  if (chatOverlay) {
    chatOverlay.addEventListener('click', function (event) {
      if (event.target.closest('[data-close-chat]')) closeAllOverlays();
    });
  }

  var scrollTick = false;
  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (progress) progress.style.width = Math.max(0, Math.min(100, pct)) + '%';
      if (topbar) topbar.classList.toggle('lg-scrolled', window.scrollY > 8);
      scrollTick = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  function updateOnline() {
    if (!offlineBar) return;
    offlineBar.classList.toggle('lg-show', !navigator.onLine);
  }
  window.addEventListener('online', function () { updateOnline(); toast('Conexión restablecida'); });
  window.addEventListener('offline', updateOnline);

  if (page === 'home') {
    var muro = document.getElementById('muro');
    if (muro && !document.getElementById('lg-muro-head')) {
      var head = document.createElement('div');
      head.id = 'lg-muro-head';
      head.innerHTML = '<span class="lg-eyebrow">COMUNIDAD</span><h1>Muro de saludos</h1><p>Deja un mensaje, reacciona y comparte con la comunidad.</p>';
      muro.insertBefore(head, muro.firstChild);
    }
    setHomeTab(location.hash === '#muro' ? 'muro' : 'home', false);
  } else {
    updateNav();
  }

  applyAll();
  updateOnline();
  onScroll();
  syncTopbarAccount();
  syncTopbarMeta();
  setInterval(syncTopbarMeta, 8000);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      window.__lgReady = true;
      native('ready');
    });
  });

  actualizarFilaAdmin();
  window.addEventListener('gocha:sesion', actualizarFilaAdmin);

  /* ---------- Aviso de versión nueva (solo dentro de la app) ---------- */
  var UPDATE_CACHE = 'lg_update_checked';
  var UPDATE_SKIP = 'lg_update_skip';

  function versionMayor(remota, instalada) {
    var a = String(remota).split('.');
    var b = String(instalada).split('.');
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
      var x = parseInt(a[i], 10) || 0;
      var y = parseInt(b[i], 10) || 0;
      if (x !== y) return x > y;
    }
    return false;
  }

  function pintarAvisoVersion(info) {
    if (document.getElementById('lg-update-bar')) return;

    var barra = document.createElement('div');
    barra.id = 'lg-update-bar';
    barra.className = 'lg-update-bar';
    barra.setAttribute('role', 'status');

    var icono = document.createElement('span');
    icono.className = 'lg-update-icono';
    icono.setAttribute('aria-hidden', 'true');
    icono.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>';
    barra.appendChild(icono);

    var texto = document.createElement('span');
    texto.className = 'lg-update-texto';
    var titulo = document.createElement('strong');
    titulo.textContent = 'Actualización lista';
    var sub = document.createElement('small');
    var detalle = info.notes ? String(info.notes).split('\n')[0].slice(0, 48) : 'Mejoras y arreglos';
    sub.textContent = 'v' + info.versionName + ' · ' + detalle;
    texto.appendChild(titulo);
    texto.appendChild(sub);
    barra.appendChild(texto);

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'lg-update-btn';
    boton.textContent = 'Actualizar';
    boton.addEventListener('click', function () {
      haptic();
      native('checkUpdates');
    });
    barra.appendChild(boton);

    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'lg-update-x';
    cerrar.setAttribute('aria-label', 'Ocultar aviso');
    cerrar.textContent = '\u2715';
    cerrar.addEventListener('click', function () {
      try { localStorage.setItem(UPDATE_SKIP, String(info.versionName)); } catch (e) {}
      barra.remove();
    });
    barra.appendChild(cerrar);

    document.body.appendChild(barra);
  }

  function revisarVersionRemota(info) {
    if (!info || !info.versionName) return;
    var instalada = native('getVersion');
    if (!instalada) return;
    var saltada = null;
    try { saltada = localStorage.getItem(UPDATE_SKIP); } catch (e) {}
    if (saltada === String(info.versionName)) return;
    if (!versionMayor(info.versionName, instalada)) return;
    pintarAvisoVersion(info);
  }

  function avisarVersionNueva() {
    var api = window.LaGochaNative;
    if (!api || typeof api.getVersion !== 'function' || typeof api.checkUpdates !== 'function') return;
    var ahora = Date.now();
    var cache = null;
    try { cache = JSON.parse(localStorage.getItem(UPDATE_CACHE) || 'null'); } catch (e) {}
    if (cache && cache.at && cache.info && ahora - cache.at < 21600000) {
      revisarVersionRemota(cache.info);
      return;
    }
    fetch('/app/version.json?t=' + ahora, { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (info) {
        if (!info) return;
        try { localStorage.setItem(UPDATE_CACHE, JSON.stringify({ at: ahora, info: info })); } catch (e) {}
        revisarVersionRemota(info);
      })
      .catch(function () {});
  }

  avisarVersionNueva();

  /* ---------- Telemetría anónima de instalación y actualizaciones ---------- */
  var TELEMETRIA_URL = 'https://cydiyaacnyydprgffmkq.supabase.co/functions/v1/app-telemetria';
  var TELEMETRIA_AT = 'lg_telemetria_at';
  var TELEMETRIA_VERSION = 'lg_telemetria_version';
  var DISPOSITIVO_KEY = 'lg_dispositivo_id';

  function idDispositivo() {
    try {
      var id = localStorage.getItem(DISPOSITIVO_KEY);
      if (id) return id;
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        id = window.crypto.randomUUID();
      } else {
        id = 'd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
      }
      localStorage.setItem(DISPOSITIVO_KEY, id);
      return id;
    } catch (e) {
      return null;
    }
  }

  function reportarInstalacion() {
    var instalada = native('getVersion');
    if (!instalada || !/^\d+(\.\d+)*$/.test(String(instalada))) return;
    var id = idDispositivo();
    if (!id) return;
    var ahora = Date.now();
    var versionEnviada = null;
    var enviado = 0;
    try {
      versionEnviada = localStorage.getItem(TELEMETRIA_VERSION);
      enviado = parseInt(localStorage.getItem(TELEMETRIA_AT), 10) || 0;
    } catch (e) {}
    if (versionEnviada === String(instalada) && ahora - enviado < 21600000) return;
    fetch(TELEMETRIA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, version: String(instalada) }),
      keepalive: true
    }).then(function (res) {
      if (!res.ok) return;
      try {
        localStorage.setItem(TELEMETRIA_VERSION, String(instalada));
        localStorage.setItem(TELEMETRIA_AT, String(ahora));
      } catch (e) {}
    }).catch(function () {});
  }

  reportarInstalacion();

  (function prefetchPages() {
    var idx = navIndex(activeNavId());
    var targets = [];
    if (idx > 0) targets.push(NAV[idx - 1]);
    if (idx >= 0 && idx < NAV.length - 1) targets.push(NAV[idx + 1]);
    var seen = {};
    for (var i = 0; i < targets.length; i++) {
      var item = targets[i];
      var href = item.id === 'inicio' ? './' : item.id === 'muro' ? './#muro' : item.href;
      if (seen[href]) continue;
      seen[href] = true;
      if (location.pathname.replace(/\/$/, '/index.html') === href.replace(/^\.\//, '/')) continue;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'document';
      document.head.appendChild(link);
    }
    var preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://www.youtube.com';
    document.head.appendChild(preconnect);
  })();

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function () { if (settings.theme === 'auto') applyTheme(); };
    if (mq.addEventListener) mq.addEventListener('change', onScheme);
    else if (mq.addListener) mq.addListener(onScheme);
  }
})();
