# AGENTS.md - LaGochaGaming

Guía operativa para agentes que trabajen en este repositorio. Leerla completa antes de tocar código, base de datos o despliegue.

## 1. Resumen del proyecto

- Sitio estático de La Gocha Gaming: HTML + CSS + JavaScript clásico, sin build, sin bundler y sin dependencias instaladas localmente.
- Páginas: `index.html` (inicio), `comunidad.html` (chat/puntos), `galeria.html` (fotos/likes), `sorteo.html` (sorteo), `cine.html` (GochiWatch).
- Código compartido: `main.js` (navbar inyectada, tema, toasts, sesión de comunidad, admin, confeti, fachada del chat de Kick) y `style.css`.
- Backend: Supabase (Postgres + RLS + RPC + Realtime + Storage). Proyecto `cydiyaacnyydprgffmkq`.
- Hosting actual: GitHub Pages del repo `Chary-lab/lagochagaming-web` (rama `main`, build legacy), dominio `lagochagaming.com` (archivo `CNAME`). El repo anterior `Chary-lab/LaGochaGaming` se borró por un deployment atascado en Pages; no volver a usarlo.
- Versión actual: ver `VERSION` (SemVer). Changelog: `CHANGELOG.md`.

## 2. Reglas de stack

- No introducir frameworks, bundlers ni dependencias npm de runtime sin autorización explícita.
- No añadir jQuery ni Bootstrap. El sitio usa CSS propio (`.visually-hidden`, `.nav-right`) y Alpine para la UI.
- **Alpine primero:** toda UI interactiva (listas, tarjetas, modales, formularios, menús, toasts y estados) se implementa con Alpine (`x-data`/stores, `x-for`, `x-model`, `:hidden`, `x-trap`). El JS clásico queda para Supabase, RPC, Realtime, cálculo y APIs `window.*`; no se añaden renders con `innerHTML` ni listeners por elemento.
- Las librerías externas se cargan por CDN con versión fijada (Supabase JS 2.118.0, Alpine 3.17.5, `@alpinejs/focus` 3.17.5). No cambiar versiones a `latest`.
- Iconos: sprite local `img/icons.svg` (Font Awesome Free 6.6.0, CC BY 4.0). En el markup se usa `<svg class="icon"><use href="img/icons.svg#i-solid-x">`; no se carga Font Awesome por CDN.
- Mantener el estilo actual: variables CSS, clases semánticas, modo claro/oscuro y diseño responsive.
- El sitio debe funcionar sin build. No crear pasos de compilación obligatorios.

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
| `_headers` | Cabeceras para hosts que las soportan (NO en GitHub Pages) |
| `VERSION` | Versión SemVer de la release |
| `404.html` | Página no encontrada (`noindex`) |
| `llms.txt` | Resumen del sitio y URLs para motores de IA |
| `img/icons.svg` | Sprite de iconos (Font Awesome Free 6.6.0, CC BY 4.0) |
| `img/mcchary/` | Ilustraciones del creador: footer, 404 y estados vacíos |
| `scripts/check.js` | Validaciones estáticas del repo (no se carga en Pages) |

Las migraciones SQL no se versionan en este repo: el historial vive en Supabase. La carpeta local `supabase/` está ignorada.

La navbar vive en `main.js` (`window.NAVBAR_ENLACES`): cada página solo tiene un `<nav id="navbar-root">` vacío y `insertarNavbar()` pinta enlaces, orden y estado activo. Para cambiar el menú, editar solo `main.js`. El estado EN VIVO (`#nav-live-tag` + `.navbar.live-glow`) lo alterna `verificarEstadoStream()`.

El `nav.footer-nav` del footer es la excepción: va en HTML estático dentro de las cinco páginas para que los rastreadores encuentren las subpáginas sin ejecutar JavaScript. No moverlo a `main.js`.

## 4. Convenciones de JavaScript

- Scripts clásicos, sin módulos ES. Para helpers usados desde HTML/Alpine, exponer en `window` (`window.escapeHtml`, `window.abrirLightboxDesdeTarjeta`, etc.).
- Escapar SIEMPRE datos no confiables antes de `innerHTML`: usar `escapeHtml`/`escapeAttr` o `textContent`. Nunca interpolar apodos, mensajes, títulos, URLs ni emojis sin escapar.
- Preferir `textContent` y creación de nodos a `innerHTML` cuando sea posible.
- No usar `eval`, `new Function` ni `document.write`.
- En Alpine, no usar mustaches `{{ }}` dentro de atributos. Usar bindings (`:aria-label="'...' + variable"`).
- Stores globales en `main.js` (`perfil`, `ui`, `toast`, `adminPanel`); por página en su HTML (`media`/`muro` en index, `galeria`/`subida` en galería, `cine`, `chat`/`tienda` en comunidad, `sorteo`).
- Alpine va con `defer` y los stores se registran en `alpine:init`. Usar `x-cloak` en lo que deba ocultarse antes de inicializar.
- Para visibilidad usar `:hidden="!abierto"` con la regla global `[hidden]`; no `x-show` (en este build no vuelve a ocultar elementos con `display: flex`).
- Cuidado con la propagación de clics: las tarjetas de galería abren el lightbox, pero los botones de acción deben llegar al listener delegado del documento. Usar `window.abrirLightboxDesdeTarjeta($event, foto, $el)` y no `@click.stop` en la zona de acciones.
- No anidar nuevas acciones interactivas dentro de `role="button"` sin revisar propagación de click/teclado y accesibilidad.
- Respetar `prefers-reduced-motion` en animaciones nuevas (el confeti ya lo hace).
- Chat de Kick: los iframes llevan `data-chat-kick` + `data-src` (nunca `src`). `prepararFachadaChat()` en `main.js` crea la fachada y carga el iframe al hacer scroll, clic o al terminar la carga; no añadir listeners por elemento.
- Mantener los textos de UI en español y el tono actual.
- No usar `Get-Content`/`Set-Content` de PowerShell 5.1 para reemplazos masivos en archivos UTF-8: leen ANSI y rompen acentos/emojis. Usar el editor o Node/Python con UTF-8 explícito.

### 4.1 Alpine: reglas obligatorias

- Stores globales en `main.js`: `perfil` (modal), `ui` (menú móvil), `toast` y `adminPanel` (panel de administración global).
- Stores por página: `media`/`muro` (index), `galeria`/`subida` (galería), `chat`/`ranking`/`rangosChat`/`reacciones`/`tienda` (comunidad), `sorteo` y `cine`.
- Listas y tarjetas con `x-for` y `:key`. Formularios con `x-model` (o `:value` + `@input` en objetos anidados). Textos y feedback con `x-text` + `:hidden`.
- Visibilidad con `:hidden="!abierto"` y la regla global `[hidden]`; `x-cloak` para lo que deba ocultarse antes de inicializar. Evitar `x-show` en elementos con `display: flex` (en este build puede no volver a ocultarlos).
- Modales con `x-trap.noscroll` y cierre por Escape, fondo o botón; el foco vuelve solo.
- Al migrar una zona, borrar el render manual anterior, sus listeners y las funciones sin uso. No dejar dos mecanismos para lo mismo.
- El reset global usa `box-sizing: border-box`; cualquier `width: 100%` con padding ya no desborda. Revisar overflow horizontal a 1400 px y 390 px al tocar layouts.
- `innerHTML` solo para markup estático propio; nunca con datos de usuario.
- Realtime y RPC actualizan el store; la vista reacciona sola.

## 5. Supabase: reglas no negociables

### 5.1 Credenciales

- La `anon key` es pública y vive en `main.js`; es lo esperado.
- NUNCA agregar `service_role`, contraseñas, tokens de administrador ni secretos al repositorio ni al cliente.
- La autenticación de administrador es Supabase Auth + `app_metadata.role = "admin"` o `"owner"`. No usar email hardcodeado ni listas en cliente.
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
- `config_sorteo`, `participantes_en_vivo`, `ganadores_sorteo`.
- `sync_cine` (estado de reproducción).
- `tienda_premios`, `tienda_canjes` (tienda de puntos).
- `admin_audit_log` (auditoría de moderación, solo admin).
- `instagram_feed` (caché de la Edge Function `instagram-feed`; solo `service_role`, TTL 40 min y refresco con `pg_cron` cada 20 min).
- `tiktok_feed` (caché de la Edge Function `tiktok-feed`; solo `service_role`, TTL 40 min y refresco con `pg_cron` cada 20 min).
- `kick_clips` (caché de la Edge Function `kick-clips`, una fila JSON con los últimos clips de Kick; solo `service_role`, TTL 40 min y refresco con `pg_cron` cada 20 min).
- `puntos_acciones`, `puntos_eventos`, `puntos_topas_rango` (puntos por acción, historial con idempotencia y topes diarios por rango; solo `service_role`, se escriben desde RPC `SECURITY DEFINER`).
- `sugerencias` (texto 5–500, `ip_hash`, `leida`, `creada_en`; sin acceso `anon`; solo `owner` lee, marca y borra con `es_owner()` y las RPC `owner_marcar_sugerencia` / `owner_eliminar_sugerencia`).
- RPCs importantes: `login_comunidad`, `registrar_comunidad`, `validar_sesion_comunidad`, `cerrar_sesion_comunidad`, `sesion_comunidad_vinculada`, `latido_comunidad`, `incrementar_puntos_comunidad`, `enviar_mensaje_chat`, `obtener_chat_historial`, `establecer_reaccion`, `establecer_reaccion_muro`, `obtener_reacciones_muro`, `publicar_saludo_muro`, `publicar_foto_galeria`, `actualizar_perfil_comunidad`, `incrementar_likes`, `obtener_likes_galeria`, `tienda_obtener_catalogo`, `tienda_canjear_premio`, `tienda_mis_canjes`, `registrar_participante_sorteo`, `sortear_ganador_sorteo`, `enviar_sugerencia`, `owner_marcar_sugerencia`, `owner_eliminar_sugerencia`, `admin_listar_usuarios`, `admin_ban_usuario`, `admin_shadowban_usuario`, `admin_obtener_audit_log`, `admin_eliminar_mensaje_chat`.

### 5.5 Invariantes de integridad

- Likes: una fila por `(image_id, usuario_id)` en `galeria_likes`; el contador `galeria.likes` se actualiza solo dentro de `incrementar_likes`. No volver a usar contadores basados en `localStorage` ni aceptar incrementos arbitrarios.
- Puntos: cooldown de 5 minutos por CUENTA en `usuarios_comunidad.ultimo_punto`, con `FOR UPDATE` para evitar carreras entre sesiones. El multiplicador sale del rango actual.
- Puntos por acciones: `puntos_eventos` es el historial; `registrar_puntos` valida acción, baneo, cooldown, tope por acción (`max_dia`) y tope diario del rango (`puntos_topas_rango`). Idempotencia por `(usuario_id, accion, ref)`. `registrar_puntos` y `otorgar_puntos_accion` no se conceden a `anon`: los puntos se otorgan dentro de las RPC de cada acción. El `EXECUTE` de `registrar_puntos` se revocó también a `authenticated` (2026-11-01): solo `service_role` y las funciones `SECURITY DEFINER` pueden llamarla.
- Rangos: umbrales 0 / 100 / 400 / 1000 / 2000 / 3500 y topes diarios 60 / 85 / 120 / 165 / 220 / 300.
- Chat: rate limit de 2.5 s por CUENTA revisando todas las sesiones del usuario, con `FOR UPDATE` sobre el usuario. El borrado de mensajes es solo por `admin_eliminar_mensaje_chat` (admin/owner, hard delete + auditoría); no habilitar DELETE directo.
- Presencia: `latido_comunidad` actualiza `ultima_actividad` cada 60 s mientras la pestaña está visible, desde cualquier página. El panel de Usuarios considera `en_linea` si la actividad es de los últimos 2 minutos; no confundir con la presencia Realtime de la columna de Comunidad, que solo cubre esa página.
- Muro: rate limit por autor normalizado; mensajes máximo 280 caracteres (servidor y cliente).
- Sorteo: nombre único sin distinguir mayúsculas (`lower(username)`), límite de 500 participantes, rate limit por IP y ganador decidido SOLO en el servidor. No insertar ganadores desde el cliente.
- Galería: subida anónima permitida por diseño (bucket `fotos-galeria`, prefijo `gallery/`, 5MB, JPG/PNG/GIF/WEBP/AVIF). Si la RPC falla después de subir, puede quedar un archivo huérfano; no prometer limpieza automática.
- Avatares: bucket público `avatares-comunidad` (500KB), subida anónima solo bajo `avatar/`, sin update; borrado solo admin. Los avatares beta locales viven en `/img/avatars/avatar-male.webp` y `/img/avatars/avatar-female.webp` y se asignan por género cuando no hay avatar propio.
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

## 6. Seguridad

- CSP, HSTS y demás cabeceras de `_headers` NO se aplican en GitHub Pages. No asumir que están activas en producción. Si se migra a Cloudflare Pages/Netlify, revisar que la CSP incluya `wss://*.supabase.co` y `https://www.youtube.com` en `script-src`, y probar Realtime + YouTube.
- Nunca confiar en el cliente para autorización. La UI puede ocultar botones, pero el servidor debe rechazar.
- Escapar todo HTML dinámico. Los emojis de reacción están limitados a una whitelist en el servidor.
- No registrar tokens, PINs ni datos personales en consola.
- No introducir `target="_blank"` sin `rel="noopener noreferrer"`.
- Las cuentas de comunidad usan PIN de 4 dígitos: es una decisión de producto; no aumentar la superficie de ataque (no permitir cambiar el PIN sin verificación, no exponer hashes).
- Recomendado en Supabase Auth: activar "Leaked password protection" y revisar los advisors tras cada migración.

## 7. Despliegue

- Producción: GitHub Pages del repo `Chary-lab/lagochagaming-web` (rama `main`, build legacy con Jekyll, sin workflows). Los cambios pueden tardar en cachear.
- El repo antiguo quedó bloqueado por un deployment fantasma de Pages (`400 in progress deployment`). Si vuelve a pasar: comprobar `pages/builds` y los deployments del environment `github-pages` antes de tocar código; el contenido no es el problema.
- No hay service worker. `manifest.webmanifest` debe seguir siendo válido.
- `robots.txt` y `sitemap.xml` deben mantenerse coherentes con las páginas públicas. Actualizar `lastmod` cuando cambie contenido público.
- Si se cambia de host, actualizar esta sección y `_headers`.
- APK Android: el proyecto vive en `D:\Apk Gocha` (Capacitor). El keystore de release está en `C:\Users\Administrator\.lagocha\lagocha-release.jks` (alias `lagocha-release`, credenciales en `credenciales.txt` al lado). Nunca versionar la clave. Tras cada build, copiar el APK a `app/LaGochaGaming.apk` y actualizar `sha256` y `size` en `app/version.json`: el actualizador interno de la app los verifica antes de instalar.

### 7.1 SEO / AEO

- Search Console verificado; `sitemap.xml` enviado y `robots.txt` coherente con las páginas públicas.
- JSON-LD: `Person` + `WebSite` en la home; `BreadcrumbList` en comunidad, galería, sorteo y cine; `FAQPage` en la home. La FAQ debe seguir siendo visible y coincidir con el schema.
- `llms.txt` en la raíz y `404.html` con `noindex`.
- Open Graph/Twitter por página: `img/3.jpg` en todas (home, comunidad, cine, galería y sorteo), con `og:image:alt`.
- Analítica: Umami (`cloud.umami.is`) en las 5 páginas; no instalar Plausible a la vez.
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
- Versión de esta release: `1.35.2` (APK release firmada y `version.json` publicado; sobre 1.35.1).

## 9. Pruebas antes de commitear

1. `node scripts/check.js` (sintaxis JS inline, IDs duplicados, recursos, SemVer, CSP básica).
2. `node --check main.js`.
3. Levantar servidor local: `python -m http.server 8765` y probar en `http://127.0.0.1:8765/`.
4. Smoke test mínimo:
   - Home: player, 6 clips de Kick, 6 de Instagram y 6 de TikTok cargan; la fachada del chat aparece y el iframe entra al pulsar; el muro pinta mensajes y no hay errores de consola propios.
   - Comunidad: presencia muestra "Nadie en línea" si no hay nadie, chat/ranking cargan, login/registro y reacciones funcionan.
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
5. Cambios de base de datos:
   - Preparar el SQL y probarlo en una transacción con un usuario temporal y `ROLLBACK`.
   - Verificar que no queden usuarios, mensajes, likes ni sesiones de prueba.
   - Aplicarlo en Supabase con una migración nombrada y volver a correr advisors.
   - No commitear la carpeta local `supabase/` (está ignorada). Documentar el cambio en `CHANGELOG.md`.
6. Revisar `git diff` y `git status`; no commitear archivos temporales, secretos ni datos de prueba.

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

## 11. Lista de "no hacer"

- No exponer `service_role`, contraseñas, tokens ni PINs.
- No desactivar RLS ni crear políticas permisivas "temporales".
- No escribir directo a `comunidad_chat`, `message_reactions`, `muro_saludos`, `galeria_likes` ni `ganadores_sorteo` desde el cliente.
- No confiar en apodo/puntos/likes/ganador enviados por el cliente.
- No usar email hardcodeado para decidir admin.
- No decidir `owner` por apodo ni por nombre de usuario de comunidad; solo por `app_metadata.role` y vínculo `auth_user_id`.
- No exponer el buzón de sugerencias a `admin`; es exclusivo de `owner`.
- No usar `innerHTML` con datos de usuario sin escapar.
- No poner `{{ }}` en atributos Alpine.
- No usar `@click.stop` en las acciones de la tarjeta de galería (rompe el listener delegado).
- No agregar dependencias/build sin autorización.
- No asumir que `_headers` funciona en GitHub Pages.
- No commitear con la app rota o sin probar.

## 12. Riesgos aceptados / deuda conocida

- Registro de sorteo público: la verificación de Kick es del lado cliente y el rate limit por IP es 30/10 min; un atacante con muchas IPs aún podría llenar la tómbola. El servidor limita a 500 y decide el ganador.
- El ganador no se elimina de `participantes_en_vivo` al sortear (puede volver a ganar en otro giro). Si el producto requiere un ganador por persona, modificar `sortear_ganador_sorteo` para excluirlo.
- Las sesiones caducadas se limpian al iniciar sesión/registrarse, no con un cron. No asumir limpieza inmediata.
- Presencia y "escribiendo" usan canales públicos: un cliente puede falsificar el apodo mostrado. El chat real sí usa el apodo canónico del servidor.
- Subida anónima a Storage: permite spam de almacenamiento y archivos huérfanos si la RPC falla. Aplica a `fotos-galeria` y `avatares-comunidad` (500KB, prefijo `avatar/`). Requiere Edge Function/servicio externo para verificación fuerte.
- Shadowban: `comunidad_chat.oculto` filtra la lectura por RPC y el realtime del cliente, pero la tabla tiene SELECT público; un atacante podría leer mensajes ocultos por REST. No es un control de seguridad fuerte.
- PIN de 4 dígitos: fuerza bruta distribuida posible; el rate limit es por IP.
- GitHub Pages no aplica `_headers`: no hay CSP/HSTS reales en producción.
- CDNs sin SRI (Supabase, Alpine, Bootstrap CSS, Font Awesome, Google Fonts).
- Advisors de Supabase marcan RPCs `SECURITY DEFINER` ejecutables por `anon`; es intencional para usuarios de comunidad sin Supabase Auth. Revisar cada nueva RPC con el mismo criterio.
- Índices marcados como "unused" son de bajo volumen; no eliminarlos sin medir.
