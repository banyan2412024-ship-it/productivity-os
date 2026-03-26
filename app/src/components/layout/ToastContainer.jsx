import { useToastStore } from '../../stores/toastStore'
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Undo2,
  X,
} from 'lucide-react'

const iconMap = {
  success: <CheckCircle2 size={16} className="text-green-500 shrink-0" />,
  error: <AlertCircle size={16} className="text-red-500 shrink-0" />,
  info: <Info size={16} className="text-indigo-500 shrink-0" />,
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 left-4 md:left-auto z-50 flex flex-col gap-2 max-w-sm md:ml-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-200 animate-fade-in"
        >
          {iconMap[toast.type] || iconMap.info}
          <span className="text-sm text-gray-800 flex-1">{toast.message}</span>
          {toast.undoFn && (
            <button
              onClick={() => {
                toast.undoFn()
                removeToast(toast.id)
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors font-medium"
            >
              <Undo2 size={12} />
              Undo
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
