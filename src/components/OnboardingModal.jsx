import { useState } from 'react';

export default function OnboardingModal({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      title: "Welcome to Solo Leveling Productivity!",
      content: "This app helps you level up your life by completing quests and achieving goals.",
      image: "/images/onboarding-1.png"
    },
    {
      title: "Daily Quests",
      content: "Complete daily tasks to earn elixirs and level up your character.",
      image: "/images/onboarding-2.png"
    },
    {
      title: "Weekly Dungeons",
      content: "Tackle bigger challenges each week for greater rewards.",
      image: "/images/onboarding-3.png"
    },
    {
      title: "Monthly Goals",
      content: "Set ambitious monthly objectives to rank up faster.",
      image: "/images/onboarding-4.png"
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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-purple-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-400">{steps[currentStep - 1].title}</h2>
          <span className="text-gray-400">Step {currentStep}/{totalSteps}</span>
        </div>
        
        <div className="mb-6">
          <img 
            src={steps[currentStep - 1].image} 
            alt="Onboarding visual"
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <p className="text-gray-300">{steps[currentStep - 1].content}</p>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Skip Tutorial
          </button>
          <button
            onClick={handleNext}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md"
          >
            {currentStep === totalSteps ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}