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
const PAGINAS = ['index.html', 'comunidad.html', 'galeria.html', 'sorteo.html', 'cine.html', '404.html'];
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
        } finally {
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
