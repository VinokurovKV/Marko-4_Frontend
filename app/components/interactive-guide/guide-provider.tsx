// Project
import { ProjButton } from '~/components/buttons/button'
import { useInteractiveGuideSettings } from '~/hooks/interactive-guide-settings'
import { brand, gray } from '~/theme/themePrimitives'
// React
import * as React from 'react'
// React Joyride
import {
  ACTIONS,
  EVENTS,
  Joyride,
  STATUS,
  type EventData,
  type Step,
  type TooltipRenderProps
} from 'react-joyride'
// Material UI
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import SkipNextIcon from '@mui/icons-material/SkipNext'

interface InteractiveGuideContextValue {
  startGuide: () => void
}

type GuideStage = 'Основы' | 'Экраны'

type GuideStepData = {
  stage: GuideStage
}

type GuideStep = Step & {
  data: GuideStepData
}

const InteractiveGuideContext =
  React.createContext<InteractiveGuideContextValue | null>(null)

const getGuideTitle = (stage: GuideStage, title: string) => (
  <React.Fragment>
    <span
      style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.25,
        opacity: 0.72
      }}
    >
      {stage}
    </span>
    <span
      style={{
        display: 'block',
        lineHeight: 1.25
      }}
    >
      {title}
    </span>
  </React.Fragment>
)

const isGuideTargetVisible = (target: HTMLElement) => {
  const rect = target.getBoundingClientRect()
  const style = window.getComputedStyle(target)

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden'
  )
}

const resolveGuideTarget = (selector: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
    isGuideTargetVisible
  ) ?? null

const getGuideStepTarget = (step: Step | undefined) => {
  if (step === undefined) {
    return null
  }

  if (typeof step.target === 'string') {
    return resolveGuideTarget(step.target)
  }

  return step.target instanceof HTMLElement ? step.target : null
}

const scrollSidebarTargetIntoView = (target: HTMLElement) => {
  const scrollContainer = target.closest<HTMLElement>(
    '[data-guide-id="sidebar-scroll-container"]'
  )

  if (scrollContainer === null) {
    return
  }

  const containerRect = scrollContainer.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const targetTop =
    targetRect.top - containerRect.top + scrollContainer.scrollTop
  const targetCenter = targetTop + targetRect.height / 2
  const nextScrollTop = Math.max(
    0,
    targetCenter - scrollContainer.clientHeight / 2
  )

  scrollContainer.scrollTo({
    top: nextScrollTop,
    behavior: 'auto'
  })
}

const resolveGuideSteps = (steps: GuideStep[]) =>
  steps.flatMap((step) => {
    if (typeof step.target !== 'string') {
      return [step]
    }

    const target = resolveGuideTarget(step.target)
    return target === null ? [] : [{ ...step, target }]
  })

const getGuideStepStage = (step: Step | undefined) =>
  (step?.data as GuideStepData | undefined)?.stage ?? null

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
  const [guideSteps, setGuideSteps] = React.useState<GuideStep[]>([])
  const [guideStepIndex, setGuideStepIndex] = React.useState(0)
  const isDarkMode = theme.palette.mode === 'dark'
  const guideBackgroundColor = isDarkMode ? gray[200] : gray[800]
  const guideTextColor = isDarkMode ? brand[800] : brand[50]
  const guidePrimaryColor = isDarkMode ? brand[800] : brand[50]
  const guideOverlayColor = isDarkMode
    ? 'rgba(0, 0, 0, 0.72)'
    : 'rgba(0, 0, 0, 0.45)'

  const steps = React.useMemo<GuideStep[]>(
    () => [
      {
        target: '[data-guide-id="header-logo"]',
        data: { stage: 'Основы' },
        title: getGuideTitle('Основы', 'Вестник'),
        content:
          'Логотип возвращает на главный экран. Отсюда начинается работа с системой.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="header-menu-button"]',
        data: { stage: 'Основы' },
        title: getGuideTitle('Основы', 'Боковое меню'),
        content: 'Эта кнопка сворачивает и раскрывает список разделов слева.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="header-theme-switcher"]',
        data: { stage: 'Основы' },
        title: getGuideTitle('Основы', 'Тема интерфейса'),
        content: 'Здесь можно переключить светлую и тёмную тему.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="header-account-menu"]',
        data: { stage: 'Основы' },
        title: getGuideTitle('Основы', 'Профиль'),
        content:
          'Меню профиля открывает настройки пользователя, профиль и выход из системы.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="header-guide-button"]',
        data: { stage: 'Основы' },
        title: getGuideTitle('Основы', 'Повтор руководства'),
        content:
          'Если потребуется, руководство можно запустить повторно этой кнопкой.',
        placement: 'bottom'
      },
      {
        target: '[data-guide-id="main-content"]',
        data: { stage: 'Основы' },
        title: getGuideTitle('Основы', 'Рабочая область'),
        content:
          'В этой области открываются таблицы, формы, карточки, графы и просмотрщики файлов.',
        placement: 'center'
      },
      {
        target: '[data-guide-id="sidebar-item-tags"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Теги'),
        content:
          'Теги помогают группировать документы, требования, тесты, устройства и другие сущности для быстрого поиска и навигации.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-tasks"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Задания тестирования'),
        content:
          'На экране заданий запускаются тестовые наборы, отслеживаются статусы выполнения и открываются отчёты по отдельным тестам.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-devices"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Устройства'),
        content:
          'Здесь хранятся устройства испытательного стенда и их параметры, используемые при подготовке и запуске тестов.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-tests-block"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Структура тестов'),
        content:
          'Раздел объединяет иерархию тестов, отдельные тесты, подгруппы и группы. Отсюда удобно смотреть состав тестовой базы.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-topologies-block"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Топологии'),
        content:
          'В топологиях описываются схемы стендов: общие топологии задают основу, а конкретные топологии используются в тестах.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-test-utilities"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Утилиты тестирования'),
        content:
          'Здесь находятся базовые конфигурации и шаблоны тестов — заготовки, которые переиспользуются при создании тестовых сценариев.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-requirements-block"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Требования'),
        content:
          'Раздел требований показывает требования списком и в виде иерархии, а также помогает отслеживать покрытие тестами.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-documents"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Документы'),
        content:
          'В документах хранятся исходные материалы и интерактивные фрагменты, которые можно связывать с требованиями.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-access-control"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Доступ'),
        content:
          'Администратор управляет пользователями, ролями и правами доступа к разделам системы.',
        placement: 'right'
      },
      {
        target: '[data-guide-id="sidebar-item-system-management"]',
        data: { stage: 'Экраны' },
        title: getGuideTitle('Экраны', 'Система'),
        content:
          'Системный раздел содержит историю действий, события, импорт и экспорт данных, резервные копии, логи и мониторинг состояния.',
        placement: 'right'
      }
    ],
    []
  )

  React.useEffect(() => {
    if (loaded && settings.firstLaunchPromptAnswered === false) {
      setIsStartPromptOpen(true)
    }
  }, [loaded, settings.firstLaunchPromptAnswered])

  const completeGuide = React.useCallback(
    (completed: boolean) => {
      setIsGuideRunning(false)
      setGuideSettings({
        ...settings,
        firstLaunchPromptAnswered: true,
        completed
      })
    },
    [settings, setGuideSettings]
  )

  const moveToGuideStep = React.useCallback(
    (nextIndex: number) => {
      const target = getGuideStepTarget(guideSteps[nextIndex])

      if (target !== null) {
        scrollSidebarTargetIntoView(target)
      }

      requestAnimationFrame(() => {
        setGuideStepIndex(nextIndex)
      })
    },
    [guideSteps]
  )

  const skipGuideStage = React.useCallback(() => {
    const currentStage = getGuideStepStage(guideSteps[guideStepIndex])
    const nextStageIndex = guideSteps.findIndex(
      (step, index) =>
        index > guideStepIndex && getGuideStepStage(step) !== currentStage
    )

    if (nextStageIndex === -1) {
      completeGuide(true)
      return
    }

    moveToGuideStep(nextStageIndex)
  }, [completeGuide, guideStepIndex, guideSteps, moveToGuideStep])

  const startGuide = React.useCallback(() => {
    setIsStartPromptOpen(false)
    setIsManualStartPromptOpen(false)
    setIsGuideRunning(false)
    requestAnimationFrame(() => {
      const availableSteps = resolveGuideSteps(steps)
      const firstTarget = getGuideStepTarget(availableSteps[0])

      if (firstTarget !== null) {
        scrollSidebarTargetIntoView(firstTarget)
      }

      setGuideSteps(availableSteps)
      setGuideStepIndex(0)
      setIsGuideRunning(availableSteps.length > 0)
    })
    setGuideSettings({
      ...settings,
      firstLaunchPromptAnswered: true
    })
  }, [settings, setGuideSettings, steps])

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
      if (state.status === STATUS.SKIPPED) {
        completeGuide(false)
        return
      }

      if (state.status === STATUS.FINISHED) {
        completeGuide(true)
        return
      }

      if (
        state.type !== EVENTS.STEP_AFTER &&
        state.type !== EVENTS.TARGET_NOT_FOUND
      ) {
        return
      }

      const direction = state.action === ACTIONS.PREV ? -1 : 1
      let nextIndex = state.index + direction

      while (nextIndex >= 0 && nextIndex < guideSteps.length) {
        const nextStep = guideSteps[nextIndex]
        const target = getGuideStepTarget(nextStep)

        if (target !== null && isGuideTargetVisible(target)) {
          moveToGuideStep(nextIndex)
          return
        }

        nextIndex += direction
      }

      if (nextIndex < 0) {
        setGuideStepIndex(0)
        return
      }

      if (nextIndex >= guideSteps.length) {
        completeGuide(true)
      }
    },
    [completeGuide, guideSteps, moveToGuideStep]
  )

  const GuideTooltip = React.useCallback(
    ({
      backProps,
      index,
      isLastStep,
      primaryProps,
      skipProps,
      step,
      tooltipProps
    }: TooltipRenderProps) => {
      const currentStage = getGuideStepStage(guideSteps[guideStepIndex])
      const hasNextStage = guideSteps.some(
        (guideStep, candidateIndex) =>
          candidateIndex > index &&
          getGuideStepStage(guideStep) !== currentStage
      )

      return (
        <div
          {...tooltipProps}
          style={{
            ...step.styles.tooltip,
            padding: 16
          }}
        >
          <div style={step.styles.tooltipContainer}>
            {step.title !== undefined && (
              <h4
                id="joyride-tooltip-title"
                style={{
                  ...step.styles.tooltipTitle,
                  margin: 0
                }}
              >
                {step.title}
              </h4>
            )}
            <div
              id="joyride-tooltip-content"
              style={{
                ...step.styles.tooltipContent,
                marginTop: 12
              }}
            >
              {step.content}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 8,
              marginTop: 16
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {index > 0 ? (
                <Tooltip title="Назад" arrow>
                  <IconButton
                    {...backProps}
                    size="small"
                    sx={{
                      width: 34,
                      height: 34,
                      border: `1px solid ${guidePrimaryColor}`,
                      borderRadius: 1,
                      color: guidePrimaryColor
                    }}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
              {!isLastStep ? (
                <Tooltip title="Пропустить руководство" arrow>
                  <IconButton
                    {...skipProps}
                    size="small"
                    sx={{
                      width: 34,
                      height: 34,
                      border: `1px solid ${guideTextColor}`,
                      borderRadius: 1,
                      color: guideTextColor
                    }}
                  >
                    <ExitToAppIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {!isLastStep ? (
                <Tooltip
                  title={hasNextStage ? 'Пропустить этап' : 'Завершить этап'}
                  arrow
                >
                  <IconButton
                    size="small"
                    onClick={skipGuideStage}
                    sx={{
                      width: 34,
                      height: 34,
                      border: `1px solid ${guidePrimaryColor}`,
                      borderRadius: 1,
                      color: guidePrimaryColor
                    }}
                  >
                    <SkipNextIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
              <Tooltip
                title={isLastStep ? 'Завершить руководство' : 'Далее'}
                arrow
              >
                <IconButton
                  {...primaryProps}
                  size="small"
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1,
                    backgroundColor: guidePrimaryColor,
                    color: guideBackgroundColor,
                    '&:hover': {
                      backgroundColor: guidePrimaryColor,
                      opacity: 0.85
                    }
                  }}
                >
                  <NavigateNextIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      )
    },
    [guideStepIndex, guideSteps, skipGuideStage]
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
        steps={guideSteps}
        stepIndex={guideStepIndex}
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
            animationFrame: true
          }
        }}
        tooltipComponent={GuideTooltip}
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
