//--------------------------------------------------------------------------------------------------
// Typings:
//--------------------------------------------------------------------------------------------------
/// <reference path="../../typings/index.d.ts" />


//--------------------------------------------------------------------------------------------------
// Lax or Strict for this File?
//--------------------------------------------------------------------------------------------------
"use strict";


//--------------------------------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------------------------------
//--------------------------------------------
// Node Libraries:
//--------------------------------------------
import * as express from "express";


//--------------------------------------------------------------------------------------------------
// Module Section
//--------------------------------------------------------------------------------------------------
module SystemRoute
{
    //----------------------------------------------------------------------------------------------
    // Class Section
    //----------------------------------------------------------------------------------------------
    export class HealthController
    {

        //------------------------------------------------------------------------------------------
        // Routes Section
        //------------------------------------------------------------------------------------------
        public checkHealth(req: express.Request, res: express.Response, next: express.NextFunction)
        {
              //--------------------------------------------------------------------------------
              // WS Response:
              //--------------------------------------------------------------------------------
              res.writeHead(200);
              res.end();
        }
    }
}

//--------------------------------------------------------------------------------------------------
// Export Module Section
//--------------------------------------------------------------------------------------------------
export = SystemRoute;
