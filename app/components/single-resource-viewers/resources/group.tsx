// Project
import type { TagPrimary, SubgroupPrimary, GroupTertiary } from '~/types'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerText
} from '../common'

export interface GroupViewerProps {
  tags: TagPrimary[] | null
  subgroups: SubgroupPrimary[] | null
  group: GroupTertiary
}

export function GroupViewer({ tags, subgroups, group }: GroupViewerProps) {
  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Группа', `${group.code}`]}
    >
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
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={group.code} />
          <ColumnViewerItem field="название" val={group.name} />
          <ColumnViewerItem field="номер" val={group.num ?? undefined} />
        </ColumnViewerBlock>
        <ColumnViewerBlock
          title={`подгруппы${subgroups !== null && subgroups.length > 0 ? ` (${subgroups.length})` : ''}`}
        >
          <ColumnViewerChipsBlock
            emptyText={subgroups !== null ? 'нет' : '???'}
            items={(subgroups ?? []).map((subgroup) => ({
              text: subgroup.code,
              href: `/hierarchy/subgroups/${subgroup.id}`
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
          <ColumnViewerText text={group.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
