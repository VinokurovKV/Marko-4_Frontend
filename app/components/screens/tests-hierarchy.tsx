// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type TestsHierarchyTreeProps,
  TestsHierarchyTree
} from '../trees/resources/tests-hierarchy'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import RuleIcon from '@mui/icons-material/Rule'
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import ViewWeekIcon from '@mui/icons-material/ViewWeek'

export interface TestsHierarchyScreenProps extends TestsHierarchyTreeProps {
  children: React.ReactNode
}

export function TestsHierarchyScreen({
  children,
  ...props
}: TestsHierarchyScreenProps) {
  const { pathname } = useLocation()

  const matchTest = matchPath('/hierarchy/tests/:testId?', pathname)
  const matchSubgroup = matchPath('/hierarchy/subgroups/:subgroupId?', pathname)
  const matchGroup = matchPath('/hierarchy/groups/:groupId?', pathname)

  const withTest = matchTest?.params.testId !== undefined
  const withSubgroup = matchSubgroup?.params.subgroupId !== undefined
  const withGroup = matchGroup?.params.groupId !== undefined

  const testId = React.useMemo(() => {
    const parsed =
      matchTest?.params.testId !== undefined
        ? parseInt(matchTest.params.testId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [matchTest])

  const test = React.useMemo(
    () =>
      testId !== null
        ? (props.tests.find((test) => test.id === testId) ?? null)
        : null,
    [props.tests, testId]
  )
  const testCode = React.useMemo(() => test?.code ?? null, [test])

  const subgroupId = React.useMemo(() => {
    if (test !== null) {
      return test.subgroupId
    }
    const parsed =
      matchSubgroup?.params.subgroupId !== undefined
        ? parseInt(matchSubgroup.params.subgroupId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [matchSubgroup, test])

  const subgroup = React.useMemo(
    () =>
      subgroupId !== null
        ? (props.subgroups.find((subgroup) => subgroup.id === subgroupId) ??
          null)
        : null,
    [props.subgroups, subgroupId]
  )

  const subgroupCode = React.useMemo(() => subgroup?.code ?? null, [subgroup])

  const groupId = React.useMemo(() => {
    if (subgroup !== null) {
      return subgroup.groupId
    }
    const parsed =
      matchGroup?.params.groupId !== undefined
        ? parseInt(matchGroup.params.groupId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [matchGroup, subgroup])

  const groupCode = React.useMemo(
    () =>
      groupId !== null
        ? (props.groups.find((group) => group.id === groupId)?.code ?? null)
        : null,
    [props.groups, groupId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'иерархия тестов',
          href: '/hierarchy',
          Icon: ViewSidebarIcon
        }
      ],
      ...(withGroup || groupId !== null
        ? [
            {
              title:
                groupCode !== null
                  ? `группа ${groupCode}`
                  : groupId !== null
                    ? `группа [ID:${groupId}]`
                    : 'группа ???',
              href:
                groupId !== null ? `/hierarchy/groups/${groupId}` : undefined,
              Icon: ViewWeekIcon
            }
          ]
        : []),
      ...(withSubgroup || subgroupId !== null
        ? [
            {
              title:
                subgroupCode !== null
                  ? `подгруппа ${subgroupCode}`
                  : subgroupId !== null
                    ? `подгруппа [ID:${subgroupId}]`
                    : 'подгруппа ???',
              href:
                subgroupId !== null
                  ? `/hierarchy/subgroups/${subgroupId}`
                  : undefined,
              Icon: ViewStreamIcon
            }
          ]
        : []),
      ...(withTest || testId !== null
        ? [
            {
              title:
                testCode !== null
                  ? `тест ${testCode}`
                  : testId !== null
                    ? `тест [ID:${testId}]`
                    : 'тест ???',
              href: testId !== null ? `/hierarchy/tests/${testId}` : undefined,
              Icon: RuleIcon
            }
          ]
        : [])
    ],
    [
      withTest,
      withSubgroup,
      withGroup,
      testId,
      subgroupId,
      groupId,
      testCode,
      subgroupCode,
      groupCode
    ]
  )

  return (
    <LayoutScreenContainer
      title="иерархия тестов"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer proportions="ONE_TWO">
        <TestsHierarchyTree
          {...props}
          selectedTestId={withTest ? (testId ?? undefined) : undefined}
          selectedSubgroupId={
            withSubgroup ? (subgroupId ?? undefined) : undefined
          }
          selectedGroupId={withGroup ? (groupId ?? undefined) : undefined}
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
