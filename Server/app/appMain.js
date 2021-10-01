"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const serveFavicon = require("serve-favicon");
const passport = require("passport");
const passportJWT = require("passport-jwt");
var connectRoles = require('connect-roles');
const flash = require("connect-flash");
const navigation_service_1 = require("./services/navigation-service");
const SystemRoute = require("./controllers/system");
const AuthRoute = require("./controllers/auth");
const UIRoute = require("./controllers/ui");
const WSRoute = require("./controllers/ws");
class Server {
    constructor() {
        this.app = express();
        let storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, "./app/files/inbox");
            },
            filename: function (req, file, cb) {
                cb(null, file.fieldname + "-" + Date.now());
            }
        });
        this.upload = multer({
            dest: "./app/files",
            storage: storage,
            limits: { fileSize: 50000000 }
        });
        this.config();
    }
    static bootstrap() {
        return new Server();
    }
    config() {
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
        this.app.use(cookieParser());
        this.app.use(express.static("./app/public"));
        this.app.use(express.static("./app/files"));
        this.app.use(serveFavicon(__dirname + "/public/images/favicon.ico"));
        this.app.set("view engine", "ejs");
        this.app.set("views", "app/views");
        this.app.use(flash());
        let navigationService = new navigation_service_1.NavigationService();
        let navigation = navigationService.getNavigation();
        let router = express.Router();
        let systemController = new SystemRoute.HealthController();
        let authController = new AuthRoute.AuthController();
        let indexController = new UIRoute.IndexController();
        let customerController = new WSRoute.CustomerController();
        let ordersController = new WSRoute.OrdersController();
        let albumController = new WSRoute.AlbumController();
        let receptionController = new WSRoute.ReceptionController();
        let options;
        options = {};
        options.secretOrKey = "el-dulce-gato-se-mea";
        options.jwtFromRequest = passportJWT.ExtractJwt.fromAuthHeader();
        let strategy = new passportJWT.Strategy(options, (jwt_payload, done) => {
            authController.authenticateAppAction(jwt_payload, done);
        });
        passport.use(strategy);
        let user = new connectRoles({
            failureHandler: (req, res, action) => {
                var accept = req.headers.accept || "";
                res.status(403);
                res.send("Acceso Denegado - No tiene permisos para: " + action);
            }
        });
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        this.app.use(user.middleware());
        user.use("access index", (req, action) => {
            return true;
        });
        user.use((req) => {
            if ((req.hasOwnProperty("user")) && (req.user.role === "admin")) {
                return true;
            }
        });
        router.use((req, res, next) => {
            res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
        });
        router.get("/health", systemController.checkHealth);
        router.get("/get-customer-orders/:qs", ordersController.getOrdersForClient);
        router.get("/authorize-order", ordersController.authorizeOrder);
        router.get("/customer-satisfaction", ordersController.customerSatisfaction);
        router.get("/get-customers", customerController.getCustomers);
        router.post("/client-pdf", this.upload.single("clientPDF"), ordersController.getClientPDF);
        router.post("/upload-quote", this.upload.single("quotePDF"), ordersController.uploadQuote);
        router.post("/upload-invoice", this.upload.single("invoicePDF"), ordersController.uploadInvoice);
        router.post("/verify-invoice-confirmation", ordersController.verifyInvoiceConfirmation);
        router.post('/app-authenticate', authController.appAuthenticate);
        router.get('/verify-token', authController.verifyToken);
        router.get("/get-albums", passport.authenticate('jwt', { session: false }), albumController.getAlbums);
        router.get("/get-album/:qs", passport.authenticate('jwt', { session: false }), albumController.getAlbum);
        router.get("/get-album-pictures/:qs", passport.authenticate('jwt', { session: false }), albumController.getAlbumPictures);
        router.post("/set-album-pictures", passport.authenticate('jwt', { session: false }), albumController.setAlbumPictures);
        router.post("/create-reception", passport.authenticate('jwt', { session: false }), receptionController.createReception);
        router.get("/get-orders/:qs", passport.authenticate('jwt', { session: false }), ordersController.getOrders);
        router.get("/get-closed-orders/:qs", passport.authenticate('jwt', { session: false }), ordersController.getClosedOrders);
        router.post("/close-order", passport.authenticate('jwt', { session: false }), ordersController.closeOrder);
        this.app.get("/", indexController.getIndex);
        this.app.use(router);
    }
}
var server = Server.bootstrap();
module.exports = server.app;
//# sourceMappingURL=appMain.js.map