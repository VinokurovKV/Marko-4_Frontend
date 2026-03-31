// Project
import { NotifierProvider } from './providers/notifier'
import { DialogsProvider } from './providers/dialogs'
import type { Route } from './+types/root'
// import AppTheme from './theme/AppTheme'
// import {
//   dataGridCustomizations,
//   datePickersCustomizations,
//   sidebarCustomizations,
//   formInputCustomizations
// } from './theme/customizations'
// React router
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from 'react-router'
// Material UI
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ruRU as ruRuDataGrid } from '@mui/x-data-grid/locales'
import { ruRU as ruRuDatePickers } from '@mui/x-date-pickers/locales'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
// import type {} from '@mui/material/themeCssVarsAugmentation'
// Other
import 'dayjs/locale/ru'

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Вестник' },
    {
      name: 'description',
      content: 'Вестник - приложение для тестирования сетевых устройств'
    }
  ]
}

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
  }
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// const themeComponents = {
//   // ...dataGridCustomizations,
//   // ...datePickersCustomizations,
//   // ...sidebarCustomizations,
//   // ...formInputCustomizations
// }

const theme = createTheme(
  {
    colorSchemes: {
      light: true,
      dark: true
    },
    typography: {
      fontSize: 12
    },
    spacing: 6
  },
  ruRuDataGrid,
  ruRuDatePickers
)

// theme.spacing(10)

export default function App() {
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'ru'}>
        <ThemeProvider theme={theme} noSsr>
          <CssBaseline enableColorScheme />
          <NotifierProvider>
            <DialogsProvider>
              <Outlet />
            </DialogsProvider>{' '}
          </NotifierProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </>
  )
}

// export default function App(props: { disableCustomTheme?: boolean }) {
//   return (
//     <AppTheme {...props} themeComponents={themeComponents}>
//       <CssBaseline enableColorScheme />
//       <Outlet />
//     </AppTheme>
//   )
// }

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
