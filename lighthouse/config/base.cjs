module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
      startServerReadyPattern: 'Local:',
      chromePath: require('@playwright/test').chromium.executablePath(),
      settings: { chromeFlags: '--headless --no-sandbox' },
      url: ['http://127.0.0.1:4173/', 'http://127.0.0.1:4173/nfts/emerald-ape-042'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:accessibility': ['warn', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:best-practices': ['warn', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:seo': ['warn', { minScore: 0.9, aggregationMethod: 'median' }],
      },
    },
    upload: { target: 'filesystem', outputDir: './lighthouse/reports/mobile' },
  },
}
