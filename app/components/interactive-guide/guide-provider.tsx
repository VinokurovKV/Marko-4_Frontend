// Project
import { ProjButton } from '~/components/buttons/button'
import { useInteractiveGuideSettings } from '~/hooks/interactive-guide-settings'
import { brand, gray } from '~/theme/themePrimitives'
// React
import * as React from 'react'
// React Joyride
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
// Material UI
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

interface InteractiveGuideContextValue {
  startGuide: () => void
}

const InteractiveGuideContext =
  React.createContext<InteractiveGuideContextValue | null>(null)

export interface InteractiveGuideProviderProps {
  children: React.ReactNode
  portalElement: HTMLElement | null
}

export function InteractiveGuideProvider({
  children,
  portalElement
}: InteractiveGuideProviderProps) {
  const theme = useTheme()
  const { loaded, settings, setGuideSettings } = useInteractiveGuideSettings()
  const [isStartPromptOpen, setIsStartPromptOpen] = React.useState(false)
  const [isManualStartPromptOpen, setIsManualStartPromptOpen] =
    React.useState(false)
  const [isGuideRunning, setIsGuideRunning] = React.useState(false)
  const isDarkMode = theme.palette.mode === 'dark'
  const guideBackgroundColor = isDarkMode ? gray[200] : gray[800]
  const guideTextColor = isDarkMode ? brand[800] : brand[50]
  const guidePrimaryColor = isDarkMode ? brand[800] : brand[50]
  const guideOverlayColor = isDarkMode
    ? 'rgba(0, 0, 0, 0.72)'
    : 'rgba(0, 0, 0, 0.45)'

  const steps = React.useMemo<Step[]>(
    () => [
      {
        target: '[data-guide-id="header-logo"]',
        title: 'Вестник',
        content:
          'Логотип возвращает на главный экран. Отсюда начинается работа с системой.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="header-menu-button"]',
        title: 'Боковое меню',
        content: 'Эта кнопка сворачивает и раскрывает список разделов слева.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="header-theme-switcher"]',
        title: 'Тема интерфейса',
        content: 'Здесь можно переключить светлую и тёмную тему.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="header-account-menu"]',
        title: 'Профиль',
        content:
          'Меню профиля открывает настройки пользователя, профиль и выход из системы.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="main-content"]',
        title: 'Рабочая область',
        content:
          'В этой области открываются таблицы, формы, карточки, графы и просмотрщики файлов.',
        placement: 'center'
      },
      {
        target: '[data-guide-id="sidebar-item-tags"]',
        title: 'Разделы системы',
        content:
          'В боковом меню расположены все основные экраны. Начнём с верхнего пункта — тегов.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="header-guide-button"]',
        title: 'Повтор руководства',
        content:
          'Если потребуется, руководство можно запустить повторно этой кнопкой.',
        placement: 'bottom'
      }
    ],
    []
  )

  React.useEffect(() => {
    if (loaded && settings.firstLaunchPromptAnswered === false) {
      setIsStartPromptOpen(true)
    }
  }, [loaded, settings.firstLaunchPromptAnswered])

  const startGuide = React.useCallback(() => {
    setIsStartPromptOpen(false)
    setIsManualStartPromptOpen(false)
    setIsGuideRunning(false)
    requestAnimationFrame(() => {
      setIsGuideRunning(true)
    })
    setGuideSettings({
      ...settings,
      firstLaunchPromptAnswered: true
    })
  }, [settings, setGuideSettings])

  const requestGuideStart = React.useCallback(() => {
    setIsManualStartPromptOpen(true)
  }, [])

  const declineGuide = React.useCallback(() => {
    setIsStartPromptOpen(false)
    setGuideSettings({
      ...settings,
      firstLaunchPromptAnswered: true
    })
  }, [settings, setGuideSettings])

  const handleJoyrideCallback = React.useCallback(
    (state: EventData) => {
      const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

      if (finishedStatuses.includes(state.status)) {
        setIsGuideRunning(false)
        setGuideSettings({
          ...settings,
          firstLaunchPromptAnswered: true,
          completed: state.status === STATUS.FINISHED
        })
      }
    },
    [settings, setGuideSettings]
  )

  const contextValue = React.useMemo(
    () => ({
      startGuide: requestGuideStart
    }),
    [requestGuideStart]
  )

  return (
    <InteractiveGuideContext.Provider value={contextValue}>
      {children}

      <Joyride
        run={isGuideRunning}
        steps={steps}
        continuous
        options={{
          arrowColor: guideBackgroundColor,
          backgroundColor: guideBackgroundColor,
          buttons: ['back', 'skip', 'primary'],
          blockTargetInteraction: false,
          loaderDelay: 1000,
          overlayClickAction: false,
          overlayColor: guideOverlayColor,
          primaryColor: guidePrimaryColor,
          scrollDuration: 80,
          showProgress: true,
          skipBeacon: true,
          targetWaitTimeout: 0,
          textColor: guideTextColor,
          zIndex: theme.zIndex.modal + 10
        }}
        floatingOptions={{
          autoUpdate: {
            animationFrame: false
          }
        }}
        portalElement={portalElement ?? undefined}
        onEvent={handleJoyrideCallback}
        locale={{
          back: 'Назад',
          close: 'Закрыть',
          last: 'Завершить',
          next: 'Далее',
          nextWithProgress: 'Далее ({current} из {total})',
          skip: 'Пропустить'
        }}
        styles={{
          tooltip: {
            backgroundColor: guideBackgroundColor,
            color: guideTextColor
          },
          tooltipTitle: {
            color: guideTextColor
          },
          tooltipContent: {
            color: guideTextColor
          },
          buttonPrimary: {
            backgroundColor: guidePrimaryColor,
            color: guideBackgroundColor
          },
          buttonBack: {
            color: guidePrimaryColor
          },
          buttonSkip: {
            color: guideTextColor
          },
          buttonClose: {
            color: guideTextColor
          },
          arrow: {
            color: guideBackgroundColor
          },
          overlay: {
            backgroundColor: guideOverlayColor,
            zIndex: theme.zIndex.modal + 10
          }
        }}
      />

      <Dialog
        open={isManualStartPromptOpen}
        onClose={() => setIsManualStartPromptOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Краткое руководство
        </DialogTitle>
        <DialogContent>
          <Typography>
            Запустить краткое интерактивное руководство по основным экранам
            системы?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <ProjButton onClick={() => setIsManualStartPromptOpen(false)}>
            отменить
          </ProjButton>
          <ProjButton variant="contained" onClick={startGuide}>
            начать
          </ProjButton>
        </DialogActions>
      </Dialog>

      <Dialog open={isStartPromptOpen} onClose={declineGuide} maxWidth="sm">
        <DialogTitle sx={{ textAlign: 'center' }}>
          Краткое руководство
        </DialogTitle>
        <DialogContent>
          <Typography>
            Хотите пройти краткое интерактивное руководство по основным экранам
            системы?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <ProjButton onClick={declineGuide}>позже</ProjButton>
          <ProjButton variant="contained" onClick={startGuide}>
            начать
          </ProjButton>
        </DialogActions>
      </Dialog>
    </InteractiveGuideContext.Provider>
  )
}

export function useInteractiveGuide() {
  const context = React.useContext(InteractiveGuideContext)
  if (context === null) {
    throw new Error(
      'useInteractiveGuide must be used within InteractiveGuideProvider'
    )
  }
  return context
}
