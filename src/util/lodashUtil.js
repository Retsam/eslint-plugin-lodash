'use strict'
const _ = require('lodash')
const methodDataUtil = require('./methodDataUtil')
const astUtil = require('./astUtil')

function getImportedName(def) {
    if (def && def.type === 'ImportBinding' && def.parent.type === 'ImportDeclaration') {
        return _.get(def, 'parent.source.value')
    }
}

function isImportedLodash(node, context) {
    if (context) {
        const def = getDefinition(context.getScope(), node)
        return getImportedName(def) === 'lodash'
    }
}

/**
 * Returns whether the node is a lodash call with the specified pragma
 * @param {Object} node
 * @param {string} pragma
 * @returns {boolean}
 */
function isLodashCall(node, pragma, context) {
    return (pragma && astUtil.isCallFromObject(node, pragma)) || isImportedLodash(astUtil.getCaller(node), context)
}

/**
 * Returns whether or not a node is a chainable method call in the specified version
 * @param {Object} node
 * @param {number} version
 * @returns {boolean}
 */
function isChainable(node, version) {
    return _.includes(methodDataUtil.getChainableAliases(version), astUtil.getMethodName(node))
}

/**
 * Returns whether the node is an implicit chain start, '_(obj)...'
 * @param {Object} node
 * @param {string} pragma
 * @returns {boolean}
 */
function isImplicitChainStart(node, pragma, context) {
    return (pragma && node.callee.name === pragma) || isImportedLodash(node.callee, context)
}

/**
 * Returns whether the node is an explicit chain start, '_.chain(obj)...'
 * @param {Object} node
 * @param {string} pragma
 * @returns {boolean}
 */
function isExplicitChainStart(node, pragma, context) {
    return isLodashCall(node, pragma, context) && astUtil.getMethodName(node) === 'chain'
}

/**
 * Returns whether the node specified is a chain start, implicit or explicit
 * @param {Object} node
 * @param {string} pragma
 * @returns {undefined|boolean}
 */
function isLodashChainStart(node, pragma, context) {
    return node && node.type === 'CallExpression' && (isImplicitChainStart(node, pragma, context) || isExplicitChainStart(node, pragma, context))
}

/**
 * Returns whehter the node is a chain breaker method in the specified version
 * @param {Object} node
 * @param {number} version
 * @returns {boolean}
 */
function isChainBreaker(node, version) {
    return methodDataUtil.isAliasOfMethod(version, 'value', astUtil.getMethodName(node))
}

/**
 * Returns whether the node is in a lodash chain
 * @param {Object} node
 * @param {string} pragma
 * @param {number} version
 * @returns {*}
 */
function isLodashWrapper(node, pragma, version) {
    let currentNode = node
    let chainable = true
    while (astUtil.isMethodCall(currentNode)) {
        if (isLodashChainStart(currentNode, pragma)) {
            return true
        }
        if (isChainBreaker(currentNode, version)) {
            return false
        }
        if (!isChainable(currentNode, version)) {
            chainable = false
        }
        currentNode = astUtil.getCaller(currentNode)
    }
    return chainable ? isLodashChainStart(currentNode, pragma) : isExplicitChainStart(currentNode, pragma)
}

/**
 * Returns whether the node is a call to the specified method or one of its aliases in the version
 * @param {Object} node
 * @param {number} version
 * @param {string} method
 * @returns {boolean}
 */
function isCallToMethod(node, version, method) {
    return methodDataUtil.isAliasOfMethod(version, method, astUtil.getMethodName(node))
}

/**
 * Returns whether or not the node is a call to a lodash wrapper method
 * @param {Object} node
 * @param {number} version
 * @returns {boolean}
 */
function isLodashWrapperMethod(node, version) {
    return _.includes(methodDataUtil.getWrapperMethods(version), astUtil.getMethodName(node)) && node.type === 'CallExpression'
}

/**
 * Gets the 'isX' method for a specified type, e.g. isObject
 * @param {string} name
 * @returns {string|null}
 */
function getIsTypeMethod(name) {
    const types = ['number', 'boolean', 'function', 'Function', 'string', 'object', 'undefined', 'Date', 'Array', 'Error', 'Element']
    return _.includes(types, name) ? `is${_.capitalize(name)}` : null
}

/**
 * Returns whether or not the node is a call to a native collection method
 * @param {Object} node
 * @returns {boolean}
 */
function isNativeCollectionMethodCall(node) {
    return _.includes(['every', 'fill', 'filter', 'find', 'findIndex', 'forEach', 'includes', 'map', 'reduce', 'reduceRight', 'some'], astUtil.getMethodName(node))
}

/**
 * Returns whether or not the node is a call to a lodash collection method in the specified version
 * @param {Object} node
 * @param {number} version
 * @returns {boolean}
 */
function isLodashCollectionMethod(node, version) {
    return node.type === 'CallExpression' && _.includes(methodDataUtil.getCollectionMethods(version), astUtil.getMethodName(node))
}

function getDefinition(scope, node) {
    const ref = _.find(scope.references, {identifier: node})
    return _.get(ref, 'resolved.defs[0]')
}

function getImportedLodashMethod(context, node) {
    const scope = context && context.getScope()
    if (!astUtil.isMethodCall(node) && scope) {
        const def = getDefinition(scope, node.callee)
        if (def) {
            const imported = getImportedName(def)
            if (imported) {
                if (imported === 'lodash') {
                    return def.node.imported.name
                } else {
                    const match = /^lodash\/(\w+)/.exec(imported)
                    return match && match[1]
                }
            }
        }
    }
}
/**
 * Gets the context's Lodash settings and a function and returns a visitor that calls the function for every Lodash or chain call
 * @param {RuleContext} context
 * @param {LodashReporter} reporter
 * @returns {NodeTypeVisitor}
 */
function getLodashMethodVisitor(context, reporter) {
    return function (node) {
        const {pragma, version} = require('./settingsUtil').getSettings(context)
        let iterateeIndex
        if (isLodashChainStart(node, pragma, context)) {
            let prevNode = node
            node = node.parent.parent
            while (astUtil.getCaller(node) === prevNode && astUtil.isMethodCall(node) && !isChainBreaker(node, version)) {
                const method = astUtil.getMethodName(node)
                iterateeIndex = methodDataUtil.getIterateeIndex(version, method)
                reporter(node, node.arguments[iterateeIndex - 1], {callType: 'chained', method, version})
                prevNode = node
                node = node.parent.parent
            }
        } else if (isLodashCall(node, pragma, context)) {
            const method = astUtil.getMethodName(node)
            iterateeIndex = methodDataUtil.getIterateeIndex(version, method)
            reporter(node, node.arguments[iterateeIndex], {callType: 'method', method, version})
        } else {
            const method = getImportedLodashMethod(context, node)
            if (method) {
                iterateeIndex = methodDataUtil.getIterateeIndex(version, method)
                reporter(node, node.arguments[iterateeIndex], {method, callType: 'single', version})
            }
        }
    }
}

/**
 * Returns whether the node's method call supports using shorthands in the specified version
 * @param {Number} version
 * @param {object} node
 * @returns {boolean}
 */
function methodSupportsShorthand(version, method) {
    return _.includes(methodDataUtil.getShorthandMethods(version), method)
}

/**
 * Gets the context, settings, checks whether shorthand is used and can be used, and messages, and returns a visitor
 * @param {RuleContext} context
 * @param {LodashSettings} settings
 * @param {ShorthandChecks} checks
 * @param {ShorthandMessages} messages
 * @returns {NodeTypeVisitor}
 */
function getShorthandVisitor(context, checks, messages) {
    return getLodashMethodVisitor(context, {
        always(node, iteratee, {method, version}) {
            if (methodSupportsShorthand(version, method) && checks.canUseShorthand(iteratee)) {
                context.report(iteratee, messages.always)
            }
        },
        never(node, iteratee, {method}) {
            if (checks.usesShorthand(node, iteratee, method)) {
                context.report(iteratee || node.callee.property, messages.never)
            }
        }
    }[context.options[0] || 'always'])
}

function isLodashCallToMethod(node, settings, method) {
    return isLodashCall(node, settings.pragma) && isCallToMethod(node, settings.version, method)
}

/**
 * Returns whether the node is a side effect iteration method call (e.g forEach)
 * @param node
 * @param version
 * @returns {boolean}
 */
function isSideEffectIterationMethod(node, version) {
    return _.includes(methodDataUtil.getSideEffectIterationMethods(version), astUtil.getMethodName(node))
}

module.exports = {
    isLodashCall,
    isLodashChainStart,
    isChainable,
    isLodashWrapper,
    isChainBreaker,
    isCallToMethod,
    isLodashCallToMethod,
    isLodashWrapperMethod,
    getIsTypeMethod,
    isLodashCollectionMethod,
    isNativeCollectionMethodCall,
    isImplicitChainStart,
    isExplicitChainStart,
    getLodashMethodVisitor,
    methodSupportsShorthand,
    getShorthandVisitor,
    isSideEffectIterationMethod,
    getImportedLodashMethod
}

/**
 @callback LodashReporter
 @param {Object} node
 @param {Object} iteratee
 @param {Object?} options
 */

/**
 @callback NodeTypeVisitor
 @param {Object} node
 */

/**
 * @typedef {Object} ShorthandChecks
 * @property {function} canUseShorthand
 * @property {function} usesShorthand
 */

/**
 * @typedef {object} ShorthandMessages
 * @property {string} always
 * @property {string} never
 */
