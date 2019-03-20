/**
 * Server for Holo
 *
 * Accepts requests similar to what the Conductor
 */

import * as express from 'express'
import {Client, Server as RpcServer} from 'rpc-websockets'

import {uiIdFromHappId} from './common'
import * as C from './config'
import installHapp, {InstallHappRequest, listHoloApps} from './flows/install-happ'
import zomeCall, {CallRequest} from './flows/zome-call'
import newAgent, {NewAgentRequest} from './flows/new-agent'
import ConnectionManager from './connection-manager'

const successResponse = { success: true }

export default (port) => new Promise((fulfill, reject) => {
  // clients to the interface served by the Conductor
  const masterClient = getMasterClient()
  const publicClient = getPublicClient()
  const internalClient = getInternalClient()
  console.debug("Connecting to admin and happ interfaces...")

  const intrceptr = new IntrceptrServer({masterClient, publicClient, internalClient})
  intrceptr.start(port)
})

const clientOpts = { max_reconnects: 0 }  // zero reconnects means unlimited
export const getMasterClient = () => new Client(`ws://localhost:${C.PORTS.masterInterface}`, clientOpts)
export const getPublicClient = () => new Client(`ws://localhost:${C.PORTS.publicInterface}`, clientOpts)
export const getInternalClient = () => new Client(`ws://localhost:${C.PORTS.internalInterface}`, clientOpts)

type SigningRequest = {
  entry: Object,
  callback: (Object) => void
}

const verifySignature = (entry, signature) => true

const fail = (e) => {
  console.error("intrceptr request failure:", e)
  return e
}

/**
 * A wrapper around a rpc-websockets Server and Client which brokers communication between
 * the browser user and the Conductor. The browser communicates with the Server, and the Client
 * is used to make calls to the Conductor's Websocket interface.
 */
export class IntrceptrServer {
  server: any
  clients: {[s: string]: any}  // TODO: move masterClient to separate admin-only server that's not publicly exposed!??
  nextCallId = 0
  signingRequests = {}
  connections: ConnectionManager

  constructor({masterClient, publicClient, internalClient}) {
    this.clients = {
      master: masterClient,
      public: publicClient,
      internal: internalClient,
    }
  }

  start = async (port) => {
    let httpServer, wss
    this.connections = new ConnectionManager({
      connections: ['master', 'public', 'internal'],
      onStart: async () => {
        console.log("Beginning server startup")
        httpServer = await this.buildHttpServer(this.clients.master)
        console.log("HTTP server initialized")
        wss = await this.buildWebsocketServer(httpServer)
        console.log("WS server initialized")
        await httpServer.listen(port, () => console.log('HTTP server running on port', port))
        wss.on('listening', () => console.log("Websocket server listening on port", port))
        wss.on('error', data => console.log("<C> error: ", data))
      },
      onStop: () => {
        httpServer.close()
        wss.close()
      },
    })

    Object.keys(this.clients).forEach(name => {
      const client = this.clients[name]
      client.on('open', () => this.connections.add(name))
      client.on('close', () => this.connections.remove(name))
    })

    this.server = wss
  }

  /**
   * Close the client connections
   */
  close() {
    Object.values(this.clients).forEach((client) => client.close())
  }


  buildHttpServer = async (masterClient) => {
    const app = express()

    await this.connections.ready()
    const happs = await listHoloApps()
    const uis = await masterClient.call('admin/ui/list')
    const uisById = {}

    for (const ui of uis) {
      uisById[ui.id] = ui
    }
    happs.forEach(({happId}) => {
      const ui = uisById[uiIdFromHappId(happId)]
      if (ui) {
        const dir = ui.root_dir
        const hash = ui.id  // TODO: eventually needs to be hApp hash!
        // This is a problem for webpages withs static assets!!!
        // They are expecting to retrieve from / not /{happId}
        app.use(`/${happId}`, express.static(dir)) // will error if multiple apps are hosted
        console.log(`serving UI for '${happId}' from '${dir}'`)
      } else {
        console.warn(`App '${happId}' has no UI, skipping...`)
      }
    })

    // TODO: redirect to ports of conductor UI interfaces
    return require('http').createServer(app)
  }

  buildWebsocketServer = async (httpServer) => {
    const wss = new RpcServer({server: httpServer})

    wss.register('holo/identify', this.identifyAgent)

    wss.register('holo/clientSignature', this.clientSignature)

    wss.register('holo/call', this.zomeCall)

    // TODO: something in here to update the agent key subscription? i.e. re-identify?
    wss.register('holo/agents/new', this.newHostedAgent)

    return wss
  }


  // TODO: service log signature endpoint


  identifyAgent = ({agentId}, ws) => {
    // TODO: also take salt and signature of salt to prove browser owns agent ID
    console.log("adding new event to server", `agent/${agentId}/sign`)
    try {
      this.server.event(`agent/${agentId}/sign`)
    } catch (e) {
      if (e.message.includes('Already registered event')) {
        console.log('welcome back', agentId)
      } else {
        throw e
      }
    }

    console.log('identified as ', agentId)
    return { agentId }
  }

  clientSignature = ({signature, requestId}) => {
    const {entry, callback} = this.signingRequests[requestId]
    verifySignature(entry, signature)
    callback(signature)
    delete this.signingRequests[requestId]
    return successResponse
  }

  newHostedAgent = async ({agentId, happId}) => {
    const signature = 'TODO'
    await newAgent(this.clients.master)({agentId, happId, signature})
    return successResponse
  }

  zomeCall = (params: CallRequest) => {
    return zomeCall(this.clients.public, this.clients.internal)(params).catch(fail)
  }


  /**
   * Function to be called externally, registers a signing request which will be fulfilled
   * by the `holo/clientSignature` JSON-RPC method registered on this server
   */
  startHoloSigningRequest(agentId: string, entry: Object, callback: (Object) => void) {
    const id = this.nextCallId++
    // if (!(agentId in this.sockets)) {
    //   throw "Unidentified agent: " + agentId
    // }
    this.server.emit(`agent/${agentId}/sign`, {entry, id})
    this.signingRequests[id] = {entry, callback}
  }

}
