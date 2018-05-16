export default function entityNameDisplay(str) {
  const out = str.replace('_', ' ');
  return out.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
