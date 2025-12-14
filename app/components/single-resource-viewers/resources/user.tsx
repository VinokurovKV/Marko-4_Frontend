// Project
import type { RolePrimary, UserTertiary } from '~/types'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'

export interface UserViewerProps {
  role: RolePrimary | null
  user: UserTertiary
}

export function UserViewer({ role, user }: UserViewerProps) {
  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Пользователь', `${user.login}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="логин" val={user.login} />
          <ColumnViewerItem field="фамилия" val={user.surname} />
          <ColumnViewerItem field="имя" val={user.forename} />
          <ColumnViewerItem field="e-mail" val={user.email} />
          <ColumnViewerItem field="телефон" val={user.phone} />
          <ColumnViewerRef
            field="роль"
            text={role?.name ?? '???'}
            href={role !== null ? `/roles/${role.id}` : undefined}
          />
        </ColumnViewerBlock>
      </ColumnViewer>
      <ColumnViewer>
        <ColumnViewerBlock title="описание">
          <ColumnViewerText text={user.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
