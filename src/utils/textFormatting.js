/**
 * Formats text with custom markdown-like syntax.
 * 
 * Supported syntax:
 * *phrase* -> Bold
 * ~phrase~ -> Italic
 * $phrase$ -> Red text (using var(--color-primary))
 * #phrase# -> Larger text (1.5em)
 * 
 * @param {string} text - The input text to format.
 * @returns {string} - The HTML string with formatting applied.
 */
export const formatHeaderText = (text) => {
    if (!text) return '';

    // Escape HTML special characters to prevent XSS
    let formattedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Apply formatting rules
    // Note: We use non-greedy matching (.*?) to handle multiple occurrences correctly

    // Bold: *phrase* -> <strong>phrase</strong>
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // Italic: ~phrase~ -> <em>phrase</em>
    formattedText = formattedText.replace(/~(.*?)~/g, '<em>$1</em>');

    // Red: $phrase$ -> <span style="color: var(--color-primary)">phrase</span>
    formattedText = formattedText.replace(/\$(.*?)\$/g, '<span style="color: var(--color-primary)">$1</span>');

    // Larger: #phrase# -> <span style="font-size: 1.5em">phrase</span>
    formattedText = formattedText.replace(/#(.*?)#/g, '<span style="font-size: 1.5em">$1</span>');

    // Convert newlines to <br>
    formattedText = formattedText.replace(/\n/g, '<br />');

    return formattedText;
};
