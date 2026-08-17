import { Html, Head, Main, NextScript } from "next/document";
import { ibmPlexSans } from "../lib/fonts";

export default function Document() {
  return (
    <Html lang="en" className={ibmPlexSans.variable}>
      <Head>
        {/* Stylesheets */}
        <link rel="stylesheet" href="/css/styles.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
