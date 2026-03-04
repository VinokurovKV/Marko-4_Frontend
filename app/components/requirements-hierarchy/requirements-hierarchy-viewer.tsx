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
  vertexes,
  dataForVertexId,
  type RequirementVertexData
} from './requirements'

export interface RequirementsHierarchyAcyclicViewerProps {
  requirementsHierarchy: RequirementsHierarchy
  tests: TestPrimary[] | null
}

type VertexDataWithLevel = VertexData & { level: number }

function toVertexData(d: RequirementVertexData): VertexData {
  const base: VertexDataWithLevel = {
    code: d.code,
    atomicityFlag: false,
    atomicityCoef: 0,
    modifier: '',
    origin: '',
    coverage: 0,
    test: '',
    level: d.level
  }

  return base as VertexData
}

function buildVertexDataMap(
  src: Map<number, RequirementVertexData>
): Map<number, VertexData> {
  const out = new Map<number, VertexData>()
  for (const [id, d] of src.entries()) {
    out.set(id, toVertexData(d))
  }
  return out
}

export function RequirementsHierarchyAcyclicViewer({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requirementsHierarchy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tests
}: RequirementsHierarchyAcyclicViewerProps) {
  const theme = useTheme()

  const [
    maxDisplayedLayerWhenWithoutSelected,
    setMaxDisplayedLayerWhenWithoutSelected
  ] = React.useState<number | null>(1)

  const [selectedId, setSelectedId] = React.useState<number | null>(null)

  const dataForVertexIdAsVertexData = React.useMemo(
    () => buildVertexDataMap(dataForVertexId),
    [dataForVertexId]
  )

  return (
    <Stack spacing={1} p={0} sx={{ height: '100%' }}>
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onVertexClick={(vertexId: number) => {}}
        />
      </Stack>
    </Stack>
  )
}
