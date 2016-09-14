/**
 * @fileoverview Rule to check if a call to map and flatten should be a call to _.flatMap
 */
'use strict'

/**
 * @fileoverview Rule to check if a call to map and flatten should be a call to _.flatMap
 */
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    create(context) {
        const {getLodashMethodVisitor, isCallToMethod, isLodashCallToMethod, getImportedLodashMethod} = require('../util/lodashUtil')
        const {getCaller} = require('../util/astUtil')
        const {isAliasOfMethod} = require('../util/methodDataUtil')
        const settings = require('../util/settingsUtil').getSettings(context)

        function isChainedMapFlatten(callType, node, version) {
            return callType === 'chained' && isCallToMethod(getCaller(node), version, 'map')
        }

        function isCallToLodashMap(node, version) {
            return isLodashCallToMethod(node, settings, 'map') || isAliasOfMethod(version, 'map', getImportedLodashMethod(context, node))
        }

        return {
            CallExpression: getLodashMethodVisitor(context, (node, iteratee, {method, version, callType}) => {
                if (isAliasOfMethod(version, 'flatten', method) &&
                    (isChainedMapFlatten(callType, node, version) ||
                    isCallToLodashMap(node.arguments[0], version))) {
                    context.report(node, 'Prefer _.flatMap over consecutive map and flatten.')
                }
            })
        }
    }
}