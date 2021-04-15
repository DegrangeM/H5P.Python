/** Class representing the content */
export default class PythonContent {
  /**
   * @constructor
   *
   * @param {string} textField Parameters from editor.
   * @param {string} [username=world] Username.
   * @param {number} [random=-1] Random number.
   */
  constructor(params, username = 'world', random = -1) {
    this.content = document.createElement('div');
    // this.content.innerHTML = `<p>${textField.replace('%username', username)} (${random})</p>`;
    this.createEditor(this.content, params);
  }

  /**
   * @param {HTMLElement} el  Html node to which the editor will be append.
   * @param {object} params Parameters from editor.
   */
  createEditor(el, params) {
    this.editor = CodeMirror(el, {
      value: CodeMirror.H5P.decode(params.startingCode || ''),
      keyMap: 'sublime',
      tabSize: params.tabSize,
      indentWithTabs: true,
      matchBrackets: true,
      matchTags: params.matchTags ? {
        bothTags: true
      } : false,
      foldGutter: params.foldGutter,
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
