import * as React from 'react'
import clsx from 'clsx'
import {
  type GridRenderCellParams,
  type GridRenderEditCellParams,
  useGridApiContext
} from '@mui/x-data-grid'
import { alpha, styled } from '@mui/material/styles'
import Slider, { type SliderProps, sliderClasses } from '@mui/material/Slider'
import Tooltip from '@mui/material/Tooltip'
import { debounce } from '@mui/material/utils'

interface ProgressBarProps {
  value: number
}

const Center = styled('div')({
  height: '100%',
  display: 'flex',
  alignItems: 'center'
})

const Element = styled('div')(({ theme }) => ({
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  height: 26,
  borderRadius: 2
}))

const Value = styled('div')({
  position: 'absolute',
  lineHeight: '24px',
  width: '100%',
  display: 'flex',
  justifyContent: 'center'
})

const Bar = styled('div')({
  height: '100%',
  '&.low': {
    backgroundColor: '#f44336'
  },
  '&.medium': {
    backgroundColor: '#efbb5aa3'
  },
  '&.high': {
    backgroundColor: '#a2a83f'
  },
  '&.full': {
    backgroundColor: '#088208a3'
  }
})

const ProgressBar = React.memo(function ProgressBar(props: ProgressBarProps) {
  const { value } = props

  return (
    <Element>
      <Value>{`${parseFloat(value.toFixed(2))} %`}</Value>
      <Bar
        className={clsx({
          low: value < 30,
          medium: value >= 30 && value <= 70,
          high: value > 70 && value < 100,
          full: value === 100
        })}
        style={{ maxWidth: `${value}%` }}
      />
    </Element>
  )
})

const StyledSlider = styled(Slider)(({ theme }) => ({
  display: 'flex',
  height: '100%',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  borderRadius: 0,
  [`& .${sliderClasses.rail}`]: {
    height: '100%',
    backgroundColor: 'transparent'
  },
  [`& .${sliderClasses.track}`]: {
    height: '100%',
    transition: theme.transitions.create('background-color', {
      duration: theme.transitions.duration.shorter
    }),
    '&.low': {
      backgroundColor: '#f44336'
    },
    '&.medium': {
      backgroundColor: '#efbb5aa3'
    },
    '&.high': {
      backgroundColor: '#a2a83f'
    },
    '&.full': {
      backgroundColor: '#088208a3'
    }
  },
  [`& .${sliderClasses.thumb}`]: {
    height: '100%',
    width: 5,
    borderRadius: 0,
    marginTop: 0,
    backgroundColor: alpha('#000000', 0.2)
  }
}))

const ValueLabelComponent = React.memo(function ValueLabelComponent(
  props: any
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { children, open, value } = props

  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    <Tooltip open={open} enterTouchDelay={0} placement="top" title={value}>
      {children}
    </Tooltip>
  )
})

function EditProgress(props: GridRenderEditCellParams<any, number>) {
  const { id, value, field } = props
  const [valueState, setValueState] = React.useState(Number(value))

  const apiRef = useGridApiContext()

  const updateCellEditProps = React.useCallback(
    (newValue: number) => {
      void apiRef.current.setEditCellValue({ id, field, value: newValue })
    },
    [apiRef, field, id]
  )

  const debouncedUpdateCellEditProps = React.useMemo(
    () => debounce(updateCellEditProps, 60),
    [updateCellEditProps]
  )

  const handleChange = (event: Event, newValue: number | number[]) => {
    setValueState(newValue as number)
    debouncedUpdateCellEditProps(newValue as number)
  }

  React.useEffect(() => {
    setValueState(Number(value))
  }, [value])

  const handleRef: SliderProps['ref'] = (element) => {
    if (element) {
      element.querySelector<HTMLElement>('[type="range"]')!.focus()
    }
  }

  return (
    <StyledSlider
      ref={handleRef}
      classes={{
        track: clsx({
          low: valueState < 30,
          medium: valueState >= 30 && valueState <= 70,
          high: valueState > 70 && valueState < 100,
          full: valueState === 100
        })
      }}
      value={valueState}
      max={1}
      step={0.00001}
      onChange={handleChange}
      slots={{
        valueLabel: ValueLabelComponent
      }}
      valueLabelDisplay="auto"
      valueLabelFormat={(newValue) => `${parseFloat(newValue.toFixed(2))} %`}
    />
  )
}

export function GridPercentCell(
  params: GridRenderCellParams<any, number, any>
) {
  if (params.value == null) {
    return ''
  }

  return (
    <Center>
      <ProgressBar value={params.value} />
    </Center>
  )
}

export function GridPercentEditCell(
  params: GridRenderEditCellParams<any, number>
) {
  return <EditProgress {...params} />
}
