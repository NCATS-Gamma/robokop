export default function ctdUrls(type, equalIds) {
  let id = '';
  let ctdType = '';
  if (type === 'chemical_substance') {
    id = equalIds.find(ei => ei.toUpperCase().includes('MESH'));
    if (id) {
      id = id.substr(id.indexOf(':') + 1);
    }
    ctdType = 'chem';
  } else if (type === 'disease') {
    id = equalIds.find(ei => ei.toUpperCase().includes('MESH') || ei.toUpperCase().includes('OMIM'));
    ctdType = 'disease';
  } else if (type === 'gene') {
    id = equalIds.find(ei => ei.toUpperCase().includes('NCBIGENE'));
    if (id) {
      id = id.substr(id.indexOf(':') + 1);
    }
    ctdType = 'gene';
  } else if (type === 'biological_process') {
    id = equalIds.find(ei => ei.toUpperCase().includes('GO'));
    ctdType = 'go';
  } else if (type === 'pathway') {
    id = equalIds.find(ei => ei.toUpperCase().includes('KEGG') || ei.toUpperCase().includes('REACT'));
    ctdType = 'pathway';
  }
  // const onto = id.substr(0, id.indexOf(':'));
  return { label: 'CTD', url: `http://ctdbase.org/detail.go?type=${ctdType}&acc=${id}`, iconUrl: 'http://ctdbase.org/images/ctdlogo_xs.v15420.png' };
}
