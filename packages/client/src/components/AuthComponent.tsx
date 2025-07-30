import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export const AuthComponent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginAsGuest,
    register,
    login,
    logout,
    clearError,
  } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('guest');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (mode === 'guest') {
        await loginAsGuest();
      } else if (mode === 'register') {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          isGuest: false,
        });
      } else if (mode === 'login') {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isAuthenticated && user) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h3>Welcome, {user.username || 'Guest'}!</h3>
        <p>Role: {user.role}</p>
        <p>Account Type: {user.isGuest ? 'Guest' : 'Registered'}</p>
        <p>User ID: {user.id}</p>
        <button onClick={logout} style={{ padding: '8px 16px', marginTop: '10px' }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        marginBottom: '20px',
      }}
    >
      <h3>Authentication</h3>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setMode('guest')}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: mode === 'guest' ? '#007bff' : '#ccc',
            color: mode === 'guest' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Guest
        </button>
        <button
          onClick={() => setMode('login')}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: mode === 'login' ? '#007bff' : '#ccc',
            color: mode === 'login' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Login
        </button>
        <button
          onClick={() => setMode('register')}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'register' ? '#007bff' : '#ccc',
            color: mode === 'register' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Register
        </button>
      </div>

      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {mode === 'guest' && (
          <p>Click "Login as Guest" to start playing immediately with a temporary account.</p>
        )}

        {(mode === 'login' || mode === 'register') && (
          <>
            {mode === 'register' && (
              <div style={{ marginBottom: '15px' }}>
                <label>
                  Username:
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '5px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                    }}
                  />
                </label>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                Password:
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </label>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading
            ? 'Loading...'
            : mode === 'guest'
              ? 'Login as Guest'
              : mode === 'login'
                ? 'Login'
                : 'Register'}
        </button>
      </form>
    </div>
  );
};
