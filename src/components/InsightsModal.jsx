import { useState } from 'react';
import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({ subsets: ['latin'], weight: '400' });

export default function InsightsModal({ isOpen, onClose, userData }) {
  // Group tasks by completion date
  const groupTasksByDate = () => {
    const grouped = {};
    
    // Process daily quests
    userData.dailyQuests.forEach(task => {
      if (task.completed && task.completedAt) {
        const date = new Date(task.completedAt).toLocaleDateString();
        if (!grouped[date]) grouped[date] = { tasks: [], elixirs: 0 };
        grouped[date].tasks.push({ ...task, type: 'Daily Quest', elixirs: 10 });
        grouped[date].elixirs += 10;
      }
    });
    
    // Process weekly dungeons
    userData.weeklyDungeons.forEach(task => {
      if (task.completed && task.completedAt) {
        const date = new Date(task.completedAt).toLocaleDateString();
        if (!grouped[date]) grouped[date] = { tasks: [], elixirs: 0 };
        grouped[date].tasks.push({ ...task, type: 'Weekly Dungeon', elixirs: 50 });
        grouped[date].elixirs += 50;
      }
    });
    
    // Process monthly goals
    userData.monthlyGoals.forEach(task => {
      if (task.completed && task.completedAt) {
        const date = new Date(task.completedAt).toLocaleDateString();
        if (!grouped[date]) grouped[date] = { tasks: [], elixirs: 0 };
        grouped[date].tasks.push({ ...task, type: 'Monthly Goal', elixirs: 100 });
        grouped[date].elixirs += 100;
      }
    });
    
    // Process challenges
    userData.completedChallenges.forEach(challengeDate => {
      const date = new Date(challengeDate).toLocaleDateString();
      if (!grouped[date]) grouped[date] = { tasks: [], elixirs: 0 };
      grouped[date].tasks.push({ 
        title: 'Daily Challenge', 
        type: 'Challenge', 
        elixirs: 200,
        completedAt: challengeDate
      });
      grouped[date].elixirs += 200;
    });
    
    return grouped;
  };

  const groupedData = groupTasksByDate();
  const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));

  // Calculate this week's and month's stats
  const now = new Date();
  const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeekData = sortedDates.filter(date => {
    const dateObj = new Date(date);
    return dateObj >= thisWeekStart;
  });

  const thisMonthData = sortedDates.filter(date => {
    const dateObj = new Date(date);
    return dateObj >= thisMonthStart;
  });

  const calculateTotal = (dates) => {
    return dates.reduce((total, date) => total + groupedData[date].elixirs, 0);
  };

  const thisWeekTotal = calculateTotal(thisWeekData);
  const thisMonthTotal = calculateTotal(thisMonthData);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-4xl border-2 border-yellow-500 max-h-[90vh] overflow-y-auto scrollbar-custom">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold text-yellow-500 ${pixelFont.className}`}>
            ELIXIR HISTORY
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500">
            <h3 className="text-sm text-gray-300 mb-2">THIS WEEK</h3>
            <div className="text-2xl text-white">{thisWeekTotal} Elixirs</div>
            <div className="text-xs text-gray-400 mt-1">
              {thisWeekData.length} active days
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500">
            <h3 className="text-sm text-gray-300 mb-2">THIS MONTH</h3>
            <div className="text-2xl text-white">{thisMonthTotal} Elixirs</div>
            <div className="text-xs text-gray-400 mt-1">
              {thisMonthData.length} active days
            </div>
          </div>
        </div>

        {/* Detailed Transaction History */}
        <div className="mb-6">
          <h3 className="text-sm text-gray-300 mb-2">TRANSACTION HISTORY</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-custom">
            {sortedDates.length > 0 ? (
              sortedDates.map(date => (
                <div key={date} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-yellow-400">{date}</h4>
                    <span className="text-sm text-green-400">+{groupedData[date].elixirs} Elixirs</span>
                  </div>
                  <div className="space-y-1">
                    {groupedData[date].tasks.map((task, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-300 truncate max-w-[70%]">
                          {task.type}: {task.title}
                        </span>
                        <span className="text-green-400">+{task.elixirs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400">
                No activity recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Calendar View */}
        <div className="mb-6">
          <h3 className="text-sm text-gray-300 mb-2">ACTIVITY CALENDAR</h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs text-gray-400 p-1">{day}</div>
            ))}
            {/* Calendar cells */}
            {Array.from({ length: 35 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() - 6 - (6 - i));
              const dateStr = date.toLocaleDateString();
              const hasActivity = groupedData[dateStr];
              
              return (
                <div 
                  key={i} 
                  className={`h-8 rounded-sm flex items-center justify-center text-xs ${
                    hasActivity ? 
                      groupedData[dateStr].elixirs > 200 ? 'bg-green-600' : 
                      groupedData[dateStr].elixirs > 100 ? 'bg-green-500' : 'bg-green-400' : 
                      'bg-gray-700'
                  }`}
                  title={hasActivity ? 
                    `${dateStr}: ${groupedData[dateStr].elixirs} elixirs earned` : 
                    date.toLocaleDateString()}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition anime-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}