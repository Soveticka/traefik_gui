export interface LineDiffResult {
  added: string[];
  removed: string[];
}

export function buildSimpleLineDiff(currentText: string, proposedText: string): LineDiffResult {
  const currentLines = new Set(currentText.split(/\r?\n/));
  const proposedLines = new Set(proposedText.split(/\r?\n/));

  const added: string[] = [];
  const removed: string[] = [];

  for (const line of proposedLines) {
    if (!currentLines.has(line)) {
      added.push(line);
    }
  }

  for (const line of currentLines) {
    if (!proposedLines.has(line)) {
      removed.push(line);
    }
  }

  return { added, removed };
}
