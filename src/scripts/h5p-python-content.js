/** Class representing the content */
export default class PythonContent {
  /**
   * @constructor
   *
   * @param {string} textField Parameters from editor.
   * @param {string} [username=world] Username.
   * @param {number} [random=-1] Random number.
   */
  constructor(python, random = -1) {
    this.python = python;
    this.params = python.params;
    // this.callbacks = callbacks;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-python-content');

    this.instructions = document.createElement('div');
    this.instructions.classList.add('h5p-python-instructions');
    this.instructions.innerHTML = this.params.instructions;
    this.content.appendChild(this.instructions);

    let nodeEditor = document.createElement('div');
    nodeEditor.classList.add('h5p-python-editor');
    this.content.appendChild(nodeEditor);
    this.createEditor(nodeEditor);
    
    let nodeOuput = document.createElement('div');
    this.content.appendChild(nodeOuput);
    nodeOuput.classList.add('h5p-python-output');
    this.createOutput(nodeOuput);

    this.python.trigger('resize');

    this.python.addButton('run', this.params.l10n.run, () => {
      this.output.setValue('');
      Sk.H5P.run(this.editor.getValue(), x => {
        this.output.setValue(this.output.getValue() + x);
      });
    });

    setTimeout(() => {
      this.resizeEditorAndOuput();
    }, 10);

    //TODO
    window.editor = this.editor;
    window.output = this.output;
    // editor.markText({line:2, ch:0}, {line:4,ch:0}, {readOnly:true});
  }

  /**
   * @param {HTMLElement} el  Html node to which the editor will be append.
   * @param {object} params Parameters from editor.
   */
  createEditor(el) {

    this.editor = CodeMirror(el, {
      value: CodeMirror.H5P.decode(this.params.startingCode || ''),
      keyMap: 'sublime',
      //tabSize: this.params.tabSize,
      tabSize: 2,
      indentWithTabs: true,
      lineNumbers: true,
      matchBrackets: true,
      // matchTags: this.params.matchTags ? {
      matchTags: true ? {
        bothTags: true
      } : false,
      // foldGutter: this.params.foldGutter,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      styleActiveLine: {
        nonEmpty: true
      },
      extraKeys: {
        'F11': function (cm) {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        },
        'Esc': function (cm) {
          if (cm.getOption('fullScreen')) {
            cm.setOption('fullScreen', false);
          }
        }
      }
    });

    this.editor.on('changes', () => {
      this.resizeEditorAndOuput();
    });

    /*
    TODO
    if (this.options.maxHeight !== 0) {
      $container.find('.CodeMirror, .CodeMirror-scroll').css('max-height', this.options.maxHeight);
    }
    
    if (this.options.highlightLines !== '') {
      CodeMirror.H5P.highlightLines(this.editor, this.options.highlightLines);
    }
    */


    this.editor.refresh(); // required to avoid bug where line number overlap code that might happen in some condition

    CodeMirror.H5P.setLanguage(this.editor, 'python');

  }

  createOutput(el) {

    CodeMirror.H5P.loadTheme('nord');

    this.output = CodeMirror(el, {
      value: '',
      theme: 'nord',
      tabSize: 2,
      indentWithTabs: true,
      styleActiveLine: {
        nonEmpty: true
      },
      extraKeys: {
        'F11': function (cm) {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        },
        'Esc': function (cm) {
          if (cm.getOption('fullScreen')) {
            cm.setOption('fullScreen', false);
          }
        }
      }
    });

    this.output.on('changes', () => {
      this.resizeEditorAndOuput();
    });

    this.output.refresh(); // required to avoid bug where line number overlap code that might happen in some condition

  }

  resizeEditorAndOuput() {
    return;
    this.editor.setSize(null, 'auto');
    this.output.setSize(null, 'auto');
    let height = Math.max(this.editor.getScrollInfo().height, this.output.getScrollInfo().height, this.instructions.clientHeight);
    this.editor.setSize(null, height);
    this.output.setSize(null, height);
    this.python.trigger('resize');
  }

  /**
   * Return the DOM for this class.
   *
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

}
