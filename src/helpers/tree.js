/* eslint-disable */
window.newick="((A:1,EE:5):3,B:2,(C:5,D:2):3)"
function kn_parse(str) {
    var stack = new Array();
    var tree = new Object();
    tree.error = tree.n_tips = 0;
    tree.names = new Array();
    tree.distances = new Array();
    tree.parents = new Array();
    tree.children = new Array();
    tree.x = new Array();
    tree.y = new Array();
    tree.miny = new Array();
    tree.maxy = new Array();
    tree.hidden = new Array();
    for (var l = 0; l < str.length;) {
        while (l < str.length && (str.charAt(l) < '!' || str.charAt(l) > '~')) ++l;
        if (l == str.length) break;
        var c = str.charAt(l);
        if (c == ',') ++l;
        else if (c == '(') {
            stack.push(-1); ++l;
        } else if (c == ')') {
            var x, m, i;
            x = tree.names.length;
            for (i = stack.length - 1; i >= 0; --i)
                if (stack[i] < 0) break;
            if (i < 0) {
                tree.error |= 1; break;
            }
            m = stack.length - 1 - i;
            l = kn_add_node(str, l + 1, tree, m);
            for (i = stack.length - 1, m = m - 1; m >= 0; --m, --i) {
                tree.children[x][m] = stack[i];
                tree.parents[stack[i]] = x;
            }
            stack.length = i;
            stack.push(x);
        } else {
            ++tree.n_tips;
            stack.push(tree.names.length);
            l = kn_add_node(str, l, tree, 0);
        }
    }
    if (stack.length > 1) tree.error |= 2;
    tree.root = tree.names.length - 1
    return tree;
}

function kn_add_node(str, l, tree, x) // private method
{
    var r, beg, end = 0, z;

    for (var i = l, beg = l; i < str.length && str.charAt(i) != ',' && str.charAt(i) != ')'; ++i) {
        var c = str.charAt(i);
        if (c == '[') {
            var meta_beg = i;
            if (end == 0) end = i;
            do ++i; while (i < str.length && str.charAt(i) != ']');
            if (i == str.length) {
                tree.error |= 4;
                break;
            }
            meta = str.substr(meta_beg, i - meta_beg + 1); //TODO use this
        } else if (c == ':') {
            if (end == 0) end = i;
            for (var j = ++i; i < str.length; ++i) {
                var cc = str.charAt(i);
                if ((cc < '0' || cc > '9') && cc != 'e' && cc != 'E' && cc != '+' && cc != '-' && cc != '.')
                    break;
            }
            var distance = parseFloat(str.substr(j, i - j));
            --i;
        } else if (c < '!' && c > '~' && end == 0) end = i;
    }
    if (end == 0) end = i;
    var node_name = ""
    if (end > beg) node_name = str.substr(beg, end - beg);
    tree.names.push(node_name);
    tree.distances.push(distance)
    tree.parents.push(null)
    tree.children.push([])
    tree.x.push(0)
    tree.y.push(0)
    tree.miny.push(0)
    tree.maxy.push(0)
    tree.hidden.push(false)


    return i;
}


function kn_calxy(tree, is_real) {
    var i, j, scale;
    // calculate y
    scale = tree.n_tips - 1;
    for (i = j = 0; i < tree.names.length; ++i) {

        tree.y[tree.node_order[i]] = (tree.children[tree.node_order[i]].length && !tree.hidden[tree.node_order[i]]) ? (tree.y[tree.children[tree.node_order[i]][0]] + tree.y[tree.children[tree.node_order[i]][tree.children[tree.node_order[i]].length - 1]]) / 2.0 : (j++) / scale;
        if (tree.children[tree.node_order[i]].length == 0) tree.miny[tree.node_order[i]] = tree.maxy[tree.node_order[i]] = tree.y[tree.node_order[i]];
        else tree.miny[tree.node_order[i]] = tree.miny[tree.children[tree.node_order[i]][0]], tree.maxy[tree.node_order[i]] = tree.maxy[tree.children[tree.node_order[i]][tree.children[tree.node_order[i]].length - 1]];
    }
    // calculate x
    if (is_real) { // use branch length
        var root = tree.names.length - 1;
        scale = tree.x[root] = (tree.distances[root] >= 0.0) ? tree.distances[root] : 0.0;
        for (i = tree.names.length - 2; i >= 0; --i) {
            tree.x[i] = tree.x[tree.parents[i]] + (tree.distances[i] >= 0.0 ? tree.distances[i] : 0.0);
            if (tree.x[i] > scale) scale = tree.x[i];
        }
        if (scale == 0.0) is_real = false;
    }
    if (!is_real) { // no branch length
        scale = tree.x[tree.names.length - 1] = 1.0;
        for (i = tree.names.length - 2; i >= 0; --i) {
            tree.x[i] = tree.x[tree.parents[i]] + 1.0;
            if (tree.x[i] > scale) scale = tree.x[i];
        }
        for (i = 0; i < tree.names.length - 1; ++i)
            if (tree.children[i].length == 0)
                tree.x[i] = scale;
    }
    // rescale x
    for (i = 0; i < tree.names.length; ++i)
        tree.x[i] /= scale;
    return is_real;
}

function kn_expand_node(tree, root) {
	var node, stack;
	node = new Array();
	stack = new Array();
	stack.push({ p: root, i: 0 });
	for (; ;) {
		while (stack[stack.length - 1].i != tree.children[stack[stack.length - 1].p].length && !tree.hidden[stack[stack.length - 1].p]) {
			var q = stack[stack.length - 1];
			stack.push({ p: tree.children[q.p][q.i], i: 0 });
		}
		node.push(stack.pop().p);
		if (stack.length > 0) ++stack[stack.length - 1].i;
		else break;
	}
	return node;
}


function kn_reorder(tree, root) {
    var depths = {}
    var tip_numbers = {}
    var weights = {}

	var sort_leaf = function (a, b) {
		if (depths[a] < depths[b]) return 1;
		if (depths[a] > depths[b]) return -1;
		return String(tree.names[a]) < String(tree.names[b]) ? -1 : String(tree.names[a]) > String(tree.names[b]) ? 1 : 0;
	};
	var sort_weight = function (a, b) { return weights[a] / tip_numbers[a] - weights[b] / tip_numbers[b]; };
    //console.log("yp")
	var x = new Array();
	var i, node = kn_expand_node(tree,root);
    window.node= node
	// get depth
	depths[node.length - 1] = 0;
	for (i = node.length - 2; i >= 0; --i) {
		var q = node[i];
		depths[q] = depths[tree.parents[q]] + 1;
		if (tree.children[q].length == 0) x.push(q);
	}
	// set weight for leaves
	x.sort(sort_leaf);
	for (i = 0; i < x.length; ++i) weights[x[i]] = i, tip_numbers[x[i]] = 1;
	// set weight for internal nodes
	for (i = 0; i < node.length; ++i) {
		var q = node[i];
		if (tree.children[q].length) { // internal
			var j, n = 0, w = 0;
			for (j = 0; j < tree.children[q].length; ++j) {
				n += tip_numbers[tree.children[q][j]];
				w += weights[tree.children[q][j]];
			}
			tip_numbers[q] = n; weights[q] = w;
		}
	}
	// swap children
	for (i = 0; i < node.length; ++i)
		if (tree.children[node[i]].length >= 2)
			tree.children[node[i]].sort(sort_weight);
    //console.log("node",node)
   // console.log("weight",weights)
}



export {kn_expand_node,kn_reorder,kn_parse,kn_calxy}