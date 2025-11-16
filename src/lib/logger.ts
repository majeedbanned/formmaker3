// Simple logger for tracking database connections and errors
// Can be replaced with a more robust solution like winston if needed

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const logToConsole = (level: LogLevel, message: string, optionalParams: unknown[] = []) => {
  const timestamp = new Date().toISOString();
  const logObject: LogMessage = {
    level,
    message,
    timestamp,
  };

  if (optionalParams.length > 0) {
    logObject.context = { details: optionalParams };
  }

  // Format based on level
  switch (level) {
    case 'error':
      console.error(`[ERROR][${timestamp}]`, message, ...optionalParams);
      break;
    case 'warn':
      console.warn(`[WARN][${timestamp}]`, message, ...optionalParams);
      break;
    case 'debug':
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[DEBUG][${timestamp}]`, message, ...optionalParams);
      }
      break;
    case 'info':
    default:
      // console.log(`[INFO][${timestamp}]`, message, ...optionalParams);
  }

  // Here we could add additional logging mechanisms like:
  // - Writing to a file
  // - Sending to a monitoring service
  // - Storing in database
  return logObject;
};

export const logger = {
  info: (message: string, ...optionalParams: unknown[]) => 
    logToConsole('info', message, optionalParams),
  
  warn: (message: string, ...optionalParams: unknown[]) => 
    logToConsole('warn', message, optionalParams),
  
  error: (message: string, ...optionalParams: unknown[]) => 
    logToConsole('error', message, optionalParams),
  
  debug: (message: string, ...optionalParams: unknown[]) => 
    logToConsole('debug', message, optionalParams),
}; 