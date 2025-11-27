// Project
import type { Format } from '@common/formats'
// React
import * as React from 'react'
// Material UI
import { styled } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'

const PREFIX = 'format-icons/'

const iconFileForFormat = new Map<Format, string>([['PDF', 'pdf.png']])

interface FormatIconProps {
  format?: Format | null
}

const AvatarStyled = styled(Avatar)({
  '& > .MuiAvatar-img': {
    objectFit: 'contain'
  }
})

function FormatIcon({ format }: FormatIconProps) {
  const iconFile = format ? iconFileForFormat.get(format) : undefined
  const iconPath = iconFile !== undefined ? PREFIX + iconFile : undefined
  return (
    <Tooltip title={iconPath !== undefined ? format : undefined}>
      <AvatarStyled
        src={iconPath}
        variant="rounded"
        sx={{ p: '3px', height: '100%', width: 'unset' }}
      >
        {iconPath === undefined ? (format ?? '') : undefined}
      </AvatarStyled>
    </Tooltip>
  )
}

export function useFormatCol(formats: Format[]) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'format',
      headerName: 'Формат',
      type: 'singleSelect',
      valueOptions: formats,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <FormatIcon format={params.value as Format | undefined | null} />
      ),
      minWidth: 120,
      flex: 0.01,
      headerAlign: 'center',
      align: 'center'
    }),
    []
  )
  return col
}
