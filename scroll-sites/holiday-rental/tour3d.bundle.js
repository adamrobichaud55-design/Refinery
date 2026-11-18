(function(){"use strict";/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const At="srgb",bn="srgb-linear",pi="linear",Je="srgb",Ur="300 es";class An{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const r=this._listeners[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const _t=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Gi=Math.PI/180,Vi=180/Math.PI;function Kn(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(_t[i&255]+_t[i>>8&255]+_t[i>>16&255]+_t[i>>24&255]+"-"+_t[e&255]+_t[e>>8&255]+"-"+_t[e>>16&15|64]+_t[e>>24&255]+"-"+_t[t&63|128]+_t[t>>8&255]+"-"+_t[t>>16&255]+_t[t>>24&255]+_t[n&255]+_t[n>>8&255]+_t[n>>16&255]+_t[n>>24&255]).toLowerCase()}function Et(i,e,t){return Math.max(e,Math.min(t,i))}function na(i,e){return(i%e+e)%e}function Hi(i,e,t){return(1-t)*i+t*e}function Zn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Tt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class Pe{constructor(e=0,t=0){Pe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Et(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*r+e.x,this.y=s*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ne{constructor(e,t,n,r,s,a,o,l,h){Ne.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,h)}set(e,t,n,r,s,a,o,l,h){const f=this.elements;return f[0]=e,f[1]=r,f[2]=o,f[3]=t,f[4]=s,f[5]=l,f[6]=n,f[7]=a,f[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[3],l=n[6],h=n[1],f=n[4],c=n[7],d=n[2],m=n[5],_=n[8],S=r[0],p=r[3],u=r[6],y=r[1],E=r[4],M=r[7],B=r[2],w=r[5],C=r[8];return s[0]=a*S+o*y+l*B,s[3]=a*p+o*E+l*w,s[6]=a*u+o*M+l*C,s[1]=h*S+f*y+c*B,s[4]=h*p+f*E+c*w,s[7]=h*u+f*M+c*C,s[2]=d*S+m*y+_*B,s[5]=d*p+m*E+_*w,s[8]=d*u+m*M+_*C,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],h=e[7],f=e[8];return t*a*f-t*o*h-n*s*f+n*o*l+r*s*h-r*a*l}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],h=e[7],f=e[8],c=f*a-o*h,d=o*l-f*s,m=h*s-a*l,_=t*c+n*d+r*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/_;return e[0]=c*S,e[1]=(r*h-f*n)*S,e[2]=(o*n-r*a)*S,e[3]=d*S,e[4]=(f*t-r*l)*S,e[5]=(r*s-o*t)*S,e[6]=m*S,e[7]=(n*l-h*t)*S,e[8]=(a*t-n*s)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,a,o){const l=Math.cos(s),h=Math.sin(s);return this.set(n*l,n*h,-n*(l*a+h*o)+a+e,-r*h,r*l,-r*(-h*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(ki.makeScale(e,t)),this}rotate(e){return this.premultiply(ki.makeRotation(-e)),this}translate(e,t){return this.premultiply(ki.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ki=new Ne;function Ir(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function mi(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ia(){const i=mi("canvas");return i.style.display="block",i}const Fr={};function jn(i){i in Fr||(Fr[i]=!0,console.warn(i))}function ra(i,e,t){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}function sa(i){const e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function aa(i){const e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}const Xe={enabled:!0,workingColorSpace:bn,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===Je&&(i.r=Yt(i.r),i.g=Yt(i.g),i.b=Yt(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===Je&&(i.r=Rn(i.r),i.g=Rn(i.g),i.b=Rn(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===""?pi:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Yt(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Rn(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const Nr=[.64,.33,.3,.6,.15,.06],Br=[.2126,.7152,.0722],Or=[.3127,.329],zr=new Ne().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Gr=new Ne().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Xe.define({[bn]:{primaries:Nr,whitePoint:Or,transfer:pi,toXYZ:zr,fromXYZ:Gr,luminanceCoefficients:Br,workingColorSpaceConfig:{unpackColorSpace:At},outputColorSpaceConfig:{drawingBufferColorSpace:At}},[At]:{primaries:Nr,whitePoint:Or,transfer:Je,toXYZ:zr,fromXYZ:Gr,luminanceCoefficients:Br,outputColorSpaceConfig:{drawingBufferColorSpace:At}}});let wn;class oa{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement=="undefined")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{wn===void 0&&(wn=mi("canvas")),wn.width=e.width,wn.height=e.height;const n=wn.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=wn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement!="undefined"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&e instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&e instanceof ImageBitmap){const t=mi("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Yt(s[a]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Yt(t[n]/255)*255):t[n]=Yt(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let la=0;class Vr{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:la++}),this.uuid=Kn(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Wi(r[a].image)):s.push(Wi(r[a]))}else s=Wi(r);n.url=s}return t||(e.images[this.uuid]=n),n}}function Wi(i){return typeof HTMLImageElement!="undefined"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&i instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&i instanceof ImageBitmap?oa.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let ca=0;class xt extends An{constructor(e=xt.DEFAULT_IMAGE,t=xt.DEFAULT_MAPPING,n=1001,r=1001,s=1006,a=1008,o=1023,l=1009,h=xt.DEFAULT_ANISOTROPY,f=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ca++}),this.uuid=Kn(),this.name="",this.source=new Vr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Pe(0,0),this.repeat=new Pe(1,1),this.center=new Pe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ne,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1e3:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1e3:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}xt.DEFAULT_IMAGE=null,xt.DEFAULT_MAPPING=300,xt.DEFAULT_ANISOTROPY=1;class Qe{constructor(e=0,t=0,n=0,r=1){Qe.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s;const l=e.elements,h=l[0],f=l[4],c=l[8],d=l[1],m=l[5],_=l[9],S=l[2],p=l[6],u=l[10];if(Math.abs(f-d)<.01&&Math.abs(c-S)<.01&&Math.abs(_-p)<.01){if(Math.abs(f+d)<.1&&Math.abs(c+S)<.1&&Math.abs(_+p)<.1&&Math.abs(h+m+u-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const E=(h+1)/2,M=(m+1)/2,B=(u+1)/2,w=(f+d)/4,C=(c+S)/4,L=(_+p)/4;return E>M&&E>B?E<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(E),r=w/n,s=C/n):M>B?M<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(M),n=w/r,s=L/r):B<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(B),n=C/s,r=L/s),this.set(n,r,s,t),this}let y=Math.sqrt((p-_)*(p-_)+(c-S)*(c-S)+(d-f)*(d-f));return Math.abs(y)<.001&&(y=1),this.x=(p-_)/y,this.y=(c-S)/y,this.z=(d-f)/y,this.w=Math.acos((h+m+u-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class ua extends An{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Qe(0,0,e,t),this.scissorTest=!1,this.viewport=new Qe(0,0,e,t);const r={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new xt(r,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,r=e.textures.length;n<r;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Vr(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Dt extends ua{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Hr extends xt{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class ha extends xt{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Jn{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,s,a,o){let l=n[r+0],h=n[r+1],f=n[r+2],c=n[r+3];const d=s[a+0],m=s[a+1],_=s[a+2],S=s[a+3];if(o===0){e[t+0]=l,e[t+1]=h,e[t+2]=f,e[t+3]=c;return}if(o===1){e[t+0]=d,e[t+1]=m,e[t+2]=_,e[t+3]=S;return}if(c!==S||l!==d||h!==m||f!==_){let p=1-o;const u=l*d+h*m+f*_+c*S,y=u>=0?1:-1,E=1-u*u;if(E>Number.EPSILON){const B=Math.sqrt(E),w=Math.atan2(B,u*y);p=Math.sin(p*w)/B,o=Math.sin(o*w)/B}const M=o*y;if(l=l*p+d*M,h=h*p+m*M,f=f*p+_*M,c=c*p+S*M,p===1-o){const B=1/Math.sqrt(l*l+h*h+f*f+c*c);l*=B,h*=B,f*=B,c*=B}}e[t]=l,e[t+1]=h,e[t+2]=f,e[t+3]=c}static multiplyQuaternionsFlat(e,t,n,r,s,a){const o=n[r],l=n[r+1],h=n[r+2],f=n[r+3],c=s[a],d=s[a+1],m=s[a+2],_=s[a+3];return e[t]=o*_+f*c+l*m-h*d,e[t+1]=l*_+f*d+h*c-o*m,e[t+2]=h*_+f*m+o*d-l*c,e[t+3]=f*_-o*c-l*d-h*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,h=o(n/2),f=o(r/2),c=o(s/2),d=l(n/2),m=l(r/2),_=l(s/2);switch(a){case"XYZ":this._x=d*f*c+h*m*_,this._y=h*m*c-d*f*_,this._z=h*f*_+d*m*c,this._w=h*f*c-d*m*_;break;case"YXZ":this._x=d*f*c+h*m*_,this._y=h*m*c-d*f*_,this._z=h*f*_-d*m*c,this._w=h*f*c+d*m*_;break;case"ZXY":this._x=d*f*c-h*m*_,this._y=h*m*c+d*f*_,this._z=h*f*_+d*m*c,this._w=h*f*c-d*m*_;break;case"ZYX":this._x=d*f*c-h*m*_,this._y=h*m*c+d*f*_,this._z=h*f*_-d*m*c,this._w=h*f*c+d*m*_;break;case"YZX":this._x=d*f*c+h*m*_,this._y=h*m*c+d*f*_,this._z=h*f*_-d*m*c,this._w=h*f*c-d*m*_;break;case"XZY":this._x=d*f*c-h*m*_,this._y=h*m*c-d*f*_,this._z=h*f*_+d*m*c,this._w=h*f*c+d*m*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],h=t[2],f=t[6],c=t[10],d=n+o+c;if(d>0){const m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(f-l)*m,this._y=(s-h)*m,this._z=(a-r)*m}else if(n>o&&n>c){const m=2*Math.sqrt(1+n-o-c);this._w=(f-l)/m,this._x=.25*m,this._y=(r+a)/m,this._z=(s+h)/m}else if(o>c){const m=2*Math.sqrt(1+o-n-c);this._w=(s-h)/m,this._x=(r+a)/m,this._y=.25*m,this._z=(l+f)/m}else{const m=2*Math.sqrt(1+c-n-o);this._w=(a-r)/m,this._x=(s+h)/m,this._y=(l+f)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Et(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,h=t._z,f=t._w;return this._x=n*f+a*o+r*h-s*l,this._y=r*f+a*l+s*o-n*h,this._z=s*f+a*h+n*l-r*o,this._w=a*f-n*o-r*l-s*h,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,r=this._y,s=this._z,a=this._w;let o=a*e._w+n*e._x+r*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=r,this._z=s,this;const l=1-o*o;if(l<=Number.EPSILON){const m=1-t;return this._w=m*a+t*this._w,this._x=m*n+t*this._x,this._y=m*r+t*this._y,this._z=m*s+t*this._z,this.normalize(),this}const h=Math.sqrt(l),f=Math.atan2(h,o),c=Math.sin((1-t)*f)/h,d=Math.sin(t*f)/h;return this._w=a*c+this._w*d,this._x=n*c+this._x*d,this._y=r*c+this._y*d,this._z=s*c+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class U{constructor(e=0,t=0,n=0){U.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(kr.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(kr.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,h=2*(a*r-o*n),f=2*(o*t-s*r),c=2*(s*n-a*t);return this.x=t+l*h+a*c-o*f,this.y=n+l*f+o*h-s*c,this.z=r+l*c+s*f-a*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-n*l,this.z=n*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Xi.copy(this).projectOnVector(e),this.sub(Xi)}reflect(e){return this.sub(Xi.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Et(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Xi=new U,kr=new Jn;class Qn{constructor(e=new U(1/0,1/0,1/0),t=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Nt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Nt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Nt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Nt):Nt.fromBufferAttribute(s,a),Nt.applyMatrix4(e.matrixWorld),this.expandByPoint(Nt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),_i.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),_i.copy(n.boundingBox)),_i.applyMatrix4(e.matrixWorld),this.union(_i)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Nt),Nt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ei),gi.subVectors(this.max,ei),Cn.subVectors(e.a,ei),Pn.subVectors(e.b,ei),Dn.subVectors(e.c,ei),tn.subVectors(Pn,Cn),nn.subVectors(Dn,Pn),fn.subVectors(Cn,Dn);let t=[0,-tn.z,tn.y,0,-nn.z,nn.y,0,-fn.z,fn.y,tn.z,0,-tn.x,nn.z,0,-nn.x,fn.z,0,-fn.x,-tn.y,tn.x,0,-nn.y,nn.x,0,-fn.y,fn.x,0];return!qi(t,Cn,Pn,Dn,gi)||(t=[1,0,0,0,1,0,0,0,1],!qi(t,Cn,Pn,Dn,gi))?!1:(vi.crossVectors(tn,nn),t=[vi.x,vi.y,vi.z],qi(t,Cn,Pn,Dn,gi))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Nt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Nt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:($t[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),$t[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),$t[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),$t[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),$t[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),$t[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),$t[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),$t[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints($t),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const $t=[new U,new U,new U,new U,new U,new U,new U,new U],Nt=new U,_i=new Qn,Cn=new U,Pn=new U,Dn=new U,tn=new U,nn=new U,fn=new U,ei=new U,gi=new U,vi=new U,dn=new U;function qi(i,e,t,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){dn.fromArray(i,s);const o=r.x*Math.abs(dn.x)+r.y*Math.abs(dn.y)+r.z*Math.abs(dn.z),l=e.dot(dn),h=t.dot(dn),f=n.dot(dn);if(Math.max(-Math.max(l,h,f),Math.min(l,h,f))>o)return!1}return!0}const fa=new Qn,ti=new U,Yi=new U;class $i{constructor(e=new U,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):fa.setFromPoints(e).getCenter(n);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ti.subVectors(e,this.center);const t=ti.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(ti,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Yi.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ti.copy(e.center).add(Yi)),this.expandByPoint(ti.copy(e.center).sub(Yi))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Kt=new U,Ki=new U,xi=new U,rn=new U,Zi=new U,Mi=new U,ji=new U;class da{constructor(e=new U,t=new U(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Kt)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Kt.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Kt.copy(this.origin).addScaledVector(this.direction,t),Kt.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Ki.copy(e).add(t).multiplyScalar(.5),xi.copy(t).sub(e).normalize(),rn.copy(this.origin).sub(Ki);const s=e.distanceTo(t)*.5,a=-this.direction.dot(xi),o=rn.dot(this.direction),l=-rn.dot(xi),h=rn.lengthSq(),f=Math.abs(1-a*a);let c,d,m,_;if(f>0)if(c=a*l-o,d=a*o-l,_=s*f,c>=0)if(d>=-_)if(d<=_){const S=1/f;c*=S,d*=S,m=c*(c+a*d+2*o)+d*(a*c+d+2*l)+h}else d=s,c=Math.max(0,-(a*d+o)),m=-c*c+d*(d+2*l)+h;else d=-s,c=Math.max(0,-(a*d+o)),m=-c*c+d*(d+2*l)+h;else d<=-_?(c=Math.max(0,-(-a*s+o)),d=c>0?-s:Math.min(Math.max(-s,-l),s),m=-c*c+d*(d+2*l)+h):d<=_?(c=0,d=Math.min(Math.max(-s,-l),s),m=d*(d+2*l)+h):(c=Math.max(0,-(a*s+o)),d=c>0?s:Math.min(Math.max(-s,-l),s),m=-c*c+d*(d+2*l)+h);else d=a>0?-s:s,c=Math.max(0,-(a*d+o)),m=-c*c+d*(d+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,c),r&&r.copy(Ki).addScaledVector(xi,d),m}intersectSphere(e,t){Kt.subVectors(e.center,this.origin);const n=Kt.dot(this.direction),r=Kt.dot(Kt)-n*n,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,a,o,l;const h=1/this.direction.x,f=1/this.direction.y,c=1/this.direction.z,d=this.origin;return h>=0?(n=(e.min.x-d.x)*h,r=(e.max.x-d.x)*h):(n=(e.max.x-d.x)*h,r=(e.min.x-d.x)*h),f>=0?(s=(e.min.y-d.y)*f,a=(e.max.y-d.y)*f):(s=(e.max.y-d.y)*f,a=(e.min.y-d.y)*f),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),c>=0?(o=(e.min.z-d.z)*c,l=(e.max.z-d.z)*c):(o=(e.max.z-d.z)*c,l=(e.min.z-d.z)*c),n>l||o>r)||((o>n||n!==n)&&(n=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Kt)!==null}intersectTriangle(e,t,n,r,s){Zi.subVectors(t,e),Mi.subVectors(n,e),ji.crossVectors(Zi,Mi);let a=this.direction.dot(ji),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;rn.subVectors(this.origin,e);const l=o*this.direction.dot(Mi.crossVectors(rn,Mi));if(l<0)return null;const h=o*this.direction.dot(Zi.cross(rn));if(h<0||l+h>a)return null;const f=-o*rn.dot(ji);return f<0?null:this.at(f/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class rt{constructor(e,t,n,r,s,a,o,l,h,f,c,d,m,_,S,p){rt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,h,f,c,d,m,_,S,p)}set(e,t,n,r,s,a,o,l,h,f,c,d,m,_,S,p){const u=this.elements;return u[0]=e,u[4]=t,u[8]=n,u[12]=r,u[1]=s,u[5]=a,u[9]=o,u[13]=l,u[2]=h,u[6]=f,u[10]=c,u[14]=d,u[3]=m,u[7]=_,u[11]=S,u[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new rt().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,r=1/Ln.setFromMatrixColumn(e,0).length(),s=1/Ln.setFromMatrixColumn(e,1).length(),a=1/Ln.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(r),h=Math.sin(r),f=Math.cos(s),c=Math.sin(s);if(e.order==="XYZ"){const d=a*f,m=a*c,_=o*f,S=o*c;t[0]=l*f,t[4]=-l*c,t[8]=h,t[1]=m+_*h,t[5]=d-S*h,t[9]=-o*l,t[2]=S-d*h,t[6]=_+m*h,t[10]=a*l}else if(e.order==="YXZ"){const d=l*f,m=l*c,_=h*f,S=h*c;t[0]=d+S*o,t[4]=_*o-m,t[8]=a*h,t[1]=a*c,t[5]=a*f,t[9]=-o,t[2]=m*o-_,t[6]=S+d*o,t[10]=a*l}else if(e.order==="ZXY"){const d=l*f,m=l*c,_=h*f,S=h*c;t[0]=d-S*o,t[4]=-a*c,t[8]=_+m*o,t[1]=m+_*o,t[5]=a*f,t[9]=S-d*o,t[2]=-a*h,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const d=a*f,m=a*c,_=o*f,S=o*c;t[0]=l*f,t[4]=_*h-m,t[8]=d*h+S,t[1]=l*c,t[5]=S*h+d,t[9]=m*h-_,t[2]=-h,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const d=a*l,m=a*h,_=o*l,S=o*h;t[0]=l*f,t[4]=S-d*c,t[8]=_*c+m,t[1]=c,t[5]=a*f,t[9]=-o*f,t[2]=-h*f,t[6]=m*c+_,t[10]=d-S*c}else if(e.order==="XZY"){const d=a*l,m=a*h,_=o*l,S=o*h;t[0]=l*f,t[4]=-c,t[8]=h*f,t[1]=d*c+S,t[5]=a*f,t[9]=m*c-_,t[2]=_*c-m,t[6]=o*f,t[10]=S*c+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(pa,e,ma)}lookAt(e,t,n){const r=this.elements;return Rt.subVectors(e,t),Rt.lengthSq()===0&&(Rt.z=1),Rt.normalize(),sn.crossVectors(n,Rt),sn.lengthSq()===0&&(Math.abs(n.z)===1?Rt.x+=1e-4:Rt.z+=1e-4,Rt.normalize(),sn.crossVectors(n,Rt)),sn.normalize(),Si.crossVectors(Rt,sn),r[0]=sn.x,r[4]=Si.x,r[8]=Rt.x,r[1]=sn.y,r[5]=Si.y,r[9]=Rt.y,r[2]=sn.z,r[6]=Si.z,r[10]=Rt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[4],l=n[8],h=n[12],f=n[1],c=n[5],d=n[9],m=n[13],_=n[2],S=n[6],p=n[10],u=n[14],y=n[3],E=n[7],M=n[11],B=n[15],w=r[0],C=r[4],L=r[8],T=r[12],v=r[1],P=r[5],H=r[9],V=r[13],Y=r[2],te=r[6],Z=r[10],le=r[14],$=r[3],de=r[7],pe=r[11],_e=r[15];return s[0]=a*w+o*v+l*Y+h*$,s[4]=a*C+o*P+l*te+h*de,s[8]=a*L+o*H+l*Z+h*pe,s[12]=a*T+o*V+l*le+h*_e,s[1]=f*w+c*v+d*Y+m*$,s[5]=f*C+c*P+d*te+m*de,s[9]=f*L+c*H+d*Z+m*pe,s[13]=f*T+c*V+d*le+m*_e,s[2]=_*w+S*v+p*Y+u*$,s[6]=_*C+S*P+p*te+u*de,s[10]=_*L+S*H+p*Z+u*pe,s[14]=_*T+S*V+p*le+u*_e,s[3]=y*w+E*v+M*Y+B*$,s[7]=y*C+E*P+M*te+B*de,s[11]=y*L+E*H+M*Z+B*pe,s[15]=y*T+E*V+M*le+B*_e,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],h=e[13],f=e[2],c=e[6],d=e[10],m=e[14],_=e[3],S=e[7],p=e[11],u=e[15];return _*(+s*l*c-r*h*c-s*o*d+n*h*d+r*o*m-n*l*m)+S*(+t*l*m-t*h*d+s*a*d-r*a*m+r*h*f-s*l*f)+p*(+t*h*c-t*o*m-s*a*c+n*a*m+s*o*f-n*h*f)+u*(-r*o*f-t*l*c+t*o*d+r*a*c-n*a*d+n*l*f)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],h=e[7],f=e[8],c=e[9],d=e[10],m=e[11],_=e[12],S=e[13],p=e[14],u=e[15],y=c*p*h-S*d*h+S*l*m-o*p*m-c*l*u+o*d*u,E=_*d*h-f*p*h-_*l*m+a*p*m+f*l*u-a*d*u,M=f*S*h-_*c*h+_*o*m-a*S*m-f*o*u+a*c*u,B=_*c*l-f*S*l-_*o*d+a*S*d+f*o*p-a*c*p,w=t*y+n*E+r*M+s*B;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const C=1/w;return e[0]=y*C,e[1]=(S*d*s-c*p*s-S*r*m+n*p*m+c*r*u-n*d*u)*C,e[2]=(o*p*s-S*l*s+S*r*h-n*p*h-o*r*u+n*l*u)*C,e[3]=(c*l*s-o*d*s-c*r*h+n*d*h+o*r*m-n*l*m)*C,e[4]=E*C,e[5]=(f*p*s-_*d*s+_*r*m-t*p*m-f*r*u+t*d*u)*C,e[6]=(_*l*s-a*p*s-_*r*h+t*p*h+a*r*u-t*l*u)*C,e[7]=(a*d*s-f*l*s+f*r*h-t*d*h-a*r*m+t*l*m)*C,e[8]=M*C,e[9]=(_*c*s-f*S*s-_*n*m+t*S*m+f*n*u-t*c*u)*C,e[10]=(a*S*s-_*o*s+_*n*h-t*S*h-a*n*u+t*o*u)*C,e[11]=(f*o*s-a*c*s-f*n*h+t*c*h+a*n*m-t*o*m)*C,e[12]=B*C,e[13]=(f*S*r-_*c*r+_*n*d-t*S*d-f*n*p+t*c*p)*C,e[14]=(_*o*r-a*S*r-_*n*l+t*S*l+a*n*p-t*o*p)*C,e[15]=(a*c*r-f*o*r+f*n*l-t*c*l-a*n*d+t*o*d)*C,this}scale(e){const t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),s=1-n,a=e.x,o=e.y,l=e.z,h=s*a,f=s*o;return this.set(h*a+n,h*o-r*l,h*l+r*o,0,h*o+r*l,f*o+n,f*l-r*a,0,h*l-r*o,f*l+r*a,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,a){return this.set(1,n,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,h=s+s,f=a+a,c=o+o,d=s*h,m=s*f,_=s*c,S=a*f,p=a*c,u=o*c,y=l*h,E=l*f,M=l*c,B=n.x,w=n.y,C=n.z;return r[0]=(1-(S+u))*B,r[1]=(m+M)*B,r[2]=(_-E)*B,r[3]=0,r[4]=(m-M)*w,r[5]=(1-(d+u))*w,r[6]=(p+y)*w,r[7]=0,r[8]=(_+E)*C,r[9]=(p-y)*C,r[10]=(1-(d+S))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;let s=Ln.set(r[0],r[1],r[2]).length();const a=Ln.set(r[4],r[5],r[6]).length(),o=Ln.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],Bt.copy(this);const h=1/s,f=1/a,c=1/o;return Bt.elements[0]*=h,Bt.elements[1]*=h,Bt.elements[2]*=h,Bt.elements[4]*=f,Bt.elements[5]*=f,Bt.elements[6]*=f,Bt.elements[8]*=c,Bt.elements[9]*=c,Bt.elements[10]*=c,t.setFromRotationMatrix(Bt),n.x=s,n.y=a,n.z=o,this}makePerspective(e,t,n,r,s,a,o=2e3){const l=this.elements,h=2*s/(t-e),f=2*s/(n-r),c=(t+e)/(t-e),d=(n+r)/(n-r);let m,_;if(o===2e3)m=-(a+s)/(a-s),_=-2*a*s/(a-s);else if(o===2001)m=-a/(a-s),_=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=c,l[12]=0,l[1]=0,l[5]=f,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,r,s,a,o=2e3){const l=this.elements,h=1/(t-e),f=1/(n-r),c=1/(a-s),d=(t+e)*h,m=(n+r)*f;let _,S;if(o===2e3)_=(a+s)*c,S=-2*c;else if(o===2001)_=s*c,S=-1*c;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*h,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*f,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=S,l[14]=-_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const Ln=new U,Bt=new rt,pa=new U(0,0,0),ma=new U(1,1,1),sn=new U,Si=new U,Rt=new U,Wr=new rt,Xr=new Jn;class kt{constructor(e=0,t=0,n=0,r=kt.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],h=r[5],f=r[9],c=r[2],d=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(Et(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-f,m),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-Et(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-c,s),this._z=0);break;case"ZXY":this._x=Math.asin(Et(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-c,m),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Et(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(Et(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-f,h),this._y=Math.atan2(-c,s)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Et(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-f,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Wr.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Wr,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Xr.setFromEuler(this),this.setFromQuaternion(Xr,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}kt.DEFAULT_ORDER="XYZ";class qr{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let _a=0;const Yr=new U,Un=new Jn,Zt=new rt,Ei=new U,ni=new U,ga=new U,va=new Jn,$r=new U(1,0,0),Kr=new U(0,1,0),Zr=new U(0,0,1),jr={type:"added"},xa={type:"removed"},In={type:"childadded",child:null},Ji={type:"childremoved",child:null};class dt extends An{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:_a++}),this.uuid=Kn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=dt.DEFAULT_UP.clone();const e=new U,t=new kt,n=new Jn,r=new U(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new rt},normalMatrix:{value:new Ne}}),this.matrix=new rt,this.matrixWorld=new rt,this.matrixAutoUpdate=dt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new qr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Un.setFromAxisAngle(e,t),this.quaternion.multiply(Un),this}rotateOnWorldAxis(e,t){return Un.setFromAxisAngle(e,t),this.quaternion.premultiply(Un),this}rotateX(e){return this.rotateOnAxis($r,e)}rotateY(e){return this.rotateOnAxis(Kr,e)}rotateZ(e){return this.rotateOnAxis(Zr,e)}translateOnAxis(e,t){return Yr.copy(e).applyQuaternion(this.quaternion),this.position.add(Yr.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis($r,e)}translateY(e){return this.translateOnAxis(Kr,e)}translateZ(e){return this.translateOnAxis(Zr,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Zt.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ei.copy(e):Ei.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),ni.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zt.lookAt(ni,Ei,this.up):Zt.lookAt(Ei,ni,this.up),this.quaternion.setFromRotationMatrix(Zt),r&&(Zt.extractRotation(r.matrixWorld),Un.setFromRotationMatrix(Zt),this.quaternion.premultiply(Un.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(jr),In.child=e,this.dispatchEvent(In),In.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(xa),Ji.child=e,this.dispatchEvent(Ji),Ji.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Zt.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Zt.multiply(e.parent.matrixWorld)),e.applyMatrix4(Zt),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(jr),In.child=e,this.dispatchEvent(In),In.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ni,e,ga),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ni,va,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let h=0,f=l.length;h<f;h++){const c=l[h];s(e.shapes,c)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,h=this.material.length;l<h;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),h=a(e.textures),f=a(e.images),c=a(e.shapes),d=a(e.skeletons),m=a(e.animations),_=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),f.length>0&&(n.images=f),c.length>0&&(n.shapes=c),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),_.length>0&&(n.nodes=_)}return n.object=r,n;function a(o){const l=[];for(const h in o){const f=o[h];delete f.metadata,l.push(f)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}}dt.DEFAULT_UP=new U(0,1,0),dt.DEFAULT_MATRIX_AUTO_UPDATE=!0,dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ot=new U,jt=new U,Qi=new U,Jt=new U,Fn=new U,Nn=new U,Jr=new U,er=new U,tr=new U,nr=new U,ir=new Qe,rr=new Qe,sr=new Qe;class zt{constructor(e=new U,t=new U,n=new U){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Ot.subVectors(e,t),r.cross(Ot);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){Ot.subVectors(r,t),jt.subVectors(n,t),Qi.subVectors(e,t);const a=Ot.dot(Ot),o=Ot.dot(jt),l=Ot.dot(Qi),h=jt.dot(jt),f=jt.dot(Qi),c=a*h-o*o;if(c===0)return s.set(0,0,0),null;const d=1/c,m=(h*l-o*f)*d,_=(a*f-o*l)*d;return s.set(1-m-_,_,m)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Jt)===null?!1:Jt.x>=0&&Jt.y>=0&&Jt.x+Jt.y<=1}static getInterpolation(e,t,n,r,s,a,o,l){return this.getBarycoord(e,t,n,r,Jt)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Jt.x),l.addScaledVector(a,Jt.y),l.addScaledVector(o,Jt.z),l)}static getInterpolatedAttribute(e,t,n,r,s,a){return ir.setScalar(0),rr.setScalar(0),sr.setScalar(0),ir.fromBufferAttribute(e,t),rr.fromBufferAttribute(e,n),sr.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ir,s.x),a.addScaledVector(rr,s.y),a.addScaledVector(sr,s.z),a}static isFrontFacing(e,t,n,r){return Ot.subVectors(n,t),jt.subVectors(e,t),Ot.cross(jt).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ot.subVectors(this.c,this.b),jt.subVectors(this.a,this.b),Ot.cross(jt).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return zt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return zt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,s){return zt.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return zt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return zt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,s=this.c;let a,o;Fn.subVectors(r,n),Nn.subVectors(s,n),er.subVectors(e,n);const l=Fn.dot(er),h=Nn.dot(er);if(l<=0&&h<=0)return t.copy(n);tr.subVectors(e,r);const f=Fn.dot(tr),c=Nn.dot(tr);if(f>=0&&c<=f)return t.copy(r);const d=l*c-f*h;if(d<=0&&l>=0&&f<=0)return a=l/(l-f),t.copy(n).addScaledVector(Fn,a);nr.subVectors(e,s);const m=Fn.dot(nr),_=Nn.dot(nr);if(_>=0&&m<=_)return t.copy(s);const S=m*h-l*_;if(S<=0&&h>=0&&_<=0)return o=h/(h-_),t.copy(n).addScaledVector(Nn,o);const p=f*_-m*c;if(p<=0&&c-f>=0&&m-_>=0)return Jr.subVectors(s,r),o=(c-f)/(c-f+(m-_)),t.copy(r).addScaledVector(Jr,o);const u=1/(p+S+d);return a=S*u,o=d*u,t.copy(n).addScaledVector(Fn,a).addScaledVector(Nn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Qr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},an={h:0,s:0,l:0},Ti={h:0,s:0,l:0};function ar(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class ze{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=At){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Xe.toWorkingColorSpace(this,t),this}setRGB(e,t,n,r=Xe.workingColorSpace){return this.r=e,this.g=t,this.b=n,Xe.toWorkingColorSpace(this,r),this}setHSL(e,t,n,r=Xe.workingColorSpace){if(e=na(e,1),t=Et(t,0,1),n=Et(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=ar(a,s,e+1/3),this.g=ar(a,s,e),this.b=ar(a,s,e-1/3)}return Xe.toWorkingColorSpace(this,r),this}setStyle(e,t=At){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=At){const n=Qr[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Yt(e.r),this.g=Yt(e.g),this.b=Yt(e.b),this}copyLinearToSRGB(e){return this.r=Rn(e.r),this.g=Rn(e.g),this.b=Rn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=At){return Xe.fromWorkingColorSpace(gt.copy(this),e),Math.round(Et(gt.r*255,0,255))*65536+Math.round(Et(gt.g*255,0,255))*256+Math.round(Et(gt.b*255,0,255))}getHexString(e=At){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Xe.workingColorSpace){Xe.fromWorkingColorSpace(gt.copy(this),t);const n=gt.r,r=gt.g,s=gt.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let l,h;const f=(o+a)/2;if(o===a)l=0,h=0;else{const c=a-o;switch(h=f<=.5?c/(a+o):c/(2-a-o),a){case n:l=(r-s)/c+(r<s?6:0);break;case r:l=(s-n)/c+2;break;case s:l=(n-r)/c+4;break}l/=6}return e.h=l,e.s=h,e.l=f,e}getRGB(e,t=Xe.workingColorSpace){return Xe.fromWorkingColorSpace(gt.copy(this),t),e.r=gt.r,e.g=gt.g,e.b=gt.b,e}getStyle(e=At){Xe.fromWorkingColorSpace(gt.copy(this),e);const t=gt.r,n=gt.g,r=gt.b;return e!==At?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(an),this.setHSL(an.h+e,an.s+t,an.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(an),e.getHSL(Ti);const n=Hi(an.h,Ti.h,t),r=Hi(an.s,Ti.s,t),s=Hi(an.l,Ti.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const gt=new ze;ze.NAMES=Qr;let Ma=0;class ii extends An{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ma++}),this.uuid=Kn(),this.name="",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ze(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==204&&(n.blendSrc=this.blendSrc),this.blendDst!==205&&(n.blendDst=this.blendDst),this.blendEquation!==100&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==7680&&(n.stencilFail=this.stencilFail),this.stencilZFail!==7680&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==7680&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class pn extends ii{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new kt,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ot=new U,yi=new Pe;class Wt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)yi.fromBufferAttribute(this,t),yi.applyMatrix3(e),this.setXY(t,yi.x,yi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ot.fromBufferAttribute(this,t),ot.applyMatrix3(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ot.fromBufferAttribute(this,t),ot.applyMatrix4(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ot.fromBufferAttribute(this,t),ot.applyNormalMatrix(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ot.fromBufferAttribute(this,t),ot.transformDirection(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Zn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Tt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Zn(t,this.array)),t}setX(e,t){return this.normalized&&(t=Tt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Zn(t,this.array)),t}setY(e,t){return this.normalized&&(t=Tt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Zn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Tt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Zn(t,this.array)),t}setW(e,t){return this.normalized&&(t=Tt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Tt(t,this.array),n=Tt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Tt(t,this.array),n=Tt(n,this.array),r=Tt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=Tt(t,this.array),n=Tt(n,this.array),r=Tt(r,this.array),s=Tt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),e}}class es extends Wt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class ts extends Wt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class lt extends Wt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Sa=0;const Lt=new rt,or=new dt,Bn=new U,wt=new Qn,ri=new Qn,ht=new U;class Ut extends An{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Sa++}),this.uuid=Kn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ir(e)?ts:es)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Ne().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Lt.makeRotationFromQuaternion(e),this.applyMatrix4(Lt),this}rotateX(e){return Lt.makeRotationX(e),this.applyMatrix4(Lt),this}rotateY(e){return Lt.makeRotationY(e),this.applyMatrix4(Lt),this}rotateZ(e){return Lt.makeRotationZ(e),this.applyMatrix4(Lt),this}translate(e,t,n){return Lt.makeTranslation(e,t,n),this.applyMatrix4(Lt),this}scale(e,t,n){return Lt.makeScale(e,t,n),this.applyMatrix4(Lt),this}lookAt(e){return or.lookAt(e),or.updateMatrix(),this.applyMatrix4(or.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Bn).negate(),this.translate(Bn.x,Bn.y,Bn.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new lt(n,3))}else{for(let n=0,r=t.count;n<r;n++){const s=e[n];t.setXYZ(n,s.x,s.y,s.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Qn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const s=t[n];wt.setFromBufferAttribute(s),this.morphTargetsRelative?(ht.addVectors(this.boundingBox.min,wt.min),this.boundingBox.expandByPoint(ht),ht.addVectors(this.boundingBox.max,wt.max),this.boundingBox.expandByPoint(ht)):(this.boundingBox.expandByPoint(wt.min),this.boundingBox.expandByPoint(wt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new $i);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(e){const n=this.boundingSphere.center;if(wt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];ri.setFromBufferAttribute(o),this.morphTargetsRelative?(ht.addVectors(wt.min,ri.min),wt.expandByPoint(ht),ht.addVectors(wt.max,ri.max),wt.expandByPoint(ht)):(wt.expandByPoint(ri.min),wt.expandByPoint(ri.max))}wt.getCenter(n);let r=0;for(let s=0,a=e.count;s<a;s++)ht.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(ht));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let h=0,f=o.count;h<f;h++)ht.fromBufferAttribute(o,h),l&&(Bn.fromBufferAttribute(e,h),ht.add(Bn)),r=Math.max(r,n.distanceToSquared(ht))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Wt(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let L=0;L<n.count;L++)o[L]=new U,l[L]=new U;const h=new U,f=new U,c=new U,d=new Pe,m=new Pe,_=new Pe,S=new U,p=new U;function u(L,T,v){h.fromBufferAttribute(n,L),f.fromBufferAttribute(n,T),c.fromBufferAttribute(n,v),d.fromBufferAttribute(s,L),m.fromBufferAttribute(s,T),_.fromBufferAttribute(s,v),f.sub(h),c.sub(h),m.sub(d),_.sub(d);const P=1/(m.x*_.y-_.x*m.y);isFinite(P)&&(S.copy(f).multiplyScalar(_.y).addScaledVector(c,-m.y).multiplyScalar(P),p.copy(c).multiplyScalar(m.x).addScaledVector(f,-_.x).multiplyScalar(P),o[L].add(S),o[T].add(S),o[v].add(S),l[L].add(p),l[T].add(p),l[v].add(p))}let y=this.groups;y.length===0&&(y=[{start:0,count:e.count}]);for(let L=0,T=y.length;L<T;++L){const v=y[L],P=v.start,H=v.count;for(let V=P,Y=P+H;V<Y;V+=3)u(e.getX(V+0),e.getX(V+1),e.getX(V+2))}const E=new U,M=new U,B=new U,w=new U;function C(L){B.fromBufferAttribute(r,L),w.copy(B);const T=o[L];E.copy(T),E.sub(B.multiplyScalar(B.dot(T))).normalize(),M.crossVectors(w,T);const P=M.dot(l[L])<0?-1:1;a.setXYZW(L,E.x,E.y,E.z,P)}for(let L=0,T=y.length;L<T;++L){const v=y[L],P=v.start,H=v.count;for(let V=P,Y=P+H;V<Y;V+=3)C(e.getX(V+0)),C(e.getX(V+1)),C(e.getX(V+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Wt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);const r=new U,s=new U,a=new U,o=new U,l=new U,h=new U,f=new U,c=new U;if(e)for(let d=0,m=e.count;d<m;d+=3){const _=e.getX(d+0),S=e.getX(d+1),p=e.getX(d+2);r.fromBufferAttribute(t,_),s.fromBufferAttribute(t,S),a.fromBufferAttribute(t,p),f.subVectors(a,s),c.subVectors(r,s),f.cross(c),o.fromBufferAttribute(n,_),l.fromBufferAttribute(n,S),h.fromBufferAttribute(n,p),o.add(f),l.add(f),h.add(f),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(S,l.x,l.y,l.z),n.setXYZ(p,h.x,h.y,h.z)}else for(let d=0,m=t.count;d<m;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),f.subVectors(a,s),c.subVectors(r,s),f.cross(c),n.setXYZ(d+0,f.x,f.y,f.z),n.setXYZ(d+1,f.x,f.y,f.z),n.setXYZ(d+2,f.x,f.y,f.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)ht.fromBufferAttribute(e,t),ht.normalize(),e.setXYZ(t,ht.x,ht.y,ht.z)}toNonIndexed(){function e(o,l){const h=o.array,f=o.itemSize,c=o.normalized,d=new h.constructor(l.length*f);let m=0,_=0;for(let S=0,p=l.length;S<p;S++){o.isInterleavedBufferAttribute?m=l[S]*o.data.stride+o.offset:m=l[S]*f;for(let u=0;u<f;u++)d[_++]=h[m++]}return new Wt(d,f,c)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Ut,n=this.index.array,r=this.attributes;for(const o in r){const l=r[o],h=e(l,n);t.setAttribute(o,h)}const s=this.morphAttributes;for(const o in s){const l=[],h=s[o];for(let f=0,c=h.length;f<c;f++){const d=h[f],m=e(d,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const h=a[o];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const h in l)l[h]!==void 0&&(e[h]=l[h]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const h=n[l];e.data.attributes[l]=h.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const h=this.morphAttributes[l],f=[];for(let c=0,d=h.length;c<d;c++){const m=h[c];f.push(m.toJSON(e.data))}f.length>0&&(r[l]=f,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const r=e.attributes;for(const h in r){const f=r[h];this.setAttribute(h,f.clone(t))}const s=e.morphAttributes;for(const h in s){const f=[],c=s[h];for(let d=0,m=c.length;d<m;d++)f.push(c[d].clone(t));this.morphAttributes[h]=f}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let h=0,f=a.length;h<f;h++){const c=a[h];this.addGroup(c.start,c.count,c.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const ns=new rt,mn=new da,bi=new $i,is=new U,Ai=new U,Ri=new U,wi=new U,lr=new U,Ci=new U,rs=new U,Pi=new U;class et extends dt{constructor(e=new Ut,t=new pn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){Ci.set(0,0,0);for(let l=0,h=s.length;l<h;l++){const f=o[l],c=s[l];f!==0&&(lr.fromBufferAttribute(c,e),a?Ci.addScaledVector(lr,f):Ci.addScaledVector(lr.sub(t),f))}t.add(Ci)}return t}raycast(e,t){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),bi.copy(n.boundingSphere),bi.applyMatrix4(s),mn.copy(e.ray).recast(e.near),!(bi.containsPoint(mn.origin)===!1&&(mn.intersectSphere(bi,is)===null||mn.origin.distanceToSquared(is)>(e.far-e.near)**2))&&(ns.copy(s).invert(),mn.copy(e.ray).applyMatrix4(ns),!(n.boundingBox!==null&&mn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,mn)))}_computeIntersections(e,t,n){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,h=s.attributes.uv,f=s.attributes.uv1,c=s.attributes.normal,d=s.groups,m=s.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,S=d.length;_<S;_++){const p=d[_],u=a[p.materialIndex],y=Math.max(p.start,m.start),E=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let M=y,B=E;M<B;M+=3){const w=o.getX(M),C=o.getX(M+1),L=o.getX(M+2);r=Di(this,u,e,n,h,f,c,w,C,L),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const _=Math.max(0,m.start),S=Math.min(o.count,m.start+m.count);for(let p=_,u=S;p<u;p+=3){const y=o.getX(p),E=o.getX(p+1),M=o.getX(p+2);r=Di(this,a,e,n,h,f,c,y,E,M),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let _=0,S=d.length;_<S;_++){const p=d[_],u=a[p.materialIndex],y=Math.max(p.start,m.start),E=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let M=y,B=E;M<B;M+=3){const w=M,C=M+1,L=M+2;r=Di(this,u,e,n,h,f,c,w,C,L),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const _=Math.max(0,m.start),S=Math.min(l.count,m.start+m.count);for(let p=_,u=S;p<u;p+=3){const y=p,E=p+1,M=p+2;r=Di(this,a,e,n,h,f,c,y,E,M),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}}function Ea(i,e,t,n,r,s,a,o){let l;if(e.side===1?l=n.intersectTriangle(a,s,r,!0,o):l=n.intersectTriangle(r,s,a,e.side===0,o),l===null)return null;Pi.copy(o),Pi.applyMatrix4(i.matrixWorld);const h=t.ray.origin.distanceTo(Pi);return h<t.near||h>t.far?null:{distance:h,point:Pi.clone(),object:i}}function Di(i,e,t,n,r,s,a,o,l,h){i.getVertexPosition(o,Ai),i.getVertexPosition(l,Ri),i.getVertexPosition(h,wi);const f=Ea(i,e,t,n,Ai,Ri,wi,rs);if(f){const c=new U;zt.getBarycoord(rs,Ai,Ri,wi,c),r&&(f.uv=zt.getInterpolatedAttribute(r,o,l,h,c,new Pe)),s&&(f.uv1=zt.getInterpolatedAttribute(s,o,l,h,c,new Pe)),a&&(f.normal=zt.getInterpolatedAttribute(a,o,l,h,c,new U),f.normal.dot(n.direction)>0&&f.normal.multiplyScalar(-1));const d={a:o,b:l,c:h,normal:new U,materialIndex:0};zt.getNormal(Ai,Ri,wi,d.normal),f.face=d,f.barycoord=c}return f}class on extends Ut{constructor(e=1,t=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],h=[],f=[],c=[];let d=0,m=0;_("z","y","x",-1,-1,n,t,e,a,s,0),_("z","y","x",1,-1,n,t,-e,a,s,1),_("x","z","y",1,1,e,n,t,r,a,2),_("x","z","y",1,-1,e,n,-t,r,a,3),_("x","y","z",1,-1,e,t,n,r,s,4),_("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new lt(h,3)),this.setAttribute("normal",new lt(f,3)),this.setAttribute("uv",new lt(c,2));function _(S,p,u,y,E,M,B,w,C,L,T){const v=M/C,P=B/L,H=M/2,V=B/2,Y=w/2,te=C+1,Z=L+1;let le=0,$=0;const de=new U;for(let pe=0;pe<Z;pe++){const _e=pe*P-V;for(let Ie=0;Ie<te;Ie++){const Ce=Ie*v-H;de[S]=Ce*y,de[p]=_e*E,de[u]=Y,h.push(de.x,de.y,de.z),de[S]=0,de[p]=0,de[u]=w>0?1:-1,f.push(de.x,de.y,de.z),c.push(Ie/C),c.push(1-pe/L),le+=1}}for(let pe=0;pe<L;pe++)for(let _e=0;_e<C;_e++){const Ie=d+_e+te*pe,Ce=d+_e+te*(pe+1),J=d+(_e+1)+te*(pe+1),oe=d+(_e+1)+te*pe;l.push(Ie,Ce,oe),l.push(Ce,J,oe),$+=6}o.addGroup(m,$,T),m+=$,d+=le}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new on(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function On(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone():Array.isArray(r)?e[t][n]=r.slice():e[t][n]=r}}return e}function Mt(i){const e={};for(let t=0;t<i.length;t++){const n=On(i[t]);for(const r in n)e[r]=n[r]}return e}function Ta(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function ss(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Xe.workingColorSpace}const si={clone:On,merge:Mt};var ya=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ba=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class vt extends ii{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ya,this.fragmentShader=ba,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=On(e.uniforms),this.uniformsGroups=Ta(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class as extends dt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new rt,this.projectionMatrix=new rt,this.projectionMatrixInverse=new rt,this.coordinateSystem=2e3}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ln=new U,os=new Pe,ls=new Pe;class Ct extends as{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Vi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Gi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Vi*2*Math.atan(Math.tan(Gi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ln.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ln.x,ln.y).multiplyScalar(-e/ln.z),ln.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ln.x,ln.y).multiplyScalar(-e/ln.z)}getViewSize(e,t){return this.getViewBounds(e,os,ls),t.subVectors(ls,os)}setViewOffset(e,t,n,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Gi*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,h=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*n/h,r*=a.width/l,n*=a.height/h}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const zn=-90,Gn=1;class Aa extends dt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Ct(zn,Gn,e,t);r.layers=this.layers,this.add(r);const s=new Ct(zn,Gn,e,t);s.layers=this.layers,this.add(s);const a=new Ct(zn,Gn,e,t);a.layers=this.layers,this.add(a);const o=new Ct(zn,Gn,e,t);o.layers=this.layers,this.add(o);const l=new Ct(zn,Gn,e,t);l.layers=this.layers,this.add(l);const h=new Ct(zn,Gn,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,s,a,o,l]=t;for(const h of t)this.remove(h);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,h,f]=this.children,c=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const S=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,r),e.render(t,s),e.setRenderTarget(n,1,r),e.render(t,a),e.setRenderTarget(n,2,r),e.render(t,o),e.setRenderTarget(n,3,r),e.render(t,l),e.setRenderTarget(n,4,r),e.render(t,h),n.texture.generateMipmaps=S,e.setRenderTarget(n,5,r),e.render(t,f),e.setRenderTarget(c,d,m),e.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class cs extends xt{constructor(e,t,n,r,s,a,o,l,h,f){e=e!==void 0?e:[],t=t!==void 0?t:301,super(e,t,n,r,s,a,o,l,h,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Ra extends Dt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new cs(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:1006}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new on(5,5,5),s=new vt({name:"CubemapFromEquirect",uniforms:On(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});s.uniforms.tEquirect.value=t;const a=new et(r,s),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=1006),new Aa(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,r){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,r);e.setRenderTarget(s)}}const cr=new U,wa=new U,Ca=new Ne;class _n{constructor(e=new U(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=cr.subVectors(n,t).cross(wa.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(cr),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Ca.getNormalMatrix(e),r=this.coplanarPoint(cr).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const gn=new $i,Li=new U;class ur{constructor(e=new _n,t=new _n,n=new _n,r=new _n,s=new _n,a=new _n){this.planes=[e,t,n,r,s,a]}set(e,t,n,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2e3){const n=this.planes,r=e.elements,s=r[0],a=r[1],o=r[2],l=r[3],h=r[4],f=r[5],c=r[6],d=r[7],m=r[8],_=r[9],S=r[10],p=r[11],u=r[12],y=r[13],E=r[14],M=r[15];if(n[0].setComponents(l-s,d-h,p-m,M-u).normalize(),n[1].setComponents(l+s,d+h,p+m,M+u).normalize(),n[2].setComponents(l+a,d+f,p+_,M+y).normalize(),n[3].setComponents(l-a,d-f,p-_,M-y).normalize(),n[4].setComponents(l-o,d-c,p-S,M-E).normalize(),t===2e3)n[5].setComponents(l+o,d+c,p+S,M+E).normalize();else if(t===2001)n[5].setComponents(o,c,S,E).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),gn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),gn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(gn)}intersectsSprite(e){return gn.center.set(0,0,0),gn.radius=.7071067811865476,gn.applyMatrix4(e.matrixWorld),this.intersectsSphere(gn)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(Li.x=r.normal.x>0?e.max.x:e.min.x,Li.y=r.normal.y>0?e.max.y:e.min.y,Li.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Li)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function us(){let i=null,e=!1,t=null,n=null;function r(s,a){t(s,a),n=i.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function Pa(i){const e=new WeakMap;function t(o,l){const h=o.array,f=o.usage,c=h.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,h,f),o.onUploadCallback();let m;if(h instanceof Float32Array)m=i.FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)m=i.SHORT;else if(h instanceof Uint32Array)m=i.UNSIGNED_INT;else if(h instanceof Int32Array)m=i.INT;else if(h instanceof Int8Array)m=i.BYTE;else if(h instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:m,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:c}}function n(o,l,h){const f=l.array,c=l.updateRanges;if(i.bindBuffer(h,o),c.length===0)i.bufferSubData(h,0,f);else{c.sort((m,_)=>m.start-_.start);let d=0;for(let m=1;m<c.length;m++){const _=c[d],S=c[m];S.start<=_.start+_.count+1?_.count=Math.max(_.count,S.start+S.count-_.start):(++d,c[d]=S)}c.length=d+1;for(let m=0,_=c.length;m<_;m++){const S=c[m];i.bufferSubData(h,S.start*f.BYTES_PER_ELEMENT,f,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const f=e.get(o);(!f||f.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const h=e.get(o);if(h===void 0)e.set(o,t(o,l));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,o,l),h.version=o.version}}return{get:r,remove:s,update:a}}class cn extends Ut{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(n),l=Math.floor(r),h=o+1,f=l+1,c=e/o,d=t/l,m=[],_=[],S=[],p=[];for(let u=0;u<f;u++){const y=u*d-a;for(let E=0;E<h;E++){const M=E*c-s;_.push(M,-y,0),S.push(0,0,1),p.push(E/o),p.push(1-u/l)}}for(let u=0;u<l;u++)for(let y=0;y<o;y++){const E=y+h*u,M=y+h*(u+1),B=y+1+h*(u+1),w=y+1+h*u;m.push(E,M,w),m.push(M,B,w)}this.setIndex(m),this.setAttribute("position",new lt(_,3)),this.setAttribute("normal",new lt(S,3)),this.setAttribute("uv",new lt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new cn(e.width,e.height,e.widthSegments,e.heightSegments)}}var Da=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,La=`#ifdef USE_ALPHAHASH
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
#endif`,Ua=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ia=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Fa=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Na=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ba=`#ifdef USE_AOMAP
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
#endif`,Oa=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,za=`#ifdef USE_BATCHING
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
#endif`,Ga=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Va=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ha=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ka=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Wa=`#ifdef USE_IRIDESCENCE
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
#endif`,Xa=`#ifdef USE_BUMPMAP
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
#endif`,qa=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Ya=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,$a=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ka=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Za=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ja=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ja=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Qa=`#if defined( USE_COLOR_ALPHA )
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
#endif`,eo=`#define PI 3.141592653589793
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
} // validated`,to=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,no=`vec3 transformedNormal = objectNormal;
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
#endif`,io=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ro=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,so=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ao=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,oo="gl_FragColor = linearToOutputTexel( gl_FragColor );",lo=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,co=`#ifdef USE_ENVMAP
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
#endif`,uo=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,ho=`#ifdef USE_ENVMAP
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
#endif`,fo=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,po=`#ifdef USE_ENVMAP
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
#endif`,mo=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,_o=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,go=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,vo=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,xo=`#ifdef USE_GRADIENTMAP
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
}`,Mo=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,So=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Eo=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,To=`uniform bool receiveShadow;
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
#endif`,yo=`#ifdef USE_ENVMAP
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
#endif`,bo=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ao=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ro=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,wo=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Co=`PhysicalMaterial material;
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
#endif`,Po=`struct PhysicalMaterial {
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
}`,Do=`
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
#endif`,Lo=`#if defined( RE_IndirectDiffuse )
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
#endif`,Uo=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Io=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Fo=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,No=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Bo=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Oo=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,zo=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Go=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Vo=`#if defined( USE_POINTS_UV )
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
#endif`,Ho=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,ko=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Wo=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Xo=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,qo=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Yo=`#ifdef USE_MORPHTARGETS
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
#endif`,$o=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ko=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Zo=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,jo=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Jo=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Qo=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,el=`#ifdef USE_NORMALMAP
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
#endif`,tl=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,nl=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,il=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,rl=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,sl=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,al=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,ol=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,ll=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,cl=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,ul=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,hl=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,fl=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,dl=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,pl=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,ml=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,_l=`float getShadowMask() {
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
}`,gl=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,vl=`#ifdef USE_SKINNING
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
#endif`,xl=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Ml=`#ifdef USE_SKINNING
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
#endif`,Sl=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,El=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Tl=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,yl=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,bl=`#ifdef USE_TRANSMISSION
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
#endif`,Al=`#ifdef USE_TRANSMISSION
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
#endif`,Rl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,wl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Cl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Pl=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Ge={alphahash_fragment:Da,alphahash_pars_fragment:La,alphamap_fragment:Ua,alphamap_pars_fragment:Ia,alphatest_fragment:Fa,alphatest_pars_fragment:Na,aomap_fragment:Ba,aomap_pars_fragment:Oa,batching_pars_vertex:za,batching_vertex:Ga,begin_vertex:Va,beginnormal_vertex:Ha,bsdfs:ka,iridescence_fragment:Wa,bumpmap_pars_fragment:Xa,clipping_planes_fragment:qa,clipping_planes_pars_fragment:Ya,clipping_planes_pars_vertex:$a,clipping_planes_vertex:Ka,color_fragment:Za,color_pars_fragment:ja,color_pars_vertex:Ja,color_vertex:Qa,common:eo,cube_uv_reflection_fragment:to,defaultnormal_vertex:no,displacementmap_pars_vertex:io,displacementmap_vertex:ro,emissivemap_fragment:so,emissivemap_pars_fragment:ao,colorspace_fragment:oo,colorspace_pars_fragment:lo,envmap_fragment:co,envmap_common_pars_fragment:uo,envmap_pars_fragment:ho,envmap_pars_vertex:fo,envmap_physical_pars_fragment:yo,envmap_vertex:po,fog_vertex:mo,fog_pars_vertex:_o,fog_fragment:go,fog_pars_fragment:vo,gradientmap_pars_fragment:xo,lightmap_pars_fragment:Mo,lights_lambert_fragment:So,lights_lambert_pars_fragment:Eo,lights_pars_begin:To,lights_toon_fragment:bo,lights_toon_pars_fragment:Ao,lights_phong_fragment:Ro,lights_phong_pars_fragment:wo,lights_physical_fragment:Co,lights_physical_pars_fragment:Po,lights_fragment_begin:Do,lights_fragment_maps:Lo,lights_fragment_end:Uo,logdepthbuf_fragment:Io,logdepthbuf_pars_fragment:Fo,logdepthbuf_pars_vertex:No,logdepthbuf_vertex:Bo,map_fragment:Oo,map_pars_fragment:zo,map_particle_fragment:Go,map_particle_pars_fragment:Vo,metalnessmap_fragment:Ho,metalnessmap_pars_fragment:ko,morphinstance_vertex:Wo,morphcolor_vertex:Xo,morphnormal_vertex:qo,morphtarget_pars_vertex:Yo,morphtarget_vertex:$o,normal_fragment_begin:Ko,normal_fragment_maps:Zo,normal_pars_fragment:jo,normal_pars_vertex:Jo,normal_vertex:Qo,normalmap_pars_fragment:el,clearcoat_normal_fragment_begin:tl,clearcoat_normal_fragment_maps:nl,clearcoat_pars_fragment:il,iridescence_pars_fragment:rl,opaque_fragment:sl,packing:al,premultiplied_alpha_fragment:ol,project_vertex:ll,dithering_fragment:cl,dithering_pars_fragment:ul,roughnessmap_fragment:hl,roughnessmap_pars_fragment:fl,shadowmap_pars_fragment:dl,shadowmap_pars_vertex:pl,shadowmap_vertex:ml,shadowmask_pars_fragment:_l,skinbase_vertex:gl,skinning_pars_vertex:vl,skinning_vertex:xl,skinnormal_vertex:Ml,specularmap_fragment:Sl,specularmap_pars_fragment:El,tonemapping_fragment:Tl,tonemapping_pars_fragment:yl,transmission_fragment:bl,transmission_pars_fragment:Al,uv_pars_fragment:Rl,uv_pars_vertex:wl,uv_vertex:Cl,worldpos_vertex:Pl,background_vert:`varying vec2 vUv;
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
}`},fe={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ne},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ne}},envmap:{envMap:{value:null},envMapRotation:{value:new Ne},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ne}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ne}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ne},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ne},normalScale:{value:new Pe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ne},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ne}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ne}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ne}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0},uvTransform:{value:new Ne}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new Pe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ne},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0}}},Xt={basic:{uniforms:Mt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.fog]),vertexShader:Ge.meshbasic_vert,fragmentShader:Ge.meshbasic_frag},lambert:{uniforms:Mt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new ze(0)}}]),vertexShader:Ge.meshlambert_vert,fragmentShader:Ge.meshlambert_frag},phong:{uniforms:Mt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30}}]),vertexShader:Ge.meshphong_vert,fragmentShader:Ge.meshphong_frag},standard:{uniforms:Mt([fe.common,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.roughnessmap,fe.metalnessmap,fe.fog,fe.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ge.meshphysical_vert,fragmentShader:Ge.meshphysical_frag},toon:{uniforms:Mt([fe.common,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.gradientmap,fe.fog,fe.lights,{emissive:{value:new ze(0)}}]),vertexShader:Ge.meshtoon_vert,fragmentShader:Ge.meshtoon_frag},matcap:{uniforms:Mt([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,{matcap:{value:null}}]),vertexShader:Ge.meshmatcap_vert,fragmentShader:Ge.meshmatcap_frag},points:{uniforms:Mt([fe.points,fe.fog]),vertexShader:Ge.points_vert,fragmentShader:Ge.points_frag},dashed:{uniforms:Mt([fe.common,fe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ge.linedashed_vert,fragmentShader:Ge.linedashed_frag},depth:{uniforms:Mt([fe.common,fe.displacementmap]),vertexShader:Ge.depth_vert,fragmentShader:Ge.depth_frag},normal:{uniforms:Mt([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,{opacity:{value:1}}]),vertexShader:Ge.meshnormal_vert,fragmentShader:Ge.meshnormal_frag},sprite:{uniforms:Mt([fe.sprite,fe.fog]),vertexShader:Ge.sprite_vert,fragmentShader:Ge.sprite_frag},background:{uniforms:{uvTransform:{value:new Ne},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ge.background_vert,fragmentShader:Ge.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ne}},vertexShader:Ge.backgroundCube_vert,fragmentShader:Ge.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ge.cube_vert,fragmentShader:Ge.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ge.equirect_vert,fragmentShader:Ge.equirect_frag},distanceRGBA:{uniforms:Mt([fe.common,fe.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ge.distanceRGBA_vert,fragmentShader:Ge.distanceRGBA_frag},shadow:{uniforms:Mt([fe.lights,fe.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:Ge.shadow_vert,fragmentShader:Ge.shadow_frag}};Xt.physical={uniforms:Mt([Xt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ne},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ne},clearcoatNormalScale:{value:new Pe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ne},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ne},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ne},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ne},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ne},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ne},transmissionSamplerSize:{value:new Pe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ne},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ne},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ne},anisotropyVector:{value:new Pe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ne}}]),vertexShader:Ge.meshphysical_vert,fragmentShader:Ge.meshphysical_frag};const Ui={r:0,b:0,g:0},vn=new kt,Dl=new rt;function Ll(i,e,t,n,r,s,a){const o=new ze(0);let l=s===!0?0:1,h,f,c=null,d=0,m=null;function _(y){let E=y.isScene===!0?y.background:null;return E&&E.isTexture&&(E=(y.backgroundBlurriness>0?t:e).get(E)),E}function S(y){let E=!1;const M=_(y);M===null?u(o,l):M&&M.isColor&&(u(M,1),E=!0);const B=i.xr.getEnvironmentBlendMode();B==="additive"?n.buffers.color.setClear(0,0,0,1,a):B==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||E)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(y,E){const M=_(E);M&&(M.isCubeTexture||M.mapping===306)?(f===void 0&&(f=new et(new on(1,1,1),new vt({name:"BackgroundCubeMaterial",uniforms:On(Xt.backgroundCube.uniforms),vertexShader:Xt.backgroundCube.vertexShader,fragmentShader:Xt.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),f.geometry.deleteAttribute("normal"),f.geometry.deleteAttribute("uv"),f.onBeforeRender=function(B,w,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(f.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(f)),vn.copy(E.backgroundRotation),vn.x*=-1,vn.y*=-1,vn.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(vn.y*=-1,vn.z*=-1),f.material.uniforms.envMap.value=M,f.material.uniforms.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,f.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,f.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,f.material.uniforms.backgroundRotation.value.setFromMatrix4(Dl.makeRotationFromEuler(vn)),f.material.toneMapped=Xe.getTransfer(M.colorSpace)!==Je,(c!==M||d!==M.version||m!==i.toneMapping)&&(f.material.needsUpdate=!0,c=M,d=M.version,m=i.toneMapping),f.layers.enableAll(),y.unshift(f,f.geometry,f.material,0,0,null)):M&&M.isTexture&&(h===void 0&&(h=new et(new cn(2,2),new vt({name:"BackgroundMaterial",uniforms:On(Xt.background.uniforms),vertexShader:Xt.background.vertexShader,fragmentShader:Xt.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(h)),h.material.uniforms.t2D.value=M,h.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,h.material.toneMapped=Xe.getTransfer(M.colorSpace)!==Je,M.matrixAutoUpdate===!0&&M.updateMatrix(),h.material.uniforms.uvTransform.value.copy(M.matrix),(c!==M||d!==M.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,c=M,d=M.version,m=i.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null))}function u(y,E){y.getRGB(Ui,ss(i)),n.buffers.color.setClear(Ui.r,Ui.g,Ui.b,E,a)}return{getClearColor:function(){return o},setClearColor:function(y,E=1){o.set(y),l=E,u(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(y){l=y,u(o,l)},render:S,addToRenderList:p}}function Ul(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=d(null);let s=r,a=!1;function o(v,P,H,V,Y){let te=!1;const Z=c(V,H,P);s!==Z&&(s=Z,h(s.object)),te=m(v,V,H,Y),te&&_(v,V,H,Y),Y!==null&&e.update(Y,i.ELEMENT_ARRAY_BUFFER),(te||a)&&(a=!1,M(v,P,H,V),Y!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(Y).buffer))}function l(){return i.createVertexArray()}function h(v){return i.bindVertexArray(v)}function f(v){return i.deleteVertexArray(v)}function c(v,P,H){const V=H.wireframe===!0;let Y=n[v.id];Y===void 0&&(Y={},n[v.id]=Y);let te=Y[P.id];te===void 0&&(te={},Y[P.id]=te);let Z=te[V];return Z===void 0&&(Z=d(l()),te[V]=Z),Z}function d(v){const P=[],H=[],V=[];for(let Y=0;Y<t;Y++)P[Y]=0,H[Y]=0,V[Y]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:H,attributeDivisors:V,object:v,attributes:{},index:null}}function m(v,P,H,V){const Y=s.attributes,te=P.attributes;let Z=0;const le=H.getAttributes();for(const $ in le)if(le[$].location>=0){const pe=Y[$];let _e=te[$];if(_e===void 0&&($==="instanceMatrix"&&v.instanceMatrix&&(_e=v.instanceMatrix),$==="instanceColor"&&v.instanceColor&&(_e=v.instanceColor)),pe===void 0||pe.attribute!==_e||_e&&pe.data!==_e.data)return!0;Z++}return s.attributesNum!==Z||s.index!==V}function _(v,P,H,V){const Y={},te=P.attributes;let Z=0;const le=H.getAttributes();for(const $ in le)if(le[$].location>=0){let pe=te[$];pe===void 0&&($==="instanceMatrix"&&v.instanceMatrix&&(pe=v.instanceMatrix),$==="instanceColor"&&v.instanceColor&&(pe=v.instanceColor));const _e={};_e.attribute=pe,pe&&pe.data&&(_e.data=pe.data),Y[$]=_e,Z++}s.attributes=Y,s.attributesNum=Z,s.index=V}function S(){const v=s.newAttributes;for(let P=0,H=v.length;P<H;P++)v[P]=0}function p(v){u(v,0)}function u(v,P){const H=s.newAttributes,V=s.enabledAttributes,Y=s.attributeDivisors;H[v]=1,V[v]===0&&(i.enableVertexAttribArray(v),V[v]=1),Y[v]!==P&&(i.vertexAttribDivisor(v,P),Y[v]=P)}function y(){const v=s.newAttributes,P=s.enabledAttributes;for(let H=0,V=P.length;H<V;H++)P[H]!==v[H]&&(i.disableVertexAttribArray(H),P[H]=0)}function E(v,P,H,V,Y,te,Z){Z===!0?i.vertexAttribIPointer(v,P,H,Y,te):i.vertexAttribPointer(v,P,H,V,Y,te)}function M(v,P,H,V){S();const Y=V.attributes,te=H.getAttributes(),Z=P.defaultAttributeValues;for(const le in te){const $=te[le];if($.location>=0){let de=Y[le];if(de===void 0&&(le==="instanceMatrix"&&v.instanceMatrix&&(de=v.instanceMatrix),le==="instanceColor"&&v.instanceColor&&(de=v.instanceColor)),de!==void 0){const pe=de.normalized,_e=de.itemSize,Ie=e.get(de);if(Ie===void 0)continue;const Ce=Ie.buffer,J=Ie.type,oe=Ie.bytesPerElement,xe=J===i.INT||J===i.UNSIGNED_INT||de.gpuType===1013;if(de.isInterleavedBufferAttribute){const ue=de.data,we=ue.stride,De=de.offset;if(ue.isInstancedInterleavedBuffer){for(let Le=0;Le<$.locationSize;Le++)u($.location+Le,ue.meshPerAttribute);v.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=ue.meshPerAttribute*ue.count)}else for(let Le=0;Le<$.locationSize;Le++)p($.location+Le);i.bindBuffer(i.ARRAY_BUFFER,Ce);for(let Le=0;Le<$.locationSize;Le++)E($.location+Le,_e/$.locationSize,J,pe,we*oe,(De+_e/$.locationSize*Le)*oe,xe)}else{if(de.isInstancedBufferAttribute){for(let ue=0;ue<$.locationSize;ue++)u($.location+ue,de.meshPerAttribute);v.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=de.meshPerAttribute*de.count)}else for(let ue=0;ue<$.locationSize;ue++)p($.location+ue);i.bindBuffer(i.ARRAY_BUFFER,Ce);for(let ue=0;ue<$.locationSize;ue++)E($.location+ue,_e/$.locationSize,J,pe,_e*oe,_e/$.locationSize*ue*oe,xe)}}else if(Z!==void 0){const pe=Z[le];if(pe!==void 0)switch(pe.length){case 2:i.vertexAttrib2fv($.location,pe);break;case 3:i.vertexAttrib3fv($.location,pe);break;case 4:i.vertexAttrib4fv($.location,pe);break;default:i.vertexAttrib1fv($.location,pe)}}}}y()}function B(){L();for(const v in n){const P=n[v];for(const H in P){const V=P[H];for(const Y in V)f(V[Y].object),delete V[Y];delete P[H]}delete n[v]}}function w(v){if(n[v.id]===void 0)return;const P=n[v.id];for(const H in P){const V=P[H];for(const Y in V)f(V[Y].object),delete V[Y];delete P[H]}delete n[v.id]}function C(v){for(const P in n){const H=n[P];if(H[v.id]===void 0)continue;const V=H[v.id];for(const Y in V)f(V[Y].object),delete V[Y];delete H[v.id]}}function L(){T(),a=!0,s!==r&&(s=r,h(s.object))}function T(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:L,resetDefaultState:T,dispose:B,releaseStatesOfGeometry:w,releaseStatesOfProgram:C,initAttributes:S,enableAttribute:p,disableUnusedAttributes:y}}function Il(i,e,t){let n;function r(h){n=h}function s(h,f){i.drawArrays(n,h,f),t.update(f,n,1)}function a(h,f,c){c!==0&&(i.drawArraysInstanced(n,h,f,c),t.update(f,n,c))}function o(h,f,c){if(c===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,f,0,c);let m=0;for(let _=0;_<c;_++)m+=f[_];t.update(m,n,1)}function l(h,f,c,d){if(c===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let _=0;_<h.length;_++)a(h[_],f[_],d[_]);else{m.multiDrawArraysInstancedWEBGL(n,h,0,f,0,d,0,c);let _=0;for(let S=0;S<c;S++)_+=f[S]*d[S];t.update(_,n,1)}}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Fl(i,e,t,n){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const C=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(C){return!(C!==1023&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){const L=C===1016&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==1009&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==1015&&!L)}function l(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp";const f=l(h);f!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",f,"instead."),h=f);const c=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),u=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),E=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),B=_>0,w=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:c,reverseDepthBuffer:d,maxTextures:m,maxVertexTextures:_,maxTextureSize:S,maxCubemapSize:p,maxAttributes:u,maxVertexUniforms:y,maxVaryings:E,maxFragmentUniforms:M,vertexTextures:B,maxSamples:w}}function Nl(i){const e=this;let t=null,n=0,r=!1,s=!1;const a=new _n,o=new Ne,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(c,d){const m=c.length!==0||d||n!==0||r;return r=d,n=c.length,m},this.beginShadows=function(){s=!0,f(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(c,d){t=f(c,d,0)},this.setState=function(c,d,m){const _=c.clippingPlanes,S=c.clipIntersection,p=c.clipShadows,u=i.get(c);if(!r||_===null||_.length===0||s&&!p)s?f(null):h();else{const y=s?0:n,E=y*4;let M=u.clippingState||null;l.value=M,M=f(_,d,E,m);for(let B=0;B!==E;++B)M[B]=t[B];u.clippingState=M,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=y}};function h(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function f(c,d,m,_){const S=c!==null?c.length:0;let p=null;if(S!==0){if(p=l.value,_!==!0||p===null){const u=m+S*4,y=d.matrixWorldInverse;o.getNormalMatrix(y),(p===null||p.length<u)&&(p=new Float32Array(u));for(let E=0,M=m;E!==S;++E,M+=4)a.copy(c[E]).applyMatrix4(y,o),a.normal.toArray(p,M),p[M+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,p}}function Bl(i){let e=new WeakMap;function t(a,o){return o===303?a.mapping=301:o===304&&(a.mapping=302),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===303||o===304)if(e.has(a)){const l=e.get(a).texture;return t(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const h=new Ra(l.height);return h.fromEquirectangularTexture(i,a),e.set(a,h),a.addEventListener("dispose",r),t(h.texture,a.mapping)}else return null}}return a}function r(a){const o=a.target;o.removeEventListener("dispose",r);const l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function s(){e=new WeakMap}return{get:n,dispose:s}}class hr extends as{constructor(e=-1,t=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-e,a=n+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const h=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=h*this.view.offsetX,a=s+h*this.view.width,o-=f*this.view.offsetY,l=o-f*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Vn=4,hs=[.125,.215,.35,.446,.526,.582],xn=20,fr=new hr,fs=new ze;let dr=null,pr=0,mr=0,_r=!1;const Mn=(1+Math.sqrt(5))/2,Hn=1/Mn,ds=[new U(-Mn,Hn,0),new U(Mn,Hn,0),new U(-Hn,0,Mn),new U(Hn,0,Mn),new U(0,Mn,-Hn),new U(0,Mn,Hn),new U(-1,1,-1),new U(1,1,-1),new U(-1,1,1),new U(1,1,1)];class gr{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,r=100){dr=this._renderer.getRenderTarget(),pr=this._renderer.getActiveCubeFace(),mr=this._renderer.getActiveMipmapLevel(),_r=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=_s(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ms(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(dr,pr,mr),this._renderer.xr.enabled=_r,e.scissorTest=!1,Ii(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),dr=this._renderer.getRenderTarget(),pr=this._renderer.getActiveCubeFace(),mr=this._renderer.getActiveMipmapLevel(),_r=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:1006,minFilter:1006,generateMipmaps:!1,type:1016,format:1023,colorSpace:bn,depthBuffer:!1},r=ps(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ps(e,t,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Ol(s)),this._blurMaterial=zl(s,e,t)}return r}_compileMaterial(e){const t=new et(this._lodPlanes[0],e);this._renderer.compile(t,fr)}_sceneToCubeUV(e,t,n,r){const o=new Ct(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],f=this._renderer,c=f.autoClear,d=f.toneMapping;f.getClearColor(fs),f.toneMapping=0,f.autoClear=!1;const m=new pn({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}),_=new et(new on,m);let S=!1;const p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,S=!0):(m.color.copy(fs),S=!0);for(let u=0;u<6;u++){const y=u%3;y===0?(o.up.set(0,l[u],0),o.lookAt(h[u],0,0)):y===1?(o.up.set(0,0,l[u]),o.lookAt(0,h[u],0)):(o.up.set(0,l[u],0),o.lookAt(0,0,h[u]));const E=this._cubeSize;Ii(r,y*E,u>2?E:0,E,E),f.setRenderTarget(r),S&&f.render(_,o),f.render(e,o)}_.geometry.dispose(),_.material.dispose(),f.toneMapping=d,f.autoClear=c,e.background=p}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=_s()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ms());const s=r?this._cubemapMaterial:this._equirectMaterial,a=new et(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;Ii(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,fr)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=ds[(r-s-1)%ds.length];this._blur(e,s-1,s,a,o)}t.autoClear=n}_blur(e,t,n,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,r,"latitudinal",s),this._halfBlur(a,e,n,n,r,"longitudinal",s)}_halfBlur(e,t,n,r,s,a,o){const l=this._renderer,h=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const f=3,c=new et(this._lodPlanes[r],h),d=h.uniforms,m=this._sizeLods[n]-1,_=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*xn-1),S=s/_,p=isFinite(s)?1+Math.floor(f*S):xn;p>xn&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${xn}`);const u=[];let y=0;for(let C=0;C<xn;++C){const L=C/S,T=Math.exp(-L*L/2);u.push(T),C===0?y+=T:C<p&&(y+=2*T)}for(let C=0;C<u.length;C++)u[C]=u[C]/y;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=u,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:E}=this;d.dTheta.value=_,d.mipInt.value=E-n;const M=this._sizeLods[r],B=3*M*(r>E-Vn?r-E+Vn:0),w=4*(this._cubeSize-M);Ii(t,B,w,3*M,2*M),l.setRenderTarget(t),l.render(c,fr)}}function Ol(i){const e=[],t=[],n=[];let r=i;const s=i-Vn+1+hs.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);t.push(o);let l=1/o;a>i-Vn?l=hs[a-i+Vn-1]:a===0&&(l=0),n.push(l);const h=1/(o-2),f=-h,c=1+h,d=[f,f,c,f,c,c,f,f,c,c,f,c],m=6,_=6,S=3,p=2,u=1,y=new Float32Array(S*_*m),E=new Float32Array(p*_*m),M=new Float32Array(u*_*m);for(let w=0;w<m;w++){const C=w%3*2/3-1,L=w>2?0:-1,T=[C,L,0,C+2/3,L,0,C+2/3,L+1,0,C,L,0,C+2/3,L+1,0,C,L+1,0];y.set(T,S*_*w),E.set(d,p*_*w);const v=[w,w,w,w,w,w];M.set(v,u*_*w)}const B=new Ut;B.setAttribute("position",new Wt(y,S)),B.setAttribute("uv",new Wt(E,p)),B.setAttribute("faceIndex",new Wt(M,u)),e.push(B),r>Vn&&r--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function ps(i,e,t){const n=new Dt(i,e,t);return n.texture.mapping=306,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ii(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function zl(i,e,t){const n=new Float32Array(xn),r=new U(0,1,0);return new vt({name:"SphericalGaussianBlur",defines:{n:xn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:vr(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function ms(){return new vt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:vr(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function _s(){return new vt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:vr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function vr(){return`

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
	`}function Gl(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){const l=o.mapping,h=l===303||l===304,f=l===301||l===302;if(h||f){let c=e.get(o);const d=c!==void 0?c.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new gr(i)),c=h?t.fromEquirectangular(o,c):t.fromCubemap(o,c),c.texture.pmremVersion=o.pmremVersion,e.set(o,c),c.texture;if(c!==void 0)return c.texture;{const m=o.image;return h&&m&&m.height>0||f&&m&&r(m)?(t===null&&(t=new gr(i)),c=h?t.fromEquirectangular(o):t.fromCubemap(o),c.texture.pmremVersion=o.pmremVersion,e.set(o,c),o.addEventListener("dispose",s),c.texture):null}}}return o}function r(o){let l=0;const h=6;for(let f=0;f<h;f++)o[f]!==void 0&&l++;return l===h}function s(o){const l=o.target;l.removeEventListener("dispose",s);const h=e.get(l);h!==void 0&&(e.delete(l),h.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function Vl(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&jn("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function Hl(i,e,t,n){const r={},s=new WeakMap;function a(c){const d=c.target;d.index!==null&&e.remove(d.index);for(const _ in d.attributes)e.remove(d.attributes[_]);for(const _ in d.morphAttributes){const S=d.morphAttributes[_];for(let p=0,u=S.length;p<u;p++)e.remove(S[p])}d.removeEventListener("dispose",a),delete r[d.id];const m=s.get(d);m&&(e.remove(m),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(c,d){return r[d.id]===!0||(d.addEventListener("dispose",a),r[d.id]=!0,t.memory.geometries++),d}function l(c){const d=c.attributes;for(const _ in d)e.update(d[_],i.ARRAY_BUFFER);const m=c.morphAttributes;for(const _ in m){const S=m[_];for(let p=0,u=S.length;p<u;p++)e.update(S[p],i.ARRAY_BUFFER)}}function h(c){const d=[],m=c.index,_=c.attributes.position;let S=0;if(m!==null){const y=m.array;S=m.version;for(let E=0,M=y.length;E<M;E+=3){const B=y[E+0],w=y[E+1],C=y[E+2];d.push(B,w,w,C,C,B)}}else if(_!==void 0){const y=_.array;S=_.version;for(let E=0,M=y.length/3-1;E<M;E+=3){const B=E+0,w=E+1,C=E+2;d.push(B,w,w,C,C,B)}}else return;const p=new(Ir(d)?ts:es)(d,1);p.version=S;const u=s.get(c);u&&e.remove(u),s.set(c,p)}function f(c){const d=s.get(c);if(d){const m=c.index;m!==null&&d.version<m.version&&h(c)}else h(c);return s.get(c)}return{get:o,update:l,getWireframeAttribute:f}}function kl(i,e,t){let n;function r(d){n=d}let s,a;function o(d){s=d.type,a=d.bytesPerElement}function l(d,m){i.drawElements(n,m,s,d*a),t.update(m,n,1)}function h(d,m,_){_!==0&&(i.drawElementsInstanced(n,m,s,d*a,_),t.update(m,n,_))}function f(d,m,_){if(_===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,s,d,0,_);let p=0;for(let u=0;u<_;u++)p+=m[u];t.update(p,n,1)}function c(d,m,_,S){if(_===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let u=0;u<d.length;u++)h(d[u]/a,m[u],S[u]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,s,d,0,S,0,_);let u=0;for(let y=0;y<_;y++)u+=m[y]*S[y];t.update(u,n,1)}}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=h,this.renderMultiDraw=f,this.renderMultiDrawInstances=c}function Wl(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(s/3);break;case i.LINES:t.lines+=o*(s/2);break;case i.LINE_STRIP:t.lines+=o*(s-1);break;case i.LINE_LOOP:t.lines+=o*s;break;case i.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function Xl(i,e,t){const n=new WeakMap,r=new Qe;function s(a,o,l){const h=a.morphTargetInfluences,f=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,c=f!==void 0?f.length:0;let d=n.get(o);if(d===void 0||d.count!==c){let T=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",T)};d!==void 0&&d.texture.dispose();const m=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],u=o.morphAttributes.normal||[],y=o.morphAttributes.color||[];let E=0;m===!0&&(E=1),_===!0&&(E=2),S===!0&&(E=3);let M=o.attributes.position.count*E,B=1;M>e.maxTextureSize&&(B=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);const w=new Float32Array(M*B*4*c),C=new Hr(w,M,B,c);C.type=1015,C.needsUpdate=!0;const L=E*4;for(let v=0;v<c;v++){const P=p[v],H=u[v],V=y[v],Y=M*B*4*v;for(let te=0;te<P.count;te++){const Z=te*L;m===!0&&(r.fromBufferAttribute(P,te),w[Y+Z+0]=r.x,w[Y+Z+1]=r.y,w[Y+Z+2]=r.z,w[Y+Z+3]=0),_===!0&&(r.fromBufferAttribute(H,te),w[Y+Z+4]=r.x,w[Y+Z+5]=r.y,w[Y+Z+6]=r.z,w[Y+Z+7]=0),S===!0&&(r.fromBufferAttribute(V,te),w[Y+Z+8]=r.x,w[Y+Z+9]=r.y,w[Y+Z+10]=r.z,w[Y+Z+11]=V.itemSize===4?r.w:1)}}d={count:c,texture:C,size:new Pe(M,B)},n.set(o,d),o.addEventListener("dispose",T)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let S=0;S<h.length;S++)m+=h[S];const _=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",_),l.getUniforms().setValue(i,"morphTargetInfluences",h)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:s}}function ql(i,e,t,n){let r=new WeakMap;function s(l){const h=n.render.frame,f=l.geometry,c=e.get(l,f);if(r.get(c)!==h&&(e.update(c),r.set(c,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,h))),l.isSkinnedMesh){const d=l.skeleton;r.get(d)!==h&&(d.update(),r.set(d,h))}return c}function a(){r=new WeakMap}function o(l){const h=l.target;h.removeEventListener("dispose",o),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:s,dispose:a}}class gs extends xt{constructor(e,t,n,r,s,a,o,l,h,f=1026){if(f!==1026&&f!==1027)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&f===1026&&(n=1014),n===void 0&&f===1027&&(n=1020),super(null,r,s,a,o,l,f,n,h),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:1003,this.minFilter=l!==void 0?l:1003,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const vs=new xt,xs=new gs(1,1),Ms=new Hr,Ss=new ha,Es=new cs,Ts=[],ys=[],bs=new Float32Array(16),As=new Float32Array(9),Rs=new Float32Array(4);function kn(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let s=Ts[r];if(s===void 0&&(s=new Float32Array(r),Ts[r]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(s,o)}return s}function ct(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function ut(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Fi(i,e){let t=ys[e];t===void 0&&(t=new Int32Array(e),ys[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Yl(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function $l(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ct(t,e))return;i.uniform2fv(this.addr,e),ut(t,e)}}function Kl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(ct(t,e))return;i.uniform3fv(this.addr,e),ut(t,e)}}function Zl(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ct(t,e))return;i.uniform4fv(this.addr,e),ut(t,e)}}function jl(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ct(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),ut(t,e)}else{if(ct(t,n))return;Rs.set(n),i.uniformMatrix2fv(this.addr,!1,Rs),ut(t,n)}}function Jl(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ct(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),ut(t,e)}else{if(ct(t,n))return;As.set(n),i.uniformMatrix3fv(this.addr,!1,As),ut(t,n)}}function Ql(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ct(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),ut(t,e)}else{if(ct(t,n))return;bs.set(n),i.uniformMatrix4fv(this.addr,!1,bs),ut(t,n)}}function ec(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function tc(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ct(t,e))return;i.uniform2iv(this.addr,e),ut(t,e)}}function nc(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(ct(t,e))return;i.uniform3iv(this.addr,e),ut(t,e)}}function ic(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ct(t,e))return;i.uniform4iv(this.addr,e),ut(t,e)}}function rc(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function sc(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ct(t,e))return;i.uniform2uiv(this.addr,e),ut(t,e)}}function ac(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(ct(t,e))return;i.uniform3uiv(this.addr,e),ut(t,e)}}function oc(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ct(t,e))return;i.uniform4uiv(this.addr,e),ut(t,e)}}function lc(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(xs.compareFunction=515,s=xs):s=vs,t.setTexture2D(e||s,r)}function cc(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||Ss,r)}function uc(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||Es,r)}function hc(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||Ms,r)}function fc(i){switch(i){case 5126:return Yl;case 35664:return $l;case 35665:return Kl;case 35666:return Zl;case 35674:return jl;case 35675:return Jl;case 35676:return Ql;case 5124:case 35670:return ec;case 35667:case 35671:return tc;case 35668:case 35672:return nc;case 35669:case 35673:return ic;case 5125:return rc;case 36294:return sc;case 36295:return ac;case 36296:return oc;case 35678:case 36198:case 36298:case 36306:case 35682:return lc;case 35679:case 36299:case 36307:return cc;case 35680:case 36300:case 36308:case 36293:return uc;case 36289:case 36303:case 36311:case 36292:return hc}}function dc(i,e){i.uniform1fv(this.addr,e)}function pc(i,e){const t=kn(e,this.size,2);i.uniform2fv(this.addr,t)}function mc(i,e){const t=kn(e,this.size,3);i.uniform3fv(this.addr,t)}function _c(i,e){const t=kn(e,this.size,4);i.uniform4fv(this.addr,t)}function gc(i,e){const t=kn(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function vc(i,e){const t=kn(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function xc(i,e){const t=kn(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Mc(i,e){i.uniform1iv(this.addr,e)}function Sc(i,e){i.uniform2iv(this.addr,e)}function Ec(i,e){i.uniform3iv(this.addr,e)}function Tc(i,e){i.uniform4iv(this.addr,e)}function yc(i,e){i.uniform1uiv(this.addr,e)}function bc(i,e){i.uniform2uiv(this.addr,e)}function Ac(i,e){i.uniform3uiv(this.addr,e)}function Rc(i,e){i.uniform4uiv(this.addr,e)}function wc(i,e,t){const n=this.cache,r=e.length,s=Fi(t,r);ct(n,s)||(i.uniform1iv(this.addr,s),ut(n,s));for(let a=0;a!==r;++a)t.setTexture2D(e[a]||vs,s[a])}function Cc(i,e,t){const n=this.cache,r=e.length,s=Fi(t,r);ct(n,s)||(i.uniform1iv(this.addr,s),ut(n,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Ss,s[a])}function Pc(i,e,t){const n=this.cache,r=e.length,s=Fi(t,r);ct(n,s)||(i.uniform1iv(this.addr,s),ut(n,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Es,s[a])}function Dc(i,e,t){const n=this.cache,r=e.length,s=Fi(t,r);ct(n,s)||(i.uniform1iv(this.addr,s),ut(n,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Ms,s[a])}function Lc(i){switch(i){case 5126:return dc;case 35664:return pc;case 35665:return mc;case 35666:return _c;case 35674:return gc;case 35675:return vc;case 35676:return xc;case 5124:case 35670:return Mc;case 35667:case 35671:return Sc;case 35668:case 35672:return Ec;case 35669:case 35673:return Tc;case 5125:return yc;case 36294:return bc;case 36295:return Ac;case 36296:return Rc;case 35678:case 36198:case 36298:case 36306:case 35682:return wc;case 35679:case 36299:case 36307:return Cc;case 35680:case 36300:case 36308:case 36293:return Pc;case 36289:case 36303:case 36311:case 36292:return Dc}}class Uc{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=fc(t.type)}}class Ic{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Lc(t.type)}}class Fc{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],n)}}}const xr=/(\w+)(\])?(\[|\.)?/g;function ws(i,e){i.seq.push(e),i.map[e.id]=e}function Nc(i,e,t){const n=i.name,r=n.length;for(xr.lastIndex=0;;){const s=xr.exec(n),a=xr.lastIndex;let o=s[1];const l=s[2]==="]",h=s[3];if(l&&(o=o|0),h===void 0||h==="["&&a+2===r){ws(t,h===void 0?new Uc(o,i,e):new Ic(o,i,e));break}else{let c=t.map[o];c===void 0&&(c=new Fc(o),ws(t,c)),t=c}}}class Ni{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const s=e.getActiveUniform(t,r),a=e.getUniformLocation(t,s.name);Nc(s,a,this)}}setValue(e,t,n,r){const s=this.map[t];s!==void 0&&s.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&n.push(a)}return n}}function Cs(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const Bc=37297;let Oc=0;function zc(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const Ps=new Ne;function Gc(i){Xe._getMatrix(Ps,Xe.workingColorSpace,i);const e=`mat3( ${Ps.elements.map(t=>t.toFixed(4))} )`;switch(Xe.getTransfer(i)){case pi:return[e,"LinearTransferOETF"];case Je:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Ds(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=i.getShaderInfoLog(e).trim();if(n&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const a=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+zc(i.getShaderSource(e),a)}else return r}function Vc(i,e){const t=Gc(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Hc(i,e){let t;switch(e){case 1:t="Linear";break;case 2:t="Reinhard";break;case 3:t="Cineon";break;case 4:t="ACESFilmic";break;case 6:t="AgX";break;case 7:t="Neutral";break;case 5:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Bi=new U;function kc(){Xe.getLuminanceCoefficients(Bi);const i=Bi.x.toFixed(4),e=Bi.y.toFixed(4),t=Bi.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Wc(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ai).join(`
`)}function Xc(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function qc(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(e,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function ai(i){return i!==""}function Ls(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Us(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Yc=/^[ \t]*#include +<([\w\d./]+)>/gm;function Mr(i){return i.replace(Yc,Kc)}const $c=new Map;function Kc(i,e){let t=Ge[e];if(t===void 0){const n=$c.get(e);if(n!==void 0)t=Ge[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Mr(t)}const Zc=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Is(i){return i.replace(Zc,jc)}function jc(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Fs(i){let e=`precision ${i.precision} float;
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
#define LOW_PRECISION`),e}function Jc(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===1?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===2?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===3&&(e="SHADOWMAP_TYPE_VSM"),e}function Qc(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case 301:case 302:e="ENVMAP_TYPE_CUBE";break;case 306:e="ENVMAP_TYPE_CUBE_UV";break}return e}function eu(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case 302:e="ENVMAP_MODE_REFRACTION";break}return e}function tu(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case 0:e="ENVMAP_BLENDING_MULTIPLY";break;case 1:e="ENVMAP_BLENDING_MIX";break;case 2:e="ENVMAP_BLENDING_ADD";break}return e}function nu(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function iu(i,e,t,n){const r=i.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=Jc(t),h=Qc(t),f=eu(t),c=tu(t),d=nu(t),m=Wc(t),_=Xc(s),S=r.createProgram();let p,u,y=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(ai).join(`
`),p.length>0&&(p+=`
`),u=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(ai).join(`
`),u.length>0&&(u+=`
`)):(p=[Fs(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ai).join(`
`),u=[Fs(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+f:"",t.envMap?"#define "+c:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==0?"#define TONE_MAPPING":"",t.toneMapping!==0?Ge.tonemapping_pars_fragment:"",t.toneMapping!==0?Hc("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ge.colorspace_pars_fragment,Vc("linearToOutputTexel",t.outputColorSpace),kc(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ai).join(`
`)),a=Mr(a),a=Ls(a,t),a=Us(a,t),o=Mr(o),o=Ls(o,t),o=Us(o,t),a=Is(a),o=Is(o),t.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,u=["#define varying in",t.glslVersion===Ur?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ur?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);const E=y+p+a,M=y+u+o,B=Cs(r,r.VERTEX_SHADER,E),w=Cs(r,r.FRAGMENT_SHADER,M);r.attachShader(S,B),r.attachShader(S,w),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function C(P){if(i.debug.checkShaderErrors){const H=r.getProgramInfoLog(S).trim(),V=r.getShaderInfoLog(B).trim(),Y=r.getShaderInfoLog(w).trim();let te=!0,Z=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(te=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,S,B,w);else{const le=Ds(r,B,"vertex"),$=Ds(r,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+H+`
`+le+`
`+$)}else H!==""?console.warn("THREE.WebGLProgram: Program Info Log:",H):(V===""||Y==="")&&(Z=!1);Z&&(P.diagnostics={runnable:te,programLog:H,vertexShader:{log:V,prefix:p},fragmentShader:{log:Y,prefix:u}})}r.deleteShader(B),r.deleteShader(w),L=new Ni(r,S),T=qc(r,S)}let L;this.getUniforms=function(){return L===void 0&&C(this),L};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let v=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=r.getProgramParameter(S,Bc)),v},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Oc++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=B,this.fragmentShader=w,this}let ru=0;class su{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new au(e),t.set(e,n)),n}}class au{constructor(e){this.id=ru++,this.code=e,this.usedTimes=0}}function ou(i,e,t,n,r,s,a){const o=new qr,l=new su,h=new Set,f=[],c=r.logarithmicDepthBuffer,d=r.vertexTextures;let m=r.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function S(T){return h.add(T),T===0?"uv":`uv${T}`}function p(T,v,P,H,V){const Y=H.fog,te=V.geometry,Z=T.isMeshStandardMaterial?H.environment:null,le=(T.isMeshStandardMaterial?t:e).get(T.envMap||Z),$=le&&le.mapping===306?le.image.height:null,de=_[T.type];T.precision!==null&&(m=r.getMaxPrecision(T.precision),m!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",m,"instead."));const pe=te.morphAttributes.position||te.morphAttributes.normal||te.morphAttributes.color,_e=pe!==void 0?pe.length:0;let Ie=0;te.morphAttributes.position!==void 0&&(Ie=1),te.morphAttributes.normal!==void 0&&(Ie=2),te.morphAttributes.color!==void 0&&(Ie=3);let Ce,J,oe,xe;if(de){const qe=Xt[de];Ce=qe.vertexShader,J=qe.fragmentShader}else Ce=T.vertexShader,J=T.fragmentShader,l.update(T),oe=l.getVertexShaderID(T),xe=l.getFragmentShaderID(T);const ue=i.getRenderTarget(),we=i.state.buffers.depth.getReversed(),De=V.isInstancedMesh===!0,Le=V.isBatchedMesh===!0,Ye=!!T.map,ke=!!T.matcap,st=!!le,I=!!T.aoMap,yt=!!T.lightMap,Fe=!!T.bumpMap,He=!!T.normalMap,be=!!T.displacementMap,$e=!!T.emissiveMap,Re=!!T.metalnessMap,b=!!T.roughnessMap,g=T.anisotropy>0,G=T.clearcoat>0,ee=T.dispersion>0,ne=T.iridescence>0,j=T.sheen>0,Me=T.transmission>0,he=g&&!!T.anisotropyMap,ge=G&&!!T.clearcoatMap,We=G&&!!T.clearcoatNormalMap,ie=G&&!!T.clearcoatRoughnessMap,ve=ne&&!!T.iridescenceMap,A=ne&&!!T.iridescenceThicknessMap,D=j&&!!T.sheenColorMap,O=j&&!!T.sheenRoughnessMap,q=!!T.specularMap,Q=!!T.specularColorMap,re=!!T.specularIntensityMap,R=Me&&!!T.transmissionMap,K=Me&&!!T.thicknessMap,z=!!T.gradientMap,X=!!T.alphaMap,ae=T.alphaTest>0,se=!!T.alphaHash,Se=!!T.extensions;let Ve=0;T.toneMapped&&(ue===null||ue.isXRRenderTarget===!0)&&(Ve=i.toneMapping);const at={shaderID:de,shaderType:T.type,shaderName:T.name,vertexShader:Ce,fragmentShader:J,defines:T.defines,customVertexShaderID:oe,customFragmentShaderID:xe,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:m,batching:Le,batchingColor:Le&&V._colorsTexture!==null,instancing:De,instancingColor:De&&V.instanceColor!==null,instancingMorph:De&&V.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:ue===null?i.outputColorSpace:ue.isXRRenderTarget===!0?ue.texture.colorSpace:bn,alphaToCoverage:!!T.alphaToCoverage,map:Ye,matcap:ke,envMap:st,envMapMode:st&&le.mapping,envMapCubeUVHeight:$,aoMap:I,lightMap:yt,bumpMap:Fe,normalMap:He,displacementMap:d&&be,emissiveMap:$e,normalMapObjectSpace:He&&T.normalMapType===1,normalMapTangentSpace:He&&T.normalMapType===0,metalnessMap:Re,roughnessMap:b,anisotropy:g,anisotropyMap:he,clearcoat:G,clearcoatMap:ge,clearcoatNormalMap:We,clearcoatRoughnessMap:ie,dispersion:ee,iridescence:ne,iridescenceMap:ve,iridescenceThicknessMap:A,sheen:j,sheenColorMap:D,sheenRoughnessMap:O,specularMap:q,specularColorMap:Q,specularIntensityMap:re,transmission:Me,transmissionMap:R,thicknessMap:K,gradientMap:z,opaque:T.transparent===!1&&T.blending===1&&T.alphaToCoverage===!1,alphaMap:X,alphaTest:ae,alphaHash:se,combine:T.combine,mapUv:Ye&&S(T.map.channel),aoMapUv:I&&S(T.aoMap.channel),lightMapUv:yt&&S(T.lightMap.channel),bumpMapUv:Fe&&S(T.bumpMap.channel),normalMapUv:He&&S(T.normalMap.channel),displacementMapUv:be&&S(T.displacementMap.channel),emissiveMapUv:$e&&S(T.emissiveMap.channel),metalnessMapUv:Re&&S(T.metalnessMap.channel),roughnessMapUv:b&&S(T.roughnessMap.channel),anisotropyMapUv:he&&S(T.anisotropyMap.channel),clearcoatMapUv:ge&&S(T.clearcoatMap.channel),clearcoatNormalMapUv:We&&S(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ie&&S(T.clearcoatRoughnessMap.channel),iridescenceMapUv:ve&&S(T.iridescenceMap.channel),iridescenceThicknessMapUv:A&&S(T.iridescenceThicknessMap.channel),sheenColorMapUv:D&&S(T.sheenColorMap.channel),sheenRoughnessMapUv:O&&S(T.sheenRoughnessMap.channel),specularMapUv:q&&S(T.specularMap.channel),specularColorMapUv:Q&&S(T.specularColorMap.channel),specularIntensityMapUv:re&&S(T.specularIntensityMap.channel),transmissionMapUv:R&&S(T.transmissionMap.channel),thicknessMapUv:K&&S(T.thicknessMap.channel),alphaMapUv:X&&S(T.alphaMap.channel),vertexTangents:!!te.attributes.tangent&&(He||g),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!te.attributes.color&&te.attributes.color.itemSize===4,pointsUvs:V.isPoints===!0&&!!te.attributes.uv&&(Ye||X),fog:!!Y,useFog:T.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:c,reverseDepthBuffer:we,skinning:V.isSkinnedMesh===!0,morphTargets:te.morphAttributes.position!==void 0,morphNormals:te.morphAttributes.normal!==void 0,morphColors:te.morphAttributes.color!==void 0,morphTargetsCount:_e,morphTextureStride:Ie,numDirLights:v.directional.length,numPointLights:v.point.length,numSpotLights:v.spot.length,numSpotLightMaps:v.spotLightMap.length,numRectAreaLights:v.rectArea.length,numHemiLights:v.hemi.length,numDirLightShadows:v.directionalShadowMap.length,numPointLightShadows:v.pointShadowMap.length,numSpotLightShadows:v.spotShadowMap.length,numSpotLightShadowsWithMaps:v.numSpotLightShadowsWithMaps,numLightProbes:v.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:T.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ve,decodeVideoTexture:Ye&&T.map.isVideoTexture===!0&&Xe.getTransfer(T.map.colorSpace)===Je,decodeVideoTextureEmissive:$e&&T.emissiveMap.isVideoTexture===!0&&Xe.getTransfer(T.emissiveMap.colorSpace)===Je,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===2,flipSided:T.side===1,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Se&&T.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Se&&T.extensions.multiDraw===!0||Le)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return at.vertexUv1s=h.has(1),at.vertexUv2s=h.has(2),at.vertexUv3s=h.has(3),h.clear(),at}function u(T){const v=[];if(T.shaderID?v.push(T.shaderID):(v.push(T.customVertexShaderID),v.push(T.customFragmentShaderID)),T.defines!==void 0)for(const P in T.defines)v.push(P),v.push(T.defines[P]);return T.isRawShaderMaterial===!1&&(y(v,T),E(v,T),v.push(i.outputColorSpace)),v.push(T.customProgramCacheKey),v.join()}function y(T,v){T.push(v.precision),T.push(v.outputColorSpace),T.push(v.envMapMode),T.push(v.envMapCubeUVHeight),T.push(v.mapUv),T.push(v.alphaMapUv),T.push(v.lightMapUv),T.push(v.aoMapUv),T.push(v.bumpMapUv),T.push(v.normalMapUv),T.push(v.displacementMapUv),T.push(v.emissiveMapUv),T.push(v.metalnessMapUv),T.push(v.roughnessMapUv),T.push(v.anisotropyMapUv),T.push(v.clearcoatMapUv),T.push(v.clearcoatNormalMapUv),T.push(v.clearcoatRoughnessMapUv),T.push(v.iridescenceMapUv),T.push(v.iridescenceThicknessMapUv),T.push(v.sheenColorMapUv),T.push(v.sheenRoughnessMapUv),T.push(v.specularMapUv),T.push(v.specularColorMapUv),T.push(v.specularIntensityMapUv),T.push(v.transmissionMapUv),T.push(v.thicknessMapUv),T.push(v.combine),T.push(v.fogExp2),T.push(v.sizeAttenuation),T.push(v.morphTargetsCount),T.push(v.morphAttributeCount),T.push(v.numDirLights),T.push(v.numPointLights),T.push(v.numSpotLights),T.push(v.numSpotLightMaps),T.push(v.numHemiLights),T.push(v.numRectAreaLights),T.push(v.numDirLightShadows),T.push(v.numPointLightShadows),T.push(v.numSpotLightShadows),T.push(v.numSpotLightShadowsWithMaps),T.push(v.numLightProbes),T.push(v.shadowMapType),T.push(v.toneMapping),T.push(v.numClippingPlanes),T.push(v.numClipIntersection),T.push(v.depthPacking)}function E(T,v){o.disableAll(),v.supportsVertexTextures&&o.enable(0),v.instancing&&o.enable(1),v.instancingColor&&o.enable(2),v.instancingMorph&&o.enable(3),v.matcap&&o.enable(4),v.envMap&&o.enable(5),v.normalMapObjectSpace&&o.enable(6),v.normalMapTangentSpace&&o.enable(7),v.clearcoat&&o.enable(8),v.iridescence&&o.enable(9),v.alphaTest&&o.enable(10),v.vertexColors&&o.enable(11),v.vertexAlphas&&o.enable(12),v.vertexUv1s&&o.enable(13),v.vertexUv2s&&o.enable(14),v.vertexUv3s&&o.enable(15),v.vertexTangents&&o.enable(16),v.anisotropy&&o.enable(17),v.alphaHash&&o.enable(18),v.batching&&o.enable(19),v.dispersion&&o.enable(20),v.batchingColor&&o.enable(21),T.push(o.mask),o.disableAll(),v.fog&&o.enable(0),v.useFog&&o.enable(1),v.flatShading&&o.enable(2),v.logarithmicDepthBuffer&&o.enable(3),v.reverseDepthBuffer&&o.enable(4),v.skinning&&o.enable(5),v.morphTargets&&o.enable(6),v.morphNormals&&o.enable(7),v.morphColors&&o.enable(8),v.premultipliedAlpha&&o.enable(9),v.shadowMapEnabled&&o.enable(10),v.doubleSided&&o.enable(11),v.flipSided&&o.enable(12),v.useDepthPacking&&o.enable(13),v.dithering&&o.enable(14),v.transmission&&o.enable(15),v.sheen&&o.enable(16),v.opaque&&o.enable(17),v.pointsUvs&&o.enable(18),v.decodeVideoTexture&&o.enable(19),v.decodeVideoTextureEmissive&&o.enable(20),v.alphaToCoverage&&o.enable(21),T.push(o.mask)}function M(T){const v=_[T.type];let P;if(v){const H=Xt[v];P=si.clone(H.uniforms)}else P=T.uniforms;return P}function B(T,v){let P;for(let H=0,V=f.length;H<V;H++){const Y=f[H];if(Y.cacheKey===v){P=Y,++P.usedTimes;break}}return P===void 0&&(P=new iu(i,v,T,s),f.push(P)),P}function w(T){if(--T.usedTimes===0){const v=f.indexOf(T);f[v]=f[f.length-1],f.pop(),T.destroy()}}function C(T){l.remove(T)}function L(){l.dispose()}return{getParameters:p,getProgramCacheKey:u,getUniforms:M,acquireProgram:B,releaseProgram:w,releaseShaderCache:C,programs:f,dispose:L}}function lu(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function r(a,o,l){i.get(a)[o]=l}function s(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:s}}function cu(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Ns(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Bs(){const i=[];let e=0;const t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0}function a(c,d,m,_,S,p){let u=i[e];return u===void 0?(u={id:c.id,object:c,geometry:d,material:m,groupOrder:_,renderOrder:c.renderOrder,z:S,group:p},i[e]=u):(u.id=c.id,u.object=c,u.geometry=d,u.material=m,u.groupOrder=_,u.renderOrder=c.renderOrder,u.z=S,u.group=p),e++,u}function o(c,d,m,_,S,p){const u=a(c,d,m,_,S,p);m.transmission>0?n.push(u):m.transparent===!0?r.push(u):t.push(u)}function l(c,d,m,_,S,p){const u=a(c,d,m,_,S,p);m.transmission>0?n.unshift(u):m.transparent===!0?r.unshift(u):t.unshift(u)}function h(c,d){t.length>1&&t.sort(c||cu),n.length>1&&n.sort(d||Ns),r.length>1&&r.sort(d||Ns)}function f(){for(let c=e,d=i.length;c<d;c++){const m=i[c];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:r,init:s,push:o,unshift:l,finish:f,sort:h}}function uu(){let i=new WeakMap;function e(n,r){const s=i.get(n);let a;return s===void 0?(a=new Bs,i.set(n,[a])):r>=s.length?(a=new Bs,s.push(a)):a=s[r],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function hu(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new U,color:new ze};break;case"SpotLight":t={position:new U,direction:new U,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new U,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new U,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new U,halfWidth:new U,halfHeight:new U};break}return i[e.id]=t,t}}}function fu(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Pe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Pe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Pe,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let du=0;function pu(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function mu(i){const e=new hu,t=fu(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new U);const r=new U,s=new rt,a=new rt;function o(h){let f=0,c=0,d=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let m=0,_=0,S=0,p=0,u=0,y=0,E=0,M=0,B=0,w=0,C=0;h.sort(pu);for(let T=0,v=h.length;T<v;T++){const P=h[T],H=P.color,V=P.intensity,Y=P.distance,te=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)f+=H.r*V,c+=H.g*V,d+=H.b*V;else if(P.isLightProbe){for(let Z=0;Z<9;Z++)n.probe[Z].addScaledVector(P.sh.coefficients[Z],V);C++}else if(P.isDirectionalLight){const Z=e.get(P);if(Z.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const le=P.shadow,$=t.get(P);$.shadowIntensity=le.intensity,$.shadowBias=le.bias,$.shadowNormalBias=le.normalBias,$.shadowRadius=le.radius,$.shadowMapSize=le.mapSize,n.directionalShadow[m]=$,n.directionalShadowMap[m]=te,n.directionalShadowMatrix[m]=P.shadow.matrix,y++}n.directional[m]=Z,m++}else if(P.isSpotLight){const Z=e.get(P);Z.position.setFromMatrixPosition(P.matrixWorld),Z.color.copy(H).multiplyScalar(V),Z.distance=Y,Z.coneCos=Math.cos(P.angle),Z.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),Z.decay=P.decay,n.spot[S]=Z;const le=P.shadow;if(P.map&&(n.spotLightMap[B]=P.map,B++,le.updateMatrices(P),P.castShadow&&w++),n.spotLightMatrix[S]=le.matrix,P.castShadow){const $=t.get(P);$.shadowIntensity=le.intensity,$.shadowBias=le.bias,$.shadowNormalBias=le.normalBias,$.shadowRadius=le.radius,$.shadowMapSize=le.mapSize,n.spotShadow[S]=$,n.spotShadowMap[S]=te,M++}S++}else if(P.isRectAreaLight){const Z=e.get(P);Z.color.copy(H).multiplyScalar(V),Z.halfWidth.set(P.width*.5,0,0),Z.halfHeight.set(0,P.height*.5,0),n.rectArea[p]=Z,p++}else if(P.isPointLight){const Z=e.get(P);if(Z.color.copy(P.color).multiplyScalar(P.intensity),Z.distance=P.distance,Z.decay=P.decay,P.castShadow){const le=P.shadow,$=t.get(P);$.shadowIntensity=le.intensity,$.shadowBias=le.bias,$.shadowNormalBias=le.normalBias,$.shadowRadius=le.radius,$.shadowMapSize=le.mapSize,$.shadowCameraNear=le.camera.near,$.shadowCameraFar=le.camera.far,n.pointShadow[_]=$,n.pointShadowMap[_]=te,n.pointShadowMatrix[_]=P.shadow.matrix,E++}n.point[_]=Z,_++}else if(P.isHemisphereLight){const Z=e.get(P);Z.skyColor.copy(P.color).multiplyScalar(V),Z.groundColor.copy(P.groundColor).multiplyScalar(V),n.hemi[u]=Z,u++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=fe.LTC_FLOAT_1,n.rectAreaLTC2=fe.LTC_FLOAT_2):(n.rectAreaLTC1=fe.LTC_HALF_1,n.rectAreaLTC2=fe.LTC_HALF_2)),n.ambient[0]=f,n.ambient[1]=c,n.ambient[2]=d;const L=n.hash;(L.directionalLength!==m||L.pointLength!==_||L.spotLength!==S||L.rectAreaLength!==p||L.hemiLength!==u||L.numDirectionalShadows!==y||L.numPointShadows!==E||L.numSpotShadows!==M||L.numSpotMaps!==B||L.numLightProbes!==C)&&(n.directional.length=m,n.spot.length=S,n.rectArea.length=p,n.point.length=_,n.hemi.length=u,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=E,n.pointShadowMap.length=E,n.spotShadow.length=M,n.spotShadowMap.length=M,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=E,n.spotLightMatrix.length=M+B-w,n.spotLightMap.length=B,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=C,L.directionalLength=m,L.pointLength=_,L.spotLength=S,L.rectAreaLength=p,L.hemiLength=u,L.numDirectionalShadows=y,L.numPointShadows=E,L.numSpotShadows=M,L.numSpotMaps=B,L.numLightProbes=C,n.version=du++)}function l(h,f){let c=0,d=0,m=0,_=0,S=0;const p=f.matrixWorldInverse;for(let u=0,y=h.length;u<y;u++){const E=h[u];if(E.isDirectionalLight){const M=n.directional[c];M.direction.setFromMatrixPosition(E.matrixWorld),r.setFromMatrixPosition(E.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),c++}else if(E.isSpotLight){const M=n.spot[m];M.position.setFromMatrixPosition(E.matrixWorld),M.position.applyMatrix4(p),M.direction.setFromMatrixPosition(E.matrixWorld),r.setFromMatrixPosition(E.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),m++}else if(E.isRectAreaLight){const M=n.rectArea[_];M.position.setFromMatrixPosition(E.matrixWorld),M.position.applyMatrix4(p),a.identity(),s.copy(E.matrixWorld),s.premultiply(p),a.extractRotation(s),M.halfWidth.set(E.width*.5,0,0),M.halfHeight.set(0,E.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),_++}else if(E.isPointLight){const M=n.point[d];M.position.setFromMatrixPosition(E.matrixWorld),M.position.applyMatrix4(p),d++}else if(E.isHemisphereLight){const M=n.hemi[S];M.direction.setFromMatrixPosition(E.matrixWorld),M.direction.transformDirection(p),S++}}}return{setup:o,setupView:l,state:n}}function Os(i){const e=new mu(i),t=[],n=[];function r(f){h.camera=f,t.length=0,n.length=0}function s(f){t.push(f)}function a(f){n.push(f)}function o(){e.setup(t)}function l(f){e.setupView(t,f)}const h={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:h,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function _u(i){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Os(i),e.set(r,[o])):s>=a.length?(o=new Os(i),a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}class gu extends ii{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class vu extends ii{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const xu=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Mu=`uniform sampler2D shadow_pass;
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
}`;function Su(i,e,t){let n=new ur;const r=new Pe,s=new Pe,a=new Qe,o=new gu({depthPacking:3201}),l=new vu,h={},f=t.maxTextureSize,c={0:1,1:0,2:2},d=new vt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Pe},radius:{value:4}},vertexShader:xu,fragmentShader:Mu}),m=d.clone();m.defines.HORIZONTAL_PASS=1;const _=new Ut;_.setAttribute("position",new Wt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new et(_,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let u=this.type;this.render=function(w,C,L){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||w.length===0)return;const T=i.getRenderTarget(),v=i.getActiveCubeFace(),P=i.getActiveMipmapLevel(),H=i.state;H.setBlending(0),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);const V=u!==3&&this.type===3,Y=u===3&&this.type!==3;for(let te=0,Z=w.length;te<Z;te++){const le=w[te],$=le.shadow;if($===void 0){console.warn("THREE.WebGLShadowMap:",le,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const de=$.getFrameExtents();if(r.multiply(de),s.copy($.mapSize),(r.x>f||r.y>f)&&(r.x>f&&(s.x=Math.floor(f/de.x),r.x=s.x*de.x,$.mapSize.x=s.x),r.y>f&&(s.y=Math.floor(f/de.y),r.y=s.y*de.y,$.mapSize.y=s.y)),$.map===null||V===!0||Y===!0){const _e=this.type!==3?{minFilter:1003,magFilter:1003}:{};$.map!==null&&$.map.dispose(),$.map=new Dt(r.x,r.y,_e),$.map.texture.name=le.name+".shadowMap",$.camera.updateProjectionMatrix()}i.setRenderTarget($.map),i.clear();const pe=$.getViewportCount();for(let _e=0;_e<pe;_e++){const Ie=$.getViewport(_e);a.set(s.x*Ie.x,s.y*Ie.y,s.x*Ie.z,s.y*Ie.w),H.viewport(a),$.updateMatrices(le,_e),n=$.getFrustum(),M(C,L,$.camera,le,this.type)}$.isPointLightShadow!==!0&&this.type===3&&y($,L),$.needsUpdate=!1}u=this.type,p.needsUpdate=!1,i.setRenderTarget(T,v,P)};function y(w,C){const L=e.update(S);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,m.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Dt(r.x,r.y)),d.uniforms.shadow_pass.value=w.map.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(C,null,L,d,S,null),m.uniforms.shadow_pass.value=w.mapPass.texture,m.uniforms.resolution.value=w.mapSize,m.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(C,null,L,m,S,null)}function E(w,C,L,T){let v=null;const P=L.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(P!==void 0)v=P;else if(v=L.isPointLight===!0?l:o,i.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){const H=v.uuid,V=C.uuid;let Y=h[H];Y===void 0&&(Y={},h[H]=Y);let te=Y[V];te===void 0&&(te=v.clone(),Y[V]=te,C.addEventListener("dispose",B)),v=te}if(v.visible=C.visible,v.wireframe=C.wireframe,T===3?v.side=C.shadowSide!==null?C.shadowSide:C.side:v.side=C.shadowSide!==null?C.shadowSide:c[C.side],v.alphaMap=C.alphaMap,v.alphaTest=C.alphaTest,v.map=C.map,v.clipShadows=C.clipShadows,v.clippingPlanes=C.clippingPlanes,v.clipIntersection=C.clipIntersection,v.displacementMap=C.displacementMap,v.displacementScale=C.displacementScale,v.displacementBias=C.displacementBias,v.wireframeLinewidth=C.wireframeLinewidth,v.linewidth=C.linewidth,L.isPointLight===!0&&v.isMeshDistanceMaterial===!0){const H=i.properties.get(v);H.light=L}return v}function M(w,C,L,T,v){if(w.visible===!1)return;if(w.layers.test(C.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&v===3)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,w.matrixWorld);const V=e.update(w),Y=w.material;if(Array.isArray(Y)){const te=V.groups;for(let Z=0,le=te.length;Z<le;Z++){const $=te[Z],de=Y[$.materialIndex];if(de&&de.visible){const pe=E(w,de,T,v);w.onBeforeShadow(i,w,C,L,V,pe,$),i.renderBufferDirect(L,null,V,pe,w,$),w.onAfterShadow(i,w,C,L,V,pe,$)}}}else if(Y.visible){const te=E(w,Y,T,v);w.onBeforeShadow(i,w,C,L,V,te,null),i.renderBufferDirect(L,null,V,te,w,null),w.onAfterShadow(i,w,C,L,V,te,null)}}const H=w.children;for(let V=0,Y=H.length;V<Y;V++)M(H[V],C,L,T,v)}function B(w){w.target.removeEventListener("dispose",B);for(const L in h){const T=h[L],v=w.target.uuid;v in T&&(T[v].dispose(),delete T[v])}}}const Eu={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3};function Tu(i,e){function t(){let R=!1;const K=new Qe;let z=null;const X=new Qe(0,0,0,0);return{setMask:function(ae){z!==ae&&!R&&(i.colorMask(ae,ae,ae,ae),z=ae)},setLocked:function(ae){R=ae},setClear:function(ae,se,Se,Ve,at){at===!0&&(ae*=Ve,se*=Ve,Se*=Ve),K.set(ae,se,Se,Ve),X.equals(K)===!1&&(i.clearColor(ae,se,Se,Ve),X.copy(K))},reset:function(){R=!1,z=null,X.set(-1,0,0,0)}}}function n(){let R=!1,K=!1,z=null,X=null,ae=null;return{setReversed:function(se){if(K!==se){const Se=e.get("EXT_clip_control");K?Se.clipControlEXT(Se.LOWER_LEFT_EXT,Se.ZERO_TO_ONE_EXT):Se.clipControlEXT(Se.LOWER_LEFT_EXT,Se.NEGATIVE_ONE_TO_ONE_EXT);const Ve=ae;ae=null,this.setClear(Ve)}K=se},getReversed:function(){return K},setTest:function(se){se?ue(i.DEPTH_TEST):we(i.DEPTH_TEST)},setMask:function(se){z!==se&&!R&&(i.depthMask(se),z=se)},setFunc:function(se){if(K&&(se=Eu[se]),X!==se){switch(se){case 0:i.depthFunc(i.NEVER);break;case 1:i.depthFunc(i.ALWAYS);break;case 2:i.depthFunc(i.LESS);break;case 3:i.depthFunc(i.LEQUAL);break;case 4:i.depthFunc(i.EQUAL);break;case 5:i.depthFunc(i.GEQUAL);break;case 6:i.depthFunc(i.GREATER);break;case 7:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}X=se}},setLocked:function(se){R=se},setClear:function(se){ae!==se&&(K&&(se=1-se),i.clearDepth(se),ae=se)},reset:function(){R=!1,z=null,X=null,ae=null,K=!1}}}function r(){let R=!1,K=null,z=null,X=null,ae=null,se=null,Se=null,Ve=null,at=null;return{setTest:function(qe){R||(qe?ue(i.STENCIL_TEST):we(i.STENCIL_TEST))},setMask:function(qe){K!==qe&&!R&&(i.stencilMask(qe),K=qe)},setFunc:function(qe,St,mt){(z!==qe||X!==St||ae!==mt)&&(i.stencilFunc(qe,St,mt),z=qe,X=St,ae=mt)},setOp:function(qe,St,mt){(se!==qe||Se!==St||Ve!==mt)&&(i.stencilOp(qe,St,mt),se=qe,Se=St,Ve=mt)},setLocked:function(qe){R=qe},setClear:function(qe){at!==qe&&(i.clearStencil(qe),at=qe)},reset:function(){R=!1,K=null,z=null,X=null,ae=null,se=null,Se=null,Ve=null,at=null}}}const s=new t,a=new n,o=new r,l=new WeakMap,h=new WeakMap;let f={},c={},d=new WeakMap,m=[],_=null,S=!1,p=null,u=null,y=null,E=null,M=null,B=null,w=null,C=new ze(0,0,0),L=0,T=!1,v=null,P=null,H=null,V=null,Y=null;const te=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Z=!1,le=0;const $=i.getParameter(i.VERSION);$.indexOf("WebGL")!==-1?(le=parseFloat(/^WebGL (\d)/.exec($)[1]),Z=le>=1):$.indexOf("OpenGL ES")!==-1&&(le=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),Z=le>=2);let de=null,pe={};const _e=i.getParameter(i.SCISSOR_BOX),Ie=i.getParameter(i.VIEWPORT),Ce=new Qe().fromArray(_e),J=new Qe().fromArray(Ie);function oe(R,K,z,X){const ae=new Uint8Array(4),se=i.createTexture();i.bindTexture(R,se),i.texParameteri(R,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(R,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Se=0;Se<z;Se++)R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY?i.texImage3D(K,0,i.RGBA,1,1,X,0,i.RGBA,i.UNSIGNED_BYTE,ae):i.texImage2D(K+Se,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ae);return se}const xe={};xe[i.TEXTURE_2D]=oe(i.TEXTURE_2D,i.TEXTURE_2D,1),xe[i.TEXTURE_CUBE_MAP]=oe(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),xe[i.TEXTURE_2D_ARRAY]=oe(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),xe[i.TEXTURE_3D]=oe(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ue(i.DEPTH_TEST),a.setFunc(3),Fe(!1),He(1),ue(i.CULL_FACE),I(0);function ue(R){f[R]!==!0&&(i.enable(R),f[R]=!0)}function we(R){f[R]!==!1&&(i.disable(R),f[R]=!1)}function De(R,K){return c[R]!==K?(i.bindFramebuffer(R,K),c[R]=K,R===i.DRAW_FRAMEBUFFER&&(c[i.FRAMEBUFFER]=K),R===i.FRAMEBUFFER&&(c[i.DRAW_FRAMEBUFFER]=K),!0):!1}function Le(R,K){let z=m,X=!1;if(R){z=d.get(K),z===void 0&&(z=[],d.set(K,z));const ae=R.textures;if(z.length!==ae.length||z[0]!==i.COLOR_ATTACHMENT0){for(let se=0,Se=ae.length;se<Se;se++)z[se]=i.COLOR_ATTACHMENT0+se;z.length=ae.length,X=!0}}else z[0]!==i.BACK&&(z[0]=i.BACK,X=!0);X&&i.drawBuffers(z)}function Ye(R){return _!==R?(i.useProgram(R),_=R,!0):!1}const ke={100:i.FUNC_ADD,101:i.FUNC_SUBTRACT,102:i.FUNC_REVERSE_SUBTRACT};ke[103]=i.MIN,ke[104]=i.MAX;const st={200:i.ZERO,201:i.ONE,202:i.SRC_COLOR,204:i.SRC_ALPHA,210:i.SRC_ALPHA_SATURATE,208:i.DST_COLOR,206:i.DST_ALPHA,203:i.ONE_MINUS_SRC_COLOR,205:i.ONE_MINUS_SRC_ALPHA,209:i.ONE_MINUS_DST_COLOR,207:i.ONE_MINUS_DST_ALPHA,211:i.CONSTANT_COLOR,212:i.ONE_MINUS_CONSTANT_COLOR,213:i.CONSTANT_ALPHA,214:i.ONE_MINUS_CONSTANT_ALPHA};function I(R,K,z,X,ae,se,Se,Ve,at,qe){if(R===0){S===!0&&(we(i.BLEND),S=!1);return}if(S===!1&&(ue(i.BLEND),S=!0),R!==5){if(R!==p||qe!==T){if((u!==100||M!==100)&&(i.blendEquation(i.FUNC_ADD),u=100,M=100),qe)switch(R){case 1:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFunc(i.ONE,i.ONE);break;case 3:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case 4:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}else switch(R){case 1:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case 3:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case 4:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}y=null,E=null,B=null,w=null,C.set(0,0,0),L=0,p=R,T=qe}return}ae=ae||K,se=se||z,Se=Se||X,(K!==u||ae!==M)&&(i.blendEquationSeparate(ke[K],ke[ae]),u=K,M=ae),(z!==y||X!==E||se!==B||Se!==w)&&(i.blendFuncSeparate(st[z],st[X],st[se],st[Se]),y=z,E=X,B=se,w=Se),(Ve.equals(C)===!1||at!==L)&&(i.blendColor(Ve.r,Ve.g,Ve.b,at),C.copy(Ve),L=at),p=R,T=!1}function yt(R,K){R.side===2?we(i.CULL_FACE):ue(i.CULL_FACE);let z=R.side===1;K&&(z=!z),Fe(z),R.blending===1&&R.transparent===!1?I(0):I(R.blending,R.blendEquation,R.blendSrc,R.blendDst,R.blendEquationAlpha,R.blendSrcAlpha,R.blendDstAlpha,R.blendColor,R.blendAlpha,R.premultipliedAlpha),a.setFunc(R.depthFunc),a.setTest(R.depthTest),a.setMask(R.depthWrite),s.setMask(R.colorWrite);const X=R.stencilWrite;o.setTest(X),X&&(o.setMask(R.stencilWriteMask),o.setFunc(R.stencilFunc,R.stencilRef,R.stencilFuncMask),o.setOp(R.stencilFail,R.stencilZFail,R.stencilZPass)),$e(R.polygonOffset,R.polygonOffsetFactor,R.polygonOffsetUnits),R.alphaToCoverage===!0?ue(i.SAMPLE_ALPHA_TO_COVERAGE):we(i.SAMPLE_ALPHA_TO_COVERAGE)}function Fe(R){v!==R&&(R?i.frontFace(i.CW):i.frontFace(i.CCW),v=R)}function He(R){R!==0?(ue(i.CULL_FACE),R!==P&&(R===1?i.cullFace(i.BACK):R===2?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):we(i.CULL_FACE),P=R}function be(R){R!==H&&(Z&&i.lineWidth(R),H=R)}function $e(R,K,z){R?(ue(i.POLYGON_OFFSET_FILL),(V!==K||Y!==z)&&(i.polygonOffset(K,z),V=K,Y=z)):we(i.POLYGON_OFFSET_FILL)}function Re(R){R?ue(i.SCISSOR_TEST):we(i.SCISSOR_TEST)}function b(R){R===void 0&&(R=i.TEXTURE0+te-1),de!==R&&(i.activeTexture(R),de=R)}function g(R,K,z){z===void 0&&(de===null?z=i.TEXTURE0+te-1:z=de);let X=pe[z];X===void 0&&(X={type:void 0,texture:void 0},pe[z]=X),(X.type!==R||X.texture!==K)&&(de!==z&&(i.activeTexture(z),de=z),i.bindTexture(R,K||xe[R]),X.type=R,X.texture=K)}function G(){const R=pe[de];R!==void 0&&R.type!==void 0&&(i.bindTexture(R.type,null),R.type=void 0,R.texture=void 0)}function ee(){try{i.compressedTexImage2D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ne(){try{i.compressedTexImage3D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function j(){try{i.texSubImage2D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function Me(){try{i.texSubImage3D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function he(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ge(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function We(){try{i.texStorage2D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ie(){try{i.texStorage3D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ve(){try{i.texImage2D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function A(){try{i.texImage3D.apply(i,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function D(R){Ce.equals(R)===!1&&(i.scissor(R.x,R.y,R.z,R.w),Ce.copy(R))}function O(R){J.equals(R)===!1&&(i.viewport(R.x,R.y,R.z,R.w),J.copy(R))}function q(R,K){let z=h.get(K);z===void 0&&(z=new WeakMap,h.set(K,z));let X=z.get(R);X===void 0&&(X=i.getUniformBlockIndex(K,R.name),z.set(R,X))}function Q(R,K){const X=h.get(K).get(R);l.get(K)!==X&&(i.uniformBlockBinding(K,X,R.__bindingPointIndex),l.set(K,X))}function re(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),f={},de=null,pe={},c={},d=new WeakMap,m=[],_=null,S=!1,p=null,u=null,y=null,E=null,M=null,B=null,w=null,C=new ze(0,0,0),L=0,T=!1,v=null,P=null,H=null,V=null,Y=null,Ce.set(0,0,i.canvas.width,i.canvas.height),J.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:ue,disable:we,bindFramebuffer:De,drawBuffers:Le,useProgram:Ye,setBlending:I,setMaterial:yt,setFlipSided:Fe,setCullFace:He,setLineWidth:be,setPolygonOffset:$e,setScissorTest:Re,activeTexture:b,bindTexture:g,unbindTexture:G,compressedTexImage2D:ee,compressedTexImage3D:ne,texImage2D:ve,texImage3D:A,updateUBOMapping:q,uniformBlockBinding:Q,texStorage2D:We,texStorage3D:ie,texSubImage2D:j,texSubImage3D:Me,compressedTexSubImage2D:he,compressedTexSubImage3D:ge,scissor:D,viewport:O,reset:re}}function zs(i,e,t,n){const r=yu(n);switch(t){case 1021:return i*e;case 1024:return i*e;case 1025:return i*e*2;case 1028:return i*e/r.components*r.byteLength;case 1029:return i*e/r.components*r.byteLength;case 1030:return i*e*2/r.components*r.byteLength;case 1031:return i*e*2/r.components*r.byteLength;case 1022:return i*e*3/r.components*r.byteLength;case 1023:return i*e*4/r.components*r.byteLength;case 1033:return i*e*4/r.components*r.byteLength;case 33776:case 33777:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case 33778:case 33779:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 35841:case 35843:return Math.max(i,16)*Math.max(e,8)/4;case 35840:case 35842:return Math.max(i,8)*Math.max(e,8)/2;case 36196:case 37492:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case 37496:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 37808:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 37809:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case 37810:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case 37811:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case 37812:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case 37813:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case 37814:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case 37815:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case 37816:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case 37817:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case 37818:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case 37819:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case 37820:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case 37821:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(i/4)*Math.ceil(e/4)*16;case 36283:case 36284:return Math.ceil(i/4)*Math.ceil(e/4)*8;case 36285:case 36286:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function yu(i){switch(i){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function bu(i,e,t,n,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator=="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new Pe,f=new WeakMap;let c;const d=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas!="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(b,g){return m?new OffscreenCanvas(b,g):mi("canvas")}function S(b,g,G){let ee=1;const ne=Re(b);if((ne.width>G||ne.height>G)&&(ee=G/Math.max(ne.width,ne.height)),ee<1)if(typeof HTMLImageElement!="undefined"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&b instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&b instanceof ImageBitmap||typeof VideoFrame!="undefined"&&b instanceof VideoFrame){const j=Math.floor(ee*ne.width),Me=Math.floor(ee*ne.height);c===void 0&&(c=_(j,Me));const he=g?_(j,Me):c;return he.width=j,he.height=Me,he.getContext("2d").drawImage(b,0,0,j,Me),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ne.width+"x"+ne.height+") to ("+j+"x"+Me+")."),he}else return"data"in b&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ne.width+"x"+ne.height+")."),b;return b}function p(b){return b.generateMipmaps}function u(b){i.generateMipmap(b)}function y(b){return b.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?i.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function E(b,g,G,ee,ne=!1){if(b!==null){if(i[b]!==void 0)return i[b];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let j=g;if(g===i.RED&&(G===i.FLOAT&&(j=i.R32F),G===i.HALF_FLOAT&&(j=i.R16F),G===i.UNSIGNED_BYTE&&(j=i.R8)),g===i.RED_INTEGER&&(G===i.UNSIGNED_BYTE&&(j=i.R8UI),G===i.UNSIGNED_SHORT&&(j=i.R16UI),G===i.UNSIGNED_INT&&(j=i.R32UI),G===i.BYTE&&(j=i.R8I),G===i.SHORT&&(j=i.R16I),G===i.INT&&(j=i.R32I)),g===i.RG&&(G===i.FLOAT&&(j=i.RG32F),G===i.HALF_FLOAT&&(j=i.RG16F),G===i.UNSIGNED_BYTE&&(j=i.RG8)),g===i.RG_INTEGER&&(G===i.UNSIGNED_BYTE&&(j=i.RG8UI),G===i.UNSIGNED_SHORT&&(j=i.RG16UI),G===i.UNSIGNED_INT&&(j=i.RG32UI),G===i.BYTE&&(j=i.RG8I),G===i.SHORT&&(j=i.RG16I),G===i.INT&&(j=i.RG32I)),g===i.RGB_INTEGER&&(G===i.UNSIGNED_BYTE&&(j=i.RGB8UI),G===i.UNSIGNED_SHORT&&(j=i.RGB16UI),G===i.UNSIGNED_INT&&(j=i.RGB32UI),G===i.BYTE&&(j=i.RGB8I),G===i.SHORT&&(j=i.RGB16I),G===i.INT&&(j=i.RGB32I)),g===i.RGBA_INTEGER&&(G===i.UNSIGNED_BYTE&&(j=i.RGBA8UI),G===i.UNSIGNED_SHORT&&(j=i.RGBA16UI),G===i.UNSIGNED_INT&&(j=i.RGBA32UI),G===i.BYTE&&(j=i.RGBA8I),G===i.SHORT&&(j=i.RGBA16I),G===i.INT&&(j=i.RGBA32I)),g===i.RGB&&G===i.UNSIGNED_INT_5_9_9_9_REV&&(j=i.RGB9_E5),g===i.RGBA){const Me=ne?pi:Xe.getTransfer(ee);G===i.FLOAT&&(j=i.RGBA32F),G===i.HALF_FLOAT&&(j=i.RGBA16F),G===i.UNSIGNED_BYTE&&(j=Me===Je?i.SRGB8_ALPHA8:i.RGBA8),G===i.UNSIGNED_SHORT_4_4_4_4&&(j=i.RGBA4),G===i.UNSIGNED_SHORT_5_5_5_1&&(j=i.RGB5_A1)}return(j===i.R16F||j===i.R32F||j===i.RG16F||j===i.RG32F||j===i.RGBA16F||j===i.RGBA32F)&&e.get("EXT_color_buffer_float"),j}function M(b,g){let G;return b?g===null||g===1014||g===1020?G=i.DEPTH24_STENCIL8:g===1015?G=i.DEPTH32F_STENCIL8:g===1012&&(G=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===1014||g===1020?G=i.DEPTH_COMPONENT24:g===1015?G=i.DEPTH_COMPONENT32F:g===1012&&(G=i.DEPTH_COMPONENT16),G}function B(b,g){return p(b)===!0||b.isFramebufferTexture&&b.minFilter!==1003&&b.minFilter!==1006?Math.log2(Math.max(g.width,g.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?g.mipmaps.length:1}function w(b){const g=b.target;g.removeEventListener("dispose",w),L(g),g.isVideoTexture&&f.delete(g)}function C(b){const g=b.target;g.removeEventListener("dispose",C),v(g)}function L(b){const g=n.get(b);if(g.__webglInit===void 0)return;const G=b.source,ee=d.get(G);if(ee){const ne=ee[g.__cacheKey];ne.usedTimes--,ne.usedTimes===0&&T(b),Object.keys(ee).length===0&&d.delete(G)}n.remove(b)}function T(b){const g=n.get(b);i.deleteTexture(g.__webglTexture);const G=b.source,ee=d.get(G);delete ee[g.__cacheKey],a.memory.textures--}function v(b){const g=n.get(b);if(b.depthTexture&&(b.depthTexture.dispose(),n.remove(b.depthTexture)),b.isWebGLCubeRenderTarget)for(let ee=0;ee<6;ee++){if(Array.isArray(g.__webglFramebuffer[ee]))for(let ne=0;ne<g.__webglFramebuffer[ee].length;ne++)i.deleteFramebuffer(g.__webglFramebuffer[ee][ne]);else i.deleteFramebuffer(g.__webglFramebuffer[ee]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[ee])}else{if(Array.isArray(g.__webglFramebuffer))for(let ee=0;ee<g.__webglFramebuffer.length;ee++)i.deleteFramebuffer(g.__webglFramebuffer[ee]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let ee=0;ee<g.__webglColorRenderbuffer.length;ee++)g.__webglColorRenderbuffer[ee]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[ee]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const G=b.textures;for(let ee=0,ne=G.length;ee<ne;ee++){const j=n.get(G[ee]);j.__webglTexture&&(i.deleteTexture(j.__webglTexture),a.memory.textures--),n.remove(G[ee])}n.remove(b)}let P=0;function H(){P=0}function V(){const b=P;return b>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+r.maxTextures),P+=1,b}function Y(b){const g=[];return g.push(b.wrapS),g.push(b.wrapT),g.push(b.wrapR||0),g.push(b.magFilter),g.push(b.minFilter),g.push(b.anisotropy),g.push(b.internalFormat),g.push(b.format),g.push(b.type),g.push(b.generateMipmaps),g.push(b.premultiplyAlpha),g.push(b.flipY),g.push(b.unpackAlignment),g.push(b.colorSpace),g.join()}function te(b,g){const G=n.get(b);if(b.isVideoTexture&&be(b),b.isRenderTargetTexture===!1&&b.version>0&&G.__version!==b.version){const ee=b.image;if(ee===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ee.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{J(G,b,g);return}}t.bindTexture(i.TEXTURE_2D,G.__webglTexture,i.TEXTURE0+g)}function Z(b,g){const G=n.get(b);if(b.version>0&&G.__version!==b.version){J(G,b,g);return}t.bindTexture(i.TEXTURE_2D_ARRAY,G.__webglTexture,i.TEXTURE0+g)}function le(b,g){const G=n.get(b);if(b.version>0&&G.__version!==b.version){J(G,b,g);return}t.bindTexture(i.TEXTURE_3D,G.__webglTexture,i.TEXTURE0+g)}function $(b,g){const G=n.get(b);if(b.version>0&&G.__version!==b.version){oe(G,b,g);return}t.bindTexture(i.TEXTURE_CUBE_MAP,G.__webglTexture,i.TEXTURE0+g)}const de={1e3:i.REPEAT,1001:i.CLAMP_TO_EDGE,1002:i.MIRRORED_REPEAT},pe={1003:i.NEAREST,1004:i.NEAREST_MIPMAP_NEAREST,1005:i.NEAREST_MIPMAP_LINEAR,1006:i.LINEAR,1007:i.LINEAR_MIPMAP_NEAREST,1008:i.LINEAR_MIPMAP_LINEAR},_e={512:i.NEVER,519:i.ALWAYS,513:i.LESS,515:i.LEQUAL,514:i.EQUAL,518:i.GEQUAL,516:i.GREATER,517:i.NOTEQUAL};function Ie(b,g){if(g.type===1015&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===1006||g.magFilter===1007||g.magFilter===1005||g.magFilter===1008||g.minFilter===1006||g.minFilter===1007||g.minFilter===1005||g.minFilter===1008)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(b,i.TEXTURE_WRAP_S,de[g.wrapS]),i.texParameteri(b,i.TEXTURE_WRAP_T,de[g.wrapT]),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,de[g.wrapR]),i.texParameteri(b,i.TEXTURE_MAG_FILTER,pe[g.magFilter]),i.texParameteri(b,i.TEXTURE_MIN_FILTER,pe[g.minFilter]),g.compareFunction&&(i.texParameteri(b,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(b,i.TEXTURE_COMPARE_FUNC,_e[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===1003||g.minFilter!==1005&&g.minFilter!==1008||g.type===1015&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){const G=e.get("EXT_texture_filter_anisotropic");i.texParameterf(b,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,r.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy}}}function Ce(b,g){let G=!1;b.__webglInit===void 0&&(b.__webglInit=!0,g.addEventListener("dispose",w));const ee=g.source;let ne=d.get(ee);ne===void 0&&(ne={},d.set(ee,ne));const j=Y(g);if(j!==b.__cacheKey){ne[j]===void 0&&(ne[j]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,G=!0),ne[j].usedTimes++;const Me=ne[b.__cacheKey];Me!==void 0&&(ne[b.__cacheKey].usedTimes--,Me.usedTimes===0&&T(g)),b.__cacheKey=j,b.__webglTexture=ne[j].texture}return G}function J(b,g,G){let ee=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(ee=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(ee=i.TEXTURE_3D);const ne=Ce(b,g),j=g.source;t.bindTexture(ee,b.__webglTexture,i.TEXTURE0+G);const Me=n.get(j);if(j.version!==Me.__version||ne===!0){t.activeTexture(i.TEXTURE0+G);const he=Xe.getPrimaries(Xe.workingColorSpace),ge=g.colorSpace===""?null:Xe.getPrimaries(g.colorSpace),We=g.colorSpace===""||he===ge?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,We);let ie=S(g.image,!1,r.maxTextureSize);ie=$e(g,ie);const ve=s.convert(g.format,g.colorSpace),A=s.convert(g.type);let D=E(g.internalFormat,ve,A,g.colorSpace,g.isVideoTexture);Ie(ee,g);let O;const q=g.mipmaps,Q=g.isVideoTexture!==!0,re=Me.__version===void 0||ne===!0,R=j.dataReady,K=B(g,ie);if(g.isDepthTexture)D=M(g.format===1027,g.type),re&&(Q?t.texStorage2D(i.TEXTURE_2D,1,D,ie.width,ie.height):t.texImage2D(i.TEXTURE_2D,0,D,ie.width,ie.height,0,ve,A,null));else if(g.isDataTexture)if(q.length>0){Q&&re&&t.texStorage2D(i.TEXTURE_2D,K,D,q[0].width,q[0].height);for(let z=0,X=q.length;z<X;z++)O=q[z],Q?R&&t.texSubImage2D(i.TEXTURE_2D,z,0,0,O.width,O.height,ve,A,O.data):t.texImage2D(i.TEXTURE_2D,z,D,O.width,O.height,0,ve,A,O.data);g.generateMipmaps=!1}else Q?(re&&t.texStorage2D(i.TEXTURE_2D,K,D,ie.width,ie.height),R&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ie.width,ie.height,ve,A,ie.data)):t.texImage2D(i.TEXTURE_2D,0,D,ie.width,ie.height,0,ve,A,ie.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){Q&&re&&t.texStorage3D(i.TEXTURE_2D_ARRAY,K,D,q[0].width,q[0].height,ie.depth);for(let z=0,X=q.length;z<X;z++)if(O=q[z],g.format!==1023)if(ve!==null)if(Q){if(R)if(g.layerUpdates.size>0){const ae=zs(O.width,O.height,g.format,g.type);for(const se of g.layerUpdates){const Se=O.data.subarray(se*ae/O.data.BYTES_PER_ELEMENT,(se+1)*ae/O.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,z,0,0,se,O.width,O.height,1,ve,Se)}g.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,z,0,0,0,O.width,O.height,ie.depth,ve,O.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,z,D,O.width,O.height,ie.depth,0,O.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Q?R&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,z,0,0,0,O.width,O.height,ie.depth,ve,A,O.data):t.texImage3D(i.TEXTURE_2D_ARRAY,z,D,O.width,O.height,ie.depth,0,ve,A,O.data)}else{Q&&re&&t.texStorage2D(i.TEXTURE_2D,K,D,q[0].width,q[0].height);for(let z=0,X=q.length;z<X;z++)O=q[z],g.format!==1023?ve!==null?Q?R&&t.compressedTexSubImage2D(i.TEXTURE_2D,z,0,0,O.width,O.height,ve,O.data):t.compressedTexImage2D(i.TEXTURE_2D,z,D,O.width,O.height,0,O.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Q?R&&t.texSubImage2D(i.TEXTURE_2D,z,0,0,O.width,O.height,ve,A,O.data):t.texImage2D(i.TEXTURE_2D,z,D,O.width,O.height,0,ve,A,O.data)}else if(g.isDataArrayTexture)if(Q){if(re&&t.texStorage3D(i.TEXTURE_2D_ARRAY,K,D,ie.width,ie.height,ie.depth),R)if(g.layerUpdates.size>0){const z=zs(ie.width,ie.height,g.format,g.type);for(const X of g.layerUpdates){const ae=ie.data.subarray(X*z/ie.data.BYTES_PER_ELEMENT,(X+1)*z/ie.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,X,ie.width,ie.height,1,ve,A,ae)}g.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ie.width,ie.height,ie.depth,ve,A,ie.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,D,ie.width,ie.height,ie.depth,0,ve,A,ie.data);else if(g.isData3DTexture)Q?(re&&t.texStorage3D(i.TEXTURE_3D,K,D,ie.width,ie.height,ie.depth),R&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ie.width,ie.height,ie.depth,ve,A,ie.data)):t.texImage3D(i.TEXTURE_3D,0,D,ie.width,ie.height,ie.depth,0,ve,A,ie.data);else if(g.isFramebufferTexture){if(re)if(Q)t.texStorage2D(i.TEXTURE_2D,K,D,ie.width,ie.height);else{let z=ie.width,X=ie.height;for(let ae=0;ae<K;ae++)t.texImage2D(i.TEXTURE_2D,ae,D,z,X,0,ve,A,null),z>>=1,X>>=1}}else if(q.length>0){if(Q&&re){const z=Re(q[0]);t.texStorage2D(i.TEXTURE_2D,K,D,z.width,z.height)}for(let z=0,X=q.length;z<X;z++)O=q[z],Q?R&&t.texSubImage2D(i.TEXTURE_2D,z,0,0,ve,A,O):t.texImage2D(i.TEXTURE_2D,z,D,ve,A,O);g.generateMipmaps=!1}else if(Q){if(re){const z=Re(ie);t.texStorage2D(i.TEXTURE_2D,K,D,z.width,z.height)}R&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ve,A,ie)}else t.texImage2D(i.TEXTURE_2D,0,D,ve,A,ie);p(g)&&u(ee),Me.__version=j.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function oe(b,g,G){if(g.image.length!==6)return;const ee=Ce(b,g),ne=g.source;t.bindTexture(i.TEXTURE_CUBE_MAP,b.__webglTexture,i.TEXTURE0+G);const j=n.get(ne);if(ne.version!==j.__version||ee===!0){t.activeTexture(i.TEXTURE0+G);const Me=Xe.getPrimaries(Xe.workingColorSpace),he=g.colorSpace===""?null:Xe.getPrimaries(g.colorSpace),ge=g.colorSpace===""||Me===he?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ge);const We=g.isCompressedTexture||g.image[0].isCompressedTexture,ie=g.image[0]&&g.image[0].isDataTexture,ve=[];for(let X=0;X<6;X++)!We&&!ie?ve[X]=S(g.image[X],!0,r.maxCubemapSize):ve[X]=ie?g.image[X].image:g.image[X],ve[X]=$e(g,ve[X]);const A=ve[0],D=s.convert(g.format,g.colorSpace),O=s.convert(g.type),q=E(g.internalFormat,D,O,g.colorSpace),Q=g.isVideoTexture!==!0,re=j.__version===void 0||ee===!0,R=ne.dataReady;let K=B(g,A);Ie(i.TEXTURE_CUBE_MAP,g);let z;if(We){Q&&re&&t.texStorage2D(i.TEXTURE_CUBE_MAP,K,q,A.width,A.height);for(let X=0;X<6;X++){z=ve[X].mipmaps;for(let ae=0;ae<z.length;ae++){const se=z[ae];g.format!==1023?D!==null?Q?R&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ae,0,0,se.width,se.height,D,se.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ae,q,se.width,se.height,0,se.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Q?R&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ae,0,0,se.width,se.height,D,O,se.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ae,q,se.width,se.height,0,D,O,se.data)}}}else{if(z=g.mipmaps,Q&&re){z.length>0&&K++;const X=Re(ve[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,K,q,X.width,X.height)}for(let X=0;X<6;X++)if(ie){Q?R&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,0,0,ve[X].width,ve[X].height,D,O,ve[X].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,q,ve[X].width,ve[X].height,0,D,O,ve[X].data);for(let ae=0;ae<z.length;ae++){const Se=z[ae].image[X].image;Q?R&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ae+1,0,0,Se.width,Se.height,D,O,Se.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ae+1,q,Se.width,Se.height,0,D,O,Se.data)}}else{Q?R&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,0,0,D,O,ve[X]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,q,D,O,ve[X]);for(let ae=0;ae<z.length;ae++){const se=z[ae];Q?R&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ae+1,0,0,D,O,se.image[X]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ae+1,q,D,O,se.image[X])}}}p(g)&&u(i.TEXTURE_CUBE_MAP),j.__version=ne.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function xe(b,g,G,ee,ne,j){const Me=s.convert(G.format,G.colorSpace),he=s.convert(G.type),ge=E(G.internalFormat,Me,he,G.colorSpace),We=n.get(g),ie=n.get(G);if(ie.__renderTarget=g,!We.__hasExternalTextures){const ve=Math.max(1,g.width>>j),A=Math.max(1,g.height>>j);ne===i.TEXTURE_3D||ne===i.TEXTURE_2D_ARRAY?t.texImage3D(ne,j,ge,ve,A,g.depth,0,Me,he,null):t.texImage2D(ne,j,ge,ve,A,0,Me,he,null)}t.bindFramebuffer(i.FRAMEBUFFER,b),He(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ee,ne,ie.__webglTexture,0,Fe(g)):(ne===i.TEXTURE_2D||ne>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ne<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,ee,ne,ie.__webglTexture,j),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ue(b,g,G){if(i.bindRenderbuffer(i.RENDERBUFFER,b),g.depthBuffer){const ee=g.depthTexture,ne=ee&&ee.isDepthTexture?ee.type:null,j=M(g.stencilBuffer,ne),Me=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,he=Fe(g);He(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,he,j,g.width,g.height):G?i.renderbufferStorageMultisample(i.RENDERBUFFER,he,j,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,j,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Me,i.RENDERBUFFER,b)}else{const ee=g.textures;for(let ne=0;ne<ee.length;ne++){const j=ee[ne],Me=s.convert(j.format,j.colorSpace),he=s.convert(j.type),ge=E(j.internalFormat,Me,he,j.colorSpace),We=Fe(g);G&&He(g)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,We,ge,g.width,g.height):He(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,We,ge,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,ge,g.width,g.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function we(b,g){if(g&&g.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,b),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const ee=n.get(g.depthTexture);ee.__renderTarget=g,(!ee.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),te(g.depthTexture,0);const ne=ee.__webglTexture,j=Fe(g);if(g.depthTexture.format===1026)He(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ne,0,j):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ne,0);else if(g.depthTexture.format===1027)He(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ne,0,j):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ne,0);else throw new Error("Unknown depthTexture format")}function De(b){const g=n.get(b),G=b.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==b.depthTexture){const ee=b.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),ee){const ne=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,ee.removeEventListener("dispose",ne)};ee.addEventListener("dispose",ne),g.__depthDisposeCallback=ne}g.__boundDepthTexture=ee}if(b.depthTexture&&!g.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");we(g.__webglFramebuffer,b)}else if(G){g.__webglDepthbuffer=[];for(let ee=0;ee<6;ee++)if(t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[ee]),g.__webglDepthbuffer[ee]===void 0)g.__webglDepthbuffer[ee]=i.createRenderbuffer(),ue(g.__webglDepthbuffer[ee],b,!1);else{const ne=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,j=g.__webglDepthbuffer[ee];i.bindRenderbuffer(i.RENDERBUFFER,j),i.framebufferRenderbuffer(i.FRAMEBUFFER,ne,i.RENDERBUFFER,j)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),ue(g.__webglDepthbuffer,b,!1);else{const ee=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ne=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ne),i.framebufferRenderbuffer(i.FRAMEBUFFER,ee,i.RENDERBUFFER,ne)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Le(b,g,G){const ee=n.get(b);g!==void 0&&xe(ee.__webglFramebuffer,b,b.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),G!==void 0&&De(b)}function Ye(b){const g=b.texture,G=n.get(b),ee=n.get(g);b.addEventListener("dispose",C);const ne=b.textures,j=b.isWebGLCubeRenderTarget===!0,Me=ne.length>1;if(Me||(ee.__webglTexture===void 0&&(ee.__webglTexture=i.createTexture()),ee.__version=g.version,a.memory.textures++),j){G.__webglFramebuffer=[];for(let he=0;he<6;he++)if(g.mipmaps&&g.mipmaps.length>0){G.__webglFramebuffer[he]=[];for(let ge=0;ge<g.mipmaps.length;ge++)G.__webglFramebuffer[he][ge]=i.createFramebuffer()}else G.__webglFramebuffer[he]=i.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){G.__webglFramebuffer=[];for(let he=0;he<g.mipmaps.length;he++)G.__webglFramebuffer[he]=i.createFramebuffer()}else G.__webglFramebuffer=i.createFramebuffer();if(Me)for(let he=0,ge=ne.length;he<ge;he++){const We=n.get(ne[he]);We.__webglTexture===void 0&&(We.__webglTexture=i.createTexture(),a.memory.textures++)}if(b.samples>0&&He(b)===!1){G.__webglMultisampledFramebuffer=i.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let he=0;he<ne.length;he++){const ge=ne[he];G.__webglColorRenderbuffer[he]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,G.__webglColorRenderbuffer[he]);const We=s.convert(ge.format,ge.colorSpace),ie=s.convert(ge.type),ve=E(ge.internalFormat,We,ie,ge.colorSpace,b.isXRRenderTarget===!0),A=Fe(b);i.renderbufferStorageMultisample(i.RENDERBUFFER,A,ve,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.RENDERBUFFER,G.__webglColorRenderbuffer[he])}i.bindRenderbuffer(i.RENDERBUFFER,null),b.depthBuffer&&(G.__webglDepthRenderbuffer=i.createRenderbuffer(),ue(G.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(j){t.bindTexture(i.TEXTURE_CUBE_MAP,ee.__webglTexture),Ie(i.TEXTURE_CUBE_MAP,g);for(let he=0;he<6;he++)if(g.mipmaps&&g.mipmaps.length>0)for(let ge=0;ge<g.mipmaps.length;ge++)xe(G.__webglFramebuffer[he][ge],b,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+he,ge);else xe(G.__webglFramebuffer[he],b,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+he,0);p(g)&&u(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Me){for(let he=0,ge=ne.length;he<ge;he++){const We=ne[he],ie=n.get(We);t.bindTexture(i.TEXTURE_2D,ie.__webglTexture),Ie(i.TEXTURE_2D,We),xe(G.__webglFramebuffer,b,We,i.COLOR_ATTACHMENT0+he,i.TEXTURE_2D,0),p(We)&&u(i.TEXTURE_2D)}t.unbindTexture()}else{let he=i.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(he=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(he,ee.__webglTexture),Ie(he,g),g.mipmaps&&g.mipmaps.length>0)for(let ge=0;ge<g.mipmaps.length;ge++)xe(G.__webglFramebuffer[ge],b,g,i.COLOR_ATTACHMENT0,he,ge);else xe(G.__webglFramebuffer,b,g,i.COLOR_ATTACHMENT0,he,0);p(g)&&u(he),t.unbindTexture()}b.depthBuffer&&De(b)}function ke(b){const g=b.textures;for(let G=0,ee=g.length;G<ee;G++){const ne=g[G];if(p(ne)){const j=y(b),Me=n.get(ne).__webglTexture;t.bindTexture(j,Me),u(j),t.unbindTexture()}}}const st=[],I=[];function yt(b){if(b.samples>0){if(He(b)===!1){const g=b.textures,G=b.width,ee=b.height;let ne=i.COLOR_BUFFER_BIT;const j=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Me=n.get(b),he=g.length>1;if(he)for(let ge=0;ge<g.length;ge++)t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Me.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Me.__webglFramebuffer);for(let ge=0;ge<g.length;ge++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(ne|=i.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(ne|=i.STENCIL_BUFFER_BIT)),he){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Me.__webglColorRenderbuffer[ge]);const We=n.get(g[ge]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,We,0)}i.blitFramebuffer(0,0,G,ee,0,0,G,ee,ne,i.NEAREST),l===!0&&(st.length=0,I.length=0,st.push(i.COLOR_ATTACHMENT0+ge),b.depthBuffer&&b.resolveDepthBuffer===!1&&(st.push(j),I.push(j),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,I)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,st))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),he)for(let ge=0;ge<g.length;ge++){t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.RENDERBUFFER,Me.__webglColorRenderbuffer[ge]);const We=n.get(g[ge]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.TEXTURE_2D,We,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Me.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.resolveDepthBuffer===!1&&l){const g=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g])}}}function Fe(b){return Math.min(r.maxSamples,b.samples)}function He(b){const g=n.get(b);return b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function be(b){const g=a.render.frame;f.get(b)!==g&&(f.set(b,g),b.update())}function $e(b,g){const G=b.colorSpace,ee=b.format,ne=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||G!==bn&&G!==""&&(Xe.getTransfer(G)===Je?(ee!==1023||ne!==1009)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",G)),g}function Re(b){return typeof HTMLImageElement!="undefined"&&b instanceof HTMLImageElement?(h.width=b.naturalWidth||b.width,h.height=b.naturalHeight||b.height):typeof VideoFrame!="undefined"&&b instanceof VideoFrame?(h.width=b.displayWidth,h.height=b.displayHeight):(h.width=b.width,h.height=b.height),h}this.allocateTextureUnit=V,this.resetTextureUnits=H,this.setTexture2D=te,this.setTexture2DArray=Z,this.setTexture3D=le,this.setTextureCube=$,this.rebindTextures=Le,this.setupRenderTarget=Ye,this.updateRenderTargetMipmap=ke,this.updateMultisampleRenderTarget=yt,this.setupDepthRenderbuffer=De,this.setupFrameBufferTexture=xe,this.useMultisampledRTT=He}function Au(i,e){function t(n,r=""){let s;const a=Xe.getTransfer(r);if(n===1009)return i.UNSIGNED_BYTE;if(n===1017)return i.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return i.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===1010)return i.BYTE;if(n===1011)return i.SHORT;if(n===1012)return i.UNSIGNED_SHORT;if(n===1013)return i.INT;if(n===1014)return i.UNSIGNED_INT;if(n===1015)return i.FLOAT;if(n===1016)return i.HALF_FLOAT;if(n===1021)return i.ALPHA;if(n===1022)return i.RGB;if(n===1023)return i.RGBA;if(n===1024)return i.LUMINANCE;if(n===1025)return i.LUMINANCE_ALPHA;if(n===1026)return i.DEPTH_COMPONENT;if(n===1027)return i.DEPTH_STENCIL;if(n===1028)return i.RED;if(n===1029)return i.RED_INTEGER;if(n===1030)return i.RG;if(n===1031)return i.RG_INTEGER;if(n===1033)return i.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779)if(a===Je)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===33776)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===33776)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===35840||n===35841||n===35842||n===35843)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===35840)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===36196||n===37492||n===37496)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===36196||n===37492)return a===Je?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===37496)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===37808)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===36492||n===36494||n===36495)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===36492)return a===Je?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===36283||n===36284||n===36285||n===36286)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===36492)return s.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===1020?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}class Ru extends Ct{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Gt extends dt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const wu={type:"move"};class Sr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Gt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Gt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Gt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){a=!0;for(const S of e.hand.values()){const p=t.getJointPose(S,n),u=this._getHandJoint(h,S);p!==null&&(u.matrix.fromArray(p.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=p.radius),u.visible=p!==null}const f=h.joints["index-finger-tip"],c=h.joints["thumb-tip"],d=f.position.distanceTo(c.position),m=.02,_=.005;h.inputState.pinching&&d>m+_?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&d<=m-_&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(wu)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Gt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const Cu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Pu=`
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

}`;class Du{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){const r=new xt,s=e.properties.get(r);s.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new vt({vertexShader:Cu,fragmentShader:Pu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new et(new cn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Lu extends An{constructor(e,t){super();const n=this;let r=null,s=1,a=null,o="local-floor",l=1,h=null,f=null,c=null,d=null,m=null,_=null;const S=new Du,p=t.getContextAttributes();let u=null,y=null;const E=[],M=[],B=new Pe;let w=null;const C=new Ct;C.viewport=new Qe;const L=new Ct;L.viewport=new Qe;const T=[C,L],v=new Ru;let P=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let oe=E[J];return oe===void 0&&(oe=new Sr,E[J]=oe),oe.getTargetRaySpace()},this.getControllerGrip=function(J){let oe=E[J];return oe===void 0&&(oe=new Sr,E[J]=oe),oe.getGripSpace()},this.getHand=function(J){let oe=E[J];return oe===void 0&&(oe=new Sr,E[J]=oe),oe.getHandSpace()};function V(J){const oe=M.indexOf(J.inputSource);if(oe===-1)return;const xe=E[oe];xe!==void 0&&(xe.update(J.inputSource,J.frame,h||a),xe.dispatchEvent({type:J.type,data:J.inputSource}))}function Y(){r.removeEventListener("select",V),r.removeEventListener("selectstart",V),r.removeEventListener("selectend",V),r.removeEventListener("squeeze",V),r.removeEventListener("squeezestart",V),r.removeEventListener("squeezeend",V),r.removeEventListener("end",Y),r.removeEventListener("inputsourceschange",te);for(let J=0;J<E.length;J++){const oe=M[J];oe!==null&&(M[J]=null,E[J].disconnect(oe))}P=null,H=null,S.reset(),e.setRenderTarget(u),m=null,d=null,c=null,r=null,y=null,Ce.stop(),n.isPresenting=!1,e.setPixelRatio(w),e.setSize(B.width,B.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){s=J,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){o=J,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(J){h=J},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return c},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(J){if(r=J,r!==null){if(u=e.getRenderTarget(),r.addEventListener("select",V),r.addEventListener("selectstart",V),r.addEventListener("selectend",V),r.addEventListener("squeeze",V),r.addEventListener("squeezestart",V),r.addEventListener("squeezeend",V),r.addEventListener("end",Y),r.addEventListener("inputsourceschange",te),p.xrCompatible!==!0&&await t.makeXRCompatible(),w=e.getPixelRatio(),e.getSize(B),r.renderState.layers===void 0){const oe={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,t,oe),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),y=new Dt(m.framebufferWidth,m.framebufferHeight,{format:1023,type:1009,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let oe=null,xe=null,ue=null;p.depth&&(ue=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,oe=p.stencil?1027:1026,xe=p.stencil?1020:1014);const we={colorFormat:t.RGBA8,depthFormat:ue,scaleFactor:s};c=new XRWebGLBinding(r,t),d=c.createProjectionLayer(we),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Dt(d.textureWidth,d.textureHeight,{format:1023,type:1009,depthTexture:new gs(d.textureWidth,d.textureHeight,xe,void 0,void 0,void 0,void 0,void 0,void 0,oe),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),h=null,a=await r.requestReferenceSpace(o),Ce.setContext(r),Ce.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return S.getDepthTexture()};function te(J){for(let oe=0;oe<J.removed.length;oe++){const xe=J.removed[oe],ue=M.indexOf(xe);ue>=0&&(M[ue]=null,E[ue].disconnect(xe))}for(let oe=0;oe<J.added.length;oe++){const xe=J.added[oe];let ue=M.indexOf(xe);if(ue===-1){for(let De=0;De<E.length;De++)if(De>=M.length){M.push(xe),ue=De;break}else if(M[De]===null){M[De]=xe,ue=De;break}if(ue===-1)break}const we=E[ue];we&&we.connect(xe)}}const Z=new U,le=new U;function $(J,oe,xe){Z.setFromMatrixPosition(oe.matrixWorld),le.setFromMatrixPosition(xe.matrixWorld);const ue=Z.distanceTo(le),we=oe.projectionMatrix.elements,De=xe.projectionMatrix.elements,Le=we[14]/(we[10]-1),Ye=we[14]/(we[10]+1),ke=(we[9]+1)/we[5],st=(we[9]-1)/we[5],I=(we[8]-1)/we[0],yt=(De[8]+1)/De[0],Fe=Le*I,He=Le*yt,be=ue/(-I+yt),$e=be*-I;if(oe.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX($e),J.translateZ(be),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),we[10]===-1)J.projectionMatrix.copy(oe.projectionMatrix),J.projectionMatrixInverse.copy(oe.projectionMatrixInverse);else{const Re=Le+be,b=Ye+be,g=Fe-$e,G=He+(ue-$e),ee=ke*Ye/b*Re,ne=st*Ye/b*Re;J.projectionMatrix.makePerspective(g,G,ee,ne,Re,b),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function de(J,oe){oe===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(oe.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(r===null)return;let oe=J.near,xe=J.far;S.texture!==null&&(S.depthNear>0&&(oe=S.depthNear),S.depthFar>0&&(xe=S.depthFar)),v.near=L.near=C.near=oe,v.far=L.far=C.far=xe,(P!==v.near||H!==v.far)&&(r.updateRenderState({depthNear:v.near,depthFar:v.far}),P=v.near,H=v.far),C.layers.mask=J.layers.mask|2,L.layers.mask=J.layers.mask|4,v.layers.mask=C.layers.mask|L.layers.mask;const ue=J.parent,we=v.cameras;de(v,ue);for(let De=0;De<we.length;De++)de(we[De],ue);we.length===2?$(v,C,L):v.projectionMatrix.copy(C.projectionMatrix),pe(J,v,ue)};function pe(J,oe,xe){xe===null?J.matrix.copy(oe.matrixWorld):(J.matrix.copy(xe.matrixWorld),J.matrix.invert(),J.matrix.multiply(oe.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(oe.projectionMatrix),J.projectionMatrixInverse.copy(oe.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=Vi*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function(J){l=J,d!==null&&(d.fixedFoveation=J),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=J)},this.hasDepthSensing=function(){return S.texture!==null},this.getDepthSensingMesh=function(){return S.getMesh(v)};let _e=null;function Ie(J,oe){if(f=oe.getViewerPose(h||a),_=oe,f!==null){const xe=f.views;m!==null&&(e.setRenderTargetFramebuffer(y,m.framebuffer),e.setRenderTarget(y));let ue=!1;xe.length!==v.cameras.length&&(v.cameras.length=0,ue=!0);for(let De=0;De<xe.length;De++){const Le=xe[De];let Ye=null;if(m!==null)Ye=m.getViewport(Le);else{const st=c.getViewSubImage(d,Le);Ye=st.viewport,De===0&&(e.setRenderTargetTextures(y,st.colorTexture,d.ignoreDepthValues?void 0:st.depthStencilTexture),e.setRenderTarget(y))}let ke=T[De];ke===void 0&&(ke=new Ct,ke.layers.enable(De),ke.viewport=new Qe,T[De]=ke),ke.matrix.fromArray(Le.transform.matrix),ke.matrix.decompose(ke.position,ke.quaternion,ke.scale),ke.projectionMatrix.fromArray(Le.projectionMatrix),ke.projectionMatrixInverse.copy(ke.projectionMatrix).invert(),ke.viewport.set(Ye.x,Ye.y,Ye.width,Ye.height),De===0&&(v.matrix.copy(ke.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),ue===!0&&v.cameras.push(ke)}const we=r.enabledFeatures;if(we&&we.includes("depth-sensing")){const De=c.getDepthInformation(xe[0]);De&&De.isValid&&De.texture&&S.init(e,De,r.renderState)}}for(let xe=0;xe<E.length;xe++){const ue=M[xe],we=E[xe];ue!==null&&we!==void 0&&we.update(ue,oe,h||a)}_e&&_e(J,oe),oe.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:oe}),_=null}const Ce=new us;Ce.setAnimationLoop(Ie),this.setAnimationLoop=function(J){_e=J},this.dispose=function(){}}}const Sn=new kt,Uu=new rt;function Iu(i,e){function t(p,u){p.matrixAutoUpdate===!0&&p.updateMatrix(),u.value.copy(p.matrix)}function n(p,u){u.color.getRGB(p.fogColor.value,ss(i)),u.isFog?(p.fogNear.value=u.near,p.fogFar.value=u.far):u.isFogExp2&&(p.fogDensity.value=u.density)}function r(p,u,y,E,M){u.isMeshBasicMaterial||u.isMeshLambertMaterial?s(p,u):u.isMeshToonMaterial?(s(p,u),c(p,u)):u.isMeshPhongMaterial?(s(p,u),f(p,u)):u.isMeshStandardMaterial?(s(p,u),d(p,u),u.isMeshPhysicalMaterial&&m(p,u,M)):u.isMeshMatcapMaterial?(s(p,u),_(p,u)):u.isMeshDepthMaterial?s(p,u):u.isMeshDistanceMaterial?(s(p,u),S(p,u)):u.isMeshNormalMaterial?s(p,u):u.isLineBasicMaterial?(a(p,u),u.isLineDashedMaterial&&o(p,u)):u.isPointsMaterial?l(p,u,y,E):u.isSpriteMaterial?h(p,u):u.isShadowMaterial?(p.color.value.copy(u.color),p.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function s(p,u){p.opacity.value=u.opacity,u.color&&p.diffuse.value.copy(u.color),u.emissive&&p.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(p.map.value=u.map,t(u.map,p.mapTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,t(u.alphaMap,p.alphaMapTransform)),u.bumpMap&&(p.bumpMap.value=u.bumpMap,t(u.bumpMap,p.bumpMapTransform),p.bumpScale.value=u.bumpScale,u.side===1&&(p.bumpScale.value*=-1)),u.normalMap&&(p.normalMap.value=u.normalMap,t(u.normalMap,p.normalMapTransform),p.normalScale.value.copy(u.normalScale),u.side===1&&p.normalScale.value.negate()),u.displacementMap&&(p.displacementMap.value=u.displacementMap,t(u.displacementMap,p.displacementMapTransform),p.displacementScale.value=u.displacementScale,p.displacementBias.value=u.displacementBias),u.emissiveMap&&(p.emissiveMap.value=u.emissiveMap,t(u.emissiveMap,p.emissiveMapTransform)),u.specularMap&&(p.specularMap.value=u.specularMap,t(u.specularMap,p.specularMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest);const y=e.get(u),E=y.envMap,M=y.envMapRotation;E&&(p.envMap.value=E,Sn.copy(M),Sn.x*=-1,Sn.y*=-1,Sn.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(Sn.y*=-1,Sn.z*=-1),p.envMapRotation.value.setFromMatrix4(Uu.makeRotationFromEuler(Sn)),p.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=u.reflectivity,p.ior.value=u.ior,p.refractionRatio.value=u.refractionRatio),u.lightMap&&(p.lightMap.value=u.lightMap,p.lightMapIntensity.value=u.lightMapIntensity,t(u.lightMap,p.lightMapTransform)),u.aoMap&&(p.aoMap.value=u.aoMap,p.aoMapIntensity.value=u.aoMapIntensity,t(u.aoMap,p.aoMapTransform))}function a(p,u){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,u.map&&(p.map.value=u.map,t(u.map,p.mapTransform))}function o(p,u){p.dashSize.value=u.dashSize,p.totalSize.value=u.dashSize+u.gapSize,p.scale.value=u.scale}function l(p,u,y,E){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,p.size.value=u.size*y,p.scale.value=E*.5,u.map&&(p.map.value=u.map,t(u.map,p.uvTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,t(u.alphaMap,p.alphaMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest)}function h(p,u){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,p.rotation.value=u.rotation,u.map&&(p.map.value=u.map,t(u.map,p.mapTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,t(u.alphaMap,p.alphaMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest)}function f(p,u){p.specular.value.copy(u.specular),p.shininess.value=Math.max(u.shininess,1e-4)}function c(p,u){u.gradientMap&&(p.gradientMap.value=u.gradientMap)}function d(p,u){p.metalness.value=u.metalness,u.metalnessMap&&(p.metalnessMap.value=u.metalnessMap,t(u.metalnessMap,p.metalnessMapTransform)),p.roughness.value=u.roughness,u.roughnessMap&&(p.roughnessMap.value=u.roughnessMap,t(u.roughnessMap,p.roughnessMapTransform)),u.envMap&&(p.envMapIntensity.value=u.envMapIntensity)}function m(p,u,y){p.ior.value=u.ior,u.sheen>0&&(p.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),p.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(p.sheenColorMap.value=u.sheenColorMap,t(u.sheenColorMap,p.sheenColorMapTransform)),u.sheenRoughnessMap&&(p.sheenRoughnessMap.value=u.sheenRoughnessMap,t(u.sheenRoughnessMap,p.sheenRoughnessMapTransform))),u.clearcoat>0&&(p.clearcoat.value=u.clearcoat,p.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(p.clearcoatMap.value=u.clearcoatMap,t(u.clearcoatMap,p.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,t(u.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(p.clearcoatNormalMap.value=u.clearcoatNormalMap,t(u.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===1&&p.clearcoatNormalScale.value.negate())),u.dispersion>0&&(p.dispersion.value=u.dispersion),u.iridescence>0&&(p.iridescence.value=u.iridescence,p.iridescenceIOR.value=u.iridescenceIOR,p.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(p.iridescenceMap.value=u.iridescenceMap,t(u.iridescenceMap,p.iridescenceMapTransform)),u.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=u.iridescenceThicknessMap,t(u.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),u.transmission>0&&(p.transmission.value=u.transmission,p.transmissionSamplerMap.value=y.texture,p.transmissionSamplerSize.value.set(y.width,y.height),u.transmissionMap&&(p.transmissionMap.value=u.transmissionMap,t(u.transmissionMap,p.transmissionMapTransform)),p.thickness.value=u.thickness,u.thicknessMap&&(p.thicknessMap.value=u.thicknessMap,t(u.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=u.attenuationDistance,p.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(p.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(p.anisotropyMap.value=u.anisotropyMap,t(u.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=u.specularIntensity,p.specularColor.value.copy(u.specularColor),u.specularColorMap&&(p.specularColorMap.value=u.specularColorMap,t(u.specularColorMap,p.specularColorMapTransform)),u.specularIntensityMap&&(p.specularIntensityMap.value=u.specularIntensityMap,t(u.specularIntensityMap,p.specularIntensityMapTransform))}function _(p,u){u.matcap&&(p.matcap.value=u.matcap)}function S(p,u){const y=e.get(u).light;p.referencePosition.value.setFromMatrixPosition(y.matrixWorld),p.nearDistance.value=y.shadow.camera.near,p.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function Fu(i,e,t,n){let r={},s={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,E){const M=E.program;n.uniformBlockBinding(y,M)}function h(y,E){let M=r[y.id];M===void 0&&(_(y),M=f(y),r[y.id]=M,y.addEventListener("dispose",p));const B=E.program;n.updateUBOMapping(y,B);const w=e.render.frame;s[y.id]!==w&&(d(y),s[y.id]=w)}function f(y){const E=c();y.__bindingPointIndex=E;const M=i.createBuffer(),B=y.__size,w=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,M),i.bufferData(i.UNIFORM_BUFFER,B,w),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,E,M),M}function c(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){const E=r[y.id],M=y.uniforms,B=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,E);for(let w=0,C=M.length;w<C;w++){const L=Array.isArray(M[w])?M[w]:[M[w]];for(let T=0,v=L.length;T<v;T++){const P=L[T];if(m(P,w,T,B)===!0){const H=P.__offset,V=Array.isArray(P.value)?P.value:[P.value];let Y=0;for(let te=0;te<V.length;te++){const Z=V[te],le=S(Z);typeof Z=="number"||typeof Z=="boolean"?(P.__data[0]=Z,i.bufferSubData(i.UNIFORM_BUFFER,H+Y,P.__data)):Z.isMatrix3?(P.__data[0]=Z.elements[0],P.__data[1]=Z.elements[1],P.__data[2]=Z.elements[2],P.__data[3]=0,P.__data[4]=Z.elements[3],P.__data[5]=Z.elements[4],P.__data[6]=Z.elements[5],P.__data[7]=0,P.__data[8]=Z.elements[6],P.__data[9]=Z.elements[7],P.__data[10]=Z.elements[8],P.__data[11]=0):(Z.toArray(P.__data,Y),Y+=le.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,H,P.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(y,E,M,B){const w=y.value,C=E+"_"+M;if(B[C]===void 0)return typeof w=="number"||typeof w=="boolean"?B[C]=w:B[C]=w.clone(),!0;{const L=B[C];if(typeof w=="number"||typeof w=="boolean"){if(L!==w)return B[C]=w,!0}else if(L.equals(w)===!1)return L.copy(w),!0}return!1}function _(y){const E=y.uniforms;let M=0;const B=16;for(let C=0,L=E.length;C<L;C++){const T=Array.isArray(E[C])?E[C]:[E[C]];for(let v=0,P=T.length;v<P;v++){const H=T[v],V=Array.isArray(H.value)?H.value:[H.value];for(let Y=0,te=V.length;Y<te;Y++){const Z=V[Y],le=S(Z),$=M%B,de=$%le.boundary,pe=$+de;M+=de,pe!==0&&B-pe<le.storage&&(M+=B-pe),H.__data=new Float32Array(le.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=M,M+=le.storage}}}const w=M%B;return w>0&&(M+=B-w),y.__size=M,y.__cache={},this}function S(y){const E={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(E.boundary=4,E.storage=4):y.isVector2?(E.boundary=8,E.storage=8):y.isVector3||y.isColor?(E.boundary=16,E.storage=12):y.isVector4?(E.boundary=16,E.storage=16):y.isMatrix3?(E.boundary=48,E.storage=48):y.isMatrix4?(E.boundary=64,E.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),E}function p(y){const E=y.target;E.removeEventListener("dispose",p);const M=a.indexOf(E.__bindingPointIndex);a.splice(M,1),i.deleteBuffer(r[E.id]),delete r[E.id],delete s[E.id]}function u(){for(const y in r)i.deleteBuffer(r[y]);a=[],r={},s={}}return{bind:l,update:h,dispose:u}}class Nu{constructor(e={}){const{canvas:t=ia(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:c=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext!="undefined"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;const _=new Uint32Array(4),S=new Int32Array(4);let p=null,u=null;const y=[],E=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=At,this.toneMapping=0,this.toneMappingExposure=1;const M=this;let B=!1,w=0,C=0,L=null,T=-1,v=null;const P=new Qe,H=new Qe;let V=null;const Y=new ze(0);let te=0,Z=t.width,le=t.height,$=1,de=null,pe=null;const _e=new Qe(0,0,Z,le),Ie=new Qe(0,0,Z,le);let Ce=!1;const J=new ur;let oe=!1,xe=!1;const ue=new rt,we=new rt,De=new U,Le=new Qe,Ye={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ke=!1;function st(){return L===null?$:1}let I=n;function yt(x,F){return t.getContext(x,F)}try{const x={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:f,failIfMajorPerformanceCaveat:c};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r170"),t.addEventListener("webglcontextlost",X,!1),t.addEventListener("webglcontextrestored",ae,!1),t.addEventListener("webglcontextcreationerror",se,!1),I===null){const F="webgl2";if(I=yt(F,x),I===null)throw yt(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(x){throw console.error("THREE.WebGLRenderer: "+x.message),x}let Fe,He,be,$e,Re,b,g,G,ee,ne,j,Me,he,ge,We,ie,ve,A,D,O,q,Q,re,R;function K(){Fe=new Vl(I),Fe.init(),Q=new Au(I,Fe),He=new Fl(I,Fe,e,Q),be=new Tu(I,Fe),He.reverseDepthBuffer&&d&&be.buffers.depth.setReversed(!0),$e=new Wl(I),Re=new lu,b=new bu(I,Fe,be,Re,He,Q,$e),g=new Bl(M),G=new Gl(M),ee=new Pa(I),re=new Ul(I,ee),ne=new Hl(I,ee,$e,re),j=new ql(I,ne,ee,$e),D=new Xl(I,He,b),ie=new Nl(Re),Me=new ou(M,g,G,Fe,He,re,ie),he=new Iu(M,Re),ge=new uu,We=new _u(Fe),A=new Ll(M,g,G,be,j,m,l),ve=new Su(M,j,He),R=new Fu(I,$e,He,be),O=new Il(I,Fe,$e),q=new kl(I,Fe,$e),$e.programs=Me.programs,M.capabilities=He,M.extensions=Fe,M.properties=Re,M.renderLists=ge,M.shadowMap=ve,M.state=be,M.info=$e}K();const z=new Lu(M,I);this.xr=z,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const x=Fe.get("WEBGL_lose_context");x&&x.loseContext()},this.forceContextRestore=function(){const x=Fe.get("WEBGL_lose_context");x&&x.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(x){x!==void 0&&($=x,this.setSize(Z,le,!1))},this.getSize=function(x){return x.set(Z,le)},this.setSize=function(x,F,k=!0){if(z.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Z=x,le=F,t.width=Math.floor(x*$),t.height=Math.floor(F*$),k===!0&&(t.style.width=x+"px",t.style.height=F+"px"),this.setViewport(0,0,x,F)},this.getDrawingBufferSize=function(x){return x.set(Z*$,le*$).floor()},this.setDrawingBufferSize=function(x,F,k){Z=x,le=F,$=k,t.width=Math.floor(x*k),t.height=Math.floor(F*k),this.setViewport(0,0,x,F)},this.getCurrentViewport=function(x){return x.copy(P)},this.getViewport=function(x){return x.copy(_e)},this.setViewport=function(x,F,k,W){x.isVector4?_e.set(x.x,x.y,x.z,x.w):_e.set(x,F,k,W),be.viewport(P.copy(_e).multiplyScalar($).round())},this.getScissor=function(x){return x.copy(Ie)},this.setScissor=function(x,F,k,W){x.isVector4?Ie.set(x.x,x.y,x.z,x.w):Ie.set(x,F,k,W),be.scissor(H.copy(Ie).multiplyScalar($).round())},this.getScissorTest=function(){return Ce},this.setScissorTest=function(x){be.setScissorTest(Ce=x)},this.setOpaqueSort=function(x){de=x},this.setTransparentSort=function(x){pe=x},this.getClearColor=function(x){return x.copy(A.getClearColor())},this.setClearColor=function(){A.setClearColor.apply(A,arguments)},this.getClearAlpha=function(){return A.getClearAlpha()},this.setClearAlpha=function(){A.setClearAlpha.apply(A,arguments)},this.clear=function(x=!0,F=!0,k=!0){let W=0;if(x){let N=!1;if(L!==null){const ce=L.texture.format;N=ce===1033||ce===1031||ce===1029}if(N){const ce=L.texture.type,me=ce===1009||ce===1014||ce===1012||ce===1020||ce===1017||ce===1018,Ee=A.getClearColor(),Te=A.getClearAlpha(),Ue=Ee.r,Oe=Ee.g,ye=Ee.b;me?(_[0]=Ue,_[1]=Oe,_[2]=ye,_[3]=Te,I.clearBufferuiv(I.COLOR,0,_)):(S[0]=Ue,S[1]=Oe,S[2]=ye,S[3]=Te,I.clearBufferiv(I.COLOR,0,S))}else W|=I.COLOR_BUFFER_BIT}F&&(W|=I.DEPTH_BUFFER_BIT),k&&(W|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",X,!1),t.removeEventListener("webglcontextrestored",ae,!1),t.removeEventListener("webglcontextcreationerror",se,!1),ge.dispose(),We.dispose(),Re.dispose(),g.dispose(),G.dispose(),j.dispose(),re.dispose(),R.dispose(),Me.dispose(),z.dispose(),z.removeEventListener("sessionstart",ft),z.removeEventListener("sessionend",ui),Vt.stop()};function X(x){x.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),B=!0}function ae(){console.log("THREE.WebGLRenderer: Context Restored."),B=!1;const x=$e.autoReset,F=ve.enabled,k=ve.autoUpdate,W=ve.needsUpdate,N=ve.type;K(),$e.autoReset=x,ve.enabled=F,ve.autoUpdate=k,ve.needsUpdate=W,ve.type=N}function se(x){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",x.statusMessage)}function Se(x){const F=x.target;F.removeEventListener("dispose",Se),Ve(F)}function Ve(x){at(x),Re.remove(x)}function at(x){const F=Re.get(x).programs;F!==void 0&&(F.forEach(function(k){Me.releaseProgram(k)}),x.isShaderMaterial&&Me.releaseShaderCache(x))}this.renderBufferDirect=function(x,F,k,W,N,ce){F===null&&(F=Ye);const me=N.isMesh&&N.matrixWorld.determinant()<0,Ee=ah(x,F,k,W,N);be.setMaterial(W,me);let Te=k.index,Ue=1;if(W.wireframe===!0){if(Te=ne.getWireframeAttribute(k),Te===void 0)return;Ue=2}const Oe=k.drawRange,ye=k.attributes.position;let Ke=Oe.start*Ue,tt=(Oe.start+Oe.count)*Ue;ce!==null&&(Ke=Math.max(Ke,ce.start*Ue),tt=Math.min(tt,(ce.start+ce.count)*Ue)),Te!==null?(Ke=Math.max(Ke,0),tt=Math.min(tt,Te.count)):ye!=null&&(Ke=Math.max(Ke,0),tt=Math.min(tt,ye.count));const nt=tt-Ke;if(nt<0||nt===1/0)return;re.setup(N,W,Ee,k,Te);let bt,Ze=O;if(Te!==null&&(bt=ee.get(Te),Ze=q,Ze.setIndex(bt)),N.isMesh)W.wireframe===!0?(be.setLineWidth(W.wireframeLinewidth*st()),Ze.setMode(I.LINES)):Ze.setMode(I.TRIANGLES);else if(N.isLine){let Ae=W.linewidth;Ae===void 0&&(Ae=1),be.setLineWidth(Ae*st()),N.isLineSegments?Ze.setMode(I.LINES):N.isLineLoop?Ze.setMode(I.LINE_LOOP):Ze.setMode(I.LINE_STRIP)}else N.isPoints?Ze.setMode(I.POINTS):N.isSprite&&Ze.setMode(I.TRIANGLES);if(N.isBatchedMesh)if(N._multiDrawInstances!==null)Ze.renderMultiDrawInstances(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount,N._multiDrawInstances);else if(Fe.get("WEBGL_multi_draw"))Ze.renderMultiDraw(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount);else{const Ae=N._multiDrawStarts,en=N._multiDrawCounts,je=N._multiDrawCount,Ht=Te?ee.get(Te).bytesPerElement:1,$n=Re.get(W).currentProgram.getUniforms();for(let Pt=0;Pt<je;Pt++)$n.setValue(I,"_gl_DrawID",Pt),Ze.render(Ae[Pt]/Ht,en[Pt])}else if(N.isInstancedMesh)Ze.renderInstances(Ke,nt,N.count);else if(k.isInstancedBufferGeometry){const Ae=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,en=Math.min(k.instanceCount,Ae);Ze.renderInstances(Ke,nt,en)}else Ze.render(Ke,nt)};function qe(x,F,k){x.transparent===!0&&x.side===2&&x.forceSinglePass===!1?(x.side=1,x.needsUpdate=!0,zi(x,F,k),x.side=0,x.needsUpdate=!0,zi(x,F,k),x.side=2):zi(x,F,k)}this.compile=function(x,F,k=null){k===null&&(k=x),u=We.get(k),u.init(F),E.push(u),k.traverseVisible(function(N){N.isLight&&N.layers.test(F.layers)&&(u.pushLight(N),N.castShadow&&u.pushShadow(N))}),x!==k&&x.traverseVisible(function(N){N.isLight&&N.layers.test(F.layers)&&(u.pushLight(N),N.castShadow&&u.pushShadow(N))}),u.setupLights();const W=new Set;return x.traverse(function(N){if(!(N.isMesh||N.isPoints||N.isLine||N.isSprite))return;const ce=N.material;if(ce)if(Array.isArray(ce))for(let me=0;me<ce.length;me++){const Ee=ce[me];qe(Ee,k,N),W.add(Ee)}else qe(ce,k,N),W.add(ce)}),E.pop(),u=null,W},this.compileAsync=function(x,F,k=null){const W=this.compile(x,F,k);return new Promise(N=>{function ce(){if(W.forEach(function(me){Re.get(me).currentProgram.isReady()&&W.delete(me)}),W.size===0){N(x);return}setTimeout(ce,10)}Fe.get("KHR_parallel_shader_compile")!==null?ce():setTimeout(ce,10)})};let St=null;function mt(x){St&&St(x)}function ft(){Vt.stop()}function ui(){Vt.start()}const Vt=new us;Vt.setAnimationLoop(mt),typeof self!="undefined"&&Vt.setContext(self),this.setAnimationLoop=function(x){St=x,z.setAnimationLoop(x),x===null?Vt.stop():Vt.start()},z.addEventListener("sessionstart",ft),z.addEventListener("sessionend",ui),this.render=function(x,F){if(F!==void 0&&F.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(B===!0)return;if(x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),z.enabled===!0&&z.isPresenting===!0&&(z.cameraAutoUpdate===!0&&z.updateCamera(F),F=z.getCamera()),x.isScene===!0&&x.onBeforeRender(M,x,F,L),u=We.get(x,E.length),u.init(F),E.push(u),we.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),J.setFromProjectionMatrix(we),xe=this.localClippingEnabled,oe=ie.init(this.clippingPlanes,xe),p=ge.get(x,y.length),p.init(),y.push(p),z.enabled===!0&&z.isPresenting===!0){const ce=M.xr.getDepthSensingMesh();ce!==null&&yn(ce,F,-1/0,M.sortObjects)}yn(x,F,0,M.sortObjects),p.finish(),M.sortObjects===!0&&p.sort(de,pe),ke=z.enabled===!1||z.isPresenting===!1||z.hasDepthSensing()===!1,ke&&A.addToRenderList(p,x),this.info.render.frame++,oe===!0&&ie.beginShadows();const k=u.state.shadowsArray;ve.render(k,x,F),oe===!0&&ie.endShadows(),this.info.autoReset===!0&&this.info.reset();const W=p.opaque,N=p.transmissive;if(u.setupLights(),F.isArrayCamera){const ce=F.cameras;if(N.length>0)for(let me=0,Ee=ce.length;me<Ee;me++){const Te=ce[me];js(W,N,x,Te)}ke&&A.render(x);for(let me=0,Ee=ce.length;me<Ee;me++){const Te=ce[me];hi(p,x,Te,Te.viewport)}}else N.length>0&&js(W,N,x,F),ke&&A.render(x),hi(p,x,F);L!==null&&(b.updateMultisampleRenderTarget(L),b.updateRenderTargetMipmap(L)),x.isScene===!0&&x.onAfterRender(M,x,F),re.resetDefaultState(),T=-1,v=null,E.pop(),E.length>0?(u=E[E.length-1],oe===!0&&ie.setGlobalState(M.clippingPlanes,u.state.camera)):u=null,y.pop(),y.length>0?p=y[y.length-1]:p=null};function yn(x,F,k,W){if(x.visible===!1)return;if(x.layers.test(F.layers)){if(x.isGroup)k=x.renderOrder;else if(x.isLOD)x.autoUpdate===!0&&x.update(F);else if(x.isLight)u.pushLight(x),x.castShadow&&u.pushShadow(x);else if(x.isSprite){if(!x.frustumCulled||J.intersectsSprite(x)){W&&Le.setFromMatrixPosition(x.matrixWorld).applyMatrix4(we);const me=j.update(x),Ee=x.material;Ee.visible&&p.push(x,me,Ee,k,Le.z,null)}}else if((x.isMesh||x.isLine||x.isPoints)&&(!x.frustumCulled||J.intersectsObject(x))){const me=j.update(x),Ee=x.material;if(W&&(x.boundingSphere!==void 0?(x.boundingSphere===null&&x.computeBoundingSphere(),Le.copy(x.boundingSphere.center)):(me.boundingSphere===null&&me.computeBoundingSphere(),Le.copy(me.boundingSphere.center)),Le.applyMatrix4(x.matrixWorld).applyMatrix4(we)),Array.isArray(Ee)){const Te=me.groups;for(let Ue=0,Oe=Te.length;Ue<Oe;Ue++){const ye=Te[Ue],Ke=Ee[ye.materialIndex];Ke&&Ke.visible&&p.push(x,me,Ke,k,Le.z,ye)}}else Ee.visible&&p.push(x,me,Ee,k,Le.z,null)}}const ce=x.children;for(let me=0,Ee=ce.length;me<Ee;me++)yn(ce[me],F,k,W)}function hi(x,F,k,W){const N=x.opaque,ce=x.transmissive,me=x.transparent;u.setupLightsView(k),oe===!0&&ie.setGlobalState(M.clippingPlanes,k),W&&be.viewport(P.copy(W)),N.length>0&&Oi(N,F,k),ce.length>0&&Oi(ce,F,k),me.length>0&&Oi(me,F,k),be.buffers.depth.setTest(!0),be.buffers.depth.setMask(!0),be.buffers.color.setMask(!0),be.setPolygonOffset(!1)}function js(x,F,k,W){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;u.state.transmissionRenderTarget[W.id]===void 0&&(u.state.transmissionRenderTarget[W.id]=new Dt(1,1,{generateMipmaps:!0,type:Fe.has("EXT_color_buffer_half_float")||Fe.has("EXT_color_buffer_float")?1016:1009,minFilter:1008,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Xe.workingColorSpace}));const ce=u.state.transmissionRenderTarget[W.id],me=W.viewport||P;ce.setSize(me.z,me.w);const Ee=M.getRenderTarget();M.setRenderTarget(ce),M.getClearColor(Y),te=M.getClearAlpha(),te<1&&M.setClearColor(16777215,.5),M.clear(),ke&&A.render(k);const Te=M.toneMapping;M.toneMapping=0;const Ue=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),u.setupLightsView(W),oe===!0&&ie.setGlobalState(M.clippingPlanes,W),Oi(x,k,W),b.updateMultisampleRenderTarget(ce),b.updateRenderTargetMipmap(ce),Fe.has("WEBGL_multisampled_render_to_texture")===!1){let Oe=!1;for(let ye=0,Ke=F.length;ye<Ke;ye++){const tt=F[ye],nt=tt.object,bt=tt.geometry,Ze=tt.material,Ae=tt.group;if(Ze.side===2&&nt.layers.test(W.layers)){const en=Ze.side;Ze.side=1,Ze.needsUpdate=!0,Js(nt,k,W,bt,Ze,Ae),Ze.side=en,Ze.needsUpdate=!0,Oe=!0}}Oe===!0&&(b.updateMultisampleRenderTarget(ce),b.updateRenderTargetMipmap(ce))}M.setRenderTarget(Ee),M.setClearColor(Y,te),Ue!==void 0&&(W.viewport=Ue),M.toneMapping=Te}function Oi(x,F,k){const W=F.isScene===!0?F.overrideMaterial:null;for(let N=0,ce=x.length;N<ce;N++){const me=x[N],Ee=me.object,Te=me.geometry,Ue=W===null?me.material:W,Oe=me.group;Ee.layers.test(k.layers)&&Js(Ee,F,k,Te,Ue,Oe)}}function Js(x,F,k,W,N,ce){x.onBeforeRender(M,F,k,W,N,ce),x.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,x.matrixWorld),x.normalMatrix.getNormalMatrix(x.modelViewMatrix),N.onBeforeRender(M,F,k,W,x,ce),N.transparent===!0&&N.side===2&&N.forceSinglePass===!1?(N.side=1,N.needsUpdate=!0,M.renderBufferDirect(k,F,W,N,x,ce),N.side=0,N.needsUpdate=!0,M.renderBufferDirect(k,F,W,N,x,ce),N.side=2):M.renderBufferDirect(k,F,W,N,x,ce),x.onAfterRender(M,F,k,W,N,ce)}function zi(x,F,k){F.isScene!==!0&&(F=Ye);const W=Re.get(x),N=u.state.lights,ce=u.state.shadowsArray,me=N.state.version,Ee=Me.getParameters(x,N.state,ce,F,k),Te=Me.getProgramCacheKey(Ee);let Ue=W.programs;W.environment=x.isMeshStandardMaterial?F.environment:null,W.fog=F.fog,W.envMap=(x.isMeshStandardMaterial?G:g).get(x.envMap||W.environment),W.envMapRotation=W.environment!==null&&x.envMap===null?F.environmentRotation:x.envMapRotation,Ue===void 0&&(x.addEventListener("dispose",Se),Ue=new Map,W.programs=Ue);let Oe=Ue.get(Te);if(Oe!==void 0){if(W.currentProgram===Oe&&W.lightsStateVersion===me)return ea(x,Ee),Oe}else Ee.uniforms=Me.getUniforms(x),x.onBeforeCompile(Ee,M),Oe=Me.acquireProgram(Ee,Te),Ue.set(Te,Oe),W.uniforms=Ee.uniforms;const ye=W.uniforms;return(!x.isShaderMaterial&&!x.isRawShaderMaterial||x.clipping===!0)&&(ye.clippingPlanes=ie.uniform),ea(x,Ee),W.needsLights=lh(x),W.lightsStateVersion=me,W.needsLights&&(ye.ambientLightColor.value=N.state.ambient,ye.lightProbe.value=N.state.probe,ye.directionalLights.value=N.state.directional,ye.directionalLightShadows.value=N.state.directionalShadow,ye.spotLights.value=N.state.spot,ye.spotLightShadows.value=N.state.spotShadow,ye.rectAreaLights.value=N.state.rectArea,ye.ltc_1.value=N.state.rectAreaLTC1,ye.ltc_2.value=N.state.rectAreaLTC2,ye.pointLights.value=N.state.point,ye.pointLightShadows.value=N.state.pointShadow,ye.hemisphereLights.value=N.state.hemi,ye.directionalShadowMap.value=N.state.directionalShadowMap,ye.directionalShadowMatrix.value=N.state.directionalShadowMatrix,ye.spotShadowMap.value=N.state.spotShadowMap,ye.spotLightMatrix.value=N.state.spotLightMatrix,ye.spotLightMap.value=N.state.spotLightMap,ye.pointShadowMap.value=N.state.pointShadowMap,ye.pointShadowMatrix.value=N.state.pointShadowMatrix),W.currentProgram=Oe,W.uniformsList=null,Oe}function Qs(x){if(x.uniformsList===null){const F=x.currentProgram.getUniforms();x.uniformsList=Ni.seqWithValue(F.seq,x.uniforms)}return x.uniformsList}function ea(x,F){const k=Re.get(x);k.outputColorSpace=F.outputColorSpace,k.batching=F.batching,k.batchingColor=F.batchingColor,k.instancing=F.instancing,k.instancingColor=F.instancingColor,k.instancingMorph=F.instancingMorph,k.skinning=F.skinning,k.morphTargets=F.morphTargets,k.morphNormals=F.morphNormals,k.morphColors=F.morphColors,k.morphTargetsCount=F.morphTargetsCount,k.numClippingPlanes=F.numClippingPlanes,k.numIntersection=F.numClipIntersection,k.vertexAlphas=F.vertexAlphas,k.vertexTangents=F.vertexTangents,k.toneMapping=F.toneMapping}function ah(x,F,k,W,N){F.isScene!==!0&&(F=Ye),b.resetTextureUnits();const ce=F.fog,me=W.isMeshStandardMaterial?F.environment:null,Ee=L===null?M.outputColorSpace:L.isXRRenderTarget===!0?L.texture.colorSpace:bn,Te=(W.isMeshStandardMaterial?G:g).get(W.envMap||me),Ue=W.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Oe=!!k.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),ye=!!k.morphAttributes.position,Ke=!!k.morphAttributes.normal,tt=!!k.morphAttributes.color;let nt=0;W.toneMapped&&(L===null||L.isXRRenderTarget===!0)&&(nt=M.toneMapping);const bt=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,Ze=bt!==void 0?bt.length:0,Ae=Re.get(W),en=u.state.lights;if(oe===!0&&(xe===!0||x!==v)){const Ft=x===v&&W.id===T;ie.setState(W,x,Ft)}let je=!1;W.version===Ae.__version?(Ae.needsLights&&Ae.lightsStateVersion!==en.state.version||Ae.outputColorSpace!==Ee||N.isBatchedMesh&&Ae.batching===!1||!N.isBatchedMesh&&Ae.batching===!0||N.isBatchedMesh&&Ae.batchingColor===!0&&N.colorTexture===null||N.isBatchedMesh&&Ae.batchingColor===!1&&N.colorTexture!==null||N.isInstancedMesh&&Ae.instancing===!1||!N.isInstancedMesh&&Ae.instancing===!0||N.isSkinnedMesh&&Ae.skinning===!1||!N.isSkinnedMesh&&Ae.skinning===!0||N.isInstancedMesh&&Ae.instancingColor===!0&&N.instanceColor===null||N.isInstancedMesh&&Ae.instancingColor===!1&&N.instanceColor!==null||N.isInstancedMesh&&Ae.instancingMorph===!0&&N.morphTexture===null||N.isInstancedMesh&&Ae.instancingMorph===!1&&N.morphTexture!==null||Ae.envMap!==Te||W.fog===!0&&Ae.fog!==ce||Ae.numClippingPlanes!==void 0&&(Ae.numClippingPlanes!==ie.numPlanes||Ae.numIntersection!==ie.numIntersection)||Ae.vertexAlphas!==Ue||Ae.vertexTangents!==Oe||Ae.morphTargets!==ye||Ae.morphNormals!==Ke||Ae.morphColors!==tt||Ae.toneMapping!==nt||Ae.morphTargetsCount!==Ze)&&(je=!0):(je=!0,Ae.__version=W.version);let Ht=Ae.currentProgram;je===!0&&(Ht=zi(W,F,N));let $n=!1,Pt=!1,fi=!1;const it=Ht.getUniforms(),qt=Ae.uniforms;if(be.useProgram(Ht.program)&&($n=!0,Pt=!0,fi=!0),W.id!==T&&(T=W.id,Pt=!0),$n||v!==x){be.buffers.depth.getReversed()?(ue.copy(x.projectionMatrix),sa(ue),aa(ue),it.setValue(I,"projectionMatrix",ue)):it.setValue(I,"projectionMatrix",x.projectionMatrix),it.setValue(I,"viewMatrix",x.matrixWorldInverse);const un=it.map.cameraPosition;un!==void 0&&un.setValue(I,De.setFromMatrixPosition(x.matrixWorld)),He.logarithmicDepthBuffer&&it.setValue(I,"logDepthBufFC",2/(Math.log(x.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&it.setValue(I,"isOrthographic",x.isOrthographicCamera===!0),v!==x&&(v=x,Pt=!0,fi=!0)}if(N.isSkinnedMesh){it.setOptional(I,N,"bindMatrix"),it.setOptional(I,N,"bindMatrixInverse");const Ft=N.skeleton;Ft&&(Ft.boneTexture===null&&Ft.computeBoneTexture(),it.setValue(I,"boneTexture",Ft.boneTexture,b))}N.isBatchedMesh&&(it.setOptional(I,N,"batchingTexture"),it.setValue(I,"batchingTexture",N._matricesTexture,b),it.setOptional(I,N,"batchingIdTexture"),it.setValue(I,"batchingIdTexture",N._indirectTexture,b),it.setOptional(I,N,"batchingColorTexture"),N._colorsTexture!==null&&it.setValue(I,"batchingColorTexture",N._colorsTexture,b));const di=k.morphAttributes;if((di.position!==void 0||di.normal!==void 0||di.color!==void 0)&&D.update(N,k,Ht),(Pt||Ae.receiveShadow!==N.receiveShadow)&&(Ae.receiveShadow=N.receiveShadow,it.setValue(I,"receiveShadow",N.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(qt.envMap.value=Te,qt.flipEnvMap.value=Te.isCubeTexture&&Te.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&F.environment!==null&&(qt.envMapIntensity.value=F.environmentIntensity),Pt&&(it.setValue(I,"toneMappingExposure",M.toneMappingExposure),Ae.needsLights&&oh(qt,fi),ce&&W.fog===!0&&he.refreshFogUniforms(qt,ce),he.refreshMaterialUniforms(qt,W,$,le,u.state.transmissionRenderTarget[x.id]),Ni.upload(I,Qs(Ae),qt,b)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Ni.upload(I,Qs(Ae),qt,b),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&it.setValue(I,"center",N.center),it.setValue(I,"modelViewMatrix",N.modelViewMatrix),it.setValue(I,"normalMatrix",N.normalMatrix),it.setValue(I,"modelMatrix",N.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){const Ft=W.uniformsGroups;for(let un=0,hn=Ft.length;un<hn;un++){const ta=Ft[un];R.update(ta,Ht),R.bind(ta,Ht)}}return Ht}function oh(x,F){x.ambientLightColor.needsUpdate=F,x.lightProbe.needsUpdate=F,x.directionalLights.needsUpdate=F,x.directionalLightShadows.needsUpdate=F,x.pointLights.needsUpdate=F,x.pointLightShadows.needsUpdate=F,x.spotLights.needsUpdate=F,x.spotLightShadows.needsUpdate=F,x.rectAreaLights.needsUpdate=F,x.hemisphereLights.needsUpdate=F}function lh(x){return x.isMeshLambertMaterial||x.isMeshToonMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isShadowMaterial||x.isShaderMaterial&&x.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return L},this.setRenderTargetTextures=function(x,F,k){Re.get(x.texture).__webglTexture=F,Re.get(x.depthTexture).__webglTexture=k;const W=Re.get(x);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=k===void 0,W.__autoAllocateDepthBuffer||Fe.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(x,F){const k=Re.get(x);k.__webglFramebuffer=F,k.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(x,F=0,k=0){L=x,w=F,C=k;let W=!0,N=null,ce=!1,me=!1;if(x){const Te=Re.get(x);if(Te.__useDefaultFramebuffer!==void 0)be.bindFramebuffer(I.FRAMEBUFFER,null),W=!1;else if(Te.__webglFramebuffer===void 0)b.setupRenderTarget(x);else if(Te.__hasExternalTextures)b.rebindTextures(x,Re.get(x.texture).__webglTexture,Re.get(x.depthTexture).__webglTexture);else if(x.depthBuffer){const ye=x.depthTexture;if(Te.__boundDepthTexture!==ye){if(ye!==null&&Re.has(ye)&&(x.width!==ye.image.width||x.height!==ye.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");b.setupDepthRenderbuffer(x)}}const Ue=x.texture;(Ue.isData3DTexture||Ue.isDataArrayTexture||Ue.isCompressedArrayTexture)&&(me=!0);const Oe=Re.get(x).__webglFramebuffer;x.isWebGLCubeRenderTarget?(Array.isArray(Oe[F])?N=Oe[F][k]:N=Oe[F],ce=!0):x.samples>0&&b.useMultisampledRTT(x)===!1?N=Re.get(x).__webglMultisampledFramebuffer:Array.isArray(Oe)?N=Oe[k]:N=Oe,P.copy(x.viewport),H.copy(x.scissor),V=x.scissorTest}else P.copy(_e).multiplyScalar($).floor(),H.copy(Ie).multiplyScalar($).floor(),V=Ce;if(be.bindFramebuffer(I.FRAMEBUFFER,N)&&W&&be.drawBuffers(x,N),be.viewport(P),be.scissor(H),be.setScissorTest(V),ce){const Te=Re.get(x.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+F,Te.__webglTexture,k)}else if(me){const Te=Re.get(x.texture),Ue=F||0;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,Te.__webglTexture,k||0,Ue)}T=-1},this.readRenderTargetPixels=function(x,F,k,W,N,ce,me){if(!(x&&x.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ee=Re.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&me!==void 0&&(Ee=Ee[me]),Ee){be.bindFramebuffer(I.FRAMEBUFFER,Ee);try{const Te=x.texture,Ue=Te.format,Oe=Te.type;if(!He.textureFormatReadable(Ue)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!He.textureTypeReadable(Oe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=x.width-W&&k>=0&&k<=x.height-N&&I.readPixels(F,k,W,N,Q.convert(Ue),Q.convert(Oe),ce)}finally{const Te=L!==null?Re.get(L).__webglFramebuffer:null;be.bindFramebuffer(I.FRAMEBUFFER,Te)}}},this.readRenderTargetPixelsAsync=async function(x,F,k,W,N,ce,me){if(!(x&&x.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ee=Re.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&me!==void 0&&(Ee=Ee[me]),Ee){const Te=x.texture,Ue=Te.format,Oe=Te.type;if(!He.textureFormatReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!He.textureTypeReadable(Oe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(F>=0&&F<=x.width-W&&k>=0&&k<=x.height-N){be.bindFramebuffer(I.FRAMEBUFFER,Ee);const ye=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,ye),I.bufferData(I.PIXEL_PACK_BUFFER,ce.byteLength,I.STREAM_READ),I.readPixels(F,k,W,N,Q.convert(Ue),Q.convert(Oe),0);const Ke=L!==null?Re.get(L).__webglFramebuffer:null;be.bindFramebuffer(I.FRAMEBUFFER,Ke);const tt=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await ra(I,tt,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,ye),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,ce),I.deleteBuffer(ye),I.deleteSync(tt),ce}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(x,F=null,k=0){x.isTexture!==!0&&(jn("WebGLRenderer: copyFramebufferToTexture function signature has changed."),F=arguments[0]||null,x=arguments[1]);const W=Math.pow(2,-k),N=Math.floor(x.image.width*W),ce=Math.floor(x.image.height*W),me=F!==null?F.x:0,Ee=F!==null?F.y:0;b.setTexture2D(x,0),I.copyTexSubImage2D(I.TEXTURE_2D,k,0,0,me,Ee,N,ce),be.unbindTexture()},this.copyTextureToTexture=function(x,F,k=null,W=null,N=0){x.isTexture!==!0&&(jn("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,x=arguments[1],F=arguments[2],N=arguments[3]||0,k=null);let ce,me,Ee,Te,Ue,Oe,ye,Ke,tt;const nt=x.isCompressedTexture?x.mipmaps[N]:x.image;k!==null?(ce=k.max.x-k.min.x,me=k.max.y-k.min.y,Ee=k.isBox3?k.max.z-k.min.z:1,Te=k.min.x,Ue=k.min.y,Oe=k.isBox3?k.min.z:0):(ce=nt.width,me=nt.height,Ee=nt.depth||1,Te=0,Ue=0,Oe=0),W!==null?(ye=W.x,Ke=W.y,tt=W.z):(ye=0,Ke=0,tt=0);const bt=Q.convert(F.format),Ze=Q.convert(F.type);let Ae;F.isData3DTexture?(b.setTexture3D(F,0),Ae=I.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(b.setTexture2DArray(F,0),Ae=I.TEXTURE_2D_ARRAY):(b.setTexture2D(F,0),Ae=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,F.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,F.unpackAlignment);const en=I.getParameter(I.UNPACK_ROW_LENGTH),je=I.getParameter(I.UNPACK_IMAGE_HEIGHT),Ht=I.getParameter(I.UNPACK_SKIP_PIXELS),$n=I.getParameter(I.UNPACK_SKIP_ROWS),Pt=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,nt.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,nt.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Te),I.pixelStorei(I.UNPACK_SKIP_ROWS,Ue),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Oe);const fi=x.isDataArrayTexture||x.isData3DTexture,it=F.isDataArrayTexture||F.isData3DTexture;if(x.isRenderTargetTexture||x.isDepthTexture){const qt=Re.get(x),di=Re.get(F),Ft=Re.get(qt.__renderTarget),un=Re.get(di.__renderTarget);be.bindFramebuffer(I.READ_FRAMEBUFFER,Ft.__webglFramebuffer),be.bindFramebuffer(I.DRAW_FRAMEBUFFER,un.__webglFramebuffer);for(let hn=0;hn<Ee;hn++)fi&&I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Re.get(x).__webglTexture,N,Oe+hn),x.isDepthTexture?(it&&I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Re.get(F).__webglTexture,N,tt+hn),I.blitFramebuffer(Te,Ue,ce,me,ye,Ke,ce,me,I.DEPTH_BUFFER_BIT,I.NEAREST)):it?I.copyTexSubImage3D(Ae,N,ye,Ke,tt+hn,Te,Ue,ce,me):I.copyTexSubImage2D(Ae,N,ye,Ke,tt+hn,Te,Ue,ce,me);be.bindFramebuffer(I.READ_FRAMEBUFFER,null),be.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else it?x.isDataTexture||x.isData3DTexture?I.texSubImage3D(Ae,N,ye,Ke,tt,ce,me,Ee,bt,Ze,nt.data):F.isCompressedArrayTexture?I.compressedTexSubImage3D(Ae,N,ye,Ke,tt,ce,me,Ee,bt,nt.data):I.texSubImage3D(Ae,N,ye,Ke,tt,ce,me,Ee,bt,Ze,nt):x.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,N,ye,Ke,ce,me,bt,Ze,nt.data):x.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,N,ye,Ke,nt.width,nt.height,bt,nt.data):I.texSubImage2D(I.TEXTURE_2D,N,ye,Ke,ce,me,bt,Ze,nt);I.pixelStorei(I.UNPACK_ROW_LENGTH,en),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,je),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Ht),I.pixelStorei(I.UNPACK_SKIP_ROWS,$n),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Pt),N===0&&F.generateMipmaps&&I.generateMipmap(Ae),be.unbindTexture()},this.copyTextureToTexture3D=function(x,F,k=null,W=null,N=0){return x.isTexture!==!0&&(jn("WebGLRenderer: copyTextureToTexture3D function signature has changed."),k=arguments[0]||null,W=arguments[1]||null,x=arguments[2],F=arguments[3],N=arguments[4]||0),jn('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(x,F,k,W,N)},this.initRenderTarget=function(x){Re.get(x).__webglFramebuffer===void 0&&b.setupRenderTarget(x)},this.initTexture=function(x){x.isCubeTexture?b.setTextureCube(x,0):x.isData3DTexture?b.setTexture3D(x,0):x.isDataArrayTexture||x.isCompressedArrayTexture?b.setTexture2DArray(x,0):b.setTexture2D(x,0),be.unbindTexture()},this.resetState=function(){w=0,C=0,L=null,be.reset(),re.reset()},typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return 2e3}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorspace=Xe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Xe._getUnpackColorSpace()}}class Gs extends dt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new kt,this.environmentIntensity=1,this.environmentRotation=new kt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class Bu extends xt{constructor(e,t,n,r,s,a,o,l,h){super(e,t,n,r,s,a,o,l,h),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Er extends Ut{constructor(e=1,t=1,n=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const h=this;r=Math.floor(r),s=Math.floor(s);const f=[],c=[],d=[],m=[];let _=0;const S=[],p=n/2;let u=0;y(),a===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(f),this.setAttribute("position",new lt(c,3)),this.setAttribute("normal",new lt(d,3)),this.setAttribute("uv",new lt(m,2));function y(){const M=new U,B=new U;let w=0;const C=(t-e)/n;for(let L=0;L<=s;L++){const T=[],v=L/s,P=v*(t-e)+e;for(let H=0;H<=r;H++){const V=H/r,Y=V*l+o,te=Math.sin(Y),Z=Math.cos(Y);B.x=P*te,B.y=-v*n+p,B.z=P*Z,c.push(B.x,B.y,B.z),M.set(te,C,Z).normalize(),d.push(M.x,M.y,M.z),m.push(V,1-v),T.push(_++)}S.push(T)}for(let L=0;L<r;L++)for(let T=0;T<s;T++){const v=S[T][L],P=S[T+1][L],H=S[T+1][L+1],V=S[T][L+1];(e>0||T!==0)&&(f.push(v,P,V),w+=3),(t>0||T!==s-1)&&(f.push(P,H,V),w+=3)}h.addGroup(u,w,0),u+=w}function E(M){const B=_,w=new Pe,C=new U;let L=0;const T=M===!0?e:t,v=M===!0?1:-1;for(let H=1;H<=r;H++)c.push(0,p*v,0),d.push(0,v,0),m.push(.5,.5),_++;const P=_;for(let H=0;H<=r;H++){const Y=H/r*l+o,te=Math.cos(Y),Z=Math.sin(Y);C.x=T*Z,C.y=p*v,C.z=T*te,c.push(C.x,C.y,C.z),d.push(0,v,0),w.x=te*.5+.5,w.y=Z*.5*v+.5,m.push(w.x,w.y),_++}for(let H=0;H<r;H++){const V=B+H,Y=P+H;M===!0?f.push(Y,Y+1,V):f.push(Y+1,Y,V),L+=3}h.addGroup(u,L,M===!0?1:2),u+=L}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Er(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Tr extends Ut{constructor(e=[],t=[],n=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:r};const s=[],a=[];o(r),h(n),f(),this.setAttribute("position",new lt(s,3)),this.setAttribute("normal",new lt(s.slice(),3)),this.setAttribute("uv",new lt(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(y){const E=new U,M=new U,B=new U;for(let w=0;w<t.length;w+=3)m(t[w+0],E),m(t[w+1],M),m(t[w+2],B),l(E,M,B,y)}function l(y,E,M,B){const w=B+1,C=[];for(let L=0;L<=w;L++){C[L]=[];const T=y.clone().lerp(M,L/w),v=E.clone().lerp(M,L/w),P=w-L;for(let H=0;H<=P;H++)H===0&&L===w?C[L][H]=T:C[L][H]=T.clone().lerp(v,H/P)}for(let L=0;L<w;L++)for(let T=0;T<2*(w-L)-1;T++){const v=Math.floor(T/2);T%2===0?(d(C[L][v+1]),d(C[L+1][v]),d(C[L][v])):(d(C[L][v+1]),d(C[L+1][v+1]),d(C[L+1][v]))}}function h(y){const E=new U;for(let M=0;M<s.length;M+=3)E.x=s[M+0],E.y=s[M+1],E.z=s[M+2],E.normalize().multiplyScalar(y),s[M+0]=E.x,s[M+1]=E.y,s[M+2]=E.z}function f(){const y=new U;for(let E=0;E<s.length;E+=3){y.x=s[E+0],y.y=s[E+1],y.z=s[E+2];const M=p(y)/2/Math.PI+.5,B=u(y)/Math.PI+.5;a.push(M,1-B)}_(),c()}function c(){for(let y=0;y<a.length;y+=6){const E=a[y+0],M=a[y+2],B=a[y+4],w=Math.max(E,M,B),C=Math.min(E,M,B);w>.9&&C<.1&&(E<.2&&(a[y+0]+=1),M<.2&&(a[y+2]+=1),B<.2&&(a[y+4]+=1))}}function d(y){s.push(y.x,y.y,y.z)}function m(y,E){const M=y*3;E.x=e[M+0],E.y=e[M+1],E.z=e[M+2]}function _(){const y=new U,E=new U,M=new U,B=new U,w=new Pe,C=new Pe,L=new Pe;for(let T=0,v=0;T<s.length;T+=9,v+=6){y.set(s[T+0],s[T+1],s[T+2]),E.set(s[T+3],s[T+4],s[T+5]),M.set(s[T+6],s[T+7],s[T+8]),w.set(a[v+0],a[v+1]),C.set(a[v+2],a[v+3]),L.set(a[v+4],a[v+5]),B.copy(y).add(E).add(M).divideScalar(3);const P=p(B);S(w,v+0,y,P),S(C,v+2,E,P),S(L,v+4,M,P)}}function S(y,E,M,B){B<0&&y.x===1&&(a[E]=y.x-1),M.x===0&&M.z===0&&(a[E]=B/2/Math.PI+.5)}function p(y){return Math.atan2(y.z,-y.x)}function u(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Tr(e.vertices,e.indices,e.radius,e.details)}}class yr extends Tr{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,s,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new yr(e.radius,e.detail)}}class Wn extends Ut{constructor(e=1,t=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let h=0;const f=[],c=new U,d=new U,m=[],_=[],S=[],p=[];for(let u=0;u<=n;u++){const y=[],E=u/n;let M=0;u===0&&a===0?M=.5/t:u===n&&l===Math.PI&&(M=-.5/t);for(let B=0;B<=t;B++){const w=B/t;c.x=-e*Math.cos(r+w*s)*Math.sin(a+E*o),c.y=e*Math.cos(a+E*o),c.z=e*Math.sin(r+w*s)*Math.sin(a+E*o),_.push(c.x,c.y,c.z),d.copy(c).normalize(),S.push(d.x,d.y,d.z),p.push(w+M,1-E),y.push(h++)}f.push(y)}for(let u=0;u<n;u++)for(let y=0;y<t;y++){const E=f[u][y+1],M=f[u][y],B=f[u+1][y],w=f[u+1][y+1];(u!==0||a>0)&&m.push(E,M,w),(u!==n-1||l<Math.PI)&&m.push(M,B,w)}this.setIndex(m),this.setAttribute("position",new lt(_,3)),this.setAttribute("normal",new lt(S,3)),this.setAttribute("uv",new lt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Wn(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Ou extends vt{static get type(){return"RawShaderMaterial"}constructor(e){super(e),this.isRawShaderMaterial=!0}}class En extends ii{static get type(){return"MeshStandardMaterial"}constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new ze(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ze(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new Pe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new kt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class br extends dt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ze(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}class zu extends br{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(dt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ze(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const Ar=new rt,Vs=new U,Hs=new U;class ks{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Pe(512,512),this.map=null,this.mapPass=null,this.matrix=new rt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ur,this._frameExtents=new Pe(1,1),this._viewportCount=1,this._viewports=[new Qe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Vs.setFromMatrixPosition(e.matrixWorld),t.position.copy(Vs),Hs.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Hs),t.updateMatrixWorld(),Ar.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ar),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Ar)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Ws=new rt,oi=new U,Rr=new U;class Gu extends ks{constructor(){super(new Ct(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Pe(4,2),this._viewportCount=6,this._viewports=[new Qe(2,1,1,1),new Qe(0,1,1,1),new Qe(3,1,1,1),new Qe(1,1,1,1),new Qe(3,0,1,1),new Qe(1,0,1,1)],this._cubeDirections=[new U(1,0,0),new U(-1,0,0),new U(0,0,1),new U(0,0,-1),new U(0,1,0),new U(0,-1,0)],this._cubeUps=[new U(0,1,0),new U(0,1,0),new U(0,1,0),new U(0,1,0),new U(0,0,1),new U(0,0,-1)]}updateMatrices(e,t=0){const n=this.camera,r=this.matrix,s=e.distance||n.far;s!==n.far&&(n.far=s,n.updateProjectionMatrix()),oi.setFromMatrixPosition(e.matrixWorld),n.position.copy(oi),Rr.copy(n.position),Rr.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Rr),n.updateMatrixWorld(),r.makeTranslation(-oi.x,-oi.y,-oi.z),Ws.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ws)}}class Xs extends br{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=r,this.shadow=new Gu}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class Vu extends ks{constructor(){super(new hr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Hu extends br{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(dt.DEFAULT_UP),this.updateMatrix(),this.target=new dt,this.shadow=new Vu}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class ku{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=qs(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=qs();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function qs(){return performance.now()}typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}})),typeof window!="undefined"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");const li=new U;function It(i,e,t,n,r,s){const a=2*Math.PI*r/4,o=Math.max(s-2*r,0),l=Math.PI/4;li.copy(e),li[n]=0,li.normalize();const h=.5*a/(a+o),f=1-li.angleTo(i)/l;return Math.sign(li[t])===1?f*h:o/(a+o)+h+h*(1-f)}class Wu extends on{constructor(e=1,t=1,n=1,r=2,s=.1){if(r=r*2+1,s=Math.min(e/2,t/2,n/2,s),super(1,1,1,r,r,r),r===1)return;const a=this.toNonIndexed();this.index=null,this.attributes.position=a.attributes.position,this.attributes.normal=a.attributes.normal,this.attributes.uv=a.attributes.uv;const o=new U,l=new U,h=new U(e,t,n).divideScalar(2).subScalar(s),f=this.attributes.position.array,c=this.attributes.normal.array,d=this.attributes.uv.array,m=f.length/6,_=new U,S=.5/r;for(let p=0,u=0;p<f.length;p+=3,u+=2)switch(o.fromArray(f,p),l.copy(o),l.x-=Math.sign(l.x)*S,l.y-=Math.sign(l.y)*S,l.z-=Math.sign(l.z)*S,l.normalize(),f[p+0]=h.x*Math.sign(o.x)+l.x*s,f[p+1]=h.y*Math.sign(o.y)+l.y*s,f[p+2]=h.z*Math.sign(o.z)+l.z*s,c[p+0]=l.x,c[p+1]=l.y,c[p+2]=l.z,Math.floor(p/m)){case 0:_.set(1,0,0),d[u+0]=It(_,l,"z","y",s,n),d[u+1]=1-It(_,l,"y","z",s,t);break;case 1:_.set(-1,0,0),d[u+0]=1-It(_,l,"z","y",s,n),d[u+1]=1-It(_,l,"y","z",s,t);break;case 2:_.set(0,1,0),d[u+0]=1-It(_,l,"x","z",s,e),d[u+1]=It(_,l,"z","x",s,n);break;case 3:_.set(0,-1,0),d[u+0]=1-It(_,l,"x","z",s,e),d[u+1]=1-It(_,l,"z","x",s,n);break;case 4:_.set(0,0,1),d[u+0]=1-It(_,l,"x","y",s,e),d[u+1]=1-It(_,l,"y","x",s,t);break;case 5:_.set(0,0,-1),d[u+0]=It(_,l,"x","y",s,e),d[u+1]=1-It(_,l,"y","x",s,t);break}}}class Xu extends Gs{constructor(){super();const e=new on;e.deleteAttribute("uv");const t=new En({side:1}),n=new En,r=new Xs(16777215,900,28,2);r.position.set(.418,16.199,.3),this.add(r);const s=new et(e,t);s.position.set(-.757,13.219,.717),s.scale.set(31.713,28.305,28.591),this.add(s);const a=new et(e,n);a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),this.add(a);const o=new et(e,n);o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),this.add(o);const l=new et(e,n);l.position.set(6.167,.857,7.803),l.rotation.set(0,.561,0),l.scale.set(3.927,6.285,3.687),this.add(l);const h=new et(e,n);h.position.set(-2.017,.018,6.124),h.rotation.set(0,.333,0),h.scale.set(2.002,4.566,2.064),this.add(h);const f=new et(e,n);f.position.set(2.291,-.756,-2.621),f.rotation.set(0,-.286,0),f.scale.set(1.546,1.552,1.496),this.add(f);const c=new et(e,n);c.position.set(-2.193,-.369,-5.547),c.rotation.set(0,.516,0),c.scale.set(3.875,3.487,2.986),this.add(c);const d=new et(e,Xn(50));d.position.set(-16.116,14.37,8.208),d.scale.set(.1,2.428,2.739),this.add(d);const m=new et(e,Xn(50));m.position.set(-16.109,18.021,-8.207),m.scale.set(.1,2.425,2.751),this.add(m);const _=new et(e,Xn(17));_.position.set(14.904,12.198,-1.832),_.scale.set(.15,4.265,6.331),this.add(_);const S=new et(e,Xn(43));S.position.set(-.462,8.89,14.52),S.scale.set(4.38,5.441,.088),this.add(S);const p=new et(e,Xn(20));p.position.set(3.235,11.486,-12.541),p.scale.set(2.5,2,.1),this.add(p);const u=new et(e,Xn(100));u.position.set(0,20,0),u.scale.set(1,.1,1),this.add(u)}dispose(){const e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(const t of e)t.dispose()}}function Xn(i){const e=new pn;return e.color.setScalar(i),e}const Ys={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class qn{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const qu=new hr(-1,1,1,-1,0,1);class Yu extends Ut{constructor(){super(),this.setAttribute("position",new lt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new lt([0,2,0,0,2,0],2))}}const $u=new Yu;class wr{constructor(e){this._mesh=new et($u,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,qu)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Ku extends qn{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof vt?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=si.clone(e.uniforms),this.material=new vt({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new wr(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class $s extends qn{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const r=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}}class Zu extends qn{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class ju{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new Pe);this._width=n.width,this._height=n.height,t=new Dt(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:1016}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ku(Ys),this.copyPass.material.blending=0,this.clock=new ku}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let r=0,s=this.passes.length;r<s;r++){const a=this.passes[r];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}$s!==void 0&&(a instanceof $s?n=!0:a instanceof Zu&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new Pe);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Ju extends qn{constructor(e,t,n=null,r=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new ze}render(e,t,n){const r=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}}const Qu={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new ze(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class Yn extends qn{constructor(e,t,n,r){super(),this.strength=t!==void 0?t:1,this.radius=n,this.threshold=r,this.resolution=e!==void 0?new Pe(e.x,e.y):new Pe(256,256),this.clearColor=new ze(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Dt(s,a,{type:1016}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let c=0;c<this.nMips;c++){const d=new Dt(s,a,{type:1016});d.texture.name="UnrealBloomPass.h"+c,d.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(d);const m=new Dt(s,a,{type:1016});m.texture.name="UnrealBloomPass.v"+c,m.texture.generateMipmaps=!1,this.renderTargetsVertical.push(m),s=Math.round(s/2),a=Math.round(a/2)}const o=Qu;this.highPassUniforms=si.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new vt({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let c=0;c<this.nMips;c++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[c])),this.separableBlurMaterials[c].uniforms.invSize.value=new Pe(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const h=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=h,this.bloomTintColors=[new U(1,1,1),new U(1,1,1),new U(1,1,1),new U(1,1,1),new U(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const f=Ys;this.copyUniforms=si.clone(f.uniforms),this.blendMaterial=new vt({uniforms:this.copyUniforms,vertexShader:f.vertexShader,fragmentShader:f.fragmentShader,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new ze,this.oldClearAlpha=1,this.basic=new pn,this.fsQuad=new wr(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(n,r),this.renderTargetsVertical[s].setSize(n,r),this.separableBlurMaterials[s].uniforms.invSize.value=new Pe(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(e,t,n,r,s){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();const a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=Yn.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=Yn.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),o=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(n),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=a}getSeperableBlurMaterial(e){const t=[];for(let n=0;n<e;n++)t.push(.39894*Math.exp(-.5*n*n/(e*e))/e);return new vt({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new Pe(.5,.5)},direction:{value:new Pe(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new vt({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}Yn.BlurDirectionX=new Pe(1,0),Yn.BlurDirectionY=new Pe(0,1);const eh={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class th extends qn{constructor(){super();const e=eh;this.uniforms=si.clone(e.uniforms),this.material=new Ou({name:e.name,uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader}),this.fsQuad=new wr(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},Xe.getTransfer(this._outputColorSpace)===Je&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===7&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}const pt=2.7,Be=.12,Tn=i=>()=>{i|=0,i=i+1831565813|0;let e=Math.imul(i^i>>>15,1|i);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296},Cr=i=>i*i*(3-2*i),ci=i=>Math.min(1,Math.max(0,i)),nh=(i,e,t)=>i+(e-i)*t;function Qt(i,e,t,n=!0){const r=document.createElement("canvas");r.width=i,r.height=e,t(r.getContext("2d"),i,e);const s=new Bu(r);return s.wrapS=s.wrapT=1e3,s.anisotropy=8,n&&(s.colorSpace=At),s}const Ks=(i,e,t,n=32,r=2048)=>Qt(r,r,(s,a,o)=>{const l=Tn(t),h=o/n;for(let f=0;f<n;f++){let c=-l()*a*.4;for(;c<a;){const d=a*(.22+l()*.3),m=(l()-.5)*2*e;s.fillStyle=`rgb(${i[0]+m|0},${i[1]+m*.9|0},${i[2]+m*.8|0})`,s.fillRect(c,f*h,d,h);for(let _=0;_<22;_++){const S=f*h+l()*h;s.strokeStyle=l()<.55?`rgba(70,45,25,${.03+l()*.07})`:`rgba(255,240,215,${.03+l()*.06})`,s.lineWidth=.6+l()*1.6,s.beginPath(),s.moveTo(c,S),s.bezierCurveTo(c+d*.3,S+(l()-.5)*6,c+d*.6,S+(l()-.5)*6,c+d,S+(l()-.5)*4),s.stroke()}s.fillStyle="rgba(45,28,16,.5)",s.fillRect(c+d-1,f*h,2,h),c+=d}s.fillStyle="rgba(45,28,16,.45)",s.fillRect(0,f*h,a,2)}}),Pr=(i,e,t,n=9e3,r=256)=>Qt(r,r,(s,a,o)=>{const l=Tn(i);s.fillStyle=`rgb(${e},${e},${e})`,s.fillRect(0,0,a,o);for(let h=0;h<n;h++){const f=e+l()*(t-e)|0;s.fillStyle=`rgb(${f},${f},${f})`,s.fillRect(l()*a,l()*o,1+l()*2,1+l()*2)}},!1),Zs=(i,e,t,n=512,r=5)=>Qt(n,n,(s,a,o)=>{const l=Tn(r),h=a/t;for(let f=0;f<t;f++)for(let c=0;c<t;c++){const d=(l()-.5)*10;s.fillStyle=`rgb(${i[0]+d|0},${i[1]+d|0},${i[2]+d|0})`,s.fillRect(f*h,c*h,h,h)}s.strokeStyle=e,s.lineWidth=3;for(let f=0;f<=t;f++)s.beginPath(),s.moveTo(f*h,0),s.lineTo(f*h,o),s.moveTo(0,f*h),s.lineTo(a,f*h),s.stroke()}),ih=i=>Qt(1024,512,(e,t,n)=>{const r=Tn(i);e.fillStyle="#f1eee9",e.fillRect(0,0,t,n);for(let s=0;s<26;s++){e.strokeStyle=`rgba(120,115,110,${.05+r()*.16})`,e.lineWidth=.6+r()*2.4;let a=r()*t,o=r()*n;e.beginPath(),e.moveTo(a,o);for(let l=0;l<7;l++)a+=(r()-.3)*190,o+=(r()-.5)*110,e.lineTo(a,o);e.stroke()}}),rh=()=>Qt(1024,768,(i,e,t)=>{i.fillStyle="#e9e1d2",i.fillRect(0,0,e,t);const n=Tn(11);for(let r=0;r<16e3;r++)i.fillStyle=`rgba(${n()<.5?120:255},${n()<.5?100:250},${n()<.5?80:235},.07)`,i.fillRect(n()*e,n()*t,2,2);i.strokeStyle="#b9643c",i.lineWidth=10,i.strokeRect(46,46,e-92,t-92),i.strokeStyle="#2f4a45",i.lineWidth=4,i.strokeRect(74,74,e-148,t-148);for(let r=0;r<7;r++)for(let s=0;s<4;s++){const a=150+r*121,o=150+s*156,l=44;i.fillStyle=(r+s)%2?"#b9643c":"#2f4a45",i.beginPath(),i.moveTo(a,o-l),i.lineTo(a+l*.8,o),i.lineTo(a,o+l),i.lineTo(a-l*.8,o),i.closePath(),i.fill(),i.fillStyle="#e9e1d2",i.beginPath(),i.arc(a,o,9,0,7),i.fill()}}),sh=i=>Qt(512,640,(e,t,n)=>{const r=Tn(i),s=["#c2643f","#e3b27a","#3d5a52","#d9cdb8","#8a9a7e","#27323a"];e.fillStyle="#efe7d8",e.fillRect(0,0,t,n),e.fillStyle=s[(i+1)%6],e.beginPath(),e.arc(t*(.3+r()*.4),n*.32,t*.2,0,7),e.fill();for(let a=0;a<3;a++){e.fillStyle=s[(i+a*2)%6];const o=t*(.12+a*.26),l=t*.24,h=n*(.45+r()*.2);e.beginPath(),e.moveTo(o,n*.95),e.lineTo(o,h+l/2),e.arc(o+l/2,h+l/2,l/2,Math.PI,0),e.lineTo(o+l,n*.95),e.closePath(),e.fill()}e.strokeStyle=s[5],e.lineWidth=3,e.beginPath(),e.moveTo(t*.1,n*.8),e.bezierCurveTo(t*.35,n*(.6+r()*.2),t*.6,n*.95,t*.92,n*.7),e.stroke()}),Dr=Qt(256,256,(i,e,t)=>{for(const[n,r,s,a]of[[0,0,e*.2,0],[e,0,e*.8,0],[0,0,0,t*.2],[0,t,0,t*.8]]){const o=i.createLinearGradient(n,r,s,a);o.addColorStop(0,"rgba(0,0,0,.6)"),o.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=o,i.fillRect(0,0,e,t)}}),Lr=Qt(128,128,(i,e,t)=>{const n=i.createRadialGradient(e/2,t/2,0,e/2,t/2,e/2);n.addColorStop(0,"rgba(0,0,0,.6)"),n.addColorStop(.6,"rgba(0,0,0,.26)"),n.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=n,i.fillRect(0,0,e,t)});Dr.wrapS=Dr.wrapT=Lr.wrapS=Lr.wrapT=1001,window.Tour3D=function(i){const e=i.canvas,t=window.matchMedia&&matchMedia("(pointer: coarse)").matches,n=new Nu({canvas:e,antialias:!0,powerPreference:"high-performance"});n.shadowMap.enabled=!0,n.shadowMap.type=2,n.shadowMap.autoUpdate=!1,n.toneMapping=4;const r=new Gs,s=new Ct(55,1,.08,1500);r.environment=new gr(n).fromScene(new Xu,.03).texture;const a=(A,D={})=>new En({color:A,roughness:.8,...D}),o=Pr(3,150,255),l=Pr(7,90,255,16e3);l.repeat.set(6,6),o.repeat.set(3,3);const h=Ks([186,148,104],16,21),f=Ks([150,132,112],12,33,20,1024),c={floor:a(16777215,{map:h,roughness:.5}),deck:a(16777215,{map:f,roughness:.75}),wall:a(15920612,{roughness:.92,bumpMap:o,bumpScale:.25}),sage:a(9345925,{roughness:.95}),clay:a(13209452,{roughness:.95}),ceil:a(16250094,{roughness:.95,transparent:!0}),oak:a(12160350,{roughness:.55}),walnut:a(6965811,{roughness:.5}),white:a(16052714,{roughness:.4}),black:a(1776670,{roughness:.45,metalness:.6}),brass:a(13214298,{roughness:.3,metalness:.9}),steel:a(11975616,{roughness:.32,metalness:.85}),sand:a(14273976,{roughness:.95,bumpMap:l,bumpScale:.6}),cream:a(15722457,{roughness:.95,bumpMap:l,bumpScale:.6}),terra:a(12085829,{roughness:.95,bumpMap:l,bumpScale:.6}),deep:a(3493962,{roughness:.95,bumpMap:l,bumpScale:.6}),grey:a(10132116,{roughness:.95,bumpMap:l,bumpScale:.6}),linen:a(16184042,{roughness:.9,bumpMap:l,bumpScale:.35}),marble:a(16777215,{map:ih(4),roughness:.22}),tile:a(16777215,{map:Zs([222,214,202],"rgba(150,140,128,.7)",4),roughness:.35}),stone:a(16777215,{map:Zs([196,188,176],"rgba(120,112,100,.6)",2,512,9),roughness:.55}),leaf:a(4156229,{roughness:.7,side:2}),leaf2:a(5931090,{roughness:.7,side:2}),pot:a(14208445,{roughness:.7}),potT:a(11888447,{roughness:.8}),glass:new En({color:13625070,roughness:.04,metalness:.1,transparent:!0,opacity:.13,depthWrite:!1}),sheer:new En({color:16777215,roughness:1,transparent:!0,opacity:.5,side:2,depthWrite:!1}),mirror:a(16777215,{roughness:.12,metalness:.25,map:Qt(64,256,(A,D,O)=>{const q=A.createLinearGradient(0,0,D,O);q.addColorStop(0,"#f4f7f8"),q.addColorStop(.5,"#c9d6da"),q.addColorStop(1,"#93a6ad"),A.fillStyle=q,A.fillRect(0,0,D,O)})}),dark:a(2369323,{roughness:.35}),rug:a(16777215,{map:rh(),roughness:1}),shade:new En({color:15984335,roughness:.9,emissive:16763274,emissiveIntensity:0}),concrete:a(13617340,{roughness:.95}),beach:a(14864294,{roughness:1}),land:a(5204556,{roughness:1})};c.rug.map.wrapS=c.rug.map.wrapT=1001;const d=new pn({map:Dr,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),m=new pn({map:Lr,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),_=new Gt,S=new Gt;r.add(_,S);const p=(A,D,O,q,Q,re=_,R=!0)=>{const K=new et(A,D);return K.position.set(O,q,Q),K.castShadow=R,K.receiveShadow=!0,re.add(K),K},u=(A,D,O,q,Q,re,R,K,z)=>p(new on(A,D,O),q,Q,re,R,K,z),y=(A,D,O,q,Q,re,R,K,z,X)=>p(new Wu(A,D,O,3,Math.min(q,A/2-.002,D/2-.002,O/2-.002)),Q,re,R,K,z,X),E=(A,D,O,q,Q,re,R,K,z=28,X)=>p(new Er(A,D,O,z),q,Q,re,R,K,X),M=(A,D,O,q,Q,re)=>p(new Wn(A,20,14),D,O,q,Q,re);function B(A,D,O,q,Q,re,R,K=!1,z=_){const X=new cn(O-A,q-D);X.rotateX(K?Math.PI/2:-Math.PI/2),X.translate((A+O)/2,Q,(D+q)/2);const ae=X.attributes.position,se=X.attributes.uv;for(let Ve=0;Ve<ae.count;Ve++)se.setXY(Ve,R?ae.getX(Ve)/R:(ae.getX(Ve)-A)/(O-A),R?ae.getZ(Ve)/R:(ae.getZ(Ve)-D)/(q-D));const Se=new et(X,re);return Se.receiveShadow=!!R,z.add(Se),Se}const w=(A,D,O,q,Q=.012)=>{const re=B(A-O/2,D-q/2,A+O/2,D+q/2,Q,m,0);return re.renderOrder=2,re};function C(A,D,O,q,Q=[],re=c.wall,R=pt){const K=(X,ae,se,Se)=>{ae-X<.005||Se-se<.005||(A==="x"?u(ae-X,Se-se,Be,re,(X+ae)/2,(se+Se)/2,D):u(Be,Se-se,ae-X,re,D,(se+Se)/2,(X+ae)/2))};let z=O;for(const[X,ae,se=0,Se=2.1]of[...Q].sort((Ve,at)=>Ve[0]-at[0]))K(z,X,0,R),K(X,ae,0,se),K(X,ae,Se,R),z=ae;K(z,q,0,R)}function L(A,D,O,q,Q,re){const R=(O-D)/re;for(let K=0;K<=re;K++)u(.045,q,.06,c.black,D+K*R,q/2,A);u(O-D,.05,.06,c.black,(D+O)/2,q-.025,A),u(O-D,.03,.07,c.black,(D+O)/2,.015,A);for(let K=0;K<re;K++){const z=D+K*R,X=z+R;Q&&z>=Q[0]-.01&&X<=Q[1]+.01||u(R-.05,q-.08,.012,c.glass,(z+X)/2,q/2,A,_,!1)}}function T(A,D,O,q){const Q=new cn(O,q,40,1),re=Q.attributes.position;for(let R=0;R<re.count;R++)re.setZ(R,Math.sin(re.getX(R)/O*34)*.035);Q.computeVertexNormals(),p(Q,c.sheer,A,q/2+.02,D,_,!1),u(O+.1,.03,.03,c.black,A,q+.04,D)}const v=(A,D,O,q,Q,re,R)=>{const K=new Gt;K.position.set(q,Q,re),K.rotation.y=R,_.add(K),u(D+.05,O+.05,.03,c.oak,0,0,0,K),p(new cn(D,O),a(16777215,{map:sh(A),roughness:.9}),0,0,.017,K,!1)};function P(A,D,O,q=13,Q=1,re=.19){const R=Tn(Q),K=new Gt;K.position.set(A,0,D),_.add(K),E(re,re*.78,re*2,c.pot,0,re,0,K),E(re*.92,re*.92,.02,c.walnut,0,re*2-.005,0,K);for(let z=0;z<q;z++){const X=O*(.55+R()*.45),ae=.9+R()*1.1,se=.11+R()*.06,Se=9,Ve=[],at=[];for(let mt=0;mt<=Se;mt++){const ft=mt/Se,ui=ft*ae,Vt=X*Math.sin(ui)/ae,yn=X*(1-Math.cos(ui))/ae,hi=se*Math.pow(Math.sin(Math.PI*Math.min(.97,ft*.9+.08)),.7);Ve.push(-hi,Vt,yn,0,Vt+.012,yn,hi,Vt,yn)}for(let mt=0;mt<Se;mt++){const ft=mt*3;at.push(ft,ft+1,ft+3,ft+1,ft+4,ft+3,ft+1,ft+2,ft+4,ft+2,ft+5,ft+4)}const qe=new Ut;qe.setAttribute("position",new lt(Ve,3)),qe.setIndex(at),qe.computeVertexNormals();const St=p(qe,R()<.5?c.leaf:c.leaf2,0,re*2-.02,0,K);St.rotation.y=z/q*Math.PI*2+R()*.5,St.rotation.order="YXZ",St.rotation.x=.1+R()*.45}w(A,D,re*5,re*5)}const H=(A,D,O,q,Q=_)=>{for(const[re,R,K,z]of[[0,0,0,1],[.6,.25,.2,.7],[-.5,.3,-.3,.75],[.1,.6,.3,.6]])p(new yr(q*z,1),c.leaf2,A+re*q,D+R*q,O+K*q,Q)},V=[],Y=(A,D,O,q,Q="lamp",re=7,R=16763274)=>{const K=new Xs(R,0,re,1.8);return K.position.set(A,D,O),r.add(K),V.push([K,q,Q]),K};function te(A,D,O,q=c.sand){const Q=new Gt;Q.position.set(A,0,D),Q.rotation.y=O,_.add(Q),y(.46,.07,.46,.03,q,0,.46,0,Q),y(.46,.42,.06,.03,q,0,.74,-.21,Q).rotation.x=-.12;for(const[re,R]of[[-.19,-.19],[.19,-.19],[-.19,.19],[.19,.19]])E(.016,.013,.44,c.oak,re,.22,R,Q,8);w(A,D,.75,.75)}function Z(A,D){E(.18,.18,.05,c.walnut,A,.68,D);for(let O=0;O<4;O++){const q=O*Math.PI/2+.8;E(.013,.013,.68,c.black,A+Math.cos(q)*.14,.34,D+Math.sin(q)*.14,_,6)}E(.15,.15,.012,c.black,A,.24,D,_,20),w(A,D,.55,.55)}function le(A,D,O,q=.17){E(.004,.004,pt-O-.1,c.black,A,(pt+O)/2+.05,D,_,6,!1);const Q=p(new Wn(q,24,14,0,Math.PI*2,0,Math.PI*.62),c.shade,A,O,D,_,!1);Q.material.side=2}B(0,0,10,7,0,c.floor,4.48),B(6.2+Be/2,4.2+Be/2,8.6-Be/2,7,.004,c.tile,1.2),B(0,-2.2,10,0,-.02,c.deck,2.8);for(const[A,D,O,q]of[[0,0,6.2,7],[6.2,0,10,4.2],[6.2,4.2,8.6,7]])B(A+Be/2,D+Be/2,O-Be/2,q-Be/2,.008,d,0).renderOrder=1,B(A+Be/2,D+Be/2,O-Be/2,q-Be/2,pt-.006,d,0,!0,S).renderOrder=1;u(10.4,.25,9.6,c.concrete,5,-.18,2.4),C("x",7,0,10,[[4.7,5.6,0,2.08]]),C("z",0,0,7),C("z",10,0,7),C("x",0,0,10,[[.3,5.9,0,2.5],[6.5,9.7,0,2.5]]),C("z",6.2,0,7,[[3.25,4.1,0,2.08]]),C("x",4.2,6.2,10,[[6.7,7.55,0,2.08]]),C("z",8.6,4.2,7),L(0,.3,5.9,2.5,[3.1,4.5],4),L(0,6.5,9.7,2.5,[6.5,7.57],3),u(.9,2.08,.045,c.walnut,5.15,1.04,6.97),M(.025,c.brass,4.83,1,6.93),u(.04,2.06,.82,c.oak,6.2+Be/2+.05,1.03,2.82).rotation.y=.05;for(const[A,D,O,q]of[[6.26,6.7,0,pt],[6.7,7.55,2.08,pt],[7.55,9.94,0,pt]])u(D-A,q-O,.02,c.sage,(A+D)/2,(O+q)/2,4.2-Be/2-.011);u(.02,pt,4,c.sage,10-Be/2-.011,pt/2,2.1),u(.02,pt,2.6,c.clay,Be/2+.011,pt/2,2.2);for(const[A,D,O,q]of[[5,3.5,10.2,7.2]])u(O,.2,q,c.ceil,A,pt+.1,D,S);u(10.2,.2,2.3,c.ceil,5,pt+.1,-1.1,S),T(.75,.11,.8,2.45),T(5.5,.11,.75,2.45),T(9.3,.11,.75,2.45),u(Be,pt,2.2,c.wall,.06,pt/2,-1.1),u(Be,pt,2.2,c.wall,9.94,pt/2,-1.1),u(9.76,1,.014,c.glass,5,.52,-2.17,_,!1),u(9.8,.04,.06,c.black,5,1.05,-2.17);for(let A=0;A<=8;A++)u(.03,1.05,.03,c.black,.12+A*1.22,.525,-2.17);for(const A of[8,9.15]){const D=new Gt;D.position.set(A,0,-1.15),D.rotation.y=.12*(A<8.5?1:-1),_.add(D),y(.66,.1,1.5,.04,c.cream,0,.34,0,D);const O=y(.66,.1,.7,.04,c.cream,0,.6,.86,D);O.rotation.x=-.9,u(.7,.05,1.56,c.oak,0,.26,0,D);for(const[q,Q]of[[-.3,-.7],[.3,-.7],[-.3,.7],[.3,.7]])u(.04,.26,.04,c.oak,q,.13,Q,D);y(.4,.1,.3,.05,c.terra,0,.52,.45,D)}E(.24,.24,.03,c.oak,8.58,.42,-1.5),E(.02,.14,.42,c.black,8.58,.21,-1.5),E(.04,.035,.12,c.glass,8.5,.5,-1.45,_,12,!1),P(.55,-1.6,1.25,12,5,.22),P(9.45,-.45,.8,9,8,.16),E(.3,.3,.03,c.oak,2,.7,-1.2),E(.025,.2,.7,c.black,2,.35,-1.2),te(1.35,-1.2,Math.PI/2+.3,c.deep),te(2.65,-1.25,-Math.PI/2-.3,c.deep);for(let A=0;A<6;A++){const D=1.15+A*.6;y(.585,.82,.58,.01,A===3?c.dark:c.white,D,.47,6.63),A!==3&&u(.16,.012,.012,c.brass,D,.78,6.335)}u(3.62,.04,.64,c.marble,2.65,.9,6.61),u(3.6,.07,.56,c.dark,2.65,.035,6.65),y(.75,2.05,.66,.02,c.steel,.47,1.03,6.6),u(.02,.9,.03,c.black,.5,1.2,6.25);for(let A=0;A<6;A++)y(.585,.62,.34,.01,c.oak,1.15+A*.6,1.95,6.76);u(3.6,.72,.02,c.tile,2.65,1.28,6.925),u(.58,.012,.5,c.dark,2.95,.925,6.6),u(.5,.01,.38,c.steel,1.75,.921,6.6),E(.012,.012,.28,c.brass,1.75,1.06,6.83,_,10);{const A=E(.01,.01,.16,c.brass,1.75,1.2,6.76,_,10);A.rotation.x=Math.PI/2}E(.06,.05,.2,c.potT,3.9,1.02,6.7),H(3.9,1.2,6.7,.1),E(.09,.09,.02,c.oak,1.25,.93,6.6);for(const A of[-.03,.04])M(.035,a(14256430),1.25+A,.975,6.6+A);y(2.3,.86,.8,.012,c.walnut,2.45,.45,4.95),u(2.5,.045,.98,c.marble,2.45,.905,4.9),w(2.45,4.95,3,1.5),Z(1.75,4.3),Z(2.45,4.3),Z(3.15,4.3),le(1.95,4.9,1.85),le(2.95,4.9,1.85),Y(1.95,1.72,4.9,3.5),Y(2.95,1.72,4.9,3.5),E(.11,.07,.07,c.pot,2.9,.965,4.95);for(const[A,D,O]of[[0,0,14256430],[.05,.03,13127726],[-.04,.04,14725184]])M(.036,a(O),2.9+A,1.01,4.95+D);E(.045,.06,.24,a(4020818,{roughness:.3}),1.8,1.05,5),H(1.8,1.26,5,.11),E(.62,.62,.04,c.oak,1.35,.74,2.2,_,48),E(.05,.05,.7,c.oak,1.35,.37,2.2),E(.3,.34,.03,c.oak,1.35,.015,2.2),w(1.35,2.2,1.9,1.9);for(let A=0;A<4;A++){const D=A*Math.PI/2+Math.PI/4;te(1.35+Math.cos(D)*.78,2.2+Math.sin(D)*.78,-D-Math.PI/2,A%2?c.sand:c.deep)}le(1.35,2.2,1.7,.26),Y(1.35,1.55,2.2,4.5),E(.07,.05,.2,c.potT,1.35,.86,2.2),H(1.35,1.03,2.2,.1),v(2,.7,.9,Be/2+.04,1.55,1.7,Math.PI/2),v(5,.7,.9,Be/2+.04,1.55,2.7,Math.PI/2),B(2.7,.5,5.45,3.15,.011,c.rug,0),y(.95,.3,2.5,.06,c.sand,5.55,.25,1.8),y(.3,.52,2.5,.08,c.sand,5.93,.6,1.8);for(const A of[.62,2.98])y(.95,.42,.22,.07,c.sand,5.55,.5,A);for(const A of[1.02,1.8,2.58]){y(.74,.16,.74,.06,c.cream,5.46,.47,A);const D=y(.2,.44,.7,.08,c.cream,5.78,.72,A);D.rotation.z=-.16}for(const[A,D,O]of[[.95,c.terra,.3],[1.35,c.deep,-.2],[2.7,c.terra,-.3]])y(.14,.38,.4,.07,D,5.62,.74,A).rotation.set(O*.4,O,-.3);w(5.6,1.8,1.7,3.1),E(.5,.5,.035,c.walnut,4.25,.36,1.8,_,48);for(let A=0;A<3;A++){const D=A*2.094+.4;E(.015,.015,.36,c.black,4.25+Math.cos(D)*.33,.18,1.8+Math.sin(D)*.33,_,8).rotation.set(Math.sin(D)*.12,0,-Math.cos(D)*.12)}w(4.25,1.8,1.4,1.4),u(.3,.03,.22,c.deep,4.15,.395,1.9),u(.26,.025,.2,c.terra,4.16,.42,1.9),E(.05,.07,.2,c.pot,4.45,.48,1.65),H(4.45,.66,1.65,.09);{const A=new Gt;A.position.set(3.15,0,1),A.rotation.y=.75,_.add(A),y(.72,.16,.7,.07,c.terra,0,.4,0,A);const D=y(.72,.5,.16,.08,c.terra,0,.68,-.3,A);D.rotation.x=-.2;for(const O of[-.36,.36])y(.07,.24,.66,.03,c.oak,O,.5,0,A);for(const[O,q]of[[-.3,-.27],[.3,-.27],[-.3,.27],[.3,.27]])E(.018,.014,.33,c.oak,O,.165,q,A,8);w(3.15,1,1.1,1.1)}E(.012,.012,1.5,c.brass,5.8,.76,.42,_,8),E(.14,.14,.02,c.brass,5.8,.01,.42),E(.13,.19,.26,c.shade,5.8,1.6,.42,_,28,!1),Y(5.8,1.5,.42,4.5),P(.62,.62,1.7,15,3,.24),v(8,.95,1.2,6.2-Be/2-.04,1.6,1.8,-Math.PI/2),y(1.5,.5,.4,.01,c.walnut,5.9,.33,5.6).rotation.y=Math.PI/2,E(.3,.3,.02,c.mirror,6.2-Be/2-.025,1.55,5.6,_,40).rotation.z=Math.PI/2,E(.32,.32,.015,c.brass,6.2-Be/2-.015,1.55,5.6,_,40).rotation.z=Math.PI/2,E(.06,.08,.28,c.pot,5.9,.72,5.2),H(5.9,.97,5.2,.13),u(.22,.05,.3,c.sage,5.9,.605,5.9),Y(3.6,2,3.6,5,"lamp",9),Y(3.6,1.4,1.6,2.2,"sun",9,16769725),Y(2.6,2.2,5.4,1.6,"sun",8,16773340),B(7.2,.7,9.7,3.3,.011,a(14207926,{roughness:1,bumpMap:l,bumpScale:.8}),0),y(2.1,.22,1.9,.03,c.walnut,8.85,.2,2),y(2,.24,1.8,.08,c.linen,8.85,.42,2),y(1.45,.1,1.86,.05,c.linen,8.55,.56,2),y(.1,1.05,2.1,.04,c.deep,9.86,.7,2);for(const A of[1.55,2.45])y(.42,.16,.66,.08,c.linen,9.55,.64,A).rotation.z=.35,y(.34,.14,.5,.07,c.terra,9.38,.62,A).rotation.z=.3;y(.5,.06,1.9,.03,c.terra,8.05,.6,2),w(8.85,2,2.9,2.6);for(const A of[.72,3.28])y(.42,.44,.42,.02,c.oak,9.68,.24,A),E(.05,.07,.2,c.pot,9.7,.56,A),E(.1,.14,.18,c.shade,9.7,.78,A,_,24,!1),Y(9.62,.85,A,2.6,"lamp",5);v(11,1.3,.8,10-Be/2-.05,1.75,2,-Math.PI/2);for(let A=0;A<3;A++)y(.42,2.3,.04,.01,c.oak,8.9+A*.44,1.17,4.2-Be/2-.035),u(.012,.3,.02,c.brass,9.07+A*.44-(A===2?.34:0),1.1,4.2-Be/2-.06);y(1.1,.42,.42,.04,c.cream,7,.23,2.5).rotation.y=Math.PI/2,P(9.55,.5,1.1,10,12,.17),Y(8,2,2.1,4,"lamp",8),Y(8,1.4,1.3,1.8,"sun",8,16769725),y(.5,.2,1.3,.01,c.walnut,6.2+Be/2+.26,.74,5.65),u(.54,.03,1.34,c.marble,6.2+Be/2+.27,.855,5.65),y(.36,.11,.5,.04,c.white,6.2+Be/2+.27,.92,5.65),E(.011,.011,.2,c.brass,6.2+Be/2+.07,.99,5.65,_,10),E(.4,.4,.014,c.mirror,6.2+Be/2+.02,1.6,5.65,_,44).rotation.z=Math.PI/2,E(.43,.43,.008,c.shade,6.2+Be/2+.01,1.6,5.65,_,44,!1).rotation.z=Math.PI/2,u(.012,2.05,.95,c.glass,7.55,1.03,6.5,_,!1),u(.03,2.05,.03,c.brass,7.55,1.03,6.02),B(7.56,6,8.6-Be/2,7-Be/2,.006,c.stone,.9),E(.09,.09,.012,c.brass,8.1,2.15,6.55),E(.008,.008,.3,c.brass,8.1,2.3,6.55,_,8),y(.38,.4,.56,.08,c.white,8.28,.21,4.75),y(.4,.04,.46,.02,c.white,8.28,.43,4.72),y(.36,.42,.16,.04,c.white,8.28,.6,4.36),u(.02,.02,.5,c.brass,8.6-Be/2-.05,1.2,5.5),u(.04,.55,.42,c.cream,8.6-Be/2-.05,.93,5.5),E(.07,.06,.16,c.potT,6.2+Be/2+.27,.95,6.15),H(6.2+Be/2+.27,1.1,6.15,.09),B(6.95,4.75,7.45,5.75,.012,a(13220255,{roughness:1,bumpMap:l,bumpScale:.8}),0),y(.3,.1,.2,.03,c.cream,6.2+Be/2+.3,.92,5.1),E(.03,.03,.14,c.dark,6.2+Be/2+.16,.94,6,_,12),Y(7.4,2.4,5.5,5,"both",7,16770760),u(10.6,30,7.7,c.concrete,5,-15.3,3.6);for(let A=1;A<=3;A++)u(10.2,.2,2.3,c.concrete,5,-.12-A*3,-1.1);B(-400,-40,400,-12,-30.2,c.beach,0).receiveShadow=!1,B(-400,-12,400,300,-30.1,c.land,0).receiveShadow=!1;const $=Pr(17,60,255,5e3,256);$.repeat.set(70,70);const de=B(-700,-900,700,-36,-30.4,new En({color:1929090,roughness:.22,metalness:.15,bumpMap:$,bumpScale:2.2}),0);de.receiveShadow=!1;{const A=new cn(1400,6,60,1);A.rotateX(-Math.PI/2);const D=A.attributes.position;for(let q=0;q<D.count;q++)D.setZ(q,D.getZ(q)+Math.sin(D.getX(q)*.05)*1.6);const O=new et(A,new pn({color:16777215,transparent:!0,opacity:.55}));O.position.set(0,-30.3,-38),r.add(O)}for(const[A,D,O,q]of[[-420,-700,380,46],[-250,-760,260,30],[520,-820,420,38]]){const Q=p(new Wn(1,24,12,0,Math.PI*2,0,Math.PI/2),a(4282716,{roughness:1}),A,-31,D,r,!1);Q.scale.set(O,q,O*.5),Q.receiveShadow=!1}const pe={top:{value:new ze},hor:{value:new ze},sunDir:{value:new U},sunCol:{value:new ze},glow:{value:1}};r.add(new et(new Wn(1200,32,20),new vt({side:1,depthWrite:!1,uniforms:pe,vertexShader:"varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",fragmentShader:"uniform vec3 top, hor, sunDir, sunCol; uniform float glow; varying vec3 d; void main(){ vec3 n = normalize(d); float h = max(n.y, 0.0); vec3 c = mix(hor, top, pow(h, 0.45)); float s = max(dot(n, sunDir), 0.0); c += sunCol * (pow(s, 1400.0) * 9.0 + pow(s, 90.0) * 0.35 * glow + pow(s, 8.0) * 0.12 * glow); if (n.y < 0.0) c = mix(c, hor * 0.7, min(1.0, -n.y * 6.0)); gl_FragColor = vec4(c, 1.0); }"})));const _e=new Hu(16777215,1);_e.castShadow=!0,_e.shadow.mapSize.set(t?2048:4096,t?2048:4096),Object.assign(_e.shadow.camera,{left:-8.5,right:8.5,top:8.5,bottom:-8.5,near:5,far:70}),_e.shadow.bias=-4e-4,_e.shadow.normalBias=.025,_e.shadow.radius=5,_e.target.position.set(5,0,2.5),r.add(_e,_e.target);const Ie=new zu(16777215,16777215,1);r.add(Ie);const Ce=A=>new ze(A),J=[{t:0,el:30,az:-24,sun:Ce(16774114),sunK:3.4,top:Ce(3111120),hor:Ce(12573936),sunC:Ce(16774886),glow:.45,hemS:Ce(14674687),hemG:Ce(12165507),hemK:.5,env:.3,lampK:0,fillK:1,exp:.86,sea:Ce(2064278)},{t:.55,el:8,az:-40,sun:Ce(16756838),sunK:3.6,top:Ce(3956646),hor:Ce(16102524),sunC:Ce(16751182),glow:.9,hemS:Ce(15120534),hemG:Ce(11108442),hemK:.36,env:.22,lampK:.3,fillK:1.1,exp:.9,sea:Ce(3107460)},{t:1,el:26,az:30,sun:Ce(10336511),sunK:.35,top:Ce(462111),hor:Ce(1845834),sunC:Ce(12900095),glow:.35,hemS:Ce(4214906),hemG:Ce(2761758),hemK:.12,env:.05,lampK:1,fillK:0,exp:1,sea:Ce(729136)}];let oe=.42,xe=.42,ue=0;function we(A){let D=0;for(;D<J.length-2&&A>J[D+1].t;)D++;const O=J[D],q=J[D+1],Q=Cr(ci((A-O.t)/(q.t-O.t))),re=se=>nh(O[se],q[se],Q),R=se=>O[se].clone().lerp(q[se],Q),K=re("el")*Math.PI/180,z=re("az")*Math.PI/180,X=new U(Math.sin(z)*Math.cos(K),Math.sin(K),-Math.cos(z)*Math.cos(K));_e.position.copy(_e.target.position).addScaledVector(X,38),_e.color.copy(R("sun")),_e.intensity=re("sunK"),pe.top.value.copy(R("top")),pe.hor.value.copy(R("hor")),pe.sunDir.value.copy(X),pe.sunCol.value.copy(R("sunC")),pe.glow.value=re("glow"),Ie.color.copy(R("hemS")),Ie.groundColor.copy(R("hemG")),Ie.intensity=re("hemK"),r.environmentIntensity=re("env"),n.toneMappingExposure=re("exp"),de.material.color.copy(R("sea")),ue=re("lampK");const ae=re("fillK");c.shade.emissiveIntensity=.05+1.5*ue;for(const[se,Se,Ve]of V)se.intensity=Se*(Ve==="lamp"?ue:Ve==="sun"?ae:.55+.45*ue);n.shadowMap.needsUpdate=!0}const De=[[0,[5.25,1.5,6.3],[2.7,1.15,0],58],[30,[4.55,1.52,4.7],[2,.95,5.75],58],[60,[3.85,1.5,3.7],[4.9,.85,.7],58],[82,[3.8,1.5,1.5],[3.7,1.25,-6],56],[102,[3.8,1.5,-1.15],[2.6,.7,-30],56],[124,[5.2,1.5,-1.3],[9.2,1,-1.35],56],[142,[7,1.5,.1],[8.9,.9,2.2],58],[162,[7.2,1.5,1.75],[9.3,.85,2.2],58],[180,[7.12,1.5,3.2],[7.1,1.1,6.4],62],[198,[7.5,1.55,4.5],[6.85,1,6.2],72],[216,[7,5.2,6.8],[6,.4,3.4],52],[240,[5,13.2,11.6],[5,0,2.7],40]],Le=De.map(A=>[...A[1],...A[2],A[3]]),Ye=De.map(A=>A[0]),ke=Le.map((A,D)=>A.map((O,q)=>{if(D===0||D===Le.length-1)return 0;const Q=Ye[D]-Ye[D-1],re=Ye[D+1]-Ye[D];return((A[q]-Le[D-1][q])/Q*re+(Le[D+1][q]-A[q])/re*Q)/(Q+re)})),st=A=>{A=Math.min(240,Math.max(0,A));let D=0;for(;D<Ye.length-2&&A>Ye[D+1];)D++;const O=Ye[D+1]-Ye[D],q=(A-Ye[D])/O,Q=q*q,re=Q*q,R=2*re-3*Q+1,K=(re-2*Q+q)*O,z=-2*re+3*Q,X=(re-Q)*O;return Le[D].map((ae,se)=>R*Le[D][se]+K*ke[D][se]+z*Le[D+1][se]+X*ke[D+1][se])},I=[];for(let A=0;A<=960;A++){const D=A/4,O=[0,0,0,0,0,0,0];let q=0;for(let Q=-8;Q<=8;Q++){const re=Math.exp(-(Q*Q)/22),R=st(D+Q*.7);for(let K=0;K<7;K++)O[K]+=re*R[K];q+=re}I.push(O.map(Q=>Q/q))}const yt=A=>{const D=Math.min(959.999,Math.max(0,A*4)),O=Math.floor(D),q=D-O;return I[O].map((Q,re)=>Q+(I[O+1][re]-Q)*q)},Fe=new ju(n,new Dt(4,4,{samples:4,type:1016})),He=new Yn(new Pe(256,256),.14,.6,1);Fe.addPass(new Ju(r,s)),Fe.addPass(He),Fe.addPass(new th);let be=1,$e=1,Re=1,b=0,g=0,G=0,ee=!1,ne=!0,j=!0;function Me(){const A=e.getBoundingClientRect();be=Math.max(1,A.width),$e=Math.max(1,A.height),Re=Math.min(window.devicePixelRatio||1,t?1.6:2)*(g>1?.7:1),n.setPixelRatio(Re),n.setSize(be,$e,!1),Fe.setPixelRatio(Re),Fe.setSize(be,$e),s.aspect=be/$e}const he=i.fixed!=null?i.fixed:null,ge=()=>{const A=i.section.getBoundingClientRect(),D=A.height-innerHeight;return D>0?ci(-A.top/D):0};function We(){const A=yt(b),D=be<$e*.95,O=D?1+.22*Cr(ci((A[1]-3)/8)):1;s.position.set(A[3]+(A[0]-A[3])*O,A[4]+(A[1]-A[4])*O,A[5]+(A[2]-A[5])*O),s.lookAt(A[3],A[4],A[5]),s.fov=D?Math.min(84,2*Math.atan(Math.tan(A[6]*.93*Math.PI/360)/s.aspect)*180/Math.PI):A[6],s.updateProjectionMatrix();const q=1-Cr(ci((A[1]-2.35)/.9));return c.ceil.opacity=q,S.visible=q>.01,D}function ie(A){if(ee||(requestAnimationFrame(ie),!ne&&!j))return;const D=Math.min(.1,(A-G)/1e3||.016);G=A,Math.abs(xe-oe)>5e-4&&(oe+=(xe-oe)*Math.min(1,D*3.5),we(oe));const O=he!=null?he/240:ge(),q=O*240;b=he!=null||j||Math.abs(q-b)<.01?q:b+(q-b)*Math.min(1,D*6.5);const Q=We();if($.offset.set(A*4e-6,A*7e-6),Fe.render(),i.once&&(ie.shots=(ie.shots||0)+1)>=3){ee=!0,i.onLoad&&i.onLoad(1);return}j?(j=!1,i.onLoad&&i.onLoad(1)):g<2&&he==null&&(ie.n=(ie.n||0)+1,ie.sum=(ie.sum||0)+D,ie.n===50&&(ie.sum/50>.045&&(g++,g===1&&(He.enabled=!1),Me()),ie.n=ie.sum=0)),i.onUpdate&&i.onUpdate({frame:b,progress:O,portrait:Q,width:be,height:$e,anchors:{},place:(re,R)=>[re*be,R*$e]})}window.IntersectionObserver&&new IntersectionObserver(A=>{ne=A[0].isIntersecting}).observe(e);let ve=0;return addEventListener("resize",()=>{clearTimeout(ve),ve=setTimeout(Me,120)}),i.time!=null&&(oe=xe=i.time),Me(),we(oe),requestAnimationFrame(ie),{setTime(A){xe=ci(A)},destroy(){ee=!0},render(A,D){ee=!0,D!=null&&(oe=xe=D,we(D)),b=A,We(),$.offset.set(A*4e-4,A*7e-4),Fe.render()}}}})();
