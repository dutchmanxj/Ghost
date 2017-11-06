var debug = require('ghost-ignition').debug('channels:render-post'),
    formatResponse = require('./format-response'),
    renderer = require('./renderer'),
    setResponseContext = require('./context');
/*
 * Sets the response context around a post and renders it
 * with the current theme's post view. Used by post preview
 * and single post methods.
 * Returns a function that takes the post to be rendered.
 */

module.exports = function renderPost(req, res) {
    debug('renderPost called');
    return function renderPost(post) {
        // Renderer begin
        // Format data 2 - 1 is in preview/single
        res.data = formatResponse.single(post);

        // Context
        setResponseContext(req, res);

        // Render Call
        return renderer(req, res);
    };
};
