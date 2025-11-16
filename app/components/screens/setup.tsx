// Project
import type { SetupSuccessResultDto } from '@common/dtos/server-api/common.dto'
import { SetupForm } from '../forms/setup'
import { ScreenCard } from '../cards/screen-card'
import { ScreenContainer } from '../containers/screen-container'

export interface SetupScreenProps {
  onSuccessSetup?: (setupResult: SetupSuccessResultDto) => void
}

export function SetupScreen(props: SetupScreenProps) {
  return (
    <ScreenContainer>
      <ScreenCard>
        <SetupForm onSuccessSetup={props.onSuccessSetup} />
      </ScreenCard>
    </ScreenContainer>
  )
}
