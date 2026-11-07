/* Original astral shader, confined to the hero. */
(function(){
  var canvas=document.getElementById('pressure-canvas');
  if(!canvas)return;
  var visible=true;
  if('IntersectionObserver' in window)new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;}).observe(canvas);
  var gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
  if(!gl){

    canvas.style.display='none';
    return;
  }

  var vsSrc='attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.,1.);}';

  var fsSrc=[
    'precision mediump float;',
    'uniform float u_t;uniform vec2 u_res;',
    'vec2 gh(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}',
    'float gn(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(dot(gh(i),f),dot(gh(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(gh(i+vec2(0,1)),f-vec2(0,1)),dot(gh(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*gn(p);p=p*2.1+vec2(1.7,9.2);a*=.5;}return v;}',
    'vec3 pmap(float t){t=clamp(t,0.,1.);vec3 B=vec3(.29,.39,.85),L=vec3(.73,.71,.9),Y=vec3(.94,.85,.54),R=vec3(.85,.38,.31);if(t<.33)return mix(B,L,t/.33);if(t<.67)return mix(L,Y,(t-.33)/.34);return mix(Y,R,(t-.67)/.33);}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/u_res;uv.y=1.-uv.y;',
    '  float s=u_t*.06;',
    '  vec2 q=vec2(fbm(uv*2.5+s),fbm(uv*2.5+vec2(5.2,1.3)+s*.8));',
    '  vec2 r=vec2(fbm(uv*2.5+q+s*.6),fbm(uv*2.5+q+vec2(1.7,9.2)+s*.5));',
    '  float n=fbm(uv*2.+r+s*.3);',
    '  float p=pow(clamp(n*.55+.55,0.,1.),1.9);',
    '  vec3 col=pmap(p);',
    '  float lft=1.-smoothstep(0.,.58,uv.x);',
    '  col=mix(col,vec3(.03,.03,.06),lft*.88);',
    '  gl_FragColor=vec4(col*.9,1.);',
    '}'
  ].join('\n');

  function mkShader(type,src){
    var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn('shader:',gl.getShaderInfoLog(s));gl.deleteShader(s);return null;}
    return s;
  }
  var vs=mkShader(gl.VERTEX_SHADER,vsSrc),fs=mkShader(gl.FRAGMENT_SHADER,fsSrc);
  if(!vs||!fs){canvas.style.display='none';return;}

  var prog=gl.createProgram();
  gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){console.warn('link:',gl.getProgramInfoLog(prog));canvas.style.display='none';return;}

  gl.useProgram(prog);
  var buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var pos=gl.getAttribLocation(prog,'a_pos');
  gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);

  var uT=gl.getUniformLocation(prog,'u_t'),uR=gl.getUniformLocation(prog,'u_res');

  var W=0,H=0;
  function resize(){
    var dpr=Math.min(devicePixelRatio||1,1.5);
    W=Math.round(canvas.offsetWidth*dpr);H=Math.round(canvas.offsetHeight*dpr);
    canvas.width=W;canvas.height=H;
    gl.viewport(0,0,W,H);
  }

  var reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;


  var last=0;
  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden||!visible)return;
    if(reduced && last)return;
    if(now-last<32)return;
    last=now;
    if(!W)resize();
    gl.uniform1f(uT,reduced?0:now*.001);
    gl.uniform2f(uR,W,H);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    canvas.dataset.time=(reduced?0:now*.001).toFixed(3);
  }
  resize();
  addEventListener('resize',function(){resize();last=0;});
  var preference=matchMedia('(prefers-reduced-motion:reduce)');
  preference.addEventListener('change',function(e){reduced=e.matches;last=0;});
  requestAnimationFrame(frame);
})();
