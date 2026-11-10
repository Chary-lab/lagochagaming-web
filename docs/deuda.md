# Deuda conocida

Extraido de AGENTS.md: deuda aceptada y riesgos conocidos.

## 12. Riesgos aceptados / deuda conocida

- Registro de sorteo: con `sortear_entrar` (1.81.0, migración **aplicada**) el participante se identifica con su cuenta y no puede suplantar a otro. Desde 1.82.0 la UI no tiene campo de usuario de Kick, así que el único camino visible es la cuenta de comunidad. `registrar_participante_sorteo` sigue existiendo por historial, pero desde 2.2.5 ya no es ejecutable por `anon` ni `authenticated` (solo `service_role`).
- El ganador repetido queda resuelto con `sortear_siguiente()` (1.81.0, **migración aplicada**), que retira al ganador de la tómbola. `sortear_ganador_sorteo` por sí sola sigue sin retirar al ganador.
- Las sesiones caducadas se limpian al iniciar sesión/registrarse, no con un cron. No asumir limpieza inmediata.
- Presencia y "escribiendo" usan canales públicos: un cliente puede falsificar el apodo mostrado. El chat real sí usa el apodo canónico del servidor.
- Subida anónima a Storage: `fotos-galeria` permite INSERT anónimo en `gallery/` (5 MB), así que puede haber spam de almacenamiento y archivos huérfanos si la RPC falla. `avatares-comunidad` tiene lectura pública y borrado de admin, pero no INSERT anónimo: los avatares se suben con sesión/RPC. Requiere Edge Function o servicio externo para verificación fuerte.
- Shadowban: `comunidad_chat.oculto` filtra la lectura por RPC y el realtime del cliente, pero la tabla tiene SELECT público; un atacante podría leer mensajes ocultos por REST. No es un control de seguridad fuerte.
- PIN de 4 dígitos: fuerza bruta distribuida posible; el rate limit es por IP y por IP+cuenta desde 2.2.5. Un atacante ya no puede bloquear una cuenta desde otras IPs.
- GitHub Pages no aplica `_headers`: no hay HSTS ni las demás cabeceras. Lo único que sí protege en producción es la **meta CSP** del HTML (ver §6); no hay defensa anti-clickjacking (`frame-ancestors` no funciona en meta).
- Los CDNs de jsDelivr (Supabase JS, Alpine, `@alpinejs/focus` y hls.js) **ya llevan SRI** (`integrity` + `crossorigin`): al subir la versión de una librería hay que recalcular el hash o el navegador la bloquea. Las fuentes ya no vienen de Google: `fonts/` sirve Inter y Space Grotesk (woff2 variable, latin) con `@font-face` en `style.css`.
- Advisors de Supabase marcan RPCs `SECURITY DEFINER` ejecutables por `anon`; es intencional para usuarios de comunidad sin Supabase Auth. Revisar cada nueva RPC con el mismo criterio.
- Índices marcados como "unused" son de bajo volumen; no eliminarlos sin medir.
- El contador de descargas no ve las actualizaciones internas de la app ni las descargas directas del `.apk` fuera de `app-descarga`. La pestaña Descargas estima las actualizaciones con telemetría anónima cuando la app se abre, así que pueden tardar hasta que el usuario vuelva a entrar.
- Los espectadores del chat se refrescan con el sondeo de 30 s; pueden ir 30–60 s por detrás del número del iframe.
