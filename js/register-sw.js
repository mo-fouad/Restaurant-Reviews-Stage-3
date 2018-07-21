// Base don the link below
// https://developers.google.com/web/fundamentals/primers/service-workers/

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function (reg) {
            console.log('Service worker registered.');

            if (!navigator.serviceWorker.controller) {
                return;
            }

            if (reg.waiting) {
                navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
            }

            if (reg.installing) {
                navigator.serviceWorker.addEventListener('statechange', function () {
                    if (navigator.serviceWorker.controller.state == 'installed') {
                        navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
                    }
                });
            }

            reg.addEventListener('updatefound', function () {
                navigator.serviceWorker.addEventListener('statechange', function () {
                    if (navigator.serviceWorker.controller.state == 'installed') {
                        navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
                    }
                });
            });

        }).catch(function (err) {
            console.log('Service worker registration failed ->' + err );
        });
    });
}



// Tracing if app is online or offline

window.addEventListener('online', onOnline);
window.addEventListener('offline', onOffline);
function onOnline() {
    console.log('Going online');
    DBHelper.submitOfflineReviews();
}

function onOffline() {
    console.log('Going offline');
}

