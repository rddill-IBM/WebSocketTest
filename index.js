/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Zero to Blockchain */

'use strict';
const express = require('express');
const http = require('http');
var webSocketServer = require('websocket').server;
// const https = require('https');
const path = require('path');
const fs = require('fs');
const mime = require('mime');
const bodyParser = require('body-parser');
const cfenv = require('cfenv');

const cookieParser = require('cookie-parser');
// const session = require('express-session');

// const vcapServices = require('vcap_services');
// const uuid = require('uuid');
const env = require('./controller/envV2.json');
const sessionSecret = env.sessionSecret;
const appEnv = cfenv.getAppEnv();
const app = express();
const busboy = require('connect-busboy');
app.use(busboy());

// list of currently connected clients (users)
var clients = [ ];

// the session secret is a text string of arbitrary length which is
//  used to encode and decode cookies sent between the browser and the server
/**
for information on how to enable https support in osx, go here:
  https://gist.github.com/nrollr/4daba07c67adcb30693e
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
**/

app.use(cookieParser(sessionSecret));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('appName', 'z2b-chapter13');
process.title = 'Z2B-C13';
app.set('port', appEnv.port);

app.set('views', path.join(__dirname + '/HTML'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/HTML'));
app.use(bodyParser.json());

// Define your own router file in controller folder, export the router, add it into the index.js.
// app.use('/', require("./controller/yourOwnRouter"));

app.use('/', require('./controller/restapi/router'));


var server = http.createServer();
/**
 * WebSocket server
 */
    app.locals.wsServer = new webSocketServer({httpServer: server});
    app.locals.wsServer.on('request', function(request) 
    {
        console.log((new Date()) + ' Connection from origin '+ request.origin + '.');
        app.locals.connection = request.accept(null, request.origin); 
        // we need to know client index to remove them on 'close' event
        app.locals.index = clients.push(app.locals.connection) - 1;
        console.log((new Date()) + ' Connection accepted.');
        app.locals.connection.on('message', function(message) 
        {
            console.log((new Date()) + ' Received Message: ' + message.utf8Data);
            var obj = 
            {
                time: (new Date()).getTime(),
                text: message.utf8Data,
                author: request.origin,
                color: 'blue'
            };
            // broadcast message to all connected clients
            var json = JSON.stringify({ type:'message', data: obj });
            app.locals.processMessages(json);
        });

    // user disconnected
    app.locals.connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
        console.log((new Date()) + " Peer "
            + connection.remoteAddress + " disconnected.");

        // remove user from the list of connected clients
        clients.splice(index, 1);
        // push back user's color to be reused by another user
        }
    });
});

function processMessages (_jsonMsg)
{
    for (var i=0; i < clients.length; i++) {clients[i].sendUTF(_jsonMsg);}
}
app.locals.processMessages = processMessages;
/*
let server = http.createServer();
console.log('Listening locally on port %d', appEnv.port);
app.locals.sockets = new ws.Server( { server: server } );
app.locals.sockets.on( 'error', function( error )
{ console.log(error);});
app.locals.sockets.on( 'connection', function( client )
{
    console.log( 'Connection requested.' );
    // Echo messages to all clients
    client.on( 'message', function( message )
    {
        for( let c = 0; c < app.locals.sockets.clients.length; c++ )
        {
            app.locals.sockets.clients[c].send( message );
        }
    });
});
app.locals.sockets.on('message', function(message){app.locals.sockets.send(message);});
app.locals.sockets.on('request', function(request)
    {console.log((new Date()) + ' Connection from origin '+ request.origin + '.');
    app.locals.connection = request.accept(null, request.origin);
    app.locals.connection.on('message', function(message) 
    {
        console.log((new Date()) + ' Received Message from '+ userName + ': ' + message.utf8Data);
    });
});
*/

server.on( 'request', app );
server.listen(appEnv.port, function() {console.log('Listening locally on port %d', server.address().port);});
/**
 * load any file requested on the server
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @function
 */
function loadSelectedFile(req, res) {
    let uri = req.originalUrl;
    let filename = __dirname + '/HTML' + uri;
    fs.readFile(filename,
        function(err, data) {
            if (err) {
                console.log('Error loading ' + filename + ' error: ' + err);
                return res.status(500).send('Error loading ' + filename);
            }
            let type = mime.lookup(filename);
            res.setHeader('content-type', type);
            res.writeHead(200);
            res.end(data);
        });
}
