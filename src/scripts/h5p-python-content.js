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
    this.content.style.maxHeight = this.params.maxHeight;


    this.createInstructions();

    this.createEditor();

    this.createOutput();

    this.python.trigger('resize');

    this.python.addButton('run', this.params.l10n.run, () => {
      this.output.setValue('');
      Sk.H5P.run(this.editor.getValue(), {
        output: x => {
          this.output.setValue(this.output.getValue() + x);
        },
        input: (p, resolve/*, reject*/) => {
          p.output(p.prompt);
          let lastLine = this.output.lastLine();
          let lastCh = this.output.getLine(lastLine).length;
          this.output.setOption('readOnly', false);
          // mark the text as readonly to prevent deletion (even if we will prevent selection before the start of input, it would be
          // possible to delete with backspace ; this prevent this).
          // it will be reverted when the promise will be resolved because it will replace the value of the editor
          this.output.markText({ line: 0, ch: 0 }, { line: lastLine, ch: lastCh }, { readOnly: true });
          let focusHandler = (() => {
            this.output.goDocEnd();
          });
          /**
           * Prevent the cursor from going before the start of the input zone in the output
           * @function
           */
          let cursorHandler = (() => {
            let cursorHead = this.output.getCursor('head');
            let cursorAnchor = this.output.getCursor('anchor');
            if (cursorHead.line < lastLine || (cursorHead.line === lastLine && cursorHead.ch < lastCh)) {
              cursorHead = { line: lastLine, ch: lastCh };
            }
            if (cursorAnchor.line < lastLine || (cursorAnchor.line === lastLine && cursorAnchor.ch < lastCh)) {
              cursorAnchor = { line: lastLine, ch: lastCh };
            }
            this.output.setSelection(cursorAnchor, cursorHead);
          });
          this.output.on('focus', focusHandler);
          this.output.on('cursorActivity', cursorHandler);
          this.output.focus();
          this.output.addKeyMap({
            'name': 'sendInput',
            'Enter': () => { // Shift-Enter is not blocked and allow to send multi-lines text !

              let lastLine2 = this.output.lastLine();
              let lastCh2 = this.output.getLine(lastLine2).length;

              p.output("\n");

              this.output.off('focus', focusHandler);
              this.output.off('cursorActivity', cursorHandler);
              this.output.removeKeyMap('sendInput');

              this.output.setOption('readOnly', true);
              this.output.getInputField().blur();

              resolve(this.output.getRange({ line: lastLine, ch: lastCh }, { line: lastLine2, ch: lastCh2 }));

            }
          });
        },
        onSuccess: () => {

        },
        onError: error => {
          console.log(error);
        }
      });
    });

    this.python.addButton('stop', this.params.l10n.run, () => {

    }, false);



    //TODO

    window.editor = this.editor;
    window.output = this.output;
    // editor.markText({line:2, ch:0}, {line:4,ch:0}, {readOnly:true});
  }


  createInstructions() {
    if (this.params.instructions !== '') {

      this.instructions = document.createElement('div');
      this.instructions.classList.add('h5p-python-instructions');
      this.instructions.style.maxHeight = this.params.maxHeight - 12; // 1 + 5 + 5 + 1 (border + padding + padding + border)

      CodeMirror.requireMode('python', () => {
        this.instructions.innerHTML = this.params.instructions.replace(
          /`(?:([^`<]+)|``([^`]+)``)`/g, // `XXX` or ```YYY``` ; XXX can't have html tag (so no new line)
          (m, inlineCode, blockCode) => {
            let code;
            if (inlineCode) {
              code = CodeMirror.H5P.decode(inlineCode);
            }
            else {
              // the code will be contaminated with the html of the WYSIWYG engine, we need to clean that. There is a new
              // line before/after ``` so there will be </div> at the start and <div> at the end, we need to remove them.
              let start = blockCode.indexOf('</div>') + '</div>'.length;
              let end = blockCode.lastIndexOf('<div>') - '<div>'.length - 1;
              // if they are not found (probably because there is no new line after/before ```) we don't highlight the code
              if (start === -1 || end === -1) return m;
              code = blockCode.substr(start, end).trim(); // trim will not remove wanted space at the start because code will be inside other div
              code = new DOMParser().parseFromString(code, 'text/html').documentElement.textContent; // we get the textContent to remove the unwated html
            }
            let codeNode = document.createElement('pre');
            codeNode.classList.add('cm-s-default');
            if (inlineCode) {
              codeNode.classList.add('h5p-python-instructions-inlineCode');
            }
            CodeMirror.runMode(code, 'python', codeNode);
            return codeNode.outerHTML;
          }
        );
      }, {
        path: function (mode) {
          return CodeMirror.H5P.getLibraryPath() + '/mode/' + mode + '/' + mode + '.js';
        }
      });

      this.content.appendChild(this.instructions);

      let instructionHandle = document.createElement('div');
      instructionHandle.classList.add('h5p-python-instructions-handle');
      this.content.appendChild(instructionHandle);

      instructionHandle.addEventListener('click', () => {
        if (!this.instructions.classList.contains('hidden')) {
          this.instructions.classList.add('hidden');
          instructionHandle.classList.add('hidden');
        }
        else {
          this.instructions.classList.remove('hidden');
          instructionHandle.classList.remove('hidden');
        }
      });

    }
  }

  /**
   * Append the codemirror that will act as editor
   */
  createEditor() {

    let nodeEditor = document.createElement('div');
    nodeEditor.classList.add('h5p-python-editor');
    this.content.appendChild(nodeEditor);

    this.editor = CodeMirror(nodeEditor, {
      value: CodeMirror.H5P.decode(this.params.startingCode || ''),
      keyMap: 'sublime',
      tabSize: this.params.editorOptions.tabSize,
      indentWithTabs: true,
      lineNumbers: true,
      matchBrackets: true,
      matchTags: this.params.editorOptions.matchTags ? {
        bothTags: true
      } : false,
      foldGutter: this.params.editorOptions.foldGutter,
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

    if (this.params.editorOptions.highlightLines !== '') {
      CodeMirror.H5P.highlightLines(this.editor, this.params.editorOptions.highlightLines);
    } // TODO : BE CARREFULL WITH THIS AND CONTENT STATE AS THE LINES WILL NOT BE THE SAME !

    this.editor.refresh(); // required to avoid bug where line number overlap code that might happen in some condition

    CodeMirror.H5P.setLanguage(this.editor, 'python');

  }

  /**
   * Append the codemirror that will act as ouput
   * @param {HTMLElement} el  Html node to which the editor will be append.
   */
  createOutput() {

    let outputHandle = document.createElement('div');
    outputHandle.classList.add('h5p-python-output-handle');
    this.content.appendChild(outputHandle);

    let nodeOuput = document.createElement('div');
    nodeOuput.classList.add('h5p-python-output');
    this.content.appendChild(nodeOuput);

    CodeMirror.H5P.loadTheme('nord');

    this.output = CodeMirror(nodeOuput, {
      value: '',
      theme: 'nord',
      readOnly: true,
      tabSize: 2,
      indentWithTabs: true,
      styleActiveLine: false,
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

    this.output.on('focus', x => {
      this.output.setOption('styleActiveLine', {
        nonEmpty: true
      });
    });

    this.output.on('blur', x => {
      this.output.setOption('styleActiveLine', false);
    });

    this.output.refresh(); // required to avoid bug where line number overlap code that might happen in some condition

    outputHandle.addEventListener('click', () => {
      if (!nodeOuput.classList.contains('hidden')) {
        nodeOuput.classList.add('hidden');
        outputHandle.classList.add('hidden');
      }
      else {
        nodeOuput.classList.remove('hidden');
        outputHandle.classList.remove('hidden');
      }
    });

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
