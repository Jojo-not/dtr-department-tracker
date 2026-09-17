import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { richHtmlToPlainText, sanitizeRichHtml } from '../utils/richText'

const tools = [
  { command: 'bold', label: 'Bold', Icon: Bold },
  { command: 'italic', label: 'Italic', Icon: Italic },
  { command: 'underline', label: 'Underline', Icon: Underline },
  { separator: true },
  { command: 'insertUnorderedList', label: 'Bullets', Icon: List },
  { command: 'insertOrderedList', label: 'Numbering', Icon: ListOrdered },
  { separator: true },
  { command: 'justifyLeft', label: 'Align left', Icon: AlignLeft },
  { command: 'justifyCenter', label: 'Center', Icon: AlignCenter },
  { command: 'justifyRight', label: 'Align right', Icon: AlignRight },
  { command: 'justifyFull', label: 'Justify', Icon: AlignJustify },
  { separator: true },
  { command: 'undo', label: 'Undo', Icon: Undo2 },
  { command: 'redo', label: 'Redo', Icon: Redo2 },
  { command: 'removeFormat', label: 'Clear formatting', Icon: Eraser },
]

function ToolButton({ command, label, Icon, onCommand }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={event => {
        event.preventDefault()
        onCommand(command)
      }}
      className="grid size-8 place-items-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
    >
      <Icon size={16} />
    </button>
  )
}

export default function RichTextEditor({ value, onChange, disabled = false }) {
  const editorRef = useRef(null)
  const selectionRef = useRef(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!editorRef.current || focused) return
    const next = richHtmlToPlainText(value || '').trim() ? sanitizeRichHtml(value) : ''
    if (editorRef.current.innerHTML !== next) editorRef.current.innerHTML = next
  }, [value, focused])


  function saveSelection() {
    const selection = window.getSelection?.()
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return
    const range = selection.getRangeAt(0)
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
    }
  }

  function restoreSelection() {
    const selection = window.getSelection?.()
    if (!selection || !selectionRef.current) return
    selection.removeAllRanges()
    selection.addRange(selectionRef.current)
  }

  function emitChange() {
    if (!editorRef.current) return
    const rawHtml = editorRef.current.innerHTML
    const text = richHtmlToPlainText(rawHtml)
    const html = text.trim() ? sanitizeRichHtml(rawHtml) : ''
    onChange({ html, text })
  }

  function runCommand(command, argument = null) {
    if (disabled) return
    editorRef.current?.focus()
    restoreSelection()
    document.execCommand(command, false, argument)
    saveSelection()
    emitChange()
  }

  function setBlock(event) {
    const tag = event.target.value
    editorRef.current?.focus()
    restoreSelection()
    document.execCommand('formatBlock', false, tag)
    saveSelection()
    emitChange()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-inner transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
      <div className="border-b border-slate-300 bg-white">
        <div className="flex h-8 items-end gap-5 px-4 text-xs font-medium text-slate-500">
          <span className="border-b-2 border-blue-600 pb-2 text-blue-700">Home</span>
          <span className="pb-2">Insert</span>
          <span className="pb-2">Layout</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 px-3 py-2">
          <select
            defaultValue="P"
            onChange={setBlock}
            disabled={disabled}
            className="mr-1 h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
            aria-label="Paragraph style"
          >
            <option value="P">Normal</option>
            <option value="H1">Title</option>
            <option value="H2">Heading 1</option>
            <option value="H3">Heading 2</option>
          </select>

          {tools.map((tool, index) => tool.separator
            ? <span key={`separator-${index}`} className="mx-1 h-6 w-px bg-slate-200" />
            : <ToolButton key={tool.command} {...tool} onCommand={runCommand} />
          )}
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto bg-slate-200/70 p-4 sm:p-6">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Accomplishment editor"
          data-placeholder="Type your accomplishments here. You can use bullets, numbering, bold, italics, underline, and alignment like a Word document."
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            emitChange()
          }}
          onInput={() => { saveSelection(); emitChange() }}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          className="rich-word-page mx-auto min-h-[300px] w-full max-w-[760px] bg-white px-8 py-8 text-[15px] leading-7 text-slate-900 shadow-lg outline-none sm:px-12"
        />
      </div>

      <div className="flex items-center justify-between border-t border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-400">
        <span>Word-style editor</span>
        <span>Formatting is saved with your accomplishment</span>
      </div>
    </div>
  )
}
