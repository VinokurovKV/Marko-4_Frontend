// Project
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { useTestSubscription } from '~/hooks/resources'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { TwoPartsContainer } from '../containers/two-parts-container'
import { type TestsGridProps, TestsGrid } from '../grids/resources/tests'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import RuleIcon from '@mui/icons-material/Rule'

type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>

export interface TestLayoutScreenProps
  extends Omit<
    TestsGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function TestLayoutScreen(props: TestLayoutScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/tests/:testId', pathname)
  const testId = (() => {
    const parsed =
      match?.params.testId !== undefined ? parseInt(match.params.testId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  })()

  const [test, setTest] = React.useState<Test | null>(
    props.initialTests.find((test) => test.id === testId) ?? null
  )

  useTestSubscription('PRIMARY_PROPS', testId, setTest)

  const testCode = test?.code ?? '???'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'тесты',
        href: '/tests',
        Icon: RuleIcon
      },
      {
        title: testCode,
        href: `/tests/${testId}`
      }
    ],
    [testId, testCode]
  )
  return (
    <LayoutScreenContainer title="тесты" breadcrumbsItems={breadcrumbsItems}>
      <TwoPartsContainer proportions="ONE_THREE">
        <TestsGrid
          {...props}
          navigationMode={true}
          navigationModeSelectedRowId={testId ?? undefined}
        />
        {props.children}
      </TwoPartsContainer>
    </LayoutScreenContainer>
  )
}
