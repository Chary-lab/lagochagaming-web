# Pack Tailwind + Alpine + Pines — Rework "combo perfecto"

Documento de trabajo del rediseño de LaGochaGaming con **Tailwind 3.4.17 (Play CDN) + Alpine 3.17.5 + componentes Pines UI**, sin build, sin bundler y sin archivos nuevos de runtime.

Estado: **1.53.2 en producción** (`ea86cb6`). Este documento describe lo que falta y el plan para cerrarlo.

---

## 1. Contrato del pack (no negociable)

1. **Sin build.** No hay `package.json`, ni Vite, ni PostCSS en el repo. Tailwind se inyecta por CDN desde `main.js`.
2. **Sin archivos nuevos de runtime.** Todo vive en `style.css`, `main.js` o el HTML de su página. Este `.md` es documentación, no runtime.
3. **Ningún componente depende del CDN para verse.** `style.css` lleva el respaldo visual. Si Tailwind falla o tarda más de 500 ms, el componente se pinta igual.
4. **Alpine manda en el comportamiento.** Stores, `x-for`, `:hidden`, `x-trap`. El JS clásico queda para Supabase, RPC, Realtime y APIs `window.*`.
5. **Visibilidad con `:hidden="!abierto"`.** Nada de `x-show` en elementos `display:flex`.
6. **Colores por variables.** `base`, `surface`, `sutil`, `acento`, `linea`, `tinta`, `tenue`. Prohibido `bg-surface/50` (las variables son hex, no canales).
7. **Interruptor único.** `window.GOCHA_TAILWIND = false` devuelve todo al CSS base sin tocar código.
8. **Nada de SRI en el CDN.** `cdn.tailwindcss.com` no manda `Access-Control-Allow-Origin`; `integrity` + `crossorigin` rompen la carga. La versión fija es la garantía.

---

## 2. Lo que ya está (no rehacer)

| Pieza | Dónde | Estado |
|---|---|---|
| Cargador bajo demanda | `main.js` (`cargarTailwind`, `asegurarTailwind`, `sondaTailwind`) | ✅ |
| Config de tema (`preflight:false`, tokens) | `main.js` (`window.tailwind.config`) | ✅ |
| Toasts en pila (máx. 3) | store `toast` + `.gochi-toast-*` | ✅ |
| Dropdown del navbar (App y Login) | `ui.menuNav`, `.nav-app-panel` | ✅ |
| Modal de confirmación | `confirmarAccion()` + `.gochi-confirm` | ✅ |
| Hoja lateral del admin | `.admin-global-*` (720 px / hoja inferior en móvil) | ✅ |
| Tooltips delegados | IIFE `[data-tooltip]` + `.gochi-tooltip` | ✅ |
| Pestañas píldora | `.tab-btn`, `.admin-tabs`, `.admin-tab-btn` | ✅ |
| Pulido de modales, lightbox y botones | bloque final de `style.css` | ✅ |
| Tooltips en lightbox, modales y perfil | `galeria.html`, `index.html`, `comunidad.html`, `main.js` | ✅ |

---

## 3. Lo que falta

### 3.1 Componentes Pines sin equivalente

- **Acordeón** — la FAQ de la home y el bloque "Info" de Comunidad siguen con `<details>` crudos, sin transición ni estado visual.
- **Skeleton** — galería, clips de Kick, ranking y tienda muestran "Cargando..." en texto; falta el patrón de bloques con brillo.
- **Badge / chip unificado** — rangos, insignias de Kick, contadores de admin y estados ("En vivo", "Pendiente") usan cuatro estilos distintos.
- **Switch / checkbox / radio estilizados** — quedan controles nativos en ajustes de perfil y filtros del admin.
- **Progress** — la píldora de puntos diarios tiene su propio anillo; descargas de la app usa barras propias. No hay componente común.
- **Tabla responsive** — las tablas del admin (usuarios, descargas, auditoría) desbordan en móvil; no hay patrón tarjeta.
- **Paginación / "cargar más"** — cada lista implementa su botón a mano (muro, galería, auditoría).
- **Alerta inline** — los errores de formulario se pintan con clases sueltas (`admin-login-error`, `modal-error`, `upload-feedback`).
- **Breadcrumb** — existe JSON-LD `BreadcrumbList` pero no migas visibles.

### 3.2 Superficies sin migrar

- **Formularios**: login/registro de comunidad, editor de perfil, subida de galería, tienda. Inputs con estilos dispares.
- **Tarjetas**: galería, premios de tienda, clips de Kick, últimos videos. Cada una con su radio, sombra y hover.
- **Filtros**: la galería ordena por botones; el ranking no tiene filtro. Ahí encaja el dropdown ya construido.
- **Estados vacíos**: cada página inventa su bloque (texto + ilustración) con clases distintas.

### 3.3 Deuda técnica del pack

- El dropdown no es reutilizable: está cableado al navbar (`ui.menuNav` con dos claves fijas).
- El modal no tiene componente genérico: cada modal repite overlay, caja, `x-trap` y cierre.
- `MutationObserver` de Alpine sobre el chat de Comunidad: falta medir CPU con 50+ mensajes.
- Sin medición de Core Web Vitals con el CDN activo (407 KB + compilación en cliente).
- `check.js` valida el cargador, pero no los patrones nuevos (chips, skeleton, alertas).

---

## 4. Arquitectura del rework

### 4.1 Capas

```
style.css          → tokens, respaldo visual de cada componente (siempre presente)
Tailwind (CDN)     → utilidades de ajuste fino (posición, spacing, responsive)
Alpine (stores)    → estado y comportamiento
main.js            → API pública window.gochiUI.*
```

Regla: **si una regla se puede escribir en `style.css` sin depender de Tailwind, va en `style.css`**. Tailwind solo ajusta.

### 4.2 Naming

- Componente: `.gochi-<pieza>` (`.gochi-card`, `.gochi-chip`, `.gochi-alerta`).
- Variante: `.gochi-chip--rango`, `.gochi-alerta--error`.
- Estado: atributo `data-estado="cargando|vacio|error|listo"`.
- Nunca estilos por ID. Nunca `!important` nuevos.

### 4.3 API pública (`window.gochiUI`)

```js
window.gochiUI = {
  toast,                // ya existe como window.mostrarToast
  confirmar,            // ya existe como window.confirmarAccion
  abrirHoja, cerrarHoja,// generaliza el panel admin
  tooltip,              // ya delegado con [data-tooltip]
  skeleton(dentro, n),  // pinta n bloques de carga
  chip(texto, tipo)
};
```

Los nombres antiguos se conservan como alias: nada de romper `window.mostrarToast` ni `confirmarAccion`.

---

## 5. Plan por fases

Cada fase es un commit desplegable, con bump de `VERSION`, entrada en `CHANGELOG.md`, `?v=` actualizado y checks verdes.

### F1 — Fundamentos (1.54.0)

**Objetivo:** una sola piel para formularios, chips y estados.

- `.gochi-chip` con variantes (`rango`, `kick`, `contador`, `estado`).
- `.gochi-campo` para `input`, `select`, `textarea`, `label`, `help`, `error`.
- `.gochi-alerta` (`info`, `aviso`, `error`, `exito`).
- `.gochi-skeleton` con animación de brillo y `prefers-reduced-motion`.
- Migrar: login/registro de comunidad, editor de perfil y subida de galería.

**Aceptación:** con `GOCHA_TAILWIND = false` los cuatro se ven igual; sin huecos de layout a 390 px ni a 1400 px.

### F2 — Tarjetas y listas (1.54.1)

- `.gochi-card` + `data-estado="cargando|vacio|error"`.
- Migrar tarjetas de galería, premios de tienda, clips de Kick y videos.
- Estados vacíos unificados (texto + ilustración de `img/mcchary/`).

**Aceptación:** skeleton visible mientras carga; sin saltos al sustituir por datos reales.

### F3 — Dropdown y filtros (1.54.2)

- Generalizar el dropdown: `gochiDropdown(id)` con store `ui.menus`.
- Usarlo en: orden de galería, filtro de ranking, filtro de reportes del admin.
- Mantener el navbar con la misma API (sin dos mecanismos).

**Aceptación:** un solo menú abierto en toda la página; Escape devuelve foco; clic fuera cierra.

### F4 — Admin y tablas (1.55.0)

- Tabla responsive: filas → tarjetas por debajo de 760 px.
- Paginación compartida con "cargar más" del muro y la galería.
- Switch estilizado para `shadowban` y flags del panel.

**Aceptación:** ninguna tabla provoca scroll horizontal a 390 px; acciones siguen pidiendo confirmación.

### F5 — Acordeón y navegación (1.55.1)

- FAQ de la home y bloque "Info" con acordeón accesible (`aria-expanded`, `aria-controls`).
- Migas de pan visibles en comunidad, galería, sorteo y cine (coherentes con el JSON-LD).

**Aceptación:** el HTML de la FAQ sigue siendo rastreable (contenido presente, no inyectado) y coincide con `FAQPage`.

### F6 — Cierre (1.56.0)

- Medir CWV en el Redmi con el pack activo; decidir si el Play CDN sigue compensando.
- Medir CPU del `MutationObserver` del chat con 50 mensajes.
- Ampliar `scripts/check.js` a los patrones nuevos.
- Actualizar `AGENTS.md` con el catálogo de componentes y este documento.

---

## 6. Mapa Pines → proyecto

| Pines | Uso aquí | Estado |
|---|---|---|
| Toast | avisos globales | ✅ |
| Dropdown | navbar; filtros | 🟡 navbar |
| Modal | confirmación; login/registro | 🟡 falta genérico |
| Slide-over | panel admin | ✅ |
| Tabs | comunidad, sorteo, admin, perfil | ✅ |
| Tooltip | iconos y acciones | ✅ |
| Accordion | FAQ, info | ⬜ |
| Skeleton | listas y tarjetas | ⬜ |
| Badge | rangos, Kick, contadores | ⬜ |
| Switch / Checkbox | ajustes y admin | ⬜ |
| Progress | puntos, descargas | ⬜ |
| Table | admin en móvil | ⬜ |
| Pagination | muro, galería, auditoría | ⬜ |
| Alert | errores de formulario | ⬜ |
| Breadcrumb | subpáginas | ⬜ |
| Card | galería, tienda, clips | ⬜ |

Los 42 elementos de Pines no se copian enteros: solo entra lo que sustituye UI existente.

---

## 7. Validaciones para `scripts/check.js`

- `window.GOCHA_TAILWIND` y `asegurarTailwind` presentes.
- URL del CDN con versión exacta; sin `integrity`.
- `preflight: false` presente.
- Cada componente nuevo tiene su clase de respaldo en `style.css` (`.gochi-chip`, `.gochi-card`, `.gochi-alerta`, `.gochi-skeleton`).
- Prohibido `x-show` en elementos con `display:flex` (aviso, no error).
- Prohibido `{{ }}` en atributos.

---

## 8. Pruebas por fase

1. `node scripts/check.js` y `node --check main.js`.
2. Chrome de escritorio a 1400 px y 1024 px.
3. Chrome móvil real (Redmi por USB, `adb reverse`) a 390 px.
4. Con `window.GOCHA_TAILWIND = false` en consola: misma funcionalidad.
5. Con red lenta simulada: nada se queda en blanco más de 500 ms.
6. APK (`com.lagochagaming.app`) contra el sitio live: navbar, chat y hoja del admin.

---

## 9. Riesgos y decisiones

- **Play CDN**: no recomendado por Tailwind para producción. Aceptado; si molesta, el plan B es un CSS precompilado (requiere autorización y un archivo nuevo).
- **Peso**: ~407 KB + compilación en cliente. Mitigación actual: carga en idle y primer gesto.
- **AdBlock**: bloquea el CDN. Mitigación: respaldo en `style.css` y espera acotada.
- **WebView de la APK**: mismo comportamiento que Chrome; probar en dispositivo, no dar por hecho.
- **CSP futura**: si se migra de GitHub Pages, habrá que permitir `cdn.tailwindcss.com` y revisar `unsafe-inline`.
- **No dividir archivos**: el rework crece dentro de `style.css` y `main.js`; si se desordena, se ordena por secciones, no se trocea.

---

## 10. Orden recomendado

1. F1 (fundamentos) — mayor impacto visual con menor riesgo.
2. F2 (tarjetas) — reutiliza F1.
3. F3 (dropdown/filtros) — reutiliza el navbar.
4. F4 (admin/tablas) — la zona más densa.
5. F5 (acordeón/migas) — contenido y SEO.
6. F6 (cierre) — medición y documentación.

Cada fase: un commit `vX.Y.Z - resumen`, push solo con el sitio estable y verificación en vivo de `VERSION`.
