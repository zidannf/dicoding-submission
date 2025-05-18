import HomePagePresenter from "../../presenter/stories-presenter/home-presenter";
import AuthModel from "../../models/auth-model";

export default class HomePage {
  constructor() {
    this.presenter = new HomePagePresenter(this);
  }

  async render() {
    return `
        <section class="container">
          <h1>Home Page</h1>
          <div id="map" style="height: 400px;"></div>
          <div id="stories-list"></div>
        </section>
      `;
  }

  async afterRender() {
    const isLoggedIn = AuthModel.isUserLoggedIn();
    this.updateLoginLink(isLoggedIn);

    if (!isLoggedIn) {
      window.location.hash = "#/login";
      return;
    }

    await this.presenter.init();
  }

  displayStories(stories, isOffline = false) {
    const storiesContainer = document.querySelector("#stories-list");
    storiesContainer.innerHTML = '';
    if (isOffline) {
      if (stories.length === 0) {
        storiesContainer.innerHTML = '<div class="error-message">Tidak ada data offline yang tersimpan.</div>';
        return;
      } else {
        storiesContainer.innerHTML = '<div class="offline-notice">Menampilkan data dari cache (offline mode)</div>';
      }
    }
    stories.forEach((story) => {
      const storyItem = document.createElement("div");
      storyItem.classList.add("story-item");
      storyItem.innerHTML = `
        <img src="${story.photoUrl}" alt="${story.name}" onerror="this.src='/favicon.png'; this.alt='Image not available offline';" />
        <h3>${story.name}</h3>
        <p>${story.description}</p>
        <p>Created At: ${new Date(story.createdAt).toLocaleString()}</p>
        <a href="#/detailstory/${story.id}" class="detail-button">Lihat Detail</a>
        <button class="delete-story-btn" data-id="${story.id}">Hapus</button>
      `;
      storiesContainer.appendChild(storyItem);
    });
    storiesContainer.querySelectorAll('.delete-story-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await this.presenter.handleDelete(id);
      });
    });
  }

  showOfflineMapMessage() {
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="offline-map-message">
          <h3>anda sedang offline</h3>
          <p>unable to connect</p>
        </div>
      `;
      mapContainer.style.display = 'flex';
      mapContainer.style.justifyContent = 'center';
      mapContainer.style.alignItems = 'center';
      mapContainer.style.backgroundColor = '#f8f9fa';
      mapContainer.style.border = '1px solid #ddd';
      mapContainer.style.borderRadius = '8px';
      mapContainer.style.padding = '20px';
      mapContainer.style.textAlign = 'center';
    }
  }

  initializeMap() {
    try {
      const mapContainer = document.getElementById("map");
      if (!mapContainer) {
        console.error("Map container not found!");
        return;
      }
      
      mapContainer.innerHTML = '';
      mapContainer.style = '';
      mapContainer.style.height = '400px';
      
      if (typeof L === 'undefined' || !L || !L.map) {
        console.error("Leaflet library not loaded or not fully initialized!");
        this.showOfflineMapMessage();
        return;
      }
      
      console.log("Initializing map with Leaflet");
      
      if (this.map) {
        try {
          this.map.remove();
          this.map = null;
          console.log("Removed existing map instance");
        } catch (error) {
          console.error("Error removing existing map:", error);
        }
      }

      this.map = L.map("map", {
        worldCopyJump: false,
        maxBounds: [
          [-90, -180],
          [90, 180],
        ],
        maxBoundsViscosity: 1.0,
      }).setView([-2.5, 118], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(this.map);
      
      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error in initializeMap:", error);
      this.showOfflineMapMessage();
    }
  }

  addMapMarker(lat, lng, title, description, photoUrl) {
    try {
      if (!this.map) {
        console.warn("Map not initialized - skipping marker");
        return;
      }
      
      if (!lat || !lng) {
        console.warn("Invalid coordinates for marker:", lat, lng);
        return;
      }

      console.log(`Adding marker at ${lat}, ${lng} for ${title}`);
      const marker = L.marker([lat, lng]).addTo(this.map);

      const popupContent = `
          <div style="text-align: center;">
            <img src="${photoUrl}" alt="${title}" style="width: 100px; height: auto; margin-bottom: 5px;" />
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
        `;

      marker.bindPopup(popupContent);
    } catch (error) {
      console.error("Error adding marker:", error);
    }
  }

  updateLoginLink(isLoggedIn) {
    const loginLink = document.querySelector("#login-link");

    if (!loginLink) {
      console.error("Login link not found!");
      return;
    }

    const newLoginLink = loginLink.cloneNode(true);
    loginLink.replaceWith(newLoginLink);

    if (isLoggedIn) {
      newLoginLink.textContent = "Logout";
      newLoginLink.setAttribute("href", "#");
      newLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        AuthModel.logout();
        this.updateLoginLink(false);
        window.location.hash = "#/login";
      });
    } else {
      newLoginLink.textContent = "Login";
      newLoginLink.setAttribute("href", "#/login");
    }
  }
}
