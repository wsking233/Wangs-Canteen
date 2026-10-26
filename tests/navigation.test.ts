import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRoute } from '../src/lib/navigation.ts'
test('routes use a safe default and preserve known page anchors',()=>{
 assert.deepEqual(parseRoute(''),{page:'today',itemId:undefined});assert.deepEqual(parseRoute('#inventory'),{page:'inventory',itemId:undefined})
 assert.deepEqual(parseRoute('#unknown'),{page:'today',itemId:undefined});assert.deepEqual(parseRoute('#__proto__'),{page:'today',itemId:undefined})
 assert.deepEqual(parseRoute('#inventory/low'),{page:'inventory',itemId:'low'})
})
test('requested meal IDs decode once and malformed escape sequences do not crash',()=>{
 assert.deepEqual(parseRoute('#today/meal%2Fone'),{page:'today',itemId:'meal/one'})
 assert.deepEqual(parseRoute('#today/%invalid'),{page:'today',itemId:undefined})
 assert.deepEqual(parseRoute('#history/unwanted'),{page:'history',itemId:undefined})
})
