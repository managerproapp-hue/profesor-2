import { Student } from '../types';

declare var XLSX: any;

const HEADER_ALIASES: { [key: string]: string[] } = {
  nre: ['nre'],
  expediente: ['expediente', 'expedien'],
  apellido1: ['apellido1', 'primerapellido', 'apellido'],
  apellido2: ['apellido2', 'segundoapellido'],
  nombre: ['nombre'],
  grupo: ['grupo'],
  subgrupo: ['subgrupo', 'subgrup'],
  fechaNacimiento: ['fechadenacimiento', 'fechanacimiento', 'fecha de n'],
  telefono: ['telefono', 'teléfono', 'telefon'],
  emailPersonal: ['emailpe', 'emailpersonal', 'email p'],
  emailOficial: ['emailoficial', 'email oficial']
};

const normalizeHeader = (header: string): string => {
  return String(header).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
};

const findCanonicalHeader = (header: string): string | undefined => {
    const normalizedHeader = normalizeHeader(header);
    for (const canonical in HEADER_ALIASES) {
        for (const alias of HEADER_ALIASES[canonical]) {
            const normalizedAlias = normalizeHeader(alias);
            if (normalizedHeader.includes(normalizedAlias)) {
                return canonical;
            }
        }
    }
    return undefined;
};


export const parseFile = (file: File): Promise<{ data: Student[]; error: string | null }> => {
  return new Promise((resolve) => {
    const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const validExtensions = ['.xls', '.xlsx'];

    if (!validTypes.includes(file.type) && !validExtensions.some(ext => file.name.endsWith(ext))) {
      resolve({ data: [], error: 'Tipo de archivo inválido. Por favor, sube un archivo Excel (.xls o .xlsx).' });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ data: [], error: 'El archivo está vacío o no se pudo leer.' });
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (jsonData.length < 2) {
          resolve({ data: [], error: 'El archivo Excel debe contener una fila de cabecera y al menos una fila de datos.' });
          return;
        }

        const rawHeaders = (jsonData.shift() as any[]).map(h => String(h).trim());
        
        const headerMap: { [key: string]: number } = {};
        const foundHeaders = new Set<string>();
        const canonicalHeadersFound: string[] = [];

        rawHeaders.forEach((rawHeader, index) => {
            const canonicalHeader = findCanonicalHeader(rawHeader);
            if (canonicalHeader) {
                if (canonicalHeader === 'apellido1' && canonicalHeadersFound.includes('apellido1')) {
                    if (!headerMap['apellido2']) {
                        headerMap['apellido2'] = index;
                        foundHeaders.add('apellido2');
                        canonicalHeadersFound.push('apellido2');
                    }
                } else if (!headerMap[canonicalHeader]) {
                    headerMap[canonicalHeader] = index;
                    foundHeaders.add(canonicalHeader);
                    canonicalHeadersFound.push(canonicalHeader);
                }
            }
        });

        const essentialHeaders = ['nre', 'nombre', 'apellido1'];
        const missingEssentialHeaders = essentialHeaders.filter(h => !foundHeaders.has(h));

        if (missingEssentialHeaders.length > 0) {
          resolve({ data: [], error: `El archivo Excel debe contener las columnas: ${missingEssentialHeaders.join(', ')}. La cabecera encontrada fue: "${rawHeaders.join(', ')}"` });
          return;
        }
        
        const students: Student[] = [];
        (jsonData as any[][]).forEach((row, index) => {
          if (row.every(cell => String(cell).trim() === '')) return;

          const nreValue = String(row[headerMap['nre']] || '').trim();
          const student: Student = {
            id: `${nreValue || ''}-${index}`,
            nre: nreValue || 'N/A',
            expediente: String(row[headerMap['expediente']] || '').trim() || 'N/A',
            apellido1: String(row[headerMap['apellido1']] || '').trim() || 'N/A',
            apellido2: String(row[headerMap['apellido2']] || '').trim() || '',
            nombre: String(row[headerMap['nombre']] || '').trim() || 'N/A',
            grupo: String(row[headerMap['grupo']] || '').trim() || 'N/A',
            subgrupo: String(row[headerMap['subgrupo']] || '').trim() || 'N/A',
            fechaNacimiento: String(row[headerMap['fechaNacimiento']] || '').trim() || 'N/A',
            telefono: String(row[headerMap['telefono']] || '').trim() || 'N/A',
            emailPersonal: String(row[headerMap['emailPersonal']] || '').trim() || 'N/A',
            emailOficial: String(row[headerMap['emailOficial']] || '').trim() || 'N/A',
            fotoUrl: `https://picsum.photos/seed/${nreValue || index}/200`,
          };
          students.push(student);
        });

        resolve({ data: students, error: null });
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        resolve({ data: [], error: 'Hubo un error al procesar el archivo Excel. Asegúrate de que el formato sea correcto.' });
      }
    };

    reader.onerror = () => {
      resolve({ data: [], error: 'Error al leer el archivo.' });
    };

    reader.readAsArrayBuffer(file);
  });
};