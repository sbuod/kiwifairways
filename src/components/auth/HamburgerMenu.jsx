import React, { useState } from 'react';
import { Menu, ActionIcon, Text } from '@mantine/core';
import { IconHome, IconGolf, IconEdit, IconList, IconChartBar, IconLogout } from '@tabler/icons-react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/router';

export const HamburgerMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [menuOpened, setMenuOpened] = useState(false);

  // If no one is logged in, don't show the hamburger menu
  if (!isAuthenticated) {
    return null;
  }

  // Handle the logout process
  const handleLogout = () => {
    logout();
    setMenuOpened(false);
  };

  // Extract user name from user metadata (Google provides full_name)
  const displayName = user.user_metadata?.full_name || user.email;

  return (
    <Menu
      opened={menuOpened}
      onChange={setMenuOpened}
      position="bottom-end"
      withinPortal
    >
      <Menu.Target>
        <ActionIcon size="lg" variant="subtle">
          {/* Simple hamburger icon made with divs */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '20px',
              height: '2px',
              backgroundColor: '#333',
              borderRadius: '1px'
            }} />
            <div style={{
              width: '20px',
              height: '2px',
              backgroundColor: '#333',
              borderRadius: '1px'
            }} />
            <div style={{
              width: '20px',
              height: '2px',
              backgroundColor: '#333',
              borderRadius: '1px'
            }} />
          </div>
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {/* User info section */}
        <Menu.Item disabled>
          <Text size="xs" color="dimmed">Signed in as</Text>
          <Text size="sm" weight={500}>
            {displayName}
          </Text>
        </Menu.Item>

        <Menu.Divider />

        {/* Menu options - we'll add functionality to these later */}
        <Menu.Item leftSection={<IconHome size={16} />} onClick={() => router.push('/')}>
          Home
        </Menu.Item>

        <Menu.Item leftSection={<IconGolf size={16} />} onClick={() => router.push('/my-courses')}>
          Played Courses
        </Menu.Item>

        <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => router.push('/activity')}>
          Activity
        </Menu.Item>

        <Menu.Item leftSection={<IconList size={16} />}>
          View My Rounds
        </Menu.Item>

        <Menu.Item leftSection={<IconChartBar size={16} />}>
          My Stats
        </Menu.Item>

        <Menu.Divider />

        {/* Logout option */}
        <Menu.Item leftSection={<IconLogout size={16} />} onClick={handleLogout} color="red">
          Sign Out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};