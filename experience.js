import Lenis from './vendor/lenis.mjs';
import {ShaderMount} from './vendor/paper/dist/shader-mount.js';
import {liquidMetalFragmentShader} from './vendor/paper/dist/shaders/liquid-metal.js';
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const lenis=new Lenis({autoRaf:true,lerp:.085,anchors:true,smoothWheel:true});window.lenis=lenis;
const field=document.getElementById('paper-field');
let metal;
try{metal=new ShaderMount(field,liquidMetalFragmentShader,{u_colorBack:[.04,.04,.09,1],u_colorTint:[.72,.68,.95,1],u_softness:.55,u_repetition:1.4,u_shiftRed:.12,u_shiftBlue:.18,u_distortion:.4,u_contour:.3,u_angle:45,u_shape:0,u_isImage:false,u_scale:1,u_rotation:0,u_offsetX:0,u_offsetY:0,u_originX:.5,u_originY:.5,u_fit:2,u_worldWidth:0,u_worldHeight:0},undefined,reduced.matches?0:.08,0,1,1000000);}catch(e){field.hidden=true;}
function sync(){const hero=document.getElementById('hero');const p=hero?Math.min(1,scrollY/hero.offsetHeight):1;field.style.opacity=String(p*.16);}
sync();addEventListener('scroll',sync,{passive:true});reduced.addEventListener('change',e=>metal?.setSpeed(e.matches?0:.08));
