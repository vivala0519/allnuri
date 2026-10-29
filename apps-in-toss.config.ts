import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'allnuri',
  brand: { primaryColor: '#18795f' },
  navigationBar: { withBackButton: true, withHomeButton: true, theme: 'light' },
  webView: { allowsBackForwardNavigationGestures: true },
  permissions: [],
  webBundleDir: 'dist',
});
