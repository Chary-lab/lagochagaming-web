# Deuda conocida

Extraido de AGENTS.md: deuda aceptada y riesgos conocidos.

## 12. Riesgos aceptados / deuda conocida

- Registro de sorteo: con `sortear_entrar` (1.81.0, migración **aplicada**) el participante se identifica con su cuenta y no puede suplantar a otro. Desde 1.82.0 la UI no tiene campo de usuario de Kick, así que el único camino visible es la cuenta de comunidad. `registrar_participante_sorteo` sigue existiendo por historial, pero desde 2.2.5 ya no es ejecutable por `anon` ni `authenticated` (solo `service_role`).
- El ganador repetido queda resuelto con `sortear_siguiente()` (1.81.0, **migración aplicada**), que retira al ganador de la tómbola. `sortear_ganador_sorteo` por sí sola sigue sin retirar al ganador.
- Las sesiones caducadas se limpian al iniciar sesión/registrarse y, desde 2.3.4, un cron diario (`limpieza-datos-antiguos`, 04:15) borra sesiones expiradas hace más de 7 días, `auth_rate_limit` de más de 1 día, `game_runs` expiradas hace más de 7 días y `puntos_eventos` de más de 365 días.
- Presencia y "escribiendo" usan canales públicos: un cliente puede falsificar el apodo mostrado. El chat real sí usa el apodo canónico del servidor.
- Subida a Storage: `fotos-galeria` exige una sesión de comunidad válida o admin desde 2.2.9; la política recibe `x-comunidad-token`, valida el token y el prefijo `gallery/`. Queda el riesgo de archivos huérfanos si la RPC falla después de subir (no hay limpieza automática) y la verificación de contenido real sigue siendo del cliente, no del servidor. `avatares-comunidad` tiene lectura pública y borrado de admin, pero no INSERT anónimo: los avatares se suben con sesión/RPC.
- Shadowban: `comunidad_chat.oculto` filtra la lectura por RPC y el realtime del cliente, pero la tabla tiene SELECT público; un atacante podría leer mensajes ocultos por REST. No es un control de seguridad fuerte.
- PIN de 4 dígitos: fuerza bruta distribuida posible; el rate limit es por IP y por IP+cuenta desde 2.2.5. Un atacante ya no puede bloquear una cuenta desde otras IPs.
- GitHub Pages no aplica `_headers`: no hay HSTS ni las demás cabeceras. Lo único que sí protege en producción es la **meta CSP** del HTML (ver §6); no hay defensa anti-clickjacking (`frame-ancestors` no funciona en meta).
- Los CDNs de jsDelivr (Supabase JS, Alpine, `@alpinejs/focus` y hls.js) **ya llevan SRI** (`integrity` + `crossorigin`): al subir la versión de una librería hay que recalcular el hash o el navegador la bloquea. Las fuentes ya no vienen de Google: `fonts/` sirve Inter y Space Grotesk (woff2 variable, latin) con `@font-face` en `style.css`.
- Advisors de Supabase marcan RPCs `SECURITY DEFINER` ejecutables por `anon`; es intencional para usuarios de comunidad sin Supabase Auth. Revisar cada nueva RPC con el mismo criterio.
- Referidos: el pago exige cuenta de al menos 1 día, 100 puntos y actividad en 2 días distintos; desde 2.2.8 hay un tope de 20 referidos pagados por padrino. Sigue siendo posible crear cuentas con esfuerzo sostenido, pero el retorno está acotado.
- Índices marcados como "unused" son de bajo volumen; no eliminarlos sin medir.
- Likes de galería: el reto semanal solo cuenta votos de cuentas creadas antes de abrir el reto (2.2.8). Desde 2.2.9 no hay autolike y cada cuenta puede dar 30 likes por día; el ranking visual aún puede inflarse con muchas cuentas, pero el premio del reto queda filtrado.
- El contador de descargas no ve las actualizaciones internas de la app ni las descargas directas del `.apk` fuera de `app-descarga`. La pestaña Descargas estima las actualizaciones con telemetría anónima cuando la app se abre, así que pueden tardar hasta que el usuario vuelva a entrar.
- Los espectadores del chat se refrescan con el sondeo de 30 s; pueden ir 30–60 s por detrás del número del iframe.
- `game_guardar_progreso` valida tipos y rangos, pero sigue aceptando del cliente monedas, logros, accesorios, recompensas, misiones, Boss Rush y reto diario. No se derivan de `game_runs`/`game_records`; un cliente manipulado puede inflar progreso. Cerrarlo exige mover la economía al servidor o validar cada recompensa contra partidas.
- `reclamar_recompensa_app` usa un hash de dispositivo enviado por el cliente. Sin Play Integrity/App Attest no se puede demostrar que la instalación es real; el hash solo evita duplicados casuales.
- La verificación de MIME real y contenido de las fotos sigue siendo del cliente. Storage aplica límite de tamaño y la lista de MIME del bucket, pero no inspecciona los bytes; haría falta una Edge Function o un antivirus/procesador de imágenes.
- `comunidad_chat` no tiene retención automática: se conserva el historial. Solo se limpian `puntos_eventos` (365 días), `auth_rate_limit` (1 día), sesiones y `game_runs` (7 días tras expirar).
- No hay CI ni `package.json`: `scripts/smoke.js` necesita Playwright disponible en la máquina. Se decidió no añadir dependencias ni workflows por ahora.
- Notificaciones push web pendientes: exigen un `sw.js` en la raíz (archivo nuevo, requiere autorización), claves VAPID y una Edge Function con cron para enviar. El canal actual de reenganche es el cofre diario, la racha, el resumen semanal y el aviso de directo dentro de la app.
- La pregunta abierta del día sigue premiando la respuesta en el chat (5 pts). La encuesta rápida con opciones y porcentajes ya existe, pero las encuestas se cargan por SQL: no hay panel para crearlas ni para moderar resultados.
- Los clips se pueden votar (`kick_clip_votos`, RPC `votar_clip`, 3 puntos por clip y 5 al día) y la home ordena por votos con etiquetas TOP 1–3, pero solo sobre los 6 clips cargados: no hay ranking histórico ni página de clips.
