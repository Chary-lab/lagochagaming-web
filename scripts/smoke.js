/* Smoke test del sitio: 5 páginas, consola limpia, sin desborde horizontal.
 *
 * Uso:
 *   node scripts/smoke.js            (levanta un servidor propio en 8788)
 *   node scripts/smoke.js --url=http://127.0.0.1:8765
 *
 * Necesita el paquete playwright. Si no está en node_modules, el script busca
 * en la caché de npx (donde lo deja playwright-cli) y avisa si no lo encuentra.
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RAIZ = path.resolve(__dirname, '..');
const PAGINAS = ['index.html', 'comunidad.html', 'galeria.html', 'sorteo.html', 'cine.html', 'game.html', '404.html'];
const VIEWPORTS = [{ w: 1690, h: 900, nombre: 'escritorio' }, { w: 390, h: 844, nombre: 'movil' }];

function cargarPlaywright() {
    const candidatos = [null];
    const npx = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    if (fs.existsSync(npx)) {
        for (const dir of fs.readdirSync(npx)) {
            candidatos.push(path.join(npx, dir, 'node_modules'));
        }
    }
    candidatos.push(path.join(process.env.APPDATA || '', 'npm', 'node_modules'));
    for (const base of candidatos) {
        try {
            const ruta = base ? require.resolve('playwright', { paths: [base] }) : require.resolve('playwright');
            return require(ruta);
        } catch (e) { /* siguiente */ }
    }
    return null;
}

function puertoLibre(puerto) {
    return new Promise((resolver) => {
        const net = require('net');
        const s = net.connect(puerto, '127.0.0.1');
        s.on('connect', () => { s.destroy(); resolver(false); });
        s.on('error', () => resolver(true));
    });
}

async function servidor(puerto) {
    const proceso = spawn('python', ['-m', 'http.server', String(puerto)], { cwd: RAIZ, stdio: 'ignore' });
    for (let i = 0; i < 40; i++) {
        if (!(await puertoLibre(puerto))) return proceso;
        await new Promise((r) => setTimeout(r, 150));
    }
    proceso.kill();
    throw new Error('el servidor local no arrancó');
}

(async () => {
    const pw = cargarPlaywright();
    if (!pw) {
        console.error('No se encontró playwright. Instálalo o ejecuta antes playwright-cli una vez.');
        process.exit(2);
    }

    const argUrl = process.argv.find((a) => a.startsWith('--url='));
    const puerto = 8788;
    let base = argUrl ? argUrl.slice(6).replace(/\/$/, '') : null;
    let proceso = null;
    if (!base) {
        proceso = await servidor(puerto);
        base = `http://127.0.0.1:${puerto}`;
    }

    const version = fs.readFileSync(path.join(RAIZ, 'VERSION'), 'utf8').trim();
    // El paquete de Playwright puede no traer su Chromium descargado; se usa el
    // navegador del sistema (Chrome o Edge) antes de rendirse.
    let navegador = null;
    for (const opciones of [{ channel: 'chrome' }, { channel: 'msedge' }, {}]) {
        try {
            navegador = await pw.chromium.launch(opciones);
            break;
        } catch (e) { /* siguiente opción */ }
    }
    if (!navegador) {
        console.error('No se pudo lanzar Chrome ni Edge. Ejecuta: npx playwright install');
        process.exit(2);
    }
    const fallos = [];

    try {
        for (const vp of VIEWPORTS) {
            const contexto = await navegador.newContext({ viewport: { width: vp.w, height: vp.h } });
            const pagina = await contexto.newPage();
            const errores = [];
            pagina.on('console', (m) => {
                if (m.type() !== 'error') return;
                const texto = m.text();
                if (/supabase|kick\.com|7tv|umami|ivs|compute-pressure|Permissions policy|MasterPlaylist|Player stopping playback|ErrorNotAvailable/i.test(texto)) return;
                errores.push(texto);
            });
            pagina.on('pageerror', (e) => errores.push(String(e)));

            for (const archivo of PAGINAS) {
                errores.length = 0;
                const respuesta = await pagina.goto(`${base}/${archivo}?smoke=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await pagina.waitForTimeout(2500);
                const datos = await pagina.evaluate(() => ({
                    titulo: document.title,
                    navbar: !!document.querySelector('.navbar'),
                    principal: !!document.querySelector('main, .content-section, #stream-player, .cine-layout'),
                    ancho: document.documentElement.scrollWidth,
                    ventana: window.innerWidth,
                    css: (document.querySelector('link[href*="style.css"]') || {}).href || '',
                    js: (document.querySelector('script[src*="main.js"]') || {}).src || ''
                }));
                const etiqueta = `${archivo} @${vp.nombre}`;
                // 404 no lleva navbar ni main.js a propósito: no hereda sesión ni ajustes.
                const es404 = archivo === '404.html';
                if (!respuesta || respuesta.status() !== 200) fallos.push(`${etiqueta}: HTTP ${respuesta ? respuesta.status() : 'sin respuesta'}`);
                if (!datos.titulo) fallos.push(`${etiqueta}: sin <title>`);
                if (!datos.navbar && !es404) fallos.push(`${etiqueta}: falta la navbar`);
                if (!datos.principal) fallos.push(`${etiqueta}: falta el contenido principal`);
                if (datos.ancho > datos.ventana + 1) fallos.push(`${etiqueta}: desborde horizontal (${datos.ancho} > ${datos.ventana})`);
                if (!datos.css.includes(`?v=${version}`)) fallos.push(`${etiqueta}: style.css sin ?v=${version}`);
                if (!datos.js.includes(`?v=${version}`) && !es404) fallos.push(`${etiqueta}: main.js sin ?v=${version}`);
                if (errores.length) fallos.push(`${etiqueta}: ${errores.length} error(es) de consola -> ${errores[0].slice(0, 120)}`);
            }
            await contexto.close();
        }
        // Interacciones: paleta de comandos y APIs de ajustes.
        const ctxInt = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
        const pag = await ctxInt.newPage();
        try {
            await pag.goto(`${base}/index.html?smoke=inter`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await pag.waitForTimeout(2000);
            const apis = await pag.evaluate(() => ({
                sonido: typeof window.sonidoChat,
                exportar: typeof window.exportarMisDatos,
                ajustes: !!(window.Alpine && window.Alpine.store('ajustes'))
            }));
            if (apis.sonido !== 'function') fallos.push('interacción: falta window.sonidoChat');
            if (apis.exportar !== 'function') fallos.push('interacción: falta window.exportarMisDatos');
            if (!apis.ajustes) fallos.push('interacción: falta el store ajustes');

            await pag.keyboard.press('Control+k');
            await pag.waitForTimeout(400);
            const abierta = await pag.evaluate(() => {
                const caja = document.querySelector('.gochi-paleta');
                return { visible: !!caja && !caja.hidden, items: document.querySelectorAll('.gochi-paleta-item').length };
            });
            if (!abierta.visible) fallos.push('interacción: Ctrl+K no abre la paleta');
            if (!abierta.items) fallos.push('interacción: la paleta no lista comandos');

            await pag.keyboard.press('Escape');
            await pag.waitForTimeout(300);
            const cerrada = await pag.evaluate(() => {
                const caja = document.querySelector('.gochi-paleta');
                return !caja || caja.hidden;
            });
            if (!cerrada) fallos.push('interacción: Escape no cierra la paleta');

            // Ajustes del dispositivo: el script del <head> aplica las clases
            // antes del primer pintado desde un único JSON en `gochi_ajustes`.
            await pag.evaluate(() => localStorage.setItem('gochi_ajustes', JSON.stringify({ texto: 110, animaciones: false, ahorro: true })));
            await pag.reload({ waitUntil: 'domcontentloaded' });
            await pag.waitForTimeout(1500);
            const ajustes = await pag.evaluate(() => ({
                clases: document.documentElement.className,
                datos: window.Alpine && window.Alpine.store('ajustes') ? window.Alpine.store('ajustes').datos : null
            }));
            for (const clase of ['texto-110', 'sin-animaciones', 'ahorro-datos']) {
                if (!new RegExp('(^|\\s)' + clase + '(\\s|$)').test(ajustes.clases)) {
                    fallos.push(`interacción: gochi_ajustes no aplica ${clase}`);
                }
            }
            if (!ajustes.datos || Number(ajustes.datos.texto) !== 110) {
                fallos.push('interacción: el store ajustes no lee gochi_ajustes');
            }

            // Galería: dar like sin sesión pide login y no abre el lightbox.
            await pag.goto(`${base}/galeria.html?smoke=like`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await pag.waitForTimeout(2500);
            const hayLike = await pag.evaluate(() => {
                const btn = document.querySelector('.like-btn[data-action="toggle-like"]');
                if (!btn) return false;
                btn.click();
                return true;
            });
            if (!hayLike) {
                fallos.push('interacción: la galería no pinta tarjetas con like');
            } else {
                await pag.waitForTimeout(600);
                const likeSinSesion = await pag.evaluate(() => {
                    const caja = document.getElementById('lightbox');
                    const pila = document.querySelector('.gochi-toast-stack');
                    return {
                        lightbox: !!caja && !caja.hidden,
                        aviso: pila ? pila.textContent : ''
                    };
                });
                if (likeSinSesion.lightbox) fallos.push('interacción: el like sin sesión abre el lightbox');
                if (!/sesi[oó]n/i.test(likeSinSesion.aviso)) fallos.push('interacción: el like sin sesión no pide iniciar sesión');
            }

            // Adornos del apodo (2.9.1): el mapa de la tienda tiene que estar cargado
            // al abrir la página y el historial del chat tiene que traer hora. Antes el
            // mapa se pedía antes de existir la función y el historial se saltaba el
            // normalizador, así que los colores no se veían en ningún sitio.
            await pag.goto(base + '/comunidad.html?smoke=adornos', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await pag.waitForTimeout(4000);
            const adornos = await pag.evaluate(async () => {
                const aRgb = (hex) => {
                    const h = String(hex || '').replace('#', '');
                    if (h.length < 6) return '';
                    return 'rgb(' + [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';
                };
                const salida = { conDatos: false, mapa: null, mensajes: 0, sinHora: 0, colorAplicado: null };
                if (!window.supabase || typeof window.colorApodoDe !== 'function') return salida;
                const { data } = await window.supabase
                    .from('usuarios_comunidad')
                    .select('apodo, color_apodo')
                    .not('color_apodo', 'is', null)
                    .limit(1);
                const perfil = data && data[0];
                if (!perfil) return salida;
                salida.conDatos = true;
                salida.mapa = window.colorApodoDe(perfil.apodo) || '';
                const contenedores = [...document.querySelectorAll('.chat-msg-container')];
                salida.mensajes = contenedores.length;
                contenedores.forEach((c) => {
                    const f = c.querySelector('.chat-msg-fecha');
                    if (!f || !f.textContent.trim()) salida.sinHora++;
                });
                const suyo = [...document.querySelectorAll('.chat-msg-autor')]
                    .find((a) => a.textContent.trim().toLowerCase() === String(perfil.apodo).toLowerCase());
                if (suyo) salida.colorAplicado = getComputedStyle(suyo).color === aRgb(perfil.color_apodo);
                return salida;
            });
            if (!adornos.conDatos) {
                console.log('aviso: ningún perfil con color_apodo; se omite la comprobación de adornos');
            } else {
                if (!adornos.mapa) fallos.push('adornos: el mapa de colores no se cargó al abrir la página');
                if (adornos.mensajes > 0 && adornos.sinHora > 0) {
                    fallos.push('adornos: ' + adornos.sinHora + '/' + adornos.mensajes + ' mensajes del historial sin hora');
                }
                if (adornos.colorAplicado === false) fallos.push('adornos: el color del apodo no se aplica en el chat');
            }

            // Galería: tarjetas con autor y título, y el filtro activo legible
            // (el texto blanco sobre el acento claro medía 1.47:1).
            await pag.goto(base + '/galeria.html?smoke=contraste', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await pag.waitForTimeout(3000);
            const galeria = await pag.evaluate(() => {
                const luminancia = (color) => {
                    const n = (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
                    if (n.length < 3) return null;
                    const canales = n.map((v) => {
                        const c = v / 255;
                        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
                    });
                    return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
                };
                const contraste = (a, b) => {
                    const la = luminancia(a), lb = luminancia(b);
                    if (la === null || lb === null) return null;
                    const mayor = Math.max(la, lb), menor = Math.min(la, lb);
                    return (mayor + 0.05) / (menor + 0.05);
                };
                const autores = [...document.querySelectorAll('.gallery-card-autor')].filter((a) => a.textContent.trim());
                const titulos = [...document.querySelectorAll('.gallery-card-title')].filter((t) => t.textContent.trim());
                const filtro = document.querySelector('.tab-filter-btn.active');
                let ratio = null;
                if (filtro) {
                    let fondo = getComputedStyle(filtro).backgroundColor;
                    let nodo = filtro;
                    while (nodo && /rgba\(0, 0, 0, 0\)|transparent/.test(fondo) && nodo.parentElement) {
                        nodo = nodo.parentElement;
                        fondo = getComputedStyle(nodo).backgroundColor;
                    }
                    ratio = contraste(getComputedStyle(filtro).color, fondo || 'rgb(0, 0, 0)');
                }
                return { autores: autores.length, titulos: titulos.length, ratio: ratio === null ? null : Number(ratio.toFixed(2)) };
            });
            if (!galeria.autores) fallos.push('galería: ninguna tarjeta con autor');
            if (!galeria.titulos) fallos.push('galería: ninguna tarjeta con título');
            if (galeria.ratio !== null && galeria.ratio < 4.5) {
                fallos.push('galería: el filtro activo no llega a 4.5:1 (' + galeria.ratio + ')');
            }
            // Geometría: que los bloques del chat no se estiren ni tapen el campo de
            // texto. Este tipo de fallo no da error de consola ni desborde horizontal
            // (pasó con la encuesta en la 2.9.4 y solo se vio en una captura).
            await pag.goto(base + '/comunidad.html?smoke=geometria', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await pag.waitForTimeout(3000);
            const geo = await pag.evaluate(() => {
                const visible = (el) => !!el && getComputedStyle(el).display !== 'none';
                const poll = document.querySelector('.chat-poll--suelto');
                const caja = document.getElementById('chat-mensaje');
                const salida = { hayPoll: visible(poll), hayCaja: visible(caja) };
                if (salida.hayPoll) {
                    const rp = poll.getBoundingClientRect();
                    const opciones = [...poll.querySelectorAll('.chat-poll-opciones button')];
                    salida.alto = Math.round(rp.height);
                    salida.flex = getComputedStyle(poll).flex;
                    salida.ultimaDentro = opciones.length
                        ? opciones[opciones.length - 1].getBoundingClientRect().bottom <= rp.bottom + 1
                        : null;
                    if (salida.hayCaja) {
                        const rc = caja.getBoundingClientRect();
                        salida.seSolapan = rp.bottom > rc.top && rp.top < rc.bottom;
                    }
                }
                const hero = document.querySelector('.hero-section');
                salida.heroAlto = hero ? Math.round(hero.getBoundingClientRect().height) : null;
                return salida;
            });
            if (geo.hayPoll) {
                if (/^1\s/.test(geo.flex)) fallos.push('geometría: la encuesta se estira (flex ' + geo.flex + ')');
                if (geo.alto > 320) fallos.push('geometría: la encuesta mide ' + geo.alto + ' px de alto');
                if (geo.ultimaDentro === false) fallos.push('geometría: la última opción de la encuesta queda cortada');
                if (geo.seSolapan) fallos.push('geometría: la encuesta se solapa con el campo del chat');
            }

            await pag.goto(base + '/index.html?smoke=hero', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await pag.waitForTimeout(2500);
            const hero = await pag.evaluate(() => {
                const el = document.querySelector('.hero-section');
                return el ? Math.round(el.getBoundingClientRect().height) : 0;
            });
            if (hero < 200) fallos.push('geometría: el hero mide ' + hero + ' px');        } finally {
            await ctxInt.close();
        }
    } finally {
        await navegador.close();
        if (proceso) proceso.kill();
    }

    if (fallos.length) {
        console.error(`SMOKE: ${fallos.length} fallo(s)`);
        for (const f of fallos) console.error(' - ' + f);
        process.exit(1);
    }
    console.log(`SMOKE OK: ${PAGINAS.length} páginas × ${VIEWPORTS.length} tamaños (v${version})`);
})().catch((e) => {
    console.error('SMOKE: error inesperado ->', e.message);
    process.exit(1);
});
