//--------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------
import { Observable }     from "rxjs/Observable";
import { MySQLService }   from "./mysql-service";
import { CheckParams }    from 'runtime-type-checks';
import * as moment        from "moment";

//--------------------------------------------------------------------------
// No Typings Available:
//--------------------------------------------------------------------------
var sync     = require('synchronize');

//--------------------------------------------------------------------------
// Model Class:
//--------------------------------------------------------------------------
export class OrdersService
{
    //----------------------------------------------------------------------
    // Public Methods Section:
    //----------------------------------------------------------------------
    @CheckParams()
    public getOrders(locationId: number) : Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(locationId))
            {
                locationId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call getOrders(" + locationId + ")", (err, rows) => {
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

    //----------------------------------------------------------------------
    @CheckParams()
    public getClosedOrders(locationId: number) : Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(locationId))
            {
                locationId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call getClosedOrders(" + locationId + ")", (err, rows) => {
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

    //----------------------------------------------------------------------
    @CheckParams() public getOrdersForCustomer(customerId: number) : Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(customerId))
            {
                customerId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
                connection.query("call getOrdersForCustomer(" + customerId + ")", (err, rows) => {
                    if (err)
                    {
                        mySQLService.stop(connection);
                        console.log( "GRAVE ERROR CARIÑO: " + err);
                        observer.error(err);
                    }
                    else
                    {
                        sync(connection, "query");
                        sync.fiber(() => {
                            let orders: any = rows[0];
                            let customerData = {};
                            let currentVehicle: any = {};
                            let counter: number = 0;
                            for (counter = 0; counter < orders.length; counter++)
                            {
                                // Loop Variables:
                                let orderNumber: number = orders[counter]["order_id"];
                                let currentOrder: {} = orders[counter];

                                // General Housekeeping...
                                delete currentOrder["location_id"];
                                delete currentOrder["order_state_id"];

                                // Customer Data:
                                let qCustomerData = sync.await(connection.query("call getCustomerData(" + customerId + ")", sync.defer()));
                                customerData = qCustomerData[0][0];

                                // Checks:
                                let qChecks = sync.await(connection.query("call getChecksForOrder(" + orderNumber + ")", sync.defer()));
                                let checks = qChecks[0];
                                currentOrder["checks"] = checks;

                                // Pictures:
                                let qPictures = sync.await(connection.query("call getPicturesForOrder(" + orderNumber + ")", sync.defer()));
                                let pictures = qPictures[0];
                                currentOrder["vehicle-pictures"] = pictures;

                                // Vehicle:
                                currentVehicle = {};
                                currentVehicle.make     = currentOrder["make"];
                                currentVehicle.model    = currentOrder["model"];
                                currentVehicle.plates   = currentOrder["plates"];
                                currentVehicle.odometer = currentOrder["odometer"];
                                
                                currentOrder["vehicle"] = currentVehicle;
                                

                                delete currentOrder["make"];
                                delete currentOrder["model"];
                                //delete currentOrder["plates"];
                                delete currentOrder["odometer"];

                                // Documents:
                                let qDocuments = sync.await(connection.query("call getDocumentsForOrder(" + orderNumber + ")", sync.defer()));
                                let documents = qDocuments[0];

                                let docsFromClient = [];
                                let quotes         = [];
                                let invoices       = [];

                                let documentCounter: number = 0;
                                for (documentCounter = 0; documentCounter < documents.length; documentCounter++)
                                {
                                    let currentDocument = documents[documentCounter];

                                    delete currentDocument["document_id"];
                                    delete currentDocument["order_id"];
                                    delete currentDocument["document_type_id"];

                                    switch (currentDocument.document_type)
                                    {
                                        case "customer":
                                            delete currentDocument["document_type"];
                                            docsFromClient.push(currentDocument);
                                            break;
                                        case "quote":
                                            delete currentDocument["document_type"];
                                            quotes.push(currentDocument);
                                            break;
                                        case "invoice":
                                            delete currentDocument["document_type"];
                                            invoices.push(currentDocument);
                                            break;
                                    }
                                }

                                if (docsFromClient.length > 0)
                                {
                                    currentOrder["docs-from-client"] = docsFromClient;
                                }

                                if (quotes.length > 0)
                                {
                                    currentOrder["quote"] = quotes[0];
                                }

                                if (invoices.length > 0)
                                {
                                    currentOrder["invoice"] = invoices[0];
                                }

                                // Color Status:
                                currentOrder["color-status"] = this.getColorStatus(currentOrder);

                                // Assign result:
                                orders[counter] = currentOrder;
                            }
                            mySQLService.stop(connection);
                            let result = {};
                            result["customer-data"] = customerData;
                            result["orders"] = orders;
                            observer.next(result);
                            observer.complete();
                        });
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
    public insertDocumentForOrder(orderNumber: number, docType: number, filePath: string): Observable<any>
    {
       return Observable.create(observer => {
            if (isNaN(orderNumber))
            {
                orderNumber = 0;
            }
            if (isNaN(docType))
            {
                docType = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
                connection.query("call insertDocumentForOrder(" + orderNumber + ", " + docType + ", \"" + filePath + "\")", (err, rows) => {
                    if (err)
                    {
                        mySQLService.stop(connection);
                        console.log(err);
                        observer.error(err);
                    }
                    else
                    {
                        if (docType !== 3)
                        {
                            let state: number = 0;
                            if (docType === 1)
                            {
                                state = 2;
                            }
                            if (docType === 2)
                            {
                                state = 6;
                            }

                            sync(connection, "query");
                            sync.fiber(() => {
                                let qOrderState = sync.await(
                                        connection.query("call setStatusForOrder(" + orderNumber + ", " + state.toString() + ")", sync.defer()))
                                ;
                            });
                        }
                        mySQLService.stop(connection);
                        observer.next(true);
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
    public authorizeOrder(orderNumber: number): Observable<any>
    {
       return Observable.create(observer => {
            if (isNaN(orderNumber))
            {
                orderNumber = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
                connection.query("call authorizeOrder(" + orderNumber + ")", (err, rows) => {
                    if (err)
                    {
                        mySQLService.stop(connection);
                        console.log(err);
                        observer.error(err);
                    }
                    else
                    {
                        mySQLService.stop(connection);
                        observer.next(true);
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
    public closeOrder(orderNumber: number): Observable<any>
    {
       return Observable.create(observer => {
            if (isNaN(orderNumber))
            {
                orderNumber = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
                connection.query("call closeOrder(" + orderNumber + ")", (err, rows) => {
                    if (err)
                    {
                        mySQLService.stop(connection);
                        console.log(err);
                        observer.error(err);
                    }
                    else
                    {
                        mySQLService.stop(connection);
                        observer.next(true);
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
    public setCustomerSatisfaction(orderNumber: number, satisfactionIndex: number)
    {
       return Observable.create(observer => {
            if (isNaN(orderNumber))
            {
                orderNumber = 0;
            }
            if (isNaN(satisfactionIndex))
            {
                satisfactionIndex = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
                connection.query("call setCSIForOrder(" + orderNumber + ", " + satisfactionIndex + ")", (err, rows) => {
                    if (err)
                    {
                        mySQLService.stop(connection);
                        console.log(err);
                        observer.error(err);
                    }
                    else
                    {
                        mySQLService.stop(connection);
                        observer.next(true);
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

    //------------------------------------------------------------------------------------------
    // Utility Methods
    //------------------------------------------------------------------------------------------
    public getColorStatus(order: any) : string
    {
        let intervalStates = {
            "pending-ppto" : {
                "warning"  : 1,
                "danger"   : 3
            },
            "pending-approval" : {
                "warning"  : 1,
                "danger"   : 3
            },
            "in-process-ok" : {
                "warning"  : 1,
                "danger"   : 3
            },
            "pending-invoice" : {
                "warning"  : 1,
                "danger"   : 3
            },
            "pending-invoice-review" : {
                "warning"  : 1000,
                "danger"   : 3000
            },
           "invoice-reviewed" : {
                "warning"  : 1000,
                "danger"   : 3000
            },
            "vehicle-released": {
                "warning"  : 1000,
                "danger"   : 3000
            }
        };

        let sRetVal     : string = "success";
        let startDate   : string = "";
        let endDate     : string = "";

        switch (order["order_state"])
        {
            case "pending-ppto":
                startDate = order["date_admitted"];
                break;
            case "pending-approval":
                startDate = order.quote.sent;
                break;
            case "in-process-ok":
                startDate = order["signed_approved"];
                break;
            case "in-process-delayed":
                startDate = order["signed_approved"];
                break;
            case "pending-invoice":
                startDate = order["service_finished"];
                break;
            case "pending-invoice-review":
                startDate = order["invoice.sent"];
                break;
            case "vehicle-released":
                startDate = order["signed_approved"];
                endDate   = order["service_finished"];
        }

        let daysElapsed : number;
        if (endDate === "")
        {
            daysElapsed =  this.getDaysInterval(startDate);
        }
        else
        {
            daysElapsed = this.getDaysInterval(startDate, endDate);
        }

        if (daysElapsed < intervalStates[order["order_state"]].warning) 
        {
            sRetVal = "success";
        }
        if ((daysElapsed > intervalStates[order["order_state"]].warning) && (daysElapsed < intervalStates[order["order_state"]].danger))
        {
            sRetVal = "warning";
        }
        if (daysElapsed >= intervalStates[order["order_state"]].danger)
        {
            sRetVal = "danger";
        }


        return sRetVal;
    }

    //------------------------------------------------------------------------------------------
    public getDaysInterval(startState: string, endDate?: string)
    {
        let dtStart : any  = moment(startState);
        let dtEnd   : any;
        if (endDate)
        {
            dtEnd = moment(endDate);
        }
        else
        {
            dtEnd = moment();
        }

        let duration = moment.duration(dtEnd.diff(dtStart));
        return Math.abs(duration.asDays());
    }

}