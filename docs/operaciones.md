# Operaciones: referencia

Extraido de AGENTS.md: despliegue, release, SEO, SemVer y pruebas.

## 7. Despliegue

- Producción: GitHub Pages del repo `Chary-lab/lagochagaming-web` (rama `main`, build legacy de Pages; el workflow interno `pages build and deployment` publica el contenido y `.nojekyll` evita Jekyll). Los cambios pueden tardar en cachear.
- `.nojekyll` DEBE estar versionado en la raíz: sin él Pages intenta Jekyll y el build falla (`Build with Jekyll`). El `.gitignore` usa `*` + whitelist, así que cualquier archivo nuevo necesita su `!archivo` para poder commitearse.
- `AGENTS.md` está en UTF-8 sin BOM. Editarlo con el editor o con Node en UTF-8; no usar `Get-Content`/`Set-Content` de PowerShell 5.1 (leen ANSI y rompen acentos).
- El repo antiguo quedó bloqueado por un deployment fantasma de Pages (`400 in progress deployment`). Si vuelve a pasar: comprobar `pages/builds` y los deployments del environment `github-pages` antes de tocar código; el contenido no es el problema.
- No hay service worker. `manifest.webmanifest` debe seguir siendo válido.
- `robots.txt` y `sitemap.xml` deben mantenerse coherentes con las páginas públicas. Actualizar `lastmod` cuando cambie contenido público.
- Si se cambia de host, actualizar esta sección y `_headers`. Mientras el host sea GitHub Pages, CSP/HSTS solo existen por la meta CSP del HTML: **no proponer `_headers` como mejora pendiente**.
- APK Android: el proyecto vive en `D:\Apk Gocha` (Capacitor). El keystore de release está en `D:\Apk Gocha\firma\lagocha-release.jks` (alias `lagocha-release`, credenciales en `D:\Apk Gocha\firma\credenciales.txt`). Nunca versionar la clave. Tras cada build, copiar el APK a `app/LaGochaGaming.apk` y actualizar `sha256` y `size` en `app/update.json`: el actualizador interno de la app los verifica antes de instalar.
- Certificado de firma que NO debe cambiar: SHA-256 `afa219f4e4a80db4f949e5e2607f046cf74286ea34c07faec40c5a8550be33e9`. Si cambia, los usuarios tienen que desinstalar e instalar.

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
6. Copiar `dist\LaGochaGaming.apk` a `app/LaGochaGaming.apk` y `dist\update\update.json` a `app/update.json` (con `notes` legibles).
7. En `main.js`: enlace `app-descarga?v=X.Y&o=web` y texto del menú `vX.Y · N,N MB`.
8. En `D:\Gocha\mobile\mobile.js` y en los assets del APK: texto “App móvil · vX.Y”. También en `README.md` (versión actual y `versionCode` del APK).
9. Buscar restos de la versión anterior antes de commitear: `Select-String -Path "D:\Gocha\*.html","D:\Gocha\main.js","D:\Gocha\mobile\mobile.js","D:\Gocha\README.md" -Pattern 'v1\.\d+|\?v=1\.\d'`. La versión de la app se repite en 6 sitios (ver §5 de `D:\Apk Gocha\AGENTS.md`); actualizarlos todos.
10. `node scripts/check.js`, `node --check main.js`, bump de `VERSION` y entrada en `CHANGELOG.md`, commit `vX.Y.Z - resumen`.
11. Tras el push, comprobar en vivo `VERSION`, `app/update.json` y el SHA-256 del APK descargado (GitHub Pages puede tardar ~10 min en cachear).
- Las actualizaciones que descarga la propia app no pasan por `app-descarga` (el actualizador solo acepta el host `lagochagaming.com`), así que no cuentan en el contador.

### 7.1 SEO / AEO

- Search Console verificado; `sitemap.xml` enviado y `robots.txt` coherente con las páginas públicas.
- JSON-LD: `Person` + `WebSite` en la home; `BreadcrumbList` en comunidad, galería, sorteo y cine; `FAQPage` en la home. La FAQ debe seguir siendo visible y coincidir con el schema.
- `llms.txt` en la raíz y `404.html` con `noindex`.
- Open Graph/Twitter por página: `img/3.jpg` en todas (home, comunidad, cine, galería, sorteo y game), con `og:image:alt`.
- Analítica: Umami (`cloud.umami.is`) en las 7 páginas, `404.html` incluida; no instalar Plausible a la vez.
- No cambiar `<title>`, meta description ni H1 sin revisar canibalización: una intención por página (home = marca/streamer; comunidad = chat; galería = fotos; sorteo = sorteos; cine = GochiWatch; game = minijuego).
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
- Versión de esta release: la de `VERSION`; el historial vive en `CHANGELOG.md`. No fijar números aquí para que la guía no se quede obsoleta.
- La base se toca **solo** contra Supabase, nunca contra un esquema local. Flujo obligatorio: leer con `supabase db query --remote=cydiyaacnyydprgffmkq --read-only`, probar en una transacción con `DO`/`RAISE` + `ROLLBACK` y aplicar con `--yes`. El wrapper `%APPDATA%\npm\supabase.cmd` funciona aunque el `.ps1` esté bloqueado por ExecutionPolicy.
- `supabase/` puede existir en local (el CLI lo necesita para `functions deploy`), pero **nunca se versiona**: está en `.gitignore`. Lo que no puede haber es un runner de migraciones: el historial de Supabase no registra lo aplicado con `db query`, así que el registro real de cada cambio es su entrada en `CHANGELOG.md`: qué, por qué y qué se verificó.
- El código de una Edge Function solo se necesita en local para desplegar o editar; en el servidor vive desplegado. Si se pierde, se recupera con `supabase functions download <nombre> --remote=<ref>`.
- `supabase db dump` necesita Docker y aquí no hay. El respaldo de la base es el de Supabase (Dashboard → Database → Backups); si no está disponible, se genera un snapshot del esquema por consultas de solo lectura.
- `VERSION` describe la web. La app lleva su propio `versionName`/`versionCode` en `D:\Apk Gocha`; ambos se publican juntos, pero no comparten número.

## 9. Pruebas antes de commitear

1. `node scripts/check.js` (sintaxis JS inline, IDs duplicados, recursos, SemVer, **CSP por meta con los hashes de los scripts inline**, RPC por `rpcRaw`, `?v=` contra `VERSION`, directivas Alpine sin `x-data`/`x-store`, `alert`/`confirm`/`prompt`, BOM en archivos publicados, iconos del sprite y el manifiesto `app/update.json`). Si el bump de `VERSION` deja los busters viejos, `node scripts/check.js --fix` los reescribe. Con navegador real, `node scripts/smoke.js`: abre las 7 páginas (6 públicas + 404) a 1690×900 y 390×844 con Chrome/Edge y falla por error HTTP, consola sucia, desborde horizontal o busters viejos; levanta su propio servidor en el puerto 8788 o reutiliza uno con `--url=`. También prueba la paleta, el contrato de `gochi_ajustes` (clases `texto-*`, `sin-animaciones` y `ahorro-datos` más el estado del store), que el like sin sesión pide login sin abrir el lightbox, que el mapa de adornos de la tienda está cargado al abrir la página y aplica el color en el chat, que el historial del chat trae hora, y que el filtro activo de Galería pasa 4.5:1 de contraste. Esas tres últimas se comprobaron en rojo contra la 2.9.0: si el bug vuelve, `smoke.js` falla. Si `python` no está en el PATH, arranca el servidor con `scripts/serve.mjs` de `@web-test` y pasa `--url`; si Playwright no está en `node_modules`, apunta `NODE_PATH` a `%APPDATA%\npm\node_modules\@playwright\cli\node_modules`.
2. `node --check main.js`.
2b. Tras tocar HTML (scripts inline) o la CSP: comprobar con navegador que no hay violaciones (`securitypolicyviolation`) ni errores de consola en las 7 páginas × 2 tamaños. Los hashes sin `--fix` dejan el sitio sin JavaScript.
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
   - La carpeta `supabase/` local está permitida para desplegar funciones, pero no se commitea (`.gitignore`). La base es Supabase: el SQL va con `db query --remote` y cada cambio se documenta en `CHANGELOG.md`.
7. Revisar `git diff` y `git status`; no commitear archivos temporales, secretos ni datos de prueba.
