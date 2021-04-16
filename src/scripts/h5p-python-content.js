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

    this.instructions = document.createElement('div');
    this.instructions.classList.add('h5p-python-instructions');
    this.createInstructions();
    this.content.appendChild(this.instructions);

    let instructionHandle = document.createElement('div');
    instructionHandle.classList.add('h5p-python-instructions-handle');
    this.content.appendChild(instructionHandle);

    let nodeEditor = document.createElement('div');
    nodeEditor.classList.add('h5p-python-editor');
    this.content.appendChild(nodeEditor);
    this.createEditor(nodeEditor);

    let outputHandle = document.createElement('div');
    outputHandle.classList.add('h5p-python-output-handle');
    this.content.appendChild(outputHandle);

    let nodeOuput = document.createElement('div');
    this.content.appendChild(nodeOuput);
    nodeOuput.classList.add('h5p-python-output');
    this.createOutput(nodeOuput);

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





    this.python.trigger('resize');

    this.python.addButton('run', this.params.l10n.run, () => {
      this.output.setValue('');
      Sk.H5P.run(this.editor.getValue(), x => {
        this.output.setValue(this.output.getValue() + x);
      });
    });

    this.python.addButton('stop', this.params.l10n.run, () => {

    });

    //TODO

    window.editor = this.editor;
    window.output = this.output;
    // editor.markText({line:2, ch:0}, {line:4,ch:0}, {readOnly:true});
  }


  createInstructions() {
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
  }

  /**
   * Append the codemirror that will act as editor
   * @param {HTMLElement} el  Html node to which the editor will be append.
   */
  createEditor(el) {

    this.editor = CodeMirror(el, {
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

  /**
   * Append the codemirror that will act as ouput
   * @param {HTMLElement} el  Html node to which the editor will be append.
   */
  createOutput(el) {

    CodeMirror.H5P.loadTheme('nord');

    this.output = CodeMirror(el, {
      value: '',
      theme: 'nord',
      readOnly: true,
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

    this.output.refresh(); // required to avoid bug where line number overlap code that might happen in some condition

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
