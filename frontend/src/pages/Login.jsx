import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Utensils, LogIn, Lock, User } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_ENDPOINTS.base}/api/auth/login`,
        { username: formData.username, password: formData.password },
        { withCredentials: true }
      );

      if (response.data.authenticated) {
        // Store user info
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Redirect to dashboard
        navigate('/');
        window.location.reload(); // Force reload to update authentication state
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '24px',
        padding: '48px 40px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Utensils style={{ width: '40px', height: '40px', color: '#a78bfa' }} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
            ServeTrack
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            Food Detection System
          </p>
        </div>


        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(248, 113, 113, 0.15)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#f87171'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="Enter your username"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          </div>


          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          </div>


          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.15)',
              color: loading ? 'rgba(255, 255, 255, 0.5)' : '#a78bfa',
              border: loading ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '24px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
              }
            }}
          >
            {loading ? (
              'Please wait...'
            ) : (
              <>
                <LogIn size={20} />
                Login
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

