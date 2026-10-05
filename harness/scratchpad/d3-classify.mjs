// D3 re-count classifier for COS-31 (intermediate/advanced reply-shape router).
//
// COS-18's original D3 classifier is not preserved in this repo -- unlike
// D1's, which it names as "kept at scratchpad/d1.mjs", no scratchpad
// directory or D3 script survived into version control. This is a
// reconstruction, not a byte-identical reproduction: it counts a
// judgeViolation as D3 when it demands the status-update/three-question
// (or three-beat) structure on a case that is not itself a status update --
// the same defect COS-18's quoted violations describe ("the guide's
// status-update format is the only structure defined", "not phrased with
// the three-question status update structure the guide requires").
//
// Because the exact pattern differs from COS-18's original, the absolute
// share numbers this produces do not match COS-18's published 16.2%/11.8%
// (intermediate) and 10.1%/8.3% (advanced) exactly -- applied to the same
// COS-18 baseline rows, it reads higher (see COS-31's task notes). What is
// trustworthy is the *direction*: the same classifier applied to both the
// before and after rows, unchanged, so a real drop in count reflects a real
// drop in how often the judge cites a missing shape definition.
export const NON_STATUS_CASES = new Set(['conv-explain-cache', 'agentic-read-report', 'conv-followup-drift'])
export const D3_PATTERN = /three.question|three.beat|status.?update (shape|structure|format|scaffold)|what i did.*did it work/i

export function d3Report (rows) {
  const byModel = {}
  for (const r of rows) {
    byModel[r.model] = byModel[r.model] || { totalViol: 0, d3Viol: 0, d3NonStatus: 0 }
    const violations = r.judgeViolations || []
    byModel[r.model].totalViol += violations.length
    for (const v of violations) {
      if (D3_PATTERN.test(v)) {
        byModel[r.model].d3Viol++
        if (NON_STATUS_CASES.has(r.caseId)) byModel[r.model].d3NonStatus++
      }
    }
  }
  return byModel
}
