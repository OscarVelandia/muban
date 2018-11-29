const config = require('../config');
if (!process.env.NODE_ENV) process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV);
const path = require('path');
const express = require('express');
const opn = require('opn');
const https = require('https');
const http = require('http');
const compression = require('compression');
const pem = require('pem');

const projectRoot = path.resolve(__dirname, '../../');

// default port where dev server listens for incoming traffic
const port = 9001;

let started = false;
function start () {
  if (started) return;
  started = true;

  const server = express();
  const root = path.resolve(projectRoot, 'dist/site');

  // handle fallback for HTML5 history API
  server.use(require('connect-history-api-fallback')());
  server.use(compression());

  server.use('/', express.static(root));

  const uri = (config.useHttps ? 'https' : 'http') + '://localhost:' + port;

  const onServerRunning = function(err) {
    if (err) {
      console.log(err);
      return;
    }

    console.log('> Listening at ' + uri + '\n');

    opn(uri);
  };

  if (config.useHttps) {
    pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
      if (err) {
        throw err
      }
      https.createServer({ key: keys.serviceKey, cert: keys.certificate }, server).listen(port, onServerRunning);
      return { server: https, key };
    });
  } else {
    http.createServer(server).listen(port, onServerRunning);
    return { server: http };
  }
}

if (require.main === module) {
  start();
} else {
  module.exports = start;
}
