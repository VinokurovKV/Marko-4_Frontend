// Project
import type {
  TagPrimary,
  DocumentPrimary,
  FragmentPrimary,
  RequirementPrimary,
  RequirementTertiary,
  RequirementsHierarchyVertex,
  TestPrimary
} from '~/types'
import {
  localizationForRequirementModifier,
  localizationForRequirementOrigin
} from '~/localization'
import { RequirementModifierIcon } from '~/components/icons'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerPercent,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React
import * as React from 'react'

export interface RequirementViewerProps {
  tags: TagPrimary[] | null
  documents: DocumentPrimary[] | null
  fragments: FragmentPrimary[] | null
  requirement: RequirementTertiary
  requirementsHierarchyVertex: RequirementsHierarchyVertex
  parentRequirements: RequirementPrimary[] | null
  childRequirements: RequirementPrimary[] | null
  test: TestPrimary | null
}

export function RequirementViewer({
  tags,
  documents,
  fragments,
  requirement,
  requirementsHierarchyVertex: vertex,
  parentRequirements,
  childRequirements,
  test
}: RequirementViewerProps) {
  const documentCodeForId = React.useMemo(
    () =>
      new Map(
        (documents ?? []).map((document) => [document.id, document.code])
      ),
    [documents]
  )
  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Требование', `${requirement.code}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={requirement.code} />
          <ColumnViewerItem field="название" val={requirement.name} />
          <ColumnViewerItem
            field="модификатор"
            val={localizationForRequirementModifier.get(requirement.modifier)}
            Icon={<RequirementModifierIcon modifier={requirement.modifier} />}
          />
          <ColumnViewerItem
            field="происхождение"
            val={localizationForRequirementOrigin.get(requirement.origin)}
          />
          <ColumnViewerItem
            field="атомарный коэффициент"
            val={requirement.rate}
          />
          <ColumnViewerRef
            field="покрывающий тест"
            text={test?.code}
            href={
              requirement.testId !== null
                ? `/hierarchy/tests/${requirement.testId}`
                : undefined
            }
          />
        </ColumnViewerBlock>
        <ColumnViewerBlock
          title={`фрагменты документов${requirement.fragmentsCount > 0 ? ` (${requirement.fragmentsCount})` : ''}`}
        >
          <ColumnViewerChipsBlock
            emptyText={fragments !== null ? 'нет' : '???'}
            items={(fragments ?? []).map((fragment) => {
              const documentCode =
                documentCodeForId.get(fragment.documentId) ?? null
              return {
                text: `${documentCode ?? '???'} - ${fragment.innerCode}`,
                href: `/fragments/${fragment.id}`
              }
            })}
          />
        </ColumnViewerBlock>
        <ColumnViewerBlock
          title={`родительские требования${requirement.parentRequirementsCount > 0 ? ` (${requirement.parentRequirementsCount})` : ''}`}
        >
          <ColumnViewerChipsBlock
            emptyText={parentRequirements !== null ? 'нет' : '???'}
            items={(parentRequirements ?? []).map((requirement) => ({
              text: requirement.code,
              href: `/requirements/${requirement.id}`
            }))}
          />
        </ColumnViewerBlock>
        <ColumnViewerBlock
          title={`дочерние требования${requirement.childRequirementsCount > 0 ? ` (${requirement.childRequirementsCount})` : ''}`}
        >
          <ColumnViewerChipsBlock
            emptyText={childRequirements !== null ? 'нет' : '???'}
            items={(childRequirements ?? []).map((requirement) => ({
              text: requirement.code,
              href: `/requirements/${requirement.id}`
            }))}
          />
        </ColumnViewerBlock>
        <ColumnViewerBlock title="покрытие атомарных требований">
          <ColumnViewerPercent
            field="все"
            fraction={`${vertex.coveredRate.full} / ${vertex.aggregateRate.full}`}
          />
          <ColumnViewerPercent
            field="обязательные"
            fraction={`${vertex.coveredRate.onlyMust} / ${vertex.aggregateRate.onlyMust}`}
          />
          <ColumnViewerPercent
            field="обязательные и рекомендуемые"
            fraction={`${vertex.coveredRate.mustAndShould} / ${vertex.aggregateRate.mustAndShould}`}
          />
          <ColumnViewerPercent
            field="рекомендуемые"
            fraction={`${vertex.coveredRate.onlyShould} / ${vertex.aggregateRate.onlyShould}`}
          />
          <ColumnViewerPercent
            field="необязательные"
            fraction={`${vertex.coveredRate.onlyMay} / ${vertex.aggregateRate.onlyMay}`}
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
            text={requirement.description?.text}
            emptyText="нет"
          />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
