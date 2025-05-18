import {
  getStories,
  getStoryDetail,
  addStory,
  addStoryGuest,
} from "../data/api";

import { saveStory, getAllStories, deleteStory, getStoryById } from '../data/idb';

class StoryModel {
  static async getStories() {
    try {
      if (!navigator.onLine) {
        console.log('Offline mode detected, returning cached stories');
        return await getAllStories();
      }
      
      console.log('Online mode, fetching fresh stories');
      const stories = await getStories();
      
      for (const story of stories) {
        await saveStory(story);
      }
      return stories;
    } catch (error) {
      console.log('Error fetching stories, falling back to cached data:', error);
      return await getAllStories();
    }
  }

  static async getStoryDetail(id) {
    try {
      if (!navigator.onLine) {
        console.log('Offline mode, fetching story from IndexedDB:', id);
        return await getStoryById(id);
      }
      
      console.log('Online mode, fetching fresh story details:', id);
      const story = await getStoryDetail(id);
      
      if (story) {
        await saveStory(story);
      }
      return story;
    } catch (error) {
      console.log('Error fetching story details, checking cache:', error);
      return await getStoryById(id);
    }
  }

  static async addStory(storyData) {
    try {
      if (!navigator.onLine) {
        throw new Error('Cannot add story while offline');
      }
      
      const result = await addStory(storyData);
      if (result && result.story) {
        await saveStory(result.story);
      }
      return result;
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  }

  static async addStoryGuest(storyData) {
    try {
      if (!navigator.onLine) {
        throw new Error('Cannot add guest story while offline');
      }
      return await addStoryGuest(storyData);
    } catch (error) {
      console.error('Error adding guest story:', error);
      throw error;
    }
  }

  static async deleteStory(id) {
    try {
      await deleteStory(id);
      return await getAllStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
}

export default StoryModel;
