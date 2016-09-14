/**
 * @fileoverview Rule to check if a call to filter should be a call to reject
 */
'use strict'

/**
 * @fileoverview Rule to check if a call to filter should be a call to reject
 */
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        schema: [{
            type: 'integer'
        }]
    },

    create(context) {
        const {isCallToLodashMethod, getLodashMethodVisitor,} = require('../util/lodashUtil')
        const {getValueReturnedInFirstLine, getFirstParamName, isNegationOfMemberOf, isNotEqEqToMemberOf} = require('../util/astUtil')
        const {isAliasOfMethod} = require('../util/methodDataUtil')
        const DEFAULT_MAX_PROPERTY_PATH_LENGTH = 3
        const maxPropertyPathLength = parseInt(context.options[0], 10) || DEFAULT_MAX_PROPERTY_PATH_LENGTH

        function isNegativeExpressionFunction(func) {
            const returnValue = getValueReturnedInFirstLine(func)
            const firstParamName = getFirstParamName(func)
            return isNegationOfMemberOf(returnValue, firstParamName, maxPropertyPathLength) ||
                isNotEqEqToMemberOf(returnValue, firstParamName, maxPropertyPathLength) || isCallToLodashMethod(func, 'negate', context)
        }

        return {
            CallExpression: getLodashMethodVisitor(context, (node, iteratee, {method, version}) => {
                if (isAliasOfMethod(version, 'filter', method) && isNegativeExpressionFunction(iteratee)) {
                    context.report(node, 'Prefer _.reject over negative condition')
                }
            })
        }
    }
}