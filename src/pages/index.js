import { useEffect, useState } from "react";
import AuthForm from "../components/AuthForm";
import { Press_Start_2P } from "next/font/google";

const pixelFont = Press_Start_2P({ subsets: ["latin"], weight: "400" });

export default function Home() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Handle cursor effect
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-between min-h-screen bg-black text-white px-4 sm:px-8 md:px-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-90 animate-gradient"></div>

      {/* Custom cursor (hidden on mobile) */}
      {!isMobile && (
        <div
          className="fixed w-6 h-6 bg-purple-500 rounded-full opacity-60 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ top: cursorPos.y, left: cursorPos.x }}
        ></div>
      )}

      {/* Content area */}
      <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-between py-8 md:py-0 z-10">
        {/* Left side - Title and description */}
        <div className="flex flex-col items-center md:items-start justify-center w-full md:w-1/2 md:pr-8 mb-8 md:mb-0 px-2">
          {/* Mobile title with line breaks and smaller font */}
          <h1
            className={`${pixelFont.className} text-purple-500 text-center md:text-left text-xl xs:text-3xl sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-lg mb-4 w-full leading-normal`}
          >
            <span className="block xs:inline">Welcome to</span>{" "}
            <span className="block">Solo Leveling</span>{" "}
            <span className="block">Productivity!</span>
          </h1>
          <p className="text-gray-300 text-center md:text-left text-sm sm:text-base md:text-lg max-w-lg">
            Level up your life by completing daily quests and achieving your
            goals.
          </p>
        </div>

        {/* Right side - Auth form */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          <div className="w-full max-w-md">
            <AuthForm />
          </div>
        </div>
      </div>

      {/* Animated elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-pulse absolute top-1/4 left-1/3 w-8 sm:w-12 md:w-16 h-8 sm:h-12 md:h-16 bg-purple-600 opacity-20 rounded-full blur-xl"></div>
        <div className="animate-bounce absolute bottom-1/3 right-1/4 w-6 sm:w-8 md:w-12 h-6 sm:h-8 md:h-12 bg-blue-500 opacity-20 rounded-full blur-xl"></div>
        <div className="animate-pulse absolute bottom-1/4 left-1/4 w-10 sm:w-14 md:w-20 h-10 sm:h-14 md:h-20 bg-indigo-500 opacity-10 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}
