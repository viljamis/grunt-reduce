/*jshint onevar:false, node:true*/

/*
 * grunt-reduce
 * https://github.com/munter/grunt-reduce
 *
 * Copyright (c) 2012 Peter Müller
 * Licensed under the MIT license.
 */

var defaults = {
    root : 'app',
    outRoot : 'dist',
    manifest : false,
    pretty : false,
    less : false,
    scss : false,
    inlineSize: Number.MAX_VALUE,
    inlineByRelationType : {
        "*" : true,
        "CssImage" : Number.MAX_VALUE,
        "HtmlScript" : Number.MAX_VALUE,
        "HtmlImage" : Number.MAX_VALUE,
        "Css" : Number.MAX_VALUE
    },
    optimizeImages: true,
    sharedBundles : false,
    asyncScripts : false,
    loadAssets : [
        '*.html',
        '*.txt',
        '*.ico'
    ],
    browsers : [
        '> 1%',
        'last 2 versions',
        'Firefox ESR',
        'Opera 12.1'
    ]
};

function normalizeLocaleId (localeId) {
    return localeId && localeId.replace(/-/g, '_').toLowerCase();
}

module.exports = function (grunt) {

    grunt.registerMultiTask('reduce', 'inline page and all it\'s assets', function () {
        var done = this.async();

        var AssetGraph = require('assetgraph-builder'),
            query = AssetGraph.query,
            urlTools = require('urltools'),
            chalk = require('chalk');

        var config = this.options(defaults),
            rootUrl = urlTools.fsDirToFileUrl(config.root),
            outRoot = urlTools.fsDirToFileUrl(config.outRoot),
            cdnRoot = config.cdnRoot && urlTools.ensureTrailingSlash(config.cdnRoot),
            cdnOutRoot = config.cdnOutRoot && urlTools.fsDirToFileUrl(config.cdnOutRoot),
            canonicalUrl = config.canonicalUrl && urlTools.ensureTrailingSlash(config.canonicalUrl);

        // Support for locales
        var localeIds;
        if (Array.isArray(config.locales)) {
            localeIds = config.locales.map(normalizeLocaleId);
        }

        new AssetGraph({ root: rootUrl })
            .logEvents()
            .registerRequireJsConfig()
            .loadAssets(config.loadAssets)
            .buildProduction({
                recursive: true,
                canonicalUrl: canonicalUrl,
                //browsers: config.browsers,
                less: config.less,
                scss: config.scss,
                optimizeImages: config.optimizeImages,
                inlineSize: config.inlineSize,
                inlineByRelationType: config.inlineByRelationType,
                manifest: config.manifest,
                asyncScripts: config.asyncScripts,
                cdnRoot: cdnRoot,
                noCompress: config.pretty,
                sharedBundles: config.sharedBundles,
                stripDebug: !(config.pretty || false),
                localeIds: localeIds
            })
            .minifyAssets(['Html'])
            .prettyPrintAssets({type: ['Html']})
            .writeAssetsToDisc({url: /^file:/, isLoaded: true}, outRoot)
            .if(cdnRoot)
                .writeAssetsToDisc({url: query.createPrefixMatcher(cdnRoot), isLoaded: true}, cdnOutRoot || outRoot, cdnRoot)
            .endif()
            .writeStatsToStderr()
            .run(done);
    });
};
