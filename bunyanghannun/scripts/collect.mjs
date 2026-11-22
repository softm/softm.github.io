#!/usr/bin/env node
// Node 22+ / GitHub Actions 수집기. 실패 시 기존 정상 JSON을 덮어쓰지 않는다.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const path=s=>new URL('../'+s,import.meta.url);
const read=async(f,def)=>{try{return JSON.parse(await readFile(path(f),'utf8'));}catch{return def;}};
const write=(f,v)=>writeFile(path(f),JSON.stringify(v,null,2)+'\n');
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,18);
const now=new Date(),today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const d=s=>{const t=String(s||'').replace(/\D/g,'');return t.length>=8?t.slice(0,4)+'-'+t.slice(4,6)+'-'+t.slice(6,8):'';};
const cutoff=()=>{const n=new Date(Date.now()-180*864e5);return n.toISOString().slice(0,10);};
const n=x=>Number(String(x||'').replace(/[,\s]/g,''))||0;
const province=s=>{s=String(s||'');const names=[['서울','서울'],['부산','부산'],['대구','대구'],['인천','인천'],['광주','광주'],['대전','대전'],['울산','울산'],['세종','세종'],['경기도','경기'],['경기','경기'],['강원','강원'],['충청북','충북'],['충북','충북'],['충청남','충남'],['충남','충남'],['전라북','전북'],['전북','전북'],['전북특별','전북'],['전라남','전남'],['전남','전남'],['경상북','경북'],['경북','경북'],['경상남','경남'],['경남','경남'],['제주','제주']];return names.find(([q])=>s.startsWith(q))?.[1]||'';};
const key=v=>{try{return decodeURIComponent(v);}catch{return v;}};
async function fetchOk(url,options={}){for(let i=0;i<3;i++){try{const r=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);return r;}catch(e){if(i===2)throw e;await new Promise(r=>setTimeout(r,800*(i+1)));}}}
let coordinates=await read('data/coordinates.json',{}),geoCalls=0;
async function coords(id,address){
  const c=coordinates[id]||coordinates[address];
  if(c&&Number.isFinite(Number(c.lat))&&Number.isFinite(Number(c.lng)))return {lat:Number(c.lat),lng:Number(c.lng),locationQuality:String(c.locationQuality||'geocoded')};
  if(process.env.GEOCODE_ENABLED!=='true'||!process.env.NAVER_MAP_CLIENT_ID||!process.env.NAVER_MAP_CLIENT_SECRET||geoCalls>=20||!/\d/.test(address))return {};
  geoCalls++;
  try{
    const url=new URL('https://maps.apigw.ntruss.com/map-geocode/v2/geocode');url.searchParams.set('query',address);url.searchParams.set('count','2');
    const r=await fetchOk(url,{headers:{'x-ncp-apigw-api-key-id':process.env.NAVER_MAP_CLIENT_ID,'x-ncp-apigw-api-key':process.env.NAVER_MAP_CLIENT_SECRET,Accept:'application/json'}});
    const body=await r.json();
    if(body.status==='OK'&&body.addresses?.length===1){
      const a=body.addresses[0],lat=Number(a.y),lng=Number(a.x);
      if(lat>=33&&lat<=39&&lng>=124&&lng<=132){const v={lat,lng,locationQuality:'geocoded'};coordinates[id]=v;return v;}
    }
  }catch(e){console.warn('Geocoding not found:',id,e.message);}
  return {};
}
const dedupe=arr=>[...new Map(arr.map(x=>[x.id,x])).values()];
const sourceUrl=(s,fallback)=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:fallback;}catch{return fallback;}};
async function offers(){
  if(!process.env.APPLYHOME_API_KEY){console.log('APPLYHOME_API_KEY not configured; keeping old feed');return;}
  const kinds=[['getAPTLttotPblancDetail','APT'],['getRemndrLttotPblancDetail','무순위'],['getUrbtyOfctlLttotPblancDetail','오피스텔·도시형'],['getPblPvtRentLttotPblancDetail','민간임대'],['getOPTLttotPblancDetail','임의공급']];
  let all=[],errors=[],successful=0;
  for(const [route,type] of kinds){
    try{
      for(let page=1;page<=20;page++){
        const u=new URL('https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/'+route);
        u.searchParams.set('serviceKey',key(process.env.APPLYHOME_API_KEY));u.searchParams.set('page',String(page));u.searchParams.set('perPage','100');u.searchParams.set('returnType','JSON');u.searchParams.set('cond[RCRIT_PBLANC_DE::GTE]',cutoff());
        const res=await fetchOk(u),json=await res.json();
        if(!Array.isArray(json.data))throw Error('invalid API response');
        successful++;
        for(const r of json.data){
          const title=String(r.HOUSE_NM||'').trim(),id=String(r.HOUSE_MANAGE_NO||'')+'-'+String(r.PBLANC_NO||'');
          if(!title||id==='-')continue;
          const address=String(r.HSSPLY_ADRES||'').trim();
          const startDate=d(r.SUBSCRPT_RCEPT_BGNDE||r.GNRL_RCEPT_BGNDE||r.SPSPLY_RCEPT_BGNDE);
          const endDate=d(r.SUBSCRPT_RCEPT_ENDDE||r.GNRL_RCEPT_ENDDE||r.SPSPLY_RCEPT_ENDDE);
          const stage=type==='무순위'?'무순위':startDate>today?'예정':endDate&&endDate<today?'마감':startDate&&startDate<=today&&(!endDate||endDate>=today)?'접수중':'미확인';
          all.push({id,title,region:province(address),address,stage,noticeDate:d(r.RCRIT_PBLANC_DE),startDate,endDate,price:0,units:n(r.TOT_SUPLY_HSHLDCO),area:'',...await coords(id,address),source:'한국부동산원 청약홈 ('+type+')',sourceUrl:sourceUrl(r.HMPG_ADRES,'https://www.applyhome.co.kr/'),updatedAt:new Date().toISOString()});
        }
        if(json.data.length<100)break;
      }
    }catch(e){errors.push(route+': '+e.message);console.error(route,e.message);}
  }
  if(!successful)throw Error('All Applyhome calls failed; old feed preserved');
  await write('data/offerings.json',{schemaVersion:1,status:errors.length?'partial':'ok',generatedAt:new Date().toISOString(),source:'한국부동산원 청약홈 분양정보 조회 서비스',sourceUrl:'https://www.data.go.kr/data/15098547/openapi.do',coverage:{since:cutoff(),types:kinds.map(x=>x[1]),note:'청약 공고 상세만 연결. 주택형별 분양가 및 일부 공급유형은 별도 연동 필요'},warnings:errors,items:dedupe(all).sort((a,b)=>b.noticeDate.localeCompare(a.noticeDate))});
  console.log('Applyhome records:',all.length);
}
const xmlText=s=>String(s||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
function xmlItems(s){const code=s.match(/<resultCode>([^<]*)<\/resultCode>/i)?.[1];if(code&&!['00','000','0'].includes(code))throw Error('API resultCode '+code);const rows=[];for(const m of s.matchAll(/<item>([\s\S]*?)<\/item>/gi)){const row={};for(const f of m[1].matchAll(/<([^/>\s]+)>([\s\S]*?)<\/\1>/g))row[f[1]]=xmlText(f[2].trim());rows.push(row);}return rows;}
function months(count){const arr=[],y=now.getUTCFullYear(),m=now.getUTCMonth();for(let i=0;i<count;i++){const d=new Date(Date.UTC(y,m-i,1));arr.push(d.getUTCFullYear()+String(d.getUTCMonth()+1).padStart(2,'0'));}return arr;}
async function transfers(){
  if(!process.env.MOLIT_API_KEY){console.log('MOLIT_API_KEY not configured; keeping old feed');return;}
  const laws=await read('config/law-codes.json',{}),codes=Object.entries(laws);
  if(!codes.length){console.log('LAWD_CD coverage not configured; keeping old feed');return;}
  const periods=months(6),all=[],errors=[];
  let successful=0;
  for(const [law,city] of codes){if(!/^\d{5}$/.test(law))continue;for(const ym of periods)try{
    const url=new URL('https://apis.data.go.kr/1613000/RTMSDataSvcSilvTrade/getRTMSDataSvcSilvTrade');
    url.searchParams.set('serviceKey',key(process.env.MOLIT_API_KEY));url.searchParams.set('LAWD_CD',law);url.searchParams.set('DEAL_YMD',ym);url.searchParams.set('numOfRows','1000');
    const text=await (await fetchOk(url)).text(),rows=xmlItems(text);successful++;
    for(const r of rows){
      if(String(r.해제여부||'').toUpperCase()==='O'||r.해제사유발생일)continue;
      const title=String(r.아파트||r.단지||r.단지명||'').trim();if(!title)continue;
      const dealDate=d((r.년||ym.slice(0,4))+String(r.월||ym.slice(4)).padStart(2,'0')+String(r.일||'1').padStart(2,'0'));
      const address=city+(r.법정동?' '+r.법정동:'');
      const price=n(r.거래금액||r.거래금액_만원),area=String(r.전용면적||''),floor=String(r.층||'');
      const id='trade-'+hash([law,dealDate,title,price,area,floor].join('|'));
      all.push({id,title,region:province(city),address,stage:'거래',dealDate,price,area:area?area+'㎡':'',floor,...await coords(title+'|'+address,address),source:'국토교통부 아파트 분양권전매 실거래',sourceUrl:'https://rt.molit.go.kr/',updatedAt:new Date().toISOString()});
    }
  }catch(e){errors.push(law+'/'+ym+': '+e.message);console.error(law,ym,e.message);}
  }
  if(!successful)throw Error('All MOLIT calls failed; old feed preserved');
  await write('data/transfers.json',{schemaVersion:1,status:'partial',generatedAt:new Date().toISOString(),source:'국토교통부 아파트 분양권전매 실거래가',sourceUrl:'https://www.data.go.kr/data/15126471/openapi.do',coverage:{months:periods,regions:Object.values(laws),note:'등록된 일부 시군구 코드·최근 6개월만 수집. 전국 데이터가 아님'},warnings:errors,items:dedupe(all).sort((a,b)=>b.dealDate.localeCompare(a.dealDate))});
  console.log('Transfer records:',all.length);
}
let failures=0;
try{await offers();}catch(e){console.error('Applyhome failed:',e.message);failures++;}
try{await transfers();}catch(e){console.error('MOLIT failed:',e.message);failures++;}
if(geoCalls)await write('data/coordinates.json',coordinates);
if(failures)process.exitCode=1;
