"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const config_1 = require("../config");
const auth_service_1 = require("../services/auth.service");
const google_service_1 = require("../services/google.service");
exports.authController = {
    initiateGoogleAuth: (req, res) => {
        const inviteToken = typeof req.query.inviteToken === 'string' ? req.query.inviteToken : undefined;
        const authUrl = google_service_1.googleService.getAuthUrl(inviteToken);
        res.redirect(authUrl);
    },
    handleGoogleCallback: async (req, res, next) => {
        try {
            console.log('[AUTH] /auth/google/callback hit. Query:', req.query);
            const { code, state } = req.query;
            if (!code) {
                console.log('[AUTH] No code in callback, redirecting to login');
                return res.redirect(`${config_1.config.appBaseUrl}/login?error=no_code`);
            }
            const result = await auth_service_1.authService.handleGoogleCallback(code, state);
            console.log('[AUTH] User authenticated:', result.user.email, 'ID:', result.user.id);
            req.session.userId = result.user.id;
            req.session.userEmail = result.user.email;
            req.session.userRole = result.user.role;
            req.session.companyId = result.user.companyId || '';
            // Explicitly save session before redirect to ensure cookie is set
            req.session.save((err) => {
                if (err) {
                    console.error('[AUTH] Session save error:', err);
                    return next(err);
                }
                console.log('[AUTH] Session saved. Session ID:', req.sessionID);
                console.log('[AUTH] Cookie set:', res.getHeader('set-cookie'));
                const redirectPath = result.user.role === 'hr' ? '/dashboard' : '/interviewer';
                console.log(`[AUTH] Login success for ${result.user.email}, redirecting to ${config_1.config.appBaseUrl}${redirectPath}`);
                return res.redirect(`${config_1.config.appBaseUrl}${redirectPath}`);
            });
        }
        catch (err) {
            console.error('[AUTH] Callback error:', err);
            return next(err);
        }
    },
    getMe: async (req, res, next) => {
        try {
            const cookies = req.headers.cookie || '';
            const hasSessionCookie = cookies.includes(config_1.config.cookieName);
            console.log('[AUTH] /auth/me called. Session ID:', req.sessionID, '| userId:', req.session?.userId || 'none', '| Cookie names:', cookies.split(';').map(c => c.split('=')[0].trim()).join(', ') || 'none', '| Has session cookie:', hasSessionCookie);
            if (!req.session?.userId) {
                return res.status(200).json({ authenticated: false });
            }
            const user = await auth_service_1.authService.getUserById(req.session.userId);
            return res.json({ authenticated: true, user });
        }
        catch (err) {
            return next(err);
        }
    },
    logout: (req, res, next) => {
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.clearCookie(config_1.config.cookieName);
            return res.json({ success: true });
        });
    },
};
