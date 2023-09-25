/**
 * Environments variables declared here.
 */

/* eslint-disable node/no-process-env */


import process from "process";

export default {
  NodeEnv: (process.env.NODE_ENV ?? ''),
  Port: (process.env.PORT ?? 0),
  projectId: process.env.PROJECT_ID ?? '',
  clientEmail: process.env.CLIENT_EMAIL ?? '',
  privateKey: process.env.PRIVATE_KEY ?? '',
  DOCID: process.env.DOCID ?? '',
  Password: process.env.PASSWORD ?? '',

} as const;
