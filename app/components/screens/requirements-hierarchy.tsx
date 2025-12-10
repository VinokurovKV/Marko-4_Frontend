// Project
import type { ReadRequirementWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
// import { serverConnector } from '~/server-connector'
// import { useNotifier } from '~/providers/notifier'
import { blurredNodeIndexes } from '../requirements-hierarchy/TechSpec/nodes'
import { initialNodes } from '../requirements-hierarchy/TechSpec/nodes'
import { initialEdges } from '../requirements-hierarchy/TechSpec/edges'
import { TopologyGraph } from '../requirements-hierarchy/graph'
// React
// import * as React from 'react'

type Requirement =
  DtoWithoutEnums<ReadRequirementWithUpToTertiaryPropsSuccessResultDto>

export interface RequirementsHierarchyScreenProps {
  initialRequirements: Requirement[]
}

export function RequirementsHierarchyScreen() {
  // props: RequirementsHierarchyScreenProps
  // const notifier = useNotifier()

  // const [requirements, setRequirements] = React.useState<Requirement[]>(
  //   props.initialRequirements
  // )

  // const updateRequirements = React.useCallback(() => {
  //   void (async () => {
  //     try {
  //       const requirementIds = (
  //         await serverConnector.readRequirements({
  //           scope: 'PRIMARY_PROPS'
  //         })
  //       ).map((requirement) => requirement.id)
  //       const requirements = await Promise.all(
  //         requirementIds.map((requirementId) =>
  //           serverConnector.readRequirement(
  //             { id: requirementId },
  //             {
  //               scope: 'UP_TO_TERTIARY_PROPS'
  //             }
  //           )
  //         )
  //       )
  //       setRequirements(requirements)
  //     } catch (error) {
  //       notifier.showError(
  //         error,
  //         'не удалось загрузить актуальный список требований'
  //       )
  //     }
  //   })()
  // }, [setRequirements])

  return (
    <TopologyGraph
      blurredNodeIndexes={blurredNodeIndexes}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    />
  )
}
