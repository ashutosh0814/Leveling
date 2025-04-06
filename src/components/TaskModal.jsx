import { useState } from "react";

export default function TaskModal({ isOpen, onClose, onSave, initialData }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || "Easy");
  const [resetFrequency, setResetFrequency] = useState(initialData?.resetFrequency || "Daily");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");

  const handleSave = () => {
    if (!title || !description) {
      alert("Please fill in all fields.");
      return;
    }
    onSave({ 
      title, 
      description, 
      difficulty, 
      resetFrequency, 
      tags: tags.split(",").map(tag => tag.trim()) 
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-2xl border-2 border-yellow-500">
        <h2
          className="text-2xl font-bold text-yellow-500 mb-6"
          style={{ fontFamily: "'Press Start 2P', sans-serif" }}
        >
          {initialData ? "EDIT TASK" : "ADD NEW TASK"}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">TITLE</label>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">DESCRIPTION</label>
            <textarea
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-yellow-500 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">DIFFICULTY</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">RESET FREQUENCY</label>
              <select
                value={resetFrequency}
                onChange={(e) => setResetFrequency(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">TAGS (comma separated)</label>
            <input
              type="text"
              placeholder="tag1, tag2, tag3"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg transition"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            SAVE TASK
          </button>
        </div>
      </div>
    </div>
  );
}