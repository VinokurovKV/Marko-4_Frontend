// Project
import type { TagPrimary, DeviceTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForDeviceType } from '~/localization'
import { FlagIcon } from '~/components/icons'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerText
} from '../common'
// React
import * as React from 'react'

export interface DeviceViewerProps {
  tags: TagPrimary[] | null
  device: DeviceTertiary
}

export function DeviceViewer({ tags, device }: DeviceViewerProps) {
  const notifier = useNotifier()

  const getConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readDeviceConfig({
        id: device.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [device])

  const getAccessConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readDeviceAccessConfig({
        id: device.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [device])

  const getClearConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readDeviceClearConfig({
        id: device.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [device])

  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Устройство', `${device.code}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={device.code} />
          <ColumnViewerItem field="название" val={device.name} />
          <ColumnViewerItem
            field="тип"
            val={localizationForDeviceType.get(device.type)}
          />
        </ColumnViewerBlock>
        <ColumnViewerItem
          field="готовность"
          Icon={
            <FlagIcon
              flag={device.prepared}
              truePrompt="все необходимые конфигурации загружены"
              falsePrompt="не все необходимые конфигурации загружены"
            />
          }
        />
        {device.config !== null ? (
          <ColumnViewerFile
            id={device.id}
            field="параметры"
            name={`${device.code}-parameters`}
            size={device.config.size}
            format={device.config.format}
            getFileBlob={getConfigBlob}
          />
        ) : (
          <ColumnViewerItem field="параметры" />
        )}
        {device.clearConfig !== null ? (
          <ColumnViewerFile
            id={device.id}
            field="конфигурация очищения"
            name={`${device.code}-clear-config`}
            size={device.clearConfig.size}
            format={device.clearConfig.format}
            getFileBlob={getClearConfigBlob}
          />
        ) : (
          <ColumnViewerItem field="конфигурация очищения" />
        )}
        {device.accessConfig !== null ? (
          <ColumnViewerFile
            id={device.id}
            field="конфигурация доступа"
            name={`${device.code}-access-config`}
            size={device.accessConfig.size}
            format={device.accessConfig.format}
            getFileBlob={getAccessConfigBlob}
          />
        ) : (
          <ColumnViewerItem field="конфигурация доступа" />
        )}
        <ColumnViewerBlock title="теги">
          <ColumnViewerChipsBlock
            emptyText={tags !== null ? 'нет' : '???'}
            items={(tags ?? []).map((tag) => ({
              text: tag.code,
              href: `/tags/${tag.id}`
            }))}
          />
        </ColumnViewerBlock>
      </ColumnViewer>
      <ColumnViewer>
        <ColumnViewerBlock title="описание">
          <ColumnViewerText text={device.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
