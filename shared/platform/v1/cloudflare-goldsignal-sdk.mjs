// GoldSignal-only bridge to the Cloudflare account OAuth client.
// Opt-in migration: identity uses Cloudflare; existing Firebase vault data is not mounted or merged.
import {createCloudflareAccountClient} from '../../../services/cloudflare-account/src/client.mjs?v=20261113-goldsignal-auth-1';

export const GOLDSIGNAL_ACCOUNT_BASE='https://softm-hannun-account.softm.workers.dev';
export function createSiteClient({siteId}={}){
  if(siteId!=='goldsignal')throw Error('금시그널 전용 로그인 연결입니다.');
  const client=createCloudflareAccountClient({baseUrl:GOLDSIGNAL_ACCOUNT_BASE,siteId});
  const listeners=new Set();
  const emit=()=>{for(const fn of listeners)fn(client.currentUser);};
  return Object.freeze({
    siteId,
    get currentUser(){return client.currentUser;},
    onUser(fn){
      if(typeof fn!=='function')throw TypeError('로그인 상태 구독 함수가 필요합니다.');
      listeners.add(fn);fn(client.currentUser);return ()=>listeners.delete(fn);
    },
    async login({popup,mode='login'}={}){
      const user=await client.login({popup,mode});
      emit();
      return user;
    },
    async logout(){
      try{await client.logout();}
      finally{emit();}
    }
  });
}
