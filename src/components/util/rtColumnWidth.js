/**
 * Function to calculate sane column widths
 * @param {Array of objects} data Each object element in array corresponds to a row
 * @param {Function || String} accessor Accessor to access field value for the column
 * @param {String} headerText Header label for this column (used for max width calc)
 * @param {Function} accessorPostProcFn If provided, can post-process output of `accessor`
 *    on the data object of a row prior to width calc for the field. This is useful if
 *    a custom Cell renderer is used for a column and the accessorPostProcFn logic would
 *    mimic the custom Cell renderer logic closely to get identical length cell strings.
 */
export default function getColumnWidth(data, accessor, headerText, accessorPostProcFn = x => x) {
  if (typeof accessor === 'string' || accessor instanceof String) {
    accessor = d => d[accessor]; // eslint-disable-line no-param-reassign
  }
  const maxWidth = 600;
  const magicSpacing = 9;
  const cellLength = Math.max(
    ...data.map(row => (`${accessorPostProcFn(accessor(row))}` || '').length),
    headerText.length,
  ) + 4;
  return Math.min(maxWidth, cellLength * magicSpacing);
}
