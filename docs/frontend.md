# Frontend: referencia

Extraido de AGENTS.md: mapa de archivos, convenciones JS, Alpine y paneles.

## 3. Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `main.js` | Navbar compartida (`NAVBAR_ENLACES` → `#navbar-root`), utilidades globales, tema, toasts, sesión comunidad, admin Supabase, confeti, fachada del chat de Kick; stores Alpine `perfil`, `ui`, `toast`, `adminPanel`, `ajustes`, `sugerencias` y `misiones` (botón del navbar con panel) |
| `style.css` | Estilos compartidos, variables, componentes, responsive, modo claro |
| `index.html` | Home, player Kick, últimos clips de Kick (Edge Function `kick-clips`), feed social, YouTube, muro de saludos (store `muro`) y modal de feeds (store `media`) |
| `comunidad.html` | Presencia, chat, reacciones, ranking (Total/Mes), rangos, login/registro comunidad, sorteo semanal, código de invitación (stores `chat`, `ranking`, `rangosChat`, `reacciones`, `tienda`, `pregunta`, `sorteoSemanal`, `invitar`) |
| `galeria.html` | Subida (store `subida`), galería pública y lightbox (store `galeria`), moderación de fotos pendientes, reto semanal (store `reto`) |
| `sorteo.html` | Modo manual, modo streamer, tómbola online, ganadores (store `sorteo` con `participantes`, `manual` y `ganadores`) |
| `cine.html` | Sincronización de películas/videos para espectadores y streamer (store `cine`) |
| `game.html` | GochitaRunner: canvas 2D, HUD, menús, tienda y controles táctiles |
| `game.js` | Motor y estado de GochitaRunner (sin HTML dinámico; usa `rpcRaw` para progreso y partidas) |
| `_headers` | Referencia de cabeceras para un host que las soporte. **No se aplican en GitHub Pages** |
| `ads.txt` | Verificación de propiedad de Google AdSense. Se sirve tal cual y no se borra. No implica anuncios integrados (0 scripts de AdSense) |
| `VERSION` | Versión SemVer de la release |
| `404.html` | Página no encontrada (`noindex`) |
| `llms.txt` | Resumen del sitio y URLs para motores de IA |
| `img/icons.svg` | Sprite de iconos (Font Awesome Free 6.6.0, CC BY 4.0) |
| `img/mcchary/` | Ilustraciones del creador: footer, 404 y estados vacíos |
| `fonts/` | woff2 autoalojados: Inter y Space Grotesk variable (subconjunto latin) |
| `scripts/check.js` | Validaciones estáticas del repo (no se carga en Pages) |
| `scripts/smoke.js` | Smoke test con navegador real: 7 páginas (6 públicas + 404) × 2 tamaños, consola, desborde, busters e interacciones (Ctrl+K, APIs de ajustes) |
| `app/LaGochaGaming.apk` | APK firmado que descarga la web (se reemplaza en cada release de la app) |
| `app/update.json` | Manifiesto del actualizador de la app (`versionCode`, `versionName`, `sha256`, `size`, `notes`) |
| `mobile/mobile.css`, `mobile/mobile.js` | Interfaz móvil que la app descarga encima del APK; única carpeta que la app consume en remoto |

La base de datos vive **solo en Supabase**. No se mantiene carpeta `supabase/` con contenido: ni migraciones, ni copias de Edge Functions. El CLI puede recrear `supabase/.temp/` como caché (ignorada por git); eso no es fuente de verdad ni respaldo. El esquema, las RPC, las políticas y las funciones se leen y se cambian contra el proyecto `cydiyaacnyydprgffmkq`.

La navbar vive en `main.js` (`window.NAVBAR_ENLACES`): cada página solo tiene un `<nav id="navbar-root">` vacío y `insertarNavbar()` pinta enlaces, orden y estado activo. Para cambiar el menú, editar solo `main.js`. El estado EN VIVO (`#nav-live-tag` + `.navbar.live-glow`) lo alterna `verificarEstadoStream()`. El desplegable `#nav-app` también se genera ahí: su versión y tamaño del APK están escritos a mano y deben coincidir con `app/update.json` en cada release.

El `nav.footer-nav` del footer es la excepción: va en HTML estático dentro de las cinco páginas para que los rastreadores encuentren las subpáginas sin ejecutar JavaScript. No moverlo a `main.js`.

## 4. Convenciones de JavaScript

- Scripts clásicos, sin módulos ES. Para helpers usados desde HTML/Alpine, exponer en `window` (`window.escapeHtml`, `window.abrirLightboxDesdeTarjeta`, etc.).
- Escapar SIEMPRE datos no confiables antes de `innerHTML`: usar `escapeHtml`/`escapeAttr` o `textContent`. Nunca interpolar apodos, mensajes, títulos, URLs ni emojis sin escapar. `escapeHtml` es la única implementación: `mobile.js` la reutiliza.
- Llamar a las Edge Functions SIEMPRE por `window.llamarEdge(nombre, cuerpo, { token })`: devuelve `{ ok, status, datos }` y evita repetir el `fetch` con su `json().catch()`. No añadir `fetch` sueltos a `/functions/v1/`.
- Fechas SIEMPRE por `window.formatearFecha(valor, estilo)` con los estilos `completo`, `dia-mes`, `hora`, `mes-anio`, `fecha-corta` y `dia-mes-hora`. No volver a escribir `toLocaleDateString` sueltos.
- **Nada de diálogos del navegador:** prohibido `alert()`, `confirm()` y `prompt()`. Los avisos van con `mostrarToast()` o el store `toast`. Las confirmaciones van con `await window.confirmarAccion({ titulo, mensaje, textoConfirmar, tono, icono })` (tonos `peligro`, `aviso`, `info` y `exito`) o con `window.mostrarConfirmacionModal(...)`. No crear otro modal de confirmación por página.
- Preferir `textContent` y creación de nodos a `innerHTML` cuando sea posible.
- No usar `eval`, `new Function` ni `document.write`.
- En Alpine, no usar mustaches `{{ }}` dentro de atributos. Usar bindings (`:aria-label="'...' + variable"`).
- Stores globales en `main.js` (`perfil`, `ui`, `toast`, `adminPanel`, `sugerencias`); por página en su HTML (`media`/`muro` en index, `galeria`/`subida` en galería, `cine`, `chat`/`ranking`/`rangosChat`/`reacciones`/`tienda` en comunidad, `sorteo`).
- Alpine va con `defer` y los stores se registran en `alpine:init`. Usar `x-cloak` en lo que deba ocultarse antes de inicializar.
- Para visibilidad usar `:hidden="!abierto"` con la regla global `[hidden]`; no `x-show` (en este build no vuelve a ocultar elementos con `display: flex`).
- Cuidado con la propagación de clics: las tarjetas de galería abren el lightbox, pero los botones de acción deben llegar al listener delegado del documento. Usar `window.abrirLightboxDesdeTarjeta($event, foto, $el)` y no `@click.stop` en la zona de acciones.
- No anidar nuevas acciones interactivas dentro de `role="button"` sin revisar propagación de click/teclado y accesibilidad.
- Respetar `prefers-reduced-motion` en animaciones nuevas (el confeti ya lo hace).
- Chat de Kick: los iframes llevan `data-chat-kick` + `data-src` (nunca `src`). `prepararFachadaChat()` en `main.js` crea la fachada y carga el iframe al hacer scroll, clic o al terminar la carga; no añadir listeners por elemento.
- Emotes de 7TV: el canal no tiene set propio. `main.js` carga el set global (`https://7tv.io/v3/emote-sets/global`), lo cachea 12 h en `gocha_7tv_global_v1` y sustituye palabras exactas con `window.renderizarEmotes7TV(texto)`. Los selectores de Comunidad y del chat de Kick insertan con `window.insertarEmote7tv(nombre, campo)`. No pedir emotes a Kick ni crear un set por canal.
- Mantener los textos de UI en español y el tono actual.
- Insignias de Kick: usar siempre `window.insigniasKickDe(fila)` (máximo 6, caducan a los 30 días). Devuelve `{tipo, etiqueta, nombre, detalle, icono, texto}` y pinta la píldora `.chat-kick-badge` con `kick-badge-<tipo>`. `nombre` es la etiqueta legible (Moderador, Suscriptor…) y `detalle` solo trae texto si aporta algo distinto. No duplicar el filtrado.
- Puntos diarios: la píldora `#nav-puntos-dia` del navbar es la única vista de "hoy". Se actualiza con `window.pintarPuntosDia(datos)` y `window.refrescarPuntosDia()` (RPC `obtener_puntos_hoy`). No añadir otra línea de puntos en las páginas.
- No usar `Get-Content`/`Set-Content` de PowerShell 5.1 para reemplazos masivos en archivos UTF-8: leen ANSI y rompen acentos/emojis. Usar el editor o Node/Python con UTF-8 explícito.

### 4.1 Alpine: reglas obligatorias

- Stores globales en `main.js`: `perfil` (panel de perfil, ver §4.2), `ui` (menú móvil), `toast`, `adminPanel` (panel de administración global) y `sugerencias` (buzón del owner).
- Stores por página: `media`/`muro` (index), `galeria`/`subida` (galería), `chat`/`ranking`/`rangosChat`/`reacciones`/`tienda` (comunidad), `sorteo` y `cine`.
- Listas y tarjetas con `x-for` y `:key`. Formularios con `x-model` (o `:value` + `@input` en objetos anidados). Textos y feedback con `x-text` + `:hidden`.
- Visibilidad con `:hidden="!abierto"` y la regla global `[hidden]`; `x-cloak` para lo que deba ocultarse antes de inicializar. Evitar `x-show` en elementos con `display: flex` (en este build puede no volver a ocultarlos).
- Modales con `x-trap.noscroll` y cierre por Escape, fondo o botón; el foco vuelve solo.
- Al migrar una zona, borrar el render manual anterior, sus listeners y las funciones sin uso. No dejar dos mecanismos para lo mismo.
- El reset global usa `box-sizing: border-box`; cualquier `width: 100%` con padding ya no desborda. Revisar overflow horizontal a 1400 px y 390 px al tocar layouts.
- `innerHTML` solo para markup estático propio; nunca con datos de usuario.
- Realtime y RPC actualizan el store; la vista reacciona sola.

### 4.2 Panel de perfil (`perfil`)

- Escritorio (≥900 px): `abrir()` pone `anclado=true` y `colocarPopover()` calcula `--perfil-top`, `--perfil-right`, `--perfil-flecha` y `--perfil-max-alto` desde `#nav-user-info .nav-user-btn`. Se comporta como el desplegable `#nav-app`.
- El contenedor `.modal-perfil--popover` lleva `pointer-events: none` y la tarjeta `pointer-events: auto`: sin backdrop, sin ✕, sin `x-trap.noscroll`. **Nunca** dejar que la capa cubra la página: se tragaba los clics y bloqueaba el sitio.
- Cierre: clic fuera (listener `pointerdown` en `crearModal()`), Escape o el mismo botón del navbar. `abrir()` hace toggle con `if (this.abierto && !this.publico) { this.cerrar(); return; }`.
- Móvil (<900 px): hoja inferior con backdrop y botón de cierre.
- Desde el panel admin: `window.abrirPerfilUsuario(apodo, { sobreAdmin: true })` añade `modal-perfil--stack` (z-index 10060) y el panel sigue montado debajo; al cerrar el perfil se vuelve al panel sin clics extra.
- El perfil público se ordena por secciones (`.mp-seccion`): cabecera, insignias, bio, redes y actividad. No volver a amontonar todo en la cabecera.
- El perfil propio muestra el **Historial de puntos de los últimos 3 días** (Hoy, Ayer y Antes de ayer): dentro de cada día, una fila por forma de ganar con total y `× N`, más el total del día y un pie con **Ganado en 3 días / Saldo actual**. `cargarHistorial()` pide páginas de 50 (máx. 4) y corta al pasar anteayer; no hay botón «Ver más». El perfil público **no** lo muestra: la RPC va por token, así que sin el guard `$store.perfil.publico` se pintaba el historial del visitante bajo el perfil ajeno. `abrirUsuario()` limpia `historial`/`historialEstado`. Ojo: `historial` son solo ganancias (`puntos_eventos`); `tienda_canjear_premio` descuenta de `usuarios_comunidad.puntos` sin escribir evento, por eso la suma no coincide con el saldo cuando se ha canjeado algo.
- **Mis canjes** vive en la pestaña *Mi cuenta*: lista `tienda_mis_canjes` (nombre, estado, fecha y `−puntos`) y suma lo gastado excluyendo `rechazado`/`cancelado`. Sirve para cuadrar `Ganado − Gastado = Saldo`, porque los canjes no escriben en `puntos_eventos`.
- El panel propio tiene tres pestañas con dueños distintos: **Perfil** (solo lectura, lo que ven los demás), **Mi cuenta** (`vista === 'cuenta'`, datos que viven en la base: avatar, género, bio, redes, Kick, guardar) y **Ajustes** (`vista === 'ajustes'`, preferencias del dispositivo). `abrir(vista)` acepta las tres; el flujo de Kick tras registrarse abre `cuenta`. No mezclar datos de cuenta con preferencias del navegador.

### 4.3 Componentes Gochi (Alpine + Pines)

- La capa de componentes vive al final de `style.css` (`.gochi-*`) y usa solo las variables del tema. Es la única fuente de estilo: no hay CDN de Tailwind desde 1.61.15.
- Catálogo: `gochi-chip` (`data-tono` acento/éxito/aviso/peligro/info, `--sm`), `gochi-campo` (label, ayuda, error, contador, `data-estado="error"`), `gochi-alerta` (`data-tono` éxito/error/aviso/info), `gochi-skeleton` (`--texto`, `--titulo`, `--avatar`, `--media`, `--chip`), `gochi-card` (`data-estado` cargando/error/vacío, `--media` para imagen a sangre), `gochi-switch`, `gochi-progress`, `gochi-accordion` (item, trigger, panel, icono), `gochi-breadcrumb`, `gochi-paginacion`, `gochi-tabla-wrap` + `gochi-tabla` (responsive ≤760 px), `gochi-vacio`, `gochi-menu` + `gochi-menu-panel` y los ya existentes `gochi-toast-*`, `gochi-modal-*`, `gochi-confirm-*` y `gochi-tooltip`.
- API en `main.js`: los ayudantes sueltos `gochiChip(texto, tono)`, `gochiSkeleton(tipo, cantidad)`, `gochiDropdown(id, abrir)` y `cerrarGochiMenus(devolverFoco)`; los avisos van por `mostrarToast()` y las confirmaciones por `confirmarAccion()`. Escapan el texto antes de pintar. El antiguo agregador `window.gochiUI` se retiró en la 1.82.2: no tenía ningún consumidor.
- Los desplegables de página usan `gochiDropdown` y el store `ui.menus`; un único listener de `pointerdown` y Escape cierra el menú abierto y devuelve el foco. No añadir listeners por elemento.
- Tooltip (`data-tooltip`): un solo nodo global que solo aparece con hover (220 ms), se recoloca con `ResizeObserver` si el botón o su tarjeta cambian de tamaño y se limita al recuadro del modal; no se dispara con el foco, así que no aparece al abrir un perfil. Los botones mantienen su `aria-label`.
- Patrón de carga: un flag `cargando` en el store de la página pinta `gochi-skeleton` con `x-for`; al terminar se limpia y entra la lista real o `gochi-vacio`.
- Paleta de comandos (`window` + `Ctrl`/`Cmd`+`K`): con sesión de admin añade los atajos de cada pestaña del panel y, al escribir `@apodo`, “Ver perfil” y “Buscar en el panel”. No ejecuta acciones destructivas: abre el panel filtrado y la confirmación sigue en la fila.
- Accesibilidad: `aria-expanded` en triggers de acordeón y menús, `aria-busy` mientras carga, y `prefers-reduced-motion` desactiva las animaciones.
- Migas de pan con `gochi-breadcrumb` en Comunidad, Galería, Sorteo y Cine; la home no las lleva por ser la raíz. El contenido de acordeones y migas queda en HTML estático para los buscadores.

### 4.4 Ajustes del dispositivo (`ajustes`)

- El store `ajustes` de `main.js` guarda un único JSON en `gochi_ajustes` con `window.almacen` y aplica clases en `<html>`: `sin-animaciones`, `texto-90/110/125`, `densidad-compacta`, `sin-transparencias`, `alto-contraste`, `ahorro-datos`. Métodos: `cargar()`, `aplicar()`, `guardar()`, `set(clave, valor)`.
- Son preferencias **del navegador**, no de la cuenta: no se sincronizan y deben funcionar sin sesión. Los datos del usuario viven en la base y se editan en **Mi cuenta**.
- Las clases se aplican **antes del primer pintado** desde el script inline del `<head>` de las 6 páginas, igual que el tema. Si se aplican desde `main.js` (defer) hay destello.
- `ahorro-datos` retrasa los feeds de Instagram, TikTok y clips hasta que el visitante pulsa “Cargar contenido”.
- `window.sonidoChat()` genera el aviso del chat con Web Audio (sin archivos): solo si el mensaje no es tuyo, si la pestaña está oculta o no estás al final, y como máximo una vez cada 2 s. El `AudioContext` se arma con la primera interacción.
- `window.exportarMisDatos()` descarga perfil y preferencias en JSON, todo en cliente.
- `kickRecordar` (por defecto `true`) decide si cerrar sesión conserva el acceso de Kick del navegador. Es la única clave de `gochi_ajustes` con efecto fuera de la interfaz: apagarla revoca el token.
- En la app (`html.lg-app`, detectado con `window.enModoApp()`) la pestaña **Ajustes** del perfil oculta **Tamaño del texto**, **Animaciones** y **Ahorro de datos**: la hoja móvil es la única que los edita y escribe en `gochi_ajustes` (`texto` 100/110/125, `animaciones`, `ahorro`). Tema, vibración y pantalla encendida siguen en `lg_mobile_settings`. No volver a duplicar esos tres controles.

### 4.5 RPC: una sola puerta

- Toda llamada a Supabase pasa por `window.rpcRaw(nombre, params)` (misma forma que `supabase.rpc`: `{ data, error }`, con `try/catch` y error normalizado) o por `window.rpc(nombre, params, opciones)` (`{ ok, data, error }`, con aviso de error silenciable). **`scripts/check.js` lo hace cumplir**: falla si una página llama a `supabase.rpc` y permite una sola llamada directa en `main.js` (la implementación de `rpcRaw`).

### 4.6 Avisos del directo (Web Push)

- `window.avisos` es la única puerta: `activar()`, `desactivar()`, `sincronizar()`, `notificar(titulo, cuerpo, url)` y `registroListo()` (con carrera de 4 s, porque `serviceWorker.ready` no rechaza nunca). `initAvisos()` registra `sw.js`, pinta la campana de la navbar y refresca la suscripción a los 3 s sin pedir permiso.
- `activar()` pide permiso, suscribe con `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` y guarda `{ endpoint, p256dh, auth }` por `window.rpc('push_guardar_suscripcion', …)`. `desactivar()` borra la fila y hace `unsubscribe()`. Sin soporte de push, el botón se queda en avisos locales como antes.
- `CLAVE_PUSH` (repetida en `main.js` y `sw.js`) es la clave pública VAPID: pública por diseño, igual que la anon key. La privada vive en los secretos de Supabase y no entra al repo.
- `sw.js` no cachea nada y solo muestra notificaciones: `push`, `notificationclick` y `pushsubscriptionchange` (renueva el endpoint; la fila del servidor se refresca en la siguiente visita).
- No añadir otra campana ni otro interruptor: el estado vive en `gochi_avisos` y en `push_suscripciones`.

### 4.7 Adornos del apodo (color, título y marco)

- El mapa vive en `main.js`: `cargarColoresApodo()` pide una vez `apodo, color_apodo, titulo_equipado, marco_equipado` de los perfiles con adorno y lo guarda en `_perfilesApodo` (clave: apodo en minúsculas). Al terminar dispara `gocha:colores`; las vistas lo escuchan y repintan.
- Lectores: `colorApodoDe(apodo)`, `tituloApodoDe(apodo)` y `marcoApodoDe(apodo)`. `aplicarColoresApodo()` fuerza una recarga (se llama al equipar o comprar en la tienda).
- Se carga en `DOMContentLoaded`, **no** al ejecutar el archivo: si se llama antes de definir la función no ocurre nada y los colores quedan invisibles en toda la sesión (fue el bug de la 2.9.1). El `?v=` no salva de esto.
- Dónde se aplica: navbar (color propio desde la sesión), chat, muro de saludos, ranking, tarjetas de Galería y ficha de perfil. Al añadir un sitio nuevo con apodos hay que pasar por `colorApodoDe` y escuchar `gocha:colores`, o el adorno no aparecerá.
- El historial del chat y las cachés de sesión deben pasar por `mapearMensajeChat`: traen solo `id`, `autor`, `mensaje` y `created_at`, así que sin normalizar se pierden color, título y hora.

### 4.8 Encuesta rápida y pregunta del día

- Viven en el store `pregunta` de `comunidad.html` y son dos cosas distintas: la encuesta (votación con puntos) y la pregunta abierta que se responde en el chat (5 pts).
- La pregunta del día ya no ocupa sitio en el chat: es el aviso flotante `.aviso-pregunta`, abajo a la izquierda (en móvil, encima del campo de texto). Solo se muestra con sesión de comunidad, una vez al día (`gochi_pregunta_vista`) y nunca si ya respondió (`gochi_pregunta_respondida`, que se marca cuando `reclamar_pregunta_dia` paga). Se cierra con la X o solo a los 30 s.
- La encuesta se queda sola en el chat: opciones mientras no votas y, al votar, una línea de resumen (`resumen`) con los tres primeros porcentajes; el botón "Ver" despliega las barras y marca "tu voto". Sin la tarjeta vieja no hay bloque fijo encima de la conversación.
- No volver a fusionar los dos bloques ni a mostrar la pregunta como tarjeta permanente: era justo lo que saturaba el chat.
