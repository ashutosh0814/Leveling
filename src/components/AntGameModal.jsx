import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateUserData } from "../utils/firebase";

const AntNestRaidGame = ({ user, onClose, onUpdateUser }) => {
  // Game states
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hp, setHp] = useState(user?.health || 100);
  const [elixirs, setElixirs] = useState(user?.elixirs || 0);
  const [totalElixirs, setTotalElixirs] = useState(user?.nextRankElixirs || 1000);
  const [score, setScore] = useState(0);
  const [highestScore, setHighestScore] = useState(user?.highestScore || 0);
  const [wave, setWave] = useState(1);
  const [ants, setAnts] = useState([]);
  const [bossFight, setBossFight] = useState(false);
  const [bossHp, setBossHp] = useState(100);
  const [energy, setEnergy] = useState(user?.energy || 3);
  const [buffActive, setBuffActive] = useState(false);
  const [buffTimeRemaining, setBuffTimeRemaining] = useState(0);
  const [antSpeed, setAntSpeed] = useState(1500); // Base speed
  const [spawnRate, setSpawnRate] = useState(800); // Base spawn rate
  const [accuracy, setAccuracy] = useState({ hits: 0, misses: 0 });
  const [showTutorial, setShowTutorial] = useState(true);

  // Refs
  const spawnIntervalRef = useRef(null);
  const gameAreaRef = useRef(null);
  const audioRef = useRef(null);
  const difficultyTimerRef = useRef(null);

  // Skill system
  const [skills, setSkills] = useState({
    shadowSlash: {
      name: "Slash",
      description: "Kill all ants",
      cooldown: 15000,
      isReady: true,
      lastUsed: 0,
    }
  });

  // Power-ups and debuffs
  const [activePowerUps, setActivePowerUps] = useState({
    doubleElixir: false,
    smokeScreen: false,
  });

  // Sound effects
  const sounds = {
    hit: "/sounds/hit.mp3",
    miss: "/sounds/miss.mp3",
    boss: "/sounds/boss.mp3",
    victory: "/sounds/victory.mp3",
    gameOver: "/sounds/gameover.mp3",
    skill: "/sounds/skill.mp3",
    powerUp: "/sounds/powerup.mp3",
  };

  // Play sound effect
  const playSound = (soundName) => {
    if (audioRef.current) {
      audioRef.current.src = sounds[soundName];
      audioRef.current.play().catch((err) => console.error("Audio playback error:", err));
    }
  };

  // Initialize game
  const startGame = () => {
    if (energy <= 0) {
      alert("No energy left! Wait for daily reset or purchase more energy.");
      return;
    }

    setGameActive(true);
    setGameOver(false);
    setHp(100);
    setScore(0);
    setWave(1);
    setAnts([]);
    setBossFight(false);
    setBossHp(100);
    setAccuracy({ hits: 0, misses: 0 });
    setAntSpeed(1500);
    setSpawnRate(800);
    setEnergy((prev) => prev - 1);

    // Start difficulty timer
    difficultyTimerRef.current = setInterval(() => {
      setAntSpeed(prev => Math.max(500, prev * 0.95)); // Increase speed (lower value = faster)
      setSpawnRate(prev => Math.max(300, prev * 0.95)); // Increase spawn rate
    }, 10000); // Increase difficulty every 10 seconds

    startSpawningAnts();
    saveGameState();
  };

  // Handle game over
  const handleGameOver = () => {
    clearInterval(spawnIntervalRef.current);
    clearInterval(difficultyTimerRef.current);
    setGameActive(false);
    setGameOver(true);
    playSound("gameOver");
    
    // Update highest score if current score is higher
    if (score > highestScore) {
      setHighestScore(score);
    }
    saveGameState();
  };

  // Start spawning ants
  const startSpawningAnts = () => {
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
    }

    spawnIntervalRef.current = setInterval(() => {
      if (bossFight) return;

      spawnAnt();

      // Trigger boss fight every 10 ants
      const aliveAnts = ants.filter(ant => ant.alive);
      if (aliveAnts.length > 0 && aliveAnts.length % 10 === 0) {
        triggerBossFight();
      }
    }, spawnRate);
  };

  // Spawn a new ant
  const spawnAnt = () => {
    const directions = ["up", "down", "left", "right"];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];

    const antTypes = [
      { type: "basic", points: 10, hp: 1, color: "brown" },
      { type: "elite", points: 25, hp: 2, color: "red" },
      { type: "rare", points: 50, hp: 1, color: "purple" },
      { type: "tough", points: 75, hp: 3, color: "blue" },
      { type: "bossy", points: 100, hp: 4, color: "black" },
    ];

    // Ant distribution (35% basic, 35% elite, 15% rare, 10% tough, 5% bossy)
    const antTypeWeights = [0.35, 0.35, 0.15, 0.10, 0.05];

    let cumulativeWeight = 0;
    let selectedAntTypeIndex = 0;
    const randomValue = Math.random();
    for (let i = 0; i < antTypeWeights.length; i++) {
      cumulativeWeight += antTypeWeights[i];
      if (randomValue <= cumulativeWeight) {
        selectedAntTypeIndex = i;
        break;
      }
    }

    const selectedAntType = antTypes[selectedAntTypeIndex];

    const newAnt = {
      id: Date.now() + Math.random(),
      direction: randomDirection,
      progress: 0,
      alive: true,
      ...selectedAntType,
    };

    setAnts((prevAnts) => [...prevAnts, newAnt]);
  };

  // Trigger boss fight
  const triggerBossFight = () => {
    clearInterval(spawnIntervalRef.current);
    setBossFight(true);
    setBossHp(100 + wave * 20);
    playSound("boss");
    setAnts([]);
  };

  // End boss fight and continue game
  const endBossFight = () => {
    setBossFight(false);
    setWave((prev) => prev + 1);
    startSpawningAnts();
    triggerRandomEffect();
  };

  // Attack boss
  const attackBoss = () => {
    setBossHp((prev) => {
      const damage = buffActive ? 12 : 10;
      const newHp = Math.max(0, prev - damage);

      if (newHp <= 0) {
        const bossElixirs = 50 + wave * 25;
        const bossScore = 500 + wave * 100;

        setElixirs((prev) => prev + bossElixirs);
        setScore((prev) => prev + bossScore);
        playSound("victory");

        if (Math.random() < 0.25) {
          activateHunterBuff();
        }

        endBossFight();
      }

      return newHp;
    });
  };

  // Activate hunter buff
  const activateHunterBuff = () => {
    setBuffActive(true);
    setBuffTimeRemaining(24 * 60 * 60);

    const buffInterval = setInterval(() => {
      setBuffTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(buffInterval);
          setBuffActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle ant click
  const handleAntClick = (antId, clickedDirection) => {
    setAnts((prevAnts) =>
      prevAnts.map((ant) => {
        if (ant.id === antId) {
          if (ant.direction === clickedDirection) {
            playSound("hit");
            setAccuracy((prev) => ({
              ...prev,
              hits: prev.hits + 1,
            }));

            const pointsGained = ant.points * (buffActive ? 1.5 : 1);
            const elixirsGained = Math.ceil(pointsGained / 10) * (activePowerUps.doubleElixir ? 2 : 1);

            setScore((prev) => prev + pointsGained);
            setElixirs((prev) => prev + elixirsGained);

            if (ant.hp <= 1) {
              return { ...ant, alive: false };
            } else {
              return { ...ant, hp: ant.hp - 1 };
            }
          } else {
            setAccuracy((prev) => ({
              ...prev,
              misses: prev.misses + 1,
            }));
            return ant;
          }
        }
        return ant;
      })
    );
    saveGameState();
  };

  // Use skill
  const useSkill = (skillName) => {
    const now = Date.now();
    const skill = skills[skillName];

    if (!skill.isReady || now - skill.lastUsed < skill.cooldown) {
      return;
    }

    playSound("skill");

    setSkills((prev) => ({
      ...prev,
      [skillName]: {
        ...prev[skillName],
        isReady: false,
        lastUsed: now,
      },
    }));

    setAnts((prevAnts) => prevAnts.map((ant) => ({ ...ant, alive: false })));

    setTimeout(() => {
      setSkills((prev) => ({
        ...prev,
        [skillName]: {
          ...prev[skillName],
          isReady: true,
        },
      }));
    }, skill.cooldown);
  };

  // Trigger random power-up or debuff
  const triggerRandomEffect = () => {
    const effects = [
      { type: "doubleElixir", positive: true, duration: 10000 },
      { type: "smokeScreen", positive: false, duration: 5000 },
    ];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];

    playSound("powerUp");

    setActivePowerUps((prev) => ({
      ...prev,
      [randomEffect.type]: true,
    }));

    setTimeout(() => {
      setActivePowerUps((prev) => ({
        ...prev,
        [randomEffect.type]: false,
      }));
    }, randomEffect.duration);
  };

  // Format time for buff display
  const formatBuffTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Update ant progress
  useEffect(() => {
    if (!gameActive || bossFight) return;

    const progressInterval = setInterval(() => {
      setAnts((prevAnts) => {
        if (prevAnts.length === 0) return [];

        return prevAnts
          .map((ant) => {
            if (!ant.alive) return ant;

            const newProgress = ant.progress + (1000 / antSpeed) * 0.1;

            if (newProgress >= 1) {
              setHp((prevHp) => {
                const damage = ant.type === "elite" ? 15 : 10;
                const newHp = Math.max(0, prevHp - damage);
                if (newHp <= 0) {
                  handleGameOver();
                }
                return newHp;
              });

              setAccuracy((prev) => ({
                ...prev,
                misses: prev.misses + 1,
              }));

              playSound("miss");

              return { ...ant, alive: false };
            }

            return { ...ant, progress: newProgress };
          })
          .filter((ant) => ant.alive || ant.progress < 1.2);
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [gameActive, bossFight, antSpeed]);

  // Reset skill cooldowns
  useEffect(() => {
    const skillCooldownCheck = setInterval(() => {
      const now = Date.now();
      setSkills((prevSkills) => {
        const updatedSkills = { ...prevSkills };
        Object.keys(updatedSkills).forEach((skillName) => {
          const skill = updatedSkills[skillName];
          if (!skill.isReady && now - skill.lastUsed >= skill.cooldown) {
            updatedSkills[skillName] = {
              ...skill,
              isReady: true,
            };
          }
        });
        return updatedSkills;
      });
    }, 1000);

    return () => clearInterval(skillCooldownCheck);
  }, []);

  // Save game state to Firebase
  const saveGameState = () => {
    if (user?.uid) {
      const updatedUser = {
        ...user,
        health: hp,
        elixirs: elixirs,
        nextRankElixirs: totalElixirs,
        energy: energy,
        highestScore: Math.max(highestScore, score),
      };

      updateUserData(user, {
        user: updatedUser,
      }).catch((error) => console.error("Error saving game state:", error));

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
      if (difficultyTimerRef.current) {
        clearInterval(difficultyTimerRef.current);
      }
      saveGameState();
    };
  }, []);

  // Handle input (keyboard and touch)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameActive) return;

      let direction = null;

      switch (e.key) {
        case "ArrowUp":
          direction = "up";
          break;
        case "ArrowDown":
          direction = "down";
          break;
        case "ArrowLeft":
          direction = "left";
          break;
        case "ArrowRight":
          direction = "right";
          break;
        case "1":
          useSkill("shadowSlash");
          return;
        default:
          return;
      }

      if (bossFight) {
        attackBoss();
      } else {
        const matchingAnts = ants.filter(
          (ant) => ant.alive && ant.direction === direction
        );
        if (matchingAnts.length > 0) {
          matchingAnts.sort((a, b) => b.progress - a.progress);
          handleAntClick(matchingAnts[0].id, direction);
        }
      }
    };

    const handleTouch = (e) => {
      if (!gameActive || bossFight) return;

      const touch = e.touches[0];
      const rect = gameAreaRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      let direction = "";

      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? "right" : "left";
      } else {
        direction = dy > 0 ? "down" : "up";
      }

      const matchingAnts = ants.filter(
        (ant) => ant.alive && ant.direction === direction
      );
      if (matchingAnts.length > 0) {
        matchingAnts.sort((a, b) => b.progress - a.progress);
        handleAntClick(matchingAnts[0].id, direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    gameAreaRef.current?.addEventListener("touchstart", handleTouch, {
      passive: true,
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      gameAreaRef.current?.removeEventListener("touchstart", handleTouch);
    };
  }, [gameActive, bossFight, ants]);

  // Render tutorial modal
  const renderTutorial = () => {
    return (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-900 border-2 border-purple-600 rounded-lg p-6 max-w-md w-full mx-4"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-purple-400 mb-4">
            Ant Nest Raid Tutorial
          </h2>

          <div className="space-y-4 text-gray-300 text-sm">
            <p>
              Welcome to the Ant Nest Raid! Your mission is to defeat the ant
              colony and collect valuable Elixirs.
            </p>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">
                Controls:
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Use <span className="text-yellow-400">Arrow Keys</span> or
                  swipe on touch devices to attack ants
                </li>
                <li>
                  Press <span className="text-yellow-400">1</span> to use Shadow
                  Slash (kills all ants)
                </li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">
                Ant Types:
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="text-yellow-600">Basic</span> - 1 hit</li>
                <li><span className="text-red-500">Elite</span> - 2 hits</li>
                <li><span className="text-purple-500">Rare</span> - 1 hit (high points)</li>
                <li><span className="text-blue-500">Tough</span> - 3 hits</li>
                <li><span className="text-black">Bossy</span> - 4 hits</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">
                Boss Fights:
              </h3>
              <p>
                Every 10 ants, a boss will appear! Attack quickly to defeat it.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">
                Energy System:
              </h3>
              <p>You have 3 energy per day to play.</p>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg text-sm"
              onClick={() => setShowTutorial(false)}
            >
              Start Game
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Ant component
  const Ant = ({ ant, onClick, gameActive }) => {
    if (!ant.alive) return null;

    const getPosition = () => {
      const center = { x: 50, y: 50 };
      const distance = 45 * ant.progress;

      switch (ant.direction) {
        case "up":
          return { x: center.x, y: center.y - distance };
        case "down":
          return { x: center.x, y: center.y + distance };
        case "left":
          return { x: center.x - distance, y: center.y };
        case "right":
          return { x: center.x + distance, y: center.y };
        default:
          return center;
      }
    };

    const position = getPosition();

    return (
      <motion.div
        className={`absolute w-3 h-3 rounded-full cursor-pointer z-10 flex items-center justify-center ${
          ant.type === "elite"
            ? "bg-red-500"
            : ant.type === "rare"
            ? "bg-purple-500"
            : ant.type === "tough"
            ? "bg-blue-500"
            : ant.type === "bossy"
            ? "bg-black"
            : "bg-yellow-600"
        }`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.8 }}
        onClick={() => gameActive && onClick(ant.id, ant.direction)}
      >
        {(ant.type === "elite" || ant.type === "tough" || ant.type === "bossy") && ant.hp > 1 && (
          <div className="absolute -top-2 text-xs font-bold text-white bg-red-700 px-1 rounded">
            {ant.hp}
          </div>
        )}
      </motion.div>
    );
  };

  // Render the game UI
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col z-50 overflow-hidden">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition shadow-lg"
        aria-label="Close game"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Game Title */}
      <motion.div
        className="text-center pt-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          Ant Nest Raid
        </h1>
        <p className="text-purple-300 mt-1 text-xs">
          Jeju Island • Solo Leveling
        </p>
      </motion.div>

      {/* Main Game Area */}
      <div className="flex flex-col md:flex-row flex-1 w-full p-4 gap-4">
        {/* Left Side - Game Circle */}
        <div className="flex-1 flex items-center justify-center min-h-[50vh] md:min-h-auto md:w-2/3">
          <div
            ref={gameAreaRef}
            className="relative w-full h-full max-w-[400px] max-h-[400px] aspect-square bg-black rounded-full border-4 border-yellow-600 overflow-hidden mx-auto shadow-lg"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-900 border-4 border-red-600 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-red-600 animate-pulse"></div>
              </div>
            </div>

            {ants.map((ant) => (
              <Ant
                key={ant.id}
                ant={ant}
                onClick={handleAntClick}
                gameActive={gameActive}
              />
            ))}

            {bossFight && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-32 h-32 rounded-full bg-red-900 border-4 border-red-600 flex items-center justify-center cursor-pointer shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={attackBoss}
                >
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-400">BOSS</div>
                    <div className="w-full h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-yellow-500"
                        style={{ width: `${bossHp}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-white mt-1">{bossHp}/100</div>
                  </div>
                </motion.div>
              </div>
            )}

            {activePowerUps.doubleElixir && (
              <motion.div
                className="absolute top-4 left-4 bg-yellow-900 bg-opacity-70 border border-yellow-500 rounded-full px-2 py-1 shadow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-yellow-300 text-xs">2x Elixir</span>
              </motion.div>
            )}

            {activePowerUps.smokeScreen && (
              <motion.div
                className="absolute top-4 right-4 bg-gray-700 bg-opacity-70 border border-gray-500 rounded-full px-2 py-1 shadow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-gray-300 text-xs">Smoke Screen</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Side - Stats and Controls */}
        <div className="w-full md:w-1/3 flex flex-col gap-3">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700 shadow">
              <p className="text-gray-400 text-xs truncate">HP</p>
              <div className="mt-1 h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                  style={{ width: `${hp}%` }}
                ></div>
              </div>
              <p className="mt-1 text-sm font-bold">{hp}/100</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700 shadow">
              <p className="text-gray-400 text-xs truncate">Wave</p>
              <p className="text-lg font-bold text-purple-400">{wave}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700 shadow">
              <p className="text-gray-400 text-xs truncate">Score</p>
              <p className="text-lg font-bold text-yellow-400">{score}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700 shadow">
              <p className="text-gray-400 text-xs truncate">High Score</p>
              <p className="text-lg font-bold text-purple-400">{highestScore}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700 shadow">
              <p className="text-gray-400 text-xs truncate">Elixirs</p>
              <div className="flex items-center justify-center">
                <p className="text-lg font-bold text-green-400">{elixirs}</p>
                <span className="text-gray-500 mx-1">/</span>
                <p className="text-xs text-gray-300">{totalElixirs}</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700 shadow">
              <p className="text-gray-400 text-xs truncate">Speed</p>
              <p className="text-lg font-bold text-blue-400">
                {Math.round((1500 / antSpeed) * 100)}%
              </p>
            </div>
          </div>

          {/* Energy and Buff */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 shadow">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">Energy:</span>
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < energy ? "bg-blue-500" : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {buffActive && (
                <motion.div
                  className="bg-purple-900 bg-opacity-70 border border-purple-500 rounded-full px-2 py-1 flex items-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <span className="text-purple-300 text-xs">Buff</span>
                  <span className="text-yellow-300 text-xs ml-1">
                    {formatBuffTime(buffTimeRemaining)}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Direction Controls */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 shadow">
            <p className="text-gray-300 text-xs mb-2 text-center">
              Attack Directions
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div></div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 flex items-center justify-center border border-gray-600"
                onClick={() => {
                  if (bossFight) attackBoss();
                  else {
                    const upAnts = ants.filter(
                      (a) => a.direction === "up" && a.alive
                    );
                    if (upAnts.length > 0) handleAntClick(upAnts[0].id, "up");
                  }
                }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </motion.button>
              <div></div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 flex items-center justify-center border border-gray-600"
                onClick={() => {
                  if (bossFight) attackBoss();
                  else {
                    const leftAnts = ants.filter(
                      (a) => a.direction === "left" && a.alive
                    );
                    if (leftAnts.length > 0)
                      handleAntClick(leftAnts[0].id, "left");
                  }
                }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 flex items-center justify-center border border-gray-600"
                onClick={() => {
                  if (bossFight) attackBoss();
                  else {
                    const downAnts = ants.filter(
                      (a) => a.direction === "down" && a.alive
                    );
                    if (downAnts.length > 0)
                      handleAntClick(downAnts[0].id, "down");
                  }
                }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 flex items-center justify-center border border-gray-600"
                onClick={() => {
                  if (bossFight) attackBoss();
                  else {
                    const rightAnts = ants.filter(
                      (a) => a.direction === "right" && a.alive
                    );
                    if (rightAnts.length > 0)
                      handleAntClick(rightAnts[0].id, "right");
                  }
                }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 shadow">
            <p className="text-gray-300 text-xs mb-2 text-center">Skills</p>
            <div className="flex justify-center">
              {Object.entries(skills).map(([key, skill]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: skill.isReady ? 1.05 : 1 }}
                  whileTap={{ scale: skill.isReady ? 0.95 : 1 }}
                  className={`rounded-lg p-2 flex flex-col items-center justify-center border w-full ${
                    skill.isReady
                      ? "bg-purple-800 hover:bg-purple-700 border-purple-600"
                      : "bg-gray-700 border-gray-600"
                  }`}
                  onClick={() => useSkill(key)}
                  disabled={!skill.isReady}
                >
                  <div className="text-xs text-purple-300 truncate w-full text-center">
                    {skill.name}
                  </div>
                  {!skill.isReady && (
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-purple-500"
                        style={{
                          width: `${Math.max(
                            0,
                            100 -
                              ((Date.now() - skill.lastUsed) / skill.cooldown) *
                                100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div className="grid grid-cols-2 gap-2">
            {!gameActive ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg text-sm"
                onClick={startGame}
                disabled={energy <= 0}
              >
                {energy <= 0 ? "No Energy Left" : "Start Game"}
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg text-sm"
                  onClick={handleGameOver}
                >
                  Surrender
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg text-sm"
                  onClick={onClose}
                >
                  Exit
                </motion.button>
              </>
            )}
          </div>
          {/* Accuracy Stats */}
          {gameActive && (
            <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700 shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-xs">Accuracy</p>
                  <p className="text-sm font-bold">
                    {accuracy.hits + accuracy.misses > 0
                      ? Math.round(
                          (accuracy.hits / (accuracy.hits + accuracy.misses)) * 100
                        )
                      : 100}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Killed</p>
                  <p className="text-sm font-bold text-green-400">
                    {accuracy.hits}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Missed</p>
                  <p className="text-sm font-bold text-red-400">
                    {accuracy.misses}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Button */}
      {!showTutorial && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-4 left-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg z-10"
          onClick={() => setShowTutorial(true)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </motion.button>
      )}

      <AnimatePresence>{showTutorial && renderTutorial()}</AnimatePresence>
      <audio ref={audioRef} />
    </div>
  );
};

export default AntNestRaidGame;