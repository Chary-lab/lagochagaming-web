/* GochitaRunner — motor del minijuego.
   Campaña de cinco niveles dentro de un PC gaming, jefes, medallas, logros y ranking. */
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
    const MAX_CLIPS = 12;
    const CLIPS_POR_DONACION = 5;
    const ESCUDO_JEFE_TIEMPO = 2.2;
    const ESCUDO_JEFE_ESPERA = 8.5;
    const AVISO_ESCUDO = 0.55;
    const VEL_CLIP = 340;
    const VEL_HATER = 30;
    const INTERVALO_TIRO = 2.6;
    const ESCALA_GRANDE = 1.22;
    const ESCUDO_MAX = 3;
    const VEL_PURGA = 30;
    const RETRASO_PURGA = 2.5;
    const VIDA_JEFE = 5;
    const BONUS_JEFE = 25;
    const ESCALA_RENDER = 2;
    const VOLUMEN_INICIAL = 0.85;

    const CLAVE_GUARDADO = 'lg_game_v1';
    const NOMBRE_NIVEL = 'El Setup';

    const OBJETIVOS = [
        { s: 150, a: 240, b: 330 },
        { s: 180, a: 300, b: 420 },
        { s: 210, a: 330, b: 450 },
        { s: 240, a: 390, b: 540 },
        { s: 270, a: 420, b: 600 }
    ];

    const LOGROS = [
        { id: 'primer_jefe', nombre: 'Jefe de mesa', desc: 'Derrota a El Técnico.' },
        { id: 'sin_dano', nombre: 'Intacta', desc: 'Completa un nivel sin perder vidas.' },
        { id: 'todos_gp', nombre: 'Coleccionista', desc: 'Recoge el 90% del GP de un nivel.' },
        { id: 'cargador', nombre: 'Cargador lleno', desc: 'Dispara 12 clips en un nivel.' },
        { id: 'pisot', nombre: 'Pisotón', desc: 'Elimina 5 haters saltándoles encima.' },
        { id: 'purga', nombre: 'Sobrevive a la purga', desc: 'Completa La Purga.' },
        { id: 'nucleo', nombre: 'Núcleo roto', desc: 'Derrota a El Núcleo.' },
        { id: 'campana', nombre: 'Directo completo', desc: 'Completa los 5 niveles.' },
        { id: 'velocista', nombre: 'Velocista', desc: 'Completa un nivel con tiempo de medalla A o mejor.' },
        { id: 'sin_escudo', nombre: 'Sin red', desc: 'Completa un nivel sin recoger regalitos.' },
        { id: 'cazajefes', nombre: 'Cazajefes', desc: 'Completa el Boss Rush.' },
        { id: 'reto', nombre: 'Rutina diaria', desc: 'Completa el reto diario.' }
    ];

    const SKINS = [
        {
            id: 'gochita', nombre: 'Gochita', color: '#0f3b40',
            colores: { pelo: '#171021', piel: '#ffd9c7', top: '#0f3b40', topClaro: '#1d6d70', rosa: '#ff4fa3', zapato: '#ff5fae' }
        },
        {
            id: 'neon', nombre: 'Neón', color: '#22d3ee',
            colores: { pelo: '#0f172a', piel: '#d8fbff', top: '#0e7490', topClaro: '#22d3ee', rosa: '#f0abfc', zapato: '#67e8f9' }
        },
        {
            id: 'purga', nombre: 'Purga', color: '#ef4444',
            colores: { pelo: '#1a0b12', piel: '#ffd0c4', top: '#7f1d1d', topClaro: '#ef4444', rosa: '#f97316', zapato: '#fca5a5' }
        },
        {
            id: 'oro', nombre: 'Oro', color: '#facc15',
            colores: { pelo: '#1c1917', piel: '#ffe8c2', top: '#78350f', topClaro: '#f59e0b', rosa: '#fde047', zapato: '#fbbf24' }
        }
    ];

    const MAX_GP_NIVEL = {};

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
        runEnviado: false,
        checkpoint: null,
        avisoJefe: false,
        volumen: VOLUMEN_INICIAL,
        reducirMovimiento: false,
        skin: 'gochita',
        medallas: [],
        medallasConseguidas: 0,
        logros: {},
        medallaActual: '',
        danoRecibidoNivel: 0,
        clipsDisparados: 0,
        hatersPisados: 0,
        escudosRecogidos: 0,
        modo: 'normal',
        rushJefe: 0,
        rushTotal: 0,
        rushCompletado: false,
        rushRecord: '',
        retoFecha: '',
        retoNivel: 0,
        retoHecho: false
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

        // GochiPoints.
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

        poner(59, 14, 'C');
        poner(124, 14, 'C');

        poner(3, 14, 'P');
        poner(166, 13, 'G');
        poner(166, 14, 'G');

        return {
            nombre: NOMBRE_NIVEL,
            ancho,
            alto,
            mapa: mapa.map((fila) => fila.join('')),
            tema: 'setup',
            jefe: {
                x: 157, y: 12.75, ancho: 28, alto: 34, arenaInicio: 151,
                hp: 3, tipo: 'tecnico', nombre: 'EL TÉCNICO',
                ataque: 'cable', intervalo: 1.7, bonus: 15, velocidad: 16
            }
        };
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

        n.poner(40, 14, 'C');
        n.poner(104, 14, 'C');

        n.poner(3, 14, 'P');
        n.poner(147, 13, 'G');
        n.poner(147, 14, 'G');

        return {
            nombre: 'Raid City',
            ancho: n.ancho,
            alto: n.alto,
            mapa: n.mapa.map((fila) => fila.join('')),
            tema: 'raid',
            jefe: {
                x: 142, y: 12.2, ancho: 32, alto: 38, arenaInicio: 135,
                hp: 4, tipo: 'raid', nombre: 'RAID LEADER',
                ataque: 'triple', intervalo: 1.6, bonus: 20, velocidad: 20
            }
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

        // Arena del jefe: plataformas para saltarle encima.
        n.rect(131, 11, 4, 1, '=');
        n.rect(142, 11, 4, 1, '=');

        // Lag spikes.
        [18, 19, 20, 45, 46, 47, 72, 73, 74, 128, 129, 130]
            .forEach((x) => n.poner(x, 14, '^'));

        // Haters de suelo y voladores.
        [[40, 14], [68, 14], [100, 14]]
            .forEach(([x, y]) => n.poner(x, y, 'H'));
        [[15, 8], [58, 7], [90, 8], [122, 9]]
            .forEach(([x, y]) => n.poner(x, y, 'V'));

        // Power-ups.
        n.poner(5, 14, 'R');
        n.poner(30, 14, 'D');
        n.poner(88, 9, 'R');
        n.poner(121, 10, 'D');
        n.poner(132, 14, 'D');

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

        n.poner(49, 14, 'C');
        n.poner(108, 14, 'C');

        n.poner(3, 14, 'P');
        n.poner(147, 13, 'G');
        n.poner(147, 14, 'G');

        return {
            nombre: 'La Purga',
            ancho: n.ancho,
            alto: n.alto,
            mapa: n.mapa.map((fila) => fila.join('')),
            tema: 'purga',
            purga: { inicio: -40, velocidad: VEL_PURGA, retraso: RETRASO_PURGA },
            jefe: {
                x: 136, y: 12.25, ancho: 34, alto: 40, arenaInicio: 130,
                hp: 5, tipo: 'hater', nombre: 'HATER FINAL',
                ataque: 'burbuja', intervalo: 1.3, bonus: 25, velocidad: 24
            }
        };
    }

    // === NIVEL 4: OVERCLOCK ===

    function crearNivel4() {
        const n = nuevoNivel(160);

        n.rect(0, 15, 23, 2, '#');
        n.rect(27, 15, 22, 2, '#');
        n.rect(53, 15, 24, 2, '#');
        n.rect(81, 15, 24, 2, '#');
        n.rect(109, 15, 24, 2, '#');
        n.rect(136, 15, 24, 2, '#');

        n.rect(8, 12, 5, 1, '=');
        n.rect(30, 11, 6, 1, '=');
        n.rect(42, 9, 4, 1, '=');
        n.rect(56, 12, 5, 1, '=');
        n.rect(68, 10, 6, 1, '=');
        n.rect(86, 12, 5, 1, '=');
        n.rect(95, 9, 4, 1, '=');
        n.rect(112, 11, 6, 1, '=');
        n.rect(121, 9, 4, 1, '=');
        n.rect(141, 11, 4, 1, '=');
        n.rect(148, 9, 4, 1, '=');

        [18, 19, 20, 60, 61, 62, 92, 93, 94, 126, 127, 128]
            .forEach((x) => n.poner(x, 14, '^'));

        [[35, 14], [64, 14], [88, 14], [100, 14], [124, 14]]
            .forEach(([x, y]) => n.poner(x, y, 'H'));
        [[15, 8], [45, 7], [72, 9], [114, 8]]
            .forEach(([x, y]) => n.poner(x, y, 'V'));

        n.poner(6, 14, 'R');
        n.poner(12, 14, 'D');
        n.poner(58, 11, 'R');
        n.poner(84, 8, 'D');
        n.poner(138, 14, 'D');

        filaMonedas(n, [
            [5, 13], [6, 13], [7, 13],
            [9, 11], [10, 11], [11, 11],
            [16, 12], [17, 12],
            [25, 13], [26, 13],
            [29, 10], [30, 10], [31, 10],
            [39, 8], [40, 8],
            [43, 10], [44, 10],
            [48, 12], [49, 12],
            [56, 11], [57, 11],
            [59, 10], [60, 10],
            [69, 9], [70, 9], [71, 9],
            [78, 12], [79, 12],
            [87, 11], [88, 11],
            [96, 8], [97, 8],
            [102, 12], [103, 12],
            [113, 10], [114, 10],
            [122, 8], [123, 8],
            [130, 12], [131, 12],
            [141, 13], [142, 13], [143, 13]
        ]);

        n.poner(52, 14, 'C');
        n.poner(108, 14, 'C');

        n.poner(3, 14, 'P');
        n.poner(157, 13, 'G');
        n.poner(157, 14, 'G');

        return {
            nombre: 'Overclock',
            ancho: n.ancho,
            alto: n.alto,
            mapa: n.mapa.map((fila) => fila.join('')),
            tema: 'overclock',
            purga: { inicio: -40, velocidad: 38, retraso: 2.8 },
            jefe: {
                x: 148, y: 12.2, ancho: 34, alto: 40, arenaInicio: 140,
                hp: 6, tipo: 'turbina', nombre: 'LA TURBINA',
                ataque: 'viento', intervalo: 1.2, bonus: 30, velocidad: 18
            }
        };
    }

    // === NIVEL 5: EL NÚCLEO ===

    function crearNivel5() {
        const n = nuevoNivel(170);

        n.rect(0, 15, 19, 2, '#');
        n.rect(22, 15, 19, 2, '#');
        n.rect(44, 15, 19, 2, '#');
        n.rect(66, 15, 23, 2, '#');
        n.rect(92, 15, 21, 2, '#');
        n.rect(116, 15, 23, 2, '#');
        n.rect(142, 15, 28, 2, '#');

        n.rect(8, 12, 4, 1, '=');
        n.rect(25, 11, 5, 1, '=');
        n.rect(34, 9, 4, 1, '=');
        n.rect(50, 12, 5, 1, '=');
        n.rect(58, 10, 4, 1, '=');
        n.rect(70, 11, 5, 1, '=');
        n.rect(80, 9, 4, 1, '=');
        n.rect(96, 12, 5, 1, '=');
        n.rect(104, 10, 4, 1, '=');
        n.rect(120, 11, 5, 1, '=');
        n.rect(128, 9, 4, 1, '=');
        n.rect(149, 11, 4, 1, '=');
        n.rect(156, 9, 4, 1, '=');

        [15, 16, 17, 54, 55, 56, 84, 85, 86, 106, 107, 108, 132, 133, 134]
            .forEach((x) => n.poner(x, 14, '^'));

        [[30, 14], [52, 14], [74, 14], [100, 14], [124, 14], [136, 14]]
            .forEach(([x, y]) => n.poner(x, y, 'H'));
        [[12, 8], [37, 7], [60, 9], [90, 8], [118, 7], [145, 8]]
            .forEach(([x, y]) => n.poner(x, y, 'V'));

        n.poner(5, 14, 'R');
        n.poner(11, 14, 'D');
        n.poner(62, 10, 'R');
        n.poner(94, 8, 'D');
        n.poner(143, 14, 'D');

        filaMonedas(n, [
            [5, 13], [6, 13],
            [9, 11], [10, 11],
            [16, 12], [17, 12],
            [26, 10], [27, 10],
            [35, 8], [36, 8],
            [45, 12], [46, 12],
            [50, 11], [51, 11],
            [58, 9], [59, 9],
            [67, 12], [68, 12],
            [70, 10], [71, 10],
            [81, 8], [82, 8],
            [96, 11], [97, 11],
            [105, 9], [106, 9],
            [117, 12], [118, 12],
            [120, 10], [121, 10],
            [129, 8], [130, 8],
            [137, 13], [138, 13],
            [149, 13], [150, 13], [151, 13]
        ]);

        n.poner(58, 14, 'C');
        n.poner(118, 14, 'C');

        n.poner(3, 14, 'P');
        n.poner(167, 13, 'G');
        n.poner(167, 14, 'G');

        return {
            nombre: 'El Núcleo',
            ancho: n.ancho,
            alto: n.alto,
            mapa: n.mapa.map((fila) => fila.join('')),
            tema: 'nucleo',
            purga: { inicio: -40, velocidad: 46, retraso: 3.2 },
            jefe: {
                x: 155, y: 12.2, ancho: 36, alto: 42, arenaInicio: 148,
                hp: 8, tipo: 'nucleo', nombre: 'EL NÚCLEO',
                ataque: 'ondas', intervalo: 1.1, bonus: 40, velocidad: 0
            }
        };
    }

    const NIVELES = [
        { nombre: 'El Setup', crear: crearNivel1 },
        { nombre: 'Raid City', crear: crearNivel2 },
        { nombre: 'La Purga', crear: crearNivel3 },
        { nombre: 'Overclock', crear: crearNivel4 },
        { nombre: 'El Núcleo', crear: crearNivel5 }
    ];

    function parsearNivel(datos) {
        const monedas = [];
        const powerups = [];
        const haters = [];
        const tuneles = [];
        const checkpoints = [];
        let spawn = { x: 2 * TILE, y: 10 * TILE };
        let meta = null;
        let jefe = null;

        if (datos.jefe) {
            const j = datos.jefe;
            const hp = Math.max(1, Math.round(j.hp || VIDA_JEFE));
            jefe = {
                x: j.x * TILE,
                baseX: j.x * TILE,
                y: j.y * TILE,
                baseY: j.y * TILE,
                ancho: j.ancho,
                alto: j.alto,
                arenaInicio: j.arenaInicio * TILE,
                hp,
                hpMax: hp,
                tipo: j.tipo || 'hater',
                nombre: j.nombre || 'HATER FINAL',
                ataque: j.ataque || 'burbuja',
                intervalo: j.intervalo || 1.3,
                bonus: j.bonus || BONUS_JEFE,
                velocidad: j.velocidad || 24,
                vivo: true,
                activado: false,
                golpe: 0,
                tiro: j.intervalo || 1.3,
                fase: Math.random() * Math.PI * 2,
                movT: 0,
                aviso: 0,
                carga: 0,
                cargaDir: 1,
                cargaT: 2.2 + Math.random() * 1.2,
                escudo: 0,
                escudoAviso: 0,
                escudoEspera: 4.5,
                escudoT: 4.5
            };
        }

        for (let y = 0; y < datos.alto; y++) {
            for (let x = 0; x < datos.ancho; x++) {
                const ch = datos.mapa[y][x];
                if (ch === 'P') {
                    spawn = { x: x * TILE + 3, y: y * TILE + 2 };
                } else if (ch === 'C') {
                    checkpoints.push({
                        x: x * TILE + 3,
                        y: y * TILE + 2,
                        tileX: x,
                        tileY: y,
                        activo: false
                    });
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
                        escudo: haters.length % 4 === 2,
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
            checkpoints,
            spawn,
            meta,
            jefe
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
        gan.gain.exponentialRampToValueAtTime((volumen || 0.05) * estado.volumen, t + 0.01);
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
            case 'escudo':
                nota(1320, 0, 0.08, 'sine', 0.035);
                nota(1760, 0.06, 0.1, 'sine', 0.03);
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
            estado.sonido = datos.sonido !== false;
            estado.volumen = typeof datos.volumen === 'number' ? limitar(datos.volumen, 0, 1) : VOLUMEN_INICIAL;
            const prefiere = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
            estado.reducirMovimiento = typeof datos.reducirMovimiento === 'boolean' ? datos.reducirMovimiento : prefiere;
        } catch (e) {
            estado.sonido = true;
            estado.volumen = VOLUMEN_INICIAL;
            estado.reducirMovimiento = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        }
    }

    function guardarSonido() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
            datos.sonido = estado.sonido;
            datos.volumen = estado.volumen;
            datos.reducirMovimiento = estado.reducirMovimiento;
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
        if (estado.sonido && estado.volumen <= 0) estado.volumen = VOLUMEN_INICIAL;
        guardarSonido();
        actualizarBotonSonido();
        sincronizarUi();
        if (estado.sonido) sfx('moneda');
    }

    function fijarVolumen(valor) {
        estado.volumen = limitar(Number(valor) || 0, 0, 1);
        estado.sonido = estado.volumen > 0;
        guardarSonido();
        actualizarBotonSonido();
        sincronizarUi();
        if (estado.sonido) sfx('moneda');
    }

    function alternarMovimientoReducido() {
        estado.reducirMovimiento = !estado.reducirMovimiento;
        guardarSonido();
        sincronizarUi();
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
        avisoFlotante('+5 GP', h.x + h.ancho / 2, h.y - 2);
        if (porSalto) {
            estado.hatersPisados += 1;
            sfx('golpe');
            if (estado.hatersPisados >= 5) desbloquearLogro('pisot');
        }
        sincronizarUi();
    }

    function recogerPowerup(p) {
        if (p.recogido) return;
        p.recogido = true;
        if (p.tipo === 'regalo') {
            estado.escudosRecogidos += 1;
            if (estado.escudo >= ESCUDO_MAX) {
                estado.gp += 10;
                avisoFlotante('+10 GP', p.x, p.y - 10);
                generarChispas(10, p.x, p.y, '#ffd166');
            } else {
                estado.escudo = ESCUDO_MAX;
                estado.grande = true;
                avisoFlotante('¡REGALITO! ESCUDO ' + ESCUDO_MAX + '/' + ESCUDO_MAX, p.x, p.y - 10);
                generarChispas(12, p.x, p.y, '#ff8fc4');
            }
        } else {
            const hueco = MAX_CLIPS - estado.clips;
            if (hueco <= 0) {
                estado.gp += 10;
                avisoFlotante('CLIPS AL MÁXIMO · +10 GP', p.x, p.y - 10);
                generarChispas(10, p.x, p.y, '#ffd166');
            } else {
                const sumados = Math.min(CLIPS_POR_DONACION, hueco);
                estado.clips += sumados;
                avisoFlotante('+' + sumados + ' CLIPS', p.x, p.y - 10);
                generarChispas(12, p.x, p.y, '#67e8f9');
            }
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
        estado.clipsDisparados += 1;
        if (estado.clipsDisparados >= 12) desbloquearLogro('cargador');
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

    function leerDatos() {
        try { return JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}'); } catch (e) { return {}; }
    }

    function guardarDatos(datos) {
        try {
            localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
            return true;
        } catch (e) {
            return false;
        }
    }

    function maxGpNivel(numero) {
        if (MAX_GP_NIVEL[numero]) return MAX_GP_NIVEL[numero];
        const nivel = parsearNivel(NIVELES[numero - 1].crear());
        MAX_GP_NIVEL[numero] = nivel.monedas.length + nivel.haters.length * 5 + (nivel.jefe ? nivel.jefe.bonus : 0);
        return MAX_GP_NIVEL[numero];
    }

    function fechaHoy() {
        const ahora = new Date();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        return ahora.getFullYear() + '-' + mes + '-' + dia;
    }

    function retoDelDia() {
        const fecha = fechaHoy();
        const semilla = fecha.split('').reduce((total, letra) => total + letra.charCodeAt(0), 0);
        const nivel = (semilla % NIVELES.length) + 1;
        const datos = leerDatos();
        const guardado = datos.reto || {};
        return {
            fecha: fecha,
            nivel: nivel,
            nombre: NIVELES[nivel - 1].nombre,
            hecho: guardado.fecha === fecha && !!guardado.hecho
        };
    }

    function leerRecordRush() {
        const record = leerDatos().rush;
        return record && record.mejorTiempo ? record : null;
    }

    function textoRecordRush() {
        const record = leerRecordRush();
        return record ? 'Mejor Boss Rush: ' + formatearTiempo(record.mejorTiempo) : 'Boss Rush: aún sin marca.';
    }

    function guardarRecordRush() {
        const datos = leerDatos();
        const anterior = datos.rush;
        if (!anterior || estado.tiempo < anterior.mejorTiempo) {
            datos.rush = { mejorTiempo: estado.tiempo, fecha: fechaHoy() };
            guardarDatos(datos);
            estado.rushRecord = textoRecordRush();
        }
    }

    function marcarRetoCompletado() {
        const datos = leerDatos();
        datos.reto = {
            fecha: estado.retoFecha || fechaHoy(),
            nivel: estado.retoNivel,
            hecho: true,
            tiempo: estado.tiempo
        };
        guardarDatos(datos);
        estado.retoHecho = true;
        actualizarProgreso();
    }

    function calcularMedalla(numero, record) {
        if (!record || record.version !== 2) return '';
        const maximo = maxGpNivel(numero);
        if (!maximo) return '';
        const porcentaje = Number(record.mejorGp) / maximo;
        const objetivo = OBJETIVOS[numero - 1] || OBJETIVOS[0];
        if (porcentaje >= 0.82 && record.mejorTiempo <= objetivo.s) return 'S';
        if (porcentaje >= 0.65 && record.mejorTiempo <= objetivo.a) return 'A';
        if (porcentaje >= 0.45 && record.mejorTiempo <= objetivo.b) return 'B';
        return 'C';
    }

    function medallaNivel(numero, record) {
        return calcularMedalla(numero, record === undefined ? leerRecord(numero) : record);
    }

    function contarMedallas() {
        return estado.medallas.filter(Boolean).length;
    }

    function tieneLogro(id) {
        return !!(estado.logros && estado.logros[id]);
    }

    function skinDesbloqueada(id) {
        if (id === 'gochita') return true;
        if (id === 'neon') return tieneLogro('primer_jefe') || estado.nivelDesbloqueado >= 2;
        if (id === 'purga') return tieneLogro('purga');
        if (id === 'oro') return tieneLogro('campana') || contarMedallas() >= 5;
        return false;
    }

    function actualizarProgreso() {
        const datos = leerDatos();
        const registros = datos.niveles || {};
        estado.logros = datos.logros && typeof datos.logros === 'object' ? datos.logros : {};
        estado.medallas = NIVELES.map((_, indice) => {
            const numero = indice + 1;
            return calcularMedalla(numero, registros[numero] || (numero === 1 ? datos.nivel1 : null));
        });
        estado.medallasConseguidas = contarMedallas();
        const reto = retoDelDia();
        estado.retoFecha = reto.fecha;
        estado.retoNivel = reto.nivel;
        estado.retoHecho = reto.hecho;
        estado.rushRecord = textoRecordRush();
        const guardada = SKINS.find((skin) => skin.id === datos.skin);
        estado.skin = guardada && skinDesbloqueada(guardada.id) ? guardada.id : 'gochita';
    }

    function desbloquearLogro(id) {
        const definicion = LOGROS.find((logro) => logro.id === id);
        if (!definicion || tieneLogro(id)) return false;
        const datos = leerDatos();
        datos.logros = datos.logros || {};
        datos.logros[id] = true;
        guardarDatos(datos);
        estado.logros = datos.logros;
        actualizarProgreso();
        const j = estado.jugador;
        if (j && (estado.fase === 'jugando' || estado.fase === 'completo')) {
            avisoFlotante('LOGRO: ' + definicion.nombre, j.x + j.ancho / 2, j.y - 14);
        }
        sfx('meta');
        sincronizarUi();
        return true;
    }

    function elegirSkin(id) {
        if (!skinDesbloqueada(id)) return;
        const datos = leerDatos();
        datos.skin = id;
        guardarDatos(datos);
        estado.skin = id;
        sfx('poder');
        sincronizarUi();
    }

    function mostrarProgreso() {
        const store = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (!store) return;
        actualizarProgreso();
        store.rankingAbierto = false;
        store.progresoAbierto = true;
        sincronizarUi();
    }

    function ocultarProgreso() {
        const store = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (store) store.progresoAbierto = false;
    }

    function desbloquearSiguiente() {
        if (estado.nivelActual >= NIVELES.length) return;
        const siguiente = estado.nivelActual + 1;
        if (siguiente <= estado.nivelDesbloqueado) return;
        estado.nivelDesbloqueado = siguiente;
        guardarNivelDesbloqueado(siguiente);
    }

    function cargarNivel(nivelNumero, mantenerCheckpoint) {
        const maximo = (estado.modo === 'rush' || estado.modo === 'reto')
            ? NIVELES.length
            : Math.max(1, Math.min(NIVELES.length, estado.nivelDesbloqueado || 1));
        const numero = limitar(Math.round(nivelNumero || maximo), 1, maximo);
        const definicion = NIVELES[numero - 1];
        estado.nivelActual = numero;
        estado.nivelDatos = parsearNivel(definicion.crear());
        if (!mantenerCheckpoint) estado.checkpoint = null;
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
        estado.avisoJefe = false;
        estado.purga = null;
        if (estado.nivelDatos.purga) {
            estado.purga = {
                x: estado.nivelDatos.purga.inicio,
                base: estado.nivelDatos.purga.velocidad,
                rampa: estado.nivelDatos.purga.rampa || 26,
                velocidad: estado.nivelDatos.purga.velocidad,
                retraso: estado.nivelDatos.purga.retraso,
                ultimo: 0
            };
        }
    }

    function sueloDeArena(nivel, x, jefe) {
        const tx = limitar(Math.floor(x / TILE), 0, nivel.ancho - 1);
        const desde = jefe ? Math.max(2, Math.floor(jefe.y / TILE)) : 2;
        for (let ty = desde; ty < nivel.alto; ty++) {
            if (esSolido(nivel, tx, ty)) return ty * TILE - 14;
        }
        for (let ty = 2; ty < nivel.alto; ty++) {
            if (esSolido(nivel, tx, ty)) return ty * TILE - 14;
        }
        return Math.max(0, (nivel.alto - 2) * TILE);
    }

    function cargarCombateJefe(numero, opciones) {
        const cfg = opciones || {};
        estado.modo = cfg.modo || 'rush';
        limpiarEntrada();
        cargarNivel(numero);
        estado.modo = cfg.modo || 'rush';
        estado.rushJefe = cfg.jefe || numero;
        estado.rushTotal = cfg.total || NIVELES.length;
        estado.rushCompletado = false;
        estado.checkpoint = null;
        estado.runId = null;
        estado.runNivel = 0;
        estado.runEnviado = false;
        estado.nivelDatos.meta = null;
        estado.nivelDatos.purga = null;
        estado.purga = null;
        for (const hater of estado.nivelDatos.haters) hater.vivo = false;
        for (const moneda of estado.nivelDatos.monedas) moneda.recogida = true;
        for (const powerup of estado.nivelDatos.powerups) powerup.recogido = true;
        const jefe = estado.nivelDatos.jefe;
        if (jefe) {
            jefe.hp = jefe.hpMax;
            jefe.vivo = true;
            jefe.activado = false;
            jefe.golpe = 0;
            jefe.escudo = false;
            jefe.escudoT = 0;
            jefe.escudoEspera = 2.5;
        }
        const x = jefe ? Math.max(TILE * 2, jefe.arenaInicio - 72) : estado.spawn.x;
        const y = sueloDeArena(estado.nivelDatos, x, jefe);
        estado.spawn = { x: x, y: y };
        estado.jugador = crearJugador(estado.spawn);
        estado.camara.x = limitar(x - VISTA_ANCHO / 2, 0, Math.max(0, estado.nivelDatos.ancho * TILE - VISTA_ANCHO));
        estado.camara.y = limitar(y - VISTA_ALTO / 2, 0, Math.max(0, estado.nivelDatos.alto * TILE - VISTA_ALTO));
        estado.vidas = cfg.vidas != null ? cfg.vidas : VIDAS_INICIALES;
        estado.clips = cfg.clips != null ? cfg.clips : MAX_CLIPS;
        estado.escudo = 0;
        estado.grande = false;
        estado.tiempo = cfg.tiempo != null ? cfg.tiempo : 0;
        estado.invulnerable = 1.1;
        estado.parpadeo = 1.2;
        estado.gpNivel = estado.gp;
        estado.hatersNivel = estado.hatersMuertos;
        const tienda = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (tienda) {
            tienda.progresoAbierto = false;
            tienda.rankingAbierto = false;
        }
        fijarFase('jugando');
        sincronizarUi({ rankingMensaje: '', rankingError: '', medallaActual: '' });
        const aviso = document.getElementById('game-aviso');
        if (aviso) {
            aviso.textContent = cfg.mensaje || 'Jefe ' + estado.rushJefe + ' de ' + estado.rushTotal + '. ¡A por él!';
        }
    }

    function iniciarBossRush() {
        estado.gp = 0;
        estado.vidas = VIDAS_INICIALES;
        estado.tiempo = 0;
        estado.hatersMuertos = 0;
        estado.invulnerable = 0;
        estado.rushCompletado = false;
        estado.medallaActual = '';
        estado.danoRecibidoNivel = 0;
        estado.clipsDisparados = 0;
        estado.hatersPisados = 0;
        estado.escudosRecogidos = 0;
        cargarCombateJefe(1, {
            modo: 'rush',
            jefe: 1,
            total: NIVELES.length,
            vidas: VIDAS_INICIALES,
            clips: MAX_CLIPS,
            tiempo: 0,
            mensaje: 'Boss Rush: 5 jefes, 3 vidas y 12 clips por combate.'
        });
    }

    function iniciarRetoDiario() {
        const reto = retoDelDia();
        estado.modo = 'reto';
        estado.retoFecha = reto.fecha;
        estado.retoNivel = reto.nivel;
        estado.retoHecho = reto.hecho;
        estado.gp = 0;
        estado.tiempo = 0;
        estado.hatersMuertos = 0;
        estado.invulnerable = 0;
        estado.medallaActual = '';
        estado.danoRecibidoNivel = 0;
        estado.clipsDisparados = 0;
        estado.hatersPisados = 0;
        estado.escudosRecogidos = 0;
        cargarCombateJefe(reto.nivel, {
            modo: 'reto',
            jefe: 1,
            total: 1,
            vidas: 1,
            clips: MAX_CLIPS,
            tiempo: 0,
            mensaje: 'Reto diario: ' + reto.nombre + '. Un jefe, una vida.'
        });
    }

    function siguienteJefeRush() {
        if (estado.modo !== 'rush' || estado.rushCompletado) return;
        const siguiente = estado.rushJefe + 1;
        if (siguiente > estado.rushTotal) return;
        cargarCombateJefe(siguiente, {
            modo: 'rush',
            jefe: siguiente,
            total: estado.rushTotal,
            vidas: estado.vidas,
            clips: MAX_CLIPS,
            tiempo: estado.tiempo
        });
    }

    function empezarNivel(nivelNumero) {
        estado.modo = 'normal';
        estado.rushJefe = 0;
        estado.rushTotal = 0;
        estado.rushCompletado = false;
        cargarNivel(nivelNumero);
        estado.tiempo = 0;
        estado.invulnerable = 0;
        estado.parpadeo = 2.4;
        estado.parpadeoActivo = 0;
        estado.polvoTimer = 0;
        estado.enSueloAnterior = false;
        estado.gpNivel = estado.gp;
        estado.hatersNivel = estado.hatersMuertos;
        estado.medallaActual = '';
        estado.danoRecibidoNivel = 0;
        estado.clipsDisparados = 0;
        estado.hatersPisados = 0;
        estado.escudosRecogidos = 0;
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
        if (estado.modo === 'rush') {
            iniciarBossRush();
            return;
        }
        if (estado.modo === 'reto') {
            iniciarRetoDiario();
            return;
        }
        iniciarPartida(estado.nivelActual);
    }

    function siguienteNivelJuego() {
        if (estado.modo === 'rush') {
            siguienteJefeRush();
            return;
        }
        if (estado.modo === 'reto') {
            salirAlMenu();
            return;
        }
        if (estado.nivelActual >= NIVELES.length) return;
        if (estado.nivelActual + 1 > estado.nivelDesbloqueado) return;
        empezarNivel(estado.nivelActual + 1);
    }

    function recargarNivelTrasDano() {
        const gpNivel = estado.gpNivel;
        const hatersNivel = estado.hatersNivel;
        const vidas = estado.vidas;
        const tiempo = estado.tiempo;
        const checkpoint = estado.checkpoint;
        const jefeAntes = estado.nivelDatos.jefe;
        const jefeHp = jefeAntes ? jefeAntes.hp : null;
        cargarNivel(estado.nivelActual, true);
        estado.checkpoint = checkpoint;
        if (checkpoint) {
            for (const cp of estado.nivelDatos.checkpoints) {
                if (cp.tileX === checkpoint.tileX && cp.tileY === checkpoint.tileY) cp.activo = true;
            }
        }
        // El jefe conserva el daño recibido; si ya cayó, la meta sigue abierta.
        const jefe = estado.nivelDatos.jefe;
        if (jefe && jefeHp !== null) {
            jefe.hp = Math.min(jefeHp, jefe.hpMax);
            jefe.vivo = jefe.hp > 0;
            jefe.activado = false;
            jefe.golpe = 0;
        }
        estado.gp = gpNivel;
        estado.hatersMuertos = hatersNivel;
        estado.vidas = vidas;
        estado.tiempo = tiempo;
        estado.invulnerable = 1.2;
        colocarEnSpawn();
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
        const punto = estado.checkpoint || estado.spawn;
        j.x = punto.x;
        j.y = punto.y;
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

    function salirAlMenu() {
        limpiarEntrada();
        estado.modo = 'normal';
        estado.rushJefe = 0;
        estado.rushTotal = 0;
        estado.rushCompletado = false;
        estado.gp = 0;
        estado.gpNivel = 0;
        estado.hatersMuertos = 0;
        estado.hatersNivel = 0;
        estado.vidas = VIDAS_INICIALES;
        estado.tiempo = 0;
        estado.checkpoint = null;
        estado.invulnerable = 0;
        estado.medallaActual = '';
        estado.danoRecibidoNivel = 0;
        estado.clipsDisparados = 0;
        estado.hatersPisados = 0;
        estado.escudosRecogidos = 0;
        const tienda = window.Alpine && typeof window.Alpine.store === 'function'
            ? window.Alpine.store('juego')
            : null;
        if (tienda) {
            tienda.progresoAbierto = false;
            tienda.rankingAbierto = false;
        }
        cargarNivel(estado.nivelActual);
        fijarFase('inicio');
        sincronizarUi({ rankingMensaje: '' });
        const aviso = document.getElementById('game-aviso');
        if (aviso) aviso.textContent = 'Menú principal. Elige nivel y pulsa Jugar.';
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
                completo: estado.modo === 'rush'
                    ? (estado.rushCompletado ? 'Boss Rush completado.' : 'Jefe superado.')
                    : (estado.modo === 'reto' ? 'Reto diario completado.' : 'Nivel completado.'),
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
        store.nivelNombre = estado.modo === 'rush'
            ? 'Boss Rush'
            : (estado.nivelDatos ? estado.nivelDatos.nombre : NIVELES[estado.nivelActual - 1].nombre);
        store.totalNiveles = NIVELES.length;
        store.haySiguiente = estado.modo === 'rush'
            ? !estado.rushCompletado && estado.rushJefe < estado.rushTotal
            : (estado.modo === 'normal' && estado.nivelActual < NIVELES.length);
        store.rankingSesion = !!tokenComunidad();
        store.rankingApodo = apodoComunidad();
        store.volumen = Math.round(estado.volumen * 100);
        store.sonido = estado.sonido;
        store.reducirMovimiento = estado.reducirMovimiento;
        store.escala = ESCALA_RENDER;
        store.modo = estado.modo;
        store.rushJefe = estado.rushJefe;
        store.rushTotal = estado.rushTotal;
        store.rushCompletado = estado.rushCompletado;
        store.rushRecord = estado.rushRecord;
        store.retoFecha = estado.retoFecha;
        store.retoNivel = estado.retoNivel;
        store.retoNombre = estado.retoNivel ? NIVELES[estado.retoNivel - 1].nombre : '';
        store.retoHecho = estado.retoHecho;
        store.medallas = estado.medallas.slice();
        store.medallasConseguidas = estado.medallasConseguidas;
        store.medallaActual = estado.medallaActual;
        store.skin = estado.skin;
        store.nombresNiveles = NIVELES.map((nivel) => nivel.nombre);
        store.logrosDesbloqueados = LOGROS.filter((logro) => tieneLogro(logro.id)).length;
        if (store.progresoAbierto || !store.logros.length) {
            store.logros = LOGROS.map((logro) => Object.assign({}, logro, { hecho: tieneLogro(logro.id) }));
            store.skins = SKINS.map((skin) => ({
                id: skin.id,
                nombre: skin.nombre,
                color: skin.color,
                bloqueada: !skinDesbloqueada(skin.id),
                activa: estado.skin === skin.id
            }));
        }
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
        estado.danoRecibidoNivel += 1;
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
        const numero = estado.nivelActual;
        const gpNivel = Math.max(0, estado.gp - estado.gpNivel);
        const maximo = maxGpNivel(numero);
        guardarRecord(numero);
        estado.medallaActual = estado.medallas[numero - 1] || '';
        if (estado.danoRecibidoNivel === 0) desbloquearLogro('sin_dano');
        if (maximo && gpNivel >= maximo * 0.9) desbloquearLogro('todos_gp');
        if (numero === 3) desbloquearLogro('purga');
        if (numero === 5) desbloquearLogro('campana');
        if (estado.tiempo <= (OBJETIVOS[numero - 1] || OBJETIVOS[0]).a) desbloquearLogro('velocista');
        if (estado.escudosRecogidos === 0) desbloquearLogro('sin_escudo');
        desbloquearSiguiente();
        enviarRun();
        sfx('meta');
        fijarFase('completo');
        sincronizarUi({ record: textoRecord(numero), medallaActual: estado.medallaActual });
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
                    : fila.gp + ' GP · ' + fila.haters + ' haters',
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
        store.progresoAbierto = false;
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
        const medalla = medallaNivel(numero, record);
        return 'Nivel ' + numero + (medalla ? ' · medalla ' + medalla : '') +
            ' · mejor: ' + formatearTiempo(record.mejorTiempo) + ' · ' + record.mejorGp + ' GP';
    }

    function guardarRecord(nivelNumero) {
        const numero = nivelNumero || estado.nivelActual;
        const gpNivel = Math.max(0, estado.gp - estado.gpNivel);
        const hatersNivel = Math.max(0, estado.hatersMuertos - estado.hatersNivel);
        const anterior = leerRecord(numero);
        const comparable = anterior && anterior.version === 2;
        const mejora = !comparable ||
            gpNivel > anterior.mejorGp ||
            (gpNivel === anterior.mejorGp && estado.tiempo < anterior.mejorTiempo);
        if (!mejora) return;
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
            datos.niveles = datos.niveles || {};
            datos.niveles[numero] = {
                version: 2,
                mejorTiempo: estado.tiempo,
                mejorGp: gpNivel,
                haters: hatersNivel,
                actualizado: new Date().toISOString()
            };
            localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
            actualizarProgreso();
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
            if (!quitar && nivel.jefe && nivel.jefe.vivo && nivel.jefe.activado) {
                const b = nivel.jefe;
                if (clip.x > b.x && clip.x < b.x + b.ancho && clip.y > b.y && clip.y < b.y + b.alto) {
                    if (b.escudo > 0) {
                        generarChispas(5, clip.x, clip.y, '#67e8f9');
                        avisoFlotante('CLIP BLOQUEADO', clip.x, clip.y - 8);
                        sfx('escudo');
                    } else {
                        golpearJefe(b, estado.jugador, true);
                    }
                    quitar = true;
                }
            }
            if (!quitar) {
                for (const h of nivel.haters) {
                    if (!h.vivo) continue;
                    if (clip.x > h.x && clip.x < h.x + h.ancho && clip.y > h.y && clip.y < h.y + h.alto) {
                        if (h.escudo) {
                            h.escudo = false;
                            generarChispas(6, clip.x, clip.y, '#67e8f9');
                            avisoFlotante('ESCUDO ROTO', clip.x, clip.y - 8);
                            sfx('escudo');
                        } else {
                            matarHater(h, false);
                        }
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

    function actualizarCheckpoints(nivel, j) {
        for (const cp of nivel.checkpoints) {
            if (cp.activo) continue;
            const caja = { x: cp.x + 2, y: cp.y - 18, ancho: 10, alto: 20 };
            if (!rectSolapa(j, caja)) continue;
            cp.activo = true;
            estado.checkpoint = { x: cp.x, y: cp.y, tileX: cp.tileX, tileY: cp.tileY };
            avisoFlotante('CHECKPOINT', cp.x + 4, cp.y - 10);
            generarChispas(10, cp.x + 6, cp.y + 4, '#5eead4');
            sfx('poder');
        }
    }

    function golpearJefe(b, j, forzar) {
        if (!b.vivo || (!forzar && b.golpe > 0.05)) return;
        b.hp -= 1;
        b.golpe = 0.3;
        generarChispas(14, b.x + b.ancho / 2, b.y + b.alto / 2, '#ff4fa3');
        avisoFlotante(b.nombre + ' ' + Math.max(0, b.hp) + '/' + b.hpMax, b.x + b.ancho / 2, b.y - 8);
        sfx('golpe');
        if (b.hp <= 0) derrotarJefe(b);
    }

    function derrotarJefe(b) {
        if (!b.vivo) return;
        b.vivo = false;
        b.activado = false;
        estado.gp += b.bonus;
        estado.avisoJefe = false;
        const cx = b.x + b.ancho / 2;
        const cy = b.y + b.alto / 2;
        generarChispas(30, cx, cy, '#ffd166');
        generarChispas(18, cx, cy, '#ff4fa3');
        avisoFlotante('¡' + b.nombre + ' DERROTADO! +' + b.bonus + ' GP', cx, b.y - 10);
        sfx('meta');
        if (estado.nivelActual === 1) desbloquearLogro('primer_jefe');
        if (estado.nivelActual === 5) desbloquearLogro('nucleo');
        if (estado.modo === 'rush') {
            estado.rushCompletado = estado.rushJefe >= estado.rushTotal;
            if (estado.rushCompletado) {
                guardarRecordRush();
                desbloquearLogro('cazajefes');
            }
            estado.medallaActual = '';
            fijarFase('completo');
            sincronizarUi({
                record: textoRecordRush(),
                rankingMensaje: '',
                medallaActual: ''
            });
            const avisoRush = document.getElementById('game-aviso');
            if (avisoRush) {
                avisoRush.textContent = estado.rushCompletado
                    ? 'Boss Rush completado en ' + formatearTiempo(estado.tiempo) + '.'
                    : 'Jefe ' + estado.rushJefe + ' de ' + estado.rushTotal + ' superado.';
            }
            return;
        }
        if (estado.modo === 'reto') {
            marcarRetoCompletado();
            desbloquearLogro('reto');
            estado.medallaActual = '';
            fijarFase('completo');
            sincronizarUi({
                record: 'Reto diario completado · ' + formatearTiempo(estado.tiempo),
                rankingMensaje: '',
                medallaActual: ''
            });
            const avisoReto = document.getElementById('game-aviso');
            if (avisoReto) avisoReto.textContent = 'Reto diario completado.';
            return;
        }
        sincronizarUi();
    }

    function lanzarBurbujaJefe(b, j, opciones) {
        const extra = opciones || {};
        const dx = (j.x + j.ancho / 2) - (b.x + b.ancho / 2);
        const dy = (j.y + j.alto / 2) - (b.y + b.alto / 2);
        estado.burbujas.push({
            x: b.x + b.ancho / 2,
            y: b.y + b.alto / 2,
            vx: limitar(dx * 0.5, -150, 150) + (extra.vx || 0),
            vy: limitar(dy * 0.35, -150, 40) + (extra.vy || 0),
            vida: 4,
            texto: extra.texto || 'BANEO',
            tipo: extra.tipo || 'burbuja'
        });
        sfx('burbuja');
    }

    function actualizarJefe(dt, nivel, j) {
        const b = nivel.jefe;
        if (!b || !b.vivo) return;

        if (!b.activado) {
            if (j.x + j.ancho <= b.arenaInicio) return;
            b.activado = true;
            estado.avisoJefe = false;
            avisoFlotante('¡' + b.nombre + '!', b.x + b.ancho / 2, b.y - 8);
            sfx('dano');
        }

        b.golpe = Math.max(0, b.golpe - dt);
        b.fase += dt;
        b.movT += dt;

        const patrones = {
            tecnico: { vx: 44, vy: 36, rango: 52, bob: 1.4, dashT: 4.2, dashVel: 150, dashDur: 0.38 },
            raid: { vx: 60, vy: 48, rango: 68, bob: 1.7, dashT: 3.6, dashVel: 185, dashDur: 0.42 },
            hater: { vx: 74, vy: 60, rango: 80, bob: 2.1, dashT: 2.9, dashVel: 215, dashDur: 0.44 },
            turbina: { vx: 32, vy: 32, rango: 62, bob: 1.2, dashT: 4.8, dashVel: 150, dashDur: 0.4 },
            nucleo: { vx: 66, vy: 52, rango: 84, bob: 1.8, dashT: 3.3, dashVel: 205, dashDur: 0.46 }
        };
        const p = patrones[b.tipo] || patrones.hater;
        const reducido = estado.reducirMovimiento;
        const furia = b.hp <= b.hpMax / 2;

        // Escudo periódico: avisa antes de activarse y no bloquea el pisotón.
        const avisoEscudoAntes = b.escudoAviso || 0;
        b.escudoAviso = Math.max(0, avisoEscudoAntes - dt);
        if (avisoEscudoAntes > 0 && b.escudoAviso === 0) {
            b.escudo = ESCUDO_JEFE_TIEMPO;
            generarChispas(10, b.x + b.ancho / 2, b.y + b.alto / 2, '#67e8f9');
            sfx('poder');
        }
        if (b.escudo > 0) {
            b.escudo = Math.max(0, b.escudo - dt);
            if (b.escudo === 0) {
                b.escudoT = ESCUDO_JEFE_ESPERA * (furia ? 0.72 : 1);
                b.escudoEspera = b.escudoT;
            }
        } else if (b.escudoAviso <= 0) {
            b.escudoT -= dt;
            if (b.escudoT <= 0) {
                b.escudoAviso = AVISO_ESCUDO;
                b.escudoT = 0.01;
                avisoFlotante('ESCUDO EN CAMINO', b.x + b.ancho / 2, b.y - 12);
                sfx('escudo');
            }
        }

        const minX = b.arenaInicio + 10;
        const limiteDerecho = nivel.meta ? nivel.meta.x - b.ancho - 20 : nivel.ancho * TILE - b.ancho - 20;
        const maxX = Math.max(minX, limiteDerecho);
        const minY = 4 * TILE;
        const maxY = b.baseY;
        const centro = (minX + maxX) / 2;
        const amplitud = Math.max(0, (maxX - minX) * 0.42);

        const avisoAntes = b.aviso || 0;
        b.aviso = Math.max(0, avisoAntes - dt);
        b.carga = Math.max(0, (b.carga || 0) - dt);
        b.cargaT -= dt;

        if (!reducido && b.aviso <= 0 && b.carga <= 0 && b.cargaT <= 0) {
            b.aviso = 0.6;
            b.cargaT = p.dashT * (furia ? 0.78 : 1);
            b.cargaDir = Math.sign((j.x + j.ancho / 2) - (b.x + b.ancho / 2)) || 1;
        }
        if (avisoAntes > 0 && b.aviso === 0) b.carga = p.dashDur;

        if (b.aviso > 0) {
            // Telegrafiado: se queda quieto y parpadea antes de embestir.
        } else if (b.carga > 0) {
            b.x += b.cargaDir * p.dashVel * dt;
        } else {
            let objetivoX;
            if (b.tipo === 'turbina' || b.tipo === 'nucleo') {
                objetivoX = centro + Math.sin(b.movT * (b.tipo === 'nucleo' ? 0.95 : 0.65) + b.fase) * amplitud;
            } else {
                const strafe = Math.sin(b.movT * 1.8 + b.fase) * 14;
                objetivoX = j.x + j.ancho / 2 - b.ancho / 2 + strafe;
            }
            const objetivoY = b.baseY - (0.5 + 0.5 * Math.sin(b.movT * p.bob + b.fase)) * (reducido ? 18 : p.rango);
            b.x = acercar(b.x, objetivoX, p.vx * dt * (furia ? 1.25 : 1));
            b.y = acercar(b.y, objetivoY, p.vy * dt);
        }
        b.x = limitar(b.x, minX, maxX);
        b.y = limitar(b.y, minY, maxY);

        if (b.tipo === 'turbina' && !reducido) {
            j.vx = limitar(j.vx - 190 * dt, -VEL_CORRER, VEL_CORRER);
        }

        b.tiro -= dt;
        if (b.tiro <= 0) {
            b.tiro = Math.max(0.42, b.intervalo * (furia ? 0.7 : 1));
            if (b.ataque === 'triple') {
                lanzarBurbujaJefe(b, j, { vx: -55, vy: -30, texto: 'RAID' });
                lanzarBurbujaJefe(b, j, { texto: 'RAID' });
                lanzarBurbujaJefe(b, j, { vx: 55, vy: 20, texto: 'RAID' });
                if (furia) {
                    lanzarBurbujaJefe(b, j, { vx: -90, vy: 35, texto: 'RAID' });
                    lanzarBurbujaJefe(b, j, { vx: 90, vy: -35, texto: 'RAID' });
                }
            } else if (b.ataque === 'cable') {
                lanzarBurbujaJefe(b, j, { vy: 55, texto: 'CABLE', tipo: 'cable' });
                lanzarBurbujaJefe(b, j, { vy: -20, texto: 'CABLE', tipo: 'cable' });
                if (furia) lanzarBurbujaJefe(b, j, { vx: -40, vy: 35, texto: 'CABLE', tipo: 'cable' });
            } else if (b.ataque === 'viento') {
                lanzarBurbujaJefe(b, j, { vy: -40, texto: 'VIENTO' });
                lanzarBurbujaJefe(b, j, { vy: 30, texto: 'VIENTO' });
                if (furia) lanzarBurbujaJefe(b, j, { vx: -50, texto: 'VIENTO' });
            } else if (b.ataque === 'ondas') {
                lanzarBurbujaJefe(b, j, { vy: -90, texto: 'ONDA' });
                lanzarBurbujaJefe(b, j, { texto: 'ONDA' });
                lanzarBurbujaJefe(b, j, { vy: 90, texto: 'ONDA' });
                if (furia) {
                    lanzarBurbujaJefe(b, j, { vx: -70, vy: -45, texto: 'ONDA' });
                    lanzarBurbujaJefe(b, j, { vx: 70, vy: 45, texto: 'ONDA' });
                }
            } else {
                lanzarBurbujaJefe(b, j);
                if (furia) lanzarBurbujaJefe(b, j, { vy: -55 });
            }
        }

        if (!rectSolapa(j, b)) return;
        const pisando = j.vy > 40 && (j.y + j.alto) - b.y < 16;
        if (pisando) {
            j.vy = -330;
            j.y = b.y - j.alto - 0.1;
            j.enSuelo = false;
            golpearJefe(b, j);
        } else {
            danar();
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
        if (nivel.jefe && nivel.jefe.activado && nivel.jefe.vivo) return;
        if (estado.tiempo < purga.retraso) return;

        // La pared se detiene antes de la arena para que el jefe se pueda pelear.
        const parada = nivel.jefe ? nivel.jefe.arenaInicio - 4 * TILE : nivel.ancho * TILE;
        if (purga.x >= parada) {
            purga.x = parada;
            return;
        }

        const progreso = limitar(purga.x / Math.max(1, parada), 0, 1);
        purga.velocidad = purga.base + progreso * purga.rampa;
        purga.x = Math.min(parada, purga.x + purga.velocidad * dt);
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
        actualizarJefe(dt, nivel, j);
        if (estado.jugador !== j) return;
        if (estado.fase !== 'jugando') return;
        actualizarPowerups(dt, nivel, j);
        actualizarClips(dt, nivel);
        actualizarBurbujas(dt, nivel);
        if (estado.jugador !== j) return;
        actualizarAvisos(dt);
        actualizarCheckpoints(nivel, j);
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
            if (nivel.jefe && nivel.jefe.vivo) {
                if (!estado.avisoJefe) {
                    estado.avisoJefe = true;
                    avisoFlotante('DERROTA A ' + nivel.jefe.nombre, nivel.jefe.x + nivel.jefe.ancho / 2, nivel.jefe.y - 10);
                }
                return;
            }
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

    function dibujarVentilador(c, x, y, radio, color, giro) {
        c.save();
        c.translate(x, y);
        c.fillStyle = 'rgba(8, 15, 30, 0.72)';
        c.beginPath();
        c.arc(0, 0, radio, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = color;
        c.globalAlpha = 0.35;
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(0, 0, radio, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
        if (!estado.reducirMovimiento) c.rotate(estado.anim * giro);
        c.fillStyle = color;
        c.globalAlpha = 0.22;
        for (let i = 0; i < 5; i++) {
            c.rotate((Math.PI * 2) / 5);
            c.beginPath();
            c.ellipse(0, -radio * 0.46, radio * 0.2, radio * 0.42, 0.35, 0, Math.PI * 2);
            c.fill();
        }
        c.globalAlpha = 1;
        c.fillStyle = color;
        c.beginPath();
        c.arc(0, 0, radio * 0.18, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }

    function dibujarFondo(c) {
        const tema = estado.nivelActual;
        const paletas = {
            1: ['#070b18', '#101a36', '#241243', '#5eead4', '#ff4fa3'],
            2: ['#031015', '#06242c', '#0a3340', '#53fc18', '#67e8f9'],
            3: ['#150510', '#2a0a1e', '#3a0d16', '#ff4fa3', '#ff6b6b'],
            4: ['#160d05', '#2b1908', '#3d220a', '#ffb020', '#ffd166'],
            5: ['#0a0618', '#1b1240', '#2a155c', '#a78bfa', '#67e8f9']
        };
        const paleta = paletas[tema] || paletas[1];
        const gradiente = c.createLinearGradient(0, 0, 0, VISTA_ALTO);
        gradiente.addColorStop(0, paleta[0]);
        gradiente.addColorStop(0.55, paleta[1]);
        gradiente.addColorStop(1, paleta[2]);
        c.fillStyle = gradiente;
        c.fillRect(0, 0, VISTA_ANCHO, VISTA_ALTO);

        // Placa base lejana: pistas, chips y condensadores.
        const desplazamiento = (estado.camara.x * 0.22) % 120;
        c.strokeStyle = paleta[3];
        c.globalAlpha = 0.1;
        c.lineWidth = 1;
        for (let i = -1; i < 6; i++) {
            const x = i * 120 - desplazamiento;
            c.beginPath();
            c.moveTo(x, 34);
            c.lineTo(x + 18, 34);
            c.lineTo(x + 30, 52);
            c.lineTo(x + 30, 150);
            c.stroke();
            c.beginPath();
            c.moveTo(x + 70, 210);
            c.lineTo(x + 70, 120);
            c.lineTo(x + 88, 100);
            c.stroke();
        }
        c.globalAlpha = 0.14;
        for (let i = 0; i < 7; i++) {
            const x = ((i * 83 - estado.camara.x * 0.3) % (VISTA_ANCHO + 80)) - 40;
            const y = 58 + (i % 3) * 52;
            c.fillStyle = paleta[3];
            c.fillRect(x, y, 26, 14);
            c.fillStyle = 'rgba(3, 7, 15, 0.6)';
            c.fillRect(x + 3, y + 3, 20, 8);
        }
        c.globalAlpha = 1;

        if (tema === 1) {
            // Escritorio: monitor apagado con reflejo y teclado.
            const mx = 250 - (estado.camara.x * 0.12) % 30;
            c.fillStyle = 'rgba(3, 7, 16, 0.55)';
            rectRedondeado(c, mx, 42, 190, 112, 6);
            c.fill();
            c.fillStyle = 'rgba(94, 234, 212, 0.06)';
            rectRedondeado(c, mx + 7, 49, 176, 92, 3);
            c.fill();
            c.fillStyle = 'rgba(94, 234, 212, 0.16)';
            for (let i = 0; i < 4; i++) c.fillRect(mx + 16, 62 + i * 13, 44 + (i % 2) * 28, 2);
            c.fillStyle = 'rgba(3, 7, 16, 0.75)';
            c.fillRect(mx + 88, 154, 14, 22);
            c.fillRect(mx + 62, 176, 66, 5);
        } else {
            // Interior de la torre: cristal templado, bahías y cableado.
            c.strokeStyle = 'rgba(180, 220, 255, 0.09)';
            c.lineWidth = 2;
            c.strokeRect(26, 28, VISTA_ANCHO - 52, VISTA_ALTO - 66);
            c.fillStyle = 'rgba(3, 8, 18, 0.32)';
            for (let i = 0; i < 3; i++) c.fillRect(34, 36 + i * 15, 54, 10);
            c.strokeStyle = 'rgba(180, 220, 255, 0.06)';
            c.beginPath();
            c.moveTo(430, 30);
            c.bezierCurveTo(400, 90, 445, 140, 408, 220);
            c.stroke();
        }

        // Ventiladores con parallax.
        dibujarVentilador(c, 64 - (estado.camara.x * 0.16) % 40, 96, 24, paleta[3], 1.6);
        dibujarVentilador(c, 382 - (estado.camara.x * 0.26) % 60, 168, 31, paleta[4], -1.1);
        dibujarVentilador(c, 240 - (estado.camara.x * 0.1) % 24, 226, 18, paleta[3], 2.1);

        // Tiras RGB con pulso.
        const pulso = 0.1 + Math.abs(Math.sin(estado.anim * 1.6)) * 0.12;
        c.fillStyle = paleta[3];
        c.globalAlpha = pulso;
        c.fillRect(0, 26, VISTA_ANCHO, 2);
        c.fillRect(0, VISTA_ALTO - 10, VISTA_ANCHO, 2);
        c.globalAlpha = 1;

        if (tema === 3 || tema === 5) {
            c.fillStyle = tema === 3 ? 'rgba(255, 79, 163, 0.14)' : 'rgba(167, 139, 250, 0.12)';
            const barrido = (estado.anim * 60) % 220;
            for (let i = 0; i < 4; i++) {
                c.fillRect(0, (i * 70 + barrido) % VISTA_ALTO, VISTA_ANCHO, 1);
            }
        }
    }

    function dibujarNivel(c) {
        const nivel = estado.nivelDatos;
        if (!nivel) return;
        const paletas = {
            setup: ['#10283f', '#2bd9b0', '#5eead4'],
            raid: ['#0b2f2a', '#53fc18', '#b6ff9e'],
            purga: ['#3a1024', '#ff4fa3', '#ffd1e6'],
            overclock: ['#33220e', '#ffb020', '#ffd166'],
            nucleo: ['#1b1240', '#a78bfa', '#c4b5fd']
        };
        const paleta = paletas[nivel.tema] || paletas.setup;
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
                    c.fillStyle = paleta[0];
                    c.fillRect(px, py, TILE, TILE);
                    c.fillStyle = paleta[1];
                    c.fillRect(px, py, TILE, 3);
                    c.fillStyle = 'rgba(3, 8, 18, 0.32)';
                    c.fillRect(px, py + TILE - 2, TILE, 2);
                    if ((tx + ty) % 3 === 0) {
                        c.fillStyle = paleta[2];
                        c.globalAlpha = 0.35;
                        c.fillRect(px + 3, py + 7, 4, 4);
                        c.fillRect(px + 10, py + 11, 2, 2);
                        c.globalAlpha = 1;
                    }
                } else if (ch === '=') {
                    c.fillStyle = '#151d38';
                    c.fillRect(px, py, TILE, TILE);
                    c.fillStyle = paleta[1];
                    c.fillRect(px, py, TILE, 3);
                    c.fillStyle = '#ffd166';
                    for (let i = 0; i < 4; i++) c.fillRect(px + 2 + i * 4, py + TILE - 4, 2, 2);
                } else if (ch === '^') {
                    c.fillStyle = '#ff6b6b';
                    c.beginPath();
                    c.moveTo(px + 2, py + TILE);
                    c.lineTo(px + TILE / 2, py + 5);
                    c.lineTo(px + TILE - 2, py + TILE);
                    c.closePath();
                    c.fill();
                    c.fillStyle = 'rgba(255, 209, 230, 0.55)';
                    c.fillRect(px + TILE / 2 - 1, py + 8, 1.5, 6);
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
            if (h.escudo) {
                c.strokeStyle = 'rgba(103, 232, 249, .85)';
                c.lineWidth = 1;
                c.beginPath();
                c.ellipse(cx, h.y + 7 + bob, 10, 10, 0, 0, Math.PI * 2);
                c.stroke();
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

    function dibujarCheckpoints(c) {
        const nivel = estado.nivelDatos;
        if (!nivel) return;
        for (const cp of nivel.checkpoints) {
            const baseY = cp.tileY * TILE + TILE;
            const x = cp.tileX * TILE + 10;
            c.fillStyle = '#334155';
            c.fillRect(x, baseY - 22, 1.5, 22);
            c.fillStyle = cp.activo ? '#5eead4' : '#64748b';
            c.beginPath();
            c.moveTo(x + 1.5, baseY - 22);
            c.lineTo(x + 1.5, baseY - 12);
            c.lineTo(x + 12, baseY - 17);
            c.closePath();
            c.fill();
            if (cp.activo) {
                c.fillStyle = 'rgba(94, 234, 212, .55)';
                c.beginPath();
                c.arc(x + 1, baseY - 23, 2.4, 0, Math.PI * 2);
                c.fill();
            }
        }
    }

    function dibujarJefe(c) {
        const b = estado.nivelDatos && estado.nivelDatos.jefe;
        if (!b || !b.vivo) return;

        const cx = b.x + b.ancho / 2;
        const alerta = b.aviso > 0 || b.escudoAviso > 0;
        const estilos = {
            tecnico: { piel: '#8b5cf6', sombra: '#6d28d9', gorra: '#22d3ee', gorra2: '#0891b2', ropa: '#ef4444', ropa2: '#991b1b', pantalon: '#1e293b', gafas: false, telefono: true, cadena: false, barba: false },
            raid: { piel: '#db2777', sombra: '#9d174d', gorra: '#2563eb', gorra2: '#1e3a8a', ropa: '#f8fafc', ropa2: '#38bdf8', pantalon: '#1e3a8a', gafas: true, telefono: true, cadena: true, barba: false },
            hater: { piel: '#dc2626', sombra: '#991b1b', gorra: '#7c3aed', gorra2: '#4c1d95', ropa: '#16a34a', ropa2: '#14532d', pantalon: '#111827', gafas: false, telefono: true, cadena: true, barba: true },
            turbina: { piel: '#ea580c', sombra: '#9a3412', gorra: '#facc15', gorra2: '#a16207', ropa: '#2563eb', ropa2: '#1e3a8a', pantalon: '#111827', gafas: false, telefono: false, cadena: false, barba: false },
            nucleo: { piel: '#9f1239', sombra: '#4c0519', gorra: '#fde047', gorra2: '#a16207', ropa: '#4c1d95', ropa2: '#a21caf', pantalon: '#1e1b4b', gafas: true, telefono: false, cadena: false, barba: false }
        };
        const cfg = estilos[b.tipo] || estilos.hater;
        const piel = alerta ? '#fde047' : (b.golpe > 0 ? '#fecdd3' : cfg.piel);
        const color = alerta ? '#fde047' : cfg.gorra;
        const negro = '#0b0b12';
        const blanco = '#f8fafc';

        const forma = (relleno, dibujar, grosor) => {
            c.beginPath();
            dibujar();
            c.fillStyle = relleno;
            c.fill();
            c.lineWidth = grosor || 1.8;
            c.strokeStyle = negro;
            c.lineJoin = 'round';
            c.stroke();
        };
        const linea = (colorLinea, grosor, dibujar) => {
            c.beginPath();
            dibujar();
            c.strokeStyle = negro;
            c.lineWidth = grosor + 1.8;
            c.lineCap = 'round';
            c.stroke();
            c.strokeStyle = colorLinea;
            c.lineWidth = grosor;
            c.stroke();
        };
        const elipse = (x, y, rx, ry, relleno, rot) => forma(relleno, () => {
            c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot || 0, 0, Math.PI * 2);
        });
        const caja = (x, y, ancho, alto, radio, relleno) => forma(relleno, () => {
            rectRedondeado(c, x, y, ancho, alto, radio);
        });

        const cabezaY = b.y + b.alto * 0.33;
        const cabezaRx = b.ancho * 0.29;
        const cabezaRy = b.alto * 0.235;
        const cuerpoW = b.ancho * 0.58;
        const cuerpoH = b.alto * 0.52;
        const cuerpoX = cx - cuerpoW / 2;
        const cuerpoY = b.y + b.alto * 0.43;
        const hombroY = cuerpoY + 5;
        const telefonoX = cx - b.ancho * 0.47;
        const telefonoY = cuerpoY + 6;

        // Sombra en el suelo.
        c.fillStyle = 'rgba(0, 0, 0, .3)';
        c.beginPath();
        c.ellipse(cx, b.y + b.alto + 2, b.ancho * 0.32, 2.5, 0, 0, Math.PI * 2);
        c.fill();

        // Efectos detrás de cada jefe.
        if (b.tipo === 'turbina') {
            c.save();
            c.translate(cx, b.y + b.alto * 0.5);
            if (!estado.reducirMovimiento) c.rotate(estado.anim * 3.2);
            c.fillStyle = color;
            c.globalAlpha = 0.22;
            for (let i = 0; i < 4; i++) {
                c.rotate(Math.PI / 2);
                c.beginPath();
                c.ellipse(0, -19, 8, 19, 0.35, 0, Math.PI * 2);
                c.fill();
            }
            c.globalAlpha = 1;
            c.strokeStyle = 'rgba(255, 176, 32, .55)';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(0, 0, 22, 0, Math.PI * 2);
            c.stroke();
            c.restore();
        } else if (b.tipo === 'nucleo') {
            c.strokeStyle = 'rgba(167, 139, 250, .55)';
            c.lineWidth = 1.5;
            c.beginPath();
            c.ellipse(cx, b.y + b.alto * 0.5, b.ancho * 0.62, b.alto * 0.22, estado.anim, 0, Math.PI * 2);
            c.stroke();
            for (let i = 0; i < 4; i++) {
                const ang = estado.anim * 1.4 + i * Math.PI / 2;
                const ox = cx + Math.cos(ang) * b.ancho * 0.56;
                const oy = b.y + b.alto * 0.5 + Math.sin(ang) * b.alto * 0.22;
                c.fillStyle = 'rgba(196, 181, 253, .7)';
                c.beginPath();
                c.arc(ox, oy, 2, 0, Math.PI * 2);
                c.fill();
            }
        } else if (b.tipo === 'tecnico') {
            c.strokeStyle = 'rgba(34, 211, 238, .65)';
            c.lineWidth = 1.4;
            for (let i = 0; i < 3; i++) {
                c.beginPath();
                c.moveTo(cx - 12 + i * 12, b.y + b.alto * 0.55);
                c.bezierCurveTo(cx - 20 + i * 20, b.y + b.alto * 0.8, cx + 16 - i * 10, b.y + b.alto * 0.9, cx + 22 - i * 14, b.y + b.alto * 0.7);
                c.stroke();
            }
            c.fillStyle = '#22d3ee';
            c.fillRect(cx - 24, b.y + b.alto * 0.67, 3, 4);
        } else if (b.tipo === 'raid') {
            c.strokeStyle = 'rgba(83, 252, 24, .45)';
            c.lineWidth = 1.2;
            for (let i = 0; i < 3; i++) {
                c.beginPath();
                c.arc(cx, b.y + b.alto * 0.5, 18 + i * 5, -0.8, 0.8);
                c.stroke();
            }
        } else {
            c.fillStyle = 'rgba(255, 79, 163, .18)';
            c.beginPath();
            c.moveTo(cx - b.ancho * 0.55, b.y + b.alto * 0.7);
            c.lineTo(cx - b.ancho * 0.4, b.y + b.alto * 0.45);
            c.lineTo(cx - b.ancho * 0.2, b.y + b.alto * 0.72);
            c.closePath();
            c.fill();
            c.beginPath();
            c.moveTo(cx + b.ancho * 0.55, b.y + b.alto * 0.7);
            c.lineTo(cx + b.ancho * 0.4, b.y + b.alto * 0.45);
            c.lineTo(cx + b.ancho * 0.2, b.y + b.alto * 0.72);
            c.closePath();
            c.fill();
        }

        // Escudo y aviso.
        if (b.escudo > 0) {
            const pulso = 0.55 + Math.abs(Math.sin(estado.anim * 8)) * 0.3;
            c.strokeStyle = 'rgba(103, 232, 249, ' + pulso + ')';
            c.lineWidth = 2;
            c.beginPath();
            c.ellipse(cx, b.y + b.alto / 2, b.ancho / 2 + 7, b.alto / 2 + 7, 0, 0, Math.PI * 2);
            c.stroke();
            c.strokeStyle = 'rgba(248, 250, 252, .25)';
            c.lineWidth = 1;
            c.beginPath();
            c.ellipse(cx, b.y + b.alto / 2, b.ancho / 2 + 3, b.alto / 2 + 3, 0, 0, Math.PI * 2);
            c.stroke();
        } else if (b.escudoAviso > 0) {
            c.strokeStyle = 'rgba(253, 224, 71, .85)';
            c.lineWidth = 2;
            c.setLineDash([4, 3]);
            c.beginPath();
            c.ellipse(cx, b.y + b.alto / 2, b.ancho / 2 + 7, b.alto / 2 + 7, 0, 0, Math.PI * 2);
            c.stroke();
            c.setLineDash([]);
        }

        // Piernas y torso.
        caja(cuerpoX + 3, cuerpoY + cuerpoH * 0.74, cuerpoW * 0.34, cuerpoH * 0.26, 2, cfg.pantalon);
        caja(cuerpoX + cuerpoW - 3 - cuerpoW * 0.34, cuerpoY + cuerpoH * 0.74, cuerpoW * 0.34, cuerpoH * 0.26, 2, cfg.pantalon);
        caja(cuerpoX, cuerpoY, cuerpoW, cuerpoH, 6, cfg.ropa);
        caja(cuerpoX + 2, cuerpoY + 2, cuerpoW - 4, cuerpoH * 0.36, 4, cfg.ropa2);
        caja(cuerpoX, cuerpoY + cuerpoH * 0.6, cuerpoW, 2.5, 1, cfg.pantalon);

        // Brazos.
        linea(piel, 4.2, () => {
            c.moveTo(cuerpoX + 2, hombroY);
            c.lineTo(cuerpoX - 7, hombroY + 8);
            c.lineTo(cuerpoX - 9, telefonoY + 3);
        });
        elipse(cuerpoX - 9, telefonoY + 4, 3.4, 3, piel);
        linea(piel, 4.2, () => {
            c.moveTo(cuerpoX + cuerpoW - 2, hombroY);
            c.lineTo(cuerpoX + cuerpoW + 8, hombroY + 4);
            c.lineTo(cuerpoX + cuerpoW + 6, hombroY + 12);
        });
        elipse(cuerpoX + cuerpoW + 6, hombroY + 13, 3.4, 3.1, piel);

        // Teléfono para los que lo usan.
        if (cfg.telefono) {
            caja(telefonoX - 4, telefonoY - 7, 8, 14, 2, '#111827');
            c.fillStyle = b.tiro < 0.35 ? '#fde047' : '#38bdf8';
            c.fillRect(telefonoX - 2.5, telefonoY - 5, 5, 7);
            c.fillStyle = '#e0f2fe';
            c.fillRect(telefonoX - 2.5, telefonoY - 5, 5, 1.2);
            c.fillStyle = blanco;
            c.beginPath();
            c.arc(telefonoX, telefonoY + 5.5, 1.1, 0, Math.PI * 2);
            c.fill();
        } else if (b.tipo === 'turbina') {
            caja(cuerpoX + cuerpoW + 3, hombroY + 5, 8, 5, 2, '#111827');
            c.fillStyle = color;
            c.fillRect(cuerpoX + cuerpoW + 5, hombroY + 6.5, 4, 2);
        } else {
            c.fillStyle = 'rgba(196, 181, 253, .85)';
            c.beginPath();
            c.arc(cuerpoX + cuerpoW + 7, hombroY + 12, 3, 0, Math.PI * 2);
            c.fill();
        }

        // Cuello, orejas y cara.
        caja(cx - 3, cabezaY + cabezaRy - 4, 6, 7, 2, piel);
        elipse(cx - cabezaRx + 1.5, cabezaY + 2, 3, 4, piel);
        elipse(cx + cabezaRx - 1.5, cabezaY + 2, 3, 4, piel);
        elipse(cx, cabezaY, cabezaRx, cabezaRy, piel);

        if (cfg.barba) {
            c.fillStyle = '#1f2937';
            c.beginPath();
            c.ellipse(cx, cabezaY + cabezaRy * 0.45, cabezaRx * 0.88, cabezaRy * 0.62, 0, 0, Math.PI);
            c.fill();
        }
        if (cfg.cadena) {
            c.strokeStyle = '#facc15';
            c.lineWidth = 1.6;
            c.beginPath();
            c.arc(cx, cabezaY + cabezaRy + 1, cabezaRx * 0.72, 0.2, Math.PI - 0.2);
            c.stroke();
            c.fillStyle = '#facc15';
            c.beginPath();
            c.arc(cx, cabezaY + cabezaRy + 4.5, 2, 0, Math.PI * 2);
            c.fill();
        }

        // Gafas o mirada.
        if (cfg.gafas) {
            caja(cx - cabezaRx * 0.84, cabezaY - 2.5, cabezaRx * 1.68, 5.4, 2, '#0f172a');
            c.fillStyle = 'rgba(103, 232, 249, .6)';
            c.fillRect(cx - cabezaRx * 0.65, cabezaY - 1.6, cabezaRx * 0.52, 1.2);
            c.fillStyle = 'rgba(248, 250, 252, .22)';
            c.fillRect(cx + cabezaRx * 0.08, cabezaY - 1.6, cabezaRx * 0.3, 1);
        } else {
            elipse(cx - 4.2, cabezaY + 0.8, 3.2, 2.8, blanco);
            elipse(cx + 4.2, cabezaY + 0.8, 3.2, 2.8, blanco);
            c.fillStyle = negro;
            c.beginPath();
            c.arc(cx - 4.8, cabezaY + 1.1, 1.25, 0, Math.PI * 2);
            c.arc(cx + 4.8, cabezaY + 1.1, 1.25, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = negro;
            c.lineWidth = 1.2;
            c.beginPath();
            c.moveTo(cx - 7.2, cabezaY - 1.3);
            c.lineTo(cx - 1.6, cabezaY - 0.7);
            c.moveTo(cx + 7.2, cabezaY - 1.3);
            c.lineTo(cx + 1.6, cabezaY - 0.7);
            c.stroke();
        }

        // Cejas, nariz y boca.
        c.strokeStyle = negro;
        c.lineWidth = 2;
        c.beginPath();
        if (b.tipo === 'hater') {
            c.moveTo(cx - 8, cabezaY - 5.2);
            c.lineTo(cx - 2, cabezaY - 3.4);
            c.moveTo(cx + 8, cabezaY - 5.2);
            c.lineTo(cx + 2, cabezaY - 3.4);
        } else {
            c.moveTo(cx - 8, cabezaY - 4.8);
            c.lineTo(cx - 2, cabezaY - 3.8);
            c.moveTo(cx + 8, cabezaY - 4.8);
            c.lineTo(cx + 2, cabezaY - 3.8);
        }
        c.stroke();

        c.strokeStyle = negro;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(cx, cabezaY + 2.5);
        c.lineTo(cx - 1.2, cabezaY + 5);
        c.stroke();

        if (b.tipo === 'hater') {
            caja(cx - 5, cabezaY + 6, 10, 3, 1, blanco);
            c.strokeStyle = negro;
            c.lineWidth = 0.8;
            c.beginPath();
            c.moveTo(cx - 1.7, cabezaY + 6);
            c.lineTo(cx - 1.7, cabezaY + 9);
            c.moveTo(cx + 1.7, cabezaY + 6);
            c.lineTo(cx + 1.7, cabezaY + 9);
            c.stroke();
        } else {
            c.strokeStyle = negro;
            c.lineWidth = 1.2;
            c.beginPath();
            c.moveTo(cx - 4, cabezaY + 6.2);
            c.quadraticCurveTo(cx, cabezaY + 8.4, cx + 4, cabezaY + 6);
            c.stroke();
        }

        // Gorra.
        const capY = cabezaY - cabezaRy * 0.58;
        c.beginPath();
        c.arc(cx, capY, cabezaRx * 1.02, Math.PI, Math.PI * 2);
        c.lineTo(cx + cabezaRx, capY + 2);
        c.lineTo(cx - cabezaRx, capY + 2);
        c.closePath();
        c.fillStyle = color;
        c.fill();
        c.lineWidth = 1.8;
        c.strokeStyle = negro;
        c.lineJoin = 'round';
        c.stroke();
        caja(cx - cabezaRx * 1.25, capY + 1, cabezaRx * 1.9, 3, 1.4, cfg.gorra2);
        elipse(cx, capY - cabezaRx + 1, 1.5, 1.5, cfg.gorra2);

        // Accesorios finales.
        if (b.tipo === 'turbina') {
            c.strokeStyle = negro;
            c.lineWidth = 2.2;
            c.beginPath();
            c.arc(cx, cabezaY, cabezaRx + 2, Math.PI * 1.02, Math.PI * 1.98);
            c.stroke();
            caja(cx - cabezaRx - 4, cabezaY - 1, 4, 7, 2, '#111827');
            caja(cx + cabezaRx, cabezaY - 1, 4, 7, 2, '#111827');
            c.fillStyle = color;
            c.fillRect(cx - cabezaRx - 3, cabezaY + 1, 2, 3);
            c.fillRect(cx + cabezaRx + 1, cabezaY + 1, 2, 3);
        } else if (b.tipo === 'tecnico') {
            c.strokeStyle = negro;
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(cx + cabezaRx - 1, cabezaY + 2);
            c.quadraticCurveTo(cx + cabezaRx + 6, cabezaY + 10, cx + 5, cuerpoY + 4);
            c.stroke();
            c.fillStyle = '#22d3ee';
            c.beginPath();
            c.arc(cx + cabezaRx + 1, cabezaY + 3, 1.4, 0, Math.PI * 2);
            c.fill();
        } else if (b.tipo === 'nucleo') {
            c.fillStyle = 'rgba(196, 181, 253, .35)';
            c.beginPath();
            c.arc(cx, cuerpoY + cuerpoH * 0.3, 6, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = '#c4b5fd';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(cx, cuerpoY + cuerpoH * 0.3, 4, 0, Math.PI * 2);
            c.stroke();
        }

        // Nombre y aviso.
        c.fillStyle = color;
        c.font = 'bold 7px monospace';
        c.textAlign = 'center';
        c.fillText(b.nombre, cx, b.y - 6);
        if (b.aviso > 0) {
            c.fillStyle = '#fde047';
            c.font = 'bold 10px monospace';
            c.fillText('!', cx, b.y - 15);
        }
        c.textAlign = 'left';
    }

    function dibujarJefeHud(c) {
        const b = estado.nivelDatos && estado.nivelDatos.jefe;
        if (!b || !b.activado || !b.vivo) return;
        const ancho = 140;
        const x = (VISTA_ANCHO - ancho) / 2;
        const y = 29;
        c.fillStyle = 'rgba(5, 10, 20, .8)';
        rectRedondeado(c, x, y, ancho, 10, 4);
        c.fill();
        c.fillStyle = '#ff4fa3';
        rectRedondeado(c, x + 2, y + 2, (ancho - 4) * Math.max(0, b.hp) / b.hpMax, 6, 3);
        c.fill();
        const espera = b.escudoEspera || ESCUDO_JEFE_ESPERA;
        const carga = (b.escudo > 0 || b.escudoAviso > 0) ? 1 : Math.max(0, 1 - b.escudoT / espera);
        c.fillStyle = 'rgba(103, 232, 249, .22)';
        c.fillRect(x + 2, y + 11, ancho - 4, 2);
        c.fillStyle = b.escudo > 0 ? '#67e8f9' : (b.escudoAviso > 0 ? '#fde047' : 'rgba(103, 232, 249, .78)');
        c.fillRect(x + 2, y + 11, (ancho - 4) * carga, 2);
        c.fillStyle = '#f8fafc';
        c.font = 'bold 6px monospace';
        c.textAlign = 'center';
        c.fillText(b.nombre, VISTA_ANCHO / 2, y + 7.4);
        c.textAlign = 'left';
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

        const skin = SKINS.find((item) => item.id === estado.skin) || SKINS[0];
        const colorPelo = skin.colores.pelo;
        const colorPiel = skin.colores.piel;
        const colorTop = skin.colores.top;
        const colorTopClaro = skin.colores.topClaro;
        const colorRosa = skin.colores.rosa;
        const colorZapato = skin.colores.zapato;

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
        c.fillText('GP × ' + estado.gp, 8, 15);

        c.textAlign = 'center';
        c.fillStyle = '#cbd5e1';
        const nombreNivel = estado.nivelDatos ? estado.nivelDatos.nombre : 'El Setup';
        const etiquetaNivel = estado.modo === 'rush'
            ? 'JEFE ' + estado.rushJefe + '/' + estado.rushTotal
            : (estado.modo === 'reto'
                ? 'RETO DIARIO'
                : 'NIVEL ' + estado.nivelActual + '/' + NIVELES.length + ' · ' + nombreNivel.toUpperCase());
        c.fillText(etiquetaNivel, VISTA_ANCHO / 2, 15);

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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, lienzo.width, lienzo.height);
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(ESCALA_RENDER, 0, 0, ESCALA_RENDER, 0, 0);
        dibujarFondo(ctx);

        ctx.save();
        ctx.translate(-Math.round(estado.camara.x), -Math.round(estado.camara.y));
        dibujarNivel(ctx);
        dibujarTuneles(ctx);
        dibujarCheckpoints(ctx);
        dibujarPurga(ctx);
        dibujarPowerups(ctx);
        dibujarMonedas(ctx);
        dibujarMeta(ctx);
        dibujarParticulas(ctx);
        dibujarHaters(ctx);
        dibujarJefe(ctx);
        dibujarClips(ctx);
        dibujarPersonaje(ctx);
        dibujarBurbujas(ctx);
        dibujarAvisos(ctx);
        ctx.restore();

        dibujarAlertaPurga(ctx);
        dibujarHud(ctx);
        dibujarJefeHud(ctx);
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
            if (tienda && tienda.progresoAbierto) {
                ocultarProgreso();
                evento.preventDefault();
                return;
            }
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

            if (control === 'pausa') {
                boton.addEventListener('pointerdown', (evento) => {
                    evento.preventDefault();
                    alternarPausa();
                });
                return;
            }

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
        salir: salirAlMenu,
        iniciarBossRush,
        iniciarRetoDiario,
        fijarVolumen,
        alternarMovimientoReducido,
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
            modo: estado.modo,
            rushJefe: estado.rushJefe,
            rushTotal: estado.rushTotal,
            rushCompletado: estado.rushCompletado,
            retoNivel: estado.retoNivel,
            retoHecho: estado.retoHecho,
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
            medallaActual: '',
            medallas: [],
            medallasConseguidas: 0,
            nombresNiveles: NIVELES.map((nivel) => nivel.nombre),
            logros: [],
            logrosDesbloqueados: 0,
            skins: [],
            skin: 'gochita',
            modo: 'normal',
            rushJefe: 0,
            rushTotal: 0,
            rushCompletado: false,
            rushRecord: '',
            retoFecha: '',
            retoNivel: 0,
            retoNombre: '',
            retoHecho: false,
            progresoAbierto: false,
            rankingAbierto: false,
            rankingTab: 'general',
            rankingFilas: [],
            rankingCargando: false,
            rankingError: '',
            rankingMensaje: '',
            rankingSesion: false,
            rankingApodo: '',
            volumen: 85,
            sonido: true,
            reducirMovimiento: false,
            escala: ESCALA_RENDER,
            iniciar() { iniciarPartida(this.nivelActual); },
            pausar() { pausarPartida(); },
            reanudar() { reanudarPartida(); },
            reiniciar() { reiniciarPartida(); },
            salir() { salirAlMenu(); },
            fijarVolumen(valor) { fijarVolumen(valor); },
            alternarSonido() { alternarSonido(); },
            alternarMovimiento() { alternarMovimientoReducido(); },
            siguienteNivel() { siguienteNivelJuego(); },
            abrirRanking(tab) { mostrarRanking(tab); },
            cerrarRanking() { ocultarRanking(); },
            cambiarRanking(tab) { cambiarTabRanking(tab); },
            abrirProgreso() { mostrarProgreso(); },
            cerrarProgreso() { ocultarProgreso(); },
            seleccionarSkin(id) { elegirSkin(id); },
            iniciarBossRush() { iniciarBossRush(); },
            iniciarRetoDiario() { iniciarRetoDiario(); },
            formatearTiempo(valor) { return formatearTiempo(valor); }
        });
        sincronizarUi({ record: textoRecord(1) });
    });

    function iniciar() {
        leerSonido();
        estado.nivelDesbloqueado = leerNivelDesbloqueado();
        actualizarProgreso();
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
