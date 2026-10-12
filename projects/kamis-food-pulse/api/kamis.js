export default async function handler(req,res){
 const key=process.env.KAMIS_CERT_KEY,id=process.env.KAMIS_CERT_ID;
 if(!key||!id)return res.status(200).json({live:false,items:[]});
 try{
  const u=new URL('https://www.kamis.or.kr/service/price/xml.do');
  u.searchParams.set('action','dailySalesList');
  u.searchParams.set('p_cert_key',key);u.searchParams.set('p_cert_id',id);u.searchParams.set('p_returntype','json');
  const r=await fetch(u);const d=await r.json();
  const raw=Array.isArray(d?.price)?d.price:[];
  const items=raw.filter(x=>x&&(x.productName||x.item_name)).map(x=>{
   const price=Number(String(x.dpr1||'').replace(/,/g,''))||0;
   const delta=Number(x.value)||0;
   return {name:x.productName||x.item_name,unit:x.unit||'',price,delta};
  }).filter(x=>x.price>0);
  res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=86400');
  return res.status(200).json({live:true,items});
 }catch(e){return res.status(200).json({live:false,items:[],reason:String(e)})}
}