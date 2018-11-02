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
    natural_question: 'What genes are related to Fanconi Anemia?',
    machine_question: {
      nodes: [
        {
          id: 0,
          type: 'gene',
        },
        {
          id: 1,
          name: 'Fanconi Anemia',
          type: 'disease',
          curie: 'MONDO:0019391',
        },
      ],
      edges: [
        {
          source_id: 0,
          target_id: 1,
        },
      ],
    },
  },
  {
    natural_question: 'What chemicals counteract toxicants worsening diabetes?',
    machine_question: {
      nodes: [
        {
          id: 0,
          type: 'disease',
          curie: 'MONDO:0005148'
        },
        {
          id: 1,
          type: 'chemical_substance',
        },
        {
          id: 2,
          type: 'gene',
        },
        {
          id: 3,
          type: 'chemical_substance',
        },
      ],
      edges: [
        {
          source_id: 1,
          target_id: 0,
          type: 'contributes_to'
        },
        {
          source_id: 2,
          target_id: 1,
          type: ['increases_degradation_of',
                 'decreases_abundance_of',
                 'decreases_response_to']
        },
        {
          source_id: 3,
          target_id: 2,
          type: ['increases_activity_of',
                 'increases_expression_of',
                 'decreases_degradation_of',
                 'increases_stability_of',
                 'increases_synthesis_of',
                 'increases_secretion_of' ]
        },
      ],
    },
  },
  {
    natural_question: 'Find chemicals that may affect multiple specific processes'
    machine_question: {
      'nodes': [
        {
            'id': 0,
            'type': 'gene'
        },
        {
            'name' : ' voltage-gated sodium channel activity'
            'curie': 'GO:0005248',
            'id': 1,
            'type': 'biological_process_or_activity'
        },
        {
            'name': 'muscle contraction'
            'curie': 'GO:0006936',
            'id': 2,
            'type': 'biological_process_or_activity'
        },
        {
            'name' : 'neuronal action potential'
            'curie': 'GO:0019228',
            'id': 3,
            'type': 'biological_process_or_activity'
        },
        {
            'id': 4,
            'type': 'chemical_substance'
        }
      ]
      'edges':
      [
        {'source_id': 0, 'target_id': 1},
        {'source_id': 0, 'target_id': 2},
        {'source_id': 0, 'target_id': 3},
        {'source_id': 0, 'target_id': 4}
      ],
    },
  },
  {
    natural_question: 'Find dual-acting COPD treatments',
    machine_question: {
      nodes: [
        {
          id: 0,
          type: 'disease',
          name: 'chronic obstructive pulmonary disorder'
          curie: 'MONDO:0005002'
        },
        {
          id: 1,
          type: 'gene',
        },
        {
          id: 2,
          type: 'gene',
        },
        {
          id: 3,
          type: 'chemical_substance',
        },
      ],
      edges: [
        {
          source_id: 1,
          target_id: 0,
        },
        {
          source_id: 2,
          target_id: 0,
        },
        {
          source_id: 3,
          target_id: 1,
          type: 'interacts_with'
        },
        {
          source_id: 3,
          target_id: 2,
          type: 'interacts_with'
        },
        {
          source_id: 3,
          target_id: 0,
          type: 'treats'
        }
      ],
    },
  },
];

export default questions;
