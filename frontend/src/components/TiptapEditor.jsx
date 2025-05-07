import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import 'prosemirror-view/style/prosemirror.css';
import { useEffect } from 'react';

const TiptapEditor = ({ content, onUpdate, setEditor }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        paragraph: true,
        code: true,
        codeBlock: true,
        blockquote: true,
        horizontalRule: true,
        hardBreak: true,
        history: true,
        dropcursor: true,
        gapcursor: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
        },
      }),
      TextStyle,
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      ListItem,
    ],
    content: content || '<p>Start typing...</p>',
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose custom-prose max-w-none p-4 min-h-[150px] bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
      },
    },
  });

  useEffect(() => {
    if (editor && setEditor) {
      setEditor(editor);
    }
  }, [editor, setEditor]);

  if (!editor) return null;

  const applyHeading = (level) => {
    editor
      .chain()
      .focus()
      .command(({ state, dispatch }) => {
        const { from, to } = state.selection;
        const $from = state.doc.resolve(from);
        const $to = state.doc.resolve(to);

        const blockStart = $from.start();
        const blockEnd = $to.end();

        const tr = state.tr;
        tr.setSelection(state.selection.constructor.create(state.doc, blockStart, blockEnd));

        editor.chain().focus().toggleHeading({ level }).run();

        if (dispatch) dispatch(tr);
        return true;
      })
      .run();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('bold')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('italic')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('strike')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Strike
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('code')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
        >
          Clear Marks
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().run()}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
        >
          Clear Nodes
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('paragraph')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Paragraph
        </button>
        <button
          type="button"
          onClick={() => applyHeading(1)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => applyHeading(2)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => applyHeading(3)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => applyHeading(4)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('heading', { level: 4 })
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          H4
        </button>
        <button
          type="button"
          onClick={() => applyHeading(5)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('heading', { level: 5 })
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          H5
        </button>
        <button
          type="button"
          onClick={() => applyHeading(6)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('heading', { level: 6 })
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          H6
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('bulletList')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('orderedList')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ordered List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('codeBlock')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Code Block
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('blockquote')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Blockquote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
        >
          Horizontal Rule
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
        >
          Hard Break
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter the URL:');
            if (url === null) return;
            if (url === '') {
              editor.chain().focus().unsetLink().run();
            } else {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('link')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
        >
          Redo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setColor('#958DF1').run()}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            editor.isActive('textStyle', { color: '#958DF1' })
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Purple
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;