const questions = [
  {
    natural_question: 'What genetic conditions protect against ebola hemorrhagic fever?',
    machine_question: {
      nodes: [
        {
          id: 'node0',
          name: 'ebola hemorrhagic fever',
          type: 'disease',
          curie: 'MONDO:0005737',
        },
        {
          id: 'node1',
          type: 'gene',
        },
        {
          id: 'node2',
          type: 'genetic_condition',
        },
      ],
      edges: [
        {
          id: 'edge01',
          source_id: 'node0',
          target_id: 'node1',
        },
        {
          id: 'edge12',
          source_id: 'node1',
          target_id: 'node2',
        },
      ],
    },
  },
  {
    natural_question: 'What is the COP for imatinib and asthma?',
    machine_question: {
      nodes: [
        {
          id: 'node0',
          name: 'imatinib',
          type: 'chemical_substance',
          curie: 'PUBCHEM:5291',
        },
        {
          id: 'node1',
          type: 'gene',
        },
        {
          id: 'node2',
          type: 'biological_process',
          set: true,
        },
        {
          id: 'node3',
          type: 'cell',
        },
        {
          id: 'node4',
          type: 'anatomical_entity',
        },
        {
          id: 'node5',
          type: 'phenotypic_feature',
          set: true,
        },
        {
          id: 'node6',
          name: 'asthma',
          type: 'disease',
          curie: 'MONDO:0004979',
        },
      ],
      edges: [
        {
          id: 'edge01',
          source_id: 'node0',
          target_id: 'node1',
        },
        {
          id: 'edge12',
          source_id: 'node1',
          target_id: 'node2',
        },
        {
          id: 'edge23',
          source_id: 'node2',
          target_id: 'node3',
        },
        {
          id: 'edge34',
          source_id: 'node3',
          target_id: 'node4',
        },
        {
          id: 'edge45',
          source_id: 'node4',
          target_id: 'node5',
        },
        {
          id: 'edge56',
          source_id: 'node5',
          target_id: 'node6',
        },
      ],
    },
  },
  {
    natural_question: 'What genes are related to Fanconi Anemia?',
    machine_question: {
      nodes: [
        {
          id: 'node0',
          type: 'gene',
        },
        {
          id: 'node1',
          name: 'Fanconi Anemia',
          type: 'disease',
          curie: 'MONDO:0019391',
        },
      ],
      edges: [
        {
          id: 'edge01',
          source_id: 'node0',
          target_id: 'node1',
        },
      ],
    },
  },
  {
    natural_question: 'What chemicals counteract toxicants worsening diabetes?',
    machine_question: {
      nodes: [
        {
          id: 'node0',
          type: 'disease',
          curie: 'MONDO:0005148',
        },
        {
          id: 'node1',
          type: 'chemical_substance',
        },
        {
          id: 'node2',
          type: 'gene',
        },
        {
          id: 'node3',
          type: 'chemical_substance',
        },
      ],
      edges: [
        {
          id: 'edge10',
          source_id: 'node1',
          target_id: 'node0',
          type: 'contributes_to',
        },
        {
          id: 'edge21',
          source_id: 'node2',
          target_id: 'node1',
          type: [
            'increases_degradation_of',
            'decreases_abundance_of',
            'decreases_response_to',
          ],
        },
        {
          id: 'edge32',
          source_id: 'node3',
          target_id: 'node2',
          type: [
            'increases_activity_of',
            'increases_expression_of',
            'decreases_degradation_of',
            'increases_stability_of',
            'increases_synthesis_of',
            'increases_secretion_of',
          ],
        },
      ],
    },
  },
  {
    natural_question: 'Find chemicals that may affect multiple specific processes',
    machine_question: {
      nodes: [
        {
          id: 'node0',
          type: 'gene',
        },
        {
          name: ' voltage-gated sodium channel activity',
          curie: 'GO:0005248',
          id: 'node1',
          type: 'biological_process_or_activity',
        },
        {
          name: 'muscle contraction',
          curie: 'GO:0006936',
          id: 'node2',
          type: 'biological_process_or_activity',
        },
        {
          name: 'neuronal action potential',
          curie: 'GO:0019228',
          id: 'node3',
          type: 'biological_process_or_activity',
        },
        {
          id: 'node4',
          type: 'chemical_substance',
        },
      ],
      edges: [
        { id: 'edge01', source_id: 'node0', target_id: 'node1' },
        { id: 'edge02', source_id: 'node0', target_id: 'node2' },
        { id: 'edge03', source_id: 'node0', target_id: 'node3' },
        { id: 'edge04', source_id: 'node0', target_id: 'node4' },
      ],
    },
  },
  {
    natural_question: 'Find dual-acting COPD treatments',
    machine_question: {
      nodes: [
        {
          id: 'node0',
          type: 'disease',
          name: 'chronic obstructive pulmonary disorder',
          curie: 'MONDO:0005002',
        },
        {
          id: 'node1',
          type: 'gene',
        },
        {
          id: 'node2',
          type: 'gene',
        },
        {
          id: 'node3',
          type: 'chemical_substance',
        },
      ],
      edges: [
        {
          id: 'edge10',
          source_id: 'node1',
          target_id: 'node0',
        },
        {
          id: 'edge20',
          source_id: 'node2',
          target_id: 'node0',
        },
        {
          id: 'edge31',
          source_id: 'node3',
          target_id: 'node1',
          type: 'interacts_with',
        },
        {
          id: 'edge32',
          source_id: 'node3',
          target_id: 'node2',
          type: 'interacts_with',
        },
        {
          id: 'edge30',
          source_id: 'node3',
          target_id: 'node0',
          type: 'treats',
        },
      ],
    },
  },
];

export default questions;
