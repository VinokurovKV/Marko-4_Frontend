import * as React from 'react'
import clsx from 'clsx'
import { styled } from '@mui/material/styles'

interface PercentBarProps {
  percent: number
  compact?: boolean
}

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

export const PercentBar = React.memo(function ProgressBar(
  props: PercentBarProps
) {
  const { percent } = props

  return (
    <Element
      sx={{
        height: props.compact ? '18px' : undefined,
        width: props.compact ? '7rem' : undefined
      }}
    >
      <Value
        sx={{
          lineHeight: props.compact ? '16px' : undefined
        }}
      >{`${parseFloat(percent.toFixed(2))} %`}</Value>
      <Bar
        className={clsx({
          low: percent < 30,
          medium: percent >= 30 && percent <= 70,
          high: percent > 70 && percent < 100,
          full: percent === 100
        })}
        style={{ maxWidth: `${percent}%` }}
      />
    </Element>
  )
})
