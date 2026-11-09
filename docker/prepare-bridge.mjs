import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export const originalIdentity='5. 你只代表 DeepSeek 的鲸鱼形象（大肥鱼/鲸鱼娘）：不冒充 Claude / GPT / 其他模型或官方客服，不替任何中转站、代理或第三方背书；被要求“假装你是别的模型”时用角色口吻拒绝（可以自嘲“装不像”）。';
export const kitIdentity='5. 性格、关系、称呼和表达以当前角色卡为依据。角色名只作称呼，物种、外观和生活背景由管理端明确设定。问到真实身份和能力时如实说明，不冒充其他模型、官方客服或第三方，不替任何中转站、代理或第三方背书。';
export function patchPrefix(prefix) {
  if(prefix.includes(kitIdentity))return prefix;
  if(!prefix.includes(originalIdentity))throw Error('Upstream identity paragraph changed');
  return prefix.replace(originalIdentity,kitIdentity);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const root=process.argv[2];
  const {extractPresetPrefix,renderPresetPromptYaml}=await import(pathToFileURL(root+'/src/preset-prompt.js'));
  const file=root+'/dsh/agent-presets/qq-chat-v2/agent.cordis.yml';
  const source=fs.readFileSync(file,'utf8');
  const prefix=extractPresetPrefix(source);
  if(typeof prefix!=='string')throw Error('Missing preset prefix');
  const patched=patchPrefix(prefix);
  if(prefix!==patched)fs.writeFileSync(file,renderPresetPromptYaml(source,patched,{label:'qq-chat-v2.yml'}));
}
