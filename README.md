CodeCosmos - Coding for the classroom
=====================================

CodeCosmos is a browser-based programming environment for classroom use.

# HACKING

Build distribution of codecosmos:

```bash
$ npm install
```

Run a local couchdb with the [couchperuser](https://github.com/etrepum/couchperuser) plugin installed. CORS
headers should be enabled (see http://pouchdb.com/getting-started.html).

```bash
export HOST="http://username:password@127.0.0.1:5984"
curl -X PUT "$HOST/_config/httpd/enable_cors" -d '"true"'
curl -X PUT "$HOST/_config/cors/origins" -d '"*"'
curl -X PUT "$HOST/_config/cors/credentials" -d '"true"'
curl -X PUT "$HOST/_config/cors/methods" -d '"GET,PUT,POST,HEAD,DELETE,OPTIONS"'
curl -X PUT "$HOST/_config/cors/headers" -d \
  '"accept,authorization,content-type,origin,x-requested-with"'
```

Develop in-place (recommended to avoid appcache issues):

```bash
$ (cd www; python -mSimpleHTTPServer)
```
