import express from "express";
import * as https from "https";
import * as fs from "fs";
import { v4 as uuidv4 } from 'uuid';

import cache from "./utils/token_cache"
import progress from "./utils/progress_cache"
import upload from "./utils/upload"
import auth from "./utils/auth"

import path from "path"
import fileUpload from "express-fileupload"

const config = require("./config");
const loadedConfig = config.loadConfig();

const app = express();
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));


// Token Caches
// Progress Token Cache
// Authentication Token Cache
// TODO: Test out with local caches, then move on to using Redis services
// TODO: Write Redis token cache interfaces!

// Event Streams
// Redis Event Store
// Actors reading event store and dispatching events

// explicitly reference configuration
const googleUploader = new upload.GoogleUploadClient({
    bucket: loadedConfig.google.storage.bucket
});

app.get('/', async (req: any, res: any) => {
    res.sendFile(path.join(__dirname, 'index.html'));
})

const progressCache = new progress.ProgressCache('progress', new cache.LocalTokenCache(0));

app.post('/upload', async (req, res) => {
    let request: any = req;
    const token = auth.obscurePassword(request.files.filename.name);
    googleUploader.upload_file(
        request.files.filename.tempFilePath, 
        request.files.filename.name, 
        function (progressEvent) {
            progressCache.setProgress(
                token, 
                progressEvent.bytesWritten,
                request.files.filename.size
            )
            console.log(progressCache.getProgress(token))
            return progressCache.getProgress(token);
        });
    res.send(200);
});

app.get('/uploads/progress/:token', async (req, res) => {
    let prog = progressCache.getProgress(req.params.token);
    res.send(prog);
})

app.post('/start_upload/', async (req, res) => {
    let request: any = req; 
    let { files, body: { file, metadata } } = request;
    let authentication_token = req.header('x-auth');

    let authenticated: Boolean;
    // TODO: authenticate with AWT validation here
    // Produce AWT, mimic into cache, check against cache each time if x-auth header exists
    // TODO: find way to get value of x-auth header
    authenticated = true;  // use x-auth here

    if (authenticated) {

        const token = auth.obscurePassword(files.filename.name);
        const storageKey = (filename: string, metadata?: object) => `${filename}`; // TODO: make a sensible (configurable?) path out of this
        
        // send upload request to self/create upload in second thread (promised)
        googleUploader.upload_file(
            files.filename.tempFilePath,          // location of uploadable file on client machine
            storageKey(files.filename.name),      // name of the file on client machine (replacable?) => TODO: extend into filepath, using metadata
            // progress event callback => keep track of progress in token store
            function (progressEvent) {
                progressCache.setProgress(
                    token, 
                    progressEvent.bytesWritten,
                    files.filename.size
                )
                return progressCache.getProgress(token);
            });

        // sending back the token on successful upload instance will allow client to query token store for progress
        res.send(token);

    } else {
        res.send(403);
    }

});

const port = loadedConfig.port;
https.createServer({
    key: fs.readFileSync(`${loadedConfig.https.key}`),
    cert: fs.readFileSync(`${loadedConfig.https.cert}`)
}, app).listen(port, () => {
    console.log('[HTTPS] App started on port:', port)
})