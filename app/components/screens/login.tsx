// Project
import type { LoginSuccessResultDto } from '@common/dtos/server-api/auth.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { LoginForm } from '../forms/login'
import { ScreenCard } from '../cards/screen-card'
import { ScreenContainer } from '../containers/screen-container'

export interface LoginScreenProps {
  onSuccessLogin?: (
    loginResult: Pick<
      DtoWithoutEnums<LoginSuccessResultDto>,
      'userId' | 'rights'
    >
  ) => void
}

export function LoginScreen(props: LoginScreenProps) {
  return (
    <ScreenContainer>
      <ScreenCard>
        <LoginForm onSuccessLogin={props.onSuccessLogin} />
      </ScreenCard>
    </ScreenContainer>
  )
}
