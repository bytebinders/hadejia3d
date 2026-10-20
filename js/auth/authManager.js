import { getSupabase } from './supabaseClient.js';

/**
 * AuthManager — Handles user authentication, session persistence, and profile sync
 * using Supabase for Hadejia 3D.
 */
export class AuthManager {
  constructor(app) {
    this.app = app;
    this.supabase = null;
    this.user = null;
    this.session = null;
    this.listeners = [];

    this.init();
  }

  async init() {
    this.supabase = await getSupabase();
    if (!this.supabase) {
      console.warn('[AuthManager] Supabase could not be reached.');
      return;
    }

    try {
      // 1. Check existing session
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (!error && session) {
        this.session = session;
        this.user = session.user;
        this._syncPlayerProfile();
        this._notifyListeners();
      }

      // 2. Listen for auth changes (sign in, sign out, token refreshed)
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.session = session;
        this.user = session ? session.user : null;
        this._syncPlayerProfile();
        this._notifyListeners();
      });
    } catch (err) {
      console.warn('[AuthManager] Session initialization error:', err);
    }
  }

  /**
   * Register a new user with Supabase
   */
  async signUp({ email, password, username }) {
    const sb = this.supabase || await getSupabase();
    if (!sb) throw new Error('Authentication service is currently unavailable.');

    const cleanEmail = (email || '').trim();
    const cleanUsername = (username || '').trim() || cleanEmail.split('@')[0] || 'Explorer';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const { data, error } = await sb.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: {
          username: cleanUsername,
          display_name: cleanUsername
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      this.session = data.session;
      this.user = data.user;
      this._syncPlayerProfile();
      this._notifyListeners();
      return { success: true, user: data.user, autoLoggedIn: true };
    }

    return {
      success: true,
      user: data.user,
      autoLoggedIn: false,
      message: 'Account created! Please check your email to confirm your registration.'
    };
  }

  /**
   * Sign in an existing user with email and password
   */
  async signIn({ email, password }) {
    const sb = this.supabase || await getSupabase();
    if (!sb) throw new Error('Authentication service is currently unavailable.');

    const cleanEmail = (email || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const { data, error } = await sb.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (error) {
      throw error;
    }

    this.session = data.session;
    this.user = data.user;
    this._syncPlayerProfile();
    this._notifyListeners();

    return { success: true, user: data.user };
  }

  /**
   * Sign out current user
   */
  async signOut() {
    const sb = this.supabase || await getSupabase();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch (err) {
        console.warn('[AuthManager] Sign out error:', err);
      }
    }

    this.session = null;
    this.user = null;
    this._syncPlayerProfile();
    this._notifyListeners();

    return { success: true };
  }

  /**
   * Get display name for current active explorer
   */
  getUsername() {
    if (!this.user) return 'Guest Explorer';
    return this.user.user_metadata?.username ||
           this.user.user_metadata?.display_name ||
           this.user.email?.split('@')[0] ||
           'Explorer';
  }

  /**
   * Returns true if user is authenticated
   */
  isLoggedIn() {
    return !!this.user;
  }

  /**
   * Synchronize active username with multiplayer network and 3D avatar
   */
  _syncPlayerProfile() {
    const name = this.getUsername();

    if (this.app.playerCtrl) {
      this.app.playerCtrl.playerName = name;
    }

    if (this.app.networkMgr) {
      this.app.networkMgr.setLocalPlayerName(name);
    }
  }

  /**
   * Subscribe to user authentication changes
   */
  onUserChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      // Immediately notify current state
      callback(this.user, this.getUsername());
    }
  }

  _notifyListeners() {
    const name = this.getUsername();
    this.listeners.forEach(cb => {
      try {
        cb(this.user, name);
      } catch (err) {
        console.error('[AuthManager] Listener error:', err);
      }
    });
  }
}
