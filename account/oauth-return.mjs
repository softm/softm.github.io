const messages={
  cancelled:'로그인을 취소했습니다. 다른 로그인 방법을 선택하거나 다시 시도해 주세요.',
  'already-linked':'이미 다른 계정에 연결된 로그인입니다. 기존 계정으로 로그인해 주세요.',
  unavailable:'SNS 로그인을 완료하지 못했습니다. 기존 계정은 유지됩니다. 다른 로그인 방법을 선택하거나 잠시 후 다시 시도해 주세요.'
};

export function readOAuthReturn(fragment,savedText){
  const params=new URLSearchParams(fragment.replace(/^#/,'')),state=params.get('oauth');
  if(!state)return null;
  let saved;
  try{saved=JSON.parse(savedText||'null');}catch{}
  if(!/^[A-Za-z0-9_-]{43}$/.test(state)||saved?.state!==state||!/^[A-Za-z0-9_-]{43}$/.test(saved?.verifier||''))throw Error('로그인 요청이 일치하지 않습니다. 다시 시도해 주세요.');
  const targetQuery=typeof saved.targetQuery==='string'&&(saved.targetQuery===''||saved.targetQuery.startsWith('?'))?saved.targetQuery:'';
  const reason=params.get('oauth-error');
  return {state,verifier:saved.verifier,targetQuery,errorMessage:params.has('oauth-error')?(Object.hasOwn(messages,reason)?messages[reason]:messages.unavailable):null};
}
