/* GochitaRunner — motor del minijuego (fase 1).
   Física, cámara y nivel de prueba. Sin arte final ni ranking todavía. */
(function () {
    'use strict';

    const TILE = 16;
    const VISTA_ANCHO = 480;
    const VISTA_ALTO = 270;
    const PASO = 1 / 60;

    const GRAVEDAD = 1500;
    const CAIDA_MAX = 900;
    const VEL_CAMINAR = 145;
    const VEL_CORRER = 220;
    const ACELERACION = 1500;
    const FRENADO = 1900;
    const SALTO = -455;
    const SALTO_MIN = -310;
    const COYOTE = 0.1;
    const BUFFER_SALTO = 0.12;
    const VIDAS_INICIALES = 3;
    const MAX_CLIPS = 5;
    const VEL_CLIP = 340;
    const VEL_HATER = 30;
    const INTERVALO_TIRO = 2.6;
    const ESCALA_GRANDE = 1.22;
    const ESCUDO_MAX = 3;
    const VEL_PURGA = 30;
    const RETRASO_PURGA = 2.5;

    const CLAVE_GUARDADO = 'lg_game_v1';
    const NOMBRE_NIVEL = 'El Setup';

    const SOLIDOS = new Set(['#', '=']);

    const lienzo = document.getElementById('game-canvas');
    const ctx = lienzo ? lienzo.getContext('2d') : null;

    const estado = {
        fase: 'inicio',
        gp: 0,
        vidas: VIDAS_INICIALES,
        tiempo: 0,
        invulnerable: 0,
        anim: 0,
        camara: { x: 0, y: 0 },
        nivelDatos: null,
        jugador: null,
        spawn: { x: 0, y: 0 },
        entrada: { izquierda: false, derecha: false, salto: false, correr: false },
        bufferSalto: 0,
        coyote: 0,
        mirando: 1,
        paso: 0,
        squash: 0,
        parpadeo: 2.4,
        parpadeoActivo: 0,
        polvoTimer: 0,
        enSueloAnterior: false,
        particulas: [],
        grande: false,
        clips: 0,
        hatersMuertos: 0,
        disparoEnfriamiento: 0,
        disparoAnim: 0,
        avisos: [],
        clipsActivos: [],
        burbujas: [],
        sonido: true,
        nivelActual: 1,
        nivelDesbloqueado: 1,
        gpNivel: 0,
        hatersNivel: 0,
        escudo: 0,
        purga: null,
        tunelBloqueado: false,
        runId: null,
        runNivel: 0,
        runEnviado: false
    };

    // === NIVEL 1: EL SETUP ===

    function crearNivel1() {
        const ancho = 170;
        const alto = 17;
        const mapa = Array.from({ length: alto }, () => new Array(ancho).fill(' '));

        const poner = (x, y, ch) => {
            if (x >= 0 && x < ancho && y >= 0 && y < alto) mapa[y][x] = ch;
        };
        const rect = (x, y, w, h, ch) => {
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) poner(x + i, y + j, ch);
            }
        };

        // Suelo con cuatro fosos.
        rect(0, 15, 31, 2, '#');
        rect(35, 15, 26, 2, '#');
        rect(64, 15, 32, 2, '#');
        rect(101, 15, 30, 2, '#');
        rect(134, 15, 36, 2, '#');

        // Plataformas flotantes.
        rect(12, 12, 5, 1, '=');
        rect(43, 12, 9, 1, '=');
        rect(78, 11, 7, 1, '=');
        rect(88, 9, 4, 1, '=');
        rect(112, 12, 6, 1, '=');
        rect(120, 11, 4, 1, '=');
        rect(140, 11, 7, 1, '=');
        rect(150, 9, 4, 1, '=');

        // Pinchos (lag spikes).
        for (let x = 24; x <= 26; x++) poner(x, 14, '^');
        for (let x = 70; x <= 72; x++) poner(x, 14, '^');
        for (let x = 108; x <= 110; x++) poner(x, 14, '^');

        // Kicks.
        [
            [6, 13], [7, 13], [8, 13],
            [14, 10], [15, 10], [16, 10],
            [27, 11], [28, 11], [29, 11],
            [45, 10], [46, 10], [47, 10],
            [55, 12], [56, 12],
            [68, 12], [69, 12],
            [80, 9], [81, 9], [82, 9],
            [90, 12], [91, 12],
            [97, 11], [98, 11], [99, 11],
            [104, 13], [105, 13],
            [114, 10], [115, 10],
            [121, 9], [122, 9],
            [142, 9], [143, 9], [144, 9],
            [152, 7], [153, 7],
            [159, 13], [160, 13], [163, 12]
        ].forEach(([x, y]) => poner(x, y, 'o'));

        // Haters, regalitos y donaciones.
        poner(18, 14, 'H');
        poner(45, 14, 'H');
        poner(83, 14, 'H');
        poner(4, 14, 'R');
        poner(11, 14, 'D');
        poner(49, 11, 'R');
        poner(90, 8, 'D');

        poner(3, 14, 'P');
        poner(166, 13, 'G');
        poner(166, 14, 'G');

        return { nombre: NOMBRE_NIVEL, ancho, alto, mapa: mapa.map((fila) => fila.join('')), tema: 'setup' };
    }

    function nuevoNivel(ancho, alto = 17) {
        const mapa = Array.from({ length: alto }, () => new Array(ancho).fill(' '));
        const poner = (x, y, ch) => {
            if (x >= 0 && x < ancho && y >= 0 && y < alto) mapa[y][x] = ch;
        };
        const rect = (x, y, w, h, ch) => {
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) poner(x + i, y + j, ch);
            }
        };
        return { ancho, alto, mapa, poner, rect };
    }

    function filaMonedas(n, filas) {
        filas.forEach(([x, y]) => n.poner(x, y, 'o'));
    }

    // === NIVEL 2: RAID CITY ===

    function crearNivel2() {
        const n = nuevoNivel(150);

        // Suelo con cinco fosos.
        n.rect(0, 15, 20, 2, '#');
        n.rect(24, 15, 18, 2, '#');
        n.rect(46, 15, 14, 2, '#');
        n.rect(64, 15, 22, 2, '#');
        n.rect(90, 15, 16, 2, '#');
        n.rect(110, 15, 40, 2, '#');

        // Plataformas.
        n.rect(8, 12, 5, 1, '=');
        n.rect(27, 11, 6, 1, '=');
        n.rect(38, 9, 4, 1, '=');
        n.rect(49, 12, 6, 1, '=');
        n.rect(68, 11, 5, 1, '=');
        n.rect(76, 9, 5, 1, '=');
        n.rect(93, 12, 6, 1, '=');
        n.rect(116, 11, 6, 1, '=');
        n.rect(126, 9, 4, 1, '=');
        n.rect(136, 12, 6, 1, '=');

        // Lag spikes.
        [33, 34, 35, 73, 74, 75, 118, 119, 120].forEach((x) => n.poner(x, 14, '^'));

        // Túneles raid: dos pares.
        n.poner(15, 14, '1');
        n.poner(70, 14, '1');
        n.poner(52, 14, '2');
        n.poner(100, 14, '2');

        // Haters de suelo y voladores.
        [[30, 14], [55, 14], [79, 14], [96, 14], [124, 14], [140, 14]]
            .forEach(([x, y]) => n.poner(x, y, 'H'));
        [[20, 9], [44, 8], [72, 7], [100, 9], [130, 8]]
            .forEach(([x, y]) => n.poner(x, y, 'V'));

        // Regalitos y donaciones.
        n.poner(6, 14, 'R');
        n.poner(12, 14, 'D');
        n.poner(58, 11, 'R');
        n.poner(82, 8, 'D');
        n.poner(112, 14, 'D');

        filaMonedas(n, [
            [5, 13], [6, 13], [7, 13],
            [9, 11], [10, 11], [11, 11],
            [16, 12], [17, 12],
            [25, 13], [26, 13],
            [29, 10], [30, 10], [31, 10],
            [39, 8], [40, 8],
            [47, 12], [48, 12],
            [50, 11], [51, 11],
            [56, 12], [57, 12],
            [66, 12], [67, 12],
            [69, 10], [70, 10],
            [78, 8], [79, 8],
            [91, 12], [92, 12],
            [94, 11], [95, 11],
            [112, 12], [113, 12],
            [117, 10], [118, 10],
            [127, 8], [128, 8],
            [137, 11], [138, 11],
            [142, 13], [143, 13], [144, 13]
        ]);

        n.poner(3, 14, 'P');
        n.poner(147, 13, 'G');
        n.poner(147, 14, 'G');

        return {
            nombre: 'Raid City',
            ancho: n.ancho,
            alto: n.alto,
            mapa: n.mapa.map((fila) => fila.join('')),
            tema: 'raid'
        };
    }

    // === NIVEL 3: LA PURGA ===

    function crearNivel3() {
        const n = nuevoNivel(150);

        // Suelo con fosos cortos: la purga no perdona.
        n.rect(0, 15, 25, 2, '#');
        n.rect(29, 15, 22, 2, '#');
        n.rect(55, 15, 24, 2, '#');
        n.rect(83, 15, 28, 2, '#');
        n.rect(115, 15, 35, 2, '#');

        // Plataformas.
        n.rect(8, 12, 5, 1, '=');
        n.rect(34, 11, 5, 1, '=');
        n.rect(60, 12, 5, 1, '=');
        n.rect(88, 10, 5, 1, '=');
        n.rect(120, 11, 5, 1, '=');

        // Lag spikes.
        [18, 19, 20, 45, 46, 47, 72, 73, 74, 128, 129, 130]
            .forEach((x) => n.poner(x, 14, '^'));

        // Haters de suelo y voladores.
        [[40, 14], [68, 14], [100, 14], [140, 14]]
            .forEach(([x, y]) => n.poner(x, y, 'H'));
        [[15, 8], [58, 7], [90, 8], [122, 9]]
            .forEach(([x, y]) => n.poner(x, y, 'V'));

        // Power-ups.
        n.poner(5, 14, 'R');
        n.poner(30, 14, 'D');
        n.poner(88, 9, 'R');
        n.poner(121, 10, 'D');

        filaMonedas(n, [
            [6, 13], [7, 13],
            [9, 11], [10, 11], [11, 11],
            [14, 12], [15, 12],
            [22, 13], [23, 13],
            [30, 13], [31, 13],
            [35, 10], [36, 10],
            [41, 12], [42, 12],
            [49, 13], [50, 13],
            [56, 13], [57, 13],
            [61, 11], [62, 11],
            [69, 12], [70, 12],
            [75, 13], [76, 13],
            [84, 13], [85, 13],
            [89, 9], [90, 9], [91, 9],
            [95, 12], [96, 12],
            [102, 13], [103, 13],
            [111, 13], [112, 13],
            [116, 13], [117, 13],
            [121, 10], [122, 10],
            [125, 12], [126, 12],
            [132, 13], [133, 13],
            [141, 13], [142, 13], [143, 13]
        ]);

        n.poner(3, 14, 'P');
        n.poner(147, 13, 'G');
        n.poner(147, 14, 'G');

        return {
            nombre: 'La Purga',
            ancho: n.ancho,
            alto: n.alto,
            mapa: n.mapa.map((fila) => fila.join('')),
            tema: 'purga',
            purga: { inicio: -40, velocidad: VEL_PURGA, retraso: RETRASO_PURGA }
        };
    }

    const NIVELES = [
        { nombre: 'El Setup', crear: crearNivel1 },
        { nombre: 'Raid City', crear: crearNivel2 },
        { nombre: 'La Purga', crear: crearNivel3 }
    ];

    function parsearNivel(datos) {
        const monedas = [];
        const powerups = [];
        const haters = [];
        const tuneles = [];
        let spawn = { x: 2 * TILE, y: 10 * TILE };
        let meta = null;

        for (let y = 0; y < datos.alto; y++) {
            for (let x = 0; x < datos.ancho; x++) {
                const ch = datos.mapa[y][x];
                if (ch === 'P') {
                    spawn = { x: x * TILE + 3, y: y * TILE + 2 };
                } else if (ch === 'o') {
                    monedas.push({
                        x: x * TILE + TILE / 2,
                        y: y * TILE + TILE / 2,
                        baseY: y * TILE + TILE / 2,
                        recogida: false
                    });
                } else if (ch === 'R' || ch === 'D') {
                    powerups.push({
                        x: x * TILE + TILE / 2,
                        y: y * TILE + TILE / 2,
                        baseY: y * TILE + TILE / 2,
                        tipo: ch === 'R' ? 'regalo' : 'diamante',
                        recogido: false
                    });
                } else if (ch === 'H' || ch === 'V') {
                    const volador = ch === 'V';
                    haters.push({
                        x: x * TILE + 2,
                        y: y * TILE + 2,
                        ancho: 12,
                        alto: 14,
                        vx: 0,
                        vy: 0,
                        enSuelo: false,
                        dir: -1,
                        vivo: true,
                        aviso: 0,
                        tiro: INTERVALO_TIRO * (0.5 + Math.random()),
                        texto: '',
                        volador,
                        baseX: x * TILE + 2,
                        baseY: y * TILE + 2,
                        fase: Math.random() * Math.PI * 2,
                        amplitud: 22 + Math.random() * 10
                    });
                } else if (ch >= '1' && ch <= '4') {
                    tuneles.push({ x, y, id: ch, destino: null });
                } else if (ch === 'G') {
                    if (!meta) {
                        meta = { x: x * TILE, y: y * TILE, ancho: TILE, alto: TILE };
                    } else {
                        const x0 = Math.min(meta.x, x * TILE);
                        const y0 = Math.min(meta.y, y * TILE);
                        const x1 = Math.max(meta.x + meta.ancho, x * TILE + TILE);
                        const y1 = Math.max(meta.y + meta.alto, y * TILE + TILE);
                        meta = { x: x0, y: y0, ancho: x1 - x0, alto: y1 - y0 };
                    }
                }
            }
        }

        for (const tunel of tuneles) {
            if (tunel.destino) continue;
            tunel.destino = tuneles.find((otro) => otro !== tunel && otro.id === tunel.id) || null;
            if (tunel.destino) tunel.destino.destino = tunel;
        }

        return {
            ...datos,
            mapa: datos.mapa.map((fila) => fila.split('')),
            monedas,
            powerups,
            haters,
            tuneles,
            spawn,
            meta
        };
    }

    function crearJugador(spawn) {
        return {
            x: spawn.x,
            y: spawn.y,
            ancho: 10,
            alto: 14,
            vx: 0,
            vy: 0,
            enSuelo: false
        };
    }

    // === AUDIO, HATERS Y POWER-UPS ===

    let audioCtx = null;

    function contextoAudio() {
        if (!estado.sonido) return null;
        try {
            if (!audioCtx) {
                const Ctor = window.AudioContext || window.webkitAudioContext;
                if (!Ctor) return null;
                audioCtx = new Ctor();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
            return audioCtx;
        } catch (e) {
            return null;
        }
    }

    function nota(freq, inicio, duracion, tipo, volumen) {
        const c = contextoAudio();
        if (!c) return;
        const t = c.currentTime + inicio;
        const osc = c.createOscillator();
        const gan = c.createGain();
        osc.type = tipo || 'square';
        osc.frequency.setValueAtTime(freq, t);
        gan.gain.setValueAtTime(0.0001, t);
        gan.gain.exponentialRampToValueAtTime(volumen || 0.05, t + 0.01);
        gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
        osc.connect(gan);
        gan.connect(c.destination);
        osc.start(t);
        osc.stop(t + duracion + 0.02);
    }

    function sfx(nombre) {
        if (!estado.sonido) return;
        switch (nombre) {
            case 'salto':
                nota(440, 0, 0.12, 'square', 0.045);
                nota(660, 0.03, 0.1, 'square', 0.035);
                break;
            case 'moneda':
                nota(980, 0, 0.06, 'triangle', 0.04);
                nota(1320, 0.05, 0.09, 'triangle', 0.04);
                break;
            case 'disparo':
                nota(920, 0, 0.07, 'square', 0.04);
                nota(320, 0.03, 0.08, 'sawtooth', 0.03);
                break;
            case 'golpe':
                nota(240, 0, 0.12, 'square', 0.05);
                nota(120, 0.05, 0.14, 'triangle', 0.04);
                break;
            case 'dano':
                nota(180, 0, 0.2, 'sawtooth', 0.05);
                nota(90, 0.08, 0.22, 'square', 0.04);
                break;
            case 'poder':
                nota(523, 0, 0.09, 'triangle', 0.045);
                nota(659, 0.08, 0.09, 'triangle', 0.045);
                nota(784, 0.16, 0.14, 'triangle', 0.045);
                break;
            case 'meta':
                nota(523, 0, 0.1, 'square', 0.04);
                nota(659, 0.1, 0.1, 'square', 0.04);
                nota(784, 0.2, 0.1, 'square', 0.04);
                nota(1046, 0.3, 0.24, 'square', 0.045);
                break;
            case 'burbuja':
                nota(300, 0, 0.08, 'triangle', 0.025);
                break;
        }
    }

    function leerSonido() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
            return datos.sonido !== false;
        } catch (e) {
            return true;
        }
    }

    function guardarSonido() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
            datos.sonido = estado.sonido;
            localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
        } catch (e) { /* sin almacenamiento */ }
    }

    function actualizarBotonSonido() {
        const boton = document.getElementById('game-sonido');
        if (!boton) return;
        boton.textContent = estado.sonido ? 'Sonido: ON' : 'Sonido: OFF';
        boton.setAttribute('aria-pressed', estado.sonido ? 'true' : 'false');
    }

    function alternarSonido() {
        estado.sonido = !estado.sonido;
        guardarSonido();
        actualizarBotonSonido();
        if (estado.sonido) sfx('moneda');
    }

    function avisoFlotante(texto, x, y) {
        estado.avisos.push({ texto, x, y, vida: 1.1, vidaMax: 1.1 });
    }

    function generarChispas(cantidad, x, y, color) {
        if (estado.particulas.length > 90) return;
        for (let i = 0; i < cantidad; i++) {
            const vida = 0.28 + Math.random() * 0.24;
            estado.particulas.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 90,
                vy: -30 - Math.random() * 70,
                vida,
                vidaMax: vida,
                tam: Math.random() < 0.5 ? 2 : 3,
                color
            });
        }
    }

    function matarHater(h, porSalto) {
        if (!h.vivo) return;
        h.vivo = false;
        estado.hatersMuertos += 1;
        estado.gp += 5;
        generarChispas(10, h.x + h.ancho / 2, h.y + h.alto / 2, '#ff4fa3');
        avisoFlotante('+5 KICKS', h.x + h.ancho / 2, h.y - 2);
        if (porSalto) sfx('golpe');
        sincronizarUi();
    }

    function recogerPowerup(p) {
        if (p.recogido) return;
        p.recogido = true;
        if (p.tipo === 'regalo') {
            if (estado.escudo >= ESCUDO_MAX) {
                estado.gp += 10;
                avisoFlotante('+10 KICKS', p.x, p.y - 10);
                generarChispas(10, p.x, p.y, '#ffd166');
            } else {
                estado.escudo = ESCUDO_MAX;
                estado.grande = true;
                avisoFlotante('¡REGALITO! ESCUDO ' + ESCUDO_MAX + '/' + ESCUDO_MAX, p.x, p.y - 10);
                generarChispas(12, p.x, p.y, '#ff8fc4');
            }
        } else {
            estado.clips = MAX_CLIPS;
            avisoFlotante('+5 CLIPS', p.x, p.y - 10);
            generarChispas(12, p.x, p.y, '#67e8f9');
        }
        sfx('poder');
        sincronizarUi();
    }

    function disparar() {
        if (estado.fase !== 'jugando' || estado.clips <= 0 || estado.disparoEnfriamiento > 0) return;
        const j = estado.jugador;
        if (!j) return;
        estado.clips -= 1;
        estado.disparoEnfriamiento = 0.22;
        estado.disparoAnim = 0.12;
        estado.clipsActivos.push({
            x: j.x + j.ancho / 2 + estado.mirando * 7,
            y: j.y + 6,
            vx: estado.mirando * VEL_CLIP,
            vy: 0,
            vida: 1.1
        });
        sfx('disparo');
        sincronizarUi();
    }

    const TEXTOS_HATER = ['LOL', 'noob', 'ratio', 'gg ez', 'cringe', 'bot', 'mal'];

    function lanzarBurbuja(h, j) {
        if (!j) return;
        const dx = (j.x + j.ancho / 2) - (h.x + h.ancho / 2);
        const texto = TEXTOS_HATER[Math.floor(Math.random() * TEXTOS_HATER.length)];
        estado.burbujas.push({
            x: h.x + h.ancho / 2,
            y: h.y + 2,
            vx: h.volador ? limitar(dx * 0.55, -150, 150) : Math.sign(dx || 1) * 105,
            vy: h.volador ? -100 : -135,
            vida: 3.4,
            texto
        });
        sfx('burbuja');
    }

    function actualizarHater(h, dt, nivel, j) {
        if (!h.vivo) return;

        if (h.volador) {
            h.x = h.baseX + Math.sin(estado.anim * 0.9 + h.fase) * h.amplitud;
            h.y = h.baseY + Math.sin(estado.anim * 1.8 + h.fase) * 7;
            const dx = (j.x + j.ancho / 2) - (h.x + h.ancho / 2);
            const dy = (j.y + j.alto / 2) - (h.y + h.alto / 2);
            h.dir = dx >= 0 ? 1 : -1;
            if (h.aviso > 0) {
                h.aviso -= dt;
                if (h.aviso <= 0) lanzarBurbuja(h, j);
                return;
            }
            h.tiro -= dt;
            if (h.tiro > 0) return;
            if (Math.abs(dx) < 230 && Math.abs(dy) < 170) {
                h.aviso = 0.38;
                h.tiro = INTERVALO_TIRO * (0.8 + Math.random() * 0.8);
            }
            return;
        }

        h.vy = Math.min(h.vy + GRAVEDAD * dt, CAIDA_MAX);
        h.vx = h.dir * VEL_HATER;

        const xAntes = h.x;
        moverHorizontal(h, h.vx * dt, nivel);
        if (Math.abs(h.x - xAntes) < 0.01) {
            h.dir *= -1;
            h.vx = h.dir * VEL_HATER;
        }
        moverVertical(h, h.vy * dt, nivel);

        if (h.enSuelo) {
            const frenteX = h.dir > 0 ? h.x + h.ancho + 2 : h.x - 2;
            const pieY = Math.floor((h.y + h.alto + 1) / TILE);
            const tx = Math.floor(frenteX / TILE);
            const tyCuerpo = Math.floor((h.y + h.alto - 4) / TILE);
            if (!esSolido(nivel, tx, pieY)) h.dir *= -1;
            if (esSolido(nivel, tx, tyCuerpo)) h.dir *= -1;
            if (tx >= 0 && tx < nivel.ancho && nivel.mapa[tyCuerpo][tx] === '^') h.dir *= -1;
        }

        if (h.aviso > 0) {
            h.aviso -= dt;
            if (h.aviso <= 0) lanzarBurbuja(h, j);
            return;
        }

        h.tiro -= dt;
        if (h.tiro > 0) return;
        const dx = (j.x + j.ancho / 2) - (h.x + h.ancho / 2);
        const dy = (j.y + j.alto / 2) - (h.y + h.alto / 2);
        if (Math.abs(dx) < 175 && Math.abs(dy) < 70) {
            h.aviso = 0.38;
            h.dir = dx > 0 ? 1 : -1;
            h.tiro = INTERVALO_TIRO + Math.random() * 1.2;
        }
    }

    // === COLISIONES ===

    function esSolido(nivel, tx, ty) {
        if (tx < 0 || tx >= nivel.ancho) return true;
        if (ty < 0 || ty >= nivel.alto) return false;
        return SOLIDOS.has(nivel.mapa[ty][tx]);
    }

    function limitar(valor, minimo, maximo) {
        return Math.max(minimo, Math.min(maximo, valor));
    }

    function acercar(valor, objetivo, paso) {
        if (valor < objetivo) return Math.min(valor + paso, objetivo);
        if (valor > objetivo) return Math.max(valor - paso, objetivo);
        return objetivo;
    }

    function moverHorizontal(jugador, dx, nivel) {
        if (!dx) return;
        jugador.x += dx;
        const y0 = Math.floor(jugador.y / TILE);
        const y1 = Math.floor((jugador.y + jugador.alto - 0.001) / TILE);

        if (dx > 0) {
            const tx = Math.floor((jugador.x + jugador.ancho - 0.001) / TILE);
            for (let ty = y0; ty <= y1; ty++) {
                if (esSolido(nivel, tx, ty)) {
                    jugador.x = tx * TILE - jugador.ancho;
                    jugador.vx = 0;
                    break;
                }
            }
        } else {
            const tx = Math.floor(jugador.x / TILE);
            for (let ty = y0; ty <= y1; ty++) {
                if (esSolido(nivel, tx, ty)) {
                    jugador.x = (tx + 1) * TILE;
                    jugador.vx = 0;
                    break;
                }
            }
        }
    }

    function moverVertical(jugador, dy, nivel) {
        jugador.y += dy;
        jugador.enSuelo = false;
        const x0 = Math.floor(jugador.x / TILE);
        const x1 = Math.floor((jugador.x + jugador.ancho - 0.001) / TILE);

        if (dy > 0) {
            const ty = Math.floor((jugador.y + jugador.alto - 0.001) / TILE);
            for (let tx = x0; tx <= x1; tx++) {
                if (esSolido(nivel, tx, ty)) {
                    jugador.y = ty * TILE - jugador.alto;
                    jugador.vy = 0;
                    jugador.enSuelo = true;
                    break;
                }
            }
        } else if (dy < 0) {
            const ty = Math.floor(jugador.y / TILE);
            for (let tx = x0; tx <= x1; tx++) {
                if (esSolido(nivel, tx, ty)) {
                    jugador.y = (ty + 1) * TILE;
                    jugador.vy = 0;
                    break;
                }
            }
        }
    }

    function rectSolapa(a, b) {
        return a.x < b.x + b.ancho && a.x + a.ancho > b.x &&
            a.y < b.y + b.alto && a.y + a.alto > b.y;
    }

    function tocaPinchos(jugador, nivel) {
        const x0 = Math.floor(jugador.x / TILE);
        const x1 = Math.floor((jugador.x + jugador.ancho - 0.001) / TILE);
        const y0 = Math.floor(jugador.y / TILE);
        const y1 = Math.floor((jugador.y + jugador.alto - 0.001) / TILE);
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                if (tx < 0 || tx >= nivel.ancho || ty < 0 || ty >= nivel.alto) continue;
                if (nivel.mapa[ty][tx] !== '^') continue;
                const pincho = { x: tx * TILE + 3, y: ty * TILE + 8, ancho: TILE - 6, alto: TILE - 8 };
                if (rectSolapa(jugador, pincho)) return true;
            }
        }
        return false;
    }

    // === PARTIDA ===

    function leerNivelDesbloqueado() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
            let maximo = Number(datos.desbloqueado) || 1;
            const claves = Object.keys(datos.niveles || {})
                .map(Number)
                .filter((numero) => numero >= 1 && numero <= NIVELES.length);
            if (datos.nivel1) claves.push(1);
            if (claves.length) {
                const mejor = Math.max(...claves);
                maximo = Math.max(maximo, mejor < NIVELES.length ? mejor + 1 : mejor);
            }
            return limitar(Math.round(maximo), 1, NIVELES.length);
        } catch (e) {
            return 1;
        }
    }

    function guardarNivelDesbloqueado(numero) {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
            datos.desbloqueado = limitar(Math.round(numero), 1, NIVELES.length);
            localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
        } catch (e) { /* sin almacenamiento */ }
    }

    function desbloquearSiguiente() {
        if (estado.nivelActual >= NIVELES.length) return;
        const siguiente = estado.nivelActual + 1;
        if (siguiente <= estado.nivelDesbloqueado) return;
        estado.nivelDesbloqueado = siguiente;
        guardarNivelDesbloqueado(siguiente);
    }

    function cargarNivel(nivelNumero) {
        const maximo = Math.max(1, Math.min(NIVELES.length, estado.nivelDesbloqueado || 1));
        const numero = limitar(Math.round(nivelNumero || maximo), 1, maximo);
        const definicion = NIVELES[numero - 1];
        estado.nivelActual = numero;
        estado.nivelDatos = parsearNivel(definicion.crear());
        estado.spawn = estado.nivelDatos.spawn;
        estado.jugador = crearJugador(estado.spawn);
        estado.camara.x = limitar(estado.spawn.x - VISTA_ANCHO / 2, 0, Math.max(0, estado.nivelDatos.ancho * TILE - VISTA_ANCHO));
        estado.camara.y = limitar(estado.spawn.y - VISTA_ALTO / 2, 0, Math.max(0, estado.nivelDatos.alto * TILE - VISTA_ALTO));
        estado.particulas.length = 0;
        estado.avisos.length = 0;
        estado.clipsActivos.length = 0;
        estado.burbujas.length = 0;
        estado.grande = false;
        estado.escudo = 0;
        estado.clips = 0;
        estado.disparoEnfriamiento = 0;
        estado.disparoAnim = 0;
        estado.paso = 0;
        estado.squash = 0;
        estado.tunelBloqueado = false;
        estado.purga = null;
        if (estado.nivelDatos.purga) {
            estado.purga = {
                x: estado.nivelDatos.purga.inicio,
                velocidad: estado.nivelDatos.purga.velocidad,
                retraso: estado.nivelDatos.purga.retraso,
                ultimo: 0
            };
        }
    }

    function empezarNivel(nivelNumero) {
        cargarNivel(nivelNumero);
        estado.tiempo = 0;
        estado.invulnerable = 0;
        estado.parpadeo = 2.4;
        estado.parpadeoActivo = 0;
        estado.polvoTimer = 0;
        estado.enSueloAnterior = false;
        estado.gpNivel = estado.gp;
        estado.hatersNivel = estado.hatersMuertos;
        fijarFase('jugando');
        sincronizarUi({ rankingMensaje: '', rankingError: '' });
        iniciarRun(nivelNumero);
    }

    function iniciarPartida(nivelNumero) {
        const maximo = Math.max(1, Math.min(NIVELES.length, estado.nivelDesbloqueado || 1));
        const numero = limitar(Math.round(nivelNumero || estado.nivelActual || maximo), 1, maximo);
        estado.gp = 0;
        estado.vidas = VIDAS_INICIALES;
        estado.tiempo = 0;
        estado.hatersMuertos = 0;
        estado.invulnerable = 0;
        sincronizarUi({ rankingMensaje: '' });
        empezarNivel(numero);
    }

    function reiniciarPartida() {
        iniciarPartida(estado.nivelActual);
    }

    function siguienteNivelJuego() {
        if (estado.nivelActual >= NIVELES.length) return;
        if (estado.nivelActual + 1 > estado.nivelDesbloqueado) return;
        empezarNivel(estado.nivelActual + 1);
    }

    function recargarNivelTrasDano() {
        const gpNivel = estado.gpNivel;
        const hatersNivel = estado.hatersNivel;
        const vidas = estado.vidas;
        const tiempo = estado.tiempo;
        cargarNivel(estado.nivelActual);
        estado.gp = gpNivel;
        estado.hatersMuertos = hatersNivel;
        estado.vidas = vidas;
        estado.tiempo = tiempo;
        estado.invulnerable = 1.2;
    }

    function limpiarEntrada() {
        estado.entrada.izquierda = false;
        estado.entrada.derecha = false;
        estado.entrada.salto = false;
        estado.entrada.correr = false;
        estado.bufferSalto = 0;
        estado.coyote = 0;
    }

    function colocarEnSpawn() {
        const j = estado.jugador;
        j.x = estado.spawn.x;
        j.y = estado.spawn.y;
        j.vx = 0;
        j.vy = 0;
        j.enSuelo = false;
    }

    function pausarPartida() {
        if (estado.fase !== 'jugando') return;
        fijarFase('pausa');
        limpiarEntrada();
    }

    function reanudarPartida() {
        if (estado.fase !== 'pausa') return;
        fijarFase('jugando');
    }

    function alternarPausa() {
        if (estado.fase === 'jugando') pausarPartida();
        else if (estado.fase === 'pausa') reanudarPartida();
    }

    function fijarFase(fase) {
        estado.fase = fase;
        sincronizarUi();
        const aviso = document.getElementById('game-aviso');
        if (aviso) {
            const textos = {
                inicio: 'GochitaRunner listo. Pulsa Jugar.',
                jugando: 'Partida en curso.',
                pausa: 'Juego en pausa.',
                completo: 'Nivel completado.',
                gameover: 'Fin de la partida.'
            };
            aviso.textContent = textos[fase] || '';
        }
    }

    function sincronizarUi(extra) {
        const store = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (!store) return;
        store.fase = estado.fase;
        store.gp = estado.gp;
        store.vidas = estado.vidas;
        store.tiempo = estado.tiempo;
        store.clips = estado.clips;
        store.haters = estado.hatersMuertos;
        store.grande = estado.grande;
        store.escudo = estado.escudo;
        store.escudoMax = ESCUDO_MAX;
        store.nivel = estado.nivelActual;
        store.nivelActual = estado.nivelActual;
        store.nivelDesbloqueado = estado.nivelDesbloqueado;
        store.nivelNombre = estado.nivelDatos ? estado.nivelDatos.nombre : NIVELES[estado.nivelActual - 1].nombre;
        store.totalNiveles = NIVELES.length;
        store.haySiguiente = estado.nivelActual < NIVELES.length;
        store.rankingSesion = !!tokenComunidad();
        store.rankingApodo = apodoComunidad();
        if (extra) Object.assign(store, extra);
    }

    function danar() {
        if (estado.fase !== 'jugando' || estado.invulnerable > 0) return;
        const j = estado.jugador;
        if (estado.escudo > 0) {
            estado.escudo -= 1;
            estado.invulnerable = 1.1;
            if (j) {
                generarChispas(14, j.x + j.ancho / 2, j.y + j.alto / 2, '#ff8fc4');
                if (estado.escudo > 0) {
                    avisoFlotante('ESCUDO ' + estado.escudo + '/' + ESCUDO_MAX, j.x + j.ancho / 2, j.y - 6);
                } else {
                    avisoFlotante('¡ESCUDO ROTO!', j.x + j.ancho / 2, j.y - 6);
                }
            }
            if (estado.escudo <= 0) estado.grande = false;
            sfx('dano');
            sincronizarUi();
            return;
        }
        estado.vidas -= 1;
        sfx('dano');
        if (estado.vidas <= 0) {
            estado.vidas = 0;
            sincronizarUi();
            fijarFase('gameover');
            return;
        }
        if (estado.purga) {
            recargarNivelTrasDano();
        } else {
            colocarEnSpawn();
        }
        estado.invulnerable = 1.2;
        sincronizarUi();
    }

    function completarNivel() {
        if (estado.fase !== 'jugando') return;
        guardarRecord(estado.nivelActual);
        desbloquearSiguiente();
        enviarRun();
        sfx('meta');
        sincronizarUi({ record: textoRecord(estado.nivelActual) });
        fijarFase('completo');
    }

    function tokenComunidad() {
        try { return localStorage.getItem('comunidad_session_token') || ''; } catch (e) { return ''; }
    }

    function apodoComunidad() {
        try { return localStorage.getItem('comunidad_nickname') || ''; } catch (e) { return ''; }
    }

    async function iniciarRun(nivelNumero) {
        estado.runId = null;
        estado.runNivel = nivelNumero;
        estado.runEnviado = false;
        const token = tokenComunidad();
        if (!token || typeof window.rpcRaw !== 'function') return;
        try {
            const res = await window.rpcRaw('game_iniciar_partida', { p_token: token, p_nivel: nivelNumero });
            if (estado.nivelActual === nivelNumero && estado.fase === 'jugando' &&
                res && !res.error && res.data && res.data.ok) {
                estado.runId = res.data.run_id;
            }
        } catch (e) { /* sin conexión: la partida sigue en local */ }
    }

    async function enviarRun() {
        if (estado.runEnviado) return;
        const store = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        const token = tokenComunidad();
        if (!token) {
            if (store) store.rankingMensaje = 'Modo invitado: la partida no se envía al ranking.';
            return;
        }
        if (!estado.runId) {
            if (store) store.rankingMensaje = 'No se pudo registrar esta partida online.';
            return;
        }
        estado.runEnviado = true;
        if (store) store.rankingMensaje = 'Enviando marca…';
        const gp = Math.max(0, Math.round(estado.gp - estado.gpNivel));
        const haters = Math.max(0, Math.round(estado.hatersMuertos - estado.hatersNivel));
        const tiempoMs = Math.max(0, Math.round(estado.tiempo * 1000));
        try {
            const res = await window.rpcRaw('game_enviar_partida', {
                p_token: token,
                p_run: estado.runId,
                p_gp: gp,
                p_haters: haters,
                p_tiempo_ms: tiempoMs
            });
            if (store) {
                if (res && !res.error && res.data && res.data.ok) {
                    store.rankingMensaje = 'Online: ' + res.data.puntos + ' pts · puesto #' + res.data.posicion +
                        (res.data.record ? ' · ¡récord personal!' : '');
                } else {
                    const motivo = res && res.data && res.data.error ? res.data.error : 'error de conexión';
                    store.rankingMensaje = 'No se envió la marca (' + motivo + ').';
                }
            }
        } catch (e) {
            if (store) store.rankingMensaje = 'No se envió la marca (sin conexión).';
        }
        estado.runId = null;
    }

    async function cargarRanking(tab) {
        const store = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (!store) return;
        store.rankingCargando = true;
        store.rankingError = '';
        try {
            if (typeof window.rpcRaw !== 'function') throw new Error('sin conexion');
            const res = tab === 'general'
                ? await window.rpcRaw('game_ranking_general', { p_limite: 50 })
                : await window.rpcRaw('game_ranking_nivel', { p_nivel: Number(tab), p_limite: 50 });
            if (res.error || !Array.isArray(res.data)) throw new Error('respuesta');
            store.rankingFilas = res.data.map((fila) => ({
                posicion: fila.posicion,
                apodo: fila.apodo || 'Anónimo',
                puntos: fila.puntos,
                detalle: tab === 'general'
                    ? fila.niveles + (Number(fila.niveles) === 1 ? ' nivel' : ' niveles')
                    : fila.gp + ' Kicks · ' + fila.haters + ' haters',
                tiempo: formatearTiempo((Number(fila.tiempo_ms) || 0) / 1000)
            }));
        } catch (e) {
            store.rankingFilas = [];
            store.rankingError = 'No se pudo cargar el ranking. Revisa tu conexión.';
        } finally {
            store.rankingCargando = false;
        }
    }

    function mostrarRanking(tab) {
        const store = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (!store) return;
        store.rankingAbierto = true;
        store.rankingTab = tab || store.rankingTab || 'general';
        cargarRanking(store.rankingTab);
    }

    function ocultarRanking() {
        const store = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (store) store.rankingAbierto = false;
    }

    function cambiarTabRanking(tab) {
        const store = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (!store || store.rankingTab === tab) return;
        store.rankingTab = tab;
        cargarRanking(tab);
    }

    function formatearTiempo(segundos) {
        const total = Math.max(0, Math.floor(segundos));
        const minutos = Math.floor(total / 60);
        const resto = total % 60;
        return String(minutos).padStart(2, '0') + ':' + String(resto).padStart(2, '0');
    }

    function leerRecord(nivelNumero) {
        const numero = nivelNumero || estado.nivelActual;
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
            const lista = datos.niveles || {};
            return lista[numero] || (numero === 1 ? datos.nivel1 : null) || null;
        } catch (e) {
            return null;
        }
    }

    function textoRecord(nivelNumero) {
        const numero = nivelNumero || estado.nivelActual;
        const record = leerRecord(numero);
        if (!record) return 'Nivel ' + numero + ': aún no hay marca guardada.';
        return 'Nivel ' + numero + ' · mejor: ' + formatearTiempo(record.mejorTiempo) + ' · ' + record.mejorGp + ' Kicks';
    }

    function guardarRecord(nivelNumero) {
        const numero = nivelNumero || estado.nivelActual;
        const anterior = leerRecord(numero);
        const mejora = !anterior ||
            estado.gp > anterior.mejorGp ||
            (estado.gp === anterior.mejorGp && estado.tiempo < anterior.mejorTiempo);
        if (!mejora) return;
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
            datos.niveles = datos.niveles || {};
            datos.niveles[numero] = {
                mejorTiempo: estado.tiempo,
                mejorGp: estado.gp,
                haters: estado.hatersMuertos,
                actualizado: new Date().toISOString()
            };
            localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
        } catch (e) {
            // Sin almacenamiento: la partida sigue, solo no se conserva la marca.
        }
    }

    // === ACTUALIZACIÓN ===

    function actualizarParpadeo(dt) {
        estado.parpadeo -= dt;
        if (estado.parpadeo <= 0) {
            estado.parpadeo = 2.4 + Math.random() * 3.2;
            estado.parpadeoActivo = 0.11;
        }
        if (estado.parpadeoActivo > 0) {
            estado.parpadeoActivo = Math.max(0, estado.parpadeoActivo - dt);
        }
    }

    function generarPolvo(cantidad, x, y) {
        if (estado.particulas.length > 60) return;
        for (let i = 0; i < cantidad; i++) {
            const vida = 0.24 + Math.random() * 0.22;
            estado.particulas.push({
                x: x + (Math.random() - 0.5) * 6,
                y: y - 1 - Math.random() * 2,
                vx: (Math.random() - 0.5) * 46 - (estado.jugador ? estado.jugador.vx * 0.12 : 0),
                vy: -16 - Math.random() * 26,
                vida,
                vidaMax: vida,
                tam: Math.random() < 0.5 ? 1 : 2
            });
        }
    }

    function actualizarParticulas(dt) {
        for (let i = estado.particulas.length - 1; i >= 0; i--) {
            const p = estado.particulas[i];
            p.vida -= dt;
            if (p.vida <= 0) {
                estado.particulas.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 120 * dt;
        }
    }

    function actualizarHaters(dt, nivel, j) {
        for (const h of nivel.haters) {
            actualizarHater(h, dt, nivel, j);
            if (!h.vivo || estado.invulnerable > 0) continue;
            const caja = { x: h.x, y: h.y, ancho: h.ancho, alto: h.alto };
            if (!rectSolapa(j, caja)) continue;
            const pisando = j.vy > 40 && (j.y + j.alto) - h.y < 12;
            if (pisando) {
                matarHater(h, true);
                j.vy = -330;
                j.y = h.y - j.alto - 0.1;
                j.enSuelo = false;
            } else {
                danar();
                return;
            }
        }
    }

    function actualizarClips(dt, nivel) {
        for (let i = estado.clipsActivos.length - 1; i >= 0; i--) {
            const clip = estado.clipsActivos[i];
            clip.vida -= dt;
            clip.x += clip.vx * dt;
            let quitar = clip.vida <= 0;
            if (!quitar && esSolido(nivel, Math.floor(clip.x / TILE), Math.floor(clip.y / TILE))) {
                quitar = true;
            }
            if (!quitar) {
                for (const h of nivel.haters) {
                    if (!h.vivo) continue;
                    if (clip.x > h.x && clip.x < h.x + h.ancho && clip.y > h.y && clip.y < h.y + h.alto) {
                        matarHater(h, false);
                        quitar = true;
                        break;
                    }
                }
            }
            if (!quitar) {
                for (let b = estado.burbujas.length - 1; b >= 0; b--) {
                    const bur = estado.burbujas[b];
                    if (clip.x > bur.x - 8 && clip.x < bur.x + 8 && clip.y > bur.y - 6 && clip.y < bur.y + 6) {
                        estado.burbujas.splice(b, 1);
                        quitar = true;
                        break;
                    }
                }
            }
            if (quitar) estado.clipsActivos.splice(i, 1);
        }
    }

    function actualizarBurbujas(dt, nivel) {
        const j = estado.jugador;
        for (let i = estado.burbujas.length - 1; i >= 0; i--) {
            const b = estado.burbujas[i];
            b.vida -= dt;
            b.vy += 320 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            let quitar = b.vida <= 0 || b.y > nivel.alto * TILE + 20 ||
                esSolido(nivel, Math.floor(b.x / TILE), Math.floor(b.y / TILE));
            if (!quitar && j && rectSolapa(j, { x: b.x - 7, y: b.y - 6, ancho: 14, alto: 12 })) {
                quitar = true;
                danar();
            }
            if (quitar) estado.burbujas.splice(i, 1);
        }
    }

    function actualizarPowerups(dt, nivel, j) {
        for (const p of nivel.powerups) {
            if (p.recogido) continue;
            p.y = p.baseY + Math.sin(estado.anim * 3 + p.x * 0.05) * 2;
            if (rectSolapa(j, { x: p.x - 7, y: p.y - 8, ancho: 14, alto: 14 })) {
                recogerPowerup(p);
            }
        }
    }

    function actualizarAvisos(dt) {
        for (let i = estado.avisos.length - 1; i >= 0; i--) {
            const a = estado.avisos[i];
            a.vida -= dt;
            a.y -= 16 * dt;
            if (a.vida <= 0) estado.avisos.splice(i, 1);
        }
    }

    function cajaTunel(tunel) {
        return { x: tunel.x * TILE + 3, y: tunel.y * TILE + 5, ancho: 10, alto: 11 };
    }

    function actualizarTuneles(dt, nivel, j) {
        if (!nivel.tuneles.length) return;
        const dentro = nivel.tuneles.some((tunel) => rectSolapa(j, cajaTunel(tunel)));
        if (!dentro) {
            estado.tunelBloqueado = false;
            return;
        }
        if (estado.tunelBloqueado) return;
        for (const tunel of nivel.tuneles) {
            if (!rectSolapa(j, cajaTunel(tunel)) || !tunel.destino) continue;
            const destino = tunel.destino;
            j.x = destino.x * TILE + 3;
            j.y = destino.y * TILE + 2;
            j.vx = 0;
            j.vy = 0;
            estado.tunelBloqueado = true;
            generarChispas(18, j.x + j.ancho / 2, j.y + j.alto / 2, '#53fc18');
            sfx('poder');
            estado.camara.x = limitar(j.x - VISTA_ANCHO / 2, 0, Math.max(0, nivel.ancho * TILE - VISTA_ANCHO));
            estado.camara.y = limitar(j.y - VISTA_ALTO / 2, 0, Math.max(0, nivel.alto * TILE - VISTA_ALTO));
            break;
        }
    }

    function actualizarPurga(dt, nivel, j) {
        const purga = estado.purga;
        if (!purga || estado.fase !== 'jugando') return;
        if (estado.tiempo < purga.retraso) return;

        purga.x += purga.velocidad * dt;
        const hasta = Math.floor(purga.x / TILE);

        for (let tx = purga.ultimo; tx <= hasta; tx++) {
            if (tx < 0 || tx >= nivel.ancho) continue;
            for (let ty = 0; ty < nivel.alto; ty++) {
                const ch = nivel.mapa[ty][tx];
                if (ch === '#' || ch === '=' || ch === '^') {
                    nivel.mapa[ty][tx] = ' ';
                    if ((tx + ty) % 5 === 0) {
                        generarChispas(2, tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#ff4fa3');
                    }
                }
            }
            for (const moneda of nivel.monedas) {
                if (!moneda.recogida && moneda.x < (tx + 1) * TILE) moneda.recogida = true;
            }
            for (const h of nivel.haters) {
                if (h.vivo && h.x < (tx + 1) * TILE) h.vivo = false;
            }
        }
        purga.ultimo = Math.max(purga.ultimo, hasta + 1);

        if (j.x + j.ancho / 2 < purga.x + 6) {
            avisoFlotante('¡LA PURGA!', j.x + j.ancho / 2, j.y - 8);
            danar();
        }
    }

    function actualizar(dt) {
        if (estado.fase !== 'jugando') return;
        const nivel = estado.nivelDatos;
        const j = estado.jugador;
        if (!nivel || !j) return;

        estado.tiempo += dt;
        estado.anim += dt;
        estado.invulnerable = Math.max(0, estado.invulnerable - dt);
        estado.squash = Math.max(0, estado.squash - dt);
        estado.disparoEnfriamiento = Math.max(0, estado.disparoEnfriamiento - dt);
        estado.disparoAnim = Math.max(0, estado.disparoAnim - dt);
        actualizarParpadeo(dt);

        const velMax = estado.entrada.correr ? VEL_CORRER : VEL_CAMINAR;
        let objetivo = 0;
        if (estado.entrada.izquierda) objetivo -= velMax;
        if (estado.entrada.derecha) objetivo += velMax;

        if (objetivo !== 0) {
            const aceleracion = j.enSuelo ? ACELERACION : ACELERACION * 0.8;
            j.vx = acercar(j.vx, objetivo, aceleracion * dt);
            estado.mirando = objetivo > 0 ? 1 : -1;
        } else {
            const frenado = j.enSuelo ? FRENADO : FRENADO * 0.45;
            j.vx = acercar(j.vx, 0, frenado * dt);
        }

        if (j.enSuelo) estado.coyote = COYOTE;
        else estado.coyote = Math.max(0, estado.coyote - dt);
        if (estado.bufferSalto > 0) estado.bufferSalto -= dt;

        if (estado.bufferSalto > 0 && estado.coyote > 0) {
            j.vy = SALTO;
            j.enSuelo = false;
            estado.bufferSalto = 0;
            estado.coyote = 0;
            sfx('salto');
        }

        j.vy = Math.min(j.vy + GRAVEDAD * dt, CAIDA_MAX);
        const vyAntes = j.vy;

        moverHorizontal(j, j.vx * dt, nivel);
        moverVertical(j, j.vy * dt, nivel);
        actualizarTuneles(dt, nivel, j);

        if (j.enSuelo) {
            if (Math.abs(j.vx) > 8) {
                estado.paso += Math.abs(j.vx) * dt * 0.085;
            } else {
                estado.paso = acercar(estado.paso, Math.round(estado.paso / Math.PI) * Math.PI, dt * 8);
            }
        }

        if (j.enSuelo && !estado.enSueloAnterior && vyAntes > 240) {
            estado.squash = 0.1;
            generarPolvo(6, j.x + j.ancho / 2, j.y + j.alto);
        }
        estado.enSueloAnterior = j.enSuelo;

        if (j.enSuelo && Math.abs(j.vx) > 185) {
            estado.polvoTimer -= dt;
            if (estado.polvoTimer <= 0) {
                estado.polvoTimer = 0.09;
                generarPolvo(1, j.x + j.ancho / 2 - estado.mirando * 4, j.y + j.alto);
            }
        } else {
            estado.polvoTimer = 0;
        }

        actualizarParticulas(dt);
        actualizarHaters(dt, nivel, j);
        if (estado.jugador !== j) return;
        if (estado.fase !== 'jugando') return;
        actualizarPowerups(dt, nivel, j);
        actualizarClips(dt, nivel);
        actualizarBurbujas(dt, nivel);
        if (estado.jugador !== j) return;
        actualizarAvisos(dt);
        actualizarPurga(dt, nivel, j);
        if (estado.jugador !== j) return;
        if (estado.fase !== 'jugando') return;

        if (j.y > nivel.alto * TILE + 60) {
            danar();
            return;
        }

        if (tocaPinchos(j, nivel)) {
            danar();
            return;
        }

        for (const moneda of nivel.monedas) {
            if (moneda.recogida) continue;
            const caja = { x: moneda.x - 5, y: moneda.y - 5, ancho: 10, alto: 10 };
            if (rectSolapa(j, caja)) {
                moneda.recogida = true;
                estado.gp += 1;
                sfx('moneda');
                sincronizarUi();
            }
        }

        // La meta se activa al cruzar su columna, aunque el jugador vaya saltando.
        if (nivel.meta && j.x + j.ancho > nivel.meta.x && j.x < nivel.meta.x + nivel.meta.ancho) {
            completarNivel();
            return;
        }

        const objetivoX = j.x + j.ancho / 2 - VISTA_ANCHO / 2;
        const objetivoY = j.y + j.alto / 2 - VISTA_ALTO / 2;
        const maxX = Math.max(0, nivel.ancho * TILE - VISTA_ANCHO);
        const maxY = Math.max(0, nivel.alto * TILE - VISTA_ALTO);
        const suavizado = Math.min(1, 10 * dt);
        estado.camara.x += (limitar(objetivoX, 0, maxX) - estado.camara.x) * suavizado;
        estado.camara.y += (limitar(objetivoY, 0, maxY) - estado.camara.y) * suavizado;
    }

    // === RENDER ===

    function rectRedondeado(c, x, y, ancho, alto, radio) {
        const r = Math.min(radio, ancho / 2, alto / 2);
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + ancho, y, x + ancho, y + alto, r);
        c.arcTo(x + ancho, y + alto, x, y + alto, r);
        c.arcTo(x, y + alto, x, y, r);
        c.arcTo(x, y, x + ancho, y, r);
        c.closePath();
    }

    function dibujarFondo(c) {
        const tema = estado.nivelActual;
        const paletas = {
            1: ['#080d1c', '#141033', '#23103d', 'rgba(94, 234, 212, 0.06)', 'rgba(255, 79, 163, 0.08)'],
            2: ['#041018', '#062430', '#0a3340', 'rgba(83, 252, 24, 0.07)', 'rgba(103, 232, 249, 0.08)'],
            3: ['#14060f', '#2a0a1e', '#3a0d16', 'rgba(255, 79, 163, 0.10)', 'rgba(255, 107, 107, 0.10)']
        };
        const paleta = paletas[tema] || paletas[1];
        const gradiente = c.createLinearGradient(0, 0, 0, VISTA_ALTO);
        gradiente.addColorStop(0, paleta[0]);
        gradiente.addColorStop(0.55, paleta[1]);
        gradiente.addColorStop(1, paleta[2]);
        c.fillStyle = gradiente;
        c.fillRect(0, 0, VISTA_ANCHO, VISTA_ALTO);

        c.fillStyle = paleta[3];
        const desplazamiento = (estado.camara.x * 0.3) % 160;
        for (let i = -1; i < 5; i++) {
            const bx = i * 160 - desplazamiento;
            const alto = 46 + ((i + 5) % 3) * 22;
            c.fillRect(bx, VISTA_ALTO - alto - 30, 70, alto);
        }

        c.fillStyle = paleta[4];
        for (let i = 0; i < 6; i++) {
            const bx = ((i * 97 - estado.camara.x * 0.45) % (VISTA_ANCHO + 60)) - 30;
            const alto = 30 + (i % 4) * 16;
            c.fillRect(bx, VISTA_ALTO - alto - 54, 34, alto);
        }

        if (tema === 3) {
            c.fillStyle = 'rgba(255, 79, 163, 0.16)';
            const pulso = (estado.anim * 60) % 220;
            for (let i = 0; i < 4; i++) {
                c.fillRect(0, (i * 70 + pulso) % VISTA_ALTO, VISTA_ANCHO, 1);
            }
        }
    }

    function dibujarNivel(c) {
        const nivel = estado.nivelDatos;
        if (!nivel) return;
        const x0 = Math.max(0, Math.floor(estado.camara.x / TILE) - 1);
        const x1 = Math.min(nivel.ancho - 1, Math.floor((estado.camara.x + VISTA_ANCHO) / TILE) + 1);
        const y0 = Math.max(0, Math.floor(estado.camara.y / TILE) - 1);
        const y1 = Math.min(nivel.alto - 1, Math.floor((estado.camara.y + VISTA_ALTO) / TILE) + 1);

        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                const ch = nivel.mapa[ty][tx];
                const px = tx * TILE;
                const py = ty * TILE;
                if (ch === '#') {
                    c.fillStyle = '#122c44';
                    c.fillRect(px, py, TILE, TILE);
                    c.fillStyle = '#2bd9b0';
                    c.fillRect(px, py, TILE, 3);
                    if ((tx + ty) % 3 === 0) {
                        c.fillStyle = 'rgba(94, 234, 212, 0.12)';
                        c.fillRect(px + 3, py + 7, 4, 4);
                    }
                } else if (ch === '=') {
                    c.fillStyle = '#1b2350';
                    c.fillRect(px, py, TILE, TILE);
                    c.fillStyle = '#ff4fa3';
                    c.fillRect(px, py, TILE, 3);
                } else if (ch === '^') {
                    c.fillStyle = '#ff6b6b';
                    c.beginPath();
                    c.moveTo(px + 2, py + TILE);
                    c.lineTo(px + TILE / 2, py + 5);
                    c.lineTo(px + TILE - 2, py + TILE);
                    c.closePath();
                    c.fill();
                }
            }
        }
    }

    function dibujarTuneles(c) {
        const nivel = estado.nivelDatos;
        if (!nivel) return;
        for (const tunel of nivel.tuneles) {
            const x = tunel.x * TILE + TILE / 2;
            const y = tunel.y * TILE + TILE / 2 + 3;
            const pulso = Math.sin(estado.anim * 4 + tunel.x * 0.2) * 1.5;
            c.strokeStyle = 'rgba(83, 252, 24, 0.28)';
            c.lineWidth = 1;
            c.beginPath();
            c.ellipse(x, y, 10 + pulso, 11 + pulso, 0, 0, Math.PI * 2);
            c.stroke();
            c.strokeStyle = '#53fc18';
            c.lineWidth = 2;
            c.beginPath();
            c.ellipse(x, y, 6.5, 7.5, 0, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = 'rgba(6, 33, 10, 0.6)';
            c.beginPath();
            c.ellipse(x, y, 4.5, 5.5, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#b6ff9e';
            c.font = 'bold 5px monospace';
            c.textAlign = 'center';
            c.fillText('RAID', x, y + 2);
        }
        c.textAlign = 'left';
    }

    function dibujarPurga(c) {
        const purga = estado.purga;
        const nivel = estado.nivelDatos;
        if (!purga || !nivel) return;
        const alto = nivel.alto * TILE;
        const x = purga.x;

        const gradiente = c.createLinearGradient(x - 24, 0, x + 18, 0);
        gradiente.addColorStop(0, 'rgba(20, 6, 15, 0)');
        gradiente.addColorStop(0.45, 'rgba(255, 79, 163, 0.18)');
        gradiente.addColorStop(1, 'rgba(90, 10, 60, 0.92)');
        c.fillStyle = gradiente;
        c.fillRect(x - 24, 0, 42, alto);

        for (let i = 0; i < 16; i++) {
            const yy = ((i * 61 + estado.anim * 110) % alto);
            const ancho = 5 + (i % 3) * 7;
            c.fillStyle = i % 2 ? 'rgba(255, 79, 163, 0.55)' : 'rgba(255, 209, 102, 0.35)';
            c.fillRect(x - 16 + (i % 5) * 6, yy, ancho, 3);
        }

        c.fillStyle = '#ff4fa3';
        c.fillRect(x + 14, 0, 2, alto);
        c.fillStyle = 'rgba(255, 79, 163, 0.22)';
        c.fillRect(x + 16, 0, 5, alto);
    }

    function dibujarAlertaPurga(c) {
        const purga = estado.purga;
        const j = estado.jugador;
        if (!purga || !j) return;
        const distancia = j.x - purga.x;
        if (distancia > 120) return;
        const intensidad = 1 - Math.max(0, distancia) / 120;
        const alfa = 0.08 + intensidad * 0.22;
        const borde = 26;
        c.fillStyle = 'rgba(255, 79, 163, ' + alfa.toFixed(2) + ')';
        c.fillRect(0, 0, VISTA_ANCHO, borde);
        c.fillRect(0, VISTA_ALTO - borde, VISTA_ANCHO, borde);
        c.fillRect(0, 0, borde, VISTA_ALTO);
        c.fillRect(VISTA_ANCHO - borde, 0, borde, VISTA_ALTO);
        if (distancia < 80) {
            c.font = 'bold 9px monospace';
            c.textAlign = 'center';
            c.fillStyle = '#ffd1e6';
            c.fillText('¡CORRE!', VISTA_ANCHO / 2, VISTA_ALTO - 34);
            c.textAlign = 'left';
        }
    }

    function dibujarMonedas(c) {
        const nivel = estado.nivelDatos;
        if (!nivel) return;
        for (const moneda of nivel.monedas) {
            if (moneda.recogida) continue;
            const flotar = Math.sin(estado.anim * 4 + moneda.x * 0.05) * 2;
            const y = moneda.y + flotar;
            c.fillStyle = '#ffd166';
            c.beginPath();
            c.arc(moneda.x, y, 5, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#7c4a00';
            c.font = 'bold 7px monospace';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('G', moneda.x, y + 0.5);
        }
        c.textBaseline = 'alphabetic';
        c.textAlign = 'left';
    }

    function dibujarPowerups(c) {
        const nivel = estado.nivelDatos;
        if (!nivel) return;
        for (const p of nivel.powerups) {
            if (p.recogido) continue;
            const y = p.y;
            if (p.tipo === 'regalo') {
                c.fillStyle = 'rgba(255, 79, 163, .18)';
                c.beginPath();
                c.arc(p.x, y, 11, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = '#ff4fa3';
                rectRedondeado(c, p.x - 7, y - 6, 14, 12, 2);
                c.fill();
                c.fillStyle = '#ffd1e6';
                c.fillRect(p.x - 1.5, y - 6, 3, 12);
                c.fillRect(p.x - 7, y - 2.5, 14, 3);
                c.fillStyle = '#ff8fc4';
                c.beginPath();
                c.arc(p.x - 2.4, y - 7.4, 2.2, 0, Math.PI * 2);
                c.arc(p.x + 2.4, y - 7.4, 2.2, 0, Math.PI * 2);
                c.fill();
            } else {
                c.fillStyle = 'rgba(103, 232, 249, .18)';
                c.beginPath();
                c.arc(p.x, y, 11, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = '#67e8f9';
                c.beginPath();
                c.moveTo(p.x, y - 8);
                c.lineTo(p.x + 7, y);
                c.lineTo(p.x, y + 8);
                c.lineTo(p.x - 7, y);
                c.closePath();
                c.fill();
                c.fillStyle = '#d9fbff';
                c.beginPath();
                c.moveTo(p.x, y - 5);
                c.lineTo(p.x + 3.5, y - 1);
                c.lineTo(p.x, y + 2);
                c.lineTo(p.x - 2, y - 1);
                c.closePath();
                c.fill();
            }
        }
    }

    function dibujarHaters(c) {
        const nivel = estado.nivelDatos;
        if (!nivel) return;
        for (const h of nivel.haters) {
            if (!h.vivo) continue;
            const cx = h.x + h.ancho / 2;
            const pies = h.y + h.alto;
            const bob = Math.sin(estado.anim * 7 + h.x * 0.08) * 0.7;
            if (!h.volador) {
                c.fillStyle = 'rgba(0, 0, 0, .35)';
                c.beginPath();
                c.ellipse(cx, pies + 0.5, 7.5, 2, 0, 0, Math.PI * 2);
                c.fill();
            } else {
                const aleteo = Math.sin(estado.anim * 14 + h.fase) * 2;
                c.fillStyle = 'rgba(103, 232, 249, 0.72)';
                c.beginPath();
                c.moveTo(cx - 6, h.y + 5 + bob);
                c.lineTo(cx - 14, h.y + 1 + aleteo + bob);
                c.lineTo(cx - 7, h.y + 10 + bob);
                c.closePath();
                c.fill();
                c.beginPath();
                c.moveTo(cx + 6, h.y + 5 + bob);
                c.lineTo(cx + 14, h.y + 1 + aleteo + bob);
                c.lineTo(cx + 7, h.y + 10 + bob);
                c.closePath();
                c.fill();
                c.fillStyle = '#67e8f9';
                c.fillRect(cx - 4, h.y - 2 + bob, 8, 1.5);
            }

            // Cuerpo con contorno para que se lea sobre el fondo.
            c.fillStyle = '#20263a';
            rectRedondeado(c, cx - 7, h.y + bob, 14, 13, 5);
            c.fill();
            c.fillStyle = '#9aa4b8';
            rectRedondeado(c, cx - 6, h.y + 1 + bob, 12, 11, 4);
            c.fill();
            c.fillStyle = '#6f7a90';
            if (!h.volador) {
                c.fillRect(cx - 5, pies - 2, 4, 2);
                c.fillRect(cx + 1, pies - 2, 4, 2);
            }

            // Cara enfadada y legible.
            c.fillStyle = '#f8fafc';
            c.beginPath();
            c.arc(cx - 2.6, h.y + 5 + bob, 2, 0, Math.PI * 2);
            c.arc(cx + 2.6, h.y + 5 + bob, 2, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#b91c1c';
            c.beginPath();
            c.arc(cx - 2.4, h.y + 5.2 + bob, 1, 0, Math.PI * 2);
            c.arc(cx + 2.8, h.y + 5.2 + bob, 1, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = '#1f2937';
            c.lineWidth = 1.2;
            c.beginPath();
            c.moveTo(cx - 5, h.y + 2.2 + bob);
            c.lineTo(cx - 1.2, h.y + 3.5 + bob);
            c.moveTo(cx + 5, h.y + 2.2 + bob);
            c.lineTo(cx + 1.2, h.y + 3.5 + bob);
            c.stroke();
            c.beginPath();
            c.arc(cx, h.y + 10 + bob, 1.8, Math.PI, Math.PI * 2);
            c.stroke();

            // Móvil con pantalla encendida.
            const movilX = cx + h.dir * 5;
            c.fillStyle = '#111827';
            rectRedondeado(c, movilX - 2.5, h.y + 6 + bob, 5, 8, 1.2);
            c.fill();
            c.fillStyle = h.aviso > 0 ? '#ff4fa3' : '#334155';
            c.fillRect(movilX - 1.5, h.y + 7 + bob, 3, 4);
            if (h.aviso > 0) {
                c.fillStyle = '#fde047';
                c.font = 'bold 9px monospace';
                c.textAlign = 'center';
                c.fillText('!', cx, h.y - 3);
                c.textAlign = 'left';
            }
        }
    }

    function dibujarClips(c) {
        for (const clip of estado.clipsActivos) {
            c.fillStyle = 'rgba(255, 79, 163, .3)';
            c.fillRect(clip.x - Math.sign(clip.vx) * 10, clip.y - 1, 8, 2);
            c.fillStyle = '#ff4fa3';
            rectRedondeado(c, clip.x - 4, clip.y - 2.5, 8, 5, 2);
            c.fill();
            c.fillStyle = '#ffe3f1';
            c.fillRect(clip.x - 1.5, clip.y - 1.2, 3, 2.4);
        }
    }

    function dibujarBurbujas(c) {
        for (const b of estado.burbujas) {
            c.font = 'bold 6px monospace';
            const ancho = c.measureText(b.texto).width + 8;
            const x = b.x - ancho / 2;
            const y = b.y - 6;
            c.fillStyle = '#f8fafc';
            c.strokeStyle = '#ff4fa3';
            c.lineWidth = 1;
            rectRedondeado(c, x, y, ancho, 12, 4);
            c.fill();
            c.stroke();
            c.beginPath();
            c.moveTo(b.x - 3, y + 12);
            c.lineTo(b.x, y + 16);
            c.lineTo(b.x + 3, y + 12);
            c.closePath();
            c.fill();
            c.fillStyle = '#9d174d';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(b.texto, b.x, y + 6.5);
        }
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
    }

    function dibujarAvisos(c) {
        for (const a of estado.avisos) {
            const alfa = Math.min(1, a.vida / 0.5);
            c.globalAlpha = alfa;
            c.font = 'bold 6px monospace';
            c.textAlign = 'center';
            c.fillStyle = '#fff1f7';
            c.strokeStyle = 'rgba(15, 23, 42, .8)';
            c.lineWidth = 2;
            c.strokeText(a.texto, a.x, a.y);
            c.fillText(a.texto, a.x, a.y);
        }
        c.globalAlpha = 1;
        c.textAlign = 'left';
    }

    function dibujarMeta(c) {
        const meta = estado.nivelDatos && estado.nivelDatos.meta;
        if (!meta) return;
        const x = meta.x + meta.ancho - 4;
        c.fillStyle = '#cbd5e1';
        c.fillRect(x, meta.y, 2, meta.alto);
        c.fillStyle = '#53fc18';
        c.beginPath();
        c.moveTo(x, meta.y + 2);
        c.lineTo(x, meta.y + 15);
        c.lineTo(x - 16, meta.y + 8);
        c.closePath();
        c.fill();
        c.fillStyle = '#06210a';
        c.font = 'bold 5px monospace';
        c.textAlign = 'left';
        c.fillText('LIVE', x - 14, meta.y + 10);
    }

    function dibujarParticulas(c) {
        for (const p of estado.particulas) {
            const alfa = Math.max(0, p.vida / p.vidaMax);
            c.fillStyle = p.color || 'rgba(148, 233, 220, 0.55)';
            c.globalAlpha = p.color ? alfa : alfa * 0.55;
            c.fillRect(Math.round(p.x), Math.round(p.y), p.tam, p.tam);
        }
        c.globalAlpha = 1;
    }

    function dibujarPierna(c, lado, fase, aire, vy, colorPantalon, colorZapato) {
        const caderaX = lado * 2.1;
        const caderaY = -8.2;
        let rodillaX;
        let rodillaY;
        let pieX;
        let pieY;

        if (aire) {
            const subiendo = vy < 0;
            const recogida = subiendo ? 1 : 0.45;
            rodillaX = lado * 2.1 + lado * 1.5 * recogida;
            rodillaY = -5.4 - 1.6 * recogida;
            pieX = lado * 2.1 + lado * 2.6 * recogida;
            pieY = -1.4 - 2.2 * recogida;
        } else {
            const avance = Math.sin(fase);
            const subida = Math.max(0, -avance);
            rodillaX = lado * 2.1 + avance * 2.2;
            rodillaY = -5.2 + subida * 0.9;
            pieX = lado * 2.1 + avance * 3.6;
            pieY = -1.2 - subida * 1.6;
        }

        c.strokeStyle = colorPantalon;
        c.lineWidth = 3.1;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(caderaX, caderaY);
        c.lineTo(rodillaX, rodillaY);
        c.stroke();

        c.strokeStyle = colorZapato;
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(rodillaX, rodillaY);
        c.lineTo(pieX, pieY);
        c.stroke();

        c.fillStyle = colorZapato;
        c.beginPath();
        c.ellipse(pieX + lado * 0.7, pieY, 2.1, 1.2, 0, 0, Math.PI * 2);
        c.fill();
    }

    function dibujarBrazo(c, lado, fase, aire, vy, colorManga, colorPiel) {
        const hombroX = lado * 4.9;
        const hombroY = -14.6;
        let codoX;
        let codoY;
        let manoX;
        let manoY;

        if (aire) {
            const subiendo = vy < 0;
            codoX = lado * 6;
            codoY = subiendo ? -16.6 : -11.8;
            manoX = lado * 7.1;
            manoY = subiendo ? -19.2 : -9.4;
        } else {
            const balanceo = Math.sin(fase) * 1.8;
            codoX = lado * 5.8 + lado * balanceo * 0.4;
            codoY = -11.8 + Math.abs(balanceo) * 0.25;
            manoX = lado * 6.2 + lado * balanceo;
            manoY = -9.2 + Math.abs(balanceo) * 0.5;
        }

        c.strokeStyle = colorManga;
        c.lineWidth = 2.6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(hombroX, hombroY);
        c.lineTo(codoX, codoY);
        c.stroke();

        c.strokeStyle = colorPiel;
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(codoX, codoY);
        c.lineTo(manoX, manoY);
        c.stroke();

        c.fillStyle = colorPiel;
        c.beginPath();
        c.arc(manoX, manoY, 1.6, 0, Math.PI * 2);
        c.fill();
    }

    function dibujarPersonaje(c) {
        const j = estado.jugador;
        if (!j) return;
        if (estado.invulnerable > 0 && Math.floor(estado.tiempo * 20) % 2 === 0) return;

        const cx = j.x + j.ancho / 2;
        const pies = j.y + j.alto;
        const aire = !j.enSuelo;
        const kSquash = estado.squash > 0 ? estado.squash / 0.1 : 0;
        const escala = estado.grande ? ESCALA_GRANDE : 1;
        const respiracion = aire ? 0 : Math.sin(estado.anim * 2.4) * 0.5;

        const colorPelo = '#171021';
        const colorPiel = '#ffd9c7';
        const colorTop = '#0f3b40';
        const colorTopClaro = '#1d6d70';
        const colorRosa = '#ff4fa3';
        const colorZapato = '#ff5fae';

        c.fillStyle = 'rgba(0, 0, 0, .35)';
        c.beginPath();
        c.ellipse(cx, pies + 0.5, (7.5 - kSquash * 1.2) * escala, 2 * escala, 0, 0, Math.PI * 2);
        c.fill();

        if (estado.grande) {
            c.fillStyle = 'rgba(255, 79, 163, .14)';
            c.beginPath();
            c.arc(cx, pies - 16 * escala, 16 * escala, 0, Math.PI * 2);
            c.fill();
        }

        c.save();
        c.translate(cx, pies);
        c.scale(estado.mirando * escala * (1 + kSquash * 0.16), escala * (1 - kSquash * 0.2));

        // Coleta detrás con balanceo.
        const coletazo = Math.sin(estado.anim * 3 + 0.4) * 0.8 + Math.min(1.4, Math.abs(j.vx) * 0.008);
        c.strokeStyle = colorPelo;
        c.lineWidth = 3.6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-5.5, -21.5 + respiracion);
        c.quadraticCurveTo(-9 - coletazo, -18, -9.5 - coletazo, -12 + respiracion);
        c.stroke();
        c.fillStyle = colorRosa;
        c.beginPath();
        c.arc(-9.5 - coletazo, -11.5 + respiracion, 1.6, 0, Math.PI * 2);
        c.fill();

        dibujarPierna(c, -1, estado.paso + Math.PI, aire, j.vy, colorTop, colorZapato);
        dibujarBrazo(c, -1, estado.paso, aire, j.vy, colorTop, colorPiel);

        // Torso.
        c.fillStyle = colorTop;
        rectRedondeado(c, -5.5, -15.5 + respiracion, 11, 8, 3);
        c.fill();
        c.fillStyle = colorTopClaro;
        c.fillRect(-3.5, -14.2 + respiracion, 7, 1.2);
        c.fillStyle = colorRosa;
        rectRedondeado(c, -5.5, -8.6 + respiracion, 11, 1.6, 0.8);
        c.fill();

        dibujarPierna(c, 1, estado.paso, aire, j.vy, colorTop, colorZapato);

        // Cabeza.
        c.save();
        c.translate(0, -21 + respiracion + Math.sin(estado.anim * 2.4) * 0.2);

        c.fillStyle = colorPelo;
        c.beginPath();
        c.arc(0, 0, 6.6, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = colorPiel;
        c.beginPath();
        c.arc(0.4, 0.6, 5.6, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = colorPelo;
        c.beginPath();
        c.arc(0, -0.4, 5.7, Math.PI * 1.02, Math.PI * 1.98);
        c.fill();

        c.beginPath();
        c.ellipse(-5.1, 1.1, 1.7, 3.6, 0.2, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(5.1, 1.1, 1.7, 3.6, -0.2, 0, Math.PI * 2);
        c.fill();

        // Ojos con parpadeo.
        c.fillStyle = '#1a1220';
        if (estado.parpadeoActivo > 0) {
            c.fillRect(-3.1, 1.2, 2.2, 0.7);
            c.fillRect(1.1, 1.2, 2.2, 0.7);
        } else {
            c.beginPath();
            c.arc(-2, 1.2, 1.15, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.arc(2.2, 1.2, 1.15, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#ffffff';
            c.beginPath();
            c.arc(-1.7, 0.85, 0.45, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.arc(2.5, 0.85, 0.45, 0, Math.PI * 2);
            c.fill();
        }

        c.fillStyle = 'rgba(255, 79, 163, .35)';
        c.beginPath();
        c.arc(-3.9, 2.4, 1.1, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(4.1, 2.4, 1.1, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = '#a33a5e';
        c.lineWidth = 0.6;
        c.beginPath();
        c.arc(0.2, 2.6, 1.1, 0.15, Math.PI - 0.15);
        c.stroke();

        // Auriculares y orejitas.
        c.strokeStyle = colorRosa;
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(0, -0.2, 7.1, Math.PI * 1.06, Math.PI * 1.94);
        c.stroke();

        c.fillStyle = colorRosa;
        rectRedondeado(c, -8.4, -2.2, 2.6, 4.4, 1.2);
        c.fill();
        rectRedondeado(c, 5.8, -2.2, 2.6, 4.4, 1.2);
        c.fill();

        c.beginPath();
        c.moveTo(-4.6, -5.6);
        c.lineTo(-2.6, -8.4);
        c.lineTo(-1.4, -5.4);
        c.closePath();
        c.fill();
        c.beginPath();
        c.moveTo(4.6, -5.6);
        c.lineTo(2.6, -8.4);
        c.lineTo(1.4, -5.4);
        c.closePath();
        c.fill();

        c.restore();

        dibujarBrazo(c, 1, estado.paso + Math.PI, aire, j.vy, colorTop, colorPiel);

        if (estado.disparoAnim > 0) {
            const f = estado.disparoAnim / 0.12;
            c.fillStyle = 'rgba(255, 227, 241, ' + (0.9 * f).toFixed(2) + ')';
            c.beginPath();
            c.arc(9, -11, 2 + 2.5 * f, 0, Math.PI * 2);
            c.fill();
        }

        c.restore();
    }

    function dibujarHud(c) {
        c.fillStyle = 'rgba(5, 10, 20, 0.58)';
        c.fillRect(0, 0, VISTA_ANCHO, 24);

        c.font = 'bold 10px monospace';
        c.textAlign = 'left';
        c.fillStyle = '#ffd166';
        c.fillText('KICKS × ' + estado.gp, 8, 15);

        c.textAlign = 'center';
        c.fillStyle = '#cbd5e1';
        const nombreNivel = estado.nivelDatos ? estado.nivelDatos.nombre : 'El Setup';
        c.fillText('NIVEL ' + estado.nivelActual + '/' + NIVELES.length + ' · ' + nombreNivel.toUpperCase(), VISTA_ANCHO / 2, 15);

        c.textAlign = 'right';
        c.fillStyle = '#5eead4';
        c.fillText(formatearTiempo(estado.tiempo), VISTA_ANCHO - 8, 15);

        c.fillStyle = '#ff8fc4';
        c.font = 'bold 8px monospace';
        c.fillText('CLIPS × ' + estado.clips, VISTA_ANCHO - 8, 22);

        c.textAlign = 'left';
        c.fillStyle = '#ff4fa3';
        c.font = '9px monospace';
        for (let i = 0; i < estado.vidas; i++) c.fillText('♥', 8 + i * 10, 22);

        if (estado.escudo > 0) {
            const xEscudo = 8 + estado.vidas * 10 + 7;
            c.beginPath();
            c.moveTo(xEscudo + 3, 15);
            c.lineTo(xEscudo + 6, 16.4);
            c.lineTo(xEscudo + 6, 18.6);
            c.quadraticCurveTo(xEscudo + 6, 21, xEscudo + 3, 22.4);
            c.quadraticCurveTo(xEscudo, 21, xEscudo, 18.6);
            c.lineTo(xEscudo, 16.4);
            c.closePath();
            c.fillStyle = '#ff8fc4';
            c.fill();
            c.strokeStyle = 'rgba(255, 209, 230, 0.75)';
            c.lineWidth = 0.5;
            c.stroke();
            c.fillStyle = '#ffd1e6';
            c.font = '7px monospace';
            c.fillText(estado.escudo + '/' + ESCUDO_MAX, xEscudo + 9, 22);
        }

        c.textAlign = 'left';
    }

    function dibujar() {
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        dibujarFondo(ctx);

        ctx.save();
        ctx.translate(-Math.round(estado.camara.x), -Math.round(estado.camara.y));
        dibujarNivel(ctx);
        dibujarTuneles(ctx);
        dibujarPurga(ctx);
        dibujarPowerups(ctx);
        dibujarMonedas(ctx);
        dibujarMeta(ctx);
        dibujarParticulas(ctx);
        dibujarHaters(ctx);
        dibujarClips(ctx);
        dibujarPersonaje(ctx);
        dibujarBurbujas(ctx);
        dibujarAvisos(ctx);
        ctx.restore();

        dibujarAlertaPurga(ctx);
        dibujarHud(ctx);
    }

    // === BUCLE ===

    let ultimo = 0;
    let acumulador = 0;

    function bucle(marca) {
        if (!ultimo) ultimo = marca;
        const dt = Math.min((marca - ultimo) / 1000, 0.1);
        ultimo = marca;

        if (estado.fase === 'jugando') {
            acumulador += dt;
            let pasos = 0;
            while (acumulador >= PASO && pasos < 6) {
                actualizar(PASO);
                acumulador -= PASO;
                pasos++;
            }
            if (pasos === 6) acumulador = 0;
        } else {
            acumulador = 0;
            estado.anim += dt;
            actualizarParpadeo(dt);
        }

        dibujar();
        requestAnimationFrame(bucle);
    }

    // === ENTRADA ===

    const TECLAS_MOVIMIENTO = {
        ArrowLeft: 'izquierda',
        KeyA: 'izquierda',
        ArrowRight: 'derecha',
        KeyD: 'derecha',
        ShiftLeft: 'correr',
        ShiftRight: 'correr',
        KeyX: 'correr'
    };

    function esCampoDeTexto(elemento) {
        if (!elemento || !elemento.tagName) return false;
        return /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(elemento.tagName);
    }

    function cortarSalto() {
        const j = estado.jugador;
        if (j && j.vy < SALTO_MIN) j.vy = SALTO_MIN;
    }

    function alPulsarTecla(evento) {
        if (estado.fase !== 'jugando' && esCampoDeTexto(evento.target)) return;

        const movimiento = TECLAS_MOVIMIENTO[evento.code];
        if (movimiento) {
            estado.entrada[movimiento] = true;
            evento.preventDefault();
            return;
        }

        if (evento.code === 'Space' || evento.code === 'KeyZ' || evento.code === 'ArrowUp' || evento.code === 'KeyW') {
            if (!estado.entrada.salto) estado.bufferSalto = BUFFER_SALTO;
            estado.entrada.salto = true;
            if (estado.fase === 'inicio') iniciarPartida();
            evento.preventDefault();
            return;
        }

        if (evento.code === 'Enter' && estado.fase === 'inicio') {
            iniciarPartida();
            return;
        }

        if (evento.code === 'KeyJ' || evento.code === 'KeyK') {
            disparar();
            evento.preventDefault();
            return;
        }

        if (evento.code === 'KeyM') {
            alternarSonido();
            evento.preventDefault();
            return;
        }

        if (evento.code === 'Escape' && window.Alpine && typeof window.Alpine.store === 'function') {
            const tienda = window.Alpine.store('juego');
            if (tienda && tienda.rankingAbierto) {
                ocultarRanking();
                evento.preventDefault();
                return;
            }
        }

        if (evento.code === 'KeyP' || evento.code === 'Escape') {
            if (estado.fase === 'jugando' || estado.fase === 'pausa') {
                alternarPausa();
                evento.preventDefault();
            }
            return;
        }

        if (evento.code === 'KeyR' && estado.fase !== 'inicio') {
            reiniciarPartida();
            evento.preventDefault();
        }
    }

    function alSoltarTecla(evento) {
        const movimiento = TECLAS_MOVIMIENTO[evento.code];
        if (movimiento) {
            estado.entrada[movimiento] = false;
            return;
        }
        if (evento.code === 'Space' || evento.code === 'KeyZ' || evento.code === 'ArrowUp' || evento.code === 'KeyW') {
            cortarSalto();
            estado.entrada.salto = false;
        }
    }

    function prepararTactil() {
        document.querySelectorAll('[data-control]').forEach((boton) => {
            const control = boton.dataset.control;
            if (!control) return;

            const cambiar = (activo) => {
                if (control === 'disparar') {
                    if (activo) disparar();
                    boton.classList.toggle('game-tactil-btn--activo', activo);
                    return;
                }
                if (control === 'salto') {
                    if (activo && !estado.entrada.salto) estado.bufferSalto = BUFFER_SALTO;
                    if (!activo) cortarSalto();
                }
                estado.entrada[control] = activo;
                boton.classList.toggle('game-tactil-btn--activo', activo);
            };

            boton.addEventListener('pointerdown', (evento) => {
                evento.preventDefault();
                if (boton.setPointerCapture) {
                    try { boton.setPointerCapture(evento.pointerId); } catch (e) { /* puntero sintético */ }
                }
                cambiar(true);
            });
            boton.addEventListener('pointerup', (evento) => {
                evento.preventDefault();
                cambiar(false);
            });
            boton.addEventListener('pointercancel', () => cambiar(false));
            boton.addEventListener('lostpointercapture', () => cambiar(false));
        });
    }

    // === API PÚBLICA ===

    window.GochitaRunner = {
        iniciar: iniciarPartida,
        pausar: pausarPartida,
        reanudar: reanudarPartida,
        reiniciar: reiniciarPartida,
        estado: () => ({
            fase: estado.fase,
            gp: estado.gp,
            vidas: estado.vidas,
            tiempo: estado.tiempo,
            clips: estado.clips,
            haters: estado.hatersMuertos,
            grande: estado.grande,
            escudo: estado.escudo,
            escudoMax: ESCUDO_MAX,
            nivel: estado.nivelActual,
            nivelNombre: estado.nivelDatos ? estado.nivelDatos.nombre : 'El Setup',
            enemigos: estado.nivelDatos ? estado.nivelDatos.haters.filter((h) => h.vivo).length : 0,
            purga: estado.purga ? Math.round(estado.purga.x) : null,
            sonido: estado.sonido,
            burbujas: estado.burbujas.length,
            jugador: estado.jugador ? {
                x: estado.jugador.x,
                y: estado.jugador.y,
                vx: estado.jugador.vx,
                vy: estado.jugador.vy,
                enSuelo: estado.jugador.enSuelo
            } : null
        })
    };

    document.addEventListener('alpine:init', () => {
        if (!window.Alpine) return;
        window.Alpine.store('juego', {
            fase: 'inicio',
            gp: 0,
            vidas: VIDAS_INICIALES,
            tiempo: 0,
            nivel: 1,
            nivelActual: 1,
            nivelDesbloqueado: 1,
            nivelNombre: 'El Setup',
            totalNiveles: NIVELES.length,
            haySiguiente: true,
            clips: 0,
            haters: 0,
            grande: false,
            escudo: 0,
            escudoMax: ESCUDO_MAX,
            record: '',
            rankingAbierto: false,
            rankingTab: 'general',
            rankingFilas: [],
            rankingCargando: false,
            rankingError: '',
            rankingMensaje: '',
            rankingSesion: false,
            rankingApodo: '',
            iniciar() { iniciarPartida(this.nivelActual); },
            pausar() { pausarPartida(); },
            reanudar() { reanudarPartida(); },
            reiniciar() { reiniciarPartida(); },
            siguienteNivel() { siguienteNivelJuego(); },
            abrirRanking(tab) { mostrarRanking(tab); },
            cerrarRanking() { ocultarRanking(); },
            cambiarRanking(tab) { cambiarTabRanking(tab); },
            formatearTiempo(valor) { return formatearTiempo(valor); }
        });
        sincronizarUi({ record: textoRecord(1) });
    });

    function iniciar() {
        estado.sonido = leerSonido();
        estado.nivelDesbloqueado = leerNivelDesbloqueado();
        actualizarBotonSonido();
        const botonSonido = document.getElementById('game-sonido');
        if (botonSonido) botonSonido.addEventListener('click', alternarSonido);
        cargarNivel();
        sincronizarUi({ record: textoRecord(estado.nivelActual) });
        prepararTactil();
        window.addEventListener('keydown', alPulsarTecla);
        window.addEventListener('keyup', alSoltarTecla);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pausarPartida();
        });
        window.addEventListener('blur', () => pausarPartida());
        requestAnimationFrame(bucle);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
