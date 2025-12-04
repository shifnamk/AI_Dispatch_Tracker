// Utility to load historical data from JSON file
// This ensures all pages show the same consistent data

import historicalDataJson from '../data/historicalData.json';

// Load historical data from JSON
export const loadHistoricalData = () => {
  const data = {};
  const last7Days = historicalDataJson.last7Days;
  
  // Transform JSON structure to the format we need
  // Get all unique item names
  const itemNames = Object.keys(last7Days[0].items);
  
  itemNames.forEach(itemName => {
    data[itemName] = last7Days.map(day => ({
      date: day.date,
      fullDate: day.fullDate,
      count: day.items[itemName] || 0
    }));
  });
  
  return data;
};

// For backward compatibility
export const generateDummyHistoricalData = loadHistoricalData;

// Calculate total counts from historical data (or use JSON precalculated)
export const calculateTotalCounts = (historicalData) => {
  // Use precalculated totals from JSON if available
  if (historicalDataJson.totals) {
    return historicalDataJson.totals;
  }
  
  // Fallback: calculate from data
  const totals = {};
  Object.keys(historicalData).forEach(itemName => {
    totals[itemName] = historicalData[itemName].reduce((sum, day) => sum + day.count, 0);
  });
  
  return totals;
};

// Get today's counts from historical data (last day in the array)
export const getTodayCounts = (historicalData) => {
  const todayCounts = {};
  
  Object.keys(historicalData).forEach(itemName => {
    const dataArray = historicalData[itemName];
    // Get the last day (today)
    const todayData = dataArray[dataArray.length - 1];
    todayCounts[itemName] = todayData ? todayData.count : 0;
  });
  
  return todayCounts;
};

// Get average daily counts (use JSON precalculated if available)
export const getAverageDailyCounts = (historicalData) => {
  // Use precalculated averages from JSON if available
  if (historicalDataJson.averages) {
    return historicalDataJson.averages;
  }
  
  // Fallback: calculate from data
  const averages = {};
  Object.keys(historicalData).forEach(itemName => {
    const total = historicalData[itemName].reduce((sum, day) => sum + day.count, 0);
    averages[itemName] = (total / historicalData[itemName].length).toFixed(1);
  });
  
  return averages;
};

// Format data for line chart
export const formatForLineChart = (historicalData) => {
  const labels = historicalData[Object.keys(historicalData)[0]].map(day => day.date);
  
  const datasets = Object.keys(historicalData).map((itemName, index) => {
    const colors = [
      { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }, // Blue for Water Bottle
      { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }  // Purple for Tea
    ];
    
    const color = colors[index % colors.length];
    
    return {
      label: itemName,
      data: historicalData[itemName].map(day => day.count),
      borderColor: color.border,
      backgroundColor: color.bg,
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    };
  });
  
  return { labels, datasets };
};

