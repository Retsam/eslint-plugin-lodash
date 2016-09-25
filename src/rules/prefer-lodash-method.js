/**
 * @fileoverview Rule to check if there's a method in the chain start that can be in the chain
 */
'use strict'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        schema: [{
            type: 'object',
            properties: {
                methods: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                objects: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                }
            }
        }]
    },

    create(context) {

        const {isNativeCollectionMethodCall, getLodashMethodVisitor} = require('../util/lodashUtil')
        const {getMethodName, getCaller} = require('../util/astUtil')
        const [get, includes, cond, matches, property, some, map] = ['get', 'includes', 'cond', 'matches', 'property', 'some', 'map'].map(m => require(`lodash/${m}`))
        const ignoredMethods = get(context, ['options', 0, 'ignoreMethods'], [])
        const ignoredObjects = get(context, ['options', 0, 'ignoreObjects'], [])
        const usingLodash = new Set()

        function isNonNullObjectCreate(callerName, methodName, arg) {
            return callerName === 'Object' && methodName === 'create' && get(arg, 'value') !== null
        }

        function isStaticNativeMethodCall(node) {
            const staticMethods = {
                Object: ['assign', 'keys', 'values'],
                Array: ['isArray']
            }
            const callerName = get(node, 'callee.object.name')
            const methodName = getMethodName(node)
            return (callerName in staticMethods) && includes(staticMethods[callerName], methodName) || isNonNullObjectCreate(callerName, methodName, node.arguments[0])
        }

        function canUseLodash(node) {
            return isNativeCollectionMethodCall(node) || isStaticNativeMethodCall(node)
        }

        const getTextOfNode = cond([
            [matches({type: 'Identifier'}), property('name')],
            [property('type'), node => context.getSourceCode().getText(node)]
        ])

        function someMatch(patterns, str) {
            return str && some(patterns, pattern => str.match(pattern))
        }

        function shouldIgnore(node) {
            return someMatch(ignoredMethods, getMethodName(node)) || someMatch(ignoredObjects, getTextOfNode(getCaller(node)))
        }

        return {
            CallExpression: getLodashMethodVisitor(context, node => {
                usingLodash.add(node)
            }),
            'CallExpression:exit'(node) {
                if (!usingLodash.has(node) && !shouldIgnore(node) && canUseLodash(node)) {
                    context.report(node, `Prefer '_.${getMethodName(node)}' over the native function.`)
                }
            }
        }
    }
}
