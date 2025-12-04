import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Calendar, Save, Power } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function ScheduleSettings() {
  const [schedule, setSchedule] = useState({
    start_time: '09:00',
    end_time: '21:00',
    enabled: false,
    days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.base}/api/schedule`, {
        withCredentials: true
      });
      if (response.data.schedule) {
        setSchedule(response.data.schedule);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(
        `${API_ENDPOINTS.base}/api/schedule`,
        schedule,
        { withCredentials: true }
      );

      setMessage({ type: 'success', text: response.data.message });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save schedule' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    const newDays = schedule.days_of_week.includes(day)
      ? schedule.days_of_week.filter(d => d !== day)
      : [...schedule.days_of_week, day];
    setSchedule({ ...schedule, days_of_week: newDays });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255, 255, 255, 0.1)', borderTop: '4px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
          Detection Schedule
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
          Configure when detection system should automatically run
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          marginBottom: '24px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '14px'
        }}>
          {message.text}
        </div>
      )}

      {/* Enable/Disable Schedule */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Power style={{ width: '20px', height: '20px', color: schedule.enabled ? '#34d399' : 'rgba(255, 255, 255, 0.5)' }} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: '0 0 4px 0' }}>
                Schedule-Based Detection
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                {schedule.enabled ? 'Detection runs only during configured hours' : 'Detection runs 24/7'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
            style={{
              padding: '8px 16px',
              background: schedule.enabled ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${schedule.enabled ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: schedule.enabled ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {schedule.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Time Settings */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        backdropFilter: 'blur(10px)',
        opacity: schedule.enabled ? 1 : 0.5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Clock style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>
            Operating Hours
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
              Start Time
            </label>
            <input
              type="time"
              value={schedule.start_time}
              onChange={(e) => setSchedule({ ...schedule, start_time: e.target.value })}
              disabled={!schedule.enabled}
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
              End Time
            </label>
            <input
              type="time"
              value={schedule.end_time}
              onChange={(e) => setSchedule({ ...schedule, end_time: e.target.value })}
              disabled={!schedule.enabled}
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
      </div>

      {/* Days of Week */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        backdropFilter: 'blur(10px)',
        opacity: schedule.enabled ? 1 : 0.5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Calendar style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>
            Active Days
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {allDays.map((day) => {
            const isActive = schedule.days_of_week.includes(day);
            return (
              <button
                key={day}
                onClick={() => schedule.enabled && toggleDay(day)}
                disabled={!schedule.enabled}
                style={{
                  padding: '12px',
                  background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isActive ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '10px',
                  color: isActive ? '#a78bfa' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: schedule.enabled ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  textAlign: 'center'
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '14px',
          background: saving ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          color: '#a78bfa',
          fontSize: '16px',
          fontWeight: '600',
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => !saving && (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)')}
        onMouseLeave={(e) => !saving && (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)')}
      >
        <Save size={20} />
        {saving ? 'Saving...' : 'Save Schedule'}
      </button>

      {/* Info */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(96, 165, 250, 0.08)',
        border: '1px solid rgba(96, 165, 250, 0.2)',
        borderRadius: '12px',
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        <strong style={{ color: '#60a5fa' }}>ℹ️ How it works:</strong>
        <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
          <li>When schedule is <strong>enabled</strong>, detection only runs during configured hours</li>
          <li>When schedule is <strong>disabled</strong>, detection runs 24/7</li>
          <li>Select the days and times when your business is open</li>
          <li>Changes take effect immediately after saving</li>
        </ul>
      </div>
    </div>
  );
}

