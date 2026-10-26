import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseMeal, recordMeal, parsePantry, type Combination, type Pantry } from '../src/lib/pantry.ts'
const foods=[{id:'chicken',name:'炸鸡',unit:'块',quantity:8,enabled:true,note:''},{id:'pasta',name:'意面',unit:'份',quantity:5,enabled:true,note:''}]
const meal: Combination={id:'dinner',name:'炸鸡配意面',items:[{foodId:'chicken',quantity:2,unit:'块'},{foodId:'pasta',quantity:1,unit:'份'}]}
const pantry: Pantry={version:3,foods,combinations:[meal],records:[]}
const now='2026-10-26T14:00:00.000Z'

test('confirming a meal creates an immutable snapshot and deducts all food together',()=>{
 const result=recordMeal(pantry,meal,meal.items,'record-1',now)
 assert.deepEqual(result.foods.map(food=>food.quantity),[6,4]);assert.equal(result.records.length,1)
 assert.equal(result.records[0].items[0].name,'炸鸡');assert.deepEqual(pantry.foods.map(food=>food.quantity),[8,5]);assert.equal(pantry.records.length,0)
 assert.deepEqual(parsePantry(JSON.stringify(result)),result)
})
test('actual portions override the saved combination without changing its template',()=>{
 const items=[{...meal.items[0],quantity:0.1},{...meal.items[1],quantity:0.25}]
 const result=recordMeal(pantry,meal,items,'record-1',now)
 assert.equal(result.foods[0].quantity,7.9);assert.equal(result.foods[1].quantity,4.75);assert.deepEqual(result.combinations[0],meal)
 assert.throws(()=>recordMeal(result,meal,items,'record-1',now),/已记录/)
})
test('insufficient, deleted, disabled or changed-unit food cannot be consumed, with no partial deduction',()=>{
 for(const food of [{...foods[1],quantity:0.5},{...foods[1],enabled:false},{...foods[1],unit:'包'}]) assert.throws(()=>recordMeal({...pantry,foods:[foods[0],food]},meal,meal.items,'r',now))
 assert.throws(()=>recordMeal({...pantry,foods:[foods[0]]},meal,meal.items,'r',now))
 assert.deepEqual(pantry.foods.map(food=>food.quantity),[8,5])
 assert.throws(()=>recordMeal(pantry,meal,[meal.items[0],meal.items[0]],'r',now))
})
test('recommendation only picks feasible meals and changes to an alternative when one exists',()=>{
 const unavailable={...meal,id:'huge',items:[{...meal.items[0],quantity:100}]}
 assert.equal(chooseMeal({...pantry,combinations:[unavailable]}),null)
 const second={...meal,id:'second'}
 assert.equal(chooseMeal({...pantry,combinations:[meal,second,unavailable]},'dinner',()=>0)?.id,'second')
 assert.equal(chooseMeal(pantry,'dinner',()=>0)?.id,'dinner')
 assert.equal(chooseMeal({...pantry,combinations:[]}),null)
})
test('recorded names and units survive later inventory edits or deletion',()=>{
 const result=recordMeal(pantry,meal,meal.items,'r',now)
 const modified={...result,foods:[]}
 assert.equal(parsePantry(JSON.stringify(modified)).records[0].items[0].name,'炸鸡')
})
