import { Press_Start_2P } from 'next/font/google';
import { Poppins } from 'next/font/google';
import '../styles/globals.css';
import { auth } from '../utils/firebase';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const pixelFont = Press_Start_2P({ subsets: ['latin'], weight: '400' });
const poppinsFont = Poppins({ subsets: ['latin'], weight: ['300', '400', '500'] });

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && router.pathname !== '/') {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <main className={`${poppinsFont.className}`}>
      <Component {...pageProps} />
    </main>
  );
}