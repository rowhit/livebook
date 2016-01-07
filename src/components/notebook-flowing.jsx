let React = require('react');
let ReactDOM = require('react-dom');
var Uploader = require("./uploader.jsx");
let Editor = require('./notebook-flowing-editor');
let CodeCellV2 = require('./code-cell-v2');

let {htmlToIPy} = require("../ipython-converter.jsx");

let CodeOverlaysContainer = React.createClass({

  hideCodeEditorOnEsc(event) {
    if (event.which === 27) {
      this.props.store.dispatch({ type: "CLOSE_CODE_EDITOR", })
      this.restoreMediumEditorCursor();
    }
  },

  restoreMediumEditorCursor() {
    this.props.focusOnSelectedOverlay();
  },

  componentWillMount() {
    document.body.addEventListener("keydown", this.hideCodeEditorOnEsc);
  },

  componentWillUnmount() {
    document.body.removeEventListener("keydown", this.hideCodeEditorOnEsc);
  },

  componentDidMount() {
    this.props.handleOverlayMount();
  },

  doc() {
    return this.props.store.getState().doc
  },

  createCodeCell(id) {
    let doc    = this.doc();
    let code   = doc.codeMap[id];
    let result = doc.results[id];
    let plots  = doc.plots[id];
    let error  = doc.errors[id];
    return (
      <CodeCellV2
        key={id} index={id}
        result={result}
        code={code}
        error={error}
        plots={plots}
        store={this.props.store}
        handleEditorChange={this.handleEditorChange}
        focusEditorOnPlaceholder={this.props.focusEditorOnPlaceholder} />
    );
  },

  handleEditorChange(id, code) {
    this.props.store.dispatch({
      type: "CODE_EDITOR_CHANGE",
      data: { id, code, },
    });
    this.props.handleEditorChange(id, code);
  },

  renderCodeCells() {
    return this.doc().codeList.map(this.createCodeCell);
  },

  render() {
    return (
      <div data-livebook-overlays="">
        {this.renderCodeCells()}
      </div>
    );
  }
});

let NotebookV2 = React.createClass({

  doc() {
    return this.props.store.getState().doc
  },

  componentWillMount() {
  },

  componentWillUpdate() {
    let renderLandingPage = this.props.renderLandingPage;
    renderLandingPage && renderLandingPage();
  },

  handleEditorClick() {
    this.hideCodeEditor();
  },

  hideCodeEditor() {
    if (this.props.hideCodeEditor) {
      this.props.hideCodeEditor();
    }
  },

  handleEditorChange(id, code) {
    let codeList = this.doc().codeList
    let codeDelta = {}; codeDelta[id] = code;
    let data = { codeList, codeDelta }
    this.props.store.dispatch({ type: "CODE_DELTA", data })
  },

  handleOverlayMount() {
    this.forceUpdate();
  },

  render() {
    const path = window.location.pathname;
    const isFullOfStuff = path !== "/" && path.indexOf("/upload") !== 0;
    return (
      <div className="notebook">{ isFullOfStuff ? this.renderEditorAndOverlays() : "" }</div>
    );
  },

  renderEditorAndOverlays() {
    return (
      <div>
      <Editor
        store={this.props.store}
        onClick={this.handleEditorClick}
        assignForceUpdate={this.props.assignForceUpdate}
        assignFocusOnSelectedOverlay={this.props.assignFocusOnSelectedOverlay}
        assignFocusEditorOnPlaceholder={this.props.assignFocusEditorOnPlaceholder}/>
      <CodeOverlaysContainer
        store={this.props.store}
        handleOverlayMount={this.handleOverlayMount}
        handleEditorChange={this.handleEditorChange}
        focusOnSelectedOverlay={this.props.focusOnSelectedOverlay}
        focusEditorOnPlaceholder={this.props.focusEditorOnPlaceholder} />
      </div>
    );
  }
});

module.exports = NotebookV2;
