/**
 * Generates a timestamp string for file naming
 * Format: DDMMYYYYHHMMSS
 */
const generateTimestamp = () => {
  const d = new Date();
  const year = d.getFullYear();
  const date = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');
  
  return `${date}${month}${year}${hour}${minute}${second}`;
};

const a = {
  TIME: generateTimestamp()
};

export { a, generateTimestamp };
