import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { BarChart2, Eye, Utensils, TrendingUp, Calendar } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { generateDummyHistoricalData, calculateTotalCounts, formatForLineChart } from '../utils/dummyData';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const [counts, setCounts] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Generate dummy historical data (7 days)
  const [historicalData] = useState(() => generateDummyHistoricalData());
  const [historicalTotals] = useState(() => calculateTotalCounts(historicalData));

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [countsRes, menuRes] = await Promise.all([
        axios.get(API_ENDPOINTS.counts),
        axios.get(API_ENDPOINTS.menuItems)
      ]);
      
      setCounts(countsRes.data.counts || {});
      setMenuItems(menuRes.data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // Use historical totals for statistics
  const totalDetections = Object.values(historicalTotals).reduce((sum, count) => sum + count, 0);
  const itemTypes = Object.keys(historicalTotals).length;
  const avgPerItem = itemTypes > 0 ? (totalDetections / itemTypes).toFixed(1) : 0;
  const menuItemsCount = menuItems.length;

  // Doughnut Chart Data - Using historical totals (7 days)
  const doughnutData = {
    labels: Object.keys(historicalTotals),
    datasets: [{
      data: Object.values(historicalTotals),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(56, 189, 248, 0.6)',
        'rgba(168, 85, 247, 0.6)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderColor: '#1e293b',
      borderWidth: 2
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: 'white',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12
      }
    }
  };

  // Line Chart Data for 7-day history - using utility function
  const lineChartData = formatForLineChart(historicalData);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          padding: 15,
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: 'white',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          color: '#334155',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#334155',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          },
          stepSize: 5
        }
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #334155', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
          <BarChart2 style={{ width: '24px', height: '24px', display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
          Analytics Dashboard
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Real-time detection statistics and insights</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#15171c', border: '1px solid #2d2f36', borderRadius: '16px', padding: '24px', color: 'white', textAlign: 'center', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>
          <Eye style={{ width: '32px', height: '32px', margin: '0 auto 12px', color: '#3b82f6' }} />
          <h3 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>{totalDetections}</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Total Detections</p>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '11px' }}>Last 7 days</p>
        </div>

        <div style={{ background: '#15171c', border: '1px solid #2d2f36', borderRadius: '16px', padding: '24px', color: 'white', textAlign: 'center', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>
          <TrendingUp style={{ width: '32px', height: '32px', margin: '0 auto 12px', color: '#10b981' }} />
          <h3 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>{itemTypes}</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Detected Types</p>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '11px' }}>Unique items found</p>
        </div>

        <div style={{ background: '#15171c', border: '1px solid #2d2f36', borderRadius: '16px', padding: '24px', color: 'white', textAlign: 'center', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>
          <Utensils style={{ width: '32px', height: '32px', margin: '0 auto 12px', color: '#8b5cf6' }} />
          <h3 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>{menuItemsCount}</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Menu Items</p>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '11px' }}>Configured items</p>
        </div>

        <div style={{ background: '#15171c', border: '1px solid #2d2f36', borderRadius: '16px', padding: '24px', color: 'white', textAlign: 'center', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>
          <BarChart2 style={{ width: '32px', height: '32px', margin: '0 auto 12px', color: '#f59e0b' }} />
          <h3 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>{avgPerItem}</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Avg per Item</p>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '11px' }}>Average detections</p>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div style={{ backgroundColor: '#15171c', borderRadius: '16px', border: '1px solid #2d2f36', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)', marginBottom: '32px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #2d2f36', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar style={{ width: '20px', height: '20px', color: '#10b981' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>7-Day Detection Trend</h3>
        </div>
        <div style={{ padding: '24px', height: '350px' }}>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Item Distribution Chart */}
        <div style={{ backgroundColor: '#15171c', borderRadius: '16px', border: '1px solid #2d2f36', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #2d2f36', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Item Distribution</h3>
          </div>
          <div style={{ padding: '24px', height: '300px' }}>
            {Object.keys(historicalTotals).length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
                <BarChart2 style={{ width: '64px', height: '64px', color: '#2d2f36', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>No detection data available</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0' }}>Start detection to see data</p>
              </div>
            ) : (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            )}
          </div>
        </div>

        {/* Most Detected Items */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ width: '20px', height: '20px', color: '#667eea' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Detection Breakdown</h3>
          </div>
          <div style={{ padding: '20px' }}>
            {Object.keys(historicalTotals).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <TrendingUp style={{ width: '48px', height: '48px', color: '#334155', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>No detection data available</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(historicalTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([item, count], index) => {
                    const percentage = totalDetections > 0 ? ((count / totalDetections) * 100).toFixed(1) : 0;
                    return (
                      <div key={item}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '6px', 
                              background: '#8b5cf6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'white'
                            }}>
                              {index + 1}
                            </span>
                            <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: 'white' }}>{item}</h6>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#8b5cf6', marginRight: '8px' }}>
                              {count}
                            </span>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#24262d', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            background: '#8b5cf6',
                            width: `${percentage}%`,
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart2 style={{ width: '20px', height: '20px', color: '#667eea' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Detailed Statistics (Last 7 Days)</h3>
        </div>
        <div style={{ padding: '24px' }}>
          {Object.keys(historicalTotals).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <BarChart2 style={{ width: '64px', height: '64px', color: '#334155', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>No statistics available</p>
              <p style={{ fontSize: '12px', color: '#475569', margin: '8px 0 0 0' }}>Start detection to generate statistics</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Item Name</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Count (7 Days)</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Percentage</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(historicalTotals)
                    .sort(([, a], [, b]) => b - a)
                    .map(([item, count], index) => {
                      const percentage = totalDetections > 0 ? ((count / totalDetections) * 100).toFixed(1) : 0;
                      return (
                        <tr key={item} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: 'white' }}>#{index + 1}</td>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white' }}>{item}</td>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#0ea5e9', textAlign: 'right' }}>{count}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#94a3b8', textAlign: 'right' }}>{percentage}%</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 12px', 
                              borderRadius: '20px', 
                              backgroundColor: count > 0 ? '#14532d' : '#334155',
                              color: count > 0 ? '#86efac' : '#94a3b8',
                              fontSize: '12px', 
                              fontWeight: '600'
                            }}>
                              {count > 0 ? 'Detected' : 'None'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
