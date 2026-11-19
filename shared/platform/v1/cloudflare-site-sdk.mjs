// Cloudflare identity-only adapter for opt-in Hannun sites.
// Personal records are never uploaded by login and remain service-owned.
import {createCloudflareAccountClient} from '../../../services/cloudflare-account/src/client.mjs?v=20261117-hannun-rollout-1';

export const CLOUDFLARE_ACCOUNT_BASE = 'https://softm-hannun-account.softm.workers.dev';
const ENABLED_SITES = new Set([
  'policyfundfinder',
  'evchargingstation',
  'hydrogenstation',
  'foodhannun',
  'matjiphannun',
  'homecare'
]);

export function createSiteClient({siteId}={}) {
  if(!ENABLED_SITES.has(siteId))throw Error('Cloudflare 계정으로 전환되지 않은 서비스입니다.');
  const client=createCloudflareAccountClient({baseUrl:CLOUDFLARE_ACCOUNT_BASE,siteId});
  const listeners=new Set();
  const notify=()=>{for(const listener of listeners)listener(client.currentUser);};
  return Object.freeze({
    siteId,
    get currentUser(){return client.currentUser;},
    onUser(listener){
      if(typeof listener!=='function')throw TypeError('로그인 상태 구독 함수가 필요합니다.');
      listeners.add(listener);
      listener(client.currentUser);
      return ()=>listeners.delete(listener);
    },
    async login({popup,mode='login'}={}){
      const user=await client.login({popup,mode});
      notify();
      return user;
    },
    async logout(){
      try{await client.logout();}
      finally{notify();}
    },
    get:(...args)=>client.get(...args),
    put:(...args)=>client.put(...args),
    list:(...args)=>client.list(...args),
    remove:(...args)=>client.remove(...args)
  });
}
