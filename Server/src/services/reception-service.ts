//--------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------
import { Observable }     from "rxjs/Observable";
import { MySQLService }   from "./mysql-service";
import { CheckParams }    from 'runtime-type-checks';

//--------------------------------------------------------------------------
// No Typings Available:
//--------------------------------------------------------------------------
var sync     = require('synchronize');


//--------------------------------------------------------------------------
// ReceptionService Class:
//--------------------------------------------------------------------------
export class ReceptionService
{
    //----------------------------------------------------------------------
    // Public Methods Section:
    //----------------------------------------------------------------------
    @CheckParams()
    public createReception(
                            plates    : string,
                            picture   : string,
                            time      : string,
                            userId    : number
    ) : Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(userId))
            {
                userId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
                
                let sSQL: string = 'call createReception(' +   
                    '"' + plates.trim() + '"' + ', ' +
                    '"' + picture + '"' + ', ' +
                    '"' + this.toMysqlFormat(time.trim()) + '"' + ', ' +
                    userId + 
                ')';

                connection.query(sSQL, (err, rows) => {
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
                        observer.next({ "result" : { "action" : "created" } });
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
    // Private Methods Section:
    //----------------------------------------------------------------------
    twoDigits(d: number) : string
    {
        if(0 <= d && d < 10) return "0" + d.toString();
        if(-10 < d && d < 0) return "-0" + (-1*d).toString();
        return d.toString();
    }

    //----------------------------------------------------------------------
    toMysqlFormat(isoString: string)
    {
        let numberVersion: number = Date.parse(isoString);
        let dateVersion: Date = new Date(numberVersion);

        return dateVersion.getUTCFullYear() + "-" + 
                this.twoDigits(1 + dateVersion.getUTCMonth()) + "-" + 
                this.twoDigits(dateVersion.getUTCDate()) + " " + 
                this.twoDigits(dateVersion.getUTCHours()) + ":" + 
                this.twoDigits(dateVersion.getUTCMinutes()) + ":" +
                this.twoDigits(dateVersion.getUTCSeconds());
    }

}

