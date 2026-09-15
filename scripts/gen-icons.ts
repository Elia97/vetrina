#!/usr/bin/env node
import process from 'node:process'

import { SITE } from '../src/lib/site.ts'
import { writeIcons } from './lib/icons.ts'

for (const { path, bytes } of await writeIcons(process.cwd(), SITE.themeColor.light)) {
  console.log(`${path}  ${(bytes / 1024).toFixed(1)} KB`)
}
