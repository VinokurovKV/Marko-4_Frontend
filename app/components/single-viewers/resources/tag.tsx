// Project
import type {
  TagAll,
  DocumentPrimary,
  FragmentPrimary,
  RequirementPrimary,
  CommonTopologyPrimary,
  TopologyPrimary,
  DbcPrimary,
  TestTemplatePrimary,
  TestPrimary,
  SubgroupPrimary,
  GroupPrimary,
  DevicePrimary,
  TaskPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { UpdateTagFormDialog } from '~/components/forms/resources/update-tag'
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

export interface TagViewerProps {
  tag: TagAll
  documents: DocumentPrimary[] | null
  documentsForFragments: DocumentPrimary[] | null
  fragments: FragmentPrimary[] | null
  requirements: RequirementPrimary[] | null
  commonTopologies: CommonTopologyPrimary[] | null
  topologies: TopologyPrimary[] | null
  dbcs: DbcPrimary[] | null
  testTemplates: TestTemplatePrimary[] | null
  tests: TestPrimary[] | null
  subgroups: SubgroupPrimary[] | null
  groups: GroupPrimary[] | null
  devices: DevicePrimary[] | null
  tasks: TaskPrimary[] | null
}

export function TagViewer({
  tag,
  documents,
  documentsForFragments,
  fragments,
  requirements,
  commonTopologies,
  topologies,
  dbcs,
  testTemplates,
  tests,
  subgroups,
  groups,
  devices,
  tasks
}: TagViewerProps) {
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
  const [updatedTagId, setUpdatedTagId] = React.useState<number | null>(null)

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedTagId(tag.id)
    return Promise.resolve()
  }, [tag])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedTagId(null)
  }, [setUpdatedTagId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить ntu '${tag.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteTag({
          id: tag.id
        })
        notifier.showSuccess(`тег «${tag.code}» удален`)
        void navigate('/tags')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, tag])

  const documentCodeForId = React.useMemo(
    () =>
      new Map(
        (documentsForFragments ?? []).map((document) => [
          document.id,
          document.code
        ])
      ),
    [documentsForFragments]
  )
  return (
    <>
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={['Тег', `${tag.code}`]}
      >
        <VerticalTwoPartsContainer proportions="needed_rest">
          <ColumnViewer>
            <ColumnViewerBlock title="действия">
              <ColumnViewerActions
                onUpdateClick={
                  rightsSet.has('UPDATE_TAG') ? handleUpdateClick : undefined
                }
                onDeleteClick={
                  rightsSet.has('DELETE_TAG') ? handleDeleteClick : undefined
                }
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="основная информация">
              <ColumnViewerItem field="код" val={tag.code} />
              <ColumnViewerRef
                field="история"
                text="ПЕРЕЙТИ"
                href={`/history/tags/${tag.id}`}
              />
            </ColumnViewerBlock>
          </ColumnViewer>
          <ColumnViewer>
            <ColumnViewerBlock title="документы">
              <ColumnViewerChipsBlock
                emptyText={documents !== null ? 'нет' : '???'}
                items={(documents ?? []).map((document) => ({
                  text: document.code,
                  href: `/documents/${document.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="фрагменты документов">
              <ColumnViewerChipsBlock
                emptyText={fragments !== null ? 'нет' : '???'}
                items={(fragments ?? []).map((fragment) => ({
                  text: `${documentCodeForId.get(fragment.documentId) ?? '???'} - ${fragment.innerCode}`,
                  href: `/fragments/${fragment.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="требования">
              <ColumnViewerChipsBlock
                emptyText={requirements !== null ? 'нет' : '???'}
                items={(requirements ?? []).map((requirement) => ({
                  text: requirement.code,
                  href: `/requirements/${requirement.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="общие топологии">
              <ColumnViewerChipsBlock
                emptyText={commonTopologies !== null ? 'нет' : '???'}
                items={(commonTopologies ?? []).map((commonTopology) => ({
                  text: commonTopology.code,
                  href: `/common-topologies/${commonTopology.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="топологии">
              <ColumnViewerChipsBlock
                emptyText={topologies !== null ? 'нет' : '???'}
                items={(topologies ?? []).map((topology) => ({
                  text: topology.code,
                  href: `/topologies/${topology.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="базовые конфигурации">
              <ColumnViewerChipsBlock
                emptyText={dbcs !== null ? 'нет' : '???'}
                items={(dbcs ?? []).map((dbc) => ({
                  text: dbc.code,
                  href: `/dbcs/${dbc.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="шаблоны тестов">
              <ColumnViewerChipsBlock
                emptyText={testTemplates !== null ? 'нет' : '???'}
                items={(testTemplates ?? []).map((testTemplate) => ({
                  text: testTemplate.code,
                  href: `/test-templates/${testTemplate.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="тесты">
              <ColumnViewerChipsBlock
                emptyText={tests !== null ? 'нет' : '???'}
                items={(tests ?? []).map((test) => ({
                  text: test.code,
                  href: `/hierarchy/tests/${test.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="подгруппы тестов">
              <ColumnViewerChipsBlock
                emptyText={subgroups !== null ? 'нет' : '???'}
                items={(subgroups ?? []).map((subgroup) => ({
                  text: subgroup.code,
                  href: `/hierarchy/subgroups/${subgroup.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="группы тестов">
              <ColumnViewerChipsBlock
                emptyText={groups !== null ? 'нет' : '???'}
                items={(groups ?? []).map((group) => ({
                  text: group.code,
                  href: `/hierarchy/groups/${group.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="устройства">
              <ColumnViewerChipsBlock
                emptyText={devices !== null ? 'нет' : '???'}
                items={(devices ?? []).map((device) => ({
                  text: device.code,
                  href: `/devices/${device.id}`
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="задания тестирования">
              <ColumnViewerChipsBlock
                emptyText={tasks !== null ? 'нет' : '???'}
                items={(tasks ?? []).map((task) => ({
                  text: task.code,
                  href: `/tasks/${task.id}`
                }))}
              />
            </ColumnViewerBlock>
          </ColumnViewer>
        </VerticalTwoPartsContainer>
        <ColumnViewer>
          <ColumnViewerBlock title="описание">
            <ColumnViewerText text={tag.description?.text} emptyText="нет" />
          </ColumnViewerBlock>
        </ColumnViewer>
      </HorizontalTwoPartsContainer>
      <UpdateTagFormDialog
        key={updatedTagId}
        tagId={updatedTagId}
        setTagId={setUpdatedTagId}
        initialTag={tag}
        onSuccessUpdateTag={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
