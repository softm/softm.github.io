// Retain only profile fields explicitly supplied by the authenticated provider.
// Never persist or log access tokens, raw profiles, email or provider subjects.
function text(value){return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,128):'';}
function image(value){
  if(typeof value!=='string'||value.length>4096)return '';
  try{const url=new URL(value.trim());if(url.protocol==='http:'&&/(^|\.)kakaocdn\.net$/i.test(url.hostname))url.protocol='https:';
    return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';
  }catch{return '';}
}
export function providerProfile(provider,raw){
  if(provider==='kakao'){
    const account=raw?.kakao_account,profile=account?.profile;
    // Only fields present in the provider response are read. A denied consent
    // never causes a supplementary request for personal data.
    return {displayName:text(profile?.nickname||raw?.properties?.nickname),photoURL:image(profile?.profile_image_url||profile?.thumbnail_image_url||raw?.properties?.profile_image||raw?.properties?.thumbnail_image)};
  }
  if(provider==='naver')return {displayName:text(raw?.response?.nickname||raw?.response?.name),photoURL:image(raw?.response?.profile_image)};
  throw new TypeError('지원하지 않는 프로필 제공자입니다.');
}
export async function syncProviderProfile(auth,uid,provider,raw,{linking=false}={}){
  const next=providerProfile(provider,raw),current=await auth.getUser(uid),patch={};
  if(next.displayName&&(!linking||!current.displayName)&&next.displayName!==current.displayName)patch.displayName=next.displayName;
  // In normal login, a missing/invalid image clears an obsolete provider photo.
  // Linking a second provider never overwrites an existing canonical profile.
  if((!linking||!current.photoURL)&&(next.photoURL||null)!==(current.photoURL||null))patch.photoURL=next.photoURL||null;
  if(Object.keys(patch).length)await auth.updateUser(uid,patch);
  return Object.keys(patch);
}
