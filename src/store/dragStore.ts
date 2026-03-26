import { create } from 'zustand'

interface DragStore {
  personnelId: string | null
  label: string
  x: number
  y: number
  startDrag: (personnelId: string, label: string, x: number, y: number) => void
  moveDrag: (x: number, y: number) => void
  endDrag: () => void
}

export const useDragStore = create<DragStore>((set) => ({
  personnelId: null,
  label: '',
  x: 0,
  y: 0,
  startDrag: (personnelId, label, x, y) => set({ personnelId, label, x, y }),
  moveDrag: (x, y) => set({ x, y }),
  endDrag: () => set({ personnelId: null }),
}))
