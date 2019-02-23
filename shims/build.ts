import * as fs from 'fs'
import * as path from 'path'
import {execSync} from 'child_process'
import {bundle} from '../src/common'

const happs = ['./shims/happs/simple-app']

happs.forEach(dir => {
  try {
    fs.unlinkSync(path.join(dir, 'ui.tar'))
  } catch {}

  console.log('Packaging DNA...')
  execSync(`cd ${dir} && hc package`)
  console.log('Bundling UI...')
  bundle(path.join(dir, 'ui'), path.join(dir, 'ui.tar'))
})
console.log('All done!')
