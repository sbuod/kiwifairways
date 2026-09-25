console.log('⛳ On the tee - kiwiwfairways.co.nz');

import '@mantine/core/styles.css';
import 'mantine-datatable/styles.css';
import '../styles/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { AuthProvider } from '../components/auth/AuthProvider';
import { FONT_VARIABLE } from '../lib/fonts';

const theme = createTheme({
  fontFamily: `var(${FONT_VARIABLE}), 'IBM Plex Sans', sans-serif`,
  colors: {
    // Kiwi Fairways green — shade 6 is the brand colour (#5A6B2F)
    kfGreen: [
      '#F3F5EA',
      '#E4E9D2',
      '#C8D2A5',
      '#AAB975',
      '#90A24E',
      '#76883C',
      '#5A6B2F',
      '#4C5B27',
      '#3E4A20',
      '#303918',
    ],
  },
  primaryColor: 'kfGreen',
  primaryShade: 6,
  radius: {
    md: '12px',
  },
});

// Warm dimmed text to match the cream palette (Mantine's default is cool grey)
const cssVariablesResolver = () => ({
  variables: {},
  light: { '--mantine-color-dimmed': '#8A8470' },
  dark: {},
});

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
        <Component {...pageProps} />
      </MantineProvider>
    </AuthProvider>
  );
}
