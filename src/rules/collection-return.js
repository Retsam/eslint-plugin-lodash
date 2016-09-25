/**
 * @fileoverview Rule to check that iteratees for all collection functions except forEach return a value;
 */
'use strict'

/**
 * @fileoverview Rule to check that iteratees for all collection functions except forEach return a value;
 */
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    create(context) {
        const {getLodashMethodVisitor} = require('../util/lodashUtil')
        const {getCollectionMethods} = require('../util/methodDataUtil')
        const {isFunctionDefinitionWithBlock} = require('../util/astUtil')
        let collectionMethods
        const funcInfos = new Map()
        let currFuncInfo = {}
        return {
            'CallExpression:exit': getLodashMethodVisitor(context, (node, iteratee, {method, version}) => {
                collectionMethods = collectionMethods || new Set(getCollectionMethods(version))
                if (collectionMethods.has(method) && funcInfos.has(iteratee)) {
                    const {hasReturn} = funcInfos.get(iteratee)
                    if (isFunctionDefinitionWithBlock(iteratee) && !hasReturn) {
                        context.report(node, `Do not use _.${method} without returning a value`)
                    }
                }
            }),
            ReturnStatement() {
                currFuncInfo.hasReturn = true
            },
            onCodePathStart(codePath, node) {
                currFuncInfo = {
                    upper: currFuncInfo,
                    codePath,
                    hasReturn: false
                }
                funcInfos.set(node, currFuncInfo)
            },
            onCodePathEnd() {
                currFuncInfo = currFuncInfo.upper
            }
        }
    }
}
