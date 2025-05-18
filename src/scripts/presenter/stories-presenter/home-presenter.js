import StoryModel from "../../models/story-model";
import AuthModel from "../../models/auth-model";

export default class HomePagePresenter {
  constructor(view) {
    this.view = view;
    this.isOffline = !navigator.onLine;
    
    window.addEventListener('online', () => {
      console.log('Online status changed: ONLINE');
      this.isOffline = false;
      this.refreshContent();
    });
    
    window.addEventListener('offline', () => {
      console.log('Online status changed: OFFLINE');
      this.isOffline = true;
      this.refreshContent();
    });
  }

  async refreshContent() {
    try {
      const stories = await StoryModel.getStories();
      this.view.displayStories(stories, this.isOffline);
      
      if (!this.isOffline) {
        this.initializeMapWithStories(stories);
      } else {
        console.log('Offline mode: Skipping map initialization');
        this.view.showOfflineMapMessage();
      }
    } catch (error) {
      console.error("Error refreshing content:", error);
    }
  }

  async init() {
    try {
      const isLoggedIn = AuthModel.isUserLoggedIn();
      this.view.updateLoginLink(isLoggedIn);

      const stories = await StoryModel.getStories();
      
      if (!this.isOffline) {
        this.initializeMapWithStories(stories);
      } else {
        console.log('Offline mode: Skipping map initialization');
        this.view.showOfflineMapMessage();
      }
      
      this.view.displayStories(stories, this.isOffline);
    } catch (error) {
      console.error("Error in HomePagePresenter:", error);
    }
  }
  
  initializeMapWithStories(stories) {
    try {
      if (typeof L === 'undefined' || !L) {
        console.error("Leaflet not available");
        this.view.showOfflineMapMessage();
        return;
      }
      
      console.log("Initializing map with stories...");
      
      this.view.initializeMap();
      
      if (!this.view.map) {
        console.error("Map initialization failed");
        return;
      }
      
      let markersAdded = 0;
      
      stories.forEach((story) => {
        if (story && story.lat !== undefined && story.lon !== undefined && 
            !isNaN(story.lat) && !isNaN(story.lon)) {
          
          this.view.addMapMarker(
            story.lat,
            story.lon,
            story.name,
            story.description,
            story.photoUrl
          );
          
          markersAdded++;
        }
      });
      
      console.log(`Added ${markersAdded} markers to map`);
      
      if (markersAdded === 0 && stories.length > 0) {
        console.log("No stories with valid coordinates found");
      }
    } catch (error) {
      console.error("Error initializing map with stories:", error);
      this.view.showOfflineMapMessage();
    }
  }
  
  async handleDelete(id) {
    try {
      const stories = await StoryModel.deleteStory(id);
      this.view.displayStories(stories, this.isOffline);
      
      if (!this.isOffline) {
        this.initializeMapWithStories(stories);
      }
    } catch (error) {
      console.error("Error deleting story:", error);
    }
  }
}
