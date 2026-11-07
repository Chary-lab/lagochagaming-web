# AGENTS.md - LaGochaGaming

Guía operativa para agentes que trabajen en este repositorio. Leerla completa antes de tocar código, base de datos o despliegue.

## 1. Resumen del proyecto

- Sitio estático de La Gocha Gaming: HTML + CSS + JavaScript clásico, sin build, sin bundler y sin dependencias instaladas localmente.
- Páginas: `index.html` (inicio), `comunidad.html` (chat/puntos), `galeria.html` (fotos/likes), `sorteo.html` (sorteo), `cine.html` (GochiWatch) y `404.html` (página no encontrada).
- Código compartido: `main.js` (navbar inyectada, tema, toasts, sesión de comunidad, admin, confeti, fachada del chat de Kick) y `style.css`.
- Backend: Supabase (Postgres + RLS + RPC + Realtime + Storage). Proyecto `cydiyaacnyydprgffmkq`.
- Hosting actual: GitHub Pages del repo `Chary-lab/lagochagaming-web` (rama `main`, build legacy), dominio `lagochagaming.com` (archivo `CNAME`). El repo anterior `Chary-lab/LaGochaGaming` se borró por un deployment atascado en Pages; no volver a usarlo.
- Versión actual: ver `VERSION` (SemVer). Changelog: `CHANGELOG.md`.
- App Android: proyecto aparte en `D:\Apk Gocha` (Capacitor + WebView). Su guía vive en `D:\Apk Gocha\AGENTS.md`; este repo solo publica el APK en `app/` y su `version.json`. Estado actual (2026-11-07): app v1.14, `versionCode` 17, APK de 4.047.286 B con sha256 `82b77d834fbb7d4cec6350a38825493f53ee35c8d6a7c941df72634c745f7a0f`. Los assets empaquetados coinciden byte a byte con `mobile/`, y `build-apk.ps1` lo copia y lo verifica en cada build.

## 2. Reglas de stack

- No introducir frameworks, bundlers ni dependencias npm de runtime sin autorización explícita.
- No añadir jQuery ni Bootstrap. El sitio usa CSS propio (`.visually-hidden`, `.nav-right`) y Alpine para la UI.
- **Alpine primero:** toda UI interactiva (listas, tarjetas, modales, formularios, menús, toasts y estados) se implementa con Alpine (`x-data`/stores, `x-for`, `x-model`, `:hidden`, `x-trap`). El JS clásico queda para Supabase, RPC, Realtime, cálculo y APIs `window.*`; no se añaden renders con `innerHTML` ni listeners por elemento.
- Las librerías externas se cargan por CDN con versión fijada (Supabase JS 2.118.0, Alpine 3.17.5, `@alpinejs/focus` 3.17.5 y hls.js 1.5.20 solo en `index.html`). No cambiar versiones a `latest`.
- **Sin Tailwind.** El CDN de Tailwind se retiró en 1.61.15: inyectaba su CSS después de la primera pintura y pintaba un borde gris claro en cada caja durante un instante en cada carga y navegación. Todo el estilo vive en `style.css`; no añadir el CDN ni utilidades de Tailwind sin autorización explícita. `scripts/check.js` falla si `main.js` vuelve a cargarlo o si una clase estática del HTML no tiene regla en `style.css` (lista blanca: hooks `comunidad-page`, `chat-msg-vacio`, `kick-perfil-overlay`, `despierto` y prefijos dinámicos `rango-`, `rango-texto-`, `kick-badge-`, `lg-`).
- Iconos: sprite local `img/icons.svg` (Font Awesome Free 6.6.0, CC BY 4.0). En el markup se usa `<svg class="icon"><use href="img/icons.svg#i-solid-x">`; no se carga Font Awesome por CDN.
- Mantener el estilo actual: variables CSS, clases semánticas, modo claro/oscuro y diseño responsive.
- El sitio debe funcionar sin build. No crear pasos de compilación obligatorios.
- **Estructura fija del proyecto:** no dividir archivos ni crear otros nuevos. `style.css` es un solo archivo, `main.js` otro y cada página un HTML. Prohibido partir el CSS por página o sección, trocear el HTML en parciales o crear archivos de módulos: si algo crece, se ordena y se limpia dentro del archivo que ya existe.
- Un archivo nuevo solo con autorización explícita del usuario. Antes de crearlo, resolver el problema dentro de los archivos actuales.

## 3. Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `main.js` | Navbar compartida (`NAVBAR_ENLACES` → `#navbar-root`), utilidades globales, tema, toasts, sesión comunidad, admin Supabase, confeti, fachada del chat de Kick; stores Alpine `perfil`, `ui`, `toast` y `adminPanel` (panel global) |
| `style.css` | Estilos compartidos, variables, componentes, responsive, modo claro |
| `index.html` | Home, player Kick, últimos clips de Kick (Edge Function `kick-clips`), feed social, YouTube, muro de saludos (store `muro`) y modal de feeds (store `media`) |
| `comunidad.html` | Presencia, chat, reacciones, ranking, rangos, login/registro comunidad (stores `chat`, `ranking`, `rangosChat`, `reacciones`, `tienda`) |
| `galeria.html` | Subida (store `subida`), galería pública y lightbox (store `galeria`), moderación de fotos pendientes |
| `sorteo.html` | Modo manual, modo streamer, tómbola online, ganadores (store `sorteo` con `participantes`, `manual` y `ganadores`) |
| `cine.html` | Sincronización de películas/videos para espectadores y streamer (store `cine`) |
| `_headers` | Referencia de cabeceras para un host que las soporte. **No se aplican en GitHub Pages** |
| `ads.txt` | Verificación de propiedad de Google AdSense. Se sirve tal cual y no se borra. No implica anuncios integrados (0 scripts de AdSense) |
| `VERSION` | Versión SemVer de la release |
| `404.html` | Página no encontrada (`noindex`) |
| `llms.txt` | Resumen del sitio y URLs para motores de IA |
| `img/icons.svg` | Sprite de iconos (Font Awesome Free 6.6.0, CC BY 4.0) |
| `img/mcchary/` | Ilustraciones del creador: footer, 404 y estados vacíos |
| `fonts/` | woff2 autoalojados: Inter y Space Grotesk variable (subconjunto latin) |
| `scripts/check.js` | Validaciones estáticas del repo (no se carga en Pages) |
| `scripts/smoke.js` | Smoke test con navegador real: 6 páginas × 2 tamaños (404 incluida), consola, desborde, busters e interacciones (Ctrl+K, APIs de ajustes) |
| `app/LaGochaGaming.apk` | APK firmado que descarga la web (se reemplaza en cada release de la app) |
| `app/version.json` | Manifiesto del actualizador de la app (`versionCode`, `versionName`, `sha256`, `size`, `notes`) |
| `mobile/mobile.css`, `mobile/mobile.js` | Interfaz móvil que la app descarga encima del APK; única carpeta que la app consume en remoto |

La base de datos vive **solo en Supabase**. No se mantiene carpeta `supabase/` con contenido: ni migraciones, ni copias de Edge Functions. El CLI puede recrear `supabase/.temp/` como caché (ignorada por git); eso no es fuente de verdad ni respaldo. El esquema, las RPC, las políticas y las funciones se leen y se cambian contra el proyecto `cydiyaacnyydprgffmkq`.

La navbar vive en `main.js` (`window.NAVBAR_ENLACES`): cada página solo tiene un `<nav id="navbar-root">` vacío y `insertarNavbar()` pinta enlaces, orden y estado activo. Para cambiar el menú, editar solo `main.js`. El estado EN VIVO (`#nav-live-tag` + `.navbar.live-glow`) lo alterna `verificarEstadoStream()`. El desplegable `#nav-app` también se genera ahí: su versión y tamaño del APK están escritos a mano y deben coincidir con `app/version.json` en cada release.

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

## 5. Supabase: reglas no negociables

### 5.1 Credenciales

- La `anon key` es pública y vive en `main.js`; es lo esperado.
- NUNCA agregar `service_role`, contraseñas, tokens de administrador ni secretos al repositorio ni al cliente.
- La autenticación de administrador es Supabase Auth + `app_metadata.role = "admin"` o `"owner"`, o una sesión de comunidad con `usuarios_comunidad.rol` en `admin`/`owner` enviada en la cabecera `x-comunidad-token`. `es_admin()` acepta las dos vías. No usar email hardcodeado ni listas en cliente.
- `owner` es el rol superior (McChary); `es_owner()` lo valida y `es_admin()` acepta `admin` y `owner`. El buzón de sugerencias es solo para `owner`.
- Un perfil de comunidad puede vincularse a un usuario Auth con `usuarios_comunidad.auth_user_id`. La función `sesion_comunidad_vinculada()` abre/reutiliza una sesión de comunidad para ese vínculo; el cliente la sincroniza al cargar y al iniciar sesión. El vínculo no se basa en el apodo.
- Cerrar sesión desde ajustes con una cuenta Auth vinculada cierra también Auth y deja `comunidad_logout_explicito=1` para que la sincronización no reabra la comunidad al recargar. La marca se borra al iniciar sesión Auth o con PIN.
- Comunidad: tabla `usuarios_comunidad` con PIN de 4 dígitos (bcrypt) y tokens de sesión de 30 días en `comunidad_sesiones`. `LaGochaGaming` tiene perfil reservado y PIN aleatorio; su acceso es por Auth.

### 5.2 Modelo de identidad

- Admin/streamer: sesión de Supabase Auth verificada con `es_admin()` (servidor) y `window.esAdminActual()` (cliente). Un usuario autenticado que no sea admin NO debe activar paneles de moderación.
- Comunidad: tabla `usuarios_comunidad` con PIN de 4 dígitos (bcrypt) y tokens de sesión de 30 días en `comunidad_sesiones`.
- El token de comunidad va en `localStorage` (`comunidad_session_token`). El servidor siempre valida el token; nunca confiar en el apodo, puntos, rango, likes ni ganador enviados por el cliente.

### 5.3 Escrituras privilegiadas

- Chat, reacciones, muro, likes, puntos, registro de sorteo y publicación en galería se hacen por RPC `SECURITY DEFINER` con `set search_path`, no por escrituras directas desde el cliente.
- No agregar políticas RLS que permitan INSERT/UPDATE/DELETE directo a `anon` o `authenticated` en tablas de contenido.
- Toda función `SECURITY DEFINER` nueva debe: validar sesión/rol, validar entradas, fijar `search_path`, devolver errores controlados y tener grants explícitos.
- Revocar `EXECUTE` de `PUBLIC` y conceder solo a los roles necesarios (`anon`/`authenticated`/`service_role`).

### 5.4 Tablas y RPC principales

- `usuarios_comunidad` (nunca exponer `pin_hash` ni `auth_user_id`; los grants de columna ya lo limitan).
- `comunidad_sesiones` (token, expiración, cooldowns).
- `comunidad_chat`, `message_reactions` (chat y reacciones).
- `muro_saludos` + `muro_reactions` (muro del home y sus reacciones).
- `galeria` + `galeria_likes` (likes únicos por usuario).
- `config_sorteo`, `participantes_en_vivo` (con `usuario_id` desde la 1.81.0 para una participación por cuenta), `ganadores_sorteo`.
- `sync_cine` (estado de reproducción).
- `cine_cola` (cola de la sala para el streamer: `video_url`, `titulo`, `creado_en`; SELECT público, escritura solo por RPC `cine_cola_agregar`/`cine_cola_quitar`, máximo 50).
- `galeria_reportes` (reportes de fotos: `image_id`, `motivo`, `detalle`, `ip_hash`, `revisado`; sin acceso `anon`, solo admin lee y los RPC `admin_marcar_reporte`/`admin_eliminar_reporte` los cierran).
- `tienda_premios`, `tienda_canjes` (tienda de puntos).
- `admin_audit_log` (auditoría de moderación, solo admin).
- `instagram_feed` (caché de la Edge Function `instagram-feed`; solo `service_role`, TTL 40 min y refresco con `pg_cron` cada 20 min).
- `tiktok_feed` (caché de la Edge Function `tiktok-feed`; solo `service_role`, TTL 40 min y refresco con `pg_cron` cada 20 min).
- `kick_clips` (caché de la Edge Function `kick-clips`, una fila JSON con los últimos clips de Kick; solo `service_role`, TTL 40 min y refresco con `pg_cron` cada 20 min).
- `puntos_acciones`, `puntos_eventos`, `puntos_topas_rango` (puntos por acción, historial con idempotencia y topes diarios por rango; solo `service_role`, se escriben desde RPC `SECURITY DEFINER`).
- `sugerencias` (texto 5–500, `ip_hash`, `leida`, `creada_en`; sin acceso `anon`; solo `owner` lee, marca y borra con `es_owner()` y las RPC `owner_marcar_sugerencia` / `owner_eliminar_sugerencia`).
- `app_descargas` (contador real de descargas del APK: `version`, `origen` web/apk/directo, `ip_hash`, `user_agent`, `creado_en`; RLS activo sin políticas, solo entra la Edge Function con `service_role`).
- `app_instalaciones` (instalaciones anónimas de la app: hash del ID local, versión actual, primera/última vez, `ip_hash`, `user_agent`; RLS activo sin políticas, solo `service_role`).
- `app_actualizaciones` (cambios de versión detectados al abrir la app: `desde_version`, `hasta_version`, `creado_en`; RLS activo sin políticas, solo `service_role`).
- RPCs importantes: `login_comunidad`, `registrar_comunidad`, `validar_sesion_comunidad`, `cerrar_sesion_comunidad`, `sesion_comunidad_vinculada`, `latido_comunidad`, `incrementar_puntos_comunidad`, `enviar_mensaje_chat`, `obtener_chat_historial`, `establecer_reaccion`, `establecer_reaccion_muro`, `obtener_reacciones_muro`, `publicar_saludo_muro`, `publicar_foto_galeria`, `actualizar_perfil_comunidad`, `incrementar_likes`, `obtener_likes_galeria`, `galeria_publica`, `tienda_obtener_catalogo`, `tienda_canjear_premio`, `tienda_mis_canjes`, `registrar_participante_sorteo`, `sortear_ganador_sorteo`, `sortear_siguiente`, `sortear_entrar`, `enviar_sugerencia`, `owner_marcar_sugerencia`, `owner_eliminar_sugerencia`, `admin_listar_usuarios`, `admin_ban_usuario`, `admin_shadowban_usuario`, `admin_eliminar_usuario`, `admin_obtener_audit_log`, `admin_eliminar_mensaje_chat`, `admin_auditar`, `obtener_puntos_hoy`, `mis_puntos_historial`, `estadisticas_perfil_comunidad`, `obtener_avatares_disponibles`, `otorgar_puntos_accion`, `registrar_puntos`, `admin_galeria_aprobar`, `admin_galeria_eliminar`, `streamer_config_sorteo`, `streamer_vaciar_tombola`, `cine_actualizar_estado`, `cine_cola_agregar`, `cine_cola_quitar`, `reportar_foto_galeria`, `admin_marcar_reporte`, `admin_eliminar_reporte` y `actualizar_autor_galeria`.

### 5.5 Invariantes de integridad

- Likes: una fila por `(image_id, usuario_id)` en `galeria_likes`; el contador `galeria.likes` se actualiza solo dentro de `incrementar_likes`. No volver a usar contadores basados en `localStorage` ni aceptar incrementos arbitrarios.
- Puntos: cooldown de 5 minutos por CUENTA en `usuarios_comunidad.ultimo_punto`, con `FOR UPDATE` para evitar carreras entre sesiones. El multiplicador sale del rango actual.
- Puntos por acciones: `puntos_eventos` es el historial; `registrar_puntos` valida acción, baneo, cooldown, tope por acción (`max_dia`) y tope diario del rango (`puntos_topas_rango`). Idempotencia por `(usuario_id, accion, ref)`. `registrar_puntos` y `otorgar_puntos_accion` no se conceden a `anon`: los puntos se otorgan dentro de las RPC de cada acción. El `EXECUTE` de `registrar_puntos` se revocó también a `authenticated` (2026-11-01): solo `service_role` y las funciones `SECURITY DEFINER` pueden llamarla.
- Rangos: umbrales 0 / 100 / 400 / 1000 / 2000 / 3500 y topes diarios 60 / 85 / 120 / 165 / 220 / 300.
- Chat: rate limit de 2.5 s por CUENTA revisando todas las sesiones del usuario, con `FOR UPDATE` sobre el usuario. El borrado de mensajes es solo por `admin_eliminar_mensaje_chat` (admin/owner, hard delete + auditoría); no habilitar DELETE directo.
- Presencia: `latido_comunidad` actualiza `ultima_actividad` cada 60 s mientras la pestaña está visible, desde cualquier página. El panel de Usuarios considera `en_linea` si la actividad es de los últimos 2 minutos; no confundir con la presencia Realtime de la columna de Comunidad, que solo cubre esa página.
- Muro: rate limit por autor normalizado; mensajes máximo 280 caracteres (servidor y cliente).
- Sorteo: nombre único sin distinguir mayúsculas (`lower(username)`), límite de 500 participantes, rate limit por IP y ganador decidido SOLO en el servidor. No insertar ganadores desde el cliente.
- Sorteo con identidad (1.81.0, migración aplicada el 2026-11-06): `sortear_entrar(p_token)` valida la sesión de comunidad, saca apodo/Kick del token y permite **una participación por cuenta**. Desde 1.82.0 la UI ya no ofrece el campo de usuario de Kick: sin sesión solo se muestra el enlace a `comunidad`. `sortear_siguiente()` envuelve a `sortear_ganador_sorteo()` y **retira al ganador de la tómbola**, así nadie gana dos premios mientras otro queda sin opción. Se concede a `anon` y `authenticated` porque el streamer puede ser admin por sesión de comunidad (rol `anon` en PostgREST) y **la autorización real está dentro de `es_admin()`**; sin el grant de `anon` PostgREST devolvía 401 antes de ejecutar. `sortear_ganador_sorteo`/`registrar_participante_sorteo` siguen existiendo como respaldo para clientes con caché antigua.
- Galería: subida anónima permitida por diseño (bucket `fotos-galeria`, prefijo `gallery/`, 5MB, JPG/PNG/GIF/WEBP/AVIF). Si la RPC falla después de subir, puede quedar un archivo huérfano; no prometer limpieza automática.
- Reportes de fotos: `reportar_foto_galeria` exige foto aprobada, motivo de la lista (`desnudo`, `violencia`, `spam`, `derechos`, `otro`), detalle máximo 200 y limita a 10 reportes por IP y día; el mismo reporte repetido devuelve `duplicado` sin insertar. `admin_marcar_reporte` y `admin_eliminar_reporte` exigen `es_admin()` y auditan.
- Cola de cine: `cine_cola` la escribe solo el streamer por `cine_cola_agregar`/`cine_cola_quitar`; URL `http(s)` de máximo 500, título máximo 120 y tope de 50 elementos. La lista es pública para que la sala vea el orden: la sección `.cine-cola` vive fuera del panel del streamer y el formulario, la ayuda y los botones se ocultan con `body:not(.admin-mode-active)`. `creado_por` guarda siempre `streamer`; no hay “quién propuso” mientras solo el streamer pueda encolar.
- Avatares: bucket público `avatares-comunidad` (500KB), **sin INSERT anónimo** (política eliminada el 2026-11-04; 0 objetos). Las subidas pasan por la Edge Function `kick-comunidad` con sesión de comunidad. Borrado solo admin. Los avatares por defecto viven en `/img/avatars/avatar-male.webp` y `/img/avatars/avatar-female.webp` y se asignan por género cuando no hay avatar propio. La foto de Kick se guarda aparte en `usuarios_comunidad.kick_avatar_url`, se sincroniza en cada login de Kick y se borra al desvincular.
- Perfil: `bio` máximo 160, `links_json` solo claves `instagram`, `discord`, `tiktok` y `kick` con URLs `http/https` máximo 300 (la BD aún acepta las antiguas, la UI ya no las edita); `avatar_url` acepta los avatares beta locales, el bucket propio o un avatar comprado en la tienda. `genero` es `masculino`/`femenino`/`no_definido`, tiene lectura pública y el registro nuevo exige masculino o femenino. `creado_en` también es público y alimenta “Miembro desde”. El editor vive solo en el modal global de `main.js`; el perfil público se abre con `window.abrirPerfilUsuario(apodo)`.
- Sesión de comunidad: `comunidad_session_usuario` guarda el objeto completo (id, apodo, puntos, rango, icono, género, avatar, bio, enlaces) y es la fuente de verdad del navbar/modal; limpiarlo junto con el token al cerrar o invalidar sesión.
- Tienda: el canje descuenta puntos y stock en una transacción con locks; los iconos son uno por usuario (`icono_equipado`) y los avatares se equipan al canjear. Usar las columnas reales de `tienda_canjes` (`nombre`, `costo_puntos`, `entregado_at`); no existe `metadata` ni `puntos_gastados`. No insertar canjes ni premios desde el cliente.
- Baneo: `baneado_hasta` bloquea login, chat, muro, puntos, likes, reacciones, galería, tienda y perfil. Al banear se borran las sesiones de comunidad. `shadowban` solo oculta los mensajes de chat a terceros (no es un límite de seguridad fuerte).
- Moderación: `admin_*` exige `es_admin()`; toda acción de ban/shadowban se registra en `admin_audit_log`. No exponer `baneado_hasta`, `baneado_motivo` ni `shadowban` a `anon`.
- Sugerencias: `enviar_sugerencia` valida 5–500 caracteres y limita a **2 por día por IP** (`md5` de `x-forwarded-for`). La tabla no tiene acceso `anon`; el admin la lee por política. No prometer lectura/respuesta inmediata.

### 5.6 Realtime

- Canales usados: `muro_saludos`, `comunidad_chat`, `message_reactions`, `galeria`, `config_sorteo`, `participantes_en_vivo`, `sync_cine`, presencia y typing.
- No crear canales duplicados en la misma página. Limpiar/salir de canales al navegar si se añaden nuevas páginas.
- Realtime respeta RLS. No añadir tablas a `supabase_realtime` sin evaluar qué filas puede ver `anon`.

### 5.7 Kick

- Edge Functions: `kick-oauth-callback` (intercambio OAuth), `kick-oauth-exchange`, `kick-comunidad` (acciones `entrar` y `vincular`), `kick-clips` (caché de clips), `kick-chat`, `kick-chat-setup`, `kick-chat-webhook`, `instagram-feed`, `tiktok-feed` y `app-telemetria`. Todas con `verify_jwt=false`: validan por su cuenta. `kick-setup-temp` no es un resto: es una lápida que responde `410 Gone` a una URL antigua de Kick, y se deja tal cual.
- Tablas: `kick_config`, `kick_sessions`, `kick_oauth_pendientes` (RLS sin políticas, solo `service_role` y RPC) y `kick_clips`.
- Cliente: `window.KICK_COMUNIDAD` en `main.js` (`vinculado`, `vincular`, `abrirOAuth`, `volverDelHash`). El objetivo del OAuth viaja en `sessionStorage` (`gocha_kick_objetivo`): `entrar` o `vincular`.
- Registro con Kick: `#btn-registro-kick` del modal de registro usa el mismo OAuth que "Conectar con Kick" y deja `gocha_kick_intencion=registro`. Al volver, `entrarConKickComunidad()` lo convierte en `gocha_ajustes_pendientes=1` y la página abre `Alpine.store('perfil').abrir('ajustes')` para completar género y avatar.
- Insignias de Kick: `window.insigniasKickDe()` (§4); no pedir `rol` al cliente.
- Cierre de sesión y Kick: `salir` no borra la autorización, solo rota el `token_hash`. Con `kickRecordar` (Ajustes, activado por defecto) `cerrarSesion()` conserva `gocha_kick_token` durante 30 días (`gocha_kick_recordar_hasta`) y “Entrar con Kick” entra sin OAuth; apagarlo o desvincular lo revoca. El cierre de la app respeta el mismo ajuste.
- Avatar de Kick: al vincular/iniciar sesión, `kick-comunidad` sincroniza la foto en `usuarios_comunidad.kick_avatar_url`. Si el usuario tiene elegido el avatar de Kick, se refresca en cada login. Al desvincular se limpia la columna y vuelve al avatar por género. La RPC de perfil solo acepta como avatar la foto de Kick del propio usuario.
- Espectadores: la cabecera del chat muestra `N Views` en `.chat-kick-espectadores`. Se pinta con `window.actualizarEspectadoresKick(total, enVivo)` desde el sondeo global de `verificarEstadoStream()`; no crear sondeos nuevos ni un segundo contador en la página.
- Player web: `#stream-player` es el iframe de `player.kick.com` y se queda así. Su CORS solo admite orígenes de Kick, así que reproducir el HLS directo (`playback_url` de `https://kick.com/api/v2/channels/lagochagaming`) en la web exige proxy y cuesta 2–3 GB por hora y espectador: no hacerlo sin autorización.
- Player en la app: desde la 1.10 la app usa el mismo iframe de `player.kick.com` que la web. El reproductor nativo ExoPlayer (`PlayerActivity`, puente `abrirDirecto`, tarjeta `.lg-directo-nativo`) se eliminó: no reintroducirlo sin autorización. No añadir botón “Ver en HD” en la web.
- El aviso “Visit KICK for HD quality” vive dentro del iframe y no se puede quitar desde fuera. Cualquier intento de taparlo con capas rompe los controles de Kick.
- Chat móvil en la app: `mobile/mobile.css` fija la hoja del chat en `min(56vh, 480px)` con velo transparente y sin `backdrop-filter`, para que el stream siga nítido y visible. El fab `.lg-chat-fab` alterna abrir/cerrar (`alternarChat()` en `mobile.js`) y se queda por encima de la hoja con `body.lg-chat-open`. Con el chat abierto la página sigue deslizándose: `body.lg-chat-open` deja `overflow-y:auto` + `touch-action:pan-y` y el overlay pasa los toques a la página salvo la hoja y el fab (`pointer-events`). No volver a subir la hoja a 84vh, ni a ponerle blur, ni a bloquear el scroll de fondo.

### 5.8 Telemetría de la app

- Edge Function `app-telemetria` (`verify_jwt=false`): recibe `POST { id, version }` desde `mobile/mobile.js`. El `id` es un UUID aleatorio guardado en `localStorage` (`lg_dispositivo_id`); el servidor guarda solo su hash SHA-256, nunca la IP ni una cuenta.
- `app_instalaciones` registra la versión actual y la última vez que se abrió la app. `app_actualizaciones` guarda un salto `desde_version → hasta_version` cuando la versión reportada es mayor que la anterior. Una instalación nueva no genera salto.
- El cliente reporta al abrir si cambió la versión o si pasaron 6 horas. La pestaña **Descargas** muestra dispositivos, activos 7 días, versiones instaladas, actualizaciones por salto y las últimas actualizaciones. Es telemetría diferida: solo se entera cuando la app se abre después de actualizar.
- Límite anti-abuso: 40 instalaciones nuevas por IP y hora. El endpoint no se usa para autorizar nada.

## 6. Seguridad

- **CSP activa por `<meta http-equiv="Content-Security-Policy">`** en las 6 páginas: GitHub Pages no aplica `_headers`, pero la meta sí funciona. `scripts/check.js` es la fuente única: calcula el SHA-256 de cada `<script>` inline y de cada bloque `speculationrules` (con los saltos de línea normalizados a LF, igual que el parser) y **falla si la meta no coincide con el HTML**; `--fix` la reescribe. `script-src` incluye `'unsafe-eval'` porque Alpine evalúa `x-data`/`x-on:` en runtime, así que la CSP limita orígenes y bloquea `object-src`, pero no protege frente a script inline (para eso están los hashes). `frame-ancestors` y `report-uri` **no funcionan en meta**: no fingir que existen. HSTS y el resto de cabeceras siguen sin existir en producción.
- Nunca confiar en el cliente para autorización. La UI puede ocultar botones, pero el servidor debe rechazar.
- Escapar todo HTML dinámico. Los emojis de reacción están limitados a una whitelist en el servidor.
- No registrar tokens, PINs ni datos personales en consola.
- No introducir `target="_blank"` sin `rel="noopener noreferrer"`.
- Las cuentas de comunidad usan PIN de 4 dígitos: es una decisión de producto; no aumentar la superficie de ataque (no permitir cambiar el PIN sin verificación, no exponer hashes).
- Recomendado: revisar los advisors de Supabase tras cada migración. "Leaked password protection" **requiere plan Pro y esta cuenta es Free**, así que no está disponible ni es una tarea pendiente; además solo afectaría a Supabase Auth (admins), porque las cuentas de comunidad usan PIN de 4 dígitos.
- Hay tablas con RLS activo y sin políticas (`instagram_feed`, `kick_clips`, `kick_config`, `kick_oauth_pendientes`, `kick_sessions`, `puntos_acciones`, `puntos_eventos`, `puntos_topas_rango`, `tiktok_feed`). Es intencionado: solo se acceden por RPC `SECURITY DEFINER`. No añadir políticas sin revisar qué filas quedarían expuestas a `anon`.
- La lectura pública de perfiles es por columna: `anon` tiene SELECT sobre `apodo, puntos, rango, genero, avatar_url, bio, links_json, icono_equipado, creado_en, kick_badges, kick_badges_at, kick_user_id, kick_username, ultima_actividad`. `rol` NO está concedido: no pedirlo en un select desde el cliente (devuelve 401).

## 7. Despliegue

- Producción: GitHub Pages del repo `Chary-lab/lagochagaming-web` (rama `main`, build legacy con Jekyll, sin workflows). Los cambios pueden tardar en cachear.
- `.nojekyll` DEBE estar versionado en la raíz: sin él Pages intenta Jekyll y el build falla (`Build with Jekyll`). El `.gitignore` usa `*` + whitelist, así que cualquier archivo nuevo necesita su `!archivo` para poder commitearse.
- `AGENTS.md` está en UTF-8 sin BOM. Editarlo con el editor o con Node en UTF-8; no usar `Get-Content`/`Set-Content` de PowerShell 5.1 (leen ANSI y rompen acentos).
- El repo antiguo quedó bloqueado por un deployment fantasma de Pages (`400 in progress deployment`). Si vuelve a pasar: comprobar `pages/builds` y los deployments del environment `github-pages` antes de tocar código; el contenido no es el problema.
- No hay service worker. `manifest.webmanifest` debe seguir siendo válido.
- `robots.txt` y `sitemap.xml` deben mantenerse coherentes con las páginas públicas. Actualizar `lastmod` cuando cambie contenido público.
- Si se cambia de host, actualizar esta sección y `_headers`. Mientras el host sea GitHub Pages, CSP/HSTS solo existen por la meta CSP del HTML: **no proponer `_headers` como mejora pendiente**.
- APK Android: el proyecto vive en `D:\Apk Gocha` (Capacitor). El keystore de release está en `C:\Users\Administrator\.lagocha\lagocha-release.jks` (alias `lagocha-release`, credenciales en `credenciales.txt` al lado). Nunca versionar la clave. Tras cada build, copiar el APK a `app/LaGochaGaming.apk` y actualizar `sha256` y `size` en `app/version.json`: el actualizador interno de la app los verifica antes de instalar.
- Certificado de firma que NO debe cambiar: SHA-256 `41a6cdc746de8560425aa04b9bcdc3cb5e81f670644e846f284977ce721b4b21`. Si cambia, los usuarios tienen que desinstalar e instalar.

### 7.2 Release de la app (checklist obligatorio)

1. En `D:\Apk Gocha`: subir `versionCode` y `versionName` en `android/app/build.gradle`.
2. `ASSET_CACHE_VERSION` sale de `BuildConfig.VERSION_CODE`: subir `versionCode` invalida la caché de assets, sin pasos manuales.
3. `build-apk.ps1` copia `D:\Gocha\mobile\mobile.css` y `mobile.js` a `android/app/src/main/assets/mobile/` y aborta si no quedan idénticos byte a byte: la paridad ya no depende de la memoria.
4. Compilar y firmar:
   ```powershell
   $env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot'
   $env:ANDROID_HOME='C:\Android\sdk'
   powershell -ExecutionPolicy Bypass -File "D:\Apk Gocha\build-apk.ps1"
   ```
5. Verificar con `apksigner verify --print-certs` (mismo SHA-256) y `aapt dump badging` (versionCode/versionName correctos).
6. Copiar `dist\LaGochaGaming.apk` a `app/LaGochaGaming.apk` y `dist\update\version.json` a `app/version.json` (con `notes` legibles).
7. En `main.js`: enlace `app-descarga?v=X.Y&o=web` y texto del menú `vX.Y · N,N MB`.
8. En `D:\Gocha\mobile\mobile.js` y en los assets del APK: texto “App móvil · vX.Y”. También en `README.md` (versión actual y `versionCode` del APK).
9. Buscar restos de la versión anterior antes de commitear: `Select-String -Path "D:\Gocha\*.html","D:\Gocha\main.js","D:\Gocha\mobile\mobile.js","D:\Gocha\README.md" -Pattern 'v1\.\d+|\?v=1\.\d'`. La versión de la app se repite en 6 sitios (ver §5 de `D:\Apk Gocha\AGENTS.md`); actualizarlos todos.
10. `node scripts/check.js`, `node --check main.js`, bump de `VERSION` y entrada en `CHANGELOG.md`, commit `vX.Y.Z - resumen`.
11. Tras el push, comprobar en vivo `VERSION`, `app/version.json` y el SHA-256 del APK descargado (GitHub Pages puede tardar ~10 min en cachear).
- Las actualizaciones que descarga la propia app no pasan por `app-descarga` (el actualizador solo acepta el host `lagochagaming.com`), así que no cuentan en el contador.

### 7.1 SEO / AEO

- Search Console verificado; `sitemap.xml` enviado y `robots.txt` coherente con las páginas públicas.
- JSON-LD: `Person` + `WebSite` en la home; `BreadcrumbList` en comunidad, galería, sorteo y cine; `FAQPage` en la home. La FAQ debe seguir siendo visible y coincidir con el schema.
- `llms.txt` en la raíz y `404.html` con `noindex`.
- Open Graph/Twitter por página: `img/3.jpg` en todas (home, comunidad, cine, galería y sorteo), con `og:image:alt`.
- Analítica: Umami (`cloud.umami.is`) en las 6 páginas, `404.html` incluida; no instalar Plausible a la vez.
- No cambiar `<title>`, meta description ni H1 sin revisar canibalización: una intención por página (home = marca/streamer; comunidad = chat; galería = fotos; sorteo = sorteos; cine = GochiWatch).
- Al cambiar contenido público, actualizar `lastmod` del sitemap y pedir indexación en GSC.
- IndexNow: la clave vive en `f7d530743fabe8d2351dd9d026536f44.txt` (raíz, pública, se sirve tal cual). No borrarla ni renombrarla; si se rota, sustituir el archivo y volver a enviar las URLs a `api.indexnow.org`.

## 8. Versionado SemVer (obligatorio)

`VERSION` es la fuente de verdad. Formato `MAJOR.MINOR.PATCH`.

- `MAJOR`: cambios incompatibles de URL, API/RPC, esquema o comportamiento que rompan clientes/datos.
- `MINOR`: funcionalidad nueva o cambios compatibles (nuevas tablas/RPC, nuevas features, mejoras de seguridad con cambio de comportamiento).
- `PATCH`: corrección de bugs, seguridad, textos, estilos o tooling sin nueva funcionalidad ni romper contratos.
- Todo cambio que llegue a producción debe bump de `VERSION` y entrada en `CHANGELOG.md`.
- En cada release, actualizar el query de caché `?v=X.Y.Z` de `style.css` y `main.js` en los HTML (GitHub Pages cachea agresivamente).
- Formato de commit: `vX.Y.Z - resumen corto` (seguir el historial existente).
- No commitear ni pushear una versión inestable. Probar antes.
- Versión de esta release: `1.83.3` (Fuera el bloque `#directo` de la home: el contenido entre el player y los clips se veía sobrecargado. La pregunta de horario sigue en la FAQ visible y en `FAQPage`. Se borraron las dos reglas `.content-section .hero-bio a` de `style.css`, que solo usaba ese bloque. La 1.83.1 fue el SEO de la home según Search Console: `title` con `Oficial` y `Directo en Kick`, H1 `La Gocha Gaming en Kick`, y pregunta de horario en la FAQ + `FAQPage`. La 1.83.0 fue la release de la App 1.14: paridad de `mobile/` verificada dentro del APK, `versionCode` 17, notas por parámetro, versión desde `BuildConfig` y restos de plantilla fuera. Web: `check.js` vigila diálogos y el manifiesto; `smoke.js` cubre 404; Edge Functions y fechas por `llamarEdge`/`formatearFecha`; sin carpeta local de Supabase).
- La base se toca **solo** contra Supabase, nunca contra un esquema local. Flujo obligatorio: leer con `supabase db query --remote=cydiyaacnyydprgffmkq --read-only`, probar en una transacción con `DO`/`RAISE` + `ROLLBACK` y aplicar con `--yes`. El wrapper `%APPDATA%\npm\supabase.cmd` funciona aunque el `.ps1` esté bloqueado por ExecutionPolicy.
- No crear `supabase/migrations/` ni `supabase/functions/` locales. El historial de Supabase no registra lo aplicado con `db query`, así que el registro real de cada cambio es su entrada en `CHANGELOG.md`: qué, por qué y qué se verificó.
- `supabase db dump` necesita Docker y aquí no hay. El respaldo de la base es el de Supabase (Dashboard → Database → Backups); si no está disponible, se genera un snapshot del esquema por consultas de solo lectura.
- `VERSION` describe la web. La app lleva su propio `versionName`/`versionCode` en `D:\Apk Gocha`; ambos se publican juntos, pero no comparten número.

## 9. Pruebas antes de commitear

1. `node scripts/check.js` (sintaxis JS inline, IDs duplicados, recursos, SemVer, **CSP por meta con los hashes de los scripts inline**, RPC por `rpcRaw`, `?v=` contra `VERSION`, directivas Alpine sin `x-data`/`x-store`, `alert`/`confirm`/`prompt`, BOM en archivos publicados, iconos del sprite y el manifiesto `app/version.json`). Si el bump de `VERSION` deja los busters viejos, `node scripts/check.js --fix` los reescribe. Con navegador real, `node scripts/smoke.js`: abre las 6 páginas (404 incluida) a 1690×900 y 390×844 con Chrome/Edge y falla por error HTTP, consola sucia, desborde horizontal o busters viejos; levanta su propio servidor en el puerto 8788 o reutiliza uno con `--url=`. También prueba la paleta, el contrato de `gochi_ajustes` (clases `texto-*`, `sin-animaciones` y `ahorro-datos` más el estado del store) y que el like sin sesión pide login sin abrir el lightbox.
2. `node --check main.js`.
2b. Tras tocar HTML (scripts inline) o la CSP: comprobar con navegador que no hay violaciones (`securitypolicyviolation`) ni errores de consola en las 6 páginas × 2 tamaños. Los hashes sin `--fix` dejan el sitio sin JavaScript.
3. Levantar servidor local: `python -m http.server 8765` y probar en `http://127.0.0.1:8765/`.
4. Smoke test mínimo:
   - Home: player, 6 clips de Kick, 6 de Instagram y 6 de TikTok cargan; la fachada del chat aparece y el iframe entra al pulsar; el muro pinta mensajes y no hay errores de consola propios.
   - Comunidad: presencia muestra "Nadie en línea" si no hay nadie, chat/ranking cargan, login/registro (PIN y Kick) y reacciones funcionan.
   - Comunidad (moderación): con sesión owner/admin aparece el botón de borrar en cada mensaje; borra con confirmación, desaparece para todos y queda fila `eliminar_mensaje_chat` en auditoría. Sin sesión no aparece y la RPC rechaza.
   - Galería: tarjetas abren lightbox; like sin sesión NO abre lightbox y pide login; con sesión alterna like/contador; moderación rechaza cuentas no admin; el panel de galería solo muestra fotos pendientes (aprobar/rechazar).
   - Panel global: se abre solo desde “Acceso” en el footer (sin iconos en el navbar); con Auth admin/owner muestra Usuarios y Auditoría, y el owner además Buzón; el detalle de auditoría se escapa.
   - Acceso/Auth: iniciar sesión desde “Acceso”, cerrar sesión desde ajustes y comprobar que también se cierra Auth, no se recrea la sesión de comunidad al recargar y se puede volver a entrar. Limpiar el usuario temporal.
   - Usuarios en línea: con una cuenta en otra página (Inicio/Galería) el latido la marca “En línea”; al cerrar o dejar de latir 2 minutos pasa a “Offline” con la última actividad en el título.
   - Galería (subida): sin título muestra toast; archivo que no es imagen o formato no permitido muestra el feedback del store y no sube nada.
   - Comunidad: perfil (bio/links/avatar), tienda (catálogo/canje), icono equipado y reacciones del muro; probar con usuario temporal y borrarlo.
   - Sorteo: modo manual agrega/gira; modo streamer pide login; si no hay sesión admin no muestra panel; errores de red no muestran un ganador falso.
   - Cine: estado/video cargan, overlay/join no rompe MP4 si YouTube falla, sin errores propios.
   - SEO: JSON-LD válido; FAQ visible coincide con `FAQPage`; `sitemap.xml` y `robots.txt` coherentes; Umami carga una vez.
   - Iconos: ninguna página con huecos; si falta un símbolo, añadirlo a `img/icons.svg`.
   - Sugerencias: el modal abre y cierra, envía una y la guarda; el tercer intento del día devuelve `limite`; borrar las filas de prueba.
   - Moderación: ban y shadowban sobre usuario temporal; verificar borrado de sesiones, login bloqueado y fila en auditoría; limpiar después.
5. Release de la APK (solo si toca la app):
   - `apksigner verify --print-certs` con el SHA-256 esperado y `aapt dump badging` con el `versionCode`/`versionName` nuevos.
   - Comprobar que `assets/mobile/mobile.css` y `mobile.js` del APK coinciden con los de `D:\Gocha\mobile\`.
   - Probar en un dispositivo real si el cambio es nativo: abrir el directo, cambiar calidad, tocar la pantalla y confirmar que no aparece el aviso de Kick. Sin dispositivo, decirlo como pendiente; no dar por probado.
6. Cambios de base de datos:
   - Preparar el SQL y probarlo en una transacción con un usuario temporal y `ROLLBACK`.
   - Verificar que no queden usuarios, mensajes, likes ni sesiones de prueba.
   - Aplicarlo contra el proyecto `cydiyaacnyydprgffmkq` con `supabase db query --remote=... --yes` y revisar los advisors.
   - No crear ni commitear una carpeta `supabase/` local: la base es Supabase. Documentar el cambio en `CHANGELOG.md`.
7. Revisar `git diff` y `git status`; no commitear archivos temporales, secretos ni datos de prueba.

## 10. Flujo de trabajo

1. Leer esta guía y el código afectado.
2. Revisar `git status` y el historial reciente.
3. Implementar el cambio mínimo y coherente.
4. Ejecutar checks + pruebas.
5. Actualizar `VERSION`, `CHANGELOG.md` y `sitemap.xml` si corresponde.
6. Commit con `vX.Y.Z - resumen` y push solo si la versión es estable (el usuario lo autoriza).
7. Reportar hallazgos, cambios, pruebas y riesgos pendientes.
8. Usar las skills cuando encajen (`frontend-developer`, `backend-architect`, `supabase`) y MCP (Supabase, Context7) para DB, Edge Functions, logs y docs, en vez de llamadas manuales. Nunca escribir tokens o secretos en archivos, commits ni prompts; usarlos en memoria y recomendar revocarlos.
9. Mantener el repo limpio y barato de leer: borrar archivos temporales (`_test-*`, probes), VERSION/CHANGELOG/AGENTS sincronizados, caché `?v=X.Y.Z` al día, y usar `grep` o lecturas por rangos en vez de volcar archivos enteros.

## Skills del proyecto

| Tarea | Skill |
|---|---|
| UI, componentes, estilos, responsive, accesibilidad | `frontend-developer` |
| Metadatos, sitemap, indexación, contenido | `seo-specialist` |
| Esquema, SQL, migraciones, RLS | `backend-architect` |

- Carga la skill antes de empezar la tarea, no a mitad.
- No cargues ninguna si el cambio es mecánico: renombrar, mover archivos, arreglar un typo o cambiar un texto.
- No anuncies si cargas o no una skill. Decide y actúa.

## 11. Lista de "no hacer"

- No exponer `service_role`, contraseñas, tokens ni PINs.
- No desactivar RLS ni crear políticas permisivas "temporales".
- No escribir directo a `comunidad_chat`, `message_reactions`, `muro_saludos`, `galeria_likes` ni `ganadores_sorteo` desde el cliente.
- No confiar en apodo/puntos/likes/ganador enviados por el cliente.
- No usar email hardcodeado para decidir admin.
- No decidir `owner` por apodo ni por nombre de usuario de comunidad; solo por `app_metadata.role`, por la columna `usuarios_comunidad.rol` de una sesión válida y por el vínculo `auth_user_id`.
- No exponer el buzón de sugerencias a `admin`; es exclusivo de `owner`.
- No usar `alert()`, `confirm()` ni `prompt()`: los avisos van por toast y las confirmaciones por `window.confirmarAccion()`.
- No usar `innerHTML` con datos de usuario sin escapar.
- No poner `{{ }}` en atributos Alpine.
- No usar `@click.stop` en las acciones de la tarjeta de galería (rompe el listener delegado).
- No agregar dependencias/build sin autorización.
- No dividir archivos ni crear CSS, JS o HTML parciales: la estructura actual se mantiene (ver §2).
- No asumir que `_headers` funciona en GitHub Pages: es solo referencia. La protección real es la meta CSP.
- No montar proxy HLS ni reproductor propio en la web para quitar el aviso de Kick: cuesta ancho de banda y rompe la política del CDN.
- No publicar una APK sin verificar el SHA-256 de la firma y el `versionCode`; no cambiar la keystore.
- No commitear con la app rota o sin probar.

## 12. Riesgos aceptados / deuda conocida

- Registro de sorteo: con `sortear_entrar` (1.81.0, migración **aplicada**) el participante se identifica con su cuenta y no puede suplantar a otro. Desde 1.82.0 la UI no tiene campo de usuario de Kick, así que el único camino visible es la cuenta de comunidad. `registrar_participante_sorteo` sigue en la base como respaldo para clientes con JS cacheado (esos sí pueden escribir el nombre de Kick: 30 registros/10 min por IP, tope 500 hasta que refresquen).
- El ganador repetido queda resuelto con `sortear_siguiente()` (1.81.0, **migración aplicada**), que retira al ganador de la tómbola. `sortear_ganador_sorteo` por sí sola sigue sin retirar al ganador.
- Las sesiones caducadas se limpian al iniciar sesión/registrarse, no con un cron. No asumir limpieza inmediata.
- Presencia y "escribiendo" usan canales públicos: un cliente puede falsificar el apodo mostrado. El chat real sí usa el apodo canónico del servidor.
- Subida anónima a Storage: permite spam de almacenamiento y archivos huérfanos si la RPC falla. Aplica a `fotos-galeria` y `avatares-comunidad` (500KB, prefijo `avatar/`). Requiere Edge Function/servicio externo para verificación fuerte.
- Shadowban: `comunidad_chat.oculto` filtra la lectura por RPC y el realtime del cliente, pero la tabla tiene SELECT público; un atacante podría leer mensajes ocultos por REST. No es un control de seguridad fuerte.
- PIN de 4 dígitos: fuerza bruta distribuida posible; el rate limit es por IP.
- GitHub Pages no aplica `_headers`: no hay HSTS ni las demás cabeceras. Lo único que sí protege en producción es la **meta CSP** del HTML (ver §6); no hay defensa anti-clickjacking (`frame-ancestors` no funciona en meta).
- Los CDNs de jsDelivr (Supabase JS, Alpine, `@alpinejs/focus` y hls.js) **ya llevan SRI** (`integrity` + `crossorigin`): al subir la versión de una librería hay que recalcular el hash o el navegador la bloquea. Las fuentes ya no vienen de Google: `fonts/` sirve Inter y Space Grotesk (woff2 variable, latin) con `@font-face` en `style.css`.
- Advisors de Supabase marcan RPCs `SECURITY DEFINER` ejecutables por `anon`; es intencional para usuarios de comunidad sin Supabase Auth. Revisar cada nueva RPC con el mismo criterio.
- Índices marcados como "unused" son de bajo volumen; no eliminarlos sin medir.
- El contador de descargas no ve las actualizaciones internas de la app ni las descargas directas del `.apk` fuera de `app-descarga`. La pestaña Descargas estima las actualizaciones con telemetría anónima cuando la app se abre, así que pueden tardar hasta que el usuario vuelva a entrar.
- Los espectadores del chat se refrescan con el sondeo de 30 s; pueden ir 30–60 s por detrás del número del iframe.
