## Google Cloud Storage Authentication

Remember to [create a service account](https://cloud.google.com/docs/authentication/getting-started) to set environment variable for GCS pointing to the authentication file (which is in JSON format). Create the account in your project and download its keys file.

> TODO full permissions list required for project?
For this application, the project must have permissions for managing storage, including `storage.buckets.*` and others.

##### Powershell

```
$env:GOOGLE_APPLICATION_CREDENTIALS="path/to/file.json"
```

##### Linux

```
export GOOGLE_APPLICATION_CREDENTIALS="path/to/file.json"
```

## Redis

If on Windows, check if Redis is already running as a service (which you may have agreed to if you installed Redis through an MSI).

## TODO
* Redis client integration
* Test full upload/download cycle
* Test progress tracking callback (can receive messages)
* Test progress tracking callback (can write to store guaranteed within level of latency)
* Consolidate build files into dist folder
* Get a cost object for testing Google Cloud Storage