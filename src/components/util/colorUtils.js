// -- colors --
// #fbb4ae - Red
// #b3cde3 - Blue
// #ccebc5 - Green
// #decbe4 - Purple
// #fed9a6 - Orange
// #ffffcc - Yellow
// #e5d8bd - Brown
// #fddaec - Pink
// #f2f2f2 - Silver
// #b3de69 - Darker green
const undefinedColor = '#cccccc';

const conceptColorMap = {
  anatomical_entity: '#e5d8bd', // Brown
  biological_process: '#b3cde3', // Blue
  biological_process_or_activity: '#b3cde3', // same as biological_process
  gene: '#ccebc5', // Green
  genetic_condition: '#ffffcc', // Yellow
  cell: '#fddaec', // Pink
  chemical_substance: '#b3de69', // Blue
  disease: '#fbb4ae', // Red
  molecular_function: '#fed9a6', // Orange
  pathway: '#decbe4', // Purple
  phenotypic_feature: '#00c4e6', // Light teal'
  extra: '#f2f2f2', // Silver, extra?
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
