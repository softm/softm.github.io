// Keep the action visible while it runs, and always restore buttons after failure or cancellation.
export async function runButtonAction(button, action, {label='처리 중…',pending='',output=()=>{},group=[],settled=()=>{}}={}) {
  if(button.disabled||button.getAttribute('aria-busy')==='true')return;
  const buttons=[...new Set([button,...group])];
  if(buttons.some(item=>item.getAttribute('aria-busy')==='true'))return;
  const states=buttons.map(item=>({item,disabled:item.disabled})),original=button.textContent;
  states.forEach(({item})=>{item.disabled=true;});
  button.setAttribute('aria-busy','true');button.textContent=label;
  try{
    if(pending)output(pending,'busy');
    return await action();
  }catch(error){
    const messages={
      'auth/popup-closed-by-user':'로그인이 취소됐습니다. 다시 눌러 로그인할 수 있어요.',
      'auth/cancelled-popup-request':'로그인이 취소됐습니다. 다시 시도해 주세요.',
      'auth/popup-blocked':'로그인 팝업이 차단됐습니다. 팝업을 허용한 뒤 다시 눌러 주세요.',
      'auth/network-request-failed':'네트워크 연결을 확인한 뒤 다시 눌러 주세요.'
    };
    output(messages[error?.code]||error?.message||'처리하지 못했습니다. 다시 시도해 주세요.','error');
  }finally{
    button.textContent=original;button.removeAttribute('aria-busy');
    states.forEach(({item,disabled})=>{item.disabled=disabled;});
    settled();
  }
}
