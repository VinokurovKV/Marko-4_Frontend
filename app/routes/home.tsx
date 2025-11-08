import type { Route } from './+types/home'
import { Welcome } from '../welcome/welcome'

import { serverConnector } from '~/server-connector'
// import { ActionTypeEnum } from '@common/enums'
import { log } from '~/utilities'

async function process() {
  console.log('PROCESS')
  // await (async () => {
  //   const result = await serverConnector.login({
  //     login: 'owner',
  //     pass: '12345678'
  //   })
  //   console.log(result)
  // })()
  // await (async () => {
  //   const blob = await serverConnector.readRequestsLogs()
  //   console.log(blob)
  //   const url = URL.createObjectURL(blob)
  //   const link = document.createElement('a')
  //   link.href = url
  //   link.download = 'asfsafsafsf'
  //   link.click()
  //   URL.revokeObjectURL(url)
  // })()
  await (async () => {
    const actionInfos = await serverConnector.readActionInfos({
      types: ['CREATE_ROLE']
    })
    log([actionInfos], 'default')
  })()
  await (async () => {
    // const role = await serverConnector.readRole(
    //   {
    //     id: 0
    //   },
    //   {
    //     scope: 'ALL_PROPS'
    //   }
    // )
    // await serverConnector.createRole({
    //   name: 'role4',
    //   description: {
    //     format: 'PLAIN',
    //     text: 'asfasasgasgsag'
    //   }
    // })
    const roles = await serverConnector.readRoles({
      scope: 'PRIMARY_PROPS'
    })
    log([roles], 'default')
  })()
}

setTimeout(() => {
  void process()
}, 300)

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' }
  ]
}

export default function Home() {
  return <Welcome />
}
