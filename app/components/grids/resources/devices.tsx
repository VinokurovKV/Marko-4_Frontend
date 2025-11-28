// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type { ReadTagsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { ReadDevicesWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/devices.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { downloadFileFromBlob } from '~/utilities/download-file'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useDevicesSubscription,
  useTagsSubscription
} from '~/hooks/subscriptions'
import { CreateDeviceFormDialog } from '~/components/forms/resources/create-device'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useDeviceTypeCol,
  useDsefsCountCol,
  useNameCol,
  usePrepatedCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_DEVICES_IN_MESSAGES = 3

type Tag = DtoWithoutEnums<ReadTagsWithPrimaryPropsSuccessResultItemDto>
type Device =
  DtoWithoutEnums<ReadDevicesWithUpToSecondaryPropsSuccessResultItemDto>

export interface DevicesGridProps {
  initialTags: Tag[] | null
  initialDevices: Device[]
}

export function DevicesGrid(props: DevicesGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [tags, setTags] = React.useState<Tag[] | null>(props.initialTags)
  const [devices, setDevices] = React.useState<Device[]>(props.initialDevices)

  useTagsSubscription('PRIMARY_PROPS', setTags)
  useDevicesSubscription('UP_TO_SECONDARY_PROPS', setDevices)

  const deviceCodeForId = React.useMemo(
    () => new Map(devices.map((device) => [device.id, device.code])),
    [devices]
  )

  const rows: GridValidRowModel[] = devices

  const readCols = [
    useCodeCol('id', true, '/devices'),
    useNameCol(),
    useDeviceTypeCol(),
    usePrepatedCol(
      'MIDDLE',
      undefined,
      'не все необходимые конфигурации загружены'
    ),
    useDsefsCountCol()
  ]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      exportMenuItems: [
        {
          title: 'Скачать основную конфигурацию',
          action: async (rowId) => {
            try {
              const config = await serverConnector.readDeviceConfig({
                id: rowId
              })
              const code = deviceCodeForId.get(rowId) ?? ''
              const ext = convertMediaTypeToFileExtension(config.type) ?? ''
              const fileName = `${code}-config.${ext}`
              downloadFileFromBlob(config, fileName)
            } catch (error) {
              notifier.showError(error)
            }
          }
        },
        {
          title: 'Скачать конфигурацию доступа',
          action: async (rowId) => {
            try {
              const config = await serverConnector.readDeviceAccessConfig({
                id: rowId
              })
              const code = deviceCodeForId.get(rowId) ?? ''
              const ext = convertMediaTypeToFileExtension(config.type) ?? ''
              const fileName = `${code}-access-config.${ext}`
              downloadFileFromBlob(config, fileName)
            } catch (error) {
              notifier.showError(error)
            }
          }
        },
        {
          title: 'Скачать конфигурацию очищения',
          action: async (rowId) => {
            try {
              const config = await serverConnector.readDeviceClearConfig({
                id: rowId
              })
              const code = deviceCodeForId.get(rowId) ?? ''
              const ext = convertMediaTypeToFileExtension(config.type) ?? ''
              const fileName = `${code}-clear-config.${ext}`
              downloadFileFromBlob(config, fileName)
            } catch (error) {
              notifier.showError(error)
            }
          }
        }
      ],
      delete: rightsSet.has('DELETE_DEVICE')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить устройство '${deviceCodeForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteDevice({
                  id: rowId
                })
                notifier.showSuccess(
                  `устройство '${deviceCodeForId.get(rowId) ?? ''}' удалено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [rightsSet, deviceCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [...readCols, actionsCol],
    [readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(() => [] as (keyof Device)[], [])

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_DEVICE')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedDeviceCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_DEVICES_IN_MESSAGES)
        .map((id) => deviceCodeForId.get(id) ?? '')
    },
    [deviceCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_DEVICE')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedDeviceCodes = getDisplayedDeviceCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedDeviceCodes.length
              return `удалить устройств${count === 1 ? 'о' : 'а'}${displayedDeviceCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedDeviceCodes = getDisplayedDeviceCodes(rowIds)
              try {
                await serverConnector.deleteDevices({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedDeviceCodes.length
                notifier.showSuccess(
                  `устройств${count === 1 ? 'о' : 'а'}${displayedDeviceCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'о' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [rightsSet, getDisplayedDeviceCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="DEVICES"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateDeviceFormDialog
        tags={tags}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateDevice={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
