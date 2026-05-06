// Project
import type { Action, UserPrimary } from '~/types'
import { localizationForActionType } from '~/localization'
import { formatDateTime } from '~/utilities'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { prepareTargetForAction } from '../grids/cols'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
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
  const targetForHistoryMode = prepareTargetForAction(
    action.targetId,
    action.type,
    action.targetStrId,
    'HISTORY'
  )
  const targetForActiveMode = prepareTargetForAction(
    action.targetId,
    action.type,
    action.targetStrId,
    'ACTIVE'
  )
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
          {targetForActiveMode.href !== undefined ? (
            <ColumnViewerRef
              field="объект"
              text={targetForActiveMode.text}
              href={`/${targetForActiveMode.href}`}
            />
          ) : null}
          {targetForHistoryMode.href !== undefined ? (
            <ColumnViewerRef
              field="история объекта"
              text={targetForHistoryMode.text}
              href={`/history/${targetForActiveMode.href}`}
            />
          ) : null}
        </ColumnViewerBlock>
        {action.targetIds !== undefined ? (
          <ColumnViewerBlock title="объекты">
            <ColumnViewerChipsBlock
              emptyText={'нет'}
              items={(action.targetIds ?? []).map((targetId, index) => {
                const targetForActiveMode = prepareTargetForAction(
                  targetId,
                  action.type,
                  action.targetStrIds![index],
                  'ACTIVE'
                )
                return {
                  text: targetForActiveMode.text,
                  href: `/${targetForActiveMode.href}`
                }
              })}
            />
          </ColumnViewerBlock>
        ) : null}
        {action.targetIds !== undefined ? (
          <ColumnViewerBlock title="история объектов">
            <ColumnViewerChipsBlock
              emptyText={'нет'}
              items={(action.targetIds ?? []).map((targetId, index) => {
                const targetForActiveMode = prepareTargetForAction(
                  targetId,
                  action.type,
                  action.targetStrIds![index],
                  'HISTORY',
                  true
                )
                return {
                  text: targetForActiveMode.text,
                  href: `/history/${targetForActiveMode.href}`
                }
              })}
            />
          </ColumnViewerBlock>
        ) : null}
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
