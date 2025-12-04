import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, Settings, Menu, BarChart3, Utensils, Activity, LogOut, User, Users, Clock, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Base navigation items for all users
  const baseNavItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/camera', label: 'Camera', icon: Camera },
    { path: '/menu', label: 'Menu', icon: Menu },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/schedule', label: 'Schedule', icon: Clock },
  ];

  // Admin-only navigation items
  const adminNavItems = [
    { path: '/users', label: 'Users', icon: Users },
    { path: '/roi-settings', label: 'ROI Settings', icon: Square },
  ];

  // Combine nav items based on user role
  const navItems = user?.role === 'admin' 
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '280px',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%)',
        borderRight: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.1)'
      }}>
        {/* Logo */}
        <div style={{ 
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px',
            height: '40px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
            animation: 'glow 3s ease-in-out infinite'
          }}>
              <Utensils style={{ width: '24px', height: '24px', color: '#a78bfa' }} />
            </div>
            <div>
              <h1 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: 'white',
                margin: 0,
                lineHeight: 1
              }}>ServeTrack</h1>
              <p style={{ 
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                marginTop: '2px'
              }}>Food Detection AI</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                  color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    boxShadow: isActive ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px' }} />
                  {item.label}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#34d399',
                      boxShadow: '0 0 8px #34d399'
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Status Footer */}
        <div style={{ 
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ 
            padding: '12px',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(52, 211, 153, 0.2)'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#34d399',
              boxShadow: '0 0 8px #34d399',
              animation: 'pulse 2s infinite'
            }}></div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>System Online</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>All services running</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        marginLeft: '280px',
        flex: 1,
        background: 'transparent',
        minHeight: '100vh',
        width: 'calc(100vw - 280px)'
      }}>
        {/* Top Bar */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: 'white',
              margin: 0
            }}>
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: 'rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ 
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#a78bfa'
              }}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <span style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>
                {user?.username || 'User'}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                padding: '8px 12px',
                background: 'rgba(248, 113, 113, 0.15)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(248, 113, 113, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)';
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ padding: '32px', width: '100%', boxSizing: 'border-box' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
