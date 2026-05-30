// Project
import type {
  TagPrimary,
  RequirementSecondary,
  TopologySecondary,
  TestSecondary,
  SubgroupTertiary,
  GroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useLocationHash } from '~/hooks/use-location-hash'
import { useDialogs } from '~/providers/dialogs'
import { readGroupsPrimary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  ContainerWithTitle,
  HorizontalTwoPartsContainer
} from '~/components/containers'
import type { TabViewerProps } from '~/components/tab-viewer'
import { TabViewer } from '~/components/tab-viewer'
import { SubgroupRequirementsGrid } from '~/components/grids/resources/subgroup-requirements'
import { UpdateSubgroupFormDialog } from '~/components/forms/resources/update-subgroup'
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

export interface SubgroupViewerProps {
  tags: TagPrimary[] | null
  requirements: RequirementSecondary[] | null
  topologies: TopologySecondary[] | null
  tests: TestSecondary[] | null
  subgroup: SubgroupTertiary
  group: GroupPrimary | null
}

export function SubgroupViewer({
  tags,
  requirements,
  topologies,
  tests,
  subgroup,
  group
}: SubgroupViewerProps) {
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
  const [efGroups, setEfGroups] = React.useState<GroupPrimary[]>([])
  const [updatedSubgroupId, setUpdatedSubgroupId] = React.useState<
    number | null
  >(null)

  const handleUpdateClick = React.useCallback(async () => {
    const [groups] = await Promise.all([readGroupsPrimary()])
    setEfGroups(groups ?? [])
    setUpdatedSubgroupId(subgroup.id)
  }, [subgroup])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedSubgroupId(null)
  }, [setUpdatedSubgroupId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить подгруппу '${subgroup.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteSubgroup({
          id: subgroup.id
        })
        notifier.showSuccess(`подгруппа «${subgroup.code}» удалена`)
        void navigate('/subgroups')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, subgroup])

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
      <ContainerWithTitle title={['Подгруппа', `${subgroup.code}`]}>
        <TabViewer tabs={tabs} onChange={handleTabChange} value={tabValue} />
        {tabValue === 'main' ? (
          <HorizontalTwoPartsContainer proportions="EQUAL">
            <ColumnViewer>
              <ColumnViewerBlock title="вид навигации">
                <ColumnViewerChipsBlock
                  items={[
                    {
                      text: 'таблица',
                      href: `/subgroups/${subgroup.id}`
                    },
                    {
                      text: 'иерархия',
                      href: `/hierarchy/subgroups/${subgroup.id}`
                    }
                  ]}
                />
              </ColumnViewerBlock>
              <ColumnViewerBlock title="действия">
                <ColumnViewerActions
                  onUpdateClick={
                    rightsSet.has('UPDATE_SUBGROUP')
                      ? handleUpdateClick
                      : undefined
                  }
                  onDeleteClick={
                    rightsSet.has('DELETE_SUBGROUP')
                      ? handleDeleteClick
                      : undefined
                  }
                />
              </ColumnViewerBlock>
              <ColumnViewerBlock title="основная информация">
                <ColumnViewerItem field="код" val={subgroup.code} />
                <ColumnViewerItem field="название" val={subgroup.name} />
                <ColumnViewerRef
                  field="группа"
                  text={subgroup.groupId !== null ? (group?.code ?? '???') : ''}
                  href={
                    subgroup.groupId !== null
                      ? `${isHierarchyPath ? '/hierarchy' : ''}/groups/${subgroup.groupId}`
                      : undefined
                  }
                />
                <ColumnViewerItem
                  field="номер в группе"
                  val={subgroup.numInGroup ?? undefined}
                />
                <ColumnViewerRef
                  field="история"
                  text="ПЕРЕЙТИ"
                  href={`/history/subgroups/${subgroup.id}`}
                />
              </ColumnViewerBlock>
              <ColumnViewerBlock
                title={`тесты${tests !== null && tests.length > 0 ? ` (${tests.length})` : ''}`}
              >
                <ColumnViewerChipsBlock
                  emptyText={tests !== null ? 'нет' : '???'}
                  items={(tests ?? []).map((test) => ({
                    text: test.code,
                    href: `${isHierarchyPath ? '/hierarchy' : ''}/tests/${test.id}`
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
                  text={subgroup.description?.text}
                  emptyText="нет"
                />
              </ColumnViewerBlock>
            </ColumnViewer>
          </HorizontalTwoPartsContainer>
        ) : requirements !== null ? (
          <SubgroupRequirementsGrid
            requirements={requirements}
            topologies={topologies}
            tests={tests}
          />
        ) : null}
      </ContainerWithTitle>
      <UpdateSubgroupFormDialog
        key={updatedSubgroupId}
        groups={efGroups}
        subgroupId={updatedSubgroupId}
        setSubgroupId={setUpdatedSubgroupId}
        initialSubgroup={subgroup}
        onSuccessUpdateSubgroup={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
