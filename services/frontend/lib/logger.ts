type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LOG_LEVEL = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info';

function log(level: LogLevel, message: string, ...args: unknown[]) {
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LOG_LEVEL]) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case 'debug':
    case 'info':
      console.log(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'error':
      console.error(prefix, message, ...args);
      break;
  }
}

export const logger: Logger = {
  debug: (...args) => log('debug', args[0] as string, ...args.slice(1)),
  info: (...args) => log('info', args[0] as string, ...args.slice(1)),
  warn: (...args) => log('warn', args[0] as string, ...args.slice(1)),
  error: (...args) => log('error', args[0] as string, ...args.slice(1)),
};
