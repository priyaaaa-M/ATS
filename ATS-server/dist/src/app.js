"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const postgres_1 = __importDefault(require("postgres"));
const config_1 = require("./config");
const db_1 = require("./db");
const schema_1 = require("./db/schema");
const error_middleware_1 = require("./middleware/error.middleware");
const routes_1 = require("./routes");
function createApp() {
    const app = (0, express_1.default)();
    const PgStore = (0, connect_pg_simple_1.default)(express_session_1.default);
    const sql = (0, postgres_1.default)(config_1.config.supabase.dbUrl);
    app.set('trust proxy', 1);
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
        resave: false,
        saveUninitialized: false,
        proxy: true,
        store: new PgStore({
            conObject: {
                connectionString: config_1.config.supabase.dbUrl,
                ssl: { rejectUnauthorized: false },
            },
            createTableIfMissing: true,
        }),
        cookie: {
            secure: !config_1.config.isDev,
            httpOnly: true,
            maxAge: config_1.config.session.maxAge,
            sameSite: 'lax',
        },
    }));
    app.get('/', (_req, res) => {
        res.json({
            status: 'ok',
            message: 'ATS server is running',
            health: '/health',
        });
    });
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.get('/db-test', async (_req, res, next) => {
        try {
            const rows = await db_1.db.select({ id: schema_1.users.id }).from(schema_1.users).limit(1);
            return res.json({
                status: 'ok',
                connected: true,
                rowsFound: rows.length,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    (0, routes_1.registerRoutes)(app);
    app.use(error_middleware_1.errorMiddleware);
    void sql;
    return app;
}
