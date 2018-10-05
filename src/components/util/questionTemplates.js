const questions = [
  {
    natural_question: 'What genetic conditions protect against ebola hemorrhagic fever?',
    machine_question: {
      nodes: [
        {
          id: 0,
          name: 'ebola hemorrhagic fever',
          type: 'disease',
          curie: 'MONDO:0005737',
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
    natural_question: 'What is the COP for imatinib and asthma?',
    machine_question: {
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
          curie: 'MONDO:0004979',
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
    natural_question: 'What genes affect ebola hemorrhagic fever?',
    machine_question: {
      nodes: [
        {
          id: 0,
          type: 'gene',
        },
        {
          id: 1,
          name: 'Ebola hemorrhagic fever',
          type: 'disease',
          curie: 'MONDO:0005737',
        },
      ],
      edges: [
        {
          source_id: 0,
          target_id: 1,
          predicate: 'affects',
        },
      ],
    },
  },
];

export default questions;
