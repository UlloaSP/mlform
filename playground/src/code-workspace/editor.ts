import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, isolateHistory } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import "./editor.css";

export const createCodeEditor = (
  parent: HTMLElement,
  code: string,
  onChange: (value: string) => void,
  onRun: () => void,
) => {
  const editor = new EditorView({
    parent,
    state: EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        history(),
        highlightActiveLine(),
        indentOnInput(),
        bracketMatching(),
        javascript({ typescript: true }),
        syntaxHighlighting(
          HighlightStyle.define([
            { tag: tags.keyword, color: "var(--mlf-color-accent)", fontWeight: "600" },
            { tag: [tags.string, tags.number, tags.bool], color: "var(--mlf-color-success)" },
            { tag: tags.comment, color: "var(--mlf-color-text-muted)" },
            { tag: tags.typeName, color: "var(--mlf-color-accent)", fontStyle: "italic" },
          ]),
        ),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.contentAttributes.of({
          "aria-label": "MLForm TypeScript code",
          spellcheck: "false",
          autocorrect: "off",
          autocapitalize: "off",
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChange(update.state.doc.toString());
        }),
      ],
    }),
  });
  const runShortcut = (event: KeyboardEvent) => {
    if (
      event.key !== "Enter" ||
      !(event.ctrlKey || event.metaKey) ||
      event.altKey ||
      event.isComposing
    )
      return;
    // Handle this app command before CodeMirror's Android Enter synthesis drops modifiers.
    event.preventDefault();
    event.stopPropagation();
    onRun();
  };
  editor.contentDOM.addEventListener("keydown", runShortcut, true);
  return {
    setCode(value: string) {
      editor.dispatch({
        ...(value !== editor.state.doc.toString()
          ? {
              changes: { from: 0, to: editor.state.doc.length, insert: value },
              annotations: isolateHistory.of("full"),
            }
          : {}),
        selection: { anchor: 0 },
        effects: EditorView.scrollIntoView(0, {
          x: "start",
          y: "start",
          xMargin: 16,
          yMargin: 16,
        }),
      });
    },
    focus: () => editor.focus(),
    destroy() {
      editor.contentDOM.removeEventListener("keydown", runShortcut, true);
      editor.destroy();
    },
  };
};
