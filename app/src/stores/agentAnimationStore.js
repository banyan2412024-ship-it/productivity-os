import { create } from 'zustand'

const ANIMATION_FACES = {
  celebrate: ['(^o^)', '\\(^‿^)/', '(★‿★)', '\\(^o^)/'],
  disappointed: ['(·_·)', '(·_·)...', '(._.)'],
  worried: ['(°_°)', '(°△°)', '(·_·;)'],
  epic: ['(★‿★)', '✧(≖‿≖)✧', '★\\(^o^)/★'],
}

export const useAgentAnimationStore = create((set, get) => ({
  animation: null,  // 'celebrate' | 'disappointed' | 'worried' | 'epic'
  face: null,       // current animated face string
  _timer: null,
  _faceTimer: null,

  triggerAnimation: (type) => {
    const { _timer, _faceTimer } = get()
    clearTimeout(_timer)
    clearInterval(_faceTimer)

    const faces = ANIMATION_FACES[type]
    if (!faces) return

    let idx = 0
    set({ animation: type, face: faces[0] })

    const faceTimer = setInterval(() => {
      idx = (idx + 1) % faces.length
      set({ face: faces[idx] })
    }, 350)

    const timer = setTimeout(() => {
      clearInterval(faceTimer)
      set({ animation: null, face: null, _timer: null, _faceTimer: null })
    }, 2500)

    set({ _timer: timer, _faceTimer: faceTimer })
  },
}))
