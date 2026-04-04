import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// Create the context that will hold our auth state
const AuthContext = createContext();

// Custom hook to use the auth context
// This makes it easy to access auth data from any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// The main provider component that wraps our app
export const AuthProvider = ({ children }) => {
  // State to hold the current user data
  const [user, setUser] = useState(null);

  // State to track if we're still loading the user data
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when the app starts
  // Supabase manages sessions automatically with secure httpOnly cookies
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Function to log a user in with Google OAuth
  const login = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Function to log a user out
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  };

  // The values we want to make available to all child components
  const authValue = {
    user: user,                    // The current user object (null if not logged in)
    login: login,                  // Function to initiate Google OAuth login
    logout: logout,                // Function to log out
    loading: loading,              // Boolean - are we still loading?
    isAuthenticated: user !== null // Boolean - is someone logged in?
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};