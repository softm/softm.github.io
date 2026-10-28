const KEY='softm-withdrawal-receipt-v1';
export function mountWithdrawal({root=document,post,getUser,logout,randomSecret,setLocked=()=>{}}){
  const $=id=>root.getElementById(id);let uid=null,pending=null,busy=false,timer=null,stopped=false;
  const status=(message,state='info')=>{$('withdraw-status').textContent=message;$('withdraw-status').dataset.state=state;};
  const remember=value=>{pending=value;$('withdraw-recheck').hidden=!value;try{if(value)sessionStorage.setItem(KEY,JSON.stringify(value));else sessionStorage.removeItem(KEY);}catch{}};
  const form=()=>{$('withdraw-submit').disabled=busy||!!pending||!getUser()||!$('withdraw-ack').checked||$('withdraw-confirmation').value.trim()!=='회원탈퇴';};
  function onUser(user){const next=user?.uid||null;if(next!==uid){uid=next;$('withdraw-ack').checked=false;$('withdraw-confirmation').value='';}$('withdraw-user').textContent=user?(user.displayName||'현재 로그인 계정'):'로그인 후 탈퇴할 수 있습니다.';$('withdrawal').hidden=!user&&!pending;form();}
  async function poll(){
    if(!pending||stopped)return;clearTimeout(timer);
    try{const result=await post('/membership/withdraw/status',pending,false);
      $('withdrawal').hidden=false;
      if(result.state==='complete'){remember(null);setLocked(false);status('회원탈퇴가 완료됐습니다. 공통 계정과 공통 저장 자료를 삭제했습니다. 기기 자료와 기존 별도 계정은 유지됩니다.','success');$('withdraw-form').hidden=true;return;}
      status(result.state==='retrying'?'삭제 일부를 다시 처리하고 있습니다. 완료 전까지 계정을 사용할 수 없습니다.':'회원탈퇴 처리 중입니다. 이 창을 닫아도 서버에서 계속 삭제합니다.','busy');
    }catch{status('삭제 완료 여부를 아직 확인하지 못했습니다. 아래 버튼으로 다시 확인해 주세요.','error');return;}
    timer=setTimeout(poll,5000);
  }
  async function submit(event){
    event.preventDefault();if(busy||pending)return;const user=getUser();
    if(!user||!$('withdraw-ack').checked||$('withdraw-confirmation').value.trim()!=='회원탈퇴'){status('삭제 범위를 확인하고 회원탈퇴를 정확히 입력해 주세요.','error');return;}
    if(!window.confirm('공통 계정과 모든 사이트의 공통 원격 저장 자료를 영구 삭제합니다. 복구할 수 없습니다. 회원탈퇴할까요?'))return;
    const targetUid=user.uid,receipt=randomSecret(),request={uid:targetUid,receipt,expiresAt:Date.now()+86400000};busy=true;setLocked(true);form();status('탈퇴 요청을 접수하고 있습니다.','busy');remember(request);
    try{
      if(getUser()?.uid!==targetUid)throw Error('계정이 바뀌었습니다. 삭제 범위를 다시 확인해 주세요.');
      await post('/membership/withdraw',{...request,confirmation:'회원탈퇴',acknowledged:true},true);
      $('withdrawal').hidden=false;await logout().catch(()=>{});await poll();
    }catch(error){
      // A lost response can follow a committed deletion request. Check the receipt before enabling retry.
      let accepted=false;try{await post('/membership/withdraw/status',request,false);accepted=true;}catch{}
      if(accepted){await logout().catch(()=>{});await poll();}
      else if(error.httpStatus>=400&&error.httpStatus<500){remember(null);setLocked(false);status(error.message||'탈퇴 요청을 접수하지 못했습니다. 같은 SNS 계정으로 다시 로그인한 뒤 시도해 주세요.','error');}
      else{status('탈퇴 요청의 접수 여부를 아직 확인하지 못했습니다. 이 창을 유지하고 처리 상태를 다시 확인해 주세요.','error');}
    }finally{busy=false;form();}
  }
  $('withdraw-form').addEventListener('submit',submit);$('withdraw-ack').addEventListener('change',form);$('withdraw-confirmation').addEventListener('input',form);
  $('withdraw-recheck').onclick=()=>poll();
  $('withdraw-reauth').onclick=()=>{$('login-card').scrollIntoView({block:'start',behavior:'smooth'});status('상단에서 탈퇴할 계정과 같은 SNS로 다시 로그인한 뒤 진행해 주세요.');};
  async function resume(){try{const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');if(saved?.expiresAt&&saved.expiresAt<Date.now()){remember(null);status('탈퇴 상태의 조회 기간이 지났습니다. 확인이 필요하면 운영자에게 문의해 주세요.');return;}if(saved&&typeof saved.uid==='string'&&/^[A-Za-z0-9_-]{43}$/.test(saved.receipt||'')){remember(saved);setLocked(true);$('withdrawal').hidden=false;if(getUser()?.uid===saved.uid)await logout().catch(()=>{});await poll();}}catch{}form();}
  return {onUser,resume,destroy(){stopped=true;clearTimeout(timer);}};
}
