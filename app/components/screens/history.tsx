// Project
import type { VersionedResourceTypePlural } from '@common/enums'
import { allVersionedResourceTypePlurals } from '@common/enums'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer, VerticalTwoPartsContainer } from '../containers'
import type { FormSelectProps } from '../forms/common'
import { FormNumField, FormSelect } from '../forms/common'
import { localizationForVersionedResourceTypePlural } from '~/localization'
import { ProjButton } from '../buttons/button'
import { ColumnViewerRef } from '../single-viewers/common'
// React router
import { matchPath, useLocation, useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import ComputerIcon from '@mui/icons-material/Computer'
import DescriptionIcon from '@mui/icons-material/Description'
import DeviceHubIcon from '@mui/icons-material/DeviceHub'
import FormatListNumberedRtlIcon from '@mui/icons-material/FormatListNumberedRtl'
import FoundationIcon from '@mui/icons-material/Foundation'
import LanIcon from '@mui/icons-material/Lan'
import PersonIcon from '@mui/icons-material/Person'
import RuleIcon from '@mui/icons-material/Rule'
import TagIcon from '@mui/icons-material/Tag'
import TaskIcon from '@mui/icons-material/Task'
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'
import TimelineIcon from '@mui/icons-material/Timeline'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import ViewWeekIcon from '@mui/icons-material/ViewWeek'
import WidgetsIcon from '@mui/icons-material/Widgets'
import type { SelectChangeEvent, SelectProps } from '@mui/material/Select'
import { useTheme } from '@mui/material/styles'
// Other
import * as changeCase from 'change-case'

export interface HistoryScreenProps {
  children: React.ReactNode
}

export function HistoryScreen({ children }: HistoryScreenProps) {
  const theme = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const match = matchPath(
    '/history/:resourceType?/:resourceId?/:transitionNum?',
    pathname
  )
  const resourceType = (() => {
    const resourceTypeConstant = changeCase.constantCase(
      match?.params.resourceType ?? ''
    ) as VersionedResourceTypePlural
    return allVersionedResourceTypePlurals.includes(resourceTypeConstant)
      ? resourceTypeConstant
      : undefined
  })()
  const withResourceType = resourceType !== undefined
  const resourceTypeKebab =
    resourceType !== undefined ? changeCase.kebabCase(resourceType) : undefined
  const resourceTypeLocalized =
    resourceType !== undefined
      ? localizationForVersionedResourceTypePlural.get(resourceType)!
      : undefined
  const resourceTypeIcon =
    resourceType !== undefined
      ? (() => {
          switch (resourceType) {
            case 'ROLES':
              return TheaterComedyIcon
            case 'USERS':
              return PersonIcon
            case 'TAGS':
              return TagIcon
            case 'DOCUMENTS':
              return DescriptionIcon
            case 'FRAGMENTS':
              return DescriptionIcon
            case 'REQUIREMENTS':
              return FormatListNumberedRtlIcon
            case 'COMMON_TOPOLOGIES':
              return DeviceHubIcon
            case 'TOPOLOGIES':
              return LanIcon
            case 'DBCS':
              return WidgetsIcon
            case 'TEST_TEMPLATES':
              return FoundationIcon
            case 'TESTS':
              return RuleIcon
            case 'SUBGROUPS':
              return ViewStreamIcon
            case 'GROUPS':
              return ViewWeekIcon
            case 'DEVICES':
              return ComputerIcon
            case 'TASKS':
              return TaskIcon
            case 'TASK_TEMPLATES':
              return TaskIcon
          }
        })()
      : undefined
  const resourceId = React.useMemo(() => {
    const parsed =
      match?.params.resourceId !== undefined
        ? parseInt(match.params.resourceId)
        : undefined
    return parsed === undefined || isNaN(parsed) ? undefined : parsed
  }, [match])
  const withResourceId = withResourceType && resourceId !== undefined
  const transitionNum = React.useMemo(() => {
    const parsed =
      match?.params.transitionNum !== undefined
        ? parseInt(match.params.transitionNum)
        : undefined
    return parsed === undefined || isNaN(parsed) ? undefined : parsed
  }, [match])
  const withTransitionNum = withResourceId && transitionNum !== undefined

  const [newResourceType, setNewResourceType] =
    React.useState<VersionedResourceTypePlural | null>(resourceType ?? null)
  const [newResourceId, setNewResourceId] = React.useState<number | null>(
    resourceId ?? null
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'история',
          href: '/history',
          Icon: TimelineIcon
        }
      ],
      ...(withResourceType
        ? [
            {
              title: resourceTypeLocalized!,
              href: `/history/${resourceTypeKebab!}`,
              Icon: resourceTypeIcon!
            }
          ]
        : []),
      ...(withResourceId
        ? [
            {
              title: `[ID:${resourceId}]`,
              href: `/history/${resourceTypeKebab!}/${resourceId}`
            }
          ]
        : []),
      ...(withTransitionNum
        ? [
            {
              title: `[TR:${transitionNum}]`,
              href: `/history/${resourceTypeKebab!}/${resourceId}/${transitionNum}`
            }
          ]
        : [])
    ],
    [
      withResourceType,
      resourceTypeLocalized,
      resourceTypeKebab,
      resourceTypeIcon,
      withResourceId,
      resourceId,
      withTransitionNum,
      transitionNum
    ]
  )

  const resourceTypeSelectItems: FormSelectProps<string>['items'] =
    React.useMemo(
      () =>
        allVersionedResourceTypePlurals.map((type) => ({
          value: type,
          title: localizationForVersionedResourceTypePlural.get(type) ?? type
        })),
      []
    )

  const handleResourceTypeChange: SelectProps<string>['onChange'] =
    React.useCallback(
      (event: SelectChangeEvent<string>) => {
        setNewResourceType(event.target.value as VersionedResourceTypePlural)
      },
      [setNewResourceType]
    )

  const handleResourceIdChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const resourceId = (() => {
        const parsed =
          event.target.value !== undefined
            ? parseInt(event.target.value)
            : undefined
        return parsed === undefined || isNaN(parsed) ? undefined : parsed
      })()
      setNewResourceId(resourceId ?? null)
    },
    [setNewResourceId]
  )

  const handleUpdateClick = React.useCallback(() => {
    if (newResourceType !== null && newResourceId !== null) {
      void navigate(
        `/history/${changeCase.kebabCase(newResourceType)}/${newResourceId}`
      )
    }
  }, [navigate, newResourceType, newResourceId])

  return (
    <LayoutScreenContainer title="история" breadcrumbsItems={breadcrumbsItems}>
      <VerticalTwoPartsContainer proportions="needed_rest">
        <Box
          display="flex"
          alignItems="center"
          border={`1px solid ${
            theme.palette.mode === 'light'
              ? theme.palette.grey[300]
              : theme.palette.grey.A700
          }`}
          borderRadius="5px"
          p={0}
          sx={{
            height: '100%',
            overflow: 'auto',
            backgroundColor:
              theme.palette.mode === 'light'
                ? 'white'
                : theme.palette.background.default
          }}
        >
          <FormSelect
            style={{ marginTop: 4, minWidth: '220px' }}
            name="resourceType"
            label="ресурс"
            items={resourceTypeSelectItems}
            value={newResourceType ?? ''}
            onChange={handleResourceTypeChange}
            helperText=""
          />
          <FormNumField
            style={{
              marginLeft: 5,
              marginTop: 4,
              maxWidth: '150px',
              height: '36px'
            }}
            name="resourceId"
            label="ID объекта"
            value={newResourceId ?? ''}
            onChange={handleResourceIdChange}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                handleUpdateClick()
              }
            }}
            helperText=""
          />
          <ProjButton
            style={{ marginLeft: 10, marginTop: 0, height: '30px' }}
            variant="outlined"
            onClick={handleUpdateClick}
            disabled={newResourceType === null || newResourceId === null}
          >
            Обновить
          </ProjButton>
          {resourceType !== undefined && newResourceId !== null ? (
            <ColumnViewerRef
              style={{ marginLeft: 10, marginTop: -2, height: '30px' }}
              text="ПЕРЕЙТИ К ОБЪЕКТУ"
              href={`/${changeCase.kebabCase(resourceType)}/${newResourceId}`}
            />
          ) : null}
        </Box>
        {children}
      </VerticalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
