// React
import * as React from 'react'

/**
 * Хук «определитель изменения»
 *
 * @typeParam DetectedObjects Тип массива отслеживаемых объектов
 * @params detectedObjects массив отслеживаемых объектов
 * @params otherDependencies массив остальных зависимостей
 * @params onChange функция-обработчик при изменении одного из отслеживаемых объектов
 */

export function useChangeDetector<DetectedObjects extends any[]>({
  detectedObjects,
  otherDependencies = [],
  onChange
}: {
  detectedObjects: DetectedObjects

  otherDependencies?: any[]
  onChange?: (oldDetectedObjects: DetectedObjects) => void
}): void {
  const detectedObjectsRef = React.useRef(
    Array.from(detectedObjects) as DetectedObjects
  )
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
    if (changed) {
      onChange?.(oldDetectedObjects)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  }, [...detectedObjects, ...otherDependencies])
}
