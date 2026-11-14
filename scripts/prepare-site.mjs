/* Deterministic static packaging: no compilation, downloads, runtime dependencies or credentials. */
import {mkdirSync,readdirSync,readFileSync,writeFileSync,lstatSync,rmSync} from 'node:fs';
import path from 'node:path';
import {writeContentPages} from './content-pages.mjs';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {repositoryRoot,entries,publicForSource} from './site-layout.mjs';
export function prepareSite(destination=path.join(repositoryRoot,'dist')){
 const out=path.resolve(destination);
 if(out!==path.join(repositoryRoot,'dist')&&!(out.startsWith(os.tmpdir()+path.sep)&&path.basename(out).startsWith('avalon-site-')))throw Error('Output must be dist/ or an isolated avalon-site-* temp directory.');
 rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
 const written=new Set();
 function copy(source,target){
  const stat=lstatSync(source);
  if(stat.isSymbolicLink())throw Error('Symlinks are not publishable: '+source);
  if(stat.isDirectory()){
   for(const name of readdirSync(source).sort()){
    if(name.startsWith('.')||name==='node_modules')throw Error('Unexpected hidden/dependency input: '+source+'/'+name);
    copy(path.join(source,name),path.posix.join(target,name));
   }return;
  }
  if(!stat.isFile()||written.has(target))throw Error('Invalid or duplicate output: '+target);
  written.add(target);let contents=readFileSync(source);
  if(target.endsWith('.md')){
   function mapLink(href){
    if(/^(?:[a-z][a-z\d+.-]*:|#|\/)/i.test(href))return href;
    const [file,fragment]=href.split('#');const resolved=path.resolve(path.dirname(source),file);const published=publicForSource(resolved);
    if(published===null)return resolved.startsWith(repositoryRoot)?'https://github.com/LorraineWong/avalon/blob/main/'+path.relative(repositoryRoot,resolved).split(path.sep).join('/')+(fragment!==undefined?'#'+fragment:''):href;
    const rel=path.posix.relative(path.posix.dirname(target),published)||'.';
    return rel+(fragment!==undefined?'#'+fragment:'');
   }
   contents=Buffer.from(contents.toString().replace(/(\]\()([^\s)]+)(\))/g,(_,a,href,b)=>a+mapLink(href)+b).replace(/((?:href|src)=["'])([^"']+)(["'])/g,(_,a,href,b)=>a+mapLink(href)+b));
  }
  const file=path.join(out,target);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,contents);
 }
 for(const [source,target]of entries)copy(path.join(repositoryRoot,source),target);
 const pages=writeContentPages(repositoryRoot,out);
 writeFileSync(path.join(out,'.nojekyll'),'');return {directory:out,files:written.size+pages};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=prepareSite();console.log(`Prepared ${result.files} static files in ${result.directory}`);
}
