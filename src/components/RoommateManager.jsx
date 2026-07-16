import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

export default function RoommateManager({ roommates, setRoommates }) {
  const [newName, setNewName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (name && !roommates.includes(name)) {
      setRoommates([...roommates, name]);
      setNewName('');
    }
  };

  const removeRoommate = (nameToRemove) => {
    setRoommates(roommates.filter(r => r !== nameToRemove));
  };

  return (
    <div className="uiverse-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-brand-text mb-6">1. Roommate Manager</h2>
      
      <form onSubmit={handleAdd} className="flex gap-4 mb-8">
        <Input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add roommate name..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newName.trim()}>
          <Plus className="h-5 w-5 mr-1" />
          Add
        </Button>
      </form>

      {roommates.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {roommates.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 bg-white text-brand-text border border-brand-border px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:border-brand-border-hover hover:shadow-md hover:scale-[1.02]"
            >
              {name}
              <button
                type="button"
                onClick={() => removeRoommate(name)}
                className="text-gray-400 hover:text-brand-danger hover:bg-red-50 rounded-md p-0.5 focus:outline-none transition-colors ml-1"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-brand-text-secondary text-sm italic">No roommates added yet.</p>
      )}
    </div>
  );
}
