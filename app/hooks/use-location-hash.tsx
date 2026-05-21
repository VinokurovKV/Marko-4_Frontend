// React
import * as React from 'react'

type UseLocationHashReturn<Hash extends string> = [
  Hash,
  (newHash: Hash) => void
]

export function useLocationHash<Hash extends string>(
  defaultHash: Hash
): UseLocationHashReturn<Hash> {
  const [hash, setHash] = React.useState<string>(() => {
    const hash = window.location.hash.slice(1)
    return hash !== '' ? hash : defaultHash
  })

  const updateHash = React.useCallback(
    (newHash: Hash): void => {
      if (newHash !== hash) {
        window.location.hash = newHash
      }
    },
    [hash]
  )

  React.useEffect(() => {
    const handler = (): void => {
      const hash = window.location.hash.slice(1)
      setHash(hash !== '' ? hash : defaultHash)
    }

    window.addEventListener('hashchange', handler)

    // Очистка при размонтировании
    return (): void => {
      window.removeEventListener('hashchange', handler)
    }
  }, [])

  return [hash as Hash, updateHash]
}
