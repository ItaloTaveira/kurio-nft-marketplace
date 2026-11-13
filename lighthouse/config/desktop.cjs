const base = require('./base.cjs')
module.exports = {
  ci: {
    ...base.ci,
    collect: { ...base.ci.collect, settings: { ...base.ci.collect.settings, preset: 'desktop' } },
    upload: { target: 'filesystem', outputDir: './lighthouse/reports/desktop' },
  },
}
