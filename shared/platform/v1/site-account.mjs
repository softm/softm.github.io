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
export function mountSiteAccount({siteId,name,target='header',account,vault}={}) {
  const host=document.createElement('softm-site-account');host.dataset.site=siteId;host.style.cssText='display:inline-flex;max-width:100%;min-width:0;flex:0 1 auto';const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>:host{font:13px/1.5 system-ui;color:#234b39}*{box-sizing:border-box}button,a{font:inherit;color:inherit}button{cursor:pointer;border:1px solid #b8ccc1;background:#fff;border-radius:9px;min-height:40px;padding:8px 10px;box-shadow:0 2px 0 #163e2926;transition:transform .12s,box-shadow .12s}button:active{transform:translateY(2px);box-shadow:none}button:disabled{opacity:.6;cursor:wait}button:focus-visible,a:focus-visible{outline:3px solid #428b6a;outline-offset:2px}.bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.member{display:flex;gap:6px;align-items:center}a{cursor:pointer;text-decoration:underline;text-underline-offset:3px}.status{font-size:12px;max-width:260px;margin:4px 0}.status:empty{display:none}[hidden]{display:none!important}@media(prefers-reduced-motion:reduce){button{transition:none}}</style><div class="bar"><button id="login">로그인</button><button id="signup">회원가입</button><span class="member" id="member" hidden><button id="profile" aria-expanded="false"></button></span><a id="vault" href="#my-vault">내 보관소</a></div><div class="bar" id="menu" hidden><a href="https://softm.github.io/account/" target="_blank" rel="noopener noreferrer">계정 관리</a><a href="https://softm.github.io/account/#withdrawal" target="_blank" rel="noopener noreferrer">회원탈퇴</a><button id="logout">로그아웃</button></div><p class="status" role="status" aria-live="polite"></p>`;
  const $=id=>root.getElementById(id),status=root.querySelector('.status');let busy=false,destroyed=false;
  const render=user=>{$('login').hidden=!!user;$('signup').hidden=!!user;$('member').hidden=!user;$('profile').textContent=(user?.displayName||'내 계정');if(!user){$('menu').hidden=true;$('profile').setAttribute('aria-expanded','false');}};
  const off=account.subscribe(render);
  async function action(mode){if(busy)return;const popup=window.open('about:blank','_blank','popup,width=520,height=760');if(!popup){status.textContent='팝업을 허용한 뒤 다시 눌러 주세요.';return;}busy=true;$('login').disabled=$('signup').disabled=true;status.textContent=mode==='signup'?'회원가입 화면을 열고 있습니다.':'로그인하고 있습니다.';try{await account.login({popup,mode});status.textContent=name+'에 로그인했습니다.';}catch(error){popup.close();status.textContent=error.message||'로그인을 완료하지 못했습니다.';}finally{busy=false;$('login').disabled=$('signup').disabled=false;}}
  $('login').onclick=()=>action('login');$('signup').onclick=()=>action('signup');$('profile').onclick=()=>{$('menu').hidden=!$('menu').hidden;$('profile').setAttribute('aria-expanded',String(!$('menu').hidden));};
  $('vault').onclick=event=>{event.preventDefault();vault.open();};$('logout').onclick=async()=>{if(busy)return;busy=true;try{await account.logout();status.textContent='로그아웃했습니다.';}catch{status.textContent='로그아웃하지 못했습니다. 다시 시도해 주세요.';}finally{busy=false;}};
  const place=()=>{if(destroyed)return;const anchor=document.querySelector(target)||document.querySelector('header,nav,main')||document.body;if(host.parentElement!==anchor)anchor.append(host);};place();const observer=new MutationObserver(place);observer.observe(document.body,{childList:true,subtree:true});account.ready().catch(()=>{status.textContent='로그인 연결을 확인해 주세요. 다시 누르면 재시도합니다.';});
  return {element:host,destroy(){destroyed=true;off();observer.disconnect();host.remove();}};
}

