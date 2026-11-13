/* Service worker mínimo de LaGochaGaming.
   No cachea nada a propósito: GitHub Pages ya sirve los assets con ?v= y un
   cache propio provocaría versiones viejas. Solo muestra notificaciones. */
'use strict';

const ICONO = 'img/android-chrome-192x192.png';
const INSIGNIA = 'img/favicon-32x32.png';

// Clave pública VAPID, la misma que main.js. Es pública: solo sirve para
// suscribirse a los avisos. La privada vive en los secretos de Supabase.
const CLAVE_PUSH = 'BHbepRkacpclELRUIY7nONvxrRHsCehbtjBy6aX1KK32uBkT2m-mwwUCTxsue5npJhJ_bLBcRDlx5_adtq6hBsc';

function bytesClavePush(base64url) {
    const relleno = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + relleno).replace(/-/g, '+').replace(/_/g, '/');
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return bytes;
}

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(self.clients.claim());
});

self.addEventListener('push', (evento) => {
    let datos = {};
    try {
        datos = evento.data ? evento.data.json() : {};
    } catch (e) {
        datos = {};
    }
    const titulo = datos.titulo || 'LaGochaGaming';
    const cuerpo = datos.cuerpo || 'Hay novedades en el directo.';
    evento.waitUntil(self.registration.showNotification(titulo, {
        body: cuerpo,
        icon: ICONO,
        badge: INSIGNIA,
        tag: datos.tag || 'gochi',
        data: { url: datos.url || '/#stream' }
    }));
});

// Chrome rota el endpoint de vez en cuando: se vuelve a suscribir solo. La fila
// del servidor se refresca en la siguiente visita (main.js, avisos.sincronizar).
self.addEventListener('pushsubscriptionchange', (evento) => {
    evento.waitUntil((async () => {
        try {
            await self.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: bytesClavePush(CLAVE_PUSH)
            });
        } catch (e) { /* sin permiso o sin soporte: se reintenta al volver */ }
    })());
});

self.addEventListener('notificationclick', (evento) => {
    evento.notification.close();
    const url = (evento.notification.data && evento.notification.data.url) || '/#stream';
    evento.waitUntil((async () => {
        const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const abierta = ventanas.find((cliente) => {
            try {
                return new URL(cliente.url).origin === self.location.origin;
            } catch (e) {
                return false;
            }
        });
        if (abierta) {
            await abierta.focus();
            if ('navigate' in abierta) {
                try { await abierta.navigate(url); } catch (e) { /* pestaña no navegable */ }
            }
            return;
        }
        await self.clients.openWindow(url);
    })());
});
