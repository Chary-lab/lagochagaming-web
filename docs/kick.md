# Kick: referencia

Extraido de AGENTS.md (v2.2.3).

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
