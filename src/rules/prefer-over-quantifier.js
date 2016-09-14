/**
 * @fileoverview Rule to check if a _.filter condition or multiple filters should be _.overEvery or _.overSome
 */
'use strict'

/**
 * @fileoverview Rule to check if a _.filter condition or multiple filters should be _.overEvery or _.overSome
 */
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    create(context) {
        const {getLodashMethodVisitor} = require('../util/lodashUtil')
        const {getValueReturnedInFirstLine, getFirstParamName, isObjectOfMethodCall, getMethodName} = require('../util/astUtil')
        const {isAliasOfMethod} = require('../util/methodDataUtil')
        const conditionMethods = ['filter', 'reject', 'pickBy', 'omitBy', 'findIndex', 'findLastIndex', 'find', 'findLast', 'findKey', 'findLastKey']
        const message = 'Prefer _.{{method}} instead of a {{connective}}'

        const reportConstants = {
            '&&': {
                method: 'overEvery',
                connective: 'conjunction'
            },
            '||': {
                method: 'overSome',
                connective: 'disjunction'
            }
        }

        function onlyPassesIdentifier(node) {
            return node.arguments.length === 1 && node.arguments[0].type === 'Identifier'
        }


        function isOnlyParamInvocationsWithOperator(node, paramName, operator) {
            if (node.type === 'CallExpression') {
                return onlyPassesIdentifier(node) && node.arguments[0].name === paramName
            }
            if (node.type === 'LogicalExpression') {
                return node.operator === operator &&
                    isOnlyParamInvocationsWithOperator(node.left, paramName, operator) &&
                    isOnlyParamInvocationsWithOperator(node.right, paramName, operator)
            }
        }

        function isCallToConditionMethod(method, version) {
            return conditionMethods.some(m => isAliasOfMethod(version, m, method))
        }

        function reportIfConnectiveOfParamInvocations(node) {
            const retVal = getValueReturnedInFirstLine(node)
            const paramName = getFirstParamName(node)
            if (retVal && retVal.type === 'LogicalExpression' && (retVal.operator === '&&' || retVal.operator === '||')) {
                if (isOnlyParamInvocationsWithOperator(retVal, paramName, retVal.operator)) {
                    context.report(node, message, reportConstants[retVal.operator])
                }
            }
        }

        function reportIfDoubleFilterLiteral(callType, iteratee, node, version) {
            if (callType === 'chained' && iteratee.type === 'Identifier' && isObjectOfMethodCall(node) &&
                isCallToConditionMethod(getMethodName(node.parent.parent), version) && onlyPassesIdentifier(node.parent.parent)) {
                context.report(node, message, reportConstants['&&'])
            }
        }

        return {
            CallExpression: getLodashMethodVisitor(context, (node, iteratee, {method, version, callType}) => {
                if (isCallToConditionMethod(method, version)) {
                    reportIfConnectiveOfParamInvocations(iteratee)
                    reportIfDoubleFilterLiteral(callType, iteratee, node, version)
                }
            })
        }
    }
}