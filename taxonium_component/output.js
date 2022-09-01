import React$1, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { View, OrthographicView, OrthographicController } from '@deck.gl/core';
import { LineLayer, PolygonLayer, SolidPolygonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import '@fontsource/roboto';
import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view';
import { ClipLoader } from 'react-spinners';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { BiMoveVertical, BiMoveHorizontal, BiCamera, BiZoomIn, BiZoomOut, BiPalette } from 'react-icons/bi';
import { TiCog, TiZoom } from 'react-icons/ti';
import Modal from 'react-modal';
import { DebounceInput } from 'react-debounce-input';
import classNames from 'classnames';
import { FaSearch, FaLink, FaTrash, FaShare } from 'react-icons/fa';
import { RiAddCircleLine, RiArrowLeftUpLine } from 'react-icons/ri';
import { BsQuestionCircle, BsBoxArrowInUpRight } from 'react-icons/bs';
import { MdArrowForward, MdArrowDownward, MdArrowBack, MdArrowUpward } from 'react-icons/md';
import ReactTooltip from 'react-tooltip';
import scale from 'scale-color-perceptual';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = "/*! tailwindcss v3.1.0 | MIT License | https://tailwindcss.com*/*,:after,:before{border:0 solid #e5e7eb;box-sizing:border-box}:after,:before{--tw-content:\"\"}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;line-height:1.5;tab-size:4}body{line-height:inherit;margin:0}hr{border-top-width:1px;color:inherit;height:0}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:initial}sub{bottom:-.25em}sup{top:-.5em}table{border-collapse:collapse;border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{color:inherit;font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:initial;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:initial}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}[multiple],[type=date],[type=datetime-local],[type=email],[type=month],[type=number],[type=password],[type=search],[type=tel],[type=text],[type=time],[type=url],[type=week],select,textarea{--tw-shadow:0 0 #0000;appearance:none;background-color:#fff;border-color:#6b7280;border-radius:0;border-width:1px;font-size:1rem;line-height:1.5rem;padding:.5rem .75rem}[multiple]:focus,[type=date]:focus,[type=datetime-local]:focus,[type=email]:focus,[type=month]:focus,[type=number]:focus,[type=password]:focus,[type=search]:focus,[type=tel]:focus,[type=text]:focus,[type=time]:focus,[type=url]:focus,[type=week]:focus,select:focus,textarea:focus{--tw-ring-inset:var(--tw-empty,/*!*/ /*!*/);--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:#2563eb;--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);border-color:#2563eb;box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow);outline:2px solid #0000;outline-offset:2px}input::placeholder,textarea::placeholder{color:#6b7280;opacity:1}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-date-and-time-value{min-height:1.5em}::-webkit-datetime-edit,::-webkit-datetime-edit-day-field,::-webkit-datetime-edit-hour-field,::-webkit-datetime-edit-meridiem-field,::-webkit-datetime-edit-millisecond-field,::-webkit-datetime-edit-minute-field,::-webkit-datetime-edit-month-field,::-webkit-datetime-edit-second-field,::-webkit-datetime-edit-year-field{padding-bottom:0;padding-top:0}select{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\");background-position:right .5rem center;background-repeat:no-repeat;background-size:1.5em 1.5em;padding-right:2.5rem;print-color-adjust:exact}[multiple]{background-image:none;background-position:0 0;background-repeat:unset;background-size:initial;padding-right:.75rem;print-color-adjust:unset}[type=checkbox],[type=radio]{--tw-shadow:0 0 #0000;appearance:none;background-color:#fff;background-origin:border-box;border-color:#6b7280;border-width:1px;color:#2563eb;display:inline-block;flex-shrink:0;height:1rem;padding:0;print-color-adjust:exact;-webkit-user-select:none;user-select:none;vertical-align:middle;width:1rem}[type=checkbox]{border-radius:0}[type=radio]{border-radius:100%}[type=checkbox]:focus,[type=radio]:focus{--tw-ring-inset:var(--tw-empty,/*!*/ /*!*/);--tw-ring-offset-width:2px;--tw-ring-offset-color:#fff;--tw-ring-color:#2563eb;--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow);outline:2px solid #0000;outline-offset:2px}[type=checkbox]:checked,[type=radio]:checked{background-color:currentColor;background-position:50%;background-repeat:no-repeat;background-size:100% 100%;border-color:#0000}[type=checkbox]:checked{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 16 16' fill='%23fff' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z'/%3E%3C/svg%3E\")}[type=radio]:checked{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 16 16' fill='%23fff' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='8' cy='8' r='3'/%3E%3C/svg%3E\")}[type=checkbox]:checked:focus,[type=checkbox]:checked:hover,[type=checkbox]:indeterminate,[type=radio]:checked:focus,[type=radio]:checked:hover{background-color:currentColor;border-color:#0000}[type=checkbox]:indeterminate{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3E%3C/svg%3E\");background-position:50%;background-repeat:no-repeat;background-size:100% 100%}[type=checkbox]:indeterminate:focus,[type=checkbox]:indeterminate:hover{background-color:currentColor;border-color:#0000}[type=file]{background:unset;border-color:inherit;border-radius:0;border-width:0;font-size:unset;line-height:inherit;padding:0}[type=file]:focus{outline:1px solid ButtonText;outline:1px auto -webkit-focus-ring-color}*,::backdrop,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:#3b82f680;--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }.visible{visibility:visible}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.top-0{top:0}.left-0{left:0}.right-0{right:0}.bottom-0{bottom:0}.z-50{z-index:50}.m-10{margin:2.5rem}.m-2{margin:.5rem}.m-5{margin:1.25rem}.m-0{margin:0}.m-3{margin:.75rem}.m-4{margin:1rem}.mx-auto{margin-left:auto;margin-right:auto}.mx-1{margin-left:.25rem}.mr-1,.mx-1{margin-right:.25rem}.mt-0\\.5{margin-top:.125rem}.mt-4{margin-top:1rem}.ml-1{margin-left:.25rem}.ml-0\\.5{margin-left:.125rem}.mr-4{margin-right:1rem}.mr-2{margin-right:.5rem}.mb-5{margin-bottom:1.25rem}.mb-2{margin-bottom:.5rem}.mt-8{margin-top:2rem}.mt-3{margin-top:.75rem}.mt-5{margin-top:1.25rem}.mb-3{margin-bottom:.75rem}.mb-1{margin-bottom:.25rem}.mt-auto{margin-top:auto}.mt-2{margin-top:.5rem}.mb-6{margin-bottom:1.5rem}.mr-3{margin-right:.75rem}.mt-1{margin-top:.25rem}.-mt-1{margin-top:-.25rem}.ml-3{margin-left:.75rem}.mr-1\\.5{margin-right:.375rem}.-mr-4{margin-right:-1rem}.mb-0{margin-bottom:0}.ml-2{margin-left:.5rem}.-mb-1{margin-bottom:-.25rem}.block{display:block}.inline-block{display:inline-block}.flex{display:flex}.table{display:table}.hidden{display:none}.h-screen{height:100vh}.h-11{height:2.75rem}.h-16{height:4rem}.h-4{height:1rem}.h-6{height:1.5rem}.h-full{height:100%}.h-60{height:15rem}.h-1\\/2{height:50%}.h-5\\/6{height:83.333333%}.h-5{height:1.25rem}.h-10{height:2.5rem}.h-3{height:.75rem}.h-64{height:16rem}.h-32{height:8rem}.h-8{height:2rem}.min-h-0{min-height:0}.w-screen{width:100vw}.w-4{width:1rem}.w-6{width:1.5rem}.w-full{width:100%}.w-60{width:15rem}.w-5{width:1.25rem}.w-12{width:3rem}.w-3{width:.75rem}.w-40{width:10rem}.w-56{width:14rem}.w-16{width:4rem}.w-32{width:8rem}.w-20{width:5rem}.flex-1{flex:1 1 0%}.flex-shrink-0{flex-shrink:0}.flex-grow{flex-grow:1}.transform{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.cursor-pointer{cursor:pointer}.resize{resize:both}.flex-row{flex-direction:row}.flex-col{flex-direction:column}.items-start{align-items:flex-start}.items-center{align-items:center}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.space-x-2>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-left:calc(.5rem*(1 - var(--tw-space-x-reverse)));margin-right:calc(.5rem*var(--tw-space-x-reverse))}.space-y-3>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(.75rem*var(--tw-space-y-reverse));margin-top:calc(.75rem*(1 - var(--tw-space-y-reverse)))}.space-y-2>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(.5rem*var(--tw-space-y-reverse));margin-top:calc(.5rem*(1 - var(--tw-space-y-reverse)))}.divide-y>:not([hidden])~:not([hidden]){--tw-divide-y-reverse:0;border-bottom-width:calc(1px*var(--tw-divide-y-reverse));border-top-width:calc(1px*(1 - var(--tw-divide-y-reverse)))}.overflow-auto{overflow:auto}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.whitespace-nowrap{white-space:nowrap}.whitespace-pre-wrap{white-space:pre-wrap}.break-all{word-break:break-all}.rounded{border-radius:.25rem}.border{border-width:1px}.border-2{border-width:2px}.border-t{border-top-width:1px}.border-b{border-bottom-width:1px}.border-b-2{border-bottom-width:2px}.border-solid{border-style:solid}.border-gray-400{--tw-border-opacity:1;border-color:rgb(156 163 175/var(--tw-border-opacity))}.border-gray-300{--tw-border-opacity:1;border-color:rgb(209 213 219/var(--tw-border-opacity))}.border-gray-100{--tw-border-opacity:1;border-color:rgb(243 244 246/var(--tw-border-opacity))}.bg-sky-200{--tw-bg-opacity:1;background-color:rgb(186 230 253/var(--tw-bg-opacity))}.bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity))}.bg-gray-100{--tw-bg-opacity:1;background-color:rgb(243 244 246/var(--tw-bg-opacity))}.bg-blue-500{--tw-bg-opacity:1;background-color:rgb(59 130 246/var(--tw-bg-opacity))}.bg-neutral-100{--tw-bg-opacity:1;background-color:rgb(245 245 245/var(--tw-bg-opacity))}.bg-gradient-to-bl{background-image:linear-gradient(to bottom left,var(--tw-gradient-stops))}.from-gray-500{--tw-gradient-from:#6b7280;--tw-gradient-to:#6b728000;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.to-gray-600{--tw-gradient-to:#4b5563}.p-5{padding:1.25rem}.p-1{padding:.25rem}.p-3{padding:.75rem}.p-2{padding:.5rem}.px-4{padding-left:1rem;padding-right:1rem}.py-1{padding-bottom:.25rem;padding-top:.25rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-1{padding-left:.25rem;padding-right:.25rem}.py-2{padding-bottom:.5rem;padding-top:.5rem}.py-3{padding-bottom:.75rem;padding-top:.75rem}.py-0\\.5{padding-bottom:.125rem;padding-top:.125rem}.pr-2{padding-right:.5rem}.pl-2{padding-left:.5rem}.pr-6{padding-right:1.5rem}.pr-8{padding-right:2rem}.pr-3{padding-right:.75rem}.pl-11{padding-left:2.75rem}.pt-2{padding-top:.5rem}.pt-3{padding-top:.75rem}.pl-5{padding-left:1.25rem}.pb-2{padding-bottom:.5rem}.pr-4{padding-right:1rem}.pt-1{padding-top:.25rem}.text-center{text-align:center}.font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-xs{font-size:.75rem;line-height:1rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.font-bold{font-weight:700}.font-medium{font-weight:500}.font-semibold{font-weight:600}.font-normal{font-weight:400}.lowercase{text-transform:lowercase}.italic{font-style:italic}.leading-tight{line-height:1.25}.leading-6{line-height:1.5rem}.leading-5{line-height:1.25rem}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity))}.text-gray-700{--tw-text-opacity:1;color:rgb(55 65 81/var(--tw-text-opacity))}.text-blue-500{--tw-text-opacity:1;color:rgb(59 130 246/var(--tw-text-opacity))}.text-gray-400{--tw-text-opacity:1;color:rgb(156 163 175/var(--tw-text-opacity))}.text-gray-900{--tw-text-opacity:1;color:rgb(17 24 39/var(--tw-text-opacity))}.text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity))}.text-red-500{--tw-text-opacity:1;color:rgb(239 68 68/var(--tw-text-opacity))}.text-gray-800{--tw-text-opacity:1;color:rgb(31 41 55/var(--tw-text-opacity))}.text-blue-800{--tw-text-opacity:1;color:rgb(30 64 175/var(--tw-text-opacity))}.text-black{--tw-text-opacity:1;color:rgb(0 0 0/var(--tw-text-opacity))}.text-gray-600{--tw-text-opacity:1;color:rgb(75 85 99/var(--tw-text-opacity))}.underline{text-decoration-line:underline}.no-underline{text-decoration-line:none}.opacity-80{opacity:.8}.opacity-70{opacity:.7}.opacity-90{opacity:.9}.shadow-md{--tw-shadow:0 4px 6px -1px #0000001a,0 2px 4px -2px #0000001a;--tw-shadow-colored:0 4px 6px -1px var(--tw-shadow-color),0 2px 4px -2px var(--tw-shadow-color)}.shadow-md,.shadow-xl{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow-xl{--tw-shadow:0 20px 25px -5px #0000001a,0 8px 10px -6px #0000001a;--tw-shadow-colored:0 20px 25px -5px var(--tw-shadow-color),0 8px 10px -6px var(--tw-shadow-color)}.shadow-sm{--tw-shadow:0 1px 2px 0 #0000000d;--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color)}.shadow,.shadow-sm{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow{--tw-shadow:0 1px 3px 0 #0000001a,0 1px 2px -1px #0000001a;--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color),0 1px 2px -1px var(--tw-shadow-color)}.shadow-2xl{--tw-shadow:0 25px 50px -12px #00000040;--tw-shadow-colored:0 25px 50px -12px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.outline{outline-style:solid}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition{transition-duration:.15s;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1)}.tx-button:focus-visible{--tw-border-opacity:1;--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);--tw-ring-opacity:1;--tw-ring-color:rgb(31 41 55/var(--tw-ring-opacity));--tw-ring-offset-width:0px;border-color:rgb(31 41 55/var(--tw-border-opacity));box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000);outline:2px solid #0000;outline-offset:2px}.MuiPaper-root.MuiPaper-rounded{box-shadow:none!important;margin:0!important;padding:0!important}#view-browser-axis>div>span>div>div>div>div:first-child{display:none!important}.jss2{margin:0!important}p[data-testid=refLabel-NC_045512v2]{display:none!important}[class*=PrivateSwitchBase-input-]+svg{color:\"#2463eb\"!important}.sidebar-toggle{border:2px solid #888787!important;border-radius:3px;margin:10px}.sidebar-closed,.sidebar-open{transition:right .3s ease-in-out!important}.sidebar-closed{position:absolute;right:0;width:60px}.search-panel{width:100%!important}input,select{border-color:#c7ccd8!important}.infoTooltip{font-size:12pt!important;max-width:200px;pointer-events:auto!important}.infoTooltip :hover{opacity:1!important;visibility:visible!important}.tooltipLink{color:#2563eb;text-decoration:underline}.hover\\:border-gray-500:hover{--tw-border-opacity:1;border-color:rgb(107 114 128/var(--tw-border-opacity))}.hover\\:bg-gray-200:hover{--tw-bg-opacity:1;background-color:rgb(229 231 235/var(--tw-bg-opacity))}.hover\\:bg-blue-700:hover{--tw-bg-opacity:1;background-color:rgb(29 78 216/var(--tw-bg-opacity))}.hover\\:text-gray-700:hover{--tw-text-opacity:1;color:rgb(55 65 81/var(--tw-text-opacity))}.hover\\:text-red-700:hover{--tw-text-opacity:1;color:rgb(185 28 28/var(--tw-text-opacity))}.hover\\:text-black:hover{--tw-text-opacity:1;color:rgb(0 0 0/var(--tw-text-opacity))}.hover\\:underline:hover{text-decoration-line:underline}.hover\\:no-underline:hover{text-decoration-line:none}.hover\\:opacity-100:hover{opacity:1}.focus\\:border-gray-800:focus{--tw-border-opacity:1;border-color:rgb(31 41 55/var(--tw-border-opacity))}.focus\\:outline-none:focus{outline:2px solid #0000;outline-offset:2px}.focus\\:ring-gray-800:focus{--tw-ring-opacity:1;--tw-ring-color:rgb(31 41 55/var(--tw-ring-opacity))}@media (min-width:768px){.md\\:static{position:static}.md\\:col-span-12{grid-column:span 12/span 12}.md\\:h-full{height:100%}.md\\:min-h-0{min-height:0}.md\\:w-3\\/4{width:75%}.md\\:w-2\\/3{width:66.666667%}.md\\:w-1\\/4{width:25%}.md\\:w-1\\/3{width:33.333333%}.md\\:flex-grow{flex-grow:1}.md\\:flex-row{flex-direction:row}.md\\:overflow-hidden{overflow:hidden}.md\\:overflow-y-auto{overflow-y:auto}.md\\:border-0{border-width:0}.md\\:px-0{padding-left:0;padding-right:0}.md\\:shadow-none{--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}}@media (min-width:1536px){.\\32xl\\:w-3\\/4{width:75%}.\\32xl\\:w-1\\/4{width:25%}}";
styleInject(css_248z,{"insertAt":"top"});

const useTreenomeLayerData = (data, treenomeState, settings, selectedDetails) => {
  const [varDataAa, setVarDataAa] = useState([]);
  const [varDataNt, setVarDataNt] = useState([]);
  const [numNodes, setNumNodes] = useState(0);
  const [cachedVarDataAa, setCachedVarDataAa] = useState([]);
  const [cachedVarDataNt, setCachedVarDataNt] = useState([]);
  const [treenomeReferenceInfo, setTreenomeReferenceInfo] = useState(null);
  const [didFirstAa, setDidFirstAa] = useState(false);
  const [didFirstNt, setDidFirstNt] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const worker = useMemo(() => new Worker(new URL("../webworkers/treenomeWorker.js", import.meta.url)), []);
  worker.onmessage = useCallback(e => {
    if (!treenomeReferenceInfo && e.data.treenomeReferenceInfo) {
      setTreenomeReferenceInfo(e.data.treenomeReferenceInfo);
    }

    if (e.data.type === "variation_data_return_cache_aa") {
      setCachedVarDataAa(e.data.filteredVarData);
      setVarDataAa(e.data.filteredVarData);
    } else if (e.data.type === "variation_data_return_aa") {
      setVarDataAa(e.data.filteredVarData);
    } else if (e.data.type === "variation_data_return_cache_nt") {
      setCachedVarDataNt(e.data.filteredVarData);
      setVarDataNt(e.data.filteredVarData);
    } else if (e.data.type === "variation_data_return_nt") {
      setVarDataNt(e.data.filteredVarData);
    }
  }, [treenomeReferenceInfo, setTreenomeReferenceInfo, setVarDataAa, setVarDataNt, setCachedVarDataAa, setCachedVarDataNt]);
  useEffect(() => {
    if (!(data.data && data.data.nodes)) {
      return;
    }

    if (!didFirstAa && data.data && data.data.nodes && treenomeState.genomeSize > 0 && treenomeState.ntBounds[0] === 0 && treenomeState.ntBounds[1] === treenomeState.genomeSize) {
      if (settings.mutationTypesEnabled.aa) {
        const jobId = data.data.nodes.length;
        worker.postMessage({
          type: "variation_data_aa",
          data: data,
          jobId: jobId,
          ntBounds: treenomeState.ntBounds
        });
      }

      setDidFirstAa(true);
    }

    if (!didFirstNt && data.data && data.data.nodes && treenomeState.genomeSize > 0 && treenomeState.ntBounds[0] === 0 && treenomeState.ntBounds[1] === treenomeState.genomeSize) {
      if (settings.mutationTypesEnabled.nt) {
        const jobId = data.data.nodes.length;
        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: treenomeState.ntBounds
        });
      }

      setDidFirstNt(true);
    }

    if (!settings.treenomeEnabled) {
      return;
    }

    if (data.data.nodes.length >= 90000) {
      if (cachedVarDataAa.length > 0 && cachedVarDataAa !== varDataAa) {
        setVarDataAa(cachedVarDataAa);
      }

      if (cachedVarDataNt.length > 0) {
        setVarDataNt(cachedVarDataNt);
      }

      if (settings.mutationTypesEnabled.aa && cachedVarDataAa.length > 0) {
        if (cachedVarDataNt.length > 0 || !settings.mutationTypesEnabled.nt) {
          setNumNodes(data.data.nodes.length);
          return;
        }
      }

      if (settings.mutationTypesEnabled.nt && cachedVarDataNt.length > 0) {
        if (cachedVarDataAa.length > 0 || !settings.mutationTypesEnabled.aa) {
          setNumNodes(data.data.nodes.length);
          return;
        }
      }
    }

    let skipAa = false;
    let skipNt = false;

    if (numNodes === data.data.nodes.length) {
      // only ntBounds changed, need to recompute only if < 1000 nts are visible
      if (!data.data || !data.data.nodes) {
        return;
      }

      if (settings.mutationTypesEnabled.aa && varDataAa.length > 0) {
        setVarDataAa(varDataAa);
        skipAa = true;
      }

      if (settings.mutationTypesEnabled.nt && varDataNt.length > 0) {
        setVarDataNt(varDataNt);
        skipNt = true;
      }
    } // full computation


    setNumNodes(data.data.nodes.length);
    let jobId = data.data.nodes.length;

    if (!skipAa) {
      if (settings.mutationTypesEnabled.aa) {
        worker.postMessage({
          type: "variation_data_aa",
          data: data,
          jobId: jobId,
          ntBounds: treenomeState.ntBounds
        });
      }
    }

    if (!skipNt) {
      if (settings.mutationTypesEnabled.nt) {
        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: treenomeState.ntBounds
        });
      }
    }
  }, [data.data, numNodes, settings.treenomeEnabled, varDataAa, varDataNt, worker, settings.mutationTypesEnabled, treenomeState.ntBounds, currentJobId, setCurrentJobId, cachedVarDataAa, cachedVarDataNt, data, didFirstAa, treenomeState.genomeSize, didFirstNt]);
  return [varDataAa, varDataNt, treenomeReferenceInfo, cachedVarDataAa, cachedVarDataNt];
};

const useTreenomeLayers = (treenomeState, data, viewState, colorHook, setHoverInfo, settings, treenomeReferenceInfo, setTreenomeReferenceInfo, selectedDetails) => {
  const myGetPolygonOffset = _ref => {
    let {
      layerIndex
    } = _ref;
    return [0, -(layerIndex + 999) * 100];
  };

  const modelMatrixFixedX = useMemo(() => {
    return [1 / 2 ** viewState.zoom, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }, [viewState.zoom]);
  const variation_padding = useMemo(() => {
    if (!data.data.nodes) {
      return 0;
    }

    if (data.data.nodes.length < 10000) {
      return 0.0001;
    } else {
      return 0;
    }
  }, [data.data]);
  const aaWidth = useMemo(() => {
    const browserWidth = treenomeState.xBounds[1] - treenomeState.xBounds[0];
    const numNt = treenomeState.ntBounds[1] - treenomeState.ntBounds[0];
    return numNt > 600 ? 2 : browserWidth / numNt * 3;
  }, [treenomeState.ntBounds, treenomeState.xBounds]);
  const ntWidth = useMemo(() => {
    return aaWidth / 3;
  }, [aaWidth]);
  const cov2Genes = useMemo(() => {
    if (settings.isCov2Tree) {
      return {
        // [start, end, [color]]
        ORF1a: [266, 13469, [142, 188, 102]],
        ORF1b: [13468, 21556, [229, 150, 5]],
        ORF1ab: [266, 21556, [142, 188, 102]],
        S: [21563, 25385, [80, 151, 186]],
        ORF3a: [25393, 26221, [170, 189, 82]],
        E: [26245, 26473, [217, 173, 61]],
        M: [26523, 27192, [80, 151, 186]],
        ORF6: [27202, 27388, [223, 67, 39]],
        ORF7a: [27394, 27760, [196, 185, 69]],
        ORF7b: [27756, 27888, [117, 182, 129]],
        ORF8: [27894, 28260, [96, 170, 1158]],
        N: [28274, 29534, [230, 112, 48]],
        ORF10: [29558, 29675, [90, 200, 216]]
      };
    } else {
      return null;
    }
  }, [settings.isCov2Tree]);
  const ntToCov2Gene = useCallback(nt => {
    if (cov2Genes !== null) {
      for (const gene of Object.keys(cov2Genes)) {
        const [start, end, color] = cov2Genes[gene];

        if (nt >= start && nt <= end) {
          return gene;
        }
      }
    }

    return null;
  }, [cov2Genes]);
  let layers = [];
  const [layerDataAa, layerDataNt, computedReference, cachedVarDataAa, cachedVarDataNt] = useTreenomeLayerData(data, treenomeState, settings);
  useEffect(() => {
    if (!treenomeReferenceInfo) {
      setTreenomeReferenceInfo(computedReference);
    }
  }, [computedReference, treenomeReferenceInfo, setTreenomeReferenceInfo]);
  const ntToX = useCallback(nt => {
    return treenomeState.xBounds[0] + (nt - treenomeState.ntBounds[0]) / (treenomeState.ntBounds[1] - treenomeState.ntBounds[0]) * (treenomeState.xBounds[1] - treenomeState.xBounds[0]) - 3;
  }, [treenomeState.xBounds, treenomeState.ntBounds]);
  const getNtPos = useCallback(mut => {
    if (mut.gene === "nt") {
      return mut.residue_pos - 1;
    }

    if (mut.nuc_for_codon !== undefined) {
      return mut.nuc_for_codon - 1;
    }

    if (cov2Genes !== null) {
      return cov2Genes[mut.gene][0] + (mut.residue_pos - 1) * 3 - 1;
    }
  }, [cov2Genes]);
  const main_variation_aa_common_props = {
    onHover: info => setHoverInfo(info),
    pickable: true,
    getColor: d => {
      if (cov2Genes !== null) {
        return d.m.new_residue !== treenomeReferenceInfo["aa"][d.m.gene + ":" + d.m.residue_pos] ? colorHook.toRGB(d.m.new_residue) : cov2Genes[d.m.gene][2].map(c => 245 - 0.2 * (245 - c));
      } else {
        return d.m.new_residue !== treenomeReferenceInfo["aa"][d.m.gene + ":" + d.m.residue_pos] ? colorHook.toRGB(d.m.new_residue) : [245, 245, 245];
      }
    },
    modelMatrix: modelMatrixFixedX,
    getSourcePosition: d => {
      if (!treenomeState.ntBounds) {
        return [[0, 0]];
      }

      let mut = d.m;
      let ntPos = getNtPos(mut);

      if (ntPos < treenomeState.ntBounds[0] || ntPos > treenomeState.ntBounds[1]) {
        return [[0, 0]];
      }

      let x = ntToX(ntPos);
      return [x + aaWidth / 2, d.y[0] - variation_padding];
    },
    getTargetPosition: d => {
      if (!treenomeState.ntBounds) {
        return [[0, 0]];
      }

      let mut = d.m;
      let ntPos = getNtPos(mut);

      if (ntPos < treenomeState.ntBounds[0] || ntPos > treenomeState.ntBounds[1]) {
        return [[0, 0]];
      }

      let x = ntToX(ntPos);
      return [x + aaWidth / 2, d.y[1] + variation_padding];
    },
    getWidth: d => {
      return aaWidth;
    },
    updateTriggers: {
      getTargetPosition: [treenomeState.ntBounds, getNtPos, ntToX, variation_padding, aaWidth],
      getSourcePosition: [treenomeState.ntBounds, getNtPos, ntToX, variation_padding, aaWidth],
      getWidth: [aaWidth],
      getColor: [treenomeReferenceInfo, colorHook, cov2Genes]
    },
    getPolygonOffset: myGetPolygonOffset
  };
  const main_variation_layer_aa = new LineLayer({ ...main_variation_aa_common_props,
    data: layerDataAa,
    id: "browser-loaded-main-aa"
  });
  const fillin_variation_layer_aa = new LineLayer({ ...main_variation_aa_common_props,
    data: cachedVarDataAa,
    id: "browser-fillin-aa"
  });
  const main_variation_nt_common_props = {
    onHover: info => setHoverInfo(info),
    pickable: true,
    getColor: d => {
      let color = [0, 0, 0];

      switch (d.m.new_residue) {
        case "A":
          color = [0, 0, 0];
          break;

        case "C":
          color = [60, 60, 60];
          break;

        case "G":
          color = [120, 120, 120];
          break;

        case "T":
          color = [180, 180, 180];
          break;

        default:
          color = [0, 0, 0];
          break;
      }

      if (cov2Genes !== null) {
        if (d.m.new_residue === treenomeReferenceInfo["nt"][d.m.residue_pos]) {
          const gene = ntToCov2Gene(d.m.residue_pos);

          if (gene !== null) {
            return cov2Genes[gene][2].map(c => 245 - 0.2 * (245 - c));
          }
        }
      }

      return color;
    },
    modelMatrix: modelMatrixFixedX,
    getSourcePosition: d => {
      if (!treenomeState.ntBounds) {
        return [[0, 0]];
      }

      let mut = d.m;
      let ntPos = getNtPos(mut);

      if (ntPos < treenomeState.ntBounds[0] || ntPos > treenomeState.ntBounds[1]) {
        return [[0, 0]];
      }

      let x = ntToX(ntPos);
      return [x + ntWidth / 2, d.y[0] - variation_padding];
    },
    getTargetPosition: d => {
      if (!treenomeState.ntBounds) {
        return [[0, 0]];
      }

      let mut = d.m;
      let ntPos = getNtPos(mut);

      if (ntPos < treenomeState.ntBounds[0] || ntPos > treenomeState.ntBounds[1]) {
        return [[0, 0]];
      }

      let x = ntToX(ntPos);
      return [x + ntWidth / 2, d.y[1] + variation_padding];
    },
    getWidth: d => {
      return ntWidth;
    },
    updateTriggers: {
      getTargetPosition: [treenomeState.ntBounds, getNtPos, ntToX, variation_padding, ntWidth],
      getSourcePosition: [treenomeState.ntBounds, getNtPos, ntToX, variation_padding, ntWidth],
      getWidth: [ntWidth],
      getColor: [treenomeReferenceInfo, colorHook, cov2Genes]
    },
    getPolygonOffset: myGetPolygonOffset
  };
  const main_variation_layer_nt = new LineLayer({ ...main_variation_nt_common_props,
    data: layerDataNt,
    id: "browser-loaded-main-nt"
  });
  const fillin_variation_layer_nt = new LineLayer({ ...main_variation_nt_common_props,
    data: cachedVarDataNt,
    id: "browser-fillin-nt"
  });
  const dynamic_background_data = useMemo(() => {
    if (!settings.treenomeEnabled || cov2Genes === null) {
      return [];
    }

    let d = [];

    for (let key of Object.keys(cov2Genes)) {
      if (key === "ORF1ab") {
        continue;
      }

      const gene = cov2Genes[key];
      const yh = treenomeState.yBounds[1];
      d.push({
        x: [[ntToX(gene[0] - 1), -3000], [ntToX(gene[0] - 1), yh * 4], [ntToX(gene[1] - 1), yh * 4], [ntToX(gene[1] - 1), -3000]],
        c: gene[2]
      });
    }

    return d;
  }, [cov2Genes, ntToX, treenomeState.yBounds, settings.treenomeEnabled]);
  const selected_node_data = useMemo(() => {
    if (!selectedDetails.nodeDetails || variation_padding === 0) {
      return [];
    }

    if (data.data && data.data.nodes && data.data.nodes.length > 500) {
      return [];
    }

    const y = selectedDetails.nodeDetails.y;
    return [{
      p: [[ntToX(0), y - variation_padding], [ntToX(0), y + variation_padding], [ntToX(treenomeState.genomeSize), y + variation_padding], [ntToX(treenomeState.genomeSize), y - variation_padding]]
    }];
  }, [selectedDetails, ntToX, variation_padding, data.data, treenomeState.genomeSize]);
  const background_layer_data = useMemo(() => {
    const yh = treenomeState.yBounds[1];
    return [[[treenomeState.xBounds[0], -3000], [treenomeState.xBounds[0], yh * 4], [treenomeState.xBounds[1], yh * 4], [treenomeState.xBounds[1], -3000]]];
  }, [treenomeState.xBounds, treenomeState.yBounds]);
  const dynamic_browser_background_data = useMemo(() => {
    const yh = treenomeState.yBounds[1];
    return [{
      x: [[ntToX(0), -3000], [ntToX(0), yh * 4], [ntToX(treenomeState.genomeSize), yh * 4], [ntToX(treenomeState.genomeSize), -3000]],
      c: [245, 245, 245]
    }];
  }, [treenomeState.yBounds, treenomeState.genomeSize, ntToX]);

  if (!settings.treenomeEnabled) {
    return [];
  }

  const browser_background_layer = new PolygonLayer({
    id: "browser-loaded-background",
    data: background_layer_data,
    // data: [ [[-1000, -1000], [-1000, 1000], [1000, 1000], [1000, -1000]] ] ,
    getPolygon: d => d,
    modelMatrix: modelMatrixFixedX,
    lineWidthUnits: "pixels",
    getLineWidth: 0,
    filled: true,
    pickable: false,
    getFillColor: [224, 224, 224],
    getPolygonOffset: myGetPolygonOffset
  });
  const dynamic_browser_background_sublayer = new SolidPolygonLayer({
    id: "browser-loaded-dynamic-background-sublayer",
    data: dynamic_browser_background_data,
    getPolygon: d => d.x,
    getFillColor: d => d.c,
    getPolygonOffset: myGetPolygonOffset,
    modelMatrix: modelMatrixFixedX
  });
  const dynamic_browser_background_layer = new SolidPolygonLayer({
    id: "browser-loaded-dynamic-background",
    data: dynamic_background_data,
    modelMatrix: modelMatrixFixedX,
    getPolygon: d => d.x,
    getFillColor: d => [...d.c, 0.2 * 255],
    getPolygonOffset: myGetPolygonOffset
  });
  const browser_outline_layer = new PolygonLayer({
    id: "browser-loaded-outline",
    data: [{
      x: [[ntToX(0), treenomeState.baseYBounds[0]], [ntToX(0), treenomeState.baseYBounds[1]], [ntToX(treenomeState.genomeSize), treenomeState.baseYBounds[1]], [ntToX(treenomeState.genomeSize), treenomeState.baseYBounds[0]]]
    }],
    getPolygon: d => d.x,
    modelMatrix: modelMatrixFixedX,
    lineWidthUnits: "pixels",
    getLineWidth: 1,
    getLineColor: [100, 100, 100],
    opacity: 0.1,
    filled: false,
    pickable: false,
    getPolygonOffset: myGetPolygonOffset
  });
  const selected_node_layer = new PolygonLayer({
    id: "browser-loaded-selected-node",
    data: selected_node_data,
    getPolygon: d => d.p,
    modelMatrix: modelMatrixFixedX,
    lineWidthUnits: "pixels",
    getLineWidth: 0.4,
    opacity: 0.1,
    filled: true,
    getFillColor: [240, 240, 240],
    pickable: false,
    getPolygonOffset: myGetPolygonOffset
  });
  layers.push(browser_background_layer);
  layers.push(dynamic_browser_background_sublayer);
  layers.push(dynamic_browser_background_layer);
  layers.push(browser_outline_layer);

  if (settings.mutationTypesEnabled.aa) {
    layers.push(fillin_variation_layer_aa);
    layers.push(main_variation_layer_aa);
  }

  if (settings.mutationTypesEnabled.nt) {
    layers.push(fillin_variation_layer_nt);
    layers.push(main_variation_layer_nt);
  }

  layers.push(selected_node_layer);
  return layers;
};

const useLayers = _ref => {
  let {
    data,
    search,
    viewState,
    colorHook,
    setHoverInfo,
    hoverInfo,
    colorBy,
    xType,
    modelMatrix,
    selectedDetails,
    xzoom,
    settings,
    isCurrentlyOutsideBounds,
    config,
    treenomeState,
    treenomeReferenceInfo,
    setTreenomeReferenceInfo
  } = _ref;
  const lineColor = [150, 150, 150];
  const getNodeColorField = colorBy.getNodeColorField;
  const {
    toRGB
  } = colorHook;
  const layers = []; // Treenome Browser layers

  const treenomeLayers = useTreenomeLayers(treenomeState, data, viewState, colorHook, setHoverInfo, settings, treenomeReferenceInfo, setTreenomeReferenceInfo, selectedDetails);
  layers.push(...treenomeLayers);
  const getX = useCallback(node => node[xType], [xType]);
  const detailed_data = useMemo(() => {
    if (data.data && data.data.nodes) {
      data.data.nodes.forEach(node => {
        node.parent_x = getX(data.data.nodeLookup[node.parent_id]);
        node.parent_y = data.data.nodeLookup[node.parent_id].y;
      });
      return data.data;
    } else {
      return {
        nodes: [],
        nodeLookup: {}
      };
    }
  }, [data.data, getX]);
  const clade_accessor = "pango";
  const clade_data = useMemo(() => {
    const initial_data = detailed_data.nodes.filter(n => n.clades && n.clades[clade_accessor]);
    const rev_sorted_by_num_tips = initial_data.sort((a, b) => b.num_tips - a.num_tips); // pick top settings.minTipsForCladeText

    const top_nodes = rev_sorted_by_num_tips.slice(0, settings.maxCladeTexts);
    return top_nodes;
  }, [detailed_data.nodes, settings.maxCladeTexts, clade_accessor]);
  const base_data = useMemo(() => {
    if (data.base_data && data.base_data.nodes) {
      data.base_data.nodes.forEach(node => {
        node.parent_x = getX(data.base_data.nodeLookup[node.parent_id]);
        node.parent_y = data.base_data.nodeLookup[node.parent_id].y;
      });
      return {
        nodes: data.base_data.nodes,
        nodeLookup: data.base_data.nodeLookup
      };
    } else {
      return {
        nodes: [],
        nodeLookup: {}
      };
    }
  }, [data.base_data, getX]);
  const detailed_scatter_data = useMemo(() => {
    return detailed_data.nodes.filter(node => node.is_tip || node.is_tip === undefined && node.num_tips === 1 || settings.displayPointsForInternalNodes);
  }, [detailed_data, settings.displayPointsForInternalNodes]);
  const minimap_scatter_data = useMemo(() => {
    return base_data ? base_data.nodes.filter(node => node.is_tip || node.is_tip === undefined && node.num_tips === 1 || settings.displayPointsForInternalNodes) : [];
  }, [base_data, settings.displayPointsForInternalNodes]);
  const outer_bounds = [[-1000, -1000], [1000, -1000], [10000, 10000], [-1000, 10000], [-1000, -1000]];
  const inner_bounds = [[viewState.min_x, viewState.min_y < -1000 ? -1000 : viewState.min_y], [viewState.max_x, viewState.min_y < -1000 ? -1000 : viewState.min_y], [viewState.max_x, viewState.max_y > 10000 ? 10000 : viewState.max_y], [viewState.min_x, viewState.max_y > 10000 ? 10000 : viewState.max_y]];
  const bound_contour = [[outer_bounds, inner_bounds]];
  const scatter_layer_common_props = {
    getPosition: d => [getX(d), d.y],
    getFillColor: d => toRGB(getNodeColorField(d, detailed_data)),
    // radius in pixels
    getRadius: 3,
    getLineColor: [100, 100, 100],
    opacity: 0.6,
    stroked: data.data.nodes && data.data.nodes.length < 3000,
    lineWidthUnits: "pixels",
    lineWidthScale: 1,
    pickable: true,
    radiusUnits: "pixels",
    onHover: info => setHoverInfo(info),
    modelMatrix: modelMatrix,
    updateTriggers: {
      getFillColor: [detailed_data, getNodeColorField],
      getPosition: [xType]
    }
  };
  const line_layer_horiz_common_props = {
    getSourcePosition: d => [getX(d), d.y],
    getTargetPosition: d => [d.parent_x, d.y],
    getColor: lineColor,
    pickable: true,
    widthUnits: "pixels",
    getWidth: d => d === (hoverInfo && hoverInfo.object) ? 3 : selectedDetails.nodeDetails && selectedDetails.nodeDetails.node_id === d.node_id ? 3.5 : 1,
    onHover: info => setHoverInfo(info),
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails]
    }
  };
  const line_layer_vert_common_props = {
    getSourcePosition: d => [d.parent_x, d.y],
    getTargetPosition: d => [d.parent_x, d.parent_y],
    onHover: info => setHoverInfo(info),
    getColor: lineColor,
    pickable: true,
    getWidth: d => d === (hoverInfo && hoverInfo.object) ? 2 : selectedDetails.nodeDetails && selectedDetails.nodeDetails.node_id === d.node_id ? 2.5 : 1,
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails]
    }
  };

  if (detailed_data.nodes) {
    const main_scatter_layer = new ScatterplotLayer({ ...scatter_layer_common_props,
      id: "main-scatter",
      data: detailed_scatter_data
    });
    const fillin_scatter_layer = new ScatterplotLayer({ ...scatter_layer_common_props,
      id: "fillin-scatter",
      data: minimap_scatter_data,
      getFillColor: d => toRGB(getNodeColorField(d, base_data))
    });
    const main_line_layer = new LineLayer({ ...line_layer_horiz_common_props,
      id: "main-line-horiz",
      data: detailed_data.nodes
    });
    const main_line_layer2 = new LineLayer({ ...line_layer_vert_common_props,
      id: "main-line-vert",
      data: detailed_data.nodes
    });
    const fillin_line_layer = new LineLayer({ ...line_layer_horiz_common_props,
      id: "fillin-line-horiz",
      data: base_data.nodes
    });
    const fillin_line_layer2 = new LineLayer({ ...line_layer_vert_common_props,
      id: "fillin-line-vert",
      data: base_data.nodes
    });
    const selectedLayer = new ScatterplotLayer({
      data: selectedDetails.nodeDetails ? [selectedDetails.nodeDetails] : [],
      visible: true,
      opacity: 1,
      getRadius: 6,
      radiusUnits: "pixels",
      id: "main-selected",
      filled: false,
      stroked: true,
      modelMatrix,
      getLineColor: [0, 0, 0],
      getPosition: d => {
        return [d[xType], d.y];
      },
      lineWidthUnits: "pixels",
      lineWidthScale: 2
    });
    const hoveredLayer = new ScatterplotLayer({
      data: hoverInfo && hoverInfo.object ? [hoverInfo.object] : [],
      visible: true,
      opacity: 0.3,
      getRadius: 4,
      radiusUnits: "pixels",
      id: "main-hovered",
      filled: false,
      stroked: true,
      modelMatrix,
      getLineColor: [0, 0, 0],
      getPosition: d => {
        return [d[xType], d.y];
      },
      lineWidthUnits: "pixels",
      lineWidthScale: 2
    });
    const clade_label_layer = new TextLayer({
      id: "main-clade-node",
      getPixelOffset: [-5, -6],
      data: clade_data,
      getPosition: d => [getX(d), d.y],
      getText: d => d.clades[clade_accessor],
      getColor: [100, 100, 100],
      getAngle: 0,
      fontFamily: "Roboto, sans-serif",
      fontWeight: 700,
      billboard: true,
      getTextAnchor: "end",
      getAlignmentBaseline: "center",
      getSize: 11,
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [getX]
      }
    });
    layers.push(main_line_layer, main_line_layer2, fillin_line_layer, fillin_line_layer2, main_scatter_layer, fillin_scatter_layer, clade_label_layer, selectedLayer, hoveredLayer);
  }

  const proportionalToNodesOnScreen = config.num_tips / 2 ** viewState.zoom; // If leaves are fewer than max_text_number, add a text layer

  if (proportionalToNodesOnScreen < 0.8 * 10 ** settings.thresholdForDisplayingText) {
    const node_label_layer = new TextLayer({
      id: "main-text-node",
      fontFamily: "Roboto, sans-serif",
      fontWeight: 100,
      data: data.data.nodes.filter(node => settings.displayTextForInternalNodes ? true : node.is_tip || node.is_tip === undefined && node.num_tips === 1),
      getPosition: d => [getX(d), d.y],
      getText: d => d[config.name_accessor],
      getColor: [180, 180, 180],
      getAngle: 0,
      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.nodes.length < 200 ? 12 : 9.5,
      modelMatrix: modelMatrix,
      getPixelOffset: [10, 0]
    });
    layers.push(node_label_layer);
  }

  const minimap_scatter = new ScatterplotLayer({
    id: "minimap-scatter",
    data: minimap_scatter_data,
    getPolygonOffset: _ref2 => {
      return [0, -4000];
    },
    getPosition: d => [getX(d), d.y],
    getFillColor: d => toRGB(getNodeColorField(d, base_data)),
    // radius in pixels
    getRadius: 2,
    getLineColor: [100, 100, 100],
    opacity: 0.6,
    radiusUnits: "pixels",
    onHover: info => setHoverInfo(info),
    updateTriggers: {
      getFillColor: [base_data, getNodeColorField],
      getPosition: [minimap_scatter_data, xType]
    }
  });
  const minimap_line_horiz = new LineLayer({
    id: "minimap-line-horiz",
    getPolygonOffset: _ref3 => {
      return [0, -4000];
    },
    data: base_data.nodes,
    getSourcePosition: d => [getX(d), d.y],
    getTargetPosition: d => [d.parent_x, d.y],
    getColor: lineColor,
    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType]
    }
  });
  const minimap_line_vert = new LineLayer({
    id: "minimap-line-vert",
    getPolygonOffset: _ref4 => {
      return [0, -4000];
    },
    data: base_data.nodes,
    getSourcePosition: d => [d.parent_x, d.y],
    getTargetPosition: d => [d.parent_x, d.parent_y],
    getColor: lineColor,
    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType]
    }
  });
  const minimap_polygon_background = new PolygonLayer({
    id: "minimap-bound-background",
    data: [outer_bounds],
    getPolygon: d => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    getPolygonOffset: _ref5 => {
      return [0, -2000];
    },
    getFillColor: d => [255, 255, 255]
  });
  const minimap_bound_polygon = new PolygonLayer({
    id: "minimap-bound-line",
    data: bound_contour,
    getPolygon: d => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    wireframe: true,
    getFillColor: d => [240, 240, 240],
    getLineColor: [80, 80, 80],
    getLineWidth: 1,
    lineWidthUnits: "pixels",
    getPolygonOffset: _ref6 => {
      return [0, -6000];
    }
  });
  const {
    searchSpec,
    searchResults,
    searchesEnabled
  } = search;
  const search_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key] ? searchResults[spec.key].result.data : [];
    const lineColor = search.getLineColor(i);
    return new ScatterplotLayer({
      data: data,
      id: "main-search-scatter-" + spec.key,
      getPosition: d => [d[xType], d.y],
      getLineColor: lineColor,
      getRadius: 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,
      visible: searchesEnabled[spec.key],
      wireframe: true,
      getLineWidth: 1,
      filled: true,
      getFillColor: [255, 0, 0, 0],
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [xType]
      }
    });
  });
  const search_mini_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key] ? searchResults[spec.key].overview : [];
    const lineColor = search.getLineColor(i);
    return new ScatterplotLayer({
      data: data,
      getPolygonOffset: _ref7 => {
        return [0, -9000];
      },
      id: "mini-search-scatter-" + spec.key,
      visible: searchesEnabled[spec.key],
      getPosition: d => [d[xType], d.y],
      getLineColor: lineColor,
      getRadius: 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,
      wireframe: true,
      getLineWidth: 1,
      filled: false,
      getFillColor: [255, 0, 0, 0],
      updateTriggers: {
        getPosition: [xType]
      }
    });
  });
  layers.push(...search_layers, search_mini_layers);
  layers.push(minimap_polygon_background);
  layers.push(minimap_line_horiz, minimap_line_vert, minimap_scatter);
  layers.push(minimap_bound_polygon);
  const layerFilter = useCallback(_ref8 => {
    let {
      layer,
      viewport,
      renderPass
    } = _ref8;
    const first_bit = layer.id.startsWith("main") && viewport.id === "main" || layer.id.startsWith("mini") && viewport.id === "minimap" || layer.id.startsWith("fillin") && viewport.id === "main" && isCurrentlyOutsideBounds || layer.id.startsWith("browser-loaded") && viewport.id === "browser-main" || layer.id.startsWith("browser-fillin") && viewport.id === "browser-main" && isCurrentlyOutsideBounds;
    return first_bit;
  }, [isCurrentlyOutsideBounds]);
  return {
    layers,
    layerFilter
  };
};

const useTreenomeAnnotations = () => {
  const [trackList, setTrackList] = useState([]);
  const baseUrl = "https://hgdownload.soe.ucsc.edu";

  async function getTrackList() {
    try {
      await fetch("https://api.genome.ucsc.edu/list/tracks?genome=wuhCor1").then(response => response.json()).then(data => {
        setTrackList(data);
      });
    } catch (error) {}
  }

  useEffect(() => {
    getTrackList();
  }, []);

  const getJson = (track, key, name, category) => {
    const url = track.bigDataUrl;

    if (!url) {
      return null;
    }

    const ext = url.slice(-2);

    if (ext !== "bb" && ext !== "bw") {
      return null;
    }

    const fullUrl = `${baseUrl}${url}`;
    const output = {
      trackId: key,
      name: name,
      assemblyNames: ["NC_045512v2"],
      category: category
    };

    if (ext === "bb") {
      output.type = "FeatureTrack";
      output.adapter = {
        type: "BigBedAdapter",
        bigBedLocation: {
          uri: fullUrl,
          locationType: "UriLocation"
        }
      };
    } else if (ext === "bw") {
      output.type = "QuantitativeTrack";
      output.adapter = {
        type: "BigWigAdapter",
        bigWigLocation: {
          uri: fullUrl,
          locationType: "UriLocation"
        }
      };
    }

    return output;
  };

  const json = useMemo(() => {
    let allJson = [];

    for (const key in trackList.wuhCor1) {
      const track = trackList.wuhCor1[key];

      if (!track.bigDataUrl) {
        for (const childKey in track) {
          let childJson = {};
          const child = track[childKey];

          if (!child.bigDataUrl) {
            continue;
          }

          childJson = getJson(child, childKey, `${child.longLabel}`, ["Composite UCSC Tracks", track.longLabel]);

          if (childJson) {
            allJson.push(childJson);
          }
        }
      }

      let thisJson = getJson(track, key, track.longLabel, ["UCSC Tracks"]);

      if (thisJson) {
        allJson.push(thisJson);
      }
    }

    return allJson;
  }, [trackList]);
  const output = useMemo(() => {
    return {
      json
    };
  }, [json]);
  return output;
};

function JBrowsePanel(props) {
  const treenomeAnnotations = useTreenomeAnnotations();
  const assembly = useMemo(() => {
    return {
      name: props.treenomeState.chromosomeName ? props.treenomeState.chromosomeName : "chromosome",
      sequence: {
        type: "ReferenceSequenceTrack",
        trackId: props.treenomeState.chromosomeName + "-ReferenceSequenceTrack",
        adapter: {
          type: "FromConfigSequenceAdapter",
          features: [{
            refName: props.treenomeState.chromosomeName,
            uniqueId: props.treenomeState.chromosomeName,
            start: 0,
            end: props.treenomeState.genomeSize > 0 ? props.treenomeState.genomeSize : 29903,
            seq: props.treenomeState.genome ? props.treenomeState.genome : "A"
          }]
        }
      }
    };
  }, [props.treenomeState.genome, props.treenomeState.genomeSize, props.treenomeState.chromosomeName]);
  const tracks = useMemo(() => {
    return [{
      type: "FeatureTrack",
      trackId: "nextstrain-annotations",
      name: "Genes",
      assemblyNames: ["NC_045512v2"],
      category: [],
      adapter: {
        type: "FromConfigAdapter",
        features: [{
          refName: "NC_045512v2",
          name: "E",
          uniqueId: 4,
          start: 26244,
          end: 26472,
          fill: "#D9AD3D"
        }, {
          refName: "NC_045512v2",
          name: "M",
          uniqueId: 5,
          start: 26522,
          end: 27191,
          fill: "#5097BA"
        }, {
          refName: "NC_045512v2",
          name: "N",
          uniqueId: 10,
          start: 28273,
          end: 29533,
          fill: "#E67030"
        }, {
          refName: "NC_045512v2",
          name: "Orf1a",
          uniqueId: 0,
          start: 265,
          end: 13468,
          fill: "#8EBC66"
        }, {
          refName: "NC_045512v2",
          name: "ORF1b",
          uniqueId: 1,
          start: 13467,
          end: 21555,
          fill: "#E59637"
        }, {
          refName: "NC_045512v2",
          name: "ORF3a",
          uniqueId: 3,
          start: 25392,
          end: 26220,
          fill: "#AABD52"
        }, {
          refName: "NC_045512v2",
          name: "ORF6",
          uniqueId: 6,
          start: 27201,
          end: 27387,
          fill: "#DF4327"
        }, {
          refName: "NC_045512v2",
          name: "ORF7a",
          uniqueId: 7,
          start: 27393,
          end: 27759,
          fill: "#C4B945"
        }, {
          refName: "NC_045512v2",
          name: "ORF7b",
          uniqueId: 8,
          start: 27755,
          end: 27887,
          fill: "#75B681"
        }, {
          refName: "NC_045512v2",
          name: "ORF8",
          uniqueId: 9,
          start: 27893,
          end: 28259,
          fill: "#60AA9E"
        }, {
          refName: "NC_045512v2",
          name: "ORF9b",
          uniqueId: 11,
          start: 28283,
          end: 28577,
          fill: "#D9AD3D"
        }, {
          refName: "NC_045512v2",
          name: "S",
          uniqueId: 2,
          start: 21562,
          end: 25384,
          fill: "#5097BA"
        }]
      },
      displays: [{
        type: "LinearBasicDisplay",
        displayId: "nextstrain-color-display",
        renderer: {
          type: "SvgFeatureRenderer",
          color1: "jexl:get(feature,'fill') || 'black'"
        }
      }]
    }, ...treenomeAnnotations.json];
  }, [treenomeAnnotations.json]);
  const defaultSession = useMemo(() => {
    return {
      name: "Default",
      view: {
        id: "linearGenomeView",
        type: "LinearGenomeView",
        hideCloseButton: true,
        tracks: props.settings.isCov2Tree ? [{
          type: "FeatureTrack",
          configuration: "nextstrain-annotations",
          displays: [{
            type: "LinearBasicDisplay",
            configuration: "nextstrain-color-display",
            height: 60
          }]
        }] : []
      }
    };
  }, [props.settings.isCov2Tree]);
  const theme = useMemo(() => {
    return {
      configuration: {
        theme: {
          palette: {
            primary: {
              main: "#555e6c"
            },
            secondary: {
              main: "#2463eb"
            },
            tertiary: {
              main: "#bcbcbc"
            },
            quaternary: {
              main: "#2463eb"
            }
          }
        }
      }
    };
  }, []);
  const state = useMemo(() => createViewState({
    assembly,
    tracks: props.settings.isCov2Tree ? tracks : undefined,
    location: props.settings.isCov2Tree ? "NC_045512v2:0-29903" : props.treenomeState.chromosomeName + ":0-" + props.treenomeState.genomeSize,
    defaultSession: defaultSession,
    ...theme,
    onChange: patch => {
      if (patch.op !== "replace") {
        return;
      }

      const v = state.session.view;
      const leftNtBound = v.offsetPx * v.bpPerPx;
      const rightNtBound = v.offsetPx * v.bpPerPx + v.width * v.bpPerPx;

      if (leftNtBound !== props.treenomeState.ntBounds[0] || rightNtBound !== props.treenomeState.ntBounds[1]) {
        props.treenomeState.setNtBounds([leftNtBound, rightNtBound]);
      }

      const pxPerBp = 1 / v.bpPerPx;

      if (pxPerBp !== props.treenomeState.pxPerBp) {
        props.treenomeState.setPxPerBp(pxPerBp);
      }
    }
  }), [assembly, tracks, props.settings.isCov2Tree, defaultSession, theme]); // TODO: Adding treenomState as dependency above breaks things

  useEffect(() => {
    if (!props.treenomeState.ntBoundsExt) {
      return;
    }

    const v = state.session.view;
    v.navToLocString(props.treenomeState.chromosomeName + ":" + props.treenomeState.ntBoundsExt[0] + ".." + props.treenomeState.ntBoundsExt[1]);
    props.treenomeState.setNtBoundsExt(null);
  }, [props.treenomeState, state.session.view]);
  useEffect(() => {
    const v = state.session.view;

    if (!v.initialized) {
      return;
    }

    const leftNtBound = v.offsetPx * v.bpPerPx;
    const rightNtBound = v.offsetPx * v.bpPerPx + v.width * v.bpPerPx;

    if (leftNtBound !== props.treenomeState.ntBounds[0] || rightNtBound !== props.treenomeState.ntBounds[1]) {
      props.treenomeState.setNtBounds([leftNtBound, rightNtBound]);
    }

    const pxPerBp = 1 / v.bpPerPx;

    if (pxPerBp !== props.treenomeState.pxPerBp) {
      props.treenomeState.setPxPerBp(pxPerBp);
    }
  }, [props.treenomeState, state.session.view]);
  return /*#__PURE__*/React$1.createElement(JBrowseLinearGenomeView, {
    viewState: state
  });
}

const useSnapshot = deckRef => {
  const snapshot = useCallback(() => {
    let canvas = deckRef.current.deck.canvas;
    deckRef.current.deck.redraw(true);
    let a = document.createElement("a");
    a.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    a.download = "taxonium.png";
    a.click();
  }, [deckRef]);
  return snapshot;
};

const fixName$1 = name => {
  return name; //return typeof name == "string"
  //   ? name.replace("hCoV-19/", "hCoV-19/\n")
  //   : name;
};

const fixAuthors = authors => {
  // make sure comma is always followed by space
  return authors.replace(/,([^\s])/g, ", $1");
};

const NodeHoverTip = _ref => {
  let {
    hoverInfo,
    hoverDetails,
    colorHook,
    colorBy,
    config,
    filterMutations,
    deckSize
  } = _ref;
  const initial_mutations = useMemo(() => {
    if (hoverInfo && hoverInfo.object && hoverInfo.object.mutations) {
      const starting = hoverInfo.object.mutations; // sort by gene and then by residue_pos

      return starting.sort((a, b) => {
        if (a.gene !== b.gene) {
          return a.gene > b.gene ? 1 : -1;
        }

        return parseInt(a.residue_pos) > parseInt(b.residue_pos) ? 1 : -1;
      });
    } else {
      return [];
    }
  }, [hoverInfo]);
  const mutations = useMemo(() => {
    return filterMutations(initial_mutations);
  }, [initial_mutations, filterMutations]);

  if (!hoverInfo) {
    return null;
  }

  const hoveredNode = hoverInfo.object;

  if (!hoveredNode || !hoveredNode.node_id) {
    return null;
  }

  const flip_vert = hoverInfo.y > deckSize.height * 0.66;
  const flip_horiz = hoverInfo.x > deckSize.width * 0.66;
  const style = {
    position: "absolute",
    zIndex: 1,
    pointerEvents: "none"
  };

  if (!flip_vert) {
    style.top = hoverInfo.y + 5;
  } else {
    style.bottom = deckSize.height - hoverInfo.y + 5;
  }

  if (!flip_horiz) {
    style.left = hoverInfo.x + 5;
  } else {
    style.right = deckSize.width - hoverInfo.x + 5;
  }

  return /*#__PURE__*/React.createElement("div", {
    className: "bg-gray-100 p-3 opacity-90 text-sm",
    style: { ...style
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold whitespace-pre-wrap"
  }, hoveredNode[config.name_accessor] !== "" ? fixName$1(hoveredNode[config.name_accessor]) : /*#__PURE__*/React.createElement("i", null, "Internal node")), colorBy.colorByField === "genotype" && /*#__PURE__*/React.createElement("span", {
    style: {
      color: colorHook.toRGBCSS(colorBy.getNodeColorField(hoveredNode))
    }
  }, colorBy.colorByGene, ":", colorBy.colorByPosition, colorBy.getNodeColorField(hoveredNode)), config.keys_to_display.map(key => hoveredNode[key] && !(config.metadataTypes && config.metadataTypes[key] === "sequence") && !(typeof hoveredNode[key] === "string" && hoveredNode[key].match(/\[.*\]\(.*\)/)) && /*#__PURE__*/React.createElement("div", {
    key: key
  }, colorBy.colorByField === key ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: colorHook.toRGBCSS(hoveredNode[key])
    }
  }, hoveredNode[key]) : hoveredNode[key])), config.mutations.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mutations text-xs"
  }, mutations.map((mutation, i) => /*#__PURE__*/React.createElement("span", {
    key: mutation.mutation_id
  }, i > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, ", "), /*#__PURE__*/React.createElement("div", {
    className: "inline-block"
  }, mutation.gene, ":", mutation.previous_residue, mutation.residue_pos, mutation.new_residue))), mutations.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs italic"
  }, "No", " ", filterMutations([{
    type: "nt"
  }]).length === 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, "coding") : /*#__PURE__*/React.createElement(React.Fragment, null), " ", "mutations"))), hoverDetails && hoverDetails.nodeDetails && hoverDetails.nodeDetails.acknowledgements && /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-3  mr-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mt-1"
  }, /*#__PURE__*/React.createElement("b", {
    className: "font-semibold"
  }, "Originating laboratory:"), " ", hoverDetails.nodeDetails.acknowledgements.covv_orig_lab), /*#__PURE__*/React.createElement("div", {
    className: "mt-1"
  }, /*#__PURE__*/React.createElement("b", {
    className: "font-semibold"
  }, "Submitting laboratory:"), " ", hoverDetails.nodeDetails.acknowledgements.covv_subm_lab), /*#__PURE__*/React.createElement("div", {
    className: "mt-1 justify"
  }, /*#__PURE__*/React.createElement("b", {
    className: "font-semibold"
  }, "Authors:"), " ", fixAuthors(hoverDetails.nodeDetails.acknowledgements.covv_authors))), window.show_ids ? /*#__PURE__*/React.createElement("div", {
    className: "mt-3 text-xs text-gray-400"
  }, hoveredNode.node_id) : null);
};

const TreenomeMutationHoverTip = _ref => {
  let {
    hoverInfo,
    hoverDetails,
    colorHook,
    colorBy,
    config,
    treenomeReferenceInfo
  } = _ref;

  if (!hoverInfo || !treenomeReferenceInfo) {
    return null;
  }

  const hoveredMutation = hoverInfo.object;

  if (!hoveredMutation || !hoveredMutation.m) {
    return null;
  }

  const isAa = hoveredMutation.m.type === "aa";
  const posKey = isAa ? hoveredMutation.m.gene + ":" + hoveredMutation.m.residue_pos : hoveredMutation.m.residue_pos;

  if (isAa && hoveredMutation.m.new_residue === treenomeReferenceInfo["aa"][posKey]) {
    return null;
  }

  if (!isAa && hoveredMutation.m.new_residue === treenomeReferenceInfo["nt"][posKey]) {
    return null;
  }

  return /*#__PURE__*/React.createElement("div", {
    className: "bg-gray-100 p-3 opacity-90 text-sm",
    style: {
      position: "absolute",
      zIndex: 0,
      pointerEvents: "none",
      left: hoverInfo.x,
      top: hoverInfo.y
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold whitespace-pre-wrap"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mutations text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-block"
  }, /*#__PURE__*/React.createElement("span", null, hoveredMutation.m.gene, ":"), /*#__PURE__*/React.createElement("span", {
    style: {}
  }, treenomeReferenceInfo[isAa ? "aa" : "nt"][posKey]), /*#__PURE__*/React.createElement("span", null, hoveredMutation.m.residue_pos), /*#__PURE__*/React.createElement("span", {
    style: {}
  }, hoveredMutation.m.new_residue)))));
};

const TaxButton = _ref => {
  let {
    children,
    onClick,
    title
  } = _ref;
  return /*#__PURE__*/React.createElement("button", {
    className: " w-12 h-10 bg-gray-100 p-1 rounded border-gray-300 text-gray-700  opacity-70  hover:opacity-100 mr-1 z-50 mt-auto mb-1 shadow-md ",
    onClick: onClick,
    title: title
  }, children);
};

const DeckButtons = _ref2 => {
  let {
    loading,
    setZoomAxis,
    zoomAxis,
    snapshot,
    zoomIncrement,
    requestOpenSettings,
    settings
  } = _ref2;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: "0.2em",
      bottom: "0.2em",
      zIndex: 10
    },
    className: "flex justify-end"
  }, loading && /*#__PURE__*/React.createElement("div", {
    className: "mr-4 mt-auto inline-block"
  }, /*#__PURE__*/React.createElement(ClipLoader, {
    size: 24,
    color: "#444444"
  })), /*#__PURE__*/React.createElement(TaxButton, {
    onClick: () => {
      requestOpenSettings();
    },
    title: "Settings"
  }, /*#__PURE__*/React.createElement(TiCog, {
    className: "mx-auto w-5 h-5 inline-block"
  })), /*#__PURE__*/React.createElement(TaxButton, {
    onClick: () => {
      setZoomAxis(zoomAxis === "X" ? "Y" : "X");
    },
    title: zoomAxis === "X" ? "Switch to vertical zoom" : "Switch to horizontal zoom (you can also hold Ctrl key)"
  }, /*#__PURE__*/React.createElement(TiZoom, {
    className: "mx-auto  w-5 h-5 inline-block m-0"
  }), zoomAxis === "Y" ? /*#__PURE__*/React.createElement(BiMoveVertical, {
    className: "mx-auto  w-5 h-5 inline-block m-0"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BiMoveHorizontal, {
    className: "mx-auto  w-5 h-5 inline-block m-0"
  }))), /*#__PURE__*/React.createElement(TaxButton, {
    onClick: () => {
      snapshot();
    },
    title: "Take screenshot"
  }, /*#__PURE__*/React.createElement(BiCamera, {
    className: "mx-auto  w-5 h-5 inline-block"
  })), /*#__PURE__*/React.createElement("div", {
    className: ""
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TaxButton, {
    onClick: () => {
      zoomIncrement(0.6, "Y");
    },
    title: "Zoom in vertically"
  }, /*#__PURE__*/React.createElement(BiZoomIn, {
    className: "mx-auto  w-5 h-5 inline-block"
  }), /*#__PURE__*/React.createElement(BiMoveVertical, {
    className: "mx-auto  w-3 h-3 inline-block"
  })), /*#__PURE__*/React.createElement(TaxButton, {
    onClick: () => {
      zoomIncrement(-0.6, "Y");
    },
    title: "Zoom out vertically"
  }, /*#__PURE__*/React.createElement(BiZoomOut, {
    className: "mx-auto w-5 h-5 inline-block"
  }), /*#__PURE__*/React.createElement(BiMoveVertical, {
    className: "mx-auto  w-3 h-3 inline-block"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TaxButton, {
    onClick: () => {
      zoomIncrement(0.6, "X");
    },
    title: "Zoom in horizontally"
  }, /*#__PURE__*/React.createElement(BiZoomIn, {
    className: "mx-auto  w-5 h-5 inline-block"
  }), /*#__PURE__*/React.createElement(BiMoveHorizontal, {
    className: "mx-auto  w-3 h-3 inline-block"
  })), /*#__PURE__*/React.createElement(TaxButton, {
    onClick: () => {
      zoomIncrement(-0.6, "X");
    },
    title: "Zoom out horizontally"
  }, /*#__PURE__*/React.createElement(BiZoomOut, {
    className: "mx-auto w-5 h-5 inline-block"
  }), /*#__PURE__*/React.createElement(BiMoveHorizontal, {
    className: "mx-auto  w-3 h-3 inline-block"
  })))));
};

const settingsModalStyle = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    //width: '50%',
    backgroundColor: "#fafafa"
  }
};
const prettifyMutationTypes = {
  aa: "Amino acid",
  nt: "Nucleotide"
};

const DeckSettingsModal = _ref => {
  let {
    settings,
    deckSettingsOpen,
    setDeckSettingsOpen
  } = _ref;
  return /*#__PURE__*/React.createElement(Modal, {
    isOpen: deckSettingsOpen,
    style: settingsModalStyle,
    onRequestClose: () => setDeckSettingsOpen(false),
    contentLabel: "Example Modal"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-medium mb-3"
  }, "Settings"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "mr-1",
    checked: settings.minimapEnabled,
    onChange: () => settings.toggleMinimapEnabled()
  }), " ", "Enable minimap")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "mr-1",
    checked: settings.displayTextForInternalNodes,
    onChange: () => settings.setDisplayTextForInternalNodes(!settings.displayTextForInternalNodes)
  }), " ", "Display labels for internal nodes if present")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "mr-1",
    checked: settings.displayPointsForInternalNodes,
    onChange: () => settings.setDisplayPointsForInternalNodes(!settings.displayPointsForInternalNodes)
  }), " ", "Display points for internal nodes")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Max density of node label text:", " ", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: settings.thresholdForDisplayingText,
    onChange: e => settings.setThresholdForDisplayingText(parseFloat(e.target.value)),
    step: "0.1",
    min: "0",
    max: "10",
    className: "border py-1 px-1 text-grey-darkest text-sm"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Max clade labels to show", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: settings.maxCladeTexts,
    onChange: e => settings.setMaxCladeTexts(parseInt(e.target.value)),
    step: "1",
    min: "0",
    max: "10000000",
    className: "border py-1 px-1 text-grey-darkest text-sm"
  }))), /*#__PURE__*/React.createElement("h3", {
    className: "mt-5 font-medium"
  }, "Mutation types enabled"), /*#__PURE__*/React.createElement("div", {
    className: "mt-2"
  }, Object.keys(settings.mutationTypesEnabled).map(key => /*#__PURE__*/React.createElement("div", {
    key: key
  }, /*#__PURE__*/React.createElement("label", {
    key: key
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "mr-1",
    checked: settings.mutationTypesEnabled[key],
    onChange: () => settings.setMutationTypeEnabled(key, !settings.mutationTypesEnabled[key])
  }), " ", prettifyMutationTypes[key] ? prettifyMutationTypes[key] : key))))));
};

/* React functional component that warns you if you are using Firefox that the page will be slow. Only shows if using firefox. */
const FirefoxWarning = _ref => {
  let {
    className
  } = _ref;
  const isFirefox = typeof InstallTrigger !== "undefined";

  if (isFirefox) {
    return /*#__PURE__*/React.createElement("div", {
      className: className
    }, /*#__PURE__*/React.createElement("p", null, "Warning: Taxonium loads large files more slowly in Firefox. Please use Chrome or Safari for an optimal experience."));
  } else {
    return null;
  }
};

/// app.js

function Deck(_ref) {
  let {
    data,
    search,
    treenomeState,
    view,
    colorHook,
    colorBy,
    hoverDetails,
    config,
    statusMessage,
    xType,
    settings,
    selectedDetails,
    setDeckSize,
    deckSize,
    isCurrentlyOutsideBounds,
    deckRef,
    jbrowseRef
  } = _ref;
  const snapshot = useSnapshot(deckRef);
  const [deckSettingsOpen, setDeckSettingsOpen] = useState(false); //console.log("DATA is ", data);

  const no_data = !data.data || !data.data.nodes || !data.data.nodes.length;
  const {
    viewState,
    onViewStateChange,
    views,
    zoomIncrement,
    zoomAxis,
    setZoomAxis,
    xzoom
  } = view; // Treenome state

  const setMouseXY = useCallback(info => view.setMouseXY([info.x, info.y]), [view]);
  const [treenomeReferenceInfo, setTreenomeReferenceInfo] = useState(null);
  const [mouseDownIsMinimap, setMouseDownIsMinimap] = useState(false);
  const mouseDownPos = useRef();
  const onClickOrMouseMove = useCallback(event => {
    if (event.buttons === 0 && event._reactName === "onPointerMove") {
      return false;
    }

    if (event._reactName === "onPointerDown") {
      mouseDownPos.current = [event.clientX, event.clientY];
    }

    const pan_threshold = 10; // if we get a click event and the mouse has moved more than the threshold,
    // then we assume that the user is panning and just return. Use Pythagorean
    // theorem to calculate the distance

    if (event._reactName === "onClick" && mouseDownPos.current && Math.sqrt(Math.pow(mouseDownPos.current[0] - event.clientX, 2) + Math.pow(mouseDownPos.current[1] - event.clientY, 2)) > pan_threshold) {
      return false;
    } //console.log("onClickOrMouseMove", event);


    const pickInfo = deckRef.current.pickObject({
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
      radius: 10
    });

    if (event._reactName === "onPointerDown") {
      if (pickInfo && pickInfo.viewport.id === "minimap") {
        setMouseDownIsMinimap(true);
      } else {
        setMouseDownIsMinimap(false);
      }
    }

    if (pickInfo && pickInfo.viewport.id === "main" && event._reactName === "onClick") {
      selectedDetails.getNodeDetails(pickInfo.object.node_id);
    }

    if (!pickInfo && event._reactName === "onClick") {
      selectedDetails.clearNodeDetails();
    }

    if (pickInfo && pickInfo.viewport.id === "minimap" && mouseDownIsMinimap) {
      onViewStateChange({
        oldViewState: viewState,
        viewState: { ...viewState,
          target: [pickInfo.coordinate[0] / 2 ** (viewState.zoom - xzoom), pickInfo.coordinate[1]]
        }
      });
    }
  }, [selectedDetails, mouseDownIsMinimap, viewState, onViewStateChange, xzoom, deckRef]);
  const [hoverInfo, setHoverInfoRaw] = useState(null);
  const setHoverInfo = useCallback(info => {
    setHoverInfoRaw(info);

    if (info && info.object) {
      if (hoverDetails.setNodeDetails) {
        hoverDetails.setNodeDetails(info.object);
      } else {
        hoverDetails.getNodeDetails(info.object.node_id);
      }
    } else {
      hoverDetails.clearNodeDetails();
    }
  }, [hoverDetails]);
  const {
    layers,
    layerFilter
  } = useLayers({
    data,
    search,
    viewState,
    colorHook,
    setHoverInfo,
    hoverInfo,
    colorBy,
    xType,
    modelMatrix: view.modelMatrix,
    selectedDetails,
    xzoom,
    settings,
    isCurrentlyOutsideBounds,
    config,
    treenomeState,
    treenomeReferenceInfo,
    setTreenomeReferenceInfo
  }); // console.log("deck refresh");

  return /*#__PURE__*/React$1.createElement("div", {
    className: "w-full h-full relative",
    onClick: onClickOrMouseMove,
    onPointerMove: onClickOrMouseMove,
    onPointerDown: onClickOrMouseMove
  }, no_data && /*#__PURE__*/React$1.createElement("div", {
    className: "absolute top-0 left-0 w-full h-full flex justify-center items-center"
  }, /*#__PURE__*/React$1.createElement("div", {
    className: "text-center w-60 h-60"
  }, statusMessage && statusMessage.percentage ? /*#__PURE__*/React$1.createElement(React$1.Fragment, null, " ", /*#__PURE__*/React$1.createElement(CircularProgressbarWithChildren, {
    value: statusMessage.percentage,
    strokeWidth: 2,
    styles: buildStyles({
      // Rotation of path and trail, in number of turns (0-1)
      //rotation: 0.25,
      // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
      //  strokeLinecap: 'butt',
      // Text size
      textSize: "8px",
      // How long animation takes to go from one percentage to another, in seconds
      //pathTransitionDuration: 0.5,
      // Can specify path transition in more detail, or remove it entirely
      // pathTransition: 'none',
      // Colors
      pathColor: `#666`,
      textColor: "#666",
      trailColor: "#d6d6d6"
    })
  }, /*#__PURE__*/React$1.createElement("div", {
    className: "text-center text-gray-700  text-lg wt font-medium"
  }, statusMessage && statusMessage.message)), /*#__PURE__*/React$1.createElement("div", {
    className: "w-60"
  }, " ", /*#__PURE__*/React$1.createElement(FirefoxWarning, {
    className: "font-bold text-xs text-gray-700 mt-3"
  }))) : /*#__PURE__*/React$1.createElement("div", {
    className: "text-center text-gray-700  text-lg wt font-medium"
  }, /*#__PURE__*/React$1.createElement("div", null, statusMessage && statusMessage.message), /*#__PURE__*/React$1.createElement("div", {
    className: "mt-5"
  }, /*#__PURE__*/React$1.createElement(ClipLoader, {
    size: 100,
    color: "#666"
  }))))), " ", /*#__PURE__*/React$1.createElement(DeckSettingsModal, {
    deckSettingsOpen: deckSettingsOpen,
    setDeckSettingsOpen: setDeckSettingsOpen,
    settings: settings
  }), /*#__PURE__*/React$1.createElement(DeckGL, {
    pickingRadius: 10 //getCursor={() => hoverInfo && hoverInfo.object ? "default" : "pointer"}
    ,
    ref: deckRef,
    views: views,
    viewState: viewState,
    onViewStateChange: onViewStateChange,
    layerFilter: layerFilter,
    layers: layers,
    onHover: setMouseXY,
    onResize: size => {
      setDeckSize(size);
      window.setTimeout(() => {
        treenomeState.handleResize();
      }, 50);
      console.log("resize", size);
    },
    onAfterRender: event => {
      if (isNaN(deckSize.width)) {
        setDeckSize(event.target.parentElement.getBoundingClientRect());
      }
    }
  }, /*#__PURE__*/React$1.createElement(View, {
    id: "browser-axis"
  }, /*#__PURE__*/React$1.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      border: "1px solid black",
      position: "relative",
      zIndex: 1
    }
  }, /*#__PURE__*/React$1.createElement("span", {
    ref: jbrowseRef
  }, /*#__PURE__*/React$1.createElement(JBrowsePanel, {
    treenomeState: treenomeState,
    settings: settings
  })))), /*#__PURE__*/React$1.createElement(View, {
    id: "main"
  }, /*#__PURE__*/React$1.createElement(NodeHoverTip, {
    hoverInfo: hoverInfo,
    hoverDetails: hoverDetails,
    colorHook: colorHook,
    colorBy: colorBy,
    config: config,
    filterMutations: settings.filterMutations,
    deckSize: deckSize
  }), /*#__PURE__*/React$1.createElement(TreenomeMutationHoverTip, {
    hoverInfo: hoverInfo,
    hoverDetails: hoverDetails,
    colorHook: colorHook,
    colorBy: colorBy,
    config: config,
    treenomeReferenceInfo: treenomeReferenceInfo
  }), /*#__PURE__*/React$1.createElement(DeckButtons, {
    zoomIncrement: zoomIncrement,
    zoomAxis: zoomAxis,
    setZoomAxis: setZoomAxis,
    snapshot: snapshot,
    loading: data.status === "loading",
    requestOpenSettings: () => setDeckSettingsOpen(true),
    settings: settings
  }))));
}

const Button = _ref => {
  let {
    onClick,
    className,
    children,
    title,
    href,
    target
  } = _ref;

  if (href && onClick) {
    throw new Error("Button cannot have both href and onClick");
  }

  if (href) {
    return /*#__PURE__*/React.createElement("a", {
      className: classNames("tx-button no-underline", "border border-gray-400 shadow-sm rounded py-1 px-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700", className),
      href: href,
      title: title,
      target: target
    }, children);
  } else {
    return /*#__PURE__*/React.createElement("button", {
      className: classNames("tx-button", "border border-gray-400 shadow-sm rounded py-1 px-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700", className),
      onClick: onClick,
      title: title
    }, children);
  }
};
const Select = _ref2 => {
  let {
    onChange,
    className,
    children,
    value,
    title
  } = _ref2;
  return /*#__PURE__*/React.createElement("select", {
    className: classNames("border bg-white text-gray-900 text-sm hover:text-gray-700 py-1 pl-2 pr-6", "focus:ring-gray-800 focus:border-gray-800", className),
    onChange: onChange,
    value: value,
    title: title
  }, children);
};

function getDefaultSearch(key) {
  if (!key) {
    key = Math.random().toString(36).substring(2, 15);
    console.log("generated key", key);
  }

  return {
    key,
    type: "name",
    method: "text_match",
    text: "",
    gene: "S",
    position: 484,
    new_residue: "any",
    min_tips: 0
  };
}

const number_methods = [">", "<", ">=", "<=", "=="]; // title case

const toTitleCase = str => {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

const bool_methods = ["and", "or", "not"];

const SearchItem = _ref => {
  let {
    singleSearchSpec,
    setThisSearchSpec,
    config
  } = _ref;
  const types = config.search_types ? config.search_types : [];
  const all_amino_acids = "ACDEFGHIKLMNPQRSTVWY".split("");
  const mut_aa_options = ["any"].concat(all_amino_acids).concat(["*"]);
  const gen_aa_options = all_amino_acids.concat(["*"]);
  useEffect(() => {
    if (singleSearchSpec.type === "genotype" && (!singleSearchSpec.new_residue || !gen_aa_options.includes(singleSearchSpec.new_residue))) {
      setThisSearchSpec({ ...singleSearchSpec,
        new_residue: "A",
        position: 0,
        gene: config.genes[0]
      });
    }
  }, [singleSearchSpec.type, singleSearchSpec.new_residue]);
  useEffect(() => {
    if (singleSearchSpec.type === "mutation" && (!singleSearchSpec.new_residue || !mut_aa_options.includes(singleSearchSpec.new_residue) || config.genes && !config.genes.includes(singleSearchSpec.gene))) {
      setThisSearchSpec({ ...singleSearchSpec,
        new_residue: "any",
        position: 0,
        gene: config.genes[0]
      });
    }
  }, [singleSearchSpec.type, singleSearchSpec.new_residue]); // if method is number and number is not set and number_method is not set, set number_method to "="

  useEffect(() => {
    if (singleSearchSpec.method === "number" && !singleSearchSpec.number && !singleSearchSpec.number_method) {
      setThisSearchSpec({ ...singleSearchSpec,
        number_method: "==",
        number: 0
      });
    }
  }, [singleSearchSpec.method, singleSearchSpec.number, singleSearchSpec.number_method]);
  const text_types = ["text_exact", "text_match"];
  const specific_configurations = Object.fromEntries(types.map(type => {
    const obj = {
      method: type.type
    };

    if (type.controls) {
      obj.controls = type.controls;
    }

    return [type.name, obj];
  }));

  const setTypeTo = type => {
    setThisSearchSpec({ ...singleSearchSpec,
      type: type,
      ...specific_configurations[type]
    });
  };

  const is_text = text_types.includes(singleSearchSpec.method);
  const is_multi_text = singleSearchSpec.method === "text_per_line";
  /* if this spec type is boolean and it lacks subspecs, add an empty value */

  if (singleSearchSpec.type === "boolean" && !singleSearchSpec.subspecs) {
    singleSearchSpec.subspecs = [];
  }
  /* if this spec type is boolean and it lacks a boolean method, set it to and*/


  if (singleSearchSpec.type === "boolean" && !singleSearchSpec.boolean_method) {
    singleSearchSpec.boolean_method = "and";
  }

  return /*#__PURE__*/React$1.createElement(React$1.Fragment, null, /*#__PURE__*/React$1.createElement(Select, {
    className: "inline-block w-42  border py-1 px-1 text-grey-darkest text-sm mr-1",
    value: singleSearchSpec.type,
    onChange: e => setTypeTo(e.target.value)
  }, types.map(type => /*#__PURE__*/React$1.createElement("option", {
    key: type.name,
    value: type.name
  }, type.label))), is_text && /*#__PURE__*/React$1.createElement(DebounceInput, {
    className: "inline-block w-40 border py-1 px-1 text-grey-darkest text-sm",
    value: singleSearchSpec.text,
    onChange: e => setThisSearchSpec({ ...singleSearchSpec,
      text: e.target.value
    })
  }), is_multi_text && /*#__PURE__*/React$1.createElement(DebounceInput, {
    element: "textarea",
    className: "block w-56 h-32 border py-1 px-1 text-grey-darkest text-sm",
    value: singleSearchSpec.text,
    onChange: e => setThisSearchSpec({ ...singleSearchSpec,
      text: e.target.value
    })
  }), (is_text || is_multi_text) && singleSearchSpec.controls && /*#__PURE__*/React$1.createElement(React$1.Fragment, null, /*#__PURE__*/React$1.createElement("label", {
    title: "Exact match",
    className: "inline-block text-xs text-gray-400 pl-2 pr-3"
  }, /*#__PURE__*/React$1.createElement("input", {
    type: "checkbox",
    checked: singleSearchSpec.method === "text_exact" || is_multi_text,
    onChange: e => {
      if (e.target.checked) {
        setThisSearchSpec({ ...singleSearchSpec,
          method: "text_exact"
        });
      } else {
        setThisSearchSpec({ ...singleSearchSpec,
          method: "text_match"
        });
      }
    }
  }), " ", "x", " "), /*#__PURE__*/React$1.createElement("label", {
    title: "Multi-line",
    className: "inline-block text-xs text-gray-400"
  }, /*#__PURE__*/React$1.createElement("input", {
    type: "checkbox",
    checked: is_multi_text,
    onChange: e => {
      if (e.target.checked) {
        setThisSearchSpec({ ...singleSearchSpec,
          method: "text_per_line"
        });
      } else {
        setThisSearchSpec({ ...singleSearchSpec,
          method: "text_match"
        });
      }
    }
  }), " ", "m", " ")), (singleSearchSpec.type === "mutation" || singleSearchSpec.type === "genotype") && /*#__PURE__*/React$1.createElement("div", {
    className: "pl-11 pt-2 text-gray-700"
  }, singleSearchSpec.type === "genotype" && /*#__PURE__*/React$1.createElement("div", {
    className: "text-sm -mt-1"
  }, "(N.B. genotype searches are slow, where possible use", " ", /*#__PURE__*/React$1.createElement("i", null, "mutation"), " searches instead)"), /*#__PURE__*/React$1.createElement("div", {
    className: "mt-2"
  }, /*#__PURE__*/React$1.createElement("label", {
    className: "text-sm mr-2 "
  }, "Gene: "), /*#__PURE__*/React$1.createElement(Select, {
    value: singleSearchSpec.gene,
    onChange: e => setThisSearchSpec({ ...singleSearchSpec,
      gene: e.target.value
    }),
    className: "inline-block w-40 border py-1 px-1 text-grey-darkest text-sm h-8"
  }, config.genes && config.genes.map(item => /*#__PURE__*/React$1.createElement("option", {
    key: item,
    value: item
  }, item)))), /*#__PURE__*/React$1.createElement("div", {
    className: "pt-2"
  }, /*#__PURE__*/React$1.createElement("label", {
    className: "text-sm"
  }, toTitleCase(singleSearchSpec.type), " at residue", " "), /*#__PURE__*/React$1.createElement(DebounceInput, {
    type: "number",
    value: singleSearchSpec.position,
    onChange: e => setThisSearchSpec({ ...singleSearchSpec,
      position: e.target.value
    }),
    className: "inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
  }), /*#__PURE__*/React$1.createElement("label", {
    className: "text-sm"
  }, "\xA0", singleSearchSpec.type === "mutation" ? /*#__PURE__*/React$1.createElement(React$1.Fragment, null, "to") : /*#__PURE__*/React$1.createElement(React$1.Fragment, null, "of"), "\xA0"), /*#__PURE__*/React$1.createElement(Select, {
    value: singleSearchSpec.new_residue,
    onChange: e => {
      setThisSearchSpec({ ...singleSearchSpec,
        new_residue: e.target.value
      });
    },
    className: "inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
  }, (singleSearchSpec.type === "mutation" ? mut_aa_options : gen_aa_options).map(aa => /*#__PURE__*/React$1.createElement("option", {
    key: aa,
    value: aa
  }, aa))), /*#__PURE__*/React$1.createElement("br", null))), (singleSearchSpec.type === "revertant" || singleSearchSpec.type === "mutation") && /*#__PURE__*/React$1.createElement("div", null, /*#__PURE__*/React$1.createElement("div", {
    className: "pl-11 pt-3 text-gray-700"
  }, /*#__PURE__*/React$1.createElement("label", {
    className: "text-sm"
  }, "with at least\xA0 "), /*#__PURE__*/React$1.createElement(DebounceInput, {
    type: "number",
    value: singleSearchSpec.min_tips,
    onChange: e => setThisSearchSpec({ ...singleSearchSpec,
      min_tips: e.target.value
    }),
    className: "inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
  }), " ", /*#__PURE__*/React$1.createElement("label", {
    className: "text-sm"
  }, "descendants"))), singleSearchSpec.type === "boolean" && /*#__PURE__*/React$1.createElement(React$1.Fragment, null, /*#__PURE__*/React$1.createElement(Select, {
    value: singleSearchSpec.boolean_method,
    onChange: e => setThisSearchSpec({ ...singleSearchSpec,
      boolean_method: e.target.value
    }),
    className: "inline-block w-16 border py-1 px-1 text-grey-darkest text-sm mr-1"
  }, bool_methods.map(method => /*#__PURE__*/React$1.createElement("option", {
    key: method,
    value: method
  }, method.toUpperCase()))), /*#__PURE__*/React$1.createElement("div", {
    className: "pl-5 pt-3 border-gray-300 border-solid border-2"
  }, singleSearchSpec.subspecs.map((subspec, i) => /*#__PURE__*/React$1.createElement("div", {
    key: i // divider style border at bottom
    ,
    className: "pt-2  border-b-2 border-solid border-grey-light pb-2 mb-2"
  }, /*#__PURE__*/React$1.createElement(SearchItem, {
    singleSearchSpec: subspec,
    setThisSearchSpec: new_subspec => {
      setThisSearchSpec({ ...singleSearchSpec,
        subspecs: singleSearchSpec.subspecs.map((foundsubspec, i) => i === singleSearchSpec.subspecs.indexOf(subspec) ? new_subspec : foundsubspec)
      });
    },
    config: config
  }), /*#__PURE__*/React$1.createElement("button", {
    className: "text-red-500 text-sm hover:text-red-700 ml-3",
    onClick: () => {
      setThisSearchSpec({ ...singleSearchSpec,
        subspecs: singleSearchSpec.subspecs.filter((compsubspec, i) => i !== singleSearchSpec.subspecs.indexOf(subspec))
      });
    }
  }, "X"))), /*#__PURE__*/React$1.createElement("button", {
    className: "inline-block w-32 mb-3 border py-1 px-1 text-grey-darkest text-sm",
    onClick: () => {
      setThisSearchSpec({ ...singleSearchSpec,
        subspecs: [...singleSearchSpec.subspecs, getDefaultSearch()]
      });
    }
  }, "Add sub-search"))), singleSearchSpec.method === "number" &&
  /*#__PURE__*/
  // heading with name
  // interface with select box for less than, greater than, greater than or equal to, less than or equal to, equal to
  // then a number input
  React$1.createElement("div", null, /*#__PURE__*/React$1.createElement(Select, {
    value: singleSearchSpec.number_method,
    onChange: e => setThisSearchSpec({ ...singleSearchSpec,
      number_method: e.target.value
    }),
    className: "inline-block w-16 border py-1 px-1 text-grey-darkest text-sm mr-1"
  }, number_methods.map(method => /*#__PURE__*/React$1.createElement("option", {
    key: method,
    value: method
  }, method))), /*#__PURE__*/React$1.createElement(DebounceInput, {
    type: "number",
    value: singleSearchSpec.number,
    onChange: e => setThisSearchSpec({ ...singleSearchSpec,
      number: e.target.value
    }),
    className: "inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
  })));
};

const formatNumber$1 = num => {
  return num !== null ? num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
};

function SearchTopLayerItem(_ref) {
  let {
    singleSearchSpec,
    myKey,
    search,
    config
  } = _ref;
  const myLoadingStatus = search.searchLoadingStatus[myKey];
  const [permaLinkModalOpen, setPermaLinkModalOpen] = useState(false);
  const this_result = search.searchResults[myKey];
  const num_results = this_result && this_result.result ? this_result.result.total_count : "Loading";
  const getMyIndex = useCallback(() => {
    const index = search.searchSpec.findIndex(item => item.key === myKey);
    return index;
  }, [search.searchSpec, myKey]);
  const setThisSearchSpec = useCallback(thisSpec => {
    // find the index of the item in the searchSpec array
    const index = getMyIndex(); // make a copy of the searchSpec array

    const newSearchSpec = [...search.searchSpec]; // replace the item at the index with the new item

    newSearchSpec[index] = thisSpec; // set the new searchSpec array

    search.setSearchSpec(newSearchSpec);
  }, [search, getMyIndex]);
  const enabled = search.searchesEnabled[myKey] !== undefined ? search.searchesEnabled[myKey] : false;
  const thecolor = search.getLineColor(getMyIndex());
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Modal, {
    isOpen: permaLinkModalOpen,
    onRequestClose: () => setPermaLinkModalOpen(false)
  }, "A permalink that will link to a tree zoomed to this search is below:", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("textarea", {
    onclick: "this.focus();this.select()",
    value: window.location.href + "&zoomToSearch=" + getMyIndex(),
    className: "border p-2 m-4 text-xs w-full bg-neutral-100",
    readOnly: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "border-gray-100 border-b pb-2"
  }, /*#__PURE__*/React.createElement("input", {
    name: "isGoing",
    type: "checkbox",
    style: {
      outline: enabled && num_results > 0 ? `2px solid rgb(${thecolor[0]},${thecolor[1]},${thecolor[2]})` : "0px",
      outlineOffset: "2px"
    },
    className: "m-3 inline-block",
    checked: enabled,
    onChange: event => search.setEnabled(myKey, event.target.checked)
  }), /*#__PURE__*/React.createElement(SearchItem, {
    config: config,
    singleSearchSpec: singleSearchSpec,
    setThisSearchSpec: setThisSearchSpec
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-black pr-2 text-sm"
  }, " ", num_results !== "Loading" && /*#__PURE__*/React.createElement(React.Fragment, null, formatNumber$1(num_results), " result", num_results === 1 ? "" : "s"), " ", num_results > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
    className: "inline-block bg-gray-100 text-xs mx-auto h-5 rounded border-gray-300 border  text-gray-700 ",
    onClick: () => {
      search.setZoomToSearch({
        index: getMyIndex()
      });
    },
    title: "Zoom to this search"
  }, /*#__PURE__*/React.createElement(FaSearch, null)), " ", // check if window href includes 'protoUrl'
  (window.location.href.includes("protoUrl") || window.location.href.includes("treeUrl") || window.location.href.includes("cov2tree.org") || window.location.href.includes("backend")) && config && !config.disable_permalink && /*#__PURE__*/React.createElement(Button, {
    className: "inline-block bg-gray-100 text-xs mx-auto h-5 rounded border-gray-300 border text-gray-700",
    onClick: () => {
      setPermaLinkModalOpen(true);
    },
    title: "Get permalink"
  }, /*#__PURE__*/React.createElement(FaLink, null)), " "), myLoadingStatus === "loading" && /*#__PURE__*/React.createElement(ClipLoader, {
    size: 12,
    color: "#444444",
    className: "mr-3"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    title: "Delete this search",
    onClick: () => search.deleteTopLevelSearch(myKey)
  }, /*#__PURE__*/React.createElement(FaTrash, {
    className: "text-gray-600"
  }))))));
}

const ListOutputModal = _ref => {
  let {
    backend,
    listOutputModalOpen,
    setListOutputModalOpen,
    nodeId,
    possibleKeys
  } = _ref;
  // display the output in a textarea
  const [selectedKey, setSelectedKey] = useState(possibleKeys[0]);
  const [listOutput, setListOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!listOutputModalOpen) {
      setListOutput([]);
    }
  }, [listOutputModalOpen]);
  useEffect(() => {
    if (listOutputModalOpen) {
      setLoading(true);
      backend.getTipAtts(nodeId, selectedKey, (err, res) => {
        if (err) {
          console.log(err);
        } else {
          setListOutput(res);
        }

        setLoading(false);
      });
    }
  }, [selectedKey, nodeId, listOutputModalOpen, backend]);
  return /*#__PURE__*/React.createElement(Modal, {
    ariaHideApp: false,
    isOpen: listOutputModalOpen,
    style: {
      content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        //width: '50%',
        backgroundColor: "#fafafa"
      }
    },
    onRequestClose: () => setListOutputModalOpen(false),
    contentLabel: "Example Modal"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-medium mb-3"
  }, "Tip list"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("select", {
    className: "block  w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline",
    value: selectedKey,
    onChange: e => setSelectedKey(e.target.value)
  }, possibleKeys.map(key => /*#__PURE__*/React.createElement("option", {
    key: key,
    value: key
  }, key))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline",
    onClick: () => setListOutputModalOpen(false)
  }, "Close"))), loading && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-gray-500"
  }, "Loading data...")), !loading && listOutput.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-gray-500"
  }, "No data available."), !loading && listOutput.length > 0 && /*#__PURE__*/React.createElement("textarea", {
    className: "w-full h-64 bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 shadow leading-tight focus:outline-none focus:shadow-outline",
    value: listOutput.join("\n"),
    readOnly: true
  })));
};

const prettify_x_types = {
  x_dist: "Distance",
  x_time: "Time"
};

const formatNumber = num => {
  return num !== null && typeof num === "number" ? num.toLocaleString() : "";
};

const formatNumberIfNumber = possNum => {
  return typeof possNum === "number" ? possNum.toLocaleString() : possNum;
};

const fixName = name => {
  return name; //return typeof name == "string"
  //  ? name.replace("hCoV-19/", "hCoV-19/\n")
  //  : name;
};

function SearchPanel(_ref) {
  let {
    search,
    colorBy,
    config,
    selectedDetails,
    overlayContent,
    setAboutEnabled,
    colorHook,
    xType,
    setxType,
    settings,
    backend,
    className,
    treenomeState,
    view,
    perNodeFunctions,
    toggleSidebar
  } = _ref;
  const covSpectrumQuery = useMemo(() => {
    if (selectedDetails.nodeDetails && selectedDetails.nodeDetails.node_id) {
      return perNodeFunctions.getCovSpectrumQuery(selectedDetails.nodeDetails.node_id);
    } else {
      return null;
    }
  }, [selectedDetails.nodeDetails]);
  const [listOutputModalOpen, setListOutputModalOpen] = useState(false);

  const handleDownloadJson = () => {
    if (selectedDetails.nodeDetails) {
      const node_id = selectedDetails.nodeDetails.node_id;
      backend.getNextstrainJson(node_id, config);
    }
  };

  const prettifyName = name => {
    if (config && config.customNames && config.customNames[name]) {
      return config.customNames[name];
    }

    if (name === "num_tips") {
      return "Number of descendants";
    }

    const new_name = name.replace("meta_", "").replace("_", " ");
    return new_name.charAt(0).toUpperCase() + new_name.slice(1);
  };

  const formatMetadataItem = key => {
    // if matches a markdown link "[abc](https://abc.com)" then..
    if (key === "num_tips" && selectedDetails.nodeDetails[key] === 1) return;

    if (selectedDetails.nodeDetails && selectedDetails.nodeDetails[key] && selectedDetails.nodeDetails[key].match && selectedDetails.nodeDetails[key].match(/\[.*\]\(.*\)/)) {
      const [, text, url] = selectedDetails.nodeDetails[key].match(/\[(.*)\]\((.*)\)/);
      return /*#__PURE__*/React.createElement("div", {
        className: "text-sm mt-1",
        key: key
      }, /*#__PURE__*/React.createElement("a", {
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-blue-800 underline"
      }, text, " ", /*#__PURE__*/React.createElement(BsBoxArrowInUpRight, {
        className: "inline-block ml-1"
      })));
    }

    if (config.metadataTypes && config.metadataTypes[key] === "sequence") {
      return /*#__PURE__*/React.createElement("div", {
        className: "text-sm mt-1",
        key: key
      }, /*#__PURE__*/React.createElement("span", {
        className: "font-semibold"
      }, prettifyName(key), ":"), " ", /*#__PURE__*/React.createElement("div", {
        className: "text-xs font-mono break-all"
      }, selectedDetails.nodeDetails[key]));
    }

    return /*#__PURE__*/React.createElement("div", {
      className: "text-sm mt-1",
      key: key
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-semibold"
    }, prettifyName(key), ":"), " ", colorBy.colorByField === key ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: colorHook.toRGBCSS(selectedDetails.nodeDetails[key])
      }
    }, selectedDetails.nodeDetails[key]) : formatNumberIfNumber(selectedDetails.nodeDetails[key]), key === "num_tips" && /*#__PURE__*/React.createElement("span", {
      className: "ml-1"
    }, /*#__PURE__*/React.createElement("a", {
      "data-for": "menu_descendants",
      "data-tip": "8",
      className: "cursor-pointer"
    }, " ", /*#__PURE__*/React.createElement(FaShare, {
      className: "inline-block"
    })), /*#__PURE__*/React.createElement(ReactTooltip, {
      id: "menu_descendants",
      getContent: dataTip => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "For this clade:"), /*#__PURE__*/React.createElement("div", {
        className: "mb-3"
      }, /*#__PURE__*/React.createElement(Button, {
        className: "",
        onClick: () => {
          if (selectedDetails.nodeDetails.num_tips > 100000 && !window.warning_shown) {
            // pop up a warning and ask if we want to continue
            alert("WARNING: This node has a large number of descendants. Displaying them all may take a while or crash this browser window. Are you sure you want to continue? If so press the button again.");
            window.warning_shown = true;
            return;
          }

          setListOutputModalOpen(true);
        }
      }, "List all tips")), config.enable_ns_download && selectedDetails.nodeDetails[key] < 1000000 && !config.from_newick && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "mb-3"
      }, /*#__PURE__*/React.createElement(Button, {
        className: "",
        onClick: handleDownloadJson
      }, "Download Nextstrain JSON")), backend.type === "server" && selectedDetails.nodeDetails[key] < 20000 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "mb-3"
      }, /*#__PURE__*/React.createElement(Button, {
        className: "",
        href: "https://nextstrain.org/fetch/" + backend.getNextstrainJsonUrl(selectedDetails.nodeDetails.node_id, config).replace("https://", "").replace("http://", ""),
        target: "_blank"
      }, "View clade in Nextstrain")))), config.covspectrum_links && /*#__PURE__*/React.createElement("div", {
        className: "mb-3"
      }, /*#__PURE__*/React.createElement(Button, {
        href: covSpectrumQuery,
        className: "",
        target: "_blank"
      }, "Find in CovSpectrum"))),
      effect: "solid",
      delayHide: 500,
      delayShow: 0,
      delayUpdate: 500,
      place: "right",
      border: true,
      type: "light"
    })));
  };

  return /*#__PURE__*/React.createElement("div", {
    className: classNames("flex flex-col px-4 divide-y text-sm", className)
  }, /*#__PURE__*/React.createElement("button", {
    onClick: toggleSidebar
  }, /*#__PURE__*/React.createElement("br", null), window.innerWidth > 768 ? /*#__PURE__*/React.createElement(MdArrowForward, {
    className: "mx-auto w-5 h-5 sidebar-toggle"
  }) : /*#__PURE__*/React.createElement(MdArrowDownward, {
    className: "mx-auto w-5 h-5 sidebar-toggle"
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 py-3"
  }, config.num_tips && /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 text-sm"
  }, overlayContent ? /*#__PURE__*/React.createElement(React.Fragment, null, "Displaying", " ", /*#__PURE__*/React.createElement("button", {
    className: "underline",
    onClick: () => {
      setAboutEnabled(true);
    }
  }, formatNumber(config.num_tips), " ", config.tipPluralNoun ? config.tipPluralNoun : "sequences"), " ", config.source && ` from ${config.source}`) : /*#__PURE__*/React.createElement(React.Fragment, null, "Displaying ", formatNumber(config.num_tips), " ", config.tipPluralNoun ? config.tipPluralNoun : "sequences", config.source && ` from ${config.source}`)), config.x_accessors && config.x_accessors.length > 1 && /*#__PURE__*/React.createElement("label", {
    className: "space-x-2 text-sm block"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-gray-500 text-sm"
  }, "Tree type:"), /*#__PURE__*/React.createElement(Select, {
    value: xType,
    onChange: e => setxType(e.target.value),
    className: "text-gray-500 text-xs py-0.5"
  }, config.x_accessors.map(x => /*#__PURE__*/React.createElement("option", {
    key: x,
    value: x
  }, prettify_x_types[x])))), treenomeState.genome && treenomeState.genome.length > 0 && window.location && !window.location.href.includes("disabletreenome") && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "text-gray-500 text-sm"
  }, "Treenome Browser:"), /*#__PURE__*/React.createElement("input", {
    name: "treenomeEnabled",
    style: {
      verticalAlign: "middle"
    },
    type: "checkbox",
    className: "m-3 inline-block",
    checked: settings.treenomeEnabled,
    onChange: event => {
      console.log(settings.treenomeEnabled);
      settings.setTreenomeEnabled(!settings.treenomeEnabled); // view.setViewState({
      //   ...view.viewState,
      //  "browser-main": { zoom: -2, target: [500, 1000] },
      // "browser-axis": { zoom: -2, target: [0, 1000] },
      // });
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      cursor: "default"
    },
    "data-tip": "Display a browser with each genome's mutations alongside the tree.\xA0<a href='https://docs.taxonium.org/en/latest/treenome.html' class='tooltipLink' target='_blank'>Learn more</a>",
    "data-html": true
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      verticalAlign: "middle"
    }
  }, /*#__PURE__*/React.createElement(BsQuestionCircle, null))), /*#__PURE__*/React.createElement(ReactTooltip, {
    delayHide: 400,
    className: "infoTooltip",
    place: "top",
    backgroundColor: "#e5e7eb",
    textColor: "#000",
    effect: "solid"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "py-3 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold text-gray-700 flex items-center whitespace-nowrap"
  }, /*#__PURE__*/React.createElement(BiPalette, {
    className: "mr-1.5 text-gray-500 h-5 w-5"
  }), // if locale is US return "Color by" otherwise "Colour by" :sob:
  window.navigator.language === "en-US" ? "Color by" : "Colour by", ":"), /*#__PURE__*/React.createElement(Select, {
    value: colorBy.colorByField,
    onChange: e => colorBy.setColorByField(e.target.value)
  }, colorBy.colorByOptions.map(item => /*#__PURE__*/React.createElement("option", {
    key: item,
    value: item
  }, prettifyName(item))))), colorBy.colorByField === "genotype" && /*#__PURE__*/React.createElement("div", {
    className: "space-x-2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "space-x-2"
  }, /*#__PURE__*/React.createElement("span", null, "Gene"), /*#__PURE__*/React.createElement(Select, {
    value: colorBy.colorByGene,
    onChange: e => colorBy.setColorByGene(e.target.value),
    className: "w-20"
  }, config.genes && config.genes.map(item => /*#__PURE__*/React.createElement("option", {
    key: item,
    value: item
  }, item)))), /*#__PURE__*/React.createElement("label", {
    className: "space-x-2"
  }, /*#__PURE__*/React.createElement("span", null, "Residue"), /*#__PURE__*/React.createElement("input", {
    value: colorBy.colorByPosition,
    onChange: e => colorBy.setColorByPosition(e.target.value !== "" ? parseInt(e.target.value) : ""),
    type: "number",
    min: "0",
    className: "inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "py-3 flex flex-col md:min-h-0"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold text-gray-700 flex items-center mb-2"
  }, /*#__PURE__*/React.createElement(FaSearch, {
    className: "ml-1 mr-1.5 text-gray-500 h-4 w-4"
  }), "Search"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 md:overflow-y-auto -mr-4 pr-4"
  }, search.searchSpec.map(item => /*#__PURE__*/React.createElement(SearchTopLayerItem, {
    key: item.key,
    singleSearchSpec: item,
    myKey: item.key,
    search: search,
    config: config
  })), /*#__PURE__*/React.createElement(Button, {
    className: "mx-auto flex items-center font-medium leading-6 mt-2",
    onClick: search.addNewTopLevelSearch
  }, /*#__PURE__*/React.createElement(RiAddCircleLine, {
    className: "mr-1 h-4 w-4 text-gray-500"
  }), /*#__PURE__*/React.createElement("span", null, "Add a new search")))), selectedDetails.nodeDetails && /*#__PURE__*/React.createElement("div", {
    className: "py-3 px-4 md:px-0 mb-0 fixed bottom-0 left-0 right-0 bg-white md:static shadow-2xl md:shadow-none overflow-auto"
  }, /*#__PURE__*/React.createElement(ListOutputModal, {
    ariaHideApp: false,
    nodeId: selectedDetails.nodeDetails.node_id,
    backend: backend,
    possibleKeys: ["name", ...config.keys_to_display],
    listOutputModalOpen: listOutputModalOpen,
    setListOutputModalOpen: setListOutputModalOpen
  }), /*#__PURE__*/React.createElement("header", {
    className: "flex items-start justify-between"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold whitespace-pre-wrap text-sm"
  }, selectedDetails.nodeDetails[config.name_accessor] !== "" ? fixName(selectedDetails.nodeDetails[config.name_accessor]) : /*#__PURE__*/React.createElement("i", null, "Internal node", " ", /*#__PURE__*/React.createElement("small", null, selectedDetails.nodeDetails.node_id)), selectedDetails.nodeDetails.parent_id !== selectedDetails.nodeDetails.node_id && /*#__PURE__*/React.createElement("button", {
    className: "inline-block text-sm text-gray-700 hover:text-black ml-2",
    title: "Select parent",
    onClick: () => {
      selectedDetails.getNodeDetails(selectedDetails.nodeDetails.parent_id);
    }
  }, /*#__PURE__*/React.createElement(RiArrowLeftUpLine, {
    className: "inline-block mr-2"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedDetails.clearNodeDetails(),
    className: "text-gray-500"
  }, "close")), colorBy.colorByField === "genotype" && /*#__PURE__*/React.createElement("span", {
    style: {
      color: colorHook.toRGBCSS(colorBy.getNodeColorField(selectedDetails.nodeDetails))
    }
  }, colorBy.colorByGene, ":", colorBy.colorByPosition, colorBy.getNodeColorField(selectedDetails.nodeDetails)), [...config.keys_to_display, "num_tips"].map(key => selectedDetails.nodeDetails[key] && formatMetadataItem(key)), config.mutations.length > 0 && selectedDetails.nodeDetails.node_id !== selectedDetails.nodeDetails.parent_id && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold mt-2 mb-0 text-gray-700 justify-between flex"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-1"
  }, "Mutations at this node:"), " ", settings.miniMutationsMenu()), /*#__PURE__*/React.createElement("div", {
    className: "text-xs leading-5 mt-1 text-gray-700"
  }, settings.filterMutations(selectedDetails.nodeDetails.mutations).map((mutation, i) => /*#__PURE__*/React.createElement("span", {
    key: mutation.mutation_id
  }, i > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, ", "), /*#__PURE__*/React.createElement("div", {
    className: "inline-block"
  }, mutation.gene, ":", mutation.previous_residue, mutation.residue_pos, mutation.new_residue))), selectedDetails.nodeDetails.mutations.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: " italic"
  }, "No", " ", settings.filterMutations([{
    type: "nt"
  }]).length === 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, "coding") : /*#__PURE__*/React.createElement(React.Fragment, null), " ", "mutations"))), /*#__PURE__*/React.createElement("div", null, selectedDetails.nodeDetails.acknowledgements && /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-3  text-gray-700 mr-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mt-1 justify"
  }, /*#__PURE__*/React.createElement("b", {
    className: "font-semibold"
  }, "Authors:"), " ", selectedDetails.nodeDetails.acknowledgements.authors)))));
}

const useTreenomeState = (data, deckRef, view, settings) => {
  const [yBounds, setYBounds] = useState([0, 0]);
  const [baseYBounds, setBaseYBounds] = useState([0, 0]);
  const [xBounds, setXbounds] = useState([0, 0]);
  const [pxPerBp, setPxPerBp] = useState(0);
  const [bpWidth, setBpWidth] = useState(0);
  const [genomeSize, setGenomeSize] = useState(0);
  const [genome, setGenome] = useState(null);
  const chromosomeName = useMemo(() => {
    return settings.isCov2Tree ? "NC_045512v2" : "chromosome";
  }, [settings.isCov2Tree]);
  useEffect(() => {
    if (genomeSize && genomeSize > 0 || !data || !data.base_data || !data.base_data.nodes) {
      return;
    }

    const nodes = data.base_data.nodes;

    for (let node of nodes) {
      if (node.parent_id === node.node_id) {
        let size = 0;
        let genome = "";

        for (let mut of node.mutations) {
          if (mut.gene === "nt") {
            if (size < mut.residue_pos) {
              size = mut.residue_pos;
            }

            genome += mut.new_residue;
          }
        }

        setGenomeSize(size);
        setGenome(genome);
      }
    }
  }, [setGenomeSize, genomeSize, genome, setGenome, data]);
  const [ntBounds, setNtBounds] = useState([0, genomeSize]);
  useEffect(() => {
    if (!data.data || !data.data.nodes || !settings.treenomeEnabled) {
      return;
    }

    const bounds = [0, 0];

    for (let node of data.data.nodes) {
      if (node.y < bounds[0]) {
        bounds[0] = node.y;
      }

      if (node.y > bounds[1]) {
        bounds[1] = node.y;
      }
    }

    setYBounds(bounds);
  }, [data.data, settings.treenomeEnabled]);
  useEffect(() => {
    if (!data.base_data || !data.base_data.nodes || !settings.treenomeEnabled) {
      return;
    }

    const bounds = [0, 0];

    for (let node of data.base_data.nodes) {
      if (node.y < bounds[0]) {
        bounds[0] = node.y;
      }

      if (node.y > bounds[1]) {
        bounds[1] = node.y;
      }
    }

    setBaseYBounds(bounds);
  }, [data.base_data, settings.treenomeEnabled]);
  const handleResize = useCallback(() => {
    console.log("calling handleResize");
    console.log(deckRef.current, settings.treenomeEnabled);

    if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager || !settings.treenomeEnabled) {
      return;
    }

    console.log("here in handleResize");
    const tempViewState = { ...view.viewState
    };
    console.log("tempViewState", tempViewState);
    view.setViewState(view.baseViewState);
    console.log("baseViewState", view.baseViewState);
    const vp = { ...deckRef.current.deck.getViewports()[1]
    };
    console.log("unprojecting:::resize");
    vp && setXbounds([vp.unproject([0, 0])[0], vp.unproject([vp.width, 0])[0]]);
    view.setViewState(tempViewState);
    console.log("back to ", view.viewState);
  }, [deckRef, setXbounds, view, settings.treenomeEnabled]);
  useEffect(() => {
    if (!settings.treenomeEnabled) {
      setJbrowseLoaded(false);
      setHandled(false);
    }
  }, [settings.treenomeEnabled]);
  const [jbrowseLoaded, setJbrowseLoaded] = useState(false);
  const [handled, setHandled] = useState(false);
  useEffect(() => {
    if (jbrowseLoaded && !handled) {
      console.log("handle resize");
      window.setTimeout(() => {
        handleResize();
      }, 200);
      setHandled(true);
    }
  }, [jbrowseLoaded, handleResize, setHandled, handled]);
  useEffect(() => {
    const observer = new MutationObserver(function (mutations, mutationInstance) {
      const jbrowse = document.getElementById("view-browser-axis");

      if (jbrowse) {
        console.log("set jbrowse loaded");
        setJbrowseLoaded(jbrowse);
        mutationInstance.disconnect();
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true
    });
  }, []);
  useEffect(() => {
    if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager || !settings.treenomeEnabled) {
      return;
    }

    const vp = { ...deckRef.current.deck.getViewports()[1]
    };

    if (pxPerBp) {
      console.log("thisone");
      setBpWidth(vp.unproject([pxPerBp, 0])[0] - vp.unproject([0, 0])[0]);
    }
  }, [deckRef, pxPerBp, settings.treenomeEnabled]);
  const state = useMemo(() => {
    return {
      xBounds,
      yBounds,
      ntBounds,
      setNtBounds,
      pxPerBp,
      setPxPerBp,
      bpWidth,
      handleResize,
      genome,
      genomeSize,
      chromosomeName,
      baseYBounds
    };
  }, [xBounds, yBounds, ntBounds, setNtBounds, pxPerBp, setPxPerBp, bpWidth, handleResize, genome, genomeSize, chromosomeName, baseYBounds]);
  return state;
};

let globalSetZoomAxis = () => {};

class MyOrthographicController extends OrthographicController {
  // on construction
  // Default handler for the `wheel` event.
  onWheel(event) {
    const controlKey = event.srcEvent.ctrlKey || event.srcEvent.metaKey || event.srcEvent.altKey;

    if (!this.scrollZoom) {
      return false;
    }

    event.preventDefault();
    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos, event)) {
      return false;
    }

    let {
      speed = 0.01,
      smooth = false,
      zoomAxis = "Y"
    } = this.scrollZoom;

    if (controlKey) {
      zoomAxis = "X";
      globalSetZoomAxis(zoomAxis);
    }

    const {
      delta
    } = event; // Map wheel delta to relative scale

    let scale = 2 / (1 + Math.exp(-Math.abs(delta * speed)));

    if (delta < 0 && scale !== 0) {
      scale = 1 / scale;
    }

    const newControllerState = this.controllerState.zoom({
      pos,
      scale
    });
    let transitionDuration = smooth ? 250 : 1;

    if (zoomAxis === "X") {
      transitionDuration = 0;
    }

    this.updateViewport(newControllerState, { ...this._getTransitionProps({
        around: pos
      }),
      transitionDuration: transitionDuration
    }, {
      isZooming: zoomAxis === "Y",
      isPanning: true
    });

    if (controlKey) {
      zoomAxis = "Y";
      globalSetZoomAxis(zoomAxis);
    }

    return true;
  }

  handleEvent(event) {
    if (event.pointerType === "touch") {
      if (event.type === "pinchmove") {
        if (this.scrollZoom && this.scrollZoom.zoomAxis && this.scrollZoom.zoomAxis === "X") {
          return false;
        }
      }
    }

    if (event.type === "wheel") {
      const {
        ControllerState
      } = this;
      this.controllerState = new ControllerState({
        makeViewport: this.makeViewport,
        ...this.controllerStateProps,
        ...this._state
      });
      return this.onWheel(event);
    } else {
      super.handleEvent(event);
    }
  }

}

const useView = _ref => {
  let {
    settings,
    deckSize,
    deckRef,
    jbrowseRef
  } = _ref;
  const [zoomAxis, setZoomAxis] = useState("Y");
  const [xzoom, setXzoom] = useState(window.screen.width < 600 ? -1 : 0);
  globalSetZoomAxis = setZoomAxis; // TODO target needs to be [0,0]

  const [viewState, setViewState] = useState({
    zoom: -2,
    target: [window.screen.width < 600 ? 500 : 1400, 1000],
    pitch: 0,
    bearing: 0,
    minimap: {
      zoom: -3,
      target: [250, 1000]
    },
    "browser-main": {
      zoom: -2,
      target: [0, 1000]
    },
    "browser-axis": {
      zoom: -2,
      target: [0, 1000]
    }
  });
  useEffect(() => {
    // setViewState((prevState) => {
    //   return {
    //     ...prevState,
    //     target: [
    //       window.screen.width < 600
    //         ? 500
    //         : settings.treenomeEnabled
    //         ? 2600
    //         : 1400,
    //       1000,
    //     ],
    //   };
    // });
    setXzoom(window.screen.width < 600 ? -1 : settings.treenomeEnabled ? -1 : 0);
  }, [settings.treenomeEnabled]);
  const baseViewState = useMemo(() => {
    return { ...viewState,
      "browser-main": {
        zoom: 0,
        target: [0, 0]
      },
      "browser-axis": {
        zoom: 0,
        target: [0, 0]
      }
    };
  }, [viewState]);
  const views = useMemo(() => {
    return [...(settings.minimapEnabled && !settings.treenomeEnabled ? [new OrthographicView({
      id: "minimap",
      x: "79%",
      y: "1%",
      width: "20%",
      height: "35%",
      borderWidth: "1px",
      controller: true // clear: true,

    })] : []), ...(settings.treenomeEnabled ? [new OrthographicView({
      id: "browser-axis",
      controller: false,
      x: "40%",
      y: "0%",
      width: "60%"
    }), new OrthographicView({
      id: "browser-main",
      controller: false,
      x: "40%",
      width: "60%"
    })] : []), ...[new OrthographicView({
      id: "main",
      controller: {
        type: MyOrthographicController,
        scrollZoom: {
          smooth: true,
          zoomAxis: zoomAxis,
          xzoom: xzoom
        }
      },
      width: settings.treenomeEnabled ? "40%" : "100%",
      initialViewState: viewState
    })], ...(settings.treenomeEnabled ? [new OrthographicView({
      id: "main-overlay",
      controller: {
        type: MyOrthographicController,
        scrollZoom: {
          smooth: true,
          zoomAxis: zoomAxis,
          xzoom: xzoom
        }
      },
      width: "100%",
      initialViewState: viewState
    })] : [])];
  }, [viewState, zoomAxis, settings.minimapEnabled, settings.treenomeEnabled, xzoom]);
  const [mouseXY, setMouseXY] = useState([0, 0]);
  const modelMatrix = useMemo(() => {
    return [1 / 2 ** (viewState.zoom - xzoom), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }, [viewState.zoom, xzoom]);
  const onViewStateChange = useCallback(_ref2 => {
    let {
      viewState: newViewState,
      interactionState,
      viewId,
      oldViewState,
      basicTarget,
      overrideZoomAxis
    } = _ref2;

    if (!deckSize) {
      return;
    }

    const localZoomAxis = overrideZoomAxis || zoomAxis; // check oldViewState has a initial_xzoom property or set it to initial_xzoom

    if (viewId === "minimap") {
      return;
    } //const temp_viewport = new OrthographicViewport(viewS


    const oldScaleY = 2 ** oldViewState.zoom;
    const newScaleY = 2 ** newViewState.zoom; // eslint-disable-line no-unused-vars

    let newScaleX = 2 ** xzoom;

    if (basicTarget) {
      newViewState.target[0] = newViewState.target[0] / newScaleY * newScaleX;
    } else {
      if (oldScaleY !== newScaleY) {
        if (localZoomAxis === "Y") {
          newViewState.target[0] = oldViewState.target[0] / newScaleY * oldScaleY;
        } else {
          const difference = newViewState.zoom - oldViewState.zoom;
          setXzoom(old => old + difference);
          newScaleX = 2 ** (xzoom + difference);
          newViewState.zoom = oldViewState.zoom;
          newViewState.target[0] = oldViewState.target[0] / oldScaleY * newScaleY;
        }
      }
    }

    newViewState.target = [...newViewState.target];
    newViewState.real_height = deckSize.height / newScaleY;
    newViewState.real_width = deckSize.width / newScaleX;
    newViewState.real_target = [...newViewState.target];
    newViewState.real_target[0] = newViewState.real_target[0] * newScaleY / newScaleX;
    const nw = [newViewState.real_target[0] - newViewState.real_width / 2, newViewState.real_target[1] - newViewState.real_height / 2];
    const se = [newViewState.real_target[0] + newViewState.real_width / 2, newViewState.real_target[1] + newViewState.real_height / 2];
    newViewState.min_x = nw[0];
    newViewState.max_x = se[0];
    newViewState.min_y = nw[1];
    newViewState.max_y = se[1];
    newViewState["minimap"] = {
      zoom: -3,
      target: [250, 1000]
    };

    if (jbrowseRef.current) {
      const yBound = jbrowseRef.current.children[0].children[0].clientHeight;
      const xBound = jbrowseRef.current.children[0].children[0].offsetParent.offsetParent.offsetLeft;

      if (mouseXY[0] > xBound && mouseXY[1] < yBound || mouseXY[0] < 0 || mouseXY[1] < 0) {
        if (!basicTarget && viewId) {
          return;
        }
      }
    } // Treenome view state


    if (viewId === "main" || viewId === "main-overlay" || !viewId) {
      newViewState["browser-main"] = { ...viewState["browser-main"],
        zoom: newViewState.zoom,
        target: [viewState["browser-main"].target[0], newViewState.target[1]]
      };
    }

    setViewState(newViewState);
    return newViewState;
  }, [zoomAxis, xzoom, deckSize, viewState, jbrowseRef, mouseXY]);
  const zoomIncrement = useCallback((increment, overrideZoomAxis) => {
    const newViewState = { ...viewState
    };
    newViewState.zoom += increment;
    onViewStateChange({
      viewState: newViewState,
      interactionState: "isZooming",
      oldViewState: viewState,
      overrideZoomAxis
    });
  }, [viewState, onViewStateChange]);
  const output = useMemo(() => {
    return {
      viewState,
      setViewState,
      onViewStateChange,
      views,
      zoomAxis,
      setZoomAxis,
      modelMatrix,
      zoomIncrement,
      xzoom,
      mouseXY,
      setMouseXY,
      baseViewState
    };
  }, [viewState, setViewState, onViewStateChange, views, zoomAxis, setZoomAxis, modelMatrix, zoomIncrement, xzoom, mouseXY, setMouseXY, baseViewState]);
  return output;
};

const DEBOUNCE_TIME = 100;
const CHECK_AGAIN_TIME = 100;

function addNodeLookup(data) {
  const output = { ...data,
    nodeLookup: Object.fromEntries(data.nodes.map(n => [n.node_id, n]))
  };
  console.log("cc");
  return output;
}

function useGetDynamicData(backend, colorBy, viewState, config, xType) {
  const {
    queryNodes
  } = backend;
  const [dynamicData, setDynamicData] = useState({
    status: "not_started",
    data: []
  });
  let [boundsForQueries, setBoundsForQueries] = useState(null);
  let [triggerRefresh, setTriggerRefresh] = useState({});
  let [timeoutRef, setTimeoutRef] = useState(null);
  useEffect(() => {
    if (!boundsForQueries || xType !== boundsForQueries.xType || (viewState.min_x < boundsForQueries.min_x + viewState.real_width / 2 || viewState.max_x > boundsForQueries.max_x - viewState.real_width / 2 || viewState.min_y < boundsForQueries.min_y + viewState.real_height / 2 || viewState.max_y > boundsForQueries.max_y - viewState.real_height / 2 || Math.abs(viewState.zoom - boundsForQueries.zoom) > 0.5)) {
      if (window.log) {
        console.log([viewState.min_x, boundsForQueries.min_x]);
      }

      console.log("updating parameters to query");
      const newBoundForQuery = {
        min_x: viewState.min_x - viewState.real_width,
        max_x: viewState.max_x + viewState.real_width,
        min_y: viewState.min_y - viewState.real_height,
        max_y: viewState.max_y + viewState.real_height,
        zoom: viewState.zoom,
        xType: xType
      };
      setBoundsForQueries(newBoundForQuery);
      console.log("updating bounds", newBoundForQuery);
    }
  }, [viewState, boundsForQueries, triggerRefresh, xType]);
  const isCurrentlyOutsideBounds = useMemo(() => viewState.min_x && dynamicData && dynamicData.lastBounds && dynamicData.lastBounds.min_x && (viewState.min_x < dynamicData.lastBounds.min_x || viewState.max_x > dynamicData.lastBounds.max_x || viewState.min_y < dynamicData.lastBounds.min_y || viewState.max_y > dynamicData.lastBounds.max_y), [viewState, dynamicData]);
  useEffect(() => {
    if (config.title !== "loading") {
      clearTimeout(timeoutRef);
      setTimeoutRef(setTimeout(() => {
        if (!boundsForQueries) return;

        if (dynamicData.status === "loading") {
          console.log("not trying to get as we are still loading");
          clearTimeout(timeoutRef);
          setTimeoutRef(setTimeout(() => {
            setTriggerRefresh({});
          }, CHECK_AGAIN_TIME));
          return;
        }

        console.log("attempting get"); // Make call to backend to get data

        setDynamicData({ ...dynamicData,
          status: "loading"
        });
        queryNodes(boundsForQueries, result => {
          console.log("got result, bounds were", boundsForQueries, " result is ");
          setDynamicData(prevData => {
            const new_result = { ...prevData,
              status: "loaded",
              data: addNodeLookup(result),
              lastBounds: boundsForQueries
            };

            if (!boundsForQueries || isNaN(boundsForQueries.min_x)) {
              new_result.base_data = addNodeLookup(result);
            } else {
              if (!prevData.base_data || prevData.base_data_is_invalid) {
                console.log("query for minimap");
                queryNodes(null, base_result => {
                  setDynamicData(prevData => {
                    const new_result = { ...prevData,
                      status: "loaded",
                      base_data: addNodeLookup(base_result),
                      base_data_is_invalid: false
                    };
                    return new_result;
                  });
                }, undefined, config);
              }
            }

            return new_result;
          });
        }, setTriggerRefresh, config);
      }, DEBOUNCE_TIME));
    } // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [boundsForQueries, queryNodes, triggerRefresh, config]);
  return {
    data: dynamicData,
    boundsForQueries,
    isCurrentlyOutsideBounds
  };
}

let rgb_cache = {};

const useColor = colorMapping => {
  const toRGB_uncached = useCallback(string => {
    if (typeof string === "number") {
      const log10 = Math.log10(string);
      const color = scale.plasma(log10 / 10); // convert from hex to rgb

      const rgb = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
      console.log(rgb);
      return rgb;
    }

    if (string in colorMapping) {
      return colorMapping[string];
    }

    const amino_acids = {
      A: [230, 25, 75],
      R: [60, 180, 75],
      N: [255, 225, 25],
      D: [67, 99, 216],
      C: [245, 130, 49],
      Q: [70, 240, 240],
      E: [145, 30, 180],
      G: [240, 50, 230],
      H: [188, 246, 12],
      I: [250, 190, 190],
      L: [230, 0, 255],
      K: [0, 128, 128],
      M: [154, 99, 36],
      F: [154, 60, 256],
      P: [128, 0, 0],
      T: [170, 255, 195],
      W: [128, 128, 0],
      Y: [0, 0, 117],
      V: [0, 100, 177],
      X: [128, 128, 128],
      O: [255, 255, 255],
      Z: [0, 0, 0]
    };

    if (amino_acids[string]) {
      return amino_acids[string];
    }

    if (string === undefined) {
      return [200, 200, 200];
    }

    if (string === "") {
      return [200, 200, 200];
    }

    if (string === "unknown") {
      return [200, 200, 200];
    }

    if (string === "None") {
      return [220, 220, 220];
    }

    if (string === "N/A") {
      return [180, 180, 180];
    }

    if (string === "NA") {
      return [180, 180, 180];
    }

    if (string === "USA") {
      return [95, 158, 245]; //This is just because the default is ugly
    }

    if (string === "B.1.2") {
      return [95, 158, 245]; //This is near B.1.617.2
    }

    if (string === "England") {
      return [214, 58, 15]; // UK all brick
    }

    if (string === "Scotland") {
      return [255, 130, 82]; // UK all brick
    }

    if (string === "North America") {
      return [200, 200, 50];
    }

    if (string === "South America") {
      return [200, 100, 50];
    }

    if (string === "Wales") {
      return [148, 49, 22]; // UK all brick
    }

    if (string === "Northern Ireland") {
      return [140, 42, 15]; // UK all brick
    }

    if (string === "France") {
      return [140, 28, 120]; // diff to UK
    }

    if (string === "Germany") {
      return [106, 140, 28]; // diff to UK
    }

    if (string === "India") {
      return [61, 173, 166]; // diff to UK
    }

    if (string === "Denmark") {
      return [24, 112, 32]; // diff to UK
    }

    if (string === "Democratic Republic of the Congo") {
      return [17, 58, 99]; // otherwise too similar to CAR
    }

    string = string.split("").reverse().join("");
    var hash = 0;
    if (string.length === 0) return hash;

    for (var i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }

    var rgb = [0, 0, 0];

    for (i = 0; i < 3; i++) {
      var value = hash >> i * 8 & 255;
      rgb[i] = value;
    }

    if (rgb[0] + rgb[1] + rgb[2] < 150 || rgb[0] + rgb[1] + rgb[2] > 500) {
      return toRGB_uncached(string + "_");
    }

    return rgb;
  }, [colorMapping]);
  const toRGB = useCallback(string => {
    if (rgb_cache[string]) {
      return rgb_cache[string];
    } else {
      const result = toRGB_uncached(string);
      rgb_cache[string] = result;
      return result;
    }
  }, [toRGB_uncached]);
  const toRGBCSS = useCallback(string => {
    const output = toRGB(string);
    return `rgb(${output[0]},${output[1]},${output[2]})`;
  }, [toRGB]);
  const output = useMemo(() => {
    return {
      toRGB,
      toRGBCSS
    };
  }, [toRGB, toRGBCSS]);
  return output;
};

function reduceMaxOrMin(array, accessFunction, maxOrMin) {
  if (maxOrMin === "max") {
    return accessFunction(array.reduce(function (max, item) {
      return accessFunction(item) > accessFunction(max) ? item : max;
    }));
  } else if (maxOrMin === "min") {
    return accessFunction(array.reduce(function (min, item) {
      return accessFunction(item) < accessFunction(min) ? item : min;
    }));
  }
}

const useSearch = _ref => {
  let {
    data,
    config,
    boundsForQueries,
    view,
    backend,
    query,
    updateQuery,
    deckSize,
    xType,
    settings
  } = _ref;
  const {
    singleSearch
  } = backend;
  const [inflightSearches, setInflightSearches] = useState([]);
  const [searchControllers, setSearchControllers] = useState({});
  const searchSpec = useMemo(() => {
    return JSON.parse(query.srch);
  }, [query.srch]);
  const [zoomToSearch, setZoomToSearch] = useState(query.zoomToSearch ? {
    index: query.zoomToSearch
  } : null);
  const searchesEnabled = query.enabled ? JSON.parse(query.enabled) : {};

  const setEnabled = (key, enabled) => {
    console.log("setEnabled", key, enabled);
    const newSearchesEnabled = { ...searchesEnabled,
      [key]: enabled
    };
    updateQuery({
      enabled: JSON.stringify(newSearchesEnabled)
    });
  };

  const setSearchSpec = newSearchSpec => {
    updateQuery({
      srch: JSON.stringify(newSearchSpec)
    });
  };

  const [searchResults, setSearchResults] = useState({});
  const [jsonSearch, setJsonSearch] = useState({});
  const timeouts = useRef({});
  const [searchLoadingStatus, setSearchLoadingStatus] = useState({});

  const setIndividualSearchLoadingStatus = (key, status) => {
    setSearchLoadingStatus(prev => ({ ...prev,
      [key]: status
    }));
  };

  const singleSearchWrapper = useCallback((key, this_json, boundsForQueries, setter) => {
    const everything = {
      key,
      this_json,
      boundsForQueries
    };
    const everything_string = JSON.stringify(everything);

    if (inflightSearches.includes(everything_string)) {
      return;
    }

    setInflightSearches(prev => [...prev, everything_string]);

    if (searchControllers[key]) {
      searchControllers[key].forEach(controller => {
        if (controller && boundsForQueries == controller.bounds) {
          console.log("cancelling for ", key);
          controller.con.abort();
        }
      });
    }

    searchControllers[key] = [];
    const {
      abortController
    } = singleSearch(this_json, boundsForQueries, x => {
      setInflightSearches(prev => prev.filter(s => s !== everything_string));
      setter(x);
    });
    searchControllers[key] = [...searchControllers[key], {
      con: abortController,
      bounds: boundsForQueries
    }];
    setSearchControllers({ ...searchControllers
    });
  }, [searchControllers, singleSearch, inflightSearches]);
  useEffect(() => {
    // Remove search results which are no longer in the search spec
    const spec_keys = searchSpec.map(spec => spec.key);
    const result_keys = Object.keys(searchResults);
    const keys_to_remove = result_keys.filter(key => !spec_keys.includes(key));
    keys_to_remove.forEach(key => {
      delete searchResults[key];
    }); // create object that maps from keys to json strings of specs

    const spec_json = {};
    searchSpec.forEach(spec => {
      spec_json[spec.key] = JSON.stringify(spec);
    }); // check which json strings have changed

    const json_changed = Object.keys(spec_json).filter(key => spec_json[key] !== jsonSearch[key]); // also add any result where the result type is not complete, and the bounding box has changed

    const result_changed = Object.keys(searchResults).filter(key => {
      if (!(searchResults[key].result.type === "complete") && searchResults[key].boundingBox !== boundsForQueries) {
        console.log("result_changed", key, searchResults[key].boundingBox, boundsForQueries);
        return true;
      }

      return false;
    }); // if any json strings have changed, update the search results

    if (json_changed.length > 0) {
      setJsonSearch(spec_json);
    }

    const all_changed_with_dupes = json_changed.concat(result_changed);
    const all_changed = [...new Set(all_changed_with_dupes)]; // remove dupes
    // if there are changed json strings, update the search results

    if (all_changed.length > 0) {
      all_changed.forEach(key => {
        console.log("searching for " + key, JSON.parse(spec_json[key]));
        const this_json = spec_json[key];
        console.log("performing search");

        const do_search = () => {
          setIndividualSearchLoadingStatus(key, "loading");
          singleSearchWrapper(key, this_json, boundsForQueries, result => {
            setSearchResults(prevState => {
              const new_result = {
                boundingBox: boundsForQueries,
                result: result
              };

              if (result.type === "complete") {
                new_result.overview = result.data;
              } else {
                if (prevState[key] && prevState[key].overview && !json_changed.includes(key)) {
                  new_result.overview = prevState[key].overview;
                } else {
                  if (!boundsForQueries || isNaN(boundsForQueries.min_x)) {
                    new_result.overview = result.data;
                  } else {
                    singleSearchWrapper(key, this_json, null, result => {
                      setSearchResults(prevState => {
                        let new_result = prevState[key];

                        if (new_result) {
                          new_result.overview = result.data;
                        } else {
                          new_result = {
                            overview: result.data
                          };
                        }

                        return { ...prevState,
                          [key]: new_result
                        };
                      });
                    });
                  }
                }
              }

              return { ...prevState,
                [key]: new_result
              };
            }); //console.log(searchResults);

            setIndividualSearchLoadingStatus(key, "loaded");
          });
        }; // debounce the search


        if (timeouts.current[key]) {
          clearTimeout(timeouts.current[key]);
          console.log("clearing timeout");
        }

        timeouts.current[key] = setTimeout(do_search, 500);
      });
    }
  }, [searchSpec, searchResults, jsonSearch, singleSearch, singleSearchWrapper, boundsForQueries]);

  const addNewTopLevelSearch = () => {
    console.log("addNewTopLevelSearch"); // get a random string key

    const newSearch = getDefaultSearch();
    setSearchSpec([...searchSpec, newSearch]);
    setTimeout(() => {
      setEnabled(newSearch.key, true);
    }, 50);
  };

  const deleteTopLevelSearch = key => {
    setSearchSpec(searchSpec.filter(s => s.key !== key));
  };

  const lineColors = [[255, 0, 0], [0, 0, 255], [0, 255, 0], [255, 0, 255], [0, 255, 255], [255, 255, 0]];

  const getLineColor = index => lineColors[index % lineColors.length];

  useEffect(() => {
    if (zoomToSearch && deckSize) {
      const {
        index
      } = zoomToSearch;
      const relevant = searchResults[searchSpec[index].key];

      if (!relevant) {
        console.log("no search results for index", index);
        console.log(searchResults);
        return;
      }

      const {
        overview
      } = relevant;

      if (!overview || overview.length === 0) {
        console.log("no overview for index", index);
        return;
      }

      const min_y = reduceMaxOrMin(overview, d => d.y, "min");
      const max_y = reduceMaxOrMin(overview, d => d.y, "max"); // eslint-disable-next-line no-unused-vars

      const min_x = reduceMaxOrMin(overview, d => d[xType], "min"); // eslint-disable-next-line no-unused-vars

      const max_x = reduceMaxOrMin(overview, d => d[xType], "max");
      console.log("Doing zoom", min_y, max_y, min_x, max_x);
      const oldViewState = { ...view.viewState
      };
      const newZoom = 9 - Math.log2(max_y - min_y + 50000 / (config.num_nodes ? config.num_nodes : 10000));
      const new_target = settings.treenomeEnabled ? [oldViewState.target[0], (min_y + max_y) / 2] : [(min_x + max_x) / 2, (min_y + max_y) / 2];
      const viewState = { ...view.viewState,
        real_target: undefined,
        target: new_target,
        zoom: newZoom
      };
      console.log("zoom to search new VS", viewState.target[0], viewState.target[1]);
      view.onViewStateChange({
        viewState: viewState,
        interactionState: "isZooming",
        oldViewState,
        basicTarget: settings.treenomeEnabled ? false : true
      });
      updateQuery({
        zoomToSearch: undefined
      });
      setZoomToSearch(undefined);
    }
  }, [zoomToSearch, searchResults, deckSize, config.num_nodes, settings.treenomeEnabled, searchSpec, updateQuery, view, xType]);
  return {
    searchResults,
    searchSpec,
    setSearchSpec,
    addNewTopLevelSearch,
    deleteTopLevelSearch,
    getLineColor,
    setZoomToSearch,
    searchesEnabled,
    setEnabled,
    searchLoadingStatus
  };
};

let colorCache = {};

function useColorBy(config, query, updateQuery) {
  const colorByConfig = useMemo(() => {
    return query.color ? JSON.parse(query.color) : {};
  }, [query.color]);
  const colorByField = colorByConfig.field ? colorByConfig.field : config.defaultColorByField ? config.defaultColorByField : "meta_pangolin_lineage";
  const colorByGene = colorByConfig.gene ? colorByConfig.gene : config.genes && config.genes.includes("S") ? "S" : "nt";
  const colorByPosition = colorByConfig.pos !== undefined ? colorByConfig.pos : 501;
  const {
    colorByOptions
  } = config.colorBy ? config.colorBy : {
    colorByOptions: []
  };
  window.cc = colorCache;
  const setColorByField = useCallback(field => {
    updateQuery({
      color: JSON.stringify({ ...colorByConfig,
        field
      })
    });
  }, [colorByConfig, updateQuery]);
  const setColorByGene = useCallback(gene => {
    updateQuery({
      color: JSON.stringify({ ...colorByConfig,
        gene
      })
    });
  }, [colorByConfig, updateQuery]);
  const setColorByPosition = useCallback(pos => {
    updateQuery({
      color: JSON.stringify({ ...colorByConfig,
        pos
      })
    });
  }, [colorByConfig, updateQuery]);
  useEffect(() => {
    console.log("clearing cache");
    colorCache = {};
  }, [colorByGene, colorByPosition]);
  const getNodeColorField = useCallback((node, dataset) => {
    if (colorByField === "None") {
      return "None";
    }

    if (colorByField === "genotype") {
      if (colorCache[node.node_id]) {
        //console.log("using cache");
        return colorCache[node.node_id];
      }

      let result;
      const relevantMutations = node.mutations.filter(mut => mut.residue_pos === colorByPosition && mut.gene === colorByGene);

      if (relevantMutations.length > 0) {
        result = relevantMutations[0].new_residue;
      } else {
        const parent_id = node.parent_id;

        if (parent_id === node.node_id) {
          result = "X";
        } else {
          if (dataset && dataset.nodeLookup && dataset.nodeLookup[parent_id]) {
            result = getNodeColorField(dataset.nodeLookup[parent_id], dataset);
          } else {
            result = "X";
          }
        }
      }

      colorCache[node.node_id] = result;
      return result;
    } else {
      return node[colorByField];
    }
  }, [colorByField, colorByGene, colorByPosition]);
  return useMemo(() => {
    return {
      colorByField,
      setColorByField,
      colorByOptions,
      getNodeColorField,
      colorByPosition,
      setColorByPosition,
      colorByGene,
      setColorByGene
    };
  }, [colorByField, colorByOptions, getNodeColorField, colorByPosition, colorByGene, setColorByField, setColorByGene, setColorByPosition]);
}

function useNodeDetails(nickname, backend) {
  const [nodeDetails, setNodeDetails] = useState(null);
  const timeout = useRef(null);
  const getNodeDetails = useCallback(node_id => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      backend.getDetails(node_id, setNodeDetails);
    }, 50);
  }, [backend]);
  const clearNodeDetails = useCallback(() => {
    setNodeDetails(null);
  }, []);
  return {
    nodeDetails,
    getNodeDetails,
    clearNodeDetails
  };
}

function useHoverDetails() {
  const [nodeDetails, setNodeDetails] = useState(null);
  const clearNodeDetails = useCallback(() => {
    setNodeDetails(null);
  }, []);
  return {
    nodeDetails,
    setNodeDetails,
    clearNodeDetails
  };
}

function useServerBackend(backend_url, sid, url_on_fail) {
  const [statusMessage, setStatusMessage] = useState({
    message: null
  });
  const queryNodes = useCallback((boundsForQueries, setResult, setTriggerRefresh, config) => {
    let url = backend_url + "/nodes/?type=leaves&sid=" + sid;

    if (boundsForQueries && boundsForQueries.min_x && boundsForQueries.max_x && boundsForQueries.min_y && boundsForQueries.max_y) {
      url = url + "&min_x=" + boundsForQueries.min_x + "&max_x=" + boundsForQueries.max_x + "&min_y=" + boundsForQueries.min_y + "&max_y=" + boundsForQueries.max_y;
    }

    if (boundsForQueries && boundsForQueries.xType) {
      url = url + "&xType=" + boundsForQueries.xType;
    }

    axios.get(url).then(function (response) {
      console.log("got data", response.data);
      response.data.nodes.forEach(node => {
        if (node.node_id === config.rootId) {
          node.mutations = config.rootMutations.map(x => config.mutations[x]);
        } else {
          node.mutations = node.mutations.map(mutation => config.mutations[mutation]);
        }
      });
      setResult(response.data);
    }).catch(function (error) {
      console.log(error);
      window.alert(error);
      setResult([]);
      setTriggerRefresh({});
    });
  }, [backend_url, sid]);
  const singleSearch = useCallback((singleSearch, boundsForQueries, setResult) => {
    const abortController = new AbortController();
    let url = backend_url + "/search/?json=" + JSON.stringify(singleSearch) + "&sid=" + sid;
    const xType = boundsForQueries && boundsForQueries.xType ? boundsForQueries.xType : "x_dist";

    if (boundsForQueries && boundsForQueries.min_x && boundsForQueries.max_x && boundsForQueries.min_y && boundsForQueries.max_y) {
      url = url + "&min_x=" + boundsForQueries.min_x + "&max_x=" + boundsForQueries.max_x + "&min_y=" + boundsForQueries.min_y + "&max_y=" + boundsForQueries.max_y;
    }

    url = url + "&xType=" + xType;
    axios.get(url, {
      signal: abortController.signal
    }).then(function (response) {
      console.log("got data", response.data);
      setResult(response.data);
    }).catch(function (error) {
      // if cancelled then do nothing
      if (error.name === "CanceledError") {
        return;
      }

      console.log(error);
      window.alert(error);
      setResult([]);
    });
    return {
      abortController
    };
  }, [backend_url, sid]);
  const getDetails = useCallback((node_id, setResult) => {
    let url = backend_url + "/node_details/?id=" + node_id + "&sid=" + sid;
    axios.get(url).then(function (response) {
      setResult(response.data);
    });
  }, [backend_url, sid]);
  const getConfig = useCallback(setResult => {
    let url = backend_url + "/config/?sid=" + sid;
    axios.get(url).then(function (response) {
      console.log("got config", response.data);

      if (response.data.error) {
        window.alert(response.data.error + (url_on_fail ? "\nRedirecting you." : ""));
        window.location.href = url_on_fail;
      }

      setResult(response.data);
    });
  }, [backend_url, sid, url_on_fail]);
  const getTipAtts = useCallback((nodeId, selectedKey, callback) => {
    let url = backend_url + "/tip_atts?id=" + nodeId + "&att=" + selectedKey + "&sid=" + sid;
    axios.get(url).then(function (response) {
      callback(response.err, response.data);
    });
  }, [backend_url, sid]);
  const getNextstrainJsonUrl = useCallback((nodeId, config) => {
    return backend_url + "/nextstrain_json/" + nodeId;
  }, [backend_url]);
  const getNextstrainJson = useCallback((nodeId, config) => {
    const url = getNextstrainJsonUrl(nodeId, config); // load this

    window.location.href = url;
  }, [getNextstrainJsonUrl]);
  return useMemo(() => {
    return {
      queryNodes,
      singleSearch,
      getDetails,
      getConfig,
      setStatusMessage,
      statusMessage,
      getTipAtts,
      type: "server",
      backend_url: backend_url,
      getNextstrainJson,
      getNextstrainJsonUrl
    };
  }, [queryNodes, singleSearch, getDetails, getConfig, setStatusMessage, statusMessage, getTipAtts, backend_url, getNextstrainJson, getNextstrainJsonUrl]);
}

console.log("new worker");
const worker = new Worker(new URL("../webworkers/localBackendWorker.js", import.meta.url));

let onQueryReceipt = receivedData => {};

let onStatusReceipt = receivedData => {
  console.log("STATUS:", receivedData.data);
};

let onConfigReceipt = receivedData => {};

let onDetailsReceipt = receivedData => {};

let onListReceipt = receivedData => {};

let onNextStrainReceipt = receivedData => {
  console.log("NEXT STRAIN:", receivedData); // create a blob with this data and trigger download

  const blob = new Blob([JSON.stringify(receivedData)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "nextstrain.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

let searchSetters = {};

worker.onmessage = event => {
  console.log("got message from worker" //, event.data
  );

  if (event.data.type === "status") {
    onStatusReceipt(event.data);
  }

  if (event.data.type === "query") {
    onQueryReceipt(event.data.data);
  }

  if (event.data.type === "search") {
    // console.log("SEARCHRES", event.data.data);
    searchSetters[event.data.data.key](event.data.data);
  }

  if (event.data.type === "config") {
    onConfigReceipt(event.data.data);
  }

  if (event.data.type === "details") {
    onDetailsReceipt(event.data.data);
  }

  if (event.data.type === "list") {
    onListReceipt(event.data.data);
  }

  if (event.data.type === "nextstrain") {
    onNextStrainReceipt(event.data.data);
  }
};

function useLocalBackend(uploaded_data, proto) {
  const [statusMessage, setStatusMessage] = useState({
    message: null
  });

  onStatusReceipt = receivedData => {
    console.log("STATUS:", receivedData.data);

    if (receivedData.data.error) {
      window.alert(receivedData.data.error);
      console.log("ERROR33:", receivedData.data.error);
    }

    setStatusMessage(receivedData.data);
  };

  useEffect(() => {
    console.log("Sending data to worker");
    worker.postMessage({
      type: "upload",
      data: uploaded_data,
      proto: proto
    });
  }, [uploaded_data, proto]);
  const queryNodes = useCallback(async (boundsForQueries, setResult, setTriggerRefresh, config) => {
    console.log("queryNodes", boundsForQueries);
    worker.postMessage({
      type: "query",
      bounds: boundsForQueries
    });

    onQueryReceipt = receivedData => {
      //  console.log("CONFIG IS", config);
      console.log("got query result" //, receivedData
      );
      receivedData.nodes.forEach(node => {
        if (node.node_id === config.rootId) {
          node.mutations = config.rootMutations.map(x => config.mutations[x]);
        } else {
          node.mutations = node.mutations.map(mutation => config.mutations[mutation]);
        }
      });
      setResult(receivedData);
    };
  }, []);
  const singleSearch = useCallback((singleSearch, boundsForQueries, setResult) => {
    const key = JSON.parse(singleSearch).key;
    console.log("singleSearch", singleSearch, "key", key);
    worker.postMessage({
      type: "search",
      search: singleSearch,
      bounds: boundsForQueries
    });

    searchSetters[key] = receivedData => {
      console.log("got search result from ", key, //   singleSearch,
      "result" //   receivedData
      );
      setResult(receivedData);
    };

    return {
      abortController: {
        abort: () => console.log("no controller for local")
      }
    };
  }, []);
  const getDetails = useCallback((node_id, setResult) => {
    console.log("getDetails", node_id);
    worker.postMessage({
      type: "details",
      node_id: node_id
    });

    onDetailsReceipt = receivedData => {
      console.log("got details result", receivedData);
      setResult(receivedData);
    };
  }, []);
  const getConfig = useCallback(setResult => {
    console.log("getConfig");
    worker.postMessage({
      type: "config"
    });

    onConfigReceipt = receivedData => {
      console.log("got config result", receivedData);
      setResult(receivedData);
    };
  }, []);
  const getTipAtts = useCallback((nodeId, selectedKey, callback) => {
    console.log("getTipAtts", nodeId, selectedKey);
    worker.postMessage({
      type: "list",
      node_id: nodeId,
      key: selectedKey
    });

    onListReceipt = receivedData => {
      console.log("got list result", receivedData);
      callback(null, receivedData);
    };
  }, []);
  const getNextstrainJson = useCallback((nodeId, config) => {
    console.log("getNextstrainJson", nodeId);
    worker.postMessage({
      type: "nextstrain",
      node_id: nodeId,
      config: config
    });
  }, []);
  return useMemo(() => {
    return {
      queryNodes,
      singleSearch,
      getDetails,
      getConfig,
      statusMessage,
      setStatusMessage,
      getTipAtts,
      getNextstrainJson,
      type: "local"
    };
  }, [queryNodes, singleSearch, getDetails, getConfig, statusMessage, setStatusMessage, getTipAtts, getNextstrainJson]);
}

function useBackend(backend_url, sid, url_on_fail, uploaded_data, proto) {
  const serverBackend = useServerBackend(backend_url, sid, url_on_fail);
  const localBackend = useLocalBackend(uploaded_data, proto);

  if (backend_url) {
    return serverBackend;
  }

  if (uploaded_data) {
    return localBackend;
  } else {
    return null;
  }
}

function usePerNodeFunctions(data, config) {
  const getNodeGenotype = node_id => {
    console.log("data", data);
    let data_to_use;

    if (data.data.nodeLookup[node_id]) {
      data_to_use = data.data;
    } else if (data.base_data.nodeLookup[node_id]) {
      data_to_use = data.base_data;
    } else {
      console.log("UNEXPECTED ERROR: node not found", node_id, data.data, data.base_data);
      return null;
    }

    let cur_node = data_to_use.nodeLookup[node_id];
    const assembled_mutations = [];

    while (cur_node.parent_id !== cur_node.node_id) {
      const nt_mutations = cur_node.mutations.filter(mutation => mutation.type === "nt");
      const filtered_nt_mutations = nt_mutations.filter(mutation => !assembled_mutations.some(m => m.residue_pos === mutation.residue_pos));
      assembled_mutations.push(...filtered_nt_mutations);
      cur_node = data_to_use.nodeLookup[cur_node.parent_id];
    }

    return assembled_mutations;
  };

  const getCovSpectrumQuery = node_id => {
    const genotypes = getNodeGenotype(node_id).map(m => m.residue_pos + m.new_residue);
    const num_genotypes = genotypes.length;
    const query = `[${num_genotypes}-of:${genotypes.join(", ")}]`;
    const url_encoded_query = encodeURIComponent(query);
    const url = `//cov-spectrum.org/explore/World/AllSamples/AllTimes/variants?variantQuery=${url_encoded_query}`;
    return url;
  };

  return {
    getNodeGenotype,
    getCovSpectrumQuery
  };
}

const useConfig = (backend, view, setOverlayContent, setTitle, query) => {
  const [config, setConfig] = useState({
    title: "loading",
    source: "",
    num_nodes: 0
  });
  useEffect(() => {
    console.log("GETTING CONFIG");
    backend.getConfig(results => {
      const viewState = { ...view.viewState,
        target: [2000, results.initial_y],
        zoom: results.initial_zoom
      };
      const oldViewState = { ...viewState
      };
      let fromFile = {};

      function afterPossibleGet() {
        if (query.config) {
          console.log("FOUND QUERY", query.config);
          const unpacked = JSON.parse(query.config);
          console.log("UNPACKED", unpacked);
          delete unpacked.validate_SID;
          Object.assign(results, unpacked);
        }

        Object.assign(results, fromFile);

        if (results.title) {
          setTitle(results.title); // set the title with window

          window.document.title = results.title;
          console.log("setting title to ", config.title);
        }

        setConfig(results);
        backend.setStatusMessage({
          message: "Connecting"
        }); // THE BELOW IS NOT WORKING ATM

        view.onViewStateChange({
          viewState,
          oldViewState,
          interactionState: "isZooming"
        });

        if (results.overlay) {
          setOverlayContent(results.overlay);
        }
      }

      if (query.configUrl) {
        console.log("FOUND QUERY", query.configUrl);
        fetch(query.configUrl).then(response => response.json()).then(data => {
          console.log("FOUND CONFIG URL", data);
          fromFile = data;
          afterPossibleGet();
        }).catch(error => {
          console.log("ERROR", error);
          afterPossibleGet();
        });
      } else {
        afterPossibleGet();
      }
    }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend.getConfig]);
  return config;
};

const useSettings = _ref => {
  let {
    query,
    updateQuery
  } = _ref;
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] = useState(false);
  const [thresholdForDisplayingText, setThresholdForDisplayingText] = useState(2.9);
  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] = useState(false);

  const toggleMinimapEnabled = () => {
    setMinimapEnabled(!minimapEnabled);
  };

  const mutationTypesEnabled = useMemo(() => {
    return JSON.parse(query.mutationTypesEnabled);
  }, [query.mutationTypesEnabled]);
  const treenomeEnabled = useMemo(() => {
    return JSON.parse(query.treenomeEnabled);
  }, [query.treenomeEnabled]);
  const setTreenomeEnabled = useCallback(value => {
    updateQuery({
      treenomeEnabled: value
    });
    toast(`Treenome Browser is now ${value ? "enabled" : "disabled"}`, {
      position: "bottom-center"
    });
  }, [updateQuery]);
  const filterMutations = useCallback(mutations => {
    return mutations.filter(mutation => mutationTypesEnabled[mutation.type]);
  }, [mutationTypesEnabled]);

  const setMutationTypeEnabled = (key, enabled) => {
    const newMutationTypesEnabled = { ...mutationTypesEnabled
    };
    newMutationTypesEnabled[key] = enabled;
    updateQuery({
      mutationTypesEnabled: JSON.stringify(newMutationTypesEnabled)
    });
  };

  const [maxCladeTexts, setMaxCladeTexts] = useState(10);

  const miniMutationsMenu = () => {
    return /*#__PURE__*/React.createElement("div", {
      className: "block font-normal pt-1 mr-3"
    }, Object.keys(mutationTypesEnabled).map(key => /*#__PURE__*/React.createElement("div", {
      key: key,
      className: "inline-block mr-3  -mb-1 -pb-1"
    }, /*#__PURE__*/React.createElement("label", {
      key: key
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "mr-1 -mb-1 -pb-1",
      checked: mutationTypesEnabled[key],
      onChange: () => {
        const newValue = !mutationTypesEnabled[key];
        setMutationTypeEnabled(key, newValue); // toast at bottom center

        toast(`Display of ${key.toUpperCase()} mutations is now ${newValue ? "enabled" : "disabled"} for hovered and selected nodes`, {
          position: "bottom-center"
        });
      }
    }), " ", key))));
  };

  const [isCov2Tree, setIsCov2Tree] = useState(false);
  useEffect(() => {
    if (window.location.href.includes("cov2tree.org")) {
      setIsCov2Tree(true);
    }
  }, []);
  return {
    minimapEnabled,
    treenomeEnabled,
    setTreenomeEnabled,
    toggleMinimapEnabled,
    mutationTypesEnabled,
    filterMutations,
    setMutationTypeEnabled,
    displayTextForInternalNodes,
    setDisplayTextForInternalNodes,
    displayPointsForInternalNodes,
    setDisplayPointsForInternalNodes,
    thresholdForDisplayingText,
    setThresholdForDisplayingText,
    maxCladeTexts,
    setMaxCladeTexts,
    miniMutationsMenu,
    isCov2Tree
  };
};

var URL_ON_FAIL = window.location.hostname.includes(".epicov.org") ? "https://www.epicov.org/epi3/frontend" : process.env.REACT_APP_URL_ON_FAIL;

function Taxonium(_ref) {
  var uploadedData = _ref.uploadedData,
      query = _ref.query,
      updateQuery = _ref.updateQuery,
      setOverlayContent = _ref.setOverlayContent,
      proto = _ref.proto,
      setTitle = _ref.setTitle,
      overlayContent = _ref.overlayContent,
      setAboutEnabled = _ref.setAboutEnabled;
  var deckRef = useRef();
  var jbrowseRef = useRef();

  var _useState = useState(null),
      _useState2 = _slicedToArray(_useState, 2),
      deckSize = _useState2[0],
      setDeckSize = _useState2[1];

  var settings = useSettings({
    query: query,
    updateQuery: updateQuery
  });
  var view = useView({
    settings: settings,
    deckSize: deckSize,
    deckRef: deckRef,
    jbrowseRef: jbrowseRef
  });
  var url_on_fail = URL_ON_FAIL ? URL_ON_FAIL : null;
  var backend = useBackend(query.backend, query.sid, url_on_fail, uploadedData, proto);
  var hoverDetails = useHoverDetails();
  var gisaidHoverDetails = useNodeDetails("gisaid-hovered", backend);

  if (window.location.toString().includes("epicov.org")) {
    hoverDetails = gisaidHoverDetails;
  }

  var selectedDetails = useNodeDetails("selected", backend);
  var config = useConfig(backend, view, setOverlayContent, setTitle, query);
  var colorBy = useColorBy(config, query, updateQuery);
  var colorMapping = useMemo(function () {
    return config.colorMapping ? config.colorMapping : {};
  }, [config.colorMapping]);
  var colorHook = useColor(colorMapping); //TODO: this is always true for now

  config.enable_ns_download = true;
  var xType = query.xType;
  var setxType = useCallback(function (xType) {
    updateQuery({
      xType: xType
    });
  }, [updateQuery]);

  var _useGetDynamicData = useGetDynamicData(backend, colorBy, view.viewState, config, xType),
      data = _useGetDynamicData.data,
      boundsForQueries = _useGetDynamicData.boundsForQueries,
      isCurrentlyOutsideBounds = _useGetDynamicData.isCurrentlyOutsideBounds;

  var perNodeFunctions = usePerNodeFunctions(data);
  useEffect(function () {
    // If there is no distance data, default to time
    // This can happen with e.g. nextstrain json
    if (data.base_data && data.base_data.nodes) {
      var n = data.base_data.nodes[0];

      if (!n.hasOwnProperty("x_dist")) {
        setxType("x_time");
      } else if (!n.hasOwnProperty("x_time")) {
        setxType("x_dist");
      }
    }
  }, [data.base_data, setxType]);
  var search = useSearch({
    data: data,
    config: config,
    boundsForQueries: boundsForQueries,
    view: view,
    backend: backend,
    query: query,
    updateQuery: updateQuery,
    deckSize: deckSize,
    xType: xType,
    settings: settings
  });

  var _useState3 = useState(true),
      _useState4 = _slicedToArray(_useState3, 2),
      sidebarOpen = _useState4[0],
      setSidebarOpen = _useState4[1];

  var toggleSidebar = function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
    setTimeout(function () {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  };

  var treenomeState = useTreenomeState(data, deckRef, view, settings);
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-grow overflow-hidden flex flex-col md:flex-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: sidebarOpen ? "h-1/2 md:h-full w-full 2xl:w-3/4 md:flex-grow" + (settings.treenomeEnabled ? " md:w-3/4" : " md:w-2/3") : "md:col-span-12 h-5/6 md:h-full w-full"
  }, /*#__PURE__*/React.createElement(Deck, {
    statusMessage: backend.statusMessage,
    data: data,
    search: search,
    view: view,
    colorHook: colorHook,
    colorBy: colorBy,
    config: config,
    ariaHideApp: false // sadly with or without this the app is not suitable for screen readers
    ,
    hoverDetails: hoverDetails,
    selectedDetails: selectedDetails,
    xType: xType,
    settings: settings,
    setDeckSize: setDeckSize,
    deckSize: deckSize,
    isCurrentlyOutsideBounds: isCurrentlyOutsideBounds,
    treenomeState: treenomeState,
    deckRef: deckRef,
    jbrowseRef: jbrowseRef
  })), /*#__PURE__*/React.createElement("div", {
    className: sidebarOpen ? "flex-grow min-h-0 h-1/2 md:h-full 2xl:w-1/4 bg-white shadow-xl border-t md:border-0 overflow-y-auto md:overflow-hidden" + (settings.treenomeEnabled ? " md:w-1/4" : " md:w-1/3") : "bg-white shadow-xl"
  }, !sidebarOpen && /*#__PURE__*/React.createElement("button", {
    onClick: toggleSidebar
  }, /*#__PURE__*/React.createElement("br", null), window.innerWidth > 768 ? /*#__PURE__*/React.createElement(MdArrowBack, {
    className: "mx-auto w-5 h-5 sidebar-toggle"
  }) : /*#__PURE__*/React.createElement(MdArrowUpward, {
    className: "mx-auto w-5 h-5 sidebar-toggle"
  })), sidebarOpen && /*#__PURE__*/React.createElement(SearchPanel, {
    className: "flex-grow min-h-0 h-full bg-white shadow-xl border-t md:border-0 overflow-y-auto md:overflow-hidden",
    backend: backend,
    search: search,
    colorBy: colorBy,
    colorHook: colorHook,
    config: config,
    selectedDetails: selectedDetails,
    xType: xType,
    setxType: setxType,
    settings: settings,
    treenomeState: treenomeState,
    view: view,
    overlayContent: overlayContent,
    setAboutEnabled: setAboutEnabled,
    perNodeFunctions: perNodeFunctions,
    toggleSidebar: toggleSidebar
  })));
}

export { Taxonium };
