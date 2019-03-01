// Check out https://html-color.codes to pick new colors
// This is hard to have this many contrasting colors that are within families leave text readable.
// This should be periodically updated as new node types are introduced to give them consistent colors
const undefinedColor = '#cccccc';

const conceptColorMap = {
  anatomical_entity: '#e5d8bd', // Brown
  biological_entity: '#c1a25a', // Darker Brown
  biological_process: '#b3cde3', // Blue
  biological_process_or_activity: '#b3cde3', // same as biological_process
  cell: '#fddaec', // Pink
  cellular_component: '#ead6e0', // Gray-Pink
  chemical_substance: '#8787ff', // Blue
  disease: '#fbb4ae', // Red
  disease_or_phenotypic_feature: '#fbb4ae', // Red, same as disease
  drug: '#8787ff', // Purply blue, same as chemical_substance
  gene: '#ccebc5', // Green
  gene_family: '#68c357', // Darker Green
  genetic_condition: '#ffffcc', // Yellow
  gross_anatomical_structure: '#f1ebe0', // Lighter brown to go with anatomical_entity
  molecular_function: '#fed9a6', // Orange
  molecular_entity: '#a6a6d9', // Gray Purple
  molecular_activity: '#bae2d1', // Green Cyan
  metabolite: '#cad2b2', // Yellow Green
  pathway: '#decbe4', // Purple
  phenotypic_feature: '#f56657', // Darker red, to go with disease
  sequence_variant: '#00c4e6', // Light teal'
};

export default function getNodeTypeColorMap(types) {
  return (type) => {
    let color = undefinedColor;

    if ((type in conceptColorMap) && (types && Array.isArray(types) && (types.indexOf(type) >= 0))) {
      color = conceptColorMap[type];
    }
    return color;
  };
}
