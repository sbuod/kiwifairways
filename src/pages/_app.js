console.log('⛳ On the tee - kiwiwfairways.co.nz');

import '@mantine/core/styles.css';
import 'mantine-datatable/styles.css';
import '../styles/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { AuthProvider } from '../components/auth/AuthProvider';

const theme = createTheme({

});

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <MantineProvider theme={theme}>
        <Component {...pageProps} />
      </MantineProvider>
    </AuthProvider>
  );
}
