module.exports = {
  branches: [
    'main',
    'next',
    {
      name: 'develop',
      channel: 'alpha',
      prerelease: 'alpha',
    },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          {
            type: 'refactor',
            release: 'patch',
          },
          {
            type: 'docs',
            scope: 'README',
            release: 'patch',
          },
          {
            type: 'test',
            release: 'patch',
          },
          {
            type: 'style',
            release: 'patch',
          },
          {
            type: 'perf',
            release: 'patch',
          },
          {
            type: 'ci',
            release: 'patch',
          },
          {
            type: 'build',
            release: 'patch',
          },
          {
            type: 'chore',
            release: 'patch',
          },
          {
            type: 'no-release',
            release: false,
          },
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
        writerOpts: {
          commitsSort: ['subject', 'scope'],
        },
        presetConfig: {
          types: [
            {
              type: 'feat',
              section: ':sparkles: Features',
              hidden: false,
            },
            {
              type: 'fix',
              section: ':bug: Fixes',
              hidden: false,
            },
            {
              type: 'docs',
              section: ':memo: Documentation',
              hidden: false,
            },
            {
              type: 'style',
              section: ':barber: Code-style',
              hidden: false,
            },
            {
              type: 'refactor',
              section: ':zap: Refactor',
              hidden: false,
            },
            {
              type: 'perf',
              section: ':fast_forward: Performance',
              hidden: false,
            },
            {
              type: 'test',
              section: ':white_check_mark: Tests',
              hidden: false,
            },
            {
              type: 'ci',
              section: ':repeat: CI',
              hidden: false,
            },
            {
              type: 'chore',
              section: ':repeat: Chore',
              hidden: false,
            },
            {
              type: 'build',
              section: ':wrench: Build',
              hidden: false,
            },
          ],
        },
      },
    ],
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
}
