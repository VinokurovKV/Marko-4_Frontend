// Project
import type {
  TagPrimary,
  TestPrimary,
  SubgroupTertiary,
  GroupPrimary
} from '~/types'
import { HorizontalTwoPartsContainer } from '~/components/containers'
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
  tests: TestPrimary[] | null
  subgroup: SubgroupTertiary
  group: GroupPrimary | null
}

export function SubgroupViewer({
  tags,
  tests,
  subgroup,
  group
}: SubgroupViewerProps) {
  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Подгруппа', `${subgroup.code}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={subgroup.code} />
          <ColumnViewerItem field="название" val={subgroup.name} />
          <ColumnViewerRef
            field="группа"
            text={subgroup.groupId !== null ? (group?.code ?? '???') : ''}
            href={
              subgroup.groupId !== null
                ? `/group/${subgroup.groupId}`
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
              href: `/tests/${test.id}`
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
          <ColumnViewerText text={subgroup.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
