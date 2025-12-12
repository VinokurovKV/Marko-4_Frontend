// Project
import type { CommonTopologyConfig } from '~/types'
import { TopologyViewerButton } from './topology-viewer-button'
// React
import * as React from 'react'
// Other
import cytoscape from 'cytoscape'
import avsdf from 'cytoscape-avsdf'

/* eslint-disable */

cytoscape.use(avsdf)

const ELEMENT_SIZES = {
  backgrounds: {
    width: 0,
    height: 0
  },
  vertexes: {
    default: { width: 400, height: 200 }
  },
  ifaces: {
    width: 40,
    height: 40
  }
}

const THEME = {
  background: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc'
  },
  vertex: {
    defaultBackgroundColor: '#88b4dc',
    generatorBackgroundColor: '#8d8dcb',
    borderColor: 'black'
  },
  iface: {
    backgroundColor: '#cfe2f3',
    borderColor: 'black'
  }
}

declare global {
  interface Window {
    dynamicVertexSizes?: Record<string, { width: number; height: number }>
  }
}

interface TopologyViewerProps {
  config: CommonTopologyConfig
  vertexNames?: string[]
  showButtons: boolean
}

interface GridCell {
  row: number
  col: number
  occupiedBy?: string
}

interface VertexPlacement {
  vertexName: string
  blockRow: number
  blockCol: number
}

interface LayoutResult {
  placements: VertexPlacement[]
  gridSize: { rows: number; cols: number }
  totalEdgeLength: number
}

interface ConnectivityGraph {
  vertices: string[]
  edges: Array<[string, string]>
  vertexDegrees: Map<string, number>
}

function createGrid(): GridCell[][] {
  const CELL_GRID_SIZE = 22
  const grid: GridCell[][] = []

  for (let row = 0; row < CELL_GRID_SIZE; row++) {
    grid[row] = []
    for (let col = 0; col < CELL_GRID_SIZE; col++) {
      grid[row][col] = {
        row,
        col,
        occupiedBy: undefined
      }
    }
  }

  return grid
}

function blockToCell(blockCoord: number): number {
  return 1 + 3 * blockCoord
}

function isBlockAllowed(
  grid: GridCell[][],
  blockRow: number,
  blockCol: number
): boolean {
  const startRow = blockToCell(blockRow)
  const startCol = blockToCell(blockCol)

  if (startRow + 1 >= grid.length || startCol + 1 >= grid[0].length) {
    return false
  }

  for (let r = startRow; r <= startRow + 1; r++) {
    for (let c = startCol; c <= startCol + 1; c++) {
      if (grid[r][c].occupiedBy) {
        return false
      }
    }
  }

  return true
}

function placeVertex(
  grid: GridCell[][],
  vertexName: string,
  blockRow: number,
  blockCol: number
): void {
  const startRow = blockToCell(blockRow)
  const startCol = blockToCell(blockCol)

  for (let r = startRow; r <= startRow + 1; r++) {
    for (let c = startCol; c <= startCol + 1; c++) {
      grid[r][c].occupiedBy = vertexName
    }
  }
}

function buildConnectivityGraph(
  config: CommonTopologyConfig
): ConnectivityGraph {
  const vertices = config.vertexes.map((v) => v.name)
  const edgesSet = new Set<string>()
  const edgePairs: Array<[string, string]> = []

  config.links.forEach((link) => {
    const pair = [link.start.vertexName, link.end.vertexName].sort()
    const pairKey = `${pair[0]}-${pair[1]}`

    if (!edgesSet.has(pairKey)) {
      edgesSet.add(pairKey)
      edgePairs.push([pair[0], pair[1]])
    }
  })

  const vertexDegrees = new Map<string, number>()
  vertices.forEach((v) => vertexDegrees.set(v, 0))

  edgePairs.forEach(([v1, v2]) => {
    vertexDegrees.set(v1, (vertexDegrees.get(v1) || 0) + 1)
    vertexDegrees.set(v2, (vertexDegrees.get(v2) || 0) + 1)
  })

  return {
    vertices,
    edges: edgePairs,
    vertexDegrees
  }
}

function getAllBlockPositions(): Array<{ blockRow: number; blockCol: number }> {
  const positions = []
  for (let blockRow = 0; blockRow < 7; blockRow++) {
    for (let blockCol = 0; blockCol < 7; blockCol++) {
      positions.push({ blockRow, blockCol })
    }
  }
  return positions
}

function getVertexPosition(
  placements: VertexPlacement[],
  vertexName: string
): { blockRow: number; blockCol: number } | null {
  const placement = placements.find((p) => p.vertexName === vertexName)
  return placement
    ? { blockRow: placement.blockRow, blockCol: placement.blockCol }
    : null
}

function calculateTotalEdgeLength(
  placements: VertexPlacement[],
  graph: ConnectivityGraph
): number {
  let totalLength = 0
  const positionMap = new Map<string, { row: number; col: number }>()
  placements.forEach((p) => {
    positionMap.set(p.vertexName, { row: p.blockRow, col: p.blockCol })
  })

  graph.edges.forEach(([v1, v2]) => {
    const pos1 = positionMap.get(v1)
    const pos2 = positionMap.get(v2)

    if (pos1 && pos2) {
      const rowDiff = pos1.row - pos2.row
      const colDiff = pos1.col - pos2.col
      totalLength += Math.sqrt(rowDiff * rowDiff + colDiff * colDiff)
    }
  })

  return totalLength
}

function deepCopyGrid(grid: GridCell[][]): GridCell[][] {
  return grid.map((row) =>
    row.map((cell) => ({
      row: cell.row,
      col: cell.col,
      occupiedBy: cell.occupiedBy
    }))
  )
}

function getAllPossiblePositions(
  vertex: string,
  placedVertices: string[],
  placements: VertexPlacement[],
  grid: GridCell[][],
  graph: ConnectivityGraph
): Array<{ row: number; col: number }> {
  const allPositions = getAllBlockPositions()
  const possiblePositions: Array<{ row: number; col: number }> = []

  const placedNeighbors = graph.edges
    .filter(
      ([v1, v2]) =>
        (v1 === vertex && placedVertices.includes(v2)) ||
        (v2 === vertex && placedVertices.includes(v1))
    )
    .map(([v1, v2]) => (v1 === vertex ? v2 : v1))

  if (placedNeighbors.length === 0) {
    for (const pos of allPositions) {
      if (isBlockAllowed(grid, pos.blockRow, pos.blockCol)) {
        possiblePositions.push({ row: pos.blockRow, col: pos.blockCol })
      }
    }
  } else {
    const neighborPositions: Array<{ row: number; col: number }> = []
    placedNeighbors.forEach((neighbor) => {
      const pos = getVertexPosition(placements, neighbor)
      if (pos) {
        neighborPositions.push({ row: pos.blockRow, col: pos.blockCol })
      }
    })

    for (const pos of allPositions) {
      if (!isBlockAllowed(grid, pos.blockRow, pos.blockCol)) {
        continue
      }

      let isNearAnyNeighbor = false
      for (const neighborPos of neighborPositions) {
        const rowDiff = Math.abs(pos.blockRow - neighborPos.row)
        const colDiff = Math.abs(pos.blockCol - neighborPos.col)

        if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
          isNearAnyNeighbor = true
          break
        }
      }

      if (isNearAnyNeighbor) {
        possiblePositions.push({ row: pos.blockRow, col: pos.blockCol })
      }
    }
  }

  return possiblePositions
}

function branchPlacement(
  placedVertices: string[],
  currentPlacements: VertexPlacement[],
  remainingVertices: string[],
  grid: GridCell[][],
  graph: ConnectivityGraph,
  bestSoFar: { placements: VertexPlacement[]; totalEdgeLength: number },
  depth: number = 0
): { placements: VertexPlacement[]; totalEdgeLength: number } | null {
  if (remainingVertices.length === 0) {
    const totalEdgeLength = calculateTotalEdgeLength(currentPlacements, graph)

    if (totalEdgeLength < bestSoFar.totalEdgeLength) {
      bestSoFar.placements = [...currentPlacements]
      bestSoFar.totalEdgeLength = totalEdgeLength
      return { placements: [...currentPlacements], totalEdgeLength }
    }
    return null
  }

  const nextVertex = remainingVertices[0]
  const otherVertices = remainingVertices.slice(1)

  const possiblePositions = getAllPossiblePositions(
    nextVertex,
    placedVertices,
    currentPlacements,
    grid,
    graph
  )

  if (possiblePositions.length === 0) {
    return null
  }

  let bestBranchResult: {
    placements: VertexPlacement[]
    totalEdgeLength: number
  } | null = null

  for (let i = 0; i < possiblePositions.length; i++) {
    const position = possiblePositions[i]

    const branchGrid = deepCopyGrid(grid)
    const branchPlacements = [...currentPlacements]

    placeVertex(branchGrid, nextVertex, position.row, position.col)
    branchPlacements.push({
      vertexName: nextVertex,
      blockRow: position.row,
      blockCol: position.col
    })

    const branchResult = branchPlacement(
      [...placedVertices, nextVertex],
      branchPlacements,
      otherVertices,
      branchGrid,
      graph,
      bestSoFar,
      depth + 1
    )

    if (
      branchResult &&
      (!bestBranchResult ||
        branchResult.totalEdgeLength < bestBranchResult.totalEdgeLength)
    ) {
      bestBranchResult = branchResult
    }
  }

  return bestBranchResult
}

function findBestPlacement(graph: ConnectivityGraph): LayoutResult | null {
  const grid = createGrid()

  const sortedVertices = [...graph.vertices].sort((a, b) => {
    const degA = graph.vertexDegrees.get(a) || 0
    const degB = graph.vertexDegrees.get(b) || 0
    if (degB !== degA) return degB - degA
    return a.localeCompare(b)
  })

  const firstVertex = sortedVertices[0]
  const centerBlock = { blockRow: 3, blockCol: 3 }

  if (!isBlockAllowed(grid, centerBlock.blockRow, centerBlock.blockCol)) {
    return null
  }

  placeVertex(grid, firstVertex, centerBlock.blockRow, centerBlock.blockCol)
  const initialPlacements: VertexPlacement[] = [
    {
      vertexName: firstVertex,
      blockRow: centerBlock.blockRow,
      blockCol: centerBlock.blockCol
    }
  ]

  const remainingVertices = sortedVertices.slice(1)

  const initialBestResult = {
    placements: [],
    totalEdgeLength: Infinity
  }

  const bestResult = branchPlacement(
    [firstVertex],
    initialPlacements,
    remainingVertices,
    grid,
    graph,
    initialBestResult,
    1
  )

  if (!bestResult || bestResult.placements.length === 0) {
    return null
  }

  const totalEdgeLength = calculateTotalEdgeLength(bestResult.placements, graph)

  const blockMap = Array(7)
    .fill(0)
    .map(() => Array(7).fill('.'))
  bestResult.placements.forEach((p) => {
    blockMap[p.blockRow][p.blockCol] = p.vertexName.charAt(0)
  })

  return {
    placements: bestResult.placements,
    gridSize: { rows: 7, cols: 7 },
    totalEdgeLength
  }
}

const RENDERING_CONFIG = {
  qualityMultiplier: 2,
  minZoom: 0.1,
  maxZoom: 3.0
}

function convertConfig(config: CommonTopologyConfig) {
  const elements: cytoscape.ElementDefinition[] = []

  config.vertexes.forEach((vertex) => {
    elements.push({
      data: {
        id: vertex.name,
        label: vertex.name,
        type: 'vertex',
        ifaces: vertex.ifaces,
        isGenerator: vertex.isGenerator ? 'true' : 'false'
      },
      grabbable: false,
      selectable: false
    })
  })

  config.vertexes.forEach((vertex) => {
    vertex.ifaces.forEach((iface, index) => {
      const ifaceId = `${vertex.name}-${iface.name}`
      elements.push({
        data: {
          id: ifaceId,
          label: iface.name,
          type: 'iface',
          vertex: vertex.name,
          positionIndex: index,
          ifaceType: iface.label || 'default'
        },
        grabbable: false,
        selectable: false
      })
    })
  })

  config.links.forEach((link, index) => {
    elements.push({
      data: {
        id: `link-${index}`,
        source: `${link.start.vertexName}-${link.start.ifaceName}`,
        target: `${link.end.vertexName}-${link.end.ifaceName}`,
        startIface: link.start.ifaceName,
        endIface: link.end.ifaceName
      }
    })
  })

  return elements
}

function getOptimalInterfaceSide(
  vertexName: string,
  ifaceName: string,
  config: CommonTopologyConfig,
  positions: { [key: string]: { x: number; y: number } }
): 'left' | 'right' | 'top' | 'bottom' {
  const vertex = config.vertexes.find((v) => v.name === vertexName)
  if (!vertex) return 'top'

  const iface = vertex.ifaces.find((i) => i.name === ifaceName)
  if (
    iface?.label &&
    ['left', 'right', 'top', 'bottom'].includes(iface.label)
  ) {
    return iface.label as 'left' | 'right' | 'top' | 'bottom'
  }

  const connectedLinks = config.links.filter(
    (link) =>
      (link.start.vertexName === vertexName &&
        link.start.ifaceName === ifaceName) ||
      (link.end.vertexName === vertexName && link.end.ifaceName === ifaceName)
  )

  if (connectedLinks.length === 0) {
    return 'top'
  }

  const neighborPositions: Array<{ x: number; y: number }> = []

  connectedLinks.forEach((link) => {
    let neighborVertex: string
    if (
      link.start.vertexName === vertexName &&
      link.start.ifaceName === ifaceName
    ) {
      neighborVertex = link.end.vertexName
    } else {
      neighborVertex = link.start.vertexName
    }

    const neighborPos = positions[neighborVertex]
    if (neighborPos) {
      neighborPositions.push(neighborPos)
    }
  })

  if (neighborPositions.length === 0) {
    return 'top'
  }

  const vertexPos = positions[vertexName]
  if (!vertexPos) return 'top'

  let avgDeltaX = 0
  let avgDeltaY = 0

  neighborPositions.forEach((neighborPos) => {
    avgDeltaX += neighborPos.x - vertexPos.x
    avgDeltaY += neighborPos.y - vertexPos.y
  })

  avgDeltaX /= neighborPositions.length
  avgDeltaY /= neighborPositions.length

  const absDeltaX = Math.abs(avgDeltaX)
  const absDeltaY = Math.abs(avgDeltaY)

  if (absDeltaX > absDeltaY) {
    return avgDeltaX > 0 ? 'right' : 'left'
  } else {
    return avgDeltaY > 0 ? 'bottom' : 'top'
  }
}

function calculateVertexSize(
  vertexName: string,
  vertex: CommonTopologyConfig['vertexes'][0],
  positions: { [key: string]: { x: number; y: number } },
  config: CommonTopologyConfig
): { width: number; height: number } {
  const BASE_WIDTH = 400
  const BASE_HEIGHT = 200
  const IFACE_WIDTH = ELEMENT_SIZES.ifaces.width
  const IFACE_HEIGHT = ELEMENT_SIZES.ifaces.height
  const MIN_SPACING = 10

  const interfacesBySide: Record<
    'left' | 'right' | 'top' | 'bottom',
    string[]
  > = {
    left: [],
    right: [],
    top: [],
    bottom: []
  }

  vertex.ifaces.forEach((iface) => {
    const optimalSide = getOptimalInterfaceSide(
      vertexName,
      iface.name,
      config,
      positions
    )
    interfacesBySide[optimalSide].push(iface.name)
  })

  let requiredWidth = BASE_WIDTH
  let requiredHeight = BASE_HEIGHT

  const verticalSides: ('left' | 'right')[] = ['left', 'right']
  verticalSides.forEach((side) => {
    const ifaceCount = interfacesBySide[side].length
    if (ifaceCount > 0) {
      const neededHeight =
        (ifaceCount + 1) * MIN_SPACING + ifaceCount * IFACE_HEIGHT
      if (neededHeight > requiredHeight) {
        requiredHeight = neededHeight
      }
    }
  })

  const horizontalSides: ('top' | 'bottom')[] = ['top', 'bottom']
  horizontalSides.forEach((side) => {
    const ifaceCount = interfacesBySide[side].length
    if (ifaceCount > 0) {
      const neededWidth =
        (ifaceCount + 1) * MIN_SPACING + ifaceCount * IFACE_WIDTH
      if (neededWidth > requiredWidth) {
        requiredWidth = neededWidth
      }
    }
  })

  requiredWidth = Math.ceil(requiredWidth / 50) * 50
  requiredHeight = Math.ceil(requiredHeight / 50) * 50

  requiredWidth = Math.max(requiredWidth, BASE_WIDTH)
  requiredHeight = Math.max(requiredHeight, BASE_HEIGHT)

  return { width: requiredWidth, height: requiredHeight }
}

function calculateAllPositions(config: CommonTopologyConfig) {
  const positions: { [key: string]: { x: number; y: number } } = {}

  const connectivityGraph = buildConnectivityGraph(config)
  const layoutResult = findBestPlacement(connectivityGraph)

  if (!layoutResult) {
    return calculateFallbackPositions(config)
  }

  const BLOCK_TO_PIXEL = 180
  const PADDING = 120

  let minRow = Infinity,
    maxRow = -Infinity
  let minCol = Infinity,
    maxCol = -Infinity

  layoutResult.placements.forEach((placement) => {
    minRow = Math.min(minRow, placement.blockRow)
    maxRow = Math.max(maxRow, placement.blockRow)
    minCol = Math.min(minCol, placement.blockCol)
    maxCol = Math.max(maxCol, placement.blockCol)
  })

  const numRows = maxRow - minRow + 1
  const numCols = maxCol - minCol + 1
  const backgroundWidth = Math.max(
    800,
    (numCols * 3 + 1) * BLOCK_TO_PIXEL + PADDING * 2
  )
  const backgroundHeight = Math.max(
    600,
    (numRows * 3 + 1) * BLOCK_TO_PIXEL + PADDING * 2
  )

  positions['topology-background'] = {
    x: backgroundWidth / 2,
    y: backgroundHeight / 2
  }

  const offsetX = (backgroundWidth - numCols * 3 * BLOCK_TO_PIXEL) / 2
  const offsetY = (backgroundHeight - numRows * 3 * BLOCK_TO_PIXEL) / 2

  layoutResult.placements.forEach((placement) => {
    const vertexName = placement.vertexName
    const relativeRow = placement.blockRow - minRow
    const relativeCol = placement.blockCol - minCol

    const centerX = offsetX + (relativeCol * 3 + 1.5) * BLOCK_TO_PIXEL
    const centerY = offsetY + (relativeRow * 3 + 1.5) * BLOCK_TO_PIXEL

    positions[vertexName] = {
      x: centerX,
      y: centerY
    }
  })

  const vertexSizes: Record<string, { width: number; height: number }> = {}

  layoutResult.placements.forEach((placement) => {
    const vertexName = placement.vertexName
    const vertex = config.vertexes.find((v) => v.name === vertexName)

    if (!vertex) return

    vertexSizes[vertexName] = calculateVertexSize(
      vertexName,
      vertex,
      positions,
      config
    )
  })

  layoutResult.placements.forEach((placement) => {
    const vertexName = placement.vertexName
    const vertex = config.vertexes.find((v) => v.name === vertexName)

    if (!vertex) return

    const centerX = positions[vertexName].x
    const centerY = positions[vertexName].y
    const vertexSize = vertexSizes[vertexName]
    const actualWidth = vertexSize.width
    const actualHeight = vertexSize.height

    const interfacesBySide: Record<
      'left' | 'right' | 'top' | 'bottom',
      Array<{ ifaceId: string; ifaceName: string }>
    > = {
      left: [],
      right: [],
      top: [],
      bottom: []
    }

    vertex.ifaces.forEach((iface) => {
      const ifaceId = `${vertexName}-${iface.name}`
      const optimalSide = getOptimalInterfaceSide(
        vertexName,
        iface.name,
        config,
        positions
      )
      interfacesBySide[optimalSide].push({ ifaceId, ifaceName: iface.name })
    })

    Object.entries(interfacesBySide).forEach(([side, ifaces]) => {
      if (ifaces.length === 0) return

      const sideIfaces = ifaces as Array<{ ifaceId: string; ifaceName: string }>

      switch (side) {
        case 'left':
          const leftSpacing = actualHeight / (sideIfaces.length + 1)
          sideIfaces.forEach((iface, index) => {
            positions[iface.ifaceId] = {
              x: centerX - actualWidth / 2 + ELEMENT_SIZES.ifaces.width / 2,
              y: centerY - actualHeight / 2 + leftSpacing * (index + 1)
            }
          })
          break

        case 'right':
          const rightSpacing = actualHeight / (sideIfaces.length + 1)
          sideIfaces.forEach((iface, index) => {
            positions[iface.ifaceId] = {
              x: centerX + actualWidth / 2 - ELEMENT_SIZES.ifaces.width / 2,
              y: centerY - actualHeight / 2 + rightSpacing * (index + 1)
            }
          })
          break

        case 'top':
          const topSpacing = actualWidth / (sideIfaces.length + 1)
          sideIfaces.forEach((iface, index) => {
            positions[iface.ifaceId] = {
              x: centerX - actualWidth / 2 + topSpacing * (index + 1),
              y: centerY - actualHeight / 2 + ELEMENT_SIZES.ifaces.height / 2
            }
          })
          break

        case 'bottom':
          const bottomSpacing = actualWidth / (sideIfaces.length + 1)
          sideIfaces.forEach((iface, index) => {
            positions[iface.ifaceId] = {
              x: centerX - actualWidth / 2 + bottomSpacing * (index + 1),
              y: centerY + actualHeight / 2 - ELEMENT_SIZES.ifaces.height / 2
            }
          })
          break
      }
    })
  })

  window.dynamicVertexSizes = vertexSizes

  return positions
}

function calculateFallbackPositions(config: CommonTopologyConfig) {
  const positions: { [key: string]: { x: number; y: number } } = {}

  const centerX = 800
  const centerY = 400
  const radius = Math.min(300, 50 * config.vertexes.length)

  config.vertexes.forEach((vertex, index) => {
    const angle = (index / config.vertexes.length) * 2 * Math.PI
    positions[vertex.name] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    }

    vertex.ifaces.forEach((iface, ifaceIndex) => {
      const ifaceId = `${vertex.name}-${iface.name}`
      const ifaceAngle = (ifaceIndex / vertex.ifaces.length) * 2 * Math.PI
      const ifaceRadius = 60
      positions[ifaceId] = {
        x: positions[vertex.name].x + Math.cos(ifaceAngle) * ifaceRadius,
        y: positions[vertex.name].y + Math.sin(ifaceAngle) * ifaceRadius
      }
    })
  })

  positions['topology-background'] = { x: centerX, y: centerY }

  return positions
}

function createHightQualityCy(
  container: HTMLDivElement,
  elements: any[],
  styles: any[],
  positions: any,
  interactiveFlag: boolean
) {
  const pixelRatio = window.devicePixelRatio || 1
  const qualityRatio = Math.min(
    pixelRatio * RENDERING_CONFIG.qualityMultiplier,
    3
  )

  const cy = cytoscape({
    container: container,
    elements: elements,
    style: styles,
    layout: {
      name: 'preset',
      positions: (node: cytoscape.NodeSingular) => {
        const position = positions[node.id()] || { x: 0, y: 0 }
        return position
      }
    } as any,

    userPanningEnabled: interactiveFlag,
    userZoomingEnabled: interactiveFlag,
    boxSelectionEnabled: interactiveFlag,

    textureOnViewport: false,
    hideEdgesOnViewport: false,
    hideLabelsOnViewport: false,
    motionBlur: false,
    pixelRatio: qualityRatio
  })

  if (!interactiveFlag) {
    cy.nodes().ungrabify()
    cy.nodes().unselectify()
    cy.edges().unselectify()
  }

  return cy
}

export function TopologyViewer({
  config,
  vertexNames,
  showButtons
}: TopologyViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const cyRef = React.useRef<cytoscape.Core | null>(null)
  const [interactive, setInteractive] = React.useState(false)

  React.useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const elements = convertConfig(config)
    const positions = calculateAllPositions(config)

    const styles: cytoscape.StylesheetStyle[] = [
      {
        selector: 'node[type="background"]',
        style: {
          width: 1600,
          height: 800,
          shape: 'rectangle',
          'background-color': THEME.background.backgroundColor,
          'border-width': 2,
          'border-style': 'solid',
          'border-color': THEME.background.borderColor,
          label: 'data(label)',
          'font-size': '24px',
          'text-valign': 'top',
          'text-margin-y': 20,
          'z-index': 0,
          events: 'no'
        }
      },
      {
        selector: 'node[type="vertex"]',
        style: {
          width: (node: cytoscape.NodeSingular) => {
            const dynamicSize = (window as any).dynamicVertexSizes?.[node.id()]
            return dynamicSize?.width || 400
          },
          height: (node: cytoscape.NodeSingular) => {
            const dynamicSize = (window as any).dynamicVertexSizes?.[node.id()]
            return dynamicSize?.height || 200
          },
          shape: 'round-rectangle',
          'background-color': THEME.vertex.defaultBackgroundColor,
          'border-width': 2,
          'border-style': 'solid',
          'border-color': THEME.vertex.borderColor,
          color: 'black',
          label: 'data(label)',
          'font-size': '24px',
          'text-valign': 'center',
          'z-index': 1
        }
      },
      {
        selector: 'node[type="vertex"][isGenerator="true"]',
        style: {
          'background-color': THEME.vertex.generatorBackgroundColor
        }
      },
      {
        selector: 'node[type="iface"]',
        style: {
          width: ELEMENT_SIZES.ifaces.width,
          height: ELEMENT_SIZES.ifaces.height,
          shape: 'ellipse',
          label: 'data(label)',
          'font-size': '12px',
          'background-color': THEME.iface.backgroundColor,
          'border-color': THEME.iface.borderColor,
          'border-style': 'solid',
          'border-width': 1,
          'z-index': 2,
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'ellipsis',
          'text-max-width': '40px'
        }
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': 'black',
          'z-index': 3,
          'z-compound-depth': 'top',
          'curve-style': 'bezier'
        }
      }
    ]

    const cy = createHightQualityCy(
      containerRef.current,
      elements,
      styles,
      positions,
      interactive
    )
    cyRef.current = cy

    if (interactive) {
      cy.on('mouseover', 'node[type="iface"]', function (evt) {
        const node = evt.target
        node.style('background-color', '#b1c3d3')
      })

      cy.on('mouseout', 'node[type="iface"]', function (evt) {
        const node = evt.target
        node.style('background-color', '#cfe2f3')
      })
    }

    cy.minZoom(RENDERING_CONFIG.minZoom)
    cy.maxZoom(RENDERING_CONFIG.maxZoom)

    cy.reset()
    cy.fit()

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [config, interactive])

  const exportPNG = () => {
    if (!cyRef.current) {
      return
    }

    const pngData = cyRef.current.png({
      full: true,
      bg: 'white',
      scale: 2,
      maxWidth: 5000,
      maxHeight: 5000
    })
    const link = document.createElement('a')
    link.download = 'topology.png'
    link.href = pngData
    link.click()
  }

  const toggleInteractive = () => {
    setInteractive(!interactive)
  }

  return (
    <>
      <div
        ref={containerRef}
        style={{
          // width: '80vw',
          // height: '80vh',
          width: '100%',
          height: '100%',
          margin: 'auto',
          display: 'flex',
          alignContent: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          border: '2px solid #333'
        }}
      />
      {showButtons && (
        <div
          className="button-container"
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '10px',
            width: 'fit-content',
            height: 'fit-content',
            border: 'none'
          }}
        >
          <TopologyViewerButton
            type="button"
            dataAction="download-topology"
            imageName="download"
            onClick={exportPNG}
          />
          <TopologyViewerButton
            type="button"
            dataAction="toggle-interactive"
            imageName={interactive ? 'lock' : 'lock_open'}
            onClick={toggleInteractive}
          />
        </div>
      )}
    </>
  )
}

/* eslint-enable */
