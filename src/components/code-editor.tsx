import { useCallback } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { EditorView, Decoration, DecorationSet } from "@codemirror/view"
import { Extension, StateField, Range, Text } from "@codemirror/state"

// MPL syntax highlighting patterns
const mplPatterns = [
  {
    regex:
      /\b(waist|head|upper_body|upper_body2|lower_body|base|center|neck|shoulder_[rl]|arm_[rl]|arm_twist_[rl]|elbow_[rl]|wrist_[rl]|wrist_twist_[rl]|leg_[rl]|knee_[rl]|ankle_[rl]|toe_[rl]|thumb_[rl]|index_[rl]|middle_[rl]|ring_[rl]|pinky_[rl]|index_\d+_[rl]|thumb_\d+_[rl]|index_\d+_[rl]|middle_\d+_[rl]|ring_\d+_[rl]|pinky_\d+_[rl])\b/g,
    className: "cm-mpl-bone",
  },
  { regex: /@(pose|animation|main)\b/g, className: "cm-mpl-directive" },
  { regex: /\b(bend|turn|sway|move|reset)\b/g, className: "cm-mpl-action" },
  { regex: /\b(forward|backward|left|right|up|down)\b/g, className: "cm-mpl-direction" },
  { regex: /\b\d+(\.\d+)?\b/g, className: "cm-mpl-degrees" },
  { regex: /[{}]/g, className: "cm-mpl-brace" },
  { regex: /;/g, className: "cm-mpl-semicolon" },
]

// Create decorations for syntax highlighting
const createDecorations = (doc: Text): Range<Decoration>[] => {
  const decorations: Range<Decoration>[] = []
  const text = doc.toString()

  for (const { regex, className } of mplPatterns) {
    // Reset regex lastIndex to avoid issues with global regexes
    regex.lastIndex = 0
    let match
    while ((match = regex.exec(text)) !== null) {
      const from = match.index
      const to = match.index + match[0].length

      decorations.push(Decoration.mark({ class: className }).range(from, to))
    }
  }

  return decorations.sort((a, b) => a.from - b.from)
}

// State field for MPL syntax highlighting
const mplHighlightField = StateField.define<DecorationSet>({
  create(state) {
    return Decoration.set(createDecorations(state.doc))
  },
  update(decorations, transaction) {
    if (transaction.docChanged) {
      return Decoration.set(createDecorations(transaction.state.doc))
    }
    return decorations.map(transaction.changes)
  },
  provide: (f) => EditorView.decorations.from(f),
})

// Create MPL syntax highlighting extension
const mplSyntaxHighlighting = (): Extension => {
  return [
    mplHighlightField,
    EditorView.theme({
      ".cm-mpl-directive": {
        color: "#ff0080",
        fontWeight: "bold",
      },
      ".cm-mpl-bone": {
        color: "#0080ff",
        fontWeight: "600",
      },
      ".cm-mpl-action": {
        color: "#00bfff",
        fontWeight: "bold",
      },
      ".cm-mpl-direction": {
        color: "#ff6600",
        fontWeight: "bold",
      },
      ".cm-mpl-degrees": {
        color: "#00cc00",
        fontWeight: "bold",
      },
      ".cm-mpl-brace": {
        color: "#666666",
        fontWeight: "bold",
      },
      ".cm-mpl-semicolon": {
        color: "#666666",
        fontWeight: "bold",
      },
    }),
  ]
}

export default function CodeEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val)
    },
    [onChange]
  )

  const extensions = [
    mplSyntaxHighlighting(),
    EditorView.theme({
      ".cm-editor": {
        fontSize: "14px",
        fontFamily: "Geist Mono, monospace",
      },
      ".cm-content": {
        fontFamily: "Geist Mono, monospace",
        fontSize: "14px",
      },
    }),
  ]

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <CodeMirror
        value={value}
        onChange={handleChange}
        extensions={extensions}
        height="calc(100dvh - 140px)"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
          searchKeymap: false,
          tabSize: 4,
        }}
      />
    </div>
  )
}