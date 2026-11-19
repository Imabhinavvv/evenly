import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  FolderPlus,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { GROUP_CATEGORIES, getGroupCategoryMeta } from '../utils/groupHelper';

export default function GroupManager({
  groups = [],
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onUpdateMembers,
}) {
  const [newMemberName, setNewMemberName] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('trip');
  const [newGroupInitialMembers, setNewGroupInitialMembers] = useState([]);
  const [tempMemberInput, setTempMemberInput] = useState('');

  // Edit Group Form State
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupCategory, setEditGroupCategory] = useState('home');

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || null;

  const activeMembers = activeGroup?.members || [];
  const activeMeta = getGroupCategoryMeta(activeGroup?.category);

  // Dismiss modals on back gesture
  useEffect(() => {
    if (!isCreateModalOpen && !isEditingGroup) return;
    const handleBack = (e) => {
      e.preventDefault();
      if (isEditingGroup) {
        setIsEditingGroup(false);
      } else if (isCreateModalOpen) {
        setIsCreateModalOpen(false);
      }
    };
    window.addEventListener('hardwareBack', handleBack);
    return () => window.removeEventListener('hardwareBack', handleBack);
  }, [isCreateModalOpen, isEditingGroup]);

  // Add member to active group
  const handleAddMember = (e) => {
    e.preventDefault();
    const name = newMemberName.trim();
    if (name && !activeMembers.includes(name)) {
      onUpdateMembers([...activeMembers, name]);
      setNewMemberName('');
    }
  };

  // Remove member from active group
  const handleRemoveMember = (nameToRemove) => {
    onUpdateMembers(activeMembers.filter((m) => m !== nameToRemove));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setNewGroupName('');
    setNewGroupCategory('trip');
    setNewGroupInitialMembers([]);
    setTempMemberInput('');
    setIsCreateModalOpen(true);
  };

  // Add initial member chip in create modal
  const handleAddInitialMember = (e) => {
    if (e) e.preventDefault();
    const name = tempMemberInput.trim();
    if (name && !newGroupInitialMembers.includes(name)) {
      setNewGroupInitialMembers([...newGroupInitialMembers, name]);
      setTempMemberInput('');
    }
  };

  const handleRemoveInitialMember = (nameToRemove) => {
    setNewGroupInitialMembers(newGroupInitialMembers.filter((m) => m !== nameToRemove));
  };

  // Submit Create Group
  const handleSubmitCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    onCreateGroup({
      name: newGroupName.trim(),
      category: newGroupCategory,
      initialMembers: newGroupInitialMembers,
    });

    setIsCreateModalOpen(false);
  };

  // Start Editing Group
  const handleStartEdit = () => {
    if (!activeGroup) return;
    setEditGroupName(activeGroup.name);
    setEditGroupCategory(activeGroup.category || 'home');
    setIsEditingGroup(true);
  };

  // Submit Edit Group
  const handleSubmitEditGroup = (e) => {
    e.preventDefault();
    if (!activeGroup || !editGroupName.trim()) return;

    onUpdateGroup(activeGroup.id, {
      name: editGroupName.trim(),
      category: editGroupCategory,
    });

    setIsEditingGroup(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Description on left, New Group Icon button on right */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-brand-text mb-0">
            1. Groups & Members
          </h2>
          <p className="text-xs text-brand-text-secondary mt-1">
            Create groups for trips, events or apartments and split expenses amongst their members
          </p>
        </div>

        {groups.length > 0 && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            aria-label="New Group"
            title="New Group"
            className="p-2 sm:p-2.5 rounded-xl border border-evenly-coral-deep/40 text-brand-text hover:bg-evenly-coral/20 bg-brand-surface-subtle flex items-center justify-center shrink-0 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <FolderPlus className="w-5 h-5 text-evenly-coral-deep" />
          </button>
        )}
      </div>

      {!activeGroup || groups.length === 0 ? (
        <div className="bg-brand-bg/40 rounded-2xl border border-brand-border p-8 sm:p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-evenly-coral/15 flex items-center justify-center mx-auto mb-4 text-evenly-coral-deep">
            <FolderPlus className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-brand-text mb-1">
            No Groups Created Yet
          </h3>
          <p className="text-xs sm:text-sm text-brand-text-secondary max-w-sm mx-auto mb-5 leading-relaxed">
            Create a group for trips, outings, or roommates to start adding members and splitting expenses.
          </p>
          <Button onClick={handleOpenCreateModal} size="sm" className="font-bold inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Create First Group
          </Button>
        </div>
      ) : (
        <>
          {/* 2. Group Pills Selector */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
            {groups.map((grp) => {
              const isSelected = grp.id === activeGroup?.id;
              const meta = getGroupCategoryMeta(grp.category);
              const GrpIcon = meta.icon;
              const membersCount = grp.members?.length || 0;

              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => onSelectGroup(grp.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-evenly-coral text-brand-text border-evenly-coral-deep/50 shadow-xs font-bold scale-[1.02]'
                      : 'bg-evenly-surface text-brand-text border-brand-border hover:border-brand-border-hover hover:bg-evenly-sage/30'
                  }`}
                >
                  {GrpIcon && <GrpIcon className="w-3.5 h-3.5 shrink-0 text-brand-primary" />}
                  <span className="max-w-[140px] truncate">{grp.name}</span>
                  <span className="text-[11px] opacity-75 font-medium">({membersCount})</span>
                </button>
              );
            })}
          </div>

          {/* 3. Active Group Details Card */}
          <div className="bg-brand-bg/40 rounded-2xl border border-brand-border p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-brand-border/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-evenly-coral/15 border border-brand-border/60 flex items-center justify-center text-brand-primary shrink-0">
                  {activeMeta.icon && React.createElement(activeMeta.icon, { className: 'w-5 h-5' })}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-brand-text truncate">
                      {activeGroup.name}
                    </h3>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="p-1 rounded-md text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors cursor-pointer"
                      title="Rename or edit group"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-brand-text-secondary font-medium">
                    {activeMeta.label} • {activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </div>

              {activeGroup && (
                <button
                  type="button"
                  onClick={() => onDeleteGroup(activeGroup.id)}
                  className="p-2 rounded-xl text-brand-text-secondary hover:text-brand-danger hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors cursor-pointer"
                  title={`Delete group "${activeGroup.name}"`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Add Member Form - Single unified text field with + on the right */}
            <form onSubmit={handleAddMember} className="relative flex items-center mb-5">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder={activeGroup ? `Add person to ${activeGroup.name}...` : 'Add member name...'}
                className="w-full pr-11 py-2.5 pl-3.5 rounded-xl border border-brand-border bg-evenly-surface text-brand-text placeholder:text-brand-text-secondary/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
              <button
                type="submit"
                disabled={!newMemberName.trim() || activeMembers.includes(newMemberName.trim())}
                className="absolute right-1.5 p-1.5 rounded-lg text-brand-primary hover:bg-evenly-sage transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Add member"
                aria-label="Add member"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Members List - Clean vertical list with name on left, cross on right */}
            {activeMembers.length > 0 ? (
              <div>
                <p className="text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2">
                  Group Members ({activeMembers.length})
                </p>
                <div className="rounded-xl border border-brand-border/70 divide-y divide-brand-border/50 bg-evenly-surface max-h-48 sm:max-h-56 overflow-y-auto custom-scrollbar">
                  {activeMembers.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm hover:bg-brand-bg/40 transition-colors"
                    >
                      <span className="font-semibold text-brand-text truncate">{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(name)}
                        className="p-1 rounded-md text-brand-text-secondary hover:text-brand-danger hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        title={activeGroup ? `Remove ${name} from ${activeGroup.name}` : `Remove ${name}`}
                        aria-label={`Remove ${name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-brand-text-secondary text-xs sm:text-sm italic border border-dashed border-brand-border/60 rounded-xl">
                No participants in this group yet. Add names above to split bills.
              </div>
            )}
          </div>
        </>
      )}

      {/* 4. Modal: Create New Group */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div className="bg-evenly-surface rounded-3xl shadow-2xl max-w-lg w-full my-auto relative z-10 p-6 sm:p-8 border border-brand-border modal-animate-in">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-evenly-coral/20 flex items-center justify-center text-evenly-coral-deep">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-text">Create New Group</h3>
                  <p className="text-xs text-brand-text-secondary">
                    Create a group for trips, events, outings or flatmates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreateGroup} className="space-y-5">
              {/* Group Name */}
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-1.5">
                  Group Name
                </label>
                <Input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip, Manali Trek, Apartment 4B..."
                  autoFocus
                  required
                />
              </div>

              {/* Group Category */}
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {GROUP_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewGroupCategory(cat.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          newGroupCategory === cat.id
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-text font-bold shadow-xs'
                            : 'border-brand-border bg-brand-bg/50 hover:bg-evenly-surface text-brand-text-secondary'
                        }`}
                      >
                        {CatIcon && <CatIcon className="w-4 h-4 text-brand-primary" />}
                        <span className="text-[10px] truncate max-w-full font-medium">{cat.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Members */}
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-1.5">
                  Initial Members (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={tempMemberInput}
                    onChange={(e) => setTempMemberInput(e.target.value)}
                    placeholder="Add person name..."
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInitialMember();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInitialMember}
                    disabled={!tempMemberInput.trim()}
                  >
                    Add
                  </Button>
                </div>

                {newGroupInitialMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 p-2.5 rounded-xl bg-brand-bg/60 border border-brand-border/60 max-h-28 overflow-y-auto custom-scrollbar">
                    {newGroupInitialMembers.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-evenly-surface text-brand-text border border-brand-border"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={() => handleRemoveInitialMember(m)}
                          className="text-stone-400 hover:text-brand-danger"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newGroupName.trim()}
                  className="bg-brand-primary text-white font-bold"
                >
                  Create Group
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Edit Group Info */}
      {isEditingGroup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditingGroup(false)}
          />

          <div className="bg-evenly-surface rounded-3xl shadow-2xl max-w-md w-full my-auto relative z-10 p-6 sm:p-8 border border-brand-border modal-animate-in">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-brand-border">
              <h3 className="text-lg font-bold text-brand-text">Edit Group Info</h3>
              <button
                type="button"
                onClick={() => setIsEditingGroup(false)}
                className="p-1.5 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-1.5">
                  Group Name
                </label>
                <Input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GROUP_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditGroupCategory(cat.id)}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer ${
                          editGroupCategory === cat.id
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-text font-bold shadow-xs'
                            : 'border-brand-border bg-brand-bg/50 hover:bg-evenly-surface text-brand-text-secondary'
                        }`}
                      >
                        {CatIcon && <CatIcon className="w-3.5 h-3.5 text-brand-primary" />}
                        <span className="truncate">{cat.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingGroup(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!editGroupName.trim()}
                  className="bg-brand-primary text-white font-bold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
