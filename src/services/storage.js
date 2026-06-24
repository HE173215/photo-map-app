import AsyncStorage from '@react-native-async-storage/async-storage';

const PHOTOS_KEY = '@photo_map_app_photos';

/**
 * Get all photos from storage
 * @returns {Promise<Array>} List of photo objects
 */
export const getPhotos = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PHOTOS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error fetching photos from AsyncStorage:', error);
    return [];
  }
};

/**
 * Save photos to storage
 * @param {Array} photos - List of photo objects to save
 * @returns {Promise<boolean>} Success status
 */
export const savePhotos = async (photos) => {
  try {
    const jsonValue = JSON.stringify(photos);
    await AsyncStorage.setItem(PHOTOS_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving photos to AsyncStorage:', error);
    return false;
  }
};
