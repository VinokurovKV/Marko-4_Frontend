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
import { useDialogs } from '~/providers/dialogs'
import { readGroupsPrimary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  ContainerWithTitle,
  HorizontalTwoPartsContainer
} from '~/components/containers'
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
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Other
import capitalize from 'capitalize'

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
  const navigate = useNavigate()
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

  return (
    // <VerticalTwoPartsContainer
    //   proportions={requirements !== null ? '50_50' : '100_0'}
    //   title={['Подгруппа', `${subgroup.code}`]}
    // >
    <>
      <HorizontalTwoPartsContainer
        proportions={requirements !== null ? 'EQUAL' : 'ONE_ZERO'}
        title={['Подгруппа', `${subgroup.code}`]}
      >
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
                rightsSet.has('UPDATE_SUBGROUP') ? handleUpdateClick : undefined
              }
              onDeleteClick={
                rightsSet.has('DELETE_SUBGROUP') ? handleDeleteClick : undefined
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
                  ? `/groups/${subgroup.groupId}`
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
                href: `/hierarchy/tests/${test.id}`
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
          <ColumnViewerBlock title="описание">
            <ColumnViewerText
              text={subgroup.description?.text}
              emptyText="нет"
            />
          </ColumnViewerBlock>
        </ColumnViewer>
        {requirements !== null ? (
          <ContainerWithTitle title="тесты">
            <SubgroupRequirementsGrid
              requirements={requirements}
              topologies={topologies}
              tests={tests}
            />
          </ContainerWithTitle>
        ) : null}
      </HorizontalTwoPartsContainer>
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
    // </VerticalTwoPartsContainer>
  )
}
