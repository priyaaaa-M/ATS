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
            await new Promise((resolve, reject) => {
                req.session.regenerate((err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
            req.session.userId = result.user.id;
            req.session.userEmail = result.user.email;
            req.session.userName = result.user.name || undefined;
            req.session.userRole = result.user.role;
            if (result.user.companyId) {
                req.session.companyId = result.user.companyId;
            }
            else {
                delete req.session.companyId;
            }
            console.log('[AUTH] Session userId set to:', req.session.userId);
            // Explicitly save session before redirect to ensure cookie is set
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
            console.log('[AUTH] Session saved. Session ID:', req.sessionID);
            console.log('[AUTH] Session cookie object:', req.session.cookie);
            console.log('[AUTH] Cookie set:', res.getHeader('set-cookie'));
            console.log(`[AUTH] Login success for ${result.user.email}, sending browser redirect to ${config_1.config.appBaseUrl}`);
            return res
                .status(200)
                .type('html')
                .send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${config_1.config.appBaseUrl}" />
    <title>Signing in...</title>
  </head>
  <body>
    <script>
      window.location.href = ${JSON.stringify(config_1.config.appBaseUrl)};
    </script>
  </body>
</html>`);
        }
        catch (err) {
            console.error('[AUTH] Callback error:', err);
            return next(err);
        }
    },
    getMe: async (req, res, next) => {
        try {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            const cookies = req.headers.cookie || '';
            const hasSessionCookie = cookies.includes(config_1.config.cookieName);
            console.log('[AUTH] /auth/me called. Session ID:', req.sessionID, '| userId:', req.session?.userId || 'none', '| Cookie names:', cookies.split(';').map(c => c.split('=')[0].trim()).join(', ') || 'none', '| Has session cookie:', hasSessionCookie);
            console.log('[AUTH] /auth/me raw Cookie header:', req.headers.cookie || 'none');
            console.log('[AUTH] /auth/me session keys:', Object.keys(req.session || {}));
            if (!req.session?.userId) {
                return res.status(200).json({ authenticated: false, user: null });
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
