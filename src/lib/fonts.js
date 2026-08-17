import { IBM_Plex_Sans } from 'next/font/google';

// next/font requires the `variable` value below to be a literal, so it can't
// reference this constant directly — keep the two in sync if either changes.
export const FONT_VARIABLE = '--font-ibm-plex-sans';

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});
