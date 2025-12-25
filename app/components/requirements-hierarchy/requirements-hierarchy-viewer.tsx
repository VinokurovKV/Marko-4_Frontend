// Project
import type { RequirementsHierarchy, TestPrimary } from '~/types'
// import { blurredNodeIndexes } from '../requirements-hierarchy/TechSpec/nodes'
import { initialNodes } from '../requirements-hierarchy/TechSpec/nodes'
import { initialEdges } from '../requirements-hierarchy/TechSpec/edges'
// import { createRequirementNode } from '../requirements-hierarchy/TechSpec/nodes'
// import { createEdge } from '../requirements-hierarchy/TechSpec/edges'
import {
  type TopologyGraphProps,
  TopologyGraph
} from '../requirements-hierarchy/graph'
// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
// import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
// Other
// import capitalize from 'capitalize'

export interface RequirementsHierarchyViewerProps {
  requirementsHierarchy: RequirementsHierarchy
  tests: TestPrimary[] | null
}

export function RequirementsHierarchyViewer({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requirementsHierarchy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tests
}: RequirementsHierarchyViewerProps) {
  const theme = useTheme()

  // const nodes: TopologyGraphProps['initialNodes'] = React.useMemo(() => {
  //   const vertex = requirementsHierarchy.vertexes[0]
  //   return [
  //     createRequirementNode('1', vertex),
  //     createRequirementNode('2', vertex),
  //     createRequirementNode('3', vertex)
  //   ]
  // }, [requirementsHierarchy.vertexes])

  // const nodes: TopologyGraphProps['initialNodes'] = React.useMemo(
  //   () =>
  //     requirementsHierarchy.vertexes.map((vertex) =>
  //       createRequirementNode(`${vertex.id}`, vertex)
  //     ),
  //   [requirementsHierarchy.vertexes]
  // )

  // const edges: TopologyGraphProps['initialEdges'] = React.useMemo(
  //   () => [createEdge('1', '2'), createEdge('1', '3')],
  //   [requirementsHierarchy.links]
  // )

  // const edges: TopologyGraphProps['initialEdges'] = React.useMemo(
  //   () =>
  //     requirementsHierarchy.links.map((link) =>
  //       createEdge(`${link.parentId}`, `${link.childId}`)
  //     ),
  //   [requirementsHierarchy.links]
  // )

  const blurredNodeIndexes: TopologyGraphProps['blurredNodeIndexes'] =
    React.useMemo(() => [], [])

  // console.log(nodes)
  // console.log(edges)

  // console.log(initialNodes)

  return (
    <Stack spacing={1} p={0} sx={{ height: '100%' }}>
      {/* <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize('иерархия', true)}
      </Typography> */}
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
        <TopologyGraph
          blurredNodeIndexes={blurredNodeIndexes}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
        />
      </Stack>
    </Stack>
  )
}
