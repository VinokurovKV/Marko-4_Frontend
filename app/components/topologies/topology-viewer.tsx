// Project
import type { CommonTopologyConfigDto } from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
// import { ProjButton } from '../buttons/button'
import { TopologyViewerButton } from './topology-viewer-button'
// React
import * as React from 'react'
// Other
import cytoscape from 'cytoscape'
import avsdf from 'cytoscape-avsdf'

/* eslint-disable */

cytoscape.use(avsdf)

type TopologyConfig = DtoWithoutEnums<CommonTopologyConfigDto>

// export interface CommonTopologyConfig {
//   vertexes: {
//     name: string
//     label?: string
//     ifaces: {
//       name: string
//       label?: string
//     }[]
//   }[]
//   links: {
//     start: {
//       vertexName: string
//       ifaceName: string
//     }
//     end: {
//       vertexName: string
//       ifaceName: string
//     }
//   }[]
// }

interface TopologyViewerProps {
  config: TopologyConfig
}

const ELEMENT_SIZES = {
  backgrounds: {
    /*simpleConfig
    'Xinertel': { width: 700, height: 600 },
    'DUT': { width: 500, height: 350 }
    */
    /*topology5Config
    'ANVL (CE-1)': { width: 600, height: 900 },
    'ANVL (P-1)': { width: 1200, height: 1500 }
    */
    simpliestConfig: { width: 0, height: 0 }
  },
  vertexes: {
    /*simpleConfig
    'XinertelWide': { width: 16000, height: 1500 },
    'DUTWide': { width: 8000, height: 1500 }
    */

    /*handmadeConfig //
    'Xinertel': { width: 1600, height: 150 },
    'DUT': { width: 800, height: 150 },
    'Test': { width: 300, height: 220 },
    'Test2': { width: 600, height: 170 },
    'Test3': { width: 400, height: 250 },
    'Test4': { width: 350, height: 200 },
    'Test5': { width: 380, height: 500 }
    */

    /*topology5Config
    'DUT (PE-2)': { width: 400, height: 400 },
    'ANVL (CE-1)': { width: 350, height: 400 },
    'ANVL (P-1)': { width: 350, height: 400 },
    'ANVL (P-2)': { width: 350, height: 400 },
    'ANVL (PE-1)': { width: 350, height: 400 },
    'ANVL (PE-2)': { width: 350, height: 400 }
    */

    /*topology3config
    'DUT (PE-2)': { width: 400, height: 400 },
    'ANVL (CE-1)': { width: 350, height: 400 },
    'ANVL (CE-2)': { width: 350, height: 400 },
    'ANVL (P-1)': { width: 350, height: 400 },
    'ANVL (PE-1)': { width: 350, height: 400 }
    */

    //simpliestConfig
    Xinertel: { width: 1600, height: 150 },
    DUT: { width: 800, height: 150 }
  },
  ifaces: {
    width: 40,
    height: 40
  }
}

function getMaxVertexHeight(): number {
  const heights = Object.values(ELEMENT_SIZES.vertexes).map(
    (vertex) => vertex.height
  )
  return Math.max(...heights)
}

const MAX_VERTEX_HEIGHT = getMaxVertexHeight()

const LAYOUT_CONFIG = {
  spacing: {
    betweenBackgrounds: 200,
    betweenVertexes: MAX_VERTEX_HEIGHT + 300
  },
  alignment: {
    backgrounds: 'top',
    vertexes: 'center'
  }
}

const RENDERING_CONFIG = {
  qualityMultiplier: 2,
  minZoom: 0.1,
  maxZoom: 3.0,
  wheelSensitivity: 0.2
}

function createAVSDFGraph(
  config: TopologyConfig,
  currentPositions: { [key: string]: { x: number; y: number } }
) {
  const elements: cytoscape.ElementDefinition[] = []

  config.vertexes.forEach((vertex) => {
    const vertexPos = currentPositions[vertex.name]
    elements.push({
      data: {
        id: vertex.name,
        label: vertex.name,
        type: 'vertex',
        fixed: true
      },
      position: {
        x: vertexPos.x,
        y: vertexPos.y
      }
    })
  })

  config.vertexes.forEach((vertex) => {
    vertex.ifaces.forEach((iface) => {
      const ifaceId = `${vertex.name}-${iface.name}`
      const currentPos = currentPositions[ifaceId]

      elements.push({
        data: {
          id: ifaceId,
          label: iface.name,
          type: 'iface',
          parent: vertex.name
        },
        position: {
          x: currentPos?.x || 0,
          y: currentPos?.y || 0
        }
      })
    })
  })

  config.links.forEach((link, index) => {
    elements.push({
      data: {
        id: `link-${index}`,
        source: `${link.start.vertexName}-${link.start.ifaceName}`,
        target: `${link.end.vertexName}-${link.end.ifaceName}`
      }
    })
  })

  return elements
}

function findTargetVerticesForIface(
  ifaceId: string,
  config: TopologyConfig
): string[] {
  const targetVertices = new Set<string>()

  config.links.forEach((link) => {
    const sourceIface = `${link.start.vertexName}-${link.start.ifaceName}`
    const targetIface = `${link.end.vertexName}-${link.end.ifaceName}`

    if (sourceIface === ifaceId) {
      targetVertices.add(link.end.vertexName)
    }
    if (targetIface === ifaceId) {
      targetVertices.add(link.start.vertexName)
    }
  })

  return Array.from(targetVertices)
}

function calculateAverageDirection(
  ifaceId: string,
  targetVertices: string[],
  positions: { [key: string]: { x: number; y: number } },
  vertexPos: { x: number; y: number }
): number {
  if (targetVertices.length === 0) {
    return 0
  }

  let sumX = 0
  let sumY = 0

  targetVertices.forEach((vertexName) => {
    const targetPos = positions[vertexName]
    if (targetPos) {
      sumX += targetPos.x - vertexPos.x
      sumY += targetPos.y - vertexPos.y
    }
  })

  const result = Math.atan2(sumY, sumX)

  return result
}

function groupInterfacesByDirection(
  vertex: {
    name: string
    label?: string
    ifaces: Array<{
      name: string
      label?: string
    }>
  },
  config: TopologyConfig,
  originalPositions: { [key: string]: { x: number; y: number } }
) {
  const groups: Map<string, Array<{ ifaceId: string }>> = new Map()
  const vertexPos = originalPositions[vertex.name]

  vertex.ifaces.forEach((iface: { name: string; label?: string }) => {
    const ifaceId = `${vertex.name}-${iface.name}`

    const targetVertices = findTargetVerticesForIface(ifaceId, config)

    if (targetVertices.length === 0) {
      const groupKey = 'unconnected'
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push({ ifaceId })
      return
    }

    const avgDirection = calculateAverageDirection(
      ifaceId,
      targetVertices,
      originalPositions,
      vertexPos
    )
    const quadrant = Math.floor((avgDirection + Math.PI) / (Math.PI / 2)) % 4
    const groupKey = `quadrant_${quadrant}`

    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push({ ifaceId })
  })

  const result = Array.from(groups.values())

  return result
}

function generateZoneSlots(
  vertexPos: { x: number; y: number },
  vertexSize: { width: number; height: number },
  boundary: string,
  slotCount: number
) {
  const slots: { x: number; y: number }[] = []
  const { width, height } = vertexSize
  const { x, y } = vertexPos

  if (boundary === 'top' || boundary === 'bottom') {
    const spacing = width / (slotCount + 1)
    const yPos =
      boundary === 'top'
        ? y - height / 2 + ELEMENT_SIZES.ifaces.height / 4
        : y + height / 2 - ELEMENT_SIZES.ifaces.height / 4

    for (let i = 0; i < slotCount; i++) {
      slots.push({
        x: x - width / 2 + spacing * (i + 1),
        y: yPos
      })
    }
  } else {
    const spacing = height / (slotCount + 1)
    const xPos =
      boundary === 'left'
        ? x - width / 2 + ELEMENT_SIZES.ifaces.width / 4
        : x + width / 2 - ELEMENT_SIZES.ifaces.width / 4

    for (let i = 0; i < slotCount; i++) {
      slots.push({
        x: xPos,
        y: y - height / 2 + spacing * (i + 1)
      })
    }
  }

  return slots
}

function balanceGroups(
  groups: Array<Array<{ ifaceId: string }>>,
  maxGroups: number
): Array<Array<{ ifaceId: string }>> {
  if (groups.length <= maxGroups) {
    return groups
  }

  const sortedGroups = [...groups].sort((a, b) => a.length - b.length)
  const result = sortedGroups.slice(-maxGroups)

  const remainingGroups = sortedGroups.slice(0, -maxGroups)
  remainingGroups.forEach((smallGroup) => {
    if (result[0]) {
      result[0].push(...smallGroup)
    }
  })

  return result
}

function groupInterfacesByNaturalOrder(vertex: {
  name: string
  label?: string
  ifaces: Array<{
    name: string
    label?: string
  }>
}) {
  const group: Array<{ ifaceId: string }> = []

  vertex.ifaces.forEach((iface: { name: string; label?: string }) => {
    const ifaceId = `${vertex.name}-${iface.name}`
    group.push({ ifaceId })
  })

  return [group]
}

function smartBoundaryDistribution(
  avsdfPositions: { [key: string]: { x: number; y: number } },
  config: TopologyConfig,
  originalPositions: { [key: string]: { x: number; y: number } },
  vertexTypes: { [key: string]: string }
): { [key: string]: { x: number; y: number } } {
  const optimizedPositions = { ...originalPositions }

  config.vertexes.forEach((vertex) => {
    const vertexPos = originalPositions[vertex.name]
    const vertexSize =
      ELEMENT_SIZES.vertexes[vertex.name as keyof typeof ELEMENT_SIZES.vertexes]
    if (!vertexPos || !vertexSize) return

    const interfaceGroups = groupInterfacesByNaturalOrder(vertex)

    let availableBoundaries: string[] = []
    if (vertexTypes[vertex.name] === 'top') {
      availableBoundaries = ['bottom']
    } else if (vertexTypes[vertex.name] === 'bottom') {
      availableBoundaries = ['top']
    } else {
      availableBoundaries = ['left', 'right', 'top', 'bottom']
    }

    const finalGroups = balanceGroups(
      interfaceGroups,
      availableBoundaries.length
    )

    finalGroups.forEach((group, groupIndex) => {
      if (groupIndex >= availableBoundaries.length) return

      const boundary = availableBoundaries[groupIndex]
      const zoneSlots = generateZoneSlots(
        vertexPos,
        vertexSize,
        boundary,
        group.length
      )

      group.forEach((iface, index) => {
        if (index < zoneSlots.length) {
          optimizedPositions[iface.ifaceId] = zoneSlots[index]
        }
      })
    })
  })

  return optimizedPositions
}

function optimizeWithAVSDFSmart(
  config: TopologyConfig,
  originalPositions: { [key: string]: { x: number; y: number } },
  vertexTypes: { [key: string]: string }
): { [key: string]: { x: number; y: number } } {
  try {
    const avsdfElements = createAVSDFGraph(config, originalPositions)

    const tempCy = cytoscape({
      elements: avsdfElements,
      headless: true,
      style: []
    })

    const avsdfLayout = tempCy.layout({
      name: 'avsdf',
      animate: false,
      refresh: 1,
      fit: false,
      padding: 100
    } as any)

    avsdfLayout.run()

    const avsdfPositions: { [key: string]: { x: number; y: number } } = {}
    tempCy.nodes().forEach((node) => {
      avsdfPositions[node.id()] = node.position()
    })

    tempCy.destroy()

    const optimizedPositions = smartBoundaryDistribution(
      avsdfPositions,
      config,
      originalPositions,
      vertexTypes
    )

    return optimizedPositions
  } catch (error) {
    console.error('Ошибка AVSDF:', error)
    return originalPositions
  }
}

function topLeftToCenter(
  xLeft: number,
  yTop: number,
  width: number,
  height: number
) {
  const result = {
    x: xLeft + width / 2,
    y: yTop + height / 2
  }

  return result
}

function convertConfig(config: TopologyConfig) {
  const elements: cytoscape.ElementDefinition[] = []

  config.vertexes.forEach((vertex) => {
    elements.push({
      data: {
        id: `background-${vertex.name}`,
        label: vertex.label,
        type: 'background',
        vertexName: vertex.name
      },
      grabbable: false,
      selectable: false
    })
  })

  config.vertexes.forEach((vertex) => {
    elements.push({
      data: {
        id: vertex.name,
        label: vertex.name,
        type: 'vertex',
        ifaces: vertex.ifaces
      },
      grabbable: false,
      selectable: false
    })
  })

  config.vertexes.forEach((vertex) => {
    vertex.ifaces.forEach((iface, index) => {
      elements.push({
        data: {
          id: `${vertex.name}-${iface.name}`,
          label: iface.name,
          type: 'iface',
          vertex: vertex.name,
          positionIndex: index,
          ifaceType: iface.label || 'default'
        }
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

function calculateAllPositions(config: TopologyConfig) {
  const positions: { [key: string]: { x: number; y: number } } = {}

  calculateBackgroundPositions(positions, config)
  calculateVertexPositions(positions, config)
  calculateInterfacePositions(positions, config)

  return positions
}

function calculateBackgroundPositions(
  positions: { [key: string]: { x: number; y: number } },
  config: TopologyConfig
) {
  const backgroundNames = config.vertexes
    .filter((vertex) => vertex.label !== undefined)
    .map((vertex) => vertex.name)
  const totalBackgroundsWidth = backgroundNames.reduce((sum, bgName) => {
    const size = (ELEMENT_SIZES.backgrounds as any)[bgName] || {
      width: 0,
      height: 0
    }
    return sum + (size?.width || 0)
  }, 0)
  const totalWidthWithSpacing =
    totalBackgroundsWidth +
    (backgroundNames.length - 1) * LAYOUT_CONFIG.spacing.betweenBackgrounds
  let currentBackgroundX = -totalWidthWithSpacing / 2
  let referenceY: number = 0

  if (LAYOUT_CONFIG.alignment.backgrounds === 'top') {
    const minTopY = Math.min(
      ...backgroundNames.map((bgName) => {
        const bgSize = (ELEMENT_SIZES.backgrounds as any)[bgName] || {
          width: 0,
          height: 0
        }
        return -bgSize.height / 2
      })
    )
    referenceY = minTopY
  }

  backgroundNames.forEach((bgName) => {
    const bgSize = (ELEMENT_SIZES.backgrounds as any)[bgName] || {
      width: 0,
      height: 0
    }
    if (!bgSize) return
    const bgTopLeftX = currentBackgroundX
    const bgTopLeftY = referenceY
    positions[`background-${bgName}`] = topLeftToCenter(
      bgTopLeftX,
      bgTopLeftY,
      bgSize.width,
      bgSize.height
    )
    currentBackgroundX +=
      bgSize.width + LAYOUT_CONFIG.spacing.betweenBackgrounds
  })
}

function calculateVertexPositions(
  positions: { [key: string]: { x: number; y: number } },
  config: TopologyConfig
) {
  const vertexNames = config.vertexes.map((vertex) => vertex.name)
  const totalVertexes = vertexNames.length

  vertexNames.forEach((vertexName, index) => {
    const vertexSize =
      ELEMENT_SIZES.vertexes[vertexName as keyof typeof ELEMENT_SIZES.vertexes]
    if (!vertexSize) return

    let vertexCenterY: number

    if (totalVertexes === 1) {
      vertexCenterY = 0
    } else if (totalVertexes === 2) {
      vertexCenterY =
        index === 0
          ? -LAYOUT_CONFIG.spacing.betweenVertexes / 2
          : LAYOUT_CONFIG.spacing.betweenVertexes / 2
    } else {
      const startY =
        (-(totalVertexes - 1) * LAYOUT_CONFIG.spacing.betweenVertexes) / 2
      vertexCenterY = startY + index * LAYOUT_CONFIG.spacing.betweenVertexes
    }
    const vertexCenterX = 0

    positions[vertexName] = { x: vertexCenterX, y: vertexCenterY }
  })
}

function calculateInterfacePositions(
  positions: { [key: string]: { x: number; y: number } },
  config: TopologyConfig
) {
  const vertexNames = config.vertexes.map((vertex) => vertex.name)
  const totalVertexes = vertexNames.length

  const sortedVertices = [...config.vertexes].sort((a, b) => {
    const posA = positions[a.name]?.y || 0
    const posB = positions[b.name]?.y || 0
    return posA - posB
  })

  config.vertexes.forEach((vertex) => {
    const vertexPos = positions[vertex.name]
    const vertexSize =
      ELEMENT_SIZES.vertexes[vertex.name as keyof typeof ELEMENT_SIZES.vertexes]

    if (!vertexPos || !vertexSize) return

    const ifaces = vertex.ifaces
    const totalIfaces = ifaces.length

    const vertexIndex = sortedVertices.findIndex((v) => v.name === vertex.name)
    const middleOddVertexIndex =
      totalVertexes % 2 === 1 ? Math.floor(totalVertexes / 2) : -1
    const isTopVertex =
      middleOddVertexIndex !== -1
        ? vertexIndex < middleOddVertexIndex
        : vertexIndex < totalVertexes / 2 - 1
    const isBottomVertex =
      middleOddVertexIndex !== -1
        ? vertexIndex > middleOddVertexIndex
        : vertexIndex > totalVertexes / 2

    const vertexTopLeftX = vertexPos.x - vertexSize.width / 2
    const vertexTopLeftY = vertexPos.y - vertexSize.height / 2

    ifaces.forEach((iface, index) => {
      const ifaceId = `${vertex.name}-${iface.name}`
      const positionIndex = index

      const spacing = vertexSize.width / (totalIfaces + 1)

      let ifaceTopLeftX: number
      let ifaceTopLeftY: number

      if (isTopVertex) {
        ifaceTopLeftX =
          vertexTopLeftX +
          spacing * (positionIndex + 1) -
          ELEMENT_SIZES.ifaces.width / 2
        ifaceTopLeftY =
          vertexTopLeftY + vertexSize.height - ELEMENT_SIZES.ifaces.height / 2
      } else if (isBottomVertex) {
        ifaceTopLeftX =
          vertexTopLeftX +
          spacing * (positionIndex + 1) -
          ELEMENT_SIZES.ifaces.width / 2
        ifaceTopLeftY = vertexTopLeftY - ELEMENT_SIZES.ifaces.height / 2
      } else {
        const isEvenCount = totalIfaces % 2 === 0
        const leftSideCount = isEvenCount
          ? totalIfaces / 2
          : Math.floor(totalIfaces / 2)
        const rightSideCount = totalIfaces - leftSideCount
        const isLeftSide = positionIndex < leftSideCount
        const sideIndex = isLeftSide
          ? positionIndex
          : positionIndex - leftSideCount
        const sideCount = isLeftSide ? leftSideCount : rightSideCount

        const verticalSpacing = ELEMENT_SIZES.ifaces.height * 1.5
        const totalVerticalSpace = (sideCount - 1) * verticalSpacing
        const startY = vertexPos.y - totalVerticalSpace / 2

        ifaceTopLeftY =
          startY + sideIndex * verticalSpacing - ELEMENT_SIZES.ifaces.height / 2

        if (isLeftSide) {
          ifaceTopLeftX = vertexTopLeftX - ELEMENT_SIZES.ifaces.width / 2
        } else {
          ifaceTopLeftX =
            vertexTopLeftX + vertexSize.width - ELEMENT_SIZES.ifaces.width / 2
        }
      }

      positions[ifaceId] = { x: ifaceTopLeftX, y: ifaceTopLeftY }
    })
  })
}

function classifyVertices(
  positions: { [key: string]: { x: number; y: number } },
  config: TopologyConfig
) {
  const vertexTypes: { [key: string]: string } = {}
  const vertexNames = config.vertexes.map((vertex) => vertex.name)
  const totalVertexes = vertexNames.length

  const sortedVertices = [...config.vertexes].sort((a, b) => {
    const posA = positions[a.name]?.y || 0
    const posB = positions[b.name]?.y || 0
    return posA - posB
  })

  sortedVertices.forEach((vertex, index) => {
    if (totalVertexes === 1) {
      vertexTypes[vertex.name] = 'middle'
    } else if (totalVertexes === 2) {
      vertexTypes[vertex.name] = index === 0 ? 'top' : 'bottom'
    } else {
      const middleIndex = Math.floor(totalVertexes / 2)
      if (index < middleIndex) vertexTypes[vertex.name] = 'top'
      else if (index > middleIndex) vertexTypes[vertex.name] = 'bottom'
      else vertexTypes[vertex.name] = 'middle'
    }
  })

  return vertexTypes
}

function createHightQualityCy(
  container: HTMLDivElement,
  elements: any[],
  styles: any[],
  positions: any
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
    textureOnViewport: false,
    hideEdgesOnViewport: false,
    hideLabelsOnViewport: false,
    motionBlur: false,
    wheelSensitivity: RENDERING_CONFIG.wheelSensitivity,
    pixelRatio: qualityRatio
  })

  return cy
}

export function TopologyViewer({ config }: TopologyViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const cyRef = React.useRef<cytoscape.Core | null>(null)

  React.useEffect(() => {
    if (!containerRef.current) return

    const elements = convertConfig(config)
    const originalPositions = calculateAllPositions(config)
    const vertexTypes = classifyVertices(originalPositions, config)

    const optimizedPositions = optimizeWithAVSDFSmart(
      config,
      originalPositions,
      vertexTypes
    )

    const styles: cytoscape.StylesheetStyle[] = [
      {
        selector: 'node[type="background"]',
        style: {
          width: (node: cytoscape.NodeSingular) => {
            const vertexName = node.data('vertexName')
            const width = (ELEMENT_SIZES.backgrounds as any)[vertexName]?.width
            return width && width > 0 ? width : 0
          },
          height: (node: cytoscape.NodeSingular) => {
            const vertexName = node.data('vertexName')
            const height = (ELEMENT_SIZES.backgrounds as any)[vertexName]
              ?.height
            return height && height > 0 ? height : 0
          },
          shape: 'rectangle',
          'background-color': 'lightgrey',
          'border-width': 2,
          'border-style': 'solid',
          'border-color': 'black',
          label: 'data(label)',
          'font-size': '2em',
          'text-valign': 'top',
          'text-margin-y': 50,
          'z-index': 0,
          events: 'no',
          display: (node: cytoscape.NodeSingular) => {
            const vertexName = node.data('vertexName')
            const bgSize = (ELEMENT_SIZES.backgrounds as any)[vertexName]
            return bgSize && bgSize.width > 0 && bgSize.height > 0
              ? 'element'
              : 'none'
          }
        }
      },
      {
        selector: 'node[type="vertex"]',
        style: {
          width: (node: cytoscape.NodeSingular) => {
            return (
              ELEMENT_SIZES.vertexes[
                node.id() as keyof typeof ELEMENT_SIZES.vertexes
              ]?.width || 800
            )
          },
          height: (node: cytoscape.NodeSingular) => {
            return (
              ELEMENT_SIZES.vertexes[
                node.id() as keyof typeof ELEMENT_SIZES.vertexes
              ]?.height || 150
            )
          },
          shape: 'round-rectangle',
          'background-color': 'white',
          'border-width': 2,
          'border-style': 'solid',
          'border-color': 'black',
          color: 'black',
          label: 'data(label)',
          'font-size': '2em',
          'text-valign': 'center',
          'z-index': 1
        }
      },
      {
        selector: 'node[type="iface"]',
        style: {
          width: ELEMENT_SIZES.ifaces.width,
          height: ELEMENT_SIZES.ifaces.height,
          shape: 'ellipse',
          label: 'data(label)',
          'font-size': '2em',
          'background-color': 'green',
          'border-color': 'black',
          'border-style': 'solid',
          'border-width': 2,
          'z-index': 2,
          'text-valign': 'bottom'
        }
      },
      {
        selector: 'node[type="iface"][ifaceType="left"]',
        style: {
          'background-color': 'lightblue'
        }
      },
      {
        selector: 'node[type="iface"][ifaceType="right"]',
        style: {
          'background-color': 'lightcoral'
        }
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': 'midnightblue',
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
      optimizedPositions
    )
    cyRef.current = cy

    cy.on('mouseover', 'node[type="iface"]', function (evt) {
      const node = evt.target
      node.style('background-color', 'darkgreen')
    })

    cy.on('mouseout', 'node[type="iface"]', function (evt) {
      const node = evt.target
      const ifaceType = node.data('ifaceType')

      if (ifaceType === 'left') {
        node.style('background-color', 'lightblue')
      } else if (ifaceType === 'right') {
        node.style('background-color', 'lightcoral')
      } else {
        node.style('background-color', 'green')
      }
    })

    cy.minZoom(RENDERING_CONFIG.minZoom)
    cy.maxZoom(RENDERING_CONFIG.maxZoom)

    cy.reset()
    cy.fit()

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [config])

  const exportPNG = () => {
    if (!cyRef.current) return

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

  return (
    <>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      <TopologyViewerButton
        type="submit"
        dataAction="download-topology"
        imageName="download"
        onClick={exportPNG}
      />
    </>
  )
}

/* eslint-enable */
