/**
 * @fileoverview Rule to check if a call to map should be a call to invokeMap
 */
'use strict'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {}
    },

    create(context) {
        const {getLodashMethodVisitor} = require('../util/lodashUtil')
        const {isCallFromObject, getValueReturnedInFirstLine, getFirstParamName} = require('../util/astUtil')
        const {isAliasOfMethod} = require('../util/methodDataUtil')
        function isFunctionMethodCallOfParam(func) {
            const firstParamName = getFirstParamName(func)
            return firstParamName && isCallFromObject(getValueReturnedInFirstLine(func), firstParamName)
        }

        return {
            CallExpression: getLodashMethodVisitor(context, (node, iteratee, {method, version}) => {
                if (isAliasOfMethod(version, 'map', method) && isFunctionMethodCallOfParam(iteratee)) {
                    context.report(node, 'Prefer _.invokeMap over map to a method call.')
                }
            })
        }
    }
}
