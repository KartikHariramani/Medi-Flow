/**
 * Simple authentication utility for managing JWTs in localStorage.
 */

const TOKEN_KEY = 'MediFlow_auth_token';
const USER_KEY = 'MediFlow_user_data';

export const auth = {
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  
  getAuthHeader: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
};

