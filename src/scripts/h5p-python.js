// Import required classes
import PythonContent from './h5p-python-content';

/**
 * Class holding a full HelloWorld example.
 *
 * - Extends H5P.Question which offers functions for setting the DOM
 * - Implements the question type contract necessary for reporting and for
 *   making the content type usable in compound content types like Question Set
 *   Cpm. https://h5p.org/documentation/developers/contracts
 * - Implements getCurrentState to allow continuing a user's previous session
 * - Uses a separate content class to organitze files
 */
export default class Python extends H5P.Question {
  /**
   * @constructor
   *
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('python'); // CSS class selector for content's iframe: h5p-hello-world

    this.params = params;
    this.contentId = contentId;
    this.extras = extras;

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */

    // Make sure all variables are set
    this.params = extend({
      editorOptions: {
        readOnlyLines: ''
      },
      behaviour: {
        enableSolutionsButton: true,
        enableRetry: true
      },
      l10n: {
        checkAnswer: 'Check answer',
        showSolution: 'Show solution',
        tryAgain: 'Retry'
      }
    }, this.params);

    // this.previousState now holds the saved content state of the previous session
    this.previousState = this.extras.previousState || {};

    this.answerGiven = false;
    this.score = 0;
    this.maxScore = 1;
    this.passed = false;

    /**
     * Register the DOM elements with H5P.Question
     */
    this.registerDomElements = () => {
      this.content = new PythonContent(
        this, // Try to retrieve user name from host system,
        this.previousState.random // previous session state
      );

      // Register content with H5P.Question
      this.setContent(this.content.getDOM());

      window.toto = this;

      // Register Buttons
      this.addButtons();

      /*
       * H5P.Question also offers some more functions that could be used.
       * Consult https://github.com/h5p/h5p-question for details
       */
    };

    /**
     * Add all the buttons that shall be passed to H5P.Question.
     */
    this.addButtons = () => {

      // Retry button

    };

    /**
     * Check if result has been submitted or input has been given.
     *
     * @return {boolean} True, if answer was given.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswerGiven = () => this.answerGiven; // TODO: Return your value here

    /**
     * Get latest score.
     *
     * @return {number} latest score.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => this.score; // TODO: Return real score here

    /**
     * Get maximum possible score.
     *
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => this.maxScore; // TODO: Return real maximum score here

    /**
     * Show solutions.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
      // TODO: Implement showing the solutions

      this.trigger('resize');
    };

    /**
     * Reset task.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
     */
    this.resetTask = () => {
      this.content.editor.setValue(CodeMirror.H5P.decode(this.params.startingCode || ''));
      this.content.output.setValue('');
      // TODO : setup highlight, readonly, etc.
    };

    /**
     * Get xAPI data.
     *
     * @return {object} XAPI statement.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     */
    this.getXAPIData = () => ({
      statement: this.getXAPIAnswerEvent().data.statement
    });

    /**
     * Build xAPI answer event.
     *
     * @return {H5P.XAPIEvent} XAPI answer event.
     */
    this.getXAPIAnswerEvent = () => {
      const xAPIEvent = this.createXAPIEvent('answered');

      xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this,
        true, this.isPassed());

      /*
       * TODO: Add other properties here as required, e.g. xAPIEvent.data.statement.result.response
       * https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#245-result
       */

      return xAPIEvent;
    };

    /**
     * Create an xAPI event for Dictation.
     *
     * @param {string} verb Short id of the verb we want to trigger.
     * @return {H5P.XAPIEvent} Event template.
     */
    this.createXAPIEvent = (verb) => {
      const xAPIEvent = this.createXAPIEventTemplate(verb);
      extend(
        xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
        this.getxAPIDefinition());
      return xAPIEvent;
    };

    /**
     * Get the xAPI definition for the xAPI object.
     *
     * @return {object} XAPI definition.
     */
    this.getxAPIDefinition = () => {
      const definition = {};
      definition.name = {'en-US': this.getTitle()};
      definition.description = {'en-US': this.getDescription()};

      // TODO: Set IRI as required for your verb, cmp. http://xapi.vocab.pub/verbs/#
      definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';

      // TODO: Set as required, cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#interaction-types
      definition.interactionType = 'other';

      /*
       * TODO: Add other object properties as required, e.g. definition.correctResponsesPattern
       * cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#244-object
       */

      return definition;
    };

    /**
     * Determine whether the task has been passed by the user.
     *
     * @return {boolean} True if user passed or task is not scored.
     */
    this.isPassed = () => this.passed;

    /**
     * Get tasks title.
     *
     * @return {string} Title.
     */
    this.getTitle = () => {
      let raw;
      if (this.extras.metadata) {
        raw = this.extras.metadata.title;
      }
      raw = raw || Python.DEFAULT_DESCRIPTION;

      // H5P Core function: createTitle
      return H5P.createTitle(raw);
    };

    /**
     * Get tasks description.
     *
     * @return {string} Description.
     */
    // TODO: Have a field for a task description in the editor if you need one.
    this.getDescription = () => this.params.taskDescription || Python.DEFAULT_DESCRIPTION;

    /**
     * Extend an array just like JQuery's extend.
     *
     * @param {object} arguments Objects to be merged.
     * @return {object} Merged objects.
     */
    function extend() {
      for (let i = 1; i < arguments.length; i++) {
        for (let key in arguments[i]) {
          // eslint-disable-next-line no-prototype-builtins
          if (arguments[i].hasOwnProperty(key)) {
            if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] === 'object') {
              extend(arguments[0][key], arguments[i][key]);
            }
            else {
              arguments[0][key] = arguments[i][key];
            }
          }
        }
      }
      return arguments[0];
    }

    /**
     * Answer call to return the current state.
     *
     * @return {object} Current state.
     */
    this.getCurrentState = () => {
      /*
       * TODO: Return any data object that will indicate the state that should
       * be loaded on start, here it's a random number
       */
      return {
        random: Math.random(100)
      };
    };
  }
}

/** @constant {string} */
Python.DEFAULT_DESCRIPTION = 'Python';
