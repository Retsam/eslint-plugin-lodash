/**
 * @fileoverview Rule to ensure a lodash chain ends
 */
'use strict'

/**
 * @fileoverview Rule to ensure a lodash chain ends
 */
// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
    create(context) {
        const {isExplicitMethodChaining, isChainBreaker, isCallToMethod, isChainable, isEndOfChain} = require('../util/lodashUtil')
        const settings = require('../util/settingsUtil').getSettings(context)
        function isExplicitChainWithoutBreaker(node) {
            return isExplicitMethodChaining(node, settings.version) && !isChainBreaker(node, settings.version)
        }
        function isEvaluatedWhenLazy(node) {
            return isCallToMethod(node, settings.version, 'commit') || !isChainable(node, settings.version)
        }
        return {
            CallExpression(node) {
                if (isEndOfChain(node, settings.pragma, settings.version) && (!isEvaluatedWhenLazy(node) || isExplicitChainWithoutBreaker(node))) {
                    context.report(node, 'Missing unwrapping at end of chain')
                }
            }
        }
    }
}
