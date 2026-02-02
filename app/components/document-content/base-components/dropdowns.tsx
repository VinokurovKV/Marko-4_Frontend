import Button from './button'

interface DropdownActionsProps {
  onShowChangeFormClick: () => void
  onDeleteClick: () => void
}

interface DropdownRolesProps {
  className: string
  selectedRole: string
  onRoleChange: (role: string) => void
}

export default function DropdownActions({
  onShowChangeFormClick,
  onDeleteClick
}: DropdownActionsProps) {
  return (
    <div className="dropdown">
      <Button type="button" className="dropdown-button" imageName="dehaze" />
      <div className="dropdown-content">
        <Button
          type="button"
          text="Изменить"
          dataAction="show-change-form"
          onClick={onShowChangeFormClick}
        />
        <Button
          type="button"
          text="Удалить"
          dataAction="delete"
          onClick={onDeleteClick}
        />
      </div>
    </div>
  )
}

const rolesInTable = [
  'администратор',
  'редактор тестов',
  'тестировщик',
  'наблюдатель'
]

const rolesInForm = [
  'Не выбрана',
  'Администратор',
  'Редактор тестов',
  'Тестировщик',
  'Наблюдатель'
]

const getRoleInFormFormat = (role: string): string => {
  const length = rolesInTable.length
  for (let i = 0; i < length; i++) {
    if (role === rolesInTable[i]) return rolesInForm[i + 1]
  }
  return rolesInForm[0]
}

const getRoleInTableFormat = (role: string): string => {
  for (let i = 1; i < rolesInForm.length; i++) {
    if (role === rolesInForm[i]) return rolesInTable[i - 1]
  }
  return ''
}

export function DropdownRoles({
  className,
  selectedRole,
  onRoleChange
}: DropdownRolesProps) {
  const formRole = getRoleInFormFormat(selectedRole)
  const isError = formRole === 'Не выбрана'
  const handleRoleChange = (role: string) => {
    onRoleChange(getRoleInTableFormat(role))
  }
  return (
    <div
      className={`field-container ${className || ''} ${isError ? 'error' : ''}`}
    >
      <label>Роль</label>
      <div className="dropdown-selector">
        <Button
          type="button"
          text={formRole}
          imageName="keyboard_arrow_down"
          dataAction="selector-reveal"
        />
        <div className="dropdown-selector-content">
          {rolesInForm.map((role, index) => (
            <Button
              key={index}
              type="button"
              text={role}
              imageName={formRole === role ? 'done' : ''}
              onClick={() => handleRoleChange(role)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
