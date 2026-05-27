import { create } from 'zustand';

export type GamePhase = 'offline' | 'waiting' | 'building' | 'voting';

export type PrimitiveType = 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus';

export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export interface SceneObjectData {
  id: string;
  type: PrimitiveType;
  position: Vector3Data;
  rotation: Vector3Data; // Euler angles
  scale: Vector3Data;
  color: string;
  originalPosition: Vector3Data; // For Anti-Gravity mode
}

interface WorkspaceState {
  objects: SceneObjectData[];
  selectedId: string | null;
  transformMode: 'translate' | 'rotate' | 'scale';
  isAntiGravityEnabled: boolean;
  gamePhase: GamePhase;
  timeLeft: number;
  opponentObjects: SceneObjectData[];
  wantsToConnect: boolean;
  hasRated: boolean;
  opponentHasRated: boolean;
  localRating: number;
  opponentRating: number;
  addObject: (type: PrimitiveType) => void;
  updateObject: (id: string, updates: Partial<SceneObjectData>) => void;
  selectObject: (id: string | null) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  setAntiGravityEnabled: (enabled: boolean) => void;
  setGamePhase: (phase: GamePhase) => void;
  setTimeLeft: (time: number) => void;
  setOpponentObjects: (objects: SceneObjectData[]) => void;
  joinPvPQueue: () => void;
  leavePvPQueue: () => void;
  submitRating: (stars: number) => void;
  receiveOpponentRating: (stars: number) => void;
  resetGame: () => void;
  clearCanvas: () => void;
  serializeScene: () => string;
  hydrateScene: (json: string) => void;
}

// Convert hsl to hex for storage if needed, or just store hsl/hex.
// Actually Three.js can parse hex directly. Let's create a random hex pastel.
const getRandomPastelHex = () => {
  const r = Math.floor((Math.random() * 127) + 127);
  const g = Math.floor((Math.random() * 127) + 127);
  const b = Math.floor((Math.random() * 127) + 127);
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  objects: [],
  selectedId: null,
  transformMode: 'translate',
  isAntiGravityEnabled: false,
  gamePhase: 'offline',
  timeLeft: 0,
  opponentObjects: [],
  wantsToConnect: false,
  hasRated: false,
  opponentHasRated: false,
  localRating: 0,
  opponentRating: 0,

  addObject: (type) => {
    const newObject: SceneObjectData = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      position: { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: getRandomPastelHex(),
      originalPosition: { x: 0, y: 0.5, z: 0 }
    };
    set((state) => ({ objects: [...state.objects, newObject], selectedId: newObject.id }));
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)),
    }));
  },

  selectObject: (id) => set({ selectedId: id }),

  setTransformMode: (mode) => set({ transformMode: mode }),

  setAntiGravityEnabled: (enabled) => set({ isAntiGravityEnabled: enabled }),

  setGamePhase: (phase) => set({ gamePhase: phase }),

  setTimeLeft: (time) => set({ timeLeft: time }),

  setOpponentObjects: (objects) => set({ opponentObjects: objects }),

  joinPvPQueue: () => set({ wantsToConnect: true, gamePhase: 'waiting', objects: [], opponentObjects: [], hasRated: false, opponentHasRated: false, localRating: 0, opponentRating: 0 }),

  leavePvPQueue: () => set({ wantsToConnect: false, gamePhase: 'offline', objects: [], opponentObjects: [], hasRated: false, opponentHasRated: false, localRating: 0, opponentRating: 0 }),

  submitRating: (stars) => set({ hasRated: true, localRating: stars }),

  receiveOpponentRating: (stars) => set({ opponentHasRated: true, opponentRating: stars }),

  resetGame: () => set({ wantsToConnect: false, gamePhase: 'offline', objects: [], opponentObjects: [], hasRated: false, opponentHasRated: false, localRating: 0, opponentRating: 0 }),

  clearCanvas: () => set({ objects: [], selectedId: null }),

  serializeScene: () => {
    const { objects } = get();
    // Compact JSON representation of structural data
    const serialized = objects.map(({ type, position, rotation, scale, color }) => ({
      t: type,
      p: [position.x, position.y, position.z],
      r: [rotation.x, rotation.y, rotation.z],
      s: [scale.x, scale.y, scale.z],
      c: color,
    }));
    return JSON.stringify(serialized);
  },

  hydrateScene: (json) => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error('Invalid scene data');
      
      const newObjects: SceneObjectData[] = parsed.map((item: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        type: item.t,
        position: { x: item.p[0], y: item.p[1], z: item.p[2] },
        rotation: { x: item.r[0], y: item.r[1], z: item.r[2] },
        scale: { x: item.s[0], y: item.s[1], z: item.s[2] },
        color: item.c,
        originalPosition: { x: item.p[0], y: item.p[1], z: item.p[2] },
      }));

      set({ objects: newObjects, selectedId: null });
    } catch (e) {
      console.error('Failed to hydrate scene:', e);
    }
  },
}));
