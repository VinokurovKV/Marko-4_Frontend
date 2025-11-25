// React router
import { Link } from 'react-router'
// Material UI
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { styled } from '@mui/material/styles'
import MuiLink from '@mui/material/Link'
import type { OverridableComponent } from '@mui/material/OverridableComponent'
import Typography from '@mui/material/Typography'
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs'
import type { SvgIconTypeMap } from '@mui/material/SvgIcon'
// Other
import capitalize from 'capitalize'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Icon = OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
  muiName: string
}

export interface ProjBreadcrumbsProps {
  items: {
    title: string
    href?: string
    Icon?: Icon
  }[]
}

const BreadcrumbsStyled = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    margin: 0,
    transform: 'translate(-4px, 2px)'
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center'
  }
}))

export function ProjBreadcrumbs(props: ProjBreadcrumbsProps) {
  return (
    <BreadcrumbsStyled
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ m: 0 }}
    >
      <Typography sx={{ color: 'text.primary' }}>{''}</Typography>
      {props.items.map((item) =>
        item.href !== undefined ? (
          <MuiLink
            key={item.href}
            component={Link}
            to={item.href}
            underline="hover"
            color="inherit"
            sx={{ mr: '0.5rem' }}
          >
            {item.Icon ? (
              <item.Icon
                sx={{
                  fontSize: '1.4rem',
                  ml: 0,
                  mr: 0.5,
                  transform: 'translate(0, 5px)'
                }}
                fontSize="inherit"
              />
            ) : null}
            {capitalize(item.title, true)}
          </MuiLink>
        ) : (
          <Typography sx={{ color: 'text.primary' }}>
            {capitalize(item.title, true)}
          </Typography>
        )
      )}
    </BreadcrumbsStyled>
  )
}
