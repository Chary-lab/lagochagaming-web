/* Copia de seguridad de LaGochaGaming sin pg_dump ni Docker.
 *
 * Uso:
 *   node scripts/backup.js                 (todo: esquema + datos)
 *   node scripts/backup.js --archivos      (además descarga las fotos del bucket)
 *   node scripts/backup.js --salida=D:/respaldos
 *
 * Genera una carpeta con fecha y hora dentro de `backups/` (ignorada por git):
 *   esquema.sql    tablas, constraints, índices, funciones, triggers, políticas,
 *                  grants, extensiones y jobs de pg_cron
 *   datos.json     todas las filas de las tablas de `public`
 *   manifest.json  ref, fecha, versión, conteos y sha256 de cada archivo
 *
 * Restaurar: crear un proyecto vacío, ejecutar esquema.sql y luego insertar las
 * filas de datos.json (ver docs/operaciones.md §10). No sustituye al backup de
 * Supabase: es la copia que controlas tú.
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const REF = 'cydiyaacnyydprgffmkq';
const argSalida = process.argv.find((a) => a.startsWith('--salida='));
const bajarArchivos = process.argv.includes('--archivos');

const os = require('os');

// En Windows `supabase` es un .cmd y solo se puede lanzar con shell; para no
// pelear con el escapado del SQL se pasa por archivo temporal con -f.
let contadorTemporal = 0;
function ejecutarSupabase(sql) {
    const ruta = path.join(os.tmpdir(), 'gocha-backup-' + process.pid + '-' + (++contadorTemporal) + '.sql');
    fs.writeFileSync(ruta, sql, 'utf8');
    try {
        const comando = 'supabase db query --remote=' + REF + ' --read-only --agent no --output-format json -f "' + ruta + '"';
        return execFileSync(comando, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true });
    } finally {
        try { fs.unlinkSync(ruta); } catch (e) { /* nada */ }
    }
}

function consulta(sql) {
    const salida = ejecutarSupabase(sql);
    const inicio = salida.indexOf('[');
    const fin = salida.lastIndexOf(']');
    if (inicio < 0) return [];
    return JSON.parse(salida.slice(inicio, (fin < 0 ? salida.length : fin + 1)));
}

function texto(sql) {
    const filas = consulta(sql);
    return filas.length ? Object.values(filas[0])[0] : null;
}

function sha256(contenido) {
    return crypto.createHash('sha256').update(contenido).digest('hex');
}

function bloques(titulo, contenido) {
    if (!contenido) return [];
    return ['', '-- === ' + titulo + ' ===', contenido];
}

(async () => {
    const ahora = new Date();
    const marca = ahora.toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const destino = argSalida ? path.resolve(argSalida) : path.join(RAIZ, 'backups', marca);
    fs.mkdirSync(destino, { recursive: true });

    console.log('Copia en ' + destino);

    const tablas = consulta(`
        select table_name::text as t
          from information_schema.tables
         where table_schema = 'public' and table_type = 'BASE TABLE'
         order by table_name`).map((f) => f.t);

    console.log('Tablas: ' + tablas.length);

    // ---------- esquema ----------
    const partes = ['-- LaGochaGaming · esquema generado por scripts/backup.js el ' + ahora.toISOString()];

    const extensiones = texto(`
        select string_agg('create extension if not exists ' || quote_ident(extname) || ' with schema ' || quote_ident(n.nspname) || ';', E'\\n')
          from pg_extension e join pg_namespace n on n.oid = e.extnamespace
         where extname <> 'plpgsql'`);
    partes.push(...bloques('extensiones', extensiones));

    const creacion = consulta(`
        select format(
            'create table if not exists public.%I (%s);',
            c.relname,
            (select string_agg(
                quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
                || case when a.attnotnull then ' not null' else '' end
                || case when ad.adbin is not null then ' default ' || pg_get_expr(ad.adbin, ad.adrelid) else '' end,
                ', ' order by a.attnum)
               from pg_attribute a
               left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
              where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped)
        ) as s
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r'
         order by c.relname`).map((f) => f.s + ';').join('\n');
    partes.push(...bloques('tablas', creacion));

    const constraints = consulta(`
        select format('alter table %s add constraint %I %s;', conrelid::regclass, conname, pg_get_constraintdef(c.oid)) as s
          from pg_constraint c join pg_namespace n on n.oid = c.connamespace
         where n.nspname = 'public' and conrelid::regclass::text like 'public.%'
         order by conrelid::regclass::text, conname`).map((f) => f.s).join('\n');
    partes.push(...bloques('constraints', constraints));

    const indices = consulta(`
        select indexdef || ';' as s from pg_indexes where schemaname = 'public' order by indexname`)
        .map((f) => f.s).join('\n');
    partes.push(...bloques('índices', indices));

    const funciones = consulta(`
        select pg_get_functiondef(p.oid) || ';' as s
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.prokind = 'f'
         order by p.proname`).map((f) => f.s).join('\n\n');
    partes.push(...bloques('funciones', funciones));

    const grants = consulta(`
        select format('grant execute on function public.%I(%s) to %I;',
                      p.proname, pg_get_function_identity_arguments(p.oid), r.rolname) as s
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(p.proacl) a
          join pg_roles r on r.oid = a.grantee
         where n.nspname = 'public' and a.privilege_type = 'EXECUTE'
           and r.rolname in ('anon', 'authenticated', 'service_role')
         order by p.proname, r.rolname`).map((f) => f.s).join('\n');
    partes.push(...bloques('grants de función', grants));

    const triggers = consulta(`
        select pg_get_triggerdef(t.oid) || ';' as s
          from pg_trigger t join pg_class c on c.oid = t.tgrelid
         where not t.tgisinternal order by 1`).map((f) => f.s).join('\n');
    partes.push(...bloques('triggers', triggers));

    const politicas = consulta(`
        select format(
            'create policy %I on public.%I as %s for %s to %s%s%s;',
            policyname, tablename, permissive, cmd,
            array_to_string(roles, ', '),
            case when qual is not null then ' using (' || qual || ')' else '' end,
            case when with_check is not null then ' with check (' || with_check || ')' else '' end
        ) as s
          from pg_policies where schemaname = 'public' order by tablename, policyname`).map((f) => f.s).join('\n');
    partes.push(...bloques('políticas RLS', politicas));

    const rls = consulta(`
        select format('alter table public.%I %s row level security;', c.relname,
                      case when c.relrowsecurity then 'enable' else 'disable' end) as s
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
         order by c.relname`).map((f) => f.s).join('\n');
    partes.push(...bloques('RLS activo', rls));

    const cron = consulta(`
        select format('select cron.schedule(%L, %L, %L);', jobname, schedule, command) as s
          from cron.job where jobname is not null order by jobname`).map((f) => f.s).join('\n');
    partes.push(...bloques('pg_cron', cron));

    const esquema = partes.join('\n');
    const rutaEsquema = path.join(destino, 'esquema.sql');
    fs.writeFileSync(rutaEsquema, esquema, 'utf8');
    console.log('esquema.sql: ' + (esquema.length / 1024).toFixed(1) + ' KB');

    // ---------- datos ----------
    const datos = {};
    const conteos = {};
    for (const tabla of tablas) {
        const filas = consulta(`select coalesce(jsonb_agg(t), '[]'::jsonb) as filas from public."${tabla}" t`);
        datos[tabla] = filas.length ? filas[0].filas : [];
        conteos[tabla] = datos[tabla].length;
    }
    const rutaDatos = path.join(destino, 'datos.json');
    fs.writeFileSync(rutaDatos, JSON.stringify(datos, null, 1), 'utf8');
    console.log('datos.json: ' + tablas.length + ' tablas, ' + Object.values(conteos).reduce((a, b) => a + b, 0) + ' filas');

    // ---------- archivos del bucket (opcional) ----------
    let archivos = 0;
    if (bajarArchivos) {
        const objetos = consulta(`
            select name::text as n from storage.objects where bucket_id = 'fotos-galeria' order by name`);
        const carpeta = path.join(destino, 'fotos');
        fs.mkdirSync(carpeta, { recursive: true });
        for (const { n } of objetos) {
            const url = 'https://' + REF + '.supabase.co/storage/v1/object/public/fotos-galeria/' + n.split('/').map(encodeURIComponent).join('/');
            try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const buffer = Buffer.from(await res.arrayBuffer());
                const ruta = path.join(carpeta, n.replace(/\//g, '__'));
                fs.writeFileSync(ruta, buffer);
                archivos++;
            } catch (e) { /* se salta el que falle */ }
        }
        console.log('fotos: ' + archivos + ' archivos descargados');
    }

    // ---------- manifiesto ----------
    const version = fs.readFileSync(path.join(RAIZ, 'VERSION'), 'utf8').trim();
    const manifiesto = {
        proyecto: REF,
        fecha: ahora.toISOString(),
        version_sitio: version,
        tablas: conteos,
        total_filas: Object.values(conteos).reduce((a, b) => a + b, 0),
        fotos: archivos,
        archivos: {
            'esquema.sql': { bytes: fs.statSync(rutaEsquema).size, sha256: sha256(fs.readFileSync(rutaEsquema)) },
            'datos.json': { bytes: fs.statSync(rutaDatos).size, sha256: sha256(fs.readFileSync(rutaDatos)) }
        }
    };
    fs.writeFileSync(path.join(destino, 'manifest.json'), JSON.stringify(manifiesto, null, 2), 'utf8');
    console.log('manifest.json escrito');
    console.log('\nCopia terminada: ' + destino);
})().catch((e) => {
    console.error('BACKUP: fallo ->', e.message);
    process.exit(1);
});
