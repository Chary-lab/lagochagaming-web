# Changelog - LaGochaGaming

Formato basado en Keep a Changelog. Versionado SemVer (`MAJOR.MINOR.PATCH`).
El historial anterior a 1.5.0 está en los commits `v1.4.x`.

## [1.43.5] - 2026-11-03

### El chat de Kick también vuelve a la app

- El botón "Conectar" del chat de Kick ya usa el retorno profundo del APK.
- La app vuelve a la misma página donde estaba el chat y guarda el token de
  Kick; la conexión se completa sin pasar por la web.
- APK 1.6 (versionCode 9), firmada con la misma keystore.

## [1.43.4] - 2026-11-03

### El login de Kick vuelve a la app

- El OAuth de Kick termina ahora dentro del APK. La web detecta la vuelta
  marcada por la app y la reenvía al esquema `lagochagaming://kick`.
- La app recibe el token y completa el login o la vinculación en Comunidad.
- Los navegadores y las versiones antiguas del APK mantienen el flujo normal.
- APK 1.5 (versionCode 8), firmada con la misma keystore.

## [1.43.3] - 2026-11-03

### APK 1.4fix

- La app avisa de las actualizaciones automáticamente al abrir, sin entrar en
  Ajustes. Comprueba como máximo una vez por hora.
- El aviso incluye la casilla "No volver a mostrar esta versión"; quien la
  marque puede seguir actualizando después desde Ajustes.
- Menú App de la web actualizado a la versión 1.4fix (versionCode 7).

## [1.43.2] - 2026-11-03

### AGENTS.md al día

- Nueva regla de estructura fija: no dividir archivos ni crear otros nuevos.
  `style.css` es un solo archivo, `main.js` otro y cada página un HTML; un
  archivo nuevo solo con autorización explícita.
- Documentado el flujo de Kick: Edge Functions, tablas y registro con Kick.
- Corregido el modelo de admin: `es_admin()` acepta el JWT con
  `app_metadata.role` y una sesión de comunidad con `usuarios_comunidad.rol`
  (`x-comunidad-token`).
- Ampliada la lista de RPC (`obtener_puntos_hoy`,
  `estadisticas_perfil_comunidad`, `otorgar_puntos_accion`, `registrar_puntos`,
  `obtener_avatares_disponibles`, `actualizar_autor_galeria`, `admin_auditar`).
- Añadidos hls.js 1.5.20, el store `sugerencias` y Umami en las 6 páginas.
- Nota corregida: `AGENTS.md` está en UTF-8 sin BOM, no en cp1252.

## [1.43.1] - 2026-11-03

### Limpieza de código huérfano

- Eliminada la función `renderizarMensajes` de `comunidad.html`: no se llamaba
  desde ningún sitio (el chat usa `cargarMensajes` y el store).
- Eliminadas dos reglas CSS sin uso: `.admin-login-error` y
  `.admin-vinculo-aviso`.
- Fuera 16 atributos `id` sin ninguna referencia en HTML, JS ni CSS
  (`cinePlayerOverlay`, `cineSourceBadge`, `cineStatusPill`, `statusSyncText`,
  `btn-cargar-mas-chat`, `gridPendientes`, `imageAuthorInput`,
  `imageTitleInput`, `tab-moderacion`, `uploadFeedback`, `btn-enviar-muro`,
  `muro-mensaje`, `muro-mensajes-container`, `sobre-la-gocha`,
  `lista-participantes-publico`, `top-ganadores-grid`).
- `AGENTS.md`: corregida la línea de CDNs, que citaba unos que ya no se usan.

## [1.43.0] - 2026-11-03

### Auditoría, registro con Kick y limpieza

- Arreglado el icono `i-solid-ban` del panel admin: se usa en la tarjeta
  "Sin permisos" pero no existía en `img/icons.svg`.
- Limpieza de `img/icons.svg`: fuera 7 símbolos sin uso (Google Drive, Twitch,
  Twitter, arrow-right, globe, moon, volume-high).
- Eliminado `tienda_tab_content.txt`, archivo huérfano que se servía suelto.
- `README.md`: corregido el stack (sin Bootstrap ni Font Awesome por CDN) y
  documentados `?v=X.Y.Z` y `.nojekyll`.
- Nuevo botón "Registrarse con Kick" en el modal de registro: mismo OAuth que
  "Conectar con Kick", pensado para quien no sabe que ya puede entrar así.
- Tras registrarse con Kick se abre Ajustes con el aviso de completar perfil
  (género y avatar).
- Supabase: índice `idx_puntos_eventos_accion` para la FK que no tenía.
- `AGENTS.md`: documentadas las insignias de Kick, la píldora de puntos diarios,
  las tablas con RLS sin políticas y los grants de columna de `anon`.

## [1.42.1] - 2026-11-03

### Los puntos del día pasan al anillo del navbar

- Quitada la línea "Hoy: X / Y pts" que se mostraba bajo el perfil en Comunidad.
  Esa información vive ahora en la píldora de anillo del navbar.
- `pintarPuntosHoy()` delega en `pintarPuntosDia()`, así el anillo se actualiza
  al cargar la página y cada vez que se suman puntos.

## [1.42.0] - 2026-11-03

### Insignias pegadas al nombre, perfil público completo y puntos del día en el navbar

- Chat: las insignias de Kick van agrupadas en un bloque pegado al nombre del
  autor (antes se repartían por toda la fila por el `space-between` del header).
  La fecha y el botón de borrar quedan a la derecha con `margin-left: auto`.
- Perfil público: muestra las insignias de Kick vigentes del usuario y una
  rejilla de estadísticas (mensajes, reacciones dadas y recibidas, saludos,
  likes de galería y puntos de hoy). Nueva RPC `estadisticas_perfil_comunidad`
  con `SECURITY DEFINER` y grant a anon/authenticated.
- Navbar: píldora compacta de puntos diarios con anillo de progreso
  (`hoy/tope`), pulso al ganar puntos y "+N" flotante; oculta sin sesión,
  solo anillo en pantallas pequeñas y sin animación con
  `prefers-reduced-motion`.
- `window.insigniasKickDe()` centraliza el filtrado de insignias (30 días,
  máximo 6) para el chat y el perfil público.

## [1.41.0] - 2026-11-03

### Pase visual del navbar, Kick arreglado y buzón para admins

- Arreglado "Conectar con Kick": el arranque por `?kick=1` vivía en un segundo
  `DOMContentLoaded` que nunca se ejecutaba, así que el clic solo recargaba la
  página. Ahora el flujo arranca dentro del listener principal y
  `entrarConKickComunidad()` queda expuesta para el navbar.
- El menú Login se mueve al lado del botón de tema, alineado a la derecha.
- Navbar con vida: los enlaces y los menús plegables (App y Login) son píldoras
  con hover, foco visible, pulsación y transiciones; el botón de tema gira al
  pasar el ratón. Los `<summary>` ya no se quedan sin estilo.
- Insignias de Kick del chat rediseñadas: píldoras compactas con icono propio,
  color por tipo y pegadas al nombre del autor.
- El buzón de sugerencias se abre también para los admins (McChary), no solo
  para el owner: pestaña, panel y RPCs `owner_*_sugerencia` aceptan `es_admin()`;
  la política de lectura pasa a `admin lee sugerencias`.

## [1.40.0] - 2026-11-03

### Menú Login único y admin por rol de comunidad

- Nuevo menú plegable "Login" en el navbar con tres acciones: Iniciar sesión
  (apodo y PIN), Conectar con Kick y Registrarse.
- "Conectar con Kick" abre a la vez la sesión del chat de Kick y el vínculo con
  la cuenta de comunidad; si no hay sesión de comunidad, entra o crea el perfil.
- Se quitan los botones de login duplicados del chat de comunidad: el acceso
  vive solo en el navbar.
- El panel de administración usa la sesión de comunidad y el rol nuevo
  `usuarios_comunidad.rol`; McChary es admin y LaGochaGaming owner. Ya no hace
  falta el login oculto de Supabase Auth.
- `es_admin()`/`es_owner()` aceptan el token de comunidad por cabecera
  `x-comunidad-token`, también en las políticas RLS.

## [1.39.0] - 2026-11-03

### Vincular Kick sin auto-vínculos

- Se retira el auto-vínculo por apodo: nadie hereda el perfil de otro por
  escribir su nombre en Kick.
- "Entrar con Kick" solo entra si la cuenta ya está vinculada. Si el apodo
  existe sin vínculo, avisa y pide entrar con apodo y PIN.
- Nuevo aviso en el perfil de la comunidad y botón en Ajustes para vincular
  Kick. Vincular exige la sesión de comunidad y la de Kick a la vez.
- McChary y LaGochaGaming quedan vinculadas a sus cuentas de Kick.
- Insignias de Kick (mod, VIP, suscriptor, fundador, gifter, OG) en el chat de
  comunidad, solo si el usuario escribió en Kick en los últimos 30 días.

## [1.38.0] - 2026-11-03

### Entrar a la comunidad con Kick

- Nuevo botón "Entrar con Kick" en el acceso de la comunidad: reutiliza la
  sesión que ya se abre en el chat, sin pedir apodo ni PIN.
- Si el apodo de Kick coincide con una cuenta de comunidad sin vincular, se
  vincula sola en el primer acceso.
- Si no existe, el perfil se crea en ese momento con el nombre y el avatar de
  Kick; esas cuentas no tienen PIN y entran siempre por Kick.
- Las cuentas con PIN siguen funcionando exactamente igual.

## [1.37.2] - 2026-11-03

### El chat ya carga al volver del login

- Al volver del login, el chat se quedaba en "Cargando mensajes…" porque solo
  pedía el historial y abría el canal en vivo cuando no había login pendiente.
- Ahora carga el historial y se suscribe al canal siempre, haya vuelta de login
  o no.

## [1.37.1] - 2026-11-03

### Login de Kick arreglado

- El login devolvía a la web, pero la app de Kick solo admite una Redirect URL y
  la registrada es la función callback de Supabase. Kick respondía
  `invalid authorization request`.
- Ahora el retorno pasa por `kick-oauth-callback`: canjea el código, guarda la
  sesión y devuelve al usuario a la página donde estaba (home o GochiWatch).
- El `state` y el verificador PKCE se generan en el servidor y caducan a los
  15 minutos; el navegador ya no guarda nada del login a medias.

## [1.37.0] - 2026-11-03

### Chat propio de Kick con sesión persistente

- La home y GochiWatch ya no cargan el iframe de Kick: el chat se pinta en la
  propia página, con el mismo aspecto en las dos.
- Login con OAuth de Kick (PKCE): la sesión se guarda en el navegador y se
  mantiene al cambiar de página, también entre home y GochiWatch.
- Mensajes en directo con emotes, badges, color de usuario, respuestas y hora.
- El envío pasa por una Edge Function: el token de Kick nunca llega al HTML y
  el secreto de la app se queda en el servidor.
- Los mensajes se guardan 48 h; la lectura pública se limita a las últimas 12 h.
- Aviso claro si Kick pide seguir el canal, si la sesión caduca o si hay que
  esperar entre mensajes.

## [1.36.0] - 2026-11-03

### Menú App en la navbar

- Nuevo desplegable "App" con icono de Android en las cinco páginas (se genera
  desde `main.js`, como el resto del menú).
- Opción Android: descarga directa del APK firmado (v1.3, 4,2 MB, Android 7+),
  con evento de Umami para medir descargas.
- Opción iPhone/iPad: reloj y "En camino", sin enlace, porque todavía no hay app.
- Se cierra al hacer clic fuera, con Escape o al descargar; en móvil se integra
  dentro del menú hamburguesa a ancho completo.

## [1.35.2] - 2026-11-03

### APK firmada y publicada

- `app/LaGochaGaming.apk` pasa a ser la build **release** firmada con la clave
  de release (`CN=LaGochaGaming`), no la de debug. Pesa 4,18 MB.
- `app/version.json` actualizado con el SHA-256 y el tamaño nuevos; el
  actualizador interno de la app ya puede leerlo en producción.
- La clave vive fuera del repo (`C:\Users\Administrator\.lagocha`). Sin ella no
  se pueden publicar actualizaciones: hay que guardar copia.

## [1.35.1] - 2026-11-03

### Home: franja compacta en vez de bloque largo

- `#sobre-la-gocha` pasa de 194 palabras y tres `h2` a una franja de tres
  tarjetas (Quién es / Dónde verla / La comunidad), movida justo antes del
  footer para no cortar el flujo entre YouTube y el muro.
- Se conservan los enlaces internos y externos que usa Google para entender la
  entidad, con menos altura y sin párrafos largos.

## [1.35.0] - 2026-11-03

### SEO: rastreo, entidad y contenido de apoyo

- Footer con enlaces estáticos a Inicio, Comunidad, Galería, GochiWatch y
  Sorteo en las cinco páginas. Antes solo existían en el navbar inyectado por
  `main.js`, así que las subpáginas no tenían enlaces entrantes en el HTML.
- Home: `title`, `description`, Open Graph y Twitter Card con las variantes
  reales (`La Gocha Gaming`, `Gochita`); H1 pasa de `LAGOCHAGAMING` a
  `La Gocha Gaming`.
- Home: sección visible "Quién es La Gocha" / "Dónde ver a La Gocha" /
  "GochiWatch y GochiSorteo".
- `cine.html` y `sorteo.html`: texto propio sobre GochiWatch y GochiSorteo.
- Schema `Person`: `description` y `knowsAbout`.
- `sitemap.xml`: `lastmod` a 2026-11-03.
- Caché de `style.css`/`main.js` actualizada a `?v=1.35.0`.

## [1.34.3] - 2026-11-02

### Feeds más calientes y menos polling

- Las Edge Functions `instagram-feed`, `tiktok-feed` y `kick-clips` guardan la
  caché 40 minutos en vez de 25, así el primer visitante tras el cron no paga
  la recarga.
- El indicador de "escribiendo" de comunidad pasa de 500 a 1200 ms.
- Caché de `style.css`/`main.js` actualizada a `?v=1.34.3`.

## [1.34.2] - 2026-11-02

### Capibara dormido en comunidad

- La vista offline de comunidad usa el capibara dormido de GochiWatch
  (`img/mcchary/empty.webp`) en vez de la imagen de stream apagado.
- La imagen se ajusta con `object-fit: contain` para no recortarla.
- Caché de `style.css`/`main.js` actualizada a `?v=1.34.2`.

## [1.34.1] - 2026-11-02

### Carga más ligera

- El chat de Kick ya no se carga al abrir la home ni GochiWatch: se muestra
  una fachada con botón y el iframe entra al hacer scroll, clic o al terminar
  la carga de la página.
- `supabase-js` pasa a `defer` en comunidad, galería y sorteo.
- Eliminadas `img/1.jpg` e `img/2.jpg`; todas las páginas comparten `img/3.jpg`
  como imagen Open Graph.
- La vista offline de comunidad usa `img/stream-offline.webp`.
- Caché de `style.css`/`main.js` actualizada a `?v=1.34.1`.

## [1.34.0] - 2026-11-02

### Navbar compartida y etiqueta EN VIVO

- La navbar se inyecta desde `main.js` en las 5 páginas: un solo sitio para
  editar enlaces, orden y estado activo.
- Nuevo pill `EN VIVO` junto al logo cuando el canal está en directo, además
  del borde verde pulsante. Se oculta al estar offline.
- Eliminados los avisos antiguos de directo: overlay superior, toast inferior
  y su lógica asociada.
- Caché de `style.css`/`main.js` actualizada a `?v=1.34.0`.

## [1.33.3] - 2026-11-02

### Borde blanco del reel

- El iframe del reel se sobredimensiona un ~4% para que el borde blanco del
  embed de Instagram quede fuera del recorte.
- Caché de `style.css`/`main.js` actualizada a `?v=1.33.3`.

## [1.33.2] - 2026-11-02

### Reels de Instagram a pantalla completa

- El marco del reel pasa a 9:16 y el embed se escala y recorta para llenar
  el modal: fuera la cabecera, el pie y las barras negras laterales.
- Caché de `style.css`/`main.js` actualizada a `?v=1.33.2`.

## [1.33.1] - 2026-11-02

### Reels de Instagram sin marco

- El modal recorta la cabecera y el pie del embed de Instagram ("View more
  on Instagram") y deja solo el vídeo del reel.
- Caché de `style.css`/`main.js` actualizada a `?v=1.33.1`.

## [1.33.0] - 2026-11-02

### Estado desconectada en la home

- Cuando el canal no está en vivo, el player de Kick se sustituye por una
  imagen de la Gocha desconectada sobre un marco oscuro, con etiqueta
  "Desconectada" y botón "Seguir en Kick".
- El iframe del player solo se carga al detectar el directo y se descarga al
  volver a offline, para no dejar vídeo en segundo plano.
- Nueva imagen `img/stream-offline.webp` (75 KB, 1408x768) convertida desde JPG.
- Caché de `style.css`/`main.js` actualizada a `?v=1.33.0`.

## [1.32.3] - 2026-11-02

### Limpieza de los clips fijos

- Se quitaron los tres clips fijos de respaldo de la home: la sección muestra
  solo los últimos clips de Kick.
- Si la Edge Function falla, aparece un aviso con enlace a los clips del canal
  en Kick en vez de tarjetas antiguas.
- CSS sin las clases `clip-thumb-1/2/3` y caché actualizada a `?v=1.32.3`.

## [1.32.2] - 2026-11-02

### Reproducción real de los clips

- Chromium respondía `maybe` a `canPlayType('application/vnd.apple.mpegurl')`,
  así que se intentaba HLS nativo y el vídeo quedaba en 0:00 con
  `MEDIA_ERR_SRC_NOT_SUPPORTED`. Ahora se usa `hls.js` siempre que esté
  soportado y el HLS nativo queda solo como respaldo (Safari).
- Si `hls.js` falla de forma fatal, se destruye la instancia y se intenta el
  reproductor nativo.
- Verificado en Chromium real: el clip carga, muestra duración y reproduce.
- Caché de `style.css`/`main.js` actualizada a `?v=1.32.2`.

## [1.32.1] - 2026-11-02

### Corrección del reproductor de clips

- El player embebido de Kick solo reproduce directos y VOD, así que mostraba
  "LaGochaGaming is offline" al abrir un clip. Ahora el modal reproduce el HLS
  del clip con `hls.js` (Safari usa su soporte nativo).
- La Edge Function `kick-clips` devuelve también la URL `video` del clip.
- Los tres clips fijos de respaldo abren Kick en una pestaña nueva.
- Caché de `style.css`/`main.js` actualizada a `?v=1.32.1`.

## [1.32.0] - 2026-11-02

### Últimos clips de Kick en la home

- La sección "Top clips" pasa a "Últimos clips" y se alimenta sola con los
  clips más recientes del canal mediante la Edge Function `kick-clips`
  (caché de 25 min y refresco con `pg_cron` cada 20 min).
- Cada tarjeta muestra creador, duración y vistas; si la función falla quedan
  los tres clips fijos como respaldo.
- Los clips se reproducen en el modal con el reproductor oficial de Kick.
- Caché de `style.css`/`main.js` actualizada a `?v=1.32.0`.

## [1.31.3] - 2026-11-01

### Menú simplificado y estado vacío de GochiWatch

- Menú principal: se quitan "Directo" y "Clips"; el orden queda Inicio,
  Comunidad, Galería, GochiWatch y Sorteo en las cinco páginas.
- GochiWatch: sin video, el reproductor muestra al capibara dormido
  (`img/mcchary/empty.webp`) con animación suave y mensaje al hacer clic.
  Respeta `prefers-reduced-motion` y se oculta en el estado de error.
- Caché de `style.css`/`main.js` actualizada a `?v=1.31.3`.
- Limpieza de CSS muerto: reglas sin uso (`admin-instructions*`, `admin-page*`,
  `btn-login`, `btn-admin-logout`, `btn-danger-dark`, `mp-meta`, `mp-links-more`,
  `mp-sr-only`, `nav-user-icon`, `tab-copy`, `media-modal-open`), tokens
  `--accent-2`/`--accent-3` y reglas duplicadas exactas.

## [1.31.2] - 2026-11-01

### Versión estable: repo nuevo y Supabase al día

- Migración a un repo limpio (`Chary-lab/lagochagaming-web`) con el historial
  reconstruido desde 1.28.1 hasta 1.31.1. El repo anterior se borró porque un
  deployment fantasma de GitHub Pages bloqueaba toda publicación nueva con
  `400 in progress deployment`; el código nunca estuvo roto.
- Mismo dominio, mismas rutas y mismo contenido: sin cambios de SEO, canonical,
  sitemap ni Search Console.
- Supabase: `registrar_puntos` estaba ejecutable por `anon` y `authenticated`
  (permitía sumar puntos a cualquier `usuario_id` por REST). Se revocó el
  `EXECUTE`; solo queda para `service_role` y las funciones `SECURITY DEFINER`
  que la usan internamente. Verificado: `anon` recibe 401 y una RPC pública
  normal responde 200.
- Eliminadas dos RPC sin uso ni referencia: `registrar_ganador_sorteo` y
  `obtener_rangos`.
- Limpieza de contenido huérfano: 1 mensaje de prueba en el chat y 2 filas
  viejas de `auth_rate_limit`.
- Auditoría: 22 tablas, todas en uso; 36 RPC del cliente presentes con su firma;
  `admin_listar_usuarios` devuelve `en_linea` y `ultima_actividad`; Edge
  Functions activas con cron cada 20 min; sin filas huérfanas en likes,
  reacciones, puntos, canjes ni sesiones.

## [1.31.1] - 2026-11-01

### Cierre de sesión de cuentas vinculadas

- Al cerrar sesión desde ajustes con una cuenta Auth vinculada (owner/admin),
  también se cierra la sesión de Supabase Auth.
- Se marca `comunidad_logout_explicito` para que la sincronización automática
  no vuelva a abrir la sesión de comunidad al recargar.
- La marca se limpia al iniciar sesión con Auth o con PIN de comunidad.
- Evita que una sincronización en curso reescriba el token después del cierre.

## [1.31.0] - 2026-11-01

### Estado en línea en Usuarios

- Nuevo `latido_comunidad`: actualiza `ultima_actividad` cada 60 segundos
  desde cualquier página, no solo Comunidad.
- `admin_listar_usuarios` devuelve `ultima_actividad` y `en_linea` (actividad
  en los últimos 2 minutos).
- El panel de Usuarios muestra un indicador verde “En línea” o gris “Offline”,
  con la última actividad en el título. Se actualiza cada 30 segundos mientras
  el panel está abierto. Ya no usa “Activo” para el estado de sanción.

## [1.30.2] - 2026-11-01

### Moderación del chat

- Nuevo RPC `admin_eliminar_mensaje_chat` para que `admin` y `owner` borren
  mensajes del chat. El borrado directo desde el cliente queda bloqueado por
  RLS; la RPC valida `es_admin()` y registra `eliminar_mensaje_chat` en
  `admin_audit_log`.
- Botón de eliminar visible en cada mensaje solo con sesión admin/owner, con
  confirmación. El mensaje desaparece para todos por Realtime.

## [1.30.1] - 2026-11-01

### Correcciones

- Eliminados los iconos de administración del navbar, que podían duplicarse
  al refrescarse la sesión. El panel se abre solo desde el enlace discreto
  “Acceso” del footer.
- Galería: eliminada la pestaña “Moderación”; el contenido de fotos pendientes
  se muestra directamente al abrir el panel.

## [1.30.0] - 2026-11-01

### Roles, vínculo Auth-comunidad y panel global

- `chary@admin.com` pasa a `owner` (rol superior); `gocha@admin.com` sigue como
  `admin`. `es_admin()` acepta ambos y se añade `es_owner()`.
- Vínculo `usuarios_comunidad.auth_user_id`: McChary y LaGochaGaming quedan
  asociados a sus cuentas de Auth. Se crea el perfil reservado de LaGochaGaming
  con PIN aleatorio (su acceso es por Auth).
- `sesion_comunidad_vinculada()` abre o reutiliza una sesión de comunidad para
  el usuario Auth vinculado; el cliente la sincroniza al cargar y al iniciar
  sesión, sin pedir PIN.
- Panel global de administración en modal (sin página nueva): iconos en el
  navbar de todas las páginas, login Auth, Buzón (solo owner), Usuarios y
  Auditoría (admin/owner).
- Buzón de sugerencias: listar, contar no leídas, marcar leída/nueva y borrar
  con `owner_marcar_sugerencia` y `owner_eliminar_sugerencia`.
- La galería conserva solo la moderación de fotos pendientes; Usuarios y
  Auditoría salen de su panel y pasan al panel global.
- Nuevos iconos del sprite: `envelope`, `users` y `shield-halved`.

## [1.29.0] - 2026-10-31

### Firma del creador y sugerencias

- Footer en las 5 páginas: capibara de McChary, “Creado por McChary /
  Creator Engineer” y botón Sugerencias.
- 404 con la ilustración de depuración; muro y galería vacíos con el capibara
  dormido.
- Modal de sugerencias (5–500 caracteres) con tabla `sugerencias` y RPC
  `enviar_sugerencia`: máximo 2 por día por IP, lectura solo admin.
- `creator: McChary` en el schema `WebSite`.

## [1.28.1] - 2026-10-31

### Documentación

- `AGENTS.md` actualizado: SEO/AEO, sprite de iconos y pruebas nuevas.
- Eliminados `beta.md` y `seo.md`; lo vigente vive en `AGENTS.md`.

## [1.28.0] - 2026-10-31

### Hero fusionado e iconos SVG

- El hero añade una línea de contenido (TikTok shorts, reels, clips, comunidad,
  GochiWatch) y una fila de redes; sin sección nueva ni página extra.
- Fuera Font Awesome: sprite local `img/icons.svg` con 53 símbolos (Font Awesome
  Free 6.6.0, CC BY 4.0), `.icon` en CSS y `<use>` en el markup.
- Iconos dinámicos migrados: tema claro/OLED, enlaces de perfil, redes de
  comunidad y estados de cine.
- CSP sin `cdnjs.cloudflare.com`.

## [1.27.1] - 2026-10-31

### Vuelta al reproductor de YouTube

- Se retira la fachada click-to-load: vuelve el iframe de la lista como antes.
- Se mantiene el `preload` del hero.

## [1.27.0] - 2026-10-31

### Rendimiento: YouTube bajo demanda

- Fachada click-to-load para la lista de YouTube: el iframe no se crea hasta
  que el usuario pulsa (menos red y JS de terceros al cargar).
- `preload` de la imagen del hero (`fono.webp`, 68 KB) con `fetchpriority=high`.

## [1.26.1] - 2026-10-31

### FAQ después del muro

- La sección de preguntas frecuentes pasa después del muro de saludos.
- Respuesta “¿Quién es La Gocha?” ampliada: TikTok shorts, reels de IG,
  directos, clips, comunidad y cine.

## [1.26.0] - 2026-10-31

### Analítica Umami

- Script de Umami (`cloud.umami.is`) en las 5 páginas y en el 404, limitado
  a `lagochagaming.com` con `data-domains`.
- CSP de `_headers` actualizada con `cloud.umami.is` en `script-src` y
  `connect-src`.

## [1.25.1] - 2026-10-31

### Limpieza SEO

- Fuera el `dns-prefetch` de `juicer.io` (servicio retirado) y la variable
  muerta `paginaActualMuro`.

## [1.25.0] - 2026-10-31

### SEO P1: FAQ y H1 de galería

- FAQ visible en la home con 6 preguntas y enlaces internos.
- `FAQPage` en JSON-LD (contenido visible, sin datos inventados).
- H1 de galería → “Galería de la comunidad”.

## [1.24.0] - 2026-10-31

### SEO P0: entidad, schema y rastreo

- JSON-LD `Person` + `WebSite` en la home (con `sameAs` a Kick, TikTok,
  Instagram, YouTube y Discord).
- `BreadcrumbList` en comunidad, galería, sorteo y cine.
- `llms.txt` con resumen y URLs para motores de IA.
- `404.html` con diseño propio y `noindex`.
- `og:image` y `twitter:image` propias por página, con `alt`.
- `scripts/check.js` ignora `application/ld+json` (antes lo validaba como JS).

## [1.23.4] - 2026-10-31

### Auditoría y limpieza

- CSS muerto fuera: editor de perfil viejo (~127 líneas), panel de pendientes,
  `social-feed-box`, `leyenda-brillo`, `shop-card`, `canal-title`, `yt-player`
  y `body.modal-perfil-open`.
- `main.js`: quitado `panelPendientes` y el alias `cerrarModalPerfil`.
- Comunidad: quitado el alias `actualizarFlechasTienda`.
- `_headers`: CSP con `instagram.com` y `tiktok.com` en `frame-src`; fuera
  `juicer.io`.
- `sitemap.xml` con `lastmod` al día; `beta.md` marcado como histórico.
- Auditoría de consola: 0 errores/excepciones en las 5 páginas.

## [1.23.3] - 2026-10-31

### Botón “Cargar más saludos” visible

- `.btn-cargar-mas` nace con `display: none` y el JS antiguo lo mostraba;
  al pasar a Alpine quedó oculto. Regla `#btn-cargar-mas-muro:not([hidden])
  { display: inline-block; }` para mostrarlo cuando `hayMas` es true.

## [1.23.2] - 2026-10-31

### Muro sin scroll interno

- Quitado `max-height: 600px` y `overflow-y: auto` de `.muro-grid`: las
  tarjetas crecen y scrollea la página, sin scrollbar anidado.
- “Cargar más saludos” sigue paginando de 12 en 12.

## [1.23.1] - 2026-10-31

### Scroll horizontal y rangos del muro

- Reset global `box-sizing: border-box`: elimina el desborde de 27 px que
  provocaban `width: 100%` + padding (form del muro y hero) en desktop y móvil.
- El muro pide el rango actual de los autores verificados y deja de mostrar la
  instantánea vieja del saludo (McChary vuelve a Polvo Cósmico).
- `AGENTS.md`: nota de overflow a 1400/390.

## [1.23.0] - 2026-10-31

### Sorteo completo en Alpine

- Lista manual con `x-for` y store (`sorteo.manual`): agregar, quitar y limpiar.
- Ganadores oficiales con `x-for` (`sorteo.ganadores`), estado de carga y vacío.
- La ruleta manual lee la lista del store; fuera el render con `innerHTML`.
- Corregido `:hidden` con `.length` numérico: un `0` mantenía ocultos los
  estados vacíos del muro y de ganadores.

## [1.22.0] - 2026-10-31

### Subida de galería en Alpine y auditoría

- Subida con el store `subida`: título, autor admin, drag & drop, validación,
  magic bytes, Storage, RPC y feedback reactivo.
- Eliminados el render manual y las funciones sin uso del muro; quitadas
  constantes muertas de cine.
- AGENTS: política “Alpine primero”, stores por página y reglas de visibilidad,
  modales y datos.

## [1.21.0] - 2026-10-31

### Muro completo y cine en Alpine

- Muro con `x-for`: tarjetas, autor con rango, enlace al perfil, reacciones,
  burbuja rápida, borrado admin, paginación y estado vacío desde el store.
- Realtime de saludos y reacciones escribe en el store (sin reconstruir DOM).
- Cine con store `cine` para overlay, estado, fuente, botones de unirse,
  enlace a YouTube y espectadores. El motor de sincronización no cambia.
- Galería: lightbox y panel admin ya eran Alpine; sin cambios funcionales.

## [1.20.0] - 2026-10-31

### Toasts y muro en Alpine

- Toasts con el store `toast`: mensaje, variante de error y auto-cierre a los
  3 s sin timers globales.
- Formulario del muro con el store `muro`: `x-model` en autor/mensaje,
  feedback de éxito/error, bloqueo mientras envía y puntos.
- El render de tarjetas y el realtime del muro siguen en JS; pasarlos a
  `x-for` queda para otra fase.

## [1.19.0] - 2026-10-31

### Modal de perfil y menú móvil en Alpine

- Modal de perfil reescrito sobre el store Alpine `perfil`: pestañas, avatar,
  género, bio, redes, guardado y perfil público sin `innerHTML` ni listeners a
  mano.
- Foco atrapado con `x-trap.noscroll`; visibilidad con `:hidden`.
- Menú móvil con el store `ui`: apertura/cierre, `aria-expanded`, Escape y
  cierre al cambiar a escritorio.
- `@alpinejs/focus` cargado en las 5 páginas.

## [1.18.0] - 2026-10-31

### Sin Bootstrap y Alpine en todas las páginas

- Retirado Bootstrap 6 alpha de las 5 páginas. Las utilidades que se usaban
  (`.nav-right`, `.visually-hidden`) son CSS propio.
- Alpine + `@alpinejs/focus` cargados con `defer` en index y cine; ya están en
  todas las páginas.
- El modal de fotos/vídeos de los feeds pasa a `$store.media`: `x-trap`,
  cierre con Escape/fondo/botón, foco devuelto y sin manipulación de `iframe`
  a mano.
- Visibilidad con `:hidden` + `[hidden]`; `x-show` no es fiable con
  `display: flex` en este build.

## [1.17.1] - 2026-10-31

### Perfil público sin pestañas de ajustes

- Regla global `[hidden] { display: none !important; }`: el `display: flex` de
  `.modal-perfil-tabs` ya no pisa el atributo `hidden`.
- El perfil público de otro usuario no muestra Perfil/Ajustes ni permite abrir
  sus ajustes.

## [1.17.0] - 2026-10-30

### Miembro desde y perfil desde la galería

- Nueva columna `usuarios_comunidad.creado_en` con backfill desde el primer
  chat/muro o la última actividad; lectura pública.
- El perfil propio y el público muestran “Miembro desde <mes año>”.
- El autor de cada foto de la galería abre su perfil público (clic o Enter).

## [1.16.0] - 2026-10-30

### Perfiles públicos y editor de redes minimalista

- El editor de enlaces queda solo con Instagram, Discord, TikTok y Kick; fuera
  X/Twitter, YouTube, Twitch y Web.
- Perfil propio más limpio: chips de rango, puntos y género; sin botones
  duplicados.
- Nuevo perfil público de otros usuarios desde el ranking, usuarios en línea,
  el chat y el muro: avatar, rango, puntos, género, bio y redes. Sin ajustes.
- `genero` pasa a ser columna pública de solo lectura.
- Eliminado el botón inferior “Editar perfil y ajustes” del panel de Comunidad;
  queda el lápiz del panel y el acceso desde el navbar.

## [1.15.1] - 2026-10-30

### Perfil, rangos y navbar

- Perfil: fuera los botones “Editar perfil y ajustes” y “Cerrar sesión”; las
  pestañas ya cambian de vista y el cierre de sesión vive en Ajustes.
- Perfil: rango y puntos como chips bajo el nombre, con el relieve del rango.
- Panel de rangos: filas simétricas con columna derecha para puntos y
  multiplicador; etiquetas TÚ y MÁXIMO integradas sin solaparse.
- Navbar: chip con icono de rango y puntos junto al avatar; se actualiza al
  ganar puntos y se oculta en móvil.

## [1.15.0] - 2026-10-30

### Puntos en toda la web

- Nuevo sistema de puntos por acciones: visita diaria (+2), chat (+1), muro
  (+2), reacciones (+1), likes (+1), subir foto (+3) y tiempo conectado
  (multiplicador del rango).
- Topes diarios por rango: 60 / 85 / 120 / 165 / 220 / 300. Además, tope por
  acción e idempotencia por objetivo para evitar farmeo.
- Los puntos se otorgan dentro de las RPC existentes (`enviar_mensaje_chat`,
  `publicar_saludo_muro`, `establecer_reaccion`, `establecer_reaccion_muro`,
  `incrementar_likes`, `publicar_foto_galeria`, `incrementar_puntos_comunidad`
  y `validar_sesion_comunidad`). No hay RPC pública para otorgar puntos.
- Rangos recalibrados: 0–99, 100–399, 400–999, 1000–1999, 2000–3499, 3500+.
- Tick de tiempo conectado en todas las páginas (`main.js`), excepto Comunidad
  que mantiene el suyo.
- Aviso “+N pts” al comentar, publicar en el muro, reaccionar o dar like.
- Nuevas tablas `puntos_acciones`, `puntos_eventos`, `puntos_topas_rango` y RPC
  `obtener_puntos_hoy`. El perfil muestra “Hoy: X / Y pts”.

## [1.14.0] - 2026-10-30

### Lightbox de Instagram y TikTok

- Las tarjetas de los feeds abren un reproductor superpuesto en la misma
  página, sin pestaña nueva.
- TikTok usa el player oficial `player/v1/<id>`; los reels de Instagram el
  embed `/p/<shortcode>/embed/`; las fotos se abren en grande.
- Cierre con X, Esc o clic en el fondo. Al cerrar se destruye el iframe (corta
  el audio), se libera el scroll y el foco vuelve a la tarjeta.
- Botón “Abrir en TikTok/Instagram” dentro del modal como respaldo si el embed
  pide login o está bloqueado.
- El @usuario aparece junto al título de cada feed, enlazado al perfil con
  subrayado animado.

## [1.13.2] - 2026-10-30

### Guía de trabajo

- Concretados los pasos 8 y 9 de `AGENTS.md`: skills y MCP preferidos, manejo de
  tokens en memoria, limpieza de temporales y lectura eficiente del repo.

## [1.13.1] - 2026-10-30

### Simetría de los feeds

- Las tarjetas de Instagram usan la misma proporción que TikTok (4:5). Ambas
  columnas quedan con 6 tarjetas y la misma altura.
- Sin cambios en la carga de datos.

## [1.13.0] - 2026-10-30

### Feed de TikTok propio (sin embed)

- Sustituido el embed de TikTok por una rejilla propia servida por la Edge
  Function `tiktok-feed`: 6 últimos videos con portada, vistas y enlace a
  TikTok. Sin iframe y sin `overload-protect triggered`.
- La función obtiene los IDs desde el embed público, extrae portada, título y
  estadísticas de cada página de video, y cachea el resultado en `tiktok_feed`.
  Un cron de `pg_cron` la refresca cada 20 minutos.
- Proxy de imágenes propio (solo hosts `tiktokcdn`) para evitar el bloqueo de
  hotlink del CDN.
- Nueva tabla `tiktok_feed` (solo `service_role`).

## [1.12.2] - 2026-10-30

### TikTok bajo demanda

- El embed de TikTok ya no se carga automáticamente: la tarjeta muestra
  “Ver los últimos videos” y monta el iframe al pulsar. Evita el mensaje
  `overload-protect triggered` que TikTok devuelve al limitar cargas por IP.
- Se mantiene el recorte del pie del embed y el enlace al perfil.

## [1.12.1] - 2026-10-30

### TikTok sin pie del embed

- Recortado el iframe del embed de TikTok (400 px + `scrolling="no"`) para
  ocultar la barra inferior con “TikTok / Política de privacidad / Abrir TikTok”.
- Se mantiene el enlace “Ver perfil en TikTok” bajo el widget.

## [1.12.0] - 2026-10-30

### Feed de Instagram propio (sin Juicer)

- Sustituido el iframe de Juicer del feed de Instagram por una rejilla propia
  servida por la Edge Function `instagram-feed`: 6 últimas publicaciones con
  miniatura, icono de vídeo y likes, enlazadas a Instagram.
- La función consulta el perfil público de `@oscurostefany`, normaliza los datos
  y los cachea en la tabla `instagram_feed`; un cron de `pg_cron` la refresca
  cada 20 minutos. Si Instagram responde 401/429 se devuelve la última copia.
- Las imágenes pasan por un proxy de la propia función (Instagram envía
  `cross-origin-resource-policy: same-origin` y el navegador bloqueaba el
  hotlink); solo se permiten hosts `cdninstagram.com` y `fbcdn.net`.
- Fallback con enlace al perfil si la función no responde.
- Nueva tabla `instagram_feed` (solo `service_role`) y extensiones `pg_net` y
  `pg_cron` habilitadas.

## [1.11.0] - 2026-10-30

### Feed de TikTok

- Sustituido el iframe de Juicer del feed de TikTok (`/lagochagaming/iframe`,
  devolvía 404) por el embed oficial de creador de TikTok para
  `@lagochagaming11`, que se actualiza solo con los últimos videos publicados.
- Nota bajo el widget con enlace directo al perfil.
- La columna de TikTok usa altura propia (470 px) para no dejar hueco blanco y
  la rejilla social alinea las tarjetas al inicio.
- El embed carga con `loading="lazy"` y sin inyectar scripts de terceros en la
  página.
- Se retiró la función temporal de sondeo `tiktok-probe` usada para verificar el
  acceso a TikTok desde Supabase.

## [1.10.0] - 2026-10-30

### Línea de tiempo cósmica de rangos

- Sustituida la escalera Semilla / Gota / Flor / Estrella / Leyenda por seis
  niveles: Polvo Cósmico (0-49), Protoestrella (50-199), Secuencia Principal
  (200-499), Gigante Roja (500-749), Supernova (750-999) y Agujero Negro
  (1000+), cada uno con icono, descripción y multiplicador x1…x6.
- El rango se calcula con los puntos (tabla canónica en `main.js`), así la UI es
  correcta aunque la base de datos aún guarde claves antiguas; se aceptan los
  alias `semilla`, `gota`, `flor`, `estrella` y `leyenda`.
- Nuevo relieve del nombre según el rango en chat, ranking, usuarios en línea,
  muro de saludos, navbar y modal de perfil: más resplandor cuanto más alto el
  rango, con pulso suave en el máximo y respeto de `prefers-reduced-motion`.
- Badges y fila del rango máximo rediseñados en tonos cósmico/violeta; la
  escalera muestra ahora la descripción de cada nivel.
- Se mantienen actualizados el badge, el progreso, el multiplicador y el
  navbar al subir de rango, incluso al gastar puntos en la tienda.
- Migración SQL para Supabase (`calcular_rango`, `multiplicador_rango`, trigger
  de sincronización y recálculo de usuarios existentes).

## [1.9.2] - 2026-10-30

### Reacciones del chat al recargar

- Corregido: las reacciones guardadas en el servidor no se cargaban al abrir
  Comunidad. `cargarMensajesChat` pintaba los mensajes pero nunca pedía los
  chips a Supabase ni marcaba el chat como inicializado, así que solo se veían
  las reacciones que quedaban en `localStorage`.
- Como cerrar sesión limpia esa caché local, al volver a entrar la reacción
  seguía guardada en la base de datos pero desaparecía de la interfaz. Ahora la
  carga inicial (y la de mensajes antiguos) pide las reacciones al servidor.
- El reconciliador de reacciones cada 30 s ahora sí se activa tras la carga
  inicial (antes dependía de que llegara un mensaje nuevo).
- La comparación de `user_id` es tolerante a string/número al marcar la
  reacción como propia, y al restaurar o crear la sesión se refrescan los chips
  para marcar las reacciones que ya existen en el servidor.

## [1.9.1] - 2026-10-30

### Footer sin hueco inferior

- Corregido el hueco (negro en modo OLED) que quedaba bajo el footer en
  Comunidad: `body.comunidad-page` añadía 80px de `padding-bottom` después del
  footer.
- Nuevo layout de página con `.page-shell` y `body` en columna flexible: si el
  contenido es más corto que la pantalla, el footer queda pegado al borde
  inferior (Cine, Sorteo y Comunidad en pantallas altas) en vez de dejar una
  banda vacía debajo.
- Sin cambios en el espaciado interno de las páginas largas ni en las páginas
  que ya hacían scroll.

## [1.9.0] - 2026-10-30

### Tienda en carrusel

- El catálogo de la tienda de comunidad pasa de rejilla vertical a carrusel
  horizontal: se navega deslizando con el dedo, la rueda/trackpad o las flechas
  anterior/siguiente.
- Flechas circulares superpuestas en los laterales del carrusel, centradas
  verticalmente, que se ocultan al llegar al extremo correspondiente. Un clic
  avanza exactamente una tarjeta; los clics rápidos se acumulan.
- Scroll con snap por tarjeta, foco accesible del carrusel y respeto de
  `prefers-reduced-motion` (sin desplazamiento animado).
- Ancho de tarjeta adaptable: una tarjeta completa en el sidebar estrecho de
  escritorio y ~78% del ancho en móvil para ver parte de la siguiente y evitar
  el scroll vertical largo.
- Corregido: el catálogo no se ocultaba al abrir “Mis canjes” porque
  `.tienda-grid` sobreescribía el atributo `hidden`.

## [1.8.1] - 2026-10-30

### Perfil y tienda

- Perfil minimalista: avatar a la izquierda, nombre/rango/bio/redes a la
  derecha; acciones abajo a la derecha.
- Sin placeholders vacíos de “Sin bio” ni “Sin enlaces”.
- Redes principales: X, Instagram, YouTube y Discord. TikTok, Kick, Twitch y
  Web quedan en “Más redes” plegable.
- Enlaces del perfil como iconos compactos con tooltip/aria-label.
- Tienda móvil en 2 columnas con tarjetas compactas, descripción a 2 líneas y
  botones reducidos; menos scroll.
- Botón de cerrar sesión alineado a la derecha en el modal móvil.

## [1.8.0] - 2026-10-30

### Cine 2.0

- Botón “Unirme” persistente en la barra de sala: no desaparece al cargar y
  arranca el play dentro del gesto del usuario (evita el bloqueo de autoplay).
- Barra “Ahora en pantalla”: fuente detectada, estado (reproduciendo/pausado/
  error), espectadores conectados, sincronizar y pantalla completa.
- Reacciones en vivo con Supabase Broadcast: los emojis flotan en la pantalla
  de toda la sala; contador de presencia.
- Soporte de YouTube (watch, shorts, live, embed), Google Drive (file/d,
  open?id, uc?id, lh3) y video directo MP4/WebM/OGG/OGV/MOV, con tipo MIME
  correcto y detección automática.
- Sincronización: heartbeat del streamer cada 8 s, corrección de deriva en
  cada evento y respaldo de lectura cada 20 s.
- Errores claros: YouTube 101/150 muestra “no permite reproducción incrustada”
  y botón “Abrir en YouTube”.
- Cambio de video en caliente: destruye el reproductor anterior y crea el nuevo
  (antes reutilizaba el iframe viejo).

### Notas

- `1.8.0` es MINOR: nuevas funciones de sala y contrato de cine ampliado.
- El video actual `XoNCV9BsU9c` no permite embedding; se muestra error y enlace
  alternativo. Usar un video con incrustación habilitada para probar el sync.

## [1.7.4] - 2026-10-30

### Avatares de tienda

- Nuevos avatares exclusivos de tienda: `avatar-shop-male.webp` y
  `avatar-shop-female.webp` (512x512, recorte circular, WebP).
- Los avatares por defecto (`avatar-male.webp` y `avatar-female.webp`) siguen
  siendo los gratuitos del perfil.
- Premios actualizados en Supabase:
  - `Avatar Cyber Masculino` → `/img/avatars/avatar-shop-male.webp`.
  - `Avatar Cyber Femenino` → `/img/avatars/avatar-shop-female.webp`.

### Diseño

- Botones de cerrar sesión unificados con `.btn-logout`: fondo transparente,
  borde y hover rojo suave, mismo alto/radio que los botones primarios.
- Aplicado en galería, cine, sorteo y modal de perfil.

## [1.7.3] - 2026-10-30

### Correcciones

- Muro de saludos: `btnEliminar` se usaba antes de declararse y rompía el render
  de todas las tarjetas. Ahora los saludos cargan.
- Galería: los usuarios sin sesión ven una tarjeta compacta para iniciar sesión
  en vez del formulario de subida completo; el formulario queda centrado.
- Cine: la cámara de reacción se oculta cuando el stream está offline y se
  reduce en móvil; se eliminó el bloque duplicado de instrucciones; el chat
  vuelve a permitir scroll interno.
- Comunidad: la tienda se oculta sin sesión; se deduplican usuarios de presencia
  con varias pestañas; el perfil compacto (avatar) aparece en navbar móvil y de
  laptops; el modal de perfil incluye “Cerrar sesión”.
- Se eliminaron restos del helper de copiar enlace y se agregó una guarda en
  `scripts/check.js`.
- Se limpiaron las cuentas de prueba `ui_test_172_5057` y `ui_reg_172_8177`
  junto con sus sesiones y canjes.

### Notas

- `1.7.3` es un PATCH sobre `1.7.2`; no cambia contratos de RPC.
- Se reparó nuevamente el UTF-8 de los HTML tras un reemplazo masivo con
  PowerShell; queda documentado en `AGENTS.md` para no repetirlo.

## [1.7.2] - 2026-10-30

### Correcciones
- Perfil: un único modal global; se elimina el formulario inline y la ambigüedad
  de `actualizar_perfil_comunidad` (300 Multiple Choices en PostgREST).
- Registro y login devuelven género, avatar, bio y enlaces; avatar beta según
  género cuando no hay avatar comprado/subido.
- Tienda: catálogo y canjes usan las columnas reales (`costo_puntos`, `nombre`,
  `entregado_at`); se añaden dos avatares beta y se equipa avatar/icono al canjear.
- Ranking y navbar muestran avatar; aviso para elegir género.
- Migración local `supabase/migrations/20261031000000_beta_1_7_2_correcciones.sql`.
- `scripts/check.js` vigila el helper de copiar enlace.

## [1.7.1] - 2026-10-30

### Cambios
- Refinada ayuda admin en cine (resumen conciso) y galeria (explica ban/shadowban).

## [1.7.0] - 2026-10-30

### Funciones nuevas
- Género en cuentas de comunidad (`masculino`/`femenino`/`no_definido`) y avatares beta locales.
- Avatares de tienda (`tipo='avatar'`) con validación de propiedad.
- Modal global de perfil/ajustes inyectado desde `main.js`.
- Tienda privada: catálogo exige token de comunidad; pestaña oculta sin sesión.
- Ayuda plegable en paneles admin de galería y cine.

### Cambios
- Eliminado "copiar enlace" de muro, chat y galería.
- `tienda_obtener_catalogo` ahora requiere `p_token`.

## [1.6.0] - 2026-10-30

### Funciones nuevas

- Perfiles de comunidad: avatar en `avatares-comunidad`, bio (160), enlaces
  whitelist e icono equipado. Nuevo RPC `actualizar_perfil_comunidad`.
- Tienda de puntos: `tienda_premios`, `tienda_canjes`, catálogo público,
  canje transaccional con stock, puntos y un icono por usuario.
- Reacciones del muro: `muro_reactions`, RPCs `establecer_reaccion_muro` y
  `obtener_reacciones_muro`, realtime y actualización en sitio.
- Moderación: lista de usuarios, ban temporal, shadowban y auditoría
  (`admin_audit_log`) desde el panel de galería.
- Historial de chat por RPC `obtener_chat_historial`; lectura pública sin token
  y mensajes ocultos visibles solo para su autor.
- Tema OLED de tres estados y helpers de copiar enlace.

### Seguridad e integridad

- Baneo validado en login, sesión, chat, muro, puntos, likes, reacciones,
  galería, tienda y perfil; al banear se eliminan las sesiones.
- `admin_*` exige `es_admin()` y registra ban/shadowban en auditoría.
- Avatar validado por bucket y carpeta del usuario; enlaces `http/https`.
- Nuevas tablas internas con RLS y políticas de denegación explícita.
- Se corrigió XSS en el detalle de auditoría (`formatearDetalle` escapado).

### Correcciones de la implementación

- Galería: el panel unificado no se abría (`panelPendientes` inexistente),
  las pestañas Usuarios/Auditoría tenían `hidden` fijo y las acciones admin no
  estaban expuestas en `window`.
- CSS: la media query de 1200px quedó sin cerrar y metía todo el panel admin
  dentro de ella; el panel quedaba sin estilos en escritorio.
- Comunidad: HTML roto en las pestañas (`</butto` y `n>`), tarjeta
  "Tienda próximamente" duplicada, historial de chat vacío sin sesión y
  actualización de puntos tras canje usando un RPC de crédito en vez del saldo.
- Tema: el ciclo de temas usaba una constante y no avanzaba más de una vez.
- `obtener_chat_historial` y `tienda_*` creados en Supabase; la carpeta local
  `supabase/` sigue ignorada.

### Notas de migración

- Migraciones aplicadas: columnas de perfil/ban, `muro_reactions`, tienda,
  admin/auditoría, perfil/chat/baneo, helpers, bucket de avatares, políticas
  de denegación e índices de FK.
- El catálogo inicial trae tres iconos (100, 250 y 500 pts). Se puede editar
  en `tienda_premios`.
- Los iconos se muestran en perfil y ranking; extenderlos al chat requiere
  guardar/consultar el icono por autor.

## [1.5.1] - 2026-10-30

### Responsive

- Navbar: el menú hamburguesa entra en `<=1100px` (antes `<=900px`). Entre
  901 y 1100 los enlaces se partían en dos filas y se solapaban con el hero.
- `#nav-user-info` se oculta hasta `1399px` para dejar sitio a logo, enlaces y
  tema sin solapes en tablets y portátiles pequeños; reaparece desde `1400px`.
- Menú móvil: cierra al rotar/ampliar la pantalla, actualiza `aria-label` y
  `aria-expanded`, y enlaza `aria-controls` con el panel.
- Chat de Kick en el home: el layout móvil usaba `flex: 0 0 24%`, que anulaba
  `height: 350px` y dejaba el iframe en ~152px. Ahora usa `flex: 0 0 auto` y
  alto `clamp(480px, 60vh, 600px)`.
- Se quitó `scrolling="no"` del iframe de Kick para permitir el scroll interno.
- El stream y el chat se apilan hasta `1280px` (antes `1024px`), evitando un
  chat de ~250px en tablets y portátiles pequeños.
- El video conserva 16:9 en móvil: se quitó el `min-height: 300px` que lo
  deformaba a ~335x300 en pantallas de 390px.

## [1.5.0] - 2026-10-29

### Seguridad e integridad

- Likes por usuario: nueva tabla `galeria_likes` con PK `(image_id, usuario_id)`.
  `incrementar_likes` ahora hace toggle real por cuenta (no acepta incrementos
  arbitrarios desde el cliente). Nuevo RPC `obtener_likes_galeria` para cargar
  el estado "me gusta" desde el servidor; se eliminó el estado de likes en
  `localStorage`.
- Puntos: el cooldown de 5 minutos pasa a ser por cuenta (`usuarios_comunidad.ultimo_punto`)
  con `FOR UPDATE`. Ya no se puede multiplicar abriendo varias sesiones.
- Chat: el rate limit de 2.5 s se valida contra todas las sesiones de la cuenta
  y se serializa con `FOR UPDATE` sobre el usuario.
- Reacciones: whitelist de emojis en el servidor y escapado del emoji en el
  tooltip (evita inyección de HTML).
- Sorteo: registro limitado a 30 intentos por IP cada 10 minutos; índice único
  `lower(username)`; `sortear_ganador_sorteo` y `registrar_ganador_sorteo`
  quedan solo para `authenticated`. El cliente ya no inserta ganadores.
- Galería: el login de moderación valida `app_metadata.role = "admin"` antes de
  activar el panel. Se corrigió el clic de like/borrar que abría el lightbox.
  El clic en acciones ya no se detiene antes del listener delegado.
- `_headers`: CSP con `wss://*.supabase.co` (Realtime) y `https://www.youtube.com`
  (IFrame API). Se documentó que GitHub Pages ignora este archivo.

### Correcciones

- Galería: `aria-label` de las tarjetas usaba `{{ }}` dentro de un atributo
  Alpine; ahora usa una expresión válida.
- Galería: el realtime de likes ya no recarga toda la galería en cada like.
- Galería: miniaturas (`thumb_url`) cuando existen; validación de bytes AVIF
  más estricta; límite de título alineado a 60 caracteres.
- Comunidad: la lista de presencia muestra "Nadie en línea" al suscribirse sin
  usuarios (antes quedaba en "Cargando usuarios...").
- Comunidad: se limpian cachés de reacciones/likes al cerrar sesión o invalidar
  el token para no heredar estado entre cuentas.
- Sorteo: los errores al abrir/cerrar o vaciar ya no se ocultan; si el servidor
  no puede sortear no se inventa un ganador local.
- Cine: la sincronización MP4 ya no depende de la YouTube IFrame API; se añadió
  botón "Unirme a la reproducción" para sortear el bloqueo de autoplay.
- Home: límite del muro alineado a 280 caracteres; typo "mis redes".
- Confeti respeta `prefers-reduced-motion`.

### Herramientas y documentación

- `AGENTS.md` con reglas de stack, Supabase, seguridad, despliegue, SemVer y
  checklist de pruebas.
- `scripts/check.js`: validación estática sin dependencias (sintaxis JS inline,
  IDs duplicados, recursos locales, SemVer, CSP, mustaches Alpine).
- Migraciones aplicadas en Supabase; la carpeta local `supabase/` no se versiona.

### Notas de migración

- Los contadores de likes existentes se conservan. El historial por usuario
  empieza a registrarse desde 1.5.0; no se puede reconstruir el like de cada
  usuario anterior.
- Aplicar las migraciones en orden:
  `20261029213000`, `20261029213100`, `20261029214500`, `20261029215000`,
  `20261029215500`.
- Tras desplegar, probar Realtime (chat, galería, sorteo y cine) y los RPCs con
  una cuenta de comunidad temporal; limpiar los datos de prueba.
