import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth, ensureUserDocument, updateUserData } from "../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import TaskSection from "../components/TaskSection";
import TaskModal from "../components/TaskModal";
import EditTaskModal from "../components/EditTaskModal";
import OnboardingModal from "../components/OnboardingModal";
import ChallengeModal from "../components/ChallengeModal";
import InsightsModal from "../components/InsightsModal";

const AVATARS = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
];

export default function Dashboard() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState({
    name: "New Adventurer",
    avatar: "/avatars/default.png",
    level: 1,
    rank: "E",
    health: 100,
    xp: 0,
    elixirs: 0,
    nextRankElixirs: 10000,
    completedChallenges: [],
    taskHistory: [],
  });

  const [currentWallpaper, setCurrentWallpaper] = useState("E Rank Wallpaper");
  const [dailyQuests, setDailyQuests] = useState([]);
  const [weeklyDungeons, setWeeklyDungeons] = useState([]);
  const [monthlyGoals, setMonthlyGoals] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentCategory, setCurrentCategory] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userData = await ensureUserDocument(user);

          setUser({
            ...userData.user,
            completedChallenges: userData.user.completedChallenges || [],
            taskHistory: userData.user.taskHistory || [],
          });
          setDailyQuests(userData.dailyQuests || []);
          setWeeklyDungeons(userData.weeklyDungeons || []);
          setMonthlyGoals(userData.monthlyGoals || []);
          setCurrentWallpaper(userData.currentWallpaper || "E Rank Wallpaper");

          const isFirstTime = router.query.firstTime === "true";
          const hasCompletedOnboarding = localStorage.getItem(
            "hasCompletedOnboarding"
          );

          if (isFirstTime && !hasCompletedOnboarding) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router.query]);

  const completeOnboarding = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    setShowOnboarding(false);
  };

  const handleAddTask = (category) => {
    setEditingTask(null);
    setCurrentCategory(category);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (id, category) => {
    const taskToEdit =
      category === "Daily Quests"
        ? dailyQuests.find((task) => task.id === id)
        : category === "Weekly Dungeons"
        ? weeklyDungeons.find((task) => task.id === id)
        : monthlyGoals.find((task) => task.id === id);

    setEditingTask(taskToEdit);
    setCurrentCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = async (id, category) => {
    let updatedTasks;
    let fieldName;

    if (category === "Daily Quests") {
      updatedTasks = dailyQuests.filter((task) => task.id !== id);
      setDailyQuests(updatedTasks);
      fieldName = "dailyQuests";
    } else if (category === "Weekly Dungeons") {
      updatedTasks = weeklyDungeons.filter((task) => task.id !== id);
      setWeeklyDungeons(updatedTasks);
      fieldName = "weeklyDungeons";
    } else if (category === "Monthly Goals") {
      updatedTasks = monthlyGoals.filter((task) => task.id !== id);
      setMonthlyGoals(updatedTasks);
      fieldName = "monthlyGoals";
    }

    try {
      if (auth.currentUser) {
        await updateUserData(auth.currentUser, {
          [fieldName]: updatedTasks,
        });
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleCompleteTask = async (id, category) => {
    let updatedTasks;
    let elixirReward = 0;
    let fieldName;
    const completedAt = new Date().toISOString();

    if (category === "Daily Quests") {
      updatedTasks = dailyQuests.map((task) =>
        task.id === id ? { ...task, completed: true, completedAt } : task
      );
      setDailyQuests(updatedTasks);
      elixirReward = 10;
      fieldName = "dailyQuests";
    } else if (category === "Weekly Dungeons") {
      updatedTasks = weeklyDungeons.map((task) =>
        task.id === id ? { ...task, completed: true, completedAt } : task
      );
      setWeeklyDungeons(updatedTasks);
      elixirReward = 50;
      fieldName = "weeklyDungeons";
    } else if (category === "Monthly Goals") {
      updatedTasks = monthlyGoals.map((task) =>
        task.id === id ? { ...task, completed: true, completedAt } : task
      );
      setMonthlyGoals(updatedTasks);
      elixirReward = 100;
      fieldName = "monthlyGoals";
    }

    const newElixirs = Math.min(
      user.elixirs + elixirReward,
      user.nextRankElixirs
    );
    const updatedUser = {
      ...user,
      elixirs: newElixirs,
      taskHistory: [
        ...(user.taskHistory || []),
        {
          type: category,
          title: updatedTasks.find((t) => t.id === id)?.title || "Task",
          elixirs: elixirReward,
          completedAt,
        },
      ],
    };

    try {
      setUser(updatedUser);
      if (auth.currentUser) {
        await updateUserData(auth.currentUser, {
          user: updatedUser,
          [fieldName]: updatedTasks,
        });
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleSaveTask = async (taskData) => {
    let updatedTasks;
    const taskWithId = editingTask
      ? { ...editingTask, ...taskData }
      : { id: Date.now(), ...taskData, completed: false };

    let fieldName;

    if (currentCategory === "Daily Quests") {
      updatedTasks = editingTask
        ? dailyQuests.map((task) =>
            task.id === editingTask.id ? taskWithId : task
          )
        : [...dailyQuests, taskWithId];
      setDailyQuests(updatedTasks);
      fieldName = "dailyQuests";
    } else if (currentCategory === "Weekly Dungeons") {
      updatedTasks = editingTask
        ? weeklyDungeons.map((task) =>
            task.id === editingTask.id ? taskWithId : task
          )
        : [...weeklyDungeons, taskWithId];
      setWeeklyDungeons(updatedTasks);
      fieldName = "weeklyDungeons";
    } else if (currentCategory === "Monthly Goals") {
      updatedTasks = editingTask
        ? monthlyGoals.map((task) =>
            task.id === editingTask.id ? taskWithId : task
          )
        : [...monthlyGoals, taskWithId];
      setMonthlyGoals(updatedTasks);
      fieldName = "monthlyGoals";
    }

    try {
      if (auth.currentUser) {
        await updateUserData(auth.currentUser, {
          [fieldName]: updatedTasks,
        });
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsTaskModalOpen(false);
      setIsEditModalOpen(false);
    }
  };

  const handleUserUpdate = async (updatedUser) => {
    try {
      setUser(updatedUser);
      if (auth.currentUser) {
        await updateUserData(auth.currentUser, {
          user: updatedUser,
        });
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleChallengeComplete = async (elixirs) => {
    const newElixirs = Math.min(user.elixirs + elixirs, user.nextRankElixirs);
    const completedAt = new Date().toISOString();
    const updatedUser = {
      ...user,
      elixirs: newElixirs,
      completedChallenges: [...(user.completedChallenges || []), completedAt],
      taskHistory: [
        ...(user.taskHistory || []),
        {
          type: "Challenge",
          title: "Daily Challenge",
          elixirs: 200,
          completedAt,
        },
      ],
    };

    try {
      setUser(updatedUser);
      if (auth.currentUser) {
        await updateUserData(auth.currentUser, {
          user: updatedUser,
        });
      }
    } catch (error) {
      console.error("Failed to complete challenge:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <p
            className="text-yellow-500"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            LOADING QUEST...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-900 text-white min-h-screen h-screen overflow-hidden"
      style={{
        backgroundImage: 'url("/wallpapers/e-rank.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {showOnboarding && <OnboardingModal onComplete={completeOnboarding} />}
      <Navbar
        user={user}
        onUpdateUser={handleUserUpdate}
        onOpenChallenge={() => setIsChallengeModalOpen(true)}
        onOpenInsights={() => setIsInsightsModalOpen(true)}
      />

      {/* Challenge Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setIsChallengeModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-lg transition anime-button"
          style={{ fontFamily: "'Press Start 2P', sans-serif" }}
        >
          START DAILY CHALLENGE
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskSection
          title="Daily Quests"
          tasks={dailyQuests}
          onAdd={() => handleAddTask("Daily Quests")}
          onComplete={(id) => handleCompleteTask(id, "Daily Quests")}
          onEdit={(id) => handleEditTask(id, "Daily Quests")}
          onDelete={(id) => handleDeleteTask(id, "Daily Quests")}
        />

        <TaskSection
          title="Weekly Dungeons"
          tasks={weeklyDungeons}
          onAdd={() => handleAddTask("Weekly Dungeons")}
          onComplete={(id) => handleCompleteTask(id, "Weekly Dungeons")}
          onEdit={(id) => handleEditTask(id, "Weekly Dungeons")}
          onDelete={(id) => handleDeleteTask(id, "Weekly Dungeons")}
        />

        <TaskSection
          title="Monthly Goals"
          tasks={monthlyGoals}
          onAdd={() => handleAddTask("Monthly Goals")}
          onComplete={(id) => handleCompleteTask(id, "Monthly Goals")}
          onEdit={(id) => handleEditTask(id, "Monthly Goals")}
          onDelete={(id) => handleDeleteTask(id, "Monthly Goals")}
        />
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialData={editingTask}
      />
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={() => handleDeleteTask(editingTask?.id, currentCategory)}
        initialData={editingTask}
      />
      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        onComplete={handleChallengeComplete}
        user={user}
      />
      <InsightsModal
        isOpen={isInsightsModalOpen}
        onClose={() => setIsInsightsModalOpen(false)}
        userData={{
          dailyQuests,
          weeklyDungeons,
          monthlyGoals,
          completedChallenges: user.completedChallenges || [],
          taskHistory: user.taskHistory || [],
        }}
      />
    </div>
  );
}
