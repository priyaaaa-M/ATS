"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const session_file_store_1 = __importDefault(require("session-file-store"));
const config_1 = require("./config");
const FileStore = (0, session_file_store_1.default)(express_session_1.default);
const error_middleware_1 = require("./middleware/error.middleware");
const routes_1 = require("./routes");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
    }));
    app.use((0, cors_1.default)({
        origin: config_1.config.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, morgan_1.default)(config_1.config.isDev ? 'dev' : 'combined'));
    app.use((0, express_session_1.default)({
        name: config_1.config.cookieName,
        secret: config_1.config.session.secret,
        store: new FileStore({
            path: './sessions',
            retries: 0,
        }),
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true,
            maxAge: config_1.config.session.maxAge,
            sameSite: false,
        },
    }));
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    (0, routes_1.registerRoutes)(app);
    app.use(error_middleware_1.errorMiddleware);
    return app;
}
