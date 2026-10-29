// Authentication owns identity only. Site policies opt into their own data work.
export function createAccountContext({siteId,sdkLoader=()=>import('./sdk.mjs?v=20261029-account-1')}={}) {
  let client,pending,user=null,unsubscribe;const listeners=new Set(),policies=new Map();
  const emit=()=>listeners.forEach(fn=>fn(user));
  const notifyPolicy=(event,value)=>{for(const policy of policies.values())Promise.resolve().then(()=>policy[event]?.(value,{siteId,client})).catch(()=>window.dispatchEvent(new CustomEvent('softm:sync-error',{detail:{siteId,policy:policy.id}})));};
  async function ready(){
    if(client)return client;
    if(!pending)pending=sdkLoader().then(sdk=>sdk.createSiteClient({siteId})).then(value=>{
      client=value;unsubscribe=client.onUser(next=>{const previous=user;user=next;emit();if(previous?.uid!==next?.uid){if(previous)notifyPolicy('onLogout',previous);if(next)notifyPolicy('onLogin',next);}});emit();return client;
    }).catch(error=>{pending=null;throw error;});return pending;
  }
  return Object.freeze({siteId,ready,get currentUser(){return user;},subscribe(fn){listeners.add(fn);fn(user);return ()=>listeners.delete(fn);},
    async login({popup,mode='login'}={}){const c=await ready();return c.login({popup,mode});},async logout(){const c=await ready();return c.logout();},
    registerPolicy(policy){if(!policy?.id||policies.has(policy.id))throw Error('고유한 사이트 정책 ID가 필요합니다.');policies.set(policy.id,policy);if(user)Promise.resolve().then(()=>policy.onLogin?.(user,{siteId,client})).catch(()=>{});return ()=>policies.delete(policy.id);},
    destroy(){unsubscribe?.();listeners.clear();policies.clear();}
  });
}
export {mountSiteAccount} from './account-menu.mjs?v=20261030-menu-1';
