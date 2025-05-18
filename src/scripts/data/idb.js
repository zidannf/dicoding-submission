import { openDB } from 'idb';

const DB_NAME = 'stories-db';
const STORE_NAME = 'stories';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    }
  });
}

export async function saveStory(story) {
  if (!story || !story.id) {
    console.error('Cannot save story: Invalid story data', story);
    return;
  }
  
  try {
    const db = await getDB();
    await db.put(STORE_NAME, story);
    console.log('Story saved to IndexedDB:', story.id);
  } catch (error) {
    console.error('Error saving story to IndexedDB:', error);
  }
}

export async function getAllStories() {
  try {
    const db = await getDB();
    const stories = await db.getAll(STORE_NAME);
    console.log(`Retrieved ${stories.length} stories from IndexedDB`);
    return stories;
  } catch (error) {
    console.error('Error getting all stories from IndexedDB:', error);
    return [];
  }
}

export async function getStoryById(id) {
  try {
    const db = await getDB();
    const story = await db.get(STORE_NAME, id);
    console.log('Story retrieved from IndexedDB:', id, story ? 'found' : 'not found');
    return story;
  } catch (error) {
    console.error(`Error getting story ${id} from IndexedDB:`, error);
    return null;
  }
}

export async function deleteStory(id) {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
    console.log('Story deleted from IndexedDB:', id);
  } catch (error) {
    console.error(`Error deleting story ${id} from IndexedDB:`, error);
  }
}