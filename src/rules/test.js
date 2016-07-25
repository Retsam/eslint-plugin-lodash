'use strict'
const arities = {uniq: 1}
const astUtil = require('../util/astUtil')
const _ = require('lodash')

module.exports = {
    create(context) {
        const getDefinition = node => {
            const scope = context.getScope()
            const ref = _.find(scope.references, {identifier: node})
            const def = _.get(ref, 'resolved.defs[0]')
            return def
        }

        const getImportedMethod = name => {
            const match = /^lodash\/(\w+)/.exec(name)
            return match && match[1]
        }

        const getDefinedMethod = def => {
            if (def.type === 'ImportBinding' && def.parent.type === 'ImportDeclaration') {
                const imported = _.get(def, 'parent.source.value')
                if (imported === 'lodash') {
                    return def.node.imported.name
                } else {
                    return getImportedMethod(imported)
                }
            }
        }

        return {
            CallExpression(node) {
                if (!astUtil.isMethodCall(node)) {
                    const def = getDefinition(node.callee)
                    if (!def) {
                        return
                    }
                    const importedMethod = getDefinedMethod(def)
                    if (importedMethod in arities) {
                        const actualArity = node.arguments.length
                        const expectedArity = arities[importedMethod]
                        if (actualArity > expectedArity) {
                            context.report(node, 'Too many arguments passed to `uniq` (expected 1).')
                        }
                    }
                }
            }
        }
    }
}