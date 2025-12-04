import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Camera, TrendingUp, Eye, Utensils, Clock, Zap, ArrowRight } from 'lucide-react';
import { API_ENDPOINTS, SOCKET_URL } from '../config/api';
import { generateDummyHistoricalData, calculateTotalCounts, getTodayCounts } from '../utils/dummyData';

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState({ detection_enabled: false, camera_connected: false });
  const [loading, setLoading] = useState(true);
  const [menuCount, setMenuCount] = useState(0);

  // Generate dummy historical data (7 days)
  const [historicalData] = useState(() => generateDummyHistoricalData());
  const [historicalTotals] = useState(() => calculateTotalCounts(historicalData));
  const [todayCounts] = useState(() => getTodayCounts(historicalData));

  useEffect(() => {
    fetchStatus();
    fetchCounts();
    fetchMenuItems();

    const socket = io(SOCKET_URL);
    socket.on('counts_update', (data) => {
      setCounts(data.counts || {});
    });

    return () => socket.disconnect();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.status);
      setStatus(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.counts);
      setCounts(response.data.counts || {});
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.menuItems);
      const items = response.data.items || response.data.menu_items || [];
      setMenuCount(items.length);
      console.log('Menu items count:', items.length);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  // Use historical totals for the display
  const totalCount = Object.values(historicalTotals).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255, 255, 255, 0.1)', borderTop: '4px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* Detection Status */}
        <div style={{ 
          background: 'rgba(96, 165, 250, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(96, 165, 250, 0.12)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(96, 165, 250, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03 }}>
            <Eye style={{ width: '140px', height: '140px', color: 'white' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(96, 165, 250, 0.15)', 
              border: '1px solid rgba(96, 165, 250, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Eye style={{ width: '24px', height: '24px', color: '#60a5fa' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Detection Status
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: 'white', marginBottom: '12px', lineHeight: 1 }}>
              {status.detection_enabled ? 'Active' : 'Inactive'}
            </div>
            <div style={{ 
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: status.detection_enabled ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: status.detection_enabled ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px',
              fontWeight: '600',
              color: status.detection_enabled ? '#34d399' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {status.detection_enabled ? '● Live' : '○ Stopped'}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ 
          background: 'rgba(139, 92, 246, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03 }}>
            <Utensils style={{ width: '140px', height: '140px', color: 'white' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(139, 92, 246, 0.15)', 
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Utensils style={{ width: '24px', height: '24px', color: '#a78bfa' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Menu Items
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: 'white', marginBottom: '4px', lineHeight: 1 }}>
              {menuCount}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
              Items configured
            </div>
          </div>
        </div>

        {/* Today's Count */}
        <div style={{ 
          background: 'rgba(251, 191, 36, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.12)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03 }}>
            <Clock style={{ width: '140px', height: '140px', color: 'white' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(251, 191, 36, 0.15)', 
              border: '1px solid rgba(251, 191, 36, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Clock style={{ width: '24px', height: '24px', color: '#fbbf24' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Last 7 Days
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: 'white', marginBottom: '4px', lineHeight: 1 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
              Total detections
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div style={{ 
          background: 'rgba(52, 211, 153, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(52, 211, 153, 0.12)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(52, 211, 153, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03 }}>
            <Zap style={{ width: '140px', height: '140px', color: 'white' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(52, 211, 153, 0.15)', 
              border: '1px solid rgba(52, 211, 153, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Zap style={{ width: '24px', height: '24px', color: '#34d399' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Accuracy Rate
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: 'white', marginBottom: '4px', lineHeight: 1 }}>
              95%
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
              AI confidence
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Quick Actions */}
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>
              Quick Actions
            </h3>
          </div>
          <div style={{ padding: '16px' }}>
            <Link
              to="/camera"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                marginBottom: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Camera style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Live Camera</span>
              </div>
              <ArrowRight style={{ width: '16px', height: '16px', color: 'rgba(255, 255, 255, 0.4)' }} />
            </Link>
            <Link
              to="/menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                marginBottom: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Utensils style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Menu Items</span>
              </div>
              <ArrowRight style={{ width: '16px', height: '16px', color: 'rgba(255, 255, 255, 0.4)' }} />
            </Link>
            <Link
              to="/analytics"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(52, 211, 153, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp style={{ width: '20px', height: '20px', color: '#34d399' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Analytics</span>
              </div>
              <ArrowRight style={{ width: '16px', height: '16px', color: 'rgba(255, 255, 255, 0.4)' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Live Detection Feed */}
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>
            Today's Detections
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px', marginBottom: 0 }}>
            Detection counts for today (Nov 19)
          </p>
        </div>
        <div style={{ padding: '24px' }}>
          {Object.keys(todayCounts).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Eye style={{ width: '64px', height: '64px', color: 'rgba(255, 255, 255, 0.1)', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>No detections yet</p>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>Start detection to see live results</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {Object.entries(todayCounts).map(([item, count]) => (
                <div key={item} style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                        {item}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ 
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#a78bfa'
                    }}>
                      {count}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '12px',
                    color: '#a78bfa',
                    fontWeight: '500'
                  }}>
                    85% Confidence
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
