# Changelog - LaGochaGaming

Formato basado en Keep a Changelog. Versionado SemVer (`MAJOR.MINOR.PATCH`).
El historial anterior a 1.5.0 está en los commits `v1.4.x`.

## [1.93.0] - 2026-11-08

### GochitaRunner: minijuego de plataformas en /game

- Nueva página `game.html` con **GochitaRunner**: 3 niveles jugables (El Setup, Raid City y La Purga), scroll lateral, física de salto con coyote time, cámara suave y controles de teclado y táctiles.
- **Kicks** como moneda, **Regalito** que da un escudo de 3 golpes y **Donación** con 5 clips para disparar. Los **Haters** caminan, vuelan, lanzan comentarios y se pueden pisar o eliminar con clips.
- **Raid City** añade túneles de raid, plataformas y haters voladores; **La Purga** borra el escenario detrás del jugador y obliga a correr.
- Los niveles se desbloquean en orden: al completar uno se abre el siguiente y el progreso se guarda en local. No hay selector libre de niveles.
- Ranking de comunidad en `/game`: general (suma de la mejor marca por nivel) y por nivel, top 50. Solo se envían partidas con sesión de comunidad; los invitados juegan en local.
- Nuevas tablas `game_niveles`, `game_runs` y `game_records`, y RPC `game_iniciar_partida`, `game_enviar_partida`, `game_ranking_general`, `game_ranking_nivel` y `game_mis_records`. El servidor valida sesión, topes de Kicks/haters, tiempo mínimo y una partida por intento.
- Animación procedural del personaje (piernas, brazos, parpadeo, coleta, salto y aterrizaje), sonido sintetizado con Web Audio y persistencia local del sonido y récords.

## [1.92.0] - 2026-11-08

### Fix: panel App en el móvil web

- En el menú móvil el panel se colocaba al lado del botón App, fuera de la pantalla: había que deslizar a la derecha para ver la descarga.
- Ahora, al abrirlo en móvil, se mueve al `body` y se ancla como hoja inferior (12 px de margen, máximo 72vh con scroll). En escritorio sigue colgando del botón.
- El menú recupera el panel al cerrarse.

## [1.91.9] - 2026-11-07

### App 1.18: apodo arriba y aviso de login en el chat

- Con sesión, el chat de comunidad muestra una fila con **tu apodo** («Hablas con tu cuenta») justo encima de la pregunta del día.
- Sin sesión, en vez del formulario aparece un aviso con **Entrar o registrarme**. El botón abre la hoja de cuenta de la app desde el iframe (`postMessage`).
- El formulario sigue oculto mientras no haya cuenta: nadie escribe sin identificarse.

## [1.91.8] - 2026-11-07

### App 1.17: chat de comunidad limpio

- Dentro de la app, el chat de comunidad ya no muestra la cabecera «Chat Comunitario (Offline / Online)».
- Fuera el campo de apodo del medio: se rellena solo con la sesión y no ocupa fila.
- Compose en una sola fila: mensaje a la izquierda, 7TV y enviar (flecha) en la esquina, como el chat de Kick.
- Recorte del iframe: sin navbar, sin footer y sin el aire superior de la página.

## [1.91.7] - 2026-11-07

### Fix: el panel App tapaba la barra

- Una regla del rework (`.nav-app-panel { position: relative }`) pisaba el `position: absolute` del desplegable: el panel se centraba encima de la barra y se cortaba por arriba.
- Ahora cuelga debajo del botón App, como el resto de paneles.
- La nota de versión pasa a 1.16.

## [1.91.6] - 2026-11-07

### App 1.16: chat con pestañas, recompensa y ajustes

- **Chat con pestañas** en el inicio de la app: Comunidad por defecto y Kick. Si hay directo, abre en Kick; la elección manual se recuerda durante la sesión. El chat de comunidad se carga en un iframe `comunidad.html?embed=chat` con la página recortada por CSS.
- **Recompensa por instalar**: RPC `reclamar_recompensa_app` con 100 puntos, una vez por cuenta y por móvil (hash), cuenta con más de 24 h. Tabla `app_recompensas` y acción `app_instalada`. Se reclama al abrir la app con sesión y avisa por toast.
- **Ajustes técnicos**: `allowBackup=false` (el token de sesión no viaja en copias) y errores JS/promesas a Umami como `error-app`, sin datos personales.
- CSP: `frame-src` acepta `'self'` para poder incrustar la comunidad.
- El desplegable App anuncia los 100 puntos.

## [1.91.5] - 2026-11-07

### Separación en el desplegable App

- Línea divisoria y 12 px de aire entre el botón de descarga y las ventajas.
- El botón y el chip usan `var(--btn-text)`: en modo claro el texto ya contrasta sobre el verde oscuro.

## [1.91.4] - 2026-11-07

### Desplegable App con vida

- Mini móvil animado en la cabecera: punto EN VIVO que late, burbujas de chat que respiran y flotación suave.
- Botón de descarga con brillo al pasar el ratón, elevación y pulsación; anillo de foco visible.
- Acordeones con entrada suave, hover en el título y números en círculo.
- Glow superior en el panel y sombra interior de acento.
- En móvil el panel limita su alto y hace scroll interno.
- Todo respeta `prefers-reduced-motion`.

## [1.91.3] - 2026-11-07

### Desplegable App del navbar

- El menú **App** pasa a ser una ficha de descarga: cabecera con versión y peso, botón grande de descarga, chips, ventajas y dos acordeones (cómo se instalar y aviso de Play Protect).
- iPhone queda como una nota al pie, sin ocupar una fila entera.
- Sin página nueva: todo vive en `#nav-app-panel` de `main.js`.

## [1.91.2] - 2026-11-07

### App 1.15: aviso de directo

- La app comprueba cada 15 minutos si el canal está en directo y avisa con una notificación local al empezar. Sin Firebase ni servidor propio.
- Ajuste **Aviso de directo** en la hoja de Ajustes de la app, activado por defecto; pide el permiso de notificaciones la primera vez.
- Android: `LiveCheckWorker` (WorkManager), canal `lg_directo`, permiso `POST_NOTIFICATIONS` y puente `setLiveAlerts`/`liveAlertsEnabled`.
- `versionCode` 18, `versionName` 1.15.

## [1.91.1] - 2026-11-07

### Tienda: equipar y quitar

- **Mis compras** en Mi cuenta: lista lo que tienes y deja **Equipar/Quitar** (color, título, marco, icono y avatar) con `equipar_canje`.
- Marco y título ya se dibujan: aro con brillo en el avatar del perfil y del ranking, y etiqueta junto al apodo en perfil, chat, ranking y muro.

## [1.91.0] - 2026-11-07

### Tienda: rework con colores de apodo

- Fuera el carrusel con flechas: **filas horizontales con snap** (se desliza, no se baja), «Ahorrando» plegado por defecto y barra de progreso con «Faltan X pts» en el botón.
- **Colores de apodo**: 7 colores que se compran por separado (60–80 pts) y se equipan cuando quieras. Una sola tarjeta abre la paleta; los tuyos se tocan para ponerlos, los bloqueados muestran su precio.
- Título **Gochi Fan** (250) y **Marco que resplandece** (350).
- El color se aplica al apodo en chat, ranking, muro y perfil. `window.colorApodoDe(apodo)` cachea el mapa y las vistas se repintan al evento `gocha:colores`.
- Base: `usuarios_comunidad.color_apodo/titulo_equipado/marco_equipado`, `tienda_premios.valor`, tipos `color/titulo/marco` en el CHECK, canje extendido y RPC `equipar_color_apodo`/`equipar_titulo`.
- Mis canjes con `formatearFecha` en vez de `toLocaleString`.

Probado en transacción: compra de color (60 pts, color aplicado), recompra bloqueada (`ya_lo_tiene`), equipar y quitar.

## [1.90.0] - 2026-11-07

### Misiones en el navbar

- El store `misiones` pasa de `comunidad.html` a `main.js`: funciona en las 6 páginas y se refresca al entrar o salir de la cuenta.
- Botón `🎯 Misiones` en el navbar, oculto sin sesión. Badge con las misiones **cumplidas sin cobrar**; `✓` cuando ya está todo cobrado; sin badge si no hay nada que cobrar.
- Panel desplegable anclado al botón en escritorio y hoja inferior en móvil (`<900px`). Lista con `○` pendiente, `!` lista para cobrar y `✓` cobrada; solo las cobrables muestran botón `+puntos`.
- Cierra con Escape, clic fuera o el mismo botón; se recoloca al redimensionar.
- Se quita la tarjeta de misiones de la columna izquierda de Comunidad y su CSS, que ocupaba tres bloques apilados.

## [1.89.1] - 2026-11-07

### Muro: cupo por IP

- El límite de `publicar_saludo_muro` era solo por apodo (3/hora y 1/minuto), así que un bot lo saltaba cambiando de nombre. Ahora también cuenta por IP.
- `muro_saludos` gana `ip_hash` (md5 de `x-forwarded-for`) e índice `(ip_hash, created_at desc)`.
- 3 saludos por hora y 1 por minuto por IP, con `pg_advisory_xact_lock` para que dos peticiones simultáneas no lo salten.
- El límite por cuenta (5/hora) y por apodo se mantienen; el muro avisa con los mismos códigos de siempre, así que el cliente no cambia.
- Probado en transacción con 5 envíos desde la misma IP y nombres distintos: pasan 3, los otros dos devuelven `limite_hora`.

## [1.89.0] - 2026-11-07

### Logros propios

- Tablas `logros` (10 catálogo) y `logros_usuario` (uno por cuenta y logro). RLS activo sin políticas.
- `evaluar_logros(usuario)` calcula los que cumple con datos reales: fotos, mensajes, saludos, racha, referidos pagados, antigüedad, Kick vinculado y top 3 del mes (este último exige 100 pts en el mes, para no regalarlo).
- Cada logro entrega puntos una sola vez (`puntos_acciones.logro` con el importe como override) y es idempotente: la segunda evaluación devuelve `nuevos: []`.
- `mis_logros(token)` evalúa y devuelve el perfil propio; `logros_de(apodo)` es público para el perfil ajeno. Cron diario `gocha-logros` (05:30) repasa hasta 500 cuentas.
- UI: sección «Logros» en el panel de perfil, con emoji, nombre y descripción al pasar el ratón. Al abrir el perfil propio se evalúan al momento y sale toast si hay alguno nuevo.

Probado en transacción: primera evaluación entrega 4 logros (primera foto, semana seguida, veterano, Kick), la segunda no repite y `logros_de` los lista.

## [1.88.0] - 2026-11-07

### Referidos

- `usuarios_comunidad` gana `codigo_ref` (único), `referido_por` y `referido_pagado`.
- `mi_codigo_referido` genera el código al pedirlo (`APODO-1234`, único) y devuelve invitados y cuántos ya cobraron.
- `canjear_codigo_referido` se llama al terminar el registro si se escribió un código. No bloquea el registro: si el código es inválido, la cuenta se crea igual.
- `pagar_referidos` (cron diario 05:00) abona **100 pts al padrino y 50 al invitado** cuando el invitado acumula 100 puntos y 2 días con actividad real. El bono no consume el tope diario: se abona directo y el trigger recalcula el rango.
- Antifarmeo: un código por cuenta, nada de autorreferencia, cuenta invitada con más de un día y exigencia de actividad real (`tiempo_conectado` no cuenta) antes de pagar.
- UI: campo opcional «Código de invitación» en el registro y tarjeta «Invita y gana» en Comunidad con el código y botón de copiar.

Probado en transacción: código generado, canje correcto, segundo canje rechazado (`ya_referido`), código propio rechazado (`codigo_propio`) y pago con +100/+50.

## [1.87.0] - 2026-11-07

### Reto individual y sorteo semanal sin farmeo

**Reto de galería: de concurso único a recompensa por participar.** Antes solo cobraba la foto con más likes, así que con pocas cuentas nadie más tenía motivo para subir.
- Cada foto aprobada del tema da **50 pts** (`puntos_acciones.reto`), una vez por cuenta y reto.
- La más votada se lleva además el premio del reto (`retos_galeria.premio`, 200) como `reto_ganador`.
- El banner lo explica: «Cada foto aprobada del tema suma 50 puntos, y la más votada se lleva 200 extra».

**Sorteo semanal** (`sorteos_semanales`, `sorteo_participantes`, `sorteo_semana_actual`, `sorteo_semanal_estado`, `entrar_sorteo_semanal`, `cerrar_sorteo_semanal`): 300 pts entre quienes entren.
- **Elegibilidad por actividad real**: 2 días distintos en los últimos 7 con chat, muro, foto, like o reacción. `tiempo_conectado` no cuenta: dejar la pestaña abierta no da tickets.
- **Tickets con techo**: 1 base + 1 por día activo, máximo 3.
- **Entrada explícita**: hay que pulsar «Entrar al sorteo».
- **Antifarmeo de cuentas**: una entrada por cuenta y semana, cuentas de menos de 24 h fuera y el ganador descansa 2 semanas.
- **Mínimo de 3 participantes**: si no se llega, el sorteo se anula y el premio se acumula al siguiente (`sorteo_semana_actual` suma los anulados).
- Cierre domingo 23:30 UTC (`gocha-cerrar-sorteo`).
- Probado en transacción: elegible con 2 días, alta idempotente, cierre con 3 participantes da ganador y 300 pts, cierre con 1 participante queda `anulado`.

## [1.86.0] - 2026-11-07

### Racha diaria y ranking del mes

- `usuarios_comunidad` gana `racha` y `ultimo_dia`. `latido_comunidad` la actualiza en cada visita: mismo día no cambia, día siguiente suma uno, día saltado vuelve a 1.
- Cada 7 días seguidos se cobra un bonus único de 30 pts (`puntos_acciones.racha`), con `ref` por fecha para que no se repita.
- La píldora de puntos del navbar muestra `🔥N` cuando la racha pasa de 1, y su `title`/`aria-label` incluyen los días.
- `obtener_puntos_hoy` devuelve `racha`, así que el dato llega en el mismo sondeo que ya existía.
- Ranking de Comunidad con dos vistas: **Total** (puntos históricos) y **Este mes**. La segunda usa `ranking_del_mes`, que suma `puntos_eventos` del mes en curso sin resetear nada.
- Probado en transacción: día 1 → racha 1 sin bonus; día 7 → racha 7 con +30; `obtener_puntos_hoy` devuelve `racha: 7`; `ranking_del_mes` devuelve el top del mes.

## [1.85.1] - 2026-11-07

### Reto de galería: temas concretos

- Los 6 temas rotativos pasan a ser cosas que la gente puede subir sin dudar: `Meme de La Gocha`, `Momento del directo`, `Fan art`, `Tu rincón de directo`, `Mascota gochil` y `Tu edit favorito`. Antes eran genéricos («Colección», «Figuras, juegos, merchandising: presume de estantería»).
- El reto abierto ahora mismo se renombra a `Meme de La Gocha` sin tocar fechas ni premio: los textos se copian al abrirlo, así que el cambio de catálogo no llegaba al reto en curso.
- Banner: «Sube la tuya: la que más likes reciba se lleva 200 puntos.»

## [1.85.0] - 2026-11-07

### Comunidad: rebalanceo de puntos, misiones, pregunta del día y reto de galería

**Motivo**: 6 cuentas, 3 mensajes de chat y 0 fotos, pero 149 eventos de `tiempo_conectado` en una semana. La economía premiaba mirar, no participar.

**Rebalanceo** (solo datos, en `puntos_acciones`):

| Acción | Antes | Ahora |
|---|---|---|
| `tiempo_conectado` | 1 pt · 288/día | 1 pt · 12/día |
| `chat` | 1 pt · 20/día | 2 pts · 20/día |
| `foto` | 3 pts · 5/día | 15 pts · 3/día |
| `muro` | 2 pts · 5/día | 5 pts · 5/día |
| `like` / `reaccion` | 1 pt · 10/día | 2 pts · 10/día |
| `visita` | 2 pts · 1/día | 5 pts · 1/día |

Nuevas acciones: `mision` (override por misión), `pregunta` (5 pts · 1/día) y `reto` (200 pts · 1/día). Los topes diarios por rango siguen mandando.

**Misiones** (`misiones` + `misiones_estado` + `reclamar_mision`): perfil completo 50, vincular Kick 40, primer saludo 20, primer mensaje 20, primera foto 30. La condición se valida en el servidor con `puntos_eventos` y el cobro es idempotente por `(usuario, 'mision', clave)`. Tarjeta en la columna izquierda de Comunidad.

**Pregunta del día** (`preguntas_chat`, `pregunta_del_dia`, `pregunta_del_dia_actual`, `reclamar_pregunta_dia`): 10 preguntas que rotan, publicadas por `pg_cron` a las 14:00 UTC. El extra de 5 puntos se cobra solo si hay un mensaje de chat posterior a la publicación; se intenta al cargar Comunidad y al enviar un mensaje.

**Reto de galería** (`retos_temas`, `retos_galeria`, `reto_galeria_actual`, `abrir_reto_galeria`, `cerrar_retos_galeria`): 6 temas que rotan; uno abierto cada semana con premio de 200 pts a la foto aprobada con más likes. Cron cierra el domingo por la noche y abre el siguiente. Banner en Galería.

**Cron**: `gocha-pregunta-diaria` (14:00), `gocha-cerrar-retos` (04:00), `gocha-abrir-reto` (04:05 UTC).

**Permisos**: RLS activo sin políticas en las 5 tablas nuevas (solo RPC `SECURITY DEFINER`); `EXECUTE` revocado a `public` y concedido solo a `anon`/`authenticated` en las que usa el cliente.

## [1.84.2] - 2026-11-07

### Auditoría frontend: bugs de datos y puertas únicas

- **Mis canjes**: la RPC `tienda_mis_canjes` devuelve `costo_puntos`, pero el panel leía `puntos_gastados`. Cada canje pintaba `−undefined` y el pie «Gastado en la tienda» siempre sumaba 0. Corregido en las dos referencias de `main.js`.
- **RPC por la puerta única**: `estadisticas_perfil_comunidad` (`main.js`) y `streamer_config_sorteo` (`sorteo.html`) llamaban a `supabase.rpc` partido en dos líneas, esquivando el chequeo de `check.js`. Ahora van por `window.rpc`/`window.rpcRaw`, y `scripts/check.js` compara el código sin espacios para que una llamada partida no vuelva a colarse.
- **Edge Functions**: `pedir` y `reconectar` del chat de Kick usaban `fetch` a `/functions/v1/kick-chat`; ahora pasan por `window.llamarEdge`, como el resto.
- **Perfil del navbar**: `#nav-user-info` tenía `display: inline-flex !important`, que ganaba al `style.display` de `main.js`; el perfil "oculto" seguía ocupando espacio. Quitado el `!important`.
- **Chat de comunidad**: la hora del mensaje usaba `toLocaleTimeString` suelto; ahora `window.formatearFecha(msg.created_at, 'hora')`.
- **Tómbola**: el nombre en el giro se escapaba dentro de `innerText`, así que un apodo con `&` o `'` mostraba entidades literales. Ahora `textContent`.
- **Accesibilidad**: fuera `aria-live` de `#kick-clips`, `#ig-feed` y `#tiktok-feed`; anunciaban el bloque entero al cargar.

**Verificado**: `check.js` (incluida la comprobación nueva de RPC), `node --check main.js`, `smoke.js` y prueba en navegador del perfil del navbar y del panel de canjes.

## [1.84.1] - 2026-11-07

### Auditoría: endurecimiento de base y arreglo de subida

**Base de datos (aplicado contra `cydiyaacnyydprgffmkq`, probado en transacción con `ROLLBACK` antes)**

- `owner_marcar_sugerencia` y `owner_eliminar_sugerencia` usaban `es_admin()`: un `admin` podía leer, marcar y borrar el buzón, que es exclusivo de `owner`. Ahora exigen `es_owner()`, como dice la regla del proyecto.
- `REVOKE ALL ON app_descargas FROM anon, authenticated`: residuo de un `GRANT ALL`. Incluía `TRUNCATE`, que RLS no filtra. La tabla queda solo para `service_role` vía Edge Function y la RPC de estadísticas.
- `REVOKE ALL ON comunidad_sesiones FROM anon, authenticated`: el token solo se lee dentro de RPC `SECURITY DEFINER`. Sin acceso directo, una fuga de tabla no se puede explotar desde PostgREST.
- `DROP POLICY "Ver fotos del bucket"` en `storage.objects`: el bucket es público y las fotos se sirven por URL pública, así que la política solo servía para **listar** el bucket, incluidas fotos pendientes y rechazadas. Sin ella se sigue viendo todo lo aprobado.

**Cliente**

- `galeria.html`: la comprobación de sesión estaba después de subir el archivo a Storage. Un visitante sin sesión gastaba una subida de hasta 5 MB y se quedaba con un error. Ahora se comprueba antes de leer el archivo; `guardar()` mantiene su comprobación como respaldo.

**Verificado**: `check.js`, `node --check main.js`, `smoke.js` y consultas de comprobación en Supabase (funciones con `es_owner`, 0 grants para `anon`/`authenticated`, 0 políticas de listado).

## [1.84.0] - 2026-11-06

### Home: los dos últimos vídeos de YouTube, uno por canal

- La sección `#youtube` pasa de un iframe de lista a dos tarjetas grandes lado a lado: `🎮 La Gocha Gaming` (canal de juegos) y `🎀 Oscuro Stefany` (canal personal).
- Cada columna incrusta la **lista de subidas** del canal (`videoseries?list=UU…`), que siempre tiene arriba el último vídeo publicado: `UURC1cfFCsiPMbOhF_WE0PfQ` y `UUlxRgWolRY-8l7rczzooHzw`. Se actualiza sola, sin IDs a mano, sin API key y sin Edge Function.
- Comprobado contra YouTube: el primer elemento de cada lista de subidas es el último vídeo (`zladXBbRocI` y `soIUbUya2aw`). La lista anterior (`PLdVAlz18ZwEk`, serie GTA) solo mostraba el vídeo nuevo mientras alguien la mantuviera ordenada.
- Fuera el JS inline que detectaba el fallo del iframe y el bloque `.youtube-wrapper`/`.youtube-fallback` de `style.css`, sin uso tras el cambio. `.youtube-grid` se queda: la usan los clips de Kick.
- CSP y busters recalculados con `check.js --fix` (el script inline cambió de contenido).

## [1.83.3] - 2026-11-06

### Limpieza del bloque retirado

- Fuera las dos reglas `.content-section .hero-bio a` y `:hover` de `style.css`: solo las usaba la sección `#directo` que se quitó en la 1.83.2. `hero-bio` se queda porque el hero de la home lo usa.
- Sin cambios de script inline ni de CSP. Busters `?v=1.83.3` reescritos con `check.js --fix`.

## [1.83.2] - 2026-11-06

### Home: fuera el bloque de horarios

- Se retira la sección `#directo` de `index.html` (H2 de horarios y dos párrafos): el contenido se veía sobrecargado entre el player y los clips.
- La pregunta `¿A qué hora empieza La Gocha en Kick?` sigue en la FAQ visible y en el `FAQPage` del JSON-LD, así que la home mantiene la respuesta de horarios sin el bloque largo.
- Sin cambios de script inline ni de CSP. Busters `?v=1.83.2` reescritos con `check.js --fix`.

## [1.83.1] - 2026-11-06

### SEO de la home: directo en Kick

- `<title>` a `La Gocha Gaming (Gochita) Oficial | Directo en Kick` (50 caracteres). Search Console (3 meses) mostraba `kick la gocha gaming` con 12 impresiones, 0 clics y posición 5,83, y `gochita oficial` / `gocha oficial` / `gochaoficial` con 6 impresiones y 0 clics: el title no contenía ni `Oficial` ni la query con `Kick`.
- H1 de `La Gocha Gaming` a `La Gocha Gaming en Kick`.
- Sección nueva `#directo` con H2 `Directo de La Gocha en Kick: horarios y cómo verlo`, colocada entre el player y los clips. Sin horario inventado: enlaza al calendario del canal en Kick y explica cómo verlo y dónde seguir.
- FAQ visible y `FAQPage` del JSON-LD: nueva pregunta `¿A qué hora empieza La Gocha en Kick?` con el mismo texto en ambos sitios.
- `description`, `og:title`, `og:description`, `twitter:title` y `twitter:description` alineados con el title nuevo; `llms.txt` actualizado.
- CSP intacta: `check.js` no hashea los bloques `ld+json` (solo scripts ejecutables y `speculationrules`), así que la meta no cambia. Busters `?v=1.83.1` reescritos con `check.js --fix`.
- Canibalización comprobada antes del cambio: las 7 consultas del periodo son de marca y las gana la home; comunidad, galería, sorteo y cine mantienen su intención. Sin conflicto.
- Hallazgo pendiente (fuera de este cambio): `https://www.lagochagaming.com/` falla el certificado (`SEC_E_WRONG_PRINCIPAL`); hay que reemitirlo desde GitHub Pages con `www` incluido.

## [1.83.0] - 2026-11-07

### App 1.14: paridad de assets y versión única

- APK nuevo: `versionCode` 17, `versionName` 1.14, 4.047.286 B, sha256 `82b77d83…`. Firma intacta (`41a6cdc7…`).
- **Paridad recuperada**: `assets/mobile/mobile.js` era una copia de antes de los ajustes unificados y le faltaban 62 líneas (`leerAjustesWeb`/`guardarAjustesWeb`). Ahora coincide byte a byte con `mobile/`, comprobado dentro del propio APK.
- `build-apk.ps1` copia `D:\Gocha\mobile\*` a los assets **antes** de compilar y aborta si los hashes no coinciden. Antes dependía de que alguien se acordara a mano.
- Las notas de la versión dejan de estar hardcodeadas: `-Notes "..."` o `notes.txt`, y el script falla si no hay. Antes escribía siempre el mismo texto y pisaba las notas reales.
- Versión única: `getVersion()` y `ASSET_CACHE_VERSION` salen de `BuildConfig`, así que subir `versionCode` basta para invalidar la caché de assets.
- Fuera los restos de plantilla de Capacitor: los dos tests de ejemplo del paquete `com.getcapacitor.myapp` y los `cordova.js`/`cordova_plugins.js` vacíos.
- `package.json` a 1.14.0, README de la web y de la app al día, y el checklist de release sin el paso manual de copiar assets.

## [1.82.5] - 2026-11-07

### Los checks cubren lo que faltaba

- `scripts/check.js` falla ahora si aparece `alert(`, `confirm(` o `prompt(` en `main.js`, `mobile.js`, las 5 páginas o `404.html`: están prohibidos por §4 y nada lo comprobaba.
- `scripts/check.js` valida `app/version.json`: JSON parseable, campos `versionCode`, `versionName`, `apkUrl`, `sha256` y `size`, `sha256` de 64 hex y `size` positivo. El BOM que se colaba aquí ya se detecta por dos vías.
- `scripts/smoke.js` abre también `404.html` (6 páginas en vez de 5). Se salta las comprobaciones de navbar y `main.js`, que esa página no lleva a propósito.
- Limpieza local: 62,8 MB de cachés de herramientas (`.playwright-cli`, `.playwright-mcp`, `.tmp-navegador`). No estaban en el repo.

### Revisado y descartado

- La "duplicación" de CSS era en su mayoría legítima: los 45 selectores repetidos viven en media queries distintas con valores distintos (`.gallery-card-autor` cambia `gap` y `font-size` en móvil; `.tab-btn.active` repite color en dos breakpoints). No se tocó.

## [1.82.4] - 2026-11-07

### Una puerta para las Edge Functions y otra para las fechas

- `window.llamarEdge(nombre, cuerpo, { token })` sustituye los 4 bloques de `fetch` a `/functions/v1/` de `main.js` (login de Kick, vincular, entrar y desvincular). Devuelve `{ ok, status, datos }` y mantiene el `json().catch()` tolerante a respuestas vacías. La constante `FN` quedó sin uso y se retira.
- `window.formatearFecha(valor, estilo)` centraliza las **6** copias de formato: `completo`, `dia-mes`, `hora`, `mes-anio`, `fecha-corta` y `dia-mes-hora`. Comprobado en Node que las 6 salidas son idénticas a las anteriores, incluido el separador `·` de U+00B7, el vacío para valores nulos y el vacío para fechas inválidas.
- `mobile/mobile.js` deja de tener su propio mapa de escapado: `esc` usa `window.escapeHtml`, con el mapa local solo como respaldo si la app cargara el archivo sin la página.
- `AGENTS.md` §4 fija las tres reglas: escapado único, `llamarEdge` para Edge Functions y `formatearFecha` para fechas.

## [1.82.3] - 2026-11-07

### Una sola fuente de verdad: Supabase

- Se borra la carpeta local `supabase/`: 24 migraciones que **no** eran las aplicadas en producción (contenían cosas que nunca se ejecutaron), 6 de las 12 Edge Functions y la caché del CLI. `supabase db dump` no es alternativa porque exige Docker y aquí no hay.
- `AGENTS.md` §3, §5.7, §8 y §9.6 reescritos: la base se toca solo contra el proyecto `cydiyaacnyydprgffmkq` con `db query --remote`, y el registro de cada cambio es su entrada en este changelog.
- La lista de Edge Functions se completa con las 12 reales: `kick-oauth-exchange`, `instagram-feed`, `tiktok-feed`, `app-telemetria` y `kick-setup-temp` faltaban. Comprobado que `kick-setup-temp` no es un resto: es una lápida que responde `410 Gone`.
- El CLI recrea `supabase/.temp/` en cada orden; queda como caché ignorada y está documentado así.

### Verificación

- `supabase db query --remote` funciona sin la carpeta local: `select count(*) from usuarios_comunidad` → 6 filas, en solo lectura.
- 87 migraciones y 12 Edge Functions confirmadas por API contra producción.

## [1.82.2] - 2026-11-07

### Código muerto fuera

- `main.js`: se retira `window.gochiUI`, un agregador de 8 métodos con **cero consumidores** en las 6 páginas, `main.js` y `mobile.js`. Los ayudantes que envolvía (`gochiChip`, `gochiSkeleton`, `gochiDropdown`, `cerrarGochiMenus`) siguen igual porque sí se usan.
- `main.js`: fuera `btn.onclick = null` del menú móvil; nadie asignaba nunca ese `onclick` (el botón lo gobierna Alpine).
- `style.css`: fuera `html.densidad-compacta .ranking-item` (la clase no existe en el sitio) y la referencia a `.nav-app-dropdown` en `html.sin-transparencias`, otro selector que nunca casa.
- `mobile/mobile.css`: fuera 4 variables sin un solo `var()`: `--lg-bg-soft`, `--lg-pink-soft`, `--lg-purple` y `--lg-radius`.
- Atributos huérfanos: `data-rango` en el ranking de Comunidad, `id="reporte-foto-modal"` en Galería y `id="btn-join-cuenta"` en Sorteo. Los dos últimos no aparecían en ningún JS ni CSS.

### Backend verificado, sin cambios

- Comprobado contra producción con `supabase db query --remote --read-only`: las **54 RPC** que llama el cliente existen en la base y la auditoría es una sola tabla (`admin_audit_log`) con `admin_auditar()`, que ya resuelve el autor por JWT o por `x-comunidad-token`.
- `supabase/migrations/` **no refleja producción**: contiene migraciones que nunca se aplicaron (la tabla `admin_audit` y `registrar_admin_audit` no existen en la base). Se deja como histórico parcial, no como fuente de verdad.

## [1.82.1] - 2026-11-06

### Correcciones de auditoría

- `img/icons.svg`: se añade el símbolo `i-solid-plus` (Font Awesome Free 6.6.0), que faltaba. El acordeón *¿Cómo funciona?* de Comunidad lo usaba desde la 1.79 y no resolvía, así que se veía un hueco.
- `mobile/mobile.js`: `rpcLogin()` y `logoutAccount()` dejan de llamar a `.rpc(` directamente y pasan por `window.rpcRaw()`. Era la única parte del sitio que se saltaba la puerta única de §4.5 y `scripts/check.js` no la revisaba.
- `app/version.json`: se guarda sin BOM. `JSON.parse` fallaba al leerlo, así que el manifiesto no era parseable por consumidores estrictos.
- `sitemap.xml`: `lastmod` al 2026-11-06 en `/`, `/comunidad`, `/galeria` y `/cine`, que seguían en 2026-11-04.
- `scripts/check.js` vigila tres cosas nuevas: `.rpc(` directo en `mobile/mobile.js`, BOM en cualquier archivo publicado y `img/icons.svg#id` contra los símbolos reales del sprite.

## [1.82.0] - 2026-11-06

### El sorteo se participa solo con la cuenta de la comunidad

- Fuera el campo de usuario de Kick: el banner de inscripción solo ofrece **Participar con mi cuenta**. Sin sesión de comunidad aparece el aviso *¿Aún no tienes cuenta?* con enlace a `comunidad`, en vez de un formulario que permitía apuntarse con el nombre de otra persona.
- Se eliminan `enviarParticipacionTemporal()` y la verificación contra `https://kick.com/api/v2/channels/...`: el nombre lo pone siempre el servidor desde el token con `sortear_entrar()`.
- Reglas y textos del banner actualizados (una participación por cuenta, sin campo de usuario de Kick). Estilo nuevo `.banner-nota` en `style.css`.
- Se conserva el respaldo interno: si en la base faltara la RPC `sortear_entrar`, el cliente valida la sesión y registra con el apodo canónico que devuelve el servidor.

### Base de datos (aplicado en producción el 2026-11-06)

- Migración `20261106120000_sorteo_identidad_y_ganador_unico.sql`: columna `participantes_en_vivo.usuario_id` (una participación por cuenta), RPC `sortear_entrar(p_token)` y `sortear_siguiente()`.
- Ajuste `20261106121500_sortear_siguiente_permiso_anon.sql`: `sortear_siguiente()` también para `anon`. El streamer puede ser admin por sesión de comunidad (rol `anon` en PostgREST + `x-comunidad-token`); sin el grant, PostgREST devolvía 401 antes de ejecutar y el cliente caía al respaldo sin retirar al ganador. La autorización sigue dentro de `es_admin()`.
- Probado con `supabase db query --remote` en una transacción con `ROLLBACK`: `sortear_entrar` devuelve `ok` con el apodo canónico, la segunda llamada `ya_registrado`, un token inventado `sin_sesion` y `sortear_siguiente` sin admin `sin_permiso`. La tómbola quedó en 0 filas y el sorteo cerrado, como estaba.

## [1.81.0] - 2026-11-06

### Mis canjes, para cuadrar las cuentas

- Nueva sección **Mis canjes** en la pestaña *Mi cuenta*: lista `tienda_mis_canjes` con nombre, estado (pendiente/entregado/rechazado), fecha y `−puntos`, y suma el total gastado **excluyendo** los rechazados y cancelados.
- Responde a la duda del historial: `Ganado − Gastado = Saldo`. El historial de puntos solo suma lo que ganas porque `tienda_canjear_premio` descuenta de `usuarios_comunidad.puntos` sin escribir en `puntos_eventos`.
- Se carga al abrir el panel y al cambiar a *Mi cuenta*, con caché de 60 s.

### Sorteo: identidad real y ganador sin repetir

- **Registro con la cuenta**: nuevo botón *Participar con mi cuenta*. La RPC `sortear_entrar(p_token)` valida la sesión de comunidad y saca apodo/Kick del token, así que **nadie puede registrarse con el nombre de otra persona**. Una participación por cuenta.
- **Sin repetir ganador**: `sortear_siguiente()` envuelve a `sortear_ganador_sorteo()` (misma lógica de pesos y de historial) y después **retira al ganador de la tómbola**. Si quedan más premios que gente, el giro responde `sin_participantes` en vez de repetir.
- El cliente usa las RPC nuevas y, si la migración aún no está aplicada, **cae al flujo anterior** con un aviso en vez de romper el sorteo.
- **Pendiente de aplicar en Supabase**: `supabase/migrations/20261106120000_sorteo_identidad_y_ganador_unico.sql`. Sin ella, el sitio sigue con el registro por nombre de Kick y el ganador puede repetir.
- Verificado en navegador: canjes (3 filas, 350 pts gastados ignorando el rechazado), registro sin migración (aviso y foco al campo) y con migración simulada (`✅ ¡Estás dentro, @Tester!`).

## [1.80.0] - 2026-11-06

### CSP real, sin depender de las cabeceras

- Las 6 páginas llevan **`<meta http-equiv="Content-Security-Policy">`**: GitHub Pages no aplica `_headers`, pero la meta sí. Directivas: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, orígenes explícitos para jsDelivr, Umami, Supabase (https y wss), Kick, 7TV, YouTube, Instagram y TikTok.
- `scripts/check.js` es la **fuente única de la política**: calcula el SHA-256 de cada `<script>` inline y de cada bloque `speculationrules` y falla si la meta no coincide con el HTML; `--fix` la reescribe. Los hashes se calculan con saltos de línea normalizados a LF, igual que el parser (con CRLF nunca habrían coincidido).
- `script-src` necesita **`'unsafe-eval'`**: Alpine evalúa `x-data`/`x-on:` en runtime y sin él el sitio se queda sin UI. La CSP limita orígenes y bloquea `object-src`, pero no protege frente a script inline; para eso están los hashes. `frame-ancestors` y `report-uri` no funcionan en meta: no se incluyen para no dar falsa seguridad.
- Verificado con navegador real: **0 violaciones de CSP y 0 errores JS propios en 6 páginas × 2 viewports**, con interacciones (perfil, cambio de tema, menú de la galería).

### 404: el tema nunca se aplicaba

- `404.html` tenía un `</script>` dentro del bloque inline, que partía el script: el primer trozo terminaba en `Unexpected end of input` y el resto se pintaba como texto. Tema y ajustes **no se aplicaban nunca** en esa página. Reescrito el bloque con los dos `try` completos.

### Una sola puerta para las RPC

- Migradas **26 llamadas** directas a `supabase.rpc` en las páginas (comunidad 12, galería 6, cine 4, sorteo 4) a `window.rpcRaw`, que normaliza el error. Mismas firmas: el cambio es 1:1.
- `check.js` **falla** si una página vuelve a llamar a `supabase.rpc` y admite una única llamada directa en `main.js` (la implementación de `rpcRaw`). Probado inyectando una llamada falsa.

### Rendimiento

- `preconnect` a `https://cydiyaacnyydprgffmkq.supabase.co` en `index`, `comunidad`, `sorteo` y `cine` (galería ya lo tenía). Quita DNS y TLS del camino crítico de la primera RPC.

### Documentación (AGENTS.md)

- `ads.txt` documentado como verificación de AdSense, sin anuncios integrados.
- `_headers` deja de figurar como pendiente: es solo referencia; la protección real es la meta CSP.
- "Leaked password protection" marcado como **solo plan Pro** (la cuenta es Free): no es tarea pendiente.
- SRI ya presente en los CDN: corregida la deuda que lo listaba como ausente.

## [1.79.0] - 2026-11-06

### Historial de puntos de los últimos 3 días

- El perfil propio muestra el historial de **Hoy, Ayer y Antes de ayer**, y dentro de cada día una sola fila por forma de ganar con su total y el `× N` de veces. Se acabó la lista larga: 3 bloques con pocas filas en vez de decenas de líneas.
- Cada día lleva su **total** a la derecha (`+16 pts`) y un pie común con `Ganado en 3 días: N pts · Saldo actual: M pts`, más la nota de que la tienda descuenta del saldo.
- Se retira el botón **Ver más**: `cargarHistorial()` pide páginas de 50 movimientos (máximo 4) y se detiene al pasar el corte de anteayer. Máximo ~200 movimientos para pintar 3 días.
- Corregido: el pie sumaba también los movimientos cargados de días anteriores al corte (mostraba 56 pts cuando los 3 días sumaban 44). Ahora suma solo los días visibles.
- Se retiran `historialPagina`/`historialTotal` y la clase `.mp-historial-mas`, que quedaron sin uso.
- Sin cambios de API ni de esquema.

## [1.78.3] - 2026-11-06

### El perfil público ya no muestra el historial de puntos del visitante

- **Bug de privacidad corregido**: la sección «Historial de puntos» solo se ocultaba con `!haySesion`, así que al abrir el perfil público de otra persona seguía visible y mostraba **el historial del visitante** (la RPC `mis_puntos_historial` va por token, no por apodo). Se veían, por ejemplo, `+38` y `+2` bajo un perfil con 16 pts.
- Ahora la sección se oculta también con `$store.perfil.publico`, y `abrirUsuario()` limpia `historial`, `historialEstado`, `historialPagina` y `historialTotal` para que no queden datos de la cuenta anterior.
- Verificado en navegador sin recargar: perfil propio → 2 filas del visitante; abrir `KOTATK` (16 pts) → 0 filas, historial vacío y sección oculta.

### Las ganancias y el saldo ya se explican

- Pie del historial: **Ganado: N pts · Saldo actual: M pts**, con la nota de que el historial solo suma lo que ganas y que los canjes de la tienda descuentan del saldo.
- Motivo real del descuadre: `tienda_canjear_premio` hace `puntos = puntos - costo_puntos` y **no** escribe en `puntos_eventos`, así que la suma de ganancias es mayor que el saldo cuando se ha canjeado algo. No son datos inconsistentes: son cuentas distintas.
- Sin cambios de API ni de esquema.

## [1.78.2] - 2026-11-06

### Historial de puntos sin filas repetidas

- El historial del perfil propio pasa a mostrar **una sola fila por forma de ganar puntos** (`tiempo_conectado`, `visita`, `chat`, `reaccion`, `like`, `muro`…), con el total sumado y un contador `× N` de cuántas veces se ganó. Antes se pintaba una fila por cada movimiento y el mismo texto se repetía decenas de veces.
- Orden por puntos ganados (a igualdad, por número de veces). La paginación de 10 en 10 con **Ver más** sigue, así que las filas se van completando a medida que se cargan más movimientos.
- Se retiran el resumen de movimientos, los separadores por día y los helpers `formatoDia`/`horaPunto` que ya no se usan.

### El icono del tema vuelve a verse en modo claro

- El sprite no tenía `i-solid-moon`, y `initTema()` lo pedía justo en modo claro: el botón del navbar quedaba **vacío** al pasar a claro. Añadido el símbolo (Font Awesome Free 6.6.0).
- Verificado en navegador: en claro `use = img/icons.svg#i-solid-moon`, 16 × 18 px visibles; en OLED `i-solid-circle`; en oscuro `i-solid-sun`.
- Sin cambios de API ni de esquema.

## [1.78.1] - 2026-11-06

### Historial de puntos rediseñado en el perfil propio

- Agrupación por día con separadores legibles (Hoy, Ayer, Lunes 3 de noviembre).
- Cada entrada usa `gochi-card` + `gochi-chip` con icono y tono según la acción (tiempo, visita, chat, reacción, like, muro).
- Resumen superior con total histórico y puntos de hoy.
- Botón Ver más mantiene la paginación de 10 en 10 (RPC `mis_puntos_historial`).
- El perfil público no muestra el historial.
- Sin cambios de API ni de esquema.

## [1.78.0] - 2026-11-06

### Kick deja de pedir autorización en cada cierre de sesión

- Nuevo ajuste del dispositivo **Kick → “No volver a pedir autorización de Kick en este equipo”**, activado por defecto. Se guarda en `gochi_ajustes` como `kickRecordar`.
- `cerrarSesion()` lo consulta: si está activo y hay token de Kick, **no** envía `salir` (que rota el `token_hash`) y conserva `gocha_kick_token`; solo limpia la sesión del chat en memoria y repinta la fachada. El resto del cierre queda igual: token de comunidad, perfil, Auth y cachés.
- “Conectar con Kick” reutiliza ese token y entra directo: ya no aparece la pantalla de autorizar de Kick.
- El recuerdo caduca a los **30 días** (`gocha_kick_recordar_hasta`). Al vencer, `abrirOAuth` descarta el token y pide autorización normal.
- Apagar el interruptor sin sesión abierta borra el token colgando (`window.olvidarKickRecordado`). **Desvincular** Kick también lo borra y revoca en el servidor.
- `cerrarSesionKick({ conservarToken: true })` permite el cierre sin revocar; el cierre de la app (`mobile.js`) respeta el mismo ajuste.
- Verificado en navegador: por defecto `ajuste=true` e interruptor marcado; cerrar sesión deja `kick=fake-kick` y `hasta` a 30 días con el token de comunidad borrado; con el ajuste apagado, `kick=null` y `hasta=null`; caducado → `kickRecordadoVigente()=false`.
- Sin cambios de API ni de esquema.

## [1.77.1] - 2026-11-06

### La paleta como herramienta de moderación

- Con sesión de admin, `Ctrl`/`Cmd` + `K` lista cinco atajos nuevos: **Panel: Usuarios**, **Panel: Reportes**, **Panel: Auditoría**, **Panel: Descargas** y **Panel: Buzón**. Sin sesión no aparecen: la paleta sigue con sus 7 comandos de siempre.
- Escribir `@apodo` (2 letras o más) con sesión de admin añade dos acciones para esa persona: **Ver perfil de X** y **Buscar a X en el panel**, que abre Usuarios ya filtrado por ese apodo.
- `window.abrirAdminPanel(tab, opciones)` y `adminPanel.abrir(tab, opciones)` aceptan `{ buscar }`; el filtro se aplica antes de cargar la primera página.
- La paleta **no** banea ni borra por sí sola: lleva a la fila concreta y la confirmación sigue viviendo en el panel, donde ya existe.
- Verificado en navegador: admin → 12 comandos y `@Mc` → 2 acciones; anónimo → 7 comandos y `@Mc` → 0; “Buscar a Mc en el panel” deja `tab=usuarios`, `buscar="Mc"` y una fila (McChary).
- Sin cambios de API ni de esquema.

## [1.77.0] - 2026-11-06

### Historial de puntos y cola de cine pública

- Nueva RPC `mis_puntos_historial(p_token, p_limit, p_offset)` (`SECURITY DEFINER`, `search_path`, `EXECUTE` a `anon`, `authenticated` y `service_role`): valida la sesión de comunidad y devuelve los movimientos de `puntos_eventos` del usuario, del más reciente al más antiguo, con el total para paginar. `p_limit` saneado a 1–50.
- El perfil propio gana la sección **Historial de puntos**: últimos 10 movimientos con acción traducida, fecha y puntos, más **Ver más**. El perfil público no la muestra.
- La **cola de cine** ya la ve toda la sala. Antes vivía dentro del panel del streamer; ahora es una sección de la página y el formulario, la ayuda y los botones de reproducir/quitar solo aparecen con `body.admin-mode-active`.
- La cola se carga para cualquier visitante (`cine_cola` ya tenía SELECT público); antes solo se pedía si había sesión de admin.
- No se muestra “quién propuso cada video”: `cine_cola.creado_por` guarda siempre `'streamer'` porque solo el streamer puede encolar. Cuando se abra la propuesta a la comunidad habrá algo que enseñar.
- Historial de ganadores del sorteo: ya existía con **Ver historial completo** y paginación; sin cambios.
- Sin cambios de tablas.

## [1.76.1] - 2026-11-06

### Calidad: menos huecos a mano

- `scripts/check.js` valida el contrato de `gochi_ajustes`: extrae las claves del estado por defecto del store `ajustes` y falla si `main.js`, `mobile/mobile.js` o una página leen o escriben una clave que no existe. Una clave huérfana se guardaba y nunca se aplicaba.
- `scripts/smoke.js` añade dos interacciones:
  - con `gochi_ajustes` a `{ texto: 110, animaciones: false, ahorro: true }`, el `<html>` debe llevar `texto-110`, `sin-animaciones` y `ahorro-datos`, y el store debe leer `texto: 110`;
  - en Galería, pulsar like sin sesión debe pedir iniciar sesión y **no** abrir el lightbox.
- Contraste en modo claro: `.mp-peligro` y `.btn-peligro` usan ahora rojo oscuro (`#991b1b` / `#b91c1c`); el rojo claro anterior no llegaba a 3:1 sobre blanco.
- Sin cambios de API ni de esquema.

## [1.76.0] - 2026-11-05

### Galería: una petición y scroll infinito

- Nueva RPC `galeria_publica(p_offset, p_limit, p_orden, p_token)` (`SECURITY DEFINER`, `search_path`, `EXECUTE` a `anon`, `authenticated` y `service_role`): devuelve en una sola respuesta la página de fotos aprobadas, el top 3 por likes, los ids que ya likeó el usuario y si hay más páginas. Límite saneado a 1–60 y orden cerrado a `recientes` | `populares`.
- `galeria.html` pasa de tres viajes en serie a uno: se elimina la consulta de la lista + `cargarTopGlobal` + `obtener_likes_galeria` de la ruta normal. Se conserva esa ruta como respaldo si la RPC falla.
- Scroll infinito con `IntersectionObserver` sobre el botón **Cargar más**: cuando asoma a 300 px se pide la siguiente página sola. El botón sigue ahí como respaldo para quien prefiera pulsar.
- El `thumb_url` que llega vacío se sustituye por `image_url` en el servidor, así el cliente no repite esa lógica.
- Sin cambios de esquema. Realtime y moderación siguen igual.

## [1.75.0] - 2026-11-05

### Una sola pantalla de ajustes

- En la app, el panel de perfil ya no repite lo que la hoja móvil ofrece: **Animaciones**, **Tamaño del texto** y **Datos** desaparecen de la pestaña Ajustes y queda una nota que remite al botón Ajustes. Densidad, Efectos y Sonido siguen ahí porque la app no los tiene.
- Las tres preferencias compartidas se guardan en `gochi_ajustes`, igual que en la web: `texto` (100/110/125), `animaciones` y `ahorro`. Antes la app usaba su propia clave y aplicaba `lg-text-*`, que tapaba a `texto-*`: el ajuste se veía en un sitio y no en el otro.
- `mobile.js` hereda el valor guardado al arrancar y escribe el mismo JSON al cambiarlo, así que la clase `sin-animaciones` y el ahorro de datos funcionan igual dentro del APK. El tema ya compartía `gochi_tema`.
- Tema, vibración y pantalla encendida siguen siendo propios del APK en `lg_mobile_settings`.
- `window.enModoApp()` detecta la clase `lg-app` que añade el APK; sin ella (web normal) la pestaña Ajustes queda completa.
- Verificado en navegador: con `lg-app`, `Animaciones/Tamaño del texto/Datos = ocultas`, `Densidad/Efectos/Chat = visibles`, y al pulsar “Grande” en la hoja móvil queda `texto-110` en `<html>` y `texto: 110` en `gochi_ajustes`.
- Sin cambios de API ni de esquema. La app recoge el `mobile.js` nuevo por su refresco remoto (6 h); no requiere recompilar el APK.

## [1.74.2] - 2026-11-05

### Todas las RPC vuelven a funcionar

- `window.rpcRaw` se llamaba a sí mismo (`return await window.rpcRaw(...)` en lugar de `window.supabase.rpc(...)`), así que **cada** RPC lanzaba `Maximum call stack size exceeded` y devolvía error desde la 1.70.0. El `try/catch` lo tragaba, por eso fallaba en silencio.
- Consecuencia visible: el panel de administración decía “Sin permisos” con una sesión de `owner` válida, y lo mismo rompía puntos diarios, latido de presencia, sugerencias, canjes y todas las acciones `admin_*`.
- La cabecera del panel ahora muestra el rol real (`· Owner`, `· Admin` o `· sin rol`) y, si la comprobación falla por red o sesión caducada, lo dice con botones **Volver a comprobar** y **Entrar de nuevo** en lugar de fingir que faltan permisos.
- Verificado en navegador con una sesión real de `owner`: `admin=true | owner=true | header=Sesión: McChary · Owner` y las cinco pestañas presentes.
- Sin cambios de API ni de esquema.

## [1.74.1] - 2026-11-05

### El acceso de administración, siempre a mano

- Nuevo comando en la paleta (`Ctrl`/`Cmd` + `K`): **Acceso de administración**, que abre el login del panel. Cualquiera lo ve; el panel sigue exigiendo sesión de admin.
- Motivo: el botón discreto del footer solo aparece cuando `es_admin` responde `true`. Si el token de comunidad caduca, el navbar sigue mostrando el perfil guardado y el botón desaparecía, así que el acceso quedaba invisible sin forma evidente de llegar.
- El botón del footer se mantiene igual para admins con sesión válida.
- Verificado en navegador: la paleta lista 7 comandos, encuentra “Acceso de administración” y abre el panel.
- Sin cambios de API ni de esquema.

## [1.74.0] - 2026-11-05

### El chat de Kick gana interacción

- **Agrupación**: los mensajes seguidos del mismo autor en menos de 2 minutos ocultan la cabecera (`.chat-kick-mensaje--continuo`), como en Discord.
- **Autor clicable**: el nombre es un enlace a `https://kick.com/<usuario>`.
- **Acciones al pasar el ratón**: `@` inserta la mención en el campo de escritura y `⧉` copia el mensaje. Se ocultan por defecto y aparecen con `:hover` o `:focus-within`.
- **Menciones resaltadas**: si el mensaje contiene `@tuapodo`, se pinta con fondo y color de acento.
- **Separador de día** cuando cambia la fecha de los mensajes.
- **Botón “Nuevos mensajes”**: aparece si llegan mensajes mientras estás leyendo arriba; al pulsarlo baja al final y desaparece.
- **Densidad compacta** aplicada también al chat de Kick.
- Sin nuevas peticiones ni cambios de esquema; todo es render y CSS.

## [1.73.1] - 2026-11-05

### La galería pinta antes

- `loadApprovedImages()` esperaba tres viajes a Supabase en serie (lista, top global y likes) antes de pintar nada: unos 1,4 s con la conexión fría. Ahora pinta con la primera respuesta y luego enriquece en paralelo con `Promise.all([cargarTopGlobal(), asegurarLikesUsuario()])`, aplicando badges TOP y “me gusta” en sitio sin mover el layout.
- `galeria.html` gana `preconnect` a `https://cydiyaacnyydprgffmkq.supabase.co`, que quita DNS y TLS del camino crítico de la primera petición.
- Sin cambios de API ni de esquema.

## [1.73.0] - 2026-11-05

### Eliminar mi cuenta

- Botón **Eliminar mi cuenta** en Mi cuenta, con tarjeta de peligro y modal de confirmación: hay que escribir el apodo y el PIN. Nada de “¿seguro?”.
- RPC `eliminar_mi_cuenta(p_token, p_pin)` (`SECURITY DEFINER`, `search_path`, `EXECUTE` solo a `anon`, `authenticated` y `service_role`): valida la sesión y el PIN con bcrypt, y en una sola transacción:
  - renombra el apodo a `eliminado_<id>` y pone `eliminado_en = now()`;
  - vacía avatar, bio, redes, icono, género, datos de Kick, `auth_user_id` y `pin_hash` (aleatorio);
  - borra sus sesiones, sus participaciones en sorteo y cancela canjes pendientes;
  - reescribe el autor a “Cuenta eliminada” en `comunidad_chat`, `muro_saludos` y `galeria`;
  - deja fila en `admin_audit_log`.
- Protecciones: no se pueden eliminar las cuentas con rol `owner`/`admin` ni el perfil reservado `LaGochaGaming`.
- Como el apodo desaparece y el PIN se inutiliza, el login con PIN y el de Kick dejan de encontrar la cuenta sin tocar sus funciones.
- `eliminado_en is null` en el top de comunidad y en la lista de menciones `@`.
- Sin cambios de API para el resto del cliente.

## [1.72.0] - 2026-11-05

### El ahorro de datos reacciona en vivo

- El store `ajustes` emite `gochi:ajustes` en cada `guardar()`, con los datos nuevos en `detail`.
- La home escucha ese evento y aplica el cambio sin recargar: al activar el ahorro vacía `#ig-feed`, `#tiktok-feed` y `#kick-clips`, quita lo cargado y pinta las tres tarjetas de pausa; al desactivarlo quita las tarjetas y carga los feeds (con un flag `feedsCargados` para no repetir peticiones).
- El botón “Cargar contenido” de cada tarjeta reanuda los tres feeds en el momento.
- Verificado en navegador sin recargar: `antes=0 | tras activar=3 | tras desactivar=0`.
- Sin cambios de API ni de esquema.

## [1.71.2] - 2026-11-05

### Instagram y TikTok también centrados

- `.ig-feed` es un grid de tres columnas, así que la tarjeta de pausa caía en la primera celda y el `margin: auto` no la movía. Ahora `.ig-feed > .ahorro-pausa` comparte la regla del grid de clips: `grid-column: 1 / -1` + `justify-self: center`.
- Verificado en navegador: las dos tarjetas de `.ig-feed` salen centradas (`true,true`).
- Sin cambios de API ni de esquema.

## [1.71.1] - 2026-11-05

### Las tarjetas de pausa, centradas

- `.ahorro-pausa` pasa a `margin: 0 auto` con `width: min(100%, 420px)`, así que se centra en su columna en vez de quedar pegada a la izquierda.
- Dentro del grid de clips, la tarjeta ocupa la fila completa (`grid-column: 1 / -1`) y se centra con `justify-self: center`.
- Verificado en navegador: tarjeta en 430–850 dentro de un contenedor de 20–1260, `centrada=true`.
- Sin cambios de API ni de esquema.

## [1.71.0] - 2026-11-05

### Ahorro de datos con un diseño propio

- Con el ahorro activo, cada feed muestra una tarjeta `.ahorro-pausa` dentro de su columna en lugar de un botón suelto: título “Contenido pausado”, explicación de qué no se carga y un único botón “Cargar contenido” que reanuda Instagram, TikTok y clips.
- Se eliminan los esqueletos mientras está pausado, para que no parezca que está cargando algo que nunca llega.
- Las tres pausas (Instagram, TikTok y `#kick-clips`) comparten el mismo botón: al pulsar cualquiera se quitan las tres y se lanzan las tres cargas.
- Se retira `.aviso-ahorro`, reemplazado por `.ahorro-pausa`, `.ahorro-pausa-titulo`, `.ahorro-pausa-detalle` y `.ahorro-pausa-btn`.
- Verificado en navegador: 3 tarjetas de pausa, 0 esqueletos y sin desborde horizontal.
- Sin cambios de API ni de esquema.

## [1.70.0] - 2026-11-05

### Todas las RPC pasan por un único punto

- Nuevo `window.rpcRaw(nombre, params)`: misma forma que `supabase.rpc` (`{ data, error }`) pero con `try/catch` propio y error normalizado. Permite migrar las llamadas existentes sin reescribir cada bloque.
- Migradas **30 llamadas** (23 en `main.js`, 3 en `index.html`, 2 en `galeria.html`, 2 en `cine.html`). Quedan **0** accesos directos a `window.supabase.rpc` en el proyecto.
- `window.rpc` sigue siendo la variante de alto nivel (`{ ok, data, error }`) para código nuevo.
- Revisado el contraste del tema claro: texto `#064e3b` sobre `#ffffff` (~9:1), secundario ya en 4,5:1 y bordes sutiles a propósito. Sin cambios.
- Sin cambios de API ni de esquema.

## [1.69.0] - 2026-11-05

### Tests de interacción, wrapper de RPC y diálogos accesibles

- `scripts/smoke.js` gana un bloque de interacciones: comprueba que existen `window.sonidoChat`, `window.exportarMisDatos` y el store `ajustes`, que `Ctrl+K` abre la paleta con comandos y que `Escape` la cierra.
- Nuevo `window.rpc(nombre, params, opciones)`: única puerta a las RPC de Supabase. Devuelve `{ ok, data, error }`, centraliza el aviso de error y permite silenciarlo con `{ error: false }`. Migrada `es_admin`, que ahora usa el wrapper.
- Accesibilidad de diálogos: `.admin-global-card`, `.modal-sugerencias-card` y `.reporte-foto-box` pasan a `role="dialog"` con `aria-modal="true"` y `aria-labelledby` apuntando a su título.
- Sin cambios de API ni de esquema.

## [1.68.0] - 2026-11-05

### Ahorro de datos y exportar mis datos

- **Ahorro de datos** en Ajustes: con el interruptor activo, la home no carga los feeds de Instagram, TikTok ni los clips de Kick hasta que el visitante pulsa “Cargar contenido”. Se aplica la clase `.ahorro-datos` en `<html>` y la preferencia se lee de `gochi_ajustes` antes de lanzar las peticiones.
- **Exportar mis datos** en Mi cuenta: descarga `lagochagaming-mis-datos.json` con el perfil de la sesión y las preferencias del dispositivo. Todo en el navegador, sin peticiones nuevas.
- Componentes nuevos: `.mp-acciones-extra` y `.aviso-ahorro`.
- La página de inicio preferida se descarta: obligaría a redirigir desde `/`, lo que rompe enlaces compartidos, el botón Atrás y la canónica de la home.
- Sin cambios de API ni de esquema.

## [1.67.2] - 2026-11-05

### Densidad, efectos y aviso sonoro del chat

- **Densidad** con dos tarjetas de opción (`.mp-opcion`, patrón Pines): Cómoda y Compacta. La compacta reduce el aire del chat, las tarjetas de galería y el ranking.
- **Efectos**: interruptor de desenfoques y transparencias (`.sin-transparencias` quita `backdrop-filter` y da fondo sólido al navbar) y **alto contraste** (`.alto-contraste` sube el borde al 75 % y aclara el texto secundario).
- **Sonido del chat**: `window.sonidoChat()` genera dos tonos cortos con Web Audio, sin archivos ni CDN. Suena solo si el mensaje no es tuyo, si la pestaña está oculta o no estás al final del chat, y como máximo una vez cada 2 segundos. El `AudioContext` se arma con la primera interacción, porque los navegadores bloquean el audio hasta entonces.
- Las tres preferencias nuevas se suman a `gochi_ajustes` y sus clases se aplican antes del primer pintado desde el script inline de las 6 páginas.
- Sin cambios de API ni de esquema.

## [1.67.1] - 2026-11-05

### El interruptor de Ajustes se ve bien

- `.gochi-switch-track` no tenía `display` propio: dentro de la pestaña Ajustes se pintaba como elemento inline de 2 px y se montaba sobre el texto del interruptor (“Per…tir animaciones”). Ahora es `inline-block` y mide sus 40 × 23 px.
- Verificado en navegador: `w=40 h=23 display=inline-block`.
- Sin cambios de API ni de esquema.

## [1.67.0] - 2026-11-05

### Mi cuenta y Ajustes por separado

- El panel de perfil pasa de dos pestañas a tres: **Perfil** (lo que ven los demás, solo lectura), **Mi cuenta** (datos que viven en la base de datos: avatar, género, bio, redes, Kick, guardar) y **Ajustes** (preferencias de este dispositivo).
- La pestaña que antes se llamaba “Ajustes” conserva su contenido intacto y solo cambia de nombre y de estado interno (`cuenta`). `abrir(vista)` acepta `perfil`, `cuenta` y `ajustes`, y el flujo de Kick tras registrarse abre `cuenta`.
- **Ajustes** guarda un único JSON en `gochi_ajustes` mediante `window.almacen` y aplica clases en `<html>`: `.sin-animaciones`, `.texto-90/110/125` y `.densidad-compacta`.
- Store `ajustes` en Alpine con `cargar()`, `aplicar()`, `guardar()` y `set(clave, valor)`. Los controles usan `x-model` y `x-for`; sin listeners por elemento.
- Componente nuevo `.gochi-segmento` (patrón Pines) para elegir el tamaño de texto.
- Las clases se aplican **antes del primer pintado** con un script inline en las 6 páginas, junto al del tema; así no hay destello ni cambio de tamaño tras cargar.
- Verificado en navegador: `html=sin-animaciones texto-110` y `gochi_ajustes={"animaciones":false,"texto":110,"densidad":"comoda","sonido":true}`.
- Sin cambios de API ni de esquema.

## [1.66.2] - 2026-11-05

### La identidad exige token

- `comunidad.html` adoptaba el apodo guardado (`comunidad_nickname`) sin comprobar que existiera sesión. Con el token caducado o borrado, el navbar decía `LOGIN` pero el panel “Tu perfil”, el campo de autor del chat y la presencia seguían mostrando la cuenta vieja.
- Ahora, al cargar, sin `comunidad_session_token` se borran `comunidad_nickname`, `comunidad_user_id` y `comunidad_session_usuario`, se oculta el panel de perfil y no se registra presencia, porque `nickParaTrack` queda vacío.
- Verificado en navegador: con apodo e id falsos y sin token, tras recargar quedan a `null`, el panel sale `hidden` y el campo de autor, vacío.
- **Regresión de la 1.66.0 arreglada**: el script de migración reescribió también las líneas internas de `window.almacen`, así que `texto()` y `guardarTexto()` se llamaban a sí mismos. La recursión desbordaba la pila, el `catch` la tragaba y devolvía `true` sin escribir nada, de modo que el tema, el orden de la galería y cualquier ajuste se perdían al cambiar de página. Ahora los métodos usan `localStorage` directamente. Verificado: pulsar el tema deja `gochi_tema=light` y la clase `light-mode` en el `body`.
- Sin cambios de API ni de esquema.

## [1.66.1] - 2026-11-05

### Se acabó la sesión fantasma y el error mudo de Kick

- `window.limpiarEstadoSesionUI()` vacía los stores `perfil`, `chat` y `ranking` y repinta el navbar cuando la sesión desaparece. Antes `cerrarSesion()` limpiaba el almacenamiento pero el panel derecho seguía mostrando el usuario viejo y la presencia mantenía la fila hasta 2 minutos. Verificado en navegador: tras llamarlo, `$store.perfil.usuario` queda `{}` y el chat sin mensajes.
- `cerrarSesion()` llama a ese helper justo después de borrar las claves.
- El fallo de Kick deja de ser un toast mudo: se registra el código real en consola y el mensaje distingue `sin_kick` («Tu sesión de Kick caducó…»), el mensaje del servidor y la excepción de red.
- Sin cambios de API ni de esquema.

## [1.66.0] - 2026-11-05

### Un solo acceso a localStorage

- Nuevo `window.almacen` en `main.js`: `texto()`, `guardarTexto()`, `leer()`, `guardar()` y `borrar()`, todos con un único `try/catch` y soporte de JSON. Elimina el patrón repetido `try { localStorage.getItem(...) } catch (e) {}` que aparecía por todo el archivo.
- Migradas **79** llamadas en `main.js`: 0 usos directos de `localStorage.getItem/setItem/removeItem` restantes (antes 79).
- Los scripts inline de las páginas se dejan como estaban a propósito: el del tema corre antes de que `main.js` (defer) defina el helper, y migrarlo rompería el arranque sin destello.
- Sin cambios de API ni de esquema.

## [1.65.0] - 2026-11-05

### Paleta de comandos y menciones en el chat

- **Paleta de comandos** (`Ctrl`/`Cmd` + `K`): overlay con búsqueda, navegación por páginas y acción de cambiar tema. Filtra sin acentos, mueve con flechas, ejecuta con `Enter`, cierra con `Escape` o clic fuera y devuelve el foco al elemento anterior. Se construye en `main.js` sin dependencias y se pinta con `.gochi-paleta*` en `style.css`.
- **Menciones `@` en el chat de comunidad**: al escribir `@` aparece una lista con los apodos que empiezan por lo tecleado, hasta 8. Flechas para moverse, `Enter`/`Tab` para insertar en el cursor, `Escape` para cerrar. La lista se pide una vez a `usuarios_comunidad` (solo columna `apodo`) y se cachea en memoria. Marcado nuevo: `#chat-menciones` + `.chat-menciones`.
- **Subida con arrastrar y soltar**: ya existía en galería (`arrastrando`, `soltar($event)` y resalte `dragover`), así que no se duplicó.
- Sin cambios de API ni de esquema.

## [1.64.0] - 2026-11-05

### Fuentes propias: Space Grotesk + Inter

- Se acabó el CDN de Google Fonts. `fonts/` guarda dos woff2 **variables** con subconjunto latin: `inter-latin-variable.woff2` (47 KB, 400–700) y `space-grotesk-latin-variable.woff2` (22 KB, 300–700). 69 KB en total y cubren todos los pesos que usa el CSS.
- `@font-face` vive en `style.css` (dentro de `@layer base`) con `font-display: swap`. Las 6 páginas cambian el `<link>` de Google y los dos `preconnect` por `preload` de los dos woff2.
- El cuerpo pasa a Inter (ya era) y los títulos y el logo a **Space Grotesk**. El logo baja de `font-weight: 900` a `700`, el máximo real de la familia.
- Motivo: con `display=optional` el navegador decidía en ~100 ms si usar la webfont; con caché fría caía al respaldo y la negrita de “EN VIVO” se veía distinta que tras un `F5`. Ahora el archivo es local y llega precargado: mismo grosor y mismas formas en toda carga. Además se sintetizaba el peso 700, que el CSS usa 47 veces y no estaba en la lista descargada.
- `_headers`: fuera `fonts.googleapis.com` de `style-src` y `fonts.gstatic.com` de `font-src`.
- Sin cambios de API ni de esquema.

## [1.63.3] - 2026-11-05

### El estado EN VIVO ya no salta al cargar

- `window.pintarEstadoNav(vivo)` centraliza el pintado del tag y del brillo del navbar, y guarda el último estado en `gochi_en_vivo_ultimo` (`localStorage`). Al construir la navbar se aplica ese valor antes de cualquier consulta, así que el tag aparece en su sitio desde el primer frame y no empuja los enlaces cuando responde Kick.
- `verificarEstadoStream()` usa ese mismo pintado en vez de duplicar el `classList`/`hidden`.
- El brillo del navbar pasa a ser fijo (`box-shadow: 0 0 26px rgba(83, 252, 24, 0.5)`): se elimina `@keyframes navbarPulse` y su excepción en `prefers-reduced-motion`. Se acaba el repintado continuo de una franja del ancho de la ventana mientras hay directo, y la captura deja de cambiar según el fotograma. El punto sigue latiendo con `navLivePulse`.
- Sin cambios de API ni de esquema.

## [1.63.2] - 2026-11-05

### Smoke test de las cinco páginas

- Nuevo `scripts/smoke.js`: abre `index`, `comunidad`, `galeria`, `sorteo` y `cine` a 1690×900 y 390×844 y falla si hay error HTTP, falta `<title>` o navbar, falta el contenido principal, hay desborde horizontal (`scrollWidth > innerWidth`), los busters no coinciden con `VERSION` o aparece un error de consola propio del sitio. Ignora ruido de terceros (Supabase, Kick, 7TV, Umami, IVS).
- Levanta su propio servidor estático en el puerto 8788 o reutiliza uno con `--url=`. Usa Chrome o Edge del sistema si el paquete de Playwright no trae su Chromium.
- Resultado actual: `SMOKE OK: 5 páginas × 2 tamaños (v1.63.2)`.
- Sin cambios de API ni de esquema.

## [1.63.1] - 2026-11-04

### El panel de perfil abre al instante

- `perfil.cargar()` pintaba esqueletos hasta que terminaban la consulta del usuario y la de avatares, por eso el panel tardaba segundos en mostrar algo. Ahora aplica primero la sesión guardada (`comunidad_session_usuario`): nombre, puntos, rango, avatar y bio aparecen en el mismo frame.
- La consulta a `usuarios_comunidad` y la RPC `obtener_avatares_disponibles` van en paralelo con `Promise.all`, en vez de una detrás de otra.
- La lista de avatares se cachea en memoria: al reabrir no se vuelve a pedir.
- Reabrir el panel en menos de 30 segundos no lanza ninguna petición; solo refresca pasado ese margen.
- Medido en navegador: `abrir()` responde en 1 ms con el apodo ya visible y `cargando=false`.
- Sin cambios de API ni de esquema.

## [1.63.0] - 2026-11-04

### Capas de CSS y la galería recuerda su orden

- `style.css` queda envuelto en `@layer base` y se declara el orden `base, componentes, utilidades`. Todo el CSS actual vive en `base`, así que el resultado visual es idéntico (verificado: fondo `rgb(17, 24, 39)`, tarjeta `rgb(31, 41, 55)`, borde teal `rgba(94, 234, 212, 0.28)`, navbar y títulos sin cambios). La ganancia es que a partir de ahora las reglas nuevas pueden ir en `componentes` o `utilidades` y ganar sin pelearse por especificidad, que es lo que rompió el panel 7TV.
- La galería recuerda el orden elegido (`Más Populares` / `Más Recientes`) en `gochi_galeria_orden`: al volver, el menú, el `aria-checked` y la consulta arrancan con esa opción. Guardado protegido por `try/catch` para modo privado.
- Sin cambios de API ni de esquema.

## [1.62.1] - 2026-11-04

### Campos inválidos sin JavaScript

- `.gochi-campo:has(input:user-invalid, textarea:user-invalid)` pinta la etiqueta y el borde del campo en rojo cuando el propio navegador considera el valor inválido. Antes eso dependía de que Alpine pusiera `data-estado="error"`; ahora funciona también antes de que Alpine arranque y en formularios sin store.
- Se evaluaron container queries para las tarjetas de galería y se descartaron: `.gallery-grid` usa `minmax(250px, 1fr)`, así que una tarjeta nunca baja de 250 px y la consulta no llegaría a dispararse. Añadirlas habría sido código muerto.
- Sin cambios de API ni de esquema.

## [1.62.0] - 2026-11-04

### Precarga declarativa y sesión sincronizada entre pestañas

- Los `<link rel="prefetch">` manuales se sustituyen por **Speculation Rules** (`<script type="speculationrules">`): `source: document`, `href_matches` a `/*.html` y `/`, y `eagerness: "conservative"`. El navegador precarga solo cuando el usuario va a navegar, así que en reposo no se descarga ninguna página.
- `BroadcastChannel('gocha_sesion')` en `main.js`: al iniciar o cerrar sesión se avisa a las demás pestañas, que refrescan la caché de admin, la sesión vinculada y el navbar sin recargar. Se emite en login con PIN, login con Kick y logout.
- `scripts/check.js`: valida el JSON de `speculationrules` en las 5 páginas, falla si vuelve un `rel="prefetch"` y ya no intenta parsear como JS los scripts cuyo `type` no sea JavaScript (JSON-LD, speculationrules).
- Sin cambios de API ni de esquema.

## [1.61.20] - 2026-11-04

### FAQ a una columna, sin cajas encogidas

- El bloque mezclaba `.faq-list` (grid de 2 columnas con `align-items: start`) y `.gochi-accordion` (flex en columna). Ganaba el flex, pero sobrevivía `align-items: start`, que encogía cada `<details>` al ancho de su texto y dejaba medio ancho vacío a la derecha.
- Ahora la FAQ es un acordeón de una columna: `align-items: stretch`, `width: 100%` y `max-width: 820px` centrado.
- Se elimina `.faq-list` (sin uso) y se quitan de `.faq-item` el fondo, borde, radio y relleno duplicados con `.gochi-accordion-item`.
- Verificado: 6 elementos a 820 px en escritorio, 350 px a 390 px de ancho, sin desbordes.
- Sin cambios de API ni de esquema.

## [1.61.19] - 2026-11-04

### El panel de 7TV ya no se recorta

- El panel se anclaba con `right: 0` al campo de escritura: su borde izquierdo caía 28 px fuera del chat (medido: panel `l=1238`, `.chat-sidebar` `l=1266`) y el `overflow: hidden` de `.chat-sidebar` le comía el borde y las primeras letras de la cabecera.
- Ahora se ancla con `left: 0`, así nace en el borde del campo y cabe entero dentro de la columna.
- Se fusionan las dos reglas que competían (`.chat-kick .chat-kick-emote-panel` y `.chat-kick-emote-panel`) en una sola, con `background-color: #0d0d0d` de respaldo antes de `var(--card-bg, #0d0d0d)`.
- Medidas definitivas: `width: min(320px, calc(100vw - 32px))`, `max-height: min(240px, 40vh)`, `z-index: 60`.
- Sin cambios de API ni de esquema.

## [1.61.18] - 2026-11-04

### Panel de emotes 7TV del chat de Kick

- `.chat-kick-emote-panel` tiene panel propio: fondo `--card-bg` opaco, borde, sombra, `max-height` y scroll. Antes solo heredaba `.chat-emote-panel` y dejaba leer los mensajes del chat por detrás.
- `.chat-kick-emote-grid` pasa a rejilla de 34 px con imágenes de 30 px; `.chat-kick-emote-estado` y `.chat-kick-emote-error` quedan centrados y con color propio.
- La ✕ sigue dentro del panel y el panel se ancla sobre el campo de escritura (`.chat-kick-campo-wrap` ya era `position: relative`).
- `scripts/check.js` revisa también las clases del markup que genera `main.js`, no solo el HTML estático. Retiradas 4 clases sin regla: `chat-emote-7tv`, `nav-user-pts`, `gochi-confirm-copy` y `mp-kick-quitar`.
- Sin cambios de API ni de esquema.

## [1.61.17] - 2026-11-04

### Guardia de clases muertas y revisión de la app

- `scripts/check.js` falla ahora si una clase estática del HTML no tiene regla en `style.css` o `mobile/mobile.css`. Lista blanca: hooks que consulta JS (`comunidad-page`, `chat-msg-vacio`, `kick-perfil-overlay`, `despierto`) y prefijos construidos en runtime (`rango-`, `rango-texto-`, `kick-badge-`, `lg-`). Probado metiendo `clase-fantasma` en `404.html`: el check la detecta y falla.
- Revisión de la app Android: `app/version.json` (v1.13, `versionCode` 16, 4.043.426 B) coincide con el APK publicado (sha256 `299c9053…`), con `android/app/build.gradle` de `D:\Apk Gocha`, con el desplegable `#nav-app` de `main.js`, con `mobile/mobile.js` y con `README.md`. Los `mobile.css` y `mobile.js` del repo son idénticos byte a byte a los que empaqueta el APK.
- `AGENTS.md` documenta el estado actual: sin Tailwind, la guardia nueva, versión de la app y huellas del APK.
- Sin cambios de API ni de esquema.

## [1.61.16] - 2026-11-04

### Limpieza de código muerto (auditoría)

- Auditoría completa con cruce CSS ↔ HTML ↔ JS: 776 clases CSS, 36 variables, 162 ids, 195 funciones y 21 activos. Resultado: 0 clases CSS sin uso (las 8 que marcaba eran `kick-badge-*`, construidas en runtime con `'kick-badge-' + tipo`), 0 variables de tema sin uso, 0 ids sin referencia, 0 activos huérfanos.
- Se retiraron 24 tokens de clase sin ninguna regla CSS ni uso en JS: `navbar-expand-lg`, `navbar-brand`, `navbar-nav`, `navbar-toggler`, `kick-icon`, `faq-section`, `clips-section`, `tt-feed`, `chat-sidebar-box`, `estado-canal-box` y los cuatro `rango-progreso-*`. Sin cambio visual: ninguna de esas clases tenía regla.
- Se conservan a propósito `comunidad-page`, `kick-perfil-overlay` y `chat-msg-vacio` (las consulta JS), las clases dinámicas `rango-*`, `kick-badge-*` y `rango-texto-*`, y las APIs `window.lgOpenAccount` y `window.__lagochaBack` aunque no tengan llamadas en el repo: las invoca la app Android.
- Sin cambios de API ni de esquema.

## [1.61.15] - 2026-11-04

### Fuera el CDN de Tailwind (fin del parpadeo de cajas)

- El CDN de Tailwind se inyectaba en idle, después de la primera pintura. Al entrar, su CSS reseteaba `border-color` a `#e5e7eb` en todos los elementos, así que cada caja con borde se pintaba clara durante milisegundos al cargar y al cambiar de página. Confirmado con `?notw=1`: sin el CDN el parpadeo desaparece.
- Se retira el cargador completo de `main.js` (`window.cargarTailwind`, `asegurarTailwind`, `tailwindListo`, `TAILWIND_CDN`) y la validación correspondiente de `scripts/check.js`, que ahora falla si el CDN vuelve. El toast queda con `.gochi-toast-stack`, que ya define posición y tipografía en `style.css`.
- Se retiran los andamios temporales de diagnóstico `?diag=1`, `?diag=2`, `?diag=3`, `?plain=1` y `?notw=1`.
- Sin cambios de API ni de esquema.

## [1.61.14] - 2026-11-04

### Interruptor para probar el CDN de Tailwind

- `?notw=1` desactiva la inyección del CDN de Tailwind en esa carga (`window.GOCHA_TAILWIND = false`). Sirve para comprobar si el parpadeo de la recarga viene de la llamada al CDN.
- Sin cambios de API ni de esquema.

## [1.61.13] - 2026-11-04

### Modo plano temporal (`?plain=1`)

- `?plain=1` apaga bordes, sombras, filtros y degradados de la página para aislar qué pinta las cajas que reporta un usuario. Sirve junto al panel `?diag`.
- Se retira cuando el problema esté localizado. Sin cambios de API ni de esquema.

## [1.61.12] - 2026-11-04

### Diagnóstico `?diag=3`

- El escaneo de `?diag=2` amplía la búsqueda a `outline`, `box-shadow`, fondos claros y pseudo-elementos `::before`/`::after`, que también pueden dibujar una caja.
- `?diag=3` repite el escaneo al cargar (T0) y a los 2,5 s (T2.5s) para capturar estados que aparecen y desaparecen al cambiar de página.
- Sin cambios de API ni de esquema.

## [1.61.11] - 2026-11-04

### Diagnóstico: localizar los bordes claros

- `?diag=2` añade al panel de diagnóstico un escaneo del DOM: lista los elementos que pintan bordes u `outline` claros (luminancia > 0,72), ordenados por área, con su selector y el valor exacto. Sirve para ver en el navegador del usuario qué regla dibuja las cajas sin abrir DevTools.
- Sigue siendo temporal. Sin cambios de API ni de esquema.

## [1.61.10] - 2026-11-04

### Panel de diagnóstico temporal

- `?diag=1` en cualquier página pinta un panel de solo lectura con lo que ve el navegador: `forced-colors`, `prefers-contrast`, soporte de `color-mix` y `forced-color-adjust`, variables de tema y estilos computados de navbar y tarjetas. Sirve para diagnosticar el caso de cajas blancas sin abrir DevTools.
- Se retira cuando el problema esté localizado. Sin cambios de API ni de esquema.

## [1.61.9] - 2026-11-04

### Prefetch ligero y sin 404

- Las páginas precargaban `comunidad`, `galeria`, `sorteo` y `cine` sin extensión. GitHub Pages no resuelve URLs limpias: cada visita gastaba 3–4 peticiones que terminaban en 404 (ruido en consola y en Search Console). Ahora el prefetch apunta a `*.html`.
- La home precarga solo `comunidad.html` y las subpáginas solo `./`: cada carga baja de 4 documentos precargados (~174 KB) a 1. El resto sigue navegando con caché normal.
- Sin cambios de API ni de esquema.

## [1.61.8] - 2026-11-04

### El sitio ya no se ve roto en modo de contraste alto

- Con `forced-colors: active` (tema de contraste de Windows, extensión de accesibilidad o emulación de DevTools) el navegador borraba fondos e imágenes y dibujaba un borde blanco en cada caja: la galería parecía sin CSS. El bloque de `style.css` ahora opta por `forced-color-adjust: none` en `html`: se conserva la paleta del sitio y solo se mantiene el anillo de foco del sistema.
- Sin cambios de API ni de esquema.

## [1.61.7] - 2026-11-04

### Menos salto en ranking y fuentes

- El esqueleto del ranking ocupa la misma altura que la lista real de 3 filas: al llegar los datos ya no empuja el contenido (CLS 0,032).
- Las fuentes de Google pasan a `display=optional`: si no llegan a tiempo se usa la de respaldo y no hay reflujo de texto.

## [1.61.6] - 2026-11-04

### Enlaces del 404

- `404.html` enlazaba `/galeria`, `/sorteo`, `/cine` y `/comunidad` sin extensión. GitHub Pages no resuelve URLs limpias, así que esos enlaces volvían a caer en el 404. Ahora apuntan a `*.html`.
- El prefetch de 1.61.5 pedía esos enlaces en segundo plano y llenaba la red de 404; queda corregido en origen.

## [1.61.5] - 2026-11-04

### Carga sin saltos y menos CSS muerto

- El chat ya no espera al set de emotes 7TV antes de pedir el historial: ambos se cargan en paralelo.
- Chat, ranking y tienda pintan la última copia de `sessionStorage` al instante y revalidan en segundo plano. Esas claves se limpian al cerrar sesión.
- Los esqueletos esperan 200 ms antes de mostrarse: si los datos llegan antes, no hay parpadeo.
- La navbar vacía se oculta hasta que `main.js` la monta.
- El tema claro/OLED se aplica antes del primer pintado con un script inline: se elimina el destello oscuro a claro.
- Precarga (`rel="prefetch"`) de las otras páginas del navbar.
- Limpieza: variables `--fs-*` muertas y regla `.tienda-canjeo-estado.rechazado` sin uso.

## [1.61.4] - 2026-11-04

### Tooltip sin globo prematuro

- El tooltip global espera 220 ms de hover antes de pintarse y se recoloca con `ResizeObserver` cuando el botón o su tarjeta cambian de tamaño. Al abrir un perfil, `x-trap` enfocaba la ✕ y el globo aparecía con la tarjeta a medio construir.
- Se quitan los disparadores `focusin`/`focusout`: el tooltip visible queda como ayuda de ratón y los botones conservan su `aria-label`.
- Si el elemento pierde el DOM, el globo se oculta en vez de quedarse flotando.

## [1.61.3] - 2026-11-04

### Tooltip Cerrar dentro del modal

- El globo de los `data-tooltip` se limita ahora al recuadro del modal que lo contiene (`.modal-perfil-card`, `.gochi-modal-box`, `.admin-global-card`, `[role="dialog"]`). En el botón ✕ del perfil público ya no se sale de la tarjeta.
- Si no cabe encima del elemento, el globo pasa a colocarse debajo, y se mantiene dentro del viewport.

## [1.61.2] - 2026-11-04

### Limpieza de huerfanos

- Eliminado pack-tail-alpi-pines.md (plan ya cerrado) y su excepcion en .gitignore.
- Borradas clases CSS sin uso: chat-kick-salir, gochi-modal-feedback, mp-logout, mp-icono, mp-avatar-acciones, mp-contador, dmin-global-foot, tn-secondary, chat-kick-fab, gochi-campo-error, gochi-card-titulo, gochi-card-texto, gochi-card-pie, gochi-accordion-trigger, ideo-card--skeleton, gochi-no-scroll y los selectores .mp-actions .btn-logout.
- La regla de impresion oculta .lg-chat-fab (la clase real del boton movil) en lugar de chat-kick-fab.

## [1.61.1] - 2026-11-04

### Panel de administración en tablas del pack

- Usuarios, Descargas y Auditoría del panel global se pintan con `gochi-tabla` + `gochi-tabla-wrap` (`data-label` en cada celda). Por debajo de 760 px cada fila se convierte en tarjeta con etiquetas y acciones a ancho completo.
- Usuarios: 4 columnas (Usuario, Puntos, Estado, Acciones); la última conexión pasa bajo el apodo en la propia celda. Se elimina el grid de tarjetas (`.admin-usuarios-grid`, `.admin-usuario-card`, `.admin-usuario-info`, `.admin-usuario-acciones`, `.auditoria-item`, `.auditoria-meta`, `.desc-fila`).
- Estilos nuevos de fila: `.fila-staff`, `.fila-baneado`, `.fila-shadowban`, `.admin-tabla-acciones` y `.auditoria-detalle` con scroll acotado.
- `scripts/check.js` comprueba los estilos nuevos y el patrón `gochi-tabla--admin`.

## [1.61.0] - 2026-11-04

### Migración final al pack (Tailwind + Alpine + Pines)

- Tarjetas: galería (públicas, pendientes y skeleton), premios de la tienda y clips de Kick usan `gochi-card`; nueva variante `gochi-card--media` para tarjetas con imagen a sangre (sin padding ni gap).
- Progreso: las dos barras de rango de Comunidad usan `gochi-progress` + `gochi-progress-fill` manteniendo los IDs que actualiza el JS.
- Chips: el estado de cada usuario del panel (activo/baneado/shadowban), el rol y la marca KICK usan `gochi-chip`; se elimina el CSS muerto de `.estado-badge`.
- Clips de Kick: duración y vistas se pintan con `gochiChip()` (con respaldo de texto si la API no está cargada).
- `window.gochiUI` expone `abrirHoja` y `cerrarHoja`, que delegan en el store `adminPanel`.
- `scripts/check.js` valida `gochi-card--media` y la API de hoja.

El componente `gochi-tabla` queda como respaldo para futuras tablas: hoy el panel admin usa tarjetas y listas, no hay `<table>` en el sitio.

## [1.60.3] - 2026-11-04

### Correcciones tras prueba E2E

- Sesión de comunidad: el navbar mostraba "Login" con la cuenta abierta si faltaba `comunidad_nickname` en localStorage; ahora cae al apodo de `comunidad_session_usuario`.
- Chat de Kick: con una cuenta de comunidad sin Kick vinculado, `kick-chat` devolvía 409 en cada carga y ensuciaba la consola. El cliente recuerda el 409 por token (`gocha_kick_sin_vincular`) y deja de repetir la petición hasta vincular Kick o iniciar sesión de nuevo.
- Galería: el lightbox vuelve a ocultarse al cerrar (`x-show` no oculta en este build) y las tarjetas cargan la imagen con `decoding=async`.

### Tooling

- `scripts/check.js` valida que el `?v=` de `style.css` y `main.js` coincida con `VERSION` (`--fix` lo reescribe) y detecta directivas Alpine fuera de cualquier `x-data` o `x-store`.

## [1.60.2] - 2026-11-04

### Alpine sin inicializar

- Galería: el desplegable de orden apuntaba a un `.gochi-menu` sin `x-data`, así que `#gallery-orden-btn` no abría nada. El contenedor ya declara `x-data`.
- Comunidad: "Cargar mensajes anteriores" (`.chat-cargar-mas-container`) y los botones de tienda `#btn-ver-mis-canjeos` / `#btn-ver-catalogo` estaban fuera de cualquier `x-data`; sus `@click`, `x-show` y `x-text` no se inicializaban. Ambos bloques ya tienen `x-data`.
- Revisión de las 5 páginas y `404.html`: no queda ninguna directiva Alpine huérfana.

## [1.60.1] - 2026-11-04

### Correcciones de la capa Gochi

- Las migas de pan dejan de romper el layout: `.gochi-breadcrumb-nav` ocupa toda la fila (`grid-column: 1 / -1`) antes de entrar en la rejilla. En Comunidad, Sorteo y Cine se había convertido en la primera celda de `.page-layout` y desplazaba las columnas (barra lateral abajo, chat comprimido y vídeo vacío).
- Galería usa también `.gochi-breadcrumb-nav`, así hereda el mismo comportamiento fuera de rejilla.
- El ranking de Comunidad ya no parte los puntos en dos líneas: `.leaderboard-item` con `gap` y `.leaderboard-points` con `nowrap` y `flex-shrink: 0`.
- El avatar del cabecero del chat de Kick se emite oculto y sin `src` cuando no hay foto, en vez de dejar un `<img>` vacío que pedía la propia página como imagen.

## [1.60.0] - 2026-11-04

### Sistema de componentes Gochi (Tailwind + Alpine + Pines)

- Nueva capa de componentes `.gochi-*` al final de `style.css`: chips con tonos, campos, alertas, skeletons, tarjetas, switch, barra de progreso, acordeón, migas de pan, paginación, tabla responsive, estado vacío y panel de menú. Usa las variables del tema (oscuro, claro y OLED), así que se ve igual sin CDN.
- `main.js` expone `window.gochiUI` (`toast`, `confirmar`, `chip`, `skeleton`, `dropdown`, `cerrarMenus`) y los ayudantes `gochiChip`, `gochiSkeleton`, `gochiDropdown` y `cerrarGochiMenus`. Un único listener de `pointerdown` y Escape cierra los menús abiertos.
- El store `ui` gana `menus` para que los desplegables de página compartan estado con los del navbar.
- Galería: el orden pasa a un desplegable `gochiDropdown` y desaparecen las pestañas `#tab-populares` / `#tab-recientes`.
- Skeletons de carga en Galería (fotos), Comunidad (ranking y tienda) y panel de administración (usuarios), con el flag `cargando` del store para evitar parpadeos.
- Estados vacíos con `.gochi-vacio` en Galería y en el muro de la home, en lugar de párrafos sueltos.
- Migas de pan (`gochi-breadcrumb`) en Comunidad, Galería, Sorteo y Cine; en la home se omite por ser la raíz.
- La FAQ de la home y el bloque "¿Cómo funciona?" de Comunidad usan `gochi-accordion`, sin perder el contenido en el HTML estático para los buscadores.
- El panel de administración cambia el filtro "Solo baneados" a `gochi-switch` y la paginación usa las clases del sistema.
- El perfil global adopta `gochi-campo` y `gochi-alerta[data-tono="error"]`, con skeleton mientras carga.
- `scripts/check.js` valida que existan las clases `.gochi-*` en el CSS y la API `window.gochiUI` en `main.js`.
- Auditoría completa del sitio antes de la release: sin IDs duplicados, sin errores de sintaxis, recursos y versiones de CDN coherentes.

## [1.53.2] - 2026-11-04

### Modales, lightbox y botones al estilo Pines

- Los diálogos (login, registro, Kick, confirmación, perfil y reporte) comparten borde con tinte de acento y una sombra más profunda.
- El lightbox de Galería oscurece el fondo con desenfoque, la foto gana sombra propia y los botones responden con una pulsación breve.
- Los botones principales y secundarios también reaccionan al pulsado; con `prefers-reduced-motion` no hay transiciones.
- Tooltips en los iconos del lightbox, del modal de perfil y de los modales de la home y Comunidad.

## [1.53.1] - 2026-11-04

### Pestañas con el lenguaje de Pines

- Las pestañas de Comunidad, Sorteo y del panel de administración pasan a ser píldoras: fondo transparente, radio completo, tinte suave al pasar el ratón y acento con sombra en la activa.
- El contenedor de pestañas del panel de administración es ahora una banda segmentada con fondo sutil y borde, en lugar de una fila con línea inferior.
- El cambio vive en `style.css`, así que se ve igual si el CDN de Tailwind no carga.

## [1.53.0] - 2026-11-04

### Componentes interactivos con Tailwind bajo demanda

- `main.js` inyecta Tailwind 3.4.17 (Play CDN) solo cuando la página está inactiva o al primer gesto del usuario. `corePlugins.preflight` va desactivado para no tocar los estilos de `style.css` y los colores apuntan a las variables del tema (claro, oscuro y OLED) sin duplicar paletas.
- Los avisos pasan a una pila de toasts: hasta tres a la vez, se cierran solos o con la ✕, y los errores se marcan en rojo.
- Los menús App y Login del navbar dejan `<details>` y usan el store `ui.menuNav`: un solo menú abierto, cierre por clic fuera o Escape y foco devuelto al botón.
- Tooltips globales para los botones del navbar (tema y menú móvil) con un único nodo, sin tooltips nativos duplicados y solo con puntero fino (`hover: hover`), para que no se queden pegados al tocar en móvil.
- El panel de administración se abre como hoja lateral de 720 px en escritorio y hoja inferior en móvil, con cabecera fija al hacer scroll y botón de cierre redondo.
- El modal de confirmación también se cierra al pulsar el fondo.
- Respaldo completo: si el CDN falla (AdBlock, sin red) o tarda más de 500 ms, todo se ve con `style.css`; `window.GOCHA_TAILWIND = false` desactiva Tailwind por completo.
- `scripts/check.js` valida la versión fija del CDN, `preflight: false`, el interruptor y el respaldo visual del toast.

## [1.52.0] - 2026-11-04

### GochiWatch: unirse a la reproducción y audio local

- El aviso "Pulsa para unirte a la reproducción" ya no desaparece solo: se mantiene hasta que el espectador pulsa Unirme, aunque el navegador reproduzca el video por su cuenta.
- El espectador puede silenciar y reactivar el audio en su equipo sin afectar a la sala; el botón alterna "Desactivar audio" / "Activar audio".
- El panel del streamer oculta el aviso de espera cuando ya hay un video cargado.

## [1.51.1] - 2026-11-04

### Ajustes visuales de la home

- El video de YouTube vuelve a ocupar su ancho: las secciones recuperan el 100% del ancho y el reproductor se limita a 980 px centrados.
- Las preguntas frecuentes se muestran en dos columnas (3 y 3) en escritorio y vuelven a una columna por debajo de 760 px.

## [1.51.3] - 2026-11-04

### README al día

- `README.md` refleja la app 1.13 con el iframe de `player.kick.com` (sin ExoPlayer), el reporte de fotos, la cola de GochiWatch y el endurecimiento de las Edge Functions.

## [1.51.2] - 2026-11-04

### Auditoría de Edge Functions

- Los proxies de imágenes de `kick-clips`, `instagram-feed` y `tiktok-feed` validan también el host final después de las redirecciones y cortan respuestas de más de 6 MB.
- `kick-chat` limpia los `state` de OAuth de más de 15 minutos al iniciar otro login y rechaza cuerpos de más de 8 KB.
- `kick-oauth-callback` rechaza los `state` de más de 10 minutos, aunque sigan en la tabla.
- `app-telemetria` usa `upsert` sobre `dispositivo_hash`: dos primeras aperturas simultáneas ya no devuelven 500.
- Revisadas sin cambios: `kick-chat-setup` (secreto de cabecera), `kick-chat-webhook` (firma RSA de Kick), `kick-setup-temp` y `kick-oauth-exchange` (410), `kick-comunidad` (CORS cerrado, prueba de las dos cuentas al vincular) y `app-descarga`.

## [1.51.0] - 2026-11-04

### Deuda de auditoría: seguridad, nuevas funciones y diseño

- Reportar foto: botón en cada tarjeta de la galería y modal con motivo y detalle. Los reportes se guardan en `galeria_reportes` (solo admin los lee) y el panel global gana la pestaña Reportes con marcar revisado y eliminar.
- Cola de la sala en GochiWatch: el streamer encola videos (`cine_cola`) y los reproduce o quita desde el panel sin tocar la tabla.
- Tokens de diseño en `style.css`: radios, espaciado y tamaños de fuente (`--r-*`, `--space-*`, `--fs-*`) aplicados a navbar, botones, tarjetas, modales e inputs.
- SRI en las cinco páginas con CDN: supabase-js, Alpine, `@alpinejs/focus` y hls.js se cargan con `integrity` y `crossorigin`.
- `comunidad_chat` deja de exponer mensajes ocultos por REST: la política SELECT filtra `oculto` y el shadowban ya no se salta leyendo la tabla.
- `login_comunidad` añade bloqueo por cuenta (5 PIN fallidos en 15 minutos) además del límite por IP.
- `pg_net` sale de `public` a `extensions`; los cron jobs y las llamadas `net.http_get` siguen intactos.
- Cierre de auditoría en la interfaz: focus visible en inputs, flechas en las pestañas del sorteo, tarjeta de galería sin botones anidados, toast por encima de las confirmaciones, imágenes con dimensiones, `forced-colors`, scroll móvil con movimiento reducido y limpieza de código muerto.
- `_headers` documenta el trabajo pendiente para cuando se migre de GitHub Pages; en Pages sigue sin aplicarse.

## [1.50.1] - 2026-11-04

### Cierre de auditoría: documentación y robots

- `AGENTS.md` refleja la versión vigente y el alcance de la auditoría.
- `robots.txt` deja de bloquear `/admin` y `/config`, rutas que no existen en el sitio público.

## [1.50.0] - 2026-11-04

### Historial completo de GochiSorteo

- El sidebar de ganadores muestra el total registrado y un botón para expandir el historial hasta 200 ganadores sin recargar la página.
- «Ver menos» vuelve a los últimos 20 y el botón se desactiva mientras carga.
- Limpieza: retirados los restos huérfanos del botón Salir del chat de Kick (`CHAT_KICK.salir` y `host._salir`), eliminado en 1.43.8.

## [1.49.4] - 2026-11-04

### Auditoría P2: RPC de administración y accesibilidad

- Las acciones de administración en galería, sorteo y cine pasan por RPC `SECURITY DEFINER` (`admin_galeria_aprobar`, `admin_galeria_eliminar`, `streamer_config_sorteo`, `streamer_vaciar_tombola`, `cine_actualizar_estado`); ya no hay `update`, `delete` ni `upsert` directos desde el cliente.
- Las cinco páginas usan `<main>` real como landmark del contenido.
- El ganador del sorteo y los avisos del muro se anuncian con `aria-live`; los inputs de usuario de sorteo y autor de galería tienen etiqueta accesible.
- La página 404 enlaza a Galería, Sorteo, GochiWatch y Comunidad.
- La API de YouTube se descarga solo cuando hay un video de YouTube en GochiWatch.
- Foco visible restaurado en enlaces de tarjetas, ranking y muro; objetivos táctiles de 44 px en la barra móvil; inputs a 16 px en móvil para evitar el zoom de iOS.
- Estilos de impresión: se ocultan navbar, footer y chat; los títulos con degradado se imprimen en negro.
- Limpieza de CSS muerto (`.btn-logout`, presencia antigua del panel) y breakpoint del sorteo ampliado a 1240 px para evitar overflow.

## [1.49.3] - 2026-11-04

### Auditoría P1: accesibilidad, chat y perfil

- El like de la galería recupera su icono: corazón sólido y contorno añadidos al sprite local, también en el lightbox.
- El lightbox atrapa el foco y bloquea el scroll de fondo con `x-trap.noscroll`.
- El foco del panel global y del lightbox sigue atrapado en todas las páginas (`@alpinejs/focus` se carga donde hay `x-trap`).
- El chat de Kick acepta clics en "Conectar" desde el primer segundo: los handlers se registran antes de descargar los emotes.
- El chat de Kick recorta a 200 mensajes y libera sus identificadores, así un directo largo no acumula nodos.
- Tu propio perfil muestra las insignias de Kick, y las estadísticas no pueden quedar pisadas por otro perfil abierto antes.
- Los avisos emitidos antes de que Alpine arranque ya no se pierden; el tema guardado se aplica aunque falte el botón del navbar.
- Escape cierra solo la capa superior (perfil, sugerencias, panel o modal).
- La pestaña Tienda aparece y es navegable con teclado al iniciar sesión con PIN, sin recargar.
- `escapeAttr` escapa `&` para no corromper entidades en apodos y URLs.

## [1.49.2] - 2026-11-04

### Auditoría: buzón, contraste y 404

- El buzón de sugerencias queda restringido al rol `owner`, tanto en la política de la base de datos como en el panel de administración; un `admin` ya no ve la pestaña ni puede cargarla.
- El panel de administración detecta también sesiones de Supabase Auth sin token de comunidad, y deja de cachear un fallo de red como "sin permisos".
- `confirmarAccion()` ya no puede quedarse colgada: resuelve `false` si falta el modal y cancela la confirmación anterior.
- Contraste corregido: pestaña activa, texto de Kick en tema claro, y botones de reproducir, subir, sortear y modo offline usan `--btn-text`; el acento claro pasa a `#047857`.
- La página 404 usa rutas absolutas, así que carga estilos e ilustración en cualquier profundidad.
- Los errores de sesión del panel de administración se muestran en la vista de login.
- Roles canónicos corregidos: `McChary` queda como `owner` y `LaGochaGaming` como `admin` en `usuarios_comunidad`, en línea con `app_metadata` de Auth y con AGENTS.
- `admin_auditar` resuelve el autor desde la sesión de comunidad cuando no hay JWT de Auth, así que las acciones de moderación dejan de firmarse como `admin` genérico.

## [1.49.1] - 2026-11-04

### Selector de emotes 7TV en el chat de Kick

- El compositor del chat de Kick incorpora el botón 7TV y el mismo selector de emotes globales que Comunidad.
- El selector solo se activa con sesión de Kick y se cierra al enviar, con Escape, clic fuera o el botón de cerrar.
- Los emotes escritos como palabra exacta siguen renderizándose en los mensajes; si 7TV falla, el chat mantiene el texto.

## [1.49.0] - 2026-11-04

### Emotes globales de 7TV en los chats

- El chat de Kick y el chat de Comunidad muestran los emotes del set global de 7TV escritos como palabra exacta.
- Nuevo selector de emotes 7TV en el compositor de Comunidad, con inserción en la posición del cursor.
- El set se cachea 12 horas en el navegador y falla en silencio si 7TV no responde; el chat sigue funcionando con texto normal.
- No se usa un set propio del canal porque el canal no tiene perfil/set público en 7TV.

## [1.48.1] - 2026-11-04

### Top Comunidad solo con el podio

- El ranking lateral muestra únicamente los 3 primeros puestos. Los puestos 4 en adelante dejan de aparecer por ahora.

## [1.48.0] - 2026-11-04

### Actualizaciones reales de la app en Descargas

- Nueva telemetría anónima de instalaciones: ID aleatorio por dispositivo, versión actual y última vez que se abrió la app.
- El panel **Descargas** muestra dispositivos, activos de los últimos 7 días, versiones instaladas, actualizaciones totales, saltos `v1.12 → v1.13` y las últimas actualizaciones.
- Solo se registra cuando la app se abre después de actualizar; una instalación nueva no inventa una versión anterior.
- Tablas `app_instalaciones` y `app_actualizaciones` con RLS sin políticas, solo accesibles por la Edge Function `app-telemetria`.
- El contador de descargas sigue separado: las actualizaciones internas se miden por telemetría, no por `app-descarga`.

## [1.47.16] - 2026-11-04

### Regla de confirmaciones en AGENTS

- `AGENTS.md` prohíbe `alert()`, `confirm()` y `prompt()`.
- Avisos por toast y confirmaciones por `window.confirmarAccion()` o `window.mostrarConfirmacionModal()`; sin modales nuevos por página.

Sin cambios funcionales en la web.

## [1.47.15] - 2026-11-04

### Confirmaciones nativas fuera

- Nueva confirmación global con icono, tono por tipo (`peligro`, `aviso`, `info`, `exito`) y botones propios; nada del diálogo gris del navegador.
- Eliminar cuenta, borrar sugerencia y desvincular Kick usan la confirmación de la web.
- Los avisos de error de Kick en Comunidad usan toast en vez de `alert()`.

## [1.47.14] - 2026-11-04

### Documentación al día

- `AGENTS.md`: reglas del panel **Mi perfil** (popover anclado, cierre por clic fuera/toggle, hoja inferior en móvil, apilado sobre el panel admin), avatares y bucket cerrado a anónimos, sincronización de `kick_avatar_url`, `admin_eliminar_usuario` y forma nueva de las insignias.
- `README.md`: sección **Perfiles y avatares** con el comportamiento público, los 4 avatares y el panel de administración.
- `D:\Apk Gocha\AGENTS.md`: versión actual del APK corregida a 16 / 1.13.

Sin cambios funcionales en la web.

## [1.47.13] - 2026-11-04

### Ajustes compactos, sin scroll

- El panel de Ajustes cabe de una vez: sin barra de scroll ni huecos muertos.
- Avatar y sus opciones van en la misma fila, con vista previa pequeña.
- Identidad y Bio comparten fila; Redes en 2×2; Kick en una línea.
- Ancho del panel a 420px y botones abajo, ya sin quedarse pegados tapando campos.

## [1.47.12] - 2026-11-04

### Mi perfil: panel real, se abre y se cierra con clic

- Arreglado el bloqueo: la capa del perfil ya no se come los clics de la página. Clic fuera cierra, clic en el botón del navbar abre/cierra, y el resto de la web sigue usable.
- Sin ✕ en escritorio: se cierra tocando fuera o el mismo botón, como el panel de APP.
- Estilo alineado con APP: ancho fijo, título en mayúsculas y cabecera limpia.
- Insignias sin texto duplicado (`Regaló subs` ya no repite `Sub Gifter`).

## [1.47.11] - 2026-11-04

### Insignias con nombre y aviso legible en tema claro

- Las insignias de Kick del perfil muestran ahora su **nombre** (Moderador, Suscriptor, Fundador, VIP…) y solo añaden el detalle cuando aporta algo; antes se veía el código repetido (`VIP VIP`).
- El aviso de actualización de la app usa colores propios, así que se lee bien también con el tema claro del sistema. Verificado a 390 px de ancho.

## [1.47.10] - 2026-11-04

### Perfil flotante, avisos modernos y ajustes ordenados

- **Mi perfil** ya no abre una ventana que tapa la página: se despliega bajo el botón del navbar, como el menú de APP, y deja seguir viendo la web. En móvil baja como hoja inferior.
- **Perfil público** reorganizado en secciones: cabecera con avatar, apodo, rango, puntos, género y Kick; luego **Insignias de Kick** con nombre y descripción de cada una, Bio, Redes con texto y Actividad. Nada de iconos sueltos sin explicar.
- **Ajustes** agrupados en bloques (Tu avatar / Identidad / Redes / Kick) con vista previa, en vez de un formulario largo.
- **Aviso de actualización** rediseñado: tarjeta flotante con icono, versión y notas, botón *Actualizar* y cierre claro. Sustituye la barra genérica.
- **Ver perfil desde el panel admin** ya no cierra el panel: el perfil flota encima y al cerrarlo sigues donde estabas.

## [1.47.9] - 2026-11-04

### Panel de usuarios: ver perfil y tarjetas nuevas

- Cada usuario del panel tiene ahora **Ver perfil**: abre su perfil público tal como lo ve la comunidad (antes el panel tapaba la ventana).
- La tarjeta muestra el **avatar real** (Kick, subido o por defecto), el punto verde de conectado sobre la foto, el rol (ADMIN/OWNER) y el usuario de Kick.
- Acciones en cuadrícula: Ver perfil, Banear, Shadowban y Eliminar.

## [1.47.8] - 2026-11-04

### Panel de administración: borrar cuentas y última conexión

- Nueva acción **Eliminar** en cada usuario normal del panel oculto. Pide confirmación y borra la cuenta con su contenido: mensajes, reacciones, fotos, saludos, sesiones, canjes y puntos. Queda registrado en Auditoría.
- Las cuentas **owner** y **admin** están protegidas: no se pueden borrar.
- Cada usuario muestra ahora **Última vez en línea** en formato relativo ("hace 5 min", "hace 2 días"), además del punto verde si está conectado.
- Los usuarios vinculados a Kick muestran su etiqueta **KICK @usuario** en el panel y en su **perfil público**, con enlace a su canal.

## [1.47.7] - 2026-11-04

### Avatares: dos por defecto y el de Kick

- El selector de perfil ya no tiene el botón **Usar avatar por defecto**: se elige entre los dos avatares (masculino y femenino).
- Si tienes Kick vinculado aparece un tercer avatar con tu foto de Kick, marcado **KICK**.
- Esa foto se actualiza sola cada vez que entras con Kick, mientras tengas el avatar de Kick elegido. Si eliges uno de los dos por defecto, se respeta.
- Al desvincular Kick se quita el avatar de Kick y vuelven los dos por defecto.
- El bucket de avatares deja de aceptar subidas anónimas. La subida propia, cuando llegue, irá por una función con sesión.

## [1.47.6] - 2026-11-04

### El acceso de administración deja de ser público

- En la app la fila **Acceso de administración** ya no sale para todo el mundo: solo aparece si hay sesión de admin abierta.
- Para entrar la primera vez: cinco toques seguidos sobre la tarjeta **Creado por McChary** en Ajustes. Sale la fila y se puede abrir el login.
- En la web el candado “Acceso” del pie también queda solo para administradores; el login normal del sitio sigue en la barra superior.

## [1.47.5] - 2026-11-04

### Acceso de administración en la app

- Ajustes → **Creador** estrena la fila **Acceso de administración**, el candado que en la web vive escondido en el pie.
- Abre el panel global de administración (login, buzón de sugerencias, usuarios, descargas y auditoría) sobre la misma app, sin salir al navegador.
- Con sesión de admin, las herramientas de cada sección aparecen solas: moderación en Galería y Comunidad, panel maestro del reproductor en GochiWatch y modo streamer en Sorteo.

## [1.47.4] - 2026-11-04

### Sugerencias y firma del creador en la app

- Ajustes recupera el bloque **Creador**: retrato, “Creado por McChary” y *Creator Engineer*, igual que el pie de la web.
- Debajo, el botón **Sugerencias** abre el mismo buzón que en la web (máximo 2 por día) y envía la idea al creador.
- El pie completo de la web sigue oculto en la app para no repetir navegación; solo se trae esta parte.

## [1.47.3] - 2026-11-04

### Aviso de versión nueva dentro de la app

- La app compara su versión con `app/version.json` al abrir y, si hay una más nueva, muestra una barra bajo el encabezado: “Nueva versión X disponible”.
- El botón **Actualizar** abre el diálogo nativo de descarga, con notas, progreso y verificación del APK.
- La ✕ silencia ese aviso para esa versión; al publicar otra vuelve a salir.
- Comprobación cada 6 horas como máximo: no pide el JSON en cada página.
- No requiere APK nueva: llega con la interfaz móvil que la app descarga.

## [1.47.2] - 2026-11-04

### El chat deja mover la página

- Con el chat en vivo abierto, la página se puede deslizar: se coloca el directo arriba y se lee el chat abajo sin perder ninguno de los dos.
- El velo deja de capturar toques; solo la hoja del chat y el botón “Ocultar chat” responden.
- Al abrir el chat la página se ajusta sola para dejar el reproductor completo a la vista.

### APK 1.13

- Incluye el chat deslizable y el arranque sin logo.

## [1.47.1] - 2026-11-04

### La app abre sin el logo gigante

- Fuera el splash `splash.jpg` de 1152x2048 y el overlay de arranque propio: se veían dos logos, uno arriba y otro enorme en el centro.
- El arranque usa solo el splash del sistema: fondo `#05070a` e icono redondo.
- El APK baja a 3,86 MB.

## [1.47.0] - 2026-11-04

### Chat en vivo que deja ver el stream

- La hoja del chat baja de 84vh a 56vh: el reproductor queda a la vista mientras se lee y se escribe.
- Se quita el desenfoque del fondo; el stream se ve nítido detrás del chat.
- El botón “Chat en vivo” alterna: abre el chat y, ya abierto, pasa a “Ocultar chat” sin tapar la hoja.
- Cabecera del chat más compacta y al abrir se desplaza la página para encuadrar el reproductor.

### APK 1.11 sin pantalla de logo al navegar

- La pantalla de arranque con el logo solo sale al abrir la app, no al cambiar de página.
- Incluye los cambios del chat móvil.

## [1.46.1] - 2026-11-04

### La web deja de mostrar una versión vieja de la app

- El menú **App** y el pie de la app móvil muestran ya la 1.10, no la 1.8/1.9.
- El enlace de descarga pide `app-descarga?v=1.10`, así el contador no atribuye descargas a la versión antigua.
- `README.md` actualizado a la 1.10 (versionCode 13).

## [1.46.0] - 2026-11-04

### Fuera el reproductor nativo de la app

- La app vuelve a mostrar el directo con el iframe de Kick, igual que la web.
- Se elimina el código del reproductor propio: tarjeta “Ver el directo”, clase `lg-player-nativo`, estilos `.lg-directo-nativo` y el puente `abrirDirecto`.
- Motivo: el reproductor nativo no convenció.

## [1.45.0] - 2026-11-04

### Espectadores en la cabecera del chat

- El chat de Kick muestra los espectadores en vivo (“191 Views”) centrados en su cabecera.
- El dato sale del mismo sondeo que ya comprobaba si había directo, sin peticiones extra.
- Se oculta solo cuando el canal está offline.

### APK 1.9 con reproductor propio

- La app ya no usa el iframe de Kick para el directo: muestra una tarjeta “Ver el directo” que abre un reproductor nativo.
- Desaparece el aviso “Visit KICK for HD quality” y el toque en pantalla ya no lo dispara.
- Selector de calidad dentro del reproductor: Automática, 1080p, 720p, 480p.
- Si además hay directo, la app pide la URL del HLS directamente a Kick y reintenta sola cuando caduca.
- La web sigue con el iframe de siempre (ahí no cambia nada).

## [1.44.2] - 2026-11-04

### Contador de descargas reales

- Cada descarga del APK pasa ahora por un contador: queda guardada la versión, el origen y la fecha.
- El panel de administración estrena la pestaña **Descargas** con totales, únicas, hoy, 7 y 30 días, reparto por versión y por origen, gráfico de 14 días y las últimas descargas.
- Solo los administradores pueden ver las estadísticas; el contador no expone IPs (se guarda un hash).

### APK 1.8 con el chat arreglado

- La app estrena la versión 1.8: la caja de escritura del chat ya queda visible dentro de la hoja.
- La app invalida el CSS viejo cacheado, así el arreglo se ve al instante tras actualizar.
- Incluye la reconexión de Kick sin pedir OAuth cuando la cuenta ya está vinculada.

## [1.44.1] - 2026-11-04

### El chat de la app vuelve a mostrar el cuadro de escritura

- La hoja del chat mantiene el contenedor en columna flexible: los mensajes hacen scroll y el formulario queda visible.
- Se sincronizó `mobile/mobile.css` con los assets de la APK.
- Sin APK nueva: la app carga el CSS remoto.

## [1.44.0] - 2026-11-04

### El chat reconecta Kick sin pedir OAuth otra vez

- Al cerrar sesión, el chat se desconecta, pero Kick conserva la autorización vinculada a la cuenta.
- Al volver a entrar con la misma cuenta, el chat se reconecta solo mientras Kick siga autorizado.
- El servidor guarda una sola sesión de Kick por cuenta y rota el token del navegador.
- Nuevo botón "Desvincular Kick" en el perfil para borrar la autorización guardada.
- Sin APK nueva: todo vive en la web y en las funciones de Supabase.

## [1.43.10] - 2026-11-04

### El chat ya no rebota a Comunidad al volver de Kick

- La vuelta del OAuth del chat ya no se confunde con un login de Comunidad pendiente.
- Se limpia el objetivo de Kick al terminar, para que un login anterior no desvíe el siguiente.
- El chat vuelve a la misma página y activa el cuadro de escritura al conectar Kick.

## [1.43.9] - 2026-11-03

### Conectar con Kick tambien crea la cuenta y un solo cierre de sesion

- "Conectar" del chat ahora es el login general con Kick: vincula la cuenta si ya hay sesion, o crea/recupera la cuenta de comunidad automaticamente.
- Si el apodo de Kick ya existe, se pide el PIN para vincular o se elige otro apodo.
- Las cuentas nuevas reciben un aviso para completar el perfil ahora o dejarlo para despues.
- El unico cierre de sesion web es la flecha roja del navbar; se quitaron los cierres duplicados de perfil y de las herramientas de streamer.
- Sorteo usa "Ocultar Herramientas" como Galeria y Cine.

## [1.43.8] - 2026-11-03

### Un solo login y anillo solo con sesión

- El anillo de puntos de la app solo aparece cuando hay una sesión iniciada.
- El chat ya no tiene "Salir": el cierre de sesión general también desconecta Kick.
- "Conectar" del chat pide primero la sesión general de la comunidad.
- Assets móviles del sitio actualizados a la app 1.7, sin APK nueva.

## [1.43.7] - 2026-11-03

### Herramientas de Streamer y APK 1.7

- Galería, Cine y Sorteo ya no tienen login de admin propio: las herramientas se
  ocultan hasta iniciar sesión con una cuenta owner o admin desde el Login general.
- El acceso oculto del pie de página se mantiene para tareas administrativas.
- La app 1.7 muestra el anillo de puntos centrado, con relleno animado y pulso al
  llegar al tope.
- APK 1.7 (versionCode 10) actualizado en app/LaGochaGaming.apk.

## [1.43.6] - 2026-11-03

### Puntos diarios y Kick compartido

- Anillo de puntos diarios centrado y con relleno animado hasta el tope; al
  llegar a 60 hace un pulso con brillo.
- El login de arriba y "Conectar" del chat comparten el token de Kick: si ya
  hay sesión, el chat no abre un segundo OAuth.
- Sin cambios de APK: sigue valiendo la 1.6 (versionCode 9).

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
