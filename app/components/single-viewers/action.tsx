// Project
import type { Action, UserPrimary } from '~/types'
import { localizationForActionType } from '~/localization'
import { formatDateTime } from '~/utilities'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerItem,
  ColumnViewerRef
} from './common'
// Other
import JSONPretty from 'react-json-pretty'
// import 'react-json-pretty/themes/monikai.css'

export interface ActionViewerProps {
  action: Action
  initiator: UserPrimary | null
}

export function ActionViewer({ action, initiator }: ActionViewerProps) {
  return (
    <VerticalTwoPartsContainer
      proportions="needed_rest"
      title={['Действие', `[ID:${action.id}]`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="ID" val={action.id} />
          <ColumnViewerItem field="время" val={formatDateTime(action.time)} />
          <ColumnViewerItem
            field="тип"
            val={localizationForActionType.get(action.type)}
          />
          <ColumnViewerRef
            field="инициатор"
            text={
              action.initiatorId !== null
                ? (initiator?.login ?? `[ID:${action.initiatorId}]`)
                : ''
            }
            href={
              action.initiatorId !== null
                ? `/users/${action.initiatorId}`
                : undefined
            }
          />
        </ColumnViewerBlock>
      </ColumnViewer>
      <HorizontalTwoPartsContainer proportions="EQUAL">
        <ColumnViewer>
          <ColumnViewerBlock title="конфиг">
            <JSONPretty id="config" data={action.config}></JSONPretty>
          </ColumnViewerBlock>
        </ColumnViewer>
        <ColumnViewer>
          <ColumnViewerBlock title="результат">
            <JSONPretty id="result" data={action.result}></JSONPretty>
          </ColumnViewerBlock>
        </ColumnViewer>
      </HorizontalTwoPartsContainer>
    </VerticalTwoPartsContainer>
  )
}
