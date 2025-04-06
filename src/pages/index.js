import { useEffect, useState } from 'react';
import AuthForm from '../components/AuthForm';
import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({ subsets: ['latin'], weight: '400' });

export default function Home() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-between min-h-screen bg-black text-white px-4 md:px-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-90 animate-gradient"></div>

      <div
        className="fixed w-6 h-6 bg-purple-500 rounded-full opacity-60 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
        style={{ top: cursorPos.y, left: cursorPos.x }}
      ></div>

      <div className="relative flex flex-col items-center md:items-start justify-center w-full md:w-1/2 z-10">
        <h1 className={`${pixelFont.className} text-purple-500 text-center md:text-left text-5xl drop-shadow-lg`}>
          Welcome to Solo Leveling Productivity!
        </h1>
        <p className="text-gray-300 mt-4 text-lg text-center md:text-left">
          Level up your life by completing daily quests and achieving your goals.
        </p>
      </div>

      <div className="relative w-full md:w-1/2 flex justify-center mt-8 md:mt-0 z-10">
        <AuthForm />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-pulse absolute top-1/4 left-1/3 w-16 h-16 bg-purple-600 opacity-20 rounded-full blur-xl"></div>
        <div className="animate-bounce absolute bottom-1/3 right-1/4 w-12 h-12 bg-blue-500 opacity-20 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}