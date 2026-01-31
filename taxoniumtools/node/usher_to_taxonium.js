const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const protobuf = require('protobufjs');
const cliProgress = require('cli-progress');
const { kn_parse } = require('./jstree');

// simple parser for GenBank file returning sequence and CDS gene coordinates
function parseGenbank(gbPath) {
  if (!gbPath) return null;
  const text = fs.readFileSync(gbPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const genes = {};
  let seq = '';
  let inOrigin = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('ORIGIN')) { inOrigin = true; continue; }
    if (inOrigin) {
      if (line.startsWith('//')) break;
      seq += line.replace(/\s|\d/g, '');
      continue;
    }
    const m = line.match(/^\s+CDS\s+(\d+)\.\.(\d+)/);
    if (m) {
      const start = parseInt(m[1]) - 1; // convert to 0-indexed start
      const end = parseInt(m[2]);       // end already points to the next base
      let j = i + 1;
      let gene = '';
      while (j < lines.length && lines[j].startsWith('                     ')) {
        const g = lines[j].match(/\/gene="([^"]+)"/);
        if (g) { gene = g[1]; break; }
        j++;
      }
      if (gene) genes[gene] = { name: gene, strand: 1, start, end };
    }
  }
  return { seq: seq.toUpperCase(), genes };
}

function newNode() {
  return { parent:null, child:[], name:'', meta:'', d:-1.0, hl:false, hidden:false };
}

function loadMetadata(metaPath, columns) {
  if (!metaPath) return [{}, []];
  let data;
  if (metaPath.endsWith('.gz')) {
    const buf = fs.readFileSync(metaPath);
    data = zlib.gunzipSync(buf).toString();
  } else {
    data = fs.readFileSync(metaPath, 'utf8');
  }
  const lines = data.trim().split(/\r?\n/);
  const headers = lines[0].split(/\t|,/);
  const out = {};
  const keep = [];
  const colSet = columns ? new Set(columns.split(',')) : null;
  for (let j = 1; j < headers.length; j++) {
    if (!colSet || colSet.has(headers[j])) keep.push(j);
  }
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const parts = lines[i].split(/\t|,/);
    const key = parts[0];
    const obj = {};
    keep.forEach(j => { obj['meta_' + headers[j]] = parts[j] || ''; });
    out[key] = obj;
  }
  return [out, keep.map(j => 'meta_' + headers[j])];
}

function assignNumTips(node) {
  if (node.child.length === 0) {
    node.num_tips = 1;
  } else {
    node.num_tips = 0;
    node.child.forEach(c => {
      node.num_tips += assignNumTips(c);
    });
  }
  return node.num_tips;
}

function expandCondensedNodes(root, condensed) {
  const nameToNode = new Map();
  preorder(root).forEach(n => { if(n.name) nameToNode.set(n.name, n); });
  condensed.forEach(cn => {
    const node = nameToNode.get(cn.nodeName);
    if(!node) return;
    const parent = node.parent;
    cn.condensedLeaves.forEach(lbl => {
      const n = newNode();
      n.name = lbl;
      n.parent = parent;
      n.child = [];
      n.edge_length = node.edge_length;
      n.mut_idx = node.mut_idx ? node.mut_idx.slice() : [];
      n.aa_idx = node.aa_idx ? node.aa_idx.slice() : [];
      if(parent) parent.child.push(n);
    });
    if(parent) parent.child = parent.child.filter(x => x !== node);
  });
}

function setXCoords(root) {
  function walk(n) {
    n.child.forEach(c => {
      c.x_dist = (n.x_dist || 0) + (c.edge_length || 0);
      walk(c);
    });
  }
  root.x_dist = 0;
  walk(root);
  const vals = [];
  const collect = n => { vals.push(n.x_dist); n.child.forEach(collect); };
  collect(root);
  vals.sort((a,b)=>a-b);
  const pct95 = vals[Math.floor(vals.length * 0.95)] || 1;
  const scale = 600 / pct95;
  const scaleNode = n => { n.x_dist = Math.round(n.x_dist * scale * 1e5) / 1e5; n.child.forEach(scaleNode); };
  scaleNode(root);
}

function setTerminalYCoords(root) {
  let i = 0;
  const leaves = [];
  const collect = n => { if (n.child.length === 0) leaves.push(n); else n.child.forEach(collect); };
  collect(root);
  leaves.forEach(n => { n.y = i++; });
}

function setInternalYCoords(root) {
  function post(n) {
    if (n.child.length > 0) {
      n.child.forEach(post);
      const ys = n.child.map(c => c.y);
      n.y = (Math.min(...ys) + Math.max(...ys)) / 2;
    }
  }
  post(root);
}

const NUC = ['A','C','G','T'];
const NUC_WITH_X = ['A','C','G','T','X'];
const CODON_TABLE = {
  TTT:'F',TTC:'F',TTA:'L',TTG:'L',TCT:'S',TCC:'S',TCA:'S',TCG:'S',
  TAT:'Y',TAC:'Y',TAA:'*',TAG:'*',TGT:'C',TGC:'C',TGA:'*',TGG:'W',
  CTT:'L',CTC:'L',CTA:'L',CTG:'L',CCT:'P',CCC:'P',CCA:'P',CCG:'P',
  CAT:'H',CAC:'H',CAA:'Q',CAG:'Q',CGT:'R',CGC:'R',CGA:'R',CGG:'R',
  ATT:'I',ATC:'I',ATA:'I',ATG:'M',ACT:'T',ACC:'T',ACA:'T',ACG:'T',
  AAT:'N',AAC:'N',AAA:'K',AAG:'K',AGT:'S',AGC:'S',AGA:'R',AGG:'R',
  GTT:'V',GTC:'V',GTA:'V',GTG:'V',GCT:'A',GCC:'A',GCA:'A',GCG:'A',
  GAT:'D',GAC:'D',GAA:'E',GAG:'E',GGT:'G',GGC:'G',GGA:'G',GGG:'G'
};

function complement(seq) {
  const comp = {A:'T',T:'A',C:'G',G:'C'};
  return seq.split('').reverse().map(c=>comp[c]||c).join('');
}

function buildNucToCodon(genes) {
  const map = new Map();
  for (const g of Object.values(genes)) {
    let codon = 0;
    for (let pos = g.start; pos < g.end; pos += 3) {
      const obj = { gene: g.name, codon_number: codon, positions: {0:pos,1:pos+1,2:pos+2}, strand: g.strand };
      for (let k = 0; k < 3; k++) {
        if(!map.has(pos+k)) map.set(pos+k, []);
        map.get(pos+k).push(obj);
      }
      codon++;
    }
  }
  return map;
}

function getAAMutations(past, newMuts, seq, nucMap, all, index, recordAll=false) {
  const out = [];
  const byCodon = new Map();
  newMuts.forEach(m => {
    const codons = nucMap.get(m.position - 1);
    if (codons) {
      codons.forEach(codon => {
        if (!byCodon.has(codon)) byCodon.set(codon, []);
        byCodon.get(codon).push(m);
      });
    }
  });
  const flip = {'A':0,'C':1,'G':2,'T':3};
  for (const [codon, muts] of byCodon.entries()) {
    const posArr = [seq[codon.positions[0]], seq[codon.positions[1]], seq[codon.positions[2]]];
    for (const [pos,val] of Object.entries(codon.positions)) {
      const p = parseInt(val);
      if (p in past) posArr[pos] = NUC[past[p]];
    }
    const finalArr = posArr.slice();
    const flipped = {};
    for (const [k,v] of Object.entries(codon.positions)) flipped[v] = parseInt(k);
    muts.forEach(m => { finalArr[flipped[m.position - 1]] = NUC[m.mut]; });
    let initial = posArr.join('');
    let fin = finalArr.join('');
    if (codon.strand === -1) {
      initial = complement(initial);
      fin = complement(fin);
    }
    const ia = CODON_TABLE[initial] || 'X';
    const fa = CODON_TABLE[fin] || 'X';
    if (ia !== fa || recordAll) {
      const key = codon.gene + '|' + (codon.codon_number + 1) + '|' + ia + '|' + fa;
      let id = index.get(key);
      if (id === undefined) {
        id = all.length;
        index.set(key,id);
        all.push({gene:codon.gene,previous_residue:ia,residue_pos:codon.codon_number+1,new_residue:fa,mutation_id:id,nuc_for_codon:codon.positions[1],type:'aa'});
      }
      out.push(id);
    }
  }
  newMuts.forEach(m => { past[m.position - 1] = m.mut; });
  return out;
}

function collectMutations(nodeMutations) {
  const all = [];
  const index = new Map();
  const perNode = [];
  const perNodeObjs = [];
  const bar = new cliProgress.SingleBar({hideCursor:true}, cliProgress.Presets.shades_classic);
  bar.start(nodeMutations.length, 0);
  nodeMutations.forEach(list => {
    const idxs = [];
    const objs = [];
    if(list && list.mutation) {
      list.mutation.forEach(m => {
        const par = NUC[m.parNuc];
        m.mutNuc.forEach(n => {
          const key = m.position + '|' + par + '|' + NUC[n];
          let id = index.get(key);
          if(id === undefined) {
            id = all.length;
            index.set(key,id);
            all.push({gene:'nt',previous_residue:par,residue_pos:m.position,new_residue:NUC[n],mutation_id:id,type:'nt'});
          }
          idxs.push(id);
        });
        objs.push({position:m.position,par:m.parNuc,mut:m.mutNuc[0]});
      });
    }
    perNode.push(idxs);
    perNodeObjs.push(objs);
    bar.increment();
  });
  bar.stop();
  return {all, perNode, perNodeObjs};
}

function preorder(n, arr=[]) {
  arr.push(n);
  n.child.forEach(c => preorder(c, arr));
  return arr;
}

async function main() {
  if (process.argv.length < 6) {
    console.error('Usage: node usher_to_taxonium.js <input.pb(.gz)> <metadata.tsv> <genbank.gb> <output.jsonl(.gz)> [clade_types] [columns]');
    process.exit(1);
  }
  const input = process.argv[2];
  const metadataPath = process.argv[3];
  const genbankPath = process.argv[4];
  const outputPath = process.argv[5];
  const cladeTypes = process.argv[6] ? process.argv[6].split(',') : [];
  const columns = process.argv[7] || null;

  const protoPath = path.join(__dirname, 'parsimony.proto');
  const root = await protobuf.load(protoPath);
  const Data = root.lookupType('Parsimony.data');

  let buffer = fs.readFileSync(input);
  if (input.endsWith('.gz')) buffer = zlib.gunzipSync(buffer);
  const message = Data.decode(buffer);

  const tree = kn_parse(message.newick.replace(/\n/g,'').replace(/;\s*$/,''));
  const preorderNodes = preorder(tree.root);
  const idxMap = new Map(preorderNodes.map((n,i)=>[n,i]));

  const {all: allNucMuts, perNode: perNodeNucIdx, perNodeObjs} = collectMutations(message.nodeMutations);

  const gb = parseGenbank(genbankPath);
  const nucMap = gb ? buildNucToCodon(gb.genes) : null;
  let rootSeq = gb ? gb.seq.split('') : [];
  const allAa = [];
  const aaIndex = new Map();
  const perNodeAa = new Array(preorderNodes.length).fill(null).map(()=>[]);
  if (gb) {
    const past = {};
    // reconstruct root sequence
    function post(n){
      n.child.forEach(post);
      if(n!==tree.root){
        perNodeObjs[idxMap.get(n)].forEach(m=>{ past[m.position-1]=m.par; });
      }
    }
    post(tree.root);
    for(const [pos,val] of Object.entries(past)) rootSeq[pos]=NUC[val];

    const rootMuts = [];
    for(let i=0;i<rootSeq.length;i++) {
      const id = allNucMuts.length;
      allNucMuts.push({gene:'nt',previous_residue:'X',residue_pos:i+1,new_residue:rootSeq[i],mutation_id:id,type:'nt'});
      perNodeNucIdx[idxMap.get(tree.root)].push(id);
      rootMuts.push({position:i+1,par:4,mut:NUC.indexOf(rootSeq[i])});
    }
    const rootAA = getAAMutations({}, rootMuts, rootSeq, nucMap, allAa, aaIndex, true);
    tree.root.aa_idx = rootAA;
  }
  if (gb) {
    function walk(node,pastDict){
      const here = {...pastDict};
      const muts = perNodeObjs[idxMap.get(node)];
      const aa = getAAMutations(here,muts,rootSeq,nucMap,allAa,aaIndex);
      perNodeAa[idxMap.get(node)] = aa;
      node.aa_idx = aa;
      node.child.forEach(c=>walk(c,here));
    }
    walk(tree.root,{});
  }

  const prepBar = new cliProgress.SingleBar({hideCursor:true}, cliProgress.Presets.shades_classic);
  prepBar.start(preorderNodes.length, 0);
  preorderNodes.forEach((node,i) => {
    node.mut_idx = perNodeNucIdx[i].slice();
    node.edge_length = node.mut_idx.length;
    const meta = message.metadata[i];
    if(meta && cladeTypes.length>0) {
      node.clades = {};
      cladeTypes.forEach((t,j)=>{ node.clades[t] = meta.cladeAnnotations[j] || ''; });
    }
    prepBar.increment();
  });
  prepBar.stop();

  expandCondensedNodes(tree.root, message.condensedNodes);
  assignNumTips(tree.root);
  setXCoords(tree.root);
  setTerminalYCoords(tree.root);
  setInternalYCoords(tree.root);

  const [metadata, metaKeys] = loadMetadata(metadataPath, columns);

  const nodesSorted = preorder(tree.root).sort((a,b)=>a.y-b.y);
  const nodeToIndex = new Map(nodesSorted.map((n,i)=>[n,i]));

  const config = { num_tips: tree.root.num_tips, date_created: new Date().toISOString().slice(0,10) };
  if (gb) config.gene_details = gb.genes;
  const allMuts = allAa.concat(allNucMuts);
  const offset = allAa.length;
  const first = { version: 'dev', mutations: allMuts, total_nodes: nodesSorted.length, config };

  const outStream = outputPath.endsWith('.gz') ? zlib.createGzip() : fs.createWriteStream(outputPath);
  const fileStream = outputPath.endsWith('.gz') ? fs.createWriteStream(outputPath) : null;
  if(fileStream) outStream.pipe(fileStream);
  outStream.write(JSON.stringify(first)+'\n');
  const writeBar = new cliProgress.SingleBar({hideCursor:true}, cliProgress.Presets.shades_classic);
  writeBar.start(nodesSorted.length, 0);
  nodesSorted.forEach(n => {
    const obj = {
      name: n.name || '',
      x_dist: n.x_dist,
      y: n.y,
      mutations: (n.aa_idx||[]).concat(((n.mut_idx)||[]).map(x=>x+offset)),
      is_tip: n.child.length===0,
      parent_id: n.parent?nodeToIndex.get(n.parent):nodeToIndex.get(n),
      node_id: nodeToIndex.get(n),
      num_tips: n.num_tips
    };
    if(n.clades) obj.clades = n.clades;
    const meta = metadata[n.name];
    if (meta) Object.assign(obj, meta);
    else metaKeys.forEach(k => obj[k]='');
    outStream.write(JSON.stringify(obj)+'\n');
    writeBar.increment();
  });
  writeBar.stop();

  outStream.end();
  if(fileStream) fileStream.on('finish', () => console.log('Wrote', outputPath));
  else console.log('Wrote', outputPath);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
