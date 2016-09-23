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
        const {isLodashCallToMethod, getLodashMethodVisitor, isCallToMethod} = require('../util/lodashUtil')
        const {getValueReturnedInFirstStatement, getFirstParamName, isNegationOfMemberOf, isNotEqEqToMemberOf} = require('../util/astUtil')
        const settings = require('../util/settingsUtil').getSettings(context)
        const DEFAULT_MAX_PROPERTY_PATH_LENGTH = 3
        const maxLength = parseInt(context.options[0], 10) || DEFAULT_MAX_PROPERTY_PATH_LENGTH

        function isNegativeExpressionFunction(func) {
            const returnValue = getValueReturnedInFirstStatement(func)
            const firstParamName = getFirstParamName(func)
            return isNegationOfMemberOf(returnValue, firstParamName, {maxLength}) ||
                isNotEqEqToMemberOf(returnValue, firstParamName, {maxLength}) || isLodashCallToMethod(func, settings, 'negate')
        }

        return {
            CallExpression: getLodashMethodVisitor(settings, (node, iteratee) => {
                if (isCallToMethod(node, settings.version, 'filter') && isNegativeExpressionFunction(iteratee)) {
                    context.report(node, 'Prefer _.reject over negative condition')
                }
            })
        }
    }
}