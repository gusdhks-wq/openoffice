import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function configureAndroid(app: string = resolve(import.meta.dirname, '..')) {
  const java = resolve(app, 'android/app/src/main/java/com/ieumoffice/mobile/prototype')
  const activityPath = resolve(java, 'MainActivity.java')
  if (!existsSync(activityPath))
    throw new Error('Generate the Android project with android:add first.')
  let activity = readFileSync(activityPath, 'utf8')
  if (!activity.includes('registerPlugin(DriveAuthorizationPlugin.class)')) {
    const original = 'public class MainActivity extends BridgeActivity {}'
    if (!activity.includes(original))
      throw new Error(
        'MainActivity has custom changes. Register DriveAuthorizationPlugin manually.',
      )
    activity = activity.replace(
      'import com.getcapacitor.BridgeActivity;',
      'import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;',
    )
    activity = activity.replace(
      original,
      `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DriveAuthorizationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}`,
    )
    writeFileSync(activityPath, activity)
  }
  copyFileSync(
    resolve(app, 'native/android/DriveAuthorizationPlugin.java'),
    resolve(java, 'DriveAuthorizationPlugin.java'),
  )
  const gradle = resolve(app, 'android/app/build.gradle')
  let source = readFileSync(gradle, 'utf8')
  if (!source.includes('com.google.android.gms:play-services-auth:')) {
    if (!source.includes('dependencies {')) throw new Error('Android dependency block not found.')
    source = source.replace(
      'dependencies {',
      'dependencies {\n    implementation "com.google.android.gms:play-services-auth:22.0.0"',
    )
    writeFileSync(gradle, source)
  }
  console.log(
    'Android Drive authorization bridge configured. Set up the Android OAuth client before signing in.',
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  configureAndroid()
