// CSS imports
import '../styles/styles.css';

import App from './views/app';

import { registerServiceWorker, isUserSubscribed, subscribeUserToPush, unsubscribeUserFromPush } from './data/api';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('App starting...');
    
    // Bersihkan service worker lama jika ada
    await cleanupServiceWorkers();
    
    // Daftarkan service worker dan tunggu pendaftarannya selesai
    const swRegistration = await registerServiceWorker();
    console.log('Service worker registration result:', swRegistration);
    
    // Periksa pembaruan service worker
    if (swRegistration && 'update' in swRegistration) {
      console.log('Checking for SW updates...');
      try {
        await swRegistration.update();
        console.log('Service worker update check completed');
      } catch (updateError) {
        console.warn('Service worker update check failed:', updateError);
      }
    }
    
    // Inisialisasi App SPA
    const app = new App({
      content: document.querySelector('#main-content'),
      drawerButton: document.querySelector('#drawer-button'),
      navigationDrawer: document.querySelector('#navigation-drawer'),
    });
    await app.renderPage();
    
    // Routing hashchange
    window.addEventListener('hashchange', async () => {
      await app.renderPage();
    });

    // Skip to Content handler
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.setAttribute('tabindex', '-1'); // supaya bisa difokuskan
          mainContent.focus();
        }
      });
    }
    
    // Setup push notification button dengan service worker yang sudah terdaftar
    await setupPushButton(swRegistration);
  } catch (error) {
    console.error('Error initializing app:', error);
  }
});

// Fungsi untuk membersihkan service worker redundant
async function cleanupServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  
  console.log('Checking for redundant service workers...');
  const registrations = await navigator.serviceWorker.getRegistrations();
  
  for (const registration of registrations) {
    console.log('Found service worker:', registration);
    
    // Cek status registration
    if (registration.installing === null && 
        registration.waiting === null &&
        registration.active === null) {
      console.warn('Found redundant worker, unregistering');
      await registration.unregister();
      console.log('Redundant worker unregistered');
    }
  }
}

async function setupPushButton(serviceWorkerReg) {
  try {
    console.log('Starting setupPushButton');
    
    const btn = document.getElementById('push-toggle-btn');
    if (!btn) {
      console.error('Button element not found!');
      return;
    }
    
    console.log('Button found:', btn);
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      btn.textContent = 'Push Not Supported';
      btn.disabled = true;
      return;
    }
    
    // Gunakan service worker registration yang diberikan atau tunggu yang sudah aktif
    let registration = serviceWorkerReg;
    if (!registration) {
      try {
        console.log('No SW registration provided, waiting for active SW...');
        registration = await navigator.serviceWorker.ready;
        console.log('Got active service worker:', registration);
      } catch (error) {
        console.error('Failed to get service worker registration:', error);
        btn.textContent = 'SW Error';
        btn.disabled = true;
        return;
      }
    }
    
    // Periksa service worker state
    if (registration.active) {
      console.log('Active SW state:', registration.active.state);
    } else {
      console.warn('No active service worker found');
      
      // Tunggu jika ada yang masih installing
      if (registration.installing) {
        console.log('Waiting for service worker to be installed...');
        await new Promise(resolve => {
          registration.installing.addEventListener('statechange', event => {
            console.log('Service worker state changed:', event.target.state);
            if (event.target.state === 'activated') {
              resolve();
            }
          });
        });
        console.log('Service worker now active');
      } else {
        console.error('No installing worker, push notifications may not work');
      }
    }

    async function updateButton() {
      try {
        console.log('Updating button state...');
        const subscribed = await isUserSubscribed();
        console.log('User subscription status:', subscribed);
        btn.textContent = subscribed ? 'Unsubscribe' : 'Subscribe';
        btn.disabled = false;
      } catch (error) {
        console.error('Error updating button:', error);
        btn.textContent = 'Subscribe';
        btn.disabled = false;
      }
    }

    // Tambahkan listener langsung ke elemen button
    if (btn.getAttribute('data-listener-added') !== 'true') {
      btn.setAttribute('data-listener-added', 'true');
      
      btn.addEventListener('click', async function buttonClickHandler(event) {
        try {
          console.log('Button clicked!', event);
          event.preventDefault();
          
          btn.disabled = true; // Disable tombol saat proses
          const subscribed = await isUserSubscribed();
          if (subscribed) {
            console.log('Unsubscribing user...');
            await unsubscribeUserFromPush();
          } else {
            console.log('Subscribing user...');
            await subscribeUserToPush(registration);
          }
        } catch (error) {
          console.error('Push subscription error:', error);
        } finally {
          await updateButton();
        }
      });
      
      console.log('Button click handler added');
    } else {
      console.log('Button listener already added');
    }

    await updateButton();
  } catch (error) {
    console.error('Push button setup error:', error);
  }
}
