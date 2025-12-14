// Project
import type { RoleTertiary } from '~/types'
import { localizationForRight } from '~/localization'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerText
} from '../common'

export interface RoleViewerProps {
  role: RoleTertiary
}

export function RoleViewer({ role }: RoleViewerProps) {
  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Роль', `${role.name}`]}
    >
      <VerticalTwoPartsContainer proportions="needed_rest">
        <ColumnViewer>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="название" val={role.name} />
          </ColumnViewerBlock>
        </ColumnViewer>
        <ColumnViewer>
          <ColumnViewerBlock
            title={`права${role.rights.length > 0 ? ` (${role.rights.length})` : ''}`}
          >
            <ColumnViewerChipsBlock
              emptyText="нет"
              items={role.rights.map((right) => ({
                text: localizationForRight.get(right) ?? ''
              }))}
            />
          </ColumnViewerBlock>
        </ColumnViewer>
      </VerticalTwoPartsContainer>
      <ColumnViewer>
        <ColumnViewerBlock title="описание">
          <ColumnViewerText text={role.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
