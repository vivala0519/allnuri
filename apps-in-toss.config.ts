import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'allnuri',
  brand: { primaryColor: '#bd4b12' },
  navigationBar: { withBackButton: true, withHomeButton: true, theme: 'light' },
  webView: { allowsBackForwardNavigationGestures: true },
  permissions: [],
  webBundleDir: 'dist',
});
