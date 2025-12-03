// Material UI
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import type { OverridableComponent } from '@mui/material/OverridableComponent'
import type { SvgIconTypeMap } from '@mui/material/SvgIcon'
import Tooltip from '@mui/material/Tooltip'
// Other
import capitalize from 'capitalize'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Icon = OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
  muiName: string
}

export interface FormBlockProps {
  title?: string
  children: React.ReactNode
  buttons?: {
    id: number
    Icon: Icon
    prompt?: string
    onClick: (id: number) => void
  }[]
}

export function FormBlock(props: FormBlockProps) {
  return (
    <>
      {props.title || (props.buttons ?? []).length > 0 ? (
        <Divider>
          {props.title ? capitalize(props.title, true) : null}
          {(props.buttons ?? []).map((button, buttonIndex) => (
            <Tooltip
              key={buttonIndex}
              title={
                button.prompt ? capitalize(button.prompt, true) : undefined
              }
            >
              <IconButton
                size="small"
                tabIndex={-1}
                onClick={() => {
                  button.onClick(button.id)
                }}
              >
                <button.Icon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          ))}
        </Divider>
      ) : (
        <Divider />
      )}

      {props.children}
    </>
  )
}
