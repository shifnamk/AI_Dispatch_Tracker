import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'client'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.base}/api/auth/users`, {
        withCredentials: true
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_ENDPOINTS.base}/api/auth/users`,
        formData,
        { withCredentials: true }
      );

      setSuccess(response.data.message);
      setFormData({ username: '', email: '', password: '', role: 'client' });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.base}/api/auth/users/${userId}`,
        { withCredentials: true }
      );

      setSuccess(response.data.message);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255, 255, 255, 0.1)', borderTop: '4px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
            User Management
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            Create and manage user accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '12px 20px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            color: '#a78bfa',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
        >
          <UserPlus size={18} />
          {showCreateForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          background: 'rgba(248, 113, 113, 0.15)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#f87171',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#34d399',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
            Create New User
          </h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="client" style={{ background: '#1a202c' }}>Client</option>
                  <option value="admin" style={{ background: '#1a202c' }}>Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <UserPlus size={18} />
              Create User
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>
              All Users ({users.length})
            </h3>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>User</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Email</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Role</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Created</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                        border: user.role === 'admin' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(96, 165, 250, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UserIcon size={20} color={user.role === 'admin' ? '#a78bfa' : '#60a5fa'} />
                      </div>
                      <span style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>{user.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>{user.email}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                      border: user.role === 'admin' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: user.role === 'admin' ? '#a78bfa' : '#60a5fa'
                    }}>
                      <Shield size={14} />
                      {user.role.toUpperCase()}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(248, 113, 113, 0.15)',
                        border: '1px solid rgba(248, 113, 113, 0.3)',
                        borderRadius: '8px',
                        color: '#f87171',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.25)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)'}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

