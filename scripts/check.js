#!/usr/bin/env node
/*
 * Validaciones estáticas del sitio (sin dependencias).
 * Uso: node scripts/check.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'comunidad.html', 'galeria.html', 'sorteo.html', 'cine.html'];

const errores = [];
const avisos = [];
const leer = (archivo) => fs.readFileSync(path.join(ROOT, archivo), 'utf8');
const existe = (archivo) => fs.existsSync(path.join(ROOT, archivo));

function error(mensaje) { errores.push(mensaje); }
function aviso(mensaje) { avisos.push(mensaje); }

function comprobarSintaxis(archivo, codigo) {
    try {
        new vm.Script(codigo, { filename: archivo });
    } catch (e) {
        error(`${archivo}: error de sintaxis JS -> ${e.message}`);
    }
}

function normalizarRutaLocal(valor) {
    let limpio = valor.split('#')[0].split('?')[0];
    if (!limpio || limpio === '.' || limpio === './') return 'index.html';
    if (/^(https?:)?\/\//i.test(limpio) || /^(data|blob|mailto|javascript):/i.test(limpio)) return null;
    limpio = limpio.replace(/^\.\//, '').replace(/^\//, '');
    if (limpio.endsWith('/')) return path.posix.join(limpio, 'index.html');
    if (!path.posix.extname(limpio)) {
        if (existe(limpio + '.html')) return limpio + '.html';
        if (existe(path.posix.join(limpio, 'index.html'))) return path.posix.join(limpio, 'index.html');
    }
    return limpio;
}

// Versión
const version = leer('VERSION').trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) {
    error(`VERSION no es SemVer: "${version}"`);
}

// Cache busters: todo ?v= de style.css/main.js debe coincidir con VERSION.
// Con --fix se reescribe el valor en vez de fallar.
const FIX = process.argv.includes('--fix');
for (const pagina of [...PAGES, '404.html']) {
    if (!existe(pagina)) continue;
    const html = leer(pagina);
    const nuevo = html.replace(/((?:style\.css|main\.js))\?v=[^"']+/g, `$1?v=${version}`);
    if (nuevo !== html) {
        if (FIX) {
            fs.writeFileSync(path.join(ROOT, pagina), nuevo, 'utf8');
            console.log(`${pagina}: cache buster actualizado a ${version}`);
        } else {
            error(`${pagina}: cache ?v= desactualizado; ejecuta node scripts/check.js --fix`);
        }
    }
}

// --- CSP por <meta> -------------------------------------------------------
// GitHub Pages no aplica `_headers`, así que la política viaja en el propio
// HTML. Los scripts inline se autorizan por hash SHA-256 y este archivo es la
// única fuente: recalcula los hashes y falla si la meta no coincide (--fix la
// reescribe). Sin 'unsafe-inline' en script-src: un inline nuevo sin hash deja
// de ejecutarse, que es justo lo que queremos detectar.
const CSP_DIRECTIVAS = (hashes) => [
    "default-src 'self'",
    // 'unsafe-eval' es obligatorio: Alpine evalúa las expresiones de x-data /
    // x-on: en runtime (su build CDN no tiene variante CSP sin compilar).
    `script-src 'self' 'unsafe-eval' ${hashes.join(' ')} https://cdn.jsdelivr.net https://cloud.umami.is https://www.youtube.com https://s.ytimg.com`,
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://7tv.io https://cdn.7tv.app https://kick.com https://cloud.umami.is https://www.youtube.com",
    "frame-src 'self' https://player.kick.com https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com https://www.tiktok.com https://*.supabase.co",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
].join('; ');

// Hashes de los <script> inline. Los JSON-LD no son código y quedan fuera; los
// bloques `speculationrules` sí están sujetos a script-src en Chrome, así que
// necesitan su hash como cualquier script inline.
// El hash se calcula sobre el texto con saltos de línea normalizados a LF: el
// parser del navegador normaliza CRLF antes de hashear, así que hashear el
// archivo tal cual (con CRLF en Windows) daría un hash que nunca coincide.
function hashesInline(html) {
    const hashes = [];
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        const attrs = m[1] || '';
        if (/\bsrc\s*=/.test(attrs)) continue;
        const tipo = (attrs.match(/\btype\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
        if (/ld\+json|application\/json/i.test(tipo)) continue;
        const cuerpo = (m[2] || '').replace(/\r\n/g, '\n');
        if (!cuerpo.trim()) continue;
        hashes.push(`'sha256-${crypto.createHash('sha256').update(cuerpo, 'utf8').digest('base64')}'`);
    }
    return hashes;
}

// Ojo: el valor lleva comillas simples ('self', 'sha256-...'), así que el
// atributo solo puede delimitarse por comillas dobles.
const RE_META_CSP = /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]*)"[^>]*>/i;
const RE_CHARSET = /<meta\s+charset=["'][^"']+["'][^>]*>/i;

function construirMetaCsp(html) {
    const valor = CSP_DIRECTIVAS(hashesInline(html)).replace(/"/g, '&quot;');
    return `<meta http-equiv="Content-Security-Policy" content="${valor}">`;
}

for (const pagina of PAGES.concat(['404.html'])) {
    if (!existe(pagina)) continue;
    const html = leer(pagina);
    const meta = html.match(RE_META_CSP);
    if (!meta) {
        if (FIX && RE_CHARSET.test(html)) {
            fs.writeFileSync(
                path.join(ROOT, pagina),
                html.replace(RE_CHARSET, (m) => m + '\n    ' + construirMetaCsp(html)),
                'utf8'
            );
            console.log(`${pagina}: meta CSP añadida`);
        } else {
            error(`${pagina}: falta la meta Content-Security-Policy; ejecuta node scripts/check.js --fix`);
        }
        continue;
    }
    const esperada = construirMetaCsp(html).match(/content="([^"]*)"/)[1];
    if (meta[1] !== esperada) {
        if (FIX) {
            fs.writeFileSync(path.join(ROOT, pagina), html.replace(RE_META_CSP, construirMetaCsp(html)), 'utf8');
            console.log(`${pagina}: CSP actualizada (hashes de scripts inline)`);
        } else {
            error(`${pagina}: CSP no coincide con los scripts inline; ejecuta node scripts/check.js --fix`);
        }
    }
}

// main.js
const mainJs = leer('main.js');
comprobarSintaxis('main.js', mainJs);if (/service_role|serviceRole/i.test(mainJs)) {
    error('main.js parece contener una clave service_role (nunca debe estar en el cliente)');
}
if (/Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|Ãƒ|Ã‚|ðŸ|â€/.test(mainJs)) {
    error('main.js: texto con encoding roto (mojibake)');
}
// Copiar enlaces: una sola implementación con fallback (HTTPS y navegadores antiguos).
if (!/window\.copiarEnlace\s*=\s*(async\s+)?function/.test(mainJs)) {
    error('main.js: falta window.copiarEnlace (helper compartido de copiar enlace)');
}
if (!/execCommand\(\s*['"]copy['"]/.test(mainJs)) {
    error('main.js: copiarEnlace debe conservar el fallback con execCommand("copy")');
}
if (!/navigator\.clipboard\s*\.\s*writeText/.test(mainJs)) {
    aviso('main.js: copiarEnlace no usa navigator.clipboard.writeText');
}

// Sin CDN de Tailwind: todo el estilo vive en style.css.
if (/cdn\.tailwindcss\.com/.test(mainJs)) {
    error('main.js: no debe cargar el CDN de Tailwind (rompe los bordes al inyectarse)');
}
for (const api of ['gochiDropdown', 'gochiSkeleton', 'gochiChip', 'cerrarGochiMenus']) {
    if (!new RegExp('window\\.' + api + '\\s*=').test(mainJs)) {
        error(`main.js: falta window.${api} (API de componentes Gochi)`);
    }
}

// RPC: una sola puerta. Toda llamada pasa por window.rpcRaw / window.rpc, que
// normalizan el error. Se permite exactamente UNA llamada directa a
// window.supabase.rpc: la implementación de rpcRaw. Las páginas no pueden
// llamar a supabase.rpc (se colaban llamadas nuevas sin try/catch).
const sinEspacios = (texto) => String(texto).replace(/\s+/g, '');
const directasMain = (sinEspacios(mainJs).match(/window\.supabase\.rpc\(/g) || []).length;
if (directasMain > 1) {
    error(`main.js: ${directasMain} llamadas a window.supabase.rpc; usa window.rpcRaw/window.rpc (solo se permite la de rpcRaw)`);
}
for (const pagina of PAGES.concat(['404.html'])) {
    if (!existe(pagina)) continue;
    if (/(?<!window\.)supabase\.rpc\(/.test(sinEspacios(leer(pagina)))) {
        error(`${pagina}: usa supabase.rpc directo; cámbialo a window.rpcRaw(...)`);
    }
}

// La app (mobile/mobile.js) corre sobre el mismo HTML, así que rpcRaw ya está
// cargado: se prohíbe cualquier `.rpc(` para que no vuelva a colarse una
// llamada `client.rpc(...)`, que se saltaba la puerta única.
if (existe('mobile/mobile.js') && /\.rpc\s*\(/.test(leer('mobile/mobile.js'))) {
    error('mobile/mobile.js: llamada .rpc( directa; usa window.rpcRaw(...)');
}

// BOM: un archivo publicado con BOM (EF BB BF) rompe parsers estrictos. Pasó con
// app/version.json: JSON.parse fallaba y el actualizador de la app no lo leía.
const EXT_TEXTO = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.webmanifest', '.svg']);
const IGNORADOS = new Set(['.git', 'node_modules', 'supabase', 'scripts', '.playwright-cli', '.playwright-mcp', '.tmp-navegador', '.opencode']);
function archivosPublicados(dir, salida = []) {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORADOS.has(entrada.name)) continue;
        const ruta = path.join(dir, entrada.name);
        if (entrada.isDirectory()) archivosPublicados(ruta, salida);
        else salida.push(path.relative(ROOT, ruta).split(path.sep).join('/'));
    }
    return salida;
}
for (const archivo of archivosPublicados(ROOT)) {
    if (!EXT_TEXTO.has(path.extname(archivo).toLowerCase())) continue;
    const bytes = fs.readFileSync(path.join(ROOT, archivo));
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        error(`${archivo}: empieza por BOM UTF-8; guárdalo sin BOM`);
    }
}

// Iconos: cada `img/icons.svg#i-*` debe existir en el sprite. Un `<use>` roto no
// da error de consola, solo un hueco invisible.
const sprite = existe('img/icons.svg') ? leer('img/icons.svg') : '';
const simbolos = new Set(Array.from(sprite.matchAll(/<symbol[^>]*\sid="([^"]+)"/g), (m) => m[1]));
for (const archivo of PAGES.concat(['404.html', 'main.js', 'mobile/mobile.js'])) {
    if (!existe(archivo)) continue;
    for (const uso of leer(archivo).matchAll(/img\/icons\.svg#([A-Za-z0-9_-]+)/g)) {
        if (!simbolos.has(uso[1])) error(`${archivo}: icono inexistente en el sprite: ${uso[1]}`);
    }
}

// Ajustes del dispositivo: toda clave que se lee o escribe debe existir en el
// estado por defecto del store `ajustes`. Una clave huérfana se guarda en
// `gochi_ajustes` y nunca se aplica: el usuario cree que cambió algo.
const inicioAjustes = mainJs.indexOf("window.Alpine.store('ajustes', {");
const finAjustes = inicioAjustes >= 0 ? mainJs.indexOf('\n    });', inicioAjustes) : -1;
const cuerpoAjustes = finAjustes > inicioAjustes ? mainJs.slice(inicioAjustes, finAjustes) : '';
const bloqueDatos = cuerpoAjustes.match(/datos:\s*\{([^}]*)\}/);
const clavesAjustes = bloqueDatos
    ? Array.from(bloqueDatos[1].matchAll(/([A-Za-z_]\w*)\s*:/g), (m) => m[1])
    : [];
if (!clavesAjustes.length) {
    error('main.js: no se pudo leer el estado por defecto del store ajustes');
} else {
    const patronesAjustes = [
        /\$store\.ajustes\.datos\.([A-Za-z_]\w*)/g,
        /store\(\s*['"]ajustes['"]\s*\)\.datos\.([A-Za-z_]\w*)/g,
        /store\(\s*['"]ajustes['"]\s*\)\.set\(\s*['"]([A-Za-z_]\w*)['"]/g,
        /guardarAjustesWeb\(\{\s*([A-Za-z_]\w*)\s*:/g
    ];
    for (const archivo of ['main.js', 'mobile/mobile.js'].concat(PAGES)) {
        if (!existe(archivo)) continue;
        const codigo = leer(archivo);
        for (const patron of patronesAjustes) {
            for (const coincidencia of codigo.matchAll(patron)) {
                const clave = coincidencia[1];
                if (clavesAjustes.includes(clave)) continue;
                error(`${archivo}: la clave de ajustes "${clave}" no existe en el store ajustes`);
            }
        }
    }
}

// CSS
const css = leer('style.css');
if (!/\.gochi-toast-item/.test(css) || !/\.gochi-toast-stack/.test(css)) {
    error('style.css: falta el respaldo visual del toast (.gochi-toast-stack/.gochi-toast-item)');
}
for (const clase of ['gochi-chip', 'gochi-campo', 'gochi-alerta', 'gochi-skeleton', 'gochi-card',
    'gochi-card--media', 'gochi-switch', 'gochi-progress', 'gochi-accordion-item', 'gochi-breadcrumb',
    'gochi-paginacion', 'gochi-tabla', 'gochi-vacio', 'gochi-menu-panel']) {
    if (!new RegExp('\\.' + clase + '\\b').test(css)) {
        error(`style.css: falta el respaldo del componente .${clase}`);
    }
}
const abre = (css.match(/\{/g) || []).length;
const cierra = (css.match(/\}/g) || []).length;
if (abre !== cierra) error(`style.css: llaves desbalanceadas (${abre} vs ${cierra})`);
if (/Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|Ãƒ|Ã‚|ðŸ|â€/.test(css)) {
    error('style.css: texto con encoding roto (mojibake)');
}

// Precarga declarativa: Speculation Rules en vez de <link rel="prefetch">.
for (const pagina of PAGES) {
    if (!existe(pagina)) continue;
    const html = leer(pagina);
    if (/rel="prefetch"/.test(html)) {
        error(`${pagina}: usa <link rel="prefetch">; la precarga va por Speculation Rules`);
    }
    const reglas = html.match(/<script type="speculationrules">([\s\S]*?)<\/script>/);
    if (!reglas) {
        error(`${pagina}: falta <script type="speculationrules">`);
        continue;
    }
    try {
        const datos = JSON.parse(reglas[1]);
        if (!Array.isArray(datos.prefetch) && !Array.isArray(datos.prerender)) {
            error(`${pagina}: speculationrules sin prefetch ni prerender`);
        }
    } catch (e) {
        error(`${pagina}: el JSON de speculationrules no es válido`);
    }
}

// Clases estáticas del HTML que no tienen regla en style.css: código muerto.
// No se revisan las dinámicas (rango-*, kick-badge-*, lg-*, hooks de JS).
const PREFIJOS_DINAMICOS = ['rango-', 'rango-texto-', 'kick-badge-', 'lg-'];
const HOOKS_JS = new Set(['comunidad-page', 'chat-msg-vacio', 'kick-perfil-overlay', 'despierto']);
const clasesCSS = new Set();
for (const m of css.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)) clasesCSS.add(m[1]);
for (const m of leer('mobile/mobile.css').matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)) clasesCSS.add(m[1]);
for (const pagina of PAGES.concat('404.html')) {
    const html = leer(pagina).replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
    const usadas = new Set();
    for (const m of html.matchAll(/(?:^|\s)class\s*=\s*"([^"]*)"/g)) {
        for (const t of m[1].split(/\s+/).filter(Boolean)) usadas.add(t);
    }
    for (const t of usadas) {
        if (clasesCSS.has(t) || HOOKS_JS.has(t)) continue;
        if (PREFIJOS_DINAMICOS.some((p) => t.startsWith(p))) continue;
        if (!/^[a-zA-Z][\w-]*$/.test(t)) continue;
        error(`${pagina}: la clase "${t}" no tiene regla en style.css (código muerto)`);
    }
}

// El markup que main.js genera en cadenas también cuenta: un componente nuevo
// con clases sin regla se colaba sin que este check lo viera.
for (const m of leer('main.js').matchAll(/(?<![-\w:])class="([^"]*)"/g)) {
    for (const t of m[1].split(/\s+/).filter(Boolean)) {
        if (/[${}'`+<>]/.test(t)) continue; // interpolaciones y restos de plantilla
        if (clasesCSS.has(t) || HOOKS_JS.has(t)) continue;
        if (PREFIJOS_DINAMICOS.some((p) => t.startsWith(p))) continue;
        if (!/^[a-zA-Z][\w-]*$/.test(t)) continue;
        error(`main.js: la clase "${t}" no tiene regla en style.css (código muerto)`);
    }
}

// Directivas Alpine (@click, :hidden, x-show…) sin un ancestro x-data:
// Alpine las ignora en silencio y el control queda muerto.
const ETIQUETAS_VACIAS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr']);
const EXENTAS = new Set(['x-data', 'x-cloak', 'x-ignore', 'x-transition']);

function directivasHuerfanas(html) {
    const limpio = html
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');
    const pila = [];
    const huerfanas = [];
    const re = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
    let m;
    while ((m = re.exec(limpio))) {
        const tag = m[2].toLowerCase();
        const attrs = m[3] || '';
        if (m[1] === '/') {
            for (let i = pila.length - 1; i >= 0; i--) {
                if (pila[i].tag === tag) { pila.length = i; break; }
            }
            continue;
        }
        const nombres = [];
        for (const a of attrs.matchAll(/([^\s=<>"'/]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g)) {
            nombres.push(a[1]);
        }
        const propias = nombres.some((n) => n.toLowerCase() === 'x-data');
        const hereda = pila.some((n) => n.data);
        const directivas = nombres.filter((n) => {
            const nombre = n.toLowerCase();
            if (!(nombre.startsWith(':') || nombre.startsWith('@') || nombre.startsWith('x-'))) return false;
            return !EXENTAS.has(nombre.split('.')[0]);
        });
        if (directivas.length && !propias && !hereda) {
            const clase = (attrs.match(/class="([^"]*)"/) || [, ''])[1].split(/\s+/)[0];
            huerfanas.push(`${tag}${clase ? '.' + clase : ''} [${directivas.join(', ')}]`);
        }
        const autocierre = /\/\s*$/.test(attrs) || ETIQUETAS_VACIAS.has(tag);
        if (!autocierre) pila.push({ tag, data: propias || hereda });
    }
    return huerfanas;
}

for (const pagina of PAGES) {
    if (!existe(pagina)) continue;
    const huerfanas = directivasHuerfanas(leer(pagina));
    if (huerfanas.length) {
        error(`${pagina}: directivas Alpine sin x-data -> ${huerfanas.slice(0, 5).join(' | ')}`);
    }
}

// _headers
const headers = leer('_headers');
if (!headers.includes('wss://*.supabase.co')) {
    error('_headers: falta wss://*.supabase.co en connect-src (Supabase Realtime)');
}
if (!headers.includes('https://www.youtube.com')) {
    error('_headers: falta https://www.youtube.com en script-src (YouTube IFrame API)');
}

for (const pagina of PAGES) {
    if (!existe(pagina)) { error(`Falta la página ${pagina}`); continue; }
    const html = leer(pagina);

    if (!/<html[^>]*\blang="es"/i.test(html)) error(`${pagina}: falta lang="es"`);
    if (!/<meta[^>]+charset="UTF-8"/i.test(html)) error(`${pagina}: falta meta charset UTF-8`);
    if (!/<meta[^>]+name="viewport"/i.test(html)) error(`${pagina}: falta meta viewport`);
    if (!/<title>[^<]+<\/title>/i.test(html)) error(`${pagina}: falta <title>`);
    if (!/<meta[^>]+name="description"/i.test(html)) error(`${pagina}: falta meta description`);
    if (!/<link[^>]+rel="canonical"/i.test(html)) error(`${pagina}: falta canonical`);

    // Detectar texto UTF-8 doblemente codificado (p. ej. "ÃƒÂ¡" en vez de "á").
    if (/Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|Ãƒ|Ã‚|ðŸ|â€/.test(html)) {
        error(`${pagina}: texto con encoding roto (mojibake)`);
    }
    if (/<\/butto\b|<\/buttn\b/.test(html)) {
        error(`${pagina}: etiqueta </button> mal escrita`);
    }
    if (/data-action="copy|Copiar enlace/i.test(html)) {
        error(`${pagina}: quedó un botón de copiar enlace eliminado`);
    }

    const h1 = (html.match(/<h1\b/gi) || []).length;
    if (h1 !== 1) aviso(`${pagina}: se esperaba 1 <h1>, hay ${h1}`);

    // IDs duplicados
    const ids = [...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map((m) => m[1]);
    const vistos = new Set();
    const duplicados = new Set();
    for (const id of ids) {
        if (vistos.has(id)) duplicados.add(id);
        vistos.add(id);
    }
    if (duplicados.size) error(`${pagina}: IDs duplicados -> ${[...duplicados].join(', ')}`);

    // Mustaches de Blade/Vue dentro de atributos (no se interpolan en Alpine).
    if (/:[a-z0-9-]+="[^"]*\{\{/i.test(html)) {
        error(`${pagina}: hay {{ }} dentro de un atributo con binding (usa una expresión JS)`);
    }

    // Copiar enlaces: todas las páginas deben usar el helper compartido.
    if (/navigator\.clipboard|document\.execCommand\(\s*['"]copy/i.test(html)) {
        error(`${pagina}: usa window.copiarEnlace en vez de acceder al portapapeles directamente`);
    }

    // Enlaces target=_blank sin rel
    for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
        if (!/\brel="/i.test(m[0])) aviso(`${pagina}: enlace target="_blank" sin rel -> ${m[0].slice(0, 80)}`);
    }

    // Recursos locales
    for (const m of html.matchAll(/(?<!:)\b(?:src|href)="([^"]+)"/gi)) {
        const original = m[1];
        if (original.startsWith('#')) continue;
        const local = normalizarRutaLocal(original);
        if (local && !existe(local)) error(`${pagina}: recurso local inexistente -> ${original}`);
    }

    // Scripts inline
    let inline = 0;
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        const attrs = m[1];
        const codigo = m[2];
        // Solo se valida como JS lo que el navegador ejecuta como JS.
        // JSON-LD, speculationrules y plantillas llevan otro type y se ignoran.
        const tipo = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
        if (tipo && !/^(module|text\/javascript|application\/javascript)$/i.test(tipo[1].trim())) continue;
        if (/\bsrc\s*=/.test(attrs)) {
            const src = attrs.match(/\bsrc\s*=\s*"([^"]+)"/i);
            if (src) {
                const local = normalizarRutaLocal(src[1]);
                if (local && !existe(local)) error(`${pagina}: script local inexistente -> ${src[1]}`);
            }
            continue;
        }
        inline++;
        if (codigo.trim()) comprobarSintaxis(`${pagina} (script inline #${inline})`, codigo);
    }
}

// Diálogos del navegador: prohibidos (bloquean la app y el APK). Los avisos
// van por mostrarToast y las confirmaciones por confirmarAccion.
for (const archivo of ['main.js', 'mobile/mobile.js'].concat(PAGES, ['404.html'])) {
    if (!existe(archivo)) continue;
    const codigo = leer(archivo);
    for (const fn of ['alert', 'confirm', 'prompt']) {
        if (new RegExp('\\b' + fn + '\\s*\\(').test(codigo)) {
            error(`${archivo}: usa ${fn}(); los avisos van por mostrarToast o confirmarAccion`);
        }
    }
}

// Manifiesto de la app: debe ser JSON válido (el BOM lo rompía) y llevar los
// campos que el actualizador verifica antes de instalar.
if (existe('app/version.json')) {
    let manifiesto = null;
    try {
        manifiesto = JSON.parse(leer('app/version.json'));
    } catch (e) {
        error('app/version.json: no es JSON válido (' + e.message + ')');
    }
    if (manifiesto) {
        for (const clave of ['versionCode', 'versionName', 'apkUrl', 'sha256', 'size']) {
            if (manifiesto[clave] === undefined) error('app/version.json: falta ' + clave);
        }
        if (manifiesto.sha256 && !/^[a-f0-9]{64}$/.test(manifiesto.sha256)) {
            error('app/version.json: sha256 debe ser 64 hex en min?sculas');
        }
        if (typeof manifiesto.size !== 'number' || manifiesto.size <= 0) {
            error('app/version.json: size debe ser un n?mero positivo');
        }
    }
}

// Sitemap: todas las páginas públicas
const sitemap = leer('sitemap.xml');
for (const pagina of PAGES) {
    const url = pagina === 'index.html' ? 'https://lagochagaming.com/' : `https://lagochagaming.com/${pagina.replace(/\.html$/, '')}`;
    if (!sitemap.includes(url)) aviso(`sitemap.xml: no incluye ${url}`);
}

if (avisos.length) {
    console.log('\nAvisos:');
    for (const a of avisos) console.log('  - ' + a);
}
if (errores.length) {
    console.error('\nErrores:');
    for (const e of errores) console.error('  - ' + e);
    console.error(`\n${errores.length} error(es).`);
    process.exit(1);
}

console.log(`OK - ${PAGES.length} páginas, main.js, CSS y _headers validados (versión ${version}).`);
