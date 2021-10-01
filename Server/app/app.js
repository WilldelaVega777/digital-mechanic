//---------------------------------------------------------------
// Use Strict
//---------------------------------------------------------------
"use strict";

//---------------------------------------------------------------
//module dependencies.
//---------------------------------------------------------------
var app     = require("./appMain");
var debug   = require("debug")("express:server");
var http    = require("http");
var fs      = require('fs');
var path    = require('path');


//---------------------------------------------------------------
// OpenShift Environment:
//---------------------------------------------------------------
const env   = process.env;


//---------------------------------------------------------------
// Get Port from environment and store in Express:
//---------------------------------------------------------------
app.set("port", env.NODE_PORT || 8070);


//---------------------------------------------------------------
// Create Http Server
//---------------------------------------------------------------
var server = http.createServer(app);


//---------------------------------------------------------------
// Listen on provided ports
//---------------------------------------------------------------
// Se debe de utilizar una IP interna de (LAN) para probar 
// con dispositivos móviles conectados a la misma LAN.
server.listen(env.NODE_PORT || 8070, env.NODE_IP || '192.168.1.70',
    function ()
    {
      console.log('El servidor de "Digital Mechanic" ha iniciado...'); 
    }
);