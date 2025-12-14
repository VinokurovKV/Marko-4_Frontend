// Project
import { convertMediaTypeToFileExtension } from '@common/formats'
import type { DeviceSecondary } from '~/types'
import { downloadFileFromBlob } from '~/utilities/download-file'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateDeviceFormDialog } from '~/components/forms/resources/create-device'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useCodeCol,
  useDeviceTypeCol,
  useDsefsCountCol,
  useNameCol,
  usePreparedCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_DEVICES_IN_MESSAGES = 3

export interface DevicesGridProps {
  devices: DeviceSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function DevicesGrid(props: DevicesGridProps) {
  const navigationMode = props.navigationMode ?? false
  const navigate = useNavigate()
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const deviceCodeForId = React.useMemo(
    () => new Map(props.devices.map((device) => [device.id, device.code])),
    [props.devices]
  )

  const rows: GridValidRowModel[] = props.devices

  const readCols = [
    useCodeCol('id', true, '/devices', navigationMode),
    useNameCol(),
    useDeviceTypeCol(),
    usePreparedCol(
      'MIDDLE',
      'все необходимые конфигурации загружены',
      'не все необходимые конфигурации загружены'
    ),
    useDsefsCountCol()
  ]

  const navigationModeReadCols = React.useMemo(() => [readCols[0]], [readCols])

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      exportMenuItems: [
        {
          title: 'Скачать параметры устройства',
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
    [notifier, rightsSet, deviceCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => (navigationMode ? navigationModeReadCols : [...readCols, actionsCol]),
    [navigationMode, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof DeviceSecondary)[],
    []
  )

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
    [notifier, rightsSet, getDisplayedDeviceCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/devices/${rowId}`
          : '/devices'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="DEVICES"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        selectedRowId={
          navigationMode ? props.navigationModeSelectedRowId : undefined
        }
        navigationModeOnRowClick={handleNavigationModeRowClick}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateDeviceFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateDevice={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
