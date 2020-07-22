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
  chemical_exposure: '#126180', // Blue Sapphire
  disease: '#fbb4ae', // Red
  disease_or_phenotypic_feature: '#fbb4ae', // Red, same as disease
  drug: '#8787ff', // Purply blue, same as chemical_substance
  protein: '#ccebc5', // Green like gene
  environmental_feature: '#8a9a5b', // Moss Green
  food: '#ffa343', // Neon Carrot
  gene: '#ccebc5', // Green
  gene_family: '#68c357', // Darker Green
  genetic_condition: '#ffffcc', // Yellow
  gross_anatomical_structure: '#f1ebe0', // Lighter brown to go with anatomical_entity
  life_stage: '#fe4164', // Neon Fuchsia
  molecular_function: '#fed9a6', // Orange
  molecular_entity: '#a6a6d9', // Gray Purple
  molecular_activity: '#bae2d1', // Green Cyan
  metabolite: '#cad2b2', // Yellow Green
  organism_taxon: '#00b7eb', // Cyan
  pathway: '#decbe4', // Purple
  phenotypic_feature: '#f56657', // Darker red, to go with disease
  population_of_individual_organisms: '#dde26a', // Bored Accent Green
  sequence_variant: '#00c4e6', // Light teal'
};

export default function getNodeTypeColorMap(types) {
  return (type) => {
    let color = undefinedColor;

    if (type in conceptColorMap) {
      color = conceptColorMap[type];
    } else if (types && Array.isArray(types) && (types.indexOf(type) >= 0)) {
      // We are supposed to have a color for this.
      // console.log('No color is known for: ', type);
    }

    return color;
  };
}
