const copDisease = require('./cop_disease.json');
const copPhenotype = require('./cop_phenotype.json');
const repurposingByGene = require('./repurposing_by_gene.json');
const wf1mod1WithGene = require('./wf1mod1_with_gene.json');
const wf1mod1WithProcess = require('./wf1mod1_with_process.json');
const wf1mod1 = require('./wf1mod1.json');
const wf1mod2Direct = require('./wf1mod2_direct.json');
const wf1mod2Expanded = require('./wf1mod2_expanded.json');
const wf1mod3V2 = require('./wf1mod3_v2.json');
const wf1mod3 = require('./wf1mod3.json');
const wf4 = require('./wf4.json');
const wf5 = require('./wf5.json');

const questionTemplates = [
  copDisease,
  copPhenotype,
  repurposingByGene,
  wf1mod1WithGene,
  wf1mod1WithProcess,
  wf1mod1,
  wf1mod2Direct,
  wf1mod2Expanded,
  wf1mod3V2,
  wf1mod3,
  wf4,
  wf5,
];

export default questionTemplates;
