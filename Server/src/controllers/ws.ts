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
import * as express     from "express";
import * as fs          from "fs";
import * as path        from "path";
import * as _           from "lodash";
import * as moment      from "moment";


//--------------------------------------------
// Data Services:
//--------------------------------------------
import { CustomerService }  from "../services/customer-service";
import { OrdersService }    from "../services/orders-service";
import { AlbumService }     from "../services/album-service";
import { ReceptionService } from "../services/reception-service";


//--------------------------------------------
// Models:
//--------------------------------------------
import { Photo } from "../models/photo";


//--------------------------------------------------------------------------------------------------
// Module Section
//--------------------------------------------------------------------------------------------------
module WSRoute
{
    //----------------------------------------------------------------------------------------------
    // Route Controllers Section
    //----------------------------------------------------------------------------------------------
    export class OrdersController
    {
        //------------------------------------------------------------------------------------------
        // Public WebMethods Section
        //------------------------------------------------------------------------------------------
        public getOrders(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            let qs: string = req.params.qs;
            let params: string[] = qs.split("&");

            if (params.length !== 1)
            {
                res.status(422).send("Parámetros Erróneos");
                return;
            }

            let locationId = (parseInt(params[0]) || 0);

            let ordersService = new OrdersService();
            ordersService.getOrders(locationId).subscribe((data) => {
                res.json({"result" : data});
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      res.status(404).send("Error recuperando lista de ordenes.");
                      break;
                }
            });
        }

        //------------------------------------------------------------------------------------------
        public getClosedOrders(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            let qs: string = req.params.qs;
            let params: string[] = qs.split("&");

            if (params.length !== 1)
            {
                res.status(422).send("Parámetros Erróneos");
                return;
            }

            let locationId = (parseInt(params[0]) || 0);

            let ordersService = new OrdersService();
            ordersService.getClosedOrders(locationId).subscribe((data) => {
                res.json({"result" : data});
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      res.status(404).send("Error recuperando lista de ordenes.");
                      break;
                }
            });
        }

        //------------------------------------------------------------------------------------------
        public getOrdersForClient(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            let qs: string = req.params.qs;
            let params: string[] = qs.split("&");

            if (params.length !== 1)
            {
                res.status(422).send("Parámetros Erróneos");
                return;
            }

            let customerId = params[0];

            let ordersService = new OrdersService();
            ordersService.getOrdersForCustomer(parseInt(customerId)).subscribe((data) => {
                res.json({"customer-data" : data["customer-data"], "orders" : data["orders"]});
            },
            (error) => {
                res.status(error).send("Ha ocurrido un error.");
            });

        }

        //------------------------------------------------------------------------------------------
        public uploadQuote(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Params
            let customerId  : string = req.body.uploadQuotePDF_Customer;
            let orderNumber : string = req.body.uploadQuotePDF_Order;

            // Write File
            let filename    : string = path.join(__dirname, "../../", req.file.path);
            let newFilePath : string = path.join(__dirname, "../../",
                                           "/app/files/customers/" +
                                           customerId +
                                           "/quotes/");
            let newFileName : string = orderNumber +
                                           "-" +
                                           Date.now() +
                                           ".pdf";

            let fullFileName: string = newFilePath + newFileName;
            if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId)))
            {
                fs.mkdirSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId));
            }
            if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId + "/quotes/")))
            {
                fs.mkdirSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId + "/quotes/"));
            }
            fs.renameSync(filename, fullFileName);
            let filepath = "/customers/" + customerId + "/quotes/" + newFileName;

            // Write Data:
            let ordersService = new OrdersService();
            ordersService.insertDocumentForOrder(parseInt(orderNumber), 1, filepath).subscribe((data) => {
                res.json({ "filename" : newFileName, "dateReceived" : new Date() });
            },
            (error) => {
                res.status(error).send("Ha ocurrido un error.");
            });
        }

        //------------------------------------------------------------------------------------------
        public authorizeOrder(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            if (Object.keys(req.query).length === 3)
            {
                if ((typeof req.query.pass     !== "undefined") &&
                    (typeof req.query.customer !== "undefined") &&
                    (typeof req.query.order    !== "undefined"))
                {
                    // Parse Parameters
                    let password       : string = req.query.pass;
                    let customerId     : string = req.query.customer;
                    let orderNumber    : string = req.query.order;


                    if (password !== "autorizar orden")
                    {
                        res.status(403).send("Password Erróneo");
                        return;
                    }


                    // Write Data:
                    let ordersService = new OrdersService();
                    ordersService.authorizeOrder(parseInt(orderNumber)).subscribe((data) => {
                        res.json({ approvalDate  : new Date() });
                    },
                    (error) => {
                        res.status(error).send("Ha ocurrido un error.");
                    });
                }
            }
            else
            {
                // return error...
                res.status(422).send("Parámetros Erróneos");
                return;
            }
        }

        //------------------------------------------------------------------------------------------
        public getClientPDF(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            let customerId  : string = req.body.sendCustomerPDF_Customer;
            let orderNumber : string = req.body.sendCustomerPDF_Order;
            let filename    : string = path.join(__dirname, "../../", req.file.path);
            let newFilePath : string = path.join(__dirname, "../../",
                                           "/app/files/customers/" +
                                           customerId +
                                           "/customer_files/");

            let newFileName : string = orderNumber +
                                           "-" +
                                           Date.now() +
                                           ".pdf";

            let fullFileName: string = newFilePath + newFileName;


            if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId)))
            {
                fs.mkdirSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId));
            }

            if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId + "/customer_files/")))
            {
                fs.mkdirSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId + "/customer_files/"));
            }

            fs.renameSync(filename, fullFileName);
            let filepath = "/customers/" + customerId + "/customer_files/" + newFileName;

            // Write Data:
            let ordersService = new OrdersService();
            ordersService.insertDocumentForOrder(parseInt(orderNumber), 3, filepath).subscribe((data) => {
                res.json({ "filename" : newFileName, "dateReceived" : new Date() });
            },
            (error) => {
                res.status(error).send("Ha ocurrido un error.");
            });
        }

        //------------------------------------------------------------------------------------------
        public uploadInvoice(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            let customerId  : string = req.body.uploadInvoicePDF_Customer;
            let orderNumber : string = req.body.uploadInvoicePDF_Order;
            let filename    : string = path.join(__dirname, "../../", req.file.path);
            let newFilePath : string = path.join(__dirname, "../../",
                                           "/app/files/customers/" +
                                           customerId +
                                           "/invoices/");

            let newFileName : string = orderNumber +
                                           "-" +
                                           Date.now() +
                                           ".pdf";

            let fullFileName: string = newFilePath + newFileName;


            if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId)))
            {
                fs.mkdirSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId));
            }

            if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId + "/invoices/")))
            {
                fs.mkdirSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId + "/invoices/"));
            }

            fs.renameSync(filename, fullFileName);
            let filepath = "/customers/" + customerId + "/invoices/" + newFileName;

            // Write Data:
            let ordersService = new OrdersService();
            ordersService.insertDocumentForOrder(parseInt(orderNumber), 2, filepath).subscribe((data) => {
                res.json({ "filename" : newFileName, "dateReceived" : new Date() });
            },
            (error) => {
                res.status(error).send("Ha ocurrido un error.");
            });
        }

        //------------------------------------------------------------------------------------------
        public verifyInvoiceConfirmation(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            let customerId   : string = req.body.verifyInvoiceConfirmation_Customer;
            let orderNumber  : string = req.body.verifyInvoiceConfirmation_Order;
            let confirmation : string = req.body.verifyInvoiceConfirmation_Confirmation;

            if ((!customerId) || (!orderNumber))
            {
                res.status(422).send("Parámetros Erróneos");
                return;
            }

            if (confirmation !== "descargar factura")
            {
                res.status(403).send({"message" : "Confirmación Errónea: " + req.body.verifyCredentials_Password});
                return;
            }
            else
            {
                // Write Data:
                let ordersService = new OrdersService();
                ordersService.closeOrder(parseInt(orderNumber)).subscribe((data) => {
                    res.json({ "authenticated" : confirmation });
                },
                (error) => {
                    res.status(error).send("Ha ocurrido un error.");
                });
            }
        }

        //------------------------------------------------------------------------------------------
        public customerSatisfaction(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            if (Object.keys(req.query).length === 3)
            {
                if ((typeof req.query.customer     !== "undefined") &&
                    (typeof req.query.order        !== "undefined") &&
                    (typeof req.query.satisfaction !== "undefined"))
                {
                    // Parse Parameters
                    let customerId     : string = req.query.customer;
                    let orderNumber    : string = req.query.order;
                    let newValue   : string = req.query.satisfaction;

                    // Write Data:
                    let ordersService = new OrdersService();
                    ordersService.setCustomerSatisfaction(parseInt(orderNumber), parseInt(newValue)).subscribe((data) => {
                        res.json({ satisfaction    : newValue });
                    },
                    (error) => {
                        res.status(error).send("Ha ocurrido un error.");
                    });
                }
                else
                {
                    // return error...
                    res.status(422).send("Parámetros Erróneos");
                    return;
                }
            }
            else
            {
                // return error...
                res.status(422).send("Parámetros Erróneos");
                return;
            }
        }

        //------------------------------------------------------------------------------------------
        public closeOrder(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            if (!req.body)
            {
                res.status(200).send("No se efectuó ninguna acción");
                return
            }
            
            if (!req.body.orderNumber)
            {
                res.status(200).send("No se efectuó ninguna acción");
                return
            }
            
            let orderNumber : number = (parseInt(req.body.orderNumber) || 0);

            let ordersService = new OrdersService();
            ordersService.closeOrder(orderNumber).subscribe((data) => {
                 res.json({"result" : data[0]});
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      console.log("Error de base de datos cerrando el Servicio.");
                      res.status(404).send("Error de base de datos cerrando el Servicio.");
                      break;
                }
            });
        }
    }

    //----------------------------------------------------------------------------------------------
    export class CustomerController
    {
        //------------------------------------------------------------------------------------------
        // Public WebMethods Section
        //------------------------------------------------------------------------------------------
        public getCustomers(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            let customerService = new CustomerService();
            customerService.getCustomers().subscribe((data) => {
                res.json(data);
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      res.status(404).send("Error recuperando lista de clientes.");
                      break;
                }
            });
        }
    }

    //----------------------------------------------------------------------------------------------
    export class AlbumController
    {
        //------------------------------------------------------------------------------------------
        // Public WebMethods Section
        //------------------------------------------------------------------------------------------
        public getAlbums(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            let albumService = new AlbumService();
            albumService.getAlbums().subscribe((data) => {
                res.json({"result" : data});
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      res.status(404).send("Error recuperando lista de albums.");
                      break;
                }
            });
        }

        //------------------------------------------------------------------------------------------
        public getAlbum(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            let qs: string = req.params.qs;
            let params: string[] = qs.split("&");

            if (params.length !== 1)
            {
                res.status(422).send("Parámetros Erróneos");
                return;
            }

            let albumId = parseInt(params[0]);
            if (!albumId)
            {
                res.status(422).send("Parámetros incorrectos");
            }

            let albumService = new AlbumService();
            albumService.getAlbum(albumId).subscribe((data) => {
                res.json({"result" : data[0]});
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      res.status(404).send("Error recuperando el álbum.");
                      break;
                }
            });
        }

        //------------------------------------------------------------------------------------------
        public getAlbumPictures(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            let qs: string = req.params.qs;
            let params: string[] = qs.split("&");

            if (params.length !== 1)
            {
                res.status(422).send("Parámetros Erróneos");
                return;
            }

            let albumId = parseInt(params[0]);
            if (!albumId)
            {
                res.status(422).send("Parámetros incorrectos");
            }

            let albumService = new AlbumService();
            albumService.getAlbumPictures(albumId).subscribe((data) => {
                res.json({"result" : data[0]});
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      res.status(404).send("Error recuperando lista de fotografías.");
                      break;
                }
            });
        }

        //------------------------------------------------------------------------------------------
        public setAlbumPictures(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            if (!req.body)
            {
                res.status(200).send("No se efectuó ninguna acción");
                return
            }

            if ((!req.body.customerId) || (!req.body.photos))
            {
                res.status(200).send("No se efectuó ninguna acción");
                return
            }

           let customerId  : string = req.body.customerId;
           let orderNumber : string = req.body.orderNumber;
           let rawPhotos: any[] = req.body.photos;
           let photos: Photo[] = [];

           let newFilePath : string = path.join(__dirname, "../../","/app/files/customers/" + customerId + "/images/");
           
           let photosCounter: number = 0;
           for (photosCounter = 0; photosCounter < rawPhotos.length; photosCounter++)
           {

                let photo : Photo = new Photo();
                
                photo.title       = rawPhotos[photosCounter]._title;
                photo.description = rawPhotos[photosCounter]._description;
                photo.src         = rawPhotos[photosCounter]._src;
                photo.srct        = rawPhotos[photosCounter]._srct;
                photo.kind        = rawPhotos[photosCounter]._kind;
                
                if (rawPhotos[photosCounter]._picture)
                {
                    photo.picture = rawPhotos[photosCounter]._picture;
                }
                
                if (photo.picture && photo.picture !== "")
                {
                    console.log("Existe una imagen para procesar en el elemento número: " + photosCounter.toString());

                    // Correr procesamiento para esta foto.
                    let newFileName : string = orderNumber + "-" + Date.now() + ".png";
        
                    let fullFileName: string = newFilePath + newFileName;

                    if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId)))
                    {
                        fs.mkdirSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId));
                    }
        
                    if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId + "/images/")))
                    {
                        fs.mkdirSync(path.join(__dirname, "../../", "/app/files/customers/" + customerId + "/images/")); 
                    }

                    var base64Data = photo.picture.replace(/^data:image\/png;base64,/, "");
                    fs.writeFileSync(newFilePath + newFileName,  new Buffer(base64Data, 'base64'));
                    photo.src = ("customers/" + customerId + "/images/" + newFileName);

                    photos.push(photo);
                }
            }

            let fullFilePathToRemove: string;
            let found: boolean = false;
            let photosFileCounter = 0;
            if (fs.existsSync(newFilePath))
            {
                fs.readdir(newFilePath, (err, files) => {
                    files.forEach(file => {
                        for (photosFileCounter = 0; photosFileCounter < photos.length; photosFileCounter++)
                        {
                            if ((photos[photosFileCounter].src).indexOf(file) !== -1)
                            {
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                        {
                            fullFilePathToRemove = (newFilePath + file);
                            fs.unlinkSync(fullFilePathToRemove);
                            found = false;
                        }
                    });
                });
            }


            let albumService = new AlbumService();
            albumService.setAlbumPictures(parseInt(orderNumber), photos).subscribe((data) => {
                 res.json({"result" : data[0]});
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      console.log("Error de base de datos guardando fotografías.");
                      res.status(404).send("Error de base de datos guardando fotografías.");
                      break;
                }
            });

        }

    }

    //----------------------------------------------------------------------------------------------
    export class ReceptionController
    {
        //------------------------------------------------------------------------------------------
        // Public WebMethods Section
        //------------------------------------------------------------------------------------------
        public createReception(req: express.Request, res: express.Response, next: express.NextFunction)
        {
            // Parse Parameters
            if (!req.body)
            {
                res.status(200).send("No se efectuó ninguna acción");
                return
            }

            if ((!req.body._plates) || (!req.body._picture))
            {
                res.status(200).send("No se efectuó ninguna acción");
                return
            }

            // Get Variables:
            let plates    : string    = req.body._plates;
            let picture   : string    = req.body._picture;
            let time      : string    = req.body._time;
            let userId    : number    = (parseInt(req.body._userId)     || 0);

            // Store Picture, get Url:
            let newFilePath : string = path.join(__dirname, "../../","/app/files/order-images/");
            let newFileName : string = plates + "-" + Date.now() + ".png";

            let fullFileName: string = newFilePath + newFileName;

            if (!fs.existsSync(path.join(__dirname, "../../", "/app/files/order-images/")))
            {
                fs.mkdirSync(path.join(__dirname, "../../", "/app/files/order-images/"));
            }

            var base64Data = picture.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(newFilePath + newFileName,  new Buffer(base64Data, 'base64'));
            picture = ("order-images/" + newFileName);

            // Call Service:
            let receptionService = new ReceptionService();
            receptionService.createReception(
                plates,
                picture,
                time,
                userId
            ).subscribe((data) => {
                 res.json({"result" : data[0]});
            },
            (error) => {
                switch (error)
                {
                    case 404:
                      console.log("Error de base de datos guardando fotografías.");
                      res.status(404).send("Error de base de datos guardando fotografías.");
                      break;
                }
            });
        }
    }

}

//--------------------------------------------------------------------------------------------------
// Export Module Section
//--------------------------------------------------------------------------------------------------
export = WSRoute;