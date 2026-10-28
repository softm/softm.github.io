import test from 'node:test';import assert from 'node:assert/strict';
import {requestWithdrawal,withdrawalStatus,processWithdrawal} from '../functions/withdrawal.mjs';
const receipt='r'.repeat(43),uid='fixture';
test('withdrawal requires exact account, explicit acknowledgement and confirmation before writes',async()=>{
 for(const body of [{},{uid,receipt,confirmation:'회원탈퇴',acknowledged:false},{uid:'another',receipt,confirmation:'회원탈퇴',acknowledged:true},{uid,receipt:'bad',confirmation:'회원탈퇴',acknowledged:true}]){
  await assert.rejects(requestWithdrawal({db:{collection(){throw Error('unexpected database access');}},uid,body}),{message:'withdrawal-confirmation-required'});
 }
});
test('receipt cannot probe invalid IDs or accept weak secrets',async()=>{for(const [user,secret]of [['a/b',receipt],[uid,'bad'],['x'.repeat(129),receipt]])await assert.rejects(withdrawalStatus({db:{},uid:user,receipt:secret}),{message:'withdrawal-receipt-invalid'});});
test('worker never accepts a client path as its deletion target',async()=>{await assert.rejects(processWithdrawal({db:{},uid:'users/another'}),{message:'invalid-withdrawal-target'});});
