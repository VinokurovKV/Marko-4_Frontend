// Project
import { ProjButton } from '~/components/buttons/button'
// React
import * as React from 'react'
// Material UI
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import useEventCallback from '@mui/utils/useEventCallback'

export interface OpenDialogOptions<R> {
  /**
   * A function that is called before closing the dialog closes. The dialog
   * stays open as long as the returned promise is not resolved. Use this if
   * you want to perform an async action on close and show a loading state.
   *
   * @param result The result that the dialog will return after closing.
   * @returns A promise that resolves when the dialog can be closed.
   */
  onClose?: (result: R) => Promise<void>
}

export interface AlertOptions extends OpenDialogOptions<void> {
  /**
   * A title for the dialog. Defaults to `'Alert'`.
   */
  title?: React.ReactNode
  /**
   * The text to show in the "Ok" button. Defaults to `'Ок'`.
   */
  okText?: React.ReactNode
}

export interface ConfirmOptions extends OpenDialogOptions<boolean> {
  /**
   * A title for the dialog.
   */
  title?: React.ReactNode
  /**
   * The text to show in the "Ok" button. Defaults to `'Ок'`.
   */
  okText?: React.ReactNode
  /**
   * Denotes the purpose of the dialog. This will affect the color of the
   * "Ok" button. Defaults to `undefined`.
   */
  severity?: 'error' | 'info' | 'success' | 'warning'
  /**
   * The text to show in the "Cancel" button. Defaults to `'Отменить'`.
   */
  cancelText?: React.ReactNode
}

export interface PromptOptions extends OpenDialogOptions<string | null> {
  /**
   * A title for the dialog.
   */
  title?: React.ReactNode
  /**
   * The text to show in the "Ok" button. Defaults to `'Ок'`.
   */
  okText?: React.ReactNode
  /**
   * The text to show in the "Cancel" button. Defaults to `'Отменить'`.
   */
  cancelText?: React.ReactNode
}

/**
 * The props that are passed to a dialog component.
 */
export interface DialogProps<P = undefined, R = void> {
  /**
   * The payload that was passed when the dialog was opened.
   */
  payload: P
  /**
   * Whether the dialog is open.
   */
  open: boolean
  /**
   * A function to call when the dialog should be closed. If the dialog has a return
   * value, it should be passed as an argument to this function. You should use the promise
   * that is returned to show a loading state while the dialog is performing async actions
   * on close.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog can be fully closed.
   */
  onClose: (result: R) => Promise<void>
}

export interface OpenAlertDialog {
  /**
   * Open an alert dialog. Returns a promise that resolves when the user
   * closes the dialog.
   *
   * @param msg The message to show in the dialog.
   * @param options Additional options for the dialog.
   * @returns A promise that resolves when the dialog is closed.
   */
  (msg: React.ReactNode, options?: AlertOptions): Promise<void>
}

export interface OpenConfirmDialog {
  /**
   * Open a confirmation dialog. Returns a promise that resolves to true if
   * the user confirms, false if the user cancels.
   *
   * @param msg The message to show in the dialog.
   * @param options Additional options for the dialog.
   * @returns A promise that resolves to true if the user confirms, false if the user cancels.
   */
  (msg: React.ReactNode, options?: ConfirmOptions): Promise<boolean>
}

export interface OpenPromptDialog {
  /**
   * Open a prompt dialog to request user input. Returns a promise that resolves to the input
   * if the user confirms, null if the user cancels.
   *
   * @param msg The message to show in the dialog.
   * @param options Additional options for the dialog.
   * @returns A promise that resolves to the user input if the user confirms, null if the user cancels.
   */
  (msg: React.ReactNode, options?: PromptOptions): Promise<string | null>
}

export type DialogComponent<P, R> = React.ComponentType<DialogProps<P, R>>

export interface OpenDialog {
  /**
   * Open a dialog without payload.
   * @param Component The dialog component to open.
   * @param options Additional options for the dialog.
   */
  <P extends undefined, R>(
    Component: DialogComponent<P, R>,
    payload?: P,
    options?: OpenDialogOptions<R>
  ): Promise<R>
  /**
   * Open a dialog and pass a payload.
   * @param Component The dialog component to open.
   * @param payload The payload to pass to the dialog.
   * @param options Additional options for the dialog.
   */
  <P, R>(
    Component: DialogComponent<P, R>,
    payload: P,
    options?: OpenDialogOptions<R>
  ): Promise<R>
}

export interface CloseDialog {
  /**
   * Close a dialog and return a result.
   * @param dialog The dialog to close. The promise returned by `open`.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog is fully closed.
   */
  <R>(dialog: Promise<R>, result: R): Promise<R>
}

export interface DialogHook {
  alert: OpenAlertDialog
  confirm: OpenConfirmDialog
  prompt: OpenPromptDialog
  open: OpenDialog
  close: CloseDialog
}

function useDialogLoadingButton(onClose: () => Promise<void>) {
  const [loading, setLoading] = React.useState(false)
  const handleClick = async () => {
    try {
      setLoading(true)
      await onClose()
    } finally {
      setLoading(false)
    }
  }
  return {
    onClick: handleClick,
    loading
  }
}

export interface AlertDialogPayload extends AlertOptions {
  msg: React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AlertDialogProps extends DialogProps<
  AlertDialogPayload,
  void
> {}

export function AlertDialog({ open, payload, onClose }: AlertDialogProps) {
  const okButtonProps = useDialogLoadingButton(() => onClose())

  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <Dialog maxWidth="xs" fullWidth open={open} onClose={() => onClose()}>
      {payload.title ? (
        <DialogTitle variant="h5">{payload.title}</DialogTitle>
      ) : null}
      <DialogContent>{payload.msg}</DialogContent>
      <DialogActions>
        <ProjButton variant="contained" disabled={!open} {...okButtonProps}>
          {payload.okText ?? 'Ок'}
        </ProjButton>
      </DialogActions>
    </Dialog>
  )
}

export interface ConfirmDialogPayload extends ConfirmOptions {
  msg: React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConfirmDialogProps extends DialogProps<
  ConfirmDialogPayload,
  boolean
> {}

export function ConfirmDialog({ open, payload, onClose }: ConfirmDialogProps) {
  const cancelButtonProps = useDialogLoadingButton(() => onClose(false))
  const okButtonProps = useDialogLoadingButton(() => onClose(true))

  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <Dialog maxWidth="xs" fullWidth open={open} onClose={() => onClose(false)}>
      {payload.title ? (
        <DialogTitle variant="h5">{payload.title}</DialogTitle>
      ) : null}
      <DialogContent>{payload.msg}</DialogContent>
      <DialogActions>
        <ProjButton
          variant="contained"
          autoFocus
          disabled={!open}
          {...cancelButtonProps}
        >
          {payload.cancelText ?? 'Отменить'}
        </ProjButton>
        <ProjButton
          variant="contained"
          color={payload.severity}
          disabled={!open}
          {...okButtonProps}
        >
          {payload.okText ?? 'Ок'}
        </ProjButton>
      </DialogActions>
    </Dialog>
  )
}

export interface PromptDialogPayload extends PromptOptions {
  msg: React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PromptDialogProps extends DialogProps<
  PromptDialogPayload,
  string | null
> {}

export function PromptDialog({ open, payload, onClose }: PromptDialogProps) {
  const [input, setInput] = React.useState('')
  const cancelButtonProps = useDialogLoadingButton(() => onClose(null))

  const [loading, setLoading] = React.useState(false)

  const name = 'input'
  return (
    <Dialog
      maxWidth="xs"
      fullWidth
      open={open}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClose={() => onClose(null)}
      slotProps={{
        paper: {
          component: 'form',
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            try {
              setLoading(true)
              const formData = new FormData(event.currentTarget)
              const value = formData.get(name) ?? ''

              if (typeof value !== 'string') {
                throw new Error('Value must come from a text input.')
              }

              await onClose(value)
            } finally {
              setLoading(false)
            }
          }
        }
      }}
    >
      {payload.title ? (
        <DialogTitle variant="h5">{payload.title}</DialogTitle>
      ) : null}
      <DialogContent>
        <DialogContentText>{payload.msg} </DialogContentText>
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          name={name}
          type="text"
          fullWidth
          variant="standard"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <ProjButton variant="contained" disabled={!open} {...cancelButtonProps}>
          {payload.cancelText ?? 'Отменить'}
        </ProjButton>
        <ProjButton
          variant="contained"
          disabled={!open}
          loading={loading}
          type="submit"
        >
          {payload.okText ?? 'Ок'}
        </ProjButton>
      </DialogActions>
    </Dialog>
  )
}

const DialogsContext = React.createContext<{
  open: OpenDialog
  close: CloseDialog
} | null>(null)

export function useDialogs(): DialogHook {
  const dialogsContext = React.useContext(DialogsContext)
  if (!dialogsContext) {
    throw new Error('Dialogs context was used without a provider.')
  }
  const { open, close } = dialogsContext

  const alert = useEventCallback<OpenAlertDialog>(
    (msg, { onClose, ...options } = {}) =>
      open(AlertDialog, { ...options, msg }, { onClose })
  )

  const confirm = useEventCallback<OpenConfirmDialog>(
    (msg, { onClose, ...options } = {}) =>
      open(ConfirmDialog, { ...options, msg }, { onClose })
  )

  const prompt = useEventCallback<OpenPromptDialog>(
    (msg, { onClose, ...options } = {}) =>
      open(PromptDialog, { ...options, msg }, { onClose })
  )

  return React.useMemo(
    () => ({
      alert,
      confirm,
      prompt,
      open,
      close
    }),
    [alert, close, confirm, open, prompt]
  )
}

interface DialogStackEntry<P, R> {
  key: string
  open: boolean
  promise: Promise<R>
  Component: DialogComponent<P, R>
  payload: P
  onClose: (result: R) => Promise<void>
  resolve: (result: R) => void
}

export interface DialogProviderProps {
  children?: React.ReactNode
  unmountAfter?: number
}

/**
 * Provider for Dialog stacks. The subtree of this component can use the `useDialogs` hook to
 * access the dialogs API. The dialogs are rendered in the order they are requested.
 */
export function DialogsProvider(props: DialogProviderProps) {
  const { children, unmountAfter = 1000 } = props
  const [stack, setStack] = React.useState<DialogStackEntry<any, any>[]>([])
  const keyPrefix = React.useId()
  const nextId = React.useRef(0)
  const dialogMetadata = React.useRef(
    new WeakMap<Promise<any>, DialogStackEntry<any, any>>()
  )

  const requestDialog = useEventCallback<OpenDialog>(function open<P, R>(
    Component: DialogComponent<P, R>,
    payload: P,
    options: OpenDialogOptions<R> = {}
  ) {
    const { onClose = async () => {} } = options
    let resolve: ((result: R) => void) | undefined
    const promise = new Promise<R>((resolveImpl) => {
      resolve = resolveImpl
    })

    if (!resolve) {
      throw new Error('resolve not set.')
    }

    const key = `${keyPrefix}-${nextId.current}`
    nextId.current += 1

    const newEntry: DialogStackEntry<P, R> = {
      key,
      open: true,
      promise,
      Component,
      payload,
      onClose,
      resolve
    }

    // Store metadata for reliable access during close
    dialogMetadata.current.set(promise, newEntry)

    setStack((prevStack) => [...prevStack, newEntry])
    return promise
  })

  const closeDialogUi = useEventCallback(function closeDialogUi<R>(
    dialog: Promise<R>
  ) {
    setStack((prevStack) =>
      prevStack.map((entry) =>
        entry.promise === dialog ? { ...entry, open: false } : entry
      )
    )
    setTimeout(() => {
      // wait for closing animation
      setStack((prevStack) =>
        prevStack.filter((entry) => entry.promise !== dialog)
      )
      // WeakMap automatically cleans up when promise is garbage collected
    }, unmountAfter)
  })

  const closeDialog = useEventCallback(async function closeDialog<R>(
    dialog: Promise<R>,
    result: R
  ) {
    const entryToClose = dialogMetadata.current.get(dialog)
    if (!entryToClose) {
      throw new Error('Dialog not found.')
    }

    try {
      await entryToClose.onClose(result)
    } finally {
      entryToClose.resolve(result)
      closeDialogUi(dialog)
    }
    return dialog
  })

  const contextValue = React.useMemo(
    () => ({ open: requestDialog, close: closeDialog }),
    [requestDialog, closeDialog]
  )

  return (
    <DialogsContext.Provider value={contextValue}>
      {children}
      {stack.map(({ key, open, Component, payload, promise }) => (
        <Component
          key={key}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          payload={payload}
          open={open}
          onClose={async (result) => {
            await closeDialog(promise, result)
          }}
        />
      ))}
    </DialogsContext.Provider>
  )
}
