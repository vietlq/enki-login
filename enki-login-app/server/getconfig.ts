export const runtimeEnv = process.env.NODE_ENV || 'dev';
export const runtimeCfg = require(`../../config/config.${runtimeEnv}`);
