/**
 * Utilities for robust date formatting without timezone shifts.
 */

/**
 * Formats a date value into 'YYYY-MM-DD' suitable for HTML <input type="date">.
 * Handles:
 * - Plain 'YYYY-MM-DD' strings (returns directly)
 * - ISO timestamps like '2026-05-29T22:00:00.000Z' (converts preserving local date)
 * - Date objects
 * 
 * @param {string|Date|null|undefined} dateVal 
 * @returns {string} 'YYYY-MM-DD' or ''
 */
export const formatDateForInput = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
        const ymdMatch = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (ymdMatch) {
            if (dateVal.includes('T')) {
                const d = new Date(dateVal);
                if (!isNaN(d.getTime())) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
            return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
        }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formats a date value into Italian 'DD/MM/YYYY' format for display and sharing.
 * 
 * @param {string|Date|null|undefined} dateVal 
 * @returns {string} 'DD/MM/YYYY' or ''
 */
export const formatDateItalian = (dateVal) => {
    if (!dateVal) return '';
    const ymd = formatDateForInput(dateVal);
    if (!ymd) return '';
    const [year, month, day] = ymd.split('-');
    return `${day}/${month}/${year}`;
};

/**
 * Formats a timestamp into Italian date and time 'DD/MM/YYYY HH:mm'.
 * 
 * @param {string|Date|null|undefined} timestampVal 
 * @returns {string} 'DD/MM/YYYY HH:mm' or ''
 */
export const formatDateTimeItalian = (timestampVal) => {
    if (!timestampVal) return '';
    const d = new Date(timestampVal);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};
