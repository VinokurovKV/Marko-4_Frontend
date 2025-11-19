// Project
import { LoginForm } from '../forms/login'
import { ScreenCard } from '../cards/screen-card'
import { ScreenContainer } from '../containers/screen-container'

export function LoginScreen() {
  return (
    <ScreenContainer>
      <ScreenCard>
        <LoginForm />
      </ScreenCard>
    </ScreenContainer>
  )
}
