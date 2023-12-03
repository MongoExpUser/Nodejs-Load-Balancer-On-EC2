
## Nodejs-Load-Balancer-On-EC2

Load Balancing of Web or Application Servers with a NodeJS load balancer (lb) application.

## Architectural Diagram
![Image description](https://github.com/MongoExpUser/Nodejs-Load-Balancer-on-EC2/blob/main/nodejs-lb-arch-digram.png)

    
## Purpose
 * Load Balancing of Web or Application Servers on AWS EC2 machine.
 * The current demonstration is for an AWS EC2 instance but the NodeJS application can be run on any cloud provider VM e.g (Linode, GCP, Azure, OCI, DO, etc.) as long as the network is properly set up.


## Advantages
  * Fast.
  * Cheaper.
  * Easy to deploy.
  * Load requests across multiple machines globally.


## Install Dependency
* NodeJS 19+ or above (https://nodejs.org/en/download)

##  Run App
* To run the load balancing app: <br>
  - Download the following source files in this repository: <br>
    - <strong> appLB.js </strong> <br>
    - <strong> common.js </strong> <br>
    - <strong> config.json </strong> <br>
  - Edit relevant input variables within the <strong> config.json </strong> file, as deem necessary. <br>
  - Upload the source files to the same folder on an AWS EC2 machine. <br>
  - Then, run the appLB.js script from within the folder as: <br> <strong> sudo node --inspect=$((9233 + $RANDOM % 100)) --trace-warnings --trace-deprecation --watch appLB.js </strong>
  

# License
Copyright © 2023. MongoExpUser
