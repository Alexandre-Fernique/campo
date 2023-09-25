/**
 * Setup express server.
 */


import path from 'path';

import express, { Request, Response, NextFunction } from 'express';

import 'express-async-errors';


import EnvVars from '@src/constants/EnvVars';
import HttpStatusCodes from '@src/constants/HttpStatusCodes';

import { NodeEnvs } from '@src/constants/misc';


import { initializeApp, cert } from  'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import NodeCache from "node-cache";
// **** Variables **** //

const app = express();
const nodeCache = new NodeCache()
initializeApp({
  credential: cert({
    projectId: EnvVars.projectId,
    clientEmail: EnvVars.clientEmail,
    privateKey: EnvVars.privateKey
  }),
})
const db = getFirestore();

// **** Setup **** //

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));




// Add error handler
app.use((
  err: Error,
  _: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if (EnvVars.NodeEnv !== NodeEnvs.Test.valueOf()) {
    console.error(err);
  }
  let status = HttpStatusCodes.BAD_REQUEST;

  return res.status(status).json({ error: err.message });
});


// ** Front-End Content ** //

const getUrl = async () => {
  if (nodeCache.has("url")) {
    return nodeCache.get("url")
  }
  const data = await db.collection("campo").doc("alpha").get()
  const url = data.get("url")
  nodeCache.set("url",url)
  return url
}

app.get('/', async (_: Request, res: Response) => {
    const url = await getUrl()
    return res.redirect(url);

});
app.get('/url', async (req: Request, res: Response) => {

  const url = await getUrl()

  return res.status(200).json({url});
});

app.post('/changeurl', async (req: Request, res: Response) => {
  const docRef = db.collection("campo").doc(EnvVars.DOCID)
  if(req.body.password === EnvVars.Password ) {
    await docRef.set({
      url: req.body.url,
    });
    nodeCache.set("url",req.body.url)

    return res.sendStatus(200)
  }
  return res.sendStatus(400)
});

// Set static directory (js and css).
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));



// Redirect to login if not logged in.
app.get('/changeurl', (_: Request, res: Response) => {
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});


// **** Export default **** //

export default app;
