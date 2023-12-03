function commonVariables()
{
    const fs = require("fs");  
    const config = JSON.parse(fs.readFileSync("config.json"));
    return {
        pathToTlsFiles : config.pathToTlsFiles,
        tlsOption : config.tlsOption
    }
}


function commonLongDateFormat()
{
    return { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"};
}


function commonOptionsTLS()
{
    const fs  = require("fs");
    const config = JSON.parse(fs.readFileSync("config.json"));
    let tlsPath = commonVariables().pathToTlsFiles;

    if( ((commonVariables().tlsOption === "true")) === true)
    {
        return  {
            ca: fs.readFileSync(`${tlslPath}/${config.ca}`),
            key: fs.readFileSync(`${tlsPath}/${config.key}`),
            cert: fs.readFileSync(`${tlsPath}/${config.cert}`),
        }
    }
}


function commonClusterStartPrimary(cluster, os, util)
{
    // set-up system for multi-core system: launch a cluster of Node.js processes to handle the load on multi-core
    const  extraWorker = 1;
    const numCPUs = os.cpus().length;
    const numWorkers = numCPUs + extraWorker;
    const infCPUs =  os.cpus();
    console.log("  ");
    console.log("Starting Node.js https-server(s)");
    console.log("=================================");
    console.log("Nos. of CPUs     : ", numCPUs);                                          // log the number of CPU/core installed.
    console.log("Nos. of Workers  : ", numWorkers);                                       // log the number of CPU/core installed.
    console.log("Inf. of CPUs  : ", JSON.stringify(infCPUs));                             // log information about each CPU/core installed.
    console.log("Inf. of CPUs     : ");                                                   // log information about each CPU/core installed.
    console.log(util.inspect(infCPUs, false, null) );                                     // log information about each CPU/core installed.
    console.log("   ");
    console.log("I am the Master (" + process.pid + "): now lauching workers!");          // log confirmation of master start-up
    console.log("   ");
    

    // create (fork) workers/processes
    for(let index = 1; index <= numWorkers; index++)
    {
        cluster.fork();                                                                    // create worker
        console.log("Worker No. " + (index) + " Information");                             // log information about each worker
        console.log("=================================");
        console.log("Worker OS CPU architecture  : " + os.arch());                         // log the os CPU/core architecture.
        console.log("Worker OS platform          : " + os.platform());                     // log the os platform/name/type
        console.log("Worker OS release           : " + os.release());                      // log the os release.
        console.log("Worker OS free memory       : " + os.freemem());                      // log the os free memory.
        console.log("Worker OS total memory      : " + os.totalmem());                     // log the os total memory.
        console.log("=================================");
    }

    cluster.on("online", function(worker, code, signal)
    {
        // note: time is GMT
        const pid = worker.process.pid;
        console.log( `I am  a worker (${pid}) now running! GMT is : ${(new Date()).toLocaleTimeString("en-us", commonLongDateFormat())}`  );

    }).setMaxListeners(0); //handles max event emmitter error;

    cluster.on("exit", function(worker, code, signal)
    {
        if(worker.exitedAfterDisconnect === true)           //voluntary exit
        {
            console.log("Voluntary exit – no wahala!");
        }
        else                                                //involuntary/accidental
        {
            const pid = worker.process.pid;
            console.log(`Restarting worker (${pid}) with code: ${code} and signal: ${signal}`);
            cluster.fork();
        }

    }).setMaxListeners(0); //handles max event emmitter error;

    cluster.on("message", function (msgEvent)
    {
        //graceful close (shutdown) of any connections to server
        if (msgEvent === "shutdown")
        {
            const pid = worker.process.pid;
            console.log(`Worker (${pid}) is now disconnected from MASTER/PRIMARY through app termination`);
            process.exit(0);
        }

    }).setMaxListeners(0); //handles max event emmitter error
}


function commonEnforceTLS()
{
    const secure  = request.connection.encrypted;

    if(secure !== true)
    {
        console.log(request.url);
        const requestUrl = request.url;
        const requestHost = request.headers.host;
        const redirectUrl = (`https://${requestHost}${requestUrl}`);
        response.writeHead(301, { Location: redirectUrl });
        console.log("redirectUrl: ", redirectUrl);
        response.writeHead(200, { "Content-Type" : "text/html" });
        response.end();
    }
}


class LoggerMiddleware
{
    constructor(request, response)
    {
        const fs = require("fs");  
        const config = JSON.parse(fs.readFileSync("config.json"));
    
        function commonLongDateFormat()
        {
            return { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"};
        }

        function uuid4()
        {
            let timeNow = new Date().getTime();
            let uuidValue =  'xxxxxxxx-xxxx-7xxx-kxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(constant)
            {
                let random = (timeNow + Math.random() *16 ) % 16 | 0;
                timeNow  = Math.floor(timeNow / 16);
                return (constant === 'x' ? random : (random & 0x3| 0x8)).toString(16);
            });
            
            return uuidValue;
        }


        return function logger(request, response)
        {
            const dns = require("dns");
            const fs  = require("fs");
            const ip = request.connection.remoteAddress; //request.ip;
            const port = config.tlsPort;
                    
            // 0. DNS service look-up for every remote ip address
            dns.lookupService(ip, port, function(dnsLookupError, hostname, service)
            {
                if(dnsLookupError)
                {
                  console.log(dnsLookupError);
                }
                
                // 1. get requested host or domains or subdomains
                const _host = String(request.headers.host);
                const urlOut = String(request.url);
                const dnsIn = String(hostname);
                const dnsOut = String(request.headers.host);
                const storeLog  = true;
                const method = String((request.method).toLowerCase()); 
                
                // 2. create a json/object of request-response objects (uniqueID, ip, method, dns, url and server GMT
                const reqResObj = {
                  method: method,
                  ip: ip,
                  dnsIn: dnsIn,
                  dnsUrlOut: `${dnsOut}${urlOut}`,
                  GMT_ISO: new Date(),
                  GMT_LONG: (new Date()).toLocaleTimeString("en-us", commonLongDateFormat())
                };
                
                // 3. store json/object: create a stream in append mode & write to file (.json)
                if(storeLog === true)
                {
                    const fileName = config.appLoggerFileName;
                    const options = { flags: "a", encoding: "utf-8" }
                    const appLogger = fs.createWriteStream(fileName, options);
                    appLogger.write(`${JSON.stringify(reqResObj)}\n`);
                }
              });
        }
    }
}



module.exports =   { commonVariables, commonLongDateFormat, commonOptionsTLS, commonClusterStartPrimary, commonEnforceTLS, LoggerMiddleware }; 
