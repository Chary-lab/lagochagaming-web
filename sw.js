/* Service worker mínimo de LaGochaGaming.
   No cachea nada a propósito: GitHub Pages ya sirve los assets con ?v= y un
   cache propio provocaría versiones viejas. Solo muestra notificaciones. */
'use strict';

const ICONO = 'img/android-chrome-192x192.png';
const INSIGNIA = 'img/favicon-32x32.png';

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
