(function(){
'use strict';

const SOURCE_LABEL='pendiente de verificar en fuente oficial';

const KEYWORD_RULES={
  'c1:actividadempresa':{groups:[['servici'],['administrativ']],min:2},
  'c2:actividadempresa':{groups:[['congres','event']],min:1},
  'c2:actividad':{groups:[['recur','estacion','temporad','campan'],['congres','event'],['octubr','abril']],min:2},
  'c2:llamamiento':{groups:[['llam'],['criter','objetiv','orden'],['conveni','acuerd'],['comunic','notific','escrit']],min:2},
  'c3:actividadempresa':{groups:[['papeler','material'],['escolar']],min:1},
  'c3:centro':{groups:[['santiago'],['teide']],min:2},
  'c3:causa':{groups:[['increment','aument'],['ocasional','imprevis','extraordin'],['pedido'],['temporal','seman']],min:3},
  'c4:actividadempresa':{groups:[['servici'],['administrativ']],min:2},
  'c4:duracion':{groups:[['reincorpor','retorn','vuelta','fin'],['incapacidad','baja','reserva','causa']],min:1},
  'c5:actividadempresa':{groups:[['consultor','digital']],min:1},
  'c5:formacion':{groups:[['formacion','formativ','fp'],['coordin','program','centro'],['alternan']],min:2},
  'c6:actividadempresa':{groups:[['asesor']],min:1},
  'c6:plan':{groups:[['contrat'],['archiv'],['laboral'],['gestion'],['document']],min:2},
  'c6:distribucion':{groups:[['lunes'],['viernes']],min:2}
};

const KNOWN={
 c1:{empresa:'gestion insular administrativa',cif:'b76543210',ccc:'381234567890',domicilio:'canarias 25',localidad:'guia de isora',trabajador:'andrea perez martin',dni:'00000001r',nss:'381234567891',nacimiento:'14032002',nivel:'administracion y finanzas',puesto:'administrativa',centro:'guia de isora',modalidad:'indefinido',inicio:'05102026',jornada:'40',distribucion:'lunes viernes 0800 1600',salario:'1650',jornadaTipo:'completo'},
 c2:{empresa:'costa sur congresos',cif:'b76543211',ccc:'381234567892',domicilio:'marina 18',localidad:'adeje',trabajador:'daniela hernandez luis',dni:'00000002w',nss:'381234567893',nacimiento:'09072001',nivel:'asistencia a la direccion',puesto:'administracion de eventos',centro:'adeje',jornada:'35',salario:'1520'},
 c3:{empresa:'papeleria atlantica',cif:'b76543212',ccc:'381234567894',domicilio:'mercado 7',localidad:'santiago del teide',trabajador:'samuel diaz ramos',dni:'00000003a',nss:'381234567895',nacimiento:'22112000',nivel:'gestion administrativa',puesto:'auxiliar administrativo',inicio:'01092026',duracion:'6 semanas',jornada:'30',distribucion:'lunes viernes 0900 1500',salario:'1180',jornadaTipo:'parcial'},
 c4:{empresa:'servicios administrativos chinyero',cif:'b76543213',ccc:'381234567896',domicilio:'volcanes 4',localidad:'guia de isora',trabajador:'nayra rodriguez cruz',dni:'00000004g',nss:'381234567897',nacimiento:'18011999',nivel:'administracion y finanzas',puesto:'administrativa',centro:'guia de isora',sustituida:'maria gonzalez torres',causa:'incapacidad temporal',jornada:'completa',distribucion:'lunes viernes 0800 1600',salario:'1700',jornadaTipo:'completo'},
 c5:{empresa:'consultoria isora digital',cif:'b76543214',ccc:'381234567898',domicilio:'isora 10',localidad:'guia de isora',trabajador:'alex martin suarez',dni:'00000005m',nss:'381234567899',nacimiento:'30052005',puesto:'apoyo administrativo',centro:'guia de isora',duracion:'12 meses',prueba:'no procede'},
 c6:{empresa:'asesoria guanche',cif:'b76543215',ccc:'381234567800',domicilio:'plaza 12',localidad:'adeje',trabajador:'lucia morales perez',dni:'00000006y',nss:'381234567801',nacimiento:'11022003',nivel:'administracion y finanzas',titulacion:'administracion y finanzas',puesto:'administrativo',centro:'adeje',jornadaTipo:'completo'}
};

function norm(v){
 return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
function compact(v){return norm(v).replace(/\s+/g,'')}
function tokens(v){return norm(v).split(' ').filter(Boolean)}
function hasStem(v,stem){
 const t=tokens(v),s=norm(stem);
 return t.some(x=>x===s || (s.length>=4 && x.startsWith(s)) || (s.length>=5 && x.includes(s)));
}
function keywordVerdict(formId,key,value){
 const rule=KEYWORD_RULES[formId+':'+key];if(!rule)return null;
 const matched=rule.groups.filter(group=>group.some(stem=>hasStem(value,stem)));
 const words=[...new Set(matched.flatMap(group=>group.filter(stem=>hasStem(value,stem))))];
 if(matched.length>=rule.min){
   return {state:'ok',msg:'Conceptos clave reconocidos: '+words.join(', ')};
 }
 return {state:'bad',msg:'La respuesta necesita más conceptos relevantes; se han reconocido '+matched.length+' de '+rule.min+' grupos mínimos.'};
}
function textMatches(value,expected){
 const e=tokens(expected).filter(x=>x.length>2);
 const v=norm(value);
 return e.length ? e.every(x=>v.includes(x)) : compact(value)===compact(expected);
}
function knownVerdict(formId,key,value,expected){
 if(!String(value??'').trim())return{state:'bad',msg:'Campo sin cumplimentar'};
 const v=compact(value),e=compact(expected);
 if(['cif','ccc','dni','nss','nacimiento','inicio','jornadaTipo'].includes(key))
   return v===e?{state:'ok',msg:'Coincide con el supuesto'}:{state:'bad',msg:'No coincide con el supuesto'};
 if(key==='salario'||key==='jornada')
   return v.includes(e)?{state:'ok',msg:'Coincide con el dato del supuesto'}:{state:'bad',msg:'No coincide con el dato del supuesto'};
 if(key==='distribucion'){
   const n=norm(value),need=['lunes','viernes'];
   const hours=formId==='c3'?['9','15']:['8','16'];
   const ok=need.every(x=>n.includes(x))&&hours.every(x=>n.includes(x));
   return ok?{state:'ok',msg:'Días y horario reconocidos'}:{state:'bad',msg:'Revisa días y horario del supuesto'};
 }
 if(key==='duracion'&&formId==='c3'){
   return (/\b6\b/.test(norm(value))&&hasStem(value,'seman'))?{state:'ok',msg:'Duración reconocida'}:{state:'bad',msg:'Revisa la duración indicada en el supuesto'};
 }
 if(key==='causa'&&formId==='c4'){
   const ok=hasStem(value,'incapacidad')&&hasStem(value,'temporal');
   return ok?{state:'ok',msg:'Causa de sustitución reconocida'}:{state:'bad',msg:'Debe identificarse la incapacidad temporal'};
 }
 if(key==='prueba'&&formId==='c5'){
   const n=norm(value),ok=(n.includes('no procede')||n.includes('no puede')||n.includes('sin periodo'));
   return ok?{state:'ok',msg:'Correcto: en formación en alternancia no procede periodo de prueba'}:{state:'bad',msg:'Revisa si esta modalidad admite periodo de prueba'};
 }
 return textMatches(value,expected)?{state:'ok',msg:'Palabras clave del supuesto reconocidas'}:{state:'bad',msg:'No coincide suficientemente con los datos del supuesto'};
}
function sourceVerdict(key,value,el){
 const n=norm(value),c=compact(value);
 if(!n)return{state:'bad',msg:'Campo sin cumplimentar'};
 if(el?.type==='radio'&&!value)return{state:'bad',msg:'Selecciona una opción'};
 if(key==='codigo'&&!/\d{3,}/.test(c))return{state:'bad',msg:'Introduce el código contractual consultado en el modelo oficial'};
 if(key==='convenio'&&n.length<5)return{state:'bad',msg:'Identifica el convenio consultado'};
 if(['causa','actividad','llamamiento','formacion','plan'].includes(key)&&n.length<8)return{state:'bad',msg:'La respuesta es demasiado breve'};
 return{state:'source',msg:'Respuesta cumplimentada; '+SOURCE_LABEL};
}
function labelOf(el){
 const label=el.closest('label');
 if(label){const clone=label.cloneNode(true);clone.querySelectorAll('input,textarea,select').forEach(x=>x.remove());const t=clone.textContent.trim();if(t)return t}
 const clause=el.closest('.contract-clause'),b=clause?.querySelector('b');
 if(b)return b.textContent.replace(/\.$/,'');
 return (el.dataset.contract||'').split(':')[1]||'Campo';
}
function valueOf(form,key){
 const els=[...form.querySelectorAll('[data-contract$=":'+CSS.escape(key)+'"]')];
 if(!els.length)return'';
 if(els[0].type==='radio')return els.find(x=>x.checked)?.value||'';
 return els[0].value||'';
}
function recordEvidence(formId,response,summary){
 try{
   const ev=window.EVIDENCE||(window.parent&&window.parent!==window?window.parent.EVIDENCE:null);
   if(!ev)return;
   const payload={kind:'portfolio',ce:'1.g',item_id:'1.g-contract-'+formId,response,correct:null,score:summary.score,payload:{activity:'contract-document',validation:'keywords-v2',fields_total:summary.total,fields_verified:summary.ok,fields_source:summary.source,fields_incorrect:summary.bad}};
   if(ev.documentEvent)Promise.resolve(ev.documentEvent(payload)).catch(()=>{});
   else if(ev.event)Promise.resolve(ev.event({...payload,attempt:1})).catch(()=>{});
 }catch(e){}
}

document.addEventListener('click',function(ev){
 const btn=ev.target.closest&&ev.target.closest('.contract-check');
 if(!btn)return;
 ev.preventDefault();
 ev.stopImmediatePropagation();

 const form=btn.closest('.contract-form[id]');if(!form)return;
 const formId=form.id,response={},seen=new Set(),details=[];
 form.querySelectorAll('[data-contract]').forEach(el=>{
   const key=(el.dataset.contract||'').split(':')[1];
   if(!key||seen.has(key))return;seen.add(key);
   const value=valueOf(form,key);response[key]=value;
   let verdict=keywordVerdict(formId,key,value);
   if(!verdict&&KNOWN[formId]&&Object.prototype.hasOwnProperty.call(KNOWN[formId],key))
     verdict=knownVerdict(formId,key,value,KNOWN[formId][key]);
   if(!verdict)verdict=sourceVerdict(key,value,el);

   const cssState=verdict.state==='source'?'review':verdict.state;
   form.querySelectorAll('[data-contract$=":'+CSS.escape(key)+'"]').forEach(x=>{
     x.classList.remove('field-ok','field-bad','field-review');
     x.classList.add('field-'+cssState);
     x.setAttribute('aria-invalid',verdict.state==='bad'?'true':'false');
   });
   details.push({key,label:labelOf(el),state:verdict.state,msg:verdict.msg});
 });

 const ok=details.filter(x=>x.state==='ok').length;
 const source=details.filter(x=>x.state==='source').length;
 const bad=details.filter(x=>x.state==='bad').length;
 const total=details.length;
 const score=total?Math.round((ok+source*.5)/total*100):0;
 const result=document.getElementById(formId+'Result');
 const errors=details.filter(x=>x.state==='bad');
 const sources=details.filter(x=>x.state==='source');
 if(result){
   result.className='feedback '+(bad?'bad':source?'review':'ok');
   result.innerHTML='<b>'+(bad?'Revisión necesaria':'Comprobación terminada')+':</b> '
     +ok+' campos verificados, '+source+' '+SOURCE_LABEL+(source===1?'':'s')+' y '+bad+' con incidencia.'
     +(errors.length?'<ul>'+errors.slice(0,10).map(x=>'<li><strong>'+x.label+':</strong> '+x.msg+'</li>').join('')+'</ul>':'')
     +(sources.length?'<p><strong>Pendientes de verificar en fuente oficial:</strong> '+sources.map(x=>x.label).join(', ')+'.</p>':'')
     +'<p class="muted">Las respuestas abiertas se comprueban por palabras y conceptos clave, no por una frase literal. Aun así, los datos que dependen de convenio, SEPE, Seguridad Social o normativa vigente deben contrastarse en la fuente oficial.</p>';
 }
 recordEvidence(formId,response,{ok,source,bad,total,score});
},true);

})();
