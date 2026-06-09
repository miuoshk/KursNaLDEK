/**
 * Kopiuje tekst do schowka. Po async (server action) zwykłe
 * `navigator.clipboard.writeText` często pada w modalu — stąd fallback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fallback poniżej */
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Rozpoczyna zapis do schowka w trakcie kliknięcia (zanim skończy się fetch).
 * Działa w Chrome/Safari, gdy zwykły writeText pada po await.
 */
export async function copyTextAfterAsyncFetch(
  fetchText: () => Promise<string>,
): Promise<boolean> {
  if (
    typeof ClipboardItem !== "undefined" &&
    navigator.clipboard &&
    "write" in navigator.clipboard
  ) {
    try {
      const item = new ClipboardItem({
        "text/plain": fetchText().then(
          (value) => new Blob([value], { type: "text/plain" }),
        ),
      });
      await navigator.clipboard.write([item]);
      return true;
    } catch {
      /* fallback */
    }
  }

  try {
    const text = await fetchText();
    return copyTextToClipboard(text);
  } catch {
    return false;
  }
}
