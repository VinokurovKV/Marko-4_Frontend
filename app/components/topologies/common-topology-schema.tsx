// Project
import { useCommonTopology } from '~/hooks/resources'
import { TopologyConfigSchema } from './topology-config-schema'
// React
import * as React from 'react'

export interface CommonTopologySchemaProps {
  commonTopologyId: number | null
}

export function CommonTopologySchema({
  commonTopologyId
}: CommonTopologySchemaProps) {
  const commonTopology = useCommonTopology(
    'UP_TO_TERTIARY_PROPS',
    commonTopologyId,
    true
  )

  const commonTopologyConfig = React.useMemo(() => {
    return commonTopology?.config ?? null
  }, [commonTopology])

  return (
    <TopologyConfigSchema
      config={commonTopologyConfig}
      nullConfigTitle="схема общей топологии"
    />
  )
}
