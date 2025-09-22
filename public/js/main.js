// ✅ Expresión regular: acepta dígitos, letras, operadores, paréntesis y espacios
const validacion=/^[a-zA-Z0-9+\-*/() \t]+$/;

const $=s=>document.querySelector(s);
const btn=$("#btn_generar"), arbol=$("#contenido_arbol");
const estilos={color:'#e22f2fff',outline:false,endPlugOutline:false,endPlugSize:1,startPlug:'behind',endPlug:'behind',path:'straight',size:2};
const nodo=(v,id)=>`<div class='col-2 align-self-end'><span id="${id}" class='btn btn-success rounded-circle'>${v}<span></div>`;
const nodo2=(v,id)=>`<div class='col-2'><span id="${id}" class='btn btn-primary rounded-circle'>${v}<span></div>`;
const pos=(id,x,y)=>{const s=document.getElementById(id).parentElement; s.style.position='absolute'; s.style.left=x+'px'; s.style.top=y+'px';};
const clean=()=>{(window.__lines||[]).forEach(l=>l.remove()); window.__lines=[];};

// ✅ Verificación extendida
const prec=o=>o==='+'||o==='-'?1:o==='*'||o==='/'?2:0;
const isNum=t=>/^\d+$/.test(t);          // número puro
const isVar=t=>/^[a-zA-Z][a-zA-Z0-9]*$/.test(t); // variable o combinación alfanumérica
const isOp=t=>/[+\-*/]/.test(t);

function tok(expr){
  // ✅ Separa números, variables y operadores
  const t=(expr.replace(/\s+/g,'').match(/([a-zA-Z][a-zA-Z0-9]*|\d+|\+|\-|\*|\/|\(|\))/g)||[]), out=[];
  for(let i=0;i<t.length;i++){
    const c=t[i], p=out[out.length-1], un=(c==='+'||c==='-')&&(i===0||p==='('||isOp(p));
    if(un&&c==='+') continue;
    if(un&&c==='-') out.push('0','-');
    else out.push(c);
  }
  return out;
}

function parenOK(tk){let d=0;for(const t of tk){if(t==='(')d++;else if(t===')'&&--d<0)return false;}return d===0;}
function top1op(tk){
  let depth=0,c=0;
  for(const t of tk){ if(t==='(')depth++; else if(t===')')depth--; else if(depth===0&&isOp(t)&&++c>1) return false; }
  return c>=1;
}
function seqOK(tk){
  if(!tk.length||isOp(tk[0])||isOp(tk.at(-1)))return false;
  for(let i=0;i<tk.length-1;i++){
    const a=tk[i],b=tk[i+1];
    if( ((isNum(a)||isVar(a))&&(isNum(b)||isVar(b)||b==='(')) ) return false;
    if( (a===')'&&(isNum(b)||isVar(b)||b==='(')) ) return false;
    if( (isOp(a)&&(isOp(b)||b===')')) || (a==='('&&(isOp(b)||b===')')) ) return false;
  }
  return true;
}

function toRPN(tk){
  const out=[],ops=[];
  for(const t of tk){
    if(isNum(t)||isVar(t)) out.push(t);
    else if(isOp(t)){ while(ops.length&&isOp(ops.at(-1))&&prec(ops.at(-1))>=prec(t)) out.push(ops.pop()); ops.push(t); }
    else if(t==='(') ops.push(t);
    else { while(ops.length&&ops.at(-1)!=='(') out.push(ops.pop()); if(!ops.length) throw Error('Paréntesis'); ops.pop(); }
  }
  while(ops.length){ const top=ops.pop(); if(top==='('||top===')') throw Error('Paréntesis'); out.push(top); }
  return out;
}

function rpn2ast(r){
  const s=[];
  for(const t of r){
    if(isNum(t)||isVar(t)) s.push({t:'n',v:t,id:'n'+Math.random()});
    else { const b=s.pop(),a=s.pop(); if(!a||!b) throw Error('Expresión'); s.push({t:'o',v:t,id:'n'+Math.random(),l:a,r:b}); }
  }
  if(s.length!==1) throw Error('Expresión'); return s[0];
}

function place(root){
  let x=0; const X=60,Y=50,W=arbol.clientWidth||800,C=W/2;
  (function dfs(n,d=0){ if(!n) return; if(n.t==='o') dfs(n.l,d+1); n.px=C+(x++-3)*X; n.py=20+d*Y; if(n.t==='o') dfs(n.r,d+1); })(root);
}
function draw(n){
  arbol.innerHTML+=(n.t==='n'?nodo:nodo2)(n.v,n.id);
  pos(n.id,n.px,n.py);
  if(n.t==='o'){
    draw(n.l); draw(n.r);
    window.__lines.push(new LeaderLine(document.getElementById(n.id),document.getElementById(n.l.id),estilos));
    window.__lines.push(new LeaderLine(document.getElementById(n.id),document.getElementById(n.r.id),estilos));
  }
}

btn.addEventListener("click",()=>{
  const expr=($("#expresion").value||'').trim();
  if(!validacion.test(expr)) return alert("Expresión inválida.");
  try{
    const tk=tok(expr);
    if(!parenOK(tk)) return alert("Paréntesis desbalanceados.");
    if(!seqOK(tk))   return alert("Secuencia inválida.");
    if(!top1op(tk))  return alert("No se permiten cadenas de operadores al mismo nivel. Usa paréntesis.");
    clean(); arbol.innerHTML='';
    const ast=rpn2ast(toRPN(tk));
    place(ast); draw(ast);
  }catch(e){ console.error(e); alert("Error: "+e.message); }
});
