import { useState, useEffect } from 'react';
import axios from 'axios';
import { Utensils, Image as ImageIcon, Package, Plus, Trash2, X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.menuItems);
      setMenuItems(response.data.items || response.data.menu_items || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter an item name');
      return;
    }
    
    if (!formData.image) {
      setError('Please select an image');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('reference_images', formData.image);

    try {
      const response = await axios.post(API_ENDPOINTS.addMenuItem, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(response.data.message || 'Menu item added successfully!');
      setShowAddModal(false);
      setFormData({ name: '', description: '', image: null });
      setImagePreview(null);
      fetchMenuItems();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add menu item');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await axios.post(API_ENDPOINTS.deleteMenuItem(id));
      setSuccess(`"${name}" deleted successfully`);
      fetchMenuItems();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete item');
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
      {/* Messages */}
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

      {/* Header with Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>Menu Items</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>{menuItems.length} items configured</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          Add Menu Item
        </button>
      </div>

      {/* Menu Items Grid */}
      {menuItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
          <Package style={{ width: '80px', height: '80px', color: '#334155', margin: '0 auto 24px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>No menu items yet</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
            Get started by adding your first menu item
          </p>
          <button
            onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Plus style={{ width: '18px', height: '18px', display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Add First Item
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#1e293b',
                borderRadius: '16px',
                border: '1px solid #334155',
                overflow: 'hidden',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#334155';
              }}
            >
              <div style={{ height: '200px', background: '#8b5cf6', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.reference_images && item.reference_images.length > 0 ? (
                  <img
                    src={API_ENDPOINTS.uploads(item.reference_images[0])}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      console.log('Image failed to load:', API_ENDPOINTS.uploads(item.reference_images[0]));
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon style={{ width: '64px', height: '64px', color: 'rgba(255,255,255,0.3)' }} />
                )}
                <div style={{ 
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  {item.reference_images?.length || 0} images
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </h3>
                {item.description && (
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>ID: {item.id}</span>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#7f1d1d',
                      color: '#fca5a5',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#991b1b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#7f1d1d';
                    }}
                  >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #334155',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', margin: 0 }}>Add Menu Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Burger, Pizza, Salad"
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'white',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                  Reference Image *
                </label>
                <div
                  style={{
                    border: '2px dashed #334155',
                    borderRadius: '12px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    backgroundColor: '#0f172a',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => document.getElementById('imageInput').click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                  ) : (
                    <>
                      <Upload style={{ width: '48px', height: '48px', color: '#334155', margin: '0 auto 16px' }} />
                      <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Click to upload image</p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>PNG, JPG up to 10MB</p>
                    </>
                  )}
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', description: '', image: null });
                    setImagePreview(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#334155',
                    color: '#94a3b8',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: uploading ? '#24262d' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1
                  }}
                >
                  {uploading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
