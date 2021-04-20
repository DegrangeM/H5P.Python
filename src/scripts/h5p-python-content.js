/** Class representing the content */
export default class PythonContent {
  /**
   * @constructor
   *
   * @param {string} textField Parameters from editor.
   * @param {string} [username=world] Username.
   * @param {number} [random=-1] Random number.
   */

  // TODO !!!!!!!!!!!!!!!!!!!!!!!!!
  // eslint-disable-next-line no-unused-vars
  constructor(python, random = -1) {
    this.python = python;
    this.params = python.params;
    // this.callbacks = callbacks;

    this.randomApiKey = (parseInt(Math.random() * 58786559 + 1679616)).toString(36); // generate a string between 10000 and ZZZZZ
    this.setupApi();

    this.executeBeforeCode = this.getInjectedApi() + '\n' + CodeMirror.H5P.decode(this.params.advancedGrading.executeBeforeCode) + '\n';
    this.executeAfterCode = '\n' + 'h5p_api_loader_' + this.randomApiKey + '()\n' + CodeMirror.H5P.decode(this.params.advancedGrading.gradingCode);

    this.content = document.createElement('div');
    this.content.classList.add('h5p-python-content');
    this.content.style.maxHeight = this.params.editorOptions.maxHeight;

    this.createInstructions();

    this.createEditor();

    this.createOutput();

    this.python.trigger('resize');

    this.python.addButton('run', this.params.l10n.run, () => {
      this.run();
    });

    this.python.addButton('stop', this.params.l10n.stop, () => {
      this.stop();
    }, false);

    this.python.addButton('check-answer', this.params.l10n.checkAnswer, () => {
      this.checkAnswer();
    }, !this.params.requireRunBeforeCheck, {}, {});

    this.python.addButton('show-solution', this.params.l10n.showSolution, () => {
      this.showSolution();
    }, false, {}, {});

    this.python.addButton('hide-solution', this.params.l10n.hideSolution, () => {
      this.hideSolution();
    }, false, {}, {});

    this.addButton('try-again', this.params.l10n.tryAgain, () => {
      this.showButton('run');
      this.showButton('check-answer');
      this.hideButton('show-solution');
      this.hideButton('try-again');

      this.python.resetTask();

      this.python.trigger('resize');
    }, false, {}, {});


    // window.addEventListener('resize', () => {
    //   this.python.trigger('rezise');
    // });
    //TODO

    window.editor = this.editor;
    window.output = this.output;
    window.tutu = this;
  }

  /**
   * Function to run the python code
   */
  run() {

    this.shouldStop = false;

    this.python.hideButton('run');
    this.python.showButton('stop');

    this.output.setValue('');

    // todo : remove the true
    Sk.H5P.run(this.getCodeToRun(this.editor.getValue(), true), {
      output: x => {
        CodeMirror.H5P.appendText(this.output, x);
      },
      input: (p, resolve, reject) => {
        this.rejectInput = reject;
        p.output(p.prompt);
        let lastLine = this.output.lastLine();
        let lastCh = this.output.getLine(lastLine).length;
        this.output.setOption('readOnly', false);
        // mark the text as readonly to prevent deletion (even if we will prevent selection before the start of input, it would be
        // possible to delete with backspace ; this prevent this).
        let readOnlyMarker = this.output.markText({ line: 0, ch: 0 }, { line: lastLine, ch: lastCh }, { readOnly: true });
        let focusHandler = (() => {
          this.output.execCommand('goDocEnd');
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

            readOnlyMarker.clear();
            this.output.setOption('readOnly', true);

            this.output.getInputField().blur();

            resolve(this.output.getRange({ line: lastLine, ch: lastCh }, { line: lastLine2, ch: lastCh2 }));

          }
        });
      },
      onSuccess: () => {
        if (this.params.requireRunBeforeCheck) {
          this.python.showButton('check-answer');
        }
      },
      onError: error => {
        let errorText;
        if (this.shouldStop) {
          errorText = 'Execution interrupted';
        }
        else {
          if (error.traceback && this.params.enableAdvancedGrading) {
            // if code was added before, substract the length of added code to preserve line number error.
            let addedCodeLength = this.executeBeforeCode.split('\n').length - 1; // +1 because of \n
            error.traceback.forEach(v => {
              if (v.filename === '<stdin>.py') {
                v.lineno -= addedCodeLength;
              }
            });
          }

          errorText = error.toString();
          // Create stacktrace message
          if (error.traceback && error.traceback.length > 1) {
            errorText += Sk.H5P.getTraceBackFromError(error);
          }
        }
        CodeMirror.H5P.appendLines(this.output, errorText, 'CodeMirror-python-highlighted-error-line');
      },
      onFinally: () => {
        this.python.showButton('run');
        this.python.hideButton('stop');
      },
      shouldStop: () => this.shouldStop
    });
  }

  stop() {
    this.shouldStop = true;
    if (this.rejectInput !== undefined) {
      this.rejectInput('Interrupted execution');
    }
  }

  checkAnswer() {

    this.stop();
    this.shouldStop = false;
    this.python.hideButton('run');
    this.python.showButton('stop');

    this.python.hideButton('check-answer');

    if (this.params.behaviour.enableSolutionsButton && this.params.solutionCode) {
      this.python.showButton('show-solution');
    }

    if (this.params.behaviour.enableRetry) {
      this.python.showButton('try-again');
    }

    this.userOutput = '';
    this.solOutput = '';
    let runError = false;

    // todo solution empty ? Need to check !

    Sk.H5P.run(this.getCodeToRun(this.editor.getValue(), true), {
      output: x => {
        this.userOutput += x;
      },
      input: (p, resolve/*, reject*/) => {
        resolve(''); // todo
      },
      chain: true,
      shouldStop: () => this.shouldStop
    }).catch((error) => {
      runError = error;
    }).then(() => {
      return Sk.H5P.run(this.getCodeToRun(CodeMirror.H5P.decode(this.params.solutionCode)), {
        output: x => {
          solOutput += x;
        },
        input: (p, resolve/*, reject*/) => {
          resolve(''); // todo
        },
        shouldStop: () => this.shouldStop // todo
      });
    }).finally(() => {
      this.python.hideButton('stop');
      this.unloadApi();

      if (!this.params.advancedGrading) {
        if (!runError && this.userOutput === this.solOutput) {
          // this.output.setValue(this.userOutput);

          this.python.setFeedback('Success', 1, 1, 'scorebarlabel');

          this.python.answerGiven = true;
          this.python.score = 1;
          this.python.passed = true;
        }
        else {
          this.output.setValue('');
          let outputText = '';
          if (!runError) {
            // todo : localize
            outputText += 'Output Missmatch\n';
            outputText += '----------------\n';
            outputText += 'Expected output :\n';
            outputText += '----------------\n';
            outputText += this.solOutput;
            outputText += '----------------\n';
            outputText += 'Current output :\n';
            outputText += '----------------\n';
            outputText += this.userOutput;
          }
          else {
            outputText += 'Error while execution\n';
            outputText += '----------------\n';
            outputText += runError.toString();
          }

          CodeMirror.H5P.appendLines(this.output, outputText, 'CodeMirror-python-highlighted-error-line');

          this.python.setFeedback('Output Missmatch', 0, 1, 'scorebarlabel');

          this.python.answerGiven = true;
          this.python.score = 0;
          this.python.passed = false;
        }
      }
    });
  }

  showSolution() {
    this.codeBeforeSolution = this.editor.getValue();
    this.editor.setValue(CodeMirror.H5P.decode(this.params.solutionCode));
    this.editor.setOption('readOnly', true);
    this.python.hideButton('show-solution');
    this.python.showButton('hide-solution');
  }

  hideSolution() {
    this.editor.setValue(this.codeBeforeSolution);
    this.editor.setOption('readOnly', false);
    this.python.hideButton('hide-solution');
    this.python.showButton('show-solution');
  }

  createInstructions() {
    if (this.params.instructions !== '') {

      this.instructions = document.createElement('div');
      this.instructions.classList.add('h5p-python-instructions');

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

    }
  }

  /**
   * Append the codemirror that will act as editor
   */
  createEditor() {

    this.nodeEditor = document.createElement('div');
    this.nodeEditor.classList.add('h5p-python-codeEditor');
    this.content.appendChild(this.nodeEditor);

    let instructionHandle = document.createElement('div');
    instructionHandle.classList.add('h5p-python-instructions-handle');
    this.nodeEditor.appendChild(instructionHandle);

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



    this.editor = CodeMirror(this.nodeEditor, {
      value: CodeMirror.H5P.decode(this.params.startingCode || ''),
      keyMap: 'sublime',
      tabSize: this.params.editorOptions.tabSize,
      lineWrapping: true,
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
        },
        'Ctrl-Enter': () => {
          this.run();
        }
      }
    });

    if (this.params.editorOptions.highlightLines !== '') {
      CodeMirror.H5P.highlightLines(this.editor, this.params.editorOptions.highlightLines);
    } // TODO : BE CARREFULL WITH THIS AND CONTENT STATE AS THE LINES WILL NOT BE THE SAME !

    if (this.params.editorOptions.readOnlyLines !== '') {
      CodeMirror.H5P.readOnlyLines(this.editor, this.params.editorOptions.readOnlyLines);
    } // TODO : BE CARREFULL WITH THIS AND CONTENT STATE AS THE LINES WILL NOT BE THE SAME !

    if (this.params.requireRunBeforeCheck) {
      this.editor.on('changes', () => {
        this.python.hideButton('check-answer');
      });
    }

    this.editor.refresh(); // required to avoid bug where line number overlap code that might happen in some condition

    CodeMirror.H5P.setLanguage(this.editor, 'python');

    let outputHandle = document.createElement('div');
    outputHandle.classList.add('h5p-python-output-handle');
    this.nodeEditor.appendChild(outputHandle);

    outputHandle.addEventListener('click', () => {
      if (!this.nodeOutput.classList.contains('hidden')) {
        this.nodeOutput.classList.add('hidden');
        outputHandle.classList.add('hidden');
      }
      else {
        this.nodeOutput.classList.remove('hidden');
        outputHandle.classList.remove('hidden');
      }
    });


  }

  /**
   * Append the codemirror that will act as ouput
   * @param {HTMLElement} el  Html node to which the editor will be append.
   */
  createOutput() {

    this.nodeOutput = document.createElement('div');
    this.nodeOutput.classList.add('h5p-python-output');
    this.content.appendChild(this.nodeOutput);

    CodeMirror.H5P.loadTheme('nord');

    this.output = CodeMirror(this.nodeOutput, {
      value: '',
      theme: 'nord',
      readOnly: true,
      tabSize: 2,
      indentWithTabs: true,
      lineWrapping: true,
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

    this.output.on('focus', () => {
      this.output.setOption('styleActiveLine', {
        nonEmpty: true
      });
    });

    this.output.on('blur', () => {
      this.output.setOption('styleActiveLine', false);
    });

    this.output.refresh(); // required to avoid bug where line number overlap code that might happen in some condition

  }

  /**
   * It is possible to add code to run before / after user code.
   * This function return the code with the added code.
   * @param {string} code 
   * @param {boolean} [grading] Set to true to inject grading code
   */
  getCodeToRun(code, grading) {
    let codeToRun = code;
    if (this.params.enableAdvancedGrading && this.executeBeforeCode) {
      codeToRun = this.executeBeforeCode + codeToRun;
    }

    if (this.params.enableAdvancedGrading && grading === true) {
      codeToRun += this.executeAfterCode;
    }

    return codeToRun;
  }

  getInjectedApi() {
    let api = '';
    //api += 'class H5P :';
    //api += '  ';
    return api;
  }

  setupApi() {
    this.apis = {
      setScore: (score, passed, message) => {
        score = Sk.ffi.remapToJs(score);
        passed = Sk.ffi.remapToJs(passed);
        message = Sk.ffi.remapToJs(message);
        if (typeof score !== 'number') return;
        if (typeof passed !== 'undefined' && typeof passed !== 'boolean') return;
        if (typeof message !== 'undefined' && typeof message !== 'string') return;
        this.python.passed = typeof passed === 'boolean' ? passed : (score === this.python.maxScore);
        if (message !== undefined) {
          message = H5P.jQuery('div').text(message).html();
        }
        this.python.setFeedback(message, score, this.params.maxScore, 'scorebarlabel');
      },
      getOutput: () => {
        return Sk.ffi.remapToPy(this.userOutput);
      }
    };
    Sk.builtins['h5p_api_loader_' + this.randomApiKey] = () => {
      this.loadApi();
    };
  }

  // To allow multiple coding :
  // A fonction that accept an bool argument
  // The function need to return true each time in order for it to work
  // When it's the last check it tell it somehow ?



  loadApi() {
    Object.entries(this.apis).forEach(([n, v]) => {
      Sk.builtins['h5p_' + n] = v;
    });
  }

  unloadApi() {
    Object.entries(this.apis).forEach(([n]) => {
      delete Sk.builtins['h5p_' + n];
    });
  }

  /*
    Give abiltiy to check code for multiple cases ?
    
    → a function to display a feedback message
  
    → a function to set score to the user
  */

  /**
   * Return the DOM for this class.
   *
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

}
