module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Code style changes (formatting, etc)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'chore',    // Build process or auxiliary tool changes
        'ci',       // CI configuration changes
        'build',    // Build system or external dependencies
        'revert',   // Reverts a previous commit
        'release',  // Release-related changes
      ],
    ],
    'scope-enum': [2, 'always', [
      'ssh',       // SSH-related changes
      'sftp',      // SFTP-related changes
      'vault',     // Credential vault changes
      'ai',        // AI assistant changes
      'ui',        // UI/UX changes
      'terminal',  // Terminal emulator changes
      'security',  // Security-related changes
      'auth',      // Authentication changes
      'crypto',    // Cryptography changes
      'database',  // Database changes
      'build',     // Build system changes
      'ci',        // CI/CD changes
      'deps',      // Dependency updates
      'config',    // Configuration changes
      'docs',      // Documentation changes
      'release',   // Release-related changes
    ]],
    'subject-case': [0], // Allow any case for commit subject
    'body-max-line-length': [0], // Disable body line length check
    'footer-max-line-length': [0], // Disable footer line length check
  },
};