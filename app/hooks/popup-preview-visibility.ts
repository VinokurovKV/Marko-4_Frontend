// React
import * as React from 'react'

// Project
import { serverConnector } from '~/server-connector'

export interface PopupPreviewVisibilitySettings {
  requirement: boolean
  commonTopology: boolean
  topology: boolean
  roleRights: boolean
  testTemplate: boolean
  subgroup: boolean
}

type InterfaceSettings = Record<string, unknown>

const SETTINGS_KEY = 'popupPreviewVisibility'
const SETTINGS_UPDATED_EVENT = 'marko-4:popup-preview-visibility-updated'

const DEFAULT_SETTINGS: PopupPreviewVisibilitySettings = {
  requirement: true,
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
    requirement:
      typeof record.requirement === 'boolean'
        ? record.requirement
        : DEFAULT_SETTINGS.requirement,
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

function parseInterfaceSettings(value: string): InterfaceSettings {
  try {
    const parsedValue = JSON.parse(value) as unknown
    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      Array.isArray(parsedValue)
    ) {
      return {}
    }
    return parsedValue as InterfaceSettings
  } catch {
    return {}
  }
}

function readPopupPreviewVisibility(
  interfaceSettings: InterfaceSettings
): PopupPreviewVisibilitySettings {
  if (SETTINGS_KEY in interfaceSettings) {
    return mergeWithDefaults(interfaceSettings[SETTINGS_KEY])
  }

  return mergeWithDefaults(interfaceSettings)
}

async function readSettingsFromServer(): Promise<{
  interfaceSettings: InterfaceSettings
  settings: PopupPreviewVisibilitySettings
}> {
  const response = await serverConnector.readSelfInterfaceSettings()
  const interfaceSettings = parseInterfaceSettings(response.interfaceSettings)

  return {
    interfaceSettings,
    settings: readPopupPreviewVisibility(interfaceSettings)
  }
}

async function getSelfUserId(): Promise<number> {
  if (serverConnector.meta.status === 'AUTHENTICATED') {
    return serverConnector.meta.selfMeta.id
  }

  return (await serverConnector.readSelfMeta()).id
}

function dispatchSettingsUpdated(settings: PopupPreviewVisibilitySettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<PopupPreviewVisibilitySettings>(SETTINGS_UPDATED_EVENT, {
      detail: settings
    })
  )
}

export function usePopupPreviewVisibilitySettings() {
  const [settings, setSettings] =
    React.useState<PopupPreviewVisibilitySettings>(DEFAULT_SETTINGS)
  const interfaceSettingsRef = React.useRef<InterfaceSettings>({})

  React.useEffect(() => {
    let isMounted = true

    void readSettingsFromServer()
      .then((result) => {
        if (isMounted === false) {
          return
        }
        interfaceSettingsRef.current = result.interfaceSettings
        setSettings(result.settings)
      })
      .catch(() => {
        if (isMounted) {
          setSettings(DEFAULT_SETTINGS)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncSettings = (event: Event) => {
      if (event instanceof CustomEvent === false) {
        return
      }

      const nextSettings = mergeWithDefaults(event.detail)
      interfaceSettingsRef.current = {
        ...interfaceSettingsRef.current,
        [SETTINGS_KEY]: nextSettings
      }
      setSettings(nextSettings)
    }

    window.addEventListener(SETTINGS_UPDATED_EVENT, syncSettings)

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncSettings)
    }
  }, [])

  const setSetting = React.useCallback(
    (key: keyof PopupPreviewVisibilitySettings, value: boolean) => {
      const previousSettings = settings
      const nextSettings = {
        ...previousSettings,
        [key]: value
      }
      const previousInterfaceSettings = interfaceSettingsRef.current
      const nextInterfaceSettings = {
        ...previousInterfaceSettings,
        [SETTINGS_KEY]: nextSettings
      }

      interfaceSettingsRef.current = nextInterfaceSettings
      setSettings(nextSettings)
      dispatchSettingsUpdated(nextSettings)

      void getSelfUserId()
        .then((id) =>
          serverConnector.setUserInterfaceSettings({
            id,
            interfaceSettings: JSON.stringify(nextInterfaceSettings)
          })
        )
        .catch(() => {
          interfaceSettingsRef.current = previousInterfaceSettings
          setSettings(previousSettings)
          dispatchSettingsUpdated(previousSettings)
        })
    },
    [settings]
  )

  return React.useMemo(
    () => ({
      settings,
      setSetting
    }),
    [settings, setSetting]
  )
}
