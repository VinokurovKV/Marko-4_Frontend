// Project
import { SetupForm } from '../forms/setup'
import { ScreenCard } from '../cards/screen-card'
import { ScreenContainer } from '../containers/screen-container'

export function SetupScreen() {
  return (
    <ScreenContainer>
      <ScreenCard>
        <SetupForm />
      </ScreenCard>
    </ScreenContainer>
  )
}
