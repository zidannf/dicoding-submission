import CONFIG from "../config";

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  STORIES_FULL: `${CONFIG.BASE_URL}/stories/:id`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
  NOTIFICATION: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

function convertBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const TokenManager = {
  getToken() {
    return localStorage.getItem("token");
  },
  setToken(token) {
    localStorage.setItem("token", token);
  },
  clearToken() {
    localStorage.removeItem("token");
  },
  hasToken() {
    return !!this.getToken();
  },
};

export async function getStories() {
  try {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    const response = await fetch(ENDPOINTS.STORIES, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        TokenManager.clearToken();
      }
      throw new Error(`Failed to fetch stories: ${response.status}`);
    }

    const data = await response.json();
    console.log("Stories response data:", data);
    return data.listStory || [];
  } catch (error) {
    console.error("Error fetching stories:", error);
    throw error;
  }
}

export async function getStoryDetail(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(ENDPOINTS.STORIES_FULL.replace(":id", id), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const responseJson = await response.json();
  return responseJson.story;
}
export async function addStory({ description, photo, lat, lon }) {
  try {
    const token = TokenManager.getToken();
    if (!token) throw new Error("Authentication required");

    const formData = new FormData();
    formData.append("description", description);
    
    if (photo instanceof Blob) {
      formData.append("photo", photo, "story.jpg");
    } else {
      throw new Error("Invalid photo format");
    }

    if (lat !== undefined && lon !== undefined) {
      formData.append("lat", lat.toString());
      formData.append("lon", lon.toString());
    }

    const response = await fetch(ENDPOINTS.STORIES, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error - addStory:", error);
    throw error;
  }
}

export async function addStoryGuest({ description, photo, lat, lon }) {
  try {
    const formData = new FormData();
    formData.append("description", description);
    
    if (photo instanceof Blob) {
      formData.append("photo", photo, "guest_story.jpg");
    } else {
      throw new Error("Photo is required");
    }

    if (lat !== undefined && lon !== undefined) {
      formData.append("lat", lat.toString());
      formData.append("lon", lon.toString());
    }

    const response = await fetch(ENDPOINTS.STORIES_GUEST, {
      method: "POST",
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.message || `Request failed with status ${response.status}`
      );
    }

    return responseData;
  } catch (error) {
    console.error("API Error - addStoryGuest:", error);
    throw error;
  }
}
export async function login(email, password) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Login response data:", data);

    const token = data?.loginResult?.token;

    if (!token) {
      throw new Error("Invalid response: No token received");
    }

    TokenManager.setToken(token);
    return token;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(error.message || "Login failed. Please try again.");
  }
}

export async function register(name, email, password) {
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Registration failed: ${response.status}`
      );
    }
    const data = await response.json();
    if (data.error) {
      throw new error(data.message || "Registration failed");
    }
    if (data.token) {
      TokenManager.setToken(data.token);
    }
    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw new Error(error.message || "Registration failed. Please try again.");
  }
}

export function logout() {
  TokenManager.clearToken();

  window.location.href = "/#/login";
}

export function isAuthenticated() {
  return TokenManager.hasToken();
}
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker tidak didukung di browser ini');
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    if (registration.installing === null && 
        registration.waiting === null && 
        registration.active === null) {
      console.log('Found redundant service worker, unregistering');
      await registration.unregister();
    }
  }

  try {
    const swUrl = '/sw.js';
    console.log('Registering service worker at:', swUrl);
    
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('Service Worker registered successfully:', registration);

    if (registration.active) {
      console.log('Service worker active state:', registration.active.state);
    } else if (registration.installing) {
      console.log('Service worker installing', registration.installing.state);
      await new Promise(resolve => {
        registration.installing.addEventListener('statechange', (e) => {
          console.log('Service worker state changed to:', e.target.state);
          if (e.target.state === 'activated') {
            resolve();
          }
        });
      });
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    
    try {
      console.log('Trying fallback registration with relative path...');
      const registration = await navigator.serviceWorker.register('./sw.js', {
        updateViaCache: 'none'
      });
      console.log('Service Worker fallback registration succeeded:', registration);
      return registration;
    } catch (fallbackError) {
      console.error('Service Worker fallback registration also failed:', fallbackError);
      throw error;
    }
  }
}

export async function subscribeUserToPush(registration) {
  try {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('Notifikasi ditolak oleh pengguna');
        throw new Error('Notification permission denied');
      }
    }

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log('Already subscribed:', existing);
      return;
    }
    
    console.log('Attempting to subscribe user to push...', registration);
    
    try {
      console.log('Registering with applicationServerKey...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertBase64ToUint8Array('BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk')
      });

      console.log('User is subscribed:', subscription);

      function arrayBufferToBase64(buffer) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
      }

      const sub = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth'))
        }
      };

      const token = TokenManager.getToken();
      if (!token) {
        console.log('No authentication token found, skipping server registration');
        return;
      }

      console.log('Mengirim data subscription ke server...');
      const response = await fetch(ENDPOINTS.NOTIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sub)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Push subscribe error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      console.log('Successfully subscribed to push notifications');
    } catch (subscribeError) {
      console.error('Push subscription error detail:', subscribeError.message, subscribeError.stack);
      if (subscribeError.name === 'NotAllowedError') {
        console.error('Push tidak bisa di HTTP, harus HTTPS');
        throw new Error('Push subscription requires HTTPS. Make sure you are on a secure connection.');
      }
      throw subscribeError;
    }
  } catch (error) {
    console.error('Failed to subscribe the user: ', error.message, error.stack);
    throw error;
  }
}

export async function unsubscribeUserFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {

    await subscription.unsubscribe();
    await fetch(ENDPOINTS.NOTIFICATION, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TokenManager.getToken()}`
      },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    return true;
  }
  return false;
}

export async function isUserSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}
