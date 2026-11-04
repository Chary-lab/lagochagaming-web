// --- LÓGICA GLOBAL COMPARTIDA (URLs, Supabase, Menú y Tema) ---

try {
    if (window.location.pathname.endsWith('/index.html')) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname.replace('/index.html', '/') + window.location.search + window.location.hash;
        window.history.replaceState(null, null, cleanUrl);
    }
} catch (e) {
    // file:// no permite replaceState; se ignora
}

// Vuelta del OAuth de Kick al APK. El callback cae en el navegador; si la app
// marco kick_app=1, se reenvia al esquema propio para terminar la sesion dentro
// del WebView. Solo las versiones nuevas declaran supportsKickDeepLink().
(function () {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('kick_app') !== '1') return;
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const token = hash.get('kick') || '';
        const error = hash.get('kick_error') || '';
        if (!token && !error) return;
        const objetivo = params.get('kick_obj') || 'entrar';
        const query = new URLSearchParams();
        if (token) query.set('kick', token);
        if (error) query.set('kick_error', error);
        query.set('objetivo', objetivo);
        const destino = 'lagochagaming://kick?' + query.toString();
        const aviso = document.createElement('div');
        aviso.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;background:#05070a;color:#fff;font-family:system-ui,sans-serif;text-align:center';
        aviso.innerHTML = '<strong style="font-size:20px">Vuelve a LaGochaGaming</strong><span style="color:#9aa4b2">Pulsa el boton para terminar el login dentro de la app.</span>';
        const boton = document.createElement('a');
        boton.href = destino;
        boton.textContent = 'Abrir LaGochaGaming';
        boton.style.cssText = 'display:inline-block;padding:14px 22px;border-radius:999px;background:#39d353;color:#04120a;font-weight:700;text-decoration:none';
        aviso.appendChild(boton);
        if (document.body) document.body.appendChild(aviso);
        else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(aviso), { once: true });
    } catch (e) {
        // Sin handler del esquema: se queda en la web.
    }
})();

const SUPABASE_URL = 'https://cydiyaacnyydprgffmkq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGl5YWFjbnl5ZHByZ2ZmbWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NjY1ODQsImV4cCI6MjEwNzM0MjU4NH0.fkipcX7Lx4lhGSa0zTDQ9BDNN3jiGTksB2hMlHH1bAs';
// El token de comunidad viaja en cada petición: es_admin()/es_owner() lo leen
// para dar permisos de panel sin pasar por el login oculto de Supabase Auth.
function fetchConTokenComunidad(input, init) {
    const token = localStorage.getItem('comunidad_session_token');
    if (!token) return fetch(input, init);
    const opciones = init || {};
    const cabeceras = new Headers(opciones.headers || {});
    cabeceras.set('x-comunidad-token', token);
    return fetch(input, { ...opciones, headers: cabeceras });
}
if (window.supabase) {
    try {
        window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            global: { fetch: fetchConTokenComunidad }
        });
        window.supabaseReady = true;
    } catch (e) {
        console.error('Error inicializando Supabase:', e);
        window.supabase = null;
        window.supabaseReady = false;
    }
} else {
    window.supabase = null;
    window.supabaseReady = false;
}

// === HELPERS COMPARTIDOS ===

// Única fuente de verdad del escapado de HTML para todo el sitio.
window.escapeHtml = function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
};

window.escapeAttr = function escapeAttr(s) {
    return String(s ?? '').replace(/["'<>]/g, c => ({
        '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;'
    }[c]));
};

// El rol de admin lo resuelve el servidor con la RPC es_admin(): acepta el JWT
// de Auth o la sesión de comunidad (cabecera x-comunidad-token).
let _adminCache = null;

window.esAdminActual = async function esAdminActual() {
    if (!window.supabase) return false;
    const token = localStorage.getItem('comunidad_session_token') || '';
    if (!token) { _adminCache = null; return false; }
    if (_adminCache && _adminCache.token === token) return _adminCache.ok;

    let ok = false;
    try {
        const { data, error } = await window.supabase.rpc('es_admin');
        if (error) console.warn('No se pudo verificar el rol de admin:', error.message);
        else ok = data === true;
    } catch (e) {
        console.warn('No se pudo verificar el rol de admin:', e);
        return false;
    }

    _adminCache = { token: token, ok: ok };
    return ok;
};

// Mantener la caché sincronizada con cambios de sesión (login/logout en otra pestaña/página).
if (window.supabase && typeof window.supabase.auth?.onAuthStateChange === 'function') {
    window.supabase.auth.onAuthStateChange((evento) => {
        if (evento === 'SIGNED_IN') {
            localStorage.removeItem('comunidad_logout_explicito');
        }
        window.refrescarCacheAdmin();
        window.sincronizarSesionComunidadVinculada?.();
    });
}

// Se llama tras iniciar o cerrar sesión para que la caché no quede obsoleta.
window.refrescarCacheAdmin = function refrescarCacheAdmin() {
    _adminCache = null;
};

// Confeti reutilizable. Acepta el id de un canvas existente o, si no se pasa,
// crea uno efímero a pantalla completa que se elimina al terminar.
window.lanzarConfetti = function lanzarConfetti(canvasId, opciones = {}) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colores = ['#ff66b2', '#00f2fe', '#ffffff', '#ffeb3b', '#4caf50', '#9b59b6'];
    const cantidad = opciones.cantidad || 150;

    let canvas = canvasId ? document.getElementById(canvasId) : null;
    let efimero = false;
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.setAttribute('role', 'presentation');
        document.body.appendChild(canvas);
        efimero = true;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        if (efimero) canvas.remove();
        return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particulas = [];
    for (let i = 0; i < cantidad; i++) {
        particulas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            color: colores[Math.floor(Math.random() * colores.length)],
            speedY: Math.random() * 5 + 2,
            speedX: Math.random() * 4 - 2,
            rotation: Math.random() * 360
        });
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let terminado = true;
        particulas.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += 2;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            if (p.y < canvas.height) terminado = false;
        });
        if (!terminado) {
            requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (efimero) canvas.remove();
        }
    }

    render();
};

// === TRAMPA DE FOCO PARA MODALES ===

const SELECTOR_FOCALIZABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',');

let _trampaFoco = null;

window.activarTrampaFoco = function activarTrampaFoco(modal, elementoInicial) {
    if (!modal) return;
    window.desactivarTrampaFoco();

    const focoPrevio = document.activeElement;

    const alTeclear = (evento) => {
        if (evento.key !== 'Tab') return;
        const focalizables = Array.from(modal.querySelectorAll(SELECTOR_FOCALIZABLE))
            .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
        if (focalizables.length === 0) {
            evento.preventDefault();
            return;
        }
        const primero = focalizables[0];
        const ultimo = focalizables[focalizables.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primero.focus();
        }
    };

    document.addEventListener('keydown', alTeclear);
    _trampaFoco = { alTeclear, focoPrevio, modal };

    const inicial = elementoInicial || modal.querySelector(SELECTOR_FOCALIZABLE);
    if (inicial && typeof inicial.focus === 'function') inicial.focus();
};

window.desactivarTrampaFoco = function desactivarTrampaFoco(restaurarFoco = true) {
    if (!_trampaFoco) return;
    document.removeEventListener('keydown', _trampaFoco.alTeclear);
    const focoPrevio = _trampaFoco.focoPrevio;
    _trampaFoco = null;
    if (restaurarFoco && focoPrevio && typeof focoPrevio.focus === 'function' && document.contains(focoPrevio)) {
        focoPrevio.focus();
    }
};

// === MODO CLARO / OSCURO / OLED (3 estados) ===
// Estados: 'dark' (default) → 'light' → 'oled' → 'dark'

window.initTema = function initTema() {
    let temaActual = localStorage.getItem('gochi_tema') || 'dark';
    if (!['dark', 'light', 'oled'].includes(temaActual)) temaActual = 'dark';
    const btn = document.getElementById('btn-toggle-tema');
    if (!btn) return;

    const icono = btn.querySelector('use');
    const aplicarTema = (tema) => {
        document.body.classList.remove('light-mode', 'oled-mode');
        if (tema === 'light') document.body.classList.add('light-mode');
        else if (tema === 'oled') document.body.classList.add('oled-mode');
        if (icono) {
            const simbolo = tema === 'light' ? 'i-solid-moon' :
                tema === 'oled' ? 'i-solid-circle' : 'i-solid-sun';
            icono.setAttribute('href', 'img/icons.svg#' + simbolo);
        }
        btn.setAttribute('aria-label', tema === 'light' ? 'Cambiar a tema OLED' :
                                             tema === 'oled' ? 'Cambiar a tema oscuro' :
                                                               'Cambiar a tema claro');
        btn.title = tema === 'light' ? 'Tema claro → OLED' :
                                       tema === 'oled' ? 'Tema OLED → Oscuro' :
                                                         'Tema oscuro → Claro';
    };
    aplicarTema(temaActual);
    btn.onclick = () => {
        const siguiente = temaActual === 'dark' ? 'light' :
                          temaActual === 'light' ? 'oled' : 'dark';
        temaActual = siguiente;
        localStorage.setItem('gochi_tema', siguiente);
        aplicarTema(siguiente);
    };
};

// === SESIÓN DE COMUNIDAD ===

// Cachés locales que pertenecen a la cuenta de comunidad. Se limpian al cerrar
// sesión o cuando el servidor invalida el token para que el siguiente usuario
// no herede likes, reacciones ni rachas de la cuenta anterior.
window.limpiarCachesSesionComunidad = function limpiarCachesSesionComunidad() {
    [
        'gochi_chat_mi_reaccion_v2',
        'gochi_chat_reacciones_cache',
        'gochi_chat_mi_reaccion_pendiente_v1',
        'gochi_chat_streak',
        'gocha_user_likes',
        'chat_scroll'
    ].forEach((clave) => {
        localStorage.removeItem(clave);
        sessionStorage.removeItem(clave);
    });
};

// Única fuente de verdad del usuario de comunidad en el cliente.
window.obtenerSesionUsuarioComunidad = function obtenerSesionUsuarioComunidad() {
    try {
        const datos = JSON.parse(localStorage.getItem('comunidad_session_usuario') || '{}');
        return datos && typeof datos === 'object' ? datos : {};
    } catch (e) {
        return {};
    }
};

window.actualizarSesionUsuarioComunidad = function actualizarSesionUsuarioComunidad(parcial) {
    const actual = window.obtenerSesionUsuarioComunidad();
    const nuevo = Object.assign({}, actual, parcial || {});
    try {
        localStorage.setItem('comunidad_session_usuario', JSON.stringify(nuevo));
    } catch (e) {}
    return nuevo;
};

// === Kick: vincular la cuenta de comunidad con la de Kick ===
// Vincular exige las dos sesiones: la de comunidad (PIN) y la de Kick.
// Así nadie se queda con el perfil de otro por escribir su apodo en Kick.
// Vuelta del OAuth de Kick. En el APK agrega la marca que hace que el
// callback vuelva por el esquema lagochagaming:// en vez de quedarse en la web.
window.vueltaKickApp = function vueltaKickApp(objetivo) {
    const vuelta = location.pathname + location.search;
    let enApp = false;
    try {
        enApp = !!(window.LaGochaNative
            && typeof window.LaGochaNative.supportsKickDeepLink === 'function'
            && window.LaGochaNative.supportsKickDeepLink());
    } catch (e) {
        enApp = false;
    }
    if (!enApp) return vuelta;
    return vuelta + (vuelta.includes('?') ? '&' : '?')
        + 'kick_app=1&kick_obj=' + encodeURIComponent(objetivo);
};

window.KICK_COMUNIDAD = (function () {
    const FN = 'https://cydiyaacnyydprgffmkq.supabase.co/functions/v1';
    const CLAVE_OBJETIVO = 'gocha_kick_objetivo';

    function sesion() {
        return window.obtenerSesionUsuarioComunidad();
    }

    function vinculado() {
        return !!sesion().kick_user_id;
    }

    async function abrirOAuth(objetivo) {
        try {
            // Un solo OAuth para todo: si Kick ya esta conectado (por el chat o
            // por el icono), se reutiliza el token y solo se entra a Comunidad.
            if (objetivo === 'entrar' && localStorage.getItem('gocha_kick_token')) {
                if (typeof window.entrarConKickComunidad === 'function') {
                    return await window.entrarConKickComunidad();
                }
                window.location.href = 'comunidad?kick=1';
                return false;
            }
            sessionStorage.setItem(CLAVE_OBJETIVO, objetivo);
            const vuelta = window.vueltaKickApp(objetivo);
            const res = await fetch(FN + '/kick-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'entrar', vuelta })
            });
            const datos = await res.json().catch(() => ({}));
            if (datos.url) {
                location.href = datos.url;
                return false;
            }
            window.mostrarToast?.(datos.error || 'No se pudo abrir el login de Kick.', true);
        } catch (e) {
            window.mostrarToast?.('No se pudo abrir el login de Kick.', true);
        }
        return false;
    }

    async function vincular() {
        const tokenComunidad = localStorage.getItem('comunidad_session_token');
        if (!tokenComunidad) {
            window.mostrarToast?.('Inicia sesión en la comunidad antes de vincular Kick.', true);
            return false;
        }
        const tokenKick = localStorage.getItem('gocha_kick_token');
        if (!tokenKick) return abrirOAuth('vincular');
        try {
            const res = await fetch(FN + '/kick-comunidad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenKick },
                body: JSON.stringify({ accion: 'vincular', token: tokenComunidad })
            });
            const datos = await res.json().catch(() => ({}));
            if (res.status === 401) {
                localStorage.removeItem('gocha_kick_token');
                return abrirOAuth('vincular');
            }
            if (!res.ok || !datos.ok) {
                window.mostrarToast?.(datos.mensaje || datos.error || 'No se pudo vincular Kick.', true);
                return false;
            }
            window.actualizarSesionUsuarioComunidad(datos.usuario || {});
            window.dispatchEvent(new CustomEvent('kick-vinculado', { detail: datos.usuario || {} }));
            window.mostrarToast?.('Kick vinculado. Ya puedes entrar sin PIN.', false);
            return true;
        } catch (e) {
            window.mostrarToast?.('No se pudo vincular Kick.', true);
            return false;
        }
    }

    // Vuelta del OAuth fuera de comunidad: solo resuelve el vínculo.
    // El login del chat y el de comunidad tienen sus propios manejadores.
    async function volverDelHash() {
        if (window.COMUNIDAD_KICK_PROPIO) return false;
        // El chat maneja su propia vuelta: no debe rebotar a Comunidad.
        try {
            if (new URLSearchParams(location.search).get('kick_obj') === 'chat') return false;
        } catch (e) {}
        const hash = location.hash.startsWith('#') ? location.hash.slice(1) : '';
        if (!hash) return false;
        const params = new URLSearchParams(hash);
        const token = params.get('kick');
        const error = params.get('kick_error');
        if (!token && !error) return false;
        const objetivo = sessionStorage.getItem(CLAVE_OBJETIVO) || 'auto';
        if (objetivo === 'chat') {
            sessionStorage.removeItem(CLAVE_OBJETIVO);
            return false;
        }
        if (objetivo !== 'vincular' && objetivo !== 'entrar' && !error) return false;
        sessionStorage.removeItem(CLAVE_OBJETIVO);
        history.replaceState(null, '', location.pathname + location.search);
        if (error) {
            window.mostrarToast?.(error, true);
            return false;
        }
        localStorage.setItem('gocha_kick_token', token);
        if (objetivo === 'vincular') return await vincular();
        // Entrar con Kick desde una pagina sin chat: el login de comunidad se
        // completa alli, ya con el token guardado (sin repetir el OAuth).
        window.location.replace('comunidad?kick=1');
        return true;
    }

    return { vinculado, vincular, abrirOAuth, volverDelHash };
})();

// === Cuenta unica: Kick entra, vincula o crea la cuenta de comunidad ===
// "Conectar" del chat y el boton de Kick de Comunidad comparten este flujo.
window.guardarSesionComunidad = function guardarSesionComunidad(datos) {
    if (!datos || !datos.token || !datos.usuario) return false;
    const u = datos.usuario;
    localStorage.removeItem('comunidad_logout_explicito');
    localStorage.setItem('comunidad_session_token', datos.token);
    localStorage.setItem('comunidad_nickname', u.apodo || '');
    if (u.id) localStorage.setItem('comunidad_user_id', String(u.id));
    localStorage.setItem('comunidad_session_usuario', JSON.stringify(u));
    window.actualizarUsuarioNavComunidad?.();
    window.latidoComunidad?.();
    return true;
};

// Pregunta que hacer cuando el apodo de Kick ya existe en la comunidad.
// Devuelve { pin } o { apodo } o null si se cancela.
window.preguntarConflictoKick = function preguntarConflictoKick(info) {
    return new Promise((resolver) => {
        document.querySelectorAll('.kick-conflicto-overlay').forEach((viejo) => viejo.remove());
        const apodo = (info && info.apodo) || 'esa cuenta';
        const mensaje = (info && info.mensaje) || '';
        const overlay = document.createElement('div');
        overlay.className = 'kick-conflicto-overlay';
        overlay.innerHTML = `
            <div class="kick-conflicto-card" role="dialog" aria-modal="true" aria-labelledby="kick-conflicto-titulo">
                <h3 id="kick-conflicto-titulo">Ese apodo ya existe</h3>
                <p class="kick-conflicto-texto">Ya hay una cuenta <strong>“${window.escapeHtml(apodo)}”</strong> en la comunidad. Si es tuya, confírmala con tu PIN. Si no, elige otro apodo para tu cuenta de Kick.</p>
                <p class="kick-conflicto-aviso" ${mensaje ? '' : 'hidden'}>${window.escapeHtml(mensaje)}</p>
                <form class="kick-conflicto-form" data-modo="pin" novalidate>
                    <label for="kick-conflicto-pin">PIN de 4 dígitos</label>
                    <input id="kick-conflicto-pin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" placeholder="••••">
                    <p class="kick-conflicto-error" role="alert" hidden></p>
                    <button type="submit" class="btn-primary">Vincular con PIN</button>
                </form>
                <div class="kick-conflicto-sep"><span>o</span></div>
                <form class="kick-conflicto-form" data-modo="apodo" novalidate>
                    <label for="kick-conflicto-apodo">Crear una cuenta nueva con otro apodo</label>
                    <input id="kick-conflicto-apodo" type="text" maxlength="20" autocomplete="off" placeholder="Tu nuevo apodo">
                    <p class="kick-conflicto-error" role="alert" hidden></p>
                    <button type="submit" class="btn-primary btn-muted">Crear cuenta con este apodo</button>
                </form>
                <button type="button" class="kick-conflicto-cancelar">Ahora no</button>
            </div>`;
        document.body.appendChild(overlay);
        const cerrar = (valor) => {
            overlay.remove();
            resolver(valor);
        };
        const formPin = overlay.querySelector('[data-modo="pin"]');
        const formApodo = overlay.querySelector('[data-modo="apodo"]');
        const errorPin = formPin.querySelector('.kick-conflicto-error');
        const errorApodo = formApodo.querySelector('.kick-conflicto-error');
        const inputPin = formPin.querySelector('input');
        const inputApodo = formApodo.querySelector('input');
        inputPin.focus();
        formPin.addEventListener('submit', (e) => {
            e.preventDefault();
            const pin = inputPin.value.trim();
            if (!/^[0-9]{4}$/.test(pin)) {
                errorPin.hidden = false;
                errorPin.textContent = 'Escribe los 4 dígitos de tu PIN.';
                return;
            }
            cerrar({ pin });
        });
        formApodo.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevo = inputApodo.value.trim();
            if (nuevo.length < 3 || nuevo.length > 20) {
                errorApodo.hidden = false;
                errorApodo.textContent = 'El apodo debe tener entre 3 y 20 caracteres.';
                return;
            }
            if (nuevo.toLowerCase() === String(apodo).toLowerCase()) {
                errorApodo.hidden = false;
                errorApodo.textContent = 'Ese es el apodo que ya existe. Elige otro.';
                return;
            }
            cerrar({ apodo: nuevo });
        });
        overlay.querySelector('.kick-conflicto-cancelar').addEventListener('click', () => cerrar(null));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(null); });
        overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(null); });
    });
};

// Aviso de cuenta nueva: completar el perfil ahora o dejarlo para despues.
window.ofrecerCompletarPerfilKick = function ofrecerCompletarPerfilKick() {
    if (document.querySelector('.kick-perfil-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'kick-conflicto-overlay kick-perfil-overlay';
    overlay.innerHTML = `
        <div class="kick-conflicto-card" role="dialog" aria-modal="true" aria-labelledby="kick-perfil-titulo">
            <h3 id="kick-perfil-titulo">¡Tu cuenta está lista!</h3>
            <p class="kick-conflicto-texto">Creamos tu cuenta de comunidad con tus datos de Kick. Puedes completar tu perfil ahora o hacerlo después desde tu cuenta.</p>
            <div class="kick-perfil-acciones">
                <button type="button" class="btn-primary" data-accion="ahora">Completar ahora</button>
                <button type="button" class="btn-primary btn-muted" data-accion="despues">Ver después</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    const cerrar = () => overlay.remove();
    overlay.querySelector('[data-accion="ahora"]').addEventListener('click', () => {
        cerrar();
        if (typeof window.abrirModalPerfil === 'function') window.abrirModalPerfil('ajustes');
    });
    overlay.querySelector('[data-accion="despues"]').addEventListener('click', cerrar);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
};

// Entra con la sesion de Kick ya guardada. Si el apodo choca, pregunta.
// Devuelve los datos de la sesion de comunidad, { cancelado: true } o { error }.
window.entrarConKickCuenta = async function entrarConKickCuenta(opciones) {
    const silenciarAviso = !!(opciones && opciones.silenciarAviso);
    const tokenKick = localStorage.getItem('gocha_kick_token');
    if (!tokenKick) return { error: 'sin_kick' };
    let extra = {};
    for (let intento = 0; intento < 4; intento++) {
        let res;
        let datos;
        try {
            res = await fetch(SUPABASE_URL + '/functions/v1/kick-comunidad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenKick },
                body: JSON.stringify(Object.assign({ accion: 'entrar' }, extra))
            });
            datos = await res.json().catch(() => ({}));
        } catch (e) {
            return { error: 'sin_conexion', mensaje: 'No se pudo conectar con la comunidad.' };
        }

        if (datos.error === 'conflicto_apodo' || datos.error === 'apodo_duplicado' || datos.error === 'apodo_ocupado') {
            const elegido = await window.preguntarConflictoKick(datos);
            if (!elegido) return { cancelado: true };
            extra = elegido;
            continue;
        }
        if (datos.error === 'pin_invalido' || datos.error === 'apodo_invalido') {
            const elegido = await window.preguntarConflictoKick({
                apodo: datos.apodo || extra.apodo || '',
                mensaje: datos.mensaje || 'Revisa los datos e inténtalo de nuevo.'
            });
            if (!elegido) return { cancelado: true };
            extra = elegido;
            continue;
        }
        if (res.status === 401) {
            localStorage.removeItem('gocha_kick_token');
            return { error: 'kick_caducado', mensaje: datos.mensaje || datos.error };
        }
        if (!res.ok || !datos.ok) {
            return { error: datos.error || 'entrar', mensaje: datos.mensaje };
        }

        window.guardarSesionComunidad(datos);
        if (datos.nuevo && !silenciarAviso) window.ofrecerCompletarPerfilKick?.();
        return datos;
    }
    return { error: 'conflicto', mensaje: 'No se pudo completar el acceso.' };
};

window.addEventListener('kick-vinculado', (e) => {
    const store = window.Alpine?.store?.('perfil');
    if (store) store.usuario = Object.assign({}, store.usuario, e.detail || {});
});

// Latido de actividad: permite saber si una cuenta está activa aunque esté
// navegando fuera de Comunidad. El panel de Usuarios considera "en línea"
// a quien haya latido en los últimos 2 minutos.
window.latidoComunidad = async function latidoComunidad() {
    if (!window.supabase) return false;
    const token = localStorage.getItem('comunidad_session_token');
    if (!token) return false;
    try {
        const { data, error } = await window.supabase.rpc('latido_comunidad', { p_token: token });
        return !error && data && data.ok === true;
    } catch (e) {
        return false;
    }
};

function iniciarLatidoComunidad() {
    if (window._latidoComunidadInterval) return;
    window.latidoComunidad();
    window._latidoComunidadInterval = setInterval(() => {
        if (!document.hidden) window.latidoComunidad();
    }, 60000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) window.latidoComunidad();
    });
}

// Avatar efectivo: el guardado, el beta segun genero o null (inicial).
window.avatarUsuarioComunidad = function avatarUsuarioComunidad(usuario) {
    const u = usuario || window.obtenerSesionUsuarioComunidad();
    if (u.avatar_url) return u.avatar_url;
    if (u.genero === 'femenino') return '/img/avatars/avatar-female.webp';
    if (u.genero === 'masculino') return '/img/avatars/avatar-male.webp';
    return null;
};

// === RANGOS DE LA COMUNIDAD (línea de tiempo cósmica) ===
// Fuente de verdad en cliente. Debe coincidir con calcular_rango() y
// multiplicador_rango() de Supabase (migración de rangos cósmicos).
window.RANGOS_COMUNIDAD = [
    { clave: 'polvo_cosmico',       nombre: 'Polvo Cósmico',       emoji: '🌫️', min: 0,    max: 99,   mult: 1, desc: 'El inicio de la materia.' },
    { clave: 'protoestrella',       nombre: 'Protoestrella',       emoji: '🟠', min: 100,  max: 399,  mult: 2, desc: 'El nacimiento del calor.' },
    { clave: 'secuencia_principal', nombre: 'Secuencia Principal', emoji: '☀️', min: 400,  max: 999,  mult: 3, desc: 'La madurez y estabilidad lumínica.' },
    { clave: 'gigante_roja',        nombre: 'Gigante Roja',        emoji: '🔴', min: 1000, max: 1999, mult: 4, desc: 'La expansión masiva de energía.' },
    { clave: 'supernova',           nombre: 'Supernova',           emoji: '✨', min: 2000, max: 3499, mult: 5, desc: 'La explosión más brillante del universo.' },
    { clave: 'agujero_negro',       nombre: 'Agujero Negro',       emoji: '🕳️', min: 3500, max: null, mult: 6, desc: 'El colapso final absoluto.' }
];

// Claves antiguas que pueden seguir guardadas en la BD o en saludos viejos.
window.ALIAS_RANGOS_COMUNIDAD = {
    semilla: 'polvo_cosmico',
    gota: 'protoestrella',
    flor: 'secuencia_principal',
    estrella: 'gigante_roja',
    leyenda: 'agujero_negro'
};

window.rangoPorPuntos = function rangoPorPuntos(puntos) {
    const valor = Number(puntos);
    const p = Number.isFinite(valor) ? valor : 0;
    let actual = window.RANGOS_COMUNIDAD[0];
    for (const r of window.RANGOS_COMUNIDAD) {
        if (p >= r.min) actual = r;
    }
    return actual;
};

// Devuelve la clave canónica. Si hay puntos se calcula con ellos (los puntos
// mandan sobre una clave antigua o desfasada en la BD).
window.claveRango = function claveRango(clave, puntos) {
    const tienePuntos = puntos !== null && puntos !== undefined && puntos !== '' && Number.isFinite(Number(puntos));
    if (tienePuntos) return window.rangoPorPuntos(puntos).clave;
    const k = String(clave || '').toLowerCase();
    if (window.RANGOS_COMUNIDAD.some(r => r.clave === k)) return k;
    return window.ALIAS_RANGOS_COMUNIDAD[k] || 'polvo_cosmico';
};

window.datosRangoComunidad = function datosRangoComunidad(clave, puntos) {
    const k = window.claveRango(clave, puntos);
    return window.RANGOS_COMUNIDAD.find(r => r.clave === k) || window.RANGOS_COMUNIDAD[0];
};

// Clase CSS del "relieve" del nombre según el rango.
window.claseRangoTexto = function claseRangoTexto(clave, puntos) {
    return 'rango-texto-' + window.datosRangoComunidad(clave, puntos).clave;
};

window.etiquetaRango = function etiquetaRango(clave, puntos) {
    const r = window.datosRangoComunidad(clave, puntos);
    return r.emoji + ' ' + r.nombre.toUpperCase();
};

// === INSIGNIAS DE KICK (chat y perfil público) ===
window.DIAS_INSIGNIA_KICK = 30;
window.ETIQUETA_INSIGNIA_KICK = {
    moderator: 'MOD',
    vip: 'VIP',
    subscriber: 'SUB',
    founder: 'FOUNDER',
    sub_gifter: 'GIFT',
    og: 'OG',
    verified: 'OK',
    broadcaster: 'CANAL'
};
window.ICONO_INSIGNIA_KICK = {
    moderator: 'i-solid-shield-halved',
    vip: 'i-solid-gem',
    subscriber: 'i-solid-sparkles',
    founder: 'i-solid-crown',
    sub_gifter: 'i-solid-gift',
    og: 'i-solid-fire',
    verified: 'i-solid-check',
    broadcaster: 'i-solid-tower-broadcast'
};

// Devuelve las insignias vigentes (máx 6, caducan a los 30 días).
window.insigniasKickDe = function insigniasKickDe(fila) {
    if (!fila || !Array.isArray(fila.kick_badges) || !fila.kick_badges_at) return [];
    const edad = Date.now() - new Date(fila.kick_badges_at).getTime();
    if (!Number.isFinite(edad) || edad > window.DIAS_INSIGNIA_KICK * 86400000) return [];
    return fila.kick_badges
        .filter(b => b && window.ETIQUETA_INSIGNIA_KICK[b.type])
        .slice(0, 6)
        .map(b => ({
            tipo: b.type,
            etiqueta: window.ETIQUETA_INSIGNIA_KICK[b.type],
            icono: window.ICONO_INSIGNIA_KICK[b.type],
            texto: b.text || b.type
        }));
};


// === COPIAR USUARIO (sorteo) ===
window.copiarEnlace = async function copiarEnlace(url, textoExito = '¡Enlace copiado!') {
    try {
        await navigator.clipboard.writeText(url);
        window.mostrarToast?.(textoExito);
    } catch (e) {
        // Fallback para navegadores sin clipboard API o sin HTTPS
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            window.mostrarToast?.(textoExito);
        } catch (e2) {
            window.mostrarToast?.('No se pudo copiar', true);
        }
        textarea.remove();
    }
};

// === REACCIONES MURO: viven en el store Alpine `muro` (index.html) ===

// Iniciar Realtime para reacciones de muro
window.iniciarRealtimeMuroReacciones = function iniciarRealtimeMuroReacciones() {
    if (!window.supabase) return;
    try {
        supabase.channel('muro_reactions_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'muro_reactions' }, (payload) => {
                const muroId = payload.new?.muro_id || payload.old?.muro_id;
                if (muroId) {
                    window.Alpine?.store('muro')?.cargarReacciones(muroId);
                }
            })
            .subscribe();
    } catch (e) {
        console.warn('Realtime muro reacciones no disponible:', e);
    }
};

window.cerrarSesion = async function cerrarSesion() {
    const token = localStorage.getItem('comunidad_session_token');
    let teniaAuth = false;
    if (window.supabase) {
        try {
            const { data } = await window.supabase.auth.getSession();
            teniaAuth = !!(data && data.session);
        } catch (e) {
            teniaAuth = false;
        }
    }

    // Evita que la sincronización Auth → comunidad vuelva a abrir la sesión
    // justo después de cerrarla desde ajustes.
    localStorage.setItem('comunidad_logout_explicito', '1');
    localStorage.removeItem('comunidad_nickname');
    localStorage.removeItem('comunidad_session_token');
    localStorage.removeItem('comunidad_user_id');
    localStorage.removeItem('comunidad_session_usuario');
    window.limpiarCachesSesionComunidad();

    // El login general también cierra la sesión de Kick del chat y del OAuth.
    if (typeof window.cerrarSesionKick === 'function') {
        try { await window.cerrarSesionKick(); } catch (e) {}
    }

    if (token && window.supabase) {
        try {
            await window.supabase.rpc('cerrar_sesion_comunidad', { p_token: token });
        } catch (e) {
            // no bloquea el cierre local
        }
    }

    if (teniaAuth) {
        try {
            await window.supabase.auth.signOut();
        } catch (e) {
            // no bloquea el cierre local
        }
        window.refrescarCacheAdmin?.();
    }

    mostrarToast(teniaAuth ? 'Sesión cerrada' : 'Sesión de comunidad cerrada');
    setTimeout(() => { window.location.reload(); }, 800);
};

window.actualizarUsuarioNavComunidad = function actualizarUsuarioNavComunidad() {
    const apodo = localStorage.getItem('comunidad_nickname');
    const navUserInfo = document.getElementById('nav-user-info');
    const navLogin = document.getElementById('nav-login');
    if (navLogin) navLogin.hidden = !!apodo;

    if (apodo && navUserInfo) {
        const usuario = window.obtenerSesionUsuarioComunidad();
        const apodoSeguro = window.escapeHtml(apodo);
        const avatar = window.avatarUsuarioComunidad(usuario);
        const inicial = apodo.charAt(0).toUpperCase();
        const icono = usuario.icono || '';
        const claseRango = window.claseRangoTexto(usuario.rango, usuario.puntos);
        const rangoInfo = window.datosRangoComunidad(usuario.rango, usuario.puntos);
        const puntosNav = Number(usuario.puntos || 0);
        const avatarHtml = avatar
            ? `<img class="nav-user-avatar" src="${window.escapeAttr(avatar)}" alt="" loading="lazy">`
            : `<span class="nav-user-inicial" aria-hidden="true">${window.escapeHtml(inicial)}</span>`;

        navUserInfo.style.display = 'inline-flex';
        navUserInfo.innerHTML = `
            <button type="button" class="nav-user-btn" aria-haspopup="dialog" aria-expanded="false" aria-label="Abrir mi perfil y ajustes, ${puntosNav} puntos">
                ${avatarHtml}
                <span id="nav-username" class="nav-user-name ${claseRango}">${apodoSeguro}</span>
                <span class="nav-user-puntos" title="${window.escapeAttr(rangoInfo.nombre + ' · ' + puntosNav + ' pts')}">
                    <span class="nav-user-rango" aria-hidden="true">${rangoInfo.emoji}</span>
                    <span class="nav-user-pts">${puntosNav}</span>
                </span>
                <span class="nav-user-icono" ${icono ? '' : 'hidden'}>${window.escapeHtml(icono)}</span>
                <svg class="icon nav-user-chevron" aria-hidden="true"><use href="img/icons.svg#i-solid-chevron-down"></use></svg>
            </button>
            <button type="button" class="btn-logout-nav" title="Cerrar Sesión" aria-label="Cerrar sesión"><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-right-from-bracket"></use></svg> <span class="nav-logout-texto">Salir</span></button>
        `;
        const btnPerfil = navUserInfo.querySelector('.nav-user-btn');
        if (btnPerfil) {
            btnPerfil.addEventListener('click', (e) => {
                e.stopPropagation();
                window.abrirModalPerfil?.('perfil');
            });
        }
        const btnSalir = navUserInfo.querySelector('.btn-logout-nav');
        if (btnSalir) {
            btnSalir.addEventListener('click', (e) => {
                e.stopPropagation();
                window.cerrarSesion();
            });
        }
    } else if (!apodo && navUserInfo) {
        navUserInfo.innerHTML = '';
        navUserInfo.style.display = 'none';
    }

    // Avisa a los paneles (galería, cine, sorteo) cuando cambia la cuenta o el
    // token: así muestran u ocultan las herramientas de streamer sin recargar.
    const firmaSesion = (apodo || '') + '|' + (localStorage.getItem('comunidad_session_token') || '');
    if (firmaSesion !== window.__firmaSesionNav) {
        window.__firmaSesionNav = firmaSesion;
        document.dispatchEvent(new CustomEvent('gocha:sesion'));
    }
};

// === NAVBAR GLOBAL (fuente única: se inyecta en las 5 páginas) ===
window.NAVBAR_ENLACES = [
    { id: 'inicio', texto: 'Inicio', href: './' },
    { id: 'comunidad', texto: '💬 Comunidad', href: 'comunidad' },
    { id: 'galeria', texto: '📸 Galería', href: 'galeria' },
    { id: 'cine', texto: '🍿 GochiWatch', href: 'cine' },
    { id: 'sorteo', texto: '🎁 Sorteo', href: 'sorteo' },
];

window.paginaActualNavbar = function paginaActualNavbar() {
    const ruta = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
    if (!ruta) return 'inicio';
    return ruta.split('/').pop() || 'inicio';
};

window.insertarNavbar = function insertarNavbar() {
    const nav = document.getElementById('navbar-root');
    if (!nav || nav.dataset.montado === '1') return;
    const pagina = window.paginaActualNavbar();
    const enlaces = window.NAVBAR_ENLACES.map((enlace) => {
        const activo = enlace.id === pagina;
        const href = enlace.id === 'inicio' && pagina === 'inicio' ? '#top' : enlace.href;
        const clases = 'nav-link' + (activo ? ' nav-active' : '');
        const aria = activo ? ' aria-current="page"' : '';
        const id = enlace.id === 'inicio' ? ' id="nav-inicio"' : '';
        return `<a href="${href}" class="${clases}"${aria}${id}>${enlace.texto}</a>`;
    }).join('');

    const appMenu = `
        <details class="nav-app" id="nav-app">
            <summary class="nav-link nav-app-toggle" aria-label="Opciones de descarga de Gochita App">
                <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-brands-android"></use></svg>
                <span>App</span>
            </summary>
            <div class="nav-app-panel">
                <p class="nav-app-titulo">Gochita App</p>
                <a class="nav-app-opcion" href="https://cydiyaacnyydprgffmkq.supabase.co/functions/v1/app-descarga?v=1.12&o=web" rel="noopener" data-umami-event="descarga-apk">
                    <svg class="icon nav-app-icono" aria-hidden="true"><use href="img/icons.svg#i-brands-android"></use></svg>
                    <span class="nav-app-texto"><strong>Android</strong><small>v1.12 · 3,9 MB · Android 7+</small></span>
                    <span class="nav-app-accion">Descargar</span>
                </a>
                <div class="nav-app-opcion nav-app-opcion--pronto">
                    <svg class="icon nav-app-icono" aria-hidden="true"><use href="img/icons.svg#i-brands-apple"></use></svg>
                    <span class="nav-app-texto"><strong>iPhone / iPad</strong><small>Aún no disponible</small></span>
                    <span class="nav-app-accion"><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-clock"></use></svg> En camino</span>
                </div>
                <p class="nav-app-nota">Si Android pide permiso para instalar apps desconocidas, acéptalo: es el APK oficial.</p>
            </div>
        </details>`;

    const loginMenu = `
        <details class="nav-app nav-login" id="nav-login">
            <summary class="nav-link nav-login-toggle" aria-label="Opciones de acceso">
                <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-right-to-bracket"></use></svg>
                <span>Login</span>
            </summary>
            <div class="nav-app-panel nav-login-panel">
                <p class="nav-app-titulo">Tu cuenta</p>
                <button type="button" class="nav-app-opcion nav-login-opcion" data-login-accion="login">
                    <svg class="icon nav-app-icono" aria-hidden="true"><use href="img/icons.svg#i-solid-right-to-bracket"></use></svg>
                    <span class="nav-app-texto"><strong>Iniciar sesión</strong><small>Con tu apodo y PIN de comunidad</small></span>
                </button>
                <button type="button" class="nav-app-opcion nav-login-opcion" data-login-accion="kick">
                    <svg class="icon nav-app-icono nav-login-kick" aria-hidden="true"><use href="img/icons.svg#i-solid-k"></use></svg>
                    <span class="nav-app-texto"><strong>Conectar con Kick</strong><small>Entra o vincula tu cuenta en un clic</small></span>
                </button>
                <button type="button" class="nav-app-opcion nav-login-opcion" data-login-accion="registro">
                    <svg class="icon nav-app-icono" aria-hidden="true"><use href="img/icons.svg#i-solid-user-plus"></use></svg>
                    <span class="nav-app-texto"><strong>Registrarse</strong><small>Crea tu cuenta con apodo y PIN</small></span>
                </button>
                <p class="nav-app-nota">Con Kick se abre también el chat de la comunidad y el de Kick a la vez.</p>
            </div>
        </details>`;

    nav.setAttribute('x-data', '{ }');
    nav.setAttribute('x-on:resize.window', 'if (window.innerWidth >= 1101) $store.ui.menuAbierto = false');
    nav.innerHTML = `
        <div class="logo navbar-brand">LAGOCHA<span>GAMING</span></div>
        <button type="button" class="mobile-menu-toggle-btn navbar-toggler" aria-label="Abrir menú"
                x-bind:aria-expanded="$store.ui.menuAbierto"
                x-bind:aria-label="$store.ui.menuAbierto ? 'Cerrar menú' : 'Abrir menú'"
                x-on:click="$store.ui.menuAbierto = !$store.ui.menuAbierto"><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-bars"></use></svg></button>
        <div class="nav-links navbar-nav" x-bind:class="{ 'mobile-active': $store.ui.menuAbierto }">
            ${enlaces}
            ${appMenu}
        </div>
        <div class="nav-right">
            <span id="nav-live-tag" class="nav-live-tag" hidden>
                <span class="nav-live-dot" aria-hidden="true"></span>EN VIVO
            </span>
            ${loginMenu}
            <button type="button" id="btn-toggle-tema" class="btn-tema-nav" title="Cambiar tema" aria-label="Cambiar tema claro/oscuro"><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-sun"></use></svg></button>
            <button type="button" id="nav-puntos-dia" class="nav-puntos-dia" hidden
                    title="Puntos que llevas hoy" aria-label="Puntos de hoy">
                <span class="nav-puntos-ring" aria-hidden="true"></span>
                <span class="nav-puntos-texto" aria-hidden="true"><span id="nav-puntos-hoy">0</span><span class="nav-puntos-sep">/</span><span id="nav-puntos-tope">60</span></span>
                <span class="nav-puntos-suma" aria-hidden="true"></span>
            </button>
            <div id="nav-user-info"></div>
        </div>
    `;
    nav.dataset.montado = '1';

    // Cierre compartido de los menús plegables del navbar (App y Login).
    const menusPlegables = nav.querySelectorAll('details.nav-app');
    if (menusPlegables.length) {
        document.addEventListener('click', (evento) => {
            menusPlegables.forEach((detalle) => {
                if (detalle.open && !detalle.contains(evento.target)) detalle.removeAttribute('open');
            });
        });
        document.addEventListener('keydown', (evento) => {
            if (evento.key !== 'Escape') return;
            menusPlegables.forEach((detalle) => {
                if (!detalle.open) return;
                detalle.removeAttribute('open');
                detalle.querySelector('summary')?.focus();
            });
        });
        menusPlegables.forEach((detalle) => {
            detalle.addEventListener('click', (evento) => {
                if (evento.target.closest('a, button[data-login-accion]')) detalle.removeAttribute('open');
            });
        });
    }
};

// === Menú de acceso del navbar: única entrada de login ===
async function conectarKickNavbar() {
    const tokenComunidad = localStorage.getItem('comunidad_session_token');
    if (tokenComunidad) {
        await window.KICK_COMUNIDAD?.vincular();
        return;
    }
    if (typeof window.entrarConKickComunidad === 'function') {
        await window.entrarConKickComunidad();
        return;
    }
    // Sin la pagina de comunidad cargada: arranca el OAuth aqui mismo.
    // Antes se recargaba con comunidad?kick=1 y, si el arranque fallaba,
    // el clic solo parecia refrescar la pagina.
    await window.KICK_COMUNIDAD?.abrirOAuth('entrar');
}

window.abrirLoginMenu = function abrirLoginMenu(accion) {
    const menu = document.getElementById('nav-login');
    if (menu) menu.removeAttribute('open');
    if (accion === 'kick') {
        conectarKickNavbar();
        return;
    }
    const esRegistro = accion === 'registro';
    const abrir = esRegistro ? window.abrirModalRegistro : window.abrirModalLogin;
    if (typeof abrir === 'function') {
        abrir();
        return;
    }
    window.location.href = esRegistro ? 'comunidad?registro=1' : 'comunidad?login=1';
};

document.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-login-accion]');
    if (!boton) return;
    evento.preventDefault();
    window.abrirLoginMenu(boton.dataset.loginAccion);
});

window.insertarNavbar();


window.validarSesionStreamer = async function validarSesionStreamer() {
    return window.esAdminActual();
};

 // === COMPONENTES UI GLOBALES (toast, confirm modal, menú móvil) ===

window.insertarComponentesUIGlobales = function insertarComponentesUIGlobales() {
    if (!document.getElementById('gochi-toast')) {
        const toast = document.createElement('div');
        toast.id = 'gochi-toast';
        toast.className = 'gochi-toast-center';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('x-data', '{ }');
        toast.setAttribute('x-bind:class', "{ show: $store.toast.visible, error: $store.toast.esError }");
        toast.setAttribute('x-text', '$store.toast.mensaje');
        document.body.appendChild(toast);
    }
    if (!document.getElementById('gochi-confirm-modal')) {
        const modal = document.createElement('div');
        modal.id = 'gochi-confirm-modal';
        modal.className = 'gochi-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'gochi-confirm-titulo');
        modal.setAttribute('aria-describedby', 'gochi-confirm-mensaje');
        modal.innerHTML = `
            <div class="gochi-modal-box">
                <h3 id="gochi-confirm-titulo">Confirmar</h3>
                <p id="gochi-confirm-mensaje"></p>
                <div class="gochi-modal-actions">
                    <button id="gochi-confirm-cancelar" class="btn-primary btn-muted">Cancelar</button>
                    <button id="gochi-confirm-confirmar" class="btn-primary">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    insertarPanelAdminGlobal();
};

window.mostrarToast = function mostrarToast(mensaje, esError = false) {
    const store = window.Alpine?.store('toast');
    if (!store) return;
    store.mostrar(mensaje, esError);
};

// Aviso de puntos ganados por una acción (chat, muro, like, reacción...).
window.avisarPuntos = function avisarPuntos(ganados) {
    const n = Number(ganados) || 0;
    if (n <= 0) return;
    window.mostrarToast('+' + n + ' pts');
    window.refrescarPuntosDia?.();
};

// === Píldora de puntos diarios del navbar ===
function animarSumaPuntos(btn, delta) {
    if (!btn || delta <= 0) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    btn.classList.remove('nav-puntos-dia--suma');
    // reinicia la animación de pulso
    void btn.offsetWidth;
    btn.classList.add('nav-puntos-dia--suma');
    const globo = btn.querySelector('.nav-puntos-suma');
    if (globo) {
        globo.textContent = '+' + delta;
        globo.classList.remove('nav-puntos-suma--viva');
        void globo.offsetWidth;
        globo.classList.add('nav-puntos-suma--viva');
    }
    setTimeout(() => btn.classList.remove('nav-puntos-dia--suma'), 700);
}

window.pintarPuntosDia = function pintarPuntosDia(datos) {
    const btn = document.getElementById('nav-puntos-dia');
    if (!btn) return;
    const token = localStorage.getItem('comunidad_session_token');
    if (!token) {
        btn.hidden = true;
        delete btn.dataset.hoy;
        return;
    }
    const hoy = Math.max(0, Number(datos?.hoy) || 0);
    const tope = Math.max(1, Number(datos?.tope) || 60);
    const elHoy = document.getElementById('nav-puntos-hoy');
    const elTope = document.getElementById('nav-puntos-tope');
    if (elHoy) elHoy.textContent = hoy;
    if (elTope) elTope.textContent = tope;
    const previo = Number(btn.dataset.hoy ?? '-1');
    const alcanzoTope = hoy >= tope && previo < tope;
    btn.style.setProperty('--p', Math.min(100, Math.round((hoy / tope) * 100)) + '%');
    btn.classList.toggle('nav-puntos-dia--completo', hoy >= tope);
    btn.hidden = false;
    btn.title = 'Hoy: ' + hoy + ' / ' + tope + ' pts';
    btn.setAttribute('aria-label', 'Puntos de hoy: ' + hoy + ' de ' + tope);
    if (alcanzoTope) {
        btn.classList.remove('nav-puntos-dia--remate');
        void btn.offsetWidth;
        btn.classList.add('nav-puntos-dia--remate');
        setTimeout(() => btn.classList.remove('nav-puntos-dia--remate'), 1000);
    }
    if (previo >= 0 && hoy > previo) animarSumaPuntos(btn, hoy - previo);
    btn.dataset.hoy = String(hoy);
};

window.refrescarPuntosDia = async function refrescarPuntosDia() {
    const btn = document.getElementById('nav-puntos-dia');
    const token = localStorage.getItem('comunidad_session_token');
    if (!token) {
        if (btn) btn.hidden = true;
        return;
    }
    if (!window.supabase) return;
    try {
        const { data, error } = await window.supabase.rpc('obtener_puntos_hoy', { p_token: token });
        if (error) throw error;
        if (data && data.ok) window.pintarPuntosDia(data);
    } catch (e) {
        console.warn('No se pudieron cargar los puntos del día:', e?.message || e);
    }
};

// Puntos por tiempo conectado en todas las páginas menos Comunidad
// (Comunidad ya tiene su propio planificador y el servidor aplica el cooldown).
window.iniciarPuntosGlobal = function iniciarPuntosGlobal() {
    if (document.body.classList.contains('comunidad-page')) return;
    if (!window.supabase) return;
    let ultimo = 0;
    const tick = () => {
        const token = localStorage.getItem('comunidad_session_token');
        if (!token || document.hidden) return;
        if (Date.now() - ultimo < 60000) return;
        ultimo = Date.now();
        window.supabase.rpc('incrementar_puntos_comunidad', { p_token: token })
            .then(() => window.refrescarPuntosDia?.())
            .catch(() => {});
    };
    setInterval(tick, 300000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    tick();
    window.refrescarPuntosDia?.();
};

window.mostrarConfirmacionModal = function mostrarConfirmacionModal({ titulo, mensaje, textoConfirmar = 'Confirmar', enConfirmar }) {
    const modal = document.getElementById('gochi-confirm-modal');
    if (!modal) return;
    const titEl = document.getElementById('gochi-confirm-titulo');
    const msgEl = document.getElementById('gochi-confirm-mensaje');
    const btnConf = document.getElementById('gochi-confirm-confirmar');
    const btnCanc = document.getElementById('gochi-confirm-cancelar');
    if (titEl) titEl.textContent = titulo || 'Confirmar';
    if (msgEl) msgEl.textContent = mensaje || '';
    if (btnConf) btnConf.textContent = textoConfirmar;

    const onConfirm = () => {
        if (typeof enConfirmar === 'function') enConfirmar();
        cerrarConfirmModal();
    };

    modal.style.display = 'flex';
    btnConf.onclick = null;
    btnCanc.onclick = null;
    btnConf.onclick = onConfirm;
    btnCanc.onclick = cerrarConfirmModal;
    window.activarTrampaFoco(modal, btnCanc);
};

function cerrarConfirmModal() {
    const modal = document.getElementById('gochi-confirm-modal');
    if (modal) modal.style.display = 'none';
    window.desactivarTrampaFoco();
}

// Cierra con Escape o clic en el fondo cualquier modal visible que tenga un botón de cierre.
function cerrarModalVisible() {
    const modal = [...document.querySelectorAll('.gochi-modal-overlay')]
        .find((elemento) => getComputedStyle(elemento).display !== 'none');
    if (!modal) return false;

    const botonCerrar = modal.querySelector('[data-action="close-login"], #gochi-confirm-cancelar');
    if (!botonCerrar) return false;

    botonCerrar.click();
    return true;
}

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarModalVisible();
});

// === MENÚ MÓVIL ===

// Estado global de UI (menú móvil) para Alpine.
document.addEventListener('alpine:init', () => {
    window.Alpine.store('ui', { menuAbierto: false });
    window.Alpine.store('toast', {
        visible: false,
        mensaje: '',
        esError: false,
        _timer: null,
        mostrar(mensaje, esError = false) {
            clearTimeout(this._timer);
            this.mensaje = String(mensaje ?? '');
            this.esError = !!esError;
            this.visible = true;
            this._timer = setTimeout(() => { this.visible = false; }, 3000);
        },
        ocultar() {
            clearTimeout(this._timer);
            this.visible = false;
        }
    });
});

window.cerrarMenuMovil = function cerrarMenuMovil(devolverFoco = false) {
    const btn = document.querySelector('.mobile-menu-toggle-btn');
    const menu = document.querySelector('.nav-links');
    const ui = window.Alpine?.store('ui');
    if (ui) ui.menuAbierto = false;
    if (!btn || !menu) return;
    menu.classList.remove('mobile-active');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
    if (devolverFoco) btn.focus();
};

window.inicializarMenuMovil = function inicializarMenuMovil() {
    const btn = document.querySelector('.mobile-menu-toggle-btn');
    const navLinks = document.querySelector('.nav-links');
    if (!btn || !navLinks) return;

    if (!navLinks.id) navLinks.id = 'nav-menu-principal';
    btn.setAttribute('aria-controls', navLinks.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');

    btn.onclick = null;

    if (window.escapeMenuMovilRegistrado) return;
    window.escapeMenuMovilRegistrado = true;

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const menu = document.querySelector('.nav-links');
        if (!menu || !menu.classList.contains('mobile-active')) return;
        window.cerrarMenuMovil(true);
    });

    // Al rotar o ampliar la pantalla el menú móvil no debe quedar abierto.
    // 1101px debe coincidir con el breakpoint de .nav-links en style.css.
    const escritorio = window.matchMedia('(min-width: 1101px)');
    const alCambiar = (e) => {
        if (e.matches) window.cerrarMenuMovil(false);
    };
    if (escritorio.addEventListener) escritorio.addEventListener('change', alCambiar);
    else escritorio.addListener(alCambiar);
};

// Prevenir navegación/recarga cuando el enlace apunta a la página actual (sin hash)
window.inicializarNavLinks = function inicializarNavLinks() {
    const path = window.location.pathname;
    const normalizarPath = p => p.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.includes('#')) return;
        const linkUrl = new URL(href, window.location.origin + window.location.pathname).pathname;
        if (normalizarPath(linkUrl) === normalizarPath(path)) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
            });
            link.setAttribute('aria-current', 'page');
        }
        // Cerrar menú móvil tras clickear un enlace
        link.addEventListener('click', () => {
            window.cerrarMenuMovil?.(false);
        });
    });
};

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
}

// === POLLING DE ESTADO DEL STREAM ===
window._streamInterval = null;
window._ultimaEstadoEnVivo = null;
window._streamBackoff = null;
window._streamUltimoError = 0;

window.verificarEstadoStream = async function verificarEstadoStream() {
    if (window._streamAbort) window._streamAbort.abort();
    window._streamAbort = new AbortController();

    // Backoff: si falló hace poco, esperar el intervalo de retroceso antes de reintentar
    if (window._streamBackoff && Date.now() - window._streamUltimoError < window._streamBackoff) {
        return;
    }

    const ahora = Date.now();
    let data = null;
    let enVivo = false;
    let usoCache = false;

    try {
        const cached = sessionStorage.getItem('gochi_stream_cache');
        if (cached) {
            const c = JSON.parse(cached);
            if (c && c.ts && ahora - c.ts < 60000) {
                data = c.data;
                enVivo = c.enVivo;
                usoCache = true;
            }
        }
    } catch (e) {
        // ignora caché corrupta
    }

    if (!usoCache) {
        try {
            const response = await fetch('https://kick.com/api/v2/channels/lagochagaming', { signal: window._streamAbort.signal });
            if (response.status === 429 || response.status >= 500) {
                throw new Error('HTTP ' + response.status);
            }
            if (!response.ok) throw new Error('Error');
            data = await response.json();
            enVivo = data.livestream && data.livestream.is_live === true;
            try {
                sessionStorage.setItem('gochi_stream_cache', JSON.stringify({ data, enVivo, ts: ahora }));
            } catch (e) {}
            window._streamBackoff = null;
        } catch (err) {
            if (err && err.name === 'AbortError') return;
            console.error('Error verificando estado:', err);
            window._streamUltimoError = Date.now();
            if (!window._streamBackoff) window._streamBackoff = 60000;
            else if (window._streamBackoff < 300000) {
                window._streamBackoff = Math.min(window._streamBackoff * 2, 300000);
            }
            if (typeof window.actualizarEstadoStreamPagina === 'function') {
                window.actualizarEstadoStreamPagina(null, false, err);
            }
            return;
        }
    }

    const navbar = document.querySelector('.navbar');
    const liveTag = document.getElementById('nav-live-tag');

    // Actualizar contador de followers si existe (solo en index.html)
    const followersCount = data.followers_count ?? data.channel?.followers_count ?? data.user?.followers_count;
    const followersEl = document.getElementById('kick-followers-count');
    if (followersEl && followersCount !== undefined) {
        followersEl.textContent = formatNumber(followersCount);
        followersEl.title = followersCount.toLocaleString('es-ES') + ' seguidores';
    }

    if (enVivo) {
        if (navbar) navbar.classList.add('live-glow');
        if (liveTag) liveTag.hidden = false;
    } else {
        if (navbar) navbar.classList.remove('live-glow');
        if (liveTag) liveTag.hidden = true;
    }

    if (typeof window.actualizarEspectadoresKick === 'function') {
        window.actualizarEspectadoresKick(enVivo ? data?.livestream?.viewer_count : 0, enVivo);
    }

    // Notificar a la página actual (paneles específicos) sin duplicar el fetch
    if (typeof window.actualizarEstadoStreamPagina === 'function') {
        window.actualizarEstadoStreamPagina(data, enVivo, null);
    }

    window._ultimaEstadoEnVivo = enVivo;
};

// Inicializar polling en todas las páginas
function iniciarPollingStreamGlobal() {
    // Verificar estado al cargar
    setTimeout(() => {
        if (document.visibilityState === 'visible') {
            verificarEstadoStream();
        }
    }, 500);

    // Polling cada 90s
    if (window._streamInterval) clearInterval(window._streamInterval);
    window._streamInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            verificarEstadoStream();
        }
    }, 90000);

    // Pausar cuando pestaña oculta
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            verificarEstadoStream();
            if (!window._streamInterval) {
                window._streamInterval = setInterval(() => {
                    if (document.visibilityState === 'visible') {
                        verificarEstadoStream();
                    }
                }, 90000);
            }
        } else {
            if (window._streamInterval) {
                clearInterval(window._streamInterval);
                window._streamInterval = null;
            }
            if (window._streamAbort) {
                window._streamAbort.abort();
                window._streamAbort = null;
            }
        }
    });
}

// Delegación única: cierre de los modales por clic en el fondo.
document.addEventListener('click', (event) => {
    if (!event.target.classList.contains('gochi-modal-overlay')) return;

    const botonCerrar = event.target.querySelector('[data-action="close-login"], #gochi-confirm-cancelar');
    if (botonCerrar) botonCerrar.click();
});

window.sincronizarSesionComunidadVinculada = async function sincronizarSesionComunidadVinculada() {
    if (!window.supabase) return false;
    if (localStorage.getItem('comunidad_logout_explicito') === '1') return false;
    if (localStorage.getItem('comunidad_session_token')) return false;
    try {
        const { data: authData } = await window.supabase.auth.getSession();
        if (!authData || !authData.session) return false;
        if (localStorage.getItem('comunidad_logout_explicito') === '1') return false;
        const { data, error } = await window.supabase.rpc('sesion_comunidad_vinculada');
        if (error || !data || !data.ok || !data.token) return false;
        if (localStorage.getItem('comunidad_logout_explicito') === '1') return false;
        const val = await window.supabase.rpc('validar_sesion_comunidad', { p_token: data.token });
        if (val.error || !val.data || !val.data.ok) return false;
        if (localStorage.getItem('comunidad_logout_explicito') === '1') return false;
        const usuario = val.data.usuario;
        localStorage.setItem('comunidad_session_token', data.token);
        localStorage.setItem('comunidad_nickname', usuario.apodo);
        localStorage.setItem('comunidad_user_id', String(usuario.id));
        localStorage.setItem('comunidad_session_usuario', JSON.stringify(usuario));
        window.actualizarUsuarioNavComunidad?.();
        window.latidoComunidad?.();
        return true;
    } catch (e) {
        return false;
    }
};

function insertarAccesoAdminFooter() {
    document.querySelectorAll('.footer-copyright').forEach((p) => {
        if (p.querySelector('.footer-admin-link')) return;
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'footer-admin-link';
        boton.title = 'Acceso de administración';
        boton.innerHTML = '<svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-lock"></use></svg> Acceso';
        boton.addEventListener('click', () => window.abrirAdminPanel('login'));
        p.appendChild(document.createTextNode(' · '));
        p.appendChild(boton);
    });
}

// === PANEL GLOBAL DE ADMINISTRACIÓN (modal, sin página aparte) ===
window.abrirAdminPanel = function abrirAdminPanel(tab) {
    const abrir = () => {
        const store = window.Alpine && window.Alpine.store ? window.Alpine.store('adminPanel') : null;
        if (store) store.abrir(tab || 'login');
    };
    if (window.Alpine) abrir();
    else document.addEventListener('alpine:init', abrir, { once: true });
};

function insertarPanelAdminGlobal() {
    if (document.getElementById('admin-global-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'admin-global-modal';
    modal.className = 'admin-global-modal';
    modal.setAttribute('x-data', '{ }');
    modal.setAttribute('x-show', '$store.adminPanel.abierto');
    modal.setAttribute('x-cloak', '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'admin-global-title');
    modal.setAttribute('x-on:keydown.escape.window', '$store.adminPanel.cerrar()');
    modal.innerHTML = `
        <div class="admin-global-backdrop" x-on:click="$store.adminPanel.cerrar()"></div>
        <div class="admin-global-card" x-trap.noscroll="$store.adminPanel.abierto">
            <header class="admin-global-head">
                <div>
                    <h2 id="admin-global-title">Administración</h2>
                    <p class="admin-page-sub" x-text="$store.adminPanel.sesion ? ('Sesión: ' + $store.adminPanel.email + ($store.adminPanel.owner ? ' · Owner' : ' · Admin')) : 'Acceso de administración'"></p>
                </div>
                <button type="button" class="admin-global-close" x-on:click="$store.adminPanel.cerrar()" aria-label="Cerrar panel">&times;</button>
            </header>

            <p class="gallery-empty" x-show="$store.adminPanel.cargando">Comprobando sesión...</p>

            <template x-if="!$store.adminPanel.cargando && !$store.adminPanel.sesion">
                <div class="admin-login-card">
                    <p>Este panel usa tu cuenta de la comunidad. Entra desde el menú <strong>Login</strong> con una cuenta con rol de administración.</p>
                    <button type="button" class="btn-admin-mode" x-on:click="$store.adminPanel.cerrar(); window.abrirLoginMenu?.('login')">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-right-to-bracket"></use></svg>
                        <span>Abrir login</span>
                    </button>
                </div>
            </template>

            <template x-if="!$store.adminPanel.cargando && $store.adminPanel.sesion && !$store.adminPanel.admin">
                <div class="admin-login-card">
                    <h3><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-ban"></use></svg> Sin permisos</h3>
                    <p>Esta cuenta de la comunidad no tiene rol de administración.</p>
                    <p class="admin-login-email" x-text="$store.adminPanel.email"></p>
                    <button type="button" class="btn-admin-mode" x-on:click="$store.adminPanel.cerrar()">Cerrar panel</button>
                </div>
            </template>

            <div x-show="!$store.adminPanel.cargando && $store.adminPanel.admin">

                <div class="admin-tabs" role="tablist" aria-label="Paneles de administración">
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'buzon' }" x-on:click="$store.adminPanel.setTab('buzon')" role="tab" :aria-selected="$store.adminPanel.tab === 'buzon' ? 'true' : 'false'" x-show="$store.adminPanel.admin">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-envelope"></use></svg> Buzón
                        <span class="admin-tab-count" x-show="$store.adminPanel.noLeidas > 0" x-text="$store.adminPanel.noLeidas"></span>
                    </button>
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'usuarios' }" x-on:click="$store.adminPanel.setTab('usuarios')" role="tab" :aria-selected="$store.adminPanel.tab === 'usuarios' ? 'true' : 'false'">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-users"></use></svg> Usuarios
                    </button>
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'descargas' }" x-on:click="$store.adminPanel.setTab('descargas')" role="tab" :aria-selected="$store.adminPanel.tab === 'descargas' ? 'true' : 'false'">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-brands-android"></use></svg> Descargas
                    </button>
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'auditoria' }" x-on:click="$store.adminPanel.setTab('auditoria')" role="tab" :aria-selected="$store.adminPanel.tab === 'auditoria' ? 'true' : 'false'">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-shield-halved"></use></svg> Auditoría
                    </button>
                </div>

                <div class="admin-tab-panel" x-show="$store.adminPanel.tab === 'buzon' && $store.adminPanel.admin" x-cloak>
                    <div class="buzon-toolbar">
                        <h2><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-envelope"></use></svg> Sugerencias de la comunidad</h2>
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarSugerencias()" :disabled="$store.adminPanel.sugEstado === 'cargando'">Actualizar</button>
                    </div>
                    <p class="gallery-empty" x-show="$store.adminPanel.sugEstado === 'cargando'">Cargando sugerencias...</p>
                    <p class="gallery-empty" x-show="$store.adminPanel.sugEstado === 'error'" x-text="$store.adminPanel.errorSug" x-cloak></p>
                    <div class="buzon-lista" x-show="$store.adminPanel.sugEstado === 'lista'">
                        <template x-for="s in $store.adminPanel.sugerencias" :key="s.id">
                            <article class="buzon-item" :class="{ 'no-leida': !s.leida }">
                                <div class="buzon-item-head">
                                    <span class="buzon-estado" x-text="s.leida ? 'Leída' : 'Nueva'"></span>
                                    <time class="buzon-fecha" :datetime="s.creada_en" x-text="$store.adminPanel.fecha(s.creada_en)"></time>
                                </div>
                                <p class="buzon-texto" x-text="s.texto"></p>
                                <div class="buzon-acciones">
                                    <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.marcarSugerencia(s, !s.leida)" x-text="s.leida ? 'Marcar como nueva' : 'Marcar leída'"></button>
                                    <button type="button" class="btn-admin-pag btn-peligro" x-on:click="$store.adminPanel.eliminarSugerencia(s)">Borrar</button>
                                </div>
                            </article>
                        </template>
                        <p class="gallery-empty" x-show="!$store.adminPanel.sugerencias.length">El buzón está vacío. 🎉</p>
                    </div>
                </div>

                <div class="admin-tab-panel" x-show="$store.adminPanel.tab === 'usuarios'" x-cloak>
                    <div class="admin-usuarios-toolbar">
                        <input type="text" class="admin-input" placeholder="Buscar por apodo..." aria-label="Buscar usuario" x-model="$store.adminPanel.buscar" x-on:keydown.enter="$store.adminPanel.cargarUsuarios(0)">
                        <label class="admin-checkbox">
                            <input type="checkbox" x-model="$store.adminPanel.soloBaneados" x-on:change="$store.adminPanel.cargarUsuarios(0)">
                            <span>Solo baneados</span>
                        </label>
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarUsuarios(0)">Buscar</button>
                    </div>
                    <p class="gallery-empty" x-show="$store.adminPanel.usuariosEstado === 'cargando'">Cargando usuarios...</p>
                    <p class="gallery-empty" x-show="$store.adminPanel.usuariosEstado === 'error'" x-text="$store.adminPanel.errorUsuarios" x-cloak></p>
                    <div class="admin-usuarios-grid" x-show="$store.adminPanel.usuariosEstado === 'lista'">
                        <template x-for="u in $store.adminPanel.usuarios" :key="u.id">
                            <div class="admin-usuario-card" :class="{ baneado: u.baneado_activo, shadowban: u.shadowban }">
                                <div class="admin-usuario-info">
                                    <span class="admin-usuario-avatar" x-text="(u.apodo || '?').charAt(0).toUpperCase()"></span>
                                    <div class="admin-usuario-datos">
                                        <span class="admin-usuario-apodo" x-text="u.apodo"></span>
                                        <span class="admin-usuario-meta">
                                            <span x-text="u.puntos + ' pts'"></span>
                                            <span class="rango-badge" :class="'rango-' + window.claveRango(u.rango, u.puntos)" x-text="window.etiquetaRango(u.rango, u.puntos)"></span>
                                        </span>
                                        <span class="admin-usuario-online" :class="{ online: u.en_linea }"
                                              :title="u.en_linea ? 'En línea ahora' : (u.ultima_actividad ? 'Última actividad: ' + $store.adminPanel.fecha(u.ultima_actividad) : 'Sin actividad reciente')">
                                            <span class="admin-online-dot" aria-hidden="true"></span>
                                            <span x-text="u.en_linea ? 'En línea' : 'Offline'"></span>
                                        </span>
                                    </div>
                                </div>
                                <div class="admin-usuario-estado">
                                    <span class="estado-badge" :class="{ activo: !u.baneado_activo && !u.shadowban, baneado: u.baneado_activo, shadowban: u.shadowban }"
                                          x-text="u.baneado_activo ? '🔴 Baneado' : (u.shadowban ? '🟡 Shadowban' : 'Sin sanción')"></span>
                                    <template x-if="u.baneado_hasta && u.baneado_activo">
                                        <span class="ban-hasta" x-text="'Hasta: ' + $store.adminPanel.fecha(u.baneado_hasta)"></span>
                                    </template>
                                </div>
                                <div class="admin-usuario-acciones">
                                    <button type="button" class="btn-admin-accion btn-ban" x-on:click="$store.adminPanel.toggleBan(u)" x-text="u.baneado_activo ? 'Desbanear' : 'Banear'"></button>
                                    <button type="button" class="btn-admin-accion btn-shadowban" x-on:click="$store.adminPanel.toggleShadowban(u)" x-text="u.shadowban ? 'Quitar Shadowban' : 'Shadowban'"></button>
                                </div>
                            </div>
                        </template>
                        <p class="gallery-empty" x-show="!$store.adminPanel.usuarios.length">No hay usuarios.</p>
                    </div>
                    <div class="admin-paginacion" x-show="$store.adminPanel.totalUsuarios > 50">
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarUsuarios(-1)" :disabled="$store.adminPanel.paginaUsuarios === 0">← Anterior</button>
                        <span class="pag-info" x-text="'Página ' + ($store.adminPanel.paginaUsuarios + 1) + ' de ' + Math.ceil($store.adminPanel.totalUsuarios / 50)"></span>
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarUsuarios(1)" :disabled="($store.adminPanel.paginaUsuarios + 1) * 50 >= $store.adminPanel.totalUsuarios">Siguiente →</button>
                    </div>
                </div>

                <div class="admin-tab-panel" x-show="$store.adminPanel.tab === 'descargas'" x-cloak>
                    <div class="buzon-toolbar">
                        <h2><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-brands-android"></use></svg> Descargas de la app</h2>
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarDescargas()" :disabled="$store.adminPanel.descEstado === 'cargando'">Actualizar</button>
                    </div>
                    <p class="gallery-empty" x-show="$store.adminPanel.descEstado === 'cargando'">Cargando descargas...</p>
                    <p class="gallery-empty" x-show="$store.adminPanel.descEstado === 'error'" x-text="$store.adminPanel.errorDesc" x-cloak></p>
                    <div x-show="$store.adminPanel.descEstado === 'lista'" x-cloak>
                        <div class="desc-stats">
                            <div class="desc-stat">
                                <span class="desc-stat-num" x-text="$store.adminPanel.descargas.total ?? 0"></span>
                                <span class="desc-stat-label">Totales</span>
                            </div>
                            <div class="desc-stat">
                                <span class="desc-stat-num" x-text="$store.adminPanel.descargas.unicos ?? 0"></span>
                                <span class="desc-stat-label">Únicas</span>
                            </div>
                            <div class="desc-stat">
                                <span class="desc-stat-num" x-text="$store.adminPanel.descargas.hoy ?? 0"></span>
                                <span class="desc-stat-label">Hoy</span>
                            </div>
                            <div class="desc-stat">
                                <span class="desc-stat-num" x-text="$store.adminPanel.descargas.ultimos7 ?? 0"></span>
                                <span class="desc-stat-label">7 días</span>
                            </div>
                            <div class="desc-stat">
                                <span class="desc-stat-num" x-text="$store.adminPanel.descargas.ultimos30 ?? 0"></span>
                                <span class="desc-stat-label">30 días</span>
                            </div>
                        </div>

                        <div class="desc-columnas">
                            <div class="desc-bloque">
                                <h3>Por versión</h3>
                                <template x-for="v in ($store.adminPanel.descargas.porVersion || [])" :key="'v-' + v.version">
                                    <div class="desc-fila">
                                        <span x-text="v.version || 'sin versión'"></span>
                                        <strong x-text="v.total"></strong>
                                    </div>
                                </template>
                                <p class="gallery-empty" x-show="!($store.adminPanel.descargas.porVersion || []).length">Sin datos.</p>
                            </div>
                            <div class="desc-bloque">
                                <h3>Por origen</h3>
                                <template x-for="o in ($store.adminPanel.descargas.porOrigen || [])" :key="'o-' + o.origen">
                                    <div class="desc-fila">
                                        <span x-text="o.origen"></span>
                                        <strong x-text="o.total"></strong>
                                    </div>
                                </template>
                                <p class="gallery-empty" x-show="!($store.adminPanel.descargas.porOrigen || []).length">Sin datos.</p>
                            </div>
                        </div>

                        <div class="desc-bloque">
                            <h3>Últimos 14 días</h3>
                            <div class="desc-barras">
                                <template x-for="d in ($store.adminPanel.descargas.porDia || [])" :key="'d-' + d.dia">
                                    <div class="desc-barra" :title="d.dia + ': ' + d.total">
                                        <span class="desc-barra-valor" x-text="d.total"></span>
                                        <span class="desc-barra-tubo">
                                            <span class="desc-barra-relleno" :style="'height:' + $store.adminPanel.alturaBarra(d.total) + '%'"></span>
                                        </span>
                                        <span class="desc-barra-dia" x-text="$store.adminPanel.diaCorto(d.dia)"></span>
                                    </div>
                                </template>
                            </div>
                            <p class="gallery-empty" x-show="!($store.adminPanel.descargas.porDia || []).length">Sin datos.</p>
                        </div>

                        <div class="desc-bloque">
                            <h3>Últimas descargas</h3>
                            <div class="desc-lista">
                                <template x-for="(d, i) in ($store.adminPanel.descargas.ultimas || [])" :key="'u-' + i">
                                    <div class="desc-fila">
                                        <span x-text="$store.adminPanel.fecha(d.creada_en)"></span>
                                        <span class="desc-etiqueta" x-text="(d.version || '?') + ' · ' + (d.origen || 'web')"></span>
                                    </div>
                                </template>
                                <p class="gallery-empty" x-show="!($store.adminPanel.descargas.ultimas || []).length">Sin datos.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="admin-tab-panel" x-show="$store.adminPanel.tab === 'auditoria'" x-cloak>
                    <p class="gallery-empty" x-show="$store.adminPanel.auditEstado === 'cargando'">Cargando auditoría...</p>
                    <p class="gallery-empty" x-show="$store.adminPanel.auditEstado === 'error'" x-text="$store.adminPanel.errorAudit" x-cloak></p>
                    <div class="admin-auditoria-lista" x-show="$store.adminPanel.auditEstado === 'lista'">
                        <template x-for="a in $store.adminPanel.auditLog" :key="a.id">
                            <div class="auditoria-item">
                                <div class="auditoria-accion" x-text="a.accion"></div>
                                <div class="auditoria-detalle" x-html="$store.adminPanel.formatearDetalle(a.detalle)"></div>
                                <div class="auditoria-meta">
                                    <span x-text="a.admin_apodo || 'Sistema'"></span>
                                    <span x-text="$store.adminPanel.fecha(a.created_at)"></span>
                                </div>
                            </div>
                        </template>
                        <p class="gallery-empty" x-show="!$store.adminPanel.auditLog.length">Sin registros de auditoría.</p>
                    </div>
                    <div class="admin-paginacion" x-show="$store.adminPanel.totalAudit > 50">
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarAuditoria(-1)" :disabled="$store.adminPanel.paginaAudit === 0">← Anterior</button>
                        <span class="pag-info" x-text="'Página ' + ($store.adminPanel.paginaAudit + 1) + ' de ' + Math.ceil($store.adminPanel.totalAudit / 50)"></span>
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarAuditoria(1)" :disabled="($store.adminPanel.paginaAudit + 1) * 50 >= $store.adminPanel.totalAudit">Siguiente →</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

document.addEventListener('alpine:init', () => {
    window.Alpine.store('adminPanel', {
        abierto: false,
        cargando: false,
        sesion: false,
        admin: false,
        owner: false,
        email: '',
        tab: 'usuarios',

        loginError: '',

        usuarios: [],
        usuariosEstado: 'inicial',
        errorUsuarios: '',
        totalUsuarios: 0,
        paginaUsuarios: 0,
        buscar: '',
        soloBaneados: false,
        _refrescoUsuarios: null,

        auditLog: [],
        auditEstado: 'inicial',
        errorAudit: '',
        totalAudit: 0,
        paginaAudit: 0,

        sugerencias: [],
        sugEstado: 'inicial',
        errorSug: '',
        noLeidas: 0,

        descargas: {},
        descEstado: 'inicial',
        errorDesc: '',

        fecha(valor) {
            if (!valor) return '';
            const d = new Date(valor);
            return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-ES');
        },

        formatearDetalle(detalle) {
            if (!detalle) return '<em>Sin detalles</em>';
            try {
                const d = typeof detalle === 'string' ? JSON.parse(detalle) : detalle;
                return '<pre class="audit-detalle-pre">' + window.escapeHtml(JSON.stringify(d, null, 2)) + '</pre>';
            } catch (e) {
                return '<em>Detalle no válido</em>';
            }
        },

        async abrir(tab) {
            this.abierto = true;
            this.loginError = '';
            await this.comprobarSesion();
            if (this.admin) {
                const pedida = (!tab || tab === 'login')
                    ? 'buzon'
                    : tab;
                this.tab = pedida;
                await this.cargarTab();
                this.iniciarRefrescoUsuarios();
            }
        },

        cerrar() {
            this.abierto = false;
            if (this._refrescoUsuarios) {
                clearInterval(this._refrescoUsuarios);
                this._refrescoUsuarios = null;
            }
        },

        iniciarRefrescoUsuarios() {
            if (this._refrescoUsuarios) return;
            this._refrescoUsuarios = setInterval(() => {
                if (!this.abierto || !this.admin || this.tab !== 'usuarios' || this.usuariosEstado === 'cargando') return;
                this.cargarUsuarios(0, true);
            }, 30000);
        },

        async comprobarSesion() {
            this.cargando = true;
            this.loginError = '';
            if (!window.supabase) {
                this.cargando = false;
                this.loginError = 'Supabase no está disponible. Recarga la página.';
                return;
            }
            const token = localStorage.getItem('comunidad_session_token');
            this.sesion = !!token;
            const usuario = window.obtenerSesionUsuarioComunidad?.() || {};
            this.email = usuario.apodo || '';
            if (!token) {
                this.cargando = false;
                return;
            }
            try {
                const [adminRes, ownerRes] = await Promise.all([
                    window.supabase.rpc('es_admin'),
                    window.supabase.rpc('es_owner')
                ]);
                this.admin = adminRes && adminRes.data === true;
                this.owner = ownerRes && ownerRes.data === true;
                this.cargando = false;
            } catch (e) {
                console.error('Error comprobando sesión admin:', e);
                this.cargando = false;
                this.loginError = 'No se pudo comprobar la sesión.';
            }
        },

        setTab(tab) {
            if (tab === 'buzon' && !this.admin) return;
            this.tab = tab;
            this.cargarTab();
        },

        cargarTab() {
            if (this.tab === 'buzon') return this.cargarSugerencias();
            if (this.tab === 'usuarios') return this.cargarUsuarios(0);
            if (this.tab === 'descargas') return this.cargarDescargas();
            if (this.tab === 'auditoria') return this.cargarAuditoria(0);
        },

        tokenComunidad() {
            return localStorage.getItem('comunidad_session_token') || '';
        },

        async cargarSugerencias() {
            if (!this.admin) return;
            this.sugEstado = 'cargando';
            this.errorSug = '';
            try {
                const { data, error } = await window.supabase
                    .from('sugerencias')
                    .select('id,texto,leida,creada_en')
                    .order('creada_en', { ascending: false })
                    .limit(200);
                if (error) throw error;
                this.sugerencias = data || [];
                this.noLeidas = this.sugerencias.filter(s => !s.leida).length;
                this.sugEstado = 'lista';
            } catch (e) {
                console.error('Error cargando sugerencias:', e);
                this.errorSug = 'No se pudieron cargar las sugerencias.';
                this.sugEstado = 'error';
            }
        },

        async marcarSugerencia(sugerencia, leida) {
            try {
                const { data, error } = await window.supabase.rpc('owner_marcar_sugerencia', {
                    p_id: sugerencia.id,
                    p_leida: leida
                });
                if (error || !data || !data.ok) {
                    window.mostrarToast?.('No se pudo actualizar la sugerencia.', true);
                    return;
                }
                sugerencia.leida = leida;
                this.noLeidas = this.sugerencias.filter(s => !s.leida).length;
            } catch (e) {
                window.mostrarToast?.('No se pudo actualizar la sugerencia.', true);
            }
        },

        async eliminarSugerencia(sugerencia) {
            if (!window.confirm('¿Borrar esta sugerencia definitivamente?')) return;
            try {
                const { data, error } = await window.supabase.rpc('owner_eliminar_sugerencia', { p_id: sugerencia.id });
                if (error || !data || !data.ok) {
                    window.mostrarToast?.('No se pudo borrar la sugerencia.', true);
                    return;
                }
                this.sugerencias = this.sugerencias.filter(s => s.id !== sugerencia.id);
                this.noLeidas = this.sugerencias.filter(s => !s.leida).length;
                window.mostrarToast?.('Sugerencia borrada');
            } catch (e) {
                window.mostrarToast?.('No se pudo borrar la sugerencia.', true);
            }
        },

        async cargarDescargas() {
            if (!this.admin) return;
            this.descEstado = 'cargando';
            this.errorDesc = '';
            try {
                const { data, error } = await window.supabase.rpc('app_descargas_stats', {
                    p_token: this.tokenComunidad()
                });
                if (error) throw error;
                if (!data || data.ok === false) {
                    this.errorDesc = data?.error || 'No se pudieron cargar las descargas.';
                    this.descEstado = 'error';
                    return;
                }
                this.descargas = data;
                this.descEstado = 'lista';
            } catch (e) {
                console.error('Error cargando descargas:', e);
                this.errorDesc = 'No se pudieron cargar las descargas.';
                this.descEstado = 'error';
            }
        },

        alturaBarra(total) {
            const dias = this.descargas?.porDia || [];
            const maximo = Math.max(1, ...dias.map(d => Number(d.total) || 0));
            const valor = Number(total) || 0;
            return Math.max(valor > 0 ? 6 : 0, Math.round((valor / maximo) * 100));
        },

        diaCorto(dia) {
            if (!dia) return '';
            const partes = String(dia).split('-');
            return partes.length === 3 ? partes[2] + '/' + partes[1] : String(dia);
        },

        async cargarUsuarios(delta, mantenerPagina = false) {
            const nueva = Math.max(0, (this.paginaUsuarios || 0) + Number(delta || 0));
            if (delta === 0) {
                if (!mantenerPagina) this.paginaUsuarios = 0;
            } else if (nueva === this.paginaUsuarios) return;
            else this.paginaUsuarios = nueva;

            this.usuariosEstado = 'cargando';
            this.errorUsuarios = '';
            try {
                const { data, error } = await window.supabase.rpc('admin_listar_usuarios', {
                    p_token: this.tokenComunidad(),
                    p_buscar: this.buscar.trim() || null,
                    p_solo_baneados: !!this.soloBaneados,
                    p_limite: 50,
                    p_offset: this.paginaUsuarios * 50
                });
                if (error) throw error;
                if (!data || !data.ok) {
                    this.errorUsuarios = data?.error || 'Error cargando usuarios';
                    this.usuariosEstado = 'error';
                    return;
                }
                this.usuarios = data.usuarios || [];
                this.totalUsuarios = data.total || 0;
                this.usuariosEstado = 'lista';
            } catch (e) {
                console.error('Error cargando usuarios admin:', e);
                this.errorUsuarios = 'Error inesperado';
                this.usuariosEstado = 'error';
            }
        },

        async toggleBan(usuario) {
            const estaBaneado = !!usuario.baneado_activo;
            try {
                const { data, error } = await window.supabase.rpc('admin_ban_usuario', {
                    p_token: this.tokenComunidad(),
                    p_usuario_id: usuario.id,
                    p_duracion_minutos: estaBaneado ? null : 60 * 24 * 7,
                    p_motivo: estaBaneado ? 'Desbaneado por admin' : 'Baneado por admin'
                });
                if (error || !data || !data.ok) {
                    window.mostrarToast?.('Error: ' + (data?.error || 'desconocido'), true);
                    return;
                }
                window.mostrarToast?.(estaBaneado ? 'Usuario desbaneado' : 'Usuario baneado por 7 días');
                this.cargarUsuarios(0);
            } catch (e) {
                window.mostrarToast?.('Error al banear/desbanear', true);
            }
        },

        async toggleShadowban(usuario) {
            try {
                const { data, error } = await window.supabase.rpc('admin_shadowban_usuario', {
                    p_token: this.tokenComunidad(),
                    p_usuario_id: usuario.id,
                    p_activar: !usuario.shadowban
                });
                if (error || !data || !data.ok) {
                    window.mostrarToast?.('Error: ' + (data?.error || 'desconocido'), true);
                    return;
                }
                window.mostrarToast?.(usuario.shadowban ? 'Shadowban quitado' : 'Shadowban aplicado');
                this.cargarUsuarios(0);
            } catch (e) {
                window.mostrarToast?.('Error al aplicar/quitar shadowban', true);
            }
        },

        async cargarAuditoria(delta) {
            const nueva = Math.max(0, (this.paginaAudit || 0) + Number(delta || 0));
            if (delta === 0) this.paginaAudit = 0;
            else if (nueva === this.paginaAudit) return;
            else this.paginaAudit = nueva;

            this.auditEstado = 'cargando';
            this.errorAudit = '';
            try {
                const { data, error } = await window.supabase.rpc('admin_obtener_audit_log', {
                    p_token: this.tokenComunidad(),
                    p_limite: 50,
                    p_offset: this.paginaAudit * 50
                });
                if (error) throw error;
                if (!data || !data.ok) {
                    this.errorAudit = data?.error || 'Error cargando auditoría';
                    this.auditEstado = 'error';
                    return;
                }
                this.auditLog = data.log || [];
                this.totalAudit = data.total || 0;
                this.auditEstado = 'lista';
            } catch (e) {
                console.error('Error cargando audit log:', e);
                this.errorAudit = 'Error inesperado';
                this.auditEstado = 'error';
            }
        }
    });
});

// === CHAT DE KICK (login propio, API oficial) ===
// El login se guarda en localStorage, así que sobrevive al cambiar de página.
window.CHAT_KICK = {
    funcion: SUPABASE_URL + '/functions/v1',
    emisor: 4582776,
    claveToken: 'gocha_kick_token'
};

(function prepararChatKick() {
    const api = window.CHAT_KICK;

    const pedir = async (cuerpo, token) => {
        const cabeceras = { 'Content-Type': 'application/json' };
        if (token) cabeceras.Authorization = 'Bearer ' + token;
        try {
            const res = await fetch(api.funcion + '/kick-chat', {
                method: 'POST',
                headers: cabeceras,
                body: JSON.stringify(cuerpo)
            });
            const datos = await res.json().catch(() => ({}));
            return { ok: res.ok, estado: res.status, datos };
        } catch (e) {
            console.error('chat kick:', e);
            return { ok: false, estado: 0, datos: { error: 'Sin conexión con el chat' } };
        }
    };

    // Contador de espectadores de la cabecera del chat ("191 Views").
    window.actualizarEspectadoresKick = function actualizarEspectadoresKick(total, enVivo) {
        const valor = { total: Number(total) || 0, vivo: !!enVivo };
        window._kickEspectadores = valor;
        document.querySelectorAll('.chat-kick-espectadores').forEach((el) => {
            if (!valor.vivo || valor.total <= 0) {
                el.hidden = true;
                return;
            }
            el.hidden = false;
            const num = el.querySelector('.chat-kick-espectadores-num');
            if (num) num.textContent = valor.total.toLocaleString('es-ES');
        });
    };

    // Salida única de Kick: la usa el cierre de sesión general y el chat.
    // Así no queda una sesión de Kick viva cuando el usuario cierra su cuenta.
    window.cerrarSesionKick = async function cerrarSesionKick() {
        const token = localStorage.getItem(api.claveToken);
        if (token) {
            try { await pedir({ accion: 'salir' }, token); } catch (e) {}
        }
        window.CHAT_KICK.sesion = null;
        localStorage.removeItem(api.claveToken);
    };

    const conEmotes = (texto) => window.escapeHtml(texto).replace(
        /\[emote:(\d+):([^\]]*)\]/g,
        (todo, id, nombre) => '<img class="chat-kick-emote" src="https://files.kick.com/emotes/' + id +
            '/fullsize" alt="' + nombre + '" title="' + nombre + '" loading="lazy" width="24" height="24">'
    );

    const SIMBOLO_BADGE = { moderator: '🛡', founder: '👑', subscriber: '⭐', vip: '💎', verified: '✓' };

    const pintarMensaje = (m) => {
        const fila = document.createElement('div');
        fila.className = 'chat-kick-mensaje';
        fila.dataset.id = m.message_id;

        const cabeza = document.createElement('div');
        cabeza.className = 'chat-kick-mensaje-cabeza';

        const autor = document.createElement('span');
        autor.className = 'chat-kick-autor';
        autor.textContent = m.sender_username;
        if (m.sender_color) autor.style.color = m.sender_color;
        cabeza.appendChild(autor);

        if (Array.isArray(m.badges)) {
            m.badges.slice(0, 3).forEach((badge) => {
                const tipo = String(badge?.type ?? '').toLowerCase();
                const simbolo = SIMBOLO_BADGE[tipo];
                if (!simbolo) return;
                const marca = document.createElement('span');
                marca.className = 'chat-kick-badge';
                marca.textContent = simbolo;
                marca.title = String(badge?.text ?? tipo);
                cabeza.appendChild(marca);
            });
        }

        const hora = document.createElement('time');
        hora.className = 'chat-kick-hora';
        const fecha = new Date(m.created_at);
        if (!Number.isNaN(fecha.getTime())) {
            hora.dateTime = fecha.toISOString();
            hora.textContent = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        cabeza.appendChild(hora);
        fila.appendChild(cabeza);

        if (m.replies_to && m.replies_to.content) {
            const cita = document.createElement('span');
            cita.className = 'chat-kick-cita';
            cita.textContent = '↳ ' + String(m.replies_to.content).slice(0, 80);
            fila.appendChild(cita);
        }

        const texto = document.createElement('span');
        texto.className = 'chat-kick-texto';
        texto.innerHTML = conEmotes(String(m.content ?? ''));
        fila.appendChild(texto);
        return fila;
    };

    const montar = (host) => {
        if (host.dataset.chatListo === '1') return;
        host.dataset.chatListo = '1';
        host.classList.add('chat-kick');

        host.innerHTML = [
            '<div class="chat-kick-top">',
            '  <span class="chat-kick-punto" data-estado="cargando" aria-hidden="true"></span>',
            '  <span class="chat-kick-titulo">Chat de Kick</span>',
            '  <span class="chat-kick-espectadores" hidden><span class="chat-kick-espectadores-num">0</span> Views</span>',
            '  <div class="chat-kick-cuenta" hidden>',
            '    <img class="chat-kick-avatar" alt="" width="20" height="20">',
            '    <span class="chat-kick-usuario"></span>',
            '  </div>',
            '  <button type="button" class="chat-kick-login"><span aria-hidden="true">K</span> Conectar</button>',
            '</div>',
            '<div class="chat-kick-mensajes" role="log" aria-live="polite" aria-label="Mensajes del chat de Kick">',
            '  <p class="chat-kick-vacio">Cargando mensajes…</p>',
            '</div>',
            '<form class="chat-kick-form">',
            '  <label class="chat-kick-oculto" for="chat-kick-campo">Tu mensaje</label>',
            '  <input class="chat-kick-campo" id="chat-kick-campo" type="text" maxlength="500" autocomplete="off" placeholder="Conecta con Kick para escribir" disabled>',
            '  <button class="chat-kick-enviar" type="submit" disabled>Enviar</button>',
            '</form>',
            '<p class="chat-kick-aviso" role="status" hidden></p>'
        ].join('');

        const lista = host.querySelector('.chat-kick-mensajes');
        const vacio = host.querySelector('.chat-kick-vacio');
        const punto = host.querySelector('.chat-kick-punto');
        const cuenta = host.querySelector('.chat-kick-cuenta');
        const avatar = host.querySelector('.chat-kick-avatar');
        const nombre = host.querySelector('.chat-kick-usuario');
        const login = host.querySelector('.chat-kick-login');
        const form = host.querySelector('.chat-kick-form');
        const campo = host.querySelector('.chat-kick-campo');
        const enviar = host.querySelector('.chat-kick-enviar');
        const aviso = host.querySelector('.chat-kick-aviso');

        if (typeof window.actualizarEspectadoresKick === 'function' && window._kickEspectadores) {
            window.actualizarEspectadoresKick(window._kickEspectadores.total, window._kickEspectadores.vivo);
        }

        const vistos = new Set();
        let cercaDelFinal = true;
        let bloqueo = 0;
        let temporizadorBloqueo = null;

        const mostrarAviso = (texto) => {
            if (!texto) {
                aviso.hidden = true;
                aviso.textContent = '';
                return;
            }
            aviso.hidden = false;
            aviso.textContent = texto;
        };

        const alFinal = () => {
            lista.scrollTop = lista.scrollHeight;
        };

        lista.addEventListener('scroll', () => {
            cercaDelFinal = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 60;
        });

        const añadir = (m) => {
            if (!m || !m.message_id || vistos.has(m.message_id)) return;
            vistos.add(m.message_id);
            if (vacio) vacio.hidden = true;
            lista.appendChild(pintarMensaje(m));
            if (cercaDelFinal) alFinal();
        };

        const actualizarCuenta = (sesion) => {
            if (sesion) {
                cuenta.hidden = false;
                login.hidden = true;
                nombre.textContent = sesion.usuario.username;
                if (sesion.usuario.avatar) {
                    avatar.src = sesion.usuario.avatar;
                    avatar.hidden = false;
                } else {
                    avatar.hidden = true;
                }
                campo.disabled = false;
                enviar.disabled = false;
                campo.placeholder = 'Escribe en el chat…';
            } else {
                cuenta.hidden = true;
                login.hidden = false;
                campo.disabled = true;
                enviar.disabled = true;
                campo.placeholder = 'Conecta con Kick para escribir';
            }
        };

        host._actualizarCuenta = actualizarCuenta;
        host._añadirMensaje = añadir;
        host._mostrarAviso = mostrarAviso;
        host._lista = lista;
        host._vacio = vacio;
        host._punto = punto;
        host._campo = campo;

        login.addEventListener('click', () => { host._conectar(); });

        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const sesion = window.CHAT_KICK.sesion;
            const contenido = campo.value.trim();
            if (!sesion || !contenido || bloqueo) return;

            enviar.disabled = true;
            campo.disabled = true;
            const res = await pedir({ accion: 'enviar', contenido }, sesion.token);

            if (res.ok) {
                campo.value = '';
                mostrarAviso('');
                campo.disabled = true;
                bloqueo = 5;
                campo.placeholder = 'Espera 5 s…';
                clearInterval(temporizadorBloqueo);
                temporizadorBloqueo = setInterval(() => {
                    bloqueo -= 1;
                    if (bloqueo <= 0) {
                        clearInterval(temporizadorBloqueo);
                        bloqueo = 0;
                        campo.disabled = false;
                        enviar.disabled = false;
                        campo.placeholder = 'Escribe en el chat…';
                    } else {
                        campo.placeholder = 'Espera ' + bloqueo + ' s…';
                    }
                }, 1000);
            } else if (res.estado === 401) {
                window.CHAT_KICK.sesion = null;
                localStorage.removeItem(api.claveToken);
                document.querySelectorAll('[data-chat-kick]').forEach((otro) => {
                    if (otro._actualizarCuenta) otro._actualizarCuenta(null);
                });
                mostrarAviso('Tu sesión de Kick caducó. Vuelve a conectar.');
                campo.disabled = false;
                enviar.disabled = false;
            } else {
                mostrarAviso(res.datos.error || 'No se pudo enviar el mensaje.');
                campo.disabled = false;
                enviar.disabled = false;
            }
            campo.focus();
        });
    };

    window.iniciarChatKick = async function iniciarChatKick() {
        const hosts = Array.from(document.querySelectorAll('[data-chat-kick]'));
        if (!hosts.length) return;
        hosts.forEach(montar);

        const sincronizar = () => {
            const sesion = window.CHAT_KICK.sesion ?? null;
            hosts.forEach((host) => { if (host._actualizarCuenta) host._actualizarCuenta(sesion); });
        };

        // Reutiliza la autorizacion de Kick guardada para la cuenta de comunidad.
        // Solo funciona con una sesion valida: al cerrar sesion se invalida.
        const reconectar = async () => {
            const tokenComunidad = localStorage.getItem('comunidad_session_token');
            if (!tokenComunidad) return null;
            try {
                const res = await fetch(api.funcion + '/kick-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accion: 'reconectar', token: tokenComunidad })
                });
                const datos = await res.json().catch(() => ({}));
                if (!res.ok || !datos.ok || !datos.token || !datos.usuario) return null;
                localStorage.setItem(api.claveToken, datos.token);
                return { token: datos.token, usuario: datos.usuario };
            } catch (e) {
                return null;
            }
        };

        window.CHAT_KICK.conectar = async (host) => {
            // Conectar es el login general con Kick: si ya hay cuenta de
            // comunidad se vincula; si no, se crea o recupera automaticamente.
            const tokenGuardado = localStorage.getItem(api.claveToken);
            const tokenComunidad = localStorage.getItem('comunidad_session_token');

            // El login general y el del chat comparten el token de Kick.
            // Si ya existe, se reutiliza y no se abre otro OAuth.
            if (tokenGuardado) {
                const sesion = await pedir({ accion: 'sesion' }, tokenGuardado);
                if (sesion.ok && sesion.datos.usuario) {
                    if (!tokenComunidad) {
                        const cuenta = await window.entrarConKickCuenta();
                        if (cuenta && cuenta.cancelado) {
                            host._mostrarAviso('No se completó el acceso. Vuelve a intentarlo.');
                            return;
                        }
                        if (cuenta && cuenta.error) {
                            host._mostrarAviso(cuenta.mensaje || 'No se pudo entrar a la comunidad.');
                            return;
                        }
                    }
                    window.CHAT_KICK.sesion = { token: tokenGuardado, usuario: sesion.datos.usuario };
                    sincronizar();
                    host._mostrarAviso('');
                    return;
                }
                if (sesion.estado === 401) localStorage.removeItem(api.claveToken);
            }

            // Sin token de chat, pero con cuenta de comunidad vinculada: Kick
            // ya autorizó antes y se reconecta sin abrir OAuth otra vez.
            if (tokenComunidad) {
                const renovada = await reconectar();
                if (renovada) {
                    window.CHAT_KICK.sesion = renovada;
                    sincronizar();
                    host._mostrarAviso('');
                    return;
                }
            }

            sessionStorage.setItem('gocha_kick_objetivo', 'chat');
            const res = await pedir({ accion: 'entrar', vuelta: window.vueltaKickApp('chat') });
            if (!res.ok || !res.datos.url) {
                host._mostrarAviso(res.datos.error || 'No se pudo abrir el login de Kick.');
                return;
            }
            location.href = res.datos.url;
        };

        window.CHAT_KICK.salir = async (host) => {
            const sesion = window.CHAT_KICK.sesion;
            if (sesion) await pedir({ accion: 'salir' }, sesion.token);
            window.CHAT_KICK.sesion = null;
            localStorage.removeItem(api.claveToken);
            sincronizar();
            host._mostrarAviso('');
        };

        hosts.forEach((host) => {
            host._conectar = () => window.CHAT_KICK.conectar(host);
            host._salir = () => window.CHAT_KICK.salir(host);
        });

        const completarLogin = async () => {
            const hash = location.hash.startsWith('#') ? location.hash.slice(1) : '';
            if (!hash) return false;
            const params = new URLSearchParams(hash);
            const token = params.get('kick');
            const error = params.get('kick_error');
            if (!token && !error) return false;

            sessionStorage.removeItem('gocha_kick_objetivo');
            history.replaceState(null, '', location.pathname + location.search);
            if (error) {
                hosts.forEach((host) => host._mostrarAviso(error));
                return false;
            }
            localStorage.setItem(api.claveToken, token);

            // Con Kick ya autenticado se completa la cuenta general:
            // con sesion abierta se vincula; sin sesion se crea o recupera.
            if (localStorage.getItem('comunidad_session_token')) {
                const vinculado = await window.KICK_COMUNIDAD.vincular();
                if (!vinculado) {
                    localStorage.removeItem(api.claveToken);
                    hosts.forEach((host) => host._mostrarAviso('No se pudo vincular tu Kick a esta cuenta.'));
                    return false;
                }
            } else {
                const cuenta = await window.entrarConKickCuenta();
                if (!cuenta || cuenta.cancelado || cuenta.error) {
                    localStorage.removeItem(api.claveToken);
                    const aviso = cuenta?.mensaje || (cuenta?.cancelado ? 'No se completó el acceso. Vuelve a intentarlo.' : '');
                    if (aviso) hosts.forEach((host) => host._mostrarAviso(aviso));
                    return false;
                }
            }
            return true;
        };

        const validarSesion = async () => {
            const token = localStorage.getItem(api.claveToken);
            if (!token) return null;
            const res = await pedir({ accion: 'sesion' }, token);
            if (!res.ok) {
                if (res.estado === 401) localStorage.removeItem(api.claveToken);
                return null;
            }
            return { token, usuario: res.datos.usuario };
        };

        const cargarMensajes = async () => {
            if (!window.supabase) return;
            const { data, error } = await window.supabase
                .from('kick_chat_messages')
                .select('message_id,sender_username,sender_color,sender_avatar,badges,content,emotes,replies_to,created_at')
                .eq('broadcaster_user_id', api.emisor)
                .order('created_at', { ascending: false })
                .limit(60);

            if (error) {
                hosts.forEach((host) => {
                    host._vacio.hidden = false;
                    host._vacio.textContent = 'No se pudieron cargar los mensajes.';
                });
                return;
            }
            const mensajes = (data ?? []).slice().reverse();
            if (!mensajes.length) {
                hosts.forEach((host) => {
                    host._vacio.hidden = false;
                    host._vacio.textContent = 'Nadie ha escrito todavía. Rompe el hielo.';
                });
                return;
            }
            mensajes.forEach((m) => hosts.forEach((host) => host._añadirMensaje(m)));
        };

        const escuchar = () => {
            if (!window.supabase) return;
            window.supabase
                .channel('kick-chat-' + api.emisor)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'kick_chat_messages',
                    filter: 'broadcaster_user_id=eq.' + api.emisor
                }, (carga) => {
                    hosts.forEach((host) => host._añadirMensaje(carga.new));
                })
                .subscribe((estado) => {
                    const valor = estado === 'SUBSCRIBED' ? 'vivo'
                        : (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') ? 'error' : 'cargando';
                    hosts.forEach((host) => { host._punto.dataset.estado = valor; });
                });
        };

        await completarLogin();
        window.CHAT_KICK.sesion = await validarSesion();
        if (!window.CHAT_KICK.sesion) window.CHAT_KICK.sesion = await reconectar();
        sincronizar();
        await cargarMensajes();
        escuchar();
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    try { iniciarChatKick(); } catch (e) { console.error('iniciarChatKick:', e); }
    try { iniciarPollingStreamGlobal(); } catch (e) { console.error('iniciarPollingStreamGlobal:', e); }
    try { insertarComponentesUIGlobales(); } catch (e) { console.error('insertarComponentesUIGlobales:', e); }
    try { initTema(); } catch (e) { console.error('initTema:', e); }
    try { inicializarMenuMovil(); } catch (e) { console.error('inicializarMenuMovil:', e); }
    try { inicializarNavLinks(); } catch (e) { console.error('inicializarNavLinks:', e); }
    try { actualizarUsuarioNavComunidad(); } catch (e) { console.error('actualizarUsuarioNavComunidad:', e); }
    try { insertarAccesoAdminFooter(); } catch (e) { console.error('insertarAccesoAdminFooter:', e); }
    try { window.sincronizarSesionComunidadVinculada(); } catch (e) { console.error('sincronizarSesionComunidadVinculada:', e); }
    try { iniciarLatidoComunidad(); } catch (e) { console.error('iniciarLatidoComunidad:', e); }
    try { iniciarPuntosGlobal(); } catch (e) { console.error('iniciarPuntosGlobal:', e); }
    try { window.KICK_COMUNIDAD?.volverDelHash(); } catch (e) { console.error('volverDelHash:', e); }
});

// === MODAL DE SUGERENCIAS (firma del creador) ===
(function () {
  let modalEl = null;
  const ERRORES = {
    texto_invalido: 'Escribe al menos 5 caracteres.',
    texto_largo: 'Máximo 500 caracteres.',
    limite: 'Ya enviaste 2 sugerencias hoy. Prueba mañana.',
    error_interno: 'No se pudo enviar. Inténtalo de nuevo.'
  };

  function crearModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'modal-sugerencias';
    modalEl.className = 'modal-sugerencias';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'sugerencias-titulo');
    modalEl.hidden = true;
    modalEl.setAttribute('x-data', '{ }');
    modalEl.setAttribute('x-cloak', '');
    modalEl.setAttribute('x-bind:hidden', '!$store.sugerencias.abierto');
    modalEl.setAttribute('x-on:keydown.escape.window', '$store.sugerencias.cerrar()');
    modalEl.innerHTML = `
      <div class="modal-sugerencias-backdrop" x-on:click="$store.sugerencias.cerrar()"></div>
      <div class="modal-sugerencias-card" x-trap.noscroll="$store.sugerencias.abierto">
        <button type="button" class="modal-sugerencias-close" x-on:click="$store.sugerencias.cerrar()" aria-label="Cerrar">&times;</button>
        <h3 id="sugerencias-titulo">
          <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-lightbulb"></use></svg>
          Sugerencias
        </h3>
        <p class="sugerencias-lead">¿Qué mejorarías del sitio? Se envía al creador. Máximo 2 por día.</p>
        <textarea maxlength="500" x-model="$store.sugerencias.texto" placeholder="Escribe tu idea..." aria-label="Tu sugerencia"></textarea>
        <div class="sugerencias-meta" x-text="$store.sugerencias.texto.length + '/500'"></div>
        <p class="sugerencias-error" role="alert" x-bind:hidden="!$store.sugerencias.error" x-text="$store.sugerencias.error"></p>
        <div class="sugerencias-actions">
          <button type="button" class="btn-primary btn-muted" x-on:click="$store.sugerencias.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" x-bind:disabled="$store.sugerencias.enviando"
                  x-on:click="$store.sugerencias.enviar()"
                  x-text="$store.sugerencias.enviando ? 'Enviando…' : 'Enviar'"></button>
        </div>
      </div>`;
    document.body.appendChild(modalEl);
    return modalEl;
  }

  document.addEventListener('alpine:init', () => {
    window.Alpine.store('sugerencias', {
      abierto: false,
      texto: '',
      enviando: false,
      error: '',
      abrir() {
        crearModal();
        this.texto = '';
        this.error = '';
        this.abierto = true;
      },
      cerrar() {
        this.abierto = false;
      },
      async enviar() {
        if (this.enviando) return;
        const texto = this.texto.trim();
        if (texto.length < 5) { this.error = ERRORES.texto_invalido; return; }
        if (texto.length > 500) { this.error = ERRORES.texto_largo; return; }
        if (!window.supabase) { this.error = ERRORES.error_interno; return; }
        this.enviando = true;
        this.error = '';
        try {
          const { data, error } = await window.supabase.rpc('enviar_sugerencia', { p_texto: texto });
          if (error) throw error;
          if (!data || !data.ok) {
            this.error = ERRORES[data?.error] || ERRORES.error_interno;
            return;
          }
          window.mostrarToast?.('¡Gracias por tu sugerencia!');
          this.texto = '';
          this.cerrar();
        } catch (e) {
          console.error('Error enviando sugerencia:', e);
          this.error = ERRORES.error_interno;
        } finally {
          this.enviando = false;
        }
      }
    });
  });

  window.abrirSugerencias = function abrirSugerencias() {
    window.Alpine?.store('sugerencias')?.abrir();
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-sugerencias]')) return;
    e.preventDefault();
    window.abrirSugerencias();
  });
})();

// === MODAL DE PERFIL GLOBAL (Alpine) ===
(function () {
  let modalEl = null;

  const LINK_LABELS = {
    instagram: 'Instagram',
    discord: 'Discord',
    tiktok: 'TikTok',
    kick: 'Kick'
  };
  const LINK_ICONS = {
    instagram: 'i-brands-instagram',
    discord: 'i-brands-discord',
    tiktok: 'i-brands-tiktok',
    kick: 'i-solid-k'
  };
  const LINK_KEYS = Object.keys(LINK_LABELS);
  const ERRORES = {
    sin_sesion: 'Sesión expirada. Inicia sesión de nuevo.',
    baneado: 'Tu cuenta está suspendida.',
    bio_larga: 'La bio no puede superar 160 caracteres.',
    links_invalidos: 'Algún enlace no es válido (solo http/https, máx. 300).',
    avatar_invalida: 'Ese avatar no está permitido.',
    genero_invalido: 'El género seleccionado no es válido.',
    error_interno: 'No se pudo guardar. Inténtalo de nuevo.'
  };

  function inicialDe(apodo) {
    return String(apodo || '?').trim().charAt(0).toUpperCase() || '?';
  }

  function mesDesde(iso) {
    if (!iso) return '';
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return '';
    return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  function setNavExpanded(abierto) {
    const btn = document.querySelector('#nav-user-info .nav-user-btn');
    if (btn) btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  }

  function crearModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'modal-perfil';
    modalEl.className = 'modal-perfil';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'modal-perfil-titulo');
    modalEl.hidden = true;
    modalEl.setAttribute('x-data', '{ }');
    modalEl.setAttribute('x-cloak', '');
    modalEl.setAttribute('x-bind:hidden', '!$store.perfil.abierto');
    modalEl.setAttribute('x-on:keydown.escape.window', '$store.perfil.cerrar()');
    modalEl.innerHTML = `
      <div class="modal-perfil-backdrop" x-on:click="$store.perfil.cerrar()"></div>
      <div class="modal-perfil-card" role="document" x-trap.noscroll="$store.perfil.abierto">
        <button type="button" class="modal-perfil-close" x-on:click="$store.perfil.cerrar()" aria-label="Cerrar">&times;</button>
        <h3 id="modal-perfil-titulo" x-text="$store.perfil.titulo">Mi perfil</h3>
        <nav class="modal-perfil-tabs" role="tablist" aria-label="Perfil y ajustes" x-bind:hidden="$store.perfil.publico">
          <button type="button" role="tab" x-bind:class="{ active: $store.perfil.vista === 'perfil' }"
                  x-bind:aria-selected="$store.perfil.vista === 'perfil'"
                  x-on:click="$store.perfil.vista = 'perfil'">Perfil</button>
          <button type="button" role="tab" x-bind:class="{ active: $store.perfil.vista === 'ajustes' }"
                  x-bind:aria-selected="$store.perfil.vista === 'ajustes'"
                  x-on:click="$store.perfil.vista = 'ajustes'">Ajustes</button>
        </nav>
        <div class="modal-perfil-body" role="tabpanel" aria-label="Perfil"
             x-bind:hidden="$store.perfil.vista !== 'perfil'">
          <p class="mp-cargando" x-bind:hidden="!$store.perfil.cargando">Cargando perfil…</p>
          <p class="mp-error" role="alert" x-bind:hidden="!$store.perfil.error" x-text="$store.perfil.error"></p>
          <div class="mp-profile-head" x-bind:hidden="$store.perfil.cargando || !!$store.perfil.error">
            <div class="mp-avatar-wrap">
              <img class="mp-avatar" x-bind:src="$store.perfil.avatar" x-bind:hidden="!$store.perfil.avatar"
                   x-bind:alt="'Avatar de ' + $store.perfil.nombre">
              <span class="mp-avatar-inicial" x-bind:hidden="!!$store.perfil.avatar" x-text="$store.perfil.inicial"></span>
            </div>
            <div class="mp-profile-info">
              <h4 class="mp-apodo" x-bind:class="'rango-texto-' + $store.perfil.rango.clave" x-text="$store.perfil.nombre"></h4>
              <div class="mp-badges">
                <span class="rango-badge" x-bind:class="'rango-' + $store.perfil.rango.clave"
                      x-bind:title="'Rango: ' + $store.perfil.rango.nombre"
                      x-text="$store.perfil.rango.emoji + ' ' + $store.perfil.rango.nombre"></span>
                <span class="mp-puntos" title="Puntos" x-text="(Number($store.perfil.usuario.puntos) || 0) + ' pts'"></span>
                <span class="mp-genero" x-bind:hidden="!$store.perfil.publico || !$store.perfil.generoTexto"
                      x-text="$store.perfil.generoTexto"></span>
                <span class="mp-icono" x-bind:hidden="!$store.perfil.usuario.icono" x-text="$store.perfil.usuario.icono"></span>
              </div>
              <div class="mp-kick-badges" x-bind:hidden="!$store.perfil.insignias.length">
                <template x-for="b in $store.perfil.insignias" :key="b.tipo">
                  <span class="chat-kick-badge" x-bind:class="'kick-badge-' + b.tipo" x-bind:title="b.texto">
                    <svg class="icon" aria-hidden="true"><use x-bind:href="'img/icons.svg#' + b.icono"></use></svg>
                    <span x-text="b.etiqueta"></span>
                  </span>
                </template>
              </div>
              <p class="mp-desde" x-bind:hidden="!$store.perfil.miembro" x-text="'Miembro desde ' + $store.perfil.miembro"></p>
              <p class="mp-bio" x-bind:hidden="!$store.perfil.usuario.bio" x-text="$store.perfil.usuario.bio"></p>
              <div class="mp-links" x-bind:hidden="!$store.perfil.linksVisibles.length">
                <template x-for="l in $store.perfil.linksVisibles" :key="l.clave">
                  <a class="mp-link" x-bind:href="l.url" x-bind:title="l.label" x-bind:aria-label="l.label"
                     target="_blank" rel="noopener noreferrer"><svg class="icon" aria-hidden="true"><use x-bind:href="'img/icons.svg#' + l.icon"></use></svg></a>
                </template>
              </div>
              <div class="mp-stats" x-bind:hidden="!$store.perfil.tieneEstadisticas">
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.mensajes || 0"></span><span class="mp-stat-label">Mensajes</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.reacciones_dadas || 0"></span><span class="mp-stat-label">Reacciones</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.reacciones_recibidas || 0"></span><span class="mp-stat-label">Recibidas</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.saludos || 0"></span><span class="mp-stat-label">Saludos</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.likes_galeria || 0"></span><span class="mp-stat-label">Likes</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.puntos_hoy || 0"></span><span class="mp-stat-label">Hoy</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-perfil-body" role="tabpanel" aria-label="Ajustes"
             x-bind:hidden="$store.perfil.publico || $store.perfil.vista !== 'ajustes'">
          <p class="mp-pendiente" role="status"
             x-bind:hidden="$store.perfil.genero !== 'no_definido' && !!$store.perfil.usuario.avatar_url">
            Completa tu perfil: elige tu género y tu avatar.
          </p>
          <div class="mp-avatar-wrap">
            <img class="mp-avatar" x-bind:src="$store.perfil.previewAvatar" x-bind:hidden="!$store.perfil.previewAvatar"
                 alt="Vista previa del avatar">
            <span class="mp-avatar-inicial" x-bind:hidden="!!$store.perfil.previewAvatar" x-text="$store.perfil.inicial"></span>
          </div>
          <div class="mp-avatar-acciones">
            <button type="button" class="btn-primary btn-muted" x-on:click="$store.perfil.quitarAvatar()">Usar avatar por defecto</button>
          </div>
          <div class="mp-avatar-choices" aria-label="Avatares disponibles">
            <template x-for="a in $store.perfil.avatares" :key="a.url">
              <button type="button" class="mp-avatar-choice"
                      x-bind:class="{ selected: ($store.perfil.avatarSeleccionado === undefined ? $store.perfil.avatar : $store.perfil.avatarSeleccionado) === a.url }"
                      x-bind:title="a.nombre || 'Avatar'" x-bind:aria-label="'Elegir ' + (a.nombre || 'avatar')"
                      x-on:click="$store.perfil.elegirAvatar(a.url)">
                <img x-bind:src="a.url" x-bind:alt="a.nombre || 'Avatar'" loading="lazy">
              </button>
            </template>
            <span class="mp-vacio" x-bind:hidden="$store.perfil.avatares.length">No se pudieron cargar los avatares.</span>
          </div>
          <label class="mp-field">Género
            <select x-model="$store.perfil.genero">
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="no_definido">No definido</option>
            </select>
          </label>
          <label class="mp-field">Bio <span class="mp-contador" x-text="$store.perfil.bio.length + '/160'"></span>
            <textarea maxlength="160" x-model="$store.perfil.bio" placeholder="Cuéntanos algo sobre ti..."></textarea>
          </label>
          <fieldset class="mp-links-grid">
            <legend>Redes</legend>
            <template x-for="clave in $store.perfil.linkKeys" :key="clave">
              <label class="mp-link-field">
                <span><svg class="icon" aria-hidden="true"><use x-bind:href="'img/icons.svg#' + $store.perfil.linkIconos[clave]"></use></svg>
                  <span x-text="$store.perfil.linkLabels[clave]"></span></span>
                <input type="url" x-bind:value="$store.perfil.links[clave]"
                       x-on:input="$store.perfil.links[clave] = $event.target.value"
                       placeholder="https://..." autocomplete="url">
              </label>
            </template>
          </fieldset>
          <div class="mp-kick" x-show="$store.perfil.kickDisponible">
            <div class="mp-kick-texto">
              <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-k"></use></svg>
              <span x-text="$store.perfil.kickUsuario
                ? 'Kick vinculado: @' + $store.perfil.kickUsuario
                : 'Vincula tu Kick para entrar sin PIN y mostrar tus insignias en el chat.'"></span>
            </div>
            <button type="button" class="btn-primary btn-muted"
                    x-show="!$store.perfil.kickUsuario"
                    x-on:click="$store.perfil.vincularKick()">Vincular Kick</button>
            <button type="button" class="btn-primary btn-muted mp-kick-quitar"
                    x-show="$store.perfil.kickUsuario"
                    x-on:click="$store.perfil.desvincularKick()">Desvincular Kick</button>
          </div>
          <p class="mp-error" role="alert" x-bind:hidden="!$store.perfil.error" x-text="$store.perfil.error"></p>
          <div class="mp-actions">
            <button type="button" class="btn-primary btn-muted" x-on:click="$store.perfil.vista = 'perfil'">Cancelar</button>
            <button type="button" class="btn-primary" x-bind:disabled="$store.perfil.guardando"
                    x-on:click="$store.perfil.guardar()">Guardar cambios</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modalEl);
    return modalEl;
  }

  document.addEventListener('alpine:init', () => {
    window.Alpine.store('perfil', {
      abierto: false,
      publico: false,
      vista: 'perfil',
      titulo: 'Mi perfil',
      cargando: false,
      guardando: false,
      error: '',
      usuario: {},
      estadisticas: {},
      avatares: [],
      avatarSeleccionado: undefined,
      genero: 'no_definido',
      bio: '',
      links: { instagram: '', discord: '', tiktok: '', kick: '' },
      linkKeys: LINK_KEYS,
      linkLabels: LINK_LABELS,
      linkIconos: LINK_ICONS,

      get nombre() {
        return this.usuario.apodo || localStorage.getItem('comunidad_nickname') || '';
      },
      get inicial() {
        return inicialDe(this.nombre);
      },
      get avatar() {
        return window.avatarUsuarioComunidad(this.usuario) || '';
      },
      get rango() {
        return window.datosRangoComunidad(this.usuario.rango, this.usuario.puntos);
      },
      get miembro() {
        return mesDesde(this.usuario.creado_en);
      },
      get generoTexto() {
        const textos = { femenino: 'Femenino', masculino: 'Masculino' };
        return textos[this.usuario.genero] || '';
      },
      get linksVisibles() {
        const visibles = [];
        const json = this.usuario.links_json && typeof this.usuario.links_json === 'object' ? this.usuario.links_json : {};
        LINK_KEYS.forEach((clave) => {
          const url = json[clave];
          if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
            visibles.push({ clave, url, icon: LINK_ICONS[clave], label: LINK_LABELS[clave] });
          }
        });
        return visibles;
      },
      get insignias() {
        return window.insigniasKickDe(this.usuario) || [];
      },
      get tieneEstadisticas() {
        const e = this.estadisticas || {};
        return e.ok === true;
      },
      avatarPorGenero() {
        if (this.genero === 'femenino') return '/img/avatars/avatar-female.webp';
        if (this.genero === 'masculino') return '/img/avatars/avatar-male.webp';
        return '';
      },
      get previewAvatar() {
        if (this.avatarSeleccionado === undefined) return this.avatar;
        if (this.avatarSeleccionado === '') return this.avatarPorGenero();
        return this.avatarSeleccionado;
      },
      get kickUsuario() {
        return this.usuario.kick_user_id ? (this.usuario.kick_username || 'cuenta vinculada') : '';
      },
      get kickDisponible() {
        return !!localStorage.getItem('comunidad_session_token');
      },
      vincularKick() {
        window.KICK_COMUNIDAD?.vincular();
      },
      async desvincularKick() {
        const token = localStorage.getItem('comunidad_session_token');
        if (!token) return;
        if (!window.confirm('¿Desvincular tu cuenta de Kick? Tendrás que volver a conectarla para escribir en el chat.')) return;
        try {
          const res = await fetch(SUPABASE_URL + '/functions/v1/kick-comunidad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'desvincular', token })
          });
          const datos = await res.json().catch(() => ({}));
          if (!res.ok || !datos.ok) {
            this.error = datos.error || 'No se pudo desvincular Kick.';
            return;
          }
          if (typeof window.cerrarSesionKick === 'function') await window.cerrarSesionKick();
          else localStorage.removeItem('gocha_kick_token');
          this.usuario.kick_user_id = null;
          this.usuario.kick_username = null;
          window.actualizarSesionUsuarioComunidad({ kick_user_id: null, kick_username: null });
          window.mostrarToast?.('Kick desvinculado.', false);
        } catch (e) {
          this.error = 'No se pudo desvincular Kick.';
        }
      },

      abrir(vista) {
        crearModal();
        this.publico = false;
        this.titulo = 'Mi perfil';
        this.error = '';
        this.vista = vista === 'ajustes' ? 'ajustes' : 'perfil';
        this.abierto = true;
        setNavExpanded(true);
        this.cargar();
      },

      async abrirUsuario(apodo) {
        if (!apodo || !window.supabase) return;
        crearModal();
        this.publico = true;
        this.titulo = 'Perfil público';
        this.vista = 'perfil';
        this.error = '';
        this.usuario = {};
        this.estadisticas = {};
        this.cargando = true;
        this.abierto = true;
        setNavExpanded(false);
        try {
          const { data, error } = await window.supabase
            .from('usuarios_comunidad')
            .select('apodo,puntos,rango,genero,avatar_url,bio,links_json,icono_equipado,creado_en,kick_badges,kick_badges_at')
            .ilike('apodo', apodo)
            .maybeSingle();
          if (error) throw error;
          if (!data) {
            this.error = 'No se encontró ese perfil.';
            return;
          }
          this.usuario = data;
          window.supabase
            .rpc('estadisticas_perfil_comunidad', { p_apodo: data.apodo })
            .then(({ data: stats, error: statsError }) => {
              if (statsError) {
                console.warn('No se pudieron cargar las estadísticas:', statsError.message);
                return;
              }
              this.estadisticas = stats || {};
            });
        } catch (e) {
          console.error('Error cargando perfil público:', e);
          this.error = 'No se pudo cargar el perfil.';
        } finally {
          this.cargando = false;
        }
      },

      cerrar() {
        this.abierto = false;
        setNavExpanded(false);
      },

      async cargar() {
        const token = localStorage.getItem('comunidad_session_token');
        this.cargando = true;
        this.error = '';
        if (!token || !window.supabase) {
          this.usuario = {};
          this.error = 'Inicia sesión en la Comunidad para ver tu perfil.';
          this.cargando = false;
          return;
        }

        let u = window.obtenerSesionUsuarioComunidad() || {};
        const userId = u.id || localStorage.getItem('comunidad_user_id');
        try {
          if (userId) {
            const { data, error } = await window.supabase
              .from('usuarios_comunidad')
              .select('apodo,puntos,rango,genero,avatar_url,bio,links_json,icono_equipado,creado_en,kick_user_id,kick_username')
              .eq('id', userId)
              .maybeSingle();
            if (!error && data) {
              u = Object.assign({}, u, {
                id: Number(userId),
                apodo: data.apodo ?? u.apodo,
                puntos: data.puntos ?? u.puntos,
                rango: data.rango ?? u.rango,
                genero: data.genero ?? u.genero,
                avatar_url: data.avatar_url ?? null,
                bio: data.bio ?? null,
                links_json: data.links_json ?? null,
                icono: data.icono_equipado ?? '',
                creado_en: data.creado_en ?? u.creado_en ?? null,
                kick_user_id: data.kick_user_id ?? null,
                kick_username: data.kick_username ?? null
              });
            }
          }

          const { data: avData, error: avError } = await window.supabase.rpc('obtener_avatares_disponibles', { p_token: token });
          if (!avError && avData && avData.ok) {
            this.avatares = Array.isArray(avData.avatares) ? avData.avatares : [];
            if (avData.genero) u.genero = avData.genero;
          }

          window.actualizarSesionUsuarioComunidad(u);
          this.usuario = u;
          this.genero = u.genero || 'no_definido';
          this.bio = u.bio || '';
          this.links = { instagram: '', discord: '', tiktok: '', kick: '' };
          const lj = u.links_json;
          if (lj && typeof lj === 'object') {
            LINK_KEYS.forEach((clave) => {
              if (typeof lj[clave] === 'string') this.links[clave] = lj[clave];
            });
          }
          this.avatarSeleccionado = undefined;
        } catch (e) {
          console.error('Error cargando perfil:', e);
          this.error = 'No se pudo cargar el perfil.';
        } finally {
          this.cargando = false;
        }
      },

      elegirAvatar(url) {
        this.avatarSeleccionado = url;
      },
      quitarAvatar() {
        this.avatarSeleccionado = '';
      },
      logout() {
        window.cerrarSesion?.();
      },

      async guardar() {
        this.error = '';
        const token = localStorage.getItem('comunidad_session_token');
        if (!token || !window.supabase) {
          this.error = ERRORES.sin_sesion;
          return;
        }

        const links = {};
        for (const clave of LINK_KEYS) {
          const valor = String(this.links[clave] || '').trim();
          if (!valor) continue;
          if (!/^https?:\/\//i.test(valor) || valor.length > 300) {
            this.error = ERRORES.links_invalidos;
            return;
          }
          links[clave] = valor;
        }

        const payload = {
          p_token: token,
          p_bio: this.bio.trim(),
          p_links_json: links,
          p_genero: this.genero
        };
        if (this.avatarSeleccionado !== undefined) {
          payload.p_avatar_url = this.avatarSeleccionado;
        }

        this.guardando = true;
        try {
          const { data, error } = await window.supabase.rpc('actualizar_perfil_comunidad', payload);
          if (error) {
            console.error('Error guardando perfil:', error);
            this.error = ERRORES.error_interno;
            return;
          }
          if (!data || !data.ok) {
            this.error = ERRORES[data?.error] || ERRORES.error_interno;
            return;
          }

          const perfil = data.perfil || data;
          const actualizado = window.actualizarSesionUsuarioComunidad({
            avatar_url: perfil.avatar_url !== undefined ? perfil.avatar_url : (this.usuario.avatar_url ?? null),
            bio: perfil.bio !== undefined ? perfil.bio : (this.usuario.bio ?? null),
            links_json: perfil.links_json !== undefined
              ? perfil.links_json
              : (perfil.links !== undefined ? perfil.links : links),
            genero: perfil.genero !== undefined ? perfil.genero : this.genero,
            icono: perfil.icono !== undefined ? perfil.icono : (this.usuario.icono || '')
          });
          this.usuario = Object.assign({}, this.usuario, actualizado);
          this.avatarSeleccionado = undefined;
          this.bio = this.usuario.bio || '';
          window.actualizarUsuarioNavComunidad?.();
          window.recargarPerfilComunidad?.();
          window.mostrarToast?.('Perfil actualizado');
          this.cerrar();
        } catch (e) {
          console.error('Error guardando perfil:', e);
          this.error = ERRORES.error_interno;
        } finally {
          this.guardando = false;
        }
      }
    });
  });

  window.abrirModalPerfil = function abrirModalPerfil(vista) {
    window.Alpine?.store('perfil')?.abrir(vista);
  };
  window.abrirPerfilUsuario = function abrirPerfilUsuario(apodo) {
    window.Alpine?.store('perfil')?.abrirUsuario(apodo);
  };
})();

