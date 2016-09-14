/**
 * @fileoverview Rule to check if the property shorthand can be used
 */
'use strict'

/**
 * @fileoverview Rule to check if the property shorthand can be used
 */
// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------


module.exports = {
    meta: {
        schema: [{
            enum: ['always', 'never']
        }]
    },

    create(context) {
        const {isCallToLodashMethod, getShorthandVisitor} = require('../util/lodashUtil')
        const {isMemberExpOf, getValueReturnedInFirstLine, getFirstParamName} = require('../util/astUtil')

        function isExplicitParamFunction(func) {
            return isMemberExpOf(getValueReturnedInFirstLine(func), getFirstParamName(func), Number.MAX_VALUE, false)
        }

        function canUseShorthand(iteratee) {
            return isCallToLodashMethod(iteratee, 'property', context) || isExplicitParamFunction(iteratee)
        }

        function usesShorthand(node, iteratee) {
            return iteratee && iteratee.type === 'Literal' && !node.arguments[node.arguments.indexOf(iteratee) + 1]
        }

        return {
            CallExpression: getShorthandVisitor(context, {
                canUseShorthand,
                usesShorthand
            }, {
                always: 'Prefer property shorthand syntax',
                never: 'Do not use property shorthand syntax'
            })
        }
    }
}
