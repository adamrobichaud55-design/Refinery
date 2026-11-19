(function(){"use strict";/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Lt="srgb",Xt="srgb-linear",li="linear",tt="srgb",Sr="300 es";class yn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const r=this._listeners[e];if(r!==void 0){const a=r.indexOf(t);a!==-1&&r.splice(a,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let a=0,s=r.length;a<s;a++)r[a].call(this,e);e.target=null}}}const vt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ii=Math.PI/180,Fi=180/Math.PI;function kn(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(vt[i&255]+vt[i>>8&255]+vt[i>>16&255]+vt[i>>24&255]+"-"+vt[e&255]+vt[e>>8&255]+"-"+vt[e>>16&15|64]+vt[e>>24&255]+"-"+vt[t&63|128]+vt[t>>8&255]+"-"+vt[t>>16&255]+vt[t>>24&255]+vt[n&255]+vt[n>>8&255]+vt[n>>16&255]+vt[n>>24&255]).toLowerCase()}function Tt(i,e,t){return Math.max(e,Math.min(t,i))}function Fa(i,e){return(i%e+e)%e}function Ni(i,e,t){return(1-t)*i+t*e}function Wn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function At(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class nt{constructor(e=0,t=0){nt.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Tt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),a=this.x-e.x,s=this.y-e.y;return this.x=a*n-s*r+e.x,this.y=a*r+s*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ve{constructor(e,t,n,r,a,s,o,c,u){Ve.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,a,s,o,c,u)}set(e,t,n,r,a,s,o,c,u){const d=this.elements;return d[0]=e,d[1]=r,d[2]=o,d[3]=t,d[4]=a,d[5]=c,d[6]=n,d[7]=s,d[8]=u,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,a=this.elements,s=n[0],o=n[3],c=n[6],u=n[1],d=n[4],f=n[7],p=n[2],_=n[5],v=n[8],M=r[0],m=r[3],h=r[6],R=r[1],A=r[4],T=r[7],G=r[2],U=r[5],L=r[8];return a[0]=s*M+o*R+c*G,a[3]=s*m+o*A+c*U,a[6]=s*h+o*T+c*L,a[1]=u*M+d*R+f*G,a[4]=u*m+d*A+f*U,a[7]=u*h+d*T+f*L,a[2]=p*M+_*R+v*G,a[5]=p*m+_*A+v*U,a[8]=p*h+_*T+v*L,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],o=e[5],c=e[6],u=e[7],d=e[8];return t*s*d-t*o*u-n*a*d+n*o*c+r*a*u-r*s*c}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],o=e[5],c=e[6],u=e[7],d=e[8],f=d*s-o*u,p=o*c-d*a,_=u*a-s*c,v=t*f+n*p+r*_;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const M=1/v;return e[0]=f*M,e[1]=(r*u-d*n)*M,e[2]=(o*n-r*s)*M,e[3]=p*M,e[4]=(d*t-r*c)*M,e[5]=(r*a-o*t)*M,e[6]=_*M,e[7]=(n*c-u*t)*M,e[8]=(s*t-n*a)*M,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,a,s,o){const c=Math.cos(a),u=Math.sin(a);return this.set(n*c,n*u,-n*(c*s+u*o)+s+e,-r*u,r*c,-r*(-u*s+c*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Bi.makeScale(e,t)),this}rotate(e){return this.premultiply(Bi.makeRotation(-e)),this}translate(e,t){return this.premultiply(Bi.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Bi=new Ve;function Er(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ci(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Na(){const i=ci("canvas");return i.style.display="block",i}const yr={};function Xn(i){i in yr||(yr[i]=!0,console.warn(i))}function Ba(i,e,t){return new Promise(function(n,r){function a(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(a,t);break;default:n()}}setTimeout(a,t)})}function Oa(i){const e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function za(i){const e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}const $e={enabled:!0,workingColorSpace:Xt,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===tt&&(i.r=qt(i.r),i.g=qt(i.g),i.b=qt(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===tt&&(i.r=Tn(i.r),i.g=Tn(i.g),i.b=Tn(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===""?li:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function qt(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Tn(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const Tr=[.64,.33,.3,.6,.15,.06],Ar=[.2126,.7152,.0722],br=[.3127,.329],wr=new Ve().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rr=new Ve().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);$e.define({[Xt]:{primaries:Tr,whitePoint:br,transfer:li,toXYZ:wr,fromXYZ:Rr,luminanceCoefficients:Ar,workingColorSpaceConfig:{unpackColorSpace:Lt},outputColorSpaceConfig:{drawingBufferColorSpace:Lt}},[Lt]:{primaries:Tr,whitePoint:br,transfer:tt,toXYZ:wr,fromXYZ:Rr,luminanceCoefficients:Ar,outputColorSpaceConfig:{drawingBufferColorSpace:Lt}}});let An;class Ga{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement=="undefined")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{An===void 0&&(An=ci("canvas")),An.width=e.width,An.height=e.height;const n=An.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=An}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement!="undefined"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&e instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&e instanceof ImageBitmap){const t=ci("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),a=r.data;for(let s=0;s<a.length;s++)a[s]=qt(a[s]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(qt(t[n]/255)*255):t[n]=qt(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Ha=0;class Cr{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ha++}),this.uuid=kn(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let s=0,o=r.length;s<o;s++)r[s].isDataTexture?a.push(Oi(r[s].image)):a.push(Oi(r[s]))}else a=Oi(r);n.url=a}return t||(e.images[this.uuid]=n),n}}function Oi(i){return typeof HTMLImageElement!="undefined"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&i instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&i instanceof ImageBitmap?Ga.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Va=0;class _t extends yn{constructor(e=_t.DEFAULT_IMAGE,t=_t.DEFAULT_MAPPING,n=1001,r=1001,a=1006,s=1008,o=1023,c=1009,u=_t.DEFAULT_ANISOTROPY,d=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Va++}),this.uuid=kn(),this.name="",this.source=new Cr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=a,this.minFilter=s,this.anisotropy=u,this.format=o,this.internalFormat=null,this.type=c,this.offset=new nt(0,0),this.repeat=new nt(1,1),this.center=new nt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ve,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1e3:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1e3:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}_t.DEFAULT_IMAGE=null,_t.DEFAULT_MAPPING=300,_t.DEFAULT_ANISOTROPY=1;class lt{constructor(e=0,t=0,n=0,r=1){lt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,a=this.w,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r+s[12]*a,this.y=s[1]*t+s[5]*n+s[9]*r+s[13]*a,this.z=s[2]*t+s[6]*n+s[10]*r+s[14]*a,this.w=s[3]*t+s[7]*n+s[11]*r+s[15]*a,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,a;const c=e.elements,u=c[0],d=c[4],f=c[8],p=c[1],_=c[5],v=c[9],M=c[2],m=c[6],h=c[10];if(Math.abs(d-p)<.01&&Math.abs(f-M)<.01&&Math.abs(v-m)<.01){if(Math.abs(d+p)<.1&&Math.abs(f+M)<.1&&Math.abs(v+m)<.1&&Math.abs(u+_+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const A=(u+1)/2,T=(_+1)/2,G=(h+1)/2,U=(d+p)/4,L=(f+M)/4,B=(v+m)/4;return A>T&&A>G?A<.01?(n=0,r=.707106781,a=.707106781):(n=Math.sqrt(A),r=U/n,a=L/n):T>G?T<.01?(n=.707106781,r=0,a=.707106781):(r=Math.sqrt(T),n=U/r,a=B/r):G<.01?(n=.707106781,r=.707106781,a=0):(a=Math.sqrt(G),n=L/a,r=B/a),this.set(n,r,a,t),this}let R=Math.sqrt((m-v)*(m-v)+(f-M)*(f-M)+(p-d)*(p-d));return Math.abs(R)<.001&&(R=1),this.x=(m-v)/R,this.y=(f-M)/R,this.z=(p-d)/R,this.w=Math.acos((u+_+h-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class ka extends yn{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new lt(0,0,e,t),this.scissorTest=!1,this.viewport=new lt(0,0,e,t);const r={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const a=new _t(r,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);a.flipY=!1,a.generateMipmaps=n.generateMipmaps,a.internalFormat=n.internalFormat,this.textures=[];const s=n.count;for(let o=0;o<s;o++)this.textures[o]=a.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,a=this.textures.length;r<a;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,r=e.textures.length;n<r;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Cr(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ft extends ka{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Pr extends _t{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Wa extends _t{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class St{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,a,s,o){let c=n[r+0],u=n[r+1],d=n[r+2],f=n[r+3];const p=a[s+0],_=a[s+1],v=a[s+2],M=a[s+3];if(o===0){e[t+0]=c,e[t+1]=u,e[t+2]=d,e[t+3]=f;return}if(o===1){e[t+0]=p,e[t+1]=_,e[t+2]=v,e[t+3]=M;return}if(f!==M||c!==p||u!==_||d!==v){let m=1-o;const h=c*p+u*_+d*v+f*M,R=h>=0?1:-1,A=1-h*h;if(A>Number.EPSILON){const G=Math.sqrt(A),U=Math.atan2(G,h*R);m=Math.sin(m*U)/G,o=Math.sin(o*U)/G}const T=o*R;if(c=c*m+p*T,u=u*m+_*T,d=d*m+v*T,f=f*m+M*T,m===1-o){const G=1/Math.sqrt(c*c+u*u+d*d+f*f);c*=G,u*=G,d*=G,f*=G}}e[t]=c,e[t+1]=u,e[t+2]=d,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,r,a,s){const o=n[r],c=n[r+1],u=n[r+2],d=n[r+3],f=a[s],p=a[s+1],_=a[s+2],v=a[s+3];return e[t]=o*v+d*f+c*_-u*p,e[t+1]=c*v+d*p+u*f-o*_,e[t+2]=u*v+d*_+o*p-c*f,e[t+3]=d*v-o*f-c*p-u*_,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,a=e._z,s=e._order,o=Math.cos,c=Math.sin,u=o(n/2),d=o(r/2),f=o(a/2),p=c(n/2),_=c(r/2),v=c(a/2);switch(s){case"XYZ":this._x=p*d*f+u*_*v,this._y=u*_*f-p*d*v,this._z=u*d*v+p*_*f,this._w=u*d*f-p*_*v;break;case"YXZ":this._x=p*d*f+u*_*v,this._y=u*_*f-p*d*v,this._z=u*d*v-p*_*f,this._w=u*d*f+p*_*v;break;case"ZXY":this._x=p*d*f-u*_*v,this._y=u*_*f+p*d*v,this._z=u*d*v+p*_*f,this._w=u*d*f-p*_*v;break;case"ZYX":this._x=p*d*f-u*_*v,this._y=u*_*f+p*d*v,this._z=u*d*v-p*_*f,this._w=u*d*f+p*_*v;break;case"YZX":this._x=p*d*f+u*_*v,this._y=u*_*f+p*d*v,this._z=u*d*v-p*_*f,this._w=u*d*f-p*_*v;break;case"XZY":this._x=p*d*f-u*_*v,this._y=u*_*f-p*d*v,this._z=u*d*v+p*_*f,this._w=u*d*f+p*_*v;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],a=t[8],s=t[1],o=t[5],c=t[9],u=t[2],d=t[6],f=t[10],p=n+o+f;if(p>0){const _=.5/Math.sqrt(p+1);this._w=.25/_,this._x=(d-c)*_,this._y=(a-u)*_,this._z=(s-r)*_}else if(n>o&&n>f){const _=2*Math.sqrt(1+n-o-f);this._w=(d-c)/_,this._x=.25*_,this._y=(r+s)/_,this._z=(a+u)/_}else if(o>f){const _=2*Math.sqrt(1+o-n-f);this._w=(a-u)/_,this._x=(r+s)/_,this._y=.25*_,this._z=(c+d)/_}else{const _=2*Math.sqrt(1+f-n-o);this._w=(s-r)/_,this._x=(a+u)/_,this._y=(c+d)/_,this._z=.25*_}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Tt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,a=e._z,s=e._w,o=t._x,c=t._y,u=t._z,d=t._w;return this._x=n*d+s*o+r*u-a*c,this._y=r*d+s*c+a*o-n*u,this._z=a*d+s*u+n*c-r*o,this._w=s*d-n*o-r*c-a*u,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,r=this._y,a=this._z,s=this._w;let o=s*e._w+n*e._x+r*e._y+a*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=s,this._x=n,this._y=r,this._z=a,this;const c=1-o*o;if(c<=Number.EPSILON){const _=1-t;return this._w=_*s+t*this._w,this._x=_*n+t*this._x,this._y=_*r+t*this._y,this._z=_*a+t*this._z,this.normalize(),this}const u=Math.sqrt(c),d=Math.atan2(u,o),f=Math.sin((1-t)*d)/u,p=Math.sin(t*d)/u;return this._w=s*f+this._w*p,this._x=n*f+this._x*p,this._y=r*f+this._y*p,this._z=a*f+this._z*p,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),a=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),a*Math.sin(t),a*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{constructor(e=0,t=0,n=0){O.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Dr.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Dr.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[3]*n+a[6]*r,this.y=a[1]*t+a[4]*n+a[7]*r,this.z=a[2]*t+a[5]*n+a[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,a=e.elements,s=1/(a[3]*t+a[7]*n+a[11]*r+a[15]);return this.x=(a[0]*t+a[4]*n+a[8]*r+a[12])*s,this.y=(a[1]*t+a[5]*n+a[9]*r+a[13])*s,this.z=(a[2]*t+a[6]*n+a[10]*r+a[14])*s,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,a=e.x,s=e.y,o=e.z,c=e.w,u=2*(s*r-o*n),d=2*(o*t-a*r),f=2*(a*n-s*t);return this.x=t+c*u+s*f-o*d,this.y=n+c*d+o*u-a*f,this.z=r+c*f+a*d-s*u,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r,this.y=a[1]*t+a[5]*n+a[9]*r,this.z=a[2]*t+a[6]*n+a[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,a=e.z,s=t.x,o=t.y,c=t.z;return this.x=r*c-a*o,this.y=a*s-n*c,this.z=n*o-r*s,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return zi.copy(this).projectOnVector(e),this.sub(zi)}reflect(e){return this.sub(zi.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Tt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const zi=new O,Dr=new St;class qn{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Nt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Nt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Nt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const a=n.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=a.count;s<o;s++)e.isMesh===!0?e.getVertexPosition(s,Nt):Nt.fromBufferAttribute(a,s),Nt.applyMatrix4(e.matrixWorld),this.expandByPoint(Nt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ui.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ui.copy(n.boundingBox)),ui.applyMatrix4(e.matrixWorld),this.union(ui)}const r=e.children;for(let a=0,s=r.length;a<s;a++)this.expandByObject(r[a],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Nt),Nt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Yn),hi.subVectors(this.max,Yn),bn.subVectors(e.a,Yn),wn.subVectors(e.b,Yn),Rn.subVectors(e.c,Yn),nn.subVectors(wn,bn),rn.subVectors(Rn,wn),hn.subVectors(bn,Rn);let t=[0,-nn.z,nn.y,0,-rn.z,rn.y,0,-hn.z,hn.y,nn.z,0,-nn.x,rn.z,0,-rn.x,hn.z,0,-hn.x,-nn.y,nn.x,0,-rn.y,rn.x,0,-hn.y,hn.x,0];return!Gi(t,bn,wn,Rn,hi)||(t=[1,0,0,0,1,0,0,0,1],!Gi(t,bn,wn,Rn,hi))?!1:(di.crossVectors(nn,rn),t=[di.x,di.y,di.z],Gi(t,bn,wn,Rn,hi))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Nt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Nt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Yt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Yt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Yt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Yt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Yt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Yt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Yt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Yt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Yt),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Yt=[new O,new O,new O,new O,new O,new O,new O,new O],Nt=new O,ui=new qn,bn=new O,wn=new O,Rn=new O,nn=new O,rn=new O,hn=new O,Yn=new O,hi=new O,di=new O,dn=new O;function Gi(i,e,t,n,r){for(let a=0,s=i.length-3;a<=s;a+=3){dn.fromArray(i,a);const o=r.x*Math.abs(dn.x)+r.y*Math.abs(dn.y)+r.z*Math.abs(dn.z),c=e.dot(dn),u=t.dot(dn),d=n.dot(dn);if(Math.max(-Math.max(c,u,d),Math.min(c,u,d))>o)return!1}return!0}const Xa=new qn,$n=new O,Hi=new O;class Vi{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Xa.setFromPoints(e).getCenter(n);let r=0;for(let a=0,s=e.length;a<s;a++)r=Math.max(r,n.distanceToSquared(e[a]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;$n.subVectors(e,this.center);const t=$n.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector($n,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Hi.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint($n.copy(e.center).add(Hi)),this.expandByPoint($n.copy(e.center).sub(Hi))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const $t=new O,ki=new O,fi=new O,an=new O,Wi=new O,pi=new O,Xi=new O;class Lr{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,$t)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=$t.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):($t.copy(this.origin).addScaledVector(this.direction,t),$t.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){ki.copy(e).add(t).multiplyScalar(.5),fi.copy(t).sub(e).normalize(),an.copy(this.origin).sub(ki);const a=e.distanceTo(t)*.5,s=-this.direction.dot(fi),o=an.dot(this.direction),c=-an.dot(fi),u=an.lengthSq(),d=Math.abs(1-s*s);let f,p,_,v;if(d>0)if(f=s*c-o,p=s*o-c,v=a*d,f>=0)if(p>=-v)if(p<=v){const M=1/d;f*=M,p*=M,_=f*(f+s*p+2*o)+p*(s*f+p+2*c)+u}else p=a,f=Math.max(0,-(s*p+o)),_=-f*f+p*(p+2*c)+u;else p=-a,f=Math.max(0,-(s*p+o)),_=-f*f+p*(p+2*c)+u;else p<=-v?(f=Math.max(0,-(-s*a+o)),p=f>0?-a:Math.min(Math.max(-a,-c),a),_=-f*f+p*(p+2*c)+u):p<=v?(f=0,p=Math.min(Math.max(-a,-c),a),_=p*(p+2*c)+u):(f=Math.max(0,-(s*a+o)),p=f>0?a:Math.min(Math.max(-a,-c),a),_=-f*f+p*(p+2*c)+u);else p=s>0?-a:a,f=Math.max(0,-(s*p+o)),_=-f*f+p*(p+2*c)+u;return n&&n.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(ki).addScaledVector(fi,p),_}intersectSphere(e,t){$t.subVectors(e.center,this.origin);const n=$t.dot(this.direction),r=$t.dot($t)-n*n,a=e.radius*e.radius;if(r>a)return null;const s=Math.sqrt(a-r),o=n-s,c=n+s;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,a,s,o,c;const u=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,p=this.origin;return u>=0?(n=(e.min.x-p.x)*u,r=(e.max.x-p.x)*u):(n=(e.max.x-p.x)*u,r=(e.min.x-p.x)*u),d>=0?(a=(e.min.y-p.y)*d,s=(e.max.y-p.y)*d):(a=(e.max.y-p.y)*d,s=(e.min.y-p.y)*d),n>s||a>r||((a>n||isNaN(n))&&(n=a),(s<r||isNaN(r))&&(r=s),f>=0?(o=(e.min.z-p.z)*f,c=(e.max.z-p.z)*f):(o=(e.max.z-p.z)*f,c=(e.min.z-p.z)*f),n>c||o>r)||((o>n||n!==n)&&(n=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,$t)!==null}intersectTriangle(e,t,n,r,a){Wi.subVectors(t,e),pi.subVectors(n,e),Xi.crossVectors(Wi,pi);let s=this.direction.dot(Xi),o;if(s>0){if(r)return null;o=1}else if(s<0)o=-1,s=-s;else return null;an.subVectors(this.origin,e);const c=o*this.direction.dot(pi.crossVectors(an,pi));if(c<0)return null;const u=o*this.direction.dot(Wi.cross(an));if(u<0||c+u>s)return null;const d=-o*an.dot(Xi);return d<0?null:this.at(d/s,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class it{constructor(e,t,n,r,a,s,o,c,u,d,f,p,_,v,M,m){it.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,a,s,o,c,u,d,f,p,_,v,M,m)}set(e,t,n,r,a,s,o,c,u,d,f,p,_,v,M,m){const h=this.elements;return h[0]=e,h[4]=t,h[8]=n,h[12]=r,h[1]=a,h[5]=s,h[9]=o,h[13]=c,h[2]=u,h[6]=d,h[10]=f,h[14]=p,h[3]=_,h[7]=v,h[11]=M,h[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new it().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,r=1/Cn.setFromMatrixColumn(e,0).length(),a=1/Cn.setFromMatrixColumn(e,1).length(),s=1/Cn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*a,t[5]=n[5]*a,t[6]=n[6]*a,t[7]=0,t[8]=n[8]*s,t[9]=n[9]*s,t[10]=n[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,a=e.z,s=Math.cos(n),o=Math.sin(n),c=Math.cos(r),u=Math.sin(r),d=Math.cos(a),f=Math.sin(a);if(e.order==="XYZ"){const p=s*d,_=s*f,v=o*d,M=o*f;t[0]=c*d,t[4]=-c*f,t[8]=u,t[1]=_+v*u,t[5]=p-M*u,t[9]=-o*c,t[2]=M-p*u,t[6]=v+_*u,t[10]=s*c}else if(e.order==="YXZ"){const p=c*d,_=c*f,v=u*d,M=u*f;t[0]=p+M*o,t[4]=v*o-_,t[8]=s*u,t[1]=s*f,t[5]=s*d,t[9]=-o,t[2]=_*o-v,t[6]=M+p*o,t[10]=s*c}else if(e.order==="ZXY"){const p=c*d,_=c*f,v=u*d,M=u*f;t[0]=p-M*o,t[4]=-s*f,t[8]=v+_*o,t[1]=_+v*o,t[5]=s*d,t[9]=M-p*o,t[2]=-s*u,t[6]=o,t[10]=s*c}else if(e.order==="ZYX"){const p=s*d,_=s*f,v=o*d,M=o*f;t[0]=c*d,t[4]=v*u-_,t[8]=p*u+M,t[1]=c*f,t[5]=M*u+p,t[9]=_*u-v,t[2]=-u,t[6]=o*c,t[10]=s*c}else if(e.order==="YZX"){const p=s*c,_=s*u,v=o*c,M=o*u;t[0]=c*d,t[4]=M-p*f,t[8]=v*f+_,t[1]=f,t[5]=s*d,t[9]=-o*d,t[2]=-u*d,t[6]=_*f+v,t[10]=p-M*f}else if(e.order==="XZY"){const p=s*c,_=s*u,v=o*c,M=o*u;t[0]=c*d,t[4]=-f,t[8]=u*d,t[1]=p*f+M,t[5]=s*d,t[9]=_*f-v,t[2]=v*f-_,t[6]=o*d,t[10]=M*f+p}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(qa,e,Ya)}lookAt(e,t,n){const r=this.elements;return Rt.subVectors(e,t),Rt.lengthSq()===0&&(Rt.z=1),Rt.normalize(),sn.crossVectors(n,Rt),sn.lengthSq()===0&&(Math.abs(n.z)===1?Rt.x+=1e-4:Rt.z+=1e-4,Rt.normalize(),sn.crossVectors(n,Rt)),sn.normalize(),mi.crossVectors(Rt,sn),r[0]=sn.x,r[4]=mi.x,r[8]=Rt.x,r[1]=sn.y,r[5]=mi.y,r[9]=Rt.y,r[2]=sn.z,r[6]=mi.z,r[10]=Rt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,a=this.elements,s=n[0],o=n[4],c=n[8],u=n[12],d=n[1],f=n[5],p=n[9],_=n[13],v=n[2],M=n[6],m=n[10],h=n[14],R=n[3],A=n[7],T=n[11],G=n[15],U=r[0],L=r[4],B=r[8],y=r[12],x=r[1],D=r[5],j=r[9],W=r[13],Y=r[2],re=r[6],$=r[10],se=r[14],X=r[3],ee=r[7],Q=r[11],ue=r[15];return a[0]=s*U+o*x+c*Y+u*X,a[4]=s*L+o*D+c*re+u*ee,a[8]=s*B+o*j+c*$+u*Q,a[12]=s*y+o*W+c*se+u*ue,a[1]=d*U+f*x+p*Y+_*X,a[5]=d*L+f*D+p*re+_*ee,a[9]=d*B+f*j+p*$+_*Q,a[13]=d*y+f*W+p*se+_*ue,a[2]=v*U+M*x+m*Y+h*X,a[6]=v*L+M*D+m*re+h*ee,a[10]=v*B+M*j+m*$+h*Q,a[14]=v*y+M*W+m*se+h*ue,a[3]=R*U+A*x+T*Y+G*X,a[7]=R*L+A*D+T*re+G*ee,a[11]=R*B+A*j+T*$+G*Q,a[15]=R*y+A*W+T*se+G*ue,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],a=e[12],s=e[1],o=e[5],c=e[9],u=e[13],d=e[2],f=e[6],p=e[10],_=e[14],v=e[3],M=e[7],m=e[11],h=e[15];return v*(+a*c*f-r*u*f-a*o*p+n*u*p+r*o*_-n*c*_)+M*(+t*c*_-t*u*p+a*s*p-r*s*_+r*u*d-a*c*d)+m*(+t*u*f-t*o*_-a*s*f+n*s*_+a*o*d-n*u*d)+h*(-r*o*d-t*c*f+t*o*p+r*s*f-n*s*p+n*c*d)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],o=e[5],c=e[6],u=e[7],d=e[8],f=e[9],p=e[10],_=e[11],v=e[12],M=e[13],m=e[14],h=e[15],R=f*m*u-M*p*u+M*c*_-o*m*_-f*c*h+o*p*h,A=v*p*u-d*m*u-v*c*_+s*m*_+d*c*h-s*p*h,T=d*M*u-v*f*u+v*o*_-s*M*_-d*o*h+s*f*h,G=v*f*c-d*M*c-v*o*p+s*M*p+d*o*m-s*f*m,U=t*R+n*A+r*T+a*G;if(U===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const L=1/U;return e[0]=R*L,e[1]=(M*p*a-f*m*a-M*r*_+n*m*_+f*r*h-n*p*h)*L,e[2]=(o*m*a-M*c*a+M*r*u-n*m*u-o*r*h+n*c*h)*L,e[3]=(f*c*a-o*p*a-f*r*u+n*p*u+o*r*_-n*c*_)*L,e[4]=A*L,e[5]=(d*m*a-v*p*a+v*r*_-t*m*_-d*r*h+t*p*h)*L,e[6]=(v*c*a-s*m*a-v*r*u+t*m*u+s*r*h-t*c*h)*L,e[7]=(s*p*a-d*c*a+d*r*u-t*p*u-s*r*_+t*c*_)*L,e[8]=T*L,e[9]=(v*f*a-d*M*a-v*n*_+t*M*_+d*n*h-t*f*h)*L,e[10]=(s*M*a-v*o*a+v*n*u-t*M*u-s*n*h+t*o*h)*L,e[11]=(d*o*a-s*f*a-d*n*u+t*f*u+s*n*_-t*o*_)*L,e[12]=G*L,e[13]=(d*M*r-v*f*r+v*n*p-t*M*p-d*n*m+t*f*m)*L,e[14]=(v*o*r-s*M*r-v*n*c+t*M*c+s*n*m-t*o*m)*L,e[15]=(s*f*r-d*o*r+d*n*c-t*f*c-s*n*p+t*o*p)*L,this}scale(e){const t=this.elements,n=e.x,r=e.y,a=e.z;return t[0]*=n,t[4]*=r,t[8]*=a,t[1]*=n,t[5]*=r,t[9]*=a,t[2]*=n,t[6]*=r,t[10]*=a,t[3]*=n,t[7]*=r,t[11]*=a,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),a=1-n,s=e.x,o=e.y,c=e.z,u=a*s,d=a*o;return this.set(u*s+n,u*o-r*c,u*c+r*o,0,u*o+r*c,d*o+n,d*c-r*s,0,u*c-r*o,d*c+r*s,a*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,a,s){return this.set(1,n,a,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,a=t._x,s=t._y,o=t._z,c=t._w,u=a+a,d=s+s,f=o+o,p=a*u,_=a*d,v=a*f,M=s*d,m=s*f,h=o*f,R=c*u,A=c*d,T=c*f,G=n.x,U=n.y,L=n.z;return r[0]=(1-(M+h))*G,r[1]=(_+T)*G,r[2]=(v-A)*G,r[3]=0,r[4]=(_-T)*U,r[5]=(1-(p+h))*U,r[6]=(m+R)*U,r[7]=0,r[8]=(v+A)*L,r[9]=(m-R)*L,r[10]=(1-(p+M))*L,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;let a=Cn.set(r[0],r[1],r[2]).length();const s=Cn.set(r[4],r[5],r[6]).length(),o=Cn.set(r[8],r[9],r[10]).length();this.determinant()<0&&(a=-a),e.x=r[12],e.y=r[13],e.z=r[14],Bt.copy(this);const u=1/a,d=1/s,f=1/o;return Bt.elements[0]*=u,Bt.elements[1]*=u,Bt.elements[2]*=u,Bt.elements[4]*=d,Bt.elements[5]*=d,Bt.elements[6]*=d,Bt.elements[8]*=f,Bt.elements[9]*=f,Bt.elements[10]*=f,t.setFromRotationMatrix(Bt),n.x=a,n.y=s,n.z=o,this}makePerspective(e,t,n,r,a,s,o=2e3){const c=this.elements,u=2*a/(t-e),d=2*a/(n-r),f=(t+e)/(t-e),p=(n+r)/(n-r);let _,v;if(o===2e3)_=-(s+a)/(s-a),v=-2*s*a/(s-a);else if(o===2001)_=-s/(s-a),v=-s*a/(s-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=d,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=_,c[14]=v,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,a,s,o=2e3){const c=this.elements,u=1/(t-e),d=1/(n-r),f=1/(s-a),p=(t+e)*u,_=(n+r)*d;let v,M;if(o===2e3)v=(s+a)*f,M=-2*f;else if(o===2001)v=a*f,M=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=2*u,c[4]=0,c[8]=0,c[12]=-p,c[1]=0,c[5]=2*d,c[9]=0,c[13]=-_,c[2]=0,c[6]=0,c[10]=M,c[14]=-v,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const Cn=new O,Bt=new it,qa=new O(0,0,0),Ya=new O(1,1,1),sn=new O,mi=new O,Rt=new O,Ur=new it,Ir=new St;class Ot{constructor(e=0,t=0,n=0,r=Ot.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,a=r[0],s=r[4],o=r[8],c=r[1],u=r[5],d=r[9],f=r[2],p=r[6],_=r[10];switch(t){case"XYZ":this._y=Math.asin(Tt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,_),this._z=Math.atan2(-s,a)):(this._x=Math.atan2(p,u),this._z=0);break;case"YXZ":this._x=Math.asin(-Tt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,_),this._z=Math.atan2(c,u)):(this._y=Math.atan2(-f,a),this._z=0);break;case"ZXY":this._x=Math.asin(Tt(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-f,_),this._z=Math.atan2(-s,u)):(this._y=0,this._z=Math.atan2(c,a));break;case"ZYX":this._y=Math.asin(-Tt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(p,_),this._z=Math.atan2(c,a)):(this._x=0,this._z=Math.atan2(-s,u));break;case"YZX":this._z=Math.asin(Tt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,u),this._y=Math.atan2(-f,a)):(this._x=0,this._y=Math.atan2(o,_));break;case"XZY":this._z=Math.asin(-Tt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(p,u),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-d,_),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ur.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ur,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ir.setFromEuler(this),this.setFromQuaternion(Ir,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ot.DEFAULT_ORDER="XYZ";class qi{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let $a=0;const Fr=new O,Pn=new St,Zt=new it,_i=new O,Zn=new O,Za=new O,ja=new St,Nr=new O(1,0,0),Br=new O(0,1,0),Or=new O(0,0,1),zr={type:"added"},Ka={type:"removed"},Dn={type:"childadded",child:null},Yi={type:"childremoved",child:null};class Ct extends yn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:$a++}),this.uuid=kn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ct.DEFAULT_UP.clone();const e=new O,t=new Ot,n=new St,r=new O(1,1,1);function a(){n.setFromEuler(t,!1)}function s(){t.setFromQuaternion(n,void 0,!1)}t._onChange(a),n._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new it},normalMatrix:{value:new Ve}}),this.matrix=new it,this.matrixWorld=new it,this.matrixAutoUpdate=Ct.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ct.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new qi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Pn.setFromAxisAngle(e,t),this.quaternion.multiply(Pn),this}rotateOnWorldAxis(e,t){return Pn.setFromAxisAngle(e,t),this.quaternion.premultiply(Pn),this}rotateX(e){return this.rotateOnAxis(Nr,e)}rotateY(e){return this.rotateOnAxis(Br,e)}rotateZ(e){return this.rotateOnAxis(Or,e)}translateOnAxis(e,t){return Fr.copy(e).applyQuaternion(this.quaternion),this.position.add(Fr.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Nr,e)}translateY(e){return this.translateOnAxis(Br,e)}translateZ(e){return this.translateOnAxis(Or,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Zt.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?_i.copy(e):_i.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),Zn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zt.lookAt(Zn,_i,this.up):Zt.lookAt(_i,Zn,this.up),this.quaternion.setFromRotationMatrix(Zt),r&&(Zt.extractRotation(r.matrixWorld),Pn.setFromRotationMatrix(Zt),this.quaternion.premultiply(Pn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(zr),Dn.child=e,this.dispatchEvent(Dn),Dn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Ka),Yi.child=e,this.dispatchEvent(Yi),Yi.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Zt.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Zt.multiply(e.parent.matrixWorld)),e.applyMatrix4(Zt),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(zr),Dn.child=e,this.dispatchEvent(Dn),Dn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const s=this.children[n].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let a=0,s=r.length;a<s;a++)r[a].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Zn,e,Za),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Zn,ja,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let a=0,s=r.length;a<s;a++)r[a].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function a(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let u=0,d=c.length;u<d;u++){const f=c[u];a(e.shapes,f)}else a(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,u=this.material.length;c<u;c++)o.push(a(e.materials,this.material[c]));r.material=o}else r.material=a(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];r.animations.push(a(e.animations,c))}}if(t){const o=s(e.geometries),c=s(e.materials),u=s(e.textures),d=s(e.images),f=s(e.shapes),p=s(e.skeletons),_=s(e.animations),v=s(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),u.length>0&&(n.textures=u),d.length>0&&(n.images=d),f.length>0&&(n.shapes=f),p.length>0&&(n.skeletons=p),_.length>0&&(n.animations=_),v.length>0&&(n.nodes=v)}return n.object=r,n;function s(o){const c=[];for(const u in o){const d=o[u];delete d.metadata,c.push(d)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}}Ct.DEFAULT_UP=new O(0,1,0),Ct.DEFAULT_MATRIX_AUTO_UPDATE=!0,Ct.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const zt=new O,jt=new O,$i=new O,Kt=new O,Ln=new O,Un=new O,Gr=new O,Zi=new O,ji=new O,Ki=new O,Ji=new lt,Qi=new lt,er=new lt;class Gt{constructor(e=new O,t=new O,n=new O){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),zt.subVectors(e,t),r.cross(zt);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(e,t,n,r,a){zt.subVectors(r,t),jt.subVectors(n,t),$i.subVectors(e,t);const s=zt.dot(zt),o=zt.dot(jt),c=zt.dot($i),u=jt.dot(jt),d=jt.dot($i),f=s*u-o*o;if(f===0)return a.set(0,0,0),null;const p=1/f,_=(u*c-o*d)*p,v=(s*d-o*c)*p;return a.set(1-_-v,v,_)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Kt)===null?!1:Kt.x>=0&&Kt.y>=0&&Kt.x+Kt.y<=1}static getInterpolation(e,t,n,r,a,s,o,c){return this.getBarycoord(e,t,n,r,Kt)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(a,Kt.x),c.addScaledVector(s,Kt.y),c.addScaledVector(o,Kt.z),c)}static getInterpolatedAttribute(e,t,n,r,a,s){return Ji.setScalar(0),Qi.setScalar(0),er.setScalar(0),Ji.fromBufferAttribute(e,t),Qi.fromBufferAttribute(e,n),er.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(Ji,a.x),s.addScaledVector(Qi,a.y),s.addScaledVector(er,a.z),s}static isFrontFacing(e,t,n,r){return zt.subVectors(n,t),jt.subVectors(e,t),zt.cross(jt).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return zt.subVectors(this.c,this.b),jt.subVectors(this.a,this.b),zt.cross(jt).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Gt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Gt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,a){return Gt.getInterpolation(e,this.a,this.b,this.c,t,n,r,a)}containsPoint(e){return Gt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Gt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,a=this.c;let s,o;Ln.subVectors(r,n),Un.subVectors(a,n),Zi.subVectors(e,n);const c=Ln.dot(Zi),u=Un.dot(Zi);if(c<=0&&u<=0)return t.copy(n);ji.subVectors(e,r);const d=Ln.dot(ji),f=Un.dot(ji);if(d>=0&&f<=d)return t.copy(r);const p=c*f-d*u;if(p<=0&&c>=0&&d<=0)return s=c/(c-d),t.copy(n).addScaledVector(Ln,s);Ki.subVectors(e,a);const _=Ln.dot(Ki),v=Un.dot(Ki);if(v>=0&&_<=v)return t.copy(a);const M=_*u-c*v;if(M<=0&&u>=0&&v<=0)return o=u/(u-v),t.copy(n).addScaledVector(Un,o);const m=d*v-_*f;if(m<=0&&f-d>=0&&_-v>=0)return Gr.subVectors(a,r),o=(f-d)/(f-d+(_-v)),t.copy(r).addScaledVector(Gr,o);const h=1/(m+M+p);return s=M*h,o=p*h,t.copy(n).addScaledVector(Ln,s).addScaledVector(Un,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Hr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},on={h:0,s:0,l:0},gi={h:0,s:0,l:0};function tr(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Qe{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Lt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,$e.toWorkingColorSpace(this,t),this}setRGB(e,t,n,r=$e.workingColorSpace){return this.r=e,this.g=t,this.b=n,$e.toWorkingColorSpace(this,r),this}setHSL(e,t,n,r=$e.workingColorSpace){if(e=Fa(e,1),t=Tt(t,0,1),n=Tt(n,0,1),t===0)this.r=this.g=this.b=n;else{const a=n<=.5?n*(1+t):n+t-n*t,s=2*n-a;this.r=tr(s,a,e+1/3),this.g=tr(s,a,e),this.b=tr(s,a,e-1/3)}return $e.toWorkingColorSpace(this,r),this}setStyle(e,t=Lt){function n(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let a;const s=r[1],o=r[2];switch(s){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const a=r[1],s=a.length;if(s===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(a,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Lt){const n=Hr[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=qt(e.r),this.g=qt(e.g),this.b=qt(e.b),this}copyLinearToSRGB(e){return this.r=Tn(e.r),this.g=Tn(e.g),this.b=Tn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Lt){return $e.fromWorkingColorSpace(xt.copy(this),e),Math.round(Tt(xt.r*255,0,255))*65536+Math.round(Tt(xt.g*255,0,255))*256+Math.round(Tt(xt.b*255,0,255))}getHexString(e=Lt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=$e.workingColorSpace){$e.fromWorkingColorSpace(xt.copy(this),t);const n=xt.r,r=xt.g,a=xt.b,s=Math.max(n,r,a),o=Math.min(n,r,a);let c,u;const d=(o+s)/2;if(o===s)c=0,u=0;else{const f=s-o;switch(u=d<=.5?f/(s+o):f/(2-s-o),s){case n:c=(r-a)/f+(r<a?6:0);break;case r:c=(a-n)/f+2;break;case a:c=(n-r)/f+4;break}c/=6}return e.h=c,e.s=u,e.l=d,e}getRGB(e,t=$e.workingColorSpace){return $e.fromWorkingColorSpace(xt.copy(this),t),e.r=xt.r,e.g=xt.g,e.b=xt.b,e}getStyle(e=Lt){$e.fromWorkingColorSpace(xt.copy(this),e);const t=xt.r,n=xt.g,r=xt.b;return e!==Lt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(on),this.setHSL(on.h+e,on.s+t,on.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(on),e.getHSL(gi);const n=Ni(on.h,gi.h,t),r=Ni(on.s,gi.s,t),a=Ni(on.l,gi.l,t);return this.setHSL(n,r,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,a=e.elements;return this.r=a[0]*t+a[3]*n+a[6]*r,this.g=a[1]*t+a[4]*n+a[7]*r,this.b=a[2]*t+a[5]*n+a[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const xt=new Qe;Qe.NAMES=Hr;let Ja=0;class vi extends yn{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ja++}),this.uuid=kn(),this.name="",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Qe(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==204&&(n.blendSrc=this.blendSrc),this.blendDst!==205&&(n.blendDst=this.blendDst),this.blendEquation!==100&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==7680&&(n.stencilFail=this.stencilFail),this.stencilZFail!==7680&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==7680&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(a){const s=[];for(const o in a){const c=a[o];delete c.metadata,s.push(c)}return s}if(t){const a=r(e.textures),s=r(e.images);a.length>0&&(n.textures=a),s.length>0&&(n.images=s)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let a=0;a!==r;++a)n[a]=t[a].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class Vr extends vi{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new Qe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ot,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ut=new O,xi=new nt;class ht{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)xi.fromBufferAttribute(this,t),xi.applyMatrix3(e),this.setXY(t,xi.x,xi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ut.fromBufferAttribute(this,t),ut.applyMatrix3(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ut.fromBufferAttribute(this,t),ut.applyMatrix4(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ut.fromBufferAttribute(this,t),ut.applyNormalMatrix(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ut.fromBufferAttribute(this,t),ut.transformDirection(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Wn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=At(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Wn(t,this.array)),t}setX(e,t){return this.normalized&&(t=At(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Wn(t,this.array)),t}setY(e,t){return this.normalized&&(t=At(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Wn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=At(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Wn(t,this.array)),t}setW(e,t){return this.normalized&&(t=At(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=At(t,this.array),n=At(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=At(t,this.array),n=At(n,this.array),r=At(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,a){return e*=this.itemSize,this.normalized&&(t=At(t,this.array),n=At(n,this.array),r=At(r,this.array),a=At(a,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),e}}class kr extends ht{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Wr extends ht{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class fn extends ht{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Qa=0;const Ut=new it,nr=new Ct,In=new O,Pt=new qn,jn=new qn,mt=new O;class Vt extends yn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Qa++}),this.uuid=kn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Er(e)?Wr:kr)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const a=new Ve().getNormalMatrix(e);n.applyNormalMatrix(a),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Ut.makeRotationFromQuaternion(e),this.applyMatrix4(Ut),this}rotateX(e){return Ut.makeRotationX(e),this.applyMatrix4(Ut),this}rotateY(e){return Ut.makeRotationY(e),this.applyMatrix4(Ut),this}rotateZ(e){return Ut.makeRotationZ(e),this.applyMatrix4(Ut),this}translate(e,t,n){return Ut.makeTranslation(e,t,n),this.applyMatrix4(Ut),this}scale(e,t,n){return Ut.makeScale(e,t,n),this.applyMatrix4(Ut),this}lookAt(e){return nr.lookAt(e),nr.updateMatrix(),this.applyMatrix4(nr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(In).negate(),this.translate(In.x,In.y,In.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,a=e.length;r<a;r++){const s=e[r];n.push(s.x,s.y,s.z||0)}this.setAttribute("position",new fn(n,3))}else{for(let n=0,r=t.count;n<r;n++){const a=e[n];t.setXYZ(n,a.x,a.y,a.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new qn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const a=t[n];Pt.setFromBufferAttribute(a),this.morphTargetsRelative?(mt.addVectors(this.boundingBox.min,Pt.min),this.boundingBox.expandByPoint(mt),mt.addVectors(this.boundingBox.max,Pt.max),this.boundingBox.expandByPoint(mt)):(this.boundingBox.expandByPoint(Pt.min),this.boundingBox.expandByPoint(Pt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Vi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){const n=this.boundingSphere.center;if(Pt.setFromBufferAttribute(e),t)for(let a=0,s=t.length;a<s;a++){const o=t[a];jn.setFromBufferAttribute(o),this.morphTargetsRelative?(mt.addVectors(Pt.min,jn.min),Pt.expandByPoint(mt),mt.addVectors(Pt.max,jn.max),Pt.expandByPoint(mt)):(Pt.expandByPoint(jn.min),Pt.expandByPoint(jn.max))}Pt.getCenter(n);let r=0;for(let a=0,s=e.count;a<s;a++)mt.fromBufferAttribute(e,a),r=Math.max(r,n.distanceToSquared(mt));if(t)for(let a=0,s=t.length;a<s;a++){const o=t[a],c=this.morphTargetsRelative;for(let u=0,d=o.count;u<d;u++)mt.fromBufferAttribute(o,u),c&&(In.fromBufferAttribute(e,u),mt.add(In)),r=Math.max(r,n.distanceToSquared(mt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,r=t.normal,a=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ht(new Float32Array(4*n.count),4));const s=this.getAttribute("tangent"),o=[],c=[];for(let B=0;B<n.count;B++)o[B]=new O,c[B]=new O;const u=new O,d=new O,f=new O,p=new nt,_=new nt,v=new nt,M=new O,m=new O;function h(B,y,x){u.fromBufferAttribute(n,B),d.fromBufferAttribute(n,y),f.fromBufferAttribute(n,x),p.fromBufferAttribute(a,B),_.fromBufferAttribute(a,y),v.fromBufferAttribute(a,x),d.sub(u),f.sub(u),_.sub(p),v.sub(p);const D=1/(_.x*v.y-v.x*_.y);isFinite(D)&&(M.copy(d).multiplyScalar(v.y).addScaledVector(f,-_.y).multiplyScalar(D),m.copy(f).multiplyScalar(_.x).addScaledVector(d,-v.x).multiplyScalar(D),o[B].add(M),o[y].add(M),o[x].add(M),c[B].add(m),c[y].add(m),c[x].add(m))}let R=this.groups;R.length===0&&(R=[{start:0,count:e.count}]);for(let B=0,y=R.length;B<y;++B){const x=R[B],D=x.start,j=x.count;for(let W=D,Y=D+j;W<Y;W+=3)h(e.getX(W+0),e.getX(W+1),e.getX(W+2))}const A=new O,T=new O,G=new O,U=new O;function L(B){G.fromBufferAttribute(r,B),U.copy(G);const y=o[B];A.copy(y),A.sub(G.multiplyScalar(G.dot(y))).normalize(),T.crossVectors(U,y);const D=T.dot(c[B])<0?-1:1;s.setXYZW(B,A.x,A.y,A.z,D)}for(let B=0,y=R.length;B<y;++B){const x=R[B],D=x.start,j=x.count;for(let W=D,Y=D+j;W<Y;W+=3)L(e.getX(W+0)),L(e.getX(W+1)),L(e.getX(W+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new ht(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let p=0,_=n.count;p<_;p++)n.setXYZ(p,0,0,0);const r=new O,a=new O,s=new O,o=new O,c=new O,u=new O,d=new O,f=new O;if(e)for(let p=0,_=e.count;p<_;p+=3){const v=e.getX(p+0),M=e.getX(p+1),m=e.getX(p+2);r.fromBufferAttribute(t,v),a.fromBufferAttribute(t,M),s.fromBufferAttribute(t,m),d.subVectors(s,a),f.subVectors(r,a),d.cross(f),o.fromBufferAttribute(n,v),c.fromBufferAttribute(n,M),u.fromBufferAttribute(n,m),o.add(d),c.add(d),u.add(d),n.setXYZ(v,o.x,o.y,o.z),n.setXYZ(M,c.x,c.y,c.z),n.setXYZ(m,u.x,u.y,u.z)}else for(let p=0,_=t.count;p<_;p+=3)r.fromBufferAttribute(t,p+0),a.fromBufferAttribute(t,p+1),s.fromBufferAttribute(t,p+2),d.subVectors(s,a),f.subVectors(r,a),d.cross(f),n.setXYZ(p+0,d.x,d.y,d.z),n.setXYZ(p+1,d.x,d.y,d.z),n.setXYZ(p+2,d.x,d.y,d.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)mt.fromBufferAttribute(e,t),mt.normalize(),e.setXYZ(t,mt.x,mt.y,mt.z)}toNonIndexed(){function e(o,c){const u=o.array,d=o.itemSize,f=o.normalized,p=new u.constructor(c.length*d);let _=0,v=0;for(let M=0,m=c.length;M<m;M++){o.isInterleavedBufferAttribute?_=c[M]*o.data.stride+o.offset:_=c[M]*d;for(let h=0;h<d;h++)p[v++]=u[_++]}return new ht(p,d,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Vt,n=this.index.array,r=this.attributes;for(const o in r){const c=r[o],u=e(c,n);t.setAttribute(o,u)}const a=this.morphAttributes;for(const o in a){const c=[],u=a[o];for(let d=0,f=u.length;d<f;d++){const p=u[d],_=e(p,n);c.push(_)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,c=s.length;o<c;o++){const u=s[o];t.addGroup(u.start,u.count,u.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const u in c)c[u]!==void 0&&(e[u]=c[u]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const u=n[c];e.data.attributes[c]=u.toJSON(e.data)}const r={};let a=!1;for(const c in this.morphAttributes){const u=this.morphAttributes[c],d=[];for(let f=0,p=u.length;f<p;f++){const _=u[f];d.push(_.toJSON(e.data))}d.length>0&&(r[c]=d,a=!0)}a&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const r=e.attributes;for(const u in r){const d=r[u];this.setAttribute(u,d.clone(t))}const a=e.morphAttributes;for(const u in a){const d=[],f=a[u];for(let p=0,_=f.length;p<_;p++)d.push(f[p].clone(t));this.morphAttributes[u]=d}this.morphTargetsRelative=e.morphTargetsRelative;const s=e.groups;for(let u=0,d=s.length;u<d;u++){const f=s[u];this.addGroup(f.start,f.count,f.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Xr=new it,pn=new Lr,Mi=new Vi,qr=new O,Si=new O,Ei=new O,yi=new O,ir=new O,Ti=new O,Yr=new O,Ai=new O;class bt extends Ct{constructor(e=new Vt,t=new Vr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=r.length;a<s;a++){const o=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,a=n.morphAttributes.position,s=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(a&&o){Ti.set(0,0,0);for(let c=0,u=a.length;c<u;c++){const d=o[c],f=a[c];d!==0&&(ir.fromBufferAttribute(f,e),s?Ti.addScaledVector(ir,d):Ti.addScaledVector(ir.sub(t),d))}t.add(Ti)}return t}raycast(e,t){const n=this.geometry,r=this.material,a=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Mi.copy(n.boundingSphere),Mi.applyMatrix4(a),pn.copy(e.ray).recast(e.near),!(Mi.containsPoint(pn.origin)===!1&&(pn.intersectSphere(Mi,qr)===null||pn.origin.distanceToSquared(qr)>(e.far-e.near)**2))&&(Xr.copy(a).invert(),pn.copy(e.ray).applyMatrix4(Xr),!(n.boundingBox!==null&&pn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,pn)))}_computeIntersections(e,t,n){let r;const a=this.geometry,s=this.material,o=a.index,c=a.attributes.position,u=a.attributes.uv,d=a.attributes.uv1,f=a.attributes.normal,p=a.groups,_=a.drawRange;if(o!==null)if(Array.isArray(s))for(let v=0,M=p.length;v<M;v++){const m=p[v],h=s[m.materialIndex],R=Math.max(m.start,_.start),A=Math.min(o.count,Math.min(m.start+m.count,_.start+_.count));for(let T=R,G=A;T<G;T+=3){const U=o.getX(T),L=o.getX(T+1),B=o.getX(T+2);r=bi(this,h,e,n,u,d,f,U,L,B),r&&(r.faceIndex=Math.floor(T/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const v=Math.max(0,_.start),M=Math.min(o.count,_.start+_.count);for(let m=v,h=M;m<h;m+=3){const R=o.getX(m),A=o.getX(m+1),T=o.getX(m+2);r=bi(this,s,e,n,u,d,f,R,A,T),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(s))for(let v=0,M=p.length;v<M;v++){const m=p[v],h=s[m.materialIndex],R=Math.max(m.start,_.start),A=Math.min(c.count,Math.min(m.start+m.count,_.start+_.count));for(let T=R,G=A;T<G;T+=3){const U=T,L=T+1,B=T+2;r=bi(this,h,e,n,u,d,f,U,L,B),r&&(r.faceIndex=Math.floor(T/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const v=Math.max(0,_.start),M=Math.min(c.count,_.start+_.count);for(let m=v,h=M;m<h;m+=3){const R=m,A=m+1,T=m+2;r=bi(this,s,e,n,u,d,f,R,A,T),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function es(i,e,t,n,r,a,s,o){let c;if(e.side===1?c=n.intersectTriangle(s,a,r,!0,o):c=n.intersectTriangle(r,a,s,e.side===0,o),c===null)return null;Ai.copy(o),Ai.applyMatrix4(i.matrixWorld);const u=t.ray.origin.distanceTo(Ai);return u<t.near||u>t.far?null:{distance:u,point:Ai.clone(),object:i}}function bi(i,e,t,n,r,a,s,o,c,u){i.getVertexPosition(o,Si),i.getVertexPosition(c,Ei),i.getVertexPosition(u,yi);const d=es(i,e,t,n,Si,Ei,yi,Yr);if(d){const f=new O;Gt.getBarycoord(Yr,Si,Ei,yi,f),r&&(d.uv=Gt.getInterpolatedAttribute(r,o,c,u,f,new nt)),a&&(d.uv1=Gt.getInterpolatedAttribute(a,o,c,u,f,new nt)),s&&(d.normal=Gt.getInterpolatedAttribute(s,o,c,u,f,new O),d.normal.dot(n.direction)>0&&d.normal.multiplyScalar(-1));const p={a:o,b:c,c:u,normal:new O,materialIndex:0};Gt.getNormal(Si,Ei,yi,p.normal),d.face=p,d.barycoord=f}return d}class Kn extends Vt{constructor(e=1,t=1,n=1,r=1,a=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:a,depthSegments:s};const o=this;r=Math.floor(r),a=Math.floor(a),s=Math.floor(s);const c=[],u=[],d=[],f=[];let p=0,_=0;v("z","y","x",-1,-1,n,t,e,s,a,0),v("z","y","x",1,-1,n,t,-e,s,a,1),v("x","z","y",1,1,e,n,t,r,s,2),v("x","z","y",1,-1,e,n,-t,r,s,3),v("x","y","z",1,-1,e,t,n,r,a,4),v("x","y","z",-1,-1,e,t,-n,r,a,5),this.setIndex(c),this.setAttribute("position",new fn(u,3)),this.setAttribute("normal",new fn(d,3)),this.setAttribute("uv",new fn(f,2));function v(M,m,h,R,A,T,G,U,L,B,y){const x=T/L,D=G/B,j=T/2,W=G/2,Y=U/2,re=L+1,$=B+1;let se=0,X=0;const ee=new O;for(let Q=0;Q<$;Q++){const ue=Q*D-W;for(let ve=0;ve<re;ve++){const Fe=ve*x-j;ee[M]=Fe*R,ee[m]=ue*A,ee[h]=Y,u.push(ee.x,ee.y,ee.z),ee[M]=0,ee[m]=0,ee[h]=U>0?1:-1,d.push(ee.x,ee.y,ee.z),f.push(ve/L),f.push(1-Q/B),se+=1}}for(let Q=0;Q<B;Q++)for(let ue=0;ue<L;ue++){const ve=p+ue+re*Q,Fe=p+ue+re*(Q+1),q=p+(ue+1)+re*(Q+1),ie=p+(ue+1)+re*Q;c.push(ve,Fe,ie),c.push(Fe,q,ie),X+=6}o.addGroup(_,X,y),_+=X,p+=se}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Kn(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Fn(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone():Array.isArray(r)?e[t][n]=r.slice():e[t][n]=r}}return e}function Et(i){const e={};for(let t=0;t<i.length;t++){const n=Fn(i[t]);for(const r in n)e[r]=n[r]}return e}function ts(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function $r(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:$e.workingColorSpace}const ns={clone:Fn,merge:Et};var is=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,rs=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Mt extends vi{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=is,this.fragmentShader=rs,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Fn(e.uniforms),this.uniformsGroups=ts(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class Zr extends Ct{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new it,this.projectionMatrix=new it,this.projectionMatrixInverse=new it,this.coordinateSystem=2e3}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ln=new O,jr=new nt,Kr=new nt;class yt extends Zr{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Fi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Ii*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Fi*2*Math.atan(Math.tan(Ii*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ln.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ln.x,ln.y).multiplyScalar(-e/ln.z),ln.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ln.x,ln.y).multiplyScalar(-e/ln.z)}getViewSize(e,t){return this.getViewBounds(e,jr,Kr),t.subVectors(Kr,jr)}setViewOffset(e,t,n,r,a,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Ii*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,a=-.5*r;const s=this.view;if(this.view!==null&&this.view.enabled){const c=s.fullWidth,u=s.fullHeight;a+=s.offsetX*r/c,t-=s.offsetY*n/u,r*=s.width/c,n*=s.height/u}const o=this.filmOffset;o!==0&&(a+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Nn=-90,Bn=1;class as extends Ct{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new yt(Nn,Bn,e,t);r.layers=this.layers,this.add(r);const a=new yt(Nn,Bn,e,t);a.layers=this.layers,this.add(a);const s=new yt(Nn,Bn,e,t);s.layers=this.layers,this.add(s);const o=new yt(Nn,Bn,e,t);o.layers=this.layers,this.add(o);const c=new yt(Nn,Bn,e,t);c.layers=this.layers,this.add(c);const u=new yt(Nn,Bn,e,t);u.layers=this.layers,this.add(u)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,a,s,o,c]=t;for(const u of t)this.remove(u);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const u of t)this.add(u),u.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[a,s,o,c,u,d]=this.children,f=e.getRenderTarget(),p=e.getActiveCubeFace(),_=e.getActiveMipmapLevel(),v=e.xr.enabled;e.xr.enabled=!1;const M=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,r),e.render(t,a),e.setRenderTarget(n,1,r),e.render(t,s),e.setRenderTarget(n,2,r),e.render(t,o),e.setRenderTarget(n,3,r),e.render(t,c),e.setRenderTarget(n,4,r),e.render(t,u),n.texture.generateMipmaps=M,e.setRenderTarget(n,5,r),e.render(t,d),e.setRenderTarget(f,p,_),e.xr.enabled=v,n.texture.needsPMREMUpdate=!0}}class Jr extends _t{constructor(e,t,n,r,a,s,o,c,u,d){e=e!==void 0?e:[],t=t!==void 0?t:301,super(e,t,n,r,a,s,o,c,u,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class ss extends Ft{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Jr(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:1006}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Kn(5,5,5),a=new Mt({name:"CubemapFromEquirect",uniforms:Fn(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});a.uniforms.tEquirect.value=t;const s=new bt(r,a),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=1006),new as(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t,n,r){const a=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,n,r);e.setRenderTarget(a)}}const rr=new O,os=new O,ls=new Ve;class mn{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=rr.subVectors(n,t).cross(os.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(rr),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return a<0||a>1?null:t.copy(e.start).addScaledVector(n,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||ls.getNormalMatrix(e),r=this.coplanarPoint(rr).applyMatrix4(e),a=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const _n=new Vi,wi=new O;class Qr{constructor(e=new mn,t=new mn,n=new mn,r=new mn,a=new mn,s=new mn){this.planes=[e,t,n,r,a,s]}set(e,t,n,r,a,s){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(a),o[5].copy(s),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2e3){const n=this.planes,r=e.elements,a=r[0],s=r[1],o=r[2],c=r[3],u=r[4],d=r[5],f=r[6],p=r[7],_=r[8],v=r[9],M=r[10],m=r[11],h=r[12],R=r[13],A=r[14],T=r[15];if(n[0].setComponents(c-a,p-u,m-_,T-h).normalize(),n[1].setComponents(c+a,p+u,m+_,T+h).normalize(),n[2].setComponents(c+s,p+d,m+v,T+R).normalize(),n[3].setComponents(c-s,p-d,m-v,T-R).normalize(),n[4].setComponents(c-o,p-f,m-M,T-A).normalize(),t===2e3)n[5].setComponents(c+o,p+f,m+M,T+A).normalize();else if(t===2001)n[5].setComponents(o,f,M,A).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),_n.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),_n.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(_n)}intersectsSprite(e){return _n.center.set(0,0,0),_n.radius=.7071067811865476,_n.applyMatrix4(e.matrixWorld),this.intersectsSphere(_n)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(wi.x=r.normal.x>0?e.max.x:e.min.x,wi.y=r.normal.y>0?e.max.y:e.min.y,wi.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(wi)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function ea(){let i=null,e=!1,t=null,n=null;function r(a,s){t(a,s),n=i.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(a){t=a},setContext:function(a){i=a}}}function cs(i){const e=new WeakMap;function t(o,c){const u=o.array,d=o.usage,f=u.byteLength,p=i.createBuffer();i.bindBuffer(c,p),i.bufferData(c,u,d),o.onUploadCallback();let _;if(u instanceof Float32Array)_=i.FLOAT;else if(u instanceof Uint16Array)o.isFloat16BufferAttribute?_=i.HALF_FLOAT:_=i.UNSIGNED_SHORT;else if(u instanceof Int16Array)_=i.SHORT;else if(u instanceof Uint32Array)_=i.UNSIGNED_INT;else if(u instanceof Int32Array)_=i.INT;else if(u instanceof Int8Array)_=i.BYTE;else if(u instanceof Uint8Array)_=i.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)_=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:p,type:_,bytesPerElement:u.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,c,u){const d=c.array,f=c.updateRanges;if(i.bindBuffer(u,o),f.length===0)i.bufferSubData(u,0,d);else{f.sort((_,v)=>_.start-v.start);let p=0;for(let _=1;_<f.length;_++){const v=f[p],M=f[_];M.start<=v.start+v.count+1?v.count=Math.max(v.count,M.start+M.count-v.start):(++p,f[p]=M)}f.length=p+1;for(let _=0,v=f.length;_<v;_++){const M=f[_];i.bufferSubData(u,M.start*d.BYTES_PER_ELEMENT,d,M.start,M.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function s(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const d=e.get(o);(!d||d.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const u=e.get(o);if(u===void 0)e.set(o,t(o,c));else if(u.version<o.version){if(u.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(u.buffer,o,c),u.version=o.version}}return{get:r,remove:a,update:s}}class On extends Vt{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const a=e/2,s=t/2,o=Math.floor(n),c=Math.floor(r),u=o+1,d=c+1,f=e/o,p=t/c,_=[],v=[],M=[],m=[];for(let h=0;h<d;h++){const R=h*p-s;for(let A=0;A<u;A++){const T=A*f-a;v.push(T,-R,0),M.push(0,0,1),m.push(A/o),m.push(1-h/c)}}for(let h=0;h<c;h++)for(let R=0;R<o;R++){const A=R+u*h,T=R+u*(h+1),G=R+1+u*(h+1),U=R+1+u*h;_.push(A,T,U),_.push(T,G,U)}this.setIndex(_),this.setAttribute("position",new fn(v,3)),this.setAttribute("normal",new fn(M,3)),this.setAttribute("uv",new fn(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new On(e.width,e.height,e.widthSegments,e.heightSegments)}}var us=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,hs=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,ds=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,fs=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ps=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ms=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,_s=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,gs=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,vs=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,xs=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ms=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ss=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Es=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,ys=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ts=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,As=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,bs=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ws=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Rs=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Cs=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ps=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ds=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Ls=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Us=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Is=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Fs=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Ns=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Bs=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Os=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,zs=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Gs="gl_FragColor = linearToOutputTexel( gl_FragColor );",Hs=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Vs=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,ks=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ws=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Xs=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,qs=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ys=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,$s=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Zs=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,js=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ks=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Js=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Qs=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,eo=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,to=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,no=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,io=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ro=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ao=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,so=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,oo=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lo=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,co=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,uo=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,ho=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,fo=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,po=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,mo=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_o=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,go=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,vo=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,xo=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Mo=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,So=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Eo=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,yo=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,To=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ao=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,bo=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,wo=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ro=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Co=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Po=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Do=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Lo=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Uo=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Io=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Fo=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,No=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Bo=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Oo=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,zo=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Go=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ho=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Vo=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,ko=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Wo=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Xo=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,qo=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Yo=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,$o=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Zo=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,jo=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ko=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Jo=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Qo=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,el=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,tl=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,nl=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,il=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,rl=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,al=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,sl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ol=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ll=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,cl=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const We={alphahash_fragment:us,alphahash_pars_fragment:hs,alphamap_fragment:ds,alphamap_pars_fragment:fs,alphatest_fragment:ps,alphatest_pars_fragment:ms,aomap_fragment:_s,aomap_pars_fragment:gs,batching_pars_vertex:vs,batching_vertex:xs,begin_vertex:Ms,beginnormal_vertex:Ss,bsdfs:Es,iridescence_fragment:ys,bumpmap_pars_fragment:Ts,clipping_planes_fragment:As,clipping_planes_pars_fragment:bs,clipping_planes_pars_vertex:ws,clipping_planes_vertex:Rs,color_fragment:Cs,color_pars_fragment:Ps,color_pars_vertex:Ds,color_vertex:Ls,common:Us,cube_uv_reflection_fragment:Is,defaultnormal_vertex:Fs,displacementmap_pars_vertex:Ns,displacementmap_vertex:Bs,emissivemap_fragment:Os,emissivemap_pars_fragment:zs,colorspace_fragment:Gs,colorspace_pars_fragment:Hs,envmap_fragment:Vs,envmap_common_pars_fragment:ks,envmap_pars_fragment:Ws,envmap_pars_vertex:Xs,envmap_physical_pars_fragment:no,envmap_vertex:qs,fog_vertex:Ys,fog_pars_vertex:$s,fog_fragment:Zs,fog_pars_fragment:js,gradientmap_pars_fragment:Ks,lightmap_pars_fragment:Js,lights_lambert_fragment:Qs,lights_lambert_pars_fragment:eo,lights_pars_begin:to,lights_toon_fragment:io,lights_toon_pars_fragment:ro,lights_phong_fragment:ao,lights_phong_pars_fragment:so,lights_physical_fragment:oo,lights_physical_pars_fragment:lo,lights_fragment_begin:co,lights_fragment_maps:uo,lights_fragment_end:ho,logdepthbuf_fragment:fo,logdepthbuf_pars_fragment:po,logdepthbuf_pars_vertex:mo,logdepthbuf_vertex:_o,map_fragment:go,map_pars_fragment:vo,map_particle_fragment:xo,map_particle_pars_fragment:Mo,metalnessmap_fragment:So,metalnessmap_pars_fragment:Eo,morphinstance_vertex:yo,morphcolor_vertex:To,morphnormal_vertex:Ao,morphtarget_pars_vertex:bo,morphtarget_vertex:wo,normal_fragment_begin:Ro,normal_fragment_maps:Co,normal_pars_fragment:Po,normal_pars_vertex:Do,normal_vertex:Lo,normalmap_pars_fragment:Uo,clearcoat_normal_fragment_begin:Io,clearcoat_normal_fragment_maps:Fo,clearcoat_pars_fragment:No,iridescence_pars_fragment:Bo,opaque_fragment:Oo,packing:zo,premultiplied_alpha_fragment:Go,project_vertex:Ho,dithering_fragment:Vo,dithering_pars_fragment:ko,roughnessmap_fragment:Wo,roughnessmap_pars_fragment:Xo,shadowmap_pars_fragment:qo,shadowmap_pars_vertex:Yo,shadowmap_vertex:$o,shadowmask_pars_fragment:Zo,skinbase_vertex:jo,skinning_pars_vertex:Ko,skinning_vertex:Jo,skinnormal_vertex:Qo,specularmap_fragment:el,specularmap_pars_fragment:tl,tonemapping_fragment:nl,tonemapping_pars_fragment:il,transmission_fragment:rl,transmission_pars_fragment:al,uv_pars_fragment:sl,uv_pars_vertex:ol,uv_vertex:ll,worldpos_vertex:cl,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distanceRGBA_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distanceRGBA_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},xe={common:{diffuse:{value:new Qe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ve},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ve}},envmap:{envMap:{value:null},envMapRotation:{value:new Ve},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ve}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ve}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ve},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ve},normalScale:{value:new nt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ve},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ve}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ve}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ve}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Qe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Qe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0},uvTransform:{value:new Ve}},sprite:{diffuse:{value:new Qe(16777215)},opacity:{value:1},center:{value:new nt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ve},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0}}},kt={basic:{uniforms:Et([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.fog]),vertexShader:We.meshbasic_vert,fragmentShader:We.meshbasic_frag},lambert:{uniforms:Et([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,xe.lights,{emissive:{value:new Qe(0)}}]),vertexShader:We.meshlambert_vert,fragmentShader:We.meshlambert_frag},phong:{uniforms:Et([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,xe.lights,{emissive:{value:new Qe(0)},specular:{value:new Qe(1118481)},shininess:{value:30}}]),vertexShader:We.meshphong_vert,fragmentShader:We.meshphong_frag},standard:{uniforms:Et([xe.common,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.roughnessmap,xe.metalnessmap,xe.fog,xe.lights,{emissive:{value:new Qe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag},toon:{uniforms:Et([xe.common,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.gradientmap,xe.fog,xe.lights,{emissive:{value:new Qe(0)}}]),vertexShader:We.meshtoon_vert,fragmentShader:We.meshtoon_frag},matcap:{uniforms:Et([xe.common,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,{matcap:{value:null}}]),vertexShader:We.meshmatcap_vert,fragmentShader:We.meshmatcap_frag},points:{uniforms:Et([xe.points,xe.fog]),vertexShader:We.points_vert,fragmentShader:We.points_frag},dashed:{uniforms:Et([xe.common,xe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:We.linedashed_vert,fragmentShader:We.linedashed_frag},depth:{uniforms:Et([xe.common,xe.displacementmap]),vertexShader:We.depth_vert,fragmentShader:We.depth_frag},normal:{uniforms:Et([xe.common,xe.bumpmap,xe.normalmap,xe.displacementmap,{opacity:{value:1}}]),vertexShader:We.meshnormal_vert,fragmentShader:We.meshnormal_frag},sprite:{uniforms:Et([xe.sprite,xe.fog]),vertexShader:We.sprite_vert,fragmentShader:We.sprite_frag},background:{uniforms:{uvTransform:{value:new Ve},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:We.background_vert,fragmentShader:We.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ve}},vertexShader:We.backgroundCube_vert,fragmentShader:We.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:We.cube_vert,fragmentShader:We.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:We.equirect_vert,fragmentShader:We.equirect_frag},distanceRGBA:{uniforms:Et([xe.common,xe.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:We.distanceRGBA_vert,fragmentShader:We.distanceRGBA_frag},shadow:{uniforms:Et([xe.lights,xe.fog,{color:{value:new Qe(0)},opacity:{value:1}}]),vertexShader:We.shadow_vert,fragmentShader:We.shadow_frag}};kt.physical={uniforms:Et([kt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ve},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ve},clearcoatNormalScale:{value:new nt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ve},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ve},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ve},sheen:{value:0},sheenColor:{value:new Qe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ve},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ve},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ve},transmissionSamplerSize:{value:new nt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ve},attenuationDistance:{value:0},attenuationColor:{value:new Qe(0)},specularColor:{value:new Qe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ve},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ve},anisotropyVector:{value:new nt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ve}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag};const Ri={r:0,b:0,g:0},gn=new Ot,ul=new it;function hl(i,e,t,n,r,a,s){const o=new Qe(0);let c=a===!0?0:1,u,d,f=null,p=0,_=null;function v(R){let A=R.isScene===!0?R.background:null;return A&&A.isTexture&&(A=(R.backgroundBlurriness>0?t:e).get(A)),A}function M(R){let A=!1;const T=v(R);T===null?h(o,c):T&&T.isColor&&(h(T,1),A=!0);const G=i.xr.getEnvironmentBlendMode();G==="additive"?n.buffers.color.setClear(0,0,0,1,s):G==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,s),(i.autoClear||A)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(R,A){const T=v(A);T&&(T.isCubeTexture||T.mapping===306)?(d===void 0&&(d=new bt(new Kn(1,1,1),new Mt({name:"BackgroundCubeMaterial",uniforms:Fn(kt.backgroundCube.uniforms),vertexShader:kt.backgroundCube.vertexShader,fragmentShader:kt.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(G,U,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(d)),gn.copy(A.backgroundRotation),gn.x*=-1,gn.y*=-1,gn.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(gn.y*=-1,gn.z*=-1),d.material.uniforms.envMap.value=T,d.material.uniforms.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=A.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(ul.makeRotationFromEuler(gn)),d.material.toneMapped=$e.getTransfer(T.colorSpace)!==tt,(f!==T||p!==T.version||_!==i.toneMapping)&&(d.material.needsUpdate=!0,f=T,p=T.version,_=i.toneMapping),d.layers.enableAll(),R.unshift(d,d.geometry,d.material,0,0,null)):T&&T.isTexture&&(u===void 0&&(u=new bt(new On(2,2),new Mt({name:"BackgroundMaterial",uniforms:Fn(kt.background.uniforms),vertexShader:kt.background.vertexShader,fragmentShader:kt.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(u)),u.material.uniforms.t2D.value=T,u.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,u.material.toneMapped=$e.getTransfer(T.colorSpace)!==tt,T.matrixAutoUpdate===!0&&T.updateMatrix(),u.material.uniforms.uvTransform.value.copy(T.matrix),(f!==T||p!==T.version||_!==i.toneMapping)&&(u.material.needsUpdate=!0,f=T,p=T.version,_=i.toneMapping),u.layers.enableAll(),R.unshift(u,u.geometry,u.material,0,0,null))}function h(R,A){R.getRGB(Ri,$r(i)),n.buffers.color.setClear(Ri.r,Ri.g,Ri.b,A,s)}return{getClearColor:function(){return o},setClearColor:function(R,A=1){o.set(R),c=A,h(o,c)},getClearAlpha:function(){return c},setClearAlpha:function(R){c=R,h(o,c)},render:M,addToRenderList:m}}function dl(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=p(null);let a=r,s=!1;function o(x,D,j,W,Y){let re=!1;const $=f(W,j,D);a!==$&&(a=$,u(a.object)),re=_(x,W,j,Y),re&&v(x,W,j,Y),Y!==null&&e.update(Y,i.ELEMENT_ARRAY_BUFFER),(re||s)&&(s=!1,T(x,D,j,W),Y!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(Y).buffer))}function c(){return i.createVertexArray()}function u(x){return i.bindVertexArray(x)}function d(x){return i.deleteVertexArray(x)}function f(x,D,j){const W=j.wireframe===!0;let Y=n[x.id];Y===void 0&&(Y={},n[x.id]=Y);let re=Y[D.id];re===void 0&&(re={},Y[D.id]=re);let $=re[W];return $===void 0&&($=p(c()),re[W]=$),$}function p(x){const D=[],j=[],W=[];for(let Y=0;Y<t;Y++)D[Y]=0,j[Y]=0,W[Y]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:j,attributeDivisors:W,object:x,attributes:{},index:null}}function _(x,D,j,W){const Y=a.attributes,re=D.attributes;let $=0;const se=j.getAttributes();for(const X in se)if(se[X].location>=0){const Q=Y[X];let ue=re[X];if(ue===void 0&&(X==="instanceMatrix"&&x.instanceMatrix&&(ue=x.instanceMatrix),X==="instanceColor"&&x.instanceColor&&(ue=x.instanceColor)),Q===void 0||Q.attribute!==ue||ue&&Q.data!==ue.data)return!0;$++}return a.attributesNum!==$||a.index!==W}function v(x,D,j,W){const Y={},re=D.attributes;let $=0;const se=j.getAttributes();for(const X in se)if(se[X].location>=0){let Q=re[X];Q===void 0&&(X==="instanceMatrix"&&x.instanceMatrix&&(Q=x.instanceMatrix),X==="instanceColor"&&x.instanceColor&&(Q=x.instanceColor));const ue={};ue.attribute=Q,Q&&Q.data&&(ue.data=Q.data),Y[X]=ue,$++}a.attributes=Y,a.attributesNum=$,a.index=W}function M(){const x=a.newAttributes;for(let D=0,j=x.length;D<j;D++)x[D]=0}function m(x){h(x,0)}function h(x,D){const j=a.newAttributes,W=a.enabledAttributes,Y=a.attributeDivisors;j[x]=1,W[x]===0&&(i.enableVertexAttribArray(x),W[x]=1),Y[x]!==D&&(i.vertexAttribDivisor(x,D),Y[x]=D)}function R(){const x=a.newAttributes,D=a.enabledAttributes;for(let j=0,W=D.length;j<W;j++)D[j]!==x[j]&&(i.disableVertexAttribArray(j),D[j]=0)}function A(x,D,j,W,Y,re,$){$===!0?i.vertexAttribIPointer(x,D,j,Y,re):i.vertexAttribPointer(x,D,j,W,Y,re)}function T(x,D,j,W){M();const Y=W.attributes,re=j.getAttributes(),$=D.defaultAttributeValues;for(const se in re){const X=re[se];if(X.location>=0){let ee=Y[se];if(ee===void 0&&(se==="instanceMatrix"&&x.instanceMatrix&&(ee=x.instanceMatrix),se==="instanceColor"&&x.instanceColor&&(ee=x.instanceColor)),ee!==void 0){const Q=ee.normalized,ue=ee.itemSize,ve=e.get(ee);if(ve===void 0)continue;const Fe=ve.buffer,q=ve.type,ie=ve.bytesPerElement,Se=q===i.INT||q===i.UNSIGNED_INT||ee.gpuType===1013;if(ee.isInterleavedBufferAttribute){const ne=ee.data,ye=ne.stride,Re=ee.offset;if(ne.isInstancedInterleavedBuffer){for(let Ie=0;Ie<X.locationSize;Ie++)h(X.location+Ie,ne.meshPerAttribute);x.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let Ie=0;Ie<X.locationSize;Ie++)m(X.location+Ie);i.bindBuffer(i.ARRAY_BUFFER,Fe);for(let Ie=0;Ie<X.locationSize;Ie++)A(X.location+Ie,ue/X.locationSize,q,Q,ye*ie,(Re+ue/X.locationSize*Ie)*ie,Se)}else{if(ee.isInstancedBufferAttribute){for(let ne=0;ne<X.locationSize;ne++)h(X.location+ne,ee.meshPerAttribute);x.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let ne=0;ne<X.locationSize;ne++)m(X.location+ne);i.bindBuffer(i.ARRAY_BUFFER,Fe);for(let ne=0;ne<X.locationSize;ne++)A(X.location+ne,ue/X.locationSize,q,Q,ue*ie,ue/X.locationSize*ne*ie,Se)}}else if($!==void 0){const Q=$[se];if(Q!==void 0)switch(Q.length){case 2:i.vertexAttrib2fv(X.location,Q);break;case 3:i.vertexAttrib3fv(X.location,Q);break;case 4:i.vertexAttrib4fv(X.location,Q);break;default:i.vertexAttrib1fv(X.location,Q)}}}}R()}function G(){B();for(const x in n){const D=n[x];for(const j in D){const W=D[j];for(const Y in W)d(W[Y].object),delete W[Y];delete D[j]}delete n[x]}}function U(x){if(n[x.id]===void 0)return;const D=n[x.id];for(const j in D){const W=D[j];for(const Y in W)d(W[Y].object),delete W[Y];delete D[j]}delete n[x.id]}function L(x){for(const D in n){const j=n[D];if(j[x.id]===void 0)continue;const W=j[x.id];for(const Y in W)d(W[Y].object),delete W[Y];delete j[x.id]}}function B(){y(),s=!0,a!==r&&(a=r,u(a.object))}function y(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:B,resetDefaultState:y,dispose:G,releaseStatesOfGeometry:U,releaseStatesOfProgram:L,initAttributes:M,enableAttribute:m,disableUnusedAttributes:R}}function fl(i,e,t){let n;function r(u){n=u}function a(u,d){i.drawArrays(n,u,d),t.update(d,n,1)}function s(u,d,f){f!==0&&(i.drawArraysInstanced(n,u,d,f),t.update(d,n,f))}function o(u,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,u,0,d,0,f);let _=0;for(let v=0;v<f;v++)_+=d[v];t.update(_,n,1)}function c(u,d,f,p){if(f===0)return;const _=e.get("WEBGL_multi_draw");if(_===null)for(let v=0;v<u.length;v++)s(u[v],d[v],p[v]);else{_.multiDrawArraysInstancedWEBGL(n,u,0,d,0,p,0,f);let v=0;for(let M=0;M<f;M++)v+=d[M]*p[M];t.update(v,n,1)}}this.setMode=r,this.render=a,this.renderInstances=s,this.renderMultiDraw=o,this.renderMultiDrawInstances=c}function pl(i,e,t,n){let r;function a(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const L=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(L.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function s(L){return!(L!==1023&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(L){const B=L===1016&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(L!==1009&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&L!==1015&&!B)}function c(L){if(L==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";L="mediump"}return L==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let u=t.precision!==void 0?t.precision:"highp";const d=c(u);d!==u&&(console.warn("THREE.WebGLRenderer:",u,"not supported, using",d,"instead."),u=d);const f=t.logarithmicDepthBuffer===!0,p=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),_=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),M=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),h=i.getParameter(i.MAX_VERTEX_ATTRIBS),R=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),A=i.getParameter(i.MAX_VARYING_VECTORS),T=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),G=v>0,U=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:s,textureTypeReadable:o,precision:u,logarithmicDepthBuffer:f,reverseDepthBuffer:p,maxTextures:_,maxVertexTextures:v,maxTextureSize:M,maxCubemapSize:m,maxAttributes:h,maxVertexUniforms:R,maxVaryings:A,maxFragmentUniforms:T,vertexTextures:G,maxSamples:U}}function ml(i){const e=this;let t=null,n=0,r=!1,a=!1;const s=new mn,o=new Ve,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,p){const _=f.length!==0||p||n!==0||r;return r=p,n=f.length,_},this.beginShadows=function(){a=!0,d(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(f,p){t=d(f,p,0)},this.setState=function(f,p,_){const v=f.clippingPlanes,M=f.clipIntersection,m=f.clipShadows,h=i.get(f);if(!r||v===null||v.length===0||a&&!m)a?d(null):u();else{const R=a?0:n,A=R*4;let T=h.clippingState||null;c.value=T,T=d(v,p,A,_);for(let G=0;G!==A;++G)T[G]=t[G];h.clippingState=T,this.numIntersection=M?this.numPlanes:0,this.numPlanes+=R}};function u(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function d(f,p,_,v){const M=f!==null?f.length:0;let m=null;if(M!==0){if(m=c.value,v!==!0||m===null){const h=_+M*4,R=p.matrixWorldInverse;o.getNormalMatrix(R),(m===null||m.length<h)&&(m=new Float32Array(h));for(let A=0,T=_;A!==M;++A,T+=4)s.copy(f[A]).applyMatrix4(R,o),s.normal.toArray(m,T),m[T+3]=s.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=M,e.numIntersection=0,m}}function _l(i){let e=new WeakMap;function t(s,o){return o===303?s.mapping=301:o===304&&(s.mapping=302),s}function n(s){if(s&&s.isTexture){const o=s.mapping;if(o===303||o===304)if(e.has(s)){const c=e.get(s).texture;return t(c,s.mapping)}else{const c=s.image;if(c&&c.height>0){const u=new ss(c.height);return u.fromEquirectangularTexture(i,s),e.set(s,u),s.addEventListener("dispose",r),t(u.texture,s.mapping)}else return null}}return s}function r(s){const o=s.target;o.removeEventListener("dispose",r);const c=e.get(o);c!==void 0&&(e.delete(o),c.dispose())}function a(){e=new WeakMap}return{get:n,dispose:a}}class ar extends Zr{constructor(e=-1,t=1,n=1,r=-1,a=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=a,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,a,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=n-e,s=n+e,o=r+t,c=r-t;if(this.view!==null&&this.view.enabled){const u=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=u*this.view.offsetX,s=a+u*this.view.width,o-=d*this.view.offsetY,c=o-d*this.view.height}this.projectionMatrix.makeOrthographic(a,s,o,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const zn=4,ta=[.125,.215,.35,.446,.526,.582],vn=20,sr=new ar,na=new Qe;let or=null,lr=0,cr=0,ur=!1;const xn=(1+Math.sqrt(5))/2,Gn=1/xn,ia=[new O(-xn,Gn,0),new O(xn,Gn,0),new O(-Gn,0,xn),new O(Gn,0,xn),new O(0,xn,-Gn),new O(0,xn,Gn),new O(-1,1,-1),new O(1,1,-1),new O(-1,1,1),new O(1,1,1)];class ra{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,r=100){or=this._renderer.getRenderTarget(),lr=this._renderer.getActiveCubeFace(),cr=this._renderer.getActiveMipmapLevel(),ur=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const a=this._allocateTargets();return a.depthBuffer=!0,this._sceneToCubeUV(e,n,r,a),t>0&&this._blur(a,0,0,t),this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=oa(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=sa(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(or,lr,cr),this._renderer.xr.enabled=ur,e.scissorTest=!1,Ci(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),or=this._renderer.getRenderTarget(),lr=this._renderer.getActiveCubeFace(),cr=this._renderer.getActiveMipmapLevel(),ur=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:1006,minFilter:1006,generateMipmaps:!1,type:1016,format:1023,colorSpace:Xt,depthBuffer:!1},r=aa(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=aa(e,t,n);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=gl(a)),this._blurMaterial=vl(a,e,t)}return r}_compileMaterial(e){const t=new bt(this._lodPlanes[0],e);this._renderer.compile(t,sr)}_sceneToCubeUV(e,t,n,r){const o=new yt(90,1,t,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],d=this._renderer,f=d.autoClear,p=d.toneMapping;d.getClearColor(na),d.toneMapping=0,d.autoClear=!1;const _=new Vr({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}),v=new bt(new Kn,_);let M=!1;const m=e.background;m?m.isColor&&(_.color.copy(m),e.background=null,M=!0):(_.color.copy(na),M=!0);for(let h=0;h<6;h++){const R=h%3;R===0?(o.up.set(0,c[h],0),o.lookAt(u[h],0,0)):R===1?(o.up.set(0,0,c[h]),o.lookAt(0,u[h],0)):(o.up.set(0,c[h],0),o.lookAt(0,0,u[h]));const A=this._cubeSize;Ci(r,R*A,h>2?A:0,A,A),d.setRenderTarget(r),M&&d.render(v,o),d.render(e,o)}v.geometry.dispose(),v.material.dispose(),d.toneMapping=p,d.autoClear=f,e.background=m}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=oa()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=sa());const a=r?this._cubemapMaterial:this._equirectMaterial,s=new bt(this._lodPlanes[0],a),o=a.uniforms;o.envMap.value=e;const c=this._cubeSize;Ci(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(s,sr)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const r=this._lodPlanes.length;for(let a=1;a<r;a++){const s=Math.sqrt(this._sigmas[a]*this._sigmas[a]-this._sigmas[a-1]*this._sigmas[a-1]),o=ia[(r-a-1)%ia.length];this._blur(e,a-1,a,s,o)}t.autoClear=n}_blur(e,t,n,r,a){const s=this._pingPongRenderTarget;this._halfBlur(e,s,t,n,r,"latitudinal",a),this._halfBlur(s,e,n,n,r,"longitudinal",a)}_halfBlur(e,t,n,r,a,s,o){const c=this._renderer,u=this._blurMaterial;s!=="latitudinal"&&s!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const d=3,f=new bt(this._lodPlanes[r],u),p=u.uniforms,_=this._sizeLods[n]-1,v=isFinite(a)?Math.PI/(2*_):2*Math.PI/(2*vn-1),M=a/v,m=isFinite(a)?1+Math.floor(d*M):vn;m>vn&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${vn}`);const h=[];let R=0;for(let L=0;L<vn;++L){const B=L/M,y=Math.exp(-B*B/2);h.push(y),L===0?R+=y:L<m&&(R+=2*y)}for(let L=0;L<h.length;L++)h[L]=h[L]/R;p.envMap.value=e.texture,p.samples.value=m,p.weights.value=h,p.latitudinal.value=s==="latitudinal",o&&(p.poleAxis.value=o);const{_lodMax:A}=this;p.dTheta.value=v,p.mipInt.value=A-n;const T=this._sizeLods[r],G=3*T*(r>A-zn?r-A+zn:0),U=4*(this._cubeSize-T);Ci(t,G,U,3*T,2*T),c.setRenderTarget(t),c.render(f,sr)}}function gl(i){const e=[],t=[],n=[];let r=i;const a=i-zn+1+ta.length;for(let s=0;s<a;s++){const o=Math.pow(2,r);t.push(o);let c=1/o;s>i-zn?c=ta[s-i+zn-1]:s===0&&(c=0),n.push(c);const u=1/(o-2),d=-u,f=1+u,p=[d,d,f,d,f,f,d,d,f,f,d,f],_=6,v=6,M=3,m=2,h=1,R=new Float32Array(M*v*_),A=new Float32Array(m*v*_),T=new Float32Array(h*v*_);for(let U=0;U<_;U++){const L=U%3*2/3-1,B=U>2?0:-1,y=[L,B,0,L+2/3,B,0,L+2/3,B+1,0,L,B,0,L+2/3,B+1,0,L,B+1,0];R.set(y,M*v*U),A.set(p,m*v*U);const x=[U,U,U,U,U,U];T.set(x,h*v*U)}const G=new Vt;G.setAttribute("position",new ht(R,M)),G.setAttribute("uv",new ht(A,m)),G.setAttribute("faceIndex",new ht(T,h)),e.push(G),r>zn&&r--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function aa(i,e,t){const n=new Ft(i,e,t);return n.texture.mapping=306,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ci(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function vl(i,e,t){const n=new Float32Array(vn),r=new O(0,1,0);return new Mt({name:"SphericalGaussianBlur",defines:{n:vn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:hr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function sa(){return new Mt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:hr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function oa(){return new Mt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:hr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function hr(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function xl(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){const c=o.mapping,u=c===303||c===304,d=c===301||c===302;if(u||d){let f=e.get(o);const p=f!==void 0?f.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==p)return t===null&&(t=new ra(i)),f=u?t.fromEquirectangular(o,f):t.fromCubemap(o,f),f.texture.pmremVersion=o.pmremVersion,e.set(o,f),f.texture;if(f!==void 0)return f.texture;{const _=o.image;return u&&_&&_.height>0||d&&_&&r(_)?(t===null&&(t=new ra(i)),f=u?t.fromEquirectangular(o):t.fromCubemap(o),f.texture.pmremVersion=o.pmremVersion,e.set(o,f),o.addEventListener("dispose",a),f.texture):null}}}return o}function r(o){let c=0;const u=6;for(let d=0;d<u;d++)o[d]!==void 0&&c++;return c===u}function a(o){const c=o.target;c.removeEventListener("dispose",a);const u=e.get(c);u!==void 0&&(e.delete(c),u.dispose())}function s(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:s}}function Ml(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&Xn("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function Sl(i,e,t,n){const r={},a=new WeakMap;function s(f){const p=f.target;p.index!==null&&e.remove(p.index);for(const v in p.attributes)e.remove(p.attributes[v]);for(const v in p.morphAttributes){const M=p.morphAttributes[v];for(let m=0,h=M.length;m<h;m++)e.remove(M[m])}p.removeEventListener("dispose",s),delete r[p.id];const _=a.get(p);_&&(e.remove(_),a.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,t.memory.geometries--}function o(f,p){return r[p.id]===!0||(p.addEventListener("dispose",s),r[p.id]=!0,t.memory.geometries++),p}function c(f){const p=f.attributes;for(const v in p)e.update(p[v],i.ARRAY_BUFFER);const _=f.morphAttributes;for(const v in _){const M=_[v];for(let m=0,h=M.length;m<h;m++)e.update(M[m],i.ARRAY_BUFFER)}}function u(f){const p=[],_=f.index,v=f.attributes.position;let M=0;if(_!==null){const R=_.array;M=_.version;for(let A=0,T=R.length;A<T;A+=3){const G=R[A+0],U=R[A+1],L=R[A+2];p.push(G,U,U,L,L,G)}}else if(v!==void 0){const R=v.array;M=v.version;for(let A=0,T=R.length/3-1;A<T;A+=3){const G=A+0,U=A+1,L=A+2;p.push(G,U,U,L,L,G)}}else return;const m=new(Er(p)?Wr:kr)(p,1);m.version=M;const h=a.get(f);h&&e.remove(h),a.set(f,m)}function d(f){const p=a.get(f);if(p){const _=f.index;_!==null&&p.version<_.version&&u(f)}else u(f);return a.get(f)}return{get:o,update:c,getWireframeAttribute:d}}function El(i,e,t){let n;function r(p){n=p}let a,s;function o(p){a=p.type,s=p.bytesPerElement}function c(p,_){i.drawElements(n,_,a,p*s),t.update(_,n,1)}function u(p,_,v){v!==0&&(i.drawElementsInstanced(n,_,a,p*s,v),t.update(_,n,v))}function d(p,_,v){if(v===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,_,0,a,p,0,v);let m=0;for(let h=0;h<v;h++)m+=_[h];t.update(m,n,1)}function f(p,_,v,M){if(v===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let h=0;h<p.length;h++)u(p[h]/s,_[h],M[h]);else{m.multiDrawElementsInstancedWEBGL(n,_,0,a,p,0,M,0,v);let h=0;for(let R=0;R<v;R++)h+=_[R]*M[R];t.update(h,n,1)}}this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=u,this.renderMultiDraw=d,this.renderMultiDrawInstances=f}function yl(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(a,s,o){switch(t.calls++,s){case i.TRIANGLES:t.triangles+=o*(a/3);break;case i.LINES:t.lines+=o*(a/2);break;case i.LINE_STRIP:t.lines+=o*(a-1);break;case i.LINE_LOOP:t.lines+=o*a;break;case i.POINTS:t.points+=o*a;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",s);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function Tl(i,e,t){const n=new WeakMap,r=new lt;function a(s,o,c){const u=s.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=d!==void 0?d.length:0;let p=n.get(o);if(p===void 0||p.count!==f){let y=function(){L.dispose(),n.delete(o),o.removeEventListener("dispose",y)};p!==void 0&&p.texture.dispose();const _=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,M=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],h=o.morphAttributes.normal||[],R=o.morphAttributes.color||[];let A=0;_===!0&&(A=1),v===!0&&(A=2),M===!0&&(A=3);let T=o.attributes.position.count*A,G=1;T>e.maxTextureSize&&(G=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const U=new Float32Array(T*G*4*f),L=new Pr(U,T,G,f);L.type=1015,L.needsUpdate=!0;const B=A*4;for(let x=0;x<f;x++){const D=m[x],j=h[x],W=R[x],Y=T*G*4*x;for(let re=0;re<D.count;re++){const $=re*B;_===!0&&(r.fromBufferAttribute(D,re),U[Y+$+0]=r.x,U[Y+$+1]=r.y,U[Y+$+2]=r.z,U[Y+$+3]=0),v===!0&&(r.fromBufferAttribute(j,re),U[Y+$+4]=r.x,U[Y+$+5]=r.y,U[Y+$+6]=r.z,U[Y+$+7]=0),M===!0&&(r.fromBufferAttribute(W,re),U[Y+$+8]=r.x,U[Y+$+9]=r.y,U[Y+$+10]=r.z,U[Y+$+11]=W.itemSize===4?r.w:1)}}p={count:f,texture:L,size:new nt(T,G)},n.set(o,p),o.addEventListener("dispose",y)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",s.morphTexture,t);else{let _=0;for(let M=0;M<u.length;M++)_+=u[M];const v=o.morphTargetsRelative?1:1-_;c.getUniforms().setValue(i,"morphTargetBaseInfluence",v),c.getUniforms().setValue(i,"morphTargetInfluences",u)}c.getUniforms().setValue(i,"morphTargetsTexture",p.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",p.size)}return{update:a}}function Al(i,e,t,n){let r=new WeakMap;function a(c){const u=n.render.frame,d=c.geometry,f=e.get(c,d);if(r.get(f)!==u&&(e.update(f),r.set(f,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),r.get(c)!==u&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){const p=c.skeleton;r.get(p)!==u&&(p.update(),r.set(p,u))}return f}function s(){r=new WeakMap}function o(c){const u=c.target;u.removeEventListener("dispose",o),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:s}}class la extends _t{constructor(e,t,n,r,a,s,o,c,u,d=1026){if(d!==1026&&d!==1027)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&d===1026&&(n=1014),n===void 0&&d===1027&&(n=1020),super(null,r,a,s,o,c,d,n,u),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:1003,this.minFilter=c!==void 0?c:1003,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const ca=new _t,ua=new la(1,1),ha=new Pr,da=new Wa,fa=new Jr,pa=[],ma=[],_a=new Float32Array(16),ga=new Float32Array(9),va=new Float32Array(4);function Hn(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let a=pa[r];if(a===void 0&&(a=new Float32Array(r),pa[r]=a),e!==0){n.toArray(a,0);for(let s=1,o=0;s!==e;++s)o+=t,i[s].toArray(a,o)}return a}function dt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function ft(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Pi(i,e){let t=ma[e];t===void 0&&(t=new Int32Array(e),ma[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function bl(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function wl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;i.uniform2fv(this.addr,e),ft(t,e)}}function Rl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(dt(t,e))return;i.uniform3fv(this.addr,e),ft(t,e)}}function Cl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;i.uniform4fv(this.addr,e),ft(t,e)}}function Pl(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),ft(t,e)}else{if(dt(t,n))return;va.set(n),i.uniformMatrix2fv(this.addr,!1,va),ft(t,n)}}function Dl(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),ft(t,e)}else{if(dt(t,n))return;ga.set(n),i.uniformMatrix3fv(this.addr,!1,ga),ft(t,n)}}function Ll(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),ft(t,e)}else{if(dt(t,n))return;_a.set(n),i.uniformMatrix4fv(this.addr,!1,_a),ft(t,n)}}function Ul(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Il(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;i.uniform2iv(this.addr,e),ft(t,e)}}function Fl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(dt(t,e))return;i.uniform3iv(this.addr,e),ft(t,e)}}function Nl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;i.uniform4iv(this.addr,e),ft(t,e)}}function Bl(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Ol(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;i.uniform2uiv(this.addr,e),ft(t,e)}}function zl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(dt(t,e))return;i.uniform3uiv(this.addr,e),ft(t,e)}}function Gl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;i.uniform4uiv(this.addr,e),ft(t,e)}}function Hl(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let a;this.type===i.SAMPLER_2D_SHADOW?(ua.compareFunction=515,a=ua):a=ca,t.setTexture2D(e||a,r)}function Vl(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||da,r)}function kl(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||fa,r)}function Wl(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||ha,r)}function Xl(i){switch(i){case 5126:return bl;case 35664:return wl;case 35665:return Rl;case 35666:return Cl;case 35674:return Pl;case 35675:return Dl;case 35676:return Ll;case 5124:case 35670:return Ul;case 35667:case 35671:return Il;case 35668:case 35672:return Fl;case 35669:case 35673:return Nl;case 5125:return Bl;case 36294:return Ol;case 36295:return zl;case 36296:return Gl;case 35678:case 36198:case 36298:case 36306:case 35682:return Hl;case 35679:case 36299:case 36307:return Vl;case 35680:case 36300:case 36308:case 36293:return kl;case 36289:case 36303:case 36311:case 36292:return Wl}}function ql(i,e){i.uniform1fv(this.addr,e)}function Yl(i,e){const t=Hn(e,this.size,2);i.uniform2fv(this.addr,t)}function $l(i,e){const t=Hn(e,this.size,3);i.uniform3fv(this.addr,t)}function Zl(i,e){const t=Hn(e,this.size,4);i.uniform4fv(this.addr,t)}function jl(i,e){const t=Hn(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Kl(i,e){const t=Hn(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Jl(i,e){const t=Hn(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Ql(i,e){i.uniform1iv(this.addr,e)}function ec(i,e){i.uniform2iv(this.addr,e)}function tc(i,e){i.uniform3iv(this.addr,e)}function nc(i,e){i.uniform4iv(this.addr,e)}function ic(i,e){i.uniform1uiv(this.addr,e)}function rc(i,e){i.uniform2uiv(this.addr,e)}function ac(i,e){i.uniform3uiv(this.addr,e)}function sc(i,e){i.uniform4uiv(this.addr,e)}function oc(i,e,t){const n=this.cache,r=e.length,a=Pi(t,r);dt(n,a)||(i.uniform1iv(this.addr,a),ft(n,a));for(let s=0;s!==r;++s)t.setTexture2D(e[s]||ca,a[s])}function lc(i,e,t){const n=this.cache,r=e.length,a=Pi(t,r);dt(n,a)||(i.uniform1iv(this.addr,a),ft(n,a));for(let s=0;s!==r;++s)t.setTexture3D(e[s]||da,a[s])}function cc(i,e,t){const n=this.cache,r=e.length,a=Pi(t,r);dt(n,a)||(i.uniform1iv(this.addr,a),ft(n,a));for(let s=0;s!==r;++s)t.setTextureCube(e[s]||fa,a[s])}function uc(i,e,t){const n=this.cache,r=e.length,a=Pi(t,r);dt(n,a)||(i.uniform1iv(this.addr,a),ft(n,a));for(let s=0;s!==r;++s)t.setTexture2DArray(e[s]||ha,a[s])}function hc(i){switch(i){case 5126:return ql;case 35664:return Yl;case 35665:return $l;case 35666:return Zl;case 35674:return jl;case 35675:return Kl;case 35676:return Jl;case 5124:case 35670:return Ql;case 35667:case 35671:return ec;case 35668:case 35672:return tc;case 35669:case 35673:return nc;case 5125:return ic;case 36294:return rc;case 36295:return ac;case 36296:return sc;case 35678:case 36198:case 36298:case 36306:case 35682:return oc;case 35679:case 36299:case 36307:return lc;case 35680:case 36300:case 36308:case 36293:return cc;case 36289:case 36303:case 36311:case 36292:return uc}}class dc{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Xl(t.type)}}class fc{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=hc(t.type)}}class pc{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let a=0,s=r.length;a!==s;++a){const o=r[a];o.setValue(e,t[o.id],n)}}}const dr=/(\w+)(\])?(\[|\.)?/g;function xa(i,e){i.seq.push(e),i.map[e.id]=e}function mc(i,e,t){const n=i.name,r=n.length;for(dr.lastIndex=0;;){const a=dr.exec(n),s=dr.lastIndex;let o=a[1];const c=a[2]==="]",u=a[3];if(c&&(o=o|0),u===void 0||u==="["&&s+2===r){xa(t,u===void 0?new dc(o,i,e):new fc(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new pc(o),xa(t,f)),t=f}}}class Di{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const a=e.getActiveUniform(t,r),s=e.getUniformLocation(t,a.name);mc(a,s,this)}}setValue(e,t,n,r){const a=this.map[t];a!==void 0&&a.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let a=0,s=t.length;a!==s;++a){const o=t[a],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,a=e.length;r!==a;++r){const s=e[r];s.id in t&&n.push(s)}return n}}function Ma(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const _c=37297;let gc=0;function vc(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),a=Math.min(e+6,t.length);for(let s=r;s<a;s++){const o=s+1;n.push(`${o===e?">":" "} ${o}: ${t[s]}`)}return n.join(`
`)}const Sa=new Ve;function xc(i){$e._getMatrix(Sa,$e.workingColorSpace,i);const e=`mat3( ${Sa.elements.map(t=>t.toFixed(4))} )`;switch($e.getTransfer(i)){case li:return[e,"LinearTransferOETF"];case tt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Ea(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=i.getShaderInfoLog(e).trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const s=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+vc(i.getShaderSource(e),s)}else return r}function Mc(i,e){const t=xc(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Sc(i,e){let t;switch(e){case 1:t="Linear";break;case 2:t="Reinhard";break;case 3:t="Cineon";break;case 4:t="ACESFilmic";break;case 6:t="AgX";break;case 7:t="Neutral";break;case 5:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Li=new O;function Ec(){$e.getLuminanceCoefficients(Li);const i=Li.x.toFixed(4),e=Li.y.toFixed(4),t=Li.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function yc(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Jn).join(`
`)}function Tc(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Ac(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const a=i.getActiveAttrib(e,r),s=a.name;let o=1;a.type===i.FLOAT_MAT2&&(o=2),a.type===i.FLOAT_MAT3&&(o=3),a.type===i.FLOAT_MAT4&&(o=4),t[s]={type:a.type,location:i.getAttribLocation(e,s),locationSize:o}}return t}function Jn(i){return i!==""}function ya(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ta(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const bc=/^[ \t]*#include +<([\w\d./]+)>/gm;function fr(i){return i.replace(bc,Rc)}const wc=new Map;function Rc(i,e){let t=We[e];if(t===void 0){const n=wc.get(e);if(n!==void 0)t=We[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return fr(t)}const Cc=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Aa(i){return i.replace(Cc,Pc)}function Pc(i,e,t,n){let r="";for(let a=parseInt(e);a<parseInt(t);a++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function ba(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Dc(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===1?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===2?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===3&&(e="SHADOWMAP_TYPE_VSM"),e}function Lc(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case 301:case 302:e="ENVMAP_TYPE_CUBE";break;case 306:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Uc(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case 302:e="ENVMAP_MODE_REFRACTION";break}return e}function Ic(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case 0:e="ENVMAP_BLENDING_MULTIPLY";break;case 1:e="ENVMAP_BLENDING_MIX";break;case 2:e="ENVMAP_BLENDING_ADD";break}return e}function Fc(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Nc(i,e,t,n){const r=i.getContext(),a=t.defines;let s=t.vertexShader,o=t.fragmentShader;const c=Dc(t),u=Lc(t),d=Uc(t),f=Ic(t),p=Fc(t),_=yc(t),v=Tc(a),M=r.createProgram();let m,h,R=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter(Jn).join(`
`),m.length>0&&(m+=`
`),h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter(Jn).join(`
`),h.length>0&&(h+=`
`)):(m=[ba(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Jn).join(`
`),h=[ba(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",t.envMap?"#define "+f:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==0?"#define TONE_MAPPING":"",t.toneMapping!==0?We.tonemapping_pars_fragment:"",t.toneMapping!==0?Sc("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",We.colorspace_pars_fragment,Mc("linearToOutputTexel",t.outputColorSpace),Ec(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Jn).join(`
`)),s=fr(s),s=ya(s,t),s=Ta(s,t),o=fr(o),o=ya(o,t),o=Ta(o,t),s=Aa(s),o=Aa(o),t.isRawShaderMaterial!==!0&&(R=`#version 300 es
`,m=[_,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,h=["#define varying in",t.glslVersion===Sr?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Sr?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);const A=R+m+s,T=R+h+o,G=Ma(r,r.VERTEX_SHADER,A),U=Ma(r,r.FRAGMENT_SHADER,T);r.attachShader(M,G),r.attachShader(M,U),t.index0AttributeName!==void 0?r.bindAttribLocation(M,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(M,0,"position"),r.linkProgram(M);function L(D){if(i.debug.checkShaderErrors){const j=r.getProgramInfoLog(M).trim(),W=r.getShaderInfoLog(G).trim(),Y=r.getShaderInfoLog(U).trim();let re=!0,$=!0;if(r.getProgramParameter(M,r.LINK_STATUS)===!1)if(re=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,M,G,U);else{const se=Ea(r,G,"vertex"),X=Ea(r,U,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(M,r.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+j+`
`+se+`
`+X)}else j!==""?console.warn("THREE.WebGLProgram: Program Info Log:",j):(W===""||Y==="")&&($=!1);$&&(D.diagnostics={runnable:re,programLog:j,vertexShader:{log:W,prefix:m},fragmentShader:{log:Y,prefix:h}})}r.deleteShader(G),r.deleteShader(U),B=new Di(r,M),y=Ac(r,M)}let B;this.getUniforms=function(){return B===void 0&&L(this),B};let y;this.getAttributes=function(){return y===void 0&&L(this),y};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=r.getProgramParameter(M,_c)),x},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(M),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=gc++,this.cacheKey=e,this.usedTimes=1,this.program=M,this.vertexShader=G,this.fragmentShader=U,this}let Bc=0;class Oc{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),a=this._getShaderStage(n),s=this._getShaderCacheForMaterial(e);return s.has(r)===!1&&(s.add(r),r.usedTimes++),s.has(a)===!1&&(s.add(a),a.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new zc(e),t.set(e,n)),n}}class zc{constructor(e){this.id=Bc++,this.code=e,this.usedTimes=0}}function Gc(i,e,t,n,r,a,s){const o=new qi,c=new Oc,u=new Set,d=[],f=r.logarithmicDepthBuffer,p=r.vertexTextures;let _=r.precision;const v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function M(y){return u.add(y),y===0?"uv":`uv${y}`}function m(y,x,D,j,W){const Y=j.fog,re=W.geometry,$=y.isMeshStandardMaterial?j.environment:null,se=(y.isMeshStandardMaterial?t:e).get(y.envMap||$),X=se&&se.mapping===306?se.image.height:null,ee=v[y.type];y.precision!==null&&(_=r.getMaxPrecision(y.precision),_!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",_,"instead."));const Q=re.morphAttributes.position||re.morphAttributes.normal||re.morphAttributes.color,ue=Q!==void 0?Q.length:0;let ve=0;re.morphAttributes.position!==void 0&&(ve=1),re.morphAttributes.normal!==void 0&&(ve=2),re.morphAttributes.color!==void 0&&(ve=3);let Fe,q,ie,Se;if(ee){const He=kt[ee];Fe=He.vertexShader,q=He.fragmentShader}else Fe=y.vertexShader,q=y.fragmentShader,c.update(y),ie=c.getVertexShaderID(y),Se=c.getFragmentShaderID(y);const ne=i.getRenderTarget(),ye=i.state.buffers.depth.getReversed(),Re=W.isInstancedMesh===!0,Ie=W.isBatchedMesh===!0,Xe=!!y.map,Be=!!y.matcap,Me=!!se,I=!!y.aoMap,et=!!y.lightMap,ze=!!y.bumpMap,Ne=!!y.normalMap,be=!!y.displacementMap,Ye=!!y.emissiveMap,we=!!y.metalnessMap,E=!!y.roughnessMap,l=y.anisotropy>0,S=y.clearcoat>0,w=y.dispersion>0,C=y.iridescence>0,b=y.sheen>0,Z=y.transmission>0,H=l&&!!y.anisotropyMap,J=S&&!!y.clearcoatMap,ge=S&&!!y.clearcoatNormalMap,te=S&&!!y.clearcoatRoughnessMap,oe=C&&!!y.iridescenceMap,he=C&&!!y.iridescenceThicknessMap,Te=b&&!!y.sheenColorMap,me=b&&!!y.sheenRoughnessMap,Ae=!!y.specularMap,_e=!!y.specularColorMap,ce=!!y.specularIntensityMap,P=Z&&!!y.transmissionMap,le=Z&&!!y.thicknessMap,z=!!y.gradientMap,K=!!y.alphaMap,ae=y.alphaTest>0,de=!!y.alphaHash,Ue=!!y.extensions;let pe=0;y.toneMapped&&(ne===null||ne.isXRRenderTarget===!0)&&(pe=i.toneMapping);const Ge={shaderID:ee,shaderType:y.type,shaderName:y.name,vertexShader:Fe,fragmentShader:q,defines:y.defines,customVertexShaderID:ie,customFragmentShaderID:Se,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:_,batching:Ie,batchingColor:Ie&&W._colorsTexture!==null,instancing:Re,instancingColor:Re&&W.instanceColor!==null,instancingMorph:Re&&W.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:ne===null?i.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:Xt,alphaToCoverage:!!y.alphaToCoverage,map:Xe,matcap:Be,envMap:Me,envMapMode:Me&&se.mapping,envMapCubeUVHeight:X,aoMap:I,lightMap:et,bumpMap:ze,normalMap:Ne,displacementMap:p&&be,emissiveMap:Ye,normalMapObjectSpace:Ne&&y.normalMapType===1,normalMapTangentSpace:Ne&&y.normalMapType===0,metalnessMap:we,roughnessMap:E,anisotropy:l,anisotropyMap:H,clearcoat:S,clearcoatMap:J,clearcoatNormalMap:ge,clearcoatRoughnessMap:te,dispersion:w,iridescence:C,iridescenceMap:oe,iridescenceThicknessMap:he,sheen:b,sheenColorMap:Te,sheenRoughnessMap:me,specularMap:Ae,specularColorMap:_e,specularIntensityMap:ce,transmission:Z,transmissionMap:P,thicknessMap:le,gradientMap:z,opaque:y.transparent===!1&&y.blending===1&&y.alphaToCoverage===!1,alphaMap:K,alphaTest:ae,alphaHash:de,combine:y.combine,mapUv:Xe&&M(y.map.channel),aoMapUv:I&&M(y.aoMap.channel),lightMapUv:et&&M(y.lightMap.channel),bumpMapUv:ze&&M(y.bumpMap.channel),normalMapUv:Ne&&M(y.normalMap.channel),displacementMapUv:be&&M(y.displacementMap.channel),emissiveMapUv:Ye&&M(y.emissiveMap.channel),metalnessMapUv:we&&M(y.metalnessMap.channel),roughnessMapUv:E&&M(y.roughnessMap.channel),anisotropyMapUv:H&&M(y.anisotropyMap.channel),clearcoatMapUv:J&&M(y.clearcoatMap.channel),clearcoatNormalMapUv:ge&&M(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:te&&M(y.clearcoatRoughnessMap.channel),iridescenceMapUv:oe&&M(y.iridescenceMap.channel),iridescenceThicknessMapUv:he&&M(y.iridescenceThicknessMap.channel),sheenColorMapUv:Te&&M(y.sheenColorMap.channel),sheenRoughnessMapUv:me&&M(y.sheenRoughnessMap.channel),specularMapUv:Ae&&M(y.specularMap.channel),specularColorMapUv:_e&&M(y.specularColorMap.channel),specularIntensityMapUv:ce&&M(y.specularIntensityMap.channel),transmissionMapUv:P&&M(y.transmissionMap.channel),thicknessMapUv:le&&M(y.thicknessMap.channel),alphaMapUv:K&&M(y.alphaMap.channel),vertexTangents:!!re.attributes.tangent&&(Ne||l),vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!re.attributes.color&&re.attributes.color.itemSize===4,pointsUvs:W.isPoints===!0&&!!re.attributes.uv&&(Xe||K),fog:!!Y,useFog:y.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:y.flatShading===!0,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:f,reverseDepthBuffer:ye,skinning:W.isSkinnedMesh===!0,morphTargets:re.morphAttributes.position!==void 0,morphNormals:re.morphAttributes.normal!==void 0,morphColors:re.morphAttributes.color!==void 0,morphTargetsCount:ue,morphTextureStride:ve,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:pe,decodeVideoTexture:Xe&&y.map.isVideoTexture===!0&&$e.getTransfer(y.map.colorSpace)===tt,decodeVideoTextureEmissive:Ye&&y.emissiveMap.isVideoTexture===!0&&$e.getTransfer(y.emissiveMap.colorSpace)===tt,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===2,flipSided:y.side===1,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:Ue&&y.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ue&&y.extensions.multiDraw===!0||Ie)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return Ge.vertexUv1s=u.has(1),Ge.vertexUv2s=u.has(2),Ge.vertexUv3s=u.has(3),u.clear(),Ge}function h(y){const x=[];if(y.shaderID?x.push(y.shaderID):(x.push(y.customVertexShaderID),x.push(y.customFragmentShaderID)),y.defines!==void 0)for(const D in y.defines)x.push(D),x.push(y.defines[D]);return y.isRawShaderMaterial===!1&&(R(x,y),A(x,y),x.push(i.outputColorSpace)),x.push(y.customProgramCacheKey),x.join()}function R(y,x){y.push(x.precision),y.push(x.outputColorSpace),y.push(x.envMapMode),y.push(x.envMapCubeUVHeight),y.push(x.mapUv),y.push(x.alphaMapUv),y.push(x.lightMapUv),y.push(x.aoMapUv),y.push(x.bumpMapUv),y.push(x.normalMapUv),y.push(x.displacementMapUv),y.push(x.emissiveMapUv),y.push(x.metalnessMapUv),y.push(x.roughnessMapUv),y.push(x.anisotropyMapUv),y.push(x.clearcoatMapUv),y.push(x.clearcoatNormalMapUv),y.push(x.clearcoatRoughnessMapUv),y.push(x.iridescenceMapUv),y.push(x.iridescenceThicknessMapUv),y.push(x.sheenColorMapUv),y.push(x.sheenRoughnessMapUv),y.push(x.specularMapUv),y.push(x.specularColorMapUv),y.push(x.specularIntensityMapUv),y.push(x.transmissionMapUv),y.push(x.thicknessMapUv),y.push(x.combine),y.push(x.fogExp2),y.push(x.sizeAttenuation),y.push(x.morphTargetsCount),y.push(x.morphAttributeCount),y.push(x.numDirLights),y.push(x.numPointLights),y.push(x.numSpotLights),y.push(x.numSpotLightMaps),y.push(x.numHemiLights),y.push(x.numRectAreaLights),y.push(x.numDirLightShadows),y.push(x.numPointLightShadows),y.push(x.numSpotLightShadows),y.push(x.numSpotLightShadowsWithMaps),y.push(x.numLightProbes),y.push(x.shadowMapType),y.push(x.toneMapping),y.push(x.numClippingPlanes),y.push(x.numClipIntersection),y.push(x.depthPacking)}function A(y,x){o.disableAll(),x.supportsVertexTextures&&o.enable(0),x.instancing&&o.enable(1),x.instancingColor&&o.enable(2),x.instancingMorph&&o.enable(3),x.matcap&&o.enable(4),x.envMap&&o.enable(5),x.normalMapObjectSpace&&o.enable(6),x.normalMapTangentSpace&&o.enable(7),x.clearcoat&&o.enable(8),x.iridescence&&o.enable(9),x.alphaTest&&o.enable(10),x.vertexColors&&o.enable(11),x.vertexAlphas&&o.enable(12),x.vertexUv1s&&o.enable(13),x.vertexUv2s&&o.enable(14),x.vertexUv3s&&o.enable(15),x.vertexTangents&&o.enable(16),x.anisotropy&&o.enable(17),x.alphaHash&&o.enable(18),x.batching&&o.enable(19),x.dispersion&&o.enable(20),x.batchingColor&&o.enable(21),y.push(o.mask),o.disableAll(),x.fog&&o.enable(0),x.useFog&&o.enable(1),x.flatShading&&o.enable(2),x.logarithmicDepthBuffer&&o.enable(3),x.reverseDepthBuffer&&o.enable(4),x.skinning&&o.enable(5),x.morphTargets&&o.enable(6),x.morphNormals&&o.enable(7),x.morphColors&&o.enable(8),x.premultipliedAlpha&&o.enable(9),x.shadowMapEnabled&&o.enable(10),x.doubleSided&&o.enable(11),x.flipSided&&o.enable(12),x.useDepthPacking&&o.enable(13),x.dithering&&o.enable(14),x.transmission&&o.enable(15),x.sheen&&o.enable(16),x.opaque&&o.enable(17),x.pointsUvs&&o.enable(18),x.decodeVideoTexture&&o.enable(19),x.decodeVideoTextureEmissive&&o.enable(20),x.alphaToCoverage&&o.enable(21),y.push(o.mask)}function T(y){const x=v[y.type];let D;if(x){const j=kt[x];D=ns.clone(j.uniforms)}else D=y.uniforms;return D}function G(y,x){let D;for(let j=0,W=d.length;j<W;j++){const Y=d[j];if(Y.cacheKey===x){D=Y,++D.usedTimes;break}}return D===void 0&&(D=new Nc(i,x,y,a),d.push(D)),D}function U(y){if(--y.usedTimes===0){const x=d.indexOf(y);d[x]=d[d.length-1],d.pop(),y.destroy()}}function L(y){c.remove(y)}function B(){c.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:T,acquireProgram:G,releaseProgram:U,releaseShaderCache:L,programs:d,dispose:B}}function Hc(){let i=new WeakMap;function e(s){return i.has(s)}function t(s){let o=i.get(s);return o===void 0&&(o={},i.set(s,o)),o}function n(s){i.delete(s)}function r(s,o,c){i.get(s)[o]=c}function a(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:a}}function Vc(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function wa(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Ra(){const i=[];let e=0;const t=[],n=[],r=[];function a(){e=0,t.length=0,n.length=0,r.length=0}function s(f,p,_,v,M,m){let h=i[e];return h===void 0?(h={id:f.id,object:f,geometry:p,material:_,groupOrder:v,renderOrder:f.renderOrder,z:M,group:m},i[e]=h):(h.id=f.id,h.object=f,h.geometry=p,h.material=_,h.groupOrder=v,h.renderOrder=f.renderOrder,h.z=M,h.group=m),e++,h}function o(f,p,_,v,M,m){const h=s(f,p,_,v,M,m);_.transmission>0?n.push(h):_.transparent===!0?r.push(h):t.push(h)}function c(f,p,_,v,M,m){const h=s(f,p,_,v,M,m);_.transmission>0?n.unshift(h):_.transparent===!0?r.unshift(h):t.unshift(h)}function u(f,p){t.length>1&&t.sort(f||Vc),n.length>1&&n.sort(p||wa),r.length>1&&r.sort(p||wa)}function d(){for(let f=e,p=i.length;f<p;f++){const _=i[f];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:n,transparent:r,init:a,push:o,unshift:c,finish:d,sort:u}}function kc(){let i=new WeakMap;function e(n,r){const a=i.get(n);let s;return a===void 0?(s=new Ra,i.set(n,[s])):r>=a.length?(s=new Ra,a.push(s)):s=a[r],s}function t(){i=new WeakMap}return{get:e,dispose:t}}function Wc(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new O,color:new Qe};break;case"SpotLight":t={position:new O,direction:new O,color:new Qe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new Qe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new Qe,groundColor:new Qe};break;case"RectAreaLight":t={color:new Qe,position:new O,halfWidth:new O,halfHeight:new O};break}return i[e.id]=t,t}}}function Xc(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let qc=0;function Yc(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function $c(i){const e=new Wc,t=Xc(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)n.probe.push(new O);const r=new O,a=new it,s=new it;function o(u){let d=0,f=0,p=0;for(let y=0;y<9;y++)n.probe[y].set(0,0,0);let _=0,v=0,M=0,m=0,h=0,R=0,A=0,T=0,G=0,U=0,L=0;u.sort(Yc);for(let y=0,x=u.length;y<x;y++){const D=u[y],j=D.color,W=D.intensity,Y=D.distance,re=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)d+=j.r*W,f+=j.g*W,p+=j.b*W;else if(D.isLightProbe){for(let $=0;$<9;$++)n.probe[$].addScaledVector(D.sh.coefficients[$],W);L++}else if(D.isDirectionalLight){const $=e.get(D);if($.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const se=D.shadow,X=t.get(D);X.shadowIntensity=se.intensity,X.shadowBias=se.bias,X.shadowNormalBias=se.normalBias,X.shadowRadius=se.radius,X.shadowMapSize=se.mapSize,n.directionalShadow[_]=X,n.directionalShadowMap[_]=re,n.directionalShadowMatrix[_]=D.shadow.matrix,R++}n.directional[_]=$,_++}else if(D.isSpotLight){const $=e.get(D);$.position.setFromMatrixPosition(D.matrixWorld),$.color.copy(j).multiplyScalar(W),$.distance=Y,$.coneCos=Math.cos(D.angle),$.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),$.decay=D.decay,n.spot[M]=$;const se=D.shadow;if(D.map&&(n.spotLightMap[G]=D.map,G++,se.updateMatrices(D),D.castShadow&&U++),n.spotLightMatrix[M]=se.matrix,D.castShadow){const X=t.get(D);X.shadowIntensity=se.intensity,X.shadowBias=se.bias,X.shadowNormalBias=se.normalBias,X.shadowRadius=se.radius,X.shadowMapSize=se.mapSize,n.spotShadow[M]=X,n.spotShadowMap[M]=re,T++}M++}else if(D.isRectAreaLight){const $=e.get(D);$.color.copy(j).multiplyScalar(W),$.halfWidth.set(D.width*.5,0,0),$.halfHeight.set(0,D.height*.5,0),n.rectArea[m]=$,m++}else if(D.isPointLight){const $=e.get(D);if($.color.copy(D.color).multiplyScalar(D.intensity),$.distance=D.distance,$.decay=D.decay,D.castShadow){const se=D.shadow,X=t.get(D);X.shadowIntensity=se.intensity,X.shadowBias=se.bias,X.shadowNormalBias=se.normalBias,X.shadowRadius=se.radius,X.shadowMapSize=se.mapSize,X.shadowCameraNear=se.camera.near,X.shadowCameraFar=se.camera.far,n.pointShadow[v]=X,n.pointShadowMap[v]=re,n.pointShadowMatrix[v]=D.shadow.matrix,A++}n.point[v]=$,v++}else if(D.isHemisphereLight){const $=e.get(D);$.skyColor.copy(D.color).multiplyScalar(W),$.groundColor.copy(D.groundColor).multiplyScalar(W),n.hemi[h]=$,h++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=xe.LTC_FLOAT_1,n.rectAreaLTC2=xe.LTC_FLOAT_2):(n.rectAreaLTC1=xe.LTC_HALF_1,n.rectAreaLTC2=xe.LTC_HALF_2)),n.ambient[0]=d,n.ambient[1]=f,n.ambient[2]=p;const B=n.hash;(B.directionalLength!==_||B.pointLength!==v||B.spotLength!==M||B.rectAreaLength!==m||B.hemiLength!==h||B.numDirectionalShadows!==R||B.numPointShadows!==A||B.numSpotShadows!==T||B.numSpotMaps!==G||B.numLightProbes!==L)&&(n.directional.length=_,n.spot.length=M,n.rectArea.length=m,n.point.length=v,n.hemi.length=h,n.directionalShadow.length=R,n.directionalShadowMap.length=R,n.pointShadow.length=A,n.pointShadowMap.length=A,n.spotShadow.length=T,n.spotShadowMap.length=T,n.directionalShadowMatrix.length=R,n.pointShadowMatrix.length=A,n.spotLightMatrix.length=T+G-U,n.spotLightMap.length=G,n.numSpotLightShadowsWithMaps=U,n.numLightProbes=L,B.directionalLength=_,B.pointLength=v,B.spotLength=M,B.rectAreaLength=m,B.hemiLength=h,B.numDirectionalShadows=R,B.numPointShadows=A,B.numSpotShadows=T,B.numSpotMaps=G,B.numLightProbes=L,n.version=qc++)}function c(u,d){let f=0,p=0,_=0,v=0,M=0;const m=d.matrixWorldInverse;for(let h=0,R=u.length;h<R;h++){const A=u[h];if(A.isDirectionalLight){const T=n.directional[f];T.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(m),f++}else if(A.isSpotLight){const T=n.spot[_];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),T.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(m),_++}else if(A.isRectAreaLight){const T=n.rectArea[v];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),s.identity(),a.copy(A.matrixWorld),a.premultiply(m),s.extractRotation(a),T.halfWidth.set(A.width*.5,0,0),T.halfHeight.set(0,A.height*.5,0),T.halfWidth.applyMatrix4(s),T.halfHeight.applyMatrix4(s),v++}else if(A.isPointLight){const T=n.point[p];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),p++}else if(A.isHemisphereLight){const T=n.hemi[M];T.direction.setFromMatrixPosition(A.matrixWorld),T.direction.transformDirection(m),M++}}}return{setup:o,setupView:c,state:n}}function Ca(i){const e=new $c(i),t=[],n=[];function r(d){u.camera=d,t.length=0,n.length=0}function a(d){t.push(d)}function s(d){n.push(d)}function o(){e.setup(t)}function c(d){e.setupView(t,d)}const u={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:u,setupLights:o,setupLightsView:c,pushLight:a,pushShadow:s}}function Zc(i){let e=new WeakMap;function t(r,a=0){const s=e.get(r);let o;return s===void 0?(o=new Ca(i),e.set(r,[o])):a>=s.length?(o=new Ca(i),s.push(o)):o=s[a],o}function n(){e=new WeakMap}return{get:t,dispose:n}}class jc extends vi{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Kc extends vi{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Jc=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Qc=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function eu(i,e,t){let n=new Qr;const r=new nt,a=new nt,s=new lt,o=new jc({depthPacking:3201}),c=new Kc,u={},d=t.maxTextureSize,f={0:1,1:0,2:2},p=new Mt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new nt},radius:{value:4}},vertexShader:Jc,fragmentShader:Qc}),_=p.clone();_.defines.HORIZONTAL_PASS=1;const v=new Vt;v.setAttribute("position",new ht(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const M=new bt(v,p),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let h=this.type;this.render=function(U,L,B){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||U.length===0)return;const y=i.getRenderTarget(),x=i.getActiveCubeFace(),D=i.getActiveMipmapLevel(),j=i.state;j.setBlending(0),j.buffers.color.setClear(1,1,1,1),j.buffers.depth.setTest(!0),j.setScissorTest(!1);const W=h!==3&&this.type===3,Y=h===3&&this.type!==3;for(let re=0,$=U.length;re<$;re++){const se=U[re],X=se.shadow;if(X===void 0){console.warn("THREE.WebGLShadowMap:",se,"has no shadow.");continue}if(X.autoUpdate===!1&&X.needsUpdate===!1)continue;r.copy(X.mapSize);const ee=X.getFrameExtents();if(r.multiply(ee),a.copy(X.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(a.x=Math.floor(d/ee.x),r.x=a.x*ee.x,X.mapSize.x=a.x),r.y>d&&(a.y=Math.floor(d/ee.y),r.y=a.y*ee.y,X.mapSize.y=a.y)),X.map===null||W===!0||Y===!0){const ue=this.type!==3?{minFilter:1003,magFilter:1003}:{};X.map!==null&&X.map.dispose(),X.map=new Ft(r.x,r.y,ue),X.map.texture.name=se.name+".shadowMap",X.camera.updateProjectionMatrix()}i.setRenderTarget(X.map),i.clear();const Q=X.getViewportCount();for(let ue=0;ue<Q;ue++){const ve=X.getViewport(ue);s.set(a.x*ve.x,a.y*ve.y,a.x*ve.z,a.y*ve.w),j.viewport(s),X.updateMatrices(se,ue),n=X.getFrustum(),T(L,B,X.camera,se,this.type)}X.isPointLightShadow!==!0&&this.type===3&&R(X,B),X.needsUpdate=!1}h=this.type,m.needsUpdate=!1,i.setRenderTarget(y,x,D)};function R(U,L){const B=e.update(M);p.defines.VSM_SAMPLES!==U.blurSamples&&(p.defines.VSM_SAMPLES=U.blurSamples,_.defines.VSM_SAMPLES=U.blurSamples,p.needsUpdate=!0,_.needsUpdate=!0),U.mapPass===null&&(U.mapPass=new Ft(r.x,r.y)),p.uniforms.shadow_pass.value=U.map.texture,p.uniforms.resolution.value=U.mapSize,p.uniforms.radius.value=U.radius,i.setRenderTarget(U.mapPass),i.clear(),i.renderBufferDirect(L,null,B,p,M,null),_.uniforms.shadow_pass.value=U.mapPass.texture,_.uniforms.resolution.value=U.mapSize,_.uniforms.radius.value=U.radius,i.setRenderTarget(U.map),i.clear(),i.renderBufferDirect(L,null,B,_,M,null)}function A(U,L,B,y){let x=null;const D=B.isPointLight===!0?U.customDistanceMaterial:U.customDepthMaterial;if(D!==void 0)x=D;else if(x=B.isPointLight===!0?c:o,i.localClippingEnabled&&L.clipShadows===!0&&Array.isArray(L.clippingPlanes)&&L.clippingPlanes.length!==0||L.displacementMap&&L.displacementScale!==0||L.alphaMap&&L.alphaTest>0||L.map&&L.alphaTest>0){const j=x.uuid,W=L.uuid;let Y=u[j];Y===void 0&&(Y={},u[j]=Y);let re=Y[W];re===void 0&&(re=x.clone(),Y[W]=re,L.addEventListener("dispose",G)),x=re}if(x.visible=L.visible,x.wireframe=L.wireframe,y===3?x.side=L.shadowSide!==null?L.shadowSide:L.side:x.side=L.shadowSide!==null?L.shadowSide:f[L.side],x.alphaMap=L.alphaMap,x.alphaTest=L.alphaTest,x.map=L.map,x.clipShadows=L.clipShadows,x.clippingPlanes=L.clippingPlanes,x.clipIntersection=L.clipIntersection,x.displacementMap=L.displacementMap,x.displacementScale=L.displacementScale,x.displacementBias=L.displacementBias,x.wireframeLinewidth=L.wireframeLinewidth,x.linewidth=L.linewidth,B.isPointLight===!0&&x.isMeshDistanceMaterial===!0){const j=i.properties.get(x);j.light=B}return x}function T(U,L,B,y,x){if(U.visible===!1)return;if(U.layers.test(L.layers)&&(U.isMesh||U.isLine||U.isPoints)&&(U.castShadow||U.receiveShadow&&x===3)&&(!U.frustumCulled||n.intersectsObject(U))){U.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,U.matrixWorld);const W=e.update(U),Y=U.material;if(Array.isArray(Y)){const re=W.groups;for(let $=0,se=re.length;$<se;$++){const X=re[$],ee=Y[X.materialIndex];if(ee&&ee.visible){const Q=A(U,ee,y,x);U.onBeforeShadow(i,U,L,B,W,Q,X),i.renderBufferDirect(B,null,W,Q,U,X),U.onAfterShadow(i,U,L,B,W,Q,X)}}}else if(Y.visible){const re=A(U,Y,y,x);U.onBeforeShadow(i,U,L,B,W,re,null),i.renderBufferDirect(B,null,W,re,U,null),U.onAfterShadow(i,U,L,B,W,re,null)}}const j=U.children;for(let W=0,Y=j.length;W<Y;W++)T(j[W],L,B,y,x)}function G(U){U.target.removeEventListener("dispose",G);for(const B in u){const y=u[B],x=U.target.uuid;x in y&&(y[x].dispose(),delete y[x])}}}const tu={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3};function nu(i,e){function t(){let P=!1;const le=new lt;let z=null;const K=new lt(0,0,0,0);return{setMask:function(ae){z!==ae&&!P&&(i.colorMask(ae,ae,ae,ae),z=ae)},setLocked:function(ae){P=ae},setClear:function(ae,de,Ue,pe,Ge){Ge===!0&&(ae*=pe,de*=pe,Ue*=pe),le.set(ae,de,Ue,pe),K.equals(le)===!1&&(i.clearColor(ae,de,Ue,pe),K.copy(le))},reset:function(){P=!1,z=null,K.set(-1,0,0,0)}}}function n(){let P=!1,le=!1,z=null,K=null,ae=null;return{setReversed:function(de){if(le!==de){const Ue=e.get("EXT_clip_control");le?Ue.clipControlEXT(Ue.LOWER_LEFT_EXT,Ue.ZERO_TO_ONE_EXT):Ue.clipControlEXT(Ue.LOWER_LEFT_EXT,Ue.NEGATIVE_ONE_TO_ONE_EXT);const pe=ae;ae=null,this.setClear(pe)}le=de},getReversed:function(){return le},setTest:function(de){de?ne(i.DEPTH_TEST):ye(i.DEPTH_TEST)},setMask:function(de){z!==de&&!P&&(i.depthMask(de),z=de)},setFunc:function(de){if(le&&(de=tu[de]),K!==de){switch(de){case 0:i.depthFunc(i.NEVER);break;case 1:i.depthFunc(i.ALWAYS);break;case 2:i.depthFunc(i.LESS);break;case 3:i.depthFunc(i.LEQUAL);break;case 4:i.depthFunc(i.EQUAL);break;case 5:i.depthFunc(i.GEQUAL);break;case 6:i.depthFunc(i.GREATER);break;case 7:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}K=de}},setLocked:function(de){P=de},setClear:function(de){ae!==de&&(le&&(de=1-de),i.clearDepth(de),ae=de)},reset:function(){P=!1,z=null,K=null,ae=null,le=!1}}}function r(){let P=!1,le=null,z=null,K=null,ae=null,de=null,Ue=null,pe=null,Ge=null;return{setTest:function(He){P||(He?ne(i.STENCIL_TEST):ye(i.STENCIL_TEST))},setMask:function(He){le!==He&&!P&&(i.stencilMask(He),le=He)},setFunc:function(He,je,qe){(z!==He||K!==je||ae!==qe)&&(i.stencilFunc(He,je,qe),z=He,K=je,ae=qe)},setOp:function(He,je,qe){(de!==He||Ue!==je||pe!==qe)&&(i.stencilOp(He,je,qe),de=He,Ue=je,pe=qe)},setLocked:function(He){P=He},setClear:function(He){Ge!==He&&(i.clearStencil(He),Ge=He)},reset:function(){P=!1,le=null,z=null,K=null,ae=null,de=null,Ue=null,pe=null,Ge=null}}}const a=new t,s=new n,o=new r,c=new WeakMap,u=new WeakMap;let d={},f={},p=new WeakMap,_=[],v=null,M=!1,m=null,h=null,R=null,A=null,T=null,G=null,U=null,L=new Qe(0,0,0),B=0,y=!1,x=null,D=null,j=null,W=null,Y=null;const re=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let $=!1,se=0;const X=i.getParameter(i.VERSION);X.indexOf("WebGL")!==-1?(se=parseFloat(/^WebGL (\d)/.exec(X)[1]),$=se>=1):X.indexOf("OpenGL ES")!==-1&&(se=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),$=se>=2);let ee=null,Q={};const ue=i.getParameter(i.SCISSOR_BOX),ve=i.getParameter(i.VIEWPORT),Fe=new lt().fromArray(ue),q=new lt().fromArray(ve);function ie(P,le,z,K){const ae=new Uint8Array(4),de=i.createTexture();i.bindTexture(P,de),i.texParameteri(P,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(P,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ue=0;Ue<z;Ue++)P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY?i.texImage3D(le,0,i.RGBA,1,1,K,0,i.RGBA,i.UNSIGNED_BYTE,ae):i.texImage2D(le+Ue,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ae);return de}const Se={};Se[i.TEXTURE_2D]=ie(i.TEXTURE_2D,i.TEXTURE_2D,1),Se[i.TEXTURE_CUBE_MAP]=ie(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Se[i.TEXTURE_2D_ARRAY]=ie(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Se[i.TEXTURE_3D]=ie(i.TEXTURE_3D,i.TEXTURE_3D,1,1),a.setClear(0,0,0,1),s.setClear(1),o.setClear(0),ne(i.DEPTH_TEST),s.setFunc(3),ze(!1),Ne(1),ne(i.CULL_FACE),I(0);function ne(P){d[P]!==!0&&(i.enable(P),d[P]=!0)}function ye(P){d[P]!==!1&&(i.disable(P),d[P]=!1)}function Re(P,le){return f[P]!==le?(i.bindFramebuffer(P,le),f[P]=le,P===i.DRAW_FRAMEBUFFER&&(f[i.FRAMEBUFFER]=le),P===i.FRAMEBUFFER&&(f[i.DRAW_FRAMEBUFFER]=le),!0):!1}function Ie(P,le){let z=_,K=!1;if(P){z=p.get(le),z===void 0&&(z=[],p.set(le,z));const ae=P.textures;if(z.length!==ae.length||z[0]!==i.COLOR_ATTACHMENT0){for(let de=0,Ue=ae.length;de<Ue;de++)z[de]=i.COLOR_ATTACHMENT0+de;z.length=ae.length,K=!0}}else z[0]!==i.BACK&&(z[0]=i.BACK,K=!0);K&&i.drawBuffers(z)}function Xe(P){return v!==P?(i.useProgram(P),v=P,!0):!1}const Be={100:i.FUNC_ADD,101:i.FUNC_SUBTRACT,102:i.FUNC_REVERSE_SUBTRACT};Be[103]=i.MIN,Be[104]=i.MAX;const Me={200:i.ZERO,201:i.ONE,202:i.SRC_COLOR,204:i.SRC_ALPHA,210:i.SRC_ALPHA_SATURATE,208:i.DST_COLOR,206:i.DST_ALPHA,203:i.ONE_MINUS_SRC_COLOR,205:i.ONE_MINUS_SRC_ALPHA,209:i.ONE_MINUS_DST_COLOR,207:i.ONE_MINUS_DST_ALPHA,211:i.CONSTANT_COLOR,212:i.ONE_MINUS_CONSTANT_COLOR,213:i.CONSTANT_ALPHA,214:i.ONE_MINUS_CONSTANT_ALPHA};function I(P,le,z,K,ae,de,Ue,pe,Ge,He){if(P===0){M===!0&&(ye(i.BLEND),M=!1);return}if(M===!1&&(ne(i.BLEND),M=!0),P!==5){if(P!==m||He!==y){if((h!==100||T!==100)&&(i.blendEquation(i.FUNC_ADD),h=100,T=100),He)switch(P){case 1:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFunc(i.ONE,i.ONE);break;case 3:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case 4:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}else switch(P){case 1:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case 3:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case 4:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}R=null,A=null,G=null,U=null,L.set(0,0,0),B=0,m=P,y=He}return}ae=ae||le,de=de||z,Ue=Ue||K,(le!==h||ae!==T)&&(i.blendEquationSeparate(Be[le],Be[ae]),h=le,T=ae),(z!==R||K!==A||de!==G||Ue!==U)&&(i.blendFuncSeparate(Me[z],Me[K],Me[de],Me[Ue]),R=z,A=K,G=de,U=Ue),(pe.equals(L)===!1||Ge!==B)&&(i.blendColor(pe.r,pe.g,pe.b,Ge),L.copy(pe),B=Ge),m=P,y=!1}function et(P,le){P.side===2?ye(i.CULL_FACE):ne(i.CULL_FACE);let z=P.side===1;le&&(z=!z),ze(z),P.blending===1&&P.transparent===!1?I(0):I(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),s.setFunc(P.depthFunc),s.setTest(P.depthTest),s.setMask(P.depthWrite),a.setMask(P.colorWrite);const K=P.stencilWrite;o.setTest(K),K&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),Ye(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?ne(i.SAMPLE_ALPHA_TO_COVERAGE):ye(i.SAMPLE_ALPHA_TO_COVERAGE)}function ze(P){x!==P&&(P?i.frontFace(i.CW):i.frontFace(i.CCW),x=P)}function Ne(P){P!==0?(ne(i.CULL_FACE),P!==D&&(P===1?i.cullFace(i.BACK):P===2?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ye(i.CULL_FACE),D=P}function be(P){P!==j&&($&&i.lineWidth(P),j=P)}function Ye(P,le,z){P?(ne(i.POLYGON_OFFSET_FILL),(W!==le||Y!==z)&&(i.polygonOffset(le,z),W=le,Y=z)):ye(i.POLYGON_OFFSET_FILL)}function we(P){P?ne(i.SCISSOR_TEST):ye(i.SCISSOR_TEST)}function E(P){P===void 0&&(P=i.TEXTURE0+re-1),ee!==P&&(i.activeTexture(P),ee=P)}function l(P,le,z){z===void 0&&(ee===null?z=i.TEXTURE0+re-1:z=ee);let K=Q[z];K===void 0&&(K={type:void 0,texture:void 0},Q[z]=K),(K.type!==P||K.texture!==le)&&(ee!==z&&(i.activeTexture(z),ee=z),i.bindTexture(P,le||Se[P]),K.type=P,K.texture=le)}function S(){const P=Q[ee];P!==void 0&&P.type!==void 0&&(i.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function w(){try{i.compressedTexImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function C(){try{i.compressedTexImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function b(){try{i.texSubImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Z(){try{i.texSubImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function H(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function J(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ge(){try{i.texStorage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function te(){try{i.texStorage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function oe(){try{i.texImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function he(){try{i.texImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Te(P){Fe.equals(P)===!1&&(i.scissor(P.x,P.y,P.z,P.w),Fe.copy(P))}function me(P){q.equals(P)===!1&&(i.viewport(P.x,P.y,P.z,P.w),q.copy(P))}function Ae(P,le){let z=u.get(le);z===void 0&&(z=new WeakMap,u.set(le,z));let K=z.get(P);K===void 0&&(K=i.getUniformBlockIndex(le,P.name),z.set(P,K))}function _e(P,le){const K=u.get(le).get(P);c.get(le)!==K&&(i.uniformBlockBinding(le,K,P.__bindingPointIndex),c.set(le,K))}function ce(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),s.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),d={},ee=null,Q={},f={},p=new WeakMap,_=[],v=null,M=!1,m=null,h=null,R=null,A=null,T=null,G=null,U=null,L=new Qe(0,0,0),B=0,y=!1,x=null,D=null,j=null,W=null,Y=null,Fe.set(0,0,i.canvas.width,i.canvas.height),q.set(0,0,i.canvas.width,i.canvas.height),a.reset(),s.reset(),o.reset()}return{buffers:{color:a,depth:s,stencil:o},enable:ne,disable:ye,bindFramebuffer:Re,drawBuffers:Ie,useProgram:Xe,setBlending:I,setMaterial:et,setFlipSided:ze,setCullFace:Ne,setLineWidth:be,setPolygonOffset:Ye,setScissorTest:we,activeTexture:E,bindTexture:l,unbindTexture:S,compressedTexImage2D:w,compressedTexImage3D:C,texImage2D:oe,texImage3D:he,updateUBOMapping:Ae,uniformBlockBinding:_e,texStorage2D:ge,texStorage3D:te,texSubImage2D:b,texSubImage3D:Z,compressedTexSubImage2D:H,compressedTexSubImage3D:J,scissor:Te,viewport:me,reset:ce}}function Pa(i,e,t,n){const r=iu(n);switch(t){case 1021:return i*e;case 1024:return i*e;case 1025:return i*e*2;case 1028:return i*e/r.components*r.byteLength;case 1029:return i*e/r.components*r.byteLength;case 1030:return i*e*2/r.components*r.byteLength;case 1031:return i*e*2/r.components*r.byteLength;case 1022:return i*e*3/r.components*r.byteLength;case 1023:return i*e*4/r.components*r.byteLength;case 1033:return i*e*4/r.components*r.byteLength;case 33776:case 33777:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case 33778:case 33779:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 35841:case 35843:return Math.max(i,16)*Math.max(e,8)/4;case 35840:case 35842:return Math.max(i,8)*Math.max(e,8)/2;case 36196:case 37492:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case 37496:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 37808:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 37809:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case 37810:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case 37811:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case 37812:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case 37813:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case 37814:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case 37815:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case 37816:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case 37817:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case 37818:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case 37819:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case 37820:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case 37821:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(i/4)*Math.ceil(e/4)*16;case 36283:case 36284:return Math.ceil(i/4)*Math.ceil(e/4)*8;case 36285:case 36286:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function iu(i){switch(i){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function ru(i,e,t,n,r,a,s){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator=="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new nt,d=new WeakMap;let f;const p=new WeakMap;let _=!1;try{_=typeof OffscreenCanvas!="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(E,l){return _?new OffscreenCanvas(E,l):ci("canvas")}function M(E,l,S){let w=1;const C=we(E);if((C.width>S||C.height>S)&&(w=S/Math.max(C.width,C.height)),w<1)if(typeof HTMLImageElement!="undefined"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&E instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&E instanceof ImageBitmap||typeof VideoFrame!="undefined"&&E instanceof VideoFrame){const b=Math.floor(w*C.width),Z=Math.floor(w*C.height);f===void 0&&(f=v(b,Z));const H=l?v(b,Z):f;return H.width=b,H.height=Z,H.getContext("2d").drawImage(E,0,0,b,Z),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+C.width+"x"+C.height+") to ("+b+"x"+Z+")."),H}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+C.width+"x"+C.height+")."),E;return E}function m(E){return E.generateMipmaps}function h(E){i.generateMipmap(E)}function R(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function A(E,l,S,w,C=!1){if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let b=l;if(l===i.RED&&(S===i.FLOAT&&(b=i.R32F),S===i.HALF_FLOAT&&(b=i.R16F),S===i.UNSIGNED_BYTE&&(b=i.R8)),l===i.RED_INTEGER&&(S===i.UNSIGNED_BYTE&&(b=i.R8UI),S===i.UNSIGNED_SHORT&&(b=i.R16UI),S===i.UNSIGNED_INT&&(b=i.R32UI),S===i.BYTE&&(b=i.R8I),S===i.SHORT&&(b=i.R16I),S===i.INT&&(b=i.R32I)),l===i.RG&&(S===i.FLOAT&&(b=i.RG32F),S===i.HALF_FLOAT&&(b=i.RG16F),S===i.UNSIGNED_BYTE&&(b=i.RG8)),l===i.RG_INTEGER&&(S===i.UNSIGNED_BYTE&&(b=i.RG8UI),S===i.UNSIGNED_SHORT&&(b=i.RG16UI),S===i.UNSIGNED_INT&&(b=i.RG32UI),S===i.BYTE&&(b=i.RG8I),S===i.SHORT&&(b=i.RG16I),S===i.INT&&(b=i.RG32I)),l===i.RGB_INTEGER&&(S===i.UNSIGNED_BYTE&&(b=i.RGB8UI),S===i.UNSIGNED_SHORT&&(b=i.RGB16UI),S===i.UNSIGNED_INT&&(b=i.RGB32UI),S===i.BYTE&&(b=i.RGB8I),S===i.SHORT&&(b=i.RGB16I),S===i.INT&&(b=i.RGB32I)),l===i.RGBA_INTEGER&&(S===i.UNSIGNED_BYTE&&(b=i.RGBA8UI),S===i.UNSIGNED_SHORT&&(b=i.RGBA16UI),S===i.UNSIGNED_INT&&(b=i.RGBA32UI),S===i.BYTE&&(b=i.RGBA8I),S===i.SHORT&&(b=i.RGBA16I),S===i.INT&&(b=i.RGBA32I)),l===i.RGB&&S===i.UNSIGNED_INT_5_9_9_9_REV&&(b=i.RGB9_E5),l===i.RGBA){const Z=C?li:$e.getTransfer(w);S===i.FLOAT&&(b=i.RGBA32F),S===i.HALF_FLOAT&&(b=i.RGBA16F),S===i.UNSIGNED_BYTE&&(b=Z===tt?i.SRGB8_ALPHA8:i.RGBA8),S===i.UNSIGNED_SHORT_4_4_4_4&&(b=i.RGBA4),S===i.UNSIGNED_SHORT_5_5_5_1&&(b=i.RGB5_A1)}return(b===i.R16F||b===i.R32F||b===i.RG16F||b===i.RG32F||b===i.RGBA16F||b===i.RGBA32F)&&e.get("EXT_color_buffer_float"),b}function T(E,l){let S;return E?l===null||l===1014||l===1020?S=i.DEPTH24_STENCIL8:l===1015?S=i.DEPTH32F_STENCIL8:l===1012&&(S=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):l===null||l===1014||l===1020?S=i.DEPTH_COMPONENT24:l===1015?S=i.DEPTH_COMPONENT32F:l===1012&&(S=i.DEPTH_COMPONENT16),S}function G(E,l){return m(E)===!0||E.isFramebufferTexture&&E.minFilter!==1003&&E.minFilter!==1006?Math.log2(Math.max(l.width,l.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?l.mipmaps.length:1}function U(E){const l=E.target;l.removeEventListener("dispose",U),B(l),l.isVideoTexture&&d.delete(l)}function L(E){const l=E.target;l.removeEventListener("dispose",L),x(l)}function B(E){const l=n.get(E);if(l.__webglInit===void 0)return;const S=E.source,w=p.get(S);if(w){const C=w[l.__cacheKey];C.usedTimes--,C.usedTimes===0&&y(E),Object.keys(w).length===0&&p.delete(S)}n.remove(E)}function y(E){const l=n.get(E);i.deleteTexture(l.__webglTexture);const S=E.source,w=p.get(S);delete w[l.__cacheKey],s.memory.textures--}function x(E){const l=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let w=0;w<6;w++){if(Array.isArray(l.__webglFramebuffer[w]))for(let C=0;C<l.__webglFramebuffer[w].length;C++)i.deleteFramebuffer(l.__webglFramebuffer[w][C]);else i.deleteFramebuffer(l.__webglFramebuffer[w]);l.__webglDepthbuffer&&i.deleteRenderbuffer(l.__webglDepthbuffer[w])}else{if(Array.isArray(l.__webglFramebuffer))for(let w=0;w<l.__webglFramebuffer.length;w++)i.deleteFramebuffer(l.__webglFramebuffer[w]);else i.deleteFramebuffer(l.__webglFramebuffer);if(l.__webglDepthbuffer&&i.deleteRenderbuffer(l.__webglDepthbuffer),l.__webglMultisampledFramebuffer&&i.deleteFramebuffer(l.__webglMultisampledFramebuffer),l.__webglColorRenderbuffer)for(let w=0;w<l.__webglColorRenderbuffer.length;w++)l.__webglColorRenderbuffer[w]&&i.deleteRenderbuffer(l.__webglColorRenderbuffer[w]);l.__webglDepthRenderbuffer&&i.deleteRenderbuffer(l.__webglDepthRenderbuffer)}const S=E.textures;for(let w=0,C=S.length;w<C;w++){const b=n.get(S[w]);b.__webglTexture&&(i.deleteTexture(b.__webglTexture),s.memory.textures--),n.remove(S[w])}n.remove(E)}let D=0;function j(){D=0}function W(){const E=D;return E>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+r.maxTextures),D+=1,E}function Y(E){const l=[];return l.push(E.wrapS),l.push(E.wrapT),l.push(E.wrapR||0),l.push(E.magFilter),l.push(E.minFilter),l.push(E.anisotropy),l.push(E.internalFormat),l.push(E.format),l.push(E.type),l.push(E.generateMipmaps),l.push(E.premultiplyAlpha),l.push(E.flipY),l.push(E.unpackAlignment),l.push(E.colorSpace),l.join()}function re(E,l){const S=n.get(E);if(E.isVideoTexture&&be(E),E.isRenderTargetTexture===!1&&E.version>0&&S.__version!==E.version){const w=E.image;if(w===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(w.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(S,E,l);return}}t.bindTexture(i.TEXTURE_2D,S.__webglTexture,i.TEXTURE0+l)}function $(E,l){const S=n.get(E);if(E.version>0&&S.__version!==E.version){q(S,E,l);return}t.bindTexture(i.TEXTURE_2D_ARRAY,S.__webglTexture,i.TEXTURE0+l)}function se(E,l){const S=n.get(E);if(E.version>0&&S.__version!==E.version){q(S,E,l);return}t.bindTexture(i.TEXTURE_3D,S.__webglTexture,i.TEXTURE0+l)}function X(E,l){const S=n.get(E);if(E.version>0&&S.__version!==E.version){ie(S,E,l);return}t.bindTexture(i.TEXTURE_CUBE_MAP,S.__webglTexture,i.TEXTURE0+l)}const ee={1e3:i.REPEAT,1001:i.CLAMP_TO_EDGE,1002:i.MIRRORED_REPEAT},Q={1003:i.NEAREST,1004:i.NEAREST_MIPMAP_NEAREST,1005:i.NEAREST_MIPMAP_LINEAR,1006:i.LINEAR,1007:i.LINEAR_MIPMAP_NEAREST,1008:i.LINEAR_MIPMAP_LINEAR},ue={512:i.NEVER,519:i.ALWAYS,513:i.LESS,515:i.LEQUAL,514:i.EQUAL,518:i.GEQUAL,516:i.GREATER,517:i.NOTEQUAL};function ve(E,l){if(l.type===1015&&e.has("OES_texture_float_linear")===!1&&(l.magFilter===1006||l.magFilter===1007||l.magFilter===1005||l.magFilter===1008||l.minFilter===1006||l.minFilter===1007||l.minFilter===1005||l.minFilter===1008)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,ee[l.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,ee[l.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,ee[l.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,Q[l.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,Q[l.minFilter]),l.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,ue[l.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(l.magFilter===1003||l.minFilter!==1005&&l.minFilter!==1008||l.type===1015&&e.has("OES_texture_float_linear")===!1)return;if(l.anisotropy>1||n.get(l).__currentAnisotropy){const S=e.get("EXT_texture_filter_anisotropic");i.texParameterf(E,S.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(l.anisotropy,r.getMaxAnisotropy())),n.get(l).__currentAnisotropy=l.anisotropy}}}function Fe(E,l){let S=!1;E.__webglInit===void 0&&(E.__webglInit=!0,l.addEventListener("dispose",U));const w=l.source;let C=p.get(w);C===void 0&&(C={},p.set(w,C));const b=Y(l);if(b!==E.__cacheKey){C[b]===void 0&&(C[b]={texture:i.createTexture(),usedTimes:0},s.memory.textures++,S=!0),C[b].usedTimes++;const Z=C[E.__cacheKey];Z!==void 0&&(C[E.__cacheKey].usedTimes--,Z.usedTimes===0&&y(l)),E.__cacheKey=b,E.__webglTexture=C[b].texture}return S}function q(E,l,S){let w=i.TEXTURE_2D;(l.isDataArrayTexture||l.isCompressedArrayTexture)&&(w=i.TEXTURE_2D_ARRAY),l.isData3DTexture&&(w=i.TEXTURE_3D);const C=Fe(E,l),b=l.source;t.bindTexture(w,E.__webglTexture,i.TEXTURE0+S);const Z=n.get(b);if(b.version!==Z.__version||C===!0){t.activeTexture(i.TEXTURE0+S);const H=$e.getPrimaries($e.workingColorSpace),J=l.colorSpace===""?null:$e.getPrimaries(l.colorSpace),ge=l.colorSpace===""||H===J?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,l.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,l.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,l.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ge);let te=M(l.image,!1,r.maxTextureSize);te=Ye(l,te);const oe=a.convert(l.format,l.colorSpace),he=a.convert(l.type);let Te=A(l.internalFormat,oe,he,l.colorSpace,l.isVideoTexture);ve(w,l);let me;const Ae=l.mipmaps,_e=l.isVideoTexture!==!0,ce=Z.__version===void 0||C===!0,P=b.dataReady,le=G(l,te);if(l.isDepthTexture)Te=T(l.format===1027,l.type),ce&&(_e?t.texStorage2D(i.TEXTURE_2D,1,Te,te.width,te.height):t.texImage2D(i.TEXTURE_2D,0,Te,te.width,te.height,0,oe,he,null));else if(l.isDataTexture)if(Ae.length>0){_e&&ce&&t.texStorage2D(i.TEXTURE_2D,le,Te,Ae[0].width,Ae[0].height);for(let z=0,K=Ae.length;z<K;z++)me=Ae[z],_e?P&&t.texSubImage2D(i.TEXTURE_2D,z,0,0,me.width,me.height,oe,he,me.data):t.texImage2D(i.TEXTURE_2D,z,Te,me.width,me.height,0,oe,he,me.data);l.generateMipmaps=!1}else _e?(ce&&t.texStorage2D(i.TEXTURE_2D,le,Te,te.width,te.height),P&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,te.width,te.height,oe,he,te.data)):t.texImage2D(i.TEXTURE_2D,0,Te,te.width,te.height,0,oe,he,te.data);else if(l.isCompressedTexture)if(l.isCompressedArrayTexture){_e&&ce&&t.texStorage3D(i.TEXTURE_2D_ARRAY,le,Te,Ae[0].width,Ae[0].height,te.depth);for(let z=0,K=Ae.length;z<K;z++)if(me=Ae[z],l.format!==1023)if(oe!==null)if(_e){if(P)if(l.layerUpdates.size>0){const ae=Pa(me.width,me.height,l.format,l.type);for(const de of l.layerUpdates){const Ue=me.data.subarray(de*ae/me.data.BYTES_PER_ELEMENT,(de+1)*ae/me.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,z,0,0,de,me.width,me.height,1,oe,Ue)}l.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,z,0,0,0,me.width,me.height,te.depth,oe,me.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,z,Te,me.width,me.height,te.depth,0,me.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else _e?P&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,z,0,0,0,me.width,me.height,te.depth,oe,he,me.data):t.texImage3D(i.TEXTURE_2D_ARRAY,z,Te,me.width,me.height,te.depth,0,oe,he,me.data)}else{_e&&ce&&t.texStorage2D(i.TEXTURE_2D,le,Te,Ae[0].width,Ae[0].height);for(let z=0,K=Ae.length;z<K;z++)me=Ae[z],l.format!==1023?oe!==null?_e?P&&t.compressedTexSubImage2D(i.TEXTURE_2D,z,0,0,me.width,me.height,oe,me.data):t.compressedTexImage2D(i.TEXTURE_2D,z,Te,me.width,me.height,0,me.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):_e?P&&t.texSubImage2D(i.TEXTURE_2D,z,0,0,me.width,me.height,oe,he,me.data):t.texImage2D(i.TEXTURE_2D,z,Te,me.width,me.height,0,oe,he,me.data)}else if(l.isDataArrayTexture)if(_e){if(ce&&t.texStorage3D(i.TEXTURE_2D_ARRAY,le,Te,te.width,te.height,te.depth),P)if(l.layerUpdates.size>0){const z=Pa(te.width,te.height,l.format,l.type);for(const K of l.layerUpdates){const ae=te.data.subarray(K*z/te.data.BYTES_PER_ELEMENT,(K+1)*z/te.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,K,te.width,te.height,1,oe,he,ae)}l.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,te.width,te.height,te.depth,oe,he,te.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Te,te.width,te.height,te.depth,0,oe,he,te.data);else if(l.isData3DTexture)_e?(ce&&t.texStorage3D(i.TEXTURE_3D,le,Te,te.width,te.height,te.depth),P&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,te.width,te.height,te.depth,oe,he,te.data)):t.texImage3D(i.TEXTURE_3D,0,Te,te.width,te.height,te.depth,0,oe,he,te.data);else if(l.isFramebufferTexture){if(ce)if(_e)t.texStorage2D(i.TEXTURE_2D,le,Te,te.width,te.height);else{let z=te.width,K=te.height;for(let ae=0;ae<le;ae++)t.texImage2D(i.TEXTURE_2D,ae,Te,z,K,0,oe,he,null),z>>=1,K>>=1}}else if(Ae.length>0){if(_e&&ce){const z=we(Ae[0]);t.texStorage2D(i.TEXTURE_2D,le,Te,z.width,z.height)}for(let z=0,K=Ae.length;z<K;z++)me=Ae[z],_e?P&&t.texSubImage2D(i.TEXTURE_2D,z,0,0,oe,he,me):t.texImage2D(i.TEXTURE_2D,z,Te,oe,he,me);l.generateMipmaps=!1}else if(_e){if(ce){const z=we(te);t.texStorage2D(i.TEXTURE_2D,le,Te,z.width,z.height)}P&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,oe,he,te)}else t.texImage2D(i.TEXTURE_2D,0,Te,oe,he,te);m(l)&&h(w),Z.__version=b.version,l.onUpdate&&l.onUpdate(l)}E.__version=l.version}function ie(E,l,S){if(l.image.length!==6)return;const w=Fe(E,l),C=l.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+S);const b=n.get(C);if(C.version!==b.__version||w===!0){t.activeTexture(i.TEXTURE0+S);const Z=$e.getPrimaries($e.workingColorSpace),H=l.colorSpace===""?null:$e.getPrimaries(l.colorSpace),J=l.colorSpace===""||Z===H?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,l.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,l.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,l.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);const ge=l.isCompressedTexture||l.image[0].isCompressedTexture,te=l.image[0]&&l.image[0].isDataTexture,oe=[];for(let K=0;K<6;K++)!ge&&!te?oe[K]=M(l.image[K],!0,r.maxCubemapSize):oe[K]=te?l.image[K].image:l.image[K],oe[K]=Ye(l,oe[K]);const he=oe[0],Te=a.convert(l.format,l.colorSpace),me=a.convert(l.type),Ae=A(l.internalFormat,Te,me,l.colorSpace),_e=l.isVideoTexture!==!0,ce=b.__version===void 0||w===!0,P=C.dataReady;let le=G(l,he);ve(i.TEXTURE_CUBE_MAP,l);let z;if(ge){_e&&ce&&t.texStorage2D(i.TEXTURE_CUBE_MAP,le,Ae,he.width,he.height);for(let K=0;K<6;K++){z=oe[K].mipmaps;for(let ae=0;ae<z.length;ae++){const de=z[ae];l.format!==1023?Te!==null?_e?P&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ae,0,0,de.width,de.height,Te,de.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ae,Ae,de.width,de.height,0,de.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):_e?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ae,0,0,de.width,de.height,Te,me,de.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ae,Ae,de.width,de.height,0,Te,me,de.data)}}}else{if(z=l.mipmaps,_e&&ce){z.length>0&&le++;const K=we(oe[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,le,Ae,K.width,K.height)}for(let K=0;K<6;K++)if(te){_e?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,oe[K].width,oe[K].height,Te,me,oe[K].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ae,oe[K].width,oe[K].height,0,Te,me,oe[K].data);for(let ae=0;ae<z.length;ae++){const Ue=z[ae].image[K].image;_e?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ae+1,0,0,Ue.width,Ue.height,Te,me,Ue.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ae+1,Ae,Ue.width,Ue.height,0,Te,me,Ue.data)}}else{_e?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Te,me,oe[K]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ae,Te,me,oe[K]);for(let ae=0;ae<z.length;ae++){const de=z[ae];_e?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ae+1,0,0,Te,me,de.image[K]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ae+1,Ae,Te,me,de.image[K])}}}m(l)&&h(i.TEXTURE_CUBE_MAP),b.__version=C.version,l.onUpdate&&l.onUpdate(l)}E.__version=l.version}function Se(E,l,S,w,C,b){const Z=a.convert(S.format,S.colorSpace),H=a.convert(S.type),J=A(S.internalFormat,Z,H,S.colorSpace),ge=n.get(l),te=n.get(S);if(te.__renderTarget=l,!ge.__hasExternalTextures){const oe=Math.max(1,l.width>>b),he=Math.max(1,l.height>>b);C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY?t.texImage3D(C,b,J,oe,he,l.depth,0,Z,H,null):t.texImage2D(C,b,J,oe,he,0,Z,H,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),Ne(l)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,w,C,te.__webglTexture,0,ze(l)):(C===i.TEXTURE_2D||C>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&C<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,w,C,te.__webglTexture,b),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ne(E,l,S){if(i.bindRenderbuffer(i.RENDERBUFFER,E),l.depthBuffer){const w=l.depthTexture,C=w&&w.isDepthTexture?w.type:null,b=T(l.stencilBuffer,C),Z=l.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,H=ze(l);Ne(l)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,H,b,l.width,l.height):S?i.renderbufferStorageMultisample(i.RENDERBUFFER,H,b,l.width,l.height):i.renderbufferStorage(i.RENDERBUFFER,b,l.width,l.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,E)}else{const w=l.textures;for(let C=0;C<w.length;C++){const b=w[C],Z=a.convert(b.format,b.colorSpace),H=a.convert(b.type),J=A(b.internalFormat,Z,H,b.colorSpace),ge=ze(l);S&&Ne(l)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,ge,J,l.width,l.height):Ne(l)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ge,J,l.width,l.height):i.renderbufferStorage(i.RENDERBUFFER,J,l.width,l.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ye(E,l){if(l&&l.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(l.depthTexture&&l.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const w=n.get(l.depthTexture);w.__renderTarget=l,(!w.__webglTexture||l.depthTexture.image.width!==l.width||l.depthTexture.image.height!==l.height)&&(l.depthTexture.image.width=l.width,l.depthTexture.image.height=l.height,l.depthTexture.needsUpdate=!0),re(l.depthTexture,0);const C=w.__webglTexture,b=ze(l);if(l.depthTexture.format===1026)Ne(l)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,C,0,b):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,C,0);else if(l.depthTexture.format===1027)Ne(l)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,C,0,b):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,C,0);else throw new Error("Unknown depthTexture format")}function Re(E){const l=n.get(E),S=E.isWebGLCubeRenderTarget===!0;if(l.__boundDepthTexture!==E.depthTexture){const w=E.depthTexture;if(l.__depthDisposeCallback&&l.__depthDisposeCallback(),w){const C=()=>{delete l.__boundDepthTexture,delete l.__depthDisposeCallback,w.removeEventListener("dispose",C)};w.addEventListener("dispose",C),l.__depthDisposeCallback=C}l.__boundDepthTexture=w}if(E.depthTexture&&!l.__autoAllocateDepthBuffer){if(S)throw new Error("target.depthTexture not supported in Cube render targets");ye(l.__webglFramebuffer,E)}else if(S){l.__webglDepthbuffer=[];for(let w=0;w<6;w++)if(t.bindFramebuffer(i.FRAMEBUFFER,l.__webglFramebuffer[w]),l.__webglDepthbuffer[w]===void 0)l.__webglDepthbuffer[w]=i.createRenderbuffer(),ne(l.__webglDepthbuffer[w],E,!1);else{const C=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,b=l.__webglDepthbuffer[w];i.bindRenderbuffer(i.RENDERBUFFER,b),i.framebufferRenderbuffer(i.FRAMEBUFFER,C,i.RENDERBUFFER,b)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,l.__webglFramebuffer),l.__webglDepthbuffer===void 0)l.__webglDepthbuffer=i.createRenderbuffer(),ne(l.__webglDepthbuffer,E,!1);else{const w=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,C=l.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,C),i.framebufferRenderbuffer(i.FRAMEBUFFER,w,i.RENDERBUFFER,C)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ie(E,l,S){const w=n.get(E);l!==void 0&&Se(w.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),S!==void 0&&Re(E)}function Xe(E){const l=E.texture,S=n.get(E),w=n.get(l);E.addEventListener("dispose",L);const C=E.textures,b=E.isWebGLCubeRenderTarget===!0,Z=C.length>1;if(Z||(w.__webglTexture===void 0&&(w.__webglTexture=i.createTexture()),w.__version=l.version,s.memory.textures++),b){S.__webglFramebuffer=[];for(let H=0;H<6;H++)if(l.mipmaps&&l.mipmaps.length>0){S.__webglFramebuffer[H]=[];for(let J=0;J<l.mipmaps.length;J++)S.__webglFramebuffer[H][J]=i.createFramebuffer()}else S.__webglFramebuffer[H]=i.createFramebuffer()}else{if(l.mipmaps&&l.mipmaps.length>0){S.__webglFramebuffer=[];for(let H=0;H<l.mipmaps.length;H++)S.__webglFramebuffer[H]=i.createFramebuffer()}else S.__webglFramebuffer=i.createFramebuffer();if(Z)for(let H=0,J=C.length;H<J;H++){const ge=n.get(C[H]);ge.__webglTexture===void 0&&(ge.__webglTexture=i.createTexture(),s.memory.textures++)}if(E.samples>0&&Ne(E)===!1){S.__webglMultisampledFramebuffer=i.createFramebuffer(),S.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,S.__webglMultisampledFramebuffer);for(let H=0;H<C.length;H++){const J=C[H];S.__webglColorRenderbuffer[H]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,S.__webglColorRenderbuffer[H]);const ge=a.convert(J.format,J.colorSpace),te=a.convert(J.type),oe=A(J.internalFormat,ge,te,J.colorSpace,E.isXRRenderTarget===!0),he=ze(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,he,oe,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+H,i.RENDERBUFFER,S.__webglColorRenderbuffer[H])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(S.__webglDepthRenderbuffer=i.createRenderbuffer(),ne(S.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(b){t.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture),ve(i.TEXTURE_CUBE_MAP,l);for(let H=0;H<6;H++)if(l.mipmaps&&l.mipmaps.length>0)for(let J=0;J<l.mipmaps.length;J++)Se(S.__webglFramebuffer[H][J],E,l,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+H,J);else Se(S.__webglFramebuffer[H],E,l,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+H,0);m(l)&&h(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Z){for(let H=0,J=C.length;H<J;H++){const ge=C[H],te=n.get(ge);t.bindTexture(i.TEXTURE_2D,te.__webglTexture),ve(i.TEXTURE_2D,ge),Se(S.__webglFramebuffer,E,ge,i.COLOR_ATTACHMENT0+H,i.TEXTURE_2D,0),m(ge)&&h(i.TEXTURE_2D)}t.unbindTexture()}else{let H=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(H=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(H,w.__webglTexture),ve(H,l),l.mipmaps&&l.mipmaps.length>0)for(let J=0;J<l.mipmaps.length;J++)Se(S.__webglFramebuffer[J],E,l,i.COLOR_ATTACHMENT0,H,J);else Se(S.__webglFramebuffer,E,l,i.COLOR_ATTACHMENT0,H,0);m(l)&&h(H),t.unbindTexture()}E.depthBuffer&&Re(E)}function Be(E){const l=E.textures;for(let S=0,w=l.length;S<w;S++){const C=l[S];if(m(C)){const b=R(E),Z=n.get(C).__webglTexture;t.bindTexture(b,Z),h(b),t.unbindTexture()}}}const Me=[],I=[];function et(E){if(E.samples>0){if(Ne(E)===!1){const l=E.textures,S=E.width,w=E.height;let C=i.COLOR_BUFFER_BIT;const b=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Z=n.get(E),H=l.length>1;if(H)for(let J=0;J<l.length;J++)t.bindFramebuffer(i.FRAMEBUFFER,Z.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+J,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Z.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+J,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Z.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Z.__webglFramebuffer);for(let J=0;J<l.length;J++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(C|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(C|=i.STENCIL_BUFFER_BIT)),H){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Z.__webglColorRenderbuffer[J]);const ge=n.get(l[J]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ge,0)}i.blitFramebuffer(0,0,S,w,0,0,S,w,C,i.NEAREST),c===!0&&(Me.length=0,I.length=0,Me.push(i.COLOR_ATTACHMENT0+J),E.depthBuffer&&E.resolveDepthBuffer===!1&&(Me.push(b),I.push(b),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,I)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Me))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),H)for(let J=0;J<l.length;J++){t.bindFramebuffer(i.FRAMEBUFFER,Z.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+J,i.RENDERBUFFER,Z.__webglColorRenderbuffer[J]);const ge=n.get(l[J]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Z.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+J,i.TEXTURE_2D,ge,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Z.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&c){const l=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[l])}}}function ze(E){return Math.min(r.maxSamples,E.samples)}function Ne(E){const l=n.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&l.__useRenderToTexture!==!1}function be(E){const l=s.render.frame;d.get(E)!==l&&(d.set(E,l),E.update())}function Ye(E,l){const S=E.colorSpace,w=E.format,C=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||S!==Xt&&S!==""&&($e.getTransfer(S)===tt?(w!==1023||C!==1009)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",S)),l}function we(E){return typeof HTMLImageElement!="undefined"&&E instanceof HTMLImageElement?(u.width=E.naturalWidth||E.width,u.height=E.naturalHeight||E.height):typeof VideoFrame!="undefined"&&E instanceof VideoFrame?(u.width=E.displayWidth,u.height=E.displayHeight):(u.width=E.width,u.height=E.height),u}this.allocateTextureUnit=W,this.resetTextureUnits=j,this.setTexture2D=re,this.setTexture2DArray=$,this.setTexture3D=se,this.setTextureCube=X,this.rebindTextures=Ie,this.setupRenderTarget=Xe,this.updateRenderTargetMipmap=Be,this.updateMultisampleRenderTarget=et,this.setupDepthRenderbuffer=Re,this.setupFrameBufferTexture=Se,this.useMultisampledRTT=Ne}function au(i,e){function t(n,r=""){let a;const s=$e.getTransfer(r);if(n===1009)return i.UNSIGNED_BYTE;if(n===1017)return i.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return i.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===1010)return i.BYTE;if(n===1011)return i.SHORT;if(n===1012)return i.UNSIGNED_SHORT;if(n===1013)return i.INT;if(n===1014)return i.UNSIGNED_INT;if(n===1015)return i.FLOAT;if(n===1016)return i.HALF_FLOAT;if(n===1021)return i.ALPHA;if(n===1022)return i.RGB;if(n===1023)return i.RGBA;if(n===1024)return i.LUMINANCE;if(n===1025)return i.LUMINANCE_ALPHA;if(n===1026)return i.DEPTH_COMPONENT;if(n===1027)return i.DEPTH_STENCIL;if(n===1028)return i.RED;if(n===1029)return i.RED_INTEGER;if(n===1030)return i.RG;if(n===1031)return i.RG_INTEGER;if(n===1033)return i.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779)if(s===tt)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(n===33776)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(n===33776)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===35840||n===35841||n===35842||n===35843)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(n===35840)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===36196||n===37492||n===37496)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(n===36196||n===37492)return s===tt?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(n===37496)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(n===37808)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return s===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===36492||n===36494||n===36495)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(n===36492)return s===tt?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===36283||n===36284||n===36285||n===36286)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(n===36492)return a.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===1020?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}class su extends yt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Qn extends Ct{constructor(){super(),this.isGroup=!0,this.type="Group"}}const ou={type:"move"};class pr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Qn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Qn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Qn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,a=null,s=null;const o=this._targetRay,c=this._grip,u=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(u&&e.hand){s=!0;for(const M of e.hand.values()){const m=t.getJointPose(M,n),h=this._getHandJoint(u,M);m!==null&&(h.matrix.fromArray(m.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=m.radius),h.visible=m!==null}const d=u.joints["index-finger-tip"],f=u.joints["thumb-tip"],p=d.position.distanceTo(f.position),_=.02,v=.005;u.inputState.pinching&&p>_+v?(u.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!u.inputState.pinching&&p<=_-v&&(u.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,n),a!==null&&(c.matrix.fromArray(a.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,a.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(a.linearVelocity)):c.hasLinearVelocity=!1,a.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(a.angularVelocity)):c.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&a!==null&&(r=a),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(ou)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=a!==null),u!==null&&(u.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Qn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const lu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,cu=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class uu{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){const r=new _t,a=e.properties.get(r);a.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new Mt({vertexShader:lu,fragmentShader:cu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new bt(new On(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class hu extends yn{constructor(e,t){super();const n=this;let r=null,a=1,s=null,o="local-floor",c=1,u=null,d=null,f=null,p=null,_=null,v=null;const M=new uu,m=t.getContextAttributes();let h=null,R=null;const A=[],T=[],G=new nt;let U=null;const L=new yt;L.viewport=new lt;const B=new yt;B.viewport=new lt;const y=[L,B],x=new su;let D=null,j=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let ie=A[q];return ie===void 0&&(ie=new pr,A[q]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function(q){let ie=A[q];return ie===void 0&&(ie=new pr,A[q]=ie),ie.getGripSpace()},this.getHand=function(q){let ie=A[q];return ie===void 0&&(ie=new pr,A[q]=ie),ie.getHandSpace()};function W(q){const ie=T.indexOf(q.inputSource);if(ie===-1)return;const Se=A[ie];Se!==void 0&&(Se.update(q.inputSource,q.frame,u||s),Se.dispatchEvent({type:q.type,data:q.inputSource}))}function Y(){r.removeEventListener("select",W),r.removeEventListener("selectstart",W),r.removeEventListener("selectend",W),r.removeEventListener("squeeze",W),r.removeEventListener("squeezestart",W),r.removeEventListener("squeezeend",W),r.removeEventListener("end",Y),r.removeEventListener("inputsourceschange",re);for(let q=0;q<A.length;q++){const ie=T[q];ie!==null&&(T[q]=null,A[q].disconnect(ie))}D=null,j=null,M.reset(),e.setRenderTarget(h),_=null,p=null,f=null,r=null,R=null,Fe.stop(),n.isPresenting=!1,e.setPixelRatio(U),e.setSize(G.width,G.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){a=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return u||s},this.setReferenceSpace=function(q){u=q},this.getBaseLayer=function(){return p!==null?p:_},this.getBinding=function(){return f},this.getFrame=function(){return v},this.getSession=function(){return r},this.setSession=async function(q){if(r=q,r!==null){if(h=e.getRenderTarget(),r.addEventListener("select",W),r.addEventListener("selectstart",W),r.addEventListener("selectend",W),r.addEventListener("squeeze",W),r.addEventListener("squeezestart",W),r.addEventListener("squeezeend",W),r.addEventListener("end",Y),r.addEventListener("inputsourceschange",re),m.xrCompatible!==!0&&await t.makeXRCompatible(),U=e.getPixelRatio(),e.getSize(G),r.renderState.layers===void 0){const ie={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:a};_=new XRWebGLLayer(r,t,ie),r.updateRenderState({baseLayer:_}),e.setPixelRatio(1),e.setSize(_.framebufferWidth,_.framebufferHeight,!1),R=new Ft(_.framebufferWidth,_.framebufferHeight,{format:1023,type:1009,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil})}else{let ie=null,Se=null,ne=null;m.depth&&(ne=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=m.stencil?1027:1026,Se=m.stencil?1020:1014);const ye={colorFormat:t.RGBA8,depthFormat:ne,scaleFactor:a};f=new XRWebGLBinding(r,t),p=f.createProjectionLayer(ye),r.updateRenderState({layers:[p]}),e.setPixelRatio(1),e.setSize(p.textureWidth,p.textureHeight,!1),R=new Ft(p.textureWidth,p.textureHeight,{format:1023,type:1009,depthTexture:new la(p.textureWidth,p.textureHeight,Se,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1})}R.isXRRenderTarget=!0,this.setFoveation(c),u=null,s=await r.requestReferenceSpace(o),Fe.setContext(r),Fe.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return M.getDepthTexture()};function re(q){for(let ie=0;ie<q.removed.length;ie++){const Se=q.removed[ie],ne=T.indexOf(Se);ne>=0&&(T[ne]=null,A[ne].disconnect(Se))}for(let ie=0;ie<q.added.length;ie++){const Se=q.added[ie];let ne=T.indexOf(Se);if(ne===-1){for(let Re=0;Re<A.length;Re++)if(Re>=T.length){T.push(Se),ne=Re;break}else if(T[Re]===null){T[Re]=Se,ne=Re;break}if(ne===-1)break}const ye=A[ne];ye&&ye.connect(Se)}}const $=new O,se=new O;function X(q,ie,Se){$.setFromMatrixPosition(ie.matrixWorld),se.setFromMatrixPosition(Se.matrixWorld);const ne=$.distanceTo(se),ye=ie.projectionMatrix.elements,Re=Se.projectionMatrix.elements,Ie=ye[14]/(ye[10]-1),Xe=ye[14]/(ye[10]+1),Be=(ye[9]+1)/ye[5],Me=(ye[9]-1)/ye[5],I=(ye[8]-1)/ye[0],et=(Re[8]+1)/Re[0],ze=Ie*I,Ne=Ie*et,be=ne/(-I+et),Ye=be*-I;if(ie.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Ye),q.translateZ(be),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),ye[10]===-1)q.projectionMatrix.copy(ie.projectionMatrix),q.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{const we=Ie+be,E=Xe+be,l=ze-Ye,S=Ne+(ne-Ye),w=Be*Xe/E*we,C=Me*Xe/E*we;q.projectionMatrix.makePerspective(l,S,w,C,we,E),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function ee(q,ie){ie===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(ie.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(r===null)return;let ie=q.near,Se=q.far;M.texture!==null&&(M.depthNear>0&&(ie=M.depthNear),M.depthFar>0&&(Se=M.depthFar)),x.near=B.near=L.near=ie,x.far=B.far=L.far=Se,(D!==x.near||j!==x.far)&&(r.updateRenderState({depthNear:x.near,depthFar:x.far}),D=x.near,j=x.far),L.layers.mask=q.layers.mask|2,B.layers.mask=q.layers.mask|4,x.layers.mask=L.layers.mask|B.layers.mask;const ne=q.parent,ye=x.cameras;ee(x,ne);for(let Re=0;Re<ye.length;Re++)ee(ye[Re],ne);ye.length===2?X(x,L,B):x.projectionMatrix.copy(L.projectionMatrix),Q(q,x,ne)};function Q(q,ie,Se){Se===null?q.matrix.copy(ie.matrixWorld):(q.matrix.copy(Se.matrixWorld),q.matrix.invert(),q.matrix.multiply(ie.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(ie.projectionMatrix),q.projectionMatrixInverse.copy(ie.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Fi*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(p===null&&_===null))return c},this.setFoveation=function(q){c=q,p!==null&&(p.fixedFoveation=q),_!==null&&_.fixedFoveation!==void 0&&(_.fixedFoveation=q)},this.hasDepthSensing=function(){return M.texture!==null},this.getDepthSensingMesh=function(){return M.getMesh(x)};let ue=null;function ve(q,ie){if(d=ie.getViewerPose(u||s),v=ie,d!==null){const Se=d.views;_!==null&&(e.setRenderTargetFramebuffer(R,_.framebuffer),e.setRenderTarget(R));let ne=!1;Se.length!==x.cameras.length&&(x.cameras.length=0,ne=!0);for(let Re=0;Re<Se.length;Re++){const Ie=Se[Re];let Xe=null;if(_!==null)Xe=_.getViewport(Ie);else{const Me=f.getViewSubImage(p,Ie);Xe=Me.viewport,Re===0&&(e.setRenderTargetTextures(R,Me.colorTexture,p.ignoreDepthValues?void 0:Me.depthStencilTexture),e.setRenderTarget(R))}let Be=y[Re];Be===void 0&&(Be=new yt,Be.layers.enable(Re),Be.viewport=new lt,y[Re]=Be),Be.matrix.fromArray(Ie.transform.matrix),Be.matrix.decompose(Be.position,Be.quaternion,Be.scale),Be.projectionMatrix.fromArray(Ie.projectionMatrix),Be.projectionMatrixInverse.copy(Be.projectionMatrix).invert(),Be.viewport.set(Xe.x,Xe.y,Xe.width,Xe.height),Re===0&&(x.matrix.copy(Be.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),ne===!0&&x.cameras.push(Be)}const ye=r.enabledFeatures;if(ye&&ye.includes("depth-sensing")){const Re=f.getDepthInformation(Se[0]);Re&&Re.isValid&&Re.texture&&M.init(e,Re,r.renderState)}}for(let Se=0;Se<A.length;Se++){const ne=T[Se],ye=A[Se];ne!==null&&ye!==void 0&&ye.update(ne,ie,u||s)}ue&&ue(q,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),v=null}const Fe=new ea;Fe.setAnimationLoop(ve),this.setAnimationLoop=function(q){ue=q},this.dispose=function(){}}}const Mn=new Ot,du=new it;function fu(i,e){function t(m,h){m.matrixAutoUpdate===!0&&m.updateMatrix(),h.value.copy(m.matrix)}function n(m,h){h.color.getRGB(m.fogColor.value,$r(i)),h.isFog?(m.fogNear.value=h.near,m.fogFar.value=h.far):h.isFogExp2&&(m.fogDensity.value=h.density)}function r(m,h,R,A,T){h.isMeshBasicMaterial||h.isMeshLambertMaterial?a(m,h):h.isMeshToonMaterial?(a(m,h),f(m,h)):h.isMeshPhongMaterial?(a(m,h),d(m,h)):h.isMeshStandardMaterial?(a(m,h),p(m,h),h.isMeshPhysicalMaterial&&_(m,h,T)):h.isMeshMatcapMaterial?(a(m,h),v(m,h)):h.isMeshDepthMaterial?a(m,h):h.isMeshDistanceMaterial?(a(m,h),M(m,h)):h.isMeshNormalMaterial?a(m,h):h.isLineBasicMaterial?(s(m,h),h.isLineDashedMaterial&&o(m,h)):h.isPointsMaterial?c(m,h,R,A):h.isSpriteMaterial?u(m,h):h.isShadowMaterial?(m.color.value.copy(h.color),m.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function a(m,h){m.opacity.value=h.opacity,h.color&&m.diffuse.value.copy(h.color),h.emissive&&m.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.bumpMap&&(m.bumpMap.value=h.bumpMap,t(h.bumpMap,m.bumpMapTransform),m.bumpScale.value=h.bumpScale,h.side===1&&(m.bumpScale.value*=-1)),h.normalMap&&(m.normalMap.value=h.normalMap,t(h.normalMap,m.normalMapTransform),m.normalScale.value.copy(h.normalScale),h.side===1&&m.normalScale.value.negate()),h.displacementMap&&(m.displacementMap.value=h.displacementMap,t(h.displacementMap,m.displacementMapTransform),m.displacementScale.value=h.displacementScale,m.displacementBias.value=h.displacementBias),h.emissiveMap&&(m.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,m.emissiveMapTransform)),h.specularMap&&(m.specularMap.value=h.specularMap,t(h.specularMap,m.specularMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);const R=e.get(h),A=R.envMap,T=R.envMapRotation;A&&(m.envMap.value=A,Mn.copy(T),Mn.x*=-1,Mn.y*=-1,Mn.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===!1&&(Mn.y*=-1,Mn.z*=-1),m.envMapRotation.value.setFromMatrix4(du.makeRotationFromEuler(Mn)),m.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=h.reflectivity,m.ior.value=h.ior,m.refractionRatio.value=h.refractionRatio),h.lightMap&&(m.lightMap.value=h.lightMap,m.lightMapIntensity.value=h.lightMapIntensity,t(h.lightMap,m.lightMapTransform)),h.aoMap&&(m.aoMap.value=h.aoMap,m.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,m.aoMapTransform))}function s(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform))}function o(m,h){m.dashSize.value=h.dashSize,m.totalSize.value=h.dashSize+h.gapSize,m.scale.value=h.scale}function c(m,h,R,A){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.size.value=h.size*R,m.scale.value=A*.5,h.map&&(m.map.value=h.map,t(h.map,m.uvTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function u(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.rotation.value=h.rotation,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function d(m,h){m.specular.value.copy(h.specular),m.shininess.value=Math.max(h.shininess,1e-4)}function f(m,h){h.gradientMap&&(m.gradientMap.value=h.gradientMap)}function p(m,h){m.metalness.value=h.metalness,h.metalnessMap&&(m.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,m.metalnessMapTransform)),m.roughness.value=h.roughness,h.roughnessMap&&(m.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,m.roughnessMapTransform)),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity)}function _(m,h,R){m.ior.value=h.ior,h.sheen>0&&(m.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),m.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(m.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,m.sheenColorMapTransform)),h.sheenRoughnessMap&&(m.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,m.sheenRoughnessMapTransform))),h.clearcoat>0&&(m.clearcoat.value=h.clearcoat,m.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(m.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,m.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(m.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===1&&m.clearcoatNormalScale.value.negate())),h.dispersion>0&&(m.dispersion.value=h.dispersion),h.iridescence>0&&(m.iridescence.value=h.iridescence,m.iridescenceIOR.value=h.iridescenceIOR,m.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(m.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,m.iridescenceMapTransform)),h.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),h.transmission>0&&(m.transmission.value=h.transmission,m.transmissionSamplerMap.value=R.texture,m.transmissionSamplerSize.value.set(R.width,R.height),h.transmissionMap&&(m.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,m.transmissionMapTransform)),m.thickness.value=h.thickness,h.thicknessMap&&(m.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=h.attenuationDistance,m.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(m.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(m.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=h.specularIntensity,m.specularColor.value.copy(h.specularColor),h.specularColorMap&&(m.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,m.specularColorMapTransform)),h.specularIntensityMap&&(m.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,m.specularIntensityMapTransform))}function v(m,h){h.matcap&&(m.matcap.value=h.matcap)}function M(m,h){const R=e.get(h).light;m.referencePosition.value.setFromMatrixPosition(R.matrixWorld),m.nearDistance.value=R.shadow.camera.near,m.farDistance.value=R.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function pu(i,e,t,n){let r={},a={},s=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(R,A){const T=A.program;n.uniformBlockBinding(R,T)}function u(R,A){let T=r[R.id];T===void 0&&(v(R),T=d(R),r[R.id]=T,R.addEventListener("dispose",m));const G=A.program;n.updateUBOMapping(R,G);const U=e.render.frame;a[R.id]!==U&&(p(R),a[R.id]=U)}function d(R){const A=f();R.__bindingPointIndex=A;const T=i.createBuffer(),G=R.__size,U=R.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,G,U),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,A,T),T}function f(){for(let R=0;R<o;R++)if(s.indexOf(R)===-1)return s.push(R),R;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(R){const A=r[R.id],T=R.uniforms,G=R.__cache;i.bindBuffer(i.UNIFORM_BUFFER,A);for(let U=0,L=T.length;U<L;U++){const B=Array.isArray(T[U])?T[U]:[T[U]];for(let y=0,x=B.length;y<x;y++){const D=B[y];if(_(D,U,y,G)===!0){const j=D.__offset,W=Array.isArray(D.value)?D.value:[D.value];let Y=0;for(let re=0;re<W.length;re++){const $=W[re],se=M($);typeof $=="number"||typeof $=="boolean"?(D.__data[0]=$,i.bufferSubData(i.UNIFORM_BUFFER,j+Y,D.__data)):$.isMatrix3?(D.__data[0]=$.elements[0],D.__data[1]=$.elements[1],D.__data[2]=$.elements[2],D.__data[3]=0,D.__data[4]=$.elements[3],D.__data[5]=$.elements[4],D.__data[6]=$.elements[5],D.__data[7]=0,D.__data[8]=$.elements[6],D.__data[9]=$.elements[7],D.__data[10]=$.elements[8],D.__data[11]=0):($.toArray(D.__data,Y),Y+=se.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,j,D.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function _(R,A,T,G){const U=R.value,L=A+"_"+T;if(G[L]===void 0)return typeof U=="number"||typeof U=="boolean"?G[L]=U:G[L]=U.clone(),!0;{const B=G[L];if(typeof U=="number"||typeof U=="boolean"){if(B!==U)return G[L]=U,!0}else if(B.equals(U)===!1)return B.copy(U),!0}return!1}function v(R){const A=R.uniforms;let T=0;const G=16;for(let L=0,B=A.length;L<B;L++){const y=Array.isArray(A[L])?A[L]:[A[L]];for(let x=0,D=y.length;x<D;x++){const j=y[x],W=Array.isArray(j.value)?j.value:[j.value];for(let Y=0,re=W.length;Y<re;Y++){const $=W[Y],se=M($),X=T%G,ee=X%se.boundary,Q=X+ee;T+=ee,Q!==0&&G-Q<se.storage&&(T+=G-Q),j.__data=new Float32Array(se.storage/Float32Array.BYTES_PER_ELEMENT),j.__offset=T,T+=se.storage}}}const U=T%G;return U>0&&(T+=G-U),R.__size=T,R.__cache={},this}function M(R){const A={boundary:0,storage:0};return typeof R=="number"||typeof R=="boolean"?(A.boundary=4,A.storage=4):R.isVector2?(A.boundary=8,A.storage=8):R.isVector3||R.isColor?(A.boundary=16,A.storage=12):R.isVector4?(A.boundary=16,A.storage=16):R.isMatrix3?(A.boundary=48,A.storage=48):R.isMatrix4?(A.boundary=64,A.storage=64):R.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",R),A}function m(R){const A=R.target;A.removeEventListener("dispose",m);const T=s.indexOf(A.__bindingPointIndex);s.splice(T,1),i.deleteBuffer(r[A.id]),delete r[A.id],delete a[A.id]}function h(){for(const R in r)i.deleteBuffer(r[R]);s=[],r={},a={}}return{bind:c,update:u,dispose:h}}class mr{constructor(e={}){const{canvas:t=Na(),context:n=null,depth:r=!0,stencil:a=!1,alpha:s=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:u=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:f=!1,reverseDepthBuffer:p=!1}=e;this.isWebGLRenderer=!0;let _;if(n!==null){if(typeof WebGLRenderingContext!="undefined"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=n.getContextAttributes().alpha}else _=s;const v=new Uint32Array(4),M=new Int32Array(4);let m=null,h=null;const R=[],A=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Lt,this.toneMapping=0,this.toneMappingExposure=1;const T=this;let G=!1,U=0,L=0,B=null,y=-1,x=null;const D=new lt,j=new lt;let W=null;const Y=new Qe(0);let re=0,$=t.width,se=t.height,X=1,ee=null,Q=null;const ue=new lt(0,0,$,se),ve=new lt(0,0,$,se);let Fe=!1;const q=new Qr;let ie=!1,Se=!1;const ne=new it,ye=new it,Re=new O,Ie=new lt,Xe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Be=!1;function Me(){return B===null?X:1}let I=n;function et(g,F){return t.getContext(g,F)}try{const g={alpha:!0,depth:r,stencil:a,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:u,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r170"),t.addEventListener("webglcontextlost",K,!1),t.addEventListener("webglcontextrestored",ae,!1),t.addEventListener("webglcontextcreationerror",de,!1),I===null){const F="webgl2";if(I=et(F,g),I===null)throw et(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(g){throw console.error("THREE.WebGLRenderer: "+g.message),g}let ze,Ne,be,Ye,we,E,l,S,w,C,b,Z,H,J,ge,te,oe,he,Te,me,Ae,_e,ce,P;function le(){ze=new Ml(I),ze.init(),_e=new au(I,ze),Ne=new pl(I,ze,e,_e),be=new nu(I,ze),Ne.reverseDepthBuffer&&p&&be.buffers.depth.setReversed(!0),Ye=new yl(I),we=new Hc,E=new ru(I,ze,be,we,Ne,_e,Ye),l=new _l(T),S=new xl(T),w=new cs(I),ce=new dl(I,w),C=new Sl(I,w,Ye,ce),b=new Al(I,C,w,Ye),Te=new Tl(I,Ne,E),te=new ml(we),Z=new Gc(T,l,S,ze,Ne,ce,te),H=new fu(T,we),J=new kc,ge=new Zc(ze),he=new hl(T,l,S,be,b,_,c),oe=new eu(T,b,Ne),P=new pu(I,Ye,Ne,be),me=new fl(I,ze,Ye),Ae=new El(I,ze,Ye),Ye.programs=Z.programs,T.capabilities=Ne,T.extensions=ze,T.properties=we,T.renderLists=J,T.shadowMap=oe,T.state=be,T.info=Ye}le();const z=new hu(T,I);this.xr=z,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const g=ze.get("WEBGL_lose_context");g&&g.loseContext()},this.forceContextRestore=function(){const g=ze.get("WEBGL_lose_context");g&&g.restoreContext()},this.getPixelRatio=function(){return X},this.setPixelRatio=function(g){g!==void 0&&(X=g,this.setSize($,se,!1))},this.getSize=function(g){return g.set($,se)},this.setSize=function(g,F,V=!0){if(z.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}$=g,se=F,t.width=Math.floor(g*X),t.height=Math.floor(F*X),V===!0&&(t.style.width=g+"px",t.style.height=F+"px"),this.setViewport(0,0,g,F)},this.getDrawingBufferSize=function(g){return g.set($*X,se*X).floor()},this.setDrawingBufferSize=function(g,F,V){$=g,se=F,X=V,t.width=Math.floor(g*V),t.height=Math.floor(F*V),this.setViewport(0,0,g,F)},this.getCurrentViewport=function(g){return g.copy(D)},this.getViewport=function(g){return g.copy(ue)},this.setViewport=function(g,F,V,k){g.isVector4?ue.set(g.x,g.y,g.z,g.w):ue.set(g,F,V,k),be.viewport(D.copy(ue).multiplyScalar(X).round())},this.getScissor=function(g){return g.copy(ve)},this.setScissor=function(g,F,V,k){g.isVector4?ve.set(g.x,g.y,g.z,g.w):ve.set(g,F,V,k),be.scissor(j.copy(ve).multiplyScalar(X).round())},this.getScissorTest=function(){return Fe},this.setScissorTest=function(g){be.setScissorTest(Fe=g)},this.setOpaqueSort=function(g){ee=g},this.setTransparentSort=function(g){Q=g},this.getClearColor=function(g){return g.copy(he.getClearColor())},this.setClearColor=function(){he.setClearColor.apply(he,arguments)},this.getClearAlpha=function(){return he.getClearAlpha()},this.setClearAlpha=function(){he.setClearAlpha.apply(he,arguments)},this.clear=function(g=!0,F=!0,V=!0){let k=0;if(g){let N=!1;if(B!==null){const fe=B.texture.format;N=fe===1033||fe===1031||fe===1029}if(N){const fe=B.texture.type,Ee=fe===1009||fe===1014||fe===1012||fe===1020||fe===1017||fe===1018,Ce=he.getClearColor(),Pe=he.getClearAlpha(),Oe=Ce.r,ke=Ce.g,De=Ce.b;Ee?(v[0]=Oe,v[1]=ke,v[2]=De,v[3]=Pe,I.clearBufferuiv(I.COLOR,0,v)):(M[0]=Oe,M[1]=ke,M[2]=De,M[3]=Pe,I.clearBufferiv(I.COLOR,0,M))}else k|=I.COLOR_BUFFER_BIT}F&&(k|=I.DEPTH_BUFFER_BIT),V&&(k|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",K,!1),t.removeEventListener("webglcontextrestored",ae,!1),t.removeEventListener("webglcontextcreationerror",de,!1),J.dispose(),ge.dispose(),we.dispose(),l.dispose(),S.dispose(),b.dispose(),ce.dispose(),P.dispose(),Z.dispose(),z.dispose(),z.removeEventListener("sessionstart",ct),z.removeEventListener("sessionend",gt),at.stop()};function K(g){g.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),G=!0}function ae(){console.log("THREE.WebGLRenderer: Context Restored."),G=!1;const g=Ye.autoReset,F=oe.enabled,V=oe.autoUpdate,k=oe.needsUpdate,N=oe.type;le(),Ye.autoReset=g,oe.enabled=F,oe.autoUpdate=V,oe.needsUpdate=k,oe.type=N}function de(g){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",g.statusMessage)}function Ue(g){const F=g.target;F.removeEventListener("dispose",Ue),pe(F)}function pe(g){Ge(g),we.remove(g)}function Ge(g){const F=we.get(g).programs;F!==void 0&&(F.forEach(function(V){Z.releaseProgram(V)}),g.isShaderMaterial&&Z.releaseShaderCache(g))}this.renderBufferDirect=function(g,F,V,k,N,fe){F===null&&(F=Xe);const Ee=N.isMesh&&N.matrixWorld.determinant()<0,Ce=Su(g,F,V,k,N);be.setMaterial(k,Ee);let Pe=V.index,Oe=1;if(k.wireframe===!0){if(Pe=C.getWireframeAttribute(V),Pe===void 0)return;Oe=2}const ke=V.drawRange,De=V.attributes.position;let Ze=ke.start*Oe,rt=(ke.start+ke.count)*Oe;fe!==null&&(Ze=Math.max(Ze,fe.start*Oe),rt=Math.min(rt,(fe.start+fe.count)*Oe)),Pe!==null?(Ze=Math.max(Ze,0),rt=Math.min(rt,Pe.count)):De!=null&&(Ze=Math.max(Ze,0),rt=Math.min(rt,De.count));const st=rt-Ze;if(st<0||st===1/0)return;ce.setup(N,k,Ce,V,Pe);let wt,Ke=me;if(Pe!==null&&(wt=w.get(Pe),Ke=Ae,Ke.setIndex(wt)),N.isMesh)k.wireframe===!0?(be.setLineWidth(k.wireframeLinewidth*Me()),Ke.setMode(I.LINES)):Ke.setMode(I.TRIANGLES);else if(N.isLine){let Le=k.linewidth;Le===void 0&&(Le=1),be.setLineWidth(Le*Me()),N.isLineSegments?Ke.setMode(I.LINES):N.isLineLoop?Ke.setMode(I.LINE_LOOP):Ke.setMode(I.LINE_STRIP)}else N.isPoints?Ke.setMode(I.POINTS):N.isSprite&&Ke.setMode(I.TRIANGLES);if(N.isBatchedMesh)if(N._multiDrawInstances!==null)Ke.renderMultiDrawInstances(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount,N._multiDrawInstances);else if(ze.get("WEBGL_multi_draw"))Ke.renderMultiDraw(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount);else{const Le=N._multiDrawStarts,tn=N._multiDrawCounts,Je=N._multiDrawCount,Ht=Pe?w.get(Pe).bytesPerElement:1,Vn=we.get(k).currentProgram.getUniforms();for(let Dt=0;Dt<Je;Dt++)Vn.setValue(I,"_gl_DrawID",Dt),Ke.render(Le[Dt]/Ht,tn[Dt])}else if(N.isInstancedMesh)Ke.renderInstances(Ze,st,N.count);else if(V.isInstancedBufferGeometry){const Le=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,tn=Math.min(V.instanceCount,Le);Ke.renderInstances(Ze,st,tn)}else Ke.render(Ze,st)};function He(g,F,V){g.transparent===!0&&g.side===2&&g.forceSinglePass===!1?(g.side=1,g.needsUpdate=!0,en(g,F,V),g.side=0,g.needsUpdate=!0,en(g,F,V),g.side=2):en(g,F,V)}this.compile=function(g,F,V=null){V===null&&(V=g),h=ge.get(V),h.init(F),A.push(h),V.traverseVisible(function(N){N.isLight&&N.layers.test(F.layers)&&(h.pushLight(N),N.castShadow&&h.pushShadow(N))}),g!==V&&g.traverseVisible(function(N){N.isLight&&N.layers.test(F.layers)&&(h.pushLight(N),N.castShadow&&h.pushShadow(N))}),h.setupLights();const k=new Set;return g.traverse(function(N){if(!(N.isMesh||N.isPoints||N.isLine||N.isSprite))return;const fe=N.material;if(fe)if(Array.isArray(fe))for(let Ee=0;Ee<fe.length;Ee++){const Ce=fe[Ee];He(Ce,V,N),k.add(Ce)}else He(fe,V,N),k.add(fe)}),A.pop(),h=null,k},this.compileAsync=function(g,F,V=null){const k=this.compile(g,F,V);return new Promise(N=>{function fe(){if(k.forEach(function(Ee){we.get(Ee).currentProgram.isReady()&&k.delete(Ee)}),k.size===0){N(g);return}setTimeout(fe,10)}ze.get("KHR_parallel_shader_compile")!==null?fe():setTimeout(fe,10)})};let je=null;function qe(g){je&&je(g)}function ct(){at.stop()}function gt(){at.start()}const at=new ea;at.setAnimationLoop(qe),typeof self!="undefined"&&at.setContext(self),this.setAnimationLoop=function(g){je=g,z.setAnimationLoop(g),g===null?at.stop():at.start()},z.addEventListener("sessionstart",ct),z.addEventListener("sessionend",gt),this.render=function(g,F){if(F!==void 0&&F.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(G===!0)return;if(g.matrixWorldAutoUpdate===!0&&g.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),z.enabled===!0&&z.isPresenting===!0&&(z.cameraAutoUpdate===!0&&z.updateCamera(F),F=z.getCamera()),g.isScene===!0&&g.onBeforeRender(T,g,F,B),h=ge.get(g,A.length),h.init(F),A.push(h),ye.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),q.setFromProjectionMatrix(ye),Se=this.localClippingEnabled,ie=te.init(this.clippingPlanes,Se),m=J.get(g,R.length),m.init(),R.push(m),z.enabled===!0&&z.isPresenting===!0){const fe=T.xr.getDepthSensingMesh();fe!==null&&pt(fe,F,-1/0,T.sortObjects)}pt(g,F,0,T.sortObjects),m.finish(),T.sortObjects===!0&&m.sort(ee,Q),Be=z.enabled===!1||z.isPresenting===!1||z.hasDepthSensing()===!1,Be&&he.addToRenderList(m,g),this.info.render.frame++,ie===!0&&te.beginShadows();const V=h.state.shadowsArray;oe.render(V,g,F),ie===!0&&te.endShadows(),this.info.autoReset===!0&&this.info.reset();const k=m.opaque,N=m.transmissive;if(h.setupLights(),F.isArrayCamera){const fe=F.cameras;if(N.length>0)for(let Ee=0,Ce=fe.length;Ee<Ce;Ee++){const Pe=fe[Ee];En(k,N,g,Pe)}Be&&he.render(g);for(let Ee=0,Ce=fe.length;Ee<Ce;Ee++){const Pe=fe[Ee];Sn(m,g,Pe,Pe.viewport)}}else N.length>0&&En(k,N,g,F),Be&&he.render(g),Sn(m,g,F);B!==null&&(E.updateMultisampleRenderTarget(B),E.updateRenderTargetMipmap(B)),g.isScene===!0&&g.onAfterRender(T,g,F),ce.resetDefaultState(),y=-1,x=null,A.pop(),A.length>0?(h=A[A.length-1],ie===!0&&te.setGlobalState(T.clippingPlanes,h.state.camera)):h=null,R.pop(),R.length>0?m=R[R.length-1]:m=null};function pt(g,F,V,k){if(g.visible===!1)return;if(g.layers.test(F.layers)){if(g.isGroup)V=g.renderOrder;else if(g.isLOD)g.autoUpdate===!0&&g.update(F);else if(g.isLight)h.pushLight(g),g.castShadow&&h.pushShadow(g);else if(g.isSprite){if(!g.frustumCulled||q.intersectsSprite(g)){k&&Ie.setFromMatrixPosition(g.matrixWorld).applyMatrix4(ye);const Ee=b.update(g),Ce=g.material;Ce.visible&&m.push(g,Ee,Ce,V,Ie.z,null)}}else if((g.isMesh||g.isLine||g.isPoints)&&(!g.frustumCulled||q.intersectsObject(g))){const Ee=b.update(g),Ce=g.material;if(k&&(g.boundingSphere!==void 0?(g.boundingSphere===null&&g.computeBoundingSphere(),Ie.copy(g.boundingSphere.center)):(Ee.boundingSphere===null&&Ee.computeBoundingSphere(),Ie.copy(Ee.boundingSphere.center)),Ie.applyMatrix4(g.matrixWorld).applyMatrix4(ye)),Array.isArray(Ce)){const Pe=Ee.groups;for(let Oe=0,ke=Pe.length;Oe<ke;Oe++){const De=Pe[Oe],Ze=Ce[De.materialIndex];Ze&&Ze.visible&&m.push(g,Ee,Ze,V,Ie.z,De)}}else Ce.visible&&m.push(g,Ee,Ce,V,Ie.z,null)}}const fe=g.children;for(let Ee=0,Ce=fe.length;Ee<Ce;Ee++)pt(fe[Ee],F,V,k)}function Sn(g,F,V,k){const N=g.opaque,fe=g.transmissive,Ee=g.transparent;h.setupLightsView(V),ie===!0&&te.setGlobalState(T.clippingPlanes,V),k&&be.viewport(D.copy(k)),N.length>0&&Qt(N,F,V),fe.length>0&&Qt(fe,F,V),Ee.length>0&&Qt(Ee,F,V),be.buffers.depth.setTest(!0),be.buffers.depth.setMask(!0),be.buffers.color.setMask(!0),be.setPolygonOffset(!1)}function En(g,F,V,k){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;h.state.transmissionRenderTarget[k.id]===void 0&&(h.state.transmissionRenderTarget[k.id]=new Ft(1,1,{generateMipmaps:!0,type:ze.has("EXT_color_buffer_half_float")||ze.has("EXT_color_buffer_float")?1016:1009,minFilter:1008,samples:4,stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:$e.workingColorSpace}));const fe=h.state.transmissionRenderTarget[k.id],Ee=k.viewport||D;fe.setSize(Ee.z,Ee.w);const Ce=T.getRenderTarget();T.setRenderTarget(fe),T.getClearColor(Y),re=T.getClearAlpha(),re<1&&T.setClearColor(16777215,.5),T.clear(),Be&&he.render(V);const Pe=T.toneMapping;T.toneMapping=0;const Oe=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),h.setupLightsView(k),ie===!0&&te.setGlobalState(T.clippingPlanes,k),Qt(g,V,k),E.updateMultisampleRenderTarget(fe),E.updateRenderTargetMipmap(fe),ze.has("WEBGL_multisampled_render_to_texture")===!1){let ke=!1;for(let De=0,Ze=F.length;De<Ze;De++){const rt=F[De],st=rt.object,wt=rt.geometry,Ke=rt.material,Le=rt.group;if(Ke.side===2&&st.layers.test(k.layers)){const tn=Ke.side;Ke.side=1,Ke.needsUpdate=!0,ii(st,V,k,wt,Ke,Le),Ke.side=tn,Ke.needsUpdate=!0,ke=!0}}ke===!0&&(E.updateMultisampleRenderTarget(fe),E.updateRenderTargetMipmap(fe))}T.setRenderTarget(Ce),T.setClearColor(Y,re),Oe!==void 0&&(k.viewport=Oe),T.toneMapping=Pe}function Qt(g,F,V){const k=F.isScene===!0?F.overrideMaterial:null;for(let N=0,fe=g.length;N<fe;N++){const Ee=g[N],Ce=Ee.object,Pe=Ee.geometry,Oe=k===null?Ee.material:k,ke=Ee.group;Ce.layers.test(V.layers)&&ii(Ce,F,V,Pe,Oe,ke)}}function ii(g,F,V,k,N,fe){g.onBeforeRender(T,F,V,k,N,fe),g.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,g.matrixWorld),g.normalMatrix.getNormalMatrix(g.modelViewMatrix),N.onBeforeRender(T,F,V,k,g,fe),N.transparent===!0&&N.side===2&&N.forceSinglePass===!1?(N.side=1,N.needsUpdate=!0,T.renderBufferDirect(V,F,k,N,g,fe),N.side=0,N.needsUpdate=!0,T.renderBufferDirect(V,F,k,N,g,fe),N.side=2):T.renderBufferDirect(V,F,k,N,g,fe),g.onAfterRender(T,F,V,k,N,fe)}function en(g,F,V){F.isScene!==!0&&(F=Xe);const k=we.get(g),N=h.state.lights,fe=h.state.shadowsArray,Ee=N.state.version,Ce=Z.getParameters(g,N.state,fe,F,V),Pe=Z.getProgramCacheKey(Ce);let Oe=k.programs;k.environment=g.isMeshStandardMaterial?F.environment:null,k.fog=F.fog,k.envMap=(g.isMeshStandardMaterial?S:l).get(g.envMap||k.environment),k.envMapRotation=k.environment!==null&&g.envMap===null?F.environmentRotation:g.envMapRotation,Oe===void 0&&(g.addEventListener("dispose",Ue),Oe=new Map,k.programs=Oe);let ke=Oe.get(Pe);if(ke!==void 0){if(k.currentProgram===ke&&k.lightsStateVersion===Ee)return ai(g,Ce),ke}else Ce.uniforms=Z.getUniforms(g),g.onBeforeCompile(Ce,T),ke=Z.acquireProgram(Ce,Pe),Oe.set(Pe,ke),k.uniforms=Ce.uniforms;const De=k.uniforms;return(!g.isShaderMaterial&&!g.isRawShaderMaterial||g.clipping===!0)&&(De.clippingPlanes=te.uniform),ai(g,Ce),k.needsLights=yu(g),k.lightsStateVersion=Ee,k.needsLights&&(De.ambientLightColor.value=N.state.ambient,De.lightProbe.value=N.state.probe,De.directionalLights.value=N.state.directional,De.directionalLightShadows.value=N.state.directionalShadow,De.spotLights.value=N.state.spot,De.spotLightShadows.value=N.state.spotShadow,De.rectAreaLights.value=N.state.rectArea,De.ltc_1.value=N.state.rectAreaLTC1,De.ltc_2.value=N.state.rectAreaLTC2,De.pointLights.value=N.state.point,De.pointLightShadows.value=N.state.pointShadow,De.hemisphereLights.value=N.state.hemi,De.directionalShadowMap.value=N.state.directionalShadowMap,De.directionalShadowMatrix.value=N.state.directionalShadowMatrix,De.spotShadowMap.value=N.state.spotShadowMap,De.spotLightMatrix.value=N.state.spotLightMatrix,De.spotLightMap.value=N.state.spotLightMap,De.pointShadowMap.value=N.state.pointShadowMap,De.pointShadowMatrix.value=N.state.pointShadowMatrix),k.currentProgram=ke,k.uniformsList=null,ke}function ri(g){if(g.uniformsList===null){const F=g.currentProgram.getUniforms();g.uniformsList=Di.seqWithValue(F.seq,g.uniforms)}return g.uniformsList}function ai(g,F){const V=we.get(g);V.outputColorSpace=F.outputColorSpace,V.batching=F.batching,V.batchingColor=F.batchingColor,V.instancing=F.instancing,V.instancingColor=F.instancingColor,V.instancingMorph=F.instancingMorph,V.skinning=F.skinning,V.morphTargets=F.morphTargets,V.morphNormals=F.morphNormals,V.morphColors=F.morphColors,V.morphTargetsCount=F.morphTargetsCount,V.numClippingPlanes=F.numClippingPlanes,V.numIntersection=F.numClipIntersection,V.vertexAlphas=F.vertexAlphas,V.vertexTangents=F.vertexTangents,V.toneMapping=F.toneMapping}function Su(g,F,V,k,N){F.isScene!==!0&&(F=Xe),E.resetTextureUnits();const fe=F.fog,Ee=k.isMeshStandardMaterial?F.environment:null,Ce=B===null?T.outputColorSpace:B.isXRRenderTarget===!0?B.texture.colorSpace:Xt,Pe=(k.isMeshStandardMaterial?S:l).get(k.envMap||Ee),Oe=k.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,ke=!!V.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),De=!!V.morphAttributes.position,Ze=!!V.morphAttributes.normal,rt=!!V.morphAttributes.color;let st=0;k.toneMapped&&(B===null||B.isXRRenderTarget===!0)&&(st=T.toneMapping);const wt=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,Ke=wt!==void 0?wt.length:0,Le=we.get(k),tn=h.state.lights;if(ie===!0&&(Se===!0||g!==x)){const It=g===x&&k.id===y;te.setState(k,g,It)}let Je=!1;k.version===Le.__version?(Le.needsLights&&Le.lightsStateVersion!==tn.state.version||Le.outputColorSpace!==Ce||N.isBatchedMesh&&Le.batching===!1||!N.isBatchedMesh&&Le.batching===!0||N.isBatchedMesh&&Le.batchingColor===!0&&N.colorTexture===null||N.isBatchedMesh&&Le.batchingColor===!1&&N.colorTexture!==null||N.isInstancedMesh&&Le.instancing===!1||!N.isInstancedMesh&&Le.instancing===!0||N.isSkinnedMesh&&Le.skinning===!1||!N.isSkinnedMesh&&Le.skinning===!0||N.isInstancedMesh&&Le.instancingColor===!0&&N.instanceColor===null||N.isInstancedMesh&&Le.instancingColor===!1&&N.instanceColor!==null||N.isInstancedMesh&&Le.instancingMorph===!0&&N.morphTexture===null||N.isInstancedMesh&&Le.instancingMorph===!1&&N.morphTexture!==null||Le.envMap!==Pe||k.fog===!0&&Le.fog!==fe||Le.numClippingPlanes!==void 0&&(Le.numClippingPlanes!==te.numPlanes||Le.numIntersection!==te.numIntersection)||Le.vertexAlphas!==Oe||Le.vertexTangents!==ke||Le.morphTargets!==De||Le.morphNormals!==Ze||Le.morphColors!==rt||Le.toneMapping!==st||Le.morphTargetsCount!==Ke)&&(Je=!0):(Je=!0,Le.__version=k.version);let Ht=Le.currentProgram;Je===!0&&(Ht=en(k,F,N));let Vn=!1,Dt=!1,si=!1;const ot=Ht.getUniforms(),Wt=Le.uniforms;if(be.useProgram(Ht.program)&&(Vn=!0,Dt=!0,si=!0),k.id!==y&&(y=k.id,Dt=!0),Vn||x!==g){be.buffers.depth.getReversed()?(ne.copy(g.projectionMatrix),Oa(ne),za(ne),ot.setValue(I,"projectionMatrix",ne)):ot.setValue(I,"projectionMatrix",g.projectionMatrix),ot.setValue(I,"viewMatrix",g.matrixWorldInverse);const cn=ot.map.cameraPosition;cn!==void 0&&cn.setValue(I,Re.setFromMatrixPosition(g.matrixWorld)),Ne.logarithmicDepthBuffer&&ot.setValue(I,"logDepthBufFC",2/(Math.log(g.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&ot.setValue(I,"isOrthographic",g.isOrthographicCamera===!0),x!==g&&(x=g,Dt=!0,si=!0)}if(N.isSkinnedMesh){ot.setOptional(I,N,"bindMatrix"),ot.setOptional(I,N,"bindMatrixInverse");const It=N.skeleton;It&&(It.boneTexture===null&&It.computeBoneTexture(),ot.setValue(I,"boneTexture",It.boneTexture,E))}N.isBatchedMesh&&(ot.setOptional(I,N,"batchingTexture"),ot.setValue(I,"batchingTexture",N._matricesTexture,E),ot.setOptional(I,N,"batchingIdTexture"),ot.setValue(I,"batchingIdTexture",N._indirectTexture,E),ot.setOptional(I,N,"batchingColorTexture"),N._colorsTexture!==null&&ot.setValue(I,"batchingColorTexture",N._colorsTexture,E));const oi=V.morphAttributes;if((oi.position!==void 0||oi.normal!==void 0||oi.color!==void 0)&&Te.update(N,V,Ht),(Dt||Le.receiveShadow!==N.receiveShadow)&&(Le.receiveShadow=N.receiveShadow,ot.setValue(I,"receiveShadow",N.receiveShadow)),k.isMeshGouraudMaterial&&k.envMap!==null&&(Wt.envMap.value=Pe,Wt.flipEnvMap.value=Pe.isCubeTexture&&Pe.isRenderTargetTexture===!1?-1:1),k.isMeshStandardMaterial&&k.envMap===null&&F.environment!==null&&(Wt.envMapIntensity.value=F.environmentIntensity),Dt&&(ot.setValue(I,"toneMappingExposure",T.toneMappingExposure),Le.needsLights&&Eu(Wt,si),fe&&k.fog===!0&&H.refreshFogUniforms(Wt,fe),H.refreshMaterialUniforms(Wt,k,X,se,h.state.transmissionRenderTarget[g.id]),Di.upload(I,ri(Le),Wt,E)),k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(Di.upload(I,ri(Le),Wt,E),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&ot.setValue(I,"center",N.center),ot.setValue(I,"modelViewMatrix",N.modelViewMatrix),ot.setValue(I,"normalMatrix",N.normalMatrix),ot.setValue(I,"modelMatrix",N.matrixWorld),k.isShaderMaterial||k.isRawShaderMaterial){const It=k.uniformsGroups;for(let cn=0,un=It.length;cn<un;cn++){const Ia=It[cn];P.update(Ia,Ht),P.bind(Ia,Ht)}}return Ht}function Eu(g,F){g.ambientLightColor.needsUpdate=F,g.lightProbe.needsUpdate=F,g.directionalLights.needsUpdate=F,g.directionalLightShadows.needsUpdate=F,g.pointLights.needsUpdate=F,g.pointLightShadows.needsUpdate=F,g.spotLights.needsUpdate=F,g.spotLightShadows.needsUpdate=F,g.rectAreaLights.needsUpdate=F,g.hemisphereLights.needsUpdate=F}function yu(g){return g.isMeshLambertMaterial||g.isMeshToonMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isShadowMaterial||g.isShaderMaterial&&g.lights===!0}this.getActiveCubeFace=function(){return U},this.getActiveMipmapLevel=function(){return L},this.getRenderTarget=function(){return B},this.setRenderTargetTextures=function(g,F,V){we.get(g.texture).__webglTexture=F,we.get(g.depthTexture).__webglTexture=V;const k=we.get(g);k.__hasExternalTextures=!0,k.__autoAllocateDepthBuffer=V===void 0,k.__autoAllocateDepthBuffer||ze.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),k.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(g,F){const V=we.get(g);V.__webglFramebuffer=F,V.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(g,F=0,V=0){B=g,U=F,L=V;let k=!0,N=null,fe=!1,Ee=!1;if(g){const Pe=we.get(g);if(Pe.__useDefaultFramebuffer!==void 0)be.bindFramebuffer(I.FRAMEBUFFER,null),k=!1;else if(Pe.__webglFramebuffer===void 0)E.setupRenderTarget(g);else if(Pe.__hasExternalTextures)E.rebindTextures(g,we.get(g.texture).__webglTexture,we.get(g.depthTexture).__webglTexture);else if(g.depthBuffer){const De=g.depthTexture;if(Pe.__boundDepthTexture!==De){if(De!==null&&we.has(De)&&(g.width!==De.image.width||g.height!==De.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(g)}}const Oe=g.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(Ee=!0);const ke=we.get(g).__webglFramebuffer;g.isWebGLCubeRenderTarget?(Array.isArray(ke[F])?N=ke[F][V]:N=ke[F],fe=!0):g.samples>0&&E.useMultisampledRTT(g)===!1?N=we.get(g).__webglMultisampledFramebuffer:Array.isArray(ke)?N=ke[V]:N=ke,D.copy(g.viewport),j.copy(g.scissor),W=g.scissorTest}else D.copy(ue).multiplyScalar(X).floor(),j.copy(ve).multiplyScalar(X).floor(),W=Fe;if(be.bindFramebuffer(I.FRAMEBUFFER,N)&&k&&be.drawBuffers(g,N),be.viewport(D),be.scissor(j),be.setScissorTest(W),fe){const Pe=we.get(g.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+F,Pe.__webglTexture,V)}else if(Ee){const Pe=we.get(g.texture),Oe=F||0;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,Pe.__webglTexture,V||0,Oe)}y=-1},this.readRenderTargetPixels=function(g,F,V,k,N,fe,Ee){if(!(g&&g.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ce=we.get(g).__webglFramebuffer;if(g.isWebGLCubeRenderTarget&&Ee!==void 0&&(Ce=Ce[Ee]),Ce){be.bindFramebuffer(I.FRAMEBUFFER,Ce);try{const Pe=g.texture,Oe=Pe.format,ke=Pe.type;if(!Ne.textureFormatReadable(Oe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ne.textureTypeReadable(ke)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=g.width-k&&V>=0&&V<=g.height-N&&I.readPixels(F,V,k,N,_e.convert(Oe),_e.convert(ke),fe)}finally{const Pe=B!==null?we.get(B).__webglFramebuffer:null;be.bindFramebuffer(I.FRAMEBUFFER,Pe)}}},this.readRenderTargetPixelsAsync=async function(g,F,V,k,N,fe,Ee){if(!(g&&g.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ce=we.get(g).__webglFramebuffer;if(g.isWebGLCubeRenderTarget&&Ee!==void 0&&(Ce=Ce[Ee]),Ce){const Pe=g.texture,Oe=Pe.format,ke=Pe.type;if(!Ne.textureFormatReadable(Oe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ne.textureTypeReadable(ke))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(F>=0&&F<=g.width-k&&V>=0&&V<=g.height-N){be.bindFramebuffer(I.FRAMEBUFFER,Ce);const De=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,De),I.bufferData(I.PIXEL_PACK_BUFFER,fe.byteLength,I.STREAM_READ),I.readPixels(F,V,k,N,_e.convert(Oe),_e.convert(ke),0);const Ze=B!==null?we.get(B).__webglFramebuffer:null;be.bindFramebuffer(I.FRAMEBUFFER,Ze);const rt=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await Ba(I,rt,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,De),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,fe),I.deleteBuffer(De),I.deleteSync(rt),fe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(g,F=null,V=0){g.isTexture!==!0&&(Xn("WebGLRenderer: copyFramebufferToTexture function signature has changed."),F=arguments[0]||null,g=arguments[1]);const k=Math.pow(2,-V),N=Math.floor(g.image.width*k),fe=Math.floor(g.image.height*k),Ee=F!==null?F.x:0,Ce=F!==null?F.y:0;E.setTexture2D(g,0),I.copyTexSubImage2D(I.TEXTURE_2D,V,0,0,Ee,Ce,N,fe),be.unbindTexture()},this.copyTextureToTexture=function(g,F,V=null,k=null,N=0){g.isTexture!==!0&&(Xn("WebGLRenderer: copyTextureToTexture function signature has changed."),k=arguments[0]||null,g=arguments[1],F=arguments[2],N=arguments[3]||0,V=null);let fe,Ee,Ce,Pe,Oe,ke,De,Ze,rt;const st=g.isCompressedTexture?g.mipmaps[N]:g.image;V!==null?(fe=V.max.x-V.min.x,Ee=V.max.y-V.min.y,Ce=V.isBox3?V.max.z-V.min.z:1,Pe=V.min.x,Oe=V.min.y,ke=V.isBox3?V.min.z:0):(fe=st.width,Ee=st.height,Ce=st.depth||1,Pe=0,Oe=0,ke=0),k!==null?(De=k.x,Ze=k.y,rt=k.z):(De=0,Ze=0,rt=0);const wt=_e.convert(F.format),Ke=_e.convert(F.type);let Le;F.isData3DTexture?(E.setTexture3D(F,0),Le=I.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(E.setTexture2DArray(F,0),Le=I.TEXTURE_2D_ARRAY):(E.setTexture2D(F,0),Le=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,F.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,F.unpackAlignment);const tn=I.getParameter(I.UNPACK_ROW_LENGTH),Je=I.getParameter(I.UNPACK_IMAGE_HEIGHT),Ht=I.getParameter(I.UNPACK_SKIP_PIXELS),Vn=I.getParameter(I.UNPACK_SKIP_ROWS),Dt=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,st.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,st.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Pe),I.pixelStorei(I.UNPACK_SKIP_ROWS,Oe),I.pixelStorei(I.UNPACK_SKIP_IMAGES,ke);const si=g.isDataArrayTexture||g.isData3DTexture,ot=F.isDataArrayTexture||F.isData3DTexture;if(g.isRenderTargetTexture||g.isDepthTexture){const Wt=we.get(g),oi=we.get(F),It=we.get(Wt.__renderTarget),cn=we.get(oi.__renderTarget);be.bindFramebuffer(I.READ_FRAMEBUFFER,It.__webglFramebuffer),be.bindFramebuffer(I.DRAW_FRAMEBUFFER,cn.__webglFramebuffer);for(let un=0;un<Ce;un++)si&&I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,we.get(g).__webglTexture,N,ke+un),g.isDepthTexture?(ot&&I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,we.get(F).__webglTexture,N,rt+un),I.blitFramebuffer(Pe,Oe,fe,Ee,De,Ze,fe,Ee,I.DEPTH_BUFFER_BIT,I.NEAREST)):ot?I.copyTexSubImage3D(Le,N,De,Ze,rt+un,Pe,Oe,fe,Ee):I.copyTexSubImage2D(Le,N,De,Ze,rt+un,Pe,Oe,fe,Ee);be.bindFramebuffer(I.READ_FRAMEBUFFER,null),be.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else ot?g.isDataTexture||g.isData3DTexture?I.texSubImage3D(Le,N,De,Ze,rt,fe,Ee,Ce,wt,Ke,st.data):F.isCompressedArrayTexture?I.compressedTexSubImage3D(Le,N,De,Ze,rt,fe,Ee,Ce,wt,st.data):I.texSubImage3D(Le,N,De,Ze,rt,fe,Ee,Ce,wt,Ke,st):g.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,N,De,Ze,fe,Ee,wt,Ke,st.data):g.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,N,De,Ze,st.width,st.height,wt,st.data):I.texSubImage2D(I.TEXTURE_2D,N,De,Ze,fe,Ee,wt,Ke,st);I.pixelStorei(I.UNPACK_ROW_LENGTH,tn),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Je),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Ht),I.pixelStorei(I.UNPACK_SKIP_ROWS,Vn),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Dt),N===0&&F.generateMipmaps&&I.generateMipmap(Le),be.unbindTexture()},this.copyTextureToTexture3D=function(g,F,V=null,k=null,N=0){return g.isTexture!==!0&&(Xn("WebGLRenderer: copyTextureToTexture3D function signature has changed."),V=arguments[0]||null,k=arguments[1]||null,g=arguments[2],F=arguments[3],N=arguments[4]||0),Xn('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(g,F,V,k,N)},this.initRenderTarget=function(g){we.get(g).__webglFramebuffer===void 0&&E.setupRenderTarget(g)},this.initTexture=function(g){g.isCubeTexture?E.setTextureCube(g,0):g.isData3DTexture?E.setTexture3D(g,0):g.isDataArrayTexture||g.isCompressedArrayTexture?E.setTexture2DArray(g,0):E.setTexture2D(g,0),be.unbindTexture()},this.resetState=function(){U=0,L=0,B=null,be.reset(),ce.reset()},typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return 2e3}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorspace=$e._getDrawingBufferColorSpace(e),t.unpackColorSpace=$e._getUnpackColorSpace()}}class ei extends Ct{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ot,this.environmentIntensity=1,this.environmentRotation=new Ot,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Da=new it;class mu{constructor(e,t,n=0,r=1/0){this.ray=new Lr(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new qi,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Da.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Da),this}intersectObject(e,t=!0,n=[]){return _r(e,this,n,t),n.sort(La),n}intersectObjects(e,t=!0,n=[]){for(let r=0,a=e.length;r<a;r++)_r(e[r],this,n,t);return n.sort(La),n}}function La(i,e){return i.distance-e.distance}function _r(i,e,t,n){let r=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(r=!1),r===!0&&n===!0){const a=i.children;for(let s=0,o=a.length;s<o;s++)_r(a[s],e,t,!0)}}typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}})),typeof window!="undefined"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");const _u=i=>Math.min(1,Math.max(0,i)),ti=4,gr=40,gu=1.2;function vu(i){const e=new DataView(i),t=e.getUint32(12,!0),n=JSON.parse(new TextDecoder().decode(new Uint8Array(i,20,t))),r=20+t+8,a=(c,u,d)=>{const f=n.accessors[c],p=n.bufferViews[f.bufferView];return new u(i.slice(r+(p.byteOffset||0),r+(p.byteOffset||0)+p.byteLength),0,f.count*d)},s=n.meshes[0].primitives[0],o=new Vt;return o.setAttribute("position",new ht(a(s.attributes.POSITION,Float32Array,3),3)),o.setAttribute("tint",new ht(a(s.attributes.COLOR_0,Uint8Array,4),4,!0)),o.setIndex(new ht(a(s.indices,Uint32Array,1),1)),o}window.Scene3D=function(i){const e=i.canvas,t=i.scene,n=i.base||"scene/",r=window.matchMedia&&matchMedia("(pointer: coarse)").matches,a=new mr({canvas:e,antialias:!0,powerPreference:"high-performance"});a.outputColorSpace=Xt,a.setClearColor(i.bg||"#d9dde0",1);const s=new yt(70,1,.05,80),o=new Qn,c=new ei;o.add(s),c.add(o);let u=1,d=1,f=null,p=!1;const _=t.keys.map((l,S)=>{const w=l.r,C=new O(...l.p),b=new it().set(w[0],w[1],w[2],0,w[3],w[4],w[5],0,w[6],w[7],w[8],0,0,0,0,1).multiply(new it().makeTranslation(-C.x,-C.y,-C.z));return{d:l,i:S,pos:C,dir:new O(w[6],w[7],w[8]),toCam:b,lens:new lt(l.f[0],l.f[1],l.c[0],l.c[1]),state:"",tex:null,depth:null,used:0}}),v=l=>`{ vec4 c = cam${l} * vec4(vW, 1.0);
      if (wt${l} > 0.0 && c.z > 0.12) { vec2 uv = vec2(lens${l}.x * c.x / c.z + lens${l}.z, lens${l}.y * c.y / c.z + lens${l}.w);
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
          float seen = unpack(texture2D(dep${l}, vec2(uv.x, 1.0 - uv.y))) * ${gr.toFixed(1)}, vis = 1.0 - smoothstep(0.03 + 0.02 * c.z, 0.08 + 0.05 * c.z, c.z - seen);      // only what this photograph really saw
          vec2 e = min(uv, 1.0 - uv); float edge = smoothstep(0.0, 0.08, min(e.x, e.y)), ang = pow(max(dot(toEye, normalize(pos${l} - vW)), 0.0), 8.0);
          float w = wt${l} * vis * edge * (0.03 + ang); w *= w; acc += texture2D(tex${l}, uv).rgb * w; tot += w; } } }`,M=[...Array(ti).keys()],m={eye:{value:new O}};for(const l of M)Object.assign(m,{["tex"+l]:{value:null},["dep"+l]:{value:null},["cam"+l]:{value:new it},["lens"+l]:{value:new lt},["pos"+l]:{value:new O},["wt"+l]:{value:0}});const h=new Mt({side:2,uniforms:m,vertexShader:"attribute vec4 tint; varying vec3 vW; varying vec3 vTint; void main(){ vW = position; vTint = tint.rgb; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }",fragmentShader:`uniform vec3 eye; varying vec3 vW; varying vec3 vTint;
      ${M.map(l=>`uniform sampler2D tex${l}, dep${l}; uniform mat4 cam${l}; uniform vec4 lens${l}; uniform vec3 pos${l}; uniform float wt${l};`).join(`
`)}
      float unpack(vec4 c){ return dot(c, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0)); }
      void main(){ vec3 acc = vec3(0.0), toEye = normalize(eye - vW); float tot = 0.0;
        ${M.map(v).join(`
`)}
        gl_FragColor = vec4(mix(vTint, acc / max(tot, 1e-6), smoothstep(0.0, 0.0004, tot)), 1.0); }`}),R=new Mt({side:2,vertexShader:"varying float z; void main(){ vec4 v = viewMatrix * vec4(position, 1.0); z = -v.z; gl_Position = projectionMatrix * v; }",fragmentShader:`varying float z; vec4 pack(float v){ vec4 e = fract(v * vec4(1.0, 255.0, 65025.0, 16581375.0)); return e - e.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0); } void main(){ gl_FragColor = pack(clamp(z / ${gr.toFixed(1)}, 0.0, 0.9999)); }`}),A=new yt;A.matrixAutoUpdate=!1,A.matrixWorldAutoUpdate=!1;function T(l){const S=l.d,w=S.r,C=.05,b=new Ft(384,Math.round(384*S.h/S.w),{minFilter:1003,magFilter:1003});A.matrixWorld.set(w[0],-w[3],-w[6],l.pos.x,w[1],-w[4],-w[7],l.pos.y,w[2],-w[5],-w[8],l.pos.z,0,0,0,1),A.matrixWorldInverse.copy(A.matrixWorld).invert(),A.projectionMatrix.makePerspective(-S.c[0]/S.f[0]*C,(1-S.c[0])/S.f[0]*C,S.c[1]/S.f[1]*C,-(1-S.c[1])/S.f[1]*C,C,gr),A.projectionMatrixInverse.copy(A.projectionMatrix).invert();const Z=a.xr.enabled,H=a.getRenderTarget();return a.xr.enabled=!1,c.overrideMaterial=R,a.setRenderTarget(b),a.setClearColor(16777215,1),a.clear(),a.render(c,A),c.overrideMaterial=null,a.setRenderTarget(H),a.setClearColor(i.bg||"#d9dde0",1),a.xr.enabled=Z,b}const G=new Map,U=l=>(G.has(l)||(G.set(l,fetch(l).then(S=>{if(!S.ok)throw new Error(l+" "+S.status);return S.arrayBuffer()})),G.get(l).catch(()=>G.delete(l)),G.size>10&&G.delete(G.keys().next().value)),G.get(l));async function L(l){if(!l.state){l.state="loading";try{const S=await U(n+l.d.pack),w=URL.createObjectURL(new Blob([S.slice(l.d.at[0],l.d.at[0]+l.d.at[1])],{type:"image/webp"})),C=await new Promise((Z,H)=>{const J=new Image;J.decoding="async",J.onload=()=>Z(J),J.onerror=H,J.src=w});if(URL.revokeObjectURL(w),l.state!=="loading"||!f){l.state="";return}const b=new _t(C);b.flipY=!1,b.colorSpace="",b.minFilter=1008,b.anisotropy=4,b.needsUpdate=!0,l.tex=b,l.depth=T(l),l.state="ready"}catch(S){l.state="",console.error("Scene3D: could not load a photograph",S)}}}function B(l){l.state==="ready"&&(l.tex.dispose(),l.depth.dispose(),l.tex=l.depth=null),l.state=""}let y=0;function x(l,S){const w=_.map(b=>[b.pos.distanceTo(l)+gu*Math.acos(Math.min(1,Math.max(-1,b.dir.dot(S)))),b]).sort((b,Z)=>b[0]-Z[0]),C=w[Math.min(ti,w.length-1)][0];return w.slice(0,ti).map(([b,Z])=>({Kf:Z,w:w.length>ti?Math.max(0,1-b/C):1}))}const D=new O,j=new O;function W(l){if(!f)return!1;const S=a.xr.isPresenting?a.xr.getCamera():s;s.updateMatrixWorld(),S.getWorldPosition(j),S.getWorldDirection(D);const w=x(j,D);y++;for(const{Kf:b}of w)b.used=y,L(b);if(l&&w.some(({Kf:b})=>b.state!=="ready"))return!1;const C=_.filter(b=>b.state==="ready");if(C.length>28)for(const b of C.sort((Z,H)=>Z.used-H.used).slice(0,C.length-28))B(b);m.eye.value.copy(j),w.forEach(({Kf:b,w:Z},H)=>{const J=b.state==="ready";m["wt"+H].value=J?Math.max(Z,1e-4):0,J&&(m["tex"+H].value=b.tex,m["dep"+H].value=b.depth.texture,m["cam"+H].value.copy(b.toCam),m["lens"+H].value.copy(b.lens),m["pos"+H].value.copy(b.pos))});for(let b=w.length;b<ti;b++)m["wt"+b].value=0;return a.render(c,s),!0}const Y=t.path.map(l=>new O(...l.p)),re=t.path.map(l=>new O(...l.d).normalize()),$=Y.length,se=$>1&&Y[1].distanceTo(Y[0])||.1,X=($-1)*se,ee=l=>l/X*239,Q=(t.chapters||[]).map(l=>({room:0,label:l.label,from:ee(l.from*se),to:ee(l.to*se)})),ue=new it,ve=new O(0,1,0),Fe=new O;function q(l){const S=new O,w=new O;let C=0;for(let b=-4;b<=4;b++){const Z=Math.min(X,Math.max(0,l+b*.09))/se,H=Math.min($-2,Math.floor(Z)),J=Z-H,ge=Math.exp(-(b*b)/6);S.addScaledVector(Fe.copy(Y[H]).lerp(Y[H+1],J),ge),w.addScaledVector(Fe.copy(re[H]).lerp(re[H+1],J),ge),C+=ge}return S.multiplyScalar(1/C),w.normalize(),{p:S,q:new St().setFromRotationMatrix(ue.lookAt(S,Fe.copy(S).add(w),ve))}}const ie=l=>{const S=q(l);o.position.set(0,0,0),o.quaternion.identity(),s.position.copy(S.p),s.quaternion.copy(S.q)};function Se(){const l=e.getBoundingClientRect();u=Math.max(1,l.width),d=Math.max(1,l.height),!a.xr.isPresenting&&(a.setPixelRatio(Math.min(window.devicePixelRatio||1,r?1.5:2)),a.setSize(u,d,!1),s.aspect=u/d,s.fov=u<d?78:60,s.updateProjectionMatrix())}let ne=0,ye=!0,Re=!0,Ie=0,Xe=i.explore?"explore":"tour";const Be=()=>{if(!i.section)return 0;const l=i.section.getBoundingClientRect(),S=l.height-innerHeight;return S>0?_u(-l.top/S):0},Me={yaw:0,pitch:0,pos:new O,goal:null,keys:new Set,auto:!1};function I(l){if(p)return;const S=Math.min(.1,(l-Ie)/1e3||.016);if(Ie=l,!(!Re&&!ye&&!a.xr.isPresenting)){if(Xe==="tour"){const w=Be(),C=w*X;ne=ye||Math.abs(C-ne)<4e-4?C:ne+(C-ne)*Math.min(1,S*5),ie(ne)}else Ne(S);W(!1)&&ye&&_.some(w=>w.state==="ready")&&(ye=!1,i.onLoad&&i.onLoad(1)),Xe==="tour"&&i.onUpdate&&i.onUpdate({frame:ee(ne),room:0,rush:0,chapters:Q,progress:Be(),portrait:u<d,width:u,height:d})}}const et=new mu,ze=t.eye||1.45;function Ne(l){const S=a.xr.isPresenting;if(Me.auto){ne=(ne+l*.9)%X;const w=q(ne);Me.pos.copy(w.p);const C=new Ot().setFromQuaternion(w.q,"YXZ");Me.yaw=C.y,Me.pitch=C.x}else{const w=new O(-Math.sin(Me.yaw),0,-Math.cos(Me.yaw)),C=new O(Math.cos(Me.yaw),0,-Math.sin(Me.yaw)),b=new O;let Z=0;if((Me.keys.has("w")||Me.keys.has("arrowup"))&&b.add(w),(Me.keys.has("s")||Me.keys.has("arrowdown"))&&b.sub(w),Me.keys.has("d")&&b.add(C),Me.keys.has("a")&&b.sub(C),Me.keys.has("arrowleft")&&(Z+=1),Me.keys.has("arrowright")&&(Z-=1),S)for(const H of a.xr.getSession().inputSources){const J=H.gamepad;if(!J||J.axes.length<4)continue;const ge=J.axes[2],te=J.axes[3];if(H.handedness==="left"){const oe=new O;a.xr.getCamera().getWorldDirection(oe),oe.y=0,oe.normalize(),b.addScaledVector(oe,-te).addScaledVector(new O(-oe.z,0,oe.x),ge)}else Math.abs(ge)>.5&&(Z-=ge)}if(Me.yaw+=Z*l*1.6,b.lengthSq()>.01&&(Me.goal=null,b.normalize(),et.set(Me.pos,b),et.far=.4,(!f||!et.intersectObject(f).length)&&Me.pos.addScaledVector(b,l*1.3)),Me.goal){const H=Fe.copy(Me.goal).sub(Me.pos);H.y=0;const J=H.length();J<.05?Me.goal=null:Me.pos.addScaledVector(H.normalize(),Math.min(J,l*1.6))}}S?(o.position.set(Me.pos.x,0,Me.pos.z),o.rotation.set(0,Me.yaw,0)):(o.position.set(0,0,0),o.quaternion.identity(),s.position.set(Me.pos.x,ze,Me.pos.z),s.rotation.set(Me.pitch,Me.yaw,0,"YXZ"))}function be(l,S){if(!f)return;et.setFromCamera(new nt(l/u*2-1,-(S/d)*2+1),s),et.far=30;const w=et.intersectObject(f)[0];if(!w)return;const C=w.point.clone();w.point.y>.5&&C.addScaledVector(et.ray.direction,-.7),C.y=ze,Me.goal=C,Me.auto=!1}if(i.explore){let l=null,S=0;e.style.touchAction="none",e.addEventListener("pointerdown",w=>{l=[w.clientX,w.clientY],S=0,e.setPointerCapture(w.pointerId)}),e.addEventListener("pointermove",w=>{if(!l)return;const C=w.clientX-l[0],b=w.clientY-l[1];S+=Math.abs(C)+Math.abs(b),l=[w.clientX,w.clientY],Me.auto=!1,Me.yaw+=C*.0045,Me.pitch=Math.max(-1.2,Math.min(1.2,Me.pitch+b*.0045))}),e.addEventListener("pointerup",w=>{if(l&&S<8){const C=e.getBoundingClientRect();be(w.clientX-C.left,w.clientY-C.top)}l=null}),addEventListener("keydown",w=>{Me.keys.add(w.key.toLowerCase()),Me.auto=!1}),addEventListener("keyup",w=>Me.keys.delete(w.key.toLowerCase()))}const Ye=l=>{ne=l;const S=q(l);Me.pos.copy(S.p);const w=new Ot().setFromQuaternion(S.q,"YXZ");Me.yaw=w.y,Me.pitch=w.x};window.IntersectionObserver&&new IntersectionObserver(l=>{Re=l[0].isIntersecting}).observe(e);let we=0;addEventListener("resize",()=>{clearTimeout(we),we=setTimeout(Se,120)}),Se(),Ye(0);const E=fetch(n+t.mesh).then(l=>{if(!l.ok)throw new Error(t.mesh+" "+l.status);return l.arrayBuffer()}).then(l=>{f=new bt(vu(l),h),f.frustumCulled=!1,f.geometry.computeBoundingSphere(),c.add(f),i.still||a.setAnimationLoop(I)});return E.catch(l=>console.error("Scene3D: could not load the model",l)),{total:X,chapters:Q,spans:[[0,239]],ready:E,view:{camera:s,renderer:a},pose:q,destroy(){p=!0,a.setAnimationLoop(null)},async render(l){await E,a.setAnimationLoop(null),ie(l/239*X);for(let S=0;S<1500;S++){if(W(!0))return!0;await new Promise(w=>setTimeout(w,30))}return!1},explore:{tour(l){Me.auto=l},async vr(){if(!navigator.xr||!await navigator.xr.isSessionSupported("immersive-vr").catch(()=>!1))return!1;const l=await navigator.xr.requestSession("immersive-vr",{optionalFeatures:["local-floor"]});return a.xr.enabled=!0,a.xr.setReferenceSpaceType("local-floor"),await a.xr.setSession(l),l.addEventListener("end",()=>{a.xr.enabled=!1,Se()}),!0},async vrOffered(){return!!navigator.xr&&!!await navigator.xr.isSessionSupported("immersive-vr").catch(()=>!1)}}}};const ni=i=>Math.min(1,Math.max(0,i)),vr=.7,xu=.9,xr=.72,Ua=[1,3],Mr=1.2;window.Walk3D=function(i){const e=i.canvas,t=window.matchMedia&&matchMedia("(pointer: coarse)").matches,n=new mr({canvas:e,antialias:!1,powerPreference:"high-performance"});n.outputColorSpace=Xt,n.autoClear=!1;const r=new yt(50,1,.05,400),a=(l=4)=>new Ft(4,4,{samples:l}),s=a(),o=a(),c=a(),u=a(0),d=a(0),f=new Ft(4,4,{samples:0,generateMipmaps:!0,minFilter:1008}),p=[s,o,c,u,d,f],_=new bt(new On(2,2)),v=new ei,M=new ar(-1,1,1,-1,0,1);v.add(_);const m="varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",h=new Mt({depthTest:!1,vertexShader:m,uniforms:{a:{value:s.texture},b:{value:o.texture},c:{value:c.texture},w:{value:0},audit:{value:0},bg:{value:new Qe(i.bg||"#2a2622")}},fragmentShader:`uniform sampler2D a, b, c; uniform float w, audit; uniform vec3 bg; varying vec2 v;
      void main(){ vec4 A = texture2D(a, v), B = texture2D(b, v), C = texture2D(c, v);
        float k = smoothstep(0.2, 0.8, w), wa = A.a * (1.0 - k) + 0.0005 * A.a, wb = B.a * k + 0.0005 * B.a, s = wa + wb;
        vec3 ab = s > 0.0 ? (A.rgb / max(A.a, 0.001) * wa + B.rgb / max(B.a, 0.001) * wb) / s : vec3(0.0); float cover = clamp(max(A.a, B.a), 0.0, 1.0);
        float ca = clamp(C.a, 0.0, 1.0), all = cover + (1.0 - cover) * ca;
        if (audit > 0.5) { gl_FragColor = vec4(cover, all, 0.0, 1.0); return; }  // for checking: red where the two nearest photographs show the scene, green where any does
        gl_FragColor = vec4(ab * cover + (1.0 - cover) * ca * C.rgb / max(C.a, 0.001), all); }`}),R=new Mt({depthTest:!1,vertexShader:m,uniforms:{j:{value:f.texture},audit:h.uniforms.audit,bg:h.uniforms.bg,streak:{value:new O}},fragmentShader:`uniform sampler2D j; uniform float audit; uniform vec3 bg, streak; varying vec2 v;
      vec4 healed(vec2 uv, float lod){ vec4 s = textureLod(j, uv, lod); for (int l = 1; l < 9; l++) { if (s.a > 0.995) break; s += (1.0 - s.a) * textureLod(j, uv, lod + float(l)); } return s; }
      void main(){ if (audit > 0.5) { gl_FragColor = texture2D(j, v); return; }
        vec2 along = streak.xy + (v - 0.5) * streak.z; float len = length(along); along *= min(1.0, 0.07 / max(len, 1e-5));       // never more than a short streak: the rooms must stay readable
        float px = length(along * vec2(textureSize(j, 0))); vec4 s;
        if (px < 1.0) s = healed(v, 0.0);
        else { float lod = clamp(log2(px / 12.0), 0.0, 5.0); s = vec4(0.0); for (int i = 0; i < 13; i++) s += healed(clamp(v + along * (float(i) / 12.0 - 0.5), 0.0, 1.0), lod); s /= 13.0; }
        gl_FragColor = vec4(mix(bg, s.rgb / max(s.a, 0.001), smoothstep(0.0, 0.06, s.a)), 1.0); }`}),A=new Mt({depthTest:!1,vertexShader:m,uniforms:{x:{value:u.texture},y:{value:d.texture},t:{value:0},aspect:{value:1}},fragmentShader:`uniform sampler2D x, y; uniform float t, aspect; varying vec2 v;
      void main(){ vec2 p = (v - 0.5) * vec2(aspect, 1.0); float d = length(p) / length(vec2(aspect, 1.0) * 0.5), r = t * 1.5;
        float inside = 1.0 - smoothstep(r - 0.45, r, d); gl_FragColor = vec4(mix(texture2D(x, v).rgb, texture2D(y, v).rgb, inside * smoothstep(0.0, 0.25, t)), 1.0); }`}),T=l=>new Mt({uniforms:{map:{value:l}},vertexShader:"attribute float solid; varying vec2 v; varying float s; void main(){ v = uv; s = solid; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",fragmentShader:"uniform sampler2D map; varying vec2 v; varying float s; void main(){ float a = smoothstep(0.0, 0.9, s); gl_FragColor = vec4(texture2D(map, v).rgb * a, a); }"}),G=l=>new Promise((S,w)=>{const C=new Image;C.decoding="async",C.onload=()=>S(C),C.onerror=w,C.src=l}),U=new O(0,0,-1),L=l=>U.clone().applyQuaternion(l),B=i.rooms.map(l=>{const S=l.walk.views.map((ce,P)=>{const le=new it().fromArray(ce.m),z=new St().setFromRotationMatrix(le);return{d:ce,i:P,base:l.base||"",state:"",m:le,pos:new O().setFromMatrixPosition(le),quat:z,dir:L(z),tw:ce.w/2/ce.f,th:ce.h/2/ce.f}});if(l.walk.cams&&l.walk.cams.length>1){const ce=l.walk.cams.map(pe=>{const Ge=new it().fromArray(pe.m);return{p:new O().setFromMatrixPosition(Ge),q:new St().setFromRotationMatrix(Ge)}});for(let pe=1;pe<ce.length;pe++)ce[pe].q.dot(ce[pe-1].q)<0&&ce[pe].q.set(-ce[pe].q.x,-ce[pe].q.y,-ce[pe].q.z,-ce[pe].q.w);const P=l.walk.cams.map(pe=>pe.r||0),le=ce.length,z=pe=>Math.max(.02,ce[pe].p.distanceTo(ce[pe-1].p)+Mr*ce[pe].q.angleTo(ce[pe-1].q)),K=new Array(le).fill(1-xr);for(let pe=0;pe<le;pe++)if(P[pe]>=.5){let Ge=pe,He=0;for(;Ge+1<le&&P[Ge+1]>=.5;)Ge++,He+=z(Ge);const je=Math.min(1,Math.min(Ua[1],Math.max(Ua[0],(1-xr)*He))/Math.max(He,1e-6));for(let qe=Math.max(0,pe-6);qe<=Math.min(le-1,Ge+6);qe++)(qe>=pe&&qe<=Ge||P[qe]<.5)&&(K[qe]=je);pe=Ge}const ae=[0],de=[];for(let pe=1;pe<le;pe++){const Ge=1-(P[pe]+P[pe-1])/2*(1-(K[pe]+K[pe-1])/2);de.push(Ge),ae.push(ae[pe-1]+z(pe)*Ge)}const Ue=l.walk.cams.map(pe=>pe.v);return{views:S,keys:ce,cum:ae,len:ae[ae.length-1],tw:Math.min(...S.map(pe=>pe.tw))*(i.marginX||(l.walk.view||[])[0]||.62),th:Math.min(...S.map(pe=>pe.th))*(i.marginY||(l.walk.view||[])[1]||.8),centre:pe=>Ue[Math.min(Ue.length-1,pe)],reach:8,rush:P,pace:de,want:l.walk.cams[0].n?pe=>{const Ge=new Set;for(let He=Math.max(0,pe-5);He<=Math.min(le-1,pe+8);He++)for(const je of l.walk.cams[He].n)Ge.add(je);return Ge}:null,chapters:l.walk.chapters||[],name:l.name}}const C=S.map(ce=>({p:ce.pos.clone(),q:ce.quat.clone()})),b=S[S.length-1],Z=b.d,H=Z.far||[.5,.5],J=new O((H[0]*Z.w-Z.cx)/Z.f,-(H[1]*Z.h-Z.cy)/Z.f,-1).normalize(),ge=Z.zmed||3,te=Math.min(.4*(Z.zto||ge),.6*ge,.36*(Z.znear||ge))*(l.push||1),oe=new St().setFromUnitVectors(U,J),he=2*Math.acos(Math.min(1,Math.abs(oe.w)));C.push({p:b.pos.clone().add(J.clone().applyQuaternion(b.quat).multiplyScalar(te)),q:b.quat.clone().multiply(new St().slerp(oe,he>0?Math.min(1,.09/he):0))});for(let ce=1;ce<C.length;ce++)C[ce].q.dot(C[ce-1].q)<0&&C[ce].q.set(-C[ce].q.x,-C[ce].q.y,-C[ce].q.z,-C[ce].q.w);const Te=[0];for(let ce=1;ce<C.length;ce++)Te.push(Te[ce-1]+Math.max(ce<C.length-1?.35:S.length===1?1.5:.9,C[ce].p.distanceTo(C[ce-1].p)+Mr*C[ce].q.angleTo(C[ce-1].q)));const me=i.margin||.8,Ae=Math.min(...S.map(ce=>ce.tw))*me,_e=Math.min(...S.map(ce=>ce.th))*me;return{views:S,keys:C,cum:Te,len:Te[Te.length-1],tw:Ae,th:_e,centre:ce=>Math.min(S.length-1,ce),reach:3,chapters:[],name:l.name}});let y=0;for(const[l,S]of B.entries())S.start=y,y+=S.len-(l<B.length-1?vr:0);const x=y,D=l=>l/x*239,j=B.map(l=>[D(l.start),D(l.start+l.len)]),W=B.flatMap((l,S)=>l.chapters.length?l.chapters.map(w=>({room:S,label:w.label,from:D(l.start+l.cum[Math.min(l.cum.length-1,w.from)]),to:D(l.start+l.cum[Math.min(l.cum.length-1,w.to)])})):[{room:S,label:l.name||"",from:j[S][0],to:j[S][1]}]),Y=(l,S,w,C,b)=>.5*(2*S+(-l+w)*b+(2*l-5*S+4*w-C)*b*b+(-l+3*S-3*w+C)*b*b*b);function re(l,S,w,C){const b=l.keys,Z=b.length;S=Math.min(l.len,Math.max(0,S));let H=0;for(;H<Z-2&&S>l.cum[H+1];)H++;const J=(S-l.cum[H])/(l.cum[H+1]-l.cum[H]),ge=b[Math.max(0,H-1)].p,te=b[H].p,oe=b[H+1].p,he=b[Math.min(Z-1,H+2)].p;return w.set(Y(ge.x,te.x,oe.x,he.x,J),Y(ge.y,te.y,oe.y,he.y,J),Y(ge.z,te.z,oe.z,he.z,J)),C.slerpQuaternions(b[H].q,b[H+1].q,J),ee=J,H}const $=new O,se=new St,X=new St;let ee=0,Q=0;function ue(l,S){const w=new O,C=[0,0,0,0];let b=0,Z=0,H=0;const J=.12*(l.pace?Math.max(.12,l.pace[Math.min(l.pace.length-1,re(l,S,$,se))]):1);for(let oe=-4;oe<=4;oe++){const he=Math.exp(-(oe*oe)/6),Te=re(l,S+oe*J,$,se);oe===0&&(Z=Te,H=ee,X.copy(se)),w.addScaledVector($,he);const me=oe<0||oe>0?Math.sign(se.dot(X)||1):1;C[0]+=he*me*se.x,C[1]+=he*me*se.y,C[2]+=he*me*se.z,C[3]+=he*me*se.w,b+=he}const ge=l.rush,te=ge?ge[Z]+(ge[Math.min(ge.length-1,Z+1)]-ge[Z])*ni(H):0;return{p:w.multiplyScalar(1/b),q:new St(C[0],C[1],C[2],C[3]).normalize(),seg:Z,rush:te}}const ve=new Map;async function Fe(l,S){ve.has(l)||(ve.set(l,fetch(l).then(C=>{if(!C.ok)throw new Error(l+" "+C.status);return C.arrayBuffer()})),ve.get(l).catch(()=>ve.delete(l)),ve.size>6&&ve.delete(ve.keys().next().value));const w=URL.createObjectURL(new Blob([(await ve.get(l)).slice(S[0],S[0]+S[1])],{type:"image/png"}));try{return await G(w)}finally{URL.revokeObjectURL(w)}}async function q(l){if(!l.state){l.state="loading";try{const S=l.d,[w,C]=await Promise.all([G(l.base+S.src),S.at?Fe(l.base+S.depth,S.at):G(l.base+S.depth)]);if(l.state!=="loading")return;const b=document.createElement("canvas");b.width=C.naturalWidth,b.height=C.naturalHeight;const Z=b.getContext("2d",{willReadFrequently:!0});Z.drawImage(C,0,0);const H=Z.getImageData(0,0,b.width,b.height).data,J=b.width,ge=b.height,te=(je,qe)=>{const ct=ni(je)*(J-1),gt=ni(qe)*(ge-1),at=Math.floor(ct),pt=Math.floor(gt),Sn=Math.min(J-1,at+1),En=Math.min(ge-1,pt+1),Qt=ct-at,ii=gt-pt,en=(ri,ai)=>(H[(ai*J+ri)*4]*256+H[(ai*J+ri)*4+1])/65535;return(en(at,pt)*(1-Qt)+en(Sn,pt)*Qt)*(1-ii)+(en(at,En)*(1-Qt)+en(Sn,En)*Qt)*ii},oe=S.w>=S.h?288:216,he=Math.round(oe*S.h/S.w),Te=oe+1,me=new Float32Array(Te*(he+1)*3),Ae=new Float32Array(Te*(he+1)*2),_e=new Float32Array(Te*(he+1));for(let je=0,qe=0;je<=he;je++)for(let ct=0;ct<=oe;ct++,qe++){const gt=ct/oe,at=je/he,pt=Math.min(60,1/Math.max(1e-4,S.A*te(gt,at)+S.B));me[qe*3]=(gt*S.w-S.cx)/S.f*pt,me[qe*3+1]=-((at*S.h-S.cy)/S.f)*pt,me[qe*3+2]=-pt,Ae[qe*2]=gt,Ae[qe*2+1]=1-at,_e[qe]=pt}const ce=[],P=[],le=new Float32Array(Te*(he+1)).fill(1),z=[];for(let je=0;je<he;je++)for(let qe=0;qe<oe;qe++){const ct=je*Te+qe,gt=ct+1,at=ct+Te,pt=at+1,Sn=Math.min(_e[ct],_e[gt],_e[at],_e[pt]),En=Math.max(_e[ct],_e[gt],_e[at],_e[pt]);P.push(ct,at,gt,gt,at,pt),En/Sn<(i.cut||1.14)?ce.push(ct,at,gt,gt,at,pt):z.push(ct,gt,at,pt)}for(const je of z)le[je]=0;const K=new ht(me,3),ae=new ht(Ae,2),de=new ht(new Float32Array(Te*(he+1)).fill(1),1),Ue=(je,qe)=>{const ct=new Vt;return ct.setAttribute("position",K),ct.setAttribute("uv",ae),ct.setAttribute("solid",qe),ct.setIndex(je),ct},pe=new _t(w);pe.colorSpace="",pe.minFilter=1008,pe.anisotropy=4,pe.needsUpdate=!0;const Ge=T(pe),He=je=>{const qe=new bt(je,Ge);return qe.matrixAutoUpdate=!1,qe.matrix.copy(l.m),qe.matrixWorld.copy(l.m),qe.matrixWorldAutoUpdate=!1,qe.frustumCulled=!1,qe};l.cut=He(Ue(ce,new ht(le,1))),l.whole=He(Ue(P,de)),l.tex=pe,l.material=Ge,l.state="ready"}catch(S){l.state="",console.error("Walk3D: could not load",l.d.src,S)}}}function ie(l){if(l.state!=="ready"){l.state==="loading"&&(l.state="");return}l.tex.dispose(),l.material.dispose(),l.cut.geometry.dispose(),l.whole.geometry.dispose(),l.cut=l.whole=l.tex=l.material=null,l.state=""}function Se(l,S){const w=[],C=typeof S=="object";for(const b of l.views)((C?S.has(b.i):b.i>S-l.reach&&b.i<=S+l.reach)?(w.push(b),q):ie)(b);return w}let ne=1,ye=1,Re=0,Ie=!1,Xe=!0,Be=0,Me=!0;const I=new ei,et=l=>{I.clear();for(const S of l)I.add(S)};function ze(){const l=e.getBoundingClientRect();ne=Math.max(1,l.width),ye=Math.max(1,l.height);const S=Math.min(window.devicePixelRatio||1,t?1.5:2);n.setPixelRatio(S),n.setSize(ne,ye,!1);for(const w of p)w.setSize(Math.round(ne*S),Math.round(ye*S));A.uniforms.aspect.value=ne/ye}function Ne(l,S,w,C){var K;const b=ue(l,S),Z=Se(l,l.want?l.want(b.seg):l.centre(b.seg)),H=Z.filter(ae=>ae.state==="ready");if(!H.length||C&&H.length<Z.length)return!1;r.position.copy(b.p),r.quaternion.copy(b.q),w!==u&&(Q=b.rush);const J=ne/ye,ge=Math.min(l.th,l.tw/J);r.aspect=J,r.fov=2*Math.atan(ge)*180/Math.PI,r.updateProjectionMatrix(),r.updateMatrixWorld();const te=L(b.q),oe=ae=>ae.pos.distanceTo(b.p)+Mr*Math.acos(Math.min(1,Math.max(-1,ae.dir.dot(te)))),he=H.map(ae=>[oe(ae),ae]).sort((ae,de)=>ae[0]-de[0]),Te=he[0][1],me=(he[1]||he[0])[1],Ae=he[0][0],_e=(he[1]||he[0])[0],ce=he[2]?he[2][0]:Ae+_e+1e-6,P=Math.max(0,1-Ae/ce),le=he[1]?Math.max(0,1-_e/ce):0;n.setClearColor(0,0),n.setRenderTarget(s),n.clear(),et([Te.cut]),n.render(I,r),n.setRenderTarget(o),n.clear(),et([me.cut]),n.render(I,r);const z=he.slice(2,5).map(ae=>ae[1]);if(n.setRenderTarget(c),n.clear(),et([...new Set([Te,me,...z])].map(ae=>ae.whole)),n.render(I,r),z.length&&(n.clearDepth(),et(z.map(ae=>ae.cut)),n.render(I,r)),I.clear(),h.uniforms.w.value=P+le>0?le/(P+le):0,_.material=h,n.setRenderTarget(f),n.render(v,M),b.rush>.01&&!h.uniforms.audit.value){const ae=ue(l,S+.1*(l.pace?Math.max(.12,l.pace[Math.min(l.pace.length-1,b.seg)])/(1-xr):1)),de=b.q.clone().invert(),Ue=new O(0,0,-1).applyQuaternion(de.clone().multiply(ae.q)),pe=ae.p.clone().sub(b.p).applyQuaternion(de),Ge=((K=i.streak)!=null?K:xu)*b.rush;R.uniforms.streak.value.set(Ue.x/-Ue.z/(ge*J)*.5*Ge,Ue.y/-Ue.z/ge*.5*Ge,-pe.z/3*Ge)}else R.uniforms.streak.value.set(0,0,0);return _.material=R,n.setRenderTarget(w),n.render(v,M),!0}function be(l,S){let w=B.length-1;for(;w>0&&l<B[w].start;)w--;const C=B[w],b=l-C.start,Z=w>0?B[w-1]:null,H=Z?l-Z.start:0;for(const[J,ge]of B.entries())if(J!==w&&!(Z&&J===w-1&&H<=Z.len))for(const te of ge.views)ie(te);if(Z&&H<=Z.len){const J=Ne(Z,H,u,S),ge=Ne(C,b,d,S);return!J&&!ge||S&&!(J&&ge)?!1:(A.uniforms.t.value=J?ge?ni(b/vr):0:1,_.material=A,n.setRenderTarget(null),n.render(v,M),!0)}return Ne(C,b,null,S)}const Ye=()=>{const l=i.section.getBoundingClientRect(),S=l.height-innerHeight;return S>0?ni(-l.top/S):0};function we(l){if(Ie||(requestAnimationFrame(we),!Me&&!Xe))return;const S=Math.min(.1,(l-Be)/1e3||.016);Be=l;const w=Ye(),C=w*x;Re=Xe||Math.abs(C-Re)<4e-4?C:Re+(C-Re)*Math.min(1,S*5),be(Re)&&Xe&&(Xe=!1,i.onLoad&&i.onLoad(1));let b=B.length-1;for(;b>0&&Re<B[b].start+vr/2;)b--;i.onUpdate&&i.onUpdate({frame:Re/x*239,room:b,rush:Q,spans:j,chapters:W,progress:w,portrait:ne<ye,width:ne,height:ye,anchors:{},place:(Z,H)=>[Z*ne,H*ye]})}window.IntersectionObserver&&new IntersectionObserver(l=>{Me=l[0].isIntersecting}).observe(e);let E=0;return addEventListener("resize",()=>{clearTimeout(E),E=setTimeout(ze,120)}),ze(),i.still||requestAnimationFrame(we),{destroy(){Ie=!0},spans:j,chapters:W,total:x,plan:B.map(l=>l.keys.length),async audit(l,S){Ie=!0;const w=B[l];for(const[b,Z]of B.entries())if(b!==l)for(const H of Z.views)ie(H);h.uniforms.audit.value=1;let C=null;for(let b=0;b<800&&!C;b++){if(!Ne(w,w.cum[S],null,!0)){await new Promise(he=>setTimeout(he,40));continue}const Z=n.getContext(),H=Z.drawingBufferWidth,J=Z.drawingBufferHeight,ge=new Uint8Array(H*J*4);Z.readPixels(0,0,H,J,Z.RGBA,Z.UNSIGNED_BYTE,ge);let te=0,oe=0;for(let he=0;he<ge.length;he+=4)ge[he]<128&&te++,ge[he+1]<128&&oe++;C={patched:te/(H*J),hole:oe/(H*J)}}return h.uniforms.audit.value=0,C},async render(l){Ie=!0;const S=l/239*x;for(let w=0;w<800;w++){if(be(S,!0))return!0;await new Promise(C=>setTimeout(C,40))}return!1}}};const Ui=.3,Jt=i=>Math.min(1,Math.max(0,i)),Mu=i=>i*i*(3-2*i);window.Photo3D=function(i){const e=i.canvas,t=window.matchMedia&&matchMedia("(pointer: coarse)").matches,n=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches,r=new mr({canvas:e,antialias:!1,powerPreference:"high-performance"});r.outputColorSpace=Xt;const a=new yt(50,1,.03,300),s=()=>new Ft(4,4,{samples:4}),o=s(),c=s(),u=new Mt({depthTest:!1,uniforms:{a:{value:o.texture},b:{value:c.texture},t:{value:0}},vertexShader:"varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",fragmentShader:"uniform sampler2D a, b; uniform float t; varying vec2 v; void main(){ vec4 A = texture2D(a, v); if (t <= 0.0) { gl_FragColor = vec4(A.rgb, 1.0); return; } float e = 1.3 - 1.7 * t; float f = smoothstep(e - 0.22, e + 0.22, A.a); gl_FragColor = vec4(mix(A.rgb, texture2D(b, v).rgb, f), 1.0); }"}),d=new ei,f=new ar(-1,1,1,-1,0,1);d.add(new bt(new On(2,2),u));const p=ee=>new Mt({uniforms:{map:{value:ee},far:{value:10}},vertexShader:"varying vec2 v; varying float z; void main(){ v = uv; vec4 p = modelViewMatrix * vec4(position, 1.0); z = -p.z; gl_Position = projectionMatrix * p; }",fragmentShader:"uniform sampler2D map; uniform float far; varying vec2 v; varying float z; void main(){ gl_FragColor = vec4(texture2D(map, v).rgb, clamp(z / far, 0.0, 1.0)); }"});let _="",v=[],M=[],m=1,h=1,R=1,A=0,T=!1,G=!0,U=0,L=!0;const B=()=>i.sets.port&&innerHeight>innerWidth*1.05?"port":"land",y=ee=>new Promise((Q,ue)=>{const ve=new Image;ve.decoding="async",ve.onload=()=>Q(ve),ve.onerror=ue,ve.src=ee});async function x(ee){const Q=_,ue=M[ee];if(!(!ue||ue.state)){ue.state="loading";try{const[ve,Fe]=await Promise.all([y(ue.def.src),y(ue.def.depth)]);if(_!==Q||ue.state!=="loading")return;const q=document.createElement("canvas");q.width=Fe.naturalWidth,q.height=Fe.naturalHeight;const ie=q.getContext("2d",{willReadFrequently:!0});ie.drawImage(Fe,0,0);const Se=ie.getImageData(0,0,q.width,q.height).data,ne=q.width,ye=q.height,Re=(Ae,_e)=>{const ce=Jt(Ae)*(ne-1),P=Jt(_e)*(ye-1),le=Math.floor(ce),z=Math.floor(P),K=Math.min(ne-1,le+1),ae=Math.min(ye-1,z+1),de=ce-le,Ue=P-z,pe=(Ge,He)=>(Se[(He*ne+Ge)*4]*256+Se[(He*ne+Ge)*4+1])/65535;return(pe(le,z)*(1-de)+pe(K,z)*de)*(1-Ue)+(pe(le,ae)*(1-de)+pe(K,ae)*de)*Ue},Ie=ve.naturalWidth/ve.naturalHeight,Xe=(ue.def.fov||84)*Math.PI/360,Be=Ie>=1?Math.tan(Xe):Math.tan(Xe)*Ie,Me=Be/Ie,I=1,et=ue.def.far||14,ze=Ae=>1/(Ae*(1/I-1/et)+1/et),Ne=Ie>=1?232:174,be=Math.round(Ne/Ie),Ye=new Float32Array((Ne+3)*(be+3)*3),we=new Float32Array((Ne+3)*(be+3)*2),E=[];for(let Ae=-1,_e=0;Ae<=be+1;Ae++)for(let ce=-1;ce<=Ne+1;ce++,_e++){const P=Jt(ce/Ne),le=Jt(Ae/be),z=ze(Re(P,le)),K=ce<0?-.75:ce>Ne?1.75:P,ae=Ae<0?-.75:Ae>be?1.75:le;Ye[_e*3]=(K-.5)*2*Be*z,Ye[_e*3+1]=-(ae-.5)*2*Me*z,Ye[_e*3+2]=-z,we[_e*2]=P,we[_e*2+1]=1-le,ce%4===0&&Ae%4===0&&E.push(z)}const l=new Uint32Array((Ne+2)*(be+2)*6),S=Ne+3;for(let Ae=0,_e=0;Ae<be+2;Ae++)for(let ce=0;ce<Ne+2;ce++){const P=Ae*S+ce;l[_e++]=P,l[_e++]=P+S,l[_e++]=P+1,l[_e++]=P+1,l[_e++]=P+S,l[_e++]=P+S+1}const w=new Vt;w.setAttribute("position",new ht(Ye,3)),w.setAttribute("uv",new ht(we,2)),w.setIndex(new ht(l,1));const C=new _t(ve);C.colorSpace="",C.generateMipmaps=!0,C.minFilter=1008,C.anisotropy=4,C.needsUpdate=!0;const b=p(C),Z=new bt(w,b);Z.frustumCulled=!1,ue.scene=new ei,ue.scene.add(Z);const H=ue.def.to||[.5,.5],J=new O((H[0]-.5)*2*Be,-(H[1]-.5)*2*Me,-1),ge=[];for(let Ae=-3;Ae<=3;Ae++)for(let _e=-3;_e<=3;_e++)ge.push(ze(Re(H[0]+Ae*.035,H[1]+_e*.035)));ge.sort((Ae,_e)=>Ae-_e),E.sort((Ae,_e)=>Ae-_e);const te=ge[Math.floor(ge.length*.15)],oe=E[Math.floor(E.length/2)],he=E[Math.floor(E.length*.03)];ue.move=J.clone().multiplyScalar(Math.min(.4*te,.6*oe,.45*he)*(ue.def.push||1)),ue.sway=.011*oe,b.uniforms.far.value=Math.min(et,E[Math.floor(E.length*.97)])*1.02;const Te=new St().setFromUnitVectors(new O(0,0,-1),J.clone().normalize()),me=2*Math.acos(Math.min(1,Math.abs(Te.w)));ue.turn=new St().slerp(Te,me>0?Math.min(1,.07/me):0),ue.tw=Be,ue.th=Me,ue.tex=C,ue.geo=w,ue.mat=b,ue.state="ready"}catch(ve){ue.state="",console.error("Photo3D: could not load",ue.def.src,ve)}}}function D(ee){const Q=M[ee];Q&&Q.state==="ready"&&(Q.tex.dispose(),Q.geo.dispose(),Q.mat.dispose(),Q.scene=Q.tex=Q.geo=Q.mat=null,Q.state="")}function j(ee){for(let Q=0;Q<M.length;Q++)D(Q);_=ee,v=i.sets[ee],M=v.map(Q=>({def:Q,state:""})),m=(M.length-1)*(1-Ui)+1,G=!0}function W(){const ee=e.getBoundingClientRect();h=Math.max(1,ee.width),R=Math.max(1,ee.height);const Q=Math.min(window.devicePixelRatio||1,t?1.5:2);r.setPixelRatio(Q),r.setSize(h,R,!1),o.setSize(Math.round(h*Q),Math.round(R*Q)),c.setSize(Math.round(h*Q),Math.round(R*Q))}function Y(ee,Q,ue,ve){const Fe=M[ee],q=h/R,ie=.8,Se=Math.min(ie*Fe.th,ie*Fe.tw/q);a.aspect=q,a.fov=2*Math.atan(Se)*180/Math.PI,a.updateProjectionMatrix();const ne=n||ve==null?0:Fe.sway;a.position.copy(Fe.move).multiplyScalar(Q).add(new O(Math.sin(ve*9e-4)*ne,Math.sin(ve*6e-4+1)*ne*.5,0)),a.quaternion.identity().slerp(Fe.turn,Mu(Jt(Q*1.2))),a.updateMatrixWorld(),r.setRenderTarget(ue),r.setClearColor(0,1),r.clear(),r.render(Fe.scene,a)}function re(ee,Q,ue){const ve=1-Ui,Fe=Math.min(M.length-1,Math.floor(ee/ve+1e-6)),q=ee-Fe*ve,[ie,Se,ne,ye]=Fe>0&&q<Ui?[Fe-1,q+ve,Fe,q]:[Fe,Math.min(1,q),Fe+1,q-ve];for(let Xe=0;Xe<M.length;Xe++)(Xe>=ie-1&&Xe<=ie+2?x:D)(Xe);const Re=ne<M.length&&ye>0;if(M[ie].state!=="ready"||ue&&Re&&M[ne].state!=="ready")return!1;let Ie=0;return Y(ie,Jt(Se),o,Q),Re&&M[ne].state==="ready"&&(Ie=Jt(ye/Ui),Y(ne,Jt(ye),c,Q)),u.uniforms.t.value=Ie,r.setRenderTarget(null),r.render(d,f),!0}const $=()=>{const ee=i.section.getBoundingClientRect(),Q=ee.height-innerHeight;return Q>0?Jt(-ee.top/Q):0};function se(ee){if(T||(requestAnimationFrame(se),!L&&!G))return;const Q=Math.min(.1,(ee-U)/1e3||.016);U=ee;const ue=$(),ve=ue*m;A=G||Math.abs(ve-A)<4e-4?ve:A+(ve-A)*Math.min(1,Q*6),re(A,ee)&&G&&(G=!1,i.onLoad&&i.onLoad(1)),i.onUpdate&&i.onUpdate({frame:A/m*239,progress:ue,portrait:_==="port",width:h,height:R,anchors:{},place:(q,ie)=>[q*h,ie*R]})}window.IntersectionObserver&&new IntersectionObserver(ee=>{L=ee[0].isIntersecting}).observe(e);let X=0;return addEventListener("resize",()=>{clearTimeout(X),X=setTimeout(()=>{W(),B()!==_&&j(B())},120)}),j(B()),W(),i.still||requestAnimationFrame(se),{destroy(){T=!0},get total(){return m},async render(ee){T=!0;const Q=ee/239*m;for(let ue=0;ue<600;ue++){if(re(Q,null,!0))return!0;await new Promise(ve=>setTimeout(ve,40))}return!1}}}})();
