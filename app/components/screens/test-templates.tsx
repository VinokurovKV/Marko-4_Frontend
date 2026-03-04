// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type TestTemplatesGridProps,
  TestTemplatesGrid
} from '../grids/resources/test-templates'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import FoundationIcon from '@mui/icons-material/Foundation'

export interface TestTemplatesScreenProps extends Omit<
  TestTemplatesGridProps,
  'navigationMode' | 'navigationModeSelectedRowId'
> {
  children: React.ReactNode
}

export function TestTemplatesScreen({
  children,
  ...props
}: TestTemplatesScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/test-templates/:testTemplateId?', pathname)
  const withTestTemplate = match?.params.testTemplateId !== undefined
  const testTemplateId = React.useMemo(() => {
    const parsed =
      match?.params.testTemplateId !== undefined
        ? parseInt(match.params.testTemplateId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const testTemplateCode = React.useMemo(
    () =>
      props.testTemplates.find(
        (testTemplate) => testTemplate.id === testTemplateId
      )?.code ?? null,
    [props.testTemplates, testTemplateId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'шаблоны тестов',
          href: '/test-templates',
          Icon: FoundationIcon
        }
      ],
      ...(withTestTemplate
        ? [
            {
              title:
                testTemplateCode !== null
                  ? testTemplateCode
                  : testTemplateId !== null
                    ? `[ID:${testTemplateId}]`
                    : '???',
              href:
                testTemplateId !== null
                  ? `/test-templates/${testTemplateId}`
                  : undefined
            }
          ]
        : [])
    ],
    [withTestTemplate, testTemplateId, testTemplateCode]
  )
  return (
    <LayoutScreenContainer
      title="шаблоны тестов"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withTestTemplate ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <TestTemplatesGrid
          key={`${withTestTemplate}`}
          {...props}
          navigationMode={withTestTemplate}
          navigationModeSelectedRowId={
            withTestTemplate ? (testTemplateId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
