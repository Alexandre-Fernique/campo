/**
 * Setup express server.
 */


import path from 'path';

import express from 'express';
import serverless from 'serverless-http';

import { initializeApp, cert } from  'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import NodeCache from "node-cache";
// **** Variables **** //
const app = express();
const nodeCache = new NodeCache()
initializeApp({
  credential: cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/gm, "\n")
  }),
})
const db = getFirestore();

// **** Setup **** //

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));




// Add error handler
app.use((
  err,
  _,
  res,
  next,
) => {
  if (process.env.NodeEnv !== NodeEnvs.Test.valueOf()) {
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

app.get('/', async (_, res) => {
  const url = await getUrl()
  return res.redirect(url);

});
app.get('/url', async (req, res) => {

  const url = await getUrl()

  return res.status(200).json({url});
});

app.post('/changeurl', async (req, res) => {
  const docRef = db.collection("campo").doc(process.env.DOCID)
  if(req.body.password === process.env.PASSWORD ) {
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




app.get('/changeurl', (_, res) => {
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});


// **** Export default **** //
export const handler = serverless(app);
