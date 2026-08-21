import { existsSync, rmSync, writeFileSync } from 'node:fs'

for (const file of ['dist/_redirects', 'dist/_headers']) {
  if (existsSync(file)) rmSync(file, { force: true })
}

writeFileSync('dist/.assetsignore', '_redirects\n_headers\n', 'utf8')
