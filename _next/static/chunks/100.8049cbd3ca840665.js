"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[100],{4100:(e,t,n)=>{n.r(t),n.d(t,{default:()=>m});var i=n(20698),r=n(95155),o=n(12115),s=n(13199),a=n(37903),l=n(20450),d=n.n(l),u=n(5565),h=n(65285);function f(){let e=(0,i._)(["\n  position: absolute;\n\n  display: flex;\n  column-gap: 24px;\n\n  left: 50%;\n  bottom: 0;\n  transform: translate(-50%, -50%);\n\n  padding: 14px 31px;\n  border-radius: 80px;\n  background-color: rgba(0, 0, 0, 0.5);\n\n  img {\n    width: 25px;\n  }\n"]);return f=function(){return e},e}function c(){let e=(0,i._)(["\n  position: absolute;\n  width: 0;\n  height: 0;\n  padding: 0;\n  overflow: hidden;\n  border: 0;\n"]);return c=function(){return e},e}function g(){let e=(0,i._)(["\n  cursor: pointer;\n"]);return g=function(){return e},e}function p(){let e=(0,i._)(["\n  position: absolute;\n  z-index: 999;\n\n  bottom: 0;\n  left: 50%;\n  transform: translate(-50%, -30%);\n"]);return p=function(){return e},e}let x=window.innerWidth,w=window.innerHeight,y=e=>e.map(e=>({...e})),b=e=>{let{src:t,shapeProps:n,isSelected:i,onSelect:a,onChange:l,onDragMove:u,onDragEnd:h}=e,[f]=d()(t,"anonymous"),c=(0,o.useRef)(),g=(0,o.useRef)();return(0,o.useEffect)(()=>{i&&g.current.nodes([c.current])},[i]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(s._V,{name:"object",image:f,onClick:a,onTap:a,ref:c,...n,draggable:i,onDragMove:e=>{u&&u(e,c.current)},onDragEnd:e=>{l({...n,x:e.target.x(),y:e.target.y()}),h&&h(e)},onTransformEnd:e=>{let t=c.current,i=t.scaleX(),r=t.scaleY();t.scaleX(1),t.scaleY(1),l({...n,x:t.x(),y:t.y(),width:Math.max(5,t.width()*i),height:Math.max(t.height()*r),rotation:t.rotation()}),h&&h(e)}}),i&&(0,r.jsx)(s.Ge,{ref:g,flipEnabled:!1,boundBoxFunc:(e,t)=>5>Math.abs(t.width)||5>Math.abs(t.height)?e:t})]})},m=()=>{let e=(0,o.useRef)(null),t=(0,o.useRef)(null),[n,i]=(0,o.useState)([]),[l,d]=(0,o.useState)(null),[h,f]=(0,o.useState)("#fff"),[c,g]=(0,o.useState)(!1),[p,m]=(0,o.useState)([]),[C,G]=(0,o.useState)([]),[S,M]=(0,o.useState)([]),_=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:h;i(e),f(t),m(n=>[...n,{images:y(e),color:t}]),G([])},R=async t=>{if(!t.target.files[0])return;let r=(window.webkitURL||window.URL).createObjectURL(t.target.files[0]),o=new window.Image;o.src=r,o.onload=()=>{let{width:t,height:s}=o;var a=e.current.getWidth()-2,l=e.current.getHeight()-2,d=a/t,u=l/s,h=d>u?u:d,f=parseInt(t*h,10),c=parseInt(s*h,10);let g=[...n,{url:r,id:Math.floor(9999*Math.random())+1,x:e.current.width()/4,y:e.current.height()/4,width:f,height:c,rotation:0}];i(g),_(g)}},D=e=>{e.target===e.target.getStage()&&(d(null),g(!1))},W=()=>{if(p.length<=1)return;let e=p[p.length-2],t=p[p.length-1];i(e.images),f(e.color),m(e=>e.slice(0,-1)),G(e=>[...e,t]),d(null)},z=()=>{if(0===C.length)return;let e=C[C.length-1];i(e.images),f(e.color),m(t=>[...t,e]),G(e=>e.slice(0,-1))};(0,o.useEffect)(()=>{let e=e=>{e.ctrlKey&&"z"===e.key?(e.preventDefault(),W()):e.ctrlKey&&"y"===e.key&&(e.preventDefault(),z())};return window.addEventListener("keydown",e),()=>window.removeEventListener("keydown",e)},[p,C]),(0,o.useEffect)(()=>{0===p.length&&m([{images:[],color:"#fff"}])},[]),(0,o.useEffect)(()=>{var t;let n=null===(t=e.current)||void 0===t?void 0:t.container();n&&(n.style.backgroundColor=h)},[h]);let H=t=>{let n=e.current,i=[0,n.width()/2,n.width()],r=[0,n.height()/2,n.height()];return n.find(".object").forEach(e=>{if(e===t)return;let n=e.getClientRect({skipStroke:!0});i.push(n.x,n.x+n.width,n.x+n.width/2),r.push(n.y,n.y+n.height,n.y+n.height/2)}),{vertical:i,horizontal:r}},L=e=>{let t=e.getClientRect({skipStroke:!0}),n=e.absolutePosition();return{vertical:[{guide:t.x,offset:n.x-t.x,snap:"start"},{guide:t.x+t.width/2,offset:n.x-(t.x+t.width/2),snap:"center"},{guide:t.x+t.width,offset:n.x-(t.x+t.width),snap:"end"}],horizontal:[{guide:t.y,offset:n.y-t.y,snap:"start"},{guide:t.y+t.height/2,offset:n.y-(t.y+t.height/2),snap:"center"},{guide:t.y+t.height,offset:n.y-(t.y+t.height),snap:"end"}]}},N=(e,t)=>{let n=[],i=[];e.vertical.forEach(e=>{t.vertical.forEach(t=>{let i=Math.abs(e-t.guide);i<5&&n.push({lineGuide:e,diff:i,snap:t.snap,offset:t.offset})})}),e.horizontal.forEach(e=>{t.horizontal.forEach(t=>{let n=Math.abs(e-t.guide);n<5&&i.push({lineGuide:e,diff:n,snap:t.snap,offset:t.offset})})});let r=[],o=n.sort((e,t)=>e.diff-t.diff)[0],s=i.sort((e,t)=>e.diff-t.diff)[0];return o&&r.push({lineGuide:o.lineGuide,offset:o.offset,orientation:"V",snap:o.snap}),s&&r.push({lineGuide:s.lineGuide,offset:s.offset,orientation:"H",snap:s.snap}),r},A=(e,t)=>{M([]);let n=N(H(t),L(t));if(n.length){let e=t.absolutePosition();n.forEach(t=>{switch(t.orientation){case"V":e.x=t.lineGuide+t.offset;break;case"H":e.y=t.lineGuide+t.offset}}),t.absolutePosition(e)}M(n)},I=()=>{M([])};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(s.BI,{width:x,height:w,ref:e,onMouseDown:D,onTouchStart:D,children:[(0,r.jsx)(s.Wd,{ref:t,children:n.map((e,t)=>(0,r.jsx)(b,{src:e.url,shapeProps:e,isSelected:e.id===l,onSelect:()=>{d(e.id)},onChange:e=>{let i=n.slice();i[t]=e,_(i)},onDragMove:A,onDragEnd:I},t))}),(0,r.jsx)(s.Wd,{children:S.map((e,t)=>"H"===e.orientation?(0,r.jsx)(s.N1,{points:[-6e3,e.lineGuide,6e3,e.lineGuide],stroke:"rgb(0, 161, 255)",strokeWidth:1,dash:[4,6]},t):"V"===e.orientation?(0,r.jsx)(s.N1,{points:[e.lineGuide,-6e3,e.lineGuide,6e3],stroke:"rgb(0, 161, 255)",strokeWidth:1,dash:[4,6]},t):null)})]}),c&&(0,r.jsx)(E,{children:(0,r.jsx)(a.Xq,{color:h,onChange:t=>{e.current.container().style.backgroundColor=t.hex,_(n,t.hex)}})}),(0,r.jsx)("div",{className:"text-center",children:(0,r.jsxs)(j,{children:[(0,r.jsx)("button",{onClick:()=>g(!c),title:"배경색 선택",children:(0,r.jsx)(u.default,{src:"./images/color-picker-icon.png",width:25,height:25,alt:"background-color-picker-icon"})}),(0,r.jsxs)(v,{title:"이미지 추가",children:[(0,r.jsx)(k,{type:"file",id:"file_input",onChange:R}),(0,r.jsx)(u.default,{src:"./images/image-square.png",width:25,height:25,alt:"import-image-icon"})]}),(0,r.jsxs)(v,{title:"이미지 추가",children:[(0,r.jsx)(k,{type:"file",id:"file_input",onChange:R}),(0,r.jsx)(u.default,{src:"./images/plus.png",width:25,height:25,alt:"plus-icon"})]}),(0,r.jsx)("button",{onClick:W,title:"되돌리기 (Ctrl+Z)",children:(0,r.jsx)(u.default,{src:"./images/arrow-u-down-undo.png",width:25,height:25,alt:"undo-icon"})}),(0,r.jsx)("button",{onClick:z,title:"다시 실행 (Ctrl+Y)",children:(0,r.jsx)(u.default,{src:"./images/arrow-u-down-redo.png",width:25,height:25,alt:"redo-icon"})})]})})]})},j=h.Ay.div(f()),k=h.Ay.input(c()),v=h.Ay.label(g()),E=h.Ay.div(p())}}]);