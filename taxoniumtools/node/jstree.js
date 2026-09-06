/* eslint-disable */

// This file is heavily based on JStree with some small edits made for fixes in the Taxonium context
// see https://github.com/lh3/jstreeview

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
    hidden: false,
  };
}

function kn_add_node(str, l, tree, x) {
  // private method
  let i;
  var r,
    beg,
    end = 0,
    z;
  z = kn_new_node();
  for (
    i = l, beg = l;
    i < str.length && str.charAt(i) != "," && str.charAt(i) != ")";
    ++i
  ) {
    var c = str.charAt(i);
    if (c == "[") {
      var meta_beg = i;
      if (end == 0) end = i;
      do ++i;
      while (i < str.length && str.charAt(i) != "]");
      if (i == str.length) {
        tree.error |= 4;
        break;
      }
      z.meta = str.substr(meta_beg, i - meta_beg + 1);
    } else if (c == ":") {
      if (end == 0) end = i;
      for (var j = ++i; i < str.length; ++i) {
        var cc = str.charAt(i);
        if (
          (cc < "0" || cc > "9") &&
          cc != "e" &&
          cc != "E" &&
          cc != "+" &&
          cc != "-" &&
          cc != "."
        )
          break;
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
  for (var l = 0; l < str.length; ) {
    while (l < str.length && (str.charAt(l) < "!" || str.charAt(l) > "~")) ++l;
    if (l == str.length) break;
    var c = str.charAt(l);
    if (c == ",") ++l;
    else if (c == "(") {
      stack.push(-1);
      ++l;
    } else if (c == ")") {
      let x, m, i;
      x = tree.node.length;
      for (i = stack.length - 1; i >= 0; --i) if (stack[i] < 0) break;
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
  }
  // generate the string
  var str = "";
  var cur_depth = 0,
    is_first = 1;
  for (var i = 0; i < tree.node.length; ++i) {
    var p = tree.node[i];
    var n_bra = p.depth - cur_depth;
    if (n_bra > 0) {
      if (is_first) is_first = 0;
      else str += ",\n";
      for (var j = 0; j < n_bra; ++j) str += "(";
    } else if (n_bra < 0) str += "\n)";
    else str += ",\n";
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
    document.write(
      "<tr>" +
        "<td>" +
        p.name +
        "<td>" +
        i +
        "<td>" +
        p.d +
        "<td>" +
        p.x +
        "<td>" +
        p.y +
        "</tr>"
    );
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
  stack.push({ p: root, i: 0 });
  for (;;) {
    while (
      stack[stack.length - 1].i != stack[stack.length - 1].p.child.length &&
      !stack[stack.length - 1].p.hidden
    ) {
      var q = stack[stack.length - 1];
      stack.push({ p: q.p.child[q.i], i: 0 });
    }
    node.push(stack.pop().p);
    if (stack.length > 0) ++stack[stack.length - 1].i;
    else break;
  }
  return node;
}

/* Count the number of leaves */
function kn_count_tips(tree) {
  tree.n_tips = 0;
  for (var i = 0; i < tree.node.length; ++i)
    if (tree.node[i].child.length == 0 || tree.node[i].hidden) ++tree.n_tips;
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
    if (p.child.length == 0)
      p.hl = re != null && re.test(p.name) ? true : false;
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
    for (let i = 0; i < r.child.length; ++i) if (r.child[i] == p) break;
    r.child[i] = q;
    p.parent = null;
  } else {
    var j, k;
    for (let i = 0; i < p.child.length; ++i) if (p.child[i] == node) break;
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
  for (var r = q; r.parent; r = r.parent) if (r == p) return null; // p is an ancestor of q. We cannot move in this case.

  root = kn_remove_node(tree, p);

  var z = kn_new_node(); // a fake root
  z.child.push(root);
  root.parent = z;

  var i,
    r = q.parent;
  for (let i = 0; i < r.child.length; ++i) if (r.child[i] == q) break;
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
  for (let i = 0; i < p.child.length; ++i) if (p.child[i] == node) break;
  q.child[1] = p;
  d = p.d;
  p.d = tmp - dist;
  r = p.parent;
  p.parent = q;
  while (r != null) {
    s = r.parent; /* store r's parent */
    p.child[i] = r; /* change r to p's child */
    for (let i = 0; i < r.child.length; ++i /* update i */)
      if (r.child[i] == p) break;
    r.parent = p; /* update r's parent */
    tmp = r.d;
    r.d = d;
    d = tmp; /* swap r->d and d, i.e. update r->d */
    q = p;
    p = r;
    r = s; /* update p, q and r */
  }
  /* now p is the root node */
  if (p.child.length == 2) {
    /* remove p and link the other child of p to q */
    r = p.child[1 - i]; /* get the other child */
    for (let i = 0; i < q.child.length; ++i /* the position of p in q */)
      if (q.child[i] == p) break;
    r.d += p.d;
    r.parent = q;
    q.child[i] = r; /* link r to q */
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
  for (let i = 0; i < par.child.length; ++i) if (par.child[i] == p) break;
  idx = i;
  tmp = par.child.length - idx - 1;
  old_length = par.child.length;
  par.child.length += p.child.length - 1;
  for (let i = 0; i < tmp; ++i)
    par.child[par.child.length - 1 - i] = par.child[old_length - 1 - i];
  for (let i = 0; i < p.child.length; ++i) {
    p.child[i].parent = par;
    if (p.child[i].d >= 0 && p.d >= 0) p.child[i].d += p.d;
    par.child[i + idx] = p.child[i];
  }
}

function kn_reorder(root) {
  const sort_leaf = function (a, b) {
    if (a.depth < b.depth) return 1;
    if (a.depth > b.depth) return -1;
    return String(a.name) < String(b.name)
      ? -1
      : String(a.name) > String(b.name)
      ? 1
      : 0;
  };
  const sort_weight = function (a, b) {
    return a.weight / a.n_tips - b.weight / b.n_tips;
  };

  var x = new Array();
  var i,
    node = kn_expand_node(root);
  // get depth
  node[node.length - 1].depth = 0;
  for (let i = node.length - 2; i >= 0; --i) {
    var q = node[i];
    q.depth = q.parent.depth + 1;
    if (q.child.length == 0) x.push(q);
  }
  // set weight for leaves
  x.sort(sort_leaf);
  for (let i = 0; i < x.length; ++i) (x[i].weight = i), (x[i].n_tips = 1);
  // set weight for internal nodes
  for (let i = 0; i < node.length; ++i) {
    var q = node[i];
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
  }
  // swap children
  for (let i = 0; i < node.length; ++i)
    if (node[i].child.length >= 2) node[i].child.sort(sort_weight);
}

function kn_reorder_num_tips(root) {
  const sort_leaf = function (a, b) {
    return a.num_tips - b.num_tips;
  };

  const sort_weight = function (a, b) {
    return a.num_tips - b.num_tips;
  };

  var x = new Array();
  var i,
    node = kn_expand_node(root);
  // get depth
  node[node.length - 1].depth = 0;
  for (let i = node.length - 2; i >= 0; --i) {
    var q = node[i];
    q.depth = q.parent.depth + 1;
    if (q.child.length == 0) x.push(q);
  }
  // set weight for leaves
  x.sort(sort_leaf);
  for (let i = 0; i < x.length; ++i) (x[i].weight = i), (x[i].n_tips = 1);
  // set weight for internal nodes
  for (let i = 0; i < node.length; ++i) {
    var q = node[i];
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
  }
  // swap children
  for (let i = 0; i < node.length; ++i)
    if (node[i].child.length >= 2) node[i].child.sort(sort_weight);
}

/*****************************************
 ***** Functions for plotting a tree *****
 *****************************************/

/* Calculate the coordinate of each node */
function kn_calxy(tree, is_real) {
  var i, j, scale;
  // calculate y
  scale = tree.n_tips - 1;
  for (let i = (j = 0); i < tree.node.length; ++i) {
    var p = tree.node[i];
    p.y =
      p.child.length && !p.hidden
        ? (p.child[0].y + p.child[p.child.length - 1].y) / 2.0
        : j++ / scale;
    if (p.child.length == 0) p.miny = p.maxy = p.y;
    else
      (p.miny = p.child[0].miny), (p.maxy = p.child[p.child.length - 1].maxy);
  }
  // calculate x
  if (is_real) {
    // use branch length
    var root = tree.node[tree.node.length - 1];
    scale = root.x = root.d >= 0.0 ? root.d : 0.0;
    for (let i = tree.node.length - 2; i >= 0; --i) {
      var p = tree.node[i];
      p.x = p.parent.x + (p.d >= 0.0 ? p.d : 0.0);
      if (p.x > scale) scale = p.x;
    }
    if (scale == 0.0) is_real = false;
  }
  if (!is_real) {
    // no branch length
    scale = tree.node[tree.node.length - 1].x = 1.0;
    for (let i = tree.node.length - 2; i >= 0; --i) {
      var p = tree.node[i];
      p.x = p.parent.x + 1.0;
      if (p.x > scale) scale = p.x;
    }
    for (let i = 0; i < tree.node.length - 1; ++i)
      if (tree.node[i].child.length == 0) tree.node[i].x = scale;
  }
  // rescale x
  for (let i = 0; i < tree.node.length; ++i) tree.node[i].x /= scale;
  return is_real;
}

function kn_get_node(tree, conf, x, y) {
  if (conf.is_circular) {
    for (var i = 0; i < tree.node.length; ++i) {
      var p = tree.node[i];
      var tmp_x = Math.floor(
        conf.width / 2 +
          p.x * conf.real_r * Math.cos(p.y * conf.full_arc) +
          0.999
      );
      var tmp_y = Math.floor(
        conf.height / 2 +
          p.x * conf.real_r * Math.sin(p.y * conf.full_arc) +
          0.999
      );
      var tmp_l = 2;
      if (
        x >= tmp_x - tmp_l &&
        x <= tmp_x + tmp_l &&
        y >= tmp_y - tmp_l &&
        y <= tmp_y + tmp_l
      )
        return i;
    }
  } else {
    for (var i = 0; i < tree.node.length; ++i) {
      var tmp_x = tree.node[i].x * conf.real_x + conf.shift_x;
      var tmp_y = tree.node[i].y * conf.real_y + conf.shift_y;
      var tmp_l = conf.box_width * 0.6;
      if (
        x >= tmp_x - tmp_l &&
        x <= tmp_x + tmp_l &&
        y >= tmp_y - tmp_l &&
        y <= tmp_y + tmp_l
      )
        return i;
    }
  }
  return tree.node.length;
}

module.exports = {
  kn_expand_node,
  kn_reorder,
  kn_parse,
  kn_calxy,
  kn_reorder_num_tips,
};
