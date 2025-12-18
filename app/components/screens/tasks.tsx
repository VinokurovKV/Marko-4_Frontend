// Project
import type { TestPrimary } from '~/types'
import { useTestSubscription } from '~/hooks/resources'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type TasksGridProps, TasksGrid } from '../grids/resources/tasks'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import TaskIcon from '@mui/icons-material/Task'

export interface TasksScreenProps
  extends Omit<
    TasksGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function TasksScreen({ children, ...props }: TasksScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/tasks/:taskId?/:testId?', pathname)
  const withTask = match?.params.taskId !== undefined
  const withTest = match?.params.testId !== undefined
  const taskId = React.useMemo(() => {
    const parsed =
      match?.params.taskId !== undefined ? parseInt(match.params.taskId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])
  const testId = React.useMemo(() => {
    const parsed =
      match?.params.testId !== undefined ? parseInt(match.params.testId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const [test, setTest] = React.useState<TestPrimary | null | undefined>(
    undefined
  )

  useTestSubscription(
    'PRIMARY_PROPS',
    testId,
    setTest as React.Dispatch<React.SetStateAction<TestPrimary | null>>,
    true
  )

  const taskCode = React.useMemo(
    () => props.tasks.find((task) => task.id === taskId)?.code ?? null,
    [props.tasks, taskId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'задания тестирования',
          href: '/tasks',
          Icon: TaskIcon
        }
      ],
      ...(withTask
        ? [
            {
              title:
                taskCode !== null
                  ? taskCode
                  : taskId !== null
                    ? `[ID:${taskId}]`
                    : '???',
              href: taskId !== null ? `/tasks/${taskId}` : undefined
            }
          ]
        : []),
      ...(withTest
        ? [
            {
              title:
                test !== undefined
                  ? test?.code !== undefined
                    ? test.code
                    : testId !== null
                      ? `[ID:${testId}]`
                      : '???'
                  : '',
              href:
                taskId !== null && testId !== null
                  ? `/tasks/${taskId}/${testId}`
                  : undefined
            }
          ]
        : [])
    ],
    [withTask, withTest, taskId, taskCode, test]
  )
  return (
    <LayoutScreenContainer
      title="задания тестирования"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withTask ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <TasksGrid
          key={`${withTask}`}
          {...props}
          navigationMode={withTask}
          navigationModeSelectedRowId={
            withTask ? (taskId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
