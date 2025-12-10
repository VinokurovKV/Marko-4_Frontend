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
            layout('routes/requirements-hierarchy-layout.tsx', [
              route(
                'requirements/hierarchy',
                'routes/requirements-hierarchy.tsx'
              )
            ]),
            route('coverages', 'routes/coverages.tsx'),
            route('common-topologies', 'routes/common-topologies.tsx'),
            route('topologies', 'routes/topologies.tsx'),
            route('dbcs', 'routes/dbcs.tsx'),
            route('test-templates', 'routes/test-templates.tsx'),
            route('tests', 'routes/tests.tsx'),
            layout('routes/test-layout.tsx', [
              route('tests/:testId', 'routes/test.tsx')
            ]),
            route('subgroups', 'routes/subgroups.tsx'),
            route('groups', 'routes/groups.tsx'),
            route('devices', 'routes/devices.tsx'),
            route('tasks', 'routes/tasks.tsx'),
            layout('routes/task-layout.tsx', [
              route('tasks/:taskId', 'routes/task.tsx')
            ]),
            layout('routes/test-report-layout.tsx', [
              route('tasks/:taskId/:testId', 'routes/test-report.tsx')
            ]),
            index('routes/home.tsx'),
            route('*', 'routes/not-found.tsx')
          ])
        ])
      ])
    ])
  ])
] satisfies RouteConfig
