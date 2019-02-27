import * as StaticServer from 'static-server'

export default (shimPort, uiPort) => {
  const shimServer = new StaticServer({
    rootPath: './src/shims/happs',
    port: shimPort
  })
  console.log('Shim server running on port', shimPort)
  shimServer.start()

  const uiServer = new StaticServer({
    rootPath: './src/shims/ui',
    port: uiPort
  })
  console.log('UI server running on port', uiPort)
  uiServer.start()
}
