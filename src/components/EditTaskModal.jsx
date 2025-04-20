import { useState } from "react";

export default function EditTaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || "Easy");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [resetFrequency, setResetFrequency] = useState(
    initialData?.resetFrequency || "Daily"
  );

  const handleSave = () => {
    if (!title || !notes) {
      alert("Please fill in all fields.");
      return;
    }
    onSave({
      title,
      notes,
      difficulty,
      tags: tags.split(",").map((tag) => tag.trim()),
      resetFrequency,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      onDelete();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2
          className="text-xl font-bold text-yellow-500 mb-4"
          style={{ fontFamily: "'Press Start 2P', sans-serif" }}
        >
          Edit Task
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 w-full"
            aria-label="Task title"
          />

          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 w-full"
            aria-label="Task notes"
          />

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 w-full"
            aria-label="Task difficulty"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 w-full"
            aria-label="Task tags"
          />

          <select
            value={resetFrequency}
            onChange={(e) => setResetFrequency(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 w-full"
            aria-label="Task reset frequency"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 anime-button"
              style={{ fontFamily: "'Press Start 2P', sans-serif" }}
              aria-label="Delete task"
            >
              Delete Task
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 anime-button"
                style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                aria-label="Cancel editing"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-200 anime-button"
                style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                aria-label="Save changes"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}