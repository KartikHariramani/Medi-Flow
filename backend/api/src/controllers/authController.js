import { supabase } from '../supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'MediFlow-secret-key-change-in-production';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, specialization, department, licenseId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required.' });
    }

    // 1. Create user in Supabase Auth (using Admin API with fallback to standard signUp)
    let supabaseUserId;
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role }
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          const { data: list } = await supabase.auth.admin.listUsers();
          const existing = list?.users?.find(u => u.email === email);
          if (existing) {
            supabaseUserId = existing.id;
          } else {
            throw authError;
          }
        } else {
          throw authError;
        }
      } else {
        supabaseUserId = authData?.user?.id;
      }
    } catch (adminErr) {
      console.warn('⚠️ Admin registration failed, trying standard signUp:', adminErr.message);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw new Error('User already registered. Please sign in.');
          supabaseUserId = signInData?.user?.id;
        } else {
          throw signUpError;
        }
      } else {
        supabaseUserId = signUpData?.user?.id;
      }
    }

    // 2. Insert into public.users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ id: supabaseUserId, name, email, phone, role })
      .select()
      .single();
    if (userError) throw userError;

    // 3. If doctor, create doctor profile (pending verification)
    if (role === 'doctor') {
      const { error: doctorError } = await supabase.from('doctors').insert({
        user_id: user.id,
        specialization: specialization || 'General',
        department: department || 'General',
        is_verified: false,
      });
      if (doctorError) throw doctorError;
    }

    // 4. If patient, create patient profile
    if (role === 'patient') {
      const { error: patientError } = await supabase.from('patients').insert({
        user_id: user.id,
      });
      if (patientError) throw patientError;
    }

    // 5. Return JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({ message: 'Registered successfully', token, user: { id: user.id, name, email, role } });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });

    // Sign in via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: 'Invalid credentials' });

    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', authData.user.id)
      .single();
    if (userError) throw userError;

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, created_at')
      .eq('id', req.userId)
      .single();
    if (error) throw error;
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

