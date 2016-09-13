'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const rule = require('../../../src/rules/no-commit')
const ruleTesterUtil = require('../testUtil/ruleTesterUtil')

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

const ruleTester = ruleTesterUtil.getRuleTester()
const errors = [{message: 'Do not end chain with commit.'}]
ruleTester.run('no-commit', rule, {
    valid: [
        'var x = _(a).map(f).value();',
        '_(a).filter(f).forEach(g);'
    ],
    invalid: [{
        code: 'import _ from "lodash"; _(arr).map(f).commit();',
        errors,
        parserOptions: {
            sourceType: 'module'
        }
    }]
})
