import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { Container, Text, Stack, Paper, Button } from '@mantine/core';
import { useAuth } from '../components/auth/AuthProvider';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  // If user is already logged in, redirect them back to home
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      await login();
      // Supabase will redirect to Google OAuth, then back to your app
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('Sign-in failed. Please try again.');
      setSigningIn(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Kiwi Fairways</title>
        <meta name="description" content="Login to Kiwi Fairways to track your golf stats" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        {/* Your original logo */}
        <div className="logo-container">
          <img
            src="/images/logo.png"
            alt="Kiwi Fairways Logo"
            className="site-logo"
            onClick={() => router.push('/')}
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* Login content */}
        <Container size="sm" py="xl">
          <Paper shadow="md" p="xl" radius="md" style={{ marginTop: '50px' }}>
            <Stack spacing="lg" align="center">
              {/* Welcome message */}
              <Text size="xl" weight={600} align="center" color="dark">
                Welcome to my not-so-secret login page :)
              </Text>

              {/* Description text */}
              <Text size="md" align="center" color="dimmed" style={{ lineHeight: 1.6 }}>
                I use this website to keep track of my playing stats and the courses I've played -
                you can too if you like. It doesn't cost anything but you'll need to login with a Google account.
              </Text>

              {/* Google Sign In Button */}
              <div style={{ marginTop: '20px' }}>
                <Button
                  onClick={handleGoogleSignIn}
                  loading={signingIn || loading}
                  disabled={signingIn || loading}
                  size="lg"
                  variant="default"
                  leftSection={
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                    </svg>
                  }
                >
                  Sign in with Google
                </Button>
              </div>

              {/* Error message */}
              {error && (
                <Text size="sm" color="red" align="center">
                  {error}
                </Text>
              )}

              {/* Back to courses link */}
              <Text
                size="sm"
                color="dimmed"
                align="center"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => router.push('/')}
              >
                ← Back to course listings
              </Text>
            </Stack>
          </Paper>
        </Container>
      </div>
    </>
  );
}