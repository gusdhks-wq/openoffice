import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { configureAndroid } from '../scripts/configure-android'

function project() {
  const root = mkdtempSync(join(tmpdir(), 'genoffice-mobile-native-'))
  const java = join(root, 'android/app/src/main/java/com/ieumoffice/mobile/prototype')
  mkdirSync(java, { recursive: true })
  mkdirSync(join(root, 'native/android'), { recursive: true })
  writeFileSync(
    join(java, 'MainActivity.java'),
    'package com.ieumoffice.mobile.prototype;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity {}',
  )
  writeFileSync(
    join(root, 'native/android/DriveAuthorizationPlugin.java'),
    '// native bridge fixture',
  )
  writeFileSync(join(root, 'android/app/build.gradle'), 'dependencies {\n}')
  return { root, java }
}

describe('generated Android authorization setup', () => {
  it('registers the native bridge once and preserves all subsequent native customizations', () => {
    const { root, java } = project()
    try {
      configureAndroid(root)
      const activityPath = join(java, 'MainActivity.java')
      const first = readFileSync(activityPath, 'utf8')
      expect(first).toContain('registerPlugin(DriveAuthorizationPlugin.class)')
      expect(first.indexOf('registerPlugin(')).toBeLessThan(first.indexOf('super.onCreate('))
      writeFileSync(activityPath, first + '\n// custom native change')
      configureAndroid(root)
      expect(readFileSync(activityPath, 'utf8')).toBe(first + '\n// custom native change')
      expect(
        readFileSync(join(root, 'android/app/build.gradle'), 'utf8').match(/play-services-auth/g),
      ).toHaveLength(1)
      expect(readFileSync(join(java, 'DriveAuthorizationPlugin.java'), 'utf8')).toBe(
        '// native bridge fixture',
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  it('refuses to overwrite an unrecognized customized MainActivity', () => {
    const { root, java } = project()
    try {
      writeFileSync(join(java, 'MainActivity.java'), '// previously customized activity')
      expect(() => configureAndroid(root)).toThrow('custom changes')
      expect(readFileSync(join(java, 'MainActivity.java'), 'utf8')).toBe(
        '// previously customized activity',
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
