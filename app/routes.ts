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
            route('profile', 'routes/profile.tsx'),
            route('roles', 'routes/roles.tsx', [
              route(':roleId', 'routes/role.tsx')
            ]),
            route('users', 'routes/users.tsx', [
              route(':userId', 'routes/user.tsx')
            ]),
            route('tags', 'routes/tags.tsx', [
              route(':tagId', 'routes/tag.tsx')
            ]),
            route('documents', 'routes/documents.tsx', [
              route(':documentId', 'routes/document.tsx')
            ]),
            route('requirements', 'routes/requirements.tsx', [
              route(':requirementId', 'routes/requirement.tsx', {
                id: 'requirements-requirement'
              })
            ]),
            route(
              'requirements-hierarchy',
              'routes/requirements-hierarchy.tsx',
              [
                route(':requirementId', 'routes/requirement.tsx', {
                  id: 'requirements-hierarchy-requirement'
                })
              ]
            ),
            // layout('routes/requirements-hierarchy-layout.tsx', [
            //   route(
            //     'requirements/hierarchy',
            //     'routes/requirements-hierarchy.tsx'
            //   )
            // ]),
            route('coverages', 'routes/coverages.tsx', [
              route(':coverageId', 'routes/coverage.tsx')
            ]),
            route('common-topologies', 'routes/common-topologies.tsx', [
              route(':commonTopologyId', 'routes/common-topology.tsx')
            ]),
            route('topologies', 'routes/topologies.tsx', [
              route(':topologyId', 'routes/topology.tsx')
            ]),
            route('dbcs', 'routes/dbcs.tsx', [
              route(':dbcId', 'routes/dbc.tsx')
            ]),
            route('test-templates', 'routes/test-templates.tsx', [
              route(':testTemplateId', 'routes/test-template.tsx')
            ]),
            route('hierarchy', 'routes/tests-hierarchy.tsx', [
              route('tests/:testId', 'routes/test.tsx', {
                id: 'tests-hierarchy-test'
              }),
              route('subgroups/:subgroupId', 'routes/subgroup.tsx', {
                id: 'tests-hierarchy-subgroup'
              }),
              route('groups/:groupId', 'routes/group.tsx', {
                id: 'tests-hierarchy-group'
              })
            ]),
            route('tests', 'routes/tests.tsx', [
              route(':testId', 'routes/test.tsx', { id: 'test' })
            ]),
            route('subgroups', 'routes/subgroups.tsx', [
              route(':subgroupId', 'routes/subgroup.tsx', { id: 'subgroup' })
            ]),
            route('groups', 'routes/groups.tsx', [
              route(':groupId', 'routes/group.tsx', { id: 'group' })
            ]),
            route('devices', 'routes/devices.tsx', [
              route(':deviceId', 'routes/device.tsx')
            ]),
            route('tasks', 'routes/tasks.tsx', [
              route(':taskId', 'routes/task.tsx', [
                route(':testId', 'routes/test-report.tsx')
              ])
            ]),
            index('routes/home.tsx'),
            route('*', 'routes/not-found.tsx')
          ])
        ])
      ])
    ])
  ])
] satisfies RouteConfig
