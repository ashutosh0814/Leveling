import TaskCard from "./TaskCard";

export default function TaskSection({ title, tasks, onAdd, onComplete, onEdit, onDelete }) {
  return (
    <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg shadow-md w-full border-2 border-gray-700 h-[calc(100vh-250px)]">
      <div className="flex justify-between items-center mb-4">
        <h3
          className="text-lg font-bold text-yellow-500"
          style={{ fontFamily: "'Press Start 2P', sans-serif" }}
        >
          {title.toUpperCase()}
        </h3>
        <span className="text-sm text-gray-400">{tasks.length} TASKS</span>
      </div>

      <div className="max-h-[calc(100%-100px)] overflow-y-auto pr-2 scrollbar-custom">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No tasks yet</p>
        )}
      </div>

      <button
        onClick={onAdd}
        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm mt-4 w-full transition"
        style={{ fontFamily: "'Press Start 2P', sans-serif" }}
      >
        + ADD {title.split(' ')[0].toUpperCase()}
      </button>
    </div>
  );
}