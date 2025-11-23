import pino from 'pino';
import { config } from '../config/env.js';

const logger = pino({
  level: config.logging.level,
  transport: config.env === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export default logger;
