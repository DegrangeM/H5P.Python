/** Class representing the content */
export default class PythonContent {
  /**
   * @constructor
   *
   * @param {string} textField Parameters from editor.
   * @param {string} [username=world] Username.
   * @param {number} [random=-1] Random number.
   */
  constructor(params, callbacks, username = 'world', random = -1) {
    this.params = params;
    this.callbacks = callbacks;
  
    this.content = document.createElement('div');
    // this.content.innerHTML = `<p>${textField.replace('%username', username)} (${random})</p>`;
    this.createEditor(this.content, params);
  }

  /**
   * @param {HTMLElement} el  Html node to which the editor will be append.
   * @param {object} params Parameters from editor.
   */
  createEditor(el) {
    const that = this;

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

    this.editor.on('changes', function () {
      that.callbacks.resize();
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
  
    this.callbacks.resize();
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
