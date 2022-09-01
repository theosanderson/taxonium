/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/jstree.js":
/*!*****************************!*\
  !*** ./src/utils/jstree.js ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "kn_calxy": function() { return /* binding */ kn_calxy; },
/* harmony export */   "kn_expand_node": function() { return /* binding */ kn_expand_node; },
/* harmony export */   "kn_parse": function() { return /* binding */ kn_parse; },
/* harmony export */   "kn_reorder": function() { return /* binding */ kn_reorder; },
/* harmony export */   "kn_reorder_num_tips": function() { return /* binding */ kn_reorder_num_tips; }
/* harmony export */ });
/* eslint-disable */

/* The MIT License

   Copyright (c) 2008 Genome Research Ltd (GRL).
                 2010 Broad Institute

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
   BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
   ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
   CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
*/
// Author: Heng Li <lh3@sanger.ac.uk>

/*
  A phylogenetic tree is parsed into the following Java-like structure:

  class Node {
	Node parent;  // pointer to the parent node; null if root
	Node[] child; // array of pointers to child nodes
	String name;  // name of the current node
	double d;     // distance to the parent node
	bool hl;      // if the node needs to be highlighted
	bool hidden;  // if the node and all its desendants are collapsed
  };

  class Tree {
	Node[] node;  // list of nodes in the finishing order (the leftmost leaf is the first and the root the last)
	int error;    // errors in parsing: 0x1=missing left parenthesis; 0x2=missing right; 0x4=unpaired brackets
	int n_tips;   // number of tips/leaves in the tree
  };

  The minimal code for plotting/editing a tree in the Newick format is:

<head><!--[if IE]><script src="excanvas.js"></script><![endif]-->
<script language="JavaScript" src="knhx.js"></script></head>
<body onLoad="knhx_init('canvas', 'nhx');">
<textarea id="nhx" rows="20" cols="120" style="font:11px monospace"></textarea>
<canvas id="canvas" width="800" height="100" style="border:1px solid"></canvas>
</body>

*/

/********************************************
 ****** The New Hampshire format parser *****
 ********************************************/
function kn_new_node() {
  // private method
  return {
    parent: null,
    child: [],
    name: "",
    meta: "",
    d: -1.0,
    hl: false,
    hidden: false
  };
}

function kn_add_node(str, l, tree, x) {
  // private method
  var i;
  var r,
      beg,
      end = 0,
      z;
  z = kn_new_node();

  for (i = l, beg = l; i < str.length && str.charAt(i) != "," && str.charAt(i) != ")"; ++i) {
    var c = str.charAt(i);

    if (c == "[") {
      var meta_beg = i;
      if (end == 0) end = i;

      do {
        ++i;
      } while (i < str.length && str.charAt(i) != "]");

      if (i == str.length) {
        tree.error |= 4;
        break;
      }

      z.meta = str.substr(meta_beg, i - meta_beg + 1);
    } else if (c == ":") {
      if (end == 0) end = i;

      for (var j = ++i; i < str.length; ++i) {
        var cc = str.charAt(i);
        if ((cc < "0" || cc > "9") && cc != "e" && cc != "E" && cc != "+" && cc != "-" && cc != ".") break;
      }

      z.d = parseFloat(str.substr(j, i - j));
      --i;
    } else if (c < "!" && c > "~" && end == 0) end = i;
  }

  if (end == 0) end = i;
  if (end > beg) z.name = str.substr(beg, end - beg);
  tree.node.push(z);
  return i;
}
/* Parse a string in the New Hampshire format and return a pointer to the tree. */


function kn_parse(str) {
  var stack = new Array();
  var tree = new Object();
  tree.error = tree.n_tips = 0;
  tree.node = new Array();

  for (var l = 0; l < str.length;) {
    while (l < str.length && (str.charAt(l) < "!" || str.charAt(l) > "~")) {
      ++l;
    }

    if (l == str.length) break;
    var c = str.charAt(l);
    if (c == ",") ++l;else if (c == "(") {
      stack.push(-1);
      ++l;
    } else if (c == ")") {
      var x = void 0,
          m = void 0,
          i = void 0;
      x = tree.node.length;

      for (i = stack.length - 1; i >= 0; --i) {
        if (stack[i] < 0) break;
      }

      if (i < 0) {
        tree.error |= 1;
        break;
      }

      m = stack.length - 1 - i;
      l = kn_add_node(str, l + 1, tree, m);

      for (i = stack.length - 1, m = m - 1; m >= 0; --m, --i) {
        tree.node[x].child[m] = tree.node[stack[i]];
        tree.node[stack[i]].parent = tree.node[x];
      }

      stack.length = i;
      stack.push(x);
    } else {
      ++tree.n_tips;
      stack.push(tree.node.length);
      l = kn_add_node(str, l, tree, 0);
    }
  }

  if (stack.length > 1) tree.error |= 2;
  tree.root = tree.node[tree.node.length - 1];
  return tree;
}
/*********************************
 ***** Output a tree in text *****
 *********************************/

/* convert a tree to the New Hampshire string */


function kn_write_nh(tree) {
  // calculate the depth of each node
  tree.node[tree.node.length - 1].depth = 0;

  for (var i = tree.node.length - 2; i >= 0; --i) {
    var p = tree.node[i];
    p.depth = p.parent.depth + 1;
  } // generate the string


  var str = "";
  var cur_depth = 0,
      is_first = 1;

  for (var i = 0; i < tree.node.length; ++i) {
    var p = tree.node[i];
    var n_bra = p.depth - cur_depth;

    if (n_bra > 0) {
      if (is_first) is_first = 0;else str += ",\n";

      for (var j = 0; j < n_bra; ++j) {
        str += "(";
      }
    } else if (n_bra < 0) str += "\n)";else str += ",\n";

    if (p.name) str += String(p.name);
    if (p.d >= 0.0) str += ":" + p.d;
    if (p.meta) str += p.meta;
    cur_depth = p.depth;
  }

  str += "\n";
  return str;
}
/* print the tree topology (for debugging only) */


function kn_check_tree(tree) {
  document.write("<table border=1><tr><th>name<th>id<th>dist<th>x<th>y</tr>");

  for (var i = 0; i < tree.node.length; ++i) {
    var p = tree.node[i];
    document.write("<tr>" + "<td>" + p.name + "<td>" + i + "<td>" + p.d + "<td>" + p.x + "<td>" + p.y + "</tr>");
  }

  document.write("</table>");
}
/**********************************************
 ****** Functions for manipulating a tree *****
 **********************************************/

/* Expand the tree into an array in the finishing order */


function kn_expand_node(root) {
  var node, stack;
  node = new Array();
  stack = new Array();
  stack.push({
    p: root,
    i: 0
  });

  for (;;) {
    while (stack[stack.length - 1].i != stack[stack.length - 1].p.child.length && !stack[stack.length - 1].p.hidden) {
      var q = stack[stack.length - 1];
      stack.push({
        p: q.p.child[q.i],
        i: 0
      });
    }

    node.push(stack.pop().p);
    if (stack.length > 0) ++stack[stack.length - 1].i;else break;
  }

  return node;
}
/* Count the number of leaves */


function kn_count_tips(tree) {
  tree.n_tips = 0;

  for (var i = 0; i < tree.node.length; ++i) {
    if (tree.node[i].child.length == 0 || tree.node[i].hidden) ++tree.n_tips;
  }

  return tree.n_tips;
}
/* Highlight: set node.hl for leaves matching "pattern" */


function kn_search_leaf(tree, pattern) {
  var re = null;

  if (pattern != null && pattern != "") {
    re = new RegExp(pattern, "i");
    if (re == null) alert("Wrong regular expression: '" + pattern + "'");
  }

  for (var i = 0; i < tree.node.length; ++i) {
    var p = tree.node[i];
    if (p.child.length == 0) p.hl = re != null && re.test(p.name) ? true : false;
  }
}
/* Remove: delete a node and all its descendants */


function kn_remove_node(tree, node) {
  var root = tree.node[tree.node.length - 1];
  if (node == root) return;
  var z = kn_new_node();
  z.child.push(root);
  root.parent = z;
  var p = node.parent,
      i;

  if (p.child.length == 2) {
    // then p will be removed
    var q,
        r = p.parent;
    i = p.child[0] == node ? 0 : 1;
    q = p.child[1 - i]; // the other child

    q.d += p.d;
    q.parent = r;

    for (var _i = 0; _i < r.child.length; ++_i) {
      if (r.child[_i] == p) break;
    }

    r.child[i] = q;
    p.parent = null;
  } else {
    var j, k;

    for (var _i2 = 0; _i2 < p.child.length; ++_i2) {
      if (p.child[_i2] == node) break;
    }

    for (j = k = 0; j < p.child.length; ++j) {
      p.node[k] = p.node[j];
      if (j != i) ++k;
    }

    --p.child.length;
  }

  root = z.child[0];
  root.parent = null;
  return root;
}
/* Move: prune the subtree descending from p and regragh it to the edge between q and its parent */


function kn_move_node(tree, p, q) {
  var root = tree.node[tree.node.length - 1];
  if (p == root) return null; // p cannot be root

  for (var r = q; r.parent; r = r.parent) {
    if (r == p) return null;
  } // p is an ancestor of q. We cannot move in this case.


  root = kn_remove_node(tree, p);
  var z = kn_new_node(); // a fake root

  z.child.push(root);
  root.parent = z;
  var i,
      r = q.parent;

  for (var _i3 = 0; _i3 < r.child.length; ++_i3) {
    if (r.child[_i3] == q) break;
  }

  var s = kn_new_node(); // a new node

  s.parent = r;
  r.child[i] = s;

  if (q.d >= 0.0) {
    s.d = q.d / 2.0;
    q.d /= 2.0;
  }

  s.child.push(p);
  p.parent = s;
  s.child.push(q);
  q.parent = s;
  root = z.child[0];
  root.parent = null;
  return root;
}
/* Reroot: put the root in the middle of node and its parent */


function kn_reroot(root, node, dist) {
  var i, d, tmp;
  var p, q, r, s, new_root;
  if (node == root) return root;
  if (dist < 0.0 || dist > node.d) dist = node.d / 2.0;
  tmp = node.d;
  /* p: the central multi-parent node
   * q: the new parent, previous a child of p
   * r: old parent
   * i: previous position of q in p
   * d: previous distance p->d
   */

  q = new_root = kn_new_node();
  q.child[0] = node;
  q.child[0].d = dist;
  p = node.parent;
  q.child[0].parent = q;

  for (var _i4 = 0; _i4 < p.child.length; ++_i4) {
    if (p.child[_i4] == node) break;
  }

  q.child[1] = p;
  d = p.d;
  p.d = tmp - dist;
  r = p.parent;
  p.parent = q;

  while (r != null) {
    s = r.parent;
    /* store r's parent */

    p.child[i] = r;
    /* change r to p's child */

    for (var _i5 = 0; _i5 < r.child.length; ++_i5
    /* update i */
    ) {
      if (r.child[_i5] == p) break;
    }

    r.parent = p;
    /* update r's parent */

    tmp = r.d;
    r.d = d;
    d = tmp;
    /* swap r->d and d, i.e. update r->d */

    q = p;
    p = r;
    r = s;
    /* update p, q and r */
  }
  /* now p is the root node */


  if (p.child.length == 2) {
    /* remove p and link the other child of p to q */
    r = p.child[1 - i];
    /* get the other child */

    for (var _i6 = 0; _i6 < q.child.length; ++_i6
    /* the position of p in q */
    ) {
      if (q.child[_i6] == p) break;
    }

    r.d += p.d;
    r.parent = q;
    q.child[i] = r;
    /* link r to q */
  } else {
    /* remove one child in p */
    for (j = k = 0; j < p.child.length; ++j) {
      p.child[k] = p.child[j];
      if (j != i) ++k;
    }

    --p.child.length;
  }

  return new_root;
}

function kn_multifurcate(p) {
  var i, par, idx, tmp, old_length;
  if (p.child.length == 0 || !p.parent) return;
  par = p.parent;

  for (var _i7 = 0; _i7 < par.child.length; ++_i7) {
    if (par.child[_i7] == p) break;
  }

  idx = i;
  tmp = par.child.length - idx - 1;
  old_length = par.child.length;
  par.child.length += p.child.length - 1;

  for (var _i8 = 0; _i8 < tmp; ++_i8) {
    par.child[par.child.length - 1 - _i8] = par.child[old_length - 1 - _i8];
  }

  for (var _i9 = 0; _i9 < p.child.length; ++_i9) {
    p.child[_i9].parent = par;
    if (p.child[_i9].d >= 0 && p.d >= 0) p.child[_i9].d += p.d;
    par.child[_i9 + idx] = p.child[_i9];
  }
}

function kn_reorder(root) {
  var sort_leaf = function sort_leaf(a, b) {
    if (a.depth < b.depth) return 1;
    if (a.depth > b.depth) return -1;
    return String(a.name) < String(b.name) ? -1 : String(a.name) > String(b.name) ? 1 : 0;
  };

  var sort_weight = function sort_weight(a, b) {
    return a.weight / a.n_tips - b.weight / b.n_tips;
  };

  var x = new Array();
  var i,
      node = kn_expand_node(root); // get depth

  node[node.length - 1].depth = 0;

  for (var _i10 = node.length - 2; _i10 >= 0; --_i10) {
    var q = node[_i10];
    q.depth = q.parent.depth + 1;
    if (q.child.length == 0) x.push(q);
  } // set weight for leaves


  x.sort(sort_leaf);

  for (var _i11 = 0; _i11 < x.length; ++_i11) {
    x[_i11].weight = _i11, x[_i11].n_tips = 1;
  } // set weight for internal nodes


  for (var _i12 = 0; _i12 < node.length; ++_i12) {
    var q = node[_i12];

    if (q.child.length) {
      // internal
      var j,
          n = 0,
          w = 0;

      for (j = 0; j < q.child.length; ++j) {
        n += q.child[j].n_tips;
        w += q.child[j].weight;
      }

      q.n_tips = n;
      q.weight = w;
    }
  } // swap children


  for (var _i13 = 0; _i13 < node.length; ++_i13) {
    if (node[_i13].child.length >= 2) node[_i13].child.sort(sort_weight);
  }
}

function kn_reorder_num_tips(root) {
  var sort_leaf = function sort_leaf(a, b) {
    return a.num_tips - b.num_tips;
  };

  var sort_weight = function sort_weight(a, b) {
    return a.num_tips - b.num_tips;
  };

  var x = new Array();
  var i,
      node = kn_expand_node(root); // get depth

  node[node.length - 1].depth = 0;

  for (var _i14 = node.length - 2; _i14 >= 0; --_i14) {
    var q = node[_i14];
    q.depth = q.parent.depth + 1;
    if (q.child.length == 0) x.push(q);
  } // set weight for leaves


  x.sort(sort_leaf);

  for (var _i15 = 0; _i15 < x.length; ++_i15) {
    x[_i15].weight = _i15, x[_i15].n_tips = 1;
  } // set weight for internal nodes


  for (var _i16 = 0; _i16 < node.length; ++_i16) {
    var q = node[_i16];

    if (q.child.length) {
      // internal
      var j,
          n = 0,
          w = 0;

      for (j = 0; j < q.child.length; ++j) {
        n += q.child[j].n_tips;
        w += q.child[j].weight;
      }

      q.n_tips = n;
      q.weight = w;
    }
  } // swap children


  for (var _i17 = 0; _i17 < node.length; ++_i17) {
    if (node[_i17].child.length >= 2) node[_i17].child.sort(sort_weight);
  }
}
/*****************************************
 ***** Functions for plotting a tree *****
 *****************************************/

/* Calculate the coordinate of each node */


function kn_calxy(tree, is_real) {
  var i, j, scale; // calculate y

  scale = tree.n_tips - 1;

  for (var _i18 = j = 0; _i18 < tree.node.length; ++_i18) {
    var p = tree.node[_i18];
    p.y = p.child.length && !p.hidden ? (p.child[0].y + p.child[p.child.length - 1].y) / 2.0 : j++ / scale;
    if (p.child.length == 0) p.miny = p.maxy = p.y;else p.miny = p.child[0].miny, p.maxy = p.child[p.child.length - 1].maxy;
  } // calculate x


  if (is_real) {
    // use branch length
    var root = tree.node[tree.node.length - 1];
    scale = root.x = root.d >= 0.0 ? root.d : 0.0;

    for (var _i19 = tree.node.length - 2; _i19 >= 0; --_i19) {
      var p = tree.node[_i19];
      p.x = p.parent.x + (p.d >= 0.0 ? p.d : 0.0);
      if (p.x > scale) scale = p.x;
    }

    if (scale == 0.0) is_real = false;
  }

  if (!is_real) {
    // no branch length
    scale = tree.node[tree.node.length - 1].x = 1.0;

    for (var _i20 = tree.node.length - 2; _i20 >= 0; --_i20) {
      var p = tree.node[_i20];
      p.x = p.parent.x + 1.0;
      if (p.x > scale) scale = p.x;
    }

    for (var _i21 = 0; _i21 < tree.node.length - 1; ++_i21) {
      if (tree.node[_i21].child.length == 0) tree.node[_i21].x = scale;
    }
  } // rescale x


  for (var _i22 = 0; _i22 < tree.node.length; ++_i22) {
    tree.node[_i22].x /= scale;
  }

  return is_real;
}

function kn_get_node(tree, conf, x, y) {
  if (conf.is_circular) {
    for (var i = 0; i < tree.node.length; ++i) {
      var p = tree.node[i];
      var tmp_x = Math.floor(conf.width / 2 + p.x * conf.real_r * Math.cos(p.y * conf.full_arc) + 0.999);
      var tmp_y = Math.floor(conf.height / 2 + p.x * conf.real_r * Math.sin(p.y * conf.full_arc) + 0.999);
      var tmp_l = 2;
      if (x >= tmp_x - tmp_l && x <= tmp_x + tmp_l && y >= tmp_y - tmp_l && y <= tmp_y + tmp_l) return i;
    }
  } else {
    for (var i = 0; i < tree.node.length; ++i) {
      var tmp_x = tree.node[i].x * conf.real_x + conf.shift_x;
      var tmp_y = tree.node[i].y * conf.real_y + conf.shift_y;
      var tmp_l = conf.box_width * 0.6;
      if (x >= tmp_x - tmp_l && x <= tmp_x + tmp_l && y >= tmp_y - tmp_l && y <= tmp_y + tmp_l) return i;
    }
  }

  return tree.node.length;
}



/***/ }),

/***/ "./src/utils/processNewick.js":
/*!************************************!*\
  !*** ./src/utils/processNewick.js ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "processMetadataFile": function() { return /* binding */ processMetadataFile; },
/* harmony export */   "processNewick": function() { return /* binding */ processNewick; },
/* harmony export */   "processNewickAndMetadata": function() { return /* binding */ processNewickAndMetadata; }
/* harmony export */ });
/* harmony import */ var _jstree__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./jstree */ "./src/utils/jstree.js");
/* harmony import */ var pako__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! pako */ "./node_modules/pako/dist/pako.esm.mjs");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! axios */ "./node_modules/axios/index.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./reduceMaxOrMin */ "./src/utils/reduceMaxOrMin.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return generator._invoke = function (innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; }(innerFn, self, context), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; this._invoke = function (method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, define(Gp, "constructor", GeneratorFunctionPrototype), define(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (object) { var keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, catch: function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }





var emptyList = [];

function removeSquareBracketedComments(str) {
  return str.replace(/\[[^\]]*\]/g, "");
}

function do_fetch(_x, _x2, _x3) {
  return _do_fetch.apply(this, arguments);
}

function _do_fetch() {
  _do_fetch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(url, sendStatusMessage, whatIsBeingDownloaded) {
    var response, inflated, text, _response, _text2;

    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!sendStatusMessage) {
              sendStatusMessage = function sendStatusMessage() {};
            } // send progress on downloadProgress


            if (!url.endsWith(".gz")) {
              _context.next = 11;
              break;
            }

            _context.next = 4;
            return axios__WEBPACK_IMPORTED_MODULE_2___default().get(url, {
              responseType: "arraybuffer",
              onDownloadProgress: function onDownloadProgress(progress) {
                sendStatusMessage({
                  message: "Downloading compressed " + whatIsBeingDownloaded,
                  percentage: progress.loaded / progress.total * 100
                });
              }
            });

          case 4:
            response = _context.sent;
            sendStatusMessage({
              message: "Decompressing compressed " + whatIsBeingDownloaded
            });
            inflated = pako__WEBPACK_IMPORTED_MODULE_1__["default"].ungzip(response.data);
            text = new TextDecoder("utf-8").decode(inflated);
            return _context.abrupt("return", text);

          case 11:
            _context.next = 13;
            return axios__WEBPACK_IMPORTED_MODULE_2___default().get(url, {
              onDownloadProgress: function onDownloadProgress(progress) {
                sendStatusMessage({
                  message: "Downloading " + whatIsBeingDownloaded,
                  percentage: progress.loaded / progress.total * 100
                });
              }
            });

          case 13:
            _response = _context.sent;
            _text2 = _response.data; //parse text:

            return _context.abrupt("return", _text2);

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _do_fetch.apply(this, arguments);
}

function fetch_or_extract(file_obj, sendStatusMessage, whatIsBeingDownloaded) {
  if (file_obj.status === "url_supplied") {
    return do_fetch(file_obj.filename, sendStatusMessage, whatIsBeingDownloaded);
  } else if (file_obj.status === "loaded") {
    if (file_obj.filename.includes(".gz")) {
      var compressed_data = file_obj.data;
      sendStatusMessage({
        message: "Decompressing compressed " + whatIsBeingDownloaded
      });
      var inflated = pako__WEBPACK_IMPORTED_MODULE_1__["default"].ungzip(compressed_data);
      var text = new TextDecoder("utf-8").decode(inflated);
      return text;
    } else {
      // convert array buffer to string
      var _text = new TextDecoder("utf-8").decode(file_obj.data);

      return _text;
    }
  }
}

function cleanup(_x4) {
  return _cleanup.apply(this, arguments);
}

function _cleanup() {
  _cleanup = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(tree) {
    var scale_y, all_xes, ref_x_percentile, ref_x, scale_x;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            tree.node.forEach(function (node, i) {
              node.node_id = i;
            });
            tree.node = tree.node.map(function (node, i) {
              return {
                name: node.name.replace(/'/g, ""),
                parent_id: node.parent ? node.parent.node_id : node.node_id,
                x_dist: node.x,
                mutations: emptyList,
                y: node.y,
                num_tips: node.num_tips,
                is_tip: node.child.length === 0,
                node_id: node.node_id
              };
            });
            scale_y = 2000;
            all_xes = tree.node.map(function (node) {
              return node.x_dist;
            });
            all_xes.sort(function (a, b) {
              return a - b;
            });
            ref_x_percentile = 0.99;
            ref_x = all_xes[Math.floor(all_xes.length * ref_x_percentile)];
            scale_x = 450 / ref_x;
            tree.node.forEach(function (node) {
              node.x_dist = node.x_dist * scale_x;
              node.y = node.y * scale_y;
            });

          case 9:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _cleanup.apply(this, arguments);
}

function processNewick(_x5, _x6) {
  return _processNewick.apply(this, arguments);
}

function _processNewick() {
  _processNewick = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(data, sendStatusMessage) {
    var the_data, tree, assignNumTips, sortWithNumTips, total_tips, overallMaxX, overallMinX, overallMaxY, overallMinY, y_positions, output;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            sortWithNumTips = function _sortWithNumTips(node) {
              node.child.sort(function (a, b) {
                return a.num_tips - b.num_tips;
              });
              node.child.forEach(function (child) {
                sortWithNumTips(child);
              });
            };

            assignNumTips = function _assignNumTips(node) {
              if (node.child.length === 0) {
                node.num_tips = 1;
              } else {
                node.num_tips = 0;
                node.child.forEach(function (child) {
                  node.num_tips += assignNumTips(child);
                });
              }

              return node.num_tips;
            };

            _context3.next = 4;
            return fetch_or_extract(data, sendStatusMessage, "tree");

          case 4:
            the_data = _context3.sent;
            sendStatusMessage({
              message: "Parsing Newick file"
            }); // remove all square-bracketed comments from the string

            the_data = removeSquareBracketedComments(the_data);
            tree = (0,_jstree__WEBPACK_IMPORTED_MODULE_0__.kn_parse)(the_data);
            assignNumTips(tree.root);
            total_tips = tree.root.num_tips;

            if (data.ladderize) {
              sortWithNumTips(tree.root);
              tree.node = (0,_jstree__WEBPACK_IMPORTED_MODULE_0__.kn_expand_node)(tree.root);
            }

            sendStatusMessage({
              message: "Laying out the tree"
            });
            (0,_jstree__WEBPACK_IMPORTED_MODULE_0__.kn_calxy)(tree, data.useDistances === true);
            sendStatusMessage({
              message: "Sorting on Y"
            }); // sort on y:

            tree.node.sort(function (a, b) {
              return a.y - b.y;
            });
            sendStatusMessage({
              message: "Re-processing"
            });
            cleanup(tree);
            overallMaxX = (0,_reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_3__["default"])(tree.node, function (x) {
              return x.x_dist;
            }, "max");
            overallMinX = (0,_reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_3__["default"])(tree.node, function (x) {
              return x.x_dist;
            }, "min");
            overallMaxY = (0,_reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_3__["default"])(tree.node, function (x) {
              return x.y;
            }, "max");
            overallMinY = (0,_reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_3__["default"])(tree.node, function (x) {
              return x.y;
            }, "min");
            y_positions = tree.node.map(function (x) {
              return x.y;
            });
            output = {
              nodes: tree.node,
              overallMaxX: overallMaxX,
              overallMaxY: overallMaxY,
              overallMinX: overallMinX,
              overallMinY: overallMinY,
              y_positions: y_positions,
              mutations: [],
              node_to_mut: {},
              rootMutations: [],
              rootId: 0,
              overwrite_config: {
                num_tips: total_tips,
                from_newick: true
              }
            };
            return _context3.abrupt("return", output);

          case 24:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _processNewick.apply(this, arguments);
}

function processMetadataFile(_x7, _x8) {
  return _processMetadataFile.apply(this, arguments);
}

function _processMetadataFile() {
  _processMetadataFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(data, sendStatusMessage) {
    var logStatusToConsole, the_data, lines, output, separator, headers;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            logStatusToConsole = function logStatusToConsole(message) {
              console.log(message.message);
            };

            _context4.next = 3;
            return fetch_or_extract(data, logStatusToConsole, "metadata");

          case 3:
            the_data = _context4.sent;
            lines = the_data.split("\n");
            output = {};

            if (!data.filename.includes("tsv")) {
              _context4.next = 10;
              break;
            }

            separator = "\t";
            _context4.next = 16;
            break;

          case 10:
            if (!data.filename.includes("csv")) {
              _context4.next = 14;
              break;
            }

            separator = ",";
            _context4.next = 16;
            break;

          case 14:
            sendStatusMessage({
              error: "Unknown file type for metadata, should be csv or tsv"
            });
            throw new Error("Unknown file type");

          case 16:
            lines.forEach(function (line, i) {
              if (i % 10000 === 0) {
                sendStatusMessage({
                  message: "Parsing metadata file",
                  percentage: i / lines.length * 100
                });
              }

              if (i === 0) {
                headers = line.split(separator);
              } else {
                var values = line.split(separator);
                var name;

                if (data.taxonColumn) {
                  var taxon_column_index = headers.indexOf(data.taxonColumn);
                  name = values[taxon_column_index];
                } else {
                  name = values[0];
                }

                var as_obj = {};
                values.slice(1).forEach(function (value, j) {
                  as_obj["meta_" + headers[j + 1]] = value;
                });
                output[name] = as_obj;
              }
            });
            sendStatusMessage({
              message: "Finalising"
            });
            return _context4.abrupt("return", [output, headers]);

          case 19:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _processMetadataFile.apply(this, arguments);
}

function processNewickAndMetadata(_x9, _x10) {
  return _processNewickAndMetadata.apply(this, arguments);
}

function _processNewickAndMetadata() {
  _processNewickAndMetadata = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(data, sendStatusMessage) {
    var treePromise, metadataInput, _yield$Promise$all, _yield$Promise$all2, tree, metadata_double, _metadata_double, metadata, headers, blanks;

    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            treePromise = processNewick(data, sendStatusMessage);
            metadataInput = data.metadata;

            if (metadataInput) {
              _context5.next = 6;
              break;
            }

            _context5.next = 5;
            return treePromise;

          case 5:
            return _context5.abrupt("return", _context5.sent);

          case 6:
            _context5.next = 8;
            return Promise.all([treePromise, processMetadataFile(metadataInput, sendStatusMessage)]);

          case 8:
            _yield$Promise$all = _context5.sent;
            _yield$Promise$all2 = _slicedToArray(_yield$Promise$all, 2);
            tree = _yield$Promise$all2[0];
            metadata_double = _yield$Promise$all2[1];
            _metadata_double = _slicedToArray(metadata_double, 2), metadata = _metadata_double[0], headers = _metadata_double[1];
            blanks = Object.fromEntries(headers.slice(1).map(function (x) {
              return ["meta_" + x, ""];
            }));
            sendStatusMessage({
              message: "Assigning metadata to nodes"
            });
            tree.nodes.forEach(function (node) {
              var this_metadata = metadata[node.name];

              if (this_metadata) {
                Object.assign(node, this_metadata);
              } else {
                Object.assign(node, blanks);
              }
            });
            return _context5.abrupt("return", tree);

          case 17:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _processNewickAndMetadata.apply(this, arguments);
}

/***/ }),

/***/ "./src/utils/processNextstrain.js":
/*!****************************************!*\
  !*** ./src/utils/processNextstrain.js ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "processNextstrain": function() { return /* binding */ processNextstrain; }
/* harmony export */ });
/* harmony import */ var pako__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pako */ "./node_modules/pako/dist/pako.esm.mjs");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! axios */ "./node_modules/axios/index.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reduceMaxOrMin */ "./src/utils/reduceMaxOrMin.js");
/* harmony import */ var _jstree__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./jstree */ "./src/utils/jstree.js");
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return generator._invoke = function (innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; }(innerFn, self, context), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; this._invoke = function (method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, define(Gp, "constructor", GeneratorFunctionPrototype), define(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (object) { var keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, catch: function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }





var emptyList = [];

var nodeMutationsFromNextStrainToTaxonium = function nodeMutationsFromNextStrainToTaxonium(mutations, unique_mutations, mutation_lookup) {
  //console.log("mutations", mutations);
  var keys = Object.keys(mutations);
  var nuc_muts = mutations["nuc"] ? mutations["nuc"] : [];
  var genes = keys.filter(function (key) {
    return key !== "nuc";
  });
  var taxonium_muts = [];
  nuc_muts.forEach(function (nuc_mut) {
    // input format is like "C123T", we want to break this into old_residue, position and new_residue
    // use regex to match the position
    var position = nuc_mut.match(/\d+/g);
    var index_of_position = nuc_mut.indexOf(position[0]);
    var previous_residue = nuc_mut.substring(0, index_of_position);
    var new_residue = nuc_mut.substring(index_of_position + position[0].length);
    var tax_format = {
      type: "nt",
      gene: "nt",
      previous_residue: previous_residue,
      new_residue: new_residue,
      residue_pos: parseInt(position[0])
    };
    var jsonned = JSON.stringify(tax_format); //console.log("jsonned", jsonned);

    if (mutation_lookup[jsonned]) {
      taxonium_muts.push(mutation_lookup[jsonned]);
    } else {
      unique_mutations.push(_objectSpread(_objectSpread({}, tax_format), {}, {
        mutation_id: unique_mutations.length
      }));
      var this_index = unique_mutations.length - 1;
      mutation_lookup[jsonned] = this_index;
      taxonium_muts.push(this_index);
    }
  });
  genes.forEach(function (gene) {
    var gene_muts = mutations[gene];
    gene_muts.forEach(function (gene_mut) {
      // input format is like "Q123F", we want to break this into old_residue, position and new_residue
      // use regex to match the position
      var position = gene_mut.match(/\d+/g);
      var index_of_position = gene_mut.indexOf(position[0]);
      var previous_residue = gene_mut.substring(0, index_of_position);
      var new_residue = gene_mut.substring(index_of_position + position[0].length);
      var tax_format = {
        type: "aa",
        gene: gene,
        previous_residue: previous_residue,
        new_residue: new_residue,
        residue_pos: parseInt(position[0])
      };
      var jsonned = JSON.stringify(tax_format); //console.log("jsonned", jsonned);

      if (mutation_lookup[jsonned]) {
        taxonium_muts.push(mutation_lookup[jsonned]);
      } else {
        unique_mutations.push(_objectSpread(_objectSpread({}, tax_format), {}, {
          mutation_id: unique_mutations.length
        }));
        var this_index = unique_mutations.length - 1;
        mutation_lookup[jsonned] = this_index;
        taxonium_muts.push(this_index);
      }
    });
  });
  return taxonium_muts;
};

function do_fetch(_x, _x2, _x3) {
  return _do_fetch.apply(this, arguments);
}

function _do_fetch() {
  _do_fetch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(url, sendStatusMessage, whatIsBeingDownloaded) {
    var response, inflated, text, _response, _text2;

    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!sendStatusMessage) {
              sendStatusMessage = function sendStatusMessage() {};
            } // send progress on downloadProgress


            if (!url.endsWith(".gz")) {
              _context.next = 11;
              break;
            }

            _context.next = 4;
            return axios__WEBPACK_IMPORTED_MODULE_1___default().get(url, {
              responseType: "arraybuffer",
              onDownloadProgress: function onDownloadProgress(progress) {
                sendStatusMessage({
                  message: "Downloading compressed " + whatIsBeingDownloaded,
                  percentage: progress.loaded / progress.total * 100
                });
              }
            });

          case 4:
            response = _context.sent;
            sendStatusMessage({
              message: "Decompressing compressed " + whatIsBeingDownloaded
            });
            inflated = pako__WEBPACK_IMPORTED_MODULE_0__["default"].ungzip(response.data);
            text = new TextDecoder("utf-8").decode(inflated);
            return _context.abrupt("return", text);

          case 11:
            _context.next = 13;
            return axios__WEBPACK_IMPORTED_MODULE_1___default().get(url, {
              transformResponse: function transformResponse(res) {
                // Do your own parsing here if needed ie JSON.parse(res);
                return res;
              },
              responseType: "json",
              onDownloadProgress: function onDownloadProgress(progress) {
                sendStatusMessage({
                  message: "Downloading " + whatIsBeingDownloaded,
                  percentage: progress.loaded / progress.total * 100
                });
              }
            });

          case 13:
            _response = _context.sent;
            _text2 = _response.data; //parse text:

            return _context.abrupt("return", _text2);

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _do_fetch.apply(this, arguments);
}

function fetch_or_extract(file_obj, sendStatusMessage, whatIsBeingDownloaded) {
  if (file_obj.status === "url_supplied") {
    return do_fetch(file_obj.filename, sendStatusMessage, whatIsBeingDownloaded);
  } else if (file_obj.status === "loaded") {
    if (file_obj.filename.includes(".gz")) {
      var compressed_data = file_obj.data;
      sendStatusMessage({
        message: "Decompressing compressed " + whatIsBeingDownloaded
      });
      var inflated = pako__WEBPACK_IMPORTED_MODULE_0__["default"].ungzip(compressed_data);
      var text = new TextDecoder("utf-8").decode(inflated);
      return text;
    } else {
      // convert array buffer to string
      var _text = new TextDecoder("utf-8").decode(file_obj.data);

      return _text;
    }
  }
} // TODO: cleanup and processJsTree are duplicated in processNewick.js


function cleanup(_x4) {
  return _cleanup.apply(this, arguments);
}

function _cleanup() {
  _cleanup = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(tree) {
    var scale_y, all_xes_dist, all_xes_time, ref_x_percentile, ref_x_dist, ref_x_time, scale_x_dist, scale_x_time;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            tree.node.forEach(function (node, i) {
              node.node_id = i;
            });
            tree.node = tree.node.map(function (node, i) {
              var cleaned = {
                name: node.name.replace(/'/g, ""),
                parent_id: node.parent ? node.parent.node_id : node.node_id,
                mutations: node.mutations ? node.mutations : emptyList,
                y: node.y,
                num_tips: node.num_tips,
                is_tip: node.child.length === 0,
                node_id: node.node_id
              };
              Object.keys(node).forEach(function (key) {
                if (key.startsWith("meta_")) {
                  cleaned[key] = node[key];
                }
              });

              if (node.x_dist !== undefined) {
                cleaned.x_dist = node.x_dist;
              }

              if (node.x_time !== undefined) {
                cleaned.x_time = node.x_time;
              }

              return cleaned;
            });
            scale_y = 2000;
            all_xes_dist = tree.node.map(function (node) {
              return node.x_dist;
            });
            all_xes_time = tree.node.map(function (node) {
              return node.x_time;
            });
            all_xes_dist.sort(function (a, b) {
              return a - b;
            });
            all_xes_time.sort(function (a, b) {
              return a - b;
            });
            ref_x_percentile = 0.99;
            ref_x_dist = all_xes_dist[Math.floor(all_xes_dist.length * ref_x_percentile)];
            ref_x_time = all_xes_time[Math.floor(all_xes_time.length * ref_x_percentile)];
            scale_x_dist = 450 / ref_x_dist;
            scale_x_time = 450 / ref_x_time;
            tree.node.forEach(function (node) {
              if (node.x_dist !== undefined) {
                node.x_dist = node.x_dist * scale_x_dist;
              }

              if (node.x_time !== undefined) {
                node.x_time = node.x_time * scale_x_time;
              }

              node.y = node.y * scale_y;
            });

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _cleanup.apply(this, arguments);
}

function processJsTree(_x5, _x6, _x7, _x8) {
  return _processJsTree.apply(this, arguments);
}

function _processJsTree() {
  _processJsTree = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(tree, data, config, sendStatusMessage) {
    var assignNumTips, sortWithNumTips, total_tips, overallMaxX, overallMinX, overallMaxY, overallMinY, y_positions, output;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            sortWithNumTips = function _sortWithNumTips(node) {
              node.child.sort(function (a, b) {
                return a.num_tips - b.num_tips;
              });
              node.child.forEach(function (child) {
                sortWithNumTips(child);
              });
            };

            assignNumTips = function _assignNumTips(node) {
              if (node.child.length === 0) {
                node.num_tips = 1;
              } else {
                node.num_tips = 0;
                node.child.forEach(function (child) {
                  node.num_tips += assignNumTips(child);
                });
              }

              return node.num_tips;
            };

            assignNumTips(tree.root);
            total_tips = tree.root.num_tips;

            if (data.ladderize) {
              sortWithNumTips(tree.root);
            }

            tree.node = (0,_jstree__WEBPACK_IMPORTED_MODULE_3__.kn_expand_node)(tree.root);
            sendStatusMessage({
              message: "Laying out the tree"
            }); // first set "d" to genetic distance

            if (tree.node[0].pre_x_dist !== undefined) {
              tree.node.forEach(function (node) {
                node.d = node.pre_x_dist;
              });
              (0,_jstree__WEBPACK_IMPORTED_MODULE_3__.kn_calxy)(tree, true); // kn_calxy sets x -> move x to x_dist

              tree.node.forEach(function (node) {
                node.x_dist = node.x;
              });
            }

            if (tree.node[0].pre_x_time !== undefined) {
              // rerun kn_calxy to set x again (but for time)
              tree.node.forEach(function (node) {
                node.d = node.pre_x_time;
              });
              (0,_jstree__WEBPACK_IMPORTED_MODULE_3__.kn_calxy)(tree, true);
              tree.node.forEach(function (node) {
                node.x_time = node.x;
              });
            } // Now tree.node will have x_dist and/or x_time depending on JSON content


            sendStatusMessage({
              message: "Sorting on Y"
            }); // sort on y:

            tree.node.sort(function (a, b) {
              return a.y - b.y;
            });
            sendStatusMessage({
              message: "Re-processing"
            });
            cleanup(tree);
            overallMaxX = (0,_reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_2__["default"])(tree.node, function (x) {
              return x.x_dist;
            }, "max");
            overallMinX = (0,_reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_2__["default"])(tree.node, function (x) {
              return x.x_dist;
            }, "min");
            overallMaxY = (0,_reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_2__["default"])(tree.node, function (x) {
              return x.y;
            }, "max");
            overallMinY = (0,_reduceMaxOrMin__WEBPACK_IMPORTED_MODULE_2__["default"])(tree.node, function (x) {
              return x.y;
            }, "min");
            y_positions = tree.node.map(function (x) {
              return x.y;
            });
            output = {
              nodes: tree.node,
              overallMaxX: overallMaxX,
              overallMaxY: overallMaxY,
              overallMinX: overallMinX,
              overallMinY: overallMinY,
              y_positions: y_positions,
              mutations: [],
              node_to_mut: {},
              rootMutations: [],
              rootId: 0,
              overwrite_config: _objectSpread(_objectSpread({}, config), {}, {
                num_tips: total_tips
              })
            };
            return _context3.abrupt("return", output);

          case 20:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _processJsTree.apply(this, arguments);
}

function json_preorder(root) {
  var n_tips = 0;
  var parents = {};
  parents[root.name] = null;
  var path = [];
  var stack = [root];
  var unique_mutations = [];
  var mutation_lookup = {};

  var _loop = function _loop() {
    var nodeJson = stack.pop();
    var div = null;
    var time = null;

    if (nodeJson.node_attrs.div) {
      div = nodeJson.node_attrs.div;
    }

    if (nodeJson.node_attrs.num_date) {
      time = nodeJson.node_attrs.num_date.value;
    } //console.log(nodeJson);
    // this is the node format for downstream processing


    var parsedNode = {
      name: nodeJson.name,
      child: [],
      meta: "",
      hl: false,
      hidden: false,
      mutations: nodeJson.branch_attrs && nodeJson.branch_attrs.mutations ? nodeMutationsFromNextStrainToTaxonium(nodeJson.branch_attrs.mutations, unique_mutations, mutation_lookup) : []
    }; // assign distance

    div && (parsedNode.div = div);
    time && (parsedNode.time = time); // assign metadata

    var notMeta = ["div", "num_date"];
    Object.keys(nodeJson.node_attrs).filter(function (x) {
      return !notMeta.includes(x);
    }).forEach(function (x) {
      // sometimes the data is not wrapped in a value tag. e.g. "accession" in mpx
      var attr = nodeJson.node_attrs[x];
      parsedNode["meta_".concat(x)] = attr.value && _typeof(attr.value) !== "object" ? attr.value : _typeof(attr) !== "object" ? attr : "";
    });
    path.push(parsedNode);

    if (nodeJson.children !== undefined) {
      var _iterator = _createForOfIteratorHelper(nodeJson.children),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var childJson = _step.value;
          parents[childJson.name] = parsedNode;
          stack.push(childJson);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    } else {
      n_tips += 1;
    }
  };

  while (stack.length > 0) {
    _loop();
  }

  return {
    path: path,
    parents: parents,
    n_tips: n_tips,
    unique_mutations: unique_mutations
  };
}

function json_to_tree(_x9) {
  return _json_to_tree.apply(this, arguments);
}

function _json_to_tree() {
  _json_to_tree = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(json) {
    var rootJson, _json_preorder, preorder, parents, n_tips, unique_mutations, nodes, root, _iterator2, _step2, node, parent, jsTree, config;

    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            rootJson = json.tree;
            _json_preorder = json_preorder(rootJson), preorder = _json_preorder.path, parents = _json_preorder.parents, n_tips = _json_preorder.n_tips, unique_mutations = _json_preorder.unique_mutations;
            nodes = [];
            _iterator2 = _createForOfIteratorHelper(preorder);

            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                node = _step2.value;
                parent = parents[node.name];
                node.parent = parent;

                if (parent) {
                  parent.child.push(node);

                  if (node.div !== undefined) {
                    node.pre_x_dist = node.div - parent.div;
                  }

                  if (node.time !== undefined) {
                    node.pre_x_time = node.time - parent.time;
                  }
                } else {
                  root = node;
                  node.pre_x_time = 0;
                  node.pre_x_dist = 0;
                }

                nodes.push(node);
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }

            jsTree = {
              // tree in jstree.js format
              node: nodes,
              error: 0,
              n_tips: n_tips,
              root: root
            };
            config = {};
            console.log("META", json.meta);
            config.title = json.meta.title;
            console.log("META PROV", json.meta.data_provenance);

            if (json.meta && json.meta.data_provenance) {
              config.source = json.meta.data_provenance.map(function (source) {
                return source.name;
              }).join(" & ") + " on " + json.meta.updated + " in a build maintained by " + json.meta.maintainers.map(function (source) {
                return source.name;
              }).join(" & ");
            }

            config.overlay = "<p>This is a tree generated from a <a href='//nextstrain.org'>Nextstrain</a> JSON file, being visualised in Taxonium.</p>.";

            if (json.meta.build_url) {
              config.overlay += "<p>The Nextstrain build is available <a class='underline' href='".concat(json.meta.build_url, "'>here</a>.</p>");
            }

            return _context4.abrupt("return", {
              jsTree: jsTree,
              config: config,
              unique_mutations: unique_mutations
            });

          case 14:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _json_to_tree.apply(this, arguments);
}

function processNextstrain(_x10, _x11) {
  return _processNextstrain.apply(this, arguments);
}

function _processNextstrain() {
  _processNextstrain = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(data, sendStatusMessage) {
    var the_data, _yield$json_to_tree, jsTree, config, unique_mutations, output, node_to_mut;

    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return fetch_or_extract(data, sendStatusMessage, "tree");

          case 2:
            the_data = _context5.sent;
            sendStatusMessage({
              message: "Parsing NS file"
            });
            _context5.next = 6;
            return json_to_tree(JSON.parse(the_data));

          case 6:
            _yield$json_to_tree = _context5.sent;
            jsTree = _yield$json_to_tree.jsTree;
            config = _yield$json_to_tree.config;
            unique_mutations = _yield$json_to_tree.unique_mutations;
            _context5.next = 12;
            return processJsTree(jsTree, data, config, sendStatusMessage);

          case 12:
            output = _context5.sent;
            node_to_mut = output.nodes.map(function (x) {
              return x.mutations;
            });
            return _context5.abrupt("return", _objectSpread(_objectSpread({}, output), {}, {
              mutations: unique_mutations,
              node_to_mut: node_to_mut
            }));

          case 15:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _processNextstrain.apply(this, arguments);
}

/***/ }),

/***/ "./src/utils/reduceMaxOrMin.js":
/*!*************************************!*\
  !*** ./src/utils/reduceMaxOrMin.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
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

/* harmony default export */ __webpack_exports__["default"] = (reduceMaxOrMin);

/***/ }),

/***/ "./src/webworkers/localBackendWorker.js":
/*!**********************************************!*\
  !*** ./src/webworkers/localBackendWorker.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "queryNodes": function() { return /* binding */ queryNodes; }
/* harmony export */ });
/* harmony import */ var taxonium_data_handling_filtering_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! taxonium_data_handling/filtering.js */ "./node_modules/taxonium_data_handling/filtering.js");
/* harmony import */ var taxonium_data_handling_exporting_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! taxonium_data_handling/exporting.js */ "./node_modules/taxonium_data_handling/exporting.js");
/* harmony import */ var taxonium_data_handling_importing_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! taxonium_data_handling/importing.js */ "./node_modules/taxonium_data_handling/importing.js");
/* harmony import */ var _utils_processNewick_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/processNewick.js */ "./src/utils/processNewick.js");
/* harmony import */ var _utils_processNextstrain_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/processNextstrain.js */ "./src/utils/processNextstrain.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return generator._invoke = function (innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; }(innerFn, self, context), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; this._invoke = function (method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, define(Gp, "constructor", GeneratorFunctionPrototype), define(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (object) { var keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, catch: function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }






console.log("worker starting");
postMessage({
  data: "Worker starting"
});
var the_cache = {};
var cache_helper = {
  retrieve_from_cache: function retrieve_from_cache(key) {
    return the_cache[key];
  },
  store_in_cache: function store_in_cache(key, value) {
    the_cache[key] = value; // Total size of the lists in the cache

    var total_size = 0;

    for (var _key in the_cache) {
      total_size += the_cache[_key].length;
    } // If the cache is too big, remove a random item


    if (total_size > 100e6) {
      var keys = Object.keys(the_cache);
      var random_key = keys[Math.floor(Math.random() * keys.length)];
      delete the_cache[random_key];
    }
  }
};
var processedUploadedData;

var sendStatusMessage = function sendStatusMessage(status_obj) {
  postMessage({
    type: "status",
    data: status_obj
  });
};

var waitForProcessedData = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(processedUploadedData === undefined)) {
              _context.next = 3;
              break;
            }

            _context.next = 3;
            return new Promise(function (resolve) {
              var interval = setInterval(function () {
                if (processedUploadedData !== undefined) {
                  clearInterval(interval);
                  resolve();
                }
              }, 100);
            });

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function waitForProcessedData() {
    return _ref.apply(this, arguments);
  };
}();

var queryNodes = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(boundsForQueries) {
    var _processedUploadedDat, nodes, overallMaxX, overallMaxY, overallMinX, overallMinY, y_positions, min_y, max_y, min_x, max_x, result;

    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            console.log("Worker query Nodes");
            _context2.next = 3;
            return waitForProcessedData();

          case 3:
            _processedUploadedDat = processedUploadedData, nodes = _processedUploadedDat.nodes, overallMaxX = _processedUploadedDat.overallMaxX, overallMaxY = _processedUploadedDat.overallMaxY, overallMinX = _processedUploadedDat.overallMinX, overallMinY = _processedUploadedDat.overallMinY, y_positions = _processedUploadedDat.y_positions;
            min_y = isNaN(boundsForQueries.min_y) ? overallMinY : boundsForQueries.min_y;
            max_y = isNaN(boundsForQueries.max_y) ? overallMaxY : boundsForQueries.max_y;
            min_x = isNaN(boundsForQueries.min_x) ? overallMinX : boundsForQueries.min_x;
            max_x = isNaN(boundsForQueries.max_x) ? overallMaxX : boundsForQueries.max_x;

            if (min_y < overallMinY) {
              min_y = overallMinY;
            }

            if (max_y > overallMaxY) {
              max_y = overallMaxY;
            }

            console.log("filtering");
            result = {
              nodes: taxonium_data_handling_filtering_js__WEBPACK_IMPORTED_MODULE_0__["default"].getNodes(nodes, y_positions, min_y, max_y, min_x, max_x, boundsForQueries.xType)
            };
            console.log("result is done");
            return _context2.abrupt("return", result);

          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function queryNodes(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var search = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(_search, bounds) {
    var _processedUploadedDat2, nodes, overallMaxX, overallMaxY, overallMinX, overallMinY, y_positions, node_to_mut, mutations, spec, min_y, max_y, min_x, max_x, xType, result;

    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            console.log("Worker query Search");
            _context3.next = 3;
            return waitForProcessedData();

          case 3:
            _processedUploadedDat2 = processedUploadedData, nodes = _processedUploadedDat2.nodes, overallMaxX = _processedUploadedDat2.overallMaxX, overallMaxY = _processedUploadedDat2.overallMaxY, overallMinX = _processedUploadedDat2.overallMinX, overallMinY = _processedUploadedDat2.overallMinY, y_positions = _processedUploadedDat2.y_positions, node_to_mut = _processedUploadedDat2.node_to_mut, mutations = _processedUploadedDat2.mutations;
            spec = JSON.parse(_search);
            console.log(spec);
            min_y = bounds && bounds.min_y ? bounds.min_y : overallMinY;
            max_y = bounds && bounds.max_y ? bounds.max_y : overallMaxY;
            min_x = bounds && bounds.min_x ? bounds.min_x : overallMinX;
            max_x = bounds && bounds.max_x ? bounds.max_x : overallMaxX;
            xType = bounds && bounds.xType ? bounds.xType : "x_dist";
            result = taxonium_data_handling_filtering_js__WEBPACK_IMPORTED_MODULE_0__["default"].singleSearch({
              data: nodes,
              spec: spec,
              min_y: min_y,
              max_y: max_y,
              min_x: min_x,
              max_x: max_x,
              y_positions: y_positions,
              mutations: mutations,
              node_to_mut: node_to_mut,
              xType: xType,
              cache_helper: cache_helper
            });
            console.log("got search result", result);
            result.key = spec.key;
            return _context3.abrupt("return", result);

          case 15:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function search(_x2, _x3) {
    return _ref3.apply(this, arguments);
  };
}();

var getConfig = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var config, to_remove, firstNode, prettyName, typeFromKey, initial_search_types, colorByOptions, merged_config;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            console.log("Worker getConfig");
            _context4.next = 3;
            return waitForProcessedData();

          case 3:
            config = {};
            config.num_nodes = processedUploadedData.nodes.length;
            config.initial_x = (processedUploadedData.overallMaxX + processedUploadedData.overallMinX) / 2;
            config.initial_y = (processedUploadedData.overallMaxY + processedUploadedData.overallMinY) / 2;
            config.initial_zoom = config.initial_zoom ? config.initial_zoom : -2;
            config.genes = _toConsumableArray(new Set(processedUploadedData.mutations.map(function (x) {
              return x ? x.gene : null;
            }))).filter(function (x) {
              return x;
            }).sort();
            config.rootMutations = processedUploadedData.rootMutations;
            config.rootId = processedUploadedData.rootId;
            config.name_accessor = "name";
            to_remove = ["parent_id", "node_id", "x", "x_dist", "x_time", "y", "mutations", "name", "num_tips", "time_x", "clades", "is_tip"];
            firstNode = processedUploadedData.nodes[0];
            config.x_accessors = firstNode.x_dist && firstNode.x_time ? ["x_dist", "x_time"] : firstNode.x_dist ? ["x_dist"] : ["x_time"];
            config.keys_to_display = Object.keys(processedUploadedData.nodes[0]).filter(function (x) {
              return !to_remove.includes(x);
            });
            /*config.search_types = [
              { name: "name", label: "Name", type: "text_match" },
              { name: "meta_Lineage", label: "PANGO lineage", type: "text_exact" },
              { name: "meta_Country", label: "Country", type: "text_match" },
              { name: "mutation", label: "Mutation", type: "mutation" },
              { name: "revertant", label: "Revertant", type: "revertant" },
              { name: "genbank", label: "Genbank", type: "text_per_line" },
            ];*/

            prettyName = function prettyName(x) {
              // if x starts with meta_
              if (x.startsWith("meta_")) {
                var bit = x.substring(5);

                var _capitalised_first_letter = bit.charAt(0).toUpperCase() + bit.slice(1);

                return _capitalised_first_letter;
              }

              if (x === "mutation") {
                return "Mutation";
              }

              var capitalised_first_letter = x.charAt(0).toUpperCase() + x.slice(1);
              return capitalised_first_letter;
            };

            typeFromKey = function typeFromKey(x) {
              if (x === "mutation") {
                return "mutation";
              }

              if (x === "genotype") {
                return "genotype";
              }

              if (x === "num_tips") {
                return "number";
              }

              if (x === "genbank") {
                return "text_per_line";
              }

              if (x === "revertant") {
                return "revertant";
              }

              if (x === "meta_Lineage") {
                return "text_exact";
              }

              if (x === "boolean") return "boolean";
              return "text_match";
            };

            initial_search_types = ["name"].concat(_toConsumableArray(config.keys_to_display));

            if (processedUploadedData.mutations.length > 0) {
              initial_search_types.push("mutation");
              initial_search_types.push("genotype");
            }

            if (processedUploadedData.rootMutations.length > 0) {
              initial_search_types.push("revertant");
            }

            initial_search_types.push("num_tips");

            if (initial_search_types.length > 1) {
              initial_search_types.push("boolean");
            }

            config.search_types = initial_search_types.map(function (x) {
              return {
                name: x,
                label: prettyName(x),
                type: typeFromKey(x)
              };
            });
            config.search_types.forEach(function (x) {
              // if "text" is found in the type
              if (x.type.includes("text")) {
                x.controls = true;
              }
            });
            colorByOptions = _toConsumableArray(config.keys_to_display);

            if (processedUploadedData.mutations.length > 0) {
              colorByOptions.push("genotype");
            }

            colorByOptions.push("None");

            if (colorByOptions.length < 2) {
              config.colorMapping = {
                None: [50, 50, 150]
              };
            }

            config.colorBy = {
              colorByOptions: colorByOptions
            }; //check if 'meta_pangolin_lineage' is in options

            config.defaultColorByField = colorByOptions.includes("meta_pangolin_lineage") ? "meta_pangolin_lineage" : colorByOptions[0];
            config.mutations = processedUploadedData.mutations;
            console.log("overwrite with", processedUploadedData.overwrite_config);
            merged_config = _objectSpread(_objectSpread({}, config), processedUploadedData.overwrite_config); //console.log("config is ", config);

            return _context4.abrupt("return", merged_config);

          case 35:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function getConfig() {
    return _ref4.apply(this, arguments);
  };
}();

var getDetails = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(node_id) {
    var _processedUploadedDat3, nodes, node, details;

    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            console.log("Worker getDetails");
            _context5.next = 3;
            return waitForProcessedData();

          case 3:
            _processedUploadedDat3 = processedUploadedData, nodes = _processedUploadedDat3.nodes;
            node = nodes[node_id];
            console.log("node is ", node);
            details = _objectSpread({}, node);
            details.mutations = processedUploadedData.node_to_mut[node_id] ? processedUploadedData.node_to_mut[node_id].map(function (x) {
              return processedUploadedData.mutations[x];
            }) : [];
            console.log("details is ", details);
            return _context5.abrupt("return", details);

          case 10:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function getDetails(_x4) {
    return _ref5.apply(this, arguments);
  };
}();

var getList = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(node_id, att) {
    var _processedUploadedDat4, nodes, atts;

    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            console.log("Worker getList");
            _context6.next = 3;
            return waitForProcessedData();

          case 3:
            _processedUploadedDat4 = processedUploadedData, nodes = _processedUploadedDat4.nodes;
            atts = taxonium_data_handling_filtering_js__WEBPACK_IMPORTED_MODULE_0__["default"].getTipAtts(nodes, node_id, att);
            return _context6.abrupt("return", atts);

          case 6:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));

  return function getList(_x5, _x6) {
    return _ref6.apply(this, arguments);
  };
}();

onmessage = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(event) {
    var data, result, _result, _result2, _result3, _result4, _result5;

    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            //Process uploaded data:
            console.log("Worker onmessage");
            data = event.data;

            if (!(data.type === "upload" && data.data && data.data.filename && data.data.filename.includes("jsonl"))) {
              _context7.next = 9;
              break;
            }

            _context7.next = 5;
            return (0,taxonium_data_handling_importing_js__WEBPACK_IMPORTED_MODULE_2__.processJsonl)(data.data, sendStatusMessage);

          case 5:
            processedUploadedData = _context7.sent;
            console.log("processedUploadedData created");
            _context7.next = 61;
            break;

          case 9:
            if (!(data.type === "upload" && data.data && data.data.filename && data.data.filetype === "nwk")) {
              _context7.next = 17;
              break;
            }

            console.log("got nwk file", data.data);
            data.data.useDistances = true;
            _context7.next = 14;
            return (0,_utils_processNewick_js__WEBPACK_IMPORTED_MODULE_3__.processNewickAndMetadata)(data.data, sendStatusMessage);

          case 14:
            processedUploadedData = _context7.sent;
            _context7.next = 61;
            break;

          case 17:
            if (!(data.type === "upload" && data.data && data.data.filename && data.data.filetype === "nextstrain")) {
              _context7.next = 23;
              break;
            }

            _context7.next = 20;
            return (0,_utils_processNextstrain_js__WEBPACK_IMPORTED_MODULE_4__.processNextstrain)(data.data, sendStatusMessage);

          case 20:
            processedUploadedData = _context7.sent;
            _context7.next = 61;
            break;

          case 23:
            if (!(data.type === "upload" && data.data && data.data.filename)) {
              _context7.next = 27;
              break;
            }

            sendStatusMessage({
              error: "Only Taxonium jsonl files are supported (could not find 'jsonl' in filename)"
            });
            _context7.next = 61;
            break;

          case 27:
            if (!(data.type === "query")) {
              _context7.next = 33;
              break;
            }

            console.log("Worker query");
            _context7.next = 31;
            return queryNodes(data.bounds);

          case 31:
            result = _context7.sent;
            postMessage({
              type: "query",
              data: result
            });

          case 33:
            if (!(data.type === "search")) {
              _context7.next = 39;
              break;
            }

            console.log("Worker search");
            _context7.next = 37;
            return search(data.search, data.bounds);

          case 37:
            _result = _context7.sent;
            postMessage({
              type: "search",
              data: _result
            });

          case 39:
            if (!(data.type === "config")) {
              _context7.next = 45;
              break;
            }

            console.log("Worker config");
            _context7.next = 43;
            return getConfig();

          case 43:
            _result2 = _context7.sent;
            postMessage({
              type: "config",
              data: _result2
            });

          case 45:
            if (!(data.type === "details")) {
              _context7.next = 51;
              break;
            }

            console.log("Worker details");
            _context7.next = 49;
            return getDetails(data.node_id);

          case 49:
            _result3 = _context7.sent;
            postMessage({
              type: "details",
              data: _result3
            });

          case 51:
            if (!(data.type === "list")) {
              _context7.next = 56;
              break;
            }

            _context7.next = 54;
            return getList(data.node_id, data.key);

          case 54:
            _result4 = _context7.sent;
            postMessage({
              type: "list",
              data: _result4
            });

          case 56:
            if (!(data.type === "nextstrain")) {
              _context7.next = 61;
              break;
            }

            _context7.next = 59;
            return (0,taxonium_data_handling_exporting_js__WEBPACK_IMPORTED_MODULE_1__.getNextstrainSubtreeJson)(data.node_id, processedUploadedData.nodes, data.config);

          case 59:
            _result5 = _context7.sent;
            postMessage({
              type: "nextstrain",
              data: _result5
            });

          case 61:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function onmessage(_x7) {
    return _ref7.apply(this, arguments);
  };
}();

/***/ }),

/***/ "?ed1b":
/*!**********************!*\
  !*** util (ignored) ***!
  \**********************/
/***/ (function() {

/* (ignored) */

/***/ }),

/***/ "?d17e":
/*!**********************!*\
  !*** util (ignored) ***!
  \**********************/
/***/ (function() {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = function() {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_pako_dist_pako_esm_mjs","vendors-node_modules_stream-browserify_index_js","vendors-node_modules_call-bind_callBound_js-node_modules_define-properties_index_js-node_modu-dc279b","vendors-node_modules_axios_index_js-node_modules_taxonium_data_handling_exporting_js-node_mod-cf4727"], function() { return __webpack_require__("./src/webworkers/localBackendWorker.js"); })
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	!function() {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = function(result, chunkIds, fn, priority) {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var chunkIds = deferred[i][0];
/******/ 				var fn = deferred[i][1];
/******/ 				var priority = deferred[i][2];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every(function(key) { return __webpack_require__.O[key](chunkIds[j]); })) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	!function() {
/******/ 		var getProto = Object.getPrototypeOf ? function(obj) { return Object.getPrototypeOf(obj); } : function(obj) { return obj.__proto__; };
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach(function(key) { def[key] = function() { return value[key]; }; });
/******/ 			}
/******/ 			def['default'] = function() { return value; };
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	!function() {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = function(chunkId) {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce(function(promises, key) {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = function(chunkId) {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".bundle.js";
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	!function() {
/******/ 		__webpack_require__.nmd = function(module) {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	!function() {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	!function() {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"src_webworkers_localBackendWorker_js": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = function(data) {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = function(chunkId, promises) {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunktaxonium"] = self["webpackChunktaxonium"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	!function() {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = function() {
/******/ 			return Promise.all(["vendors-node_modules_pako_dist_pako_esm_mjs","vendors-node_modules_stream-browserify_index_js","vendors-node_modules_call-bind_callBound_js-node_modules_define-properties_index_js-node_modu-dc279b","vendors-node_modules_axios_index_js-node_modules_taxonium_data_handling_exporting_js-node_mod-cf4727"].map(__webpack_require__.e, __webpack_require__)).then(next);
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;
//# sourceMappingURL=src_webworkers_localBackendWorker_js.bundle.js.map