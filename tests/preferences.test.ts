import test from 'node:test'
import assert from 'node:assert/strict'
import { needsRestock, validateFood } from '../src/lib/inventory.ts'
import { parseTheme, resolveTheme } from '../src/lib/theme.ts'
const food={id:'f',name:'饺子',quantity:2,unit:'份',enabled:true,note:''}
test('restock threshold is inclusive, supports decimals and ignores disabled food',()=>{
 assert.equal(needsRestock(food),false);assert.equal(needsRestock({...food,quantity:0}),true)
 assert.equal(needsRestock({...food,lowStockAt:2}),true);assert.equal(needsRestock({...food,quantity:0.5,lowStockAt:0.5}),true)
 assert.equal(needsRestock({...food,quantity:0,enabled:false}),false)
 assert.doesNotThrow(()=>validateFood({...food,lowStockAt:0.5}));assert.throws(()=>validateFood({...food,lowStockAt:-1}));assert.throws(()=>validateFood({...food,lowStockAt:0.001}))
})
test('theme preference validates stored values and resolves explicit versus system appearance',()=>{
 assert.equal(parseTheme('dark'),'dark');assert.equal(parseTheme('light'),'light');assert.equal(parseTheme(null),'system');assert.equal(parseTheme('unsupported'),'system')
 assert.equal(resolveTheme('dark',false),true);assert.equal(resolveTheme('light',true),false);assert.equal(resolveTheme('system',true),true);assert.equal(resolveTheme('system',false),false)
})
