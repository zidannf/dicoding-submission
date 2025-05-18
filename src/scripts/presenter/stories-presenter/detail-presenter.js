import StoryModel from "../../models/story-model";

export default class DetailPagePresenter {
  constructor(view) {
    this.view = view;
    this.isOffline = !navigator.onLine;
    
    window.addEventListener('online', () => {
      console.log('Detail page - Online status changed: ONLINE');
      this.isOffline = false;
      if (this.currentStoryId) {
        this.init(this.currentStoryId);
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('Detail page - Online status changed: OFFLINE');
      this.isOffline = true;
      if (this.currentStoryId) {
        this.init(this.currentStoryId);
      }
    });
  }

  async init(id) {
    try {
      this.currentStoryId = id;
      const story = await StoryModel.getStoryDetail(id);
      
      if (!story) {
        this.view.showErrorMessage('Story not found');
        return;
      }
      
      this.view.displayStory(story);
      
      if (!this.isOffline && story.lat && story.lon) {
        this.view.initializeMap(story.lat, story.lon, story.name, story.description, story.photoUrl);
      } else if (this.isOffline) {
        this.view.showOfflineMapMessage();
      } else {
        this.view.showNoCoordinatesMessage();
      }
    } catch (error) {
      console.error("Error in DetailPagePresenter:", error);
      this.view.showErrorMessage('Failed to load story details');
    }
  }
}
