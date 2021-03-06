import * as test from 'tape'
import {Client} from 'rpc-websockets'

import * as C from '../config'
import {fail} from '../common'
import {withEnvoyClient} from './command'

process.on('unhandledRejection', (reason, p) => {
  console.log("UNHANDLED REJECTION:")
  console.log("reason: ", reason)
})

const dnaHash = 'Qm_WHATEVER_TODO'
const agentId = 'total-dummy-fake-not-real-agent-public-address'


test('can install app', async t => {
  withEnvoyClient(agentId, async client => {
    // TODO: conductor panics if installing the same app twice!
    console.log('installing happ...')
    await client.call('holo/happs/install', {happId: 'TODO', agentId: C.hostAgentName})

    const newAgent = await client.call('holo/agents/new', {agentId, happId: 'TODO NOT REAL HAPPID'})

    t.end()
  })
})

test('end to end test (assuming app is installed)', async t => {
  withEnvoyClient(agentId, async (client) => {
    console.log('identifying...')
    const agentName = C.hostAgentName
    const agentId = await client.call('holo/identify', {agentId: agentName})
    t.equal(agentId, agentName)
    console.log('identified!')

    const happId = 'TODO'
    const func = 'simple/get_links'
    const params = {base: 'QmTODO'}
    const signature = 'TODO'

    const result = await client.call('holo/call', {
      agentId: agentName, happId, dnaHash, function: func, params, signature
    })
    console.log(result)
    t.ok(result.Ok)
    t.equal(result.Ok.addresses.length, 0)
    t.end()
  })
})

test('end to end hosted agent test (assuming app is installed)', async t => {
  withEnvoyClient(agentId, async (client) => {
    console.log('identifying...')
    // const num = Math.floor(Math.random() * 10000)
    // const num = '5079'
    const returnedAgentId = await client.call('holo/identify', {agentId})
    t.equal(agentId, returnedAgentId)

    const happId = 'TODO'
    const func = 'simple/get_links'
    const params = {base: 'QmTODO'}
    const signature = 'TODO'

    const result = await client.call('holo/call', {
      agentId: agentId, happId, dnaHash, function: func, params, signature
    })

    t.ok(result.Ok)
    t.equal(result.Ok.addresses.length, 0)
    t.end()
  })
})
