"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function BuildPage() {
  // Mode selection: 'genbank' or 'no_genbank'
  const [mode, setMode] = useState<string | null>(null);

  // Advanced mode for no_genbank (when disabled, only show FASTA sequences)
  const [advancedMode, setAdvancedMode] = useState(false);

  // Search and selection state (GenBank mode)
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [taxonomyResults, setTaxonomyResults] = useState<any[]>([]);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<any>(null);

  const [refseqResults, setRefseqResults] = useState<any[]>([]);
  const [selectedRefseq, setSelectedRefseq] = useState<any>(null);
  const [assemblyId, setAssemblyId] = useState('');

  const [nextcladeDatasets, setNextcladeDatasets] = useState<any[]>([]);
  const [selectedNextclade, setSelectedNextclade] = useState<any>(null);

  // Reference file uploads (for no_genbank mode)
  const [refFastaFile, setRefFastaFile] = useState<File | null>(null);
  const [refGbffFile, setRefGbffFile] = useState<File | null>(null);
  const [refFastaText, setRefFastaText] = useState('');
  const [refGbffText, setRefGbffText] = useState('');
  const [refFastaInputMethod, setRefFastaInputMethod] = useState('file');
  const [refGbffInputMethod, setRefGbffInputMethod] = useState('file');
  const [manualTaxonomyId, setManualTaxonomyId] = useState('');
  const [manualSpeciesName, setManualSpeciesName] = useState('');

  // FASTA upload state (sequences to place)
  const [fastaText, setFastaText] = useState('');
  const [fastaFile, setFastaFile] = useState<File | null>(null);
  const [fastaInputMethod, setFastaInputMethod] = useState('text');

  // Metadata upload state
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [metadataDateColumn, setMetadataDateColumn] = useState('');

  // Starting tree (protobuf) upload state
  const [startingTreeFile, setStartingTreeFile] = useState<File | null>(null);
  const [startingTreeUrl, setStartingTreeUrl] = useState('');
  const [startingTreeInputMethod, setStartingTreeInputMethod] = useState('file');

  // Configuration parameters
  const [minLengthProportion, setMinLengthProportion] = useState('0.8');
  const [maxNProportion, setMaxNProportion] = useState('0.25');
  const [maxParsimony, setMaxParsimony] = useState('1000');
  const [maxBranchLength, setMaxBranchLength] = useState('10000');
  const workdir = '/data/viral_usher_data';

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingRefSeqs, setLoadingRefSeqs] = useState(false);
  const [loadingAssembly, setLoadingAssembly] = useState(false);
  const [error, setError] = useState('');
  const [jobLogs, setJobLogs] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [formCollapsed, setFormCollapsed] = useState(false);

  // API base URL from environment variable, fallback to production
  const API_BASE = process.env.NEXT_PUBLIC_VIRAL_USHER_API || 'https://viral-usher-test.api.taxonium.org';

  // Search for species (GenBank mode)
  const searchSpecies = async () => {
    if (!speciesSearch.trim()) return;

    setSelectedTaxonomy(null);
    setRefseqResults([]);
    setSelectedRefseq(null);
    setAssemblyId('');
    setNextcladeDatasets([]);
    setSelectedNextclade(null);
    setTaxonomyResults([]);

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/search-species`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: speciesSearch })
      });

      if (!response.ok) throw new Error('Failed to search species');

      const data = await response.json();
      setTaxonomyResults(data);

      if (data.length === 0) {
        setError('No matches found. Try a different search term.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Select taxonomy and fetch RefSeqs (GenBank mode)
  const selectTaxonomy = async (taxonomy: any) => {
    setSelectedTaxonomy(taxonomy);
    setLoadingRefSeqs(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/refseqs/${taxonomy.tax_id}`);
      if (!response.ok) throw new Error('Failed to fetch RefSeqs');

      const data = await response.json();
      setRefseqResults(data);

      if (data.length === 0) {
        setError('No RefSeqs found for this taxonomy ID.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingRefSeqs(false);
    }
  };

  // Select RefSeq and fetch assembly (GenBank mode)
  const selectRefseq = async (refseq: any) => {
    setSelectedRefseq(refseq);
    setLoadingAssembly(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/assembly/${refseq.accession}`);
      if (!response.ok) throw new Error('Failed to fetch assembly ID');

      const data = await response.json();
      setAssemblyId(data.assembly_id);

      await searchNextclade();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAssembly(false);
    }
  };

  // Search Nextclade datasets
  const searchNextclade = async (speciesNameOverride: string | null = null) => {
    const speciesName = speciesNameOverride || (mode === 'genbank' ? selectedTaxonomy?.sci_name : manualSpeciesName);
    if (!speciesName) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/nextclade-datasets?species=${encodeURIComponent(speciesName)}`
      );
      if (!response.ok) throw new Error('Failed to fetch Nextclade datasets');

      const data = await response.json();
      setNextcladeDatasets(data);
    } catch (err) {
      console.error('Nextclade search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load example data
  const loadExampleData = () => {
    setManualTaxonomyId('12345');
    setManualSpeciesName('Test virus');

    setRefFastaText(`>reference
GACAACTCAACCACAAGGTAAGTGCAAATGAACTTATAACAGTATAATCGTGCTAGTGGA
TCCCAAAATTCCACGTGGTGATATGGTCCTATAGCGTACGCCTAGTAGACTTGGGTGAAT
GACACGCCGATACTAAGTGGGAATAGTCCGTAGCTCCCTGTGGCCAGTGAGGCTGCGTAG
GGGCGGCTTCCGGAATAGCGTACGCGCCTTTGGGTCCACTCGACAGCTTGAGGCATAGGG`);
    setRefFastaInputMethod('text');

    setRefGbffText(`LOCUS       reference                240 bp    DNA     linear   VRL 10-OCT-2025
DEFINITION  Test reference sequence.
ACCESSION   reference
VERSION     reference
KEYWORDS    .
SOURCE      Test virus
  ORGANISM  Test virus
            Viruses.
FEATURES             Location/Qualifiers
     source          1..240
                     /organism="Test virus"
                     /mol_type="genomic DNA"
ORIGIN
        1 gacaactcaa ccacaaggta agtgcaaatg aacttataac agtataatcg tgctagtgga
       61 tcccaaaatt ccacgtggtg atatggtcct atagcgtacg cctagtagac ttgggtgaat
      121 gacacgccga tactaagtgg gaatagtccg tagctccctg tggccagtga ggctgcgtag
      181 gggcggcttc cggaatagcg tacgcgcctt tgggtccact cgacagcttg aggcataggg
//`);
    setRefGbffInputMethod('text');

    setFastaText(`>sequence_1
GAGAACTCAACCACAAGGTAAGTGCAAATGAACTTATAACAGTATAATCGTGCTAGTGGA
TCCCAAAATTCCACGTGGTGATATGGTCCTATAGCGTACGCCTAGTATACTTGGGTGAAT
GACACGCCGATACTAAGTGGGAATAGTCCGTAGCTCCCTGTGGCCAGTGAGGCTGCGTAG
GGGCGGCTTCCGGAATAGCGTCCGCGCCTTTGGGTCCACTCGACAGCTTGAGGCATAGGG
>sequence_2
GACAACTCAACCACAAGGTAAGTGCAAATGAACTAATAACAGTATAATCGTGCTAGTGGA
TCCCAAAATTCCACGTGGTGATATGGTCCTATAGCGTACGCCTAGTAGACTTGGGTGAAT
GACACGCCGATACTAAGTGTGAATAGTCCGTAGCTCCCGGTGGCCAGTGAGGCTGCGTAG
GGGCGGCTTCCGGAATAGCGTACGCGCCTTTGGTTCCACTCGACAGCTTGAGGCATCGGG
>sequence_3
GACAACTCAACCACAAGGTAAGTGCAAATGAACTTATAACAGTATAATCGTGCTAGTGGA
TCCCAAAATTCCACGTGGTGATATGGTCCTATAGCGTACGCCTAGTAGACTTGGGTGAAT
GACACGCCGATACTAAGTGGGAATAGTCCGTAGCTACCTGTTGCCAGTGATGCTGCGTAC
GGGCGGCTTCCGGAATAGCGTACGCGCCTTTGGGTCCACTCGACAGCTTGAGGCATAGGG`);
    setFastaInputMethod('text');

    searchNextclade('Test virus');
  };

  // Generate config
  const generateConfig = async () => {
    stopJobLogPolling();
    setJobLogs(null);

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      formData.append('no_genbank', mode === 'no_genbank' ? 'true' : 'false');

      if (mode === 'genbank') {
        formData.append('refseq_acc', selectedRefseq?.accession || '');
        formData.append('refseq_assembly', assemblyId);
        formData.append('species', selectedTaxonomy?.sci_name || '');
        formData.append('taxonomy_id', selectedTaxonomy?.tax_id || '');
      } else {
        formData.append('refseq_acc', '');
        formData.append('refseq_assembly', '');
        formData.append('species', manualSpeciesName);
        formData.append('taxonomy_id', manualTaxonomyId);

        if (refFastaInputMethod === 'file' && refFastaFile) {
          formData.append('ref_fasta_file', refFastaFile);
        } else if (refFastaInputMethod === 'text' && refFastaText) {
          formData.append('ref_fasta_text', refFastaText);
        }

        if (refGbffInputMethod === 'file' && refGbffFile) {
          formData.append('ref_gbff_file', refGbffFile);
        } else if (refGbffInputMethod === 'text' && refGbffText) {
          formData.append('ref_gbff_text', refGbffText);
        }
      }

      formData.append('nextclade_dataset', selectedNextclade?.path || '');
      formData.append('nextclade_clade_columns', selectedNextclade?.clade_columns || '');
      formData.append('min_length_proportion', minLengthProportion);
      formData.append('max_N_proportion', maxNProportion);
      formData.append('max_parsimony', maxParsimony);
      formData.append('max_branch_length', maxBranchLength);
      formData.append('workdir', workdir);

      if (fastaInputMethod === 'file' && fastaFile) {
        formData.append('fasta_file', fastaFile);
      } else if (fastaInputMethod === 'text' && fastaText) {
        formData.append('fasta_text', fastaText);
      }

      if (metadataFile) {
        formData.append('metadata_file', metadataFile);
      }
      if (metadataDateColumn) {
        formData.append('metadata_date_column', metadataDateColumn);
      }

      if (startingTreeInputMethod === 'file' && startingTreeFile) {
        formData.append('starting_tree_file', startingTreeFile);
      } else if (startingTreeInputMethod === 'url' && startingTreeUrl) {
        formData.append('starting_tree_url', startingTreeUrl);
      }

      const response = await fetch(`${API_BASE}/api/generate-config`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to launch analysis');

      const data = await response.json();

      if (data.job_info && data.job_info.success && data.job_info.job_name) {
        startJobLogPolling(data.job_info.job_name);
        setFormCollapsed(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch job logs
  const fetchJobLogs = async (jobName: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/job-logs/${jobName}`);
      if (!response.ok) return;

      const data = await response.json();
      setJobLogs(data);

      if (data.status === 'succeeded' || data.status === 'failed') {
        stopJobLogPolling();
      }
    } catch (err) {
      console.error('Failed to fetch job logs:', err);
    }
  };

  // Start polling for job logs
  const startJobLogPolling = (jobName: string) => {
    stopJobLogPolling();

    fetchJobLogs(jobName);

    const interval = setInterval(() => fetchJobLogs(jobName), 3000);
    setPollingInterval(interval);
  };

  // Stop polling
  const stopJobLogPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Auto-search for Nextclade datasets when required fields are filled (no_genbank mode)
  useEffect(() => {
    if (mode === 'no_genbank' && manualSpeciesName && nextcladeDatasets.length === 0) {
      searchNextclade(manualSpeciesName);
    }
  }, [mode, manualSpeciesName]);

  // Parse URL query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const modeParam = params.get('mode');
    if (modeParam === 'genbank' || modeParam === 'no_genbank') {
      setMode(modeParam);
    }

    const startingTreeUrl = params.get('startingTreeUrl');
    if (startingTreeUrl) {
      setStartingTreeUrl(startingTreeUrl);
      setStartingTreeInputMethod('url');
    }

    const taxonomyId = params.get('taxonomyId');
    if (taxonomyId) {
      setManualTaxonomyId(taxonomyId);
    }

    const speciesName = params.get('speciesName');
    if (speciesName) {
      setManualSpeciesName(speciesName);
    }

    const refFastaUrl = params.get('refFastaUrl');
    if (refFastaUrl) {
      fetch(refFastaUrl)
        .then(res => res.text())
        .then(text => {
          setRefFastaText(text);
          setRefFastaInputMethod('text');
        })
        .catch(err => console.error('Failed to fetch reference FASTA:', err));
    }

    const refGbffUrl = params.get('refGbffUrl');
    if (refGbffUrl) {
      fetch(refGbffUrl)
        .then(res => res.text())
        .then(text => {
          setRefGbffText(text);
          setRefGbffInputMethod('text');
        })
        .catch(err => console.error('Failed to fetch reference GenBank:', err));
    }

    const fastaUrl = params.get('fastaUrl');
    if (fastaUrl) {
      fetch(fastaUrl)
        .then(res => res.text())
        .then(text => {
          setFastaText(text);
          setFastaInputMethod('text');
        })
        .catch(err => console.error('Failed to fetch FASTA sequences:', err));
    }

    const minLength = params.get('minLengthProportion');
    if (minLength) setMinLengthProportion(minLength);

    const maxN = params.get('maxNProportion');
    if (maxN) setMaxNProportion(maxN);

    const maxPars = params.get('maxParsimony');
    if (maxPars) setMaxParsimony(maxPars);

    const maxBranch = params.get('maxBranchLength');
    if (maxBranch) setMaxBranchLength(maxBranch);

    const dateColumn = params.get('metadataDateColumn');
    if (dateColumn) setMetadataDateColumn(dateColumn);

    const metadataUrl = params.get('metadataUrl');
    if (metadataUrl) {
      fetch(metadataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'metadata.tsv.gz', { type: 'application/gzip' });
          setMetadataFile(file);
        })
        .catch(err => console.error('Failed to fetch metadata file:', err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="from-gray-500 to-gray-600 bg-gradient-to-bl shadow-md flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white hover:text-gray-200 transition">
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white text-xl font-medium">Build Tree</h1>
        </div>
        <a
          href="https://github.com/AngieHinrichs/viral_usher"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-gray-200 transition font-medium text-base flex items-center gap-2"
        >
          <span>Powered by</span>
          <span className="font-semibold">viral_usher</span>
          <div className="h-9 overflow-hidden bg-white rounded px-1 pt-1">
            <img
              src="https://github.com/yatisht/usher/raw/master/images/usher_logo.png"
              alt="UShER logo"
              className="h-10 w-auto object-cover object-top"
            />
          </div>
        </a>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-8">Build phylogenetic trees from viral sequence data using UShER. </p>

          {/* Edit Parameters Button (shown when form is collapsed) */}
          {formCollapsed && (
            <div className="mb-6">
              <button
                onClick={() => setFormCollapsed(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm"
              >
                Edit Parameters
              </button>
            </div>
          )}

          {/* Tree Building Form (collapsible) */}
          {!formCollapsed && (
            <>
              {/* Step 0: Mode Selection */}
              {!mode && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-300">Choose Mode</h2>
                  <p className="text-sm text-gray-600 mb-4">Select how you want to provide the reference genome:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setMode('genbank')}
                      className="p-6 border-2 border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition text-left"
                    >
                      <h3 className="text-base font-medium text-gray-900 mb-2">Search GenBank</h3>
                      <p className="text-sm text-gray-600">Search for a species in NCBI Taxonomy and select a RefSeq reference genome. All GenBank sequences will be downloaded automatically.</p>
                    </button>
                    <button
                      onClick={() => setMode('no_genbank')}
                      className="p-6 border-2 border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition text-left"
                    >
                      <h3 className="text-base font-medium text-gray-900 mb-2">Provide Reference Files</h3>
                      <p className="text-sm text-gray-600">Upload your own reference FASTA and GenBank files. Only your provided sequences will be placed on the tree (no GenBank download).</p>
                    </button>
                  </div>
                </div>
              )}

              {/* GenBank Mode Workflow */}
              {mode === 'genbank' && (
                <>
                  {/* Step 1: Species Search */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium text-gray-800 pb-2 border-b border-gray-300">1. Select Virus Species</h2>
                      <button onClick={() => setMode(null)} className="text-sm text-gray-600 hover:text-gray-800">Change Mode</button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search for your virus of interest:</label>
                        <input
                          type="text"
                          value={speciesSearch}
                          onChange={(e) => setSpeciesSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchSpecies()}
                          placeholder="e.g., Zika virus"
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                        />
                        <button
                          onClick={searchSpecies}
                          disabled={loading || !speciesSearch.trim()}
                          className="mt-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
                        >
                          {loading ? 'Searching...' : 'Search'}
                        </button>
                      </div>

                      {taxonomyResults.length > 0 && !selectedTaxonomy && !loadingRefSeqs && (
                        <div className="border border-gray-200 rounded max-h-64 overflow-y-auto">
                          {taxonomyResults.map((tax) => (
                            <div
                              key={tax.tax_id}
                              onClick={() => selectTaxonomy(tax)}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition text-sm"
                            >
                              {tax.sci_name} <span className="text-gray-500">(Tax ID: {tax.tax_id})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {loadingRefSeqs && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
                          Loading RefSeq entries...
                        </div>
                      )}

                      {selectedTaxonomy && !loadingRefSeqs && (
                        <div className="bg-gray-50 border border-gray-300 rounded p-4 flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium">Selected:</span> {selectedTaxonomy.sci_name} <span className="text-gray-600">(Tax ID: {selectedTaxonomy.tax_id})</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTaxonomy(null);
                              setRefseqResults([]);
                              setSelectedRefseq(null);
                              setAssemblyId('');
                              setNextcladeDatasets([]);
                              setSelectedNextclade(null);
                            }}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: RefSeq Selection */}
                  {selectedTaxonomy && (
                    <div className="mb-8">
                      <h2 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-300">2. Select Reference Sequence</h2>
                      {refseqResults.length > 0 && !selectedRefseq && !loadingRefSeqs && (
                        <div className="border border-gray-200 rounded max-h-64 overflow-y-auto">
                          {refseqResults.map((refseq, idx) => (
                            <div
                              key={idx}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
                              onClick={() => selectRefseq(refseq)}
                            >
                              <strong className="text-gray-900 text-sm">{refseq.accession}</strong>: <span className="text-sm text-gray-700">{refseq.title}</span>
                              {refseq.strain && refseq.strain !== 'No strain' && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Strain: {refseq.strain}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {loadingAssembly && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
                          Loading assembly information...
                        </div>
                      )}
                      {selectedRefseq && !loadingAssembly && (
                        <div className="bg-gray-50 border border-gray-300 rounded p-4 flex items-center justify-between">
                          <div className="text-sm">
                            <div className="mb-1">
                              <strong className="text-gray-900">Selected RefSeq:</strong> {selectedRefseq.accession}
                            </div>
                            <div>
                              <strong className="text-gray-900">Assembly:</strong> {assemblyId}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRefseq(null);
                              setAssemblyId('');
                              setNextcladeDatasets([]);
                              setSelectedNextclade(null);
                            }}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Advanced mode toggle - only show if tree is provided */}
              {mode === 'no_genbank' && (startingTreeFile || startingTreeUrl) && (
                <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Configured Settings</h3>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div>
                          <span className="font-medium">Starting tree:</span>{' '}
                          <span className="text-gray-600">
                            {startingTreeFile ? startingTreeFile.name : startingTreeUrl}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!advancedMode && (
                      <button onClick={() => setMode(null)} className="text-sm text-gray-600 hover:text-gray-800">
                        Change Mode
                      </button>
                    )}
                  </div>
                  {!advancedMode && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setAdvancedMode(true)}
                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                      >
                        ...or if you want to customise reference files, taxonomy, and other options, click here
                      </button>
                    </div>
                  )}
                  {advancedMode && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setAdvancedMode(false)}
                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                      >
                        Hide advanced options
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No GenBank Mode Workflow - Reference Files */}
              {mode === 'no_genbank' && ((!startingTreeFile && !startingTreeUrl) || advancedMode) && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-800 pb-2 border-b border-gray-300">
                      1. Provide Reference Files
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={loadExampleData}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                      >
                        Load Example Data
                      </button>
                      <button onClick={() => setMode(null)} className="text-sm text-gray-600 hover:text-gray-800">Change Mode</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Taxonomy ID *
                        <div className="text-xs text-gray-500 font-normal mt-1">NCBI Taxonomy ID for your organism</div>
                      </label>
                      <input
                        type="text"
                        value={manualTaxonomyId}
                        onChange={(e) => setManualTaxonomyId(e.target.value)}
                        placeholder="e.g., 64320"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Species Name *
                        <div className="text-xs text-gray-500 font-normal mt-1">Scientific name of your organism</div>
                      </label>
                      <input
                        type="text"
                        value={manualSpeciesName}
                        onChange={(e) => setManualSpeciesName(e.target.value)}
                        placeholder="e.g., Zika virus"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference FASTA *
                        <div className="text-xs text-gray-500 font-normal mt-1">Reference genome in FASTA format</div>
                      </label>
                      <div className="flex gap-4 mb-2">
                        <button
                          onClick={() => setRefFastaInputMethod('file')}
                          className={`px-3 py-1.5 rounded transition text-sm ${
                            refFastaInputMethod === 'file'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          onClick={() => setRefFastaInputMethod('text')}
                          className={`px-3 py-1.5 rounded transition text-sm ${
                            refFastaInputMethod === 'text'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Paste Text
                        </button>
                      </div>
                      {refFastaInputMethod === 'file' ? (
                        <>
                          <input
                            type="file"
                            accept=".fasta,.fa,.fna"
                            onChange={(e) => setRefFastaFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition text-sm"
                          />
                          {refFastaFile && (
                            <div className="mt-2 text-xs text-gray-600">
                              Selected: {refFastaFile.name}
                            </div>
                          )}
                        </>
                      ) : (
                        <textarea
                          value={refFastaText}
                          onChange={(e) => setRefFastaText(e.target.value)}
                          rows={6}
                          placeholder=">reference&#10;ATCGATCG..."
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition font-mono text-xs"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference GenBank (gbff) *
                        <div className="text-xs text-gray-500 font-normal mt-1">Reference genome annotations in GenBank format</div>
                      </label>
                      <div className="flex gap-4 mb-2">
                        <button
                          onClick={() => setRefGbffInputMethod('file')}
                          className={`px-3 py-1.5 rounded transition text-sm ${
                            refGbffInputMethod === 'file'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          onClick={() => setRefGbffInputMethod('text')}
                          className={`px-3 py-1.5 rounded transition text-sm ${
                            refGbffInputMethod === 'text'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Paste Text
                        </button>
                      </div>
                      {refGbffInputMethod === 'file' ? (
                        <>
                          <input
                            type="file"
                            accept=".gbff,.gbk,.gb"
                            onChange={(e) => setRefGbffFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition text-sm"
                          />
                          {refGbffFile && (
                            <div className="mt-2 text-xs text-gray-600">
                              Selected: {refGbffFile.name}
                            </div>
                          )}
                        </>
                      ) : (
                        <textarea
                          value={refGbffText}
                          onChange={(e) => setRefGbffText(e.target.value)}
                          rows={8}
                          placeholder="LOCUS..."
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition font-mono text-xs"
                        />
                      )}
                    </div>
                    {manualTaxonomyId && manualSpeciesName &&
                     ((refFastaInputMethod === 'file' && refFastaFile) || (refFastaInputMethod === 'text' && refFastaText)) &&
                     ((refGbffInputMethod === 'file' && refGbffFile) || (refGbffInputMethod === 'text' && refGbffText)) && (
                      <div className="bg-green-50 border border-green-300 rounded p-4 mt-4">
                        <span className="font-medium text-green-800 text-sm">Ready to proceed!</span> <span className="text-sm text-gray-700">All required files provided. Scroll down to configure additional options and launch the analysis.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nextclade Dataset Selection (both modes) */}
              {mode && (mode === 'genbank' || (mode === 'no_genbank' && ((!startingTreeFile && !startingTreeUrl) || advancedMode))) && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    {mode === 'genbank' ? '3' : '2'}. Nextclade Dataset (Optional)
                  </h2>
                  {nextcladeDatasets.length > 0 ? (
                    <>
                      <div className="border border-gray-200 rounded max-h-64 overflow-y-auto">
                        {nextcladeDatasets.map((dataset, idx) => (
                          <div
                            key={idx}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition ${
                              selectedNextclade?.path === dataset.path
                                ? 'bg-gray-50 border-l-4 border-l-gray-500'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedNextclade(dataset)}
                          >
                            <strong className="text-gray-900 text-sm">{dataset.path}</strong>
                            <br />
                            <span className="text-xs text-gray-600">{dataset.name}</span>
                          </div>
                        ))}
                      </div>
                      {selectedNextclade && (
                        <div className="bg-gray-50 border border-gray-300 rounded p-4 mt-4">
                          <strong className="text-gray-900 text-sm">Selected:</strong> <span className="text-sm text-gray-700">{selectedNextclade.path}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 italic">No Nextclade datasets found for this species.</p>
                  )}
                </div>
              )}

              {/* Starting Tree Upload (both modes, optional) */}
              {mode && (mode === 'genbank' || (mode === 'no_genbank' && ((!startingTreeFile && !startingTreeUrl) || advancedMode))) && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    {mode === 'genbank' ? '' : '3. '}Starting Tree - Update Mode (Optional)
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Provide an existing UShER protobuf tree (.pb.gz) to update with new sequences instead of building from scratch.
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => setStartingTreeInputMethod('file')}
                        className={`px-3 py-1.5 rounded transition text-sm ${
                          startingTreeInputMethod === 'file'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        onClick={() => setStartingTreeInputMethod('url')}
                        className={`px-3 py-1.5 rounded transition text-sm ${
                          startingTreeInputMethod === 'url'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Provide URL
                      </button>
                    </div>

                    {startingTreeInputMethod === 'file' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Protobuf File
                          <div className="text-xs text-gray-500 font-normal mt-1">UShER protobuf tree file (optimized.pb.gz or similar)</div>
                        </label>
                        <input
                          type="file"
                          accept=".pb.gz,.pb"
                          onChange={(e) => setStartingTreeFile(e.target.files?.[0] || null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition text-sm"
                        />
                        {startingTreeFile && (
                          <div className="mt-2 text-xs text-gray-600">
                            Selected: {startingTreeFile.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Protobuf URL
                          <div className="text-xs text-gray-500 font-normal mt-1">URL to an existing UShER protobuf tree file</div>
                        </label>
                        <input
                          type="url"
                          value={startingTreeUrl}
                          onChange={(e) => setStartingTreeUrl(e.target.value)}
                          placeholder="https://example.com/tree.pb.gz"
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FASTA Sequences to Place (both modes) */}
              {mode && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    {mode === 'genbank' ? '4' :
                     (mode === 'no_genbank' && (startingTreeFile || startingTreeUrl) && !advancedMode ? '1' : '4')}. FASTA Sequences {mode === 'no_genbank' ? '(Required)' : '(Optional)'}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {mode === 'no_genbank'
                      ? 'Provide the sequences you want to place on the tree.'
                      : 'Optionally provide additional sequences to place on the tree.'}
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => setFastaInputMethod('text')}
                        className={`px-3 py-1.5 rounded transition text-sm ${
                          fastaInputMethod === 'text'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Paste Text
                      </button>
                      <button
                        onClick={() => setFastaInputMethod('file')}
                        className={`px-3 py-1.5 rounded transition text-sm ${
                          fastaInputMethod === 'file'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Upload File
                      </button>
                    </div>

                    {fastaInputMethod === 'text' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste FASTA sequences
                          <div className="text-xs text-gray-500 font-normal mt-1">Paste your FASTA formatted sequences here</div>
                        </label>
                        <textarea
                          value={fastaText}
                          onChange={(e) => setFastaText(e.target.value)}
                          rows={8}
                          placeholder=">sequence1&#10;ATCGATCG..."
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition font-mono text-xs"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload FASTA file
                          <div className="text-xs text-gray-500 font-normal mt-1">Select a FASTA file from your computer</div>
                        </label>
                        <input
                          type="file"
                          accept=".fasta,.fa,.fna,.txt"
                          onChange={(e) => setFastaFile(e.target.files?.[0] || null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition text-sm"
                        />
                        {fastaFile && (
                          <div className="mt-2 text-xs text-gray-600">
                            Selected: {fastaFile.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Metadata Upload (both modes) */}
              {mode && (mode === 'genbank' || (mode === 'no_genbank' && ((!startingTreeFile && !startingTreeUrl) || advancedMode))) && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    {mode === 'genbank' ? '5' : '5'}. Custom Metadata (Optional)
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a TSV file with custom metadata for your sequences. First column should be sequence names matching your FASTA.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Metadata TSV File
                        <div className="text-xs text-gray-500 font-normal mt-1">Tab-separated values file</div>
                      </label>
                      <input
                        type="file"
                        accept=".tsv,.txt"
                        onChange={(e) => setMetadataFile(e.target.files?.[0] || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition text-sm"
                      />
                      {metadataFile && (
                        <div className="mt-2 text-xs text-gray-600">
                          Selected: {metadataFile.name}
                        </div>
                      )}
                    </div>
                    {metadataFile && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Column Name (Optional)
                          <div className="text-xs text-gray-500 font-normal mt-1">Name of the column containing dates (if any)</div>
                        </label>
                        <input
                          type="text"
                          value={metadataDateColumn}
                          onChange={(e) => setMetadataDateColumn(e.target.value)}
                          placeholder="e.g., collection_date"
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tree Building Parameters (both modes) */}
              {mode && (mode === 'genbank' || (mode === 'no_genbank' && ((!startingTreeFile && !startingTreeUrl) || advancedMode))) && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    {mode === 'genbank' ? '6' : '6'}. Tree Building & Filtering Parameters
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Length Proportion
                        <div className="text-xs text-gray-500 font-normal mt-1">Filter sequences by minimum length (0-1)</div>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={minLengthProportion}
                        onChange={(e) => setMinLengthProportion(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum N Proportion
                        <div className="text-xs text-gray-500 font-normal mt-1">Maximum proportion of ambiguous bases (0-1)</div>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={maxNProportion}
                        onChange={(e) => setMaxNProportion(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Parsimony
                        <div className="text-xs text-gray-500 font-normal mt-1">Maximum private substitutions allowed</div>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={maxParsimony}
                        onChange={(e) => setMaxParsimony(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Branch Length
                        <div className="text-xs text-gray-500 font-normal mt-1">Maximum substitutions per branch</div>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={maxBranchLength}
                        onChange={(e) => setMaxBranchLength(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Launch Button */}
              {mode && (
                <button
                  onClick={generateConfig}
                  disabled={loading || (mode === 'no_genbank' && (!fastaFile && !fastaText))}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
                >
                  {loading ? 'Launching...' : 'Launch Analysis'}
                </button>
              )}
            </>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-300 rounded p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {jobLogs && (
            <div className="mt-6 bg-gray-50 border border-gray-300 rounded p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                Job Status:
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  jobLogs.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                  jobLogs.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {jobLogs.status}
                </span>
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Job Name: <code className="text-gray-800">{jobLogs.job_name}</code></p>
                  {jobLogs.pod_name && <p className="text-xs text-gray-600">Pod: <code className="text-gray-800">{jobLogs.pod_name}</code></p>}
                </div>

                {jobLogs.logs && typeof jobLogs.logs === 'object' && (
                  <>
                    {jobLogs.logs.main && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 text-sm">Viral Usher Logs:</h4>
                        <pre className="bg-black text-green-400 p-4 rounded overflow-x-auto text-xs font-mono max-h-96">
{jobLogs.logs.main}
                        </pre>
                      </div>
                    )}
                  </>
                )}

                {jobLogs.status === 'running' && (
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <div className="w-3 h-3 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
                    Job is running... (auto-refreshing every 3 seconds)
                  </div>
                )}

                {/* S3 Results Section */}
                {jobLogs.s3_results && jobLogs.s3_results.files && jobLogs.s3_results.files.length > 0 && (
                  <div className="mt-6 bg-green-50 border border-green-300 rounded p-6">
                    <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Results Available for Download
                    </h4>
                    <p className="text-xs text-gray-600 mb-4">
                      {jobLogs.s3_results.upload_complete ? (
                        <>All {jobLogs.s3_results.total_files} output files are ready to download:</>
                      ) : (
                        <>{jobLogs.s3_results.total_files} file{jobLogs.s3_results.total_files !== 1 ? 's' : ''} uploaded so far (upload in progress)...</>
                      )}
                    </p>
                    <div className="bg-white rounded border border-gray-200 max-h-96 overflow-y-auto">
                      {[...jobLogs.s3_results.files].sort((a: any, b: any) => {
                        // Put tree.jsonl.gz first
                        if (a.filename.endsWith('tree.jsonl.gz')) return -1;
                        if (b.filename.endsWith('tree.jsonl.gz')) return 1;
                        return 0;
                      }).map((file: any, idx: number) => (
                        <div key={idx} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-gray-800 truncate" title={file.filename}>
                              {file.filename}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {file.is_taxonium && (() => {
                              const encodedUrl = encodeURIComponent(file.url);
                              const taxoniumUrl = `https://taxonium.org/?protoUrl=${encodedUrl}&xType=x_dist`;
                              return (
                                <a
                                  href={taxoniumUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-800 transition text-xs font-medium flex items-center gap-1.5"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View in Taxonium
                                </a>
                              );
                            })()}
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-xs font-medium flex items-center gap-1.5"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 flex items-center gap-2 text-gray-600 justify-center text-sm">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
