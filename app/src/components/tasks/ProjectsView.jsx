import { useState, useMemo } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import { useToastStore } from '../../stores/toastStore'
import TaskItem from './TaskItem'
import TaskInput from './TaskInput'
import {
  FolderOpen,
  Folder,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Pencil,
  Check,
  X,
  Copy,
} from 'lucide-react'

/* ── shared panel style ─────────────────────────────────────────────────────── */

const panelStyle = {
  borderTop: '2px solid var(--border-bright)',
  borderLeft: '2px solid var(--border-bright)',
  borderRight: '2px solid var(--border-dark)',
  borderBottom: '2px solid var(--border-dark)',
  background: 'var(--bg-surface)',
}

const headerBtnStyle = {
  background: 'transparent',
  color: 'var(--text-ghost)',
  border: 'none',
  padding: '2px 4px',
  cursor: 'pointer',
  minWidth: 'unset',
  display: 'flex',
  alignItems: 'center',
}

/* ── SubfolderCard ──────────────────────────────────────────────────────────── */

function SubfolderCard({ subfolder, projectId }) {
  const allTasks = useTaskStore((s) => s.tasks)
  const deleteProject = useTaskStore((s) => s.deleteProject)
  const updateProject = useTaskStore((s) => s.updateProject)
  const addToast = useToastStore((s) => s.addToast)

  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(subfolder.name)
  const [descValue, setDescValue] = useState(subfolder.description || '')

  const tasks = useMemo(
    () => allTasks.filter((t) => t.subfolderId === subfolder.id),
    [allTasks, subfolder.id]
  )
  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  const handleRename = () => {
    if (nameValue.trim() && nameValue !== subfolder.name) {
      updateProject(subfolder.id, { name: nameValue.trim() })
    } else {
      setNameValue(subfolder.name)
    }
    setEditing(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (tasks.length > 0) {
      if (!window.confirm(`Delete "${subfolder.name}"? Its ${tasks.length} task(s) will be unassigned.`)) return
    }
    deleteProject(subfolder.id)
  }

  return (
    <div style={{ marginLeft: '16px', ...panelStyle, marginTop: '4px' }}>
      {/* Subfolder header */}
      <div
        onClick={() => !editing && setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 8px', cursor: 'pointer',
          background: expanded ? 'var(--bg-elevated)' : 'transparent',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
        className="list-row"
      >
        <span style={{ color: 'var(--text-ghost)', display: 'flex' }}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        <Folder size={13} style={{ color: 'var(--neon-dim)', flexShrink: 0 }} />

        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}
            onClick={(e) => e.stopPropagation()}>
            <input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setNameValue(subfolder.name); setEditing(false) }
              }}
              autoFocus
              style={{ flex: 1, fontSize: '11px', padding: '2px 6px' }}
            />
            <button onClick={handleRename} style={{ ...headerBtnStyle, color: 'var(--neon)' }}><Check size={11} /></button>
            <button onClick={() => { setNameValue(subfolder.name); setEditing(false) }} style={headerBtnStyle}><X size={11} /></button>
          </div>
        ) : (
          <span style={{ flex: 1, fontSize: '11px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subfolder.name}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>
            {activeTasks.length}t
          </span>
          <button onClick={(e) => { e.stopPropagation(); setEditing(true) }} style={headerBtnStyle} title="Rename"><Pencil size={11} /></button>
          <button onClick={handleDelete} style={{ ...headerBtnStyle, color: 'var(--danger)' }} title="Delete"><Trash2 size={11} /></button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '8px' }}>
          {/* Description copy box */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Copy size={9} /> PROMPT / DESC</span>
              {descValue && (
                <button onClick={() => { navigator.clipboard.writeText(descValue); addToast('Copied!', { type: 'success' }) }}
                  style={{ background: 'var(--neon)', color: '#000', border: 'none', fontSize: '8px', padding: '1px 6px', cursor: 'pointer', minWidth: 'unset' }}>
                  [ COPY ]
                </button>
              )}
            </div>
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={() => { if (descValue !== subfolder.description) updateProject(subfolder.id, { description: descValue }) }}
              placeholder="> prompt or description..."
              rows={2}
              style={{ width: '100%', fontSize: '10px', resize: 'vertical', background: 'var(--bg-base)' }}
            />
          </div>
          {activeTasks.map((task) => <TaskItem key={task.id} task={task} />)}
          {doneTasks.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '4px' }}>
                COMPLETED ({doneTasks.length})
              </div>
              {doneTasks.map((task) => <TaskItem key={task.id} task={task} />)}
            </div>
          )}
          {tasks.length === 0 && (
            <p style={{ fontSize: '10px', color: 'var(--text-ghost)', padding: '8px 0' }}>&gt; no tasks</p>
          )}
          <TaskInput defaultStatus="inbox" projectId={projectId} subfolderId={subfolder.id} />
        </div>
      )}
    </div>
  )
}

/* ── ProjectCard ────────────────────────────────────────────────────────────── */

function ProjectCard({ project }) {
  const allTasks = useTaskStore((s) => s.tasks)
  const allProjects = useTaskStore((s) => s.projects)
  const deleteProject = useTaskStore((s) => s.deleteProject)
  const updateProject = useTaskStore((s) => s.updateProject)
  const addProject = useTaskStore((s) => s.addProject)
  const addToast = useToastStore((s) => s.addToast)

  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(project.name)
  const [descValue, setDescValue] = useState(project.description || '')
  const [addingSubfolder, setAddingSubfolder] = useState(false)
  const [subfolderName, setSubfolderName] = useState('')

  const subfolders = useMemo(
    () => allProjects.filter((p) => p.parentId === project.id),
    [allProjects, project.id]
  )

  // Tasks directly on the project (no subfolder)
  const directTasks = useMemo(
    () => allTasks.filter((t) => t.projectId === project.id && !t.subfolderId),
    [allTasks, project.id]
  )
  const directActive = directTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
  const directDone = directTasks.filter((t) => t.status === 'done')

  // All tasks including subfolders (for count)
  const allProjectTasks = useMemo(
    () => allTasks.filter((t) => t.projectId === project.id),
    [allTasks, project.id]
  )
  const totalActive = allProjectTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length
  const totalDone = allProjectTasks.filter((t) => t.status === 'done').length

  const handleRename = () => {
    if (nameValue.trim() && nameValue !== project.name) {
      updateProject(project.id, { name: nameValue.trim() })
    } else {
      setNameValue(project.name)
    }
    setEditing(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    const count = allProjectTasks.length + subfolders.length
    if (count > 0) {
      if (!window.confirm(`Delete "${project.name}"? All tasks and subfolders will be removed.`)) return
    }
    deleteProject(project.id)
  }

  const handleAddSubfolder = (e) => {
    e.preventDefault()
    if (!subfolderName.trim()) return
    addProject({ name: subfolderName.trim(), parentId: project.id })
    setSubfolderName('')
    setAddingSubfolder(false)
  }

  return (
    <div style={{ ...panelStyle, marginBottom: '6px' }}>
      {/* Project header */}
      <div
        onClick={() => !editing && setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 10px', cursor: 'pointer',
          background: expanded ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
        className="list-row"
      >
        <span style={{ color: 'var(--text-dim)', display: 'flex' }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <FolderOpen size={14} style={{ color: 'var(--neon)', flexShrink: 0 }} />

        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}
            onClick={(e) => e.stopPropagation()}>
            <input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setNameValue(project.name); setEditing(false) }
              }}
              autoFocus
              style={{ flex: 1 }}
            />
            <button onClick={handleRename} style={{ ...headerBtnStyle, color: 'var(--neon)' }}><Check size={13} /></button>
            <button onClick={() => { setNameValue(project.name); setEditing(false) }} style={headerBtnStyle}><X size={13} /></button>
          </div>
        ) : (
          <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-bright)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.name}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>
            {totalActive > 0 && `${totalActive} active`}
            {totalDone > 0 && ` · ${totalDone} done`}
          </span>
          <button onClick={(e) => { e.stopPropagation(); setEditing(true) }} style={headerBtnStyle} title="Rename"><Pencil size={13} /></button>
          <button onClick={handleDelete} style={{ ...headerBtnStyle, color: 'var(--danger)' }} title="Delete"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '8px 10px' }}>

          {/* Description copy box */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Copy size={9} /> PROMPT / DESCRIPTION</span>
              {descValue && (
                <button onClick={() => { navigator.clipboard.writeText(descValue); addToast('Copied!', { type: 'success' }) }}
                  style={{ background: 'var(--neon)', color: '#000', border: 'none', fontSize: '8px', padding: '1px 8px', cursor: 'pointer', minWidth: 'unset' }}>
                  [ COPY ]
                </button>
              )}
            </div>
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={() => { if (descValue !== project.description) updateProject(project.id, { description: descValue }) }}
              placeholder="> prompt or description for this project..."
              rows={2}
              style={{ width: '100%', fontSize: '11px', resize: 'vertical', background: 'var(--bg-base)' }}
            />
          </div>

          {/* Direct tasks */}
          {directActive.map((task) => <TaskItem key={task.id} task={task} />)}
          {directDone.length > 0 && (
            <div style={{ marginTop: '4px', marginBottom: '4px' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '4px' }}>
                COMPLETED ({directDone.length})
              </div>
              {directDone.map((task) => <TaskItem key={task.id} task={task} />)}
            </div>
          )}

          {/* Subfolders */}
          {subfolders.map((sf) => (
            <SubfolderCard key={sf.id} subfolder={sf} projectId={project.id} />
          ))}

          {/* Add subfolder */}
          {addingSubfolder ? (
            <form onSubmit={handleAddSubfolder} style={{ display: 'flex', gap: '6px', marginTop: '8px', marginLeft: '16px' }}>
              <input
                value={subfolderName}
                onChange={(e) => setSubfolderName(e.target.value)}
                placeholder="subfolder name..."
                autoFocus
                style={{ flex: 1, fontSize: '11px' }}
                onKeyDown={(e) => e.key === 'Escape' && setAddingSubfolder(false)}
              />
              <button type="submit" style={{ padding: '4px 10px', fontSize: '10px' }}>[ ADD ]</button>
              <button type="button" onClick={() => setAddingSubfolder(false)} style={{ padding: '4px 8px', fontSize: '10px' }}>[ X ]</button>
            </form>
          ) : (
            <button
              onClick={() => setAddingSubfolder(true)}
              style={{ ...headerBtnStyle, marginTop: '8px', marginLeft: '16px', fontSize: '10px', color: 'var(--text-dim)', gap: '4px' }}
            >
              <Plus size={11} /> new subfolder
            </button>
          )}

          {/* Add direct task */}
          <div style={{ marginTop: '8px' }}>
            <TaskInput defaultStatus="inbox" projectId={project.id} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── ProjectsView ───────────────────────────────────────────────────────────── */

export default function ProjectsView() {
  const projects = useTaskStore((s) => s.projects)
  const addProject = useTaskStore((s) => s.addProject)

  const rootProjects = useMemo(() => projects.filter((p) => !p.parentId), [projects])

  const [showInput, setShowInput] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    addProject({ name: newName.trim() })
    setNewName('')
    setShowInput(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderOpen size={16} style={{ color: 'var(--neon)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px' }}>
            PROJECTS — {rootProjects.length}
          </span>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '4px 10px' }}
        >
          <Plus size={12} /> New Project
        </button>
      </div>

      {/* New project form */}
      {showInput && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="project name..."
            autoFocus
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Escape' && setShowInput(false)}
          />
          <button type="submit" style={{ padding: '4px 12px', fontSize: '10px' }}>[ CREATE ]</button>
          <button type="button" onClick={() => { setShowInput(false); setNewName('') }} style={{ padding: '4px 8px', fontSize: '10px' }}>[ X ]</button>
        </form>
      )}

      {/* Projects */}
      {rootProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <FolderOpen size={32} style={{ color: 'var(--text-ghost)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '11px', color: 'var(--text-ghost)' }}>&gt; no projects — create one above</p>
        </div>
      ) : (
        rootProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))
      )}
    </div>
  )
}
