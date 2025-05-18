import DetailPagePresenter from "../../presenter/stories-presenter/detail-presenter";

let map;

export default class DetailStoryPage {
  constructor() {
    this.presenter = new DetailPagePresenter(this);
  }

  async render() {
    return `
      <section class="container">
        <a href="#/" class="back-button">Back</a>
        <h1 id="story-title">Loading...</h1>
        <img id="story-image" alt="Story Image" style="max-width:100%; margin-bottom:20px;" />
        <p id="story-description"></p>
        <p id="story-created-at"></p>
        <p id="story-location"></p>
        <div id="map" style="height: 400px; margin-top: 20px;"></div> 
      </section>
    `;
  }

  async afterRender() {
    const id = window.location.hash.split("/")[2];
    this.presenter.init(id);
  }

  displayStory(story) {
    document.getElementById("story-title").innerText = story.name;
    document.getElementById("story-image").src = story.photoUrl;
    document.getElementById("story-image").onerror = function() {
      this.src = '/favicon.png';
      this.alt = 'Image not available offline';
    };
    document.getElementById("story-description").innerText = story.description;
    document.getElementById("story-created-at").innerText = `Created At: ${new Date(story.createdAt).toLocaleString()}`;
    
    if (story.lat && story.lon) {
      document.getElementById("story-location").innerText = `Location: ${story.lat}, ${story.lon}`;
    } else {
      document.getElementById("story-location").innerText = 'Lokasi tidak tersedia';
    }
  }

  showErrorMessage(message) {
    document.getElementById("story-title").innerText = 'Error';
    document.getElementById("story-description").innerHTML = `
      <div class="error-message">${message}</div>
    `;
    document.getElementById("story-image").style.display = 'none';
    document.getElementById("story-created-at").style.display = 'none';
    document.getElementById("story-location").style.display = 'none';
    
    // Hide map container
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
      mapContainer.style.display = 'none';
    }
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
  
  showNoCoordinatesMessage() {
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="offline-map-message">
          <h3>Lokasi tidak tersedia</h3>
          <p>Story ini tidak memiliki data koordinat.</p>
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

  initializeMap(lat, lon, title, description, photoUrl) {
    if (map) {
      map.remove();
      map = null;
    }
    
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
      mapContainer.innerHTML = '';
      mapContainer.style = '';
      mapContainer.style.height = '400px';
      mapContainer.style.marginTop = '20px';
    }

    if (!window.L) {
      console.error("Leaflet library not loaded!");
      this.showOfflineMapMessage();
      return;
    }

    map = L.map("map").setView([lat, lon], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([lat, lon]).addTo(map);
    const popupContent = `
      <div style="text-align: center;">
        <img src="${photoUrl}" alt="${title}" style="width: 100px; height: auto; margin-bottom: 5px;" />
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    `;
    marker.bindPopup(popupContent).openPopup();
  }
}
