// Project
import type {
  TagPrimary,
  RequirementSecondary,
  TopologySecondary,
  TestSecondary,
  SubgroupPrimary,
  GroupTertiary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useLocationHash } from '~/hooks/use-location-hash'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  ContainerWithTitle,
  HorizontalTwoPartsContainer
} from '~/components/containers'
import type { TabViewerProps } from '~/components/tab-viewer'
import { TabViewer } from '~/components/tab-viewer'
import { GroupRequirementsGrid } from '~/components/grids/resources/group-requirements'
import { UpdateGroupFormDialog } from '~/components/forms/resources/update-group'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React router
import { useLocation, useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import Tab from '@mui/material/Tab'
// Other
import capitalize from 'capitalize'

type TabVal = 'main' | 'coverage'
type Tab = TabViewerProps<TabVal>['tabs'][0]

export interface GroupViewerProps {
  tags: TagPrimary[] | null
  requirements: RequirementSecondary[] | null
  topologies: TopologySecondary[] | null
  tests: TestSecondary[] | null
  subgroups: SubgroupPrimary[] | null
  group: GroupTertiary
}

export function GroupViewer({
  tags,
  requirements,
  topologies,
  tests,
  subgroups,
  group
}: GroupViewerProps) {
  const location = useLocation()
  const isHierarchyPath = location.pathname.startsWith('/hierarchy')
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useLocationHash<TabVal>('main')
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )
  const dialogs = useDialogs()

  // Edit form states
  const [updatedGroupId, setUpdatedGroupId] = React.useState<number | null>(
    null
  )

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedGroupId(group.id)
    return Promise.resolve()
  }, [group])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedGroupId(null)
  }, [setUpdatedGroupId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить группу '${group.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteGroup({
          id: group.id
        })
        notifier.showSuccess(`группа «${group.code}» удалена`)
        void navigate('/groups')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, group])

  const handleTabChange = React.useCallback(
    (event: React.SyntheticEvent, value: TabVal) => {
      setTabValue(value)
    },
    [setTabValue]
  )

  const tabs: Tab[] = React.useMemo(
    () => [
      {
        label: 'Основное',
        value: 'main'
      },
      {
        label: 'Покрытие',
        value: 'coverage'
      }
    ],
    []
  )

  return (
    <>
      <ContainerWithTitle title={['Группа', `${group.code}`]}>
        <TabViewer tabs={tabs} onChange={handleTabChange} value={tabValue} />
        {tabValue === 'main' ? (
          <HorizontalTwoPartsContainer proportions="EQUAL">
            <ColumnViewer>
              <ColumnViewerBlock title="вид навигации">
                <ColumnViewerChipsBlock
                  items={[
                    {
                      text: 'таблица',
                      href: `/groups/${group.id}`
                    },
                    {
                      text: 'иерархия',
                      href: `/hierarchy/groups/${group.id}`
                    }
                  ]}
                />
              </ColumnViewerBlock>
              <ColumnViewerBlock title="действия">
                <ColumnViewerActions
                  onUpdateClick={
                    rightsSet.has('UPDATE_GROUP')
                      ? handleUpdateClick
                      : undefined
                  }
                  onDeleteClick={
                    rightsSet.has('DELETE_GROUP')
                      ? handleDeleteClick
                      : undefined
                  }
                />
              </ColumnViewerBlock>
              <ColumnViewerBlock title="основная информация">
                <ColumnViewerItem field="код" val={group.code} />
                <ColumnViewerItem field="название" val={group.name} />
                <ColumnViewerItem field="номер" val={group.num ?? undefined} />
                <ColumnViewerRef
                  field="история"
                  text="ПЕРЕЙТИ"
                  href={`/history/groups/${group.id}`}
                />
              </ColumnViewerBlock>
              <ColumnViewerBlock
                title={`подгруппы${subgroups !== null && subgroups.length > 0 ? ` (${subgroups.length})` : ''}`}
              >
                <ColumnViewerChipsBlock
                  emptyText={subgroups !== null ? 'нет' : '???'}
                  items={(subgroups ?? []).map((subgroup) => ({
                    text: subgroup.code,
                    href: `${isHierarchyPath ? '/hierarchy' : ''}/subgroups/${subgroup.id}`
                  }))}
                />
              </ColumnViewerBlock>
              <ColumnViewerBlock title="теги">
                <ColumnViewerChipsBlock
                  emptyText={tags !== null ? 'нет' : '???'}
                  items={(tags ?? []).map((tag) => ({
                    text: tag.code,
                    href: `/tags/${tag.id}`
                  }))}
                />
              </ColumnViewerBlock>
            </ColumnViewer>
            <ColumnViewer>
              <ColumnViewerBlock title="описание">
                <ColumnViewerText
                  text={group.description?.text}
                  emptyText="нет"
                />
              </ColumnViewerBlock>
            </ColumnViewer>
          </HorizontalTwoPartsContainer>
        ) : requirements !== null ? (
          <GroupRequirementsGrid
            requirements={requirements}
            topologies={topologies}
            tests={tests}
            subgroups={subgroups}
          />
        ) : null}
      </ContainerWithTitle>
      <UpdateGroupFormDialog
        key={updatedGroupId}
        groupId={updatedGroupId}
        setGroupId={setUpdatedGroupId}
        initialGroup={group}
        onSuccessUpdateGroup={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
