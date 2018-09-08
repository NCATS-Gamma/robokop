export default function entityNameDisplay(str) {
  const out = str.replace(/_/g, ' ');
  return out.replace(/(?!or\b)\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
