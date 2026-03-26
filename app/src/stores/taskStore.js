import { create } from 'zustand'
import { dexiePersist } from './dexiePersist'
import { v4 as uuid } from 'uuid'
import { isToday, isBefore, addDays, startOfDay, isAfter } from 'date-fns'

export const TASK_CATEGORIES = [
  'Work',
  'Personal',
  'Health & Fitness',
  'Finance',
  'Learning',
  'Creative',
  'Social',
  'Errands',
  'Home',
  'Career',
  'Side Project',
  'Other',
]

export const useTaskStore = create(
  dexiePersist(
    (set, get) => ({
      tasks: [],
      projects: [],

      // Tasks
      addTask: (task) => {
        const newTask = {
          id: uuid(),
          title: task.title || '',
          notes: task.notes || '',
          status: task.status || 'inbox',
          priority: task.priority || 'medium',
          isMIT: task.isMIT || false,
          isFrog: task.isFrog || false,
          isQuickWin: task.isQuickWin || false,
          dueDate: task.dueDate || null,
          scheduledDate: task.scheduledDate || null,
          category: task.category || 'Other',
          tags: task.tags || [],
          projectId: task.projectId || null,
          createdAt: new Date().toISOString(),
          completedAt: null,
        }
        set((s) => ({ tasks: [newTask, ...s.tasks] }))
        return newTask.id
      },

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t
            const updated = { ...t, ...updates }
            if (updates.status === 'done' && !t.completedAt) {
              updated.completedAt = new Date().toISOString()
            }
            if (updates.status && updates.status !== 'done') {
              updated.completedAt = null
            }
            return updated
          }),
        })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      toggleMIT: (id) => {
        const tasks = get().tasks
        const task = tasks.find((t) => t.id === id)
        if (!task) return
        if (task.isMIT) {
          set((s) => ({
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, isMIT: false } : t)),
          }))
        } else {
          const currentMITs = tasks.filter(
            (t) => t.isMIT && t.status !== 'done' && t.status !== 'cancelled'
          )
          if (currentMITs.length >= 3) return false
          set((s) => ({
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, isMIT: true } : t)),
          }))
        }
        return true
      },

      toggleFrog: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, isFrog: !t.isFrog } : { ...t, isFrog: false }
          ),
        })),

      // Projects
      addProject: (name) => {
        const project = {
          id: uuid(),
          name,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ projects: [...s.projects, project] }))
        return project.id
      },

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
        })),

      renameProject: (id, name) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      // Selectors
      getInbox: () => get().tasks.filter((t) => t.status === 'inbox'),

      getToday: () => {
        const tasks = get().tasks.filter((t) => {
          if (t.status === 'done' || t.status === 'cancelled') return false
          if (t.status === 'today') return true
          if (t.dueDate && isToday(new Date(t.dueDate))) return true
          if (t.scheduledDate && isToday(new Date(t.scheduledDate))) return true
          return false
        })
        return tasks.sort((a, b) => {
          if (a.isFrog && !b.isFrog) return -1
          if (!a.isFrog && b.isFrog) return 1
          if (a.isMIT && !b.isMIT) return -1
          if (!a.isMIT && b.isMIT) return 1
          const p = { high: 3, medium: 2, low: 1 }
          return (p[b.priority] || 0) - (p[a.priority] || 0)
        })
      },

      getUpcoming: () => {
        const now = startOfDay(new Date())
        const weekEnd = addDays(now, 7)
        return get()
          .tasks.filter((t) => {
            if (t.status === 'done' || t.status === 'cancelled') return false
            const due = t.dueDate ? new Date(t.dueDate) : null
            const sched = t.scheduledDate ? new Date(t.scheduledDate) : null
            const date = due || sched
            if (!date) return false
            return isAfter(date, now) && isBefore(date, weekEnd)
          })
          .sort((a, b) => {
            const da = new Date(a.dueDate || a.scheduledDate)
            const db = new Date(b.dueDate || b.scheduledDate)
            return da - db
          })
      },

      getCompleted: () => get().tasks.filter((t) => t.status === 'done'),

      getQuickWins: () =>
        get().tasks.filter(
          (t) => t.isQuickWin && t.status !== 'done' && t.status !== 'cancelled'
        ),

      getMITs: () =>
        get().tasks.filter(
          (t) => t.isMIT && t.status !== 'done' && t.status !== 'cancelled'
        ),

      getTasksByProject: (projectId) => get().tasks.filter((t) => t.projectId === projectId),

      getTasksByCategory: (category) =>
        get().tasks.filter(
          (t) => t.category === category && t.status !== 'done' && t.status !== 'cancelled'
        ),

      getTop3Tasks: () => {
        const tasks = get().tasks.filter(
          (t) => t.status !== 'done' && t.status !== 'cancelled'
        )
        return tasks
          .sort((a, b) => {
            if (a.isFrog && !b.isFrog) return -1
            if (!a.isFrog && b.isFrog) return 1
            if (a.isMIT && !b.isMIT) return -1
            if (!a.isMIT && b.isMIT) return 1
            const p = { high: 3, medium: 2, low: 1 }
            return (p[b.priority] || 0) - (p[a.priority] || 0)
          })
          .slice(0, 3)
      },
    }),
    {
      tables: { tasks: 'tasks', projects: 'projects' },
    }
  )
)
