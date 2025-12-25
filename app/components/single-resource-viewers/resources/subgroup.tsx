// Project
import type {
  TagPrimary,
  RequirementSecondary,
  TestPrimary,
  SubgroupTertiary,
  GroupPrimary
} from '~/types'
import {
  ContainerWithTitle,
  HorizontalTwoPartsContainer
} from '~/components/containers'
import { SubgroupRequirementsGrid } from '~/components/grids/resources/subgroup-requirements'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'

export interface SubgroupViewerProps {
  tags: TagPrimary[] | null
  requirements: RequirementSecondary[] | null
  tests: TestPrimary[] | null
  subgroup: SubgroupTertiary
  group: GroupPrimary | null
}

export function SubgroupViewer({
  tags,
  requirements,
  tests,
  subgroup,
  group
}: SubgroupViewerProps) {
  return (
    // <VerticalTwoPartsContainer
    //   proportions={requirements !== null ? '50_50' : '100_0'}
    //   title={['Подгруппа', `${subgroup.code}`]}
    // >
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
          <ColumnViewerText text={subgroup.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
      {requirements !== null ? (
        <ContainerWithTitle title="тесты">
          <SubgroupRequirementsGrid requirements={requirements} tests={tests} />
        </ContainerWithTitle>
      ) : null}
    </HorizontalTwoPartsContainer>
    // </VerticalTwoPartsContainer>
  )
}
