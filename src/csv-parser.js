// ─── CSV Parsing ────────────────────────────────────────────────────────────

function parseCSVLine(line, delimiter) {
  if (!delimiter) delimiter = ';';
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function joinMultiLineRecords(lines, startIndex) {
  const dataLines = [];
  let buffer = '';
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (buffer) {
      buffer += '\n' + line;
      if (i + 1 >= lines.length || /^\d+;/.test(lines[i + 1])) {
        dataLines.push(buffer);
        buffer = '';
      }
    } else if (/^\d+;/.test(line)) {
      if (i + 1 >= lines.length || /^\d+;/.test(lines[i + 1])) {
        dataLines.push(line);
      } else {
        buffer = line;
      }
    }
  }
  if (buffer) dataLines.push(buffer);
  return dataLines;
}

function buildRecord(line) {
  const f = parseCSVLine(line);
  return {
    id: parseInt(f[0]),
    age: parseInt(f[5]) || null,
    gender: (f[6] || '').trim(),
    relationship: (f[7] || '').trim(),
    frequency: (f[8] || '').trim(),
    hasTried: (f[9] || '').trim(),
    barriers: f[10] ? f[10].split(';').map(s => s.trim()).filter(s => s && s !== '-') : [],
    lookingFor: (f[11] || '').trim(),
    composition: f[12] ? f[12].split(';').map(s => s.trim()).filter(s => s && s !== '-') : [],
    whereSearch: f[13] ? f[13].split(';').map(s => s.trim()).filter(Boolean) : [],
    wouldUseApp: (f[14] || '').trim(),
    wouldPay: (f[15] || '').trim(),
    openText: (f[16] || '').trim()
  };
}

function filterValid(records) {
  return records.filter(r => r.age === null || (r.age >= 16 && r.age <= 100));
}

function parseCSVFile(raw) {
  const lines = raw.split('\n').filter(l => l.trim());
  // Header spans 2 lines (quoted field with line break)
  const dataLines = joinMultiLineRecords(lines, 2);
  const records = dataLines.map(buildRecord);
  return filterValid(records);
}

module.exports = { parseCSVLine, joinMultiLineRecords, buildRecord, filterValid, parseCSVFile };
