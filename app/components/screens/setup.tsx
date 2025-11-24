// Project
import { SetupForm } from '../forms/setup'
import { ScreenCard } from '../cards/screen-card'
import { IsolatedScreenContainer } from '../containers/isolated-screen-container'

export function SetupScreen() {
  return (
    <IsolatedScreenContainer>
      <ScreenCard>
        <SetupForm />
      </ScreenCard>
    </IsolatedScreenContainer>
  )
}
