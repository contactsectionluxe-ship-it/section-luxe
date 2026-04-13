import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Snippet officiel GTM dans le <head> (beforeInteractive), après ConsentBootstrap.
 * Définir NEXT_PUBLIC_GTM_ID=GTM-XXXXXX dans .env.local
 * @see https://tagmanager.google.com
 */
export function GoogleTagManager() {
  if (!GTM_ID) return null;
  const snippet = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;
  return (
    <Script id="google-tag-manager" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: snippet }} />
  );
}

/** iframe noscript juste après <body>, comme demandé par Google. */
export function GoogleTagManagerNoscript() {
  const id = process.env.NEXT_PUBLIC_GTM_ID;
  if (!id) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${id}`}
        height={0}
        width={0}
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
