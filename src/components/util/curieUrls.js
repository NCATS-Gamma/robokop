export default function curieUrls(id) {
  const onto = id.substr(0, id.indexOf(':'));
  // const entry = id.substr(id.indexOf(':') + 1);
  const urls = [];
  if (onto.toLowerCase() === 'db') {
    // drug bank - https://www.drugbank.ca/drugs/DB00619
    urls.push({ label: 'Drug Bank', url: `https://www.drugbank.ca/drugs/${id.replace(':', '')}`, iconUrl: 'https://www.drugbank.ca/favicons/favicon-16x16.png' });
  } else if (onto.toLowerCase() === 'hgnc') {
    // HGNC - https://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=HGNC:8856
    urls.push({ label: 'HGNC', url: `https://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=${id}`, iconUrl: 'https://www.genenames.org/sites/genenames.org/files/genenames_favicon_0.ico' });
  } else {
    // http://purl.obolibrary.org/obo/MONDO_0022308
    const ontobeeUrl = `http://purl.obolibrary.org/obo/${id.replace(':', '_')}`;
    urls.push({ label: 'Ontobee', url: ontobeeUrl, iconUrl: 'http://berkeleybop.org/favicon.ico' });

    // https://www.ebi.ac.uk/ols/ontologies/mondo/terms?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FMONDO_0022308
    urls.push({ label: 'EMBL-EBI', url: `https://www.ebi.ac.uk/ols/ontologies/${onto.toLowerCase()}/terms?iri=${encodeURIComponent(ontobeeUrl)}`, iconUrl: 'https://ebi.emblstatic.net/web_guidelines/EBI-Framework/v1.3/images/logos/EMBL-EBI/favicons/favicon-32x32.png' });
  }
  urls.push({ label: 'N2T', url: `http://n2t.net/${id}`, iconUrl: 'http://n2t.net/e/images/favicon.ico?v=2' });

  return urls;
}
