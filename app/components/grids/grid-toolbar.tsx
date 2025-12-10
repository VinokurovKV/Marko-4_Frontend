// React
import * as React from 'react'
// Material UI
import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import DeleteIcon from '@mui/icons-material/Delete'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FilterListIcon from '@mui/icons-material/FilterList'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import SearchIcon from '@mui/icons-material/Search'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import {
  ColumnsPanelTrigger,
  ExportCsv,
  ExportPrint,
  FilterPanelTrigger,
  Toolbar,
  ToolbarButton,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  QuickFilterTrigger
} from '@mui/x-data-grid'

type OwnerState = {
  expanded: boolean
}

const StyledQuickFilter = styled(QuickFilter)({
  display: 'grid',
  alignItems: 'center'
})

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(
  ({ theme, ownerState }) => ({
    gridArea: '1 / 1',
    width: 'min-content',
    height: 'min-content',
    zIndex: 1,
    opacity: ownerState.expanded ? 0 : 1,
    pointerEvents: ownerState.expanded ? 'none' : 'auto',
    transition: theme.transitions.create(['opacity'])
  })
)

const StyledTextField = styled(TextField)<{
  ownerState: OwnerState
}>(({ theme, ownerState }) => ({
  gridArea: '1 / 1',
  overflowX: 'clip',
  width: ownerState.expanded ? 260 : 'var(--trigger-width)',
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(['width', 'opacity'])
}))

function GridToolbarDivider() {
  return (
    <Divider orientation="vertical" variant="inset" flexItem sx={{ mx: 0.5 }} />
  )
}

export interface ProjGridToolbarProps {
  navigationMode: boolean
  changeModeButton?: {
    active: boolean
    onClick?: () => void
  }
  createButton?: {
    active: boolean
    onClick: () => void
  }
  deleteManyButton?: {
    active: boolean
    onClick: () => void
  }
}

export function ProjGridToolbar(props: ProjGridToolbarProps) {
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false)
  const exportMenuTriggerRef = React.useRef<HTMLButtonElement>(null)

  return (
    <Toolbar>
      {/* <Typography fontWeight="medium" sx={{ flex: 1, mx: 0.5 }}>
        Toolbar
      </Typography> */}

      {props.changeModeButton ? (
        <>
          <Tooltip
            title={
              props.changeModeButton.active
                ? 'Вернуть табличный режим'
                : 'Выйти из табличного режима'
            }
          >
            <ToolbarButton onClick={props.changeModeButton.onClick}>
              <KeyboardDoubleArrowLeftIcon
                fontSize="small"
                color={props.changeModeButton.active ? 'primary' : undefined}
              />
            </ToolbarButton>
          </Tooltip>
          <GridToolbarDivider />
        </>
      ) : null}

      {props.createButton ? (
        <>
          <Tooltip
            title={props.createButton.active ? 'Отменить создание' : 'Создать'}
          >
            <ToolbarButton onClick={props.createButton.onClick}>
              <AddIcon
                fontSize="small"
                color={props.createButton.active ? 'primary' : undefined}
              />
            </ToolbarButton>
          </Tooltip>
          <GridToolbarDivider />
        </>
      ) : null}

      {props.navigationMode === false ? (
        <Tooltip title="Столбцы">
          <ColumnsPanelTrigger render={<ToolbarButton />}>
            <ViewColumnIcon fontSize="small" />
          </ColumnsPanelTrigger>
        </Tooltip>
      ) : null}

      <Tooltip title="Фильтры">
        <FilterPanelTrigger
          render={(props, state) => (
            <ToolbarButton {...props} color="default">
              <Badge
                badgeContent={state.filterCount}
                color="primary"
                variant="dot"
              >
                <FilterListIcon fontSize="small" />
              </Badge>
            </ToolbarButton>
          )}
        />
      </Tooltip>

      <GridToolbarDivider />

      {props.navigationMode === false ? (
        <Tooltip title="Экспорт">
          <ToolbarButton
            ref={exportMenuTriggerRef}
            id="export-menu-trigger"
            onClick={() => setExportMenuOpen(true)}
          >
            <FileDownloadIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
      ) : null}

      <Menu
        id="export-menu"
        anchorEl={exportMenuTriggerRef.current}
        open={exportMenuOpen}
        onClose={() => setExportMenuOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <ExportPrint
          render={<MenuItem />}
          onClick={() => setExportMenuOpen(false)}
        >
          Печать
        </ExportPrint>
        <ExportCsv
          render={<MenuItem />}
          onClick={() => setExportMenuOpen(false)}
        >
          Скачать в формате CSV
        </ExportCsv>
      </Menu>

      <StyledQuickFilter>
        <QuickFilterTrigger
          render={(triggerProps, state) => (
            <Tooltip title="Поиск">
              <StyledToolbarButton
                {...triggerProps}
                ownerState={{ expanded: state.expanded }}
                color="default"
              >
                <SearchIcon fontSize="small" />
              </StyledToolbarButton>
            </Tooltip>
          )}
        />
        <QuickFilterControl
          render={({ ref, ...controlProps }, state) => (
            <StyledTextField
              {...controlProps}
              ownerState={{ expanded: state.expanded }}
              inputRef={ref}
              placeholder="Поиск..."
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: state.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        edge="end"
                        size="small"
                        material={{ sx: { marginRight: -0.75 } }}
                      >
                        <CancelIcon fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  ...controlProps.slotProps?.input
                },
                ...controlProps.slotProps
              }}
            />
          )}
        />
      </StyledQuickFilter>

      {props.deleteManyButton ? (
        <>
          <GridToolbarDivider />
          <Tooltip
            title={
              props.deleteManyButton.active
                ? 'Выключить режим удаления'
                : 'Включить режим удаления'
            }
          >
            <ToolbarButton onClick={props.deleteManyButton.onClick}>
              <DeleteIcon
                fontSize="small"
                color={props.deleteManyButton.active ? 'primary' : undefined}
              />
            </ToolbarButton>
          </Tooltip>
        </>
      ) : null}
    </Toolbar>
  )
}
