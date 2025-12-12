// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type TestsGridProps, TestsGrid } from '../grids/resources/tests'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import RuleIcon from '@mui/icons-material/Rule'

export interface TestsScreenProps
  extends Omit<
    TestsGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function TestsScreen({ children, ...props }: TestsScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/tests/:testId?', pathname)
  const withTest = match?.params.testId !== undefined
  const testId = React.useMemo(() => {
    const parsed =
      match?.params.testId !== undefined ? parseInt(match.params.testId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const testCode = React.useMemo(
    () => props.tests.find((test) => test.id === testId)?.code ?? null,
    [props.tests, testId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'тесты',
          href: '/tests',
          Icon: RuleIcon
        }
      ],
      ...(withTest
        ? [
            {
              title:
                testCode !== null
                  ? testCode
                  : testId !== null
                    ? `[ID:${testId}]`
                    : '???',
              href: testId !== null ? `/tests/${testId}` : undefined
            }
          ]
        : [])
    ],
    [testId, testCode]
  )

  return (
    <LayoutScreenContainer title="тесты" breadcrumbsItems={breadcrumbsItems}>
      <HorizontalTwoPartsContainer
        proportions={withTest ? 'ONE_THREE' : 'ONE_ZERO'}
      >
        <TestsGrid
          {...props}
          navigationMode={withTest}
          navigationModeSelectedRowId={
            withTest ? (testId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
