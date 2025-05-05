import { useState } from 'react';

export default function OnboardingModal({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      title: "Welcome to Solo Leveling Productivity!",
      content: "Step into the world of Hunters. Complete quests. Level up your life.",
      image: "https://images.alphacoders.com/137/1372163.jpg"
    },
    {
      title: "Daily Quests",
      content: "Slay procrastination. Complete daily tasks and earn Elixirs.",
      image: "https://i.redd.it/official_solo_leveling_poster.jpg"
    },
    {
      title: "Weekly Dungeons",
      content: "Enter weekly dungeons—your real-life boss fights with greater rewards.",
      image: "https://static.wikia.nocookie.net/solo-leveling/images/6/66/Episode8-artwork.png"
    },
    {
      title: "Monthly Goals",
      content: "Forge your destiny. Set monthly goals and rank up from E to S-Class.",
      image: "https://i.redd.it/solo_leveling_season2_key_visual.jpg"
    }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4 overflow-auto">
      <div className="bg-[#1e1e2e] rounded-2xl p-6 w-full max-w-lg shadow-xl border border-purple-600">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-400 drop-shadow-md">
            {steps[currentStep - 1].title}
          </h2>
          <span className="text-sm text-gray-400">Step {currentStep}/{totalSteps}</span>
        </div>

        <div className="mb-6">
          <img
            src={steps[currentStep - 1].image}
            alt="Onboarding visual"
            className="w-full h-52 sm:h-64 object-cover rounded-lg shadow-lg border border-gray-700"
          />
          <p className="text-gray-300 mt-4 text-sm sm:text-base leading-relaxed">
            {steps[currentStep - 1].content}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-white hover:underline transition"
          >
            Skip Tutorial
          </button>
          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-6 py-2 rounded-lg w-full sm:w-auto text-sm sm:text-base shadow-md"
          >
            {currentStep === totalSteps ? 'Begin Leveling Up' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
