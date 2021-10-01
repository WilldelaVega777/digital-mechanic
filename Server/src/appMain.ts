//--------------------------------------------------------------------------------------------------
// Typings:
//--------------------------------------------------------------------------------------------------
/// <reference path="../typings/index.d.ts" />

//--------------------------------------------------------------------------------------------------
// Lax or Strict for this project?
//--------------------------------------------------------------------------------------------------
"use strict";


//--------------------------------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------------------------------
//-------------------------------------------------
// NodeJS Modules:
//-------------------------------------------------
import * as express          from "express";
import * as expressSession   from "express-session";
import * as bodyParser       from "body-parser";
import * as multer           from "multer";
import * as cookieParser     from "cookie-parser";
import * as serveFavicon     from "serve-favicon";
import * as path             from "path";
import * as passport         from "passport";
import * as passportJWT      from "passport-jwt";

//--------------------------------------------------------------------------
// No Typings Available:
//--------------------------------------------------------------------------
var connectRoles  = require('connect-roles');
import flash      = require("connect-flash");

//-------------------------------------------------
// Models:
//-------------------------------------------------
import { Link }              from "./models/link";
import { Navigation }        from "./models/navigation";

//-------------------------------------------------
// Services:
//-------------------------------------------------
import { NavigationService } from "./services/navigation-service";

//-------------------------------------------------
// Controllers:
//-------------------------------------------------
import * as SystemRoute      from "./controllers/system";
import * as AuthRoute        from "./controllers/auth";
import * as UIRoute          from "./controllers/ui";
import * as WSRoute          from "./controllers/ws";


//--------------------------------------------------------------------------------------------------
// Server Class Section:
//--------------------------------------------------------------------------------------------------
class Server
{
    //----------------------------------------------------------------------------------------------
    // Public Fields Section:
    //----------------------------------------------------------------------------------------------
    public app    : express.Application;
    public upload : any;


    //----------------------------------------------------------------------------------------------
    // Bootstrap App Section:
    //----------------------------------------------------------------------------------------------
    public static bootstrap(): Server
    {
        return new Server();
    }

    //----------------------------------------------------------------------------------------------
    // Constructor Method Section:
    //----------------------------------------------------------------------------------------------
    constructor()
    {
        //---------------------------------------------------------------------
        // Create Express App.
        //---------------------------------------------------------------------
        this.app     = express();

        //---------------------------------------------------------------------
        // Multer:
        //---------------------------------------------------------------------
        let storage  = multer.diskStorage({
            destination: function (req: Express.Request, file: any, cb: any) {
                cb(null, "./app/files/inbox");
            },
            filename: function (req: Express.Request, file: any, cb: any) {
                cb(null, file.fieldname + "-" + Date.now());
            }
        });

        this.upload  = multer({
                                dest: "./app/files",
                                storage: storage,
                                limits: { fileSize: 50000000 }
        });

        //---------------------------------------------------------------------
        // Configure App.
        //---------------------------------------------------------------------
        this.config();
    }

    //----------------------------------------------------------------------------------------------
    // Private Methods Section:
    //----------------------------------------------------------------------------------------------
    private config()
    {
        //---------------------------------------------------------------------
        // App Parsers:
        //---------------------------------------------------------------------
        this.app.use(bodyParser.json({limit: '50mb'}));
        this.app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));
        this.app.use(cookieParser());

        //---------------------------------------------------------------------
        // Web Folder:
        //---------------------------------------------------------------------
        this.app.use(express.static("./app/public"));
        this.app.use(express.static("./app/files"));


        //---------------------------------------------------------------------
        // Favicon:
        //---------------------------------------------------------------------
        this.app.use(serveFavicon(__dirname + "/public/images/favicon.ico"));

        //---------------------------------------------------------------------
        // Template Engine Settings:
        //---------------------------------------------------------------------
        this.app.set("view engine", "ejs");
        this.app.set("views", "app/views");

        //---------------------------------------------------------------------
        // Flash:
        //---------------------------------------------------------------------
        this.app.use(flash());

        //---------------------------------------------------------------------
        // Model:
        //---------------------------------------------------------------------
        let navigationService: NavigationService = new NavigationService();
        let navigation: Navigation = navigationService.getNavigation();

        //---------------------------------------------------------------------
        // Router Configuration:
        //---------------------------------------------------------------------
        let router: express.Router = express.Router();

        // Declare Routes
        let systemController: SystemRoute.HealthController =
            new SystemRoute.HealthController();

        let authController: AuthRoute.AuthController =
            new AuthRoute.AuthController();

        let indexController: UIRoute.IndexController =
            new UIRoute.IndexController();

        let customerController: WSRoute.CustomerController =
            new WSRoute.CustomerController();

        let ordersController: WSRoute.OrdersController =
            new WSRoute.OrdersController();

        let albumController: WSRoute.AlbumController =
            new WSRoute.AlbumController();

        let receptionController: WSRoute.ReceptionController = 
            new WSRoute.ReceptionController();


        //---------------------------------------------------------------------
        // Passport Authentication Settings:        
        //---------------------------------------------------------------------
        // Passport JWT Strategy Handler:
        //---------------------------------------------------------------------
        let options : passportJWT.StrategyOptions;
        options = (<passportJWT.StrategyOptions>{});
        options.secretOrKey = "el-dulce-gato-se-mea";
        options.jwtFromRequest = passportJWT.ExtractJwt.fromAuthHeader();
        let strategy: passport.Strategy = new passportJWT.Strategy(
            options,
            (jwt_payload, done) => {
                authController.authenticateAppAction(jwt_payload, done);
            }
        );
        passport.use(strategy);



        //---------------------------------------------------------------------
        // Authorization Settings:
        //---------------------------------------------------------------------
        let user: any = new connectRoles({
            failureHandler: (req, res, action) =>
            {
                var accept = req.headers.accept || "";
                res.status(403);
                res.send("Acceso Denegado - No tiene permisos para: " + action);
            }
        });

        //-----------------------------------------
        // Initialize Passport, Session and Roles:
        //-----------------------------------------
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        this.app.use(user.middleware());


        //---------------------------------------------------------------------
        // Roles / Permissions
        //---------------------------------------------------------------------
        user.use("access index",
        (req, action) => {
            return true;
        });

        //---------------------------------------------------------------------
        user.use((req) => {
            if ((req.hasOwnProperty("user")) && (req.user.role === "admin"))
            {
                return true;
            }
        });


        //---------------------------------------------------------------------
        // CORS Configuration:
        //---------------------------------------------------------------------
        router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers",
                       "Origin, X-Requested-With, Content-Type, Accept, Authorization"
            );
            next();
        });


        //---------------------------------------------------------------------
        // Configure Routes (System Services)
        //---------------------------------------------------------------------
        // Health Route for Openshift:
        router.get("/health", systemController.checkHealth);

        //---------------------------------------------------------------------
        // Configure Routes (WS)
        //---------------------------------------------------------------------
        // WS Web:
        //---------------------------------------------------------------------
        // authController.validateRequest, 
        router.get("/get-customer-orders/:qs", ordersController.getOrdersForClient);
        router.get("/authorize-order",         ordersController.authorizeOrder);
        router.get("/customer-satisfaction",   ordersController.customerSatisfaction);
        router.get("/get-customers",           customerController.getCustomers);
        router.post("/client-pdf",             this.upload.single("clientPDF"),  ordersController.getClientPDF);
        router.post("/upload-quote",           this.upload.single("quotePDF"),   ordersController.uploadQuote);
        router.post("/upload-invoice",         this.upload.single("invoicePDF"), ordersController.uploadInvoice);
        router.post("/verify-invoice-confirmation", ordersController.verifyInvoiceConfirmation);

        //---------------------------------------------------------------------
        // WS Mobile:
        //---------------------------------------------------------------------
        router.post('/app-authenticate',       authController.appAuthenticate);
        router.get('/verify-token',            authController.verifyToken);
        router.get("/get-albums",              passport.authenticate('jwt', { session: false }), albumController.getAlbums);
        router.get("/get-album/:qs",           passport.authenticate('jwt', { session: false }), albumController.getAlbum);
        router.get("/get-album-pictures/:qs",  passport.authenticate('jwt', { session: false }), albumController.getAlbumPictures);
        router.post("/set-album-pictures",     passport.authenticate('jwt', { session: false }), albumController.setAlbumPictures);
        router.post("/create-reception",       passport.authenticate('jwt', { session: false }), receptionController.createReception);
        router.get("/get-orders/:qs",          passport.authenticate('jwt', { session: false }), ordersController.getOrders);
        router.get("/get-closed-orders/:qs",   passport.authenticate('jwt', { session: false }), ordersController.getClosedOrders);
        router.post("/close-order",            passport.authenticate('jwt', { session: false }), ordersController.closeOrder);

        //---------------------------------------------------------------------
        // Master Route:
        //---------------------------------------------------------------------
        this.app.get("/", indexController.getIndex);


        //---------------------------------------------------------------------
        // Add Router Middleware:
        //---------------------------------------------------------------------
        this.app.use(router);
    }
}


//--------------------------------------------------------------------------------------------------
// Export Module Section:
//--------------------------------------------------------------------------------------------------
var server = Server.bootstrap();
export = server.app;
