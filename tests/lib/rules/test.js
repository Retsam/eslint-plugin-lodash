'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const rule = require('../../../src/rules/test')
const ruleTesterUtil = require('../testUtil/ruleTesterUtil')

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

const ruleTester = ruleTesterUtil.getRuleTester()
ruleTester.run('no-extra-args', rule, {
    valid: [
    ],
    invalid: [{
        code: 'import uniq from "lodash/uniq"; var x = uniq(arr, "prop")',
        errors: [{message: 'Too many arguments passed to `uniq` (expected 1).'}],
        parserOptions: {
            sourceType: 'module'
        }
    }, {
        code: 'import f from "lodash/uniq"; var x = f(arr, "prop")',
        errors: [{message: 'Too many arguments passed to `uniq` (expected 1).'}],
        parserOptions: {
            sourceType: 'module'
        }
    }, {
        code: 'import {uniq, head} from "lodash"; uniq(arr, "prop");',
        errors: [{message: 'Too many arguments passed to `uniq` (expected 1).'}],
        parserOptions: {
            sourceType: 'module'
        }
    }, {
        code: 'import {uniq as f, head} from "lodash"; f(arr, "prop");',
        errors: [{message: 'Too many arguments passed to `uniq` (expected 1).'}],
        parserOptions: {
            sourceType: 'module'
        }
    }]
})
