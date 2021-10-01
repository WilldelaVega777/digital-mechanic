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
import * as express  from "express";
import * as passport from "passport";
import * as crypto   from "crypto-js";
import * as jwt      from "jwt-simple";
import * as session  from "express-session";


//--------------------------------------------
// Services:
//--------------------------------------------
import { AuthService } from "../services/auth-service";

//--------------------------------------------
// Models:
//--------------------------------------------
import { User }        from "../models/user";


//--------------------------------------------------------------------------------------------------
// Module Section
//--------------------------------------------------------------------------------------------------
module AuthRoute
{
    //----------------------------------------------------------------------------------------------
    // Route Controllers Section
    //----------------------------------------------------------------------------------------------
    export class AuthController
    {
        //------------------------------------------------------------------------------------------
        // Web App Routes:
        //------------------------------------------------------------------------------------------
        // Public WebMethods Section
        //------------------------------------------------------------------------------------------
        // Method for handler JWT Password Strategy on each Request:
        //------------------------------------------------------------------------------------------
        public authenticateAppAction(jwt: any, done)
        {
            let authService = new AuthService();

            authService.getProfile(jwt.id).subscribe((data) => {
                if (!data.error)
                {
                    done(null, data);
                }
                else
                {
                    done(null, false, { message : data.error });
                }
            },
            (error) => {
                done(error, false, { message : error });
            });
        }

        //------------------------------------------------------------------------------------------
        // Authentication Method for the Mobile App
        //------------------------------------------------------------------------------------------
        public appAuthenticate(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            if (!req.body)
            {
                res.status(200).send("No se recibió usuario o password.");
                return
            }
            
            if ((!req.body.username) || (!req.body.password))
            {
                res.status(403).send("No se recibió usuario o password.");
                return
            }

            let username: string = req.body.username;
            let password: string = req.body.password;

            let authService = new AuthService();
            authService.authenticateUser(username, crypto.MD5(password)).subscribe((data) => {
                if (!data.error)
                {
                    let token: string = jwt.encode(data, "el-dulce-gato-se-mea");
                    data.token = 'JWT ' + token;
                    res.json({success: true, user: data});
                }
                else
                {
                    console.log(data);
                    res.send({success: false, msg: 'Authentication failed. Wrong password.'});
                }
            },
            (error) => {
                console.log(error);
                res.send({success: false, msg: 'Authentication failed. Wrong password.'});
            });
        }

        //------------------------------------------------------------------------------------------
        // For Manual Check:
        //------------------------------------------------------------------------------------------
        public verifyToken(req: express.Request, res: express.Response, next: express.NextFunction) 
        {
            if (!req.headers || !req.headers["authorization"])
            {
                res.status(403).send("No se definió token"); 
            }

            var token = AuthRoute.AuthController.getTokenFromHeaders(req.headers);
            if (token) 
            {
                try {
                    var decoded = jwt.decode(token, "el-dulce-gato-se-mea");
                }
                catch (ex)
                {
                    res.status(403).send("El token está corrupto")
                }
                
                
                let userId: number = (parseInt(decoded.id) || 0);
                
                let authService = new AuthService();
                authService.getProfile(userId).subscribe(
                (data) => {
                    if (!data.error)
                    {
                        res.status(200).send("Autorizado");
                    }
                    else
                    {
                        res.status(403).send("Los datos del token no existen en la base de datos");
                    }
                },
                (error) => {
                    res.status(403).send("No existe o no se puede leer el token");
                });
            }
        }

        //------------------------------------------------------------------------------------------
        // Private Methods Section:
        //------------------------------------------------------------------------------------------
        public static getTokenFromHeaders(headers: any) 
        {
            if (headers && headers.authorization) 
            {
                let parted = headers.authorization.split(' ');
                if (parted.length === 2) 
                {
                    return parted[1];
                } 
                else 
                {
                    return null;
                }
            } 
            else 
            {
                return null;
            }
        }
    }
}

//--------------------------------------------------------------------------------------------------
// Export Module Section
//--------------------------------------------------------------------------------------------------
export = AuthRoute;