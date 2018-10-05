const questions = [
  {
    question: 'What genetic conditions protect against ebola hemorrhagic fever?',
    machineQuestion: {
      nodes: [
        {
          id: 0,
          name: 'ebola hemorrhagic fever',
          type: 'disease',
          curie: 'CHEMBL:CHEMBL1201570',
        },
        {
          id: 1,
          type: 'gene',
        },
        {
          id: 2,
          type: 'genetic_condition',
        },
      ],
      edges: [
        {
          source_id: 0,
          target_id: 1,
        },
        {
          source_id: 1,
          target_id: 2,
        },
      ],
    },
  },
  {
    question: 'What is the COP for imatinib and asthma?',
    machineQuestion: {
      nodes: [
        {
          id: 0,
          name: 'imatinib',
          type: 'chemical_substance',
          curie: 'PUBCHEM:5291',
        },
        {
          id: 1,
          type: 'gene',
        },
        {
          id: 2,
          type: 'biological_process',
        },
        {
          id: 3,
          type: 'cell',
        },
        {
          id: 4,
          type: 'anatomical_entity',
        },
        {
          id: 5,
          type: 'phenotypic_feature',
        },
        {
          id: 6,
          name: 'asthma',
          type: 'disease',
          curie: 'CHEMBL:CHEMBL714',
        },
      ],
      edges: [
        {
          source_id: 0,
          target_id: 1,
        },
        {
          source_id: 1,
          target_id: 2,
        },
        {
          source_id: 2,
          target_id: 3,
        },
        {
          source_id: 3,
          target_id: 4,
        },
        {
          source_id: 4,
          target_id: 5,
        },
        {
          source_id: 5,
          target_id: 6,
        },
      ],
    },
  },
  {
    question: 'What genetic conditions protect against ebola hemorrhagic fever?',
    machineQuestion: {
      nodes: [
        {
          id: 0,
          name: 'ebola hemorrhagic fever',
          type: 'disease',
          curie: 'CHEMBL:CHEMBL1201570',
        },
        {
          id: 1,
          type: 'gene',
        },
        {
          id: 2,
          type: 'genetic_condition',
        },
      ],
      edges: [
        {
          source_id: 0,
          target_id: 1,
        },
        {
          source_id: 1,
          target_id: 2,
        },
      ],
    },
  },
];

export default questions;