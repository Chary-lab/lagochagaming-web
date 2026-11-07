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
    const token = almacen.texto('comunidad_session_token');
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
    } catch (e) {
        console.error('Error inicializando Supabase:', e);
        window.supabase = null;
    }
} else {
    window.supabase = null;
}


// === HELPERS COMPARTIDOS ===

// El APK añade `lg-app` al <html>. Sirve para no repetir ajustes que la hoja
// móvil ya ofrece en Ajustes (tamaño de texto, animaciones y ahorro de datos).
window.enModoApp = function enModoApp() {
    return document.documentElement.classList.contains('lg-app');
};

// Al cerrar sesión, ¿se conserva el acceso de Kick en este equipo? Es una
// preferencia del dispositivo (Ajustes) y viene activada: así "Entrar con
// Kick" no vuelve a pedir autorización. Apagarla revoca el token al salir.
window.kickRecordarSesion = function kickRecordarSesion() {
    const store = window.Alpine && window.Alpine.store ? window.Alpine.store('ajustes') : null;
    return !store || store.datos.kickRecordar !== false;
};

// El recuerdo caduca a los 30 días desde el último cierre de sesión.
window.kickRecordadoVigente = function kickRecordadoVigente() {
    const hasta = Number(almacen.texto('gocha_kick_recordar_hasta') || 0);
    return !hasta || Date.now() < hasta;
};

// Al apagar el ajuste sin sesión abierta, no queda un token colgando.
window.olvidarKickRecordado = function olvidarKickRecordado() {
    if (window.kickRecordarSesion()) return;
    if (almacen.texto('comunidad_session_token')) return;
    almacen.borrar('gocha_kick_token');
    almacen.borrar('gocha_kick_recordar_hasta');
};

// Única fuente de verdad del escapado de HTML para todo el sitio.
window.escapeHtml = function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
};

window.escapeAttr = function escapeAttr(s) {
    return String(s ?? '').replace(/[&"'<>]/g, c => ({
        '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;'
    }[c]));
};

// Formatos de fecha del sitio: una sola implementación con locale es-ES. Antes
// había seis copias con opciones sueltas y cualquier cambio de formato se
// hacía en un sitio distinto cada vez.
window.formatearFecha = function formatearFecha(valor, estilo = 'completo') {
    if (!valor) return '';
    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    switch (estilo) {
        case 'completo':
            return fecha.toLocaleString('es-ES');
        case 'dia-mes':
            return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        case 'hora':
            return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        case 'mes-anio':
            return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        case 'fecha-corta':
            return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        case 'dia-mes-hora':
            return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' · ' +
                fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        default:
            return '';
    }
};

// Acceso único a localStorage: un solo try/catch, claves centralizadas y
// variantes para texto plano y para JSON. Los scripts inline que corren antes
// de main.js (tema) siguen usando localStorage directamente.
window.almacen = {
    texto(clave, defecto = null) {
        try {
            const valor = localStorage.getItem(clave);
            return valor === null ? defecto : valor;
        } catch (e) {
            return defecto;
        }
    },
    guardarTexto(clave, valor) {
        try {
            localStorage.setItem(clave, String(valor));
            return true;
        } catch (e) {
            return false;
        }
    },
    leer(clave, defecto = null) {
        try {
            const valor = localStorage.getItem(clave);
            return valor === null ? defecto : JSON.parse(valor);
        } catch (e) {
            return defecto;
        }
    },
    guardar(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
            return true;
        } catch (e) {
            return false;
        }
    },
    borrar(clave) {
        try {
            localStorage.removeItem(clave);
        } catch (e) { /* sin almacenamiento */ }
    }
};

// Aviso sonoro del chat: dos tonos cortos con Web Audio, sin archivos ni CDN.
// Se arma con la primera interacción porque los navegadores bloquean el audio
// hasta que el usuario toca la página.
(function avisoSonoroChat() {
    let contexto = null;
    let ultimo = 0;
    let armado = false;
    const armar = () => { armado = true; };
    window.addEventListener('pointerdown', armar, { once: true, passive: true });
    window.addEventListener('keydown', armar, { once: true });

    window.sonidoChat = function sonidoChat() {
        if (!armado) return;
        const ahora = Date.now();
        if (ahora - ultimo < 2000) return;
        ultimo = ahora;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            contexto = contexto || new AudioCtx();
            if (contexto.state === 'suspended') contexto.resume();
            const t0 = contexto.currentTime;
            [880, 1174].forEach((frecuencia, indice) => {
                const oscilador = contexto.createOscillator();
                const ganancia = contexto.createGain();
                const inicio = t0 + indice * 0.07;
                oscilador.type = 'sine';
                oscilador.frequency.value = frecuencia;
                ganancia.gain.setValueAtTime(0.0001, inicio);
                ganancia.gain.exponentialRampToValueAtTime(0.12, inicio + 0.02);
                ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.09);
                oscilador.connect(ganancia).connect(contexto.destination);
                oscilador.start(inicio);
                oscilador.stop(inicio + 0.1);
            });
        } catch (e) { /* audio bloqueado o no soportado */ }
    };
})();

// === EMOTES GLOBALES DE 7TV ===
// El canal no tiene set propio: se usa el set global de 7TV y se cachea para
// no pedirlo en cada página. Solo se aceptan ids alfanuméricos del CDN oficial.
(function () {
    const URL_GLOBAL = 'https://7tv.io/v3/emote-sets/global';
    const CLAVE_CACHE = 'gocha_7tv_global_v1';
    const TTL_CACHE = 12 * 60 * 60 * 1000;
    let emotes = [];
    let mapa = new Map();
    let promesa = null;
    let cargado = false;

    const urlEmote = (id) => 'https://cdn.7tv.app/emote/' + id + '/2x.webp';

    const normalizar = (datos) => {
        const fuente = Array.isArray(datos) ? datos : (Array.isArray(datos?.emotes) ? datos.emotes : []);
        const vistos = new Set();
        return fuente.reduce((lista, emote) => {
            const id = String(emote?.id ?? '');
            const nombre = String(emote?.name ?? emote?.nombre ?? '');
            if (!/^[A-Za-z0-9]+$/.test(id) || !nombre || vistos.has(id)) return lista;
            vistos.add(id);
            lista.push({ id, nombre, url: urlEmote(id) });
            return lista;
        }, []);
    };

    const aplicar = (lista) => {
        emotes = lista;
        mapa = new Map(lista.map((emote) => [emote.nombre, emote]));
        try {
            const store = window.Alpine?.store('emotes7tv');
            if (store) {
                store.lista = lista;
                store.cargado = true;
            }
        } catch (e) {}
    };

    const leerCache = (permitirCaducada = false) => {
        try {
            const crudo = almacen.texto(CLAVE_CACHE);
            if (!crudo) return null;
            const cache = JSON.parse(crudo);
            if (!cache || !Array.isArray(cache.emotes) || !cache.ts) return null;
            if (!permitirCaducada && Date.now() - Number(cache.ts) > TTL_CACHE) return null;
            return normalizar(cache.emotes);
        } catch (e) {
            return null;
        }
    };

    const guardarCache = (lista) => {
        try {
            almacen.guardarTexto(CLAVE_CACHE, JSON.stringify({ ts: Date.now(), emotes: lista }));
        } catch (e) {}
    };

    window.cargarEmotes7TV = function cargarEmotes7TV() {
        if (promesa) return promesa;
        if (cargado) return Promise.resolve(emotes);

        const cache = leerCache();
        if (cache && cache.length) {
            aplicar(cache);
            cargado = true;
            return Promise.resolve(emotes);
        }

        promesa = (async () => {
            const controlador = new AbortController();
            const temporizador = setTimeout(() => controlador.abort(), 4000);
            try {
                const respuesta = await fetch(URL_GLOBAL, {
                    headers: { Accept: 'application/json' },
                    cache: 'no-store',
                    signal: controlador.signal
                });
                if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
                const lista = normalizar(await respuesta.json());
                if (!lista.length) throw new Error('Set global vacío');
                aplicar(lista);
                guardarCache(lista);
            } catch (e) {
                const anterior = leerCache(true);
                if (anterior && anterior.length) aplicar(anterior);
                console.warn('No se pudieron cargar los emotes de 7TV:', e);
            } finally {
                clearTimeout(temporizador);
                cargado = true;
                promesa = null;
            }
            return emotes;
        })();
        return promesa;
    };

    // Escapa todo el texto y sustituye únicamente palabras exactas del set
    // global por imágenes del CDN. Nunca interpola texto del usuario sin escapar.
    window.renderizarEmotes7TV = function renderizarEmotes7TV(texto) {
        if (!emotes.length) return window.escapeHtml(texto);
        return String(texto ?? '').split(/(\s+)/).map((parte) => {
            if (!parte || /^\s+$/.test(parte)) return window.escapeHtml(parte);
            const emote = mapa.get(parte);
            if (!emote) return window.escapeHtml(parte);
            const nombre = window.escapeAttr(emote.nombre);
            return '<img class="chat-kick-emote" src="' + window.escapeAttr(emote.url) +
                '" alt="' + nombre + '" title="' + nombre + '" loading="lazy" decoding="async" width="24" height="24">';
        }).join('');
    };

    window.insertarEmote7tv = function insertarEmote7tv(nombre, campo) {
        campo = campo || document.getElementById('chat-mensaje');
        if (!campo || !nombre) return;
        const inicio = Number.isInteger(campo.selectionStart) ? campo.selectionStart : campo.value.length;
        const fin = Number.isInteger(campo.selectionEnd) ? campo.selectionEnd : inicio;
        const antes = campo.value.slice(0, inicio);
        const despues = campo.value.slice(fin);
        const prefijo = antes && !/\s$/.test(antes) ? ' ' : '';
        const sufijo = despues && !/^\s/.test(despues) ? ' ' : '';
        const insertado = prefijo + nombre + sufijo;
        const nuevo = antes + insertado + despues;
        if (campo.maxLength > 0 && nuevo.length > campo.maxLength) {
            window.mostrarToast?.('No queda espacio para ese emote.', true);
            return;
        }
        campo.value = nuevo;
        const cursor = antes.length + insertado.length;
        campo.focus();
        campo.setSelectionRange(cursor, cursor);
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        window.Alpine?.store('emotes7tv')?.cerrar();
    };

    document.addEventListener('alpine:init', () => {
        window.Alpine.store('emotes7tv', {
            lista: [],
            abierto: false,
            cargando: false,
            cargado: false,
            error: '',
            alternar() {
                this.abierto = !this.abierto;
                if (this.abierto && !this.cargado) this.cargar();
            },
            cerrar() {
                this.abierto = false;
            },
            async cargar() {
                if (this.cargando) return;
                this.cargando = true;
                this.error = '';
                const lista = await window.cargarEmotes7TV();
                this.lista = Array.isArray(lista) ? lista : [];
                this.cargando = false;
                this.cargado = true;
                if (!this.lista.length) this.error = 'No se pudieron cargar los emotes.';
            }
        });
    });
})();

// El rol de admin lo resuelve el servidor con la RPC es_admin(): acepta el JWT
// de Auth o la sesión de comunidad (cabecera x-comunidad-token).
let _adminCache = null;

// Llamada única a las RPC de Supabase: normaliza el resultado y centraliza el
// aviso de error. Devuelve { ok, data, error }.
// Variante de bajo nivel: misma forma que supabase.rpc ({ data, error }) para
// poder migrar las llamadas existentes sin reescribir cada bloque.
window.rpcRaw = async function rpcRaw(nombre, params) {
    if (!window.supabase) return { data: null, error: { message: 'sin_supabase' } };
    try {
        return await window.supabase.rpc(nombre, params);
    } catch (e) {
        return { data: null, error: { message: (e && e.message) || 'excepcion' } };
    }
};

window.rpc = async function rpc(nombre, params, opciones = {}) {
    if (!window.supabase) return { ok: false, error: 'sin_supabase', data: null };
    try {
        const { data, error } = await window.rpcRaw(nombre, params);
        if (error) {
            if (opciones.error !== false) {
                window.mostrarToast?.(typeof opciones.error === 'string' ? opciones.error : 'Error: ' + error.message, true);
            }
            return { ok: false, error: error.message, data: null };
        }
        return { ok: true, data, error: null };
    } catch (e) {
        if (opciones.error !== false) {
            window.mostrarToast?.(typeof opciones.error === 'string' ? opciones.error : 'No se pudo completar la operación.', true);
        }
        return { ok: false, error: (e && e.message) || 'excepcion', data: null };
    }
};

// Edge Functions del proyecto: mismo patrón en todas (POST JSON y cuerpo
// tolerante a respuestas vacías). No captura errores de red: cada llamada
// decide su mensaje. Devuelve { ok, status, datos }.
window.llamarEdge = async function llamarEdge(nombre, cuerpo, opciones = {}) {
    const cabeceras = { 'Content-Type': 'application/json' };
    if (opciones.token) cabeceras.Authorization = 'Bearer ' + opciones.token;
    const res = await fetch(SUPABASE_URL + '/functions/v1/' + nombre, {
        method: 'POST',
        headers: cabeceras,
        body: JSON.stringify(cuerpo)
    });
    const datos = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, datos };
};

window.esAdminActual = async function esAdminActual() {
    if (!window.supabase) return false;
    const token = almacen.texto('comunidad_session_token') || '';
    let authId = '';
    try {
        const { data } = await window.supabase.auth.getSession();
        authId = data?.session?.user?.id || '';
    } catch (e) { /* sin sesión Auth */ }
    if (!token && !authId) { _adminCache = null; return false; }
    const clave = token + '|' + authId;
    if (_adminCache && _adminCache.token === clave) return _adminCache.ok;

    let ok = false;
    const res = await window.rpc('es_admin', undefined, { error: false });
    if (!res.ok) {
        console.warn('No se pudo verificar el rol de admin:', res.error);
        return false;
    }
    ok = res.data === true;
    _adminCache = { token: clave, ok: ok };

    return ok;
};

// Mantener la caché sincronizada con cambios de sesión (login/logout en otra pestaña/página).
if (window.supabase && typeof window.supabase.auth?.onAuthStateChange === 'function') {
    window.supabase.auth.onAuthStateChange((evento) => {
        if (evento === 'SIGNED_IN') {
            almacen.borrar('comunidad_logout_explicito');
        }
        window.refrescarCacheAdmin();
        window.sincronizarSesionComunidadVinculada?.();
    });
}

// Se llama tras iniciar o cerrar sesión para que la caché no quede obsoleta.
window.refrescarCacheAdmin = function refrescarCacheAdmin() {
    _adminCache = null;
};

// Cambios de sesión en otra pestaña: se propagan al instante, sin recargar.
(function sincronizarPestanas() {
    if (typeof BroadcastChannel !== 'function') return;
    let canal = null;
    try { canal = new BroadcastChannel('gocha_sesion'); } catch (e) { return; }
    window.avisarCambioSesion = function avisarCambioSesion(motivo) {
        try { canal.postMessage({ motivo: motivo || 'cambio', en: Date.now() }); } catch (e) { /* canal cerrado */ }
    };
    canal.onmessage = function () {
        window.refrescarCacheAdmin();
        window.sincronizarSesionComunidadVinculada?.();
        window.actualizarUsuarioNavComunidad?.();
    };
})();

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
    let temaActual = almacen.texto('gochi_tema') || 'dark';
    if (!['dark', 'light', 'oled'].includes(temaActual)) temaActual = 'dark';
    const btn = document.getElementById('btn-toggle-tema');
    const icono = btn ? btn.querySelector('use') : null;
    const aplicarTema = (tema) => {
        document.body.classList.remove('light-mode', 'oled-mode');
        if (tema === 'light') document.body.classList.add('light-mode');
        else if (tema === 'oled') document.body.classList.add('oled-mode');
        if (!btn) return;
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
    if (!btn) return;
    btn.onclick = () => {
        const siguiente = temaActual === 'dark' ? 'light' :
                          temaActual === 'light' ? 'oled' : 'dark';
        temaActual = siguiente;
        almacen.guardarTexto('gochi_tema', siguiente);
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
        'chat_scroll',
        'gochi_cache_chat_v1',
        'gochi_cache_ranking_v1',
        'gochi_cache_tienda_v1'
    ].forEach((clave) => {
        almacen.borrar(clave);
        sessionStorage.removeItem(clave);
    });
};

// Única fuente de verdad del usuario de comunidad en el cliente.
window.obtenerSesionUsuarioComunidad = function obtenerSesionUsuarioComunidad() {
    try {
        const datos = JSON.parse(almacen.texto('comunidad_session_usuario') || '{}');
        return datos && typeof datos === 'object' ? datos : {};
    } catch (e) {
        return {};
    }
};

window.actualizarSesionUsuarioComunidad = function actualizarSesionUsuarioComunidad(parcial) {
    const actual = window.obtenerSesionUsuarioComunidad();
    const nuevo = Object.assign({}, actual, parcial || {});
    try {
        almacen.guardarTexto('comunidad_session_usuario', JSON.stringify(nuevo));
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
            if (objetivo === 'entrar' && almacen.texto('gocha_kick_token') && window.kickRecordadoVigente()) {
                if (typeof window.entrarConKickComunidad === 'function') {
                    return await window.entrarConKickComunidad();
                }
                window.location.href = 'comunidad?kick=1';
                return false;
            }
            if (objetivo === 'entrar' && almacen.texto('gocha_kick_token')) {
                // El recuerdo de 30 días caducó: se descarta y se pide autorización.
                almacen.borrar('gocha_kick_token');
                almacen.borrar('gocha_kick_recordar_hasta');
            }
            sessionStorage.setItem(CLAVE_OBJETIVO, objetivo);
            const vuelta = window.vueltaKickApp(objetivo);
            const { datos } = await window.llamarEdge('kick-chat', { accion: 'entrar', vuelta });
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
        const tokenComunidad = almacen.texto('comunidad_session_token');
        if (!tokenComunidad) {
            window.mostrarToast?.('Inicia sesión en la comunidad antes de vincular Kick.', true);
            return false;
        }
        const tokenKick = almacen.texto('gocha_kick_token');
        if (!tokenKick) return abrirOAuth('vincular');
        try {
            const res = await window.llamarEdge('kick-comunidad', { accion: 'vincular', token: tokenComunidad }, { token: tokenKick });
            const datos = res.datos;
            if (res.status === 401) {
                almacen.borrar('gocha_kick_token');
                return abrirOAuth('vincular');
            }
            if (!res.ok || !datos.ok) {
                window.mostrarToast?.(datos.mensaje || datos.error || 'No se pudo vincular Kick.', true);
                return false;
            }
            window.actualizarSesionUsuarioComunidad(datos.usuario || {});
            almacen.borrar('gocha_kick_sin_vincular');
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
        almacen.guardarTexto('gocha_kick_token', token);
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
    almacen.borrar('comunidad_logout_explicito');
    almacen.borrar('gocha_kick_sin_vincular');
    almacen.guardarTexto('comunidad_session_token', datos.token);
    almacen.guardarTexto('comunidad_nickname', u.apodo || '');
    window.avisarCambioSesion?.('login');
    if (u.id) almacen.guardarTexto('comunidad_user_id', String(u.id));
    almacen.guardarTexto('comunidad_session_usuario', JSON.stringify(u));
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
        if (typeof window.abrirModalPerfil === 'function') window.abrirModalPerfil('cuenta');
    });
    overlay.querySelector('[data-accion="despues"]').addEventListener('click', cerrar);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
};

// Entra con la sesion de Kick ya guardada. Si el apodo choca, pregunta.
// Devuelve los datos de la sesion de comunidad, { cancelado: true } o { error }.
window.entrarConKickCuenta = async function entrarConKickCuenta(opciones) {
    const silenciarAviso = !!(opciones && opciones.silenciarAviso);
    const tokenKick = almacen.texto('gocha_kick_token');
    if (!tokenKick) return { error: 'sin_kick' };
    let extra = {};
    for (let intento = 0; intento < 4; intento++) {
        let res;
        let datos;
        try {
            res = await window.llamarEdge('kick-comunidad', Object.assign({ accion: 'entrar' }, extra), { token: tokenKick });
            datos = res.datos;
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
            almacen.borrar('gocha_kick_token');
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
    const token = almacen.texto('comunidad_session_token');
    if (!token) return false;
    try {
        const { data, error } = await window.rpcRaw('latido_comunidad', { p_token: token });
        if (!error && data && data.ok && data.ganados > 0) {
            window.mostrarToast?.('🔥 Racha de ' + data.racha + ' días: +' + data.ganados + ' pts');
            window.refrescarPuntosDia?.();
        }
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
window.NOMBRE_INSIGNIA_KICK = {
    moderator: 'Moderador',
    vip: 'VIP',
    subscriber: 'Suscriptor',
    founder: 'Fundador',
    sub_gifter: 'Regaló subs',
    og: 'Veterano OG',
    verified: 'Verificado',
    broadcaster: 'Canal'
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
            nombre: window.NOMBRE_INSIGNIA_KICK[b.type] || window.ETIQUETA_INSIGNIA_KICK[b.type],
            icono: window.ICONO_INSIGNIA_KICK[b.type],
            texto: b.text || b.type
        }))
        .map(b => {
            const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const detalle = b.texto && norm(b.texto) !== norm(b.nombre) && norm(b.texto) !== norm(b.tipo) ? b.texto : '';
            return Object.assign({}, b, { detalle });
        });
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

// Deja la interfaz coherente cuando la sesión desaparece: sin usuario en los
// stores ni panel de perfil con datos viejos. No toca el almacenamiento.
window.limpiarEstadoSesionUI = function limpiarEstadoSesionUI() {
    try {
        const perfil = window.Alpine?.store('perfil');
        if (perfil) {
            perfil.usuario = {};
            perfil.estadisticas = {};
            perfil.avatares = [];
            perfil.bio = '';
            perfil.links = { instagram: '', discord: '', tiktok: '', kick: '' };
            if (typeof perfil.cerrar === 'function') perfil.cerrar();
        }
        const chat = window.Alpine?.store('chat');
        if (chat) {
            chat.mensajes = [];
            chat.cargando = false;
            chat.error = '';
        }
        const ranking = window.Alpine?.store('ranking');
        if (ranking) {
            ranking.usuarios = [];
            ranking.cargando = false;
        }
    } catch (e) { /* sin Alpine montado */ }
    window.actualizarUsuarioNavComunidad?.();
};

// Exporta lo que el navegador ya tiene del usuario: perfil y preferencias.
window.exportarMisDatos = function exportarMisDatos() {
    try {
        const datos = {
            generado: new Date().toISOString(),
            perfil: window.obtenerSesionUsuarioComunidad?.() || {},
            ajustes: almacen.leer('gochi_ajustes', {})
        };
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'lagochagaming-mis-datos.json';
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
        window.mostrarToast?.('Datos exportados.');
    } catch (e) {
        window.mostrarToast?.('No se pudieron exportar los datos.', true);
    }
};

window.cerrarSesion = async function cerrarSesion() {
    const token = almacen.texto('comunidad_session_token');
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
    almacen.guardarTexto('comunidad_logout_explicito', '1');
    almacen.borrar('comunidad_nickname');
    almacen.borrar('comunidad_session_token');
    almacen.borrar('comunidad_user_id');
    almacen.borrar('comunidad_session_usuario');
    window.avisarCambioSesion?.('logout');
    almacen.borrar('gocha_kick_sin_vincular');
    window.limpiarEstadoSesionUI();
    window.limpiarCachesSesionComunidad();

    // El login general también cierra la sesión de Kick del chat, salvo que el
    // visitante haya pedido no volver a autorizar Kick en este equipo.
    if (typeof window.cerrarSesionKick === 'function') {
        const conservar = window.kickRecordarSesion() && !!almacen.texto('gocha_kick_token');
        if (conservar) {
            almacen.guardarTexto('gocha_kick_recordar_hasta', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        } else {
            almacen.borrar('gocha_kick_recordar_hasta');
        }
        try { await window.cerrarSesionKick({ conservarToken: conservar }); } catch (e) {}
    }

    if (token && window.supabase) {
        try {
            await window.rpcRaw('cerrar_sesion_comunidad', { p_token: token });
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
    // El toast dura 3 s: espera suficiente para que se lea antes de recargar.
    setTimeout(() => { window.location.reload(); }, 1800);
};

window.actualizarUsuarioNavComunidad = function actualizarUsuarioNavComunidad() {
    // La sesión manda: si existe token con usuario pero falta la clave suelta
    // del apodo, el navbar no debe caer en "Login" con la cuenta abierta.
    const sesion = window.obtenerSesionUsuarioComunidad();
    const apodo = almacen.texto('comunidad_nickname') || sesion.apodo || '';
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
                    <span>${puntosNav}</span>
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
    const firmaSesion = (apodo || '') + '|' + (almacen.texto('comunidad_session_token') || '');
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
        <div class="nav-app" id="nav-app">
            <button type="button" class="nav-link nav-app-toggle" aria-haspopup="true" aria-controls="nav-app-panel"
                    x-bind:aria-expanded="$store.ui.menuNav === 'app' ? 'true' : 'false'"
                    x-on:click="$store.ui.menuNav = $store.ui.menuNav === 'app' ? '' : 'app'"
                    aria-label="Opciones de descarga de Gochita App">
                <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-brands-android"></use></svg>
                <span>App</span>
            </button>
            <div class="nav-app-panel" id="nav-app-panel" hidden :hidden="$store.ui.menuNav !== 'app'"
                 x-effect="window.portalPanelApp && window.portalPanelApp($el, $store.ui.menuNav === 'app')">
                <div class="nav-app-hero">
                    <div class="nav-app-phone" aria-hidden="true">
                        <span class="nav-app-vivo"><i></i>VIVO</span>
                        <span class="nav-app-burbuja"></span>
                        <span class="nav-app-burbuja"></span>
                        <span class="nav-app-burbuja"></span>
                    </div>
                    <div class="nav-app-hero-texto">
                        <strong>Gochita App</strong>
                        <small>El directo, el chat y los puntos, sin abrir el navegador.</small>
                        <span class="nav-app-gratis">Gratis · Android 7+</span>
                    </div>
                </div>
                <a class="nav-app-descargar" href="https://cydiyaacnyydprgffmkq.supabase.co/functions/v1/app-descarga?v=1.18&o=web" rel="noopener" data-umami-event="descarga-apk">
                    <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-brands-android"></use></svg>
                    <span>Descargar APK</span>
                    <em>4,2 MB</em>
                </a>
                <p class="nav-app-bono">🎁 100 puntos al entrar con tu cuenta</p>
                <ul class="nav-app-ventajas">
                    <li>
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-play"></use></svg>
                        <span><strong>Aviso de directo</strong>: te notifico cuando empiezo a emitir.</span>
                    </li>
                    <li>
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-comments"></use></svg>
                        <span><strong>Chat y puntos</strong> cómodos, sin la barra del navegador.</span>
                    </li>
                </ul>
                <details class="nav-app-detalle" open>
                    <summary>Cómo se instala <span>3 pasos</span></summary>
                    <p><b>1</b> Descarga el APK con el botón de arriba.</p>
                    <p><b>2</b> Si Android avisa, activa «Permitir desde esta fuente».</p>
                    <p><b>3</b> Abre la app y acepta las notificaciones.</p>
                </details>
                <details class="nav-app-detalle">
                    <summary>¿Sale aviso de Play Protect? <span>es normal</span></summary>
                    <p>Avisa de cualquier app que no venga de Play Store. La nuestra está firmada y se descarga del dominio oficial.</p>
                </details>
                <p class="nav-app-nota">Versión 1.18 · iPhone / iPad: aún no disponible.</p>
            </div>
        </div>`;

    const loginMenu = `
        <div class="nav-app nav-login" id="nav-login">
            <button type="button" class="nav-link nav-app-toggle nav-login-toggle" aria-haspopup="true" aria-controls="nav-login-panel"
                    x-bind:aria-expanded="$store.ui.menuNav === 'login' ? 'true' : 'false'"
                    x-on:click="$store.ui.menuNav = $store.ui.menuNav === 'login' ? '' : 'login'"
                    aria-label="Opciones de acceso">
                <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-right-to-bracket"></use></svg>
                <span>Login</span>
            </button>
            <div class="nav-app-panel nav-login-panel" id="nav-login-panel" hidden :hidden="$store.ui.menuNav !== 'login'">
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
        </div>`;

    nav.setAttribute('x-data', '{ }');
    nav.setAttribute('x-on:resize.window', 'if (window.innerWidth >= 1101) $store.ui.menuAbierto = false');
    nav.innerHTML = `
        <div class="logo">LAGOCHA<span>GAMING</span></div>
        <button type="button" class="mobile-menu-toggle-btn" aria-label="Abrir menú" data-tooltip="Menú"
                x-bind:aria-expanded="$store.ui.menuAbierto"
                x-bind:aria-label="$store.ui.menuAbierto ? 'Cerrar menú' : 'Abrir menú'"
                x-on:click="$store.ui.menuAbierto = !$store.ui.menuAbierto"><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-bars"></use></svg></button>
        <div class="nav-links" x-bind:class="{ 'mobile-active': $store.ui.menuAbierto }">
            ${enlaces}
            ${appMenu}
        </div>
        <div class="nav-right">
            <span id="nav-live-tag" class="nav-live-tag" hidden>
                <span class="nav-live-dot" aria-hidden="true"></span>EN VIVO
            </span>
            ${loginMenu}
            <button type="button" id="btn-toggle-tema" class="btn-tema-nav" data-tooltip="Cambiar tema" aria-label="Cambiar tema claro/oscuro"><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-sun"></use></svg></button>
            <button type="button" id="nav-puntos-dia" class="nav-puntos-dia" hidden
                    title="Puntos que llevas hoy" aria-label="Puntos de hoy">
                <span class="nav-puntos-ring" aria-hidden="true"></span>
                <span class="nav-puntos-texto" aria-hidden="true"><span id="nav-puntos-hoy">0</span><span class="nav-puntos-sep">/</span><span id="nav-puntos-tope">60</span></span>
                <span class="nav-racha" id="nav-racha" aria-hidden="true" hidden></span>
                <span class="nav-puntos-suma" aria-hidden="true"></span>
            </button>
            <button type="button" id="nav-misiones" class="nav-misiones" hidden
                    aria-haspopup="dialog" aria-expanded="false" aria-controls="nav-misiones-panel"
                    title="Misiones de la comunidad" aria-label="Abrir misiones">
                <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-gift"></use></svg>
                <span class="nav-misiones-texto">Misiones</span>
                <span class="nav-misiones-badge" id="nav-misiones-badge" aria-hidden="true" hidden></span>
            </button>
            <div id="nav-user-info"></div>
        </div>
    `;
    nav.dataset.montado = '1';

    // Cierre compartido de los menús plegables del navbar (App y Login).
    // El estado vive en ui.menuNav: un solo menú abierto a la vez.
    document.addEventListener('click', (evento) => {
        const ui = window.Alpine?.store('ui');
        if (!ui || !ui.menuNav) return;
        const contenedor = document.getElementById(ui.menuNav === 'login' ? 'nav-login' : 'nav-app');
        if (contenedor && contenedor.contains(evento.target)) {
            if (evento.target.closest('a, button[data-login-accion]')) ui.menuNav = '';
            return;
        }
        ui.menuNav = '';
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key !== 'Escape') return;
        const ui = window.Alpine?.store('ui');
        if (!ui || !ui.menuNav) return;
        const boton = document.querySelector('#' + (ui.menuNav === 'login' ? 'nav-login' : 'nav-app') + ' .nav-app-toggle');
        ui.menuNav = '';
        boton?.focus();
    });

    const btnMisiones = document.getElementById('nav-misiones');
    if (btnMisiones) btnMisiones.addEventListener('click', () => window.toggleMisiones());
};

// === Menú de acceso del navbar: única entrada de login ===
async function conectarKickNavbar() {
    const tokenComunidad = almacen.texto('comunidad_session_token');
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
    window.cerrarMenusNavbar?.();
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

// Pinta el estado EN VIVO sin consultar la red. Se usa al construir la navbar
// con el último estado guardado y cuando responde Kick.
window.pintarEstadoNav = function pintarEstadoNav(vivo) {
    const navbar = document.querySelector('.navbar');
    const liveTag = document.getElementById('nav-live-tag');
    if (navbar) navbar.classList.toggle('live-glow', !!vivo);
    if (liveTag) liveTag.hidden = !vivo;
    try { almacen.guardarTexto('gochi_en_vivo_ultimo', vivo ? '1' : '0'); } catch (e) { /* modo privado */ }
};

window.insertarNavbar();
window.cargarColoresApodo?.();

// Arrancar con el último estado conocido: el tag no aparece ni empuja la navbar.
try {
    const ultimo = almacen.texto('gochi_en_vivo_ultimo');
    if (ultimo === '1' || ultimo === '0') window.pintarEstadoNav(ultimo === '1');
} catch (e) { /* sin almacenamiento */ }


window.validarSesionStreamer = async function validarSesionStreamer() {
    return window.esAdminActual();
};

 // === COMPONENTES UI GLOBALES (toast, confirm modal, menú móvil) ===

window.insertarComponentesUIGlobales = function insertarComponentesUIGlobales() {
    if (!document.getElementById('gochi-toast')) {
        const toast = document.createElement('div');
        toast.id = 'gochi-toast';
        // Toda la posición y tipografía vive en .gochi-toast-stack (style.css).
        toast.className = 'gochi-toast-stack';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('x-data', '{ }');
        toast.innerHTML = `
            <template x-for="t in $store.toast.cola" :key="t.id">
                <div class="gochi-toast-item" :class="{ 'gochi-toast-item--error': t.esError }">
                    <span class="gochi-toast-punto" aria-hidden="true"></span>
                    <span x-text="t.mensaje"></span>
                    <button type="button" class="gochi-toast-cerrar" aria-label="Cerrar aviso" x-on:click="$store.toast.quitar(t.id)">&times;</button>
                </div>
            </template>
        `;
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
            <div class="gochi-modal-box gochi-confirm" role="document">
                <div class="gochi-confirm-icon" aria-hidden="true">
                    <svg class="icon"><use href="img/icons.svg#i-solid-triangle-exclamation"></use></svg>
                </div>
                <div>
                    <span class="gochi-confirm-eyebrow" id="gochi-confirm-eyebrow">Confirmación</span>
                    <h3 id="gochi-confirm-titulo">Confirmar</h3>
                    <p id="gochi-confirm-mensaje"></p>
                </div>
                <div class="gochi-modal-actions">
                    <button type="button" id="gochi-confirm-cancelar" class="gochi-confirm-btn gochi-confirm-btn--cancelar">Cancelar</button>
                    <button type="button" id="gochi-confirm-confirmar" class="gochi-confirm-btn gochi-confirm-btn--confirmar">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    insertarPanelAdminGlobal();
};

// === API de componentes Gochi (Pines UI) ===
// Punto único para que las páginas no repitan markup ni estilos. Los nombres
// antiguos (mostrarToast, confirmarAccion) siguen funcionando como alias.
window.gochiChip = function gochiChip(texto, tono = 'neutro') {
    const chip = document.createElement('span');
    chip.className = 'gochi-chip';
    if (tono && tono !== 'neutro') chip.dataset.tono = tono;
    chip.textContent = String(texto ?? '');
    return chip;
};

window.gochiSkeleton = function gochiSkeleton(tipo = 'texto', cantidad = 1) {
    const total = Math.max(1, Math.min(12, Number(cantidad) || 1));
    const permitidos = new Set(['texto', 'titulo', 'media', 'avatar', 'chip']);
    const clase = permitidos.has(tipo) ? tipo : 'texto';
    const fragmento = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
        const bloque = document.createElement('span');
        bloque.className = 'gochi-skeleton gochi-skeleton--' + clase;
        bloque.setAttribute('aria-hidden', 'true');
        fragmento.appendChild(bloque);
    }
    return fragmento;
};

window.gochiDropdown = function gochiDropdown(id, abrir) {
    const store = window.Alpine?.store('ui');
    if (!store || !id) return false;
    const estaba = !!(store.menus && store.menus[id]);
    const nuevo = typeof abrir === 'boolean' ? abrir : !estaba;
    store.menus = {};
    store.menus[id] = nuevo;
    document.querySelectorAll('[data-gochi-menu-trigger]').forEach((btn) => {
        btn.setAttribute('aria-expanded', String(btn.dataset.gochiMenuTrigger === id && nuevo));
    });
    const menu = document.getElementById(id);
    if (menu) menu.hidden = !nuevo;
    if (nuevo && menu) {
        const primero = menu.querySelector('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
        if (primero) setTimeout(() => primero.focus({ preventScroll: true }), 0);
    }
    return nuevo;
};

window.cerrarGochiMenus = function cerrarGochiMenus(devolverFoco = false) {
    const store = window.Alpine?.store('ui');
    const abiertos = store ? Object.keys(store.menus || {}).filter((id) => store.menus[id]) : [];
    if (store) store.menus = {};
    document.querySelectorAll('[data-gochi-menu-trigger]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
    });
    abiertos.forEach((id) => {
        const menu = document.getElementById(id);
        if (menu) menu.hidden = true;
        if (devolverFoco) {
            const trigger = document.querySelector(`[data-gochi-menu-trigger="${id}"]`);
            if (trigger) trigger.focus({ preventScroll: true });
        }
    });
};

document.addEventListener('pointerdown', (evento) => {
    const store = window.Alpine?.store('ui');
    if (!store || !store.menus) return;
    if (!Object.values(store.menus).some(Boolean)) return;
    if (evento.target.closest?.('[data-gochi-menu]')) return;
    window.cerrarGochiMenus();
});

document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    const store = window.Alpine?.store('ui');
    if (store && Object.values(store.menus || {}).some(Boolean)) {
        window.cerrarGochiMenus(true);
    }
});

// === TOOLTIP GLOBAL (delegado, un solo nodo) ===
(function iniciarTooltips() {
    // En pantallas táctiles el tooltip se queda pegado tras el toque y tapa la UI.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let burbuja = null;
    const crear = () => {
        if (burbuja) return burbuja;
        burbuja = document.createElement('div');
        burbuja.className = 'gochi-tooltip';
        burbuja.setAttribute('role', 'tooltip');
        burbuja.hidden = true;
        document.body.appendChild(burbuja);
        return burbuja;
    };
    let actual = null;
    let tMostrar = null;
    let observador = null;
    const colocar = (el) => {
        if (!el.isConnected) { ocultar(); return; }
        const texto = el.dataset.tooltip;
        if (!texto) return;
        const b = crear();
        b.textContent = texto;
        b.hidden = false;
        const r = el.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        // El globo no debe salirse del modal que lo contiene: en los botones de
        // cerrar (esquina superior derecha) se sale de la tarjeta y tapa el fondo.
        const caja = el.closest('.modal-perfil-card, .gochi-modal-box, .admin-global-card, [role="dialog"]');
        let minX = 8, maxX = window.innerWidth - br.width - 8;
        let minY = 8, maxY = window.innerHeight - br.height - 8;
        if (caja) {
            const c = caja.getBoundingClientRect();
            minX = Math.max(minX, c.left + 8);
            maxX = Math.min(maxX, c.right - br.width - 8);
            minY = Math.max(minY, c.top + 8);
            maxY = Math.min(maxY, c.bottom - br.height - 8);
        }
        const limitar = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));
        let x = limitar(r.left + r.width / 2 - br.width / 2, minX, maxX);
        let y = r.top - br.height - 8;
        if (y < minY) y = r.bottom + 8;
        y = limitar(y, minY, maxY);
        b.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        // El perfil crece al cargar la actividad: si el globo ya está visible,
        // se recoloca cuando cambia el tamaño del botón o de su tarjeta.
        if ('ResizeObserver' in window) {
            observador = observador || new ResizeObserver(() => {
                if (actual && burbuja && !burbuja.hidden) colocar(actual);
            });
            observador.disconnect();
            observador.observe(el);
            if (caja) observador.observe(caja);
        }
    };
    const ocultar = () => {
        clearTimeout(tMostrar);
        actual = null;
        if (observador) { observador.disconnect(); observador = null; }
        if (burbuja) burbuja.hidden = true;
    };
    const conTooltip = (evento) => evento.target.closest?.('[data-tooltip]');
    document.addEventListener('pointerover', (evento) => {
        const el = conTooltip(evento);
        if (!el) return;
        if (el === actual && burbuja && !burbuja.hidden) return;
        actual = el;
        clearTimeout(tMostrar);
        // Pequeña espera: al abrir un modal el cursor cae encima del ✕ antes de
        // que la tarjeta termine de colocarse y el globo salía descuadrado.
        tMostrar = setTimeout(() => { if (actual === el) colocar(el); }, 220);
    });
    document.addEventListener('pointerout', (evento) => {
        if (conTooltip(evento)) ocultar();
    });
    window.addEventListener('scroll', ocultar, { passive: true });
    window.addEventListener('resize', ocultar);
})();

let _toastsPendientes = [];
window.mostrarToast = function mostrarToast(mensaje, esError = false) {
    const store = window.Alpine?.store('toast');
    if (!store) {
        _toastsPendientes.push([mensaje, esError]);
        if (_toastsPendientes.length > 5) _toastsPendientes.shift();
        return;
    }
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
    const token = almacen.texto('comunidad_session_token');
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
    const racha = Math.max(0, Number(datos?.racha) || 0);
    const elRacha = document.getElementById('nav-racha');
    if (elRacha) {
        elRacha.textContent = racha > 1 ? '🔥' + racha : '';
        elRacha.hidden = racha <= 1;
    }
    btn.style.setProperty('--p', Math.min(100, Math.round((hoy / tope) * 100)) + '%');
    btn.classList.toggle('nav-puntos-dia--completo', hoy >= tope);
    btn.hidden = false;
    btn.title = 'Hoy: ' + hoy + ' / ' + tope + ' pts' + (racha > 1 ? ' · Racha: ' + racha + ' días' : '');
    btn.setAttribute('aria-label', 'Puntos de hoy: ' + hoy + ' de ' + tope + (racha > 1 ? '. Racha de ' + racha + ' días' : ''));
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
    const token = almacen.texto('comunidad_session_token');
    if (!token) {
        if (btn) btn.hidden = true;
        return;
    }
    if (!window.supabase) return;
    try {
        const { data, error } = await window.rpcRaw('obtener_puntos_hoy', { p_token: token });
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
        const token = almacen.texto('comunidad_session_token');
        if (!token || document.hidden) return;
        if (Date.now() - ultimo < 60000) return;
        ultimo = Date.now();
        window.rpcRaw('incrementar_puntos_comunidad', { p_token: token })
            .then(() => window.refrescarPuntosDia?.())
            .catch(() => {});
    };
    setInterval(tick, 300000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    tick();
    window.refrescarPuntosDia?.();
};

window.mostrarConfirmacionModal = function mostrarConfirmacionModal({
    titulo,
    mensaje,
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar',
    tono = 'peligro',
    icono,
    enConfirmar,
    alCancelar
} = {}) {
    const modal = document.getElementById('gochi-confirm-modal');
    if (!modal) {
        if (typeof alCancelar === 'function') alCancelar();
        return;
    }
    const caja = modal.querySelector('.gochi-confirm');
    const titEl = document.getElementById('gochi-confirm-titulo');
    const msgEl = document.getElementById('gochi-confirm-mensaje');
    const eyebrowEl = document.getElementById('gochi-confirm-eyebrow');
    const btnConf = document.getElementById('gochi-confirm-confirmar');
    const btnCanc = document.getElementById('gochi-confirm-cancelar');
    const iconoEl = modal.querySelector('.gochi-confirm-icon use');

    const tonos = {
        peligro: { icono: 'i-solid-triangle-exclamation', etiqueta: 'Atención' },
        aviso: { icono: 'i-solid-circle-info', etiqueta: 'Aviso' },
        info: { icono: 'i-solid-circle-info', etiqueta: 'Información' },
        exito: { icono: 'i-solid-check', etiqueta: 'Listo' }
    };
    const estilo = tonos[tono] || tonos.peligro;

    if (caja) {
        caja.classList.remove('gochi-confirm--peligro', 'gochi-confirm--aviso', 'gochi-confirm--info', 'gochi-confirm--exito');
        caja.classList.add('gochi-confirm--' + (tonos[tono] ? tono : 'peligro'));
    }
    if (iconoEl) iconoEl.setAttribute('href', 'img/icons.svg#' + (icono || estilo.icono));
    if (eyebrowEl) eyebrowEl.textContent = estilo.etiqueta;
    if (titEl) titEl.textContent = titulo || 'Confirmar';
    if (msgEl) msgEl.textContent = mensaje || '';
    if (btnConf) btnConf.textContent = textoConfirmar;
    if (btnCanc) btnCanc.textContent = textoCancelar;

    const cerrar = (confirmado) => {
        modal.style.display = 'none';
        window.desactivarTrampaFoco();
        btnConf.onclick = null;
        btnCanc.onclick = null;
        if (confirmado) {
            if (typeof enConfirmar === 'function') enConfirmar();
        } else if (typeof alCancelar === 'function') {
            alCancelar();
        }
    };

    modal.style.display = 'flex';
    btnConf.onclick = () => cerrar(true);
    btnCanc.onclick = () => cerrar(false);
    modal.onclick = (evento) => { if (evento.target === modal) cerrar(false); };
    window.activarTrampaFoco(modal, btnCanc);
};

// Promise-based helper: await window.confirmarAccion({...}) devuelve true/false.
// Una confirmación nueva cancela la anterior para no dejar promesas colgadas.
let _resolverConfirmacion = null;
window.confirmarAccion = function confirmarAccion(opciones = {}) {
    if (_resolverConfirmacion) {
        const anterior = _resolverConfirmacion;
        _resolverConfirmacion = null;
        anterior(false);
    }
    return new Promise((resolver) => {
        _resolverConfirmacion = resolver;
        const terminar = (valor) => {
            if (_resolverConfirmacion === resolver) _resolverConfirmacion = null;
            resolver(valor);
        };
        window.mostrarConfirmacionModal({
            ...opciones,
            enConfirmar: () => terminar(true),
            alCancelar: () => terminar(false)
        });
    });
};

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
    if (evento.key !== 'Escape') return;
    if (cerrarModalVisible()) return;
    // Capas globales: se cierra solo la superior (perfil puede ir sobre admin).
    for (const nombre of ['perfil', 'sugerencias', 'adminPanel']) {
        const store = window.Alpine?.store(nombre);
        if (store && store.abierto) {
            store.cerrar();
            return;
        }
    }
});

// === MISIONES GLOBALES (navbar) ===
let panelMisionesEl = null;
let panelMisionesAbierto = false;

function pintarBadgeMisiones(estado) {
    const badge = document.getElementById('nav-misiones-badge');
    if (!badge || !estado) return;
    const pendientes = estado.pendientes || 0;
    const hechas = estado.hechas || 0;
    const total = estado.total || 0;
    if (pendientes > 0) {
        badge.textContent = pendientes;
        badge.hidden = false;
        badge.classList.remove('nav-misiones-badge--ok');
    } else if (total > 0 && hechas === total) {
        badge.textContent = '✓';
        badge.hidden = false;
        badge.classList.add('nav-misiones-badge--ok');
    } else {
        badge.textContent = '';
        badge.hidden = true;
    }
}

function crearPanelMisiones() {
    if (panelMisionesEl) return panelMisionesEl;
    panelMisionesEl = document.createElement('div');
    panelMisionesEl.id = 'nav-misiones-panel';
    panelMisionesEl.className = 'nav-misiones-panel';
    panelMisionesEl.hidden = true;
    panelMisionesEl.setAttribute('role', 'dialog');
    panelMisionesEl.setAttribute('aria-label', 'Misiones de la comunidad');
    panelMisionesEl.setAttribute('x-data', '{ }');
    panelMisionesEl.setAttribute('x-cloak', '');
    panelMisionesEl.addEventListener('click', (evento) => {
        if (evento.target === panelMisionesEl) window.toggleMisiones(false);
    });
    panelMisionesEl.innerHTML = `
        <div class="nav-misiones-caja" role="document">
            <div class="nav-misiones-cabeza">
                <strong>Misiones</strong>
                <span class="nav-misiones-cuenta" x-text="$store.misiones.pendientes
                    ? $store.misiones.pendientes + ' por cobrar'
                    : ($store.misiones.lista.length && $store.misiones.cumplidas === $store.misiones.lista.length ? 'Todo cobrado' : 'Sin pendientes')"></span>
            </div>
            <p class="nav-misiones-vacio" x-bind:hidden="$store.misiones.lista.length || $store.misiones.cargando">Cargando misiones...</p>
            <template x-for="m in $store.misiones.lista" :key="m.clave">
                <div class="nav-mision" x-bind:class="{ 'nav-mision--hecha': m.reclamada }">
                    <span class="nav-mision-marca" x-text="m.reclamada ? '✓' : (m.cumplida ? '!' : '○')" aria-hidden="true"></span>
                    <span class="nav-mision-datos">
                        <span class="nav-mision-titulo" x-text="m.titulo"></span>
                        <span class="nav-mision-desc" x-text="m.descripcion"></span>
                    </span>
                    <button type="button" class="nav-mision-btn" x-bind:hidden="m.reclamada || !m.cumplida"
                            x-bind:disabled="$store.misiones.reclamando === m.clave"
                            x-on:click="$store.misiones.reclamar(m)"
                            x-bind:aria-label="'Cobrar ' + m.puntos + ' puntos por ' + m.titulo"
                            x-text="'+' + m.puntos"></button>
                </div>
            </template>
        </div>`;
    document.body.appendChild(panelMisionesEl);
    return panelMisionesEl;
}

function colocarPanelMisiones() {
    if (!panelMisionesEl) return;
    const btn = document.getElementById('nav-misiones');
    if (!btn) return;
    if (window.innerWidth < 900) {
        panelMisionesEl.style.top = '';
        panelMisionesEl.style.right = '';
        return;
    }
    const r = btn.getBoundingClientRect();
    panelMisionesEl.style.top = Math.round(r.bottom + 8) + 'px';
    panelMisionesEl.style.right = Math.max(12, Math.round(window.innerWidth - r.right)) + 'px';
}

window.toggleMisiones = function toggleMisiones(forzar) {
    const btn = document.getElementById('nav-misiones');
    if (!btn) return;
    const abrir = typeof forzar === 'boolean' ? forzar : !panelMisionesAbierto;
    if (abrir && !panelMisionesEl) crearPanelMisiones();
    panelMisionesAbierto = abrir;
    if (panelMisionesEl) {
        panelMisionesEl.hidden = !abrir;
        panelMisionesEl.classList.toggle('nav-misiones-panel--hoja', window.innerWidth < 900);
    }
    btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    if (abrir) {
        colocarPanelMisiones();
        window.Alpine?.store('misiones')?.cargar();
    }
};

window.refrescarMisionesNav = function refrescarMisionesNav() {
    const estado = window.Alpine?.store('misiones');
    if (!estado) return;
    pintarBadgeMisiones({
        pendientes: estado.pendientes,
        hechas: estado.cumplidas,
        total: estado.lista.length
    });
};

document.addEventListener('alpine:init', () => {
    window.Alpine.store('misiones', {
        lista: [],
        logueado: false,
        cargando: false,
        reclamando: '',
        get pendientes() {
            return this.lista.filter((m) => m.cumplida && !m.reclamada).length;
        },
        get cumplidas() {
            return this.lista.filter((m) => m.reclamada).length;
        },
        async cargar() {
            const token = window.almacen.texto('comunidad_session_token');
            const btn = document.getElementById('nav-misiones');
            this.logueado = !!token;
            if (btn) btn.hidden = !token;
            if (!token) {
                this.lista = [];
                window.refrescarMisionesNav?.();
                return;
            }
            if (this.cargando) return;
            this.cargando = true;
            try {
                const res = await window.rpc('misiones_estado', { p_token: token }, { error: false });
                if (res.ok && res.data && res.data.ok) this.lista = res.data.misiones || [];
            } finally {
                this.cargando = false;
                window.refrescarMisionesNav?.();
            }
        },
        async reclamar(m) {
            if (this.reclamando || !m) return;
            const token = window.almacen.texto('comunidad_session_token');
            if (!token) return;
            this.reclamando = m.clave;
            try {
                const res = await window.rpc('reclamar_mision', { p_token: token, p_clave: m.clave }, { error: false });
                const datos = res.data || {};
                if (!res.ok || !datos.ok) {
                    window.mostrarToast?.(datos.error === 'sin_cumplir'
                        ? 'Todavía no cumples esa misión.'
                        : 'No se pudo cobrar la misión.', true);
                    return;
                }
                if (datos.ganados > 0) {
                    window.mostrarToast?.('+' + datos.ganados + ' puntos: ' + m.titulo);
                    window.actualizarSesionUsuarioComunidad?.({ puntos: datos.puntos });
                    window.actualizarUsuarioNavComunidad?.();
                    window.refrescarPuntosDia?.();
                } else if (datos.motivo === 'tope_diario') {
                    window.mostrarToast?.('Ya alcanzaste el tope de puntos de hoy.', true);
                }
                await this.cargar();
            } finally {
                this.reclamando = '';
            }
        }
    });
});

document.addEventListener('alpine:initialized', () => {
    window.Alpine?.store('misiones')?.cargar();
});
document.addEventListener('gocha:sesion', () => {
    window.Alpine?.store('misiones')?.cargar();
});
document.addEventListener('pointerdown', (evento) => {
    if (!panelMisionesAbierto) return;
    const panel = document.getElementById('nav-misiones-panel');
    const btn = document.getElementById('nav-misiones');
    if (panel && panel.contains(evento.target)) return;
    if (btn && btn.contains(evento.target)) return;
    window.toggleMisiones(false);
});
document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && panelMisionesAbierto) window.toggleMisiones(false);
});
window.addEventListener('resize', () => {
    if (panelMisionesAbierto) colocarPanelMisiones();
});

// === Panel App: en móvil se ancla a la pantalla, no al menú ===
window.portalPanelApp = function portalPanelApp(el, abierto) {
    if (!el) return;
    const movil = window.matchMedia('(max-width: 1100px)').matches;
    const portal = abierto && movil;
    el.classList.toggle('nav-app-panel--portal', portal);
    if (portal) {
        if (el.parentElement !== document.body) document.body.appendChild(el);
        return;
    }
    const ancla = document.querySelector('.nav-app');
    if (ancla && el.parentElement !== ancla) ancla.appendChild(el);
    if (!abierto) el.hidden = true;
};

// === Color de apodo (tienda) ===// Mapa apodo normalizado -> hex. Se carga una vez por página y las vistas se
// repintan al recibir 'gocha:colores'.
const _perfilesApodo = new Map();
window.cargarColoresApodo = async function cargarColoresApodo() {
    if (!window.supabase) return;
    try {
        const { data, error } = await window.supabase
            .from('usuarios_comunidad')
            .select('apodo, color_apodo, titulo_equipado, marco_equipado')
            .or('color_apodo.not.is.null,titulo_equipado.not.is.null,marco_equipado.is.true');
        if (error) return;
        _perfilesApodo.clear();
        (data || []).forEach((u) => {
            if (!u || !u.apodo) return;
            _perfilesApodo.set(String(u.apodo).trim().toLowerCase(), {
                color: u.color_apodo || '',
                titulo: u.titulo_equipado || '',
                marco: !!u.marco_equipado
            });
        });
        document.dispatchEvent(new CustomEvent('gocha:colores'));
    } catch (e) { /* sin adornos */ }
};
window.colorApodoDe = function colorApodoDe(apodo) {
    const p = _perfilesApodo.get(String(apodo || '').trim().toLowerCase());
    return (p && p.color) || '';
};
window.tituloApodoDe = function tituloApodoDe(apodo) {
    const p = _perfilesApodo.get(String(apodo || '').trim().toLowerCase());
    return (p && p.titulo) || '';
};
window.marcoApodoDe = function marcoApodoDe(apodo) {
    const p = _perfilesApodo.get(String(apodo || '').trim().toLowerCase());
    return !!(p && p.marco);
};
window.aplicarColoresApodo = function aplicarColoresApodo() {
    window.cargarColoresApodo();
};

// === MENÚ MÓVIL ===

// Estado global de UI (menú móvil) para Alpine.
document.addEventListener('alpine:init', () => {
    window.Alpine.store('ui', { menuAbierto: false, menuNav: '', menus: {} });
    window.Alpine.store('toast', {
        cola: [],
        _seq: 0,
        get visible() { return this.cola.length > 0; },
        get mensaje() { return this.cola.length ? this.cola[this.cola.length - 1].mensaje : ''; },
        get esError() { return this.cola.length ? this.cola[this.cola.length - 1].esError : false; },
        mostrar(mensaje, esError = false) {
            const item = { id: ++this._seq, mensaje: String(mensaje ?? ''), esError: !!esError };
            this.cola.push(item);
            while (this.cola.length > 3) this.cola.shift();
            setTimeout(() => this.quitar(item.id), 3200);
        },
        quitar(id) {
            this.cola = this.cola.filter((item) => item.id !== id);
        },
        ocultar() {
            this.cola = [];
        }
    });
    if (_toastsPendientes.length) {
        const pendientes = _toastsPendientes;
        _toastsPendientes = [];
        pendientes.forEach(([mensaje, esError]) => window.mostrarToast(mensaje, esError));
    }
});

window.cerrarMenusNavbar = function cerrarMenusNavbar() {
    const ui = window.Alpine?.store('ui');
    if (ui) ui.menuNav = '';
};

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

    // Actualizar contador de followers si existe (solo en index.html)
    const followersCount = data.followers_count ?? data.channel?.followers_count ?? data.user?.followers_count;
    const followersEl = document.getElementById('kick-followers-count');
    if (followersEl && followersCount !== undefined) {
        followersEl.textContent = formatNumber(followersCount);
        followersEl.title = followersCount.toLocaleString('es-ES') + ' seguidores';
    }

    window.pintarEstadoNav(enVivo);

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
    if (almacen.texto('comunidad_logout_explicito') === '1') return false;
    if (almacen.texto('comunidad_session_token')) return false;
    try {
        const { data: authData } = await window.supabase.auth.getSession();
        if (!authData || !authData.session) return false;
        if (almacen.texto('comunidad_logout_explicito') === '1') return false;
        const { data, error } = await window.rpcRaw('sesion_comunidad_vinculada');
        if (error || !data || !data.ok || !data.token) return false;
        if (almacen.texto('comunidad_logout_explicito') === '1') return false;
        const val = await window.rpcRaw('validar_sesion_comunidad', { p_token: data.token });
        if (val.error || !val.data || !val.data.ok) return false;
        if (almacen.texto('comunidad_logout_explicito') === '1') return false;
        const usuario = val.data.usuario;
        almacen.guardarTexto('comunidad_session_token', data.token);
        almacen.guardarTexto('comunidad_nickname', usuario.apodo);
        almacen.guardarTexto('comunidad_user_id', String(usuario.id));
        window.avisarCambioSesion?.('login');
        almacen.guardarTexto('comunidad_session_usuario', JSON.stringify(usuario));
        window.actualizarUsuarioNavComunidad?.();
        window.latidoComunidad?.();
        return true;
    } catch (e) {
        return false;
    }
};

async function insertarAccesoAdminFooter() {
    let admin = false;
    try {
        admin = typeof window.esAdminActual === 'function' ? !!(await window.esAdminActual()) : false;
    } catch (e) {
        admin = false;
    }
    if (!admin) {
        document.querySelectorAll('.footer-admin-link').forEach((b) => b.remove());
        return;
    }
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

// Solo sale con sesión de admin: al entrar o salir se recalcula.
document.addEventListener('gocha:sesion', () => {
    try { insertarAccesoAdminFooter(); } catch (e) {}
});

// === PANEL GLOBAL DE ADMINISTRACIÓN (modal, sin página aparte) ===
window.abrirAdminPanel = function abrirAdminPanel(tab, opciones) {
    const abrir = () => {
        const store = window.Alpine && window.Alpine.store ? window.Alpine.store('adminPanel') : null;
        if (store) store.abrir(tab || 'login', opciones || {});
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
    modal.setAttribute('x-on:click.self', '$store.adminPanel.cerrar()');
    modal.innerHTML = `
        <div class="admin-global-backdrop" x-on:click="$store.adminPanel.cerrar()"></div>
        <div class="admin-global-card" role="dialog" aria-modal="true" aria-labelledby="admin-global-title" x-trap.noscroll="$store.adminPanel.abierto">
            <header class="admin-global-head">
                <div>
                    <h2 id="admin-global-title">Administración</h2>
                    <p class="admin-page-sub" x-text="$store.adminPanel.sesion ? ('Sesión: ' + $store.adminPanel.email + ($store.adminPanel.owner ? ' · Owner' : ($store.adminPanel.admin ? ' · Admin' : ' · sin rol'))) : 'Acceso de administración'"></p>
                </div>
                <button type="button" class="admin-global-close" x-on:click="$store.adminPanel.cerrar()" aria-label="Cerrar panel">&times;</button>
            </header>

            <p class="gallery-empty" x-show="$store.adminPanel.cargando">Comprobando sesión...</p>

            <template x-if="!$store.adminPanel.cargando && !$store.adminPanel.sesion">
                <div class="admin-login-card">
                    <p>Este panel usa tu cuenta de la comunidad. Entra desde el menú <strong>Login</strong> con una cuenta con rol de administración.</p>
                    <p class="admin-login-error" x-show="$store.adminPanel.loginError" x-text="$store.adminPanel.loginError"></p>
                    <button type="button" class="btn-admin-mode" x-on:click="$store.adminPanel.cerrar(); window.abrirLoginMenu?.('login')">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-right-to-bracket"></use></svg>
                        <span>Abrir login</span>
                    </button>
                </div>
            </template>

            <template x-if="!$store.adminPanel.cargando && $store.adminPanel.sesion && !$store.adminPanel.admin">
                <div class="admin-login-card">
                    <h3><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-ban"></use></svg> <span x-text="$store.adminPanel.errorRol ? 'No se pudo comprobar' : 'Sin permisos'"></span></h3>
                    <p x-text="$store.adminPanel.errorRol ? 'La comprobación del rol falló. Puede que la sesión haya caducado: vuelve a entrar.' : 'Esta cuenta de la comunidad no tiene rol de administración.'"></p>
                    <p class="admin-login-email" x-text="$store.adminPanel.email"></p>
                    <button type="button" class="btn-admin-mode" x-on:click="$store.adminPanel.comprobarSesion()">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-rotate"></use></svg>
                        <span>Volver a comprobar</span>
                    </button>
                    <button type="button" class="btn-admin-mode" x-on:click="$store.adminPanel.cerrar(); window.abrirLoginMenu?.('login')">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-right-to-bracket"></use></svg>
                        <span>Entrar de nuevo</span>
                    </button>
                </div>
            </template>

            <div x-show="!$store.adminPanel.cargando && $store.adminPanel.admin">

                <div class="admin-tabs" role="tablist" aria-label="Paneles de administración">
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'buzon' }" x-on:click="$store.adminPanel.setTab('buzon')" role="tab" :aria-selected="$store.adminPanel.tab === 'buzon' ? 'true' : 'false'" x-show="$store.adminPanel.owner">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-envelope"></use></svg> Buzón
                        <span class="admin-tab-count" x-show="$store.adminPanel.noLeidas > 0" x-text="$store.adminPanel.noLeidas"></span>
                    </button>
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'usuarios' }" x-on:click="$store.adminPanel.setTab('usuarios')" role="tab" :aria-selected="$store.adminPanel.tab === 'usuarios' ? 'true' : 'false'">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-users"></use></svg> Usuarios
                    </button>
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'reportes' }" x-on:click="$store.adminPanel.setTab('reportes')" role="tab" :aria-selected="$store.adminPanel.tab === 'reportes' ? 'true' : 'false'">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-ban"></use></svg> Reportes
                        <span class="admin-tab-count" x-show="$store.adminPanel.reportes.length > 0" x-text="$store.adminPanel.reportes.length"></span>
                    </button>
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'descargas' }" x-on:click="$store.adminPanel.setTab('descargas')" role="tab" :aria-selected="$store.adminPanel.tab === 'descargas' ? 'true' : 'false'">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-brands-android"></use></svg> Descargas
                    </button>
                    <button type="button" class="admin-tab-btn" :class="{ active: $store.adminPanel.tab === 'auditoria' }" x-on:click="$store.adminPanel.setTab('auditoria')" role="tab" :aria-selected="$store.adminPanel.tab === 'auditoria' ? 'true' : 'false'">
                        <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-shield-halved"></use></svg> Auditoría
                    </button>
                </div>

                <div class="admin-tab-panel" x-show="$store.adminPanel.tab === 'buzon' && $store.adminPanel.owner" x-cloak>
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
                        <label class="admin-checkbox gochi-switch">
                            <input type="checkbox" x-model="$store.adminPanel.soloBaneados" x-on:change="$store.adminPanel.cargarUsuarios(0)">
                            <span class="gochi-switch-track" aria-hidden="true"></span>
                            <span>Solo baneados</span>
                        </label>
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarUsuarios(0)">Buscar</button>
                    </div>
                    <p class="gallery-empty" x-show="$store.adminPanel.usuariosEstado === 'error'" x-text="$store.adminPanel.errorUsuarios" x-cloak></p>
                    <div class="admin-cargando" x-show="$store.adminPanel.usuariosEstado === 'cargando'" aria-hidden="true">
                        <span class="gochi-skeleton gochi-skeleton--texto"></span>
                        <span class="gochi-skeleton gochi-skeleton--texto"></span>
                        <span class="gochi-skeleton gochi-skeleton--texto"></span>
                    </div>
                    <div class="gochi-tabla-wrap" x-show="$store.adminPanel.usuariosEstado === 'lista'">
                        <table class="gochi-tabla gochi-tabla--admin">
                            <caption class="visually-hidden">Usuarios de la comunidad</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Usuario</th>
                                    <th scope="col">Puntos</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template x-for="u in $store.adminPanel.usuarios" :key="u.id">
                                    <tr :class="{ 'fila-baneado': u.baneado_activo, 'fila-shadowban': u.shadowban, 'fila-staff': u.rol !== 'user' }">
                                        <td data-label="Usuario">
                                            <div class="admin-tabla-usuario">
                                                <button type="button" class="admin-usuario-avatar-btn"
                                                        x-on:click="$store.adminPanel.verPerfil(u)"
                                                        x-bind:title="'Ver perfil de ' + u.apodo"
                                                        x-bind:aria-label="'Ver perfil de ' + u.apodo">
                                                    <img class="admin-usuario-avatar-img" x-show="$store.adminPanel.avatarDe(u)"
                                                         x-bind:src="$store.adminPanel.avatarDe(u)" alt="" loading="lazy">
                                                    <span class="admin-usuario-avatar" x-show="!$store.adminPanel.avatarDe(u)"
                                                          x-text="(u.apodo || '?').charAt(0).toUpperCase()"></span>
                                                    <span class="admin-avatar-dot" :class="{ online: u.en_linea }" aria-hidden="true"></span>
                                                </button>
                                                <div class="admin-usuario-datos">
                                                    <div class="admin-usuario-linea">
                                                        <button type="button" class="admin-usuario-apodo admin-link-perfil"
                                                                x-on:click="$store.adminPanel.verPerfil(u)" x-text="u.apodo"></button>
                                                        <span class="admin-rol-badge gochi-chip gochi-chip--sm" data-tono="aviso" x-show="u.rol !== 'user'" x-text="u.rol"></span>
                                                        <span class="admin-kick-badge gochi-chip gochi-chip--sm" data-tono="info" x-show="u.kick_user_id" x-text="'KICK'"></span>
                                                    </div>
                                                    <span class="admin-usuario-kick" x-show="u.kick_username"
                                                          x-text="'@' + u.kick_username"></span>
                                                    <span class="admin-usuario-ultima"
                                                          x-text="u.en_linea ? 'En línea ahora' : (u.ultima_actividad ? $store.adminPanel.hace(u.ultima_actividad) : 'Sin datos')"></span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Puntos">
                                            <span class="admin-usuario-meta">
                                                <span class="admin-stat"><strong x-text="u.puntos"></strong> pts</span>
                                                <span class="rango-badge" :class="'rango-' + window.claveRango(u.rango, u.puntos)" x-text="window.etiquetaRango(u.rango, u.puntos)"></span>
                                            </span>
                                        </td>
                                        <td data-label="Estado">
                                            <div class="admin-usuario-estado">
                                                <span class="gochi-chip gochi-chip--sm"
                                                      :data-tono="u.baneado_activo ? 'peligro' : (u.shadowban ? 'aviso' : 'exito')"
                                                      x-text="u.baneado_activo ? '🔴 Baneado' : (u.shadowban ? '🟡 Shadowban' : 'Sin sanción')"></span>
                                                <template x-if="u.baneado_hasta && u.baneado_activo">
                                                    <span class="ban-hasta" x-text="'Hasta: ' + $store.adminPanel.fecha(u.baneado_hasta)"></span>
                                                </template>
                                            </div>
                                        </td>
                                        <td data-label="Acciones">
                                            <div class="admin-tabla-acciones">
                                                <button type="button" class="btn-admin-accion btn-perfil" x-on:click="$store.adminPanel.verPerfil(u)">Ver perfil</button>
                                                <button type="button" class="btn-admin-accion btn-ban" x-on:click="$store.adminPanel.toggleBan(u)" x-text="u.baneado_activo ? 'Desbanear' : 'Banear'"></button>
                                                <button type="button" class="btn-admin-accion btn-shadowban" x-on:click="$store.adminPanel.toggleShadowban(u)" x-text="u.shadowban ? 'Quitar Shadowban' : 'Shadowban'"></button>
                                                <button type="button" class="btn-admin-accion btn-eliminar" x-show="u.rol === 'user'"
                                                        x-on:click="$store.adminPanel.eliminarUsuario(u)">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                    <p class="gallery-empty" x-show="$store.adminPanel.usuariosEstado === 'lista' && !$store.adminPanel.usuarios.length">No hay usuarios.</p>
                    <div class="admin-paginacion gochi-paginacion" x-show="$store.adminPanel.totalUsuarios > 50">
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarUsuarios(-1)" :disabled="$store.adminPanel.paginaUsuarios === 0">← Anterior</button>
                        <span class="pag-info gochi-paginacion-info" x-text="'Página ' + ($store.adminPanel.paginaUsuarios + 1) + ' de ' + Math.ceil($store.adminPanel.totalUsuarios / 50)"></span>
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarUsuarios(1)" :disabled="($store.adminPanel.paginaUsuarios + 1) * 50 >= $store.adminPanel.totalUsuarios">Siguiente →</button>
                    </div>
                </div>

                <div class="admin-tab-panel" x-show="$store.adminPanel.tab === 'reportes'" x-cloak>
                    <div class="buzon-toolbar">
                        <h2><svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-ban"></use></svg> Reportes de la galería</h2>
                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.cargarReportes()" :disabled="$store.adminPanel.reportesEstado === 'cargando'">Actualizar</button>
                    </div>
                    <p class="gallery-empty" x-show="$store.adminPanel.reportesEstado === 'cargando'">Cargando reportes...</p>
                    <p class="gallery-empty" x-show="$store.adminPanel.reportesEstado === 'error'" x-text="$store.adminPanel.errorReportes" x-cloak></p>
                    <div class="reportes-lista" x-show="$store.adminPanel.reportesEstado === 'lista'">
                        <template x-for="r in $store.adminPanel.reportes" :key="r.id">
                            <div class="reporte-item">
                                <img class="reporte-miniatura" :src="r.galeria?.thumb_url || r.galeria?.image_url || 'img/mcchary/empty.webp'" alt="" loading="lazy" width="80" height="60">
                                <div class="reporte-cuerpo">
                                    <div class="reporte-cabecera">
                                        <strong x-text="r.galeria?.title || 'Foto eliminada'"></strong>
                                        <time class="buzon-fecha" :datetime="r.creada_en" x-text="$store.adminPanel.fecha(r.creada_en)"></time>
                                    </div>
                                    <span class="reporte-autor" x-text="'Autor: ' + (r.galeria?.autor || 'desconocido')"></span>
                                    <span class="reporte-motivo" x-text="'Motivo: ' + (r.motivo || 'sin motivo')"></span>
                                    <p class="reporte-detalle" x-show="r.detalle" x-text="r.detalle"></p>
                                    <div class="buzon-acciones">
                                        <button type="button" class="btn-admin-pag" x-on:click="$store.adminPanel.marcarReporte(r)" :disabled="$store.adminPanel.reportesEstado === 'cargando'">Marcar revisado</button>
                                        <button type="button" class="btn-admin-pag btn-peligro" x-on:click="$store.adminPanel.eliminarReporte(r)" :disabled="$store.adminPanel.reportesEstado === 'cargando'">Eliminar reporte</button>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <p class="gallery-empty" x-show="!$store.adminPanel.reportes.length">Sin reportes pendientes.</p>
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
                            <div class="desc-stat">
                                <span class="desc-stat-num" x-text="$store.adminPanel.descargas.dispositivos ?? 0"></span>
                                <span class="desc-stat-label">Dispositivos</span>
                            </div>
                            <div class="desc-stat">
                                <span class="desc-stat-num" x-text="$store.adminPanel.descargas.activos7 ?? 0"></span>
                                <span class="desc-stat-label">Activos 7 días</span>
                            </div>
                            <div class="desc-stat">
                                <span class="desc-stat-num" x-text="$store.adminPanel.descargas.actualizaciones ?? 0"></span>
                                <span class="desc-stat-label">Actualizaciones</span>
                            </div>
                        </div>

                        <div class="desc-columnas">
                            <div class="desc-bloque">
                                <h3>Por versión descargada</h3>
                                <table class="gochi-tabla">
                                    <caption class="visually-hidden">Descargas por versión descargada</caption>
                                    <thead>
                                        <tr><th scope="col">Versión</th><th scope="col">Descargas</th></tr>
                                    </thead>
                                    <tbody>
                                        <template x-for="v in ($store.adminPanel.descargas.porVersion || [])" :key="'v-' + v.version">
                                            <tr>
                                                <td data-label="Versión" x-text="v.version || 'sin versión'"></td>
                                                <td data-label="Descargas"><strong x-text="v.total"></strong></td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <p class="gallery-empty" x-show="!($store.adminPanel.descargas.porVersion || []).length">Sin datos.</p>
                            </div>
                            <div class="desc-bloque">
                                <h3>Por origen</h3>
                                <table class="gochi-tabla">
                                    <caption class="visually-hidden">Descargas por origen</caption>
                                    <thead>
                                        <tr><th scope="col">Origen</th><th scope="col">Descargas</th></tr>
                                    </thead>
                                    <tbody>
                                        <template x-for="o in ($store.adminPanel.descargas.porOrigen || [])" :key="'o-' + o.origen">
                                            <tr>
                                                <td data-label="Origen" x-text="o.origen"></td>
                                                <td data-label="Descargas"><strong x-text="o.total"></strong></td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <p class="gallery-empty" x-show="!($store.adminPanel.descargas.porOrigen || []).length">Sin datos.</p>
                            </div>
                        </div>

                        <div class="desc-columnas">
                            <div class="desc-bloque">
                                <h3>Versiones instaladas</h3>
                                <table class="gochi-tabla">
                                    <caption class="visually-hidden">Dispositivos por versión instalada</caption>
                                    <thead>
                                        <tr><th scope="col">Versión</th><th scope="col">Dispositivos</th></tr>
                                    </thead>
                                    <tbody>
                                        <template x-for="v in ($store.adminPanel.descargas.porVersionInstalada || [])" :key="'vi-' + v.version">
                                            <tr>
                                                <td data-label="Versión" x-text="v.version === '?' ? 'sin versión' : 'v' + v.version"></td>
                                                <td data-label="Dispositivos"><strong x-text="v.total"></strong></td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <p class="gallery-empty" x-show="!($store.adminPanel.descargas.porVersionInstalada || []).length">Sin datos todavía.</p>
                            </div>
                            <div class="desc-bloque">
                                <h3>Actualizaciones por salto</h3>
                                <table class="gochi-tabla">
                                    <caption class="visually-hidden">Actualizaciones por salto de versión</caption>
                                    <thead>
                                        <tr><th scope="col">Salto</th><th scope="col">Total</th></tr>
                                    </thead>
                                    <tbody>
                                        <template x-for="a in ($store.adminPanel.descargas.porActualizacion || [])" :key="'a-' + a.desde_version + '-' + a.hasta_version">
                                            <tr>
                                                <td data-label="Salto" x-text="'v' + (a.desde_version || '?') + ' → v' + a.hasta_version"></td>
                                                <td data-label="Total"><strong x-text="a.total"></strong></td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <p class="gallery-empty" x-show="!($store.adminPanel.descargas.porActualizacion || []).length">Sin datos todavía.</p>
                            </div>
                        </div>

                        <div class="desc-bloque">
                            <h3>Últimas actualizaciones</h3>
                            <table class="gochi-tabla">
                                <caption class="visually-hidden">Últimas actualizaciones detectadas</caption>
                                <thead>
                                    <tr><th scope="col">Fecha</th><th scope="col">Salto</th></tr>
                                </thead>
                                <tbody>
                                    <template x-for="(a, i) in ($store.adminPanel.descargas.ultimasActualizaciones || [])" :key="'ua-' + i">
                                        <tr>
                                            <td data-label="Fecha" x-text="$store.adminPanel.fecha(a.creado_en)"></td>
                                            <td data-label="Salto" class="desc-etiqueta" x-text="'v' + (a.desde_version || '?') + ' → v' + a.hasta_version"></td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                            <p class="gallery-empty" x-show="!($store.adminPanel.descargas.ultimasActualizaciones || []).length">Sin datos todavía.</p>
                            <p class="desc-etiqueta">Se detectan al abrir la app. Datos anónimos, sin cuenta ni identidad.</p>
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
                            <table class="gochi-tabla">
                                <caption class="visually-hidden">Últimas descargas registradas</caption>
                                <thead>
                                    <tr><th scope="col">Fecha</th><th scope="col">Versión y origen</th></tr>
                                </thead>
                                <tbody>
                                    <template x-for="(d, i) in ($store.adminPanel.descargas.ultimas || [])" :key="'u-' + i">
                                        <tr>
                                            <td data-label="Fecha" x-text="$store.adminPanel.fecha(d.creada_en)"></td>
                                            <td data-label="Versión y origen" class="desc-etiqueta" x-text="(d.version || '?') + ' · ' + (d.origen || 'web')"></td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                            <p class="gallery-empty" x-show="!($store.adminPanel.descargas.ultimas || []).length">Sin datos.</p>
                        </div>
                    </div>
                </div>

                <div class="admin-tab-panel" x-show="$store.adminPanel.tab === 'auditoria'" x-cloak>
                    <p class="gallery-empty" x-show="$store.adminPanel.auditEstado === 'cargando'">Cargando auditoría...</p>
                    <p class="gallery-empty" x-show="$store.adminPanel.auditEstado === 'error'" x-text="$store.adminPanel.errorAudit" x-cloak></p>
                    <div class="gochi-tabla-wrap" x-show="$store.adminPanel.auditEstado === 'lista'">
                        <table class="gochi-tabla gochi-tabla--admin">
                            <caption class="visually-hidden">Registro de auditoría de moderación</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Acción</th>
                                    <th scope="col">Detalle</th>
                                    <th scope="col">Admin</th>
                                    <th scope="col">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template x-for="a in $store.adminPanel.auditLog" :key="a.id">
                                    <tr>
                                        <td data-label="Acción" class="auditoria-accion" x-text="a.accion"></td>
                                        <td data-label="Detalle"><div class="auditoria-detalle" x-html="$store.adminPanel.formatearDetalle(a.detalle)"></div></td>
                                        <td data-label="Admin"><span x-text="a.admin_apodo || 'Sistema'"></span></td>
                                        <td data-label="Fecha"><time :datetime="a.created_at" x-text="$store.adminPanel.fecha(a.created_at)"></time></td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
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
        errorRol: false,
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
        _seqUsuarios: 0,

        auditLog: [],
        auditEstado: 'inicial',
        errorAudit: '',
        totalAudit: 0,
        paginaAudit: 0,

        sugerencias: [],
        sugEstado: 'inicial',
        errorSug: '',
        noLeidas: 0,

        reportes: [],
        reportesEstado: 'inicial',
        errorReportes: '',

        descargas: {},
        descEstado: 'inicial',
        errorDesc: '',

        fecha(valor) {
            return window.formatearFecha(valor, 'completo');
        },

        hace(valor) {
            if (!valor) return 'sin datos';
            const d = new Date(valor);
            if (Number.isNaN(d.getTime())) return 'sin datos';
            const seg = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
            if (seg < 60) return 'hace ' + seg + ' s';
            const min = Math.floor(seg / 60);
            if (min < 60) return 'hace ' + min + ' min';
            const h = Math.floor(min / 60);
            if (h < 24) return 'hace ' + h + ' h';
            const dias = Math.floor(h / 24);
            if (dias < 30) return 'hace ' + dias + (dias === 1 ? ' día' : ' días');
            const meses = Math.floor(dias / 30);
            if (meses < 12) return 'hace ' + meses + (meses === 1 ? ' mes' : ' meses');
            const anios = Math.floor(meses / 12);
            return 'hace ' + anios + (anios === 1 ? ' año' : ' años');
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

        async abrir(tab, opciones = {}) {
            this.abierto = true;
            this.loginError = '';
            await this.comprobarSesion();
            if (this.admin) {
                const pedida = (!tab || tab === 'login')
                    ? (this.owner ? 'buzon' : 'usuarios')
                    : tab;
                this.tab = (pedida === 'buzon' && !this.owner) ? 'usuarios' : pedida;
                // Desde la paleta: abrir Usuarios ya filtrado por un apodo.
                if (opciones && opciones.buscar) {
                    this.buscar = String(opciones.buscar);
                    this.tab = 'usuarios';
                }
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
            const token = almacen.texto('comunidad_session_token');
            let authUser = null;
            try {
                const { data: authData } = await window.supabase.auth.getSession();
                authUser = authData?.session?.user || null;
            } catch (e) { /* sin sesión Auth */ }
            this.sesion = !!token || !!authUser;
            const usuario = window.obtenerSesionUsuarioComunidad?.() || {};
            this.email = usuario.apodo || authUser?.email || '';
            this.admin = false;
            this.owner = false;
            this.errorRol = false;
            if (!this.sesion) {
                this.cargando = false;
                return;
            }
            try {
                const [adminRes, ownerRes] = await Promise.all([
                    window.rpcRaw('es_admin'),
                    window.rpcRaw('es_owner')
                ]);
                this.admin = adminRes && adminRes.data === true;
                this.owner = ownerRes && ownerRes.data === true;
                this.errorRol = !!(adminRes && adminRes.error) || !!(ownerRes && ownerRes.error);
                this.cargando = false;
            } catch (e) {
                console.error('Error comprobando sesión admin:', e);
                this.cargando = false;
                this.loginError = 'No se pudo comprobar la sesión.';
            }
        },

        setTab(tab) {
            if (tab === 'buzon' && !this.owner) return;
            this.tab = tab;
            this.cargarTab();
        },

        cargarTab() {
            if (this.tab === 'buzon') return this.cargarSugerencias();
            if (this.tab === 'usuarios') return this.cargarUsuarios(0);
            if (this.tab === 'reportes') return this.cargarReportes();
            if (this.tab === 'descargas') return this.cargarDescargas();
            if (this.tab === 'auditoria') return this.cargarAuditoria(0);
        },

        tokenComunidad() {
            return almacen.texto('comunidad_session_token') || '';
        },

        async cargarSugerencias() {
            if (!this.owner) return;
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
                const { data, error } = await window.rpcRaw('owner_marcar_sugerencia', {
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
            const ok = await window.confirmarAccion({
                titulo: 'Borrar sugerencia',
                mensaje: '¿Borrar esta sugerencia definitivamente? No se puede deshacer.',
                textoConfirmar: 'Borrar',
                tono: 'peligro',
                icono: 'i-solid-trash-can'
            });
            if (!ok) return;
            try {
                const { data, error } = await window.rpcRaw('owner_eliminar_sugerencia', { p_id: sugerencia.id });
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

        async cargarReportes() {
            if (!this.admin) return;
            this.reportesEstado = 'cargando';
            this.errorReportes = '';
            try {
                const { data, error } = await window.supabase
                    .from('galeria_reportes')
                    .select('id,image_id,motivo,detalle,creada_en,galeria(title,thumb_url,image_url,autor)')
                    .eq('revisado', false)
                    .order('creada_en', { ascending: true })
                    .limit(100);
                if (error) throw error;
                this.reportes = (data || []).map((r) => ({
                    ...r,
                    galeria: Array.isArray(r.galeria) ? (r.galeria[0] || null) : (r.galeria || null)
                }));
                this.reportesEstado = 'lista';
            } catch (e) {
                console.error('Error cargando reportes de galería:', e);
                this.errorReportes = 'No se pudieron cargar los reportes.';
                this.reportesEstado = 'error';
            }
        },

        async marcarReporte(reporte) {
            if (!reporte || !reporte.id) return;
            try {
                const { data, error } = await window.rpcRaw('admin_marcar_reporte', { p_id: reporte.id });
                if (error || !data || !data.ok) {
                    window.mostrarToast?.('No se pudo marcar el reporte como revisado.', true);
                    return;
                }
                this.reportes = this.reportes.filter((r) => r.id !== reporte.id);
                window.mostrarToast?.('Reporte marcado como revisado');
            } catch (e) {
                window.mostrarToast?.('No se pudo marcar el reporte como revisado.', true);
            }
        },

        async eliminarReporte(reporte) {
            if (!reporte || !reporte.id) return;
            try {
                const { data, error } = await window.rpcRaw('admin_eliminar_reporte', { p_id: reporte.id });
                if (error || !data || !data.ok) {
                    window.mostrarToast?.('No se pudo eliminar el reporte.', true);
                    return;
                }
                this.reportes = this.reportes.filter((r) => r.id !== reporte.id);
                window.mostrarToast?.('Reporte eliminado');
            } catch (e) {
                window.mostrarToast?.('No se pudo eliminar el reporte.', true);
            }
        },

        async cargarDescargas() {
            if (!this.admin) return;
            this.descEstado = 'cargando';
            this.errorDesc = '';
            try {
                const { data, error } = await window.rpcRaw('app_descargas_stats', {
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
            const seq = ++this._seqUsuarios;
            try {
                const { data, error } = await window.rpcRaw('admin_listar_usuarios', {
                    p_token: this.tokenComunidad(),
                    p_buscar: this.buscar.trim() || null,
                    p_solo_baneados: !!this.soloBaneados,
                    p_limite: 50,
                    p_offset: this.paginaUsuarios * 50
                });
                // Descarta respuestas viejas: una búsqueda rápida no debe pintar
                // resultados de una petición anterior.
                if (seq !== this._seqUsuarios) return;
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
                if (seq !== this._seqUsuarios) return;
                console.error('Error cargando usuarios admin:', e);
                this.errorUsuarios = 'Error inesperado';
                this.usuariosEstado = 'error';
            }
        },

        async toggleBan(usuario) {
            const estaBaneado = !!usuario.baneado_activo;
            try {
                const { data, error } = await window.rpcRaw('admin_ban_usuario', {
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
                const { data, error } = await window.rpcRaw('admin_shadowban_usuario', {
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

        avatarDe(u) {
            if (!u) return '';
            if (u.avatar_url) return u.avatar_url;
            if (u.genero === 'femenino') return '/img/avatars/avatar-female.webp';
            if (u.genero === 'masculino') return '/img/avatars/avatar-male.webp';
            return '';
        },

        verPerfil(u) {
            if (!u) return;
            window.abrirPerfilUsuario?.(u.apodo, { sobreAdmin: true });
        },

        async eliminarUsuario(usuario) {
            if (!usuario || !usuario.id) return;
            const ok = await window.confirmarAccion({
                titulo: 'Eliminar cuenta',
                mensaje: '¿Eliminar la cuenta de "' + usuario.apodo + '"? Se borran su perfil, mensajes, reacciones, fotos, saludos y puntos. No se puede deshacer.',
                textoConfirmar: 'Eliminar',
                tono: 'peligro',
                icono: 'i-solid-trash-can'
            });
            if (!ok) return;
            try {
                const { data, error } = await window.rpcRaw('admin_eliminar_usuario', {
                    p_token: this.tokenComunidad(),
                    p_usuario_id: usuario.id,
                    p_motivo: 'Eliminado desde el panel'
                });
                if (error || !data || !data.ok) {
                    const mensajes = {
                        protegido: 'No se puede eliminar a un admin u owner.',
                        no_encontrado: 'Ese usuario ya no existe.',
                        sin_permiso: 'Sin permiso.'
                    };
                    window.mostrarToast?.(mensajes[data?.error] || 'Error: ' + (data?.error || 'desconocido'), true);
                    return;
                }
                window.mostrarToast?.('Cuenta eliminada: ' + (data.apodo || usuario.apodo));
                this.cargarUsuarios(0);
            } catch (e) {
                console.error('Error eliminando usuario:', e);
                window.mostrarToast?.('Error al eliminar la cuenta', true);
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
                const { data, error } = await window.rpcRaw('admin_obtener_audit_log', {
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
        try {
            const r = await window.llamarEdge('kick-chat', cuerpo, { token });
            return { ok: r.ok, estado: r.status, datos: r.datos };
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
    window.cerrarSesionKick = async function cerrarSesionKick(opciones) {
        const conservar = !!(opciones && opciones.conservarToken);
        const token = almacen.texto(api.claveToken);
        if (token && !conservar) {
            try { await pedir({ accion: 'salir' }, token); } catch (e) {}
            almacen.borrar(api.claveToken);
        }
        window.CHAT_KICK.sesion = null;
        document.querySelectorAll('[data-chat-kick]').forEach((host) => {
            if (typeof host._actualizarCuenta === 'function') host._actualizarCuenta(null);
        });
    };

    const conEmotes = (texto) => {
        const crudo = String(texto ?? '');
        return crudo.split(/(\[emote:\d+:[^\]]*\])/g).map((parte) => {
            const kick = parte.match(/^\[emote:(\d+):([^\]]*)\]$/);
            if (!kick) {
                return window.renderizarEmotes7TV ? window.renderizarEmotes7TV(parte) : window.escapeHtml(parte);
            }
            const nombre = window.escapeAttr(kick[2]);
            return '<img class="chat-kick-emote" src="https://files.kick.com/emotes/' + kick[1] +
                '/fullsize" alt="' + nombre + '" title="' + nombre + '" loading="lazy" width="24" height="24">';
        }).join('');
    };

    const SIMBOLO_BADGE = { moderator: '🛡', founder: '👑', subscriber: '⭐', vip: '💎', verified: '✓' };

    let campoKick = null;
    let ultimoAutorKick = '';
    let ultimaHoraKick = 0;
    let ultimoDiaKick = '';

    const miApodoKick = () => String(window.obtenerSesionUsuarioComunidad?.()?.apodo || '').toLowerCase();

    const resaltarMenciones = (html) => {
        const apodo = miApodoKick();
        if (!apodo) return html;
        const seguro = apodo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return html.replace(new RegExp('@' + seguro + '(?![\\w])', 'gi'), (m) => '<span class="chat-kick-mencion">' + m + '</span>');
    };

    const pintarMensaje = (m) => {
        const fila = document.createElement('div');
        fila.className = 'chat-kick-mensaje';
        fila.dataset.id = m.message_id;

        const fecha = new Date(m.created_at);
        const horaMs = Number.isNaN(fecha.getTime()) ? Date.now() : fecha.getTime();
        const dia = new Date(horaMs).toISOString().slice(0, 10);

        if (dia !== ultimoDiaKick) {
            const separador = document.createElement('div');
            separador.className = 'chat-kick-dia';
            separador.textContent = window.formatearFecha(horaMs, 'dia-mes');
            fila.appendChild(separador);
            ultimoDiaKick = dia;
            ultimoAutorKick = '';
        }

        const continuo = m.sender_username === ultimoAutorKick && (horaMs - ultimaHoraKick) < 120000;
        if (continuo) fila.classList.add('chat-kick-mensaje--continuo');
        ultimoAutorKick = m.sender_username;
        ultimaHoraKick = horaMs;

        const cabeza = document.createElement('div');
        cabeza.className = 'chat-kick-mensaje-cabeza';

        const usuario = String(m.sender_username || '');
        const autor = document.createElement('a');
        autor.className = 'chat-kick-autor';
        autor.href = 'https://kick.com/' + encodeURIComponent(usuario);
        autor.target = '_blank';
        autor.rel = 'noopener noreferrer';
        autor.textContent = usuario;
        autor.title = 'Abrir el perfil de ' + usuario + ' en Kick';
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
        if (!Number.isNaN(fecha.getTime())) {
            hora.dateTime = fecha.toISOString();
            hora.textContent = window.formatearFecha(fecha, 'hora');
        }
        cabeza.appendChild(hora);

        const acciones = document.createElement('span');
        acciones.className = 'chat-kick-acciones';
        const mencionar = document.createElement('button');
        mencionar.type = 'button';
        mencionar.className = 'chat-kick-accion';
        mencionar.textContent = '@';
        mencionar.title = 'Mencionar a ' + usuario;
        mencionar.setAttribute('aria-label', 'Mencionar a ' + usuario);
        mencionar.addEventListener('click', () => {
            if (!campoKick) return;
            const texto = '@' + usuario + ' ';
            const inicio = campoKick.selectionStart ?? campoKick.value.length;
            const fin = campoKick.selectionEnd ?? campoKick.value.length;
            campoKick.value = campoKick.value.slice(0, inicio) + texto + campoKick.value.slice(fin);
            campoKick.focus();
            campoKick.setSelectionRange(inicio + texto.length, inicio + texto.length);
            campoKick.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const copiar = document.createElement('button');
        copiar.type = 'button';
        copiar.className = 'chat-kick-accion';
        copiar.textContent = '⧉';
        copiar.title = 'Copiar el mensaje';
        copiar.setAttribute('aria-label', 'Copiar el mensaje');
        copiar.addEventListener('click', () => {
            try {
                navigator.clipboard?.writeText(String(m.content ?? ''));
                window.mostrarToast?.('Mensaje copiado.');
            } catch (e) { /* sin portapapeles */ }
        });
        acciones.append(mencionar, copiar);
        cabeza.appendChild(acciones);
        fila.appendChild(cabeza);

        if (m.replies_to && m.replies_to.content) {
            const cita = document.createElement('span');
            cita.className = 'chat-kick-cita';
            cita.textContent = '↳ ' + String(m.replies_to.content).slice(0, 80);
            fila.appendChild(cita);
        }

        const texto = document.createElement('span');
        texto.className = 'chat-kick-texto';
        texto.innerHTML = resaltarMenciones(conEmotes(String(m.content ?? '')));
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
            '    <img class="chat-kick-avatar" alt="" width="20" height="20" hidden>',
            '    <span class="chat-kick-usuario"></span>',
            '  </div>',
            '  <button type="button" class="chat-kick-login"><span aria-hidden="true">K</span> Conectar</button>',
            '</div>',
            '<div class="chat-kick-mensajes" role="log" aria-live="polite" aria-label="Mensajes del chat de Kick">',
            '  <p class="chat-kick-vacio">Cargando mensajes…</p>',
            '</div>',
            '<button type="button" class="chat-kick-nuevos" hidden>Nuevos mensajes ↓</button>',
            '<form class="chat-kick-form">',
            '  <label class="chat-kick-oculto" for="chat-kick-campo">Tu mensaje</label>',
            '  <div class="chat-kick-campo-wrap">',
            '    <input class="chat-kick-campo" id="chat-kick-campo" type="text" maxlength="500" autocomplete="off" placeholder="Conecta con Kick para escribir" disabled>',
            '    <button type="button" class="chat-kick-emote-btn" aria-label="Abrir emotes de 7TV" aria-expanded="false" disabled><span aria-hidden="true">7TV</span></button>',
            '    <div class="chat-kick-emote-panel chat-emote-panel" role="group" aria-label="Emotes de 7TV" hidden>',
            '      <div class="chat-emote-panel-cabecera"><span>Emotes de 7TV</span><button type="button" class="chat-emote-cerrar" aria-label="Cerrar emotes">×</button></div>',
            '      <p class="chat-emote-panel-estado chat-kick-emote-estado">Cargando emotes…</p>',
            '      <p class="chat-emote-panel-estado chat-emote-panel-error chat-kick-emote-error" hidden></p>',
            '      <div class="chat-emote-grid chat-kick-emote-grid" hidden></div>',
            '    </div>',
            '  </div>',
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
        campoKick = campo;
        const nuevos = host.querySelector('.chat-kick-nuevos');
        const enviar = host.querySelector('.chat-kick-enviar');
        const aviso = host.querySelector('.chat-kick-aviso');
        const emoteBtn = host.querySelector('.chat-kick-emote-btn');
        const emotePanel = host.querySelector('.chat-kick-emote-panel');
        const emoteGrid = host.querySelector('.chat-kick-emote-grid');
        const emoteEstado = host.querySelector('.chat-kick-emote-estado');
        const emoteError = host.querySelector('.chat-kick-emote-error');
        let emotesPanelCargado = false;
        let emotesPanelCargando = false;

        const cerrarEmotes = () => {
            emotePanel.hidden = true;
            emoteBtn.setAttribute('aria-expanded', 'false');
        };

        const cargarEmotesPanel = async () => {
            if (emotesPanelCargado || emotesPanelCargando) return;
            emotesPanelCargando = true;
            emoteEstado.hidden = false;
            emoteError.hidden = true;
            emoteGrid.hidden = true;
            const lista = await window.cargarEmotes7TV?.() ?? [];
            emotesPanelCargando = false;
            if (!Array.isArray(lista) || !lista.length) {
                emoteEstado.hidden = true;
                emoteError.textContent = 'No se pudieron cargar los emotes.';
                emoteError.hidden = false;
                return;
            }
            const fragmento = document.createDocumentFragment();
            lista.forEach((emote) => {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'chat-emote-item';
                boton.title = emote.nombre;
                boton.setAttribute('aria-label', 'Insertar ' + emote.nombre);
                const img = document.createElement('img');
                img.src = emote.url;
                img.alt = '';
                img.width = 32;
                img.height = 32;
                img.loading = 'lazy';
                img.decoding = 'async';
                boton.appendChild(img);
                boton.addEventListener('click', () => {
                    window.insertarEmote7tv?.(emote.nombre, campo);
                    cerrarEmotes();
                    campo.focus();
                });
                fragmento.appendChild(boton);
            });
            emoteGrid.replaceChildren(fragmento);
            emoteEstado.hidden = true;
            emoteGrid.hidden = false;
            emotesPanelCargado = true;
        };

        emoteBtn.addEventListener('click', async () => {
            if (!emotePanel.hidden) {
                cerrarEmotes();
                return;
            }
            emotePanel.hidden = false;
            emoteBtn.setAttribute('aria-expanded', 'true');
            await cargarEmotesPanel();
        });

        emotePanel.querySelector('.chat-emote-cerrar').addEventListener('click', cerrarEmotes);
        form.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape') cerrarEmotes();
        });
        document.addEventListener('pointerdown', (evento) => {
            if (emotePanel.hidden) return;
            if (!emotePanel.contains(evento.target) && !emoteBtn.contains(evento.target)) cerrarEmotes();
        });

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

        if (nuevos) {
            nuevos.addEventListener('click', () => {
                alFinal();
                cercaDelFinal = true;
                nuevos.hidden = true;
            });
        }

        lista.addEventListener('scroll', () => {
            cercaDelFinal = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 60;
            if (cercaDelFinal && nuevos) nuevos.hidden = true;
        });

        const añadir = (m) => {
            if (!m || !m.message_id || vistos.has(m.message_id)) return;
            vistos.add(m.message_id);
            if (vacio) vacio.hidden = true;
            const nodo = pintarMensaje(m);
            nodo.dataset.messageId = m.message_id;
            lista.appendChild(nodo);
            while (lista.children.length > 200) {
                const viejo = lista.firstElementChild;
                if (!viejo) break;
                if (viejo.dataset.messageId) vistos.delete(viejo.dataset.messageId);
                viejo.remove();
            }
            if (cercaDelFinal) alFinal();
            else if (nuevos) nuevos.hidden = false;
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
                    avatar.removeAttribute('src');
                    avatar.hidden = true;
                }
                campo.disabled = false;
                enviar.disabled = false;
                emoteBtn.disabled = false;
                campo.placeholder = 'Escribe en el chat…';
            } else {
                cuenta.hidden = true;
                login.hidden = false;
                campo.disabled = true;
                enviar.disabled = true;
                emoteBtn.disabled = true;
                cerrarEmotes();
                campo.placeholder = 'Conecta con Kick para escribir';
            }
        };

        host._actualizarCuenta = actualizarCuenta;
        host._añadirMensaje = añadir;
        host._mostrarAviso = mostrarAviso;
        host._vacio = vacio;
        host._punto = punto;

        login.addEventListener('click', () => { host._conectar?.(); });

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
                cerrarEmotes();
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
                almacen.borrar(api.claveToken);
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
        // Idempotente: si ya se inicializó (DOMContentLoaded o la app móvil),
        // solo se montan los hosts nuevos y no se duplican listeners/canales.
        if (iniciarChatKick._iniciado) return;
        iniciarChatKick._iniciado = true;

        const sincronizar = () => {
            const sesion = window.CHAT_KICK.sesion ?? null;
            hosts.forEach((host) => { if (host._actualizarCuenta) host._actualizarCuenta(sesion); });
        };

        // Reutiliza la autorizacion de Kick guardada para la cuenta de comunidad.
        // Solo funciona con una sesion valida: al cerrar sesion se invalida.
        const reconectar = async () => {
            const tokenComunidad = almacen.texto('comunidad_session_token');
            if (!tokenComunidad) return null;
            // El 409 significa "esta cuenta no tiene Kick vinculado". Se recuerda
            // para no repetir la petición fallida en cada carga; se borra al
            // vincular Kick o al iniciar sesión con Kick.
            if (almacen.texto('gocha_kick_sin_vincular') === tokenComunidad) return null;
            try {
                const r = await window.llamarEdge('kick-chat', { accion: 'reconectar', token: tokenComunidad });
                if (r.status === 409) {
                    almacen.guardarTexto('gocha_kick_sin_vincular', tokenComunidad);
                    return null;
                }
                const datos = r.datos || {};
                if (!r.ok || !datos.ok || !datos.token || !datos.usuario) return null;
                almacen.guardarTexto(api.claveToken, datos.token);
                return { token: datos.token, usuario: datos.usuario };
            } catch (e) {
                return null;
            }
        };

        window.CHAT_KICK.conectar = async (host) => {
            // Conectar es el login general con Kick: si ya hay cuenta de
            // comunidad se vincula; si no, se crea o recupera automaticamente.
            const tokenGuardado = almacen.texto(api.claveToken);
            const tokenComunidad = almacen.texto('comunidad_session_token');

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
                if (sesion.estado === 401) almacen.borrar(api.claveToken);
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

        hosts.forEach((host) => {
            host._conectar = () => window.CHAT_KICK.conectar(host);
        });

        // El set global se comparte con el chat de comunidad y se cachea.
        // Va al final para no retrasar los botones de conexión.
        await window.cargarEmotes7TV?.();

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
            almacen.guardarTexto(api.claveToken, token);

            // Con Kick ya autenticado se completa la cuenta general:
            // con sesion abierta se vincula; sin sesion se crea o recupera.
            if (almacen.texto('comunidad_session_token')) {
                const vinculado = await window.KICK_COMUNIDAD.vincular();
                if (!vinculado) {
                    almacen.borrar(api.claveToken);
                    hosts.forEach((host) => host._mostrarAviso('No se pudo vincular tu Kick a esta cuenta.'));
                    return false;
                }
            } else {
                const cuenta = await window.entrarConKickCuenta();
                if (!cuenta || cuenta.cancelado || cuenta.error) {
                    almacen.borrar(api.claveToken);
                    const aviso = cuenta?.mensaje || (cuenta?.cancelado ? 'No se completó el acceso. Vuelve a intentarlo.' : '');
                    if (aviso) hosts.forEach((host) => host._mostrarAviso(aviso));
                    return false;
                }
            }
            return true;
        };

        const validarSesion = async () => {
            const token = almacen.texto(api.claveToken);
            if (!token) return null;
            const res = await pedir({ accion: 'sesion' }, token);
            if (!res.ok) {
                if (res.estado === 401) almacen.borrar(api.claveToken);
                return null;
            }
            return { token, usuario: res.datos.usuario };
        };

        const cargarMensajes = async () => {
            if (!window.supabase) {
                hosts.forEach((host) => {
                    host._vacio.hidden = false;
                    host._vacio.textContent = 'Chat no disponible. Recarga la página.';
                });
                return;
            }
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

// Alias que usa la interfaz móvil (`mobile/mobile.js`) al abrir la hoja del chat.
// Ejecuta la misma inicialización del chat nativo de Kick y es idempotente.
window.prepararFachadaChat = function prepararFachadaChat() {
    try {
        return window.iniciarChatKick?.();
    } catch (e) {
        console.error('prepararFachadaChat:', e);
    }
};

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
    modalEl.setAttribute('x-on:click.self', '$store.sugerencias.cerrar()');
    modalEl.innerHTML = `
      <div class="modal-sugerencias-backdrop" x-on:click="$store.sugerencias.cerrar()"></div>
      <div class="modal-sugerencias-card" role="dialog" aria-modal="true" aria-labelledby="sugerencias-titulo" x-trap.noscroll="$store.sugerencias.abierto">
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
          const { data, error } = await window.rpcRaw('enviar_sugerencia', { p_texto: texto });
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

  // Día natural en hora local como YYYY-MM-DD: sirve para agrupar por día y
  // comparar fechas sin que la zona horaria mueva los movimientos de día.
  function claveDiaLocal(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return anio + '-' + mes + '-' + dia;
  }

  function mesDesde(iso) {
    return window.formatearFecha(iso, 'mes-anio');
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
    modalEl.setAttribute('x-bind:class', "{ 'modal-perfil--stack': $store.perfil.sobreAdmin, 'modal-perfil--popover': $store.perfil.anclado }");
    modalEl.setAttribute('x-on:click.self', '$store.perfil.cerrar()');
    modalEl.innerHTML = `
      <div class="modal-perfil-backdrop" x-on:click="$store.perfil.cerrar()"></div>
      <div class="modal-perfil-card" role="document" x-trap.noscroll="$store.perfil.abierto && !$store.perfil.anclado">
        <button type="button" class="modal-perfil-close" x-on:click="$store.perfil.cerrar()" aria-label="Cerrar" data-tooltip="Cerrar">&times;</button>
        <h3 id="modal-perfil-titulo" x-text="$store.perfil.titulo">Mi perfil</h3>
        <nav class="modal-perfil-tabs" role="tablist" aria-label="Perfil, cuenta y ajustes" x-bind:hidden="$store.perfil.publico">
          <button type="button" role="tab" x-bind:class="{ active: $store.perfil.vista === 'perfil' }"
                  x-bind:aria-selected="$store.perfil.vista === 'perfil'"
                  x-on:click="$store.perfil.vista = 'perfil'">Perfil</button>
          <button type="button" role="tab" x-bind:class="{ active: $store.perfil.vista === 'cuenta' }"
                  x-bind:aria-selected="$store.perfil.vista === 'cuenta'"
                  x-on:click="$store.perfil.vista = 'cuenta'; $store.perfil.cargarCompras()">Mi cuenta</button>
          <button type="button" role="tab" x-bind:class="{ active: $store.perfil.vista === 'ajustes' }"
                  x-bind:aria-selected="$store.perfil.vista === 'ajustes'"
                  x-on:click="$store.perfil.vista = 'ajustes'">Ajustes</button>
        </nav>
        <div class="modal-perfil-body" role="tabpanel" aria-label="Perfil"
             x-bind:hidden="$store.perfil.vista !== 'perfil'">
          <div class="mp-cargando" x-bind:hidden="!$store.perfil.cargando" aria-hidden="true">
            <span class="gochi-skeleton gochi-skeleton--avatar"></span>
            <span class="gochi-skeleton gochi-skeleton--titulo"></span>
            <span class="gochi-skeleton gochi-skeleton--texto"></span>
          </div>
          <p class="mp-error gochi-alerta" data-tono="error" role="alert" x-bind:hidden="!$store.perfil.error" x-text="$store.perfil.error"></p>
          <div class="mp-perfil" x-bind:hidden="$store.perfil.cargando || !!$store.perfil.error">
            <div class="mp-profile-head">
              <div class="mp-avatar-wrap">
                <img class="mp-avatar" x-bind:class="{ 'avatar-marco': $store.perfil.usuario.marco_equipado }"
                     x-bind:src="$store.perfil.avatar" x-bind:hidden="!$store.perfil.avatar"
                     x-bind:alt="'Avatar de ' + $store.perfil.nombre">
                <span class="mp-avatar-inicial" x-bind:hidden="!!$store.perfil.avatar" x-text="$store.perfil.inicial"></span>
              </div>
              <div class="mp-profile-info">
                <div class="mp-nombre-linea">
                  <h4 class="mp-apodo" x-bind:class="'rango-texto-' + $store.perfil.rango.clave"
                      x-bind:style="$store.perfil.usuario.color_apodo ? 'color:' + $store.perfil.usuario.color_apodo : null"
                      x-text="$store.perfil.nombre"></h4>
                  <span class="mp-titulo" x-bind:hidden="!$store.perfil.usuario.titulo_equipado"
                        x-text="$store.perfil.usuario.titulo_equipado"></span>
                  <span class="mp-genero" x-bind:hidden="!$store.perfil.publico || !$store.perfil.generoTexto"
                        x-text="$store.perfil.generoTexto"></span>
                  <a class="mp-kick-link" x-show="$store.perfil.publico && $store.perfil.usuario.kick_username"
                     x-bind:href="'https://kick.com/' + encodeURIComponent($store.perfil.usuario.kick_username || '')"
                     target="_blank" rel="noopener noreferrer"
                     x-bind:title="'Kick vinculado: @' + ($store.perfil.usuario.kick_username || '')">
                      <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-k"></use></svg>
                      <span x-text="'@' + ($store.perfil.usuario.kick_username || '')"></span>
                  </a>
                </div>
                <div class="mp-badges">
                  <span class="rango-badge" x-bind:class="'rango-' + $store.perfil.rango.clave"
                        x-bind:title="'Rango: ' + $store.perfil.rango.nombre"
                        x-text="$store.perfil.rango.emoji + ' ' + $store.perfil.rango.nombre"></span>
                  <span class="mp-puntos" title="Puntos" x-text="(Number($store.perfil.usuario.puntos) || 0) + ' pts'"></span>
                </div>
                <p class="mp-desde" x-bind:hidden="!$store.perfil.miembro" x-text="'Miembro desde ' + $store.perfil.miembro"></p>
              </div>
            </div>

            <section class="mp-seccion" x-show="$store.perfil.insignias.length">
              <h5 class="mp-seccion-titulo">Insignias de Kick</h5>
              <div class="mp-kick-badges">
                <template x-for="b in $store.perfil.insignias" :key="b.tipo">
                  <span class="mp-insignia" x-bind:class="'kick-badge-' + b.tipo" x-bind:title="b.texto">
                    <svg class="icon" aria-hidden="true"><use x-bind:href="'img/icons.svg#' + b.icono"></use></svg>
                    <span x-text="b.nombre"></span>
                    <small x-show="b.detalle" x-text="b.detalle"></small>
                  </span>
                </template>
              </div>
            </section>

            <section class="mp-seccion" x-show="$store.perfil.logros.length">
              <h5 class="mp-seccion-titulo">Logros</h5>
              <div class="mp-logros">
                <template x-for="l in $store.perfil.logros" :key="l.clave">
                  <span class="mp-logro" x-bind:title="l.descripcion">
                    <span class="mp-logro-emoji" aria-hidden="true" x-text="l.emoji"></span>
                    <span x-text="l.nombre"></span>
                  </span>
                </template>
              </div>
            </section>

            <section class="mp-seccion" x-show="$store.perfil.usuario.bio">
              <h5 class="mp-seccion-titulo">Bio</h5>
              <p class="mp-bio" x-text="$store.perfil.usuario.bio"></p>
            </section>

            <section class="mp-seccion" x-show="$store.perfil.linksVisibles.length">
              <h5 class="mp-seccion-titulo">Redes</h5>
              <div class="mp-links">
                <template x-for="l in $store.perfil.linksVisibles" :key="l.clave">
                  <a class="mp-link" x-bind:href="l.url" x-bind:title="l.label"
                     target="_blank" rel="noopener noreferrer">
                    <svg class="icon" aria-hidden="true"><use x-bind:href="'img/icons.svg#' + l.icon"></use></svg>
                    <span x-text="l.label"></span>
                  </a>
                </template>
              </div>
            </section>

            <section class="mp-seccion" x-show="$store.perfil.tieneEstadisticas">
              <h5 class="mp-seccion-titulo">Actividad</h5>
              <div class="mp-stats">
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.mensajes || 0"></span><span class="mp-stat-label">Mensajes</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.reacciones_dadas || 0"></span><span class="mp-stat-label">Reacciones</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.reacciones_recibidas || 0"></span><span class="mp-stat-label">Recibidas</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.saludos || 0"></span><span class="mp-stat-label">Saludos</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.likes_galeria || 0"></span><span class="mp-stat-label">Likes</span></div>
                <div class="mp-stat"><span class="mp-stat-valor" x-text="$store.perfil.estadisticas.puntos_hoy || 0"></span><span class="mp-stat-label">Hoy</span></div>
              </div>
            </section>

            <section class="mp-seccion" x-bind:hidden="!$store.perfil.haySesion || $store.perfil.publico">
              <h5 class="mp-seccion-titulo">Historial de puntos <span class="mp-seccion-nota">últimos 3 días</span></h5>
              <p class="mp-desde" x-bind:hidden="$store.perfil.historialEstado !== 'cargando'">Cargando historial…</p>
              <p class="mp-desde" x-bind:hidden="$store.perfil.historialEstado !== 'error'">No se pudo cargar el historial.</p>
              <p class="mp-desde" x-bind:hidden="$store.perfil.historialEstado !== 'lista' || $store.perfil.historialPorDia.length > 0">No has ganado puntos en los últimos 3 días.</p>
              <div class="mp-historial" x-bind:hidden="$store.perfil.historialPorDia.length === 0">
                <template x-for="dia in $store.perfil.historialPorDia" :key="dia.clave">
                  <div class="mp-historial-dia">
                    <div class="mp-historial-dia-cabecera">
                      <span class="mp-historial-dia-label" x-text="dia.etiqueta"></span>
                      <span class="mp-historial-dia-total" x-text="'+' + dia.puntos + ' pts'"></span>
                    </div>
                    <template x-for="fila in dia.filas" :key="dia.clave + '-' + fila.accion">
                      <div class="gochi-card mp-historial-card">
                        <div class="mp-historial-card-inner">
                          <span class="gochi-chip" x-bind:data-tono="fila.tono">
                            <svg class="icon" aria-hidden="true"><use x-bind:href="'img/icons.svg#' + fila.icono"></use></svg>
                            <span x-text="fila.etiqueta"></span>
                          </span>
                          <span class="mp-historial-veces" x-text="'× ' + fila.veces" x-bind:title="fila.veces + ' movimiento' + (fila.veces === 1 ? '' : 's')"></span>
                          <span class="mp-historial-puntos" x-text="'+' + fila.puntos"></span>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
              <p class="mp-historial-pie" x-bind:hidden="$store.perfil.historialPorDia.length === 0">
                <span x-text="'Ganado en 3 días: ' + $store.perfil.historialGanado + ' pts'"></span>
                <span x-text="'· Saldo actual: ' + (Number($store.perfil.usuario.puntos) || 0) + ' pts'"></span>
                <small>El historial suma solo lo que ganas. Los canjes de la tienda descuentan de tu saldo, así que el total puede ser menor.</small>
              </p>
            </section>
          </div>
        </div>
        <div class="modal-perfil-body" role="tabpanel" aria-label="Mi cuenta"
             x-bind:hidden="$store.perfil.publico || $store.perfil.vista !== 'cuenta'">
          <p class="mp-pendiente" role="status"
             x-bind:hidden="$store.perfil.genero !== 'no_definido' && !!$store.perfil.usuario.avatar_url">
            Completa tu perfil: elige tu género y tu avatar.
          </p>

          <section class="mp-ajustes-bloque mp-ajustes-bloque--avatar">
            <div class="mp-ajustes-cabecera">
              <span class="mp-ajustes-preview">
                <img class="mp-avatar" x-bind:src="$store.perfil.previewAvatar" x-bind:hidden="!$store.perfil.previewAvatar"
                     alt="Vista previa del avatar">
                <span class="mp-avatar-inicial" x-bind:hidden="!!$store.perfil.previewAvatar" x-text="$store.perfil.inicial"></span>
              </span>
              <span class="mp-ajustes-cabecera-texto">
                <strong>Tu avatar</strong>
                <small>2 por defecto · 2 de tienda · Foto de Kick</small>
              </span>
            </div>
            <div class="mp-avatar-choices" aria-label="Avatares disponibles">
              <template x-for="a in $store.perfil.avatares" :key="a.url">
                <button type="button" class="mp-avatar-choice"
                        x-bind:class="{ selected: ($store.perfil.avatarSeleccionado === undefined ? $store.perfil.avatar : $store.perfil.avatarSeleccionado) === a.url }"
                        x-bind:title="a.nombre || 'Avatar'" x-bind:aria-label="'Elegir ' + (a.nombre || 'avatar')"
                        x-on:click="$store.perfil.elegirAvatar(a.url)">
                  <img x-bind:src="a.url" x-bind:alt="a.nombre || 'Avatar'" loading="lazy">
                  <span class="mp-avatar-tag" x-show="a.origen === 'kick'">KICK</span>
                </button>
              </template>
            </div>
            <span class="mp-vacio" x-bind:hidden="$store.perfil.avatares.length">No se pudieron cargar los avatares.</span>
          </section>

          <section class="mp-ajustes-bloque">
            <h5 class="mp-ajustes-titulo">Identidad <span>Cómo te ve la comunidad</span></h5>
            <div class="mp-ajustes-fila">
              <label class="mp-field gochi-campo"><span class="gochi-campo-label">Género</span>
                <select x-model="$store.perfil.genero">
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="no_definido">No definido</option>
                </select>
              </label>
              <label class="mp-field gochi-campo"><span class="gochi-campo-label">Bio <span class="gochi-campo-contador" x-text="$store.perfil.bio.length + '/160'"></span></span>
                <textarea maxlength="160" rows="2" x-model="$store.perfil.bio" placeholder="Cuéntanos algo sobre ti..."></textarea>
              </label>
            </div>
          </section>

          <section class="mp-ajustes-bloque">
            <h5 class="mp-ajustes-titulo">Redes <span>Aparecen como iconos en tu perfil</span></h5>
            <div class="mp-links-grid">
              <template x-for="clave in $store.perfil.linkKeys" :key="clave">
                <label class="mp-link-field">
                  <span><svg class="icon" aria-hidden="true"><use x-bind:href="'img/icons.svg#' + $store.perfil.linkIconos[clave]"></use></svg>
                    <span x-text="$store.perfil.linkLabels[clave]"></span></span>
                  <input type="url" x-bind:value="$store.perfil.links[clave]"
                         x-on:input="$store.perfil.links[clave] = $event.target.value"
                         placeholder="https://..." autocomplete="url">
                </label>
              </template>
            </div>
          </section>

          <section class="mp-ajustes-bloque" x-show="$store.perfil.kickDisponible">
            <h5 class="mp-ajustes-titulo">Kick <span>Inicio sin PIN e insignias en el chat</span></h5>
            <div class="mp-kick">
              <div class="mp-kick-texto">
                <svg class="icon" aria-hidden="true"><use href="img/icons.svg#i-solid-k"></use></svg>
                <span x-text="$store.perfil.kickUsuario
                  ? 'Vinculado como @' + $store.perfil.kickUsuario
                  : 'Aún no has vinculado tu cuenta de Kick.'"></span>
              </div>
              <button type="button" class="btn-primary btn-muted"
                      x-show="!$store.perfil.kickUsuario"
                      x-on:click="$store.perfil.vincularKick()">Vincular Kick</button>
              <button type="button" class="btn-primary btn-muted"
                      x-show="$store.perfil.kickUsuario"
                      x-on:click="$store.perfil.desvincularKick()">Desvincular</button>
            </div>
          </section>

          <section class="mp-seccion">
            <h5 class="mp-seccion-titulo">Mis compras <span class="mp-seccion-nota">tienda</span></h5>
            <p class="mp-desde" x-bind:hidden="$store.perfil.comprasEstado !== 'cargando'">Cargando compras…</p>
            <p class="mp-desde" x-bind:hidden="$store.perfil.comprasEstado !== 'lista' || $store.perfil.compras.length > 0">Aún no has comprado nada en la tienda.</p>
            <ul class="mp-compras" x-bind:hidden="$store.perfil.compras.length === 0">
              <template x-for="c in $store.perfil.compras" :key="'compra-' + c.id">
                <li class="mp-compra">
                  <span class="mp-compra-nombre" x-text="c.nombre"></span>
                  <span class="mp-compra-tipo" x-text="c.tipo"></span>
                  <button type="button" class="mp-compra-btn"
                          x-bind:hidden="!$store.perfil.ponible(c)"
                          x-on:click="$store.perfil.equiparCompra(c)"
                          x-text="$store.perfil.estaPuesto(c) ? 'Quitar' : 'Equipar'"></button>
                  <span class="mp-compra-puesto" x-bind:hidden="!$store.perfil.estaPuesto(c) || c.tipo !== 'avatar'">Puesto</span>
                </li>
              </template>
            </ul>
          </section>

          <section class="mp-seccion">
            <h5 class="mp-seccion-titulo">Mis canjes <span class="mp-seccion-nota">tienda de puntos</span></h5>
            <p class="mp-desde" x-bind:hidden="$store.perfil.canjesEstado !== 'cargando'">Cargando canjes…</p>
            <p class="mp-desde" x-bind:hidden="$store.perfil.canjesEstado !== 'error'">No se pudieron cargar los canjes.</p>
            <p class="mp-desde" x-bind:hidden="$store.perfil.canjesEstado !== 'lista' || $store.perfil.canjes.length > 0">No has canjeado nada todavía.</p>
            <ul class="mp-canjes" x-bind:hidden="$store.perfil.canjes.length === 0">
              <template x-for="c in $store.perfil.canjes" :key="c.id">
                <li class="mp-canje">
                  <span class="mp-canje-nombre" x-text="c.nombre"></span>
                  <span class="gochi-chip mp-canje-estado" x-bind:data-tono="$store.perfil.tonoCanje(c.estado)" x-text="$store.perfil.etiquetaCanje(c.estado)"></span>
                  <span class="mp-canje-fecha" x-text="$store.perfil.fechaCanje(c.created_at)"></span>
                  <span class="mp-canje-puntos" x-text="'−' + c.costo_puntos"></span>
                </li>
              </template>
            </ul>
            <p class="mp-historial-pie" x-bind:hidden="$store.perfil.canjes.length === 0">
              <span x-text="'Gastado en la tienda: ' + $store.perfil.canjesGastados + ' pts'"></span>
              <small>Los canjes descuentan de tu saldo y no aparecen en el historial de puntos, que solo suma lo que ganas.</small>
            </p>
          </section>

          <p class="mp-error gochi-alerta" data-tono="error" role="alert" x-bind:hidden="!$store.perfil.error" x-text="$store.perfil.error"></p>
          <div class="mp-acciones-extra">
            <button type="button" class="btn-primary btn-muted" x-on:click="window.exportarMisDatos()">Exportar mis datos</button>
          </div>

          <section class="mp-seccion mp-peligro">
            <h5 class="mp-seccion-titulo">Eliminar cuenta</h5>
            <p class="mp-desde">Se borran tu perfil, avatar, bio, redes y sesiones. Tus mensajes y fotos se quedan como “Cuenta eliminada”. No se puede deshacer.</p>
            <button type="button" class="btn-peligro" x-on:click="$store.perfil.abrirEliminar()">Eliminar mi cuenta</button>
          </section>

          <div class="mp-actions mp-actions--fija">
            <button type="button" class="btn-primary btn-muted" x-on:click="$store.perfil.vista = 'perfil'">Cancelar</button>
            <button type="button" class="btn-primary" x-bind:disabled="$store.perfil.guardando"
                    x-on:click="$store.perfil.guardar()">Guardar cambios</button>
          </div>
        </div>
        <div class="modal-perfil-body" role="tabpanel" aria-label="Ajustes"
             x-bind:hidden="$store.perfil.publico || $store.perfil.vista !== 'ajustes'">
          <p class="mp-desde" x-bind:hidden="!window.enModoApp()">En la app, el tamaño de texto, las animaciones y el ahorro de datos se cambian desde el botón Ajustes. Aquí quedan el resto de preferencias.</p>
          <section class="mp-seccion" x-bind:hidden="window.enModoApp()">
            <h5 class="mp-seccion-titulo">Animaciones</h5>
            <label class="gochi-switch">
              <input type="checkbox" x-model="$store.ajustes.datos.animaciones"
                     x-on:change="$store.ajustes.guardar()">
              <span class="gochi-switch-track"></span>
              <span>Permitir animaciones y transiciones</span>
            </label>
          </section>

          <section class="mp-seccion" x-bind:hidden="window.enModoApp()">
            <h5 class="mp-seccion-titulo">Tamaño del texto</h5>
            <div class="gochi-segmento" role="group" aria-label="Tamaño del texto">
              <template x-for="tam in [90, 100, 110, 125]" :key="tam">
                <button type="button" x-bind:aria-pressed="$store.ajustes.datos.texto === tam"
                        x-on:click="$store.ajustes.set('texto', tam)" x-text="tam + '%'"></button>
              </template>
            </div>
          </section>

          <section class="mp-seccion">
            <h5 class="mp-seccion-titulo">Densidad</h5>
            <div class="mp-opciones" role="radiogroup" aria-label="Densidad de la interfaz">
              <label class="mp-opcion">
                <input type="radio" name="densidad" value="comoda"
                       x-model="$store.ajustes.datos.densidad" x-on:change="$store.ajustes.guardar()">
                <span class="mp-opcion-titulo">Cómoda</span>
                <span class="mp-opcion-detalle">Más aire entre filas</span>
              </label>
              <label class="mp-opcion">
                <input type="radio" name="densidad" value="compacta"
                       x-model="$store.ajustes.datos.densidad" x-on:change="$store.ajustes.guardar()">
                <span class="mp-opcion-titulo">Compacta</span>
                <span class="mp-opcion-detalle">Más contenido en pantalla</span>
              </label>
            </div>
          </section>

          <section class="mp-seccion">
            <h5 class="mp-seccion-titulo">Efectos</h5>
            <label class="gochi-switch">
              <input type="checkbox" x-model="$store.ajustes.datos.transparencias"
                     x-on:change="$store.ajustes.guardar()">
              <span class="gochi-switch-track"></span>
              <span>Permitir desenfoques y transparencias</span>
            </label>
            <label class="gochi-switch">
              <input type="checkbox" x-model="$store.ajustes.datos.contraste"
                     x-on:change="$store.ajustes.guardar()">
              <span class="gochi-switch-track"></span>
              <span>Alto contraste</span>
            </label>
          </section>

          <section class="mp-seccion">
            <h5 class="mp-seccion-titulo">Chat</h5>
            <label class="gochi-switch">
              <input type="checkbox" x-model="$store.ajustes.datos.sonido"
                     x-on:change="$store.ajustes.guardar()">
              <span class="gochi-switch-track"></span>
              <span>Sonido al recibir mensajes</span>
            </label>
          </section>

          <section class="mp-seccion" x-bind:hidden="window.enModoApp()">
            <h5 class="mp-seccion-titulo">Datos</h5>
            <label class="gochi-switch">
              <input type="checkbox" x-model="$store.ajustes.datos.ahorro"
                     x-on:change="$store.ajustes.guardar()">
              <span class="gochi-switch-track"></span>
              <span>Ahorro de datos: no cargar los feeds hasta que lo pidas</span>
            </label>
          </section>

          <section class="mp-seccion">
            <h5 class="mp-seccion-titulo">Kick</h5>
            <label class="gochi-switch">
              <input type="checkbox" x-model="$store.ajustes.datos.kickRecordar"
                     x-on:change="$store.ajustes.guardar(); window.olvidarKickRecordado?.()">
              <span class="gochi-switch-track"></span>
              <span>No volver a pedir autorización de Kick en este equipo</span>
            </label>
            <p class="mp-desde">Con esto activo, cerrar sesión no revoca el acceso de Kick aquí: se puede volver a entrar sin credenciales durante 30 días.</p>
          </section>

          <p class="mp-desde">Estos ajustes se guardan en este dispositivo y no cambian tu cuenta.</p>
        </div>
        <div class="mp-eliminar" role="dialog" aria-modal="true" aria-labelledby="mp-eliminar-titulo"
             x-bind:hidden="!$store.perfil.eliminarAbierto" x-trap="$store.perfil.eliminarAbierto">
          <div class="mp-eliminar-caja">
            <h4 id="mp-eliminar-titulo">Eliminar mi cuenta</h4>
            <p class="mp-desde">Escribe tu apodo y tu PIN para confirmar. Es inmediato e irreversible.</p>
            <label class="gochi-campo">
              <span class="gochi-campo-label">Tu apodo</span>
              <input type="text" autocomplete="off" x-model="$store.perfil.confirmApodo">
            </label>
            <label class="gochi-campo">
              <span class="gochi-campo-label">Tu PIN</span>
              <input type="password" inputmode="numeric" maxlength="4" autocomplete="off" x-model="$store.perfil.confirmPin">
            </label>
            <p class="mp-error gochi-alerta" data-tono="error" role="alert"
               x-bind:hidden="!$store.perfil.errorEliminar" x-text="$store.perfil.errorEliminar"></p>
            <div class="mp-actions">
              <button type="button" class="btn-primary btn-muted" x-on:click="$store.perfil.cerrarEliminar()">Cancelar</button>
              <button type="button" class="btn-peligro" x-bind:disabled="$store.perfil.eliminando"
                      x-on:click="$store.perfil.eliminarCuenta()">Eliminar definitivamente</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modalEl);
    document.addEventListener('pointerdown', (event) => {
      const store = window.Alpine && window.Alpine.store ? window.Alpine.store('perfil') : null;
      if (!store || !store.abierto || !store.anclado) return;
      if (modalEl.contains(event.target)) return;
      if (event.target.closest && event.target.closest('#nav-user-info .nav-user-btn')) return;
      store.cerrar();
    });
    window.addEventListener('resize', () => {
      const store = window.Alpine && window.Alpine.store ? window.Alpine.store('perfil') : null;
      if (store && store.abierto && store.anclado) store.colocarPopover();
    });
    return modalEl;
  }

  document.addEventListener('alpine:init', () => {
    let avataresCache = null;

    // Preferencias del dispositivo (no viajan con la cuenta).
    window.Alpine.store('ajustes', {
      datos: {
        animaciones: true,
        texto: 100,
        densidad: 'comoda',
        transparencias: true,
        contraste: false,
        sonido: true,
        ahorro: false,
        kickRecordar: true
      },
      cargar() {
        const guardado = almacen.leer('gochi_ajustes', null);
        if (guardado && typeof guardado === 'object') {
          this.datos = Object.assign({}, this.datos, guardado);
        }
        this.aplicar();
      },
      aplicar() {
        const raiz = document.documentElement;
        raiz.classList.toggle('sin-animaciones', !this.datos.animaciones);
        raiz.classList.remove('texto-90', 'texto-110', 'texto-125');
        const tam = Number(this.datos.texto);
        if (tam === 90 || tam === 110 || tam === 125) raiz.classList.add('texto-' + tam);
        raiz.classList.toggle('densidad-compacta', this.datos.densidad === 'compacta');
        raiz.classList.toggle('sin-transparencias', !this.datos.transparencias);
        raiz.classList.toggle('alto-contraste', !!this.datos.contraste);
        raiz.classList.toggle('ahorro-datos', !!this.datos.ahorro);
      },
      guardar() {
        almacen.guardar('gochi_ajustes', this.datos);
        this.aplicar();
        try {
          window.dispatchEvent(new CustomEvent('gochi:ajustes', { detail: Object.assign({}, this.datos) }));
        } catch (e) { /* sin CustomEvent */ }
      },
      set(clave, valor) {
        this.datos[clave] = valor;
        this.guardar();
      }
    });
    window.Alpine.store('ajustes').cargar();

    window.Alpine.store('perfil', {
      abierto: false,
      publico: false,
      sobreAdmin: false,
      anclado: false,
      vista: 'perfil',
      titulo: 'Mi perfil',
      eliminarAbierto: false,
      confirmApodo: '',
      confirmPin: '',
      errorEliminar: '',
      eliminando: false,
      cargando: false,
      guardando: false,
      error: '',
      usuario: {},
      estadisticas: {},
      logros: [],
      historial: [],
      historialEstado: 'inicial',
      canjes: [],
      canjesEstado: 'inicial',
      canjesCargadoEn: 0,
      compras: [],
      comprasEstado: 'inicial',
      avatares: [],
      avatarSeleccionado: undefined,
      cargadoEn: 0,
      genero: 'no_definido',
      bio: '',
      links: { instagram: '', discord: '', tiktok: '', kick: '' },
      linkKeys: LINK_KEYS,
      linkLabels: LINK_LABELS,
      linkIconos: LINK_ICONS,

      get nombre() {
        return this.usuario.apodo || almacen.texto('comunidad_nickname') || '';
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
      get haySesion() {
        return !!almacen.texto('comunidad_session_token');
      },
      // Historial de puntos: solo los últimos 3 días (hoy, ayer y antes de ayer),
      // y dentro de cada día una fila por forma de ganar (sin repetir el texto
      // en cada movimiento).
      historialDias: 3,
      get historialPorDia() {
        const dias = [];
        const hoy = new Date();
        for (let i = 0; i < this.historialDias; i++) {
          const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
          dias.push({
            clave: claveDiaLocal(fecha),
            etiqueta: i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : 'Antes de ayer',
            filas: [],
            puntos: 0
          });
        }
        const porClave = new Map(dias.map((dia) => [dia.clave, dia]));
        for (const ev of this.historial) {
          const fecha = new Date(ev.created_at);
          if (Number.isNaN(fecha.getTime())) continue;
          const dia = porClave.get(claveDiaLocal(fecha));
          if (dia) dia.eventos = (dia.eventos || []).concat(ev);
        }
        return dias
          .filter((dia) => dia.eventos && dia.eventos.length)
          .map((dia) => {
            const filas = this.agruparPuntos(dia.eventos);
            return {
              clave: dia.clave,
              etiqueta: dia.etiqueta,
              filas,
              puntos: filas.reduce((total, fila) => total + fila.puntos, 0)
            };
          });
      },
      // Una fila por forma de ganar puntos: suma y cuenta.
      agruparPuntos(eventos) {
        const mapa = new Map();
        for (const ev of eventos || []) {
          const clave = String(ev.accion || '').toLowerCase() || 'otros';
          const fila = mapa.get(clave) || {
            accion: clave,
            etiqueta: this.etiquetaPunto(clave),
            icono: this.iconoPunto(clave),
            tono: this.tonoPunto(clave),
            veces: 0,
            puntos: 0
          };
          fila.veces += 1;
          fila.puntos += Number(ev.puntos) || 0;
          mapa.set(clave, fila);
        }
        // Más puntos primero; a igualdad, más veces.
        return Array.from(mapa.values()).sort((a, b) => b.puntos - a.puntos || b.veces - a.veces);
      },
      // Suma de lo ganado en los días que se muestran (no incluye canjes de tienda
      // ni movimientos anteriores al corte de 3 días).
      get historialGanado() {
        return this.historialPorDia.reduce((total, dia) => total + dia.puntos, 0);
      },
      // Canjes de la tienda: lo que descuenta del saldo (no está en puntos_eventos).
      get canjesGastados() {
        const anulados = ['rechazado', 'cancelado'];
        return this.canjes
          .filter((c) => !anulados.includes(String(c.estado || '').toLowerCase()))
          .reduce((total, c) => total + (Number(c.costo_puntos) || 0), 0);
      },
      etiquetaCanje(estado) {
        const etiquetas = { pendiente: 'Pendiente', entregado: 'Entregado', rechazado: 'Rechazado', cancelado: 'Cancelado' };
        return etiquetas[String(estado || '').toLowerCase()] || (estado || '');
      },
      tonoCanje(estado) {
        const tonos = { pendiente: 'aviso', entregado: 'exito', rechazado: 'peligro', cancelado: 'peligro' };
        return tonos[String(estado || '').toLowerCase()] || 'neutro';
      },
      fechaCanje(iso) {
        return window.formatearFecha(iso, 'fecha-corta');
      },
      async cargarCanjes() {
        const token = almacen.texto('comunidad_session_token');
        if (!token) { this.canjesEstado = 'vacio'; return; }
        if (this.canjesEstado === 'cargando') return;
        if (this.canjesEstado === 'lista' && Date.now() - this.canjesCargadoEn < 60000) return;
        this.canjesEstado = 'cargando';
        const res = await window.rpc('tienda_mis_canjes', { p_token: token }, { error: false });
        if (!res.ok || !res.data || res.data.ok !== true) {
          this.canjesEstado = 'error';
          return;
        }
        this.canjes = Array.isArray(res.data.canjes) ? res.data.canjes : [];
        this.canjesCargadoEn = Date.now();
        this.canjesEstado = 'lista';
        this.compras = this.canjes.filter((c) => ['color', 'titulo', 'marco', 'icono', 'avatar'].includes(c.tipo));
        this.comprasEstado = 'lista';
      },
      async cargarCompras() {
        await this.cargarCanjes();
        this.compras = (this.canjes || []).filter((c) => ['color', 'titulo', 'marco', 'icono', 'avatar'].includes(c.tipo));
        this.comprasEstado = this.canjesEstado === 'error' ? 'error' : 'lista';
      },
      ponible(c) {
        if (!c) return false;
        return ['color', 'titulo', 'marco', 'icono', 'avatar'].includes(c.tipo);
      },
      estaPuesto(c) {
        if (!c) return false;
        const u = this.usuario || {};
        const sesion = window.obtenerSesionUsuarioComunidad?.() || {};
        if (c.tipo === 'color') return !!c.valor && c.valor === (u.color_apodo || sesion.color_apodo);
        if (c.tipo === 'titulo') return !!c.valor && c.valor === u.titulo_equipado;
        if (c.tipo === 'marco') return !!u.marco_equipado;
        if (c.tipo === 'icono') return !!c.icono && c.icono === (u.icono_equipado || sesion.icono);
        if (c.tipo === 'avatar') return !!c.avatar_url && c.avatar_url === (u.avatar_url || sesion.avatar);
        return false;
      },
      async equiparCompra(c) {
        if (!c) return;
        const token = almacen.texto('comunidad_session_token');
        if (!token) { window.mostrarToast?.('Inicia sesión para equipar.', true); return; }
        const quitar = c.tipo !== 'avatar' && this.estaPuesto(c);
        const res = await window.rpc('equipar_canje', {
          p_token: token,
          p_canje_id: c.id,
          p_equipar: !quitar
        }, { error: false });
        if (!res.ok || !res.data || !res.data.ok) {
          window.mostrarToast?.('No se pudo equipar el premio.', true);
          return;
        }
        const d = res.data;
        this.usuario = Object.assign({}, this.usuario, {
          color_apodo: d.color_apodo,
          titulo_equipado: d.titulo_equipado,
          marco_equipado: d.marco_equipado,
          icono_equipado: d.icono_equipado,
          avatar_url: d.avatar_url
        });
        window.actualizarSesionUsuarioComunidad?.({
          color_apodo: d.color_apodo,
          titulo_equipado: d.titulo_equipado,
          marco_equipado: d.marco_equipado,
          icono: d.icono_equipado || '',
          avatar: d.avatar_url,
          avatar_url: d.avatar_url
        });
        window.actualizarUsuarioNavComunidad?.();
        window.aplicarColoresApodo?.();
        window.mostrarToast?.(quitar ? 'Quitado.' : 'Equipado.');
      },
      tonoPunto(accion) {
        const tonos = {
          tiempo_conectado: 'info',
          visita: 'exito',
          reaccion: 'acento',
          like: 'aviso',
          chat: 'info',
          muro: 'acento'
        };
        return tonos[String(accion || '').toLowerCase()] || 'neutro';
      },
      iconoPunto(accion) {
        const iconos = {
          tiempo_conectado: 'i-solid-clock',
          visita: 'i-solid-calendar-check',
          reaccion: 'i-solid-heart',
          like: 'i-solid-heart',
          chat: 'i-solid-comments',
          muro: 'i-solid-envelope'
        };
        return iconos[String(accion || '').toLowerCase()] || 'i-solid-circle-info';
      },
      // Historial de puntos: solo se pinta en el perfil propio (no en el público).
      // Carga páginas de 50 hasta cubrir los últimos 3 días.
      async cargarHistorial() {
        const token = almacen.texto('comunidad_session_token');
        if (!token) { this.historialEstado = 'vacio'; return; }
        if (this.historialEstado === 'cargando') return;
        this.historial = [];
        this.historialEstado = 'cargando';
        const hoy = new Date();
        const limite = claveDiaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (this.historialDias - 1)));
        const POR_PAGINA = 50;
        let offset = 0;
        for (let intento = 0; intento < 4; intento++) {
          const res = await window.rpc('mis_puntos_historial', {
            p_token: token,
            p_limit: POR_PAGINA,
            p_offset: offset
          }, { error: false });
          if (!res.ok || !res.data || res.data.ok !== true) {
            this.historialEstado = intento === 0 ? 'error' : 'lista';
            return;
          }
          const eventos = Array.isArray(res.data.eventos) ? res.data.eventos : [];
          this.historial = this.historial.concat(eventos);
          offset += eventos.length;
          const ultimo = eventos[eventos.length - 1];
          // Sin más eventos, o ya hay movimientos anteriores al corte de 3 días.
          if (eventos.length < POR_PAGINA) break;
          if (ultimo) {
            const fechaUltimo = new Date(ultimo.created_at);
            if (!Number.isNaN(fechaUltimo.getTime()) && claveDiaLocal(fechaUltimo) < limite) break;
          }
        }
        this.historialEstado = 'lista';
      },
      etiquetaPunto(accion) {
        const etiquetas = {
          tiempo_conectado: 'Tiempo conectado',
          visita: 'Visita diaria',
          reaccion: 'Reacción en el chat',
          like: 'Me gusta en la galería',
          chat: 'Mensaje en el chat',
          muro: 'Saludo en el muro'
        };
        const clave = String(accion || '').toLowerCase();
        if (etiquetas[clave]) return etiquetas[clave];
        if (!clave) return 'Puntos';
        return clave.charAt(0).toUpperCase() + clave.slice(1).replace(/_/g, ' ');
      },
      fechaPunto(iso) {
        return window.formatearFecha(iso, 'dia-mes-hora');
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
        return !!almacen.texto('comunidad_session_token');
      },
      vincularKick() {
        window.KICK_COMUNIDAD?.vincular();
      },
      async desvincularKick() {
        const token = almacen.texto('comunidad_session_token');
        if (!token) return;
        const ok = await window.confirmarAccion({
          titulo: 'Desvincular Kick',
          mensaje: '¿Desvincular tu cuenta de Kick? Tendrás que volver a conectarla para escribir en el chat.',
          textoConfirmar: 'Desvincular',
          tono: 'aviso',
          icono: 'i-solid-right-from-bracket'
        });
        if (!ok) return;
        try {
          const res = await window.llamarEdge('kick-comunidad', { accion: 'desvincular', token });
          const datos = res.datos;
          if (!res.ok || !datos.ok) {
            this.error = datos.error || 'No se pudo desvincular Kick.';
            return;
          }
          if (typeof window.cerrarSesionKick === 'function') await window.cerrarSesionKick();
          else almacen.borrar('gocha_kick_token');
          almacen.borrar('gocha_kick_recordar_hasta');
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
        if (this.abierto && !this.publico) { this.cerrar(); return; }
        this.publico = false;
        this.sobreAdmin = false;
        this.titulo = 'Mi perfil';
        this.error = '';
        this.vista = vista === 'ajustes' || vista === 'cuenta' ? vista : 'perfil';
        this.anclado = window.innerWidth >= 900;
        this.colocarPopover();
        this.abierto = true;
        setNavExpanded(true);
        this.cargar();
        if (this.vista === 'perfil') this.cargarHistorial();
        if (this.vista === 'cuenta') this.cargarCompras();
      },

      abrirEliminar() {
        this.confirmApodo = '';
        this.confirmPin = '';
        this.errorEliminar = '';
        this.eliminarAbierto = true;
      },

      cerrarEliminar() {
        this.eliminarAbierto = false;
      },

      async eliminarCuenta() {
        this.errorEliminar = '';
        const token = almacen.texto('comunidad_session_token');
        if (!token) {
          this.errorEliminar = 'Tu sesión no está activa.';
          return;
        }
        const apodo = String(this.usuario.apodo || '').trim().toLowerCase();
        if (!apodo || String(this.confirmApodo || '').trim().toLowerCase() !== apodo) {
          this.errorEliminar = 'El apodo no coincide.';
          return;
        }
        if (!/^\d{4}$/.test(String(this.confirmPin || ''))) {
          this.errorEliminar = 'El PIN debe tener 4 dígitos.';
          return;
        }
        this.eliminando = true;
        try {
          const res = await window.rpc('eliminar_mi_cuenta', { p_token: token, p_pin: this.confirmPin }, { error: false });
          const codigo = res.ok && res.data ? res.data.error : res.error;
          if (!res.ok || !res.data || res.data.ok !== true) {
            this.errorEliminar = codigo === 'pin_invalido' ? 'PIN incorrecto.'
              : codigo === 'protegida' ? 'Esta cuenta no se puede eliminar.'
              : 'No se pudo eliminar la cuenta.';
            return;
          }
          this.eliminarAbierto = false;
          window.limpiarEstadoSesionUI?.();
          ['comunidad_session_token', 'comunidad_nickname', 'comunidad_user_id', 'comunidad_session_usuario']
            .forEach((clave) => almacen.borrar(clave));
          window.mostrarToast?.('Tu cuenta se ha eliminado.');
          setTimeout(() => { window.location.href = 'comunidad.html'; }, 900);
        } catch (e) {
          this.errorEliminar = 'No se pudo eliminar la cuenta.';
        } finally {
          this.eliminando = false;
        }
      },

      colocarPopover() {
        const btn = document.querySelector('#nav-user-info .nav-user-btn');
        if (!btn || !modalEl) return;
        const r = btn.getBoundingClientRect();
        const derecha = Math.max(12, window.innerWidth - r.right);
        const ancho = Math.min(420, window.innerWidth - 24);
        const izquierda = window.innerWidth - derecha - ancho;
        const flecha = Math.max(16, Math.min(ancho - 28, ancho - ((r.left + r.right) / 2 - izquierda) - 7));
        modalEl.style.setProperty('--perfil-top', (r.bottom + 10) + 'px');
        modalEl.style.setProperty('--perfil-right', derecha + 'px');
        modalEl.style.setProperty('--perfil-flecha', flecha + 'px');
        modalEl.style.setProperty('--perfil-max-alto', Math.max(280, window.innerHeight - r.bottom - 26) + 'px');
      },

      async abrirUsuario(apodo, opciones) {
        if (!apodo || !window.supabase) return;
        crearModal();
        this.publico = true;
        this.sobreAdmin = !!(opciones && opciones.sobreAdmin);
        this.anclado = false;
        this.titulo = 'Perfil público';
        this.vista = 'perfil';
        this.error = '';
        this.usuario = {};
        this.estadisticas = {};
        this.logros = [];
        // El historial es del token, no del perfil que se mira: se limpia para
        // que no se muestre el del visitante bajo el perfil de otra persona.
        this.historial = [];
        this.historialEstado = 'inicial';
        this.cargando = true;
        this.abierto = true;
        setNavExpanded(false);
        try {
          const { data, error } = await window.supabase
            .from('usuarios_comunidad')
            .select('apodo,puntos,rango,genero,avatar_url,bio,links_json,icono_equipado,creado_en,kick_badges,kick_badges_at,kick_user_id,kick_username,color_apodo,titulo_equipado,marco_equipado')
            .ilike('apodo', apodo)
            .maybeSingle();
          if (error) throw error;
          if (!data) {
            this.error = 'No se encontró ese perfil.';
            return;
          }
          this.usuario = data;
          const apodoPedido = data.apodo;
          window.rpc('logros_de', { p_apodo: data.apodo }, { error: false })
            .then((res) => {
              if (res.ok && res.data && res.data.ok && this.publico && this.usuario && this.usuario.apodo === apodoPedido) {
                this.logros = res.data.logros || [];
              }
            });
          window.rpc('estadisticas_perfil_comunidad', { p_apodo: data.apodo }, { error: false })
            .then((res) => {
              if (!res.ok) {
                console.warn('No se pudieron cargar las estadísticas:', res.error);
                return;
              }
              if (this.publico && this.usuario && this.usuario.apodo === apodoPedido) {
                this.estadisticas = res.data || {};
              }
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

      aplicarPerfil(u) {
        if (!u || !u.apodo) return;
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
      },

      async cargar() {
        const token = almacen.texto('comunidad_session_token');
        this.error = '';
        if (!token || !window.supabase) {
          this.usuario = {};
          this.error = 'Inicia sesión en la Comunidad para ver tu perfil.';
          this.cargando = false;
          return;
        }

        // Abrir con lo que ya hay en la sesión: el panel no espera a la red.
        let u = window.obtenerSesionUsuarioComunidad() || {};
        this.aplicarPerfil(u);
        this.logros = [];
        if (u.apodo) {
          window.rpc('mis_logros', { p_token: token }, { error: false }).then((res) => {
            if (!res.ok || !res.data || !res.data.ok) return;
            this.logros = res.data.logros || [];
            const nuevos = res.data.nuevos || [];
            if (nuevos.length) {
              window.mostrarToast?.('🏅 Nuevo logro: ' + nuevos.map((n) => n.nombre).join(', '));
              window.refrescarPuntosDia?.();
            }
          });
        }
        if (avataresCache) this.avatares = avataresCache;
        this.cargando = !u.apodo;

        // Reabrir en menos de 30 s no vuelve a pedir nada.
        if (this.cargadoEn && Date.now() - this.cargadoEn < 30000) {
          this.cargando = false;
          return;
        }

        const userId = u.id || almacen.texto('comunidad_user_id');
        try {
          const [fila, avatares] = await Promise.all([
            userId
              ? window.supabase
                .from('usuarios_comunidad')
                .select('apodo,puntos,rango,genero,avatar_url,bio,links_json,icono_equipado,creado_en,kick_badges,kick_badges_at,kick_user_id,kick_username,color_apodo,titulo_equipado,marco_equipado')
                .eq('id', userId)
                .maybeSingle()
              : Promise.resolve({ data: null, error: null }),
            avataresCache
              ? Promise.resolve({ data: null, error: null })
              : window.rpcRaw('obtener_avatares_disponibles', { p_token: token })
          ]);

          if (!fila.error && fila.data) {
            const d = fila.data;
            u = Object.assign({}, u, {
              id: Number(userId),
              apodo: d.apodo ?? u.apodo,
              puntos: d.puntos ?? u.puntos,
              rango: d.rango ?? u.rango,
              genero: d.genero ?? u.genero,
              avatar_url: d.avatar_url ?? null,
              bio: d.bio ?? null,
              links_json: d.links_json ?? null,
              icono: d.icono_equipado ?? '',
              color_apodo: d.color_apodo ?? null,
              titulo_equipado: d.titulo_equipado ?? null,
              marco_equipado: !!d.marco_equipado,
              creado_en: d.creado_en ?? u.creado_en ?? null,
              kick_user_id: d.kick_user_id ?? null,
              kick_username: d.kick_username ?? null
            });
          }

          if (!avatares.error && avatares.data && avatares.data.ok) {
            avataresCache = Array.isArray(avatares.data.avatares) ? avatares.data.avatares : [];
            if (avatares.data.genero) u.genero = avatares.data.genero;
          }
          if (avataresCache) this.avatares = avataresCache;

          window.actualizarSesionUsuarioComunidad(u);
          this.aplicarPerfil(u);
          this.avatarSeleccionado = undefined;
          this.cargadoEn = Date.now();
        } catch (e) {
          console.error('Error cargando perfil:', e);
          if (!u.apodo) this.error = 'No se pudo cargar el perfil.';
        } finally {
          this.cargando = false;
        }
      },

      elegirAvatar(url) {
        this.avatarSeleccionado = url;
      },

      async guardar() {
        this.error = '';
        const token = almacen.texto('comunidad_session_token');
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
          const { data, error } = await window.rpcRaw('actualizar_perfil_comunidad', payload);
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
  window.abrirPerfilUsuario = function abrirPerfilUsuario(apodo, opciones) {
    window.Alpine?.store('perfil')?.abrirUsuario(apodo, opciones);
  };
})();

/* === Paleta de comandos (Ctrl/Cmd + K) ===
   Navegación rápida y acciones globales, sin dependencias. */
(function paletaComandos() {
    const PAGINAS = [
        { titulo: 'Inicio', detalle: 'Página principal', ir: './' },
        { titulo: 'Comunidad', detalle: 'Chat, ranking y tienda', ir: 'comunidad.html' },
        { titulo: 'Galería', detalle: 'Fotos de la comunidad', ir: 'galeria.html' },
        { titulo: 'Sorteo', detalle: 'Tómbola y ganadores', ir: 'sorteo.html' },
        { titulo: 'GochiWatch', detalle: 'Cine sincronizado', ir: 'cine.html' }
    ];
    const ACCIONES = [
        {
            titulo: 'Cambiar tema',
            detalle: 'Oscuro, OLED o claro',
            accion: () => document.getElementById('btn-toggle-tema')?.click()
        },
        {
            titulo: 'Acceso de administración',
            detalle: 'Panel de moderación (pide sesión de admin)',
            accion: () => window.abrirAdminPanel?.('login')
        }
    ];
    // Atajos que solo aparecen con sesión de admin u owner.
    const ACCIONES_ADMIN = [
        { titulo: 'Panel: Usuarios', detalle: 'Buscar, banear y shadowban', accion: () => window.abrirAdminPanel?.('usuarios') },
        { titulo: 'Panel: Reportes', detalle: 'Fotos reportadas por la comunidad', accion: () => window.abrirAdminPanel?.('reportes') },
        { titulo: 'Panel: Auditoría', detalle: 'Historial de moderación', accion: () => window.abrirAdminPanel?.('auditoria') },
        { titulo: 'Panel: Descargas', detalle: 'APK y dispositivos', accion: () => window.abrirAdminPanel?.('descargas') },
        { titulo: 'Panel: Buzón', detalle: 'Sugerencias (solo owner)', accion: () => window.abrirAdminPanel?.('buzon') }
    ];
    const TODOS = PAGINAS.concat(ACCIONES);
    let esAdminPaleta = false;
    let caja = null;
    let campo = null;
    let lista = null;
    let visibles = TODOS.slice();
    let seleccion = 0;
    let focoPrevio = null;

    function normaliza(texto) {
        return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function pintar() {
        lista.replaceChildren();
        visibles.forEach((item, indice) => {
            const fila = document.createElement('button');
            fila.type = 'button';
            fila.className = 'gochi-paleta-item';
            fila.setAttribute('role', 'option');
            fila.setAttribute('aria-selected', String(indice === seleccion));
            const titulo = document.createElement('span');
            titulo.className = 'gochi-paleta-titulo';
            titulo.textContent = item.titulo;
            const detalle = document.createElement('span');
            detalle.className = 'gochi-paleta-detalle';
            detalle.textContent = item.detalle;
            fila.append(titulo, detalle);
            fila.addEventListener('click', () => ejecutar(item));
            lista.appendChild(fila);
        });
        if (!visibles.length) {
            const vacio = document.createElement('p');
            vacio.className = 'gochi-paleta-vacio';
            vacio.textContent = 'Sin resultados.';
            lista.appendChild(vacio);
        }
    }

    function itemsBase() {
        return esAdminPaleta ? TODOS.concat(ACCIONES_ADMIN) : TODOS.slice();
    }

    // Escribir "@apodo" con sesión de admin ofrece atajos para esa persona.
    function accionesApodo(valor) {
        if (!esAdminPaleta) return [];
        const crudo = String(valor || '').trim();
        if (!crudo.startsWith('@')) return [];
        const apodo = crudo.slice(1).trim();
        if (apodo.length < 2) return [];
        return [
            {
                titulo: 'Ver perfil de ' + apodo,
                detalle: 'Ficha pública de la comunidad',
                accion: () => window.abrirPerfilUsuario?.(apodo)
            },
            {
                titulo: 'Buscar a ' + apodo + ' en el panel',
                detalle: 'Abre Usuarios filtrado por ese apodo',
                accion: () => window.abrirAdminPanel?.('usuarios', { buscar: apodo })
            }
        ];
    }

    function filtrar() {
        const q = normaliza(campo.value);
        const base = itemsBase();
        visibles = (q
            ? base.filter((i) => normaliza(i.titulo).includes(q) || normaliza(i.detalle).includes(q))
            : base.slice())
            .concat(accionesApodo(campo.value));
        seleccion = 0;
        pintar();
    }

    function mover(delta) {
        if (!visibles.length) return;
        seleccion = (seleccion + delta + visibles.length) % visibles.length;
        pintar();
        lista.children[seleccion]?.scrollIntoView({ block: 'nearest' });
    }

    function ejecutar(item) {
        if (!item) return;
        cerrar();
        if (item.ir) window.location.href = item.ir;
        else if (item.accion) item.accion();
    }

    async function abrir() {
        if (!caja) crear();
        focoPrevio = document.activeElement;
        caja.hidden = false;
        campo.value = '';
        esAdminPaleta = false;
        filtrar();
        campo.focus();
        try {
            const admin = await window.esAdminActual?.();
            if (admin && !caja.hidden) {
                esAdminPaleta = true;
                filtrar();
            }
        } catch (e) { /* sin sesión de admin */ }
    }

    function cerrar() {
        if (!caja) return;
        caja.hidden = true;
        if (focoPrevio && typeof focoPrevio.focus === 'function') focoPrevio.focus();
    }

    function crear() {
        caja = document.createElement('div');
        caja.className = 'gochi-paleta';
        caja.hidden = true;
        caja.setAttribute('role', 'dialog');
        caja.setAttribute('aria-modal', 'true');
        caja.setAttribute('aria-label', 'Paleta de comandos');

        const fondo = document.createElement('div');
        fondo.className = 'gochi-paleta-fondo';
        fondo.addEventListener('click', cerrar);

        const panel = document.createElement('div');
        panel.className = 'gochi-paleta-caja';

        campo = document.createElement('input');
        campo.type = 'text';
        campo.className = 'gochi-paleta-input';
        campo.placeholder = 'Buscar página o acción...';
        campo.setAttribute('aria-label', 'Buscar en la paleta de comandos');
        campo.autocomplete = 'off';
        campo.addEventListener('input', filtrar);
        campo.addEventListener('keydown', (evento) => {
            if (evento.key === 'ArrowDown') { evento.preventDefault(); mover(1); }
            else if (evento.key === 'ArrowUp') { evento.preventDefault(); mover(-1); }
            else if (evento.key === 'Enter') { evento.preventDefault(); ejecutar(visibles[seleccion]); }
            else if (evento.key === 'Escape') { evento.preventDefault(); cerrar(); }
        });

        lista = document.createElement('div');
        lista.className = 'gochi-paleta-lista';
        lista.setAttribute('role', 'listbox');

        panel.append(campo, lista);
        caja.append(fondo, panel);
        document.body.appendChild(caja);
    }

    document.addEventListener('keydown', (evento) => {
        const esAtajo = (evento.ctrlKey || evento.metaKey) && (evento.key === 'k' || evento.key === 'K');
        if (!esAtajo) return;
        evento.preventDefault();
        if (caja && !caja.hidden) cerrar();
        else abrir();
    });
})();
