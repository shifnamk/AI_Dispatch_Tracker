import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Camera, Save, Trash2, Square, CheckCircle, AlertCircle, Undo, VideoOff, Loader } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function ROISettings() {
  const { user } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [roiPoints, setRoiPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [streamUrl, setStreamUrl] = useState('');
  const [streamLoading, setStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Load cameras
  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.cameras);
      setCameras(response.data.cameras || []);
      if (response.data.cameras && response.data.cameras.length > 0) {
        setSelectedCamera(response.data.cameras[0]);
      }
    } catch (error) {
      console.error('Error loading cameras:', error);
      setMessage({ type: 'error', text: 'Failed to load cameras' });
    }
  };

  // Load ROI when camera is selected
  useEffect(() => {
    if (selectedCamera) {
      loadROI(selectedCamera.id);
      // Use the processed video feed which shows live detections
      setStreamUrl(API_ENDPOINTS.videoFeedProcessed);
      setStreamLoading(true);
      setStreamError(false);
    }
  }, [selectedCamera]);

  const loadROI = async (cameraId) => {
    try {
      const response = await axios.get(`/api/roi/${cameraId}`);
      if (response.data.roi_coordinates) {
        setRoiPoints(response.data.roi_coordinates);
      } else {
        setRoiPoints([]);
      }
    } catch (error) {
      console.error('Error loading ROI:', error);
      setRoiPoints([]);
    }
  };

  // Initialize canvas when image loads
  const handleImageLoad = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    setStreamLoading(false);
    setStreamError(false);
    
    if (canvas && image) {
      // Set canvas size to match image display size
      const rect = image.getBoundingClientRect();
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // Draw existing ROI if any
      drawROI();
    }
  };

  const handleImageError = () => {
    setStreamLoading(false);
    setStreamError(true);
  };

  const drawROI = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (roiPoints.length > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      
      ctx.beginPath();
      ctx.moveTo(roiPoints[0].x, roiPoints[0].y);
      
      for (let i = 1; i < roiPoints.length; i++) {
        ctx.lineTo(roiPoints[i].x, roiPoints[i].y);
      }
      
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      
      // Draw points
      roiPoints.forEach((point, index) => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw point number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(index + 1, point.x + 12, point.y - 8);
        ctx.fillText(index + 1, point.x + 12, point.y - 8);
      });
    }
  };

  useEffect(() => {
    drawROI();
  }, [roiPoints]);

  const handleCanvasClick = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scaling factor between display size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get click position relative to canvas and scale to actual size
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setRoiPoints([...roiPoints, { x: Math.round(x), y: Math.round(y) }]);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setRoiPoints([]);
    setMessage({ type: 'info', text: 'Click on the camera stream to add polygon points. Need at least 3 points.' });
  };

  const saveROI = async () => {
    if (roiPoints.length < 3) {
      setMessage({ type: 'error', text: 'ROI must have at least 3 points' });
      return;
    }
    
    try {
      await axios.post(`/api/roi/${selectedCamera.id}`, {
        roi_coordinates: roiPoints
      });
      
      setMessage({ type: 'success', text: 'ROI saved successfully!' });
      setIsDrawing(false);
    } catch (error) {
      console.error('Error saving ROI:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save ROI' });
    }
  };

  const deleteROI = async () => {
    if (!window.confirm('Are you sure you want to delete the ROI for this camera?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/roi/${selectedCamera.id}`);
      setRoiPoints([]);
      setMessage({ type: 'success', text: 'ROI deleted successfully!' });
      setIsDrawing(false);
    } catch (error) {
      console.error('Error deleting ROI:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete ROI' });
    }
  };

  const undoLastPoint = () => {
    if (roiPoints.length > 0) {
      setRoiPoints(roiPoints.slice(0, -1));
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '32px'
      }}>
        <div style={{
          background: 'rgba(31, 41, 55, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <AlertCircle style={{ width: '64px', height: '64px', color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: '#9ca3af' }}>This page is only accessible to admin users.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Square style={{ width: '40px', height: '40px', color: '#60a5fa' }} />
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', margin: 0 }}>
              ROI Settings
            </h1>
          </div>
          <p style={{ color: '#9ca3af', marginLeft: '52px' }}>
            Draw and configure Region of Interest for detection
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '12px',
            border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' :
                   message.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' :
                   '1px solid rgba(59, 130, 246, 0.3)',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                       message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                       'rgba(59, 130, 246, 0.1)',
            color: message.type === 'success' ? '#10b981' :
                   message.type === 'error' ? '#ef4444' :
                   '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {message.type === 'success' && <CheckCircle style={{ width: '20px', height: '20px' }} />}
            {message.type === 'error' && <AlertCircle style={{ width: '20px', height: '20px' }} />}
            {message.type === 'info' && <AlertCircle style={{ width: '20px', height: '20px' }} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Camera Selection */}
        <div style={{
          marginBottom: '24px',
          background: 'rgba(31, 41, 55, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(75, 85, 99, 0.5)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#d1d5db', 
            marginBottom: '12px' 
          }}>
            <Camera style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Select Camera
          </label>
          <select
            value={selectedCamera?.id || ''}
            onChange={(e) => {
              const camera = cameras.find(c => c.id === parseInt(e.target.value));
              setSelectedCamera(camera);
              setIsDrawing(false);
              setMessage({ type: '', text: '' });
            }}
            style={{
              width: '100%',
              background: 'rgba(55, 65, 81, 0.5)',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'white',
              fontSize: '16px',
              outline: 'none'
            }}
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.name}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={startDrawing}
            disabled={isDrawing}
            style={{
              padding: '12px 24px',
              background: isDrawing ? '#4b5563' : '#2563eb',
              color: 'white',
              fontWeight: '500',
              borderRadius: '8px',
              border: 'none',
              cursor: isDrawing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: isDrawing ? 0.5 : 1
            }}
            onMouseOver={(e) => !isDrawing && (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={(e) => !isDrawing && (e.currentTarget.style.background = '#2563eb')}
          >
            <Square style={{ width: '20px', height: '20px' }} />
            {isDrawing ? 'Drawing Mode Active' : 'Draw New ROI'}
          </button>
          
          {isDrawing && (
            <>
              <button
                onClick={undoLastPoint}
                disabled={roiPoints.length === 0}
                style={{
                  padding: '12px 24px',
                  background: roiPoints.length === 0 ? '#4b5563' : '#f59e0b',
                  color: 'white',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: roiPoints.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  opacity: roiPoints.length === 0 ? 0.5 : 1
                }}
                onMouseOver={(e) => roiPoints.length > 0 && (e.currentTarget.style.background = '#d97706')}
                onMouseOut={(e) => roiPoints.length > 0 && (e.currentTarget.style.background = '#f59e0b')}
              >
                <Undo style={{ width: '20px', height: '20px' }} />
                Undo Last Point
              </button>
              
              <button
                onClick={saveROI}
                disabled={roiPoints.length < 3}
                style={{
                  padding: '12px 24px',
                  background: roiPoints.length < 3 ? '#4b5563' : '#10b981',
                  color: 'white',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: roiPoints.length < 3 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  opacity: roiPoints.length < 3 ? 0.5 : 1
                }}
                onMouseOver={(e) => roiPoints.length >= 3 && (e.currentTarget.style.background = '#059669')}
                onMouseOut={(e) => roiPoints.length >= 3 && (e.currentTarget.style.background = '#10b981')}
              >
                <Save style={{ width: '20px', height: '20px' }} />
                Save ROI ({roiPoints.length} {roiPoints.length === 1 ? 'point' : 'points'})
              </button>
            </>
          )}
          
          {!isDrawing && roiPoints.length > 0 && (
            <button
              onClick={deleteROI}
              style={{
                padding: '12px 24px',
                background: '#ef4444',
                color: 'white',
                fontWeight: '500',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#dc2626')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#ef4444')}
            >
              <Trash2 style={{ width: '20px', height: '20px' }} />
              Delete ROI
            </button>
          )}
        </div>

        {/* Video Stream with Canvas Overlay */}
        <div style={{
          background: 'rgba(31, 41, 55, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(75, 85, 99, 0.5)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
            Camera Stream
          </h2>
          
          {streamError ? (
            // Error State - Camera Down
            <div style={{
              width: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(17, 24, 39, 0.5)',
              borderRadius: '8px',
              border: '2px dashed rgba(239, 68, 68, 0.3)',
              padding: '48px'
            }}>
              <VideoOff style={{ width: '64px', height: '64px', color: '#ef4444', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                Camera Offline
              </h3>
              <p style={{ color: '#9ca3af', textAlign: 'center', maxWidth: '400px', marginBottom: '16px' }}>
                The camera stream is currently unavailable. Please ensure:
              </p>
              <ul style={{ color: '#9ca3af', textAlign: 'left', lineHeight: '1.8' }}>
                <li>The camera is powered on and connected</li>
                <li>The detection system is running</li>
                <li>Network connection is stable</li>
              </ul>
              <button
                onClick={() => {
                  setStreamUrl(`${API_ENDPOINTS.videoFeedProcessed}?t=${Date.now()}`);
                  setStreamError(false);
                  setStreamLoading(true);
                }}
                style={{
                  marginTop: '24px',
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
              background: 'rgba(17, 24, 39, 0.5)',
              borderRadius: '8px',
              border: '1px solid rgba(75, 85, 99, 0.3)',
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
              <p style={{ color: '#9ca3af', textAlign: 'center' }}>
                Please wait while we establish the video stream
              </p>
            </div>
          ) : (
            // Stream Active
            <div 
              ref={containerRef}
              style={{ 
                position: 'relative', 
                display: 'inline-block',
                cursor: isDrawing ? 'crosshair' : 'default',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <img
                ref={imageRef}
                src={streamUrl}
                alt="Camera Stream"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: '8px'
                }}
              />
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  cursor: isDrawing ? 'crosshair' : 'default',
                  borderRadius: '8px'
                }}
              />
            </div>
          )}

          {/* Instructions */}
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(17, 24, 39, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(75, 85, 99, 0.3)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
              Instructions:
            </h3>
            <ul style={{ fontSize: '14px', color: '#9ca3af', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Click <strong>"Draw New ROI"</strong> to start drawing mode</li>
              <li>Click on the camera stream to add points for your polygon</li>
              <li>Add at least 3 points to define the detection region</li>
              <li>Use <strong>"Undo Last Point"</strong> to remove mistakes</li>
              <li>Click <strong>"Save ROI"</strong> when finished</li>
              <li>The detection system will only track objects within this region</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
