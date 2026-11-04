# Pack Tailwind + Alpine + Pines — Rework "combo perfecto"

Documento de trabajo del rediseño de LaGochaGaming con **Tailwind 3.4.17 (Play CDN) + Alpine 3.17.5 + componentes Pines UI**, sin build, sin bundler y sin archivos nuevos de runtime.

Estado: **1.61.1**. Fases F1–F5 cerradas y migradas a las superficies reales. F6 pendiente solo en medición (CWV en Redmi y CPU del chat con 50 mensajes); el resto del documento queda como registro del plan y de las decisiones.

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

## 3. Estado de la migración (1.61.1)

### 3.1 Componentes Pines

- **Acordeón** — `gochi-accordion` en la FAQ de la home y el bloque "Info" de Comunidad, con `aria-expanded`/`aria-controls`. ✅
- **Skeleton** — `gochi-skeleton` en galería, clips de Kick, ranking y tienda. ✅
- **Badge / chip** — `gochi-chip` en estados y roles del panel, y `gochiChip()` en la metadata de clips. ✅
- **Switch** — `gochi-switch` en el panel de administración. ✅
- **Progress** — `gochi-progress` en las barras de rango de Comunidad. ✅
- **Tabla responsive** — `gochi-tabla` + `gochi-tabla-wrap` en Usuarios, Descargas y Auditoría del panel global (4 columnas en Usuarios, conexión bajo el apodo); ≤760 px cada fila pasa a tarjeta con `data-label`. ✅
- **Paginación** — `gochi-paginacion` en el panel admin; el resto de listas conserva su "cargar más". ✅
- **Alerta inline** — `gochi-alerta` en formularios y feedback de subida. ✅
- **Breadcrumb** — `gochi-breadcrumb` en Comunidad, Galería, Sorteo y Cine, coherente con el JSON-LD. ✅

### 3.2 Superficies migradas

- **Formularios**: login/registro de comunidad, editor de perfil, subida de galería y tienda con `gochi-campo`/`gochi-alerta`.
- **Tarjetas**: galería (normal, pendiente y skeleton), premios de tienda y clips de Kick con `gochi-card`; `gochi-card--media` cuando la imagen va a sangre.
- **Filtros**: orden de galería con `gochiDropdown`.
- **Estados vacíos**: `gochi-vacio` en home, comunidad y galería.

### 3.3 Deuda técnica restante

- El modal no tiene componente genérico: cada modal repite overlay, caja, `x-trap` y cierre.
- `MutationObserver` de Alpine sobre el chat de Comunidad: falta medir CPU con 50+ mensajes.
- Sin medición de Core Web Vitals con el CDN activo (407 KB + compilación en cliente).
- Medición de F6 pendiente en dispositivo real; no dar por hecho el rendimiento del Play CDN.

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
| Dropdown | navbar; orden de galería | ✅ |
| Modal | confirmación; login/registro | 🟡 falta genérico |
| Slide-over | panel admin; `abrirHoja`/`cerrarHoja` | ✅ |
| Tabs | comunidad, sorteo, admin, perfil | ✅ |
| Tooltip | iconos y acciones | ✅ |
| Accordion | FAQ, info | ✅ |
| Skeleton | listas y tarjetas | ✅ |
| Badge | estados/roles del panel, clips | ✅ |
| Switch / Checkbox | admin | ✅ |
| Progress | barras de rango | ✅ |
| Table | panel admin (usuarios, descargas, auditoría) | ✅ |
| Pagination | admin; resto con "cargar más" | ✅ |
| Alert | errores de formulario | ✅ |
| Breadcrumb | subpáginas | ✅ |
| Card | galería, tienda, clips | ✅ |

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

## 10. Cierre

F1–F5 entregadas entre 1.54.0 y 1.61.1. Cada fase fue un commit `vX.Y.Z - resumen` con bump de `VERSION`, `CHANGELOG.md`, `?v=` actualizado y checks verdes.

Pendiente de F6:
1. Medir CWV en el Redmi con el pack activo.
2. Medir CPU del `MutationObserver` del chat con 50 mensajes.
3. Decidir si el Play CDN sigue compensando frente al CSS precompilado.
4. Si se mide en dispositivo, anotar el resultado aquí y en `CHANGELOG.md`.
