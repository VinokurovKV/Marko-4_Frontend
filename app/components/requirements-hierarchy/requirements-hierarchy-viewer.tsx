// Project
import type { RequirementsHierarchy, TestPrimary } from '~/types'
// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
// other
import AcyclicGraphViewer from './acyclic-graph-viewer'
import type { VertexData } from './acyclic-graph-vertex-viewer'

import {
  buildRequirementsHierarchyGraphData,
  type RequirementVertexData
} from './requirements'

export interface RequirementsHierarchyAcyclicViewerProps {
  requirementsHierarchy: RequirementsHierarchy
  tests: TestPrimary[] | null
}

type VertexDataWithLevel = VertexData & { level: number }

function toVertexData(
  d: RequirementVertexData,
  testCodeForId: Map<number, string>
): VertexData {
  const base: VertexDataWithLevel = {
    code: d.code,
    atomicityFlag: d.atomicityFlag,
    atomicityCoef: d.atomicityCoef,
    modifier: d.modifier,
    origin: '',
    fullCoverageFraction: d.fullCoverageFraction,
    onlyMustCoverageFraction: d.onlyMustCoverageFraction,
    mustAndShouldCoverageFraction: d.mustAndShouldCoverageFraction,
    onlyShouldCoverageFraction: d.onlyShouldCoverageFraction,
    onlyMayCoverageFraction: d.onlyMayCoverageFraction,
    test:
      d.atomicityFlag && d.testId !== null
        ? (testCodeForId.get(d.testId) ?? '')
        : '',
    level: d.level
  }

  return base as VertexData
}

function buildVertexDataMap(
  src: Map<number, RequirementVertexData>,
  testCodeForId: Map<number, string>
): Map<number, VertexData> {
  const out = new Map<number, VertexData>()
  for (const [id, d] of src.entries()) {
    out.set(id, toVertexData(d, testCodeForId))
  }
  return out
}

export function RequirementsHierarchyAcyclicViewer({
  requirementsHierarchy,
  tests
}: RequirementsHierarchyAcyclicViewerProps) {
  const fullscreenContainerRef = React.useRef<HTMLDivElement | null>(null)
  const theme = useTheme()

  const [
    maxDisplayedLayerWhenWithoutSelected,
    setMaxDisplayedLayerWhenWithoutSelected
  ] = React.useState<number | null>(1)

  const [selectedId, setSelectedId] = React.useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  const toggleFullscreen = React.useCallback(() => {
    const container = fullscreenContainerRef.current
    if (container === null) return

    void (async () => {
      if (globalThis.document.fullscreenElement === container) {
        await globalThis.document.exitFullscreen()
      } else {
        await container.requestFullscreen()
      }
    })()
  }, [])

  const { vertexes, dataForVertexId } = React.useMemo(
    () => buildRequirementsHierarchyGraphData(requirementsHierarchy),
    [requirementsHierarchy]
  )
  const testCodeForId = React.useMemo(
    () => new Map((tests ?? []).map((test) => [test.id, test.code])),
    [tests]
  )

  const dataForVertexIdAsVertexData = React.useMemo(
    () => buildVertexDataMap(dataForVertexId, testCodeForId),
    [dataForVertexId, testCodeForId]
  )

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        globalThis.document.fullscreenElement === fullscreenContainerRef.current
      )
    }

    handleFullscreenChange()
    globalThis.document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    )

    return () => {
      globalThis.document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      )
    }
  }, [])

  return (
    <Stack
      ref={fullscreenContainerRef}
      spacing={1}
      p={0}
      sx={{ height: '100%' }}
    >
      <Stack
        spacing={1}
        border={`1px solid ${
          theme.palette.mode === 'light'
            ? theme.palette.grey[300]
            : theme.palette.grey.A700
        }`}
        borderRadius="5px"
        p={0}
        sx={{
          height: '100%',
          overflow: 'auto',
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'white'
              : theme.palette.background.default
        }}
      >
        <AcyclicGraphViewer
          vertexes={vertexes}
          dataForVertexId={dataForVertexIdAsVertexData}
          maxDisplayedLayerWhenWithoutSelected={
            maxDisplayedLayerWhenWithoutSelected
          }
          setMaxDisplayedLayerWhenWithoutSelected={
            setMaxDisplayedLayerWhenWithoutSelected
          }
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          fitOnSelectedIdChange={true}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onVertexClick={(vertexId: number) => {}}
        />
      </Stack>
    </Stack>
  )
}
