// WeatherHannun-only bridge to the existing Cloudflare account OAuth client.
// This module is opt-in and never imports Firebase Auth/Firestore.
// Remote Firebase backups are deliberately not mounted here until migrated.
import {createCloudflareAccountClient} from '../../../services/cloudflare-account/src/client.mjs?v=20261113-regex-fixed-2';

export const WEATHER_ACCOUNT_BASE='https://softm-hannun-account.softm.workers.dev';
export function createSiteClient({siteId}={}){
  if(siteId!=='weatherhannun')throw Error('날씨한눈 전용 로그인 연결입니다.');
  const client=createCloudflareAccountClient({baseUrl:WEATHER_ACCOUNT_BASE,siteId});
  const listeners=new Set();
  const emit=()=>{for(const fn of listeners)fn(client.currentUser);};
  return Object.freeze({
    siteId,
    get currentUser(){return client.currentUser;},
    onUser(fn){if(typeof fn!=='function')throw TypeError('로그인 상태 구독 함수가 필요합니다.');listeners.add(fn);fn(client.currentUser);return ()=>listeners.delete(fn);},
    async login({popup,mode='login'}={}){
      const user=await client.login({popup,mode});
      emit();
      return user;
    },
    requestPersonal:(path,method,body)=>client.requestPersonal(path,method,body),
    async logout(){
      try{await client.logout();}
      finally{emit();}
    }
  });
}
