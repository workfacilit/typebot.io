import { customTheme } from '@/lib/theme'
import { ColorModeScript } from '@chakra-ui/react'
import { Html, Head, Main, NextScript } from 'next/document'

const Document = () => (
  <Html translate="no">
    <Head>
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
        rel="stylesheet"
      />
      <meta name="google" content="notranslate" />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/__ENV.js" />
    </Head>
    <body>
      <ColorModeScript initialColorMode={customTheme.config.initialColorMode} />
      <Main />
      <NextScript />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.fbAsyncInit = function() {
              FB.init({
                appId: '1029092605216725',
                xfbml: true,
                version: 'v20.0'
              });
            };
          `,
        }}
      />
      <script
        async
        defer
        crossOrigin="anonymous"
        src="https://connect.facebook.net/en_US/sdk.js"
      ></script>
    </body>
  </Html>
)

export default Document
