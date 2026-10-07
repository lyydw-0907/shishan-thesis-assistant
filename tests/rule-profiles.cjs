const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),JSZip=require('jszip'),{DOMParser,XMLSerializer}=require('@xmldom/xmldom');
const c={JSZip,DOMParser,XMLSerializer,crypto:require('crypto').webcrypto,Uint8Array,atob,btoa};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/engine.js'),'utf8')+';globalThis.e=ThesisEngine;globalThis.profiles=RuleProfiles;',c);
(async()=>{
const human=c.e.validate({preset_id:'humanities'}),natural=c.e.validate({preset_id:'natural'});
assert.equal(human.keyword_max,6);assert.equal(natural.keyword_min,5);assert.equal(natural.keyword_max,8);
for(const k of ['top_mm','body_size','heading1_size'])assert.equal(human[k],natural[k]);
assert.equal(c.profiles.origin(natural,'body_line'),'项目默认值');assert.equal(c.profiles.origin(natural,'body_font'),'学校推荐');assert.equal(c.profiles.origin(natural,'mirror_margins'),'学校明确要求');
const changed=c.e.validate({...natural,keyword_max:10,body_font:'仿宋'});assert.equal(c.profiles.origin(changed,'keyword_max'),'个人设置');assert.equal(c.profiles.origin(changed,'body_font'),'个人设置');
assert.equal(c.e.validate(JSON.parse(JSON.stringify(changed))).keyword_max,10);
const legacy=c.e.validate({name:'旧方案',keyword_max:5});assert.equal(legacy.preset_id,'custom');assert.equal(legacy.keyword_max,5);assert.equal(c.profiles.origin(legacy,'body_size'),'个人设置');
assert.equal(c.e.validate({preset_id:'custom'}).preset_id,'custom');assert.throws(()=>c.e.validate({preset_id:'unknown'}));
const z=new JSZip();z.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>关键词：甲；乙；丙；丁</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');const bytes=await z.generateAsync({type:'uint8array'});
const h=await c.e.inspect(bytes,{...human,check_keywords:true}),n=await c.e.inspect(bytes,{...natural,check_keywords:true});assert(!h.issues.some(x=>x.kind==='关键词数量'));assert(n.issues.some(x=>x.kind==='关键词数量'&&x.expected.includes('5—8')&&x.expected.includes('学校推荐')));assert(n.rule_basis.find(x=>x.scope==='关键词数量').source.endsWith('1059.htm'));assert(n.rule_basis.find(x=>x.scope==='正文行距与缩进').basis==='项目默认值');
console.log('PASS rule profiles: independent defaults, provenance, legacy import, validation, keyword bounds and report sources');
})().catch(e=>{console.error(e);process.exit(1)});
