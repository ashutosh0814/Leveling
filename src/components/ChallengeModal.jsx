// components/ChallengeModal.jsx
import { useState, useEffect } from 'react';
import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({ subsets: ['latin'], weight: '400' });

export default function ChallengeModal({ isOpen, onClose, onComplete, user }) {
  const [challenge, setChallenge] = useState('');
  const [timeLimit, setTimeLimit] = useState(25);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleStart = () => {
    if (!challenge) {
      alert('Please enter a challenge!');
      return;
    }
    setIsTimerRunning(true);
    setTimeLeft(timeLimit * 60);
  };

  const handleComplete = () => {
    if (window.confirm('Complete this challenge and earn 200 elixirs?')) {
      onComplete(200);
      setCompleted(true);
      setIsTimerRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="relative max-w-md w-full">
        {/* Blue glowing vertical borders */}
        <div className="absolute -left-4 top-0 bottom-0 w-2 bg-blue-500 opacity-80 blur-sm"></div>
        <div className="absolute -right-4 top-0 bottom-0 w-2 bg-blue-500 opacity-80 blur-sm"></div>
        
        {/* Main content box */}
        <div className="bg-gray-900 bg-opacity-90 p-6 rounded border border-blue-400 shadow-lg relative overflow-hidden">
          {/* Digital circuit background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{
                 backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18h78M21 40h58M31 65h38M11 18v47M89 18v47M21 40v25M79 40v25\' stroke=\'%2300FFFF\' stroke-width=\'1\' fill=\'none\'/%3E%3C/svg%3E")',
                 backgroundSize: '200px 200px'
               }}>
          </div>
          
          {/* Notification box */}
          <div className="relative z-10">
            {/* Notification header */}
            <div className="border-l-4 border-blue-400 pl-2 mb-6">
              <h2 className={`text-xl font-bold text-blue-400 tracking-widest ${pixelFont.className}`}>
                NOTIFICATION
              </h2>
            </div>

            {!completed ? (
              <>
                <div className="mb-6 mt-8">
                  <label className="block text-sm text-blue-300 mb-2">Challenge</label>
                  <input
                    type="text"
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 bg-opacity-80 text-blue-100 rounded border border-blue-500 focus:border-blue-400 focus:ring focus:ring-blue-400 focus:ring-opacity-30"
                    disabled={isTimerRunning}
                    placeholder="Enter your quest..."
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-blue-300 mb-2">Time Limit (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-800 bg-opacity-80 text-blue-100 rounded border border-blue-500 focus:border-blue-400 focus:ring focus:ring-blue-400 focus:ring-opacity-30"
                    disabled={isTimerRunning}
                  />
                </div>

                {isTimerRunning && (
                  <div className="my-8 text-center">
                    <div className={`text-4xl ${pixelFont.className} text-blue-300 mb-4 shadow-glow`}
                         style={{textShadow: '0 0 10px rgba(0, 183, 255, 0.7)'}}>
                      {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                      {(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-lg text-blue-100 font-medium">{challenge}</div>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button
                    onClick={onClose}
                    className="bg-gray-700 border border-blue-400 hover:bg-gray-600 text-blue-200 px-6 py-3 rounded flex items-center justify-center"
                  >
                    <span className="mr-2">●</span> Cancel
                  </button>
                  {!isTimerRunning ? (
                    <button
                      onClick={handleStart}
                      className="bg-blue-900 border border-blue-400 hover:bg-blue-800 text-blue-100 px-6 py-3 rounded flex items-center justify-center transition-all duration-300"
                      style={{boxShadow: '0 0 15px rgba(0, 183, 255, 0.5)'}}
                    >
                      Start Quest <span className="ml-2">→</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      className="bg-blue-700 border border-blue-400 hover:bg-blue-600 text-blue-100 px-6 py-3 rounded flex items-center justify-center transition-all duration-300"
                      style={{boxShadow: '0 0 15px rgba(0, 183, 255, 0.5)'}}
                    >
                      Complete +200 <span className="ml-2">★</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-3xl text-blue-400 mb-6" style={{textShadow: '0 0 15px rgba(0, 183, 255, 0.9)'}}>
                  QUEST COMPLETE
                </div>
                <div className="text-2xl text-blue-100 mb-6 flex items-center justify-center">
                  <span className="mr-2">+200</span>
                  <span className="text-yellow-400" style={{textShadow: '0 0 10px rgba(255, 213, 0, 0.7)'}}>★</span>
                  <span className="ml-2">ELIXIRS</span>
                </div>
                
                <div className="mt-8">
                  <button
                    onClick={onClose}
                    className="bg-blue-700 border border-blue-300 hover:bg-blue-600 text-blue-100 px-6 py-3 rounded transition-all duration-300 w-full"
                    style={{boxShadow: '0 0 15px rgba(0, 183, 255, 0.5)'}}
                  >
                    RETURN
                  </button>
                </div>
              </div>
            )}
            
            {/* Blue info icon in left bottom corner */}
            {!completed && !isTimerRunning && (
              <div className="absolute bottom-0 left-0 transform translate-x-2 translate-y-4">
                <div className="w-8 h-8 border-2 border-blue-400 rounded-full flex items-center justify-center text-blue-400"
                     style={{boxShadow: '0 0 10px rgba(0, 183, 255, 0.7)'}}>
                  i
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}