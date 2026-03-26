import { useState, useMemo } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import TaskItem from './TaskItem'
import TaskInput from './TaskInput'
import {
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react'

function ProjectCard({ project }) {
  const allTasks = useTaskStore((s) => s.tasks)
  const deleteProject = useTaskStore((s) => s.deleteProject)
  const renameProject = useTaskStore((s) => s.renameProject)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(project.name)

  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === project.id), [allTasks, project.id])
  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  const handleRename = () => {
    if (nameValue.trim() && nameValue !== project.name) {
      renameProject(project.id, nameValue.trim())
    } else {
      setNameValue(project.name)
    }
    setEditing(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (tasks.length > 0) {
      const ok = window.confirm(
        `Delete "${project.name}"? Its ${tasks.length} task(s) will be unassigned.`
      )
      if (!ok) return
    }
    deleteProject(project.id)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Project header */}
      <div
        onClick={() => !editing && setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group"
      >
        <span className="text-gray-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        <FolderOpen size={16} className="text-purple-500 shrink-0" />

        {editing ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') {
                  setNameValue(project.name)
                  setEditing(false)
                }
              }}
              autoFocus
              className="flex-1 text-sm font-medium text-gray-800 bg-white border border-blue-300 rounded px-2 py-0.5 outline-none"
            />
            <button
              onClick={handleRename}
              className="p-0.5 text-green-500 hover:text-green-600"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setNameValue(project.name)
                setEditing(false)
              }}
              className="p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-medium text-gray-800 truncate">
            {project.name}
          </span>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">
            {activeTasks.length} active
            {doneTasks.length > 0 && `, ${doneTasks.length} done`}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
            }}
            className="p-0.5 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Rename project"
          >
            <Pencil size={13} />
          </button>

          <button
            onClick={handleDelete}
            className="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete project"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded tasks */}
      {expanded && (
        <div className="p-2 space-y-3">
          {activeTasks.length > 0 && (
            <div className="space-y-1.5">
              {activeTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}

          {doneTasks.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1 px-1">
                Completed ({doneTasks.length})
              </p>
              <div className="space-y-1">
                {doneTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <p className="text-xs text-gray-300 text-center py-3">
              No tasks in this project yet
            </p>
          )}

          {/* Add task to this project */}
          <TaskInput
            defaultStatus="inbox"
            onTaskAdded={() => {
              // The task will be added to inbox. The user can then assign it via TaskItem expand.
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function ProjectsView() {
  const projects = useTaskStore((s) => s.projects)
  const addProject = useTaskStore((s) => s.addProject)
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleAddProject = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    addProject(newName.trim())
    setNewName('')
    setShowInput(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={20} className="text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
          <span className="text-xs text-gray-400">{projects.length} projects</span>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
        >
          <Plus size={13} />
          New Project
        </button>
      </div>

      {/* New project input */}
      {showInput && (
        <form onSubmit={handleAddProject} className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name..."
            autoFocus
            className="flex-1 text-sm border border-purple-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 bg-white placeholder:text-gray-300"
          />
          <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false)
              setNewName('')
            }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm font-medium">No projects yet</p>
          <p className="text-gray-300 text-xs mt-1">
            Create a project to organize your tasks
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
