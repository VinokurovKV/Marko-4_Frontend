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
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  localizationForRequirementModifier,
  localizationForRequirementOrigin
} from '~/localization'
import { FlagIcon, RequirementModifierIcon } from '~/components/icons'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
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
// Material UI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

const FRAGMENT_SCREENSHOT_LOADER_DELAY_MS = 250

export interface RequirementViewerProps {
  tags: TagPrimary[] | null
  documents: DocumentPrimary[] | null
  fragments: FragmentPrimary[] | null
  requirement: RequirementTertiary
  requirementsHierarchyVertex: RequirementsHierarchyVertex
  parentRequirements: RequirementPrimary[] | null
  childRequirements: RequirementPrimary[] | null
  test: TestPrimary | null
  oneColumn?: boolean
}

export function RequirementViewer({
  tags,
  documents,
  fragments,
  requirement,
  requirementsHierarchyVertex: vertex,
  parentRequirements,
  childRequirements,
  test,
  oneColumn
}: RequirementViewerProps) {
  const notifier = useNotifier()
  const documentCodeForId = React.useMemo(
    () =>
      new Map(
        (documents ?? []).map((document) => [document.id, document.code])
      ),
    [documents]
  )
  const fragmentForId = React.useMemo(
    () => new Map((fragments ?? []).map((fragment) => [fragment.id, fragment])),
    [fragments]
  )
  const [selectedFragmentId, setSelectedFragmentId] = React.useState<
    number | null
  >(null)
  const [selectedFragmentScreenshotUrl, setSelectedFragmentScreenshotUrl] =
    React.useState<string | null>(null)
  const [isFragmentScreenshotLoading, setIsFragmentScreenshotLoading] =
    React.useState(false)
  const [showFragmentScreenshotLoader, setShowFragmentScreenshotLoader] =
    React.useState(false)
  const screenshotRequestSeqRef = React.useRef(0)

  React.useEffect(() => {
    if (!isFragmentScreenshotLoading) {
      setShowFragmentScreenshotLoader(false)
      return
    }
    const timer = setTimeout(() => {
      setShowFragmentScreenshotLoader(true)
    }, FRAGMENT_SCREENSHOT_LOADER_DELAY_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [isFragmentScreenshotLoading])

  React.useEffect(() => {
    return () => {
      if (selectedFragmentScreenshotUrl !== null) {
        URL.revokeObjectURL(selectedFragmentScreenshotUrl)
      }
    }
  }, [selectedFragmentScreenshotUrl])

  const handleFragmentClick = React.useCallback(
    (fragmentId: number) => {
      if (selectedFragmentId === fragmentId) {
        screenshotRequestSeqRef.current += 1
        setSelectedFragmentId(null)
        setIsFragmentScreenshotLoading(false)
        setSelectedFragmentScreenshotUrl((oldUrl) => {
          if (oldUrl !== null) {
            URL.revokeObjectURL(oldUrl)
          }
          return null
        })
        return
      }

      const fragment = fragmentForId.get(fragmentId)
      if (fragment === undefined) {
        return
      }
      screenshotRequestSeqRef.current += 1
      const requestSeq = screenshotRequestSeqRef.current

      setSelectedFragmentId(fragmentId)
      setIsFragmentScreenshotLoading(true)

      void (async () => {
        try {
          const blob = await serverConnector.readFragmentConfig({
            id: fragmentId
          })
          const screenshotUrl = URL.createObjectURL(blob)
          if (screenshotRequestSeqRef.current !== requestSeq) {
            URL.revokeObjectURL(screenshotUrl)
            return
          }

          setSelectedFragmentScreenshotUrl((oldUrl) => {
            if (oldUrl !== null) {
              URL.revokeObjectURL(oldUrl)
            }
            return screenshotUrl
          })
        } catch (error) {
          if (screenshotRequestSeqRef.current !== requestSeq) {
            return
          }
          notifier.showError(
            error,
            `не удалось загрузить скриншот фрагмента «${fragment.innerCode}»`
          )
          setSelectedFragmentScreenshotUrl((oldUrl) => {
            if (oldUrl !== null) {
              URL.revokeObjectURL(oldUrl)
            }
            return null
          })
        } finally {
          if (screenshotRequestSeqRef.current === requestSeq) {
            setIsFragmentScreenshotLoading(false)
          }
        }
      })()
    },
    [fragmentForId, notifier, selectedFragmentId]
  )

  const selectedFragment =
    selectedFragmentId !== null
      ? (fragmentForId.get(selectedFragmentId) ?? null)
      : null
  const hasReadyFragmentScreenshot = selectedFragmentScreenshotUrl !== null

  return (
    <HorizontalTwoPartsContainer
      proportions={oneColumn ? 'ONE_ZERO' : 'EQUAL'}
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
            field="атомарное"
            Icon={<FlagIcon flag={vertex.atomic} />}
          />
          <ColumnViewerItem
            field="атомарный коэффициент"
            val={requirement.rate}
            semiTransparent={vertex.atomic === false}
          />
          <ColumnViewerRef
            field="покрывающий тест"
            text={test?.code}
            href={
              requirement.testId !== null
                ? `/hierarchy/tests/${requirement.testId}`
                : undefined
            }
            semiTransparent={vertex.atomic === false}
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
                onClick: () => handleFragmentClick(fragment.id),
                isActive: selectedFragmentId === fragment.id,
                disableCapitalize: true
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
        {oneColumn ? (
          <ColumnViewerBlock title="описание">
            <ColumnViewerText
              text={requirement.description?.text}
              emptyText="нет"
            />
          </ColumnViewerBlock>
        ) : null}
      </ColumnViewer>
      {oneColumn ? null : (
        <VerticalTwoPartsContainer
          proportions={hasReadyFragmentScreenshot ? '50_50' : '100_0'}
        >
          <ColumnViewer>
            <ColumnViewerBlock title="описание">
              <ColumnViewerText
                text={requirement.description?.text}
                emptyText="нет"
              />
            </ColumnViewerBlock>
          </ColumnViewer>
          <ColumnViewer>
            <ColumnViewerBlock title="скриншот фрагмента">
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  p: 1
                }}
              >
                {selectedFragmentScreenshotUrl !== null ? (
                  <Box
                    component="img"
                    src={selectedFragmentScreenshotUrl}
                    alt={
                      selectedFragment !== null
                        ? `Скриншот фрагмента ${selectedFragment.innerCode}`
                        : 'Скриншот фрагмента'
                    }
                    sx={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: 1
                    }}
                  />
                ) : (
                  <Typography textAlign="center" variant="body2">
                    выберите фрагмент слева
                  </Typography>
                )}
                {isFragmentScreenshotLoading && showFragmentScreenshotLoader ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : null}
              </Box>
            </ColumnViewerBlock>
          </ColumnViewer>
        </VerticalTwoPartsContainer>
      )}
    </HorizontalTwoPartsContainer>
  )
}
