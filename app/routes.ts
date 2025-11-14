import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('setup', 'routes/setup.tsx'),
  route('login', 'routes/login.tsx')
] satisfies RouteConfig
