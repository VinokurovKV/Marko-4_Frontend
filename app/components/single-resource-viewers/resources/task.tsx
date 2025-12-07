// Project
import type { ReadTaskWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/tasks.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

type Task = DtoWithoutEnums<ReadTaskWithUpToTertiaryPropsSuccessResultDto>

export interface TaskViewerProps {
  task: Task
}

export function TaskViewer(props: TaskViewerProps) {
  return JSON.stringify(props.task)
}
