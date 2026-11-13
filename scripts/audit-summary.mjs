import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import os from 'node:os'
const results=[]
const median = values => [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]
for(const profile of ['mobile','desktop']) {
 const dir=`lighthouse/reports/${profile}`
 let files=[];try { files=await readdir(dir) } catch { continue }
 const reports=[]
 for(const file of files.filter(file=>file.endsWith('.json')&&!file.startsWith('manifest'))) { try { const report=JSON.parse(await readFile(`${dir}/${file}`,'utf8'));if(report.categories)reports.push(report) } catch {} }
 const groups=new Map()
 for(const report of reports) { const url=report.finalDisplayedUrl??report.finalUrl;const group=groups.get(url)??[];group.push(report);groups.set(url,group) }
 for(const [url,reports] of groups) results.push({profile,url,runs:reports.length,lighthouseVersion:reports[0].lighthouseVersion,userAgent:reports[0].userAgent,conditions:{throttlingMethod:reports[0].configSettings.throttlingMethod,throttling:reports[0].configSettings.throttling,formFactor:reports[0].configSettings.formFactor},scores:Object.fromEntries(['performance','accessibility','best-practices','seo'].map(category=>[category,Math.round(median(reports.map(r=>r.categories[category].score))*100)])),lcpMs:Math.round(median(reports.map(r=>r.audits['largest-contentful-paint'].numericValue))),cls:median(reports.map(r=>r.audits['cumulative-layout-shift'].numericValue)),tbtMs:Math.round(median(reports.map(r=>r.audits['total-blocking-time'].numericValue)))})
}
await mkdir('lighthouse/reports',{recursive:true})
const report={generatedAt:new Date().toISOString(),environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,memoryGb:Math.round(os.totalmem()/1024**3)},results}
await writeFile('lighthouse/reports/summary.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
