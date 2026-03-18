import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ExplorerPreference = 'stellar-chain' | 'stellar-expert';
type DashboardDensity = 'comfortable' | 'compact';
type DashboardThemeTone = 'forest' | 'neutral';

interface DashboardPreferencesState {
  inAppNotifications: boolean;
  emailNotifications: boolean;
  explorerPreference: ExplorerPreference;
  density: DashboardDensity;
  themeTone: DashboardThemeTone;
  setInAppNotifications: (value: boolean) => void;
  setEmailNotifications: (value: boolean) => void;
  setExplorerPreference: (value: ExplorerPreference) => void;
  setDensity: (value: DashboardDensity) => void;
  setThemeTone: (value: DashboardThemeTone) => void;
}

export const useDashboardPreferences = create<DashboardPreferencesState>()(
  persist(
    (set) => ({
      inAppNotifications: true,
      emailNotifications: false,
      explorerPreference: 'stellar-chain',
      density: 'comfortable',
      themeTone: 'forest',

      setInAppNotifications: (value) => set({ inAppNotifications: value }),
      setEmailNotifications: (value) => set({ emailNotifications: value }),
      setExplorerPreference: (value) => set({ explorerPreference: value }),
      setDensity: (value) => set({ density: value }),
      setThemeTone: (value) => set({ themeTone: value })
    }),
    {
      name: 'trustlance-dashboard-preferences',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
