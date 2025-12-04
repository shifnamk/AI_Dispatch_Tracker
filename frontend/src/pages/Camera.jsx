import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Camera as CameraIcon, Video, AlertCircle, CheckCircle, Maximize, Eye, BarChart2, Clock, VideoOff, Loader } from 'lucide-react';
import { API_ENDPOINTS, SOCKET_URL } from '../config/api';
import { loadHistoricalData, getTodayCounts } from '../utils/dummyData';

export default function Camera() {
  const [cameraUrl, setCameraUrl] = useState('rtsp://100.106.21.91:8554/Dispatch');
  const [status, setStatus] = useState({ detection_enabled: false, camera_connected: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load dummy data from JSON
  const [historicalData] = useState(() => loadHistoricalData());
  const [todayCounts] = useState(() => getTodayCounts(historicalData));
  const [counts, setCounts] = useState(todayCounts);
  
  const [fps, setFps] = useState(0);
  const [recentActivity, setRecentActivity] = useState([
    { time: '5:46:26 PM', items: 'Tea (15), Water Bottle (10)' },
    { time: '5:45:12 PM', items: 'Tea (14), Water Bottle (10)' },
    { time: '5:43:58 PM', items: 'Tea (13), Water Bottle (9)' },
    { time: '5:42:34 PM', items: 'Tea (12), Water Bottle (9)' },
    { time: '5:41:19 PM', items: 'Tea (11), Water Bottle (8)' }
  ]);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [streamLoading, setStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());

  useEffect(() => {
    fetchStatus();
    
    const socket = io(SOCKET_URL);

    socket.on('counts_update', (data) => {
      setCounts(data.counts || {});
      // Add to activity log
      if (data.counts && Object.keys(data.counts).length > 0) {
        const newActivity = {
          time: new Date().toLocaleTimeString(),
          items: Object.entries(data.counts).map(([name, count]) => `${name} (${count})`).join(', ')
        };
        setRecentActivity(prev => [newActivity, ...prev].slice(0, 10));
      }
    });

    socket.on('status_update', (data) => {
      setStatus(prev => ({ ...prev, ...data }));
    });

    // Simulate FPS counter
    const fpsInterval = setInterval(() => {
      if (status.detection_enabled) {
        setFps(Math.floor(25 + Math.random() * 10)); // 25-35 FPS
      } else {
        setFps(0);
      }
    }, 1000);

    return () => {
      socket.disconnect();
      clearInterval(fpsInterval);
    };
  }, [status.detection_enabled]);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.status);
      setStatus(response.data);
      if (response.data.camera_url) setCameraUrl(response.data.camera_url);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFullscreen = () => {
    const container = document.getElementById('camera-container');
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const totalDetections = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      {/* Left Column - Camera Feed */}
      <div>
        {error && (
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle style={{ width: '20px', height: '20px', color: '#fca5a5' }} />
            <span style={{ color: '#fca5a5', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#14532d', border: '1px solid #166534', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle style={{ width: '20px', height: '20px', color: '#86efac' }} />
            <span style={{ color: '#86efac', fontSize: '14px' }}>{success}</span>
          </div>
        )}

        {/* Camera Feed */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Video style={{ width: '20px', height: '20px', color: '#667eea' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Live Camera Feed</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ 
                padding: '6px 12px',
                backgroundColor: status.detection_enabled ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: status.detection_enabled ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: status.detection_enabled ? '#34d399' : 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: status.detection_enabled ? '#34d399' : 'rgba(255, 255, 255, 0.3)',
                  boxShadow: status.detection_enabled ? '0 0 8px #34d399' : 'none'
                }}></div>
                {status.detection_enabled ? 'Running' : 'Offline'}
              </div>
              <button
                onClick={handleFullscreen}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }}
              >
                <Maximize style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
          
          <div id="camera-container" style={{ position: 'relative', backgroundColor: '#0f172a', minHeight: '400px' }}>
            {streamError ? (
              // Camera Offline State
              <div style={{
                width: '100%',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px'
              }}>
                <VideoOff style={{ width: '64px', height: '64px', color: '#ef4444', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                  Camera Offline
                </h3>
                <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: '400px', marginBottom: '16px', fontSize: '14px' }}>
                  The camera stream is currently unavailable. Please ensure the camera is connected and the detection system is running.
                </p>
                <button
                  onClick={() => {
                    setStreamError(false);
                    setStreamLoading(true);
                    setStreamKey(Date.now());
                  }}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: '#2563eb',
                    color: 'white',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
                >
                  Retry Connection
                </button>
              </div>
            ) : streamLoading ? (
              // Loading State
              <div style={{
                width: '100%',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px'
              }}>
                <Loader style={{ 
                  width: '48px', 
                  height: '48px', 
                  color: '#60a5fa', 
                  marginBottom: '16px',
                  animation: 'spin 1s linear infinite'
                }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                  Connecting to Camera...
                </h3>
                <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>
                  Please wait while we establish the video stream
                </p>
              </div>
            ) : (
              // Camera Active State
              <>
                <img
                  key={streamKey}
                  src={`${API_ENDPOINTS.videoFeedProcessed}?t=${streamKey}`}
                  alt="Live Camera"
                  style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block' }}
                  onLoad={() => {
                    setStreamLoading(false);
                    setStreamError(false);
                  }}
                  onError={() => {
                    setStreamLoading(false);
                    setStreamError(true);
                  }}
                />
                
                {/* FPS & Detection Counter Overlay */}
                {status.detection_enabled && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>FPS: <span style={{ color: '#43e97b', fontWeight: '600' }}>{fps}</span></div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Detections: <span style={{ color: '#667eea', fontWeight: '600' }}>{totalDetections}</span></div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Right Column - Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Current Detections */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye style={{ width: '16px', height: '16px', color: '#667eea' }} />
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0 }}>Current Detections</h4>
          </div>
          <div style={{ padding: '16px', minHeight: '120px' }}>
            {Object.keys(counts).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <Eye style={{ width: '40px', height: '40px', color: '#334155', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No detections</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(counts).slice(0, 5).map(([item, count]) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>{item}</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#667eea' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Counts */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 style={{ width: '16px', height: '16px', color: '#667eea' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0 }}>Live Counts</h4>
            </div>
          </div>
          <div style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {Object.keys(counts).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <BarChart2 style={{ width: '40px', height: '40px', color: '#334155', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No items counted</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(counts).map(([item, count]) => (
                  <div key={item}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: 'white' }}>{item}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#667eea' }}>{count}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        background: '#8b5cf6',
                        width: `${Math.min((count / Math.max(...Object.values(counts))) * 100, 100)}%`,
                        transition: 'width 0.3s'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock style={{ width: '16px', height: '16px', color: '#667eea' }} />
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0 }}>Recent Activity</h4>
          </div>
          <div style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <Clock style={{ width: '40px', height: '40px', color: '#334155', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No recent activity</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentActivity.map((activity, index) => (
                  <div key={index} style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '11px', color: '#667eea', fontWeight: '600', marginBottom: '4px' }}>{activity.time}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{activity.items}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
