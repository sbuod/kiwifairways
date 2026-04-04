import React from 'react';
import { Text } from '@mantine/core';
import { useAuth } from './AuthProvider';

export const UserGreeting = () => {
  const { user, isAuthenticated } = useAuth();

  // If no one is logged in, don't show anything
  if (!isAuthenticated) {
    return null;
  }

  // Extract first name from user metadata (Google provides full_name)
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User';

  return (
    <Text size="sm" weight={500} color="dark">
      Hello, {firstName}
    </Text>
  );
};