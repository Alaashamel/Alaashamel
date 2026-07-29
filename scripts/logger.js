const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
};

const currentLevel = (() => {
  const env = process.env.LOG_LEVEL || 'INFO';
  return LOG_LEVELS[env.toUpperCase()] ?? LOG_LEVELS.INFO;
})();

function formatTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, data) {
  const parts = [`[${formatTimestamp()}]`, `[${level}]`, message];
  if (data !== undefined) {
    try {
      parts.push(JSON.stringify(data, null, 0));
    } catch {
      parts.push(String(data));
    }
  }
  return parts.join(' ');
}

export const logger = {
  debug(message, data) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.debug(formatMessage('DEBUG', message, data));
    }
  },

  info(message, data) {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.info(formatMessage('INFO', message, data));
    }
  },

  warn(message, data) {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, data));
    }
  },

  error(message, data) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, data));
    }
  },

  section(title) {
    const line = '='.repeat(60);
    console.info(`\n${line}\n  ${title}\n${line}`);
  },
};
