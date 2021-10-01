//--------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------
import { Observable }     from "rxjs/Observable";
import { MySQLService }   from "./mysql-service";


//--------------------------------------------------------------------------
// Model Class:
//--------------------------------------------------------------------------
export class CustomerService
{
    public getCustomers() : Observable<any>
    {
        return Observable.create(observer => {
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call getCustomers", (err, rows) => {
                   if (err)
                   {
                       mySQLService.stop(connection);
                       console.log(err);
                       observer.error(err);
                   }
                   else
                   {
                       let result: any = rows[0];
                       mySQLService.stop(connection);
                       observer.next(result);
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