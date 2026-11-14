import {readFileSync} from 'node:fs';
import {sourceForPublic} from '../../scripts/site-layout.mjs';
export {sourceForPublic};
export const readPublic=path=>readFileSync(sourceForPublic(path),'utf8');
export const readGameSource=()=>readPublic('assets/js/game-base.js')+'\n'+readPublic('assets/js/app.js');
