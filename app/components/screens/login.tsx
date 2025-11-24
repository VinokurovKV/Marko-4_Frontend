// Project
import { LoginForm } from '../forms/login'
import { ScreenCard } from '../cards/screen-card'
import { IsolatedScreenContainer } from '../containers/isolated-screen-container'

export function LoginScreen() {
  return (
    <IsolatedScreenContainer>
      <ScreenCard>
        <LoginForm />
      </ScreenCard>
    </IsolatedScreenContainer>
  )
}
