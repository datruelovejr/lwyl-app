'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInviteByToken, redeemInvite, signUp, signIn, getSession } from '../../../lib/supabase';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth form state
  const [mode, setMode] = useState('signup'); // 'signup' or 'signin'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load invite on mount
  useEffect(() => {
    async function loadInvite() {
      try {
        const data = await getInviteByToken(token);

        if (!data) {
          setError('This invite link is invalid.');
          return;
        }

        if (data.redeemed_at) {
          setError('This invite has already been used.');
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError('This invite has expired.');
          return;
        }

        setInvite(data);

        // Check if user is already logged in
        const session = await getSession();
        if (session?.user) {
          // Auto-redeem for logged-in user
          handleRedeem();
        }
      } catch (err) {
        console.error('Failed to load invite:', err);
        setError('Failed to load invite. Please check the link and try again.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInvite();
    }
  }, [token]);

  const handleRedeem = async () => {
    try {
      const result = await redeemInvite(token);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/app');
        }, 2000);
      } else {
        setAuthError(result.error || 'Failed to accept invite.');
      }
    } catch (err) {
      console.error('Failed to redeem invite:', err);
      setAuthError('Failed to accept invite. Please try again.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);
    try {
      await signUp(email, password, fullName);
      // After signup, user needs to confirm email
      // For now, show a message
      setAuthError(null);
      setSuccess(true);
      // Note: The invite will be redeemed when they confirm email and log in
      // For development, you might have email confirmation disabled
    } catch (err) {
      console.error('Signup failed:', err);
      setAuthError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      await signIn(email, password);
      // After sign in, redeem the invite
      await handleRedeem();
    } catch (err) {
      console.error('Sign in failed:', err);
      setAuthError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invite Not Valid</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-2">
            {mode === 'signup'
              ? 'Check your email to confirm your account, then sign in to access your organization.'
              : `You're now the leader of ${invite?.organizations?.name || 'your organization'}.`}
          </p>
          {mode === 'signin' && (
            <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">You've Been Invited!</h1>
          <p className="text-gray-600">
            Join <strong className="text-gray-900">{invite?.organizations?.name}</strong> on Love Where You Lead
          </p>
          {invite?.people?.name && (
            <p className="text-sm text-emerald-600 mt-2">
              Your profile ({invite.people.name}) will be linked automatically
            </p>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === 'signup'
                ? 'bg-sky-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === 'signin'
                ? 'bg-sky-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn}>
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          )}

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{authError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {authLoading
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Create Account & Accept Invite'
                : 'Sign In & Accept Invite'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
