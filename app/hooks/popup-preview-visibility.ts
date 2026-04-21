// React
import * as React from 'react'

export interface PopupPreviewVisibilitySettings {
  commonTopology: boolean
  topology: boolean
  roleRights: boolean
  testTemplate: boolean
  subgroup: boolean
}

const STORAGE_KEY = 'marko-4.popup-preview-visibility.v1'
const SETTINGS_UPDATED_EVENT = 'marko-4:popup-preview-visibility-updated'

const DEFAULT_SETTINGS: PopupPreviewVisibilitySettings = {
  commonTopology: true,
  topology: true,
  roleRights: true,
  testTemplate: true,
  subgroup: true
}

function mergeWithDefaults(value: unknown): PopupPreviewVisibilitySettings {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_SETTINGS
  }

  const record = value as Record<string, unknown>

  return {
    commonTopology:
      typeof record.commonTopology === 'boolean'
        ? record.commonTopology
        : DEFAULT_SETTINGS.commonTopology,
    topology:
      typeof record.topology === 'boolean'
        ? record.topology
        : DEFAULT_SETTINGS.topology,
    roleRights:
      typeof record.roleRights === 'boolean'
        ? record.roleRights
        : DEFAULT_SETTINGS.roleRights,
    testTemplate:
      typeof record.testTemplate === 'boolean'
        ? record.testTemplate
        : DEFAULT_SETTINGS.testTemplate,
    subgroup:
      typeof record.subgroup === 'boolean'
        ? record.subgroup
        : DEFAULT_SETTINGS.subgroup
  }
}

function readSettingsFromStorage(): PopupPreviewVisibilitySettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (rawValue === null) {
      return DEFAULT_SETTINGS
    }
    const parsedValue = JSON.parse(rawValue) as unknown
    return mergeWithDefaults(parsedValue)
  } catch {
    return DEFAULT_SETTINGS
  }
}

function writeSettingsToStorage(settings: PopupPreviewVisibilitySettings) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT))
}

export function usePopupPreviewVisibilitySettings() {
  const [settings, setSettings] =
    React.useState<PopupPreviewVisibilitySettings>(DEFAULT_SETTINGS)

  React.useEffect(() => {
    setSettings(readSettingsFromStorage())
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncSettings = () => {
      setSettings(readSettingsFromStorage())
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return
      }
      syncSettings()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(SETTINGS_UPDATED_EVENT, syncSettings)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncSettings)
    }
  }, [])

  const setSetting = React.useCallback(
    (key: keyof PopupPreviewVisibilitySettings, value: boolean) => {
      setSettings((previousSettings) => {
        const nextSettings = {
          ...previousSettings,
          [key]: value
        }
        writeSettingsToStorage(nextSettings)
        return nextSettings
      })
    },
    []
  )

  return React.useMemo(
    () => ({
      settings,
      setSetting
    }),
    [settings, setSetting]
  )
}
