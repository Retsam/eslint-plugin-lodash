/**
 * @fileoverview Rule to enforce a specific chain style
 */
'use strict'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
module.exports = function (context) {
    const {isChainable, isChainBreaker, isExplicitChainStart, isImplicitChainStart} = require('../util/lodashUtil')
    const {isMethodCall} = require('../util/astUtil')
    const settings = require('../util/settingsUtil').getSettings(context)
    const callExpressionVisitors = {
        'as-needed'(node) {
            if (isExplicitChainStart(node, settings.pragma)) {
                let curr = node.parent.parent
                let needed = false
                while (isMethodCall(curr) && !isChainBreaker(curr, settings.version)) {
                    if (!isChainable(curr, settings.version) && !isChainBreaker(curr.parent.parent, settings.version)) {
                        needed = true
                    }
                    curr = curr.parent.parent
                }
                if (isMethodCall(curr) && !needed) {
                    context.report(node, 'Unnecessary explicit chaining')
                }
            }
        },
        implicit(node) {
            if (isExplicitChainStart(node, settings.pragma)) {
                context.report(node, 'Do not use explicit chaining')
            }
        },
        explicit(node) {
            if (isImplicitChainStart(node, settings.pragma)) {
                context.report(node, 'Do not use implicit chaining')
            }
        }
    }

    return {
        CallExpression: callExpressionVisitors[context.options[0] || 'as-needed']
    }
}

module.exports.schema = [
    {
        enum: ['as-needed', 'implicit', 'explicit']
    }
]