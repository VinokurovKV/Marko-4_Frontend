// React
import * as React from 'react'

/**
 * Хук «определитель изменения»
 *
 * @typeParam DetectedObjects Тип массива отслеживаемых объектов
 * @params detectedObjects массив отслеживаемых объектов
 * @params otherDependencies массив остальных зависимостей
 * @params onChange функция-обработчик при изменении одного из отслеживаемых объектов
 * @params withInitialAction флаг вызова onChange при инициализации; по умолчанию false
 */

export function useChangeDetector<DetectedObjects extends any[]>({
  detectedObjects,
  otherDependencies = [],
  onChange,
  withInitialAction = false
}: {
  detectedObjects: DetectedObjects
  otherDependencies?: any[]
  onChange?: (oldDetectedObjects: DetectedObjects) => void
  withInitialAction?: boolean
}): void {
  const detectedObjectsRef = React.useRef(
    Array.from(detectedObjects) as DetectedObjects
  )
  const initializedRef = React.useRef(false)
  React.useLayoutEffect(() => {
    let changed = false
    for (let i = 0; i < detectedObjects.length; i++) {
      if (detectedObjects[i] !== detectedObjectsRef.current[i]) {
        changed = true
        break
      }
    }
    const oldDetectedObjects = detectedObjectsRef.current
    detectedObjectsRef.current = Array.from(detectedObjects) as DetectedObjects
    if (changed || (initializedRef.current === false && withInitialAction)) {
      onChange?.(oldDetectedObjects)
    }
    initializedRef.current = true
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  }, [...detectedObjects, ...otherDependencies, onChange, withInitialAction])
}
