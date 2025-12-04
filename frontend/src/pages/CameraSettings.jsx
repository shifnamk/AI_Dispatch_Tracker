import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Video, Plus, Play, Check, Trash2, X, Info, Loader } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function CameraSettings() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    camera_type: '',
    url: '',
    username: '',
    password: '',
    make_active: false
  });
  const [showAuthFields, setShowAuthFields] = useState(false);
  const [urlPlaceholder, setUrlPlaceholder] = useState('');
  const [urlHelp, setUrlHelp] = useState('Enter camera URL or device index');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      // Mock data since backend doesn't have camera management yet
      setCameras([]);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load cameras');
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setFormData({ ...formData, camera_type: type });
    
    if (type === 'webcam') {
      setUrlPlaceholder('0');
      setUrlHelp('Enter device index (0 for first camera, 1 for second, etc.)');
      setShowAuthFields(false);
    } else if (type === 'rtsp') {
      setUrlPlaceholder('rtsp://192.168.1.100:554/stream1');
      setUrlHelp('Enter RTSP URL (without username/password)');
      setShowAuthFields(true);
    } else if (type === 'ip') {
      setUrlPlaceholder('http://192.168.1.100:8080/video');
      setUrlHelp('Enter HTTP streaming URL');
      setShowAuthFields(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter a camera name');
      return;
    }
    
    if (!formData.camera_type) {
      setError('Please select a camera type');
      return;
    }
    
    if (!formData.url.trim()) {
      setError('Please enter a camera URL or index');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Would call API here
      setSuccess(`Camera "${formData.name}" added successfully!`);
      setFormData({ name: '', camera_type: '', url: '', username: '', password: '', make_active: false });
      setShowAuthFields(false);
      fetchCameras();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add camera');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
          <Settings style={{ width: '24px', height: '24px', display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
          Camera Settings
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Configure and manage camera connections for food recognition</p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <X style={{ width: '20px', height: '20px', color: '#fca5a5' }} />
          <span style={{ color: '#fca5a5', fontSize: '14px' }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#14532d', border: '1px solid #166534', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Check style={{ width: '20px', height: '20px', color: '#86efac' }} />
          <span style={{ color: '#86efac', fontSize: '14px' }}>{success}</span>
        </div>
      )}

      {/* Add New Camera Form */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Plus style={{ width: '20px', height: '20px', color: '#667eea' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Add New Camera</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                Camera Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Overhead Counter Camera"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                Camera Type *
              </label>
              <select
                value={formData.camera_type}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none'
                }}
              >
                <option value="">Select camera type</option>
                <option value="webcam">Built-in/USB Webcam</option>
                <option value="ip">IP Camera (HTTP)</option>
                <option value="rtsp">IP Camera (RTSP)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                Camera URL/Index *
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder={urlPlaceholder}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none'
                }}
              />
              <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>{urlHelp}</small>
            </div>

            {showAuthFields && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Camera username"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'white',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Camera password"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'white',
                      outline: 'none'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.make_active}
                onChange={(e) => setFormData({ ...formData, make_active: e.target.checked })}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Set as active camera (deactivates other cameras)</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={processing}
              style={{
                padding: '12px 24px',
                background: processing ? '#24262d' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {processing ? <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: '16px', height: '16px' }} />}
              {processing ? 'Adding...' : 'Add Camera'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ name: '', camera_type: '', url: '', username: '', password: '', make_active: false });
                setShowAuthFields(false);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#334155',
                color: '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Your Cameras */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Video style={{ width: '20px', height: '20px', color: '#667eea' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>Your Camera URLs</h3>
        </div>
        
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#43e97b', margin: 0 }}>RTSP Stream</h4>
              <span style={{ padding: '2px 8px', backgroundColor: '#14532d', color: '#86efac', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>ACTIVE</span>
            </div>
            <code style={{ display: 'block', padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '13px', color: '#86efac', border: '1px solid #166534' }}>
              rtsp://100.106.21.91:8554/Dispatch
            </code>
            <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '8px' }}>Currently configured in backend</small>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', margin: 0 }}>HTTP Stream</h4>
              <span style={{ padding: '2px 8px', backgroundColor: '#334155', color: '#94a3b8', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>ALTERNATIVE</span>
            </div>
            <code style={{ display: 'block', padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '13px', color: '#93c5fd', border: '1px solid #1e40af' }}>
              http://100.106.21.91:8888/Dispatch
            </code>
            <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '8px' }}>Alternative HTTP stream endpoint</small>
          </div>
        </div>
      </div>

      {/* Configured Cameras */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Video style={{ width: '20px', height: '20px', color: '#667eea' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Configured Cameras</h3>
          </div>
          <span style={{ padding: '4px 12px', backgroundColor: '#667eea', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: 'white' }}>
            {cameras.length} cameras
          </span>
        </div>
        
        <div style={{ padding: '24px' }}>
          {cameras.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Video style={{ width: '80px', height: '80px', color: '#334155', margin: '0 auto 24px' }} />
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>No Cameras Configured</h4>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Add your first camera to start food recognition</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>URL</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cameras.map((camera) => (
                    <tr key={camera.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>{camera.name}</span>
                        {camera.is_active && (
                          <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#14532d', color: '#86efac', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', backgroundColor: '#1e40af', color: '#93c5fd', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{camera.camera_type.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>{camera.url}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', backgroundColor: '#14532d', color: '#86efac', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Connected</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ padding: '6px 12px', backgroundColor: '#1e40af', color: '#93c5fd', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Play style={{ width: '12px', height: '12px' }} />
                            Test
                          </button>
                          {!camera.is_active && (
                            <button style={{ padding: '6px 12px', backgroundColor: '#14532d', color: '#86efac', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check style={{ width: '12px', height: '12px' }} />
                              Activate
                            </button>
                          )}
                          <button style={{ padding: '6px 12px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

