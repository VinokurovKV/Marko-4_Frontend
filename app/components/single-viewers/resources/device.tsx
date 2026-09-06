// Project
import type { TagPrimary, DeviceTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { localizationForDeviceType } from '@common/localization'
import { FlagIcon } from '~/components/icons'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import { UpdateDeviceFormDialog } from '~/components/forms/resources/update-device'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Other
import capitalize from 'capitalize'

export interface DeviceViewerProps {
  tags: TagPrimary[] | null
  device: DeviceTertiary
}

export function DeviceViewer({ tags, device }: DeviceViewerProps) {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )
  const dialogs = useDialogs()

  // Edit form states
  const [updatedDeviceId, setUpdatedDeviceId] = React.useState<number | null>(
    null
  )

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedDeviceId(device.id)
    return Promise.resolve()
  }, [device])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedDeviceId(null)
  }, [setUpdatedDeviceId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить устройство '${device.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteDevice({
          id: device.id
        })
        notifier.showSuccess(`устройство «${device.code}» удалено`)
        void navigate('/devices')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, device])

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

  const changeConfigBlob = React.useCallback(
    async (id: number, fileName: string, fileBlob: Blob) => {
      try {
        await serverConnector.updateDevice(
          {
            id: id
          },
          new File([fileBlob], fileName, { type: fileBlob.type }),
          undefined,
          undefined,
          undefined,
          undefined
        )
        notifier.showSuccess(`параметры устройства «${device.code}» изменены`)
        return true
      } catch (error) {
        notifier.showError(error)
        return false
      }
    },
    [device]
  )

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

  const changeAccessConfigBlob = React.useCallback(
    async (id: number, fileName: string, fileBlob: Blob) => {
      try {
        await serverConnector.updateDevice(
          {
            id: id
          },
          undefined,
          undefined,
          new File([fileBlob], fileName, { type: fileBlob.type }),
          undefined,
          undefined
        )
        notifier.showSuccess(
          `конфигурация доступа устройства «${device.code}» изменена`
        )
        return true
      } catch (error) {
        notifier.showError(error)
        return false
      }
    },
    [device]
  )

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

  const changeClearConfigBlob = React.useCallback(
    async (id: number, fileName: string, fileBlob: Blob) => {
      try {
        await serverConnector.updateDevice(
          {
            id: id
          },
          undefined,
          new File([fileBlob], fileName, { type: fileBlob.type }),
          undefined,
          undefined,
          undefined
        )
        notifier.showSuccess(
          `конфигурация очищения устройства «${device.code}» изменена`
        )
        return true
      } catch (error) {
        notifier.showError(error)
        return false
      }
    },
    [device]
  )

  return (
    <>
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={['Устройство', `${device.code}`]}
      >
        <ColumnViewer>
          <ColumnViewerBlock title="действия">
            <ColumnViewerActions
              onUpdateClick={
                rightsSet.has('UPDATE_DEVICE') ? handleUpdateClick : undefined
              }
              onDeleteClick={
                rightsSet.has('DELETE_DEVICE') ? handleDeleteClick : undefined
              }
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="код" val={device.code} />
            <ColumnViewerItem field="название" val={device.name} />
            <ColumnViewerItem
              field="тип"
              val={localizationForDeviceType.get(device.type)}
            />
            <ColumnViewerRef
              field="история"
              text="ПЕРЕЙТИ"
              href={`/history/devices/${device.id}`}
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
              fieldFull={`параметры устройства «${device.code}»`}
              name={`${device.code}-parameters`}
              size={device.config.size}
              format={device.config.format}
              getFileBlob={getConfigBlob}
              withBrowse
              onFileBlobChange={changeConfigBlob}
            />
          ) : (
            <ColumnViewerItem field="параметры" />
          )}
          {device.clearConfig !== null ? (
            <ColumnViewerFile
              id={device.id}
              field="конфигурация очищения"
              fieldFull={`конфигурация очищения устройства «${device.code}»`}
              name={`${device.code}-clear-config`}
              size={device.clearConfig.size}
              format={device.clearConfig.format}
              getFileBlob={getClearConfigBlob}
              withBrowse
              onFileBlobChange={changeClearConfigBlob}
            />
          ) : (
            <ColumnViewerItem field="конфигурация очищения" />
          )}
          {device.accessConfig !== null ? (
            <ColumnViewerFile
              id={device.id}
              field="конфигурация доступа"
              fieldFull={`конфигурация доступа устройства «${device.code}»`}
              name={`${device.code}-access-config`}
              size={device.accessConfig.size}
              format={device.accessConfig.format}
              getFileBlob={getAccessConfigBlob}
              withBrowse
              onFileBlobChange={changeAccessConfigBlob}
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
      <UpdateDeviceFormDialog
        key={updatedDeviceId}
        deviceId={updatedDeviceId}
        setDeviceId={setUpdatedDeviceId}
        initialDevice={device}
        onSuccessUpdateDevice={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
