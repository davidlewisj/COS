import { useState, useEffect, useCallback, useRef, memo } from "react";
const STORAGE_KEYS = {
  todos:"eos-todos", scorecard:"eos-scorecard", meetings:"eos-meetings",
  issues:"eos-issues", team:"eos-team", scData:"eos-scorecard-data",
  rocks:"eos-rocks", headlines:"eos-headlines", vision:"eos-vision",
  teams:"eos-teams", profile:"eos-profile"
};
const PROFILE_DEFAULT = {
  firstName:"David", lastName:"Lewis", title:"Operations",
  bio:"", avatar:null,
  street:"", city:"", state:"", zip:"", country:"US"
};
const TEAM_DEFAULT = [
  { id:"1", name:"David Lewis", role:"Operations", color:"#4A90D9" },
  { id:"2", name:"Unassigned", role:"", color:"#CBD5E1" },
];
const TEAMS_DEFAULT = [
  { id:"tl1", name:"Leadership Team", memberIds:["1"] }
];
const SC_DEFAULT = [
  { id:"s1", name:"SMS referrals", owner:"1", goal:40, unit:"#", op:">=" },
  { id:"s2", name:"NP visits SMS", owner:"1", goal:25, unit:"#", op:">=" },
  { id:"s3", name:"DSM referrals", owner:"1", goal:100, unit:"#", op:">=" },
  { id:"s4", name:"CPAP Setups", owner:"1", goal:15, unit:"#", op:">=" },
  { id:"s5", name:"Oral Device Deliveries", owner:"1", goal:10, unit:"#", op:">=" },
  { id:"s6", name:"Sch Utilization Silverdale", owner:"1", goal:90, unit:"%", op:">=" },
  { id:"s7", name:"Sch Utilization Bellevue", owner:"1", goal:90, unit:"%", op:">=" },
  { id:"s8", name:"Patient Satisfaction", owner:"1", goal:95, unit:"%", op:">=" },
];
const VISION_DEFAULT = {
  coreValues:"", purposePassion:"", niche:"",
  tenYearTarget:"", marketTarget:"", threeUniques:"",
  provenProcess:"", guarantee:"",
  threeYearRevenue:"", threeYearProfit:"", threeYearLooks:"",
  oneYearRevenue:"", oneYearProfit:"", oneYearGoals:""
};
function uid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,5)}
function getWeekRange(offset=0){
  const d=new Date();d.setDate(d.getDate()-d.getDay()+1+offset*7);
  const end=new Date(d);end.setDate(end.getDate()+6);
  return{start:d,end:end,key:d.toISOString().split("T")[0],
    label:`${d.toLocaleString("default",{month:"short"})} ${String(d.getDate()).padStart(2,"0")} – ${end.toLocaleString("default",{month:"short"})} ${String(end.getDate()).padStart(2,"0")}`};
}
function getMonthRange(offset=0){
  const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+offset);
  return{key:d.toISOString().slice(0,7),label:d.toLocaleString("default",{month:"short",year:"2-digit"})};
}
function getQuarterRange(offset=0){
  const d=new Date();const totalQ=d.getFullYear()*4+Math.floor(d.getMonth()/3)+offset;
  const yr=Math.floor(totalQ/4);const qn=((totalQ%4)+4)%4;
  return{key:`${yr}-Q${qn+1}`,label:`Q${qn+1} '${String(yr).slice(2)}`};
}
function getYearRange(offset=0){
  const yr=new Date().getFullYear()+offset;return{key:String(yr),label:String(yr)};
}
function getYTDPeriods(){
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const d = new Date(yearStart);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const periods = [];
  while(d <= today){
    const key = d.toISOString().split("T")[0];
    const end = new Date(d); end.setDate(end.getDate()+6);
    const label = `${d.toLocaleString("default",{month:"short"})} ${String(d.getDate()).padStart(2,"0")} – ${end.toLocaleString("default",{month:"short"})} ${String(end.getDate()).padStart(2,"0")}`;
    periods.push({key, label});
    d.setDate(d.getDate()+7);
  }
  return periods.reverse();
}
function getPeriods(tab){
  if(tab==="ytd") return getYTDPeriods();
  if(tab==="monthly")return Array.from({length:12},(_,i)=>getMonthRange(-i));
  if(tab==="quarterly")return Array.from({length:8},(_,i)=>getQuarterRange(-i));
  if(tab==="annual")return Array.from({length:5},(_,i)=>getYearRange(-i));
  return Array.from({length:52},(_,i)=>getWeekRange(-i));
}
function weekBelongsTo(weekKey, periodKey, tab){
  if(tab==="monthly") return weekKey.startsWith(periodKey);
  if(tab==="quarterly"){
    const yr=periodKey.slice(0,4);
    const qn=parseInt(periodKey.slice(6));
    const mo=parseInt(weekKey.slice(5,7));
    const qMos={1:[1,2,3],2:[4,5,6],3:[7,8,9],4:[10,11,12]};
    return weekKey.startsWith(yr)&&qMos[qn].includes(mo);
  }
  if(tab==="annual") return weekKey.startsWith(periodKey);
  return false;
}
function getRollupVal(mid, periodKey, tab, scData, unit){
  const weekKeys=Object.keys(scData).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&weekBelongsTo(k,periodKey,tab));
  const vals=weekKeys.map(wk=>parseFloat(scData[wk]?.[mid])).filter(v=>!isNaN(v));
  if(!vals.length) return "";
  const result=unit==="%"
    ? vals.reduce((a,b)=>a+b,0)/vals.length
    : vals.reduce((a,b)=>a+b,0);
  return Math.round(result*100)/100;
}
const PERIOD_WEEKS = { weekly:1, monthly:4, quarterly:13, annual:52 };
function scaleGoal(metric, tab){
  if(metric.unit==="%") return metric.goal;
  if(tab==="ytd"){
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weeksElapsed = Math.max(1, Math.ceil((now - startOfYear) / (7 * 24 * 60 * 60 * 1000)));
    return Math.round(metric.goal * weeksElapsed);
  }
  return Math.round(metric.goal * (PERIOD_WEEKS[tab]||1));
}
function fmtDate(s){if(!s)return"";const d=new Date(s+"T00:00:00");return d.toLocaleString("default",{month:"short"})+" "+d.getDate()}
function isOverdue(s){if(!s)return false;return new Date(s+"T23:59:59")<new Date()}
async function load(k,fb){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):fb}catch{return fb}}
async function save(k,v){try{await window.storage.set(k,JSON.stringify(v))}catch(e){console.error(e)}}
function useIsMobile(){const[m,s]=useState(window.innerWidth<768);useEffect(()=>{const h=()=>s(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return m}
export default function App(){
  return <div>App</div>;
}
