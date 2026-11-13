import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';

test('토지한눈 공개 주소는 공통 계정 Worker에서만 승인한다',async()=>{
  const origin='https://tojihannun.designboard.net';
  const ok=await worker.fetch(new Request('https://softm-hannun-account.softm.workers.dev/api/connect/exchange',{
    method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}
  }),{});
  assert.equal(ok.status,204);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'),origin);
  assert.match(ok.headers.get('Access-Control-Allow-Methods'),'POST');
});
test('비등록 외부 도메인은 토지한눈으로 위장해도 CORS를 통과하지 않는다',async()=>{
  const bad=await worker.fetch(new Request('https://softm-hannun-account.softm.workers.dev/api/connect/exchange',{
    method:'OPTIONS',headers:{Origin:'https://not-tojihannun.example','Access-Control-Request-Method':'POST'}
  }),{});
  assert.equal(bad.status,403);
  assert.equal(bad.headers.get('Access-Control-Allow-Origin'),null);
});
