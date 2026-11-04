# LaGochaGaming

Sitio oficial de la comunidad de LaGocha: HTML, CSS y JavaScript clásico, sin build ni dependencias npm de runtime.

## Páginas

- `index.html` — inicio, player de Kick, clips, feed social, YouTube y muro de saludos.
- `comunidad.html` — presencia, chat, reacciones, ranking y rangos.
- `galeria.html` — subida de fotos, galería pública, likes y moderación.
- `sorteo.html` — sorteo manual, tómbola online y modo streamer.
- `cine.html` — GochiWatch: sincronización de películas/videos.

## Perfiles y avatares

- **Mi perfil** se abre como panel anclado bajo el botón del navbar (en móvil, hoja inferior). Clic fuera o en el mismo botón lo cierra; la página sigue usable.
- **Perfil público**: `window.abrirPerfilUsuario(apodo)`. Muestra cabecera, insignias de Kick con nombre y detalle, bio, redes y actividad.
- **Avatares**: 2 por defecto (masculino/femenino), 2 de tienda (200 pts) y la foto de Kick mientras la cuenta esté vinculada (`kick_avatar_url`). Al desvincular Kick se borra y vuelve a los de género.
- **Insignias de Kick**: `window.insigniasKickDe(fila)` → `{tipo, etiqueta, nombre, detalle, icono, texto}`, máximo 6 y caducan a los 30 días.
- **Panel admin**: usuarios con avatar, última conexión, KICK, ban/shadowban/eliminar y **Ver perfil** sin cerrar el panel. El acceso solo aparece con sesión admin u owner.

## Stack

- HTML5 + CSS3 responsive (`style.css`).
- JavaScript vanilla (`main.js` y scripts por página).
- Supabase (Postgres, RLS, RPC, Realtime y Storage) con la librería JS 2.118.0.
- Alpine.js 3.17.5 por CDN.
- Iconos: sprite SVG propio en `img/icons.svg` (paths de Font Awesome Free 6.6.0 incrustados, sin CDN ni Bootstrap).
- Hosting: GitHub Pages con dominio `lagochagaming.com`.

## Desarrollo local

No requiere instalación. Desde la raíz:

```powershell
python -m http.server 8765
```

Abrir `http://127.0.0.1:8765/`.

## Validaciones

```powershell
node scripts/check.js
node --check main.js
```

`scripts/check.js` valida sintaxis de scripts inline, IDs duplicados, recursos locales, SemVer, CSP básica y mustaches de Alpine en atributos.

## Base de datos

- Proyecto Supabase: `cydiyaacnyydprgffmkq`.
- Historial de migraciones en Supabase; no se versiona la carpeta local `supabase/`.
- Las escrituras sensibles pasan por RPC `SECURITY DEFINER`; RLS permanece activo.
- Nunca agregar `service_role` ni secretos al cliente.

## App Android

El APK se distribuye desde este repo:

- `app/LaGochaGaming.apk` — último APK firmado (versión actual: 1.13, versionCode 16).
- `app/version.json` — manifiesto del actualizador (`versionCode`, `versionName`, `sha256`, `size`, `notes`).
- `mobile/mobile.css` y `mobile/mobile.js` — interfaz móvil que la app descarga por encima del APK (caché de 6 h, válida 7 días).

El APK no reproduce el iframe de Kick: abre un reproductor ExoPlayer nativo con
selector de calidad. En la web el directo sigue en el iframe de Kick; `main.js`
oculta ese iframe solo dentro de la app y muestra la tarjeta “Ver el directo”.

Las instrucciones de build, firma y publicación del APK viven en
`D:\Apk Gocha\AGENTS.md`.

## Descargas

El enlace del menú pasa por la Edge Function `app-descarga`, que cuenta la
descarga en `app_descargas` y redirige al APK. El panel de admin tiene una
pestaña **Descargas** con total, únicos, hoy, 7/30 días y desglose por versión.
Las actualizaciones internas de la app no pasan por ese enlace y no se cuentan.

## Versión y despliegue

- `VERSION` es la fuente de verdad (SemVer).
- Cambios en `CHANGELOG.md`.
- Commit de release: `vX.Y.Z - resumen`.
- GitHub Pages ignora `_headers`; no asumir CSP/HSTS activos en producción.
- `.nojekyll` versionado: sin él Pages intenta construir con Jekyll y el build falla.
- En cada release, subir el query de caché `?v=X.Y.Z` de `style.css` y `main.js` en los 6 HTML.
- Release con APK: compilar y firmar en `D:\Apk Gocha`, copiar el APK a `app/LaGochaGaming.apk`, actualizar `app/version.json` (código, nombre, SHA-256 y tamaño), el enlace `app-descarga?v=X.Y&o=web` de `main.js` y `VERSION`/`CHANGELOG.md`. Verificar en vivo antes de darlo por publicado.
- La keystore no se versiona. El certificado SHA-256 debe ser siempre `41a6cdc746de8560425aa04b9bcdc3cb5e81f670644e846f284977ce721b4b21`; si cambia, hay que desinstalar la app antes de instalar.

## Reglas para agentes

Leer `AGENTS.md` antes de modificar código, base de datos o despliegue.
Si el cambio toca la app Android, leer también `D:\Apk Gocha\AGENTS.md`.
