// Project
import type {
  TagPrimary,
  DocumentPrimary,
  FragmentPrimary,
  RequirementPrimary,
  RequirementTertiary,
  CoveragePrimary
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
  ColumnViewerText
} from '../common'
// React
import * as React from 'react'

export interface RequirementViewerProps {
  tags: TagPrimary[] | null
  documents: DocumentPrimary[] | null
  fragments: FragmentPrimary[] | null
  requirement: RequirementTertiary
  parentRequirements: RequirementPrimary[] | null
  childRequirements: RequirementPrimary[] | null
  coverages: CoveragePrimary[] | null
}

export function RequirementViewer({
  tags,
  documents,
  fragments,
  requirement,
  parentRequirements,
  childRequirements,
  coverages
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
        <ColumnViewerBlock
          title={`покрытия${requirement.coveragesCount > 0 ? ` (${requirement.coveragesCount})` : ''}`}
        >
          <ColumnViewerChipsBlock
            emptyText={coverages !== null ? 'нет' : '???'}
            items={(coverages ?? []).map((coverage) => ({
              text: coverage.code,
              href: `/coverages/${coverage.id}`
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
          <ColumnViewerText
            text={requirement.description?.text}
            emptyText="нет"
          />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
