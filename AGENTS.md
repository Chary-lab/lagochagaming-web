# AGENTS.md - LaGochaGaming

Guía operativa breve. Los detalles viven en `docs/` y se leen solo cuando la tarea los necesita.

## 1. Resumen del proyecto

- Sitio estático de La Gocha Gaming: HTML + CSS + JavaScript clásico, sin build, sin bundler y sin dependencias instaladas localmente.
- Páginas: `index.html` (inicio), `comunidad.html` (chat/puntos), `galeria.html` (fotos/likes), `sorteo.html` (sorteo), `cine.html` (GochiWatch), `game.html` (GochitaRunner) y `404.html` (página no encontrada).
- Código compartido: `main.js` (navbar inyectada, tema, toasts, sesión de comunidad, admin, confeti, fachada del chat de Kick) y `style.css`.
- Backend: Supabase (Postgres + RLS + RPC + Realtime + Storage). Proyecto `cydiyaacnyydprgffmkq`.
- Hosting actual: GitHub Pages del repo `Chary-lab/lagochagaming-web` (rama `main`, build legacy), dominio `lagochagaming.com` (archivo `CNAME`). El repo anterior `Chary-lab/LaGochaGaming` se borró por un deployment atascado en Pages; no volver a usarlo.
- Versión actual: ver `VERSION` (SemVer). Changelog: `CHANGELOG.md`.
- App Android: proyecto aparte en `D:\Apk Gocha` (Capacitor + WebView). Su guía vive en `D:\Apk Gocha\AGENTS.md`; este repo publica el APK en `app/` y su `update.json`. Estado actual (2026-11-09): APK publicada v2.0.0, `versionCode` 24, con game mode y pestaña Juego. Trae chat con pestañas Comunidad/Kick, recompensa de 100 puntos por instalar y aviso de directo con notificación local cada 15 min (`LiveCheckWorker`, WorkManager). Los assets empaquetados coinciden byte a byte con `mobile/`, y `build-apk.ps1` lo copia y lo verifica en cada build.

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

## 5. Supabase: reglas no negociables

El catálogo de tablas y RPC se eliminó de esta guía: usa el MCP `supabase` (`list_tables`, `list_extensions`, `list_migrations`, `execute_sql`) para consultar el esquema real antes de escribir. Detalle de políticas, invariantes y Realtime en `docs/supabase.md`.

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

## 6. Seguridad

- **CSP activa por `<meta http-equiv="Content-Security-Policy">`** en las 6 páginas públicas y `404.html`: GitHub Pages no aplica `_headers`, pero la meta sí funciona. `scripts/check.js` es la fuente única: calcula el SHA-256 de cada `<script>` inline y de cada bloque `speculationrules` (con los saltos de línea normalizados a LF, igual que el parser) y **falla si la meta no coincide con el HTML**; `--fix` la reescribe. `script-src` incluye `'unsafe-eval'` porque Alpine evalúa `x-data`/`x-on:` en runtime, así que la CSP limita orígenes y bloquea `object-src`, pero no protege frente a script inline (para eso están los hashes). `frame-ancestors` y `report-uri` **no funcionan en meta**: no fingir que existen. HSTS y el resto de cabeceras siguen sin existir en producción.
- Nunca confiar en el cliente para autorización. La UI puede ocultar botones, pero el servidor debe rechazar.
- Escapar todo HTML dinámico. Los emojis de reacción están limitados a una whitelist en el servidor.
- No registrar tokens, PINs ni datos personales en consola.
- No introducir `target="_blank"` sin `rel="noopener noreferrer"`.
- Las cuentas de comunidad usan PIN de 4 dígitos: es una decisión de producto; no aumentar la superficie de ataque (no permitir cambiar el PIN sin verificación, no exponer hashes).
- Recomendado: revisar los advisors de Supabase tras cada migración. "Leaked password protection" **requiere plan Pro y esta cuenta es Free**, así que no está disponible ni es una tarea pendiente; además solo afectaría a Supabase Auth (admins), porque las cuentas de comunidad usan PIN de 4 dígitos.
- Hay tablas con RLS activo y sin políticas (`app_actualizaciones`, `app_descargas`, `app_instalaciones`, `app_recompensas`, `game_niveles`, `game_progreso`, `game_records`, `game_runs`, `instagram_feed`, `instagram_feed_estado`, `kick_clips`, `kick_config`, `kick_oauth_pendientes`, `kick_sessions`, `logros`, `logros_usuario`, `misiones`, `pregunta_del_dia`, `preguntas_chat`, `puntos_acciones`, `puntos_eventos`, `puntos_topas_rango`, `retos_galeria`, `retos_temas`, `sorteo_participantes`, `sorteos_semanales`, `tiktok_feed`). Es intencionado: solo se acceden por RPC `SECURITY DEFINER`. No añadir políticas sin revisar qué filas quedarían expuestas a `anon`.
- La lectura pública de perfiles es por columna: `anon` tiene SELECT sobre `id, apodo, puntos, rango, genero, avatar_url, bio, links_json, icono_equipado, marco_equipado, titulo_equipado, color_apodo, creado_en, eliminado_en, kick_badges, kick_badges_at, kick_user_id, kick_username, ultima_actividad`. `rol` NO está concedido: no pedirlo en un select desde el cliente (devuelve 401).

## 10. Flujo de trabajo

1. Leer esta guía y el código afectado.
2. Revisar `git status` y el historial reciente.
3. Implementar el cambio mínimo y coherente.
4. Ejecutar checks + pruebas.
5. Actualizar `VERSION`, `CHANGELOG.md` y `sitemap.xml` si corresponde.
6. Commit con `vX.Y.Z - resumen` y push solo si la versión es estable (el usuario lo autoriza).
7. Reportar hallazgos, cambios, pruebas y riesgos pendientes.
8. Usar las skills cuando encajen (`web-ui`, `web-backend`) y el MCP `supabase` para esquema, SQL y logs; `web-research` para docs y versiones. Nunca escribir tokens o secretos en archivos, commits ni prompts; usarlos en memoria y recomendar revocarlos.
9. Mantener el repo limpio y barato de leer: borrar archivos temporales (`_test-*`, probes), VERSION/CHANGELOG/AGENTS sincronizados, caché `?v=X.Y.Z` al día, y usar `grep` o lecturas por rangos en vez de volcar archivos enteros.

## Skills del proyecto

| Tarea | Skill |
|---|---|
| UI, componentes, estilos, responsive, accesibilidad | `web-ui` |
| Esquema, SQL, migraciones, RLS | `web-backend` + MCP `supabase` |
| Documentación de librerías, comparativas, versiones | `web-research` |

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

## Referencias bajo demanda

| Documento | Léelo cuando |
|---|---|
| `docs/frontend.md` | Mapa de archivos, convenciones JS, Alpine, paneles de perfil/ajustes y componentes Gochi |
| `docs/supabase.md` | Políticas RLS, invariantes de integridad, Realtime y telemetría |
| `docs/kick.md` | Chat, sesiones OAuth y clips de Kick |
| `docs/operaciones.md` | Despliegue, release de la app, SEO, SemVer y pruebas antes de commitear |
| `docs/deuda.md` | Riesgos aceptados y deuda conocida |

No cargues estos documentos si la tarea no los necesita.
