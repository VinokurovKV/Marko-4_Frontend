// Project
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  useRequirement,
  useDocumentsFiltered,
  useFragmentsFiltered
} from '~/hooks/resources'
import { HorizontalTwoPartsContainer } from '../containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerRef,
  ColumnViewerText
} from '~/components/single-viewers/common'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

const PREVIEW_WIDTH = 750
const PREVIEW_MAX_HEIGHT = 400

const FRAGMENT_SCREENSHOT_LOADER_DELAY_MS = 250

interface RequirementHoverPreviewProps {
  requirementId: number
  active: boolean
  text?: string
  onReadyChange?: (ready: boolean) => void
}

export function RequirementHoverPreview({
  requirementId,
  active,
  text,
  onReadyChange
}: RequirementHoverPreviewProps) {
  const notifier = useNotifier()

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

  const requirement = useRequirement(
    'UP_TO_TERTIARY_PROPS',
    requirementId,
    false,
    active
  )

  const fragments = useFragmentsFiltered(
    'PRIMARY_PROPS',
    requirement?.fragmentIds ?? null,
    false,
    active && requirement !== null
  )

  const fragmentForId = React.useMemo(
    () => new Map((fragments ?? []).map((fragment) => [fragment.id, fragment])),
    [fragments]
  )

  const documentIds = React.useMemo(
    () =>
      fragments !== null
        ? Array.from(new Set(fragments.map((fragment) => fragment.documentId)))
        : null,
    [fragments]
  )

  const documents = useDocumentsFiltered(
    'PRIMARY_PROPS',
    documentIds,
    false,
    active && documentIds !== null
  )

  const documentCodeForId = React.useMemo(
    () =>
      new Map(
        (documents ?? []).map((document) => [document.id, document.code])
      ),
    [documents]
  )

  const title = React.useMemo(
    () => capitalize(requirement?.code ?? text ?? 'требование', true),
    [requirement, text]
  )
  const ready = requirement !== null && fragments !== null

  React.useEffect(() => {
    onReadyChange?.(ready)
  }, [onReadyChange, ready])

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

  const withLongDescription = React.useMemo(
    () =>
      !!(
        requirement?.description &&
        requirement.description.text.split('\n').length > 10
      ),
    [requirement]
  )

  const withLongHeight = React.useMemo(
    () => selectedFragment !== null || withLongDescription,
    [selectedFragment, withLongDescription]
  )

  return (
    <Box
      sx={{
        maxHeight: withLongHeight ? undefined : PREVIEW_MAX_HEIGHT,
        height: withLongHeight ? PREVIEW_MAX_HEIGHT : undefined,
        width: PREVIEW_WIDTH,
        p: 1.5,
        fontSize: '12px'
      }}
    >
      <HorizontalTwoPartsContainer
        title={['Требование', title]}
        proportions="EQUAL"
      >
        {requirement !== null && fragments !== null ? (
          <ColumnViewer>
            <ColumnViewerBlock
              title={`фрагменты документов${requirement.fragmentsCount > 0 ? ` (${requirement.fragmentsCount})` : ''}`}
            >
              <ColumnViewerChipsBlock
                emptyText="нет"
                items={fragments.map((fragment) => ({
                  text: `${documentCodeForId.get(fragment.documentId) ?? '???'} - ${fragment.innerCode}`,
                  onClick: () => handleFragmentClick(fragment.id),
                  isActive: selectedFragmentId === fragment.id,
                  disableCapitalize: true
                }))}
              />
            </ColumnViewerBlock>
            <ColumnViewerBlock title="описание">
              <ColumnViewerText
                text={requirement.description?.text}
                emptyText="нет"
              />
            </ColumnViewerBlock>
          </ColumnViewer>
        ) : null}
        <ColumnViewer>
          <ColumnViewerBlock title="фрагмент">
            <Box
              flexDirection="column"
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                p: 1
              }}
            >
              {selectedFragment !== null ? (
                <ColumnViewerRef
                  field="документ"
                  text={
                    documentCodeForId.get(selectedFragment.documentId) ?? '???'
                  }
                  href={
                    selectedFragment.documentId !== null
                      ? `/documents/${selectedFragment.documentId}`
                      : undefined
                  }
                />
              ) : null}
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
      </HorizontalTwoPartsContainer>
    </Box>
  )
}
