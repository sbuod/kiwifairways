import React from 'react';

export const Header = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'start',
      padding: '20px',
      width: '100%',
      maxWidth: '1500px',
      margin: '0 auto'
    }}>
      <div />

      <div style={{ justifySelf: 'center' }}>
        <img
          src="/images/logo.png"
          alt="Kiwi Fairways Logo"
          className="site-logo"
        />
      </div>

      <div />
    </div>
  );
};