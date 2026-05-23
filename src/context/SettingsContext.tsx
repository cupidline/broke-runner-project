import { createContext, useContext } from 'react'
import { useSettings } from '@/hooks/useSettings'
import type { UserSettings } from '@/types'

const SettingsContext = createContext<UserSettings | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings()
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsCtx(): UserSettings | undefined {
  return useContext(SettingsContext)
}
