// React
import * as React from 'react'

const DEFAULT_DELAY = 1000

export function useDelay<T>(obj: T, delay: number = DEFAULT_DELAY) {
  const [state, setState] = React.useState<T>(obj)

  React.useEffect(() => {
    setTimeout(() => {
      setState(obj)
    }, delay)
  }, [obj, delay, setState])

  return state
}
