// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type DbcsGridProps, DbcsGrid } from '../grids/resources/dbcs'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import WidgetsIcon from '@mui/icons-material/Widgets'

export interface DbcsScreenProps
  extends Omit<
    DbcsGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function DbcsScreen({ children, ...props }: DbcsScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/dbcs/:dbcId?', pathname)
  const withDbc = match?.params.dbcId !== undefined
  const dbcId = React.useMemo(() => {
    const parsed =
      match?.params.dbcId !== undefined ? parseInt(match.params.dbcId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const dbcCode = React.useMemo(
    () => props.dbcs.find((dbc) => dbc.id === dbcId)?.code ?? null,
    [props.dbcs, dbcId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'базовые конфигурации',
          href: '/dbcs',
          Icon: WidgetsIcon
        }
      ],
      ...(withDbc
        ? [
            {
              title:
                dbcCode !== null
                  ? dbcCode
                  : dbcId !== null
                    ? `[ID:${dbcId}]`
                    : '???',
              href: dbcId !== null ? `/dbcs/${dbcId}` : undefined
            }
          ]
        : [])
    ],
    [dbcId, dbcCode]
  )
  return (
    <LayoutScreenContainer
      title="базовые конфигурации"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withDbc ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <DbcsGrid
          key={`${withDbc}`}
          {...props}
          navigationMode={withDbc}
          navigationModeSelectedRowId={
            withDbc ? (dbcId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
