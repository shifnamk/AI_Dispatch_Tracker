// API Configuration for ServeTrack Frontend
// Version: 4.0.0 - WITH AUTHENTICATION

import axios from 'axios';

// Determine base URL at build time
const IS_PRODUCTION = import.meta.env.PROD;
const API_BASE_URL = IS_PRODUCTION ? 'https://servetrack.zainlee.net' : 'http://localhost:8000';

console.log('🚀 [ServeTrack v4.0] Mode:', IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('🌐 [ServeTrack v4.0] API Base:', API_BASE_URL);

// Configure axios defaults to send credentials
axios.defaults.withCredentials = true;

export const API_ENDPOINTS = {
  base: API_BASE_URL,
  
  // System
  status: `${API_BASE_URL}/api/status`,
  
  // Menu Items
  menuItems: `${API_BASE_URL}/api/menu_items`,
  addMenuItem: `${API_BASE_URL}/api/add_menu_item`,
  deleteMenuItem: (id) => `${API_BASE_URL}/api/delete_menu_item/${id}`,
  
  // Cameras
  cameras: `${API_BASE_URL}/api/cameras`,
  
  // Detection
  startDetection: `${API_BASE_URL}/api/start_detection`,
  stopDetection: `${API_BASE_URL}/api/stop_detection`,
  resetCounts: `${API_BASE_URL}/api/reset_counts`,
  
  // Counts
  counts: `${API_BASE_URL}/api/counts`,
  countsSSE: `${API_BASE_URL}/api/counts_sse`,
  
  // Video Feed
  videoFeed: `${API_BASE_URL}/api/video_feed`,
  videoFeedProcessed: `${API_BASE_URL}/api/video_feed_processed`,
  
  // Static files
  uploads: (path) => `${API_BASE_URL}/static/uploads/${path}`,
};

export const SOCKET_URL = API_BASE_URL;

export default API_BASE_URL;
