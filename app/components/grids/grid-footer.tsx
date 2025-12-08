// Project
import { ProjButton } from '../buttons/button'
// Material UI
import { forwardRef } from '@mui/x-internals/forwardRef'
import type { GridFooterContainerProps } from '@mui/x-data-grid'
import {
  gridFilteredTopLevelRowCountSelector,
  GridFooterContainer,
  gridRowSelectionCountSelector,
  GridSelectedRowCount,
  gridTopLevelRowCountSelector,
  useGridApiContext,
  useGridRootProps,
  useGridSelector
} from '@mui/x-data-grid'
import Stack from '@mui/material/Stack'
// Other
import PropTypes from 'prop-types'

const DELETE_BAR_BUTTON_HEIGHT = 24

export type ProjGridFooterProps = GridFooterContainerProps & {
  withSelectedRowCount?: boolean
  deleteBar?: {
    active: boolean
    onCancelClick: () => void
    onDeleteClick: () => void
  }
}

const ProjGridFooter = forwardRef<HTMLDivElement, ProjGridFooterProps>(
  function GridFooter({ withSelectedRowCount, deleteBar, ...props }, ref) {
    const apiRef = useGridApiContext()
    const rootProps = useGridRootProps()
    const totalTopLevelRowCount = useGridSelector(
      apiRef,
      gridTopLevelRowCountSelector
    )
    const selectedRowCount = useGridSelector(
      apiRef,
      gridRowSelectionCountSelector
    )
    const visibleTopLevelRowCount = useGridSelector(
      apiRef,
      gridFilteredTopLevelRowCountSelector
    )

    const selectedRowCountElement =
      !rootProps.hideFooterSelectedRowCount && selectedRowCount > 0 ? (
        <GridSelectedRowCount selectedRowCount={selectedRowCount} />
      ) : (
        <div />
      )

    const rowCountElement =
      !rootProps.hideFooterRowCount && !rootProps.pagination ? (
        <rootProps.slots.footerRowCount
          {...rootProps.slotProps?.footerRowCount}
          rowCount={totalTopLevelRowCount}
          visibleRowCount={visibleTopLevelRowCount}
        />
      ) : null

    const paginationElement = rootProps.pagination &&
      !rootProps.hideFooterPagination &&
      rootProps.slots.pagination && (
        <rootProps.slots.pagination {...rootProps.slotProps?.pagination} />
      )

    return (
      <GridFooterContainer {...props} ref={ref}>
        {withSelectedRowCount !== false ? selectedRowCountElement : null}
        {deleteBar?.active ? (
          <Stack direction="row" spacing={1}>
            <ProjButton
              variant="contained"
              onClick={deleteBar.onCancelClick}
              sx={{ height: `${DELETE_BAR_BUTTON_HEIGHT}px` }}
            >
              {'Отменить'}
            </ProjButton>
            <ProjButton
              variant="contained"
              color="error"
              onClick={deleteBar.onDeleteClick}
              sx={{ height: `${DELETE_BAR_BUTTON_HEIGHT}px` }}
            >
              {'Удалить'}
            </ProjButton>
          </Stack>
        ) : null}
        {rowCountElement}
        {paginationElement}
      </GridFooterContainer>
    )
  }
)

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
ProjGridFooter.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "pnpm proptypes"  |
  // ----------------------------------------------------------------------
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object
  ])
} as any

export { ProjGridFooter }
