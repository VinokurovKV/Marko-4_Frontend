// React
import * as React from 'react'

// Project
import { serverConnector } from '~/server-connector'

export interface InteractiveGuideSettings {
  firstLaunchPromptAnswered: boolean
  completed: boolean
}

type InterfaceSettings = Record<string, unknown>

const SETTINGS_KEY = 'interactiveGuide'
const SETTINGS_UPDATED_EVENT = 'marko-4:interactive-guide-settings-updated'

const DEFAULT_SETTINGS: InteractiveGuideSettings = {
  firstLaunchPromptAnswered: false,
  completed: false
}

function mergeWithDefaults(value: unknown): InteractiveGuideSettings {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_SETTINGS
  }

  const record = value as Record<string, unknown>

  return {
    firstLaunchPromptAnswered:
      typeof record.firstLaunchPromptAnswered === 'boolean'
        ? record.firstLaunchPromptAnswered
        : DEFAULT_SETTINGS.firstLaunchPromptAnswered,
    completed:
      typeof record.completed === 'boolean'
        ? record.completed
        : DEFAULT_SETTINGS.completed
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

async function readSettingsFromServer(): Promise<{
  interfaceSettings: InterfaceSettings
  settings: InteractiveGuideSettings
}> {
  const response = await serverConnector.readSelfInterfaceSettings()
  const interfaceSettings = parseInterfaceSettings(response.interfaceSettings)

  return {
    interfaceSettings,
    settings: mergeWithDefaults(interfaceSettings[SETTINGS_KEY])
  }
}

async function getSelfUserId(): Promise<number> {
  if (serverConnector.meta.status === 'AUTHENTICATED') {
    return serverConnector.meta.selfMeta.id
  }

  return (await serverConnector.readSelfMeta()).id
}

function dispatchSettingsUpdated(settings: InteractiveGuideSettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<InteractiveGuideSettings>(SETTINGS_UPDATED_EVENT, {
      detail: settings
    })
  )
}

export function useInteractiveGuideSettings() {
  const [settings, setSettings] =
    React.useState<InteractiveGuideSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = React.useState(false)
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
      .finally(() => {
        if (isMounted) {
          setLoaded(true)
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

  const setGuideSettings = React.useCallback(
    (nextSettings: InteractiveGuideSettings) => {
      const previousSettings = settings
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
      loaded,
      settings,
      setGuideSettings
    }),
    [loaded, settings, setGuideSettings]
  )
}
