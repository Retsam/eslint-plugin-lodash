/**
 * @fileoverview Rule to make sure lodash method calls don't use superfluous arguments
 */
'use strict'

/**
 * @fileoverview Rule to make sure lodash method calls don't use superfluous arguments
 */
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    create(context) {
        const {version} = require('../util/settingsUtil').getSettings(context)
        const {getLodashMethodVisitor} = require('../util/lodashUtil')
        const {getFunctionMaxArity} = require('../util/methodDataUtil')

        function getExpectedArity(callType, method) {
            const maxArity = getFunctionMaxArity(version, method)
            return Math.max(callType === 'chained' ? maxArity - 1: maxArity, 0)
        }

        return {
            CallExpression: getLodashMethodVisitor(context, (node, iteratee, {callType, method}) => {
                const expectedArity = getExpectedArity(callType, method)
                if (node.arguments.length > expectedArity) {
                    context.report({
                        node,
                        message: 'Too many arguments passed to `{{method}}` (expected {{expectedArity}}).',
                        data: {method, expectedArity}
                    })
                }
            })
        }
    }
}
