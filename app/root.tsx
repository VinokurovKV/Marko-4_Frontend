// Project
import { NotifierProvider } from './providers/notifier'
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
import { ruRU } from '@mui/x-data-grid/locales'
// import type {} from '@mui/material/themeCssVarsAugmentation'

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Марко-4' },
    {
      name: 'description',
      content: 'Марко-4 - приложение для тестирования сетевых устройств'
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
    }
  },
  ruRU
)

export default function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <NotifierProvider>
          <Outlet />
        </NotifierProvider>
      </ThemeProvider>
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
