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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md border-2 border-yellow-500">
        <h2 className={`text-xl font-bold text-yellow-500 mb-4 ${pixelFont.className}`}>
          DAILY CHALLENGE
        </h2>

        {!completed ? (
          <>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Challenge</label>
              <input
                type="text"
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700"
                disabled={isTimerRunning}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Time Limit (minutes)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700"
                disabled={isTimerRunning}
              />
            </div>

            {isTimerRunning && (
              <div className="mb-4 text-center">
                <div className={`text-3xl ${pixelFont.className} text-white mb-2`}>
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-300">{challenge}</div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
              {!isTimerRunning ? (
                <button
                  onClick={handleStart}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Start Challenge
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
                >
                  Complete (+200 Elixirs)
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-green-500 text-xl mb-4">Challenge Completed!</div>
            <div className="text-white mb-4">+200 Elixirs Added</div>
            <button
              onClick={onClose}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}