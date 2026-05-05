// Project
import type { VersionedResourceType } from '@common/enums'
import { versionResourceTypeToPlural } from '@common/enums'
import type { Transition } from '~/types'
import {
  localizationForTransitionType,
  localizationForVersionedResourceType
} from '~/localization'
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
import capitalize from 'capitalize'
import * as changeCase from 'change-case'
import JSONPretty from 'react-json-pretty'
// import 'react-json-pretty/themes/monikai.css'

export interface TransitionViewerProps {
  resourceType: VersionedResourceType
  resourceId: number
  transitionNum: number
  transition: Transition
  version?: any
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export function TransitionViewer({
  resourceType,
  resourceId,
  transitionNum,
  transition,
  version
}: TransitionViewerProps) {
  return (
    <VerticalTwoPartsContainer
      proportions="needed_rest"
      title={[
        capitalize(localizationForVersionedResourceType.get(resourceType)!),
        `${resourceId}/${transitionNum}`
      ]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem
            field="время перехода"
            val={formatDateTime(transition.time)}
          />
          <ColumnViewerItem
            field="тип перехода"
            val={localizationForTransitionType.get(transition.transitionType)}
          />
          <ColumnViewerRef
            field="действие"
            text={`[ID:${transition.actionId}]`}
            href={`/actions/${transition.actionId}`}
          />
          <ColumnViewerRef
            field="активный объект"
            text="ПЕРЕЙТИ"
            href={`/${changeCase.kebabCase(versionResourceTypeToPlural[resourceType])}/${resourceId}`}
          />
        </ColumnViewerBlock>
      </ColumnViewer>
      <HorizontalTwoPartsContainer proportions="EQUAL">
        <ColumnViewer>
          <ColumnViewerBlock title="переход">
            <JSONPretty
              id="transition"
              data={transition.transition}
            ></JSONPretty>
          </ColumnViewerBlock>
        </ColumnViewer>
        <ColumnViewer>
          <ColumnViewerBlock title="новая версия">
            <JSONPretty id="version" data={version}></JSONPretty>
          </ColumnViewerBlock>
        </ColumnViewer>
      </HorizontalTwoPartsContainer>
    </VerticalTwoPartsContainer>
  )
}

/* eslint-enable */
