var path                = require('path'),
    express             = require('express'),
    ampRouter           = express.Router(),
    i18n                = require('../../../i18n'),

    // Dirty requires
    errors              = require('../../../errors'),
    settingsCache       = require('../../../settings/cache'),
    postLookup          = require('../../../controllers/frontend/post-lookup'),
    setResponseContext  = require('../../../controllers/frontend/context'),
    renderer            = require('../../../controllers/frontend/renderer'),

    templateName = 'amp',
    routeConfig = {
        type: 'custom',
        templateName: templateName,
        defaultTemplate: path.resolve(__dirname, 'views', templateName + '.hbs')
    };

function configMiddleware(req, res, next) {
    // Note: this is super similar to the config middleware used in channels
    // @TODO refactor into to something explicit
    res.locals.route = routeConfig;
    next();
}

function _renderer(req, res, next) {
    // Renderer begin
    // Format data
    res.data = req.body || {};

    if (res.error) {
        res.data.error = res.error;
    }

    // @TODO work out a proper way to do renderer hooks?
    // If we don't have a post, or the post is a page
    if (!res.data.post || res.data.post.page) {
        return next();
    }

    // Context
    setResponseContext(req, res);

    // Render Call
    return renderer(req, res);
}

function getPostData(req, res, next) {
    req.body = req.body || {};

    postLookup(res.locals.relativeUrl)
        .then(function (result) {
            if (result && result.post) {
                req.body.post = result.post;
            }

            next();
        })
        .catch(function (err) {
            next(err);
        });
}

function checkIfAMPIsEnabled(req, res, next) {
    var ampIsEnabled = settingsCache.get('amp');

    if (ampIsEnabled) {
        return next();
    }

    // CASE: we don't support amp pages for static pages
    if (req.body.post && req.body.post.page) {
        return next(new errors.NotFoundError({message: i18n.t('errors.errors.pageNotFound')}));
    }

    /**
     * CASE: amp is disabled, we serve 404
     *
     * Alternatively we could redirect to the original post, as the user can enable/disable AMP every time.
     *
     * If we would call `next()`, express jumps to the frontend controller (server/controllers/frontend/index.js fn single)
     * and tries to lookup the post (again) and checks whether the post url equals the requested url (post.url !== req.path).
     * This check would fail if the site is setup on a subdirectory.
     */
    return next(new errors.NotFoundError({message: i18n.t('errors.errors.pageNotFound')}));
}

// AMP frontend route
ampRouter
    .use(configMiddleware)
    .route('/')
    .get(
        getPostData,
        checkIfAMPIsEnabled,
        _renderer
    );

module.exports = ampRouter;
module.exports.renderer = _renderer;
module.exports.getPostData = getPostData;
module.exports.checkIfAMPIsEnabled = checkIfAMPIsEnabled;
