import {
  type RouteConfig,
  index,
  layout,
  route
} from '@react-router/dev/routes'

export default [
  layout('routes/meta.tsx', [
    layout('routes/connected-guard.tsx', [
      route('setup', 'routes/setup.tsx'),
      layout('routes/setup-guard.tsx', [
        route('login', 'routes/login.tsx'),
        layout('routes/authenticated-guard.tsx', [
          layout('routes/layout.tsx', [
            route('tags', 'routes/tags.tsx'),
            route('roles', 'routes/roles.tsx'),
            route('users', 'routes/users.tsx'),
            route('documents', 'routes/documents.tsx'),
            route('requirements', 'routes/requirements.tsx'),
            route('test-templates', 'routes/test-templates.tsx'),
            route('devices', 'routes/devices.tsx'),
            index('routes/home.tsx'),
            route('*', 'routes/not-found.tsx')
          ])
        ])
      ])
    ])
  ])
] satisfies RouteConfig
