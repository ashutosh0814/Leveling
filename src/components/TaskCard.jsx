export default function TaskCard({ task, onComplete, onEdit, onDelete }) {
  const difficulty = task.difficulty || 'Easy';
  
  const difficultyColors = {
    'Easy': 'border-green-500',
    'Medium': 'border-blue-500',
    'Hard': 'border-red-500'
  };

  return (
    <div
      className={`relative bg-gray-800 p-2 sm:p-3 rounded-lg border-l-4 ${
        task.completed 
          ? 'border-gray-500 bg-gray-700' 
          : difficultyColors[difficulty] || 'border-yellow-500'
      } mb-1 sm:mb-2 flex items-start justify-between transition-all hover:bg-gray-750`}
    >
      <div className="flex-1 min-w-0">
        <h4
          className={`text-xs sm:text-xs truncate ${
            task.completed ? "line-through text-gray-400" : "text-white"
          }`}
          style={{ fontFamily: "'Press Start 2P', sans-serif" }}
        >
          {task.title}
        </h4>
        {task.description && (
          <p
            className={`text-xs mt-1 truncate ${
              task.completed ? "text-gray-400" : "text-gray-300"
            }`}
          >
            {task.description}
          </p>
        )}
      </div>

      <div className="flex space-x-1 ml-1 sm:ml-2">
        {!task.completed && (
          <button
            onClick={() => onComplete(task.id)}
            className="bg-green-600 hover:bg-green-700 text-white p-0.5 sm:p-1 rounded text-xs"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
            title="Complete"
          >
            ✓
          </button>
        )}
        <button
          onClick={() => onEdit(task.id)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-0.5 sm:p-1 rounded text-xs"
          style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          title="Edit"
        >
          ✎
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="bg-red-600 hover:bg-red-700 text-white p-0.5 sm:p-1 rounded text-xs"
          style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}