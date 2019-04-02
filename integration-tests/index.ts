import * as test from 'tape'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {exec} from 'child_process'
import * as rimraf from 'rimraf'


import * as T from '../src/types'
import {initializeConductorConfig, cleanConductorStorage, spawnConductor, keygen} from '../src/conductor'
import * as HH from '../src/flows/holo-hosting'
import * as Config from '../src/config'
import startIntrceptr from '../src/server'
import * as S from '../src/server'
import {callWhenConnected} from '../src/common'
import {shimHappById, shimHappByNick, HappEntry} from '../src/shims/happ-server'
import {withIntrceptrClient, adminHostCall} from './common'


import startWormholeServer from '../src/wormhole-server'
import startAdminHostServer from '../src/admin-host-server'
import startShimServers from '../src/shims/happ-server'


const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Read the cached test keyfile data from files, first creating said files if nonexistant
 */
const getOrCreateKeyData = (): T.KeyData => {
  const bundlePath = Config.testKeybundlePath
  const addressPath = Config.testAgentAddressPath
  if (fs.existsSync(Config.testKeyDir)) {
    console.log('Using existing key data at', Config.testKeyDir)
    const publicAddress = fs.readFileSync(addressPath, 'utf8')
    return {
      keyFile: bundlePath,
      publicAddress
    }
  } else {
    fs.mkdirSync(Config.testKeyDir, {recursive: true})
    console.log('Creating new key data at', Config.testKeyDir)
    const {publicAddress} = keygen(bundlePath)
    fs.writeFileSync(addressPath, publicAddress)
    return {publicAddress, keyFile: bundlePath}
  }
}

const deleteKeyData = () => rimraf.sync(Config.testKeyDir)

/**
 * Fire up a conductor and create a WS client to it.
 * NB: there cannot be more than one conductor running at a time since they currently occupy
 * a fixed set of ports and a fixed config file path, etc.
 */
const withConductor = async (fn) => {
  // TODO: how to shut down last run properly in case of failure?
  exec('killall holochain')
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'intrceptr-'))
  console.log('Created directory for integration tests: ', baseDir)
  cleanConductorStorage(baseDir)
  console.log("Cleared storage.")
  const keyData = getOrCreateKeyData()
  console.log("Generated keys.")
  initializeConductorConfig(baseDir, keyData)
  console.log("Generated config.")
  const conductor = spawnConductor(Config.conductorConfigPath(baseDir))
  await delay(1000)

  console.info("auto-entering passphrase...")
  conductor.stdin.write(Config.testKeyPassphrase + '\n')
  conductor.stdin.end()

  const intrceptr = startIntrceptr(Config.PORTS.intrceptr)
  await intrceptr.connections.ready()
  await delay(1000)
  console.log("intrceptr ready! running test.")
  await withIntrceptrClient(fn).finally(() => {
    console.log("Shutting down everything...")
    intrceptr.close()
    conductor.kill()
  })
}

const doRegisterAgent = async () => {
  await HH.SHIMS.registerAsProvider(S.getMasterClient(false))
  await HH.registerAsHost(S.getMasterClient(false))
  await delay(1000)
}

const doRegisterApp = async (happEntry: HappEntry): Promise<string> => {
  const masterClient = S.getMasterClient(false)
  const happId = await HH.SHIMS.registerHapp(masterClient, {
    uiHash: happEntry.ui ? happEntry.ui.hash : null,
    dnaHashes: happEntry.dnas.map(dna => dna.hash)
  })
  console.log("registered hApp: ", happId)

  const hostResult = await HH.enableHapp(masterClient, happId)
  console.log(`enabled ${happId}: `, hostResult)

  masterClient.close()

  return happId
}

const doAppSetup = async (client, happNick: string) => {
  const happEntry = shimHappByNick(happNick)!
  const dnaHashes = happEntry.dnas.map(dna => dna.hash)
  const uiHash = happEntry.ui ? happEntry.ui.hash : null

  const happId = await doRegisterApp(happEntry)

  const happResult = await adminHostCall('holo/happs/install', {happId: happId, agentId: Config.hostAgentId})
  console.log(`installed ${happId}: `, happResult.statusText, happResult.status)

  return {happId, dnaHashes, uiHash}
}

const zomeCaller = (client, {happId, agentId, dnaHash, zome}) => (func, params) => {
  return callWhenConnected(client, 'holo/call', {
    happId, agentId, dnaHash,
    zome: zome,
    function: func,
    params: params,
    signature: 'TODO',
  })
}

test('all components shut themselves down properly', async t => {
  const intrceptr = new S.IntrceptrServer({
    masterClient: null,
    publicClient: null,
    internalClient: null,
  })

  const client = S.getMasterClient(false)
  const httpServer = await intrceptr.buildHttpServer(null)
  const wss = await intrceptr.buildWebsocketServer(httpServer)
  const shimServer = startShimServers(Config.PORTS.shim)
  const adminServer = startAdminHostServer(Config.PORTS.admin, 'testdir', null)
  const wormholeServer = startWormholeServer(Config.PORTS.wormhole, intrceptr)

  httpServer.close()
  wss.close()
  shimServer.stop()
  adminServer.close()
  wormholeServer.close()
  client.close()

  setTimeout(() => {
    if(!t.ended) {
      t.fail("At least one component took too long to shut down!")
    }
  }, 5000)

  t.end()
})

test('can do public zome call', t => {
  const happNick = 'basic-chat'
  withConductor(async client => {
    await doRegisterAgent()
    const {happId, dnaHashes} = await doAppSetup(client, happNick)
    const dnaHash = dnaHashes[0]!
    const agentId = 'some-random-agent-id'
    const call = zomeCaller(client, {happId, agentId, dnaHash, zome: 'chat'})

    const address = await call('register', {
      name: 'chat noir',
      avatar_url: null,
    })
    const result = await call('get_all_public_streams', {})
    t.ok(address)
    t.deepEqual(result, [])
  }).then(t.end)
})


// test('can do hosted zome call', t => {
//   const happNick = 'basic-chat'
//   withConductor(async client => {
//     const {happId, dnaHashes} = await doAppSetup(client, happNick)
//     const dnaHash = dnaHashes[0]!
//     const agentId = 'some-random-agent-id'
//     const result = await callWhenConnected(client, 'holo/call', {
//       happId, agentId, dnaHash,
//       zome: 'chat',
//       function: 'get_all_public_streams',
//       params: {},
//       signature: 'TODO',
//     })
//     t.equal(result, 'syke!!')
//   }).then(t.end)
// })

