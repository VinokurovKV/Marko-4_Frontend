// Project
import type {
  TagPrimary,
  RequirementPrimary,
  CoverageTertiary,
  TestPrimary
} from '~/types'
import { localizationForCoverageType } from '~/localization'
import { CoverageTypeIcon } from '~/components/icons/coverage-type'
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

export interface CoverageViewerProps {
  tags: TagPrimary[] | null
  requirement: RequirementPrimary | null
  coverage: CoverageTertiary
  tests: TestPrimary[] | null
}

export function CoverageViewer({
  tags,
  requirement,
  coverage,
  tests
}: CoverageViewerProps) {
  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Покрытие', `${coverage.code}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={coverage.code} />
          <ColumnViewerItem field="название" val={coverage.name} />
          <ColumnViewerRef
            field="требование"
            text={requirement?.code ?? '???'}
            href={`/requirements/${coverage.requirementId}`}
          />
          <ColumnViewerItem
            field="тип"
            val={localizationForCoverageType.get(coverage.type)}
            Icon={<CoverageTypeIcon type={coverage.type} />}
          />
          <ColumnViewerPercent
            field="процент покрытия"
            percent={coverage.coveragePercent}
          />
        </ColumnViewerBlock>
        <ColumnViewerBlock
          title={`тесты${coverage.testsCount > 0 ? ` (${coverage.testsCount})` : ''}`}
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
      </ColumnViewer>
      <ColumnViewer>
        <ColumnViewerBlock title="описание">
          <ColumnViewerText text={coverage.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
