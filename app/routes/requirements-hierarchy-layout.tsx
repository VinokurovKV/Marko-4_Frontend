// // Project
// import { serverConnector } from '~/server-connector'
// import { readRequirementsSecondary } from '~/readers'
// import { useNotifier } from '~/providers/notifier'
// import { useMeta } from '~/providers/meta'
// import { ForbiddenScreen } from '~/components/screens/problem/forbidden'
// import { RequirementsHierarchyLayoutScreen } from '~/components/screens/requirements-hierarchy-layout'
// // React router
// import type { Route } from './+types/requirements-hierarchy-layout'
// import { Outlet } from 'react-router'
// // React
// import * as React from 'react'

// export async function clientLoader() {
//   await serverConnector.connect()
//   const [requirements] = await Promise.all([readRequirementsSecondary()])
//   return {
//     requirements
//   }
// }

// export default function RequirementsHierarchyLayoutRoute({
//   loaderData: { requirements }
// }: Route.ComponentProps) {
//   const notifier = useNotifier()
//   const meta = useMeta()

//   React.useEffect(() => {
//     if (
//       requirements === null &&
//       serverConnector.meta.status === 'AUTHENTICATED' &&
//       serverConnector.meta.selfMeta.rights.includes('READ_REQUIREMENT')
//     ) {
//       notifier.showError('не удалось загрузить список требований')
//     }
//   }, [requirements, notifier])

//   return meta.status === 'AUTHENTICATED' &&
//     meta.selfMeta.rights.includes('READ_REQUIREMENT') === false ? (
//     <ForbiddenScreen />
//   ) : (
//     <RequirementsHierarchyLayoutScreen initialRequirements={requirements ?? []}>
//       {<Outlet />}
//     </RequirementsHierarchyLayoutScreen>
//   )
// }
