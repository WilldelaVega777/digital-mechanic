//--------------------------------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------------------------------
//----------------------------------
// Libraries:
//----------------------------------
import "rxjs/Rx";
import { Observable } from "rxjs/Observable";
import * as path      from "path";
import fs = require("fs");

//----------------------------------
// MySQL:
//----------------------------------
import * as mysql from "mysql";

//--------------------------------------------------------------------------------------------------
// Service Class:
//--------------------------------------------------------------------------------------------------
export class MySQLService
{
    //----------------------------------------------------------------------------------------------
    // Public Methods Section:
    //----------------------------------------------------------------------------------------------
    public start() : Observable<mysql.IConnection>
    {
        return Observable.create(observer => {

            let env : string = process.env.NODE_ENV;
            let filename : string = "dsn-dev.json";
            filename = (env == 'development') ? 'dsn-dev.json' : 'dsn-staging.json';
            let configPath : string = path.join(__dirname, '..', ('/config/' + filename));
            let parsed = JSON.parse(fs.readFileSync(configPath, 'UTF-8'));
            let connection = mysql.createConnection(parsed);

            connection.connect((error) => {
                if (error)
                {
                    observer.error(error);
                }
                else
                {
                    console.log("========================================================================");
                    console.log("MySQL está conectado...");
                    console.time("MySQL estuvo activo");
                    observer.next(connection);
                    observer.complete();
                }
            });
        });
    }

    //----------------------------------------------------------------------------------------------
    public stop(connection: any) : void
    {
        if ((connection !== null) || (connection !== undefined))
        {
            connection.end((error) => {
                if (!error)
                {
                    console.timeEnd("MySQL estuvo activo");
                    console.log("You are now disconnected...");
                }
                else
                {
                    console.timeEnd("MySQL estuvo activo");
                    console.log("Hubo un error: " + error);
                }
            });
        }
    }
}