//--------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------
import { Observable }     from "rxjs/Observable";
import { MySQLService }   from "./mysql-service";
import { CheckParams }    from 'runtime-type-checks';

//--------------------------------------------------------------------------
// Model Class:
//--------------------------------------------------------------------------
export class AuthService
{
    //----------------------------------------------------------------------
    // Public Methods Section:
    //----------------------------------------------------------------------
    @CheckParams()
    public getProfile(userId: number) : Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(userId))
            {
                userId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call getUser(" + userId + ")", (err, rows) => {
                   if (err)
                   {
                       console.log(err);
                       observer.error(err);
                   }
                   else
                   {
                       let result: any = rows[0];
                       let data = {};
                       if (result.length > 0)
                       {
                           data["id"]          = result[0]["id"];
                           data["username"]    = result[0]["username"];
                           data["customer_id"] = result[0]["customer_id"];
                           data["name"]        = result[0]["name"];
                           data["role"]        = result[0]["role"];
                           data["location_id"] = result[0]["location_id"];
                       }
                       else
                       {
                           data["error"] = "Usuario o contraseña inválida";
                       }

                       mySQLService.stop(connection);
                       observer.next(data);
                       observer.complete();
                   }
               });
            },
            (error) => {
                console.log(error);
                observer.error(error);
            });
        });
    }

    //----------------------------------------------------------------------
    @CheckParams()
    public authenticateUser(username: string, password: string): Observable<any>
    {
        return Observable.create(observer => {
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call authenticate(\"" + username + "\", \"" + password + "\")", (err, rows) => {
                   if (err)
                   {
                       console.log(err);
                       observer.error(err);
                   }
                   else
                   {
                       let result: any = rows[0];
                       let data = {};
                       if (result.length > 0)
                       {
                           data["id"]          = result[0]["id"];
                           data["username"]    = result[0]["username"];
                           data["customer_id"] = result[0]["customer_id"];
                           data["name"]        = result[0]["name"];
                           data["role"]        = result[0]["role"];
                           data["location_id"] = result[0]["location_id"];
                       }
                       else
                       {
                           data["error"] = "Usuario o contraseña inválida";
                       }

                       mySQLService.stop(connection);
                       observer.next(data);
                       observer.complete();
                   }
               });
            },
            (error) => {
                console.log(error);
                observer.error(error);
            });
        });
    }

    //----------------------------------------------------------------------
    @CheckParams()
    public setUserToken(userId: number, token: string): Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(userId))
            {
                userId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call setUserToken(" + userId + ", \"" + token + "\")", (err, rows) => {
                   if (err)
                   {
                       mySQLService.stop(connection);
                       console.log(err);
                       observer.error(err);
                   }
                   else
                   {
                       mySQLService.stop(connection);
                       observer.next({"result": "success"});
                       observer.complete();
                   }
               });
            },
            (error) => {
                console.log(error);
                observer.error(error);
            });
        });
    }

}