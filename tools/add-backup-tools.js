const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

function addBackupUi(source) {
  if (source.includes('exportFitData()')) return source;
  const needle = '<p class="muted">Все записи относятся только к этому логину и сохраняются на этом устройстве.</p>';
  const insert = needle + '<div class="diary-grid"><button class="ghost" onclick="exportFitData()" type="button">Скачать копию данных</button><button class="ghost" onclick="importFitData()" type="button">Загрузить копию данных</button></div><input id="fitImportFile" type="file" accept="application/json" style="display:none" onchange="importFitDataFile(this)"><p class="muted">Если открываете сайт на другом телефоне или в другом браузере, перенесите данные через файл. Автоматическая синхронизация между устройствами требует облачной базы.</p>';
  if (!source.includes(needle)) throw new Error('account intro text not found');
  return source.replace(needle, insert);
}

const backupFunctions = `
function fitUserKeys(){return Object.keys(localStorage).filter(k=>k==='fitUsers'||k.startsWith('fit:'+user+':'))}
function exportFitData(){if(!user)return alert('Сначала войдите в личный кабинет');let data={app:'FitPlan',version:1,user,createdAt:new Date().toISOString(),items:{}};fitUserKeys().forEach(k=>data.items[k]=localStorage.getItem(k));let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fitplan-'+user+'-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function importFitData(){let input=$('fitImportFile');if(input)input.click()}
function importFitDataFile(input){let file=input.files&&input.files[0];if(!file)return;let reader=new FileReader();reader.onload=()=>{try{let data=JSON.parse(reader.result);if(!data.items||!data.user)throw new Error('bad file');Object.keys(data.items).forEach(k=>localStorage.setItem(k,data.items[k]));user=data.user;localStorage.fitSession=user;alert('Данные загружены. Кабинет: '+user);openApp();setTab('account')}catch(e){alert('Не получилось загрузить файл FitPlan')}};reader.readAsText(file)}
`;

function addBackupFunctions(source) {
  if (source.includes('function exportFitData()')) return source;
  return source.replace('function renderMenu(p,s)', backupFunctions + 'function renderMenu(p,s)');
}

html = addBackupUi(html);
html = addBackupFunctions(html);

const script = html.match(/<script>([\s\S]*)<\/script>/);
if (!script) throw new Error('script not found');
new Function(script[1]);
fs.writeFileSync('index.html', html, 'utf8');
