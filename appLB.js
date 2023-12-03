/* **************************************************************************************************************************************
#  * app.js                                                                                                                             *
#  **************************************************************************************************************************************
#  *                                                                                                                                    *
#  * @License Starts                                                                                                                    *
#  *                                                                                                                                    *
#  * Copyright © 2023. MongoExpUser.  All Rights Reserved.                                                                              *
#  *                                                                                                                                    *
#  * License: MIT - https://github.com/Nodejs-Load-Balancer-On-EC2/blob/main/LICENSE                                                    *
#  *                                                                                                                                    *
#  * @License Ends                                                                                                                      *
#  **************************************************************************************************************************************
# *                                                                                                                                     *
# *  Project: NodeJS Load Balancer                                                                                                      *
# *                                                                                                                                     *
# *  This module deploys a simple Vanilla NodeJS HTTP or HTTPS Load Balancer Server that:                                               *
# *                                                                                                                                     *
# *     1)  Depends on no external framework.                                                                                           *
# *     2)  Sits in front of Web Servers or Application Servers and distributes requests.                                               *
# *     3)  Uses only native Node.js modules (https, http, fetch, os, util, path, cluster, fs, and events.)                             *
# *                                                                                                                                     *                                                                                                                            *
# *  Note:                                                                                                                              *
# *     1) Node.js version: 19+                                                                                                         *
# *     2) Invoke as:sudo node --inspect=$((9233 + $RANDOM % 100)) --trace-warnings --trace-deprecation --watch appLB.js                *
# *                                                                                                                                     *
# **************************************************************************************************************************************/


class LoadBalancer
{
    constructor()
    {
        // import imodules
        const events   = require("events");                                
        events.EventEmitter.defaultMaxListeners = 0;
        const fs = require("fs");                     
        const os = require("os");
        const util = require("util");
        const https = require("https");                                    
        const http = require("http");
        const path = require("path");
        const cluster = require("cluster");
        const scriptPath = path.resolve(__dirname, "common.js"); 
        let createdMiddlewares = require(`${scriptPath}`);
        const LoggerMiddleware = new createdMiddlewares.LoggerMiddleware();
                  
        // define local variables
        const config = JSON.parse(fs.readFileSync("config.json"));
        const port = config.port;
        const tlsPort = config.tlsPort;
        const host = config.host;
        let objs = require(`${scriptPath}`); 
        const lblServers = config.lblServers;
        const lblServersLength = lblServers.length;
        let count = 0;

     
        (function createServer()
        {
            if(cluster.isPrimary)
            {
                objs.commonClusterStartPrimary(cluster, os, util);
            }
            else
            {
                function handleNonTLSRequests(request, response)
                {
                    objs.commonEnforceTLS(request, response);
                }

                function handleTLSRequests(request, response) 
                {
                    // logger middleware: logs and save all load balancer requests
                    LoggerMiddleware(request, response);  
                    
                    const requestUrl = request.url; 
                    const selectServer = lblServers[count];
                    const lblUrl = `${selectServer}${requestUrl}`;

                    // update server count for next request
                    count === (lblServersLength-1)? count = 0 : count++ 
                    
                    (async function lblResponse()
                    {
                        response.write("");
                        const method = (request.method).toUpperCase(); 
                        const options =  { method: method }; 
                        const lbResponse = await fetch(lblUrl, options);
                        const html = await lbResponse.text();
                        response.end(html);
                    }());
                }

                const server = http.createServer(handleNonTLSRequests);
                const tlsServer = https.createServer(objs.commonOptionsTLS(), handleTLSRequests);
                server.listen(port, function listenOnServer() { console.log(`Non-TLS redirect server is listening on http://${host}:${port}/ ...`) }).setMaxListeners(0);  
                tlsServer.listen(tlsPort, function listenOnServer() { console.log(`TLS server is listening on https://${host}:${tlsPort}/ ...`) }).setMaxListeners(0);   
            }

        }());
    }
}

new LoadBalancer();

module.exports = { LoadBalancer };
