// pages/_app.js — Next.js custom App (loads global CSS)
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
